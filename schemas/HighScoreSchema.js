const mongoose=require('mongoose');

const HighScore=new mongoose.Schema({
    wordGame: {
        type: Object,
        default: {}
    },
    numGame: {
        type: Object,
        default: {}
    },
    reactionGame: {
        type: Object,
        default: {}
    }
})

module.exports=mongoose.model('HighScore',HighScore);