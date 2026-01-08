var express = require("express");
var exe = require("./../connection");
var url = require("url");
var sendMail = require("./send_mail")
var router = express.Router();

router.get("/",async function(req,res){
    var sliders = await exe(`SELECT * FROM slider_images`);
    var treanding_products = await exe(`SELECT * FROM products WHERE product_is_trending = 'yes' LIMIT 6 `);
    var styles = await exe(`SELECT * FROM product_styles LIMIT 4`);
    var promo_banner = await exe(`SELECT * FROM promotional_banner LIMIT 1`);
    var types = await exe(`SELECT * FROM product_types LIMIT 4`);
    var high_disc_products = await exe("SELECT * FROM products ORDER BY apply_discount_percent DESC LIMIT 0,6");
    var packet = {sliders,treanding_products,styles,promo_banner,types,high_disc_products};
    res.render("user/home.ejs",packet);
});

router.get("/product_list",async function(req,res){
    var url_data = url.parse(req.url,true).query;
    if(url_data.cat)
    {
        if(url_data.cat == "Men")
        {
            sql = `SELECT * FROM products WHERE product_for = 'Male'`;
        }
        if(url_data.cat == 'Women')
        {
            var sql = `SELECT * FROM products WHERE product_for = 'Female'`;
        }
        if(url_data.cat == 'Kid_Boys')
        {
            var sql = `SELECT * FROM products WHERE product_for = 'Kids' AND product_kid_type = 'Boys'`;
        }
        if(url_data.cat == 'Kid_Girls')
        {
            var sql = `SELECT * FROM products WHERE product_for = 'Kids' AND product_kid_type = 'Girls'`;
        }
 
    }
    
    var products = await exe(sql);
    var packet = {products};
    res.render("user/product_list.ejs",packet);
});

router.get("/product_details/:id",async function(req,res){
    var id = req.params.id;
    var sql = `SELECT * FROM products WHERE product_id = ? `;
    var info = await exe(sql,[id]);

    var is_login = (req.session.user_id) ? true : false ;

    var packet = {info,is_login}
    res.render("user/product_details.ejs",packet);
});

router.get("/buy_now/:product_id",async function(req,res){
    var url_data = url.parse(req.url,true).query;
    var id = req.params.product_id;
    var sql = `SELECT * FROM products WHERE product_id = ? `;
    var info = await exe(sql,[id]);
    var packet = {info,url_data};
    res.render("user/buy_now.ejs",packet);
});

router.post("/send_otp_mail",async function(req,res){
    var otp = Math.floor(1000 + Math.random() * 9000);
    var subject = `FashionHub OTP VERIFICATION : ${otp}`;
    var message = `Your One Time Password (OTP) For FashionHub VERIFICATION : <h1>${otp}</h1> `;
    sendMail(req.body.email, subject, message);
    req.session.otp = otp;
    req.session.email = req.body.email;
    res.send();
});

async function transfer_data(req, res) {
  var carts = req.cookies.cart;
  if (!carts || !carts.length) {
    return;
  }

  var customer_id = req.session.user_id;
  if (!customer_id) {
    return;
  }

  for (var i = 0; i < carts.length; i++) {
    var product_id = carts[i].product_id;
    var quantity = carts[i].quantity;
    var size = carts[i].size;

    var checkSql = "SELECT cart_id FROM carts WHERE customer_id = ? AND product_id = ? AND size = ?";
    var exists = await exe(checkSql, [customer_id, product_id, size]);

    if (exists.length === 0) {
      var insertSql = "INSERT INTO carts(customer_id, product_id, quantity, size) VALUES(?, ?, ?, ?)";
      await exe(insertSql, [customer_id, product_id, quantity, size]);
    }
  }

  res.clearCookie("cart");
}

router.post("/verify_otp",async function(req,res){

    if(req.session.otp == req.body.otp)
    {
        var email = req.session.email;
        var sql = `SELECT * FROM customers WHERE customer_email = '${email}'`;
        var check_customer = await exe(sql);
        if(check_customer.length > 0)
        {
            req.session.user_id = check_customer[0].customer_id;
            await transfer_data(req,res);
            res.send({"status":"success","new_user":false});
        }
        else
        {
            var sql2 = `INSERT INTO customers(customer_email) VALUES('${email}')`;
            var result = await exe(sql2);
            req.session.user_id = result.insertId;
            await transfer_data(req,res);
            res.send({"status":"success","new_user":true});
        }
    }
    else
    {
            res.send({"status":"false"});
    }
});

function check_login(req,res,next)
{
    if(req.session.user_id = 1)
        next();
    else
        res.redirect("/");
}

router.post("/checkout",check_login, async function(req,res){
    var d = req.body;
    var customer_id = req.session.user_id;
    var country = 'India';
    
    var product_info = await exe(`SELECT * FROM PRODUCTS WHERE product_id = '${d.product_id}'`);
    var total_amount = product_info[0].product_price * d.product_quantity ;
    var payment_method = 'online';
    var payment_status = 'pending';
    var order_date =  new Date().toISOString().slice(0.10);
    var order_status = 'placed'

    var sql1 = `UPDATE customers SET customer_name = ?, customer_mobile = ? WHERE customer_id = ?`;
    var c_information = await exe(sql1, [d.full_name, d.mobile, customer_id]);

    var sql = `INSERT INTO orders(customer_id,fullname, mobile, country, state, city, area, pincode, 
                total_amount, payment_method, payment_status, order_date, order_status ) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    var result = await exe(sql,[customer_id, d.full_name, d.mobile, country, d.state, d.city, d.address, d.pincode,
                 total_amount, payment_method, payment_status, order_date, order_status]);

    var order_id = result.insertId;
    var product_id = d.product_id;
    var product_name = product_info[0].product_name;
    var product_size = d.product_size;
    var product_market_price = product_info[0].product_market_price;
    var product_discount = product_info[0].apply_discount_percent;
    var product_price = product_info[0].product_price;
    var product_quantity = d.product_quantity;
    var product_total = product_price * product_quantity;

    var sql2 = `INSERT INTO order_products(order_id, customer_id, product_id, product_name, 
                product_size, product_market_price, product_discount, product_price, product_qty, product_total)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    var result2 = await exe(sql2,[order_id, customer_id, product_id, product_name, product_size, product_market_price,
                        product_discount, product_price, product_quantity, product_total]);
    res.redirect("/accept_payment/"+order_id);
});

router.get("/accept_payment/:order_id",async function(req,res){
    var id =req.params.order_id;
    var sql =`SELECT * FROM orders WHERE order_id = '${id}'`;
    var order_info = await exe(sql);
    var packet = {order_info}
    res.render("user/accept_payment.ejs",packet);
});

router.post("/payment_success/:order_id",async function(req,res){

    var id = req.params.order_id;
    var sql = `UPDATE orders SET payment_status = 'paid' , transaction_id = '${req.body.razorpay_payment_id}'
                WHERE order_id = '${id}'`;
    var result = await exe(sql)
    res.redirect("/my_orders");
});

router.get("/add_to_cart/:id", async function (req, res, next) {
  try {
    var product_id = req.params.id;
    var q = url.parse(req.url, true).query;
    var quantity = q.quantity;
    var size = q.size;

    if (req.session.user_id) {
      var customer_id = req.session.user_id;

      var checkSql = "SELECT 1 FROM carts WHERE customer_id = ? AND product_id = ? AND size = ?";
      var rows = await exe(checkSql, [customer_id, product_id, size]);

      if (rows.length === 0) {
        var insertSql = "INSERT INTO carts(customer_id, product_id, quantity, size) VALUES(?, ?, ?, ?)";
        await exe(insertSql, [customer_id, product_id, quantity, size]);

        return res.send(
          "<script>alert('Item added to cart successfully'); window.location='/product_details/" +
            product_id +
            "';</script>"
        );
      } else {
        return res.send(
          "<script>alert('Item is already in your cart'); window.location='/product_details/" +
            product_id +
            "';</script>"
        );
      }
    }

    var cart = req.cookies.cart;
    var obj = {
      product_id: product_id,
      size: size,
      quantity: quantity,
    };

    if (!cart) {
      var data = [obj];
      res.cookie("cart", data);
      return res.send(
        "<script>alert('Item added to cart successfully'); window.location='/product_details/" +
          product_id +
          "';</script>"
      );
    } else {
      var i = 0;
      var already = false;

      while (i < cart.length) {
        if (cart[i].product_id == product_id && cart[i].size == size) {
          already = true;
          return res.send(
            "<script>alert('Item is already in your cart'); window.location='/product_details/" +
              product_id +
              "';</script>"
          );
        }
        i++;
      }

      if (!already) {
        cart.push(obj);
        res.cookie("cart", cart);
        return res.send(
          "<script>alert('Item added to cart successfully'); window.location='/product_details/" +
            product_id +
            "';</script>"
        );
      }
    }
  } catch (err) {
    return next(err);
  }
});

router.get("/cart",async function(req,res){

    if(req.session.user_id)
    {
        var customer_id = req.session.user_id;
        //login
        var sql = `SELECT * FROM carts WHERE customer_id = ?`;
        var carts = await exe(sql,[customer_id]);
        // console.log(carts);
    }
    else
    {
        //Not Login
        if(req.cookies.cart)
            var carts = req.cookies.cart;
        else
            var carts = [];
    }

    var cart_data = [];
    for(var i=0; i<carts.length; i++)
    {
        var sql = `SELECT * FROM products WHERE product_id = ?`
        var pinfo = await exe(sql,[carts[i].product_id]);
        var obj = {
            "cart_id":(carts[i].cart_id) ? carts[i].cart_id:i,
            "product_id":pinfo[0].product_id,
            "product_name":pinfo[0].product_name,
            "product_image":pinfo[0].product_main_image,
            "product_price":pinfo[0].product_price,
            "color":pinfo[0].product_color,
            "product_discount":pinfo[0].apply_discount_percent,
            "quantity":carts[i].quantity,
            "size":carts[i].size
        };
        cart_data.push(obj);
    }
    var is_login =  (req.session.user_id) ? true:false;
    var packet = {cart_data,is_login}
    // console.log(packet);
    res.render("user/cart.ejs",packet);
});

router.get("/delete_from_cart/:id",async function(req,res){

    var id = req.params.id;
    if(req.session.user_id)
    {
        var sql = `DELETE FROM carts WHERE cart_id = ?`;
        var result = await exe(sql,[id]);
        // console.log("deleting Data When Login");
        res.redirect("/cart");
    }
    else
    {
        var carts =  req.cookies.cart;
        carts.splice(id,1);
        res.cookie("cart",carts);
        res.redirect("/cart");
    }
});

router.get("/login", async function (req, res) {
  var sql = `SELECT * FROM customers`;
  var cinfo = await exe(sql);
  res.render("user/login.ejs", { cinfo });
});

router.post("/login_session", function (req, res) {
  const user_id = req.body.customer_id;
  if (!user_id) return res.json({ status: "false" });

  req.session.user_id = user_id;
  res.json({ status: "ok" });
});

router.post("/place_order",async function(req,res){

  var customer_id = req.session.user_id;
  var fullname = req.body.full_name;
  var mobile = req.body.mobile;
  var country = 'India';
  var state = req.body.state;
  var city = req.body.city;
  var area = req.body.address;
  var pincode = req.body.pincode;

  var sql = `SELECT SUM(quantity*product_price) as total_amount FROM carts,products WHERE carts.product_id = products.product_id`;
  var user_cart = await exe(sql);
  var total_amount = user_cart[0].total_amount;
  var payment_method = "online";
  var payment_status = "pending";
  var order_date = new Date().toISOString().slice(0,10);
  var order_status = "placed";

  var sql = `INSERT INTO orders(customer_id,fullname , mobile, country, state, city, area, pincode, 
                total_amount, payment_method, payment_status, order_date, order_status ) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  var result = await exe(sql,[customer_id, fullname, mobile, country, state, city, area, pincode,
                 total_amount, payment_method, payment_status, order_date, order_status]);
  var order_id = result.insertId;
  var sql = `SELECT * FROM carts, products WHERE carts.product_id = products.product_id`;
  var carts = await exe(sql);
  for(var i=0; i<carts.length; i++)
  {
    var product_id = carts[i].product_id;
    var product_name = carts[i].product_name;
    var product_size = carts[i].size;
    var product_market_price = carts[i].product_market_price;
    var product_discount = carts[i].apply_discount_percent;
    var product_price = carts[i].product_price;
    var product_qty = carts[i].quantity;
    var product_total = carts[i].quantity * carts[i].product_price;

    var sql = `INSERT INTO order_products(order_id, customer_id, product_id, product_name, product_size,
                    product_market_price, product_discount, product_price, product_qty, product_total)
                    VALUES('${order_id}','${customer_id}','${product_id}','${product_name}','${product_size}',
                    '${product_market_price}','${product_discount}','${product_price}','${product_qty}','${product_total}')`;
    var result2 = await exe(sql);
    console.log(result2);
  }

  var sql = `DELETE FROM carts WHERE customer_id = '${customer_id}'`;
  var result3 = await exe(sql);
  // res.send(carts)

  res.redirect("/accept_payment/"+order_id);

});

router.get("/my_orders",check_login, async function(req,res){
  var sql = `SELECT * FROM orders WHERE customer_id = '${req.session.user_id}'`;
  var orders = await exe(sql);
  var packet = {orders}
  console.log(orders);
  res.render("user/my_orders.ejs",packet);
});

module.exports = router;