require('dotenv').config();

// *** main dependencies *** //
var express = require('express');
var multer = require('multer');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var multer = require('multer');
var AWS = require('aws-sdk');
var fs = require('fs');


// *** aws config *** //
var accessKeyId =  process.env.AWS_ACCESS_KEY;
var secretAccessKey = process.env.AWS_SECRET_KEY;
AWS.config.update({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey
});
var s3 = new AWS.S3();


// *** express instance *** //
var app = express();


// *** view engine *** //
var swig = new swig.Swig();
app.engine('html', swig.renderFile);
app.set('view engine', 'html');


// *** static directory *** //
app.set('views', path.join(__dirname, 'views'));


// *** config middleware *** //
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../client')));


// *** multer settings *** //
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../client/uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({
  storage: storage
});


// *** routes *** //

app.get('/', function(req, res, next){
  res.render('index');
});

app.post('/upload', upload.any(), function (req, res, next) {

  // get file info from form upload
  var uploadedFile = req.files[0];
  var filePath = path.join(__dirname, '../client/uploads/', uploadedFile.originalname);

  // read file, send to s3
  fs.readFile(filePath, function (err, fileBuffer) {
    var params = {
      Bucket: 'galvanize-test',
      Key: uploadedFile.filename,
      Body: fileBuffer,
      ACL:'public-read-write' // who has access
    };
    s3.putObject(params, function (err, data) {
      if(err) {
        return next(err);
      }
    });
  });

  // remove file
  fs.unlink(filePath, function(err){
    if(err) {
      return next(err);
    }
    res.redirect('/');
  });

});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// *** error handlers *** //

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;