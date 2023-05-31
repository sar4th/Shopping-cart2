// Import dependencies
var express = require('express');
var session = require('express-session');
var hbs = require('express-handlebars');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var path = require('path');
var createError = require('http-errors');
var multer=require("multer")
var fileUpload = require('express-fileupload');
var db = require('./config/connection');

// Import routers
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

// Initialize the app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutDir: __dirname + '/views/layouts'
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : path.join(__dirname, 'tmp')
}));
db.connect((err)=>{
  if(err) console.log("database is not connected"+err)
  else console.log("connected to database")
})
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true
}));
app.use('/', userRouter);
app.use('/admin', adminRouter);
// file upload


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
