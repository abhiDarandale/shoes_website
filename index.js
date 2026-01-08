var express = require("express");
var bodyparser = require("body-parser");
var session = require("express-session");
var upload = require("express-fileupload");
cookies = require('cookie-parser');
var admin_route = require("./routes/admin_route");
var user_route = require("./routes/user_route");
var admin_login = require("./routes/admin_login");

var app = express();
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public/"));
app.use(upload());
app.use(cookies());
app.use(session({
    secret:"abcd",
    resave:true,
    saveUninitialized:true
}));

app.use("/admin_login",admin_login);
app.use("/admin",admin_route);
app.use("/",user_route);

app.listen(1000);