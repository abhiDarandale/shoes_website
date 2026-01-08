var mysql = require("mysql");
var util = require("util");

var conn = mysql.createConnection({
    host:"bhj9uqrhbzbml3n6ueqi-mysql.services.clever-cloud.com",
    user:"ucse1drlfm4yzoc9",
    password:"Rib9MnOuD28YKYGdDNYC",
    database:"bhj9uqrhbzbml3n6ueqi"
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;
