const express=require('express');
const mongoose=require('mongoose');
const session=require('express-session');
const cookieParser=require('cookie-parser');
const MongoStore=require('connect-mongo')(session);
const formidable=require('express-formidable');
const bcrypt=require('bcrypt');
const cors=require('cors');
const mailService=require('../mail/mailService.js');
const uniqid=require('uniqid');
const emails=require('../mail/emails.js');


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
                name: req.fields.userName,
                active: false,
                email_confirm_key: uniqid(),
                send_again_key: uniqid()
            })
            createdUser.save().then(data=>{
                mailService(data.email, emails.emailConfirmMail(data.email, data.email_confirm_key));
                return res.send({message: `confirmation mail sent to ${data.email}`, sendAgainPath: `confirmagain/${data.send_again_key}`})
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

router.get('/confirmagain/:key',(req, res)=>{
    User.findOne({send_again_key: req.params.key},(error, data)=>{
        if(error){
            res.status(409)
            return res.send({message: 'something went wrong'})
        }
        if(!data){
            res.status(404)
            return res.send({message: 'please log in to send another key'})
        }
        mailService(data.email, emails.emailConfirmMail(data.email, data.email_confirm_key));
        return res.send({message: `email confirm key sent to: ${data.email}`})
    })
})


router.get('/confirm/:key/:email',(req, res)=>{
    User.findOne({email_confirm_key: req.params.key, email: req.params.email},(error, data)=>{
        if(error){
            res.status(409)
            return res.send({message: 'something went wrong'})
        }
        if(!data){
            res.status(404)
            return res.send({message: 'key does not seem to match this email'})
        }
        data.active=true;
        data.save(error=>{
            if(error){
                res.status(409)
                return res.send({message: 'something went wrong'})
            }
            return res.send('succesfully confirmed your email you can now log in <a href=http://localhost:3000/login>http://localhost:3000/login</a>');
        })
    })
})



router.post('/createnewpassword',(req, res)=>{
    if(req.fields.email && req.fields.key && req.fields.password){
        const saltRounds=10;
        User.findOne({email: req.fields.email}
            ).then((data)=>{
                if(!data) return res.send({message: "no user with this email found"}, 404);
                if(data.reset_password_key===req.fields.key){
                    bcrypt.hash(req.fields.password, saltRounds, function(error, hash) {
                        if(error){
                            return res.send({message: 'password failed'}, 409)
                        }
                        data.password=hash;
                        data.reset_password_key=uniqid();
                        data.save(error=>{
                            if(error){
                                return res.send({message: 'something went wrong'},500)
                            }
                            return res.send(`password succesfully reset`);
                        })
                    });
                    
                }else{
                    res.send({message: 'please request a new key to reset your password'})
                }                 
            })
    }else{
        res.send({message: 'your request seems to be missing some fields'})
    } 
    
    
})

router.post('/resetpassword',(req, res)=>{
    const email=req.fields.email;
    User.findOne({email: email}
    ).then((data)=>{
        if(!data) return res.send({message: "no user with this email found"}, 404);
        data.reset_password_key=uniqid();
        data.save(error=>{
            if(error){
                res.status(500)
                return res.send({message: 'something went wrong'})
            }
            mailService(data.email, emails.resetPasswordMail(data.email, data.reset_password_key));
            return res.send(`sent password reset link to ${data.email}`);
        })
    })
})



router.post('/login',(req, res)=>{
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
                    if(data.active){
                        req.session.email=req.fields.email;
                        const mySession=req.session;
                        console.log(mySession);
                        const {name, email, scores}=data;
                        return res.send({user: {name, email, scores}, message: 'succesfully logged in'})
                    }else{
                        mailService(data.email, emails.emailConfirmMail(data.email, data.email_confirm_key));
                        res.status(403)
                        return res.send({message: `email confirm key sent to: ${data.email}`})
                    }
                    
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
        User.find({name: req.params.name},(error, data)=>{
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

router.get('/getuser',(req, res)=>{
    const session=req.session.email;
    if(session){
        User.find({email: session},(error, data)=>{
            if(error) return res.send({message: "user not found"},404);

            if(data){
                const {name, email, scores}=data;
                return res.send({user: {name, email, scores}, message: 'succes'})
            }
        })
    }
    res.send({message: "please log in"},403);
})






router.get('/getstats/:game',(req, res)=>{
    req.session.touch();
    console.dir(req.session.id)
    console.dir(req.cookies)
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