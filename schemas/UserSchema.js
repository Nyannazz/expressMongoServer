const mongoose=require('mongoose');
const validator=require('validator')

const UserSchema=new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: value=>{
            return validator.isEmail(value)
        }
    },
    password: {
        type: String,
        required: true,

    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    scores: {
        word: Number,
        reaction: Number,
        number: Number
    }
})

module.exports=mongoose.model('User',UserSchema);