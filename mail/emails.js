const emailConfirmMail=function(targetmail, uID){
    return {text: `follow this link to confirm your mail http://localhost:5000/api/confirm/${uID}/${targetmail}`,
    html: `<b>follow this link to confirm your mail <a href=http://localhost:5000/api/confirm/${uID}/${targetmail}>http://localhost:5000/api/confirm/${uID}/${targetmail}</a></b>`};
}

const resetPasswordMail=function(targetmail, uID){
    return {text: `follow this link to reset your password http://localhost:5000/api/createnewpassword/${uID}/${targetmail}`,
    html: `<b>follow this link to reset your password <a href=http://localhost:5000/api/createnewpassword/${uID}/${targetmail}>http://localhost:5000/api/createnewpassword/${uID}/${targetmail}</a></b>`};
}

module.exports={
    emailConfirmMail,
    resetPasswordMail
}