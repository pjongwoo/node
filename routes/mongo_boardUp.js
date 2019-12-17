var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var boardUpVo = require('../model/boardUp');

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
        res.send("<script>alert('추천되었습니다.'); location.href = '/mongo/read/"+datas.contentId+"';</script>");
        // res.redirect('/mongo/page/1');
    });

});
/*
router.get('/read/:id', function(req, res, next) {
    var id = req.params.id;
    boardVo.findOne({_id:req.params.id}, function(err, row){
        if(err) return res.status(500).send({error: 'database failure'});
        row.hit += 1;
        row.save(function(err){
            if(err) res.status(500).json({error: 'failed to update'});
        });
        res.render("mongo_read", {title: '게시판 보기', row: row});
    });
});

router.post('/update', function(req, res, next) {
    const id = req.body.id;
    var datas = new boardVo();
    datas.title = req.body.title;
    datas.content = req.body.content;
    datas.modidate = Date.now(); // 2

    boardVo.findOne({_id:req.body.id}, function(err, board){
        if(err) return res.status(500).json({ error: 'database failure' });
        if(!board) return res.status(404).json({ error: 'board not found' });
        if(req.session.idx != board.idx){
            res.send("<script>alert('글쓴이가 아닙니다.'); location.href = '/mongo/page/1';</script>");
            return;
        }

        if(req.body.title) board.title = req.body.title;
        if(req.body.content) board.content = req.body.content;
        board.modidate = Date.now();

        board.save(function(err){
            if(err) res.status(500).json({error: 'failed to update'});
            // res.redirect('/mongo/read/'+res.req.body.id);
            res.redirect('/mongo/page/1');
        });

    });
});
*/
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

