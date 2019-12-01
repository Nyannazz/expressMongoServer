const emailConfirmMail=function(targetmail, uID){
    return {
        subject: "confirm email",
        text: `follow this link to confirm your mail http://localhost:5000/api/confirm/${uID}/${targetmail}`,
        html: `<b>follow this link to confirm your mail <a href=http://localhost:5000/api/confirm/${uID}/${targetmail}>http://localhost:5000/api/confirm/${uID}/${targetmail}</a></b>`
    };
}

const resetPasswordMail=function(targetmail, uID){
    return {
        subject: "reset password",
        text: `follow this link to reset your password http://localhost:3000/account/createnewpassword/${uID}/${targetmail}`,
        html: `<b>follow this link to reset your password <a href=http://localhost:3000/account/createnewpassword/${uID}/${targetmail}>create new password</a></b>`
    };
}



module.exports={
    emailConfirmMail,
    resetPasswordMail
}