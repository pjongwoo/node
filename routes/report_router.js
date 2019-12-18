var express = require('express');
var router = express.Router();
var boardVO = require('../model/report');

// JWCHEON: telegram bot을 사용하기 위한 api 모듈 호출
const TelegramBot = require('node-telegram-bot-api');

// JWCHEON: bot과 통신을 위한 token 저장
const token = '624674319:AAHcLQPCzLrL_Nly7cO-G9OZNxZp5MP2PSk';

// JWCHEON: 변수 bot에 Telegram 모듈화
const bot = new TelegramBot(token, {polling: true});
var botID = 0;  // JWCHEON: 관리자 chat id를 저장할 변수

// JWCHEON: 텔레그램에서 관리자로부터 메세지를 받으면 실행되는 Callback 함수
bot.on('message', (msg) => {
    const chatId = msg.chat.id; // JWCHEON: 메세지로 부터 온 chat id를 임시 저장
    var receiveMsg = msg.text;  // JWCHEON: 메세지 문자 저장

    // JWCHEON: 받은 데이터가 "/connect" 일 경우에만 botID에 관리자 chat id를 저장함
    if (receiveMsg == "/connect") {
        botID = msg.chat.id;
        bot.sendMessage(chatId, 'Success Server Connect!!');
    } else {
        bot.sendMessage(chatId, 'Command List\n/connect => Server Connecn\n\nShow you message');
    }
});

router.get('/', function(req, res, next) {

});

// JWCHEON: 신고가 들어왔을 경우 신고 목록 DB에 저장하면서 텔레그램 봇을 통해서 관리자에게 전송
router.post('/', function(req, res, next) {
    var datas = new boardVO();
    datas.reportTitle = req.body.reportTitle;
    datas.reportContents = req.body.reportContents;
    datas.reportWriter = req.body.reportWriter;
    datas.contentsID = req.body.contentsId;
    datas.contentsTitle = req.body.title;
    datas.writerName = req.body.writerName;
    datas.writerIdx = req.body.writerIdx;
    datas.writeDate = req.body.writeDate;

    // JWCHEON: 신고 DB에 데이터 저장
    datas.save(function (err) {
        if (err) {
            return res.status(500).send({error: 'database failure = ' + err});
        }
        if (botID == 0) {
            console.log("disconnect hondalbot....")
        } else {
            // JWCHEON: botID, 즉 연결된 관리자 chat ID가 있다면 아래와 같이 신고 내용과 게시글 링크 전송함
            bot.sendMessage(botID, "[신고] " + req.body.reportTitle + "\n[신고내용]: " + req.body.reportContents + "\n[게시글 주소]: http://dm1545870155704.fun25.co.kr:19615/mongo/read/" + req.body.contentsId);
            // next();
        }
        // JWCHEON: 신고가 에러없이 처리되어 true 응답함
        res.json({ok: true});
    })
});

module.exports = router;