const nodemailer = require('nodemailer');


// async..await is not allowed in global scope, must use a wrapper
async function transporter(targetmail, uID) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    //let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport

    let transporter = nodemailer.createTransport({
        pool: true,
        host: 'smtp.ionos.de',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.MAIL_ADRESS, // generated ethereal user
            pass: process.env.MAIL_PASSWORD // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });



    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'monkey@baizuo.online', // sender address
        to: targetmail, // list of receivers
        subject: 'Hello ✔', // Subject line
        text: `follow this link to confirm your mail http://localhost:5000/api/confirm/${uID}/${targetmail}`, // plain text body
        html: `<b>follow this link to confirm your mail <a href=http://localhost:5000/api/confirm/${uID}/${targetmail}>http://localhost:5000/api/confirm/${uID}/${targetmail}</a></b>` // html body
    });

    console.log('Message sent: %s', info.messageId);


}


module.exports = transporter;