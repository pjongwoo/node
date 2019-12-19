var express = require('express');
var fs = require('fs');
var uuid = require('uuid/v1');
var router = express.Router();
var mongoose = require('mongoose');
var boardVo = require('../model/board');
var boardUpVo = require('../model/boardUp');
var boardImgVo = require('../model/boardImg');
var replyVo = require('../model/reply');

var multer = require('multer'); // multer모듈 적용 (for 파일업로드)
var storage = multer.diskStorage({
    /*  jwpark: 이미지 파일 업로드
    /uploads폴더에 id값 폴더를 만들고 그 폴더 내부에 해당 게시글의 이미지를 업로드한다.
    */
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
    /*  jwpark: Date 포멧 변경
    몽고 DB의 Date타입을 yyyy-MM-dd HH:mm:ss로 표한한다.
    */
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
    /*  jwpark: 사용자 공유레시피 목록(페이징처리)
    tp(검색타입)에 따라 조건값을 달리하여 레시피 목록을 호출한다.
    page - 요청 페이지 번호
    tp - 검색 타입
    txt - 검색 명
    */
    var page = req.params.page;
    var tp = req.query.tp;
    var txt = req.query.txt;
    if(tp == 'tp1'){
        boardVo.find({title: { $regex: txt } },function(err, rows){
            if(err) return res.status(500).send({error: 'database failure'});
            for(var i = 0 ; i<rows.length ; i++){
                rows[i].stregdate = getFormatDate(new Date(rows[i].regdate));
                rows[i].stmodidate = getFormatDate(new Date(rows[i].modidate));
            }
            res.render("mongo_page", {title: '나만의 레시피를 공유해보세요!', rows: rows, page:page, length:rows.length-1, page_num:10, pass:true,name:req.session.name,session:req.session});
        }).sort('-regdate');
    }else if(tp == 'tp2'){
        boardVo.find({tag:{ $regex: txt }},function(err, rows){
            if(err) return res.status(500).send({error: 'database failure'});
            for(var i = 0 ; i<rows.length ; i++){
                rows[i].stregdate = getFormatDate(new Date(rows[i].regdate));
                rows[i].stmodidate = getFormatDate(new Date(rows[i].modidate));
            }
            res.render("mongo_page", {title: '나만의 레시피를 공유해보세요!', rows: rows, page:page, length:rows.length-1, page_num:10, pass:true,name:req.session.name,session:req.session});
        }).sort('-regdate');
    }else{
         boardVo.find({},function(err, rows){
            if(err) return res.status(500).send({error: 'database failure'});
            for(var i = 0 ; i<rows.length ; i++){
                rows[i].stregdate = getFormatDate(new Date(rows[i].regdate));
                rows[i].stmodidate = getFormatDate(new Date(rows[i].modidate));
            }
            res.render("mongo_page", {title: '나만의 레시피를 공유해보세요!', rows: rows, page:page, length:rows.length-1, page_num:10, pass:true,name:req.session.name,session:req.session});
        }).sort('-regdate');
    }
});

router.get('/write', function(req, res, next) {
    /*  jwpark: 사용자 공유레시피 글쓰기 페이지 이동
    레시피 쓰기 페이지로 이동 시킨다.
    */
    req.session.boardId = uuid();
    res.render('mongo_write', {title: "게시판 글 쓰기", name:req.session.name,session:req.session});
});

router.post('/write', upload.array('recpImgFile'), function(req, res, next) {
    /*  jwpark: 레시피 저장(레시피 + 레시피 이미지)
    적은 레시피 내용을 저장시킨다.
    */
    console.log("*****************write*******************");
    console.log(req.files); // 콘솔(터미널)을 통해서 req.file Object 내용 확인 가능.
    console.log(req.body.recpDtlConts);

    /* jwpark:
    datas - 레시피 게시판에 저장시킬 boards Model
     */
    var datas = new boardVo();
    datas.id = req.session.boardId;
    datas.name = req.body.name;
    datas.title = req.body.title;
    datas.idx = req.session.idx;
    datas.mainDscrpt = req.body.mainDscrpt;

    /* jwpark:
    tags - 레시피 게시판에 재료를 ,(콜론)으로 구분하여 합친다.
     */
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

        /* jwpark:
        req.files - 레시피 게시판에 저장된 이미지 정보가 저장되어 있다.
        아래 for문을 통하여 해당 레시피의 이미지들이 순서대로 저장된다.
        */
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

        /* jwpark: 메인이미지 저장
        mainImg - 메인이미지
        레시피 이미지중 가장 마지막의 이미지가 완성된 음식의 사진일 것으로 유추하여 목록에 보일 이미지로 등록 시킨다.
        */
        datas.mainImg = req.files[req.files.length-1].path;
        datas.save(function(err){
            if(err) return res.status(500).send({error: 'board database failure = '+err});
        });

        // jwpark: boardId값 초기화
        req.session.boardId = null;
        res.send("<script>alert('등록이 완료되었습니다.'); location.href='/mongo/page/1'; </script>");
        // res.redirect('/mongo/page/1');
    });

});

router.get('/read/:id', function(req, res, next) {
    /*  jwpark: 레시피 조회
    해당 id값의 레시피 데이터를 조회한다.
    id - 게시글 id
    */
    var id = req.params.id;
    console.log(req.session.name);
     boardVo.findOne({_id:req.params.id}, function(err, row){
        if(err) return res.status(500).send({error: 'board database failure'});
        req.session.boardId = row.id;
        // jwpark: 조회수 증가하여 저장
        row.hit += 1;
        row.save(function(err){
            if(err) res.status(500).json({error: 'failed to update'});
        });
        var rowUp;
        boardUpVo.findOne({contentId:id+" ", userId:req.session.name}, function(err, row1){
            if(err) return res.status(500).send({error: 'boardUp database failure'});
            console.log(row1+" //"+id + req.session.name);
            rowUp = row1;

        });

        var replyRow;
       
        replyVo.find({contentId : req.params.id+" "}, function(err, rows){
            if(err) return res.status(500).send({error: 'replyVo database failure'});
           console.log(rows);
           console.log(rows.length);

            replyRow = rows; //json으로 파싱
        })


        // jwpark: 해당 게시글의 이미지와 설명정보들을 가져온다.
        boardImgVo.find({uid:row.id}, function(err, imgRows){
            if(err) return res.status(500).send({error: 'boardImg database failure'});
            res.render("mongo_read", {title: '게시판 보기', row: row, row1:rowUp, imgRows:imgRows, session:req.session, reply:replyRow,session:req.session});
        }).sort('num');


    });

});

router.post('/update', upload.array('recpImgFile'), function(req, res, next) {
    /*  jwpark: 레시피 수정
    해당 id값의 레시피 데이터를 수정한다.
    id - 게시글 id
    originSize - 기존 레시피 설명이미지 갯수
    deleteIndex - 삭제되는 설명이미지 index(,콤마로 구분)
    */
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
        // jwpark: 해당 글쓴이가 아니거나 관리자가 아니면 수정 거부
        if(req.session.idx != board.idx || req.session.grade == 0){
            res.send("<script>alert('글쓴이가 아닙니다.'); location.href = '/mongo/page/1';</script>");
            return;
        }

        if(req.body.title) board.title = req.body.title;
        board.modidate = Date.now();
        var tags = "";
        if(req.body.tag != null){
            for(var i=0 ; i<req.body.tag.length ; i++){
                if(i == 0){
                    tags = req.body.tag[i];
                }else{
                    tags = tags + ',' + req.body.tag[i];
                }
            }
        }
        board.tag = tags;

        // jwpark: 삭제되는 설명 이미지 삭제, 삭제된 갯수만큼 originSize도 차감한다.
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

                // jwpark: originSize보다 작으면 수정하고 많으면 새로운 이미지 등록이기 때문에 추가한다.
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

                //jwpark: 수정된 설명이미지중 가장 끝 이미지를 메인 이미지로 등록한다.
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

router.get('/delete/:id', function(req, res, next) {
    /*  jwpark: 레시피 삭제
    해당 id값의 레시피 데이터를 삭제한다.
    */
    boardVo.findOne({_id:req.params.id}, function(err, board){
        if(err) return res.status(500).json({ error: 'database failure' });
        if(!board) return res.status(404).json({ error: 'board not found' });
        if(req.session.idx != board.idx && req.session.grade == 0){
            res.send("<script>alert('글쓴이가 아닙니다.'); location.href = '/mongo/page/1';</script>");
            return;
        }
        board.deleteOne(function(err){
            if(err) console.err("err : "+err);
            res.send("<script>alert('삭제되었습니다.'); location.href = '/mongo/page/1';</script>");
        });
    });
});

router.post('/replywrite', function(req, res, next) {
    var datas = new replyVo();
    datas.userId = req.session.name;
    datas.contentId = req.body.contentId;
    datas.content = req.body.recpDtlConts;

    datas.save(function(err){
        if(err) return res.status(500).send({error: 'database failure = '+err});
        res.send("<script>alert('저장되었습니다.'); location.href = '/mongo/read/"+datas.contentId+"';</script>");
        // res.redirect('/mongo/page/1');
    });

});


module.exports = router;

