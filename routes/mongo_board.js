var express = require('express');
var fs = require('fs');
var uuid = require('uuid/v1');
var router = express.Router();
var mongoose = require('mongoose');
var boardVo = require('../model/board');
var boardUpVo = require('../model/boardUp');
var boardImgVo = require('../model/boardImg');

var multer = require('multer'); // multer모듈 적용 (for 파일업로드)
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var boardId = req.session.boardId;
        try {
            fs.statSync(__dirname + '/../uploads/'+boardId);
            console.log('폴더가 있습니다.');
        }
        catch (err) {
            fs.mkdirSync(__dirname + '/../uploads/'+boardId, '0775' ,function(err) {
                if (err) throw err;
                console.log('새로운 폴더를 만들었습니다.');
            });
        }

        console.log("*****************destination*******************");
        cb(null, 'uploads/'+boardId); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, cb) {
        console.log("*****************filename*******************");
        cb(null, file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
    }
});
var upload = multer({ storage: storage });
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

var db = mongoose.connection;
mongoose.connect('mongodb://211.239.124.237:19614/node', { useNewUrlParser: true, useUnifiedTopology: true  } );
db.on('error', console.error);
db.once('open', function(){
    // CONNECTED TO MONGODB SERVER
    console.log("Connected to mongod server!");
});

const readFIle = path => {
    fs.readFile(__dirname + path, "utf8", (err, data) => {
        if (err) {
            // console.log(err.stack);
            return;
        }
        // console.log(data.toString());
    });
    // console.log("Program Ended");
};

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

router.get('/page', function(req, res, next) {
    res.redirect('/mongo/page/1');
});


router.get('/page/:page', function(req, res, next) {
    var page = req.params.page;

     boardVo.find({},function(err, rows){
        if(err) return res.status(500).send({error: 'database failure'});
        for(var i = 0 ; i<rows.length ; i++){
            rows[i].stregdate = getFormatDate(new Date(rows[i].regdate));
            rows[i].stmodidate = getFormatDate(new Date(rows[i].modidate));
        }
        res.render("mongo_page", {title: '나만의 레시피를 공유해보세요!', rows: rows, page:page, length:rows.length-1, page_num:10, pass:true,name:req.session.name});
    }).sort('-regdate');
});

router.get('/write', function(req, res, next) {
    req.session.boardId = uuid();
    res.render('mongo_write', {title: "게시판 글 쓰기", name:req.session.name});
});

router.post('/write', upload.array('recpImgFile'), function(req, res, next) {
    console.log("*****************write*******************");
    console.log(req.files); // 콘솔(터미널)을 통해서 req.file Object 내용 확인 가능.
    console.log(req.body.recpDtlConts);

    var datas = new boardVo();
    datas.id = req.session.boardId;
    datas.name = req.body.name;
    datas.title = req.body.title;
    datas.idx = req.session.idx;
    datas.mainDscrpt = req.body.mainDscrpt;
    
    var tags = "";
    for(var i=0 ; i<req.body.tag.length ; i++){
        if(i == 0){
            tags = req.body.tag[i];
        }else{
            tags = tags + ',' + req.body.tag[i];
        }
    }
    datas.tag = tags;
    datas.hit = 0;

    datas.save(function(err){
        if(err) return res.status(500).send({error: 'board database failure = '+err});

        for(var i=0 ; i<req.files.length ; i++){
            var img_datas = new boardImgVo();
            img_datas.uid = datas.id;
            img_datas.file = req.files[i].originalname;
            img_datas.path = req.files[i].path;
            img_datas.text = req.body.recpDtlConts[i];
            img_datas.num = i;
            console.log(img_datas);
            img_datas.save(function(err){
                if(err) return res.status(500).send({error: 'boardImg database failure = '+err});
            })
        }

        datas.mainImg = req.files[req.files.length-1].path;
        datas.save(function(err){
            if(err) return res.status(500).send({error: 'board database failure = '+err});
        });
        req.session.boardId = null;
        res.send("<script>alert('등록이 완료되었습니다.'); location.href='/mongo/page/1'; </script>");
        // res.redirect('/mongo/page/1');
    });

});

router.get('/read/:id', function(req, res, next) {
    var id = req.params.id;
    console.log(req.session.name);
     boardVo.findOne({_id:req.params.id}, function(err, row){
        if(err) return res.status(500).send({error: 'board database failure'});
        req.session.boardId = row.id;
        row.hit += 1;
        row.save(function(err){
            if(err) res.status(500).json({error: 'failed to update'});
        });
        var rowUp;
        boardUpVo.findOne({contentId:req.params.id, userId:req.session.name}, function(err, row1){
            if(err) return res.status(500).send({error: 'boardUp database failure'});
            rowUp = row1;

        });
        boardImgVo.find({uid:row.id}, function(err, imgRows){
            if(err) return res.status(500).send({error: 'boardImg database failure'});
            res.render("mongo_read", {title: '게시판 보기', row: row, row1:rowUp, imgRows:imgRows, session:req.session});
        }).sort('num');


    });

});

router.post('/update', upload.array('recpImgFile'), function(req, res, next) {
    const id = req.body.id;
    var originSize = req.body.originSize;
    var deleteIndex = req.body.deleteIndex;
    var datas = new boardVo();
    datas.title = req.body.title;
    datas.modidate = Date.now(); // 2

    console.log(req.files);
    
    boardVo.findOne({_id:id}, function(err, board){
        if(err) return res.status(500).json({ error: 'database failure' });
        if(!board) return res.status(404).json({ error: 'board not found' });
        if(req.session.idx != board.idx){
            res.send("<script>alert('글쓴이가 아닙니다.'); location.href = '/mongo/page/1';</script>");
            return;
        }

        if(req.body.title) board.title = req.body.title;
        board.modidate = Date.now();
        var tags = "";
        for(var i=0 ; i<req.body.tag.length ; i++){
            if(i == 0){
                tags = req.body.tag[i];
            }else{
                tags = tags + ',' + req.body.tag[i];
            }
        }
        board.tag = tags;

        var deletes = deleteIndex.split(',');
        if("" != deletes[0]){
            originSize = originSize-deletes.length;
            for(var i=0 ; i<deletes.length ; i++){
                boardImgVo.deleteOne({uid:board.id, num:deletes[i]-1}, function(err){
                    if(err) console.err("boardImg delete err : "+err);
                });
            }
        }

        board.save(function(err){
            if(err) res.status(500).json({error: 'failed to update'});

            boardImgVo.find({uid:board.id}, function(err, imgRows){
                if(err) return res.status(500).send({error: 'boardImg database failure'});

                var newFile = 0;
                for(var i=0 ; i<req.body.recpDtlConts.length ; i++){
                    if(i < originSize){
                        imgRows[i].text = req.body.recpDtlConts[i];
                        imgRows[i].num = i;
                        imgRows[i].save(function(err){
                            if(err) res.status(500).json({error: 'boardImg failed to update'});
                        });
                    }else{
                        var img_datas = new boardImgVo();
                        img_datas.uid = board.id;
                        img_datas.file = req.files[newFile].originalname;
                        img_datas.path = req.files[newFile++].path;
                        img_datas.text = req.body.recpDtlConts[i];
                        img_datas.num = i;
                        img_datas.save(function(err){
                            if(err) return res.status(500).send({error: 'boardImg database failure = '+err});
                        })
                    }
                }
                if(newFile != 0){
                    board.mainImg = req.files[newFile-1].path;
                    board.save(function(err){
                        if(err) return res.status(500).send({error: 'board database failure = '+err});
                    });
                }else{
                    board.mainImg = imgRows[req.body.recpDtlConts.length-1].path;
                    board.save(function(err){
                        if(err) return res.status(500).send({error: 'board database failure = '+err});
                    });
                }

            }).sort('num');
            req.session.boardId = null;
            // res.redirect('/mongo/read/'+res.req.body.id);
            res.redirect('/mongo/page/1');
        });

    });
    
});

router.post('/delete', function(req, res, next) {
    boardVo.findOne({_id:req.body.id}, function(err, board){
        if(err) return res.status(500).json({ error: 'database failure' });
        if(!board) return res.status(404).json({ error: 'board not found' });
        if(req.session.idx != board.idx){
            res.send("<script>alert('글쓴이가 아닙니다.'); location.href = '/mongo/page/1';</script>");
            return;
        }
        board.deleteOne(function(err){
            if(err) console.err("err : "+err);
            res.redirect('/mongo/page/1');
        });
    });
});


module.exports = router;

