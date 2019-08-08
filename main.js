const express=require('express');
const api=require('./api/api.js');



const app=express();

app.use('/api',api)


app.listen(5000,()=>{
    console.log("running on port 5000")
})