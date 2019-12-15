var express = require('express');
var mysql = require('mysql');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bodyParser = require('body-parser');
var ejs = require('ejs');
var dbConfig = require('./dbConfig/database');
var router  = express.Router();
var path = require('path');
var loginRouter = require('./routes/login');
var boardMongoRouter = require('./routes/mongo_board');
var boardAdminRouter = require('./routes/admin_board');
var sampleRouter = require('./routes/sample');
var boardUpMongoRouter = require('./routes/mongo_boardUp');
var manageRouter = require('./routes/manage_board');
var openApi = require('./routes/openApiRecipe');
var rankRouter = require('./routes/recipe_router');

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

app.use('',loginRouter);
app.use('/mongo',boardMongoRouter);
app.use('/admin',boardAdminRouter);
app.use('/sample', sampleRouter);
app.use('/mongoup',boardUpMongoRouter);
app.use('/manage', manageRouter);
app.use('/openApi',openApi);
app.use('/recipe', rankRouter);

// 세션값으로 페이지 이동
app.get('/', function (req, res) {
  if(!req.session.name)
    //res.redirect('/login');
    res.render("login", {pass: "success"});
  else
    res.redirect('/main');
});




app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});