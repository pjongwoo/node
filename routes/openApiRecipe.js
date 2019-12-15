var express = require('express');
var router = express.Router();
var request =  require('request');

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
const option = {
    api_URL  :'Grid_20150827000000000226_1', //목록api value
    
    api_URL1 : 'Grid_20150827000000000228_1',//레시피상세
    api_URL2 : 'Grid_20150827000000000227_1', //재료
    apiKey   :'e2237ebde52fb28e6a2d8e19ec9a442ec87e4f1a6fc39b170a29a8c1824b63f4', //apiKey
    type :'json' //return type (json, xml)
  }

router.get('/page/:page', function(req, res, next){
    var page = req.params.page;
    var strtpage = page*10-9;
    var endpage = page*10;
   console.log("openAPI URL : "+'http://211.237.50.150:7080/openapi/'+ option.apiKey +'/'+option.type+'/'+option.api_URL+'/'+page+'/'+page*10) ;
    
   request.get({
        uri:'http://211.237.50.150:7080/openapi/'+ option.apiKey +'/'+option.type+'/'+option.api_URL+'/'+strtpage+'/'+endpage, 
      }, function(err, res1, body) {
        let json = JSON.parse(body) //json으로 파싱
        console.log(json);
        res.render("openApi_list", {title: '게시판 리스트', rows: json, currentPage:page});
      });
});

router.get('/read/:id/:name', function(req, res, next) {
    var id = req.params.id;
    var name = req.params.name
    console.log('http://211.237.50.150:7080/openapi/'+ option.apiKey +'/'+option.type+'/'+option.api_URL1+'/1/100?RECIPE_ID='+id);
    console.log('http://211.237.50.150:7080/openapi/'+ option.apiKey +'/'+option.type+'/'+option.api_URL2+'/1/100?RECIPE_ID='+id);
    console.log('http://211.237.50.150:7080/openapi/'+ option.apiKey +'/'+option.type+'/'+option.api_URL+'/1/10?RECIPE_NM_KO='+name
    );

    
    request.get({
        uri:'http://211.237.50.150:7080/openapi/'+ option.apiKey +'/'+option.type+'/'+option.api_URL1+'/1/100?RECIPE_ID='+id, //xml 요청 주소는 https://openapi.naver.com/v1/search/image.xml
      }, function(err, res1, body) {
        let json = JSON.parse(body) //json으로 파싱
        console.log(json);
        
        request.get({
            uri:'http://211.237.50.150:7080/openapi/'+ option.apiKey +'/'+option.type+'/'+option.api_URL2+'/1/100?RECIPE_ID='+id, //xml 요청 주소는 https://openapi.naver.com/v1/search/image.xml
          }, function(err, res2, body1) {
            let json1 = JSON.parse(body1) //json으로 파싱
            console.log(json1);
            var url = encodeURI('http://211.237.50.150:7080/openapi/'+ option.apiKey +'/'+option.type+'/'+option.api_URL+'/1/10?RECIPE_NM_KO='+name);
            request.get({
                
                uri:url, 
              }, function(err, res3, body3) {
                console.log(err);
                let json2 = JSON.parse(body3) //json으로 파싱
                console.log(json2);
                res.render("openApi_read", {title: '게시판 보기', recipe: json, material:json1, main:json2 });
            });


          });

      });



   
});

/*
router.get('/write', function(req, res, next) {
    res.render('mongo_write', {title: "게시판 글 쓰기", name:req.session.name});
});
*/
/*
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
*/
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

