const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const sha256 = require('js-sha256');
const mongoose = require('mongoose');
var mongo = require('mongodb');
const { promiseImpl } = require('ejs');
const { getDiffieHellman } = require('crypto');
const app = express();
const router = express.Router();

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('');
  console.log('connected');
}



const fileSchema = new mongoose.Schema({
    savedId: String,
    path: String,
    validTill: String
});
const fileDB = mongoose.model('FileDB', fileSchema);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const fSE = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '--' + file.originalname)
    }
});

const upload = multer({ storage: fSE });

getCode = (min, max) => {
    return Math.random() * (max - min) + min;
}

getFile = (savedId) => {
    var path="";
    fileDB.find({savedId : savedId},(err,docs)=>{
        if(err){ 
            path='fileNotFound';
            console.log(err);
        }
        else{
            path=docs['path'];
            console.log(docs);
        }
    })
    return path;
}


app.get('/api/getFile',(req,res)=>{
        console.log(req.body);
        var code = req.body;      
        var finalCode = code['userCode'] + code['systemCode'];
        savedId = sha256(finalCode).substr(0, 15);
        console.log(savedId);
        var path = getFile(savedId);
        console.log(path);
        if(path=='fileNotFound')
        res.send('File Not Found');
        else
        res.download(path);
})



app.post("/api/getCode", upload.none(), function (req, res) {
    var x = req.body;
    var userCode = x['code'];
    var validTill = x['validTill'];
    var systemCode = parseInt(getCode(100000, 1000000));
    var finalCode = userCode + systemCode;
    var uploadId = sha256(finalCode).substr(0, 15);
    var sendData = {
        status: 'Ok',
        userCode: userCode,
        systemCode: systemCode,
        uploadId: uploadId
    }
    const json = JSON.stringify(sendData);
    res.json(JSON.parse(json));
    console.log(uploadId);
    call(uploadId,validTill);
});

app.use("/", router);
app.listen(8000);

call = (uploadId,validTill) => app.post("/api/upload", upload.single(uploadId), (req, res) => {
    console.log(req.file);
    path = './uploads/'+req.file.filename;
    var fileInfo = {
        savedId: uploadId,
        path: path,
        validTill: validTill
    } 
    const fiS = new fileDB(fileInfo);
    fiS.save().then(()=>console.log("Data Saved\n"));
    console.log(fileInfo);
    res.send("Single File Upload Success");
});



