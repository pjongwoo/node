var express = require('express');
var router = express.Router();
var boardVo = require('../model/board');

router.get('/total', function(req, res, next) {
    boardVo.find({}).sort({hit:-1}).limit(5).exec(function(err, rows){
        if(err) return res.status(500).send({error: 'database failure'});
        for(var i = 0 ; i<rows.length ; i++){
            //console.log(getFormatDate(new Date(rows[i].regdate)));
            // console.log("Main 데이터 확인 "+ rows[i].hit);
        }

        res.render('recipe_rank', {title: '전체 레시피 랭킹', rows: rows, length:rows.length});
    });
});

module.exports = router;
