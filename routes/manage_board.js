var express = require('express');           // JWCHEON: express 모듈 사용
var mysql = require('mysql');               // JWCHEON: mysql 모듈 사용
var router = express.Router();
var reportVO = require('../model/report');  // JWCHEON: 신고 목록을 저장하기 위한 mongodb report
var boardVO = require('../model/board');    // JWCHEON: 신고 게시물을 관리하기 위한 mongodb board

// DB 접속 정보 생성
var dbConfig = require('./../dbConfig/database');
var conn = mysql.createConnection(dbConfig);    // JWCHEON: mysql 연결다리 생성
conn.connect();

// JWCHEON: 날짜 포맷 변환 함수
function getFormatDate(date){
    var year = date.getFullYear();              //yyyy
    var month = (1 + date.getMonth());          //M
    month = month >= 10 ? month : '0' + month;  //month 두자리로 저장
    var day = date.getDate();                   //d
    var hour = date.getHours();
    hour = hour >= 10 ? hour : '0' + hour;
    var min = date.getMinutes();
    min = min >= 10 ? min : '0' + min;
    var second = date.getSeconds();
    second = second >= 10 ? second : '0' + second;
    day = day >= 10 ? day : '0' + day;          //day 두자리로 저장
    return  year + '-' + month + '-' + day + " " + hour + ':' + min + ':' + second;
}

// JWCHEON: 회원 목록 가져오는 router
router.get('/member', function(req, res, next) {
    // JWCHEON: 등급 오름차순으로 가져와서 관리자부터 볼 수 있도록
    const sql = 'SELECT * FROM nodedb.T_RECIPE_MEMBER ORDER BY GRADE ASC;';

    conn.query(sql, function (err, results) {
        if (err) {
            // 실패 했을 경우
            console.log(err);
        }
        if (!results[0]) {
            // 데이터가 없을 경우
            console.log("error nothing...");
        } else {
            // JWCHEON: 데이터가 있을 경우 날짜 포맷 변경하여 저장
            for(var i = 0; i < results.length; i++) {
                results[i].REGDATE = getFormatDate(new Date(results[i].REGDATE));
                // console.log(results[i].REGDATE);
            }
            // JWCHEON: manage_member.ejs로 검색되어진 데이터 results 데이터 넘겨줌
            res.render('manage_member', {title: '관리자 메뉴', memberList: results, session: req.session});
        }
    })
});

// JWCHEON: 회원정보관리에서 회원등급이 수정 되었을 경우 실행되는 router
router.put('/member/edit', function (req, res) {
    var editID = req.body.id;       // JWCHEON: 수정하고자 하는 회원 ID
    var editGrade = req.body.grade; // JWCHEON: 수정하고자 하는 등급

    var sql = "";
    // JWCHEON: 각 등급에 맞게 SQL문 구성(관리자: 0, 회원: 1)
    if (editGrade == "회원") {
        sql = 'UPDATE nodedb.T_RECIPE_MEMBER SET GRADE=1 WHERE ID="' + editID + '";';
    } else {
        sql = 'UPDATE nodedb.T_RECIPE_MEMBER SET GRADE=0 WHERE ID="' + editID + '";';
    }

    conn.query(sql, function (err, results) {
        if (err) {
            console.log(err);
        }
        // JWCHEON: query문 실행 후 에러가 없다면 response로 true를 보내주어 수정 완료를 알림
        res.json({ok: true});
    })
})

// JWCHEON: 회원 탈퇴를 시킬 경우 실행되는 router
router.delete('/member/edit', function (req, res) {
    var editID = req.body.id;   // JWCHEON: 탈퇴 시키고자 하는 회원 ID 값

    // JWCHEON: 회원 DELETE 쿼리문 작성
    const sql = 'DELETE FROM nodedb.T_RECIPE_MEMBER WHERE ID="' + editID + '";';
    conn.query(sql, function (err, results) {
        if (err) {
            console.log(err);
        }
        // JWCHEON: 쿼리문 실행 후 에러가 없으면 삭제 완료를 알림
        res.json({ok: true});
    })
})


// JWCHEON: 신고 게시글 목록을 가져오는 router
router.get('/report', function(req, res, next) {
    reportVO.find({}, function (err, rows) {    // JWCHEON: reportVO를 통해 전체 목록을 가져
        if (err) {
            return res.state(500).send({error: 'database failure'});
        }
        for(var i = 0; i < rows.length; i++) {
            // JWCHEON: 가져온 데이터가 있다면 날짜&시간 포맷 수정하여 대입함
            rows[i].writeDate = new Date(rows[i].writeDate).toISOString().replace(/T/, ' ').replace(/\..+/, '');
        }
        // JWCHEON: manage_report ejs로 신고 목록 데이터 rows를 전달함
        res.render('manage_report', {title: '신고 게시판 목록', rows: rows, session: req.session});
    })
});

// JWCHEON: 신고 게시글 작성자를 제명할 경우(음란물, 욕설 게시글 등 올렸을 경우(
router.delete('/report/member', function(req, res, next) {
    var deleteIdx = req.body.writerIdx; // JWCHEON: 삭제할 회원 IDX 값

    // JWCHEON: boardVO를 통해 회원 IDX를 가진 게시글을 모두 삭제함
    boardVO.deleteMany({idx: deleteIdx}, function (err, board) {
        if (err)
            return res.status(500).json({error: 'database failure'});
        if (!board)
            return res.status(404).json({error: 'board not found'});

        // JWCHEON: 게시글 삭제가 에러 없이 진행되었다면 신고 목록에 있는 글들도 모두 지워줌
        reportVO.deleteMany({writerIdx: deleteIdx}, function (err, board) {
            if (err)
                return res.status(500).json({ error: 'database failure' });
            if (!board)
                return  res.status(404).json({ error: 'board not found' });

            // JWCHEON: 게시글과 신고글이 모두 지워졌다면 mysql 쿼리문을 통해 회원을 삭제함(제명)
            const sql = 'DELETE FROM nodedb.T_RECIPE_MEMBER WHERE IDX="' + deleteIdx + '";';
            conn.query(sql, function (err, results) {
                if (err) {
                    console.log(err);
                }
                // JWCHEON: 이상없이 처리 됐을 경우 true async
                res.json({ok: true});
            })
        });
    });
});

// JWCHEON: 게시글만 지울경우(단발성 게시글 등)
router.delete('/report/board', function(req, res, next) {
    var contentsID = req.body.contentsID;   // JWCHEON: 삭제할 게시글의 ID 값
    boardVO.findOne({_id: contentsID}, function (err, board) {  // JWCHEON: _id에서 contentsID를 가진 데이터 1개를 찾음
        if (err)
            return res.status(500).json({ error: 'database failure' });
        if (!board)
            return  res.status(404).json({ error: 'board not found' });

        // JWCHEON: 찾았다면 해당 게시글을 삭제
        board.deleteOne(function (err) {
            if (err)
                console.err("err : " + err);

            // JWCHEON: 삭제 후 신고 목록에 있는 글도 찾음
            reportVO.findOne({contentsID: contentsID}, function (err, board) {
                if (err)
                    return res.status(500).json({ error: 'database failure' });
                if (!board)
                    return  res.status(404).json({ error: 'board not found' });

                // JWCHEON: 찾았다면 신고글도 같이 지워줌
                board.delete(function (err) {
                    if (err)
                        console.err("err : " + err);
                    // JWCHEON: 위와 같은 처리 후 이상이 없다면 true 응답
                    res.json({ok: true});
                });
            });
        });
    });
});

// JWCHEON: 신고 목록에 있는 글을 관리자가 확인후 pass 할 경우
router.post('/report/board', function(req, res, next) {
    var contentsID = req.body.contentsID;   // JWCHEON: 신고 목록에서 삭제할 신고글 ID

    // JWCHEON: 신고 글 DB에서 해당 contentsID를 찾음
    reportVO.findOne({contentsID: contentsID}, function (err, board) {
        if (err)
            return res.status(500).json({ error: 'database failure' });
        if (!board)
            return  res.status(404).json({ error: 'board not found' });

        // JWCHEON: 찾았다면 해당 데이터를 삭제 후 true 응답함
        board.delete(function (err) {
            if (err)
                console.err("err : " + err);
            res.json({ok: true});
        });
    });
});

module.exports = router;
