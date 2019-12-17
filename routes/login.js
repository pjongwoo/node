var express = require('express');
var fs = require('fs');
var router = express.Router();
var mongoose = require('mongoose');
var boardVo = require('../model/board');
var mysql = require('mysql');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var dbConfig = require('../dbConfig/database');
//메일 Class 생성
var nodemailer = require('nodemailer');
//DB 접속 정보 생성

var dbOptions = dbConfig;
var conn = mysql.createConnection(dbOptions);
conn.connect();

// 세션값으로 페이지 이동
router.get('/', function (req, res) {
    if(!req.session.name)
        res.render("login", {pass: "success"});
    else
        res.redirect('/main');
});
router.get('/login', function(req, res){
    if(!req.session.name)
        res.render('login');
    else
        res.redirect('/404');
});

//로그아웃 페이지 예정
router.get('/logout', function(req, res){
    req.session.destroy(function(err){
        res.redirect('/');
    });
});

//2019.12.14 조회수로 게시판 조회 후 main 이동
router.get("/main", function(req, res){
    console.log("세션 생성 " + req.session.name);
    console.log("세션 생성 " + req.session.idx);
 
    boardVo.find({},function(err, rows){
        if(err) return res.status(500).send({error: 'database failure'});
        for(var i = 0 ; i<rows.length ; i++){
            //console.log(getFormatDate(new Date(rows[i].regdate)));
            console.log("Main 데이터 확인 "+ rows[i].hit);
        }
        res.render("main", {title: '메인페이지', rows: rows, length:rows.length,session:req.session});
    }).limit(6).sort('-regdate');
});

//로그인 여부 체크 API
router.post('/login', function(req, res) {
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
                req.session.grade = user.GRADE;
                return res.redirect('/main');
            }

        });//query
    }
});

//회원기입 이동
router.get("/signup", function(req, res){
    res.render('signup', {status: ""});
});


//404 페이지 이동
router.get("/404", function(req, res){
    res.render('404');
});

//ID 중복체크 API
router.post('/check', function(req, res) {
  console.log(req.body);
  var id = req.body.test;
  var sql = 'SELECT * FROM  nodedb.T_RECIPE_MEMBER where ID=?';
  conn.query(sql, [id],  function(err, results){
    if(err){
    }
    //DB 정보가 없을경우.
    if(!results[0]){
       // res.render("signup", {check: '1'});
        res.json("no");
    }else{
       // res.render("signup", {check: '2'});
        res.json("ok");
    }
      
  });//query
});
  
//메일전송 API
router.post("/mail", function(req, res){
    var id = req.body.getID;
 
    var sql = 'SELECT * FROM  nodedb.T_RECIPE_MEMBER where ID=?';
    conn.query(sql, [id],  function(err, results){
        if(err){
            console.log(err);
        }
        //DB 정보가 없을경우.
        if(!results[0]){
            //res.render("login", {pass: "fail"});
            res.json("no");
        }else{
            var user = results[0];
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'asws1457@gmail.com',  // gmail 계정 아이디를 입력
                  pass: 'ikgiumawmvdleyda'     // gmail 계정의 비밀번호를 입력
                }
              });
              
            var html = '<table align="center" border="1" cellpadding="0" cellspacing="0" width="580">'
            html = html + '<tr> <td> <img src=https://s3.ap-northeast-2.amazonaws.com/frontenddssreact.org/PORTFOLIO/mail.PNG style="display: block;" /> </td> </tr>'
            html = html + '<tr>  <td style="padding: 20px 0 30px 0;font-weight: bold;text-align: center;">' + user.NAME + '고객님 비밀번호는 <b style="color:#c92a2a">' +user.PW +' </b>입니다. </td> </tr> </table>'

              let mailOptions = {
                from: 'asws1457@gmail.com',                               // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
                to: user.EMAIL,                                           // 수신 메일 주소
                subject: user.NAME + '고객님 비밀번호 안내',               // 제목
                html: html // 내용
              };
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                 console.log(error);
                }
                else {
                 console.log('Email sent: ' + info.response);
                }
            });
            res.json("ok");
        }
    });//query

});


//문의 API
router.post("/question", function(req, res){
    var Name = req.body.getName;
    var Email = req.body.getEmail;
    var Phone = req.body.getPhone;
    var Message = req.body.getMessage;
   
    var inquiry = {
        "NAMES": Name,
        "EMAIL": Email,
        "PHONENUMBER": Phone,
        "CONTENT": Message,
    }

    conn.query('INSERT INTO  nodedb.T_INQUIRY  SET ?' , inquiry, function (error, results, fields) {
        if (error) {
            console.log("error ocurred", error);
            res.redirect('/404');
        } else {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'asws1457@gmail.com',  // gmail 계정 아이디를 입력
                  pass: 'ikgiumawmvdleyda'     // gmail 계정의 비밀번호를 입력
                }
              });
              
            var html = '<table align="center" border="1" cellpadding="0" cellspacing="0" width="580">'
            html = html + '<tr> <td> <img src=https://s3.ap-northeast-2.amazonaws.com/frontenddssreact.org/PORTFOLIO/question.png style="display: block;" /> </td> </tr>'
            html = html + '<tr>  <td style="padding: 20px 0 30px 0;font-weight: bold;text-align: center;">' + Name + '고객님 제휴 문의 내용 입니다. '
            html = html + '<tr>  <td style="padding: 20px 0 30px 0;font-weight: bold;text-align: center;">' + Message + '  </td> </tr> </table>'
            
              let mailOptions = {
                from: 'asws1457@gmail.com',                               // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
                to: 'asws1457@gmail.com',                                         // 수신 메일 주소
                subject: '관리자님 혼달 제휴문의메일 입니다',               // 제목
                html: html // 내용
              };
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                 console.log(error);
                }
                else {
                 console.log('Email sent: ' + info.response);
                }
            });
            res.json("ok");
        }
    });
  
    console.log("Name"+Name);
    console.log("Email"+Email);
    console.log("Phone"+Phone);
    console.log("Message"+Message);
  
});


//회원가입 API
router.post('/signup', function(req, res) {
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


//이미지 가자요기
router.get('/uploads/:url1/:url2', function(req, res) {
    console.log(__dirname+'/../uploads/'+req.params.url1 + '/' + req.params.url2);
    fs.readFile(__dirname+'/../uploads/'+req.params.url1 + '/' + req.params.url2, function(err, data){
        res.writeHead(200, {'Content-Type' : 'text/html'});
        res.end(data);
    });

});

module.exports = router;