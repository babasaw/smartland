const akun = require('express').Router();
const JOI = require('joi');
const jwt = require('jsonwebtoken');
const LoginRequired = require('../helper/loginRequired');
var fs = require('fs');
var path = require('path');
const bcrypt = require('bcryptjs');

const USER_AUTH = require('../config').USER_AUTH_SECRET;


const AkunAccount = require("../models/akunModel")
var multer  = require('multer');

var storage = multer.diskStorage({
   destination: function (req, file, cb) {
     cb(null, 'uploads')
   },
   filename: function (req, file, cb) {
      var fname = file.fieldname + '-' + Date.now() + path.extname(file.originalname);

      cb(null, fname);
   }
 })
  

var upload = multer({ storage : storage });

//sementara untuk tambah agent
akun.post('/register', function(req, res, next){
    const Schema = JOI.object().keys({
        username: JOI.string().trim().required(),
        password: JOI.string().min(8),
        email: JOI.string().email().required(),
        handphone: JOI.string().trim().required()
     });


     JOI.validate(req.body, Schema).then(result => {
        next();
     }).catch(error => {
        res.status(400).send({
           success: false,
           error: error.message
        });
     });
  }, async function(req, res, next){
    
     try{
        var account = await AkunAccount.getByUsername(req.body.username);
        if(account != null){
          
           //throw new Error('username_used');
           return res.status(400).send({ success: false, error: 'username_used' });
        }
        next()
      
     }catch(error){
        console.log(error);
        return res.status(400).send({ success: false, error: error.message });
     }
    }, async function(req, res, next){
    
        try{
           var account = await AkunAccount.getByHandphone(req.body.handphone);
           if(account != null){
              
              //throw new Error('username_used');
              return res.status(400).send({ success: false, error: 'handphone_used' });
           }
           next()
        }catch(error){
           console.log(error);
           return res.status(400).send({ success: false, error: error.message });
        }
       },async function(req, res, next){
    
        try{
           var account = await AkunAccount.getByEmail(req.body.email);
           if(account != null){
              
              //throw new Error('username_used');
              return res.status(400).send({ success: false, error: 'email_used' });
           }
        }catch(error){
           console.log(error);
           return res.status(400).send({ success: false, error: error.message });
        }
       
        result = await AkunAccount.insert(req.body.username, req.body.password, req.body.email,  req.body.handphone);
        res.send({
            success: true,
         });
       }
    
    );

    akun.post('/login', function(req, res, next){
      const Schema = JOI.object().keys({
         username: JOI.string().required(),
         password: JOI.string().required()
      });
   
      JOI.validate(req.body, Schema).then(result => {
         next();
      }).catch(error => {
         res.status(400).send({
            success: false,
            error: error.message
         });
      });
   }, async function(req, res, next){
      try{
         var account = await AkunAccount.getByUsername(req.body.username);
      }catch(error){
         return res.status(400).send({ success: false, error: error.message });
      }
   
      if(!account){
         return res.status(400).send({ success: false, error: 'username_not_valid'})
      }
   
      if(!bcrypt.compareSync(req.body.password, account.password)){
         return res.status(400).send({ success: false, error: 'passowrd_not_match' });
      }
   
      var payload = { uid: account.uid_akun };
      var accessToken = jwt.sign(payload, USER_AUTH, { expiresIn: '2 hours' });
      res.send({
         success: true,
         accestoken: accessToken
      });
   });

   akun.post('/uploadphoto', upload.single('image'), async function(req, res, next){  
      try{

         var username = req.body.username;
        var img= fs.readFileSync("./"+req.file.path);
        var haha = img.toString('base64');
         //var image = req.file;
         //var wow = img.toString('base64')
       var result = await AkunAccount.insertPhoto(haha, username);
      }catch(error){
         console.log(error);
         return res.status(400).send({ success: false, error: error.message });
      }
      fs.unlinkSync(req.file.path);
      res.send({
       success: true,
       data: result
    });
     }
   );

akun.use(LoginRequired.access);


   akun.get('/getByID', async function(req, res, next){    
       
      try{
        var result = await AkunAccount.getByUID(req.agent.uid);
        return res.send({ success: true, hasil: result });
   
    }catch(error){
       console.log(error);
       return res.status(400).send({ success: false, error: error.message });
    }
   })


 module.exports = akun;