const express=require('express');
const mongoose=require('mongoose');
const session=require('express-session');
const cookieParser=require('cookie-parser');
const MongoStore=require('connect-mongo')(session);
const formidable=require('express-formidable');
const bcrypt=require('bcrypt');
const cors=require('cors');
const confirmMail=require('../mail/confirmMail.js');



const router=express.Router();
mongoose.connect('mongodb://localhost:27017/game', {useNewUrlParser: true}).then(()=>{
    console.log('connected')
}).catch((error)=>{
    console.error(error)
});

router.use(cookieParser());
router.use(formidable());
router.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}));

router.use(session({
    secret: 'very-secret',
    resave: true,
    saveUninitialized: true,
    maxAge: 7200000,
    httpOnly: false,
    cookie: {maxAge: 7200000, httpOnly: false},
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        maxAge: 7200000
    })
}))

const User=require('../schemas/UserSchema');

router.post('/signup',(req, res)=>{
    const saltRounds=10;
    if(req.fields.email && req.fields.password && req.fields.userName){
        bcrypt.hash(req.fields.password, saltRounds, function(error, hash) {
            if(error){
                res.status(409)
                res.send({message: 'password failed'})
                return
            }
            const createdUser=new User({
                email: req.fields.email,
                password: hash,
                name: req.fields.userName
            })
            createdUser.save().then(data=>{
                return res.send({message: 'user created'})
            }).catch(error=>{
                res.status(409);
                return res.send({message: 'user already exists'})
            })
        });
    }else{
        res.status(409)
        return res.send({message: 'form not valid'})
    }

})

router.get('/testmail',(req, res)=>{
    //confirmMail();
    console.log(process.env)
    res.send(process.env.PORT);
});



router.post('/login',(req, res)=>{
    console.log(req.fields)
    if(req.fields.email && req.fields.password){
        User.findOne({email: req.fields.email},(error, data)=>{
            if(error){
                res.status(409)
                return res.send({message: 'something went wrong'})
                
            }
            if(!data){
                res.status(404)
                return res.send({message: 'no user with this combination of email and password found'})
            }
            bcrypt.compare(req.fields.password, data.password, (error, pwdMatches)=>{
                if(pwdMatches){
                    /* SUCCES */
                    req.session.email=req.fields.email;
                    const mySession=req.session;
                    console.log(mySession);
                    const {name, email, scores}=data;
                    return res.send({user: {name, email, scores}, message: 'succesfully logged in'})
                }
                console.log(error)
                res.status(404)
                return res.send({message: 'no user with this combination of email and password found'})
                
            })

        })
    }else{
        res.status(409)
        res.send({message: 'fields missing'})
    }
})

router.get('/logout',(req, res)=>{
    req.session.destroy((error)=>{
        if(error){
            return res.send({message: 'could not delete your session... logged you out anyway'})
        }
        return res.send({message: 'succesfully logged out'})
    })
})

router.get('/user/:name',(req, res)=>{
    if(req.params.name){
        const dbData=User.find({name: req.params.name},(error, data)=>{
            if(error){
                console.error(error)
                res.send(error)
            } 
            console.log(data)
            res.send(data)
        })
    }else{
        res.send('something went wrong')
    }

})

router.post('/setscore',(req, res)=>{
    if(req.session.email && User.schema.obj.scores.hasOwnProperty(req.fields.game)){
        const updateObject={[`scores.${req.fields.game}`]: req.fields.score}
        User.update({email: req.session.email}, {$set: updateObject},(error, data)=>{
            if(error){
                res.status(404);
                return res.send({message: 'user not found'})
            }
            return res.send({message: 'succes', session: req.session, userData: data})
        })
    }
    else{
        res.status(400);
        return res.send({message: 'you dont seem to have an active session please login'})
    }

})


/* every 20 seconds update the scoreStats object with new data from the database */
let scoreStats={
    word: {},
    reaction: {},
    number: {}
};
(function createRandomNum(){
    setTimeout(()=>{
        getScoreStats()
        createRandomNum()
    },20000);
})()


function getScoreStats(){
    let highScoreObject={
        word: {},
        reaction: {},
        number: {}
    };

    User.find({},'scores').then(data=>{
        for(let i=0;i<data.length;i++){
            const scores=data[i].scores;

            /* count the score distribution  in the database*/
            highScoreObject.word[scores.word]=(highScoreObject.word[scores.word] || 0) + 1;

            highScoreObject.reaction[scores.reaction]=(highScoreObject.reaction[scores.reaction] || 0) + 1;

            highScoreObject.number[scores.number]=(highScoreObject.number[scores.number] || 0) + 1;
        }
        scoreStats=highScoreObject
    })

}






router.get('/getstats/:game',(req, res)=>{
    const game=req.params.game;
    switch(game){
        case 'word':
            res.send(scoreStats.word)
            break
        case 'number':
            res.send(scoreStats.number)
            break
        case 'reaction':
            res.send(scoreStats.reaction)
            break
        default:
            res.status(404)
            res.send({message: 'unknown parameter... try one of these word, number or reaction'})
    }
})

module.exports=router;