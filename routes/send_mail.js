const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "dhadgekaran8@gmail.com",
    pass: "apgj jlmc cyrj zfyq",
  },
});

async function sendMail(to_mail, subject, message){

    const info = await transporter.sendMail({
    from: '"Karan Dhadge" <dhadgekaran8@gmail.com>',
    to: to_mail ,
    subject: subject ,
    text: message , 
    html: message , 
  });
  console.log(info)
}


module.exports = sendMail;