var express = require("express");
var exe = require("./../connection");
var router = express.Router();

router.get("/",function(req,res){
    res.render("admin/home.ejs");
});

router.get("/product_brands",async function(req,res){
    var sql = `SELECT * FROM product_brands`;
    var brands = await exe(sql);
    res.render("admin/product_brands.ejs",{brands});
});

router.post("/save_product_brands",async function(req,res){
   try {
        var d = req.body;
        var sql = `INSERT INTO product_brands (product_brand_name) VALUES (?)`;
        var result = await exe(sql,[d.product_brand_name]);
        res.redirect("/admin/product_brands");
   } catch (err){
        console.log("Do Not Repate Brand Name");
        res.redirect("/admin/product_brands");
   }
});

router.get("/edit_product_brand/:id",async function(req,res){
    var id = req.params.id;
    var sql = `SELECT * FROM product_brands WHERE product_brand_id = ?`;
    var result = await exe(sql,[id]);
    res.render("admin/update_product_brand.ejs",{result});
});

router.post("/update_product_brand",async function(req,res){
    var d = req.body;
    var sql = `UPDATE product_brands SET product_brand_name = ? , status = ? WHERE product_brand_id = ?`;
    var result = await exe(sql,[d.product_brand_name,d.status,d.id]);
    res.redirect("/admin/product_brands");
});

router.get("/delete_product_brand/:id",async function(req,res){
    var id = req.params.id;
    var sql = `DELETE FROM product_brands WHERE product_brand_id = ? `;
    var result = await exe(sql,[id]);
    res.redirect("/admin/product_brands");
});

router.get("/product_styles",async function(req,res){
    var sql = `SELECT * FROM product_styles`;
    var style = await exe(sql);
    res.render("admin/product_styles.ejs",{style});
});

router.post("/save_product_style",async function(req,res){
    if(req.files)
        {

        var file_name = new Date().getTime()+req.files.product_style_image.name;
        req.files.product_style_image.mv("public/styles/"+file_name);
    }
    else
    {
        var file_name = " ";
    }
    
    var d = req.body;
    var sql = `INSERT INTO product_styles (product_style_name, product_style_image) VALUES (?, ?) `;
    var result = await exe(sql,[d.product_style_name, file_name]);
    res.redirect("/admin/product_styles");
});

router.get("/edit_product_style/:id",async function(req,res){
    var sql =`SELECT * FROM product_styles WHERE product_style_id = ? `;
    var style = await exe(sql,[req.params.id]);
    res.render("admin/update_product_style.ejs",{style});
});

router.post("/update_product_style",async function(req,res){
    var d = req.body;
    var sql = `UPDATE product_styles SET product_style_name = ?, status = ? WHERE product_style_id = ? `;
    var result = await exe(sql,[d.product_style_name, d.status, d.id]);

    if(req.files){
        var file_name = new Date().getTime()+req.files.product_style_image.name;
        req.files.product_style_image.mv("public/styles/"+file_name);
        var sql2 = `UPDATE product_styles SET product_style_image = ? WHERE product_style_id = ? `;
        var result2 = await exe(sql2,[file_name, d.id]);
    }
    res.redirect("/admin/product_styles");
});

router.get("/delete_product_style/:id",async function(req,res){
    var sql = `DELETE FROM product_styles WHERE product_style_id = ? `;
    var result = await exe(sql,[req.params.id]);
    res.redirect("/admin/product_styles");
});

router.get("/product_types",async function(req,res){
    var sql = `SELECT * FROM product_types`;
    var types = await exe(sql);
    res.render("admin/product_types.ejs",{types})
});

router.post("/save_product_type",async function(req,res){
    if(req.files){
        var file_name = new Date().getTime()+req.files.product_type_image.name;
        req.files.product_type_image.mv("public/types/"+file_name);
    }else{
        var file_name = " ";
    }

    var d = req.body
    var sql = `INSERT INTO product_types (product_type_name, product_type_image ) VALUES (?, ?)`;
    var result = await exe(sql,[d.product_type_name, file_name]);
    res.redirect("/admin/product_types");
});

router.get("/edit_product_type/:id",async function(req,res){
    var sql = `SELECT * FROM product_types WHERE product_type_id = ?`;
    var type = await exe(sql,[req.params.id]);
    res.render("admin/update_product_type.ejs",{type});
});

router.post("/update_product_type",async function(req,res){
    var d = req.body;
    var sql = `UPDATE product_types SET product_type_name = ? , status = ? WHERE product_type_id = ? `;
    var result = await exe(sql,[d.product_type_name, d.status, d.id]);

    if(req.files){
        var file_name = new Date().getTime()+req.files.product_type_image.name;
        req.files.product_type_image.mv("public/types/"+file_name);
        var sql2 = `UPDATE product_types SET product_type_image = ? WHERE product_type_id = ? `;
        var result2 = await exe(sql2,[file_name, d.id]);
    }
    res.redirect("/admin/product_types"); 
});

router.get("/delete_product_type/:id",async function(req,res){
    var sql = `DELETE FROM product_types WHERE product_type_id = ? `;
    var result = await exe(sql,[req.params.id]);
    res.redirect("/admin/product_types");
});

router.get("/add_product",async function(req,res){
    var brands = await exe(`SELECT * FROM product_brands`); 
    var styles = await exe(`SELECT * FROM product_styles`); 
    var types = await exe(`SELECT * FROM product_types`); 
    res.render("admin/add_product.ejs",{brands, styles, types});
});

router.post("/save_products",async function(req,res){
    if(req.files){
        var file_name = new Date().getTime()+req.files.product_main_image.name;
        req.files.product_main_image.mv("public/products/"+file_name);
    }else
    {
        var file_name = "";
    }

    var d = req.body;

    var apply_discount_percent = Math.round(100 - (Number(d.product_price) * 100 / Number(d.product_market_price)));

    var sql = `INSERT INTO products (product_name, product_market_price, product_price, product_is_trending, product_brand_id,
                        product_style_id, product_for, product_type_id , product_stock, product_color, product_description,
                        product_main_image, apply_discount_percent, product_kid_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    var result = await exe(sql,[d.product_name, d.product_market_price, d.product_price, d.product_is_trending, d.product_brand_id,
                              d.product_style_id, d.product_for, d.product_type_id, d.product_stock, d.product_color,
                              d.product_description, file_name, apply_discount_percent, d.product_kid_type]);
    res.redirect("/admin/add_product");
});

router.get("/product_list",async function(req,res){

    var sql = `SELECT * FROM products, product_brands, product_styles, product_types WHERE 
                products.product_brand_id = product_brands.product_brand_id AND
                products.product_style_id = product_styles.product_style_id AND
                products.product_type_id = product_types.product_type_id`;
    var product = await exe(sql);
    res.render("admin/product_list.ejs",{product});
});

router.get("/edit_product/:id",async function(req,res){
    
    var product = await exe( `SELECT * FROM products WHERE product_id = ? `,[req.params.id]);
    var brands = await exe(`SELECT * FROM product_brands`); 
    var styles = await exe(`SELECT * FROM product_styles`); 
    var types = await exe(`SELECT * FROM product_types`);
    res.render("admin/update_product.ejs",{product, brands, styles, types});
});

router.post("/update_product",async function(req,res){

    var d = req.body
    var apply_discount_percent = Math.round(100 - (Number(d.product_price) * 100 / Number(d.product_market_price)));
    
    var sql = `UPDATE products SET product_name = ?,product_market_price = ?,product_price = ?,product_is_trending = ?,
                product_brand_id = ?,product_style_id = ?,product_for = ? ,product_type_id = ?,product_stock = ?,product_color = ?,
                product_description = ?,apply_discount_percent = ? , product_kid_type = ? WHERE product_id = ? `;
    var result = await exe(sql,[d.product_name, d.product_market_price, d.product_price, d.product_is_trending,
                                d.product_brand_id, d.product_style_id, d.product_for, d.product_type_id, 
                                d.product_stock, d.product_color, d.product_description,  apply_discount_percent, d.product_kid_type, d.id]);

    if(req.files)
    {
        var file_name = new Date().getTime()+req.files.product_main_image.name;
        req.files.product_main_image.mv("public/products/"+file_name);
        var sql2 = `UPDATE products SET product_main_image = ? WHERE product_id = ? `;
        var result2 = await exe(sql2,[file_name, d.id]);
    }else
    {
        var file_name = "";
    }
    res.redirect("/admin/product_list");
});

router.get("/delete_product/:id", async function(req,res){
    var sql = `DELETE FROM products WHERE product_id = ? `;
    var result = await exe(sql,[req.params.id]);
    res.redirect("/admin/product_list");
});

router.get("/promotional_banners", async function(req,res){
    var sql = `SELECT * FROM promotional_banner`;
    var promo_banner = await exe(sql);
    res.render("admin/promotional_banner.ejs",{promo_banner});
});

router.post("/save_promotional_banner", async function(req,res){

    var d  = req.body;
    var file_name = "";
    if(req.files)
    {
        var file_name = new Date().getTime()+req.files.banner_image.name;
        req.files.banner_image.mv("public/promotional_banner/"+file_name);
    }

    var sql = `INSERT INTO promotional_banner(banner_title, banner_description, banner_button_text, banner_button_link, banner_image)
                VALUES(?, ?, ?, ?, ?)`;
    var result = await exe(sql,[d.banner_title, d.banner_description, d.banner_button_text, d.banner_button_link, file_name]);
    res.redirect("/admin/promotional_banners");
});

router.get("/edit_promo_banner/:id",async function(req,res){
    var sql = `SELECT * FROM promotional_banner WHERE banner_id = ?`;
    var banner = await exe(sql,[req.params.id]);
    res.render("admin/update_promotional_banner.ejs",{banner});
});

router.post("/update_promotional_banner", async function(req,res){
    var d = req.body;
    var sql = `UPDATE promotional_banner SET banner_title = ?, banner_description = ?, banner_button_text = ?, banner_button_link = ? WHERE banner_id = ?`;
    var result = await exe(sql,[d.banner_title, d.banner_description, d.banner_button_text, d.banner_button_link, d.id]);

    if(req.files)
    {
        var file_name = new Date().getTime()+req.files.banner_image.name;
        req.files.banner_image.mv("public/promotional_banner/"+file_name);
        var sql2 = `UPDATE promotional_banner SET banner_image = ? WHERE banner_id = ?`;
        var result2 = await exe(sql2,[file_name, d.id]);
    }
        else
    {
        var file_name = "";
    }
        res.redirect("/admin/promotional_banners");
});

router.get("/delete_promo_banner/:id",async function(req,res){
    var sql = `DELETE FROM promotional_banner WHERE banner_id = ?`;
    var result = await exe(sql,[req.params.id]);
    res.redirect("/admin/promotional_banners");
});

router.get("/slider_images", async function(req, res) {
    var sql = "SELECT * FROM slider_images";
    var slider = await exe(sql);
    res.render("admin/slider_images.ejs",{slider});
});

router.post("/save_slider_images",async function(req,res){
    var d = req.body;
    if(req.files)
    {
        var file_name = new Date().getTime()+req.files.slider_image.name;
        req.files.slider_image.mv("public/slider/"+file_name);
    }
        else
    {
        var file_name = "";
    }

    var sql = `INSERT INTO slider_images (slider_title, slider_description, slider_button_text,
                                        slider_button_link, slider_image) VALUES(?, ?, ?, ?, ?)`;
    var result = await exe(sql,[d.slider_title, d.slider_description, d.slider_button_text, d.slider_button_link, file_name]);
    res.redirect("/admin/slider_images");
});

router.get("/edit_slider_images/:id", async function(req,res){
    var sql = "SELECT * FROM slider_images WHERE slider_id = ?";
    var slider = await exe(sql,[req.params.id]);
    res.render("admin/update_slider_images.ejs",{slider});
});

router.post("/update_slider_images",async function(req,res){
    var d = req.body;
    var sql = `UPDATE slider_images SET slider_title = ?, slider_description = ?, slider_button_text = ?, slider_button_link = ? WHERE slider_id = ?`;
    var result = await exe(sql, [d.slider_title, d.slider_description, d.slider_button_text, d.slider_button_link, d.slider_id]);

    if (req.files) {
        var file_name = new Date().getTime()+req.files.slider_image.name;
        req.files.slider_image.mv("public/slider/"+file_name);

        var sql2 = `UPDATE slider_images SET slider_image = ? WHERE slider_id = ?`;
        var result2 = await exe(sql2, [file_name, d.slider_id]);
    } else {
        var file_name = "";
    }

    res.redirect("/admin/slider_images");
});

router.get("/delete_slider_images/:id",async function(req,res){
    var sql = `DELETE FROM slider_images WHERE slider_id = ?`;
    var result = await exe(sql,[req.params.id]);
    res.redirect("/admin/slider_images");
});

module.exports = router;