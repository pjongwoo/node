var express = require('express');
var router = express.Router();
var boardVo = require('../model/board');

// JWCHEON: 랭킹 게시판에서 사용할 router, 추천 수를 내림차순하여 추천 수 상위 9개의 데이터를 가져옴
router.get('/total', function(req, res, next) {
    boardVo.find({}).sort({recommen:-1}).limit(9).exec(function(err, rows){
        if(err) return res.status(500).send({error: 'database failure'});

        // for(var i = 0 ; i<rows.length ; i++){
            //console.log(getFormatDate(new Date(rows[i].regdate)));
            //console.log("Main 데이터 확인 "+ rows[i].hit);
        // }

        // JWCHEON: 찾은 데이터를 recipe_rank ejs로 rows 데이터 반환함
        res.render('recipe_rank', {title: '전체 레시피 랭킹', rows: rows, length: rows.length, session: req.session});
    });
});

module.exports = router;
