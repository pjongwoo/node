var express = require('express');
var mysql = require('mysql');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bodyParser = require('body-parser');
var ejs = require('ejs');
var dbConfig = require('./dbConfig/database');
var router  = express.Router();
var path = require('path');
var boardMongoRouter = require('./routes/mongo_board');
var boardAdminRouter = require('./routes/admin_board');
var sampleRouter = require('./routes/sample');
var boardUpMongoRouter = require('./routes/mongo_boardUp');

var boardVo = require('./model/board');

//2019.12.14 몽고db 추가
var mongoose = require('mongoose');


mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

//express 생성
var app = express();

//2019.12.14 몽고 디비 생성
var db = mongoose.connection;
mongoose.connect('mongodb://211.239.124.237:19614/node', { useNewUrlParser: true, useUnifiedTopology: true  } );
db.on('error', console.error);
db.once('open', function(){
    // CONNECTED TO MONGODB SERVER
    console.log("Connected to mongod server!");
});

//DB 접속 정보 생성
var dbOptions = dbConfig;
var conn = mysql.createConnection(dbOptions);
conn.connect();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: false }));
//세션Store 생성
app.use(session({
    secret: '!@#$%^&*',
    store: new MySQLStore(dbOptions),
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/mongo',boardMongoRouter);
app.use('/admin',boardAdminRouter);
app.use('/sample', sampleRouter);
app.use('/mongoup',boardUpMongoRouter);

// 세션값으로 페이지 이동
app.get('/', function (req, res) {
  if(!req.session.name)
    //res.redirect('/login');
    res.render("login", {pass: "success"});
  else
    res.redirect('/main');
});
app.get('/login', function(req, res){
  if(!req.session.name)
    res.render('login');
  else
    res.redirect('/404');
});

//로그아웃 페이지 예정
app.get('/logout', function(req, res){
  req.session.destroy(function(err){
    res.redirect('/');
  });
});

//2019.12.14 조회수로 게시판 조회 후 main 이동
app.get("/main", function(req, res){
  console.log("세션 생성 " + req.session.name);
  console.log("세션 생성 " + req.session.idx);
  
  boardVo.find({hit:{$gt:1}},function(err, rows){
    if(err) return res.status(500).send({error: 'database failure'});
    for(var i = 0 ; i<rows.length ; i++){
        //console.log(getFormatDate(new Date(rows[i].regdate)));
        console.log("Main 데이터 확인 "+ rows[i].hit);
    }
    res.render("main", {title: '메인페이지', rows: rows, length:rows.length});  
  });
  
  
});

//로그인 여부 체크 API
app.post('/login', function(req, res) {
  var id = req.body.username;
  var pw = req.body.password;

  if (!id) { // ID가 빈칸일 경우 체크
    res.render("login", {pass: "id"});
  } else if (!pw) { // PW가 빈칸일 경우 체크
    res.render("login", {pass: "pw"});
  } else { // ID & PW가 빈칸이 아닐 경우
    var sql = 'SELECT * FROM  nodedb.T_RECIPE_MEMBER where ID=? and PW=?';
    conn.query(sql, [id,pw],  function(err, results){
      if(err){
        console.log(err);
      }
      //DB 정보가 없을경우.
      if(!results[0]){
        res.render("login", {pass: "fail"});
      }else{
        var user = results[0];
        console.log(user.ID);
        req.session.name =  user.NAME;
        req.session.idx =  user.IDX;
        return res.redirect('/main');
      }
        
    });//query
  }
});

//회원기입 이동
app.get("/signup", function(req, res){
  res.render('signup', {status: ""});
});


//404 페이지 이동
app.get("/404", function(req, res){
  res.render('404');
});

//회원가입 API
app.post('/signup', function(req, res) {
  var id = req.body.inputID;
  var pw = req.body.inputPW;
  var email = req.body.inputEmail;
  var name = req.body.inputName;
  var phone = req.body.inputMobile;

  var users = {
    "ID": id,
    "PW": pw,
    "EMAIL": email,
    "NAME": name,
    "PHONENUMBER": phone
  }
  
  conn.query('INSERT INTO  nodedb.T_RECIPE_MEMBER  SET ?' , users, function (error, results, fields) {
    if (error) {
        console.log("error ocurred", error);
        res.redirect('/404');
    } else {
        console.log('The solution is: ', results);
        res.redirect('/');
    }
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});