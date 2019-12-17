var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var reportVO = require('../model/report');
var boardVO = require('../model/board');

// DB 접속 정보 생성
var dbConfig = require('./../dbConfig/database');
var conn = mysql.createConnection(dbConfig);
conn.connect();

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


router.get('/member', function(req, res, next) {
    const sql = 'SELECT * FROM nodedb.T_RECIPE_MEMBER ORDER BY GRADE ASC;';
    const id = "";
    conn.query(sql, function (err, results) {
        if (err) {
            console.log(err);
        }
        if (!results[0]) {

        } else {
            for(var i = 0; i < results.length; i++) {
                results[i].REGDATE = getFormatDate(new Date(results[i].REGDATE));
             
            }
            res.render('manage_member', {title: '관리자 메뉴', memberList: results});
        }
    })
});

router.post('/member/edit', function (req, res) {
    var type = req.body.mode;
    var editID = req.body.id;
    if (type == "update") {
        var editGrade = req.body.grade;

        var sql = "";
        if (editGrade == "회원") {
            sql = 'UPDATE nodedb.T_RECIPE_MEMBER SET GRADE=1 WHERE ID="' + editID + '";';
        } else {
            sql = 'UPDATE nodedb.T_RECIPE_MEMBER SET GRADE=0 WHERE ID="' + editID + '";';
        }
        conn.query(sql, function (err, results) {
            if (err) {
                console.log(err);
            }
            if (!results[0]) {

            } else {
                const sql = 'SELECT * FROM nodedb.T_RECIPE_MEMBER ORDER BY GRADE ASC;';
                const id = "";
                conn.query(sql, function (err, results) {
                    if (err) {
                        console.log(err);
                    }
                    if (!results[0]) {

                    } else {
                        // res.render('manage_member', {title: '관리자 메뉴', memberList: results});
                    }
                })
            }
        })
        // console.debug(editGrade);
    } else if (type == "delete") {
        // console.debug("delete!!!");
        const sql = 'DELETE FROM nodedb.T_RECIPE_MEMBER WHERE ID="' + editID + '";';
        conn.query(sql, function (err, results) {
            if (err) {
                console.log(err);
            }
            if (!results[0]) {

            } else {
                const sql = 'SELECT * FROM nodedb.T_RECIPE_MEMBER ORDER BY GRADE ASC;';
                const id = "";
                conn.query(sql, function (err, results) {
                    if (err) {
                        console.log(err);
                    }
                    if (!results[0]) {

                    } else {
                        // res.render('manage_member', {title: '관리자 메뉴', memberList: results});
                    }
                })
            }
        })
    }
    res.json({ok:true});
})

router.get('/report', function(req, res, next) {
    reportVO.find({}, function (err, rows) {
        if (err) {
            return res.state(500).send({error: 'database failure'});
    }
        res.render('manage_report', {title: '신고 게시판 목록', rows: rows});
    })
});

router.delete('/report/member', function(req, res, next) {
    // console.debug('ㅁㅁㅁ' + req.body.writerIdx);
    var deleteIdx = req.body.writerIdx;

    boardVO.deleteMany({idx: deleteIdx}, function (err, board) {
        if (err)
            return res.status(500).json({error: 'database failure'});
        if (!board)
            return res.status(404).json({error: 'board not found'});

        // console.debug(board);
        reportVO.deleteMany({writerIdx: deleteIdx}, function (err, board) {
            if (err)
                return res.status(500).json({ error: 'database failure' });
            if (!board)
                return  res.status(404).json({ error: 'board not found' });

            res.json({ok: true});
        });
    });
});

router.delete('/report/board', function(req, res, next) {
    var contentsID = req.body.contentsID;
    // console.debug("test: " + contentsID);
    boardVO.findOne({_id: contentsID}, function (err, board) {
        if (err)
            return res.status(500).json({ error: 'database failure' });
        if (!board)
            return  res.status(404).json({ error: 'board not found' });

        board.deleteOne(function (err) {
            if (err)
                console.err("err : " + err);

            reportVO.findOne({contentsID: contentsID}, function (err, board) {
                if (err)
                    return res.status(500).json({ error: 'database failure' });
                if (!board)
                    return  res.status(404).json({ error: 'board not found' });

                board.delete(function (err) {
                    if (err)
                        console.err("err : " + err);
                    res.json({ok: true});
                });
            });
        });
    });
});

router.post('/report/board', function(req, res, next) {
    var contentsID = req.body.contentsID;
    // console.debug("test: " + contentsID);
    reportVO.findOne({contentsID: contentsID}, function (err, board) {
        if (err)
            return res.status(500).json({ error: 'database failure' });
        if (!board)
            return  res.status(404).json({ error: 'board not found' });

        board.delete(function (err) {
            if (err)
                console.err("err : " + err);
            res.json({ok: true});
        });
    });
});

module.exports = router;
