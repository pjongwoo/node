var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var boardUpVo = require('../model/boardUp');
var boardVo = require('../model/board');

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

var db = mongoose.connection;
mongoose.connect('mongodb://211.239.124.237:19614/node', { useNewUrlParser: true, useUnifiedTopology: true  } );
db.on('error', console.error);
db.once('open', function(){
    // CONNECTED TO MONGODB SERVER
    console.log("Connected to mongod server!");
});

function getCurrentDate(){
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();
    var today = date.getDate();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var milliseconds = date.getMilliseconds();
    return new Date(Date.UTC(year, month, today, hours, minutes, seconds, milliseconds));
}
/*
router.get('/list', function(req, res, next){
    boardVo.find({flag:true},function(err, rows){
        if(err) return res.status(500).send({error: 'database failure'});
        res.render("mongo_list", {title: '게시판 리스트', rows: rows});
    });
});
*/
/*
router.get('/write', function(req, res, next) {
    res.render('mongo_write', {title: "게시판 글 쓰기", name:req.session.name});
});
*/

router.post('/write', function(req, res, next) {
    var datas = new boardUpVo();
    datas.userId = req.session.name;
    datas.contentId = req.body.id;

    datas.save(function(err){
        if(err) return res.status(500).send({error: 'database failure = '+err});

        // JWCHEON: 추천이 되었다면 기존 게시글(boardVO)의 데이터를 찾아 추천 수를 +1 증가함
        boardVo.findOne({_id: req.body.id}, function(err, row) {
            if(err) return res.status(500).send({error: 'database failure'});
            row.recommen = row.recommen + 1;

            // JWCHEON: 추천 수를 증가한 데이터를 저장하고, 페이지 이동할 수 있도록 res.send로 응답
            row.save(function(err){
                if(err) res.status(500).json({error: 'failed to update'});
                res.send("<script>alert('추천되었습니다.'); location.href = '/mongo/read/"+datas.contentId+"';</script>");
            });
        });
    });

});

function getFormatDate(date){
    var year = date.getFullYear();              //yyyy
    var month = (1 + date.getMonth());          //M
    month = month >= 10 ? month : '0' + month;  //month 두자리로 저장
    var day = date.getDate();                   //d
    var hour = date.getHours()
    hour = hour >= 10 ? hour : '0' + hour;
    var min = date.getMinutes();
    min = min >= 10 ? min : '0' + min;
    var second = date.getSeconds();
    second = second >= 10 ? second : '0' + second;
    day = day >= 10 ? day : '0' + day;          //day 두자리로 저장
    return  year + '-' + month + '-' + day + " " + hour + ':' + min + ':' + second;
}

module.exports = router;

