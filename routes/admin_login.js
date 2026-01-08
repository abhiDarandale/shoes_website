var express = require("express");
var exe = require("./../connection");
var router = express.Router();

router.get("/",function(req,res){
    res.render("admin/login.ejs");
});

module.exports = router;