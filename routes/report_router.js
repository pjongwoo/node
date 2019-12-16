var express = require('express');
var router = express.Router();
var boardVO = require('../model/report');

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = '624674319:AAHcLQPCzLrL_Nly7cO-G9OZNxZp5MP2PSk';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
var botID = 0;

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
    console.debug("onText");
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    var receiveMsg = msg.text;
    // send a message to the chat acknowledging receipt of their message
    // console.debug(receiveMsg);

    if (receiveMsg == "/connect") {
        botID = msg.chat.id;
        bot.sendMessage(chatId, 'Success Server Connect!!');
    } else {
        bot.sendMessage(chatId, 'Command List\n/connect => Server Connecn\n\nShow you message');
    }
});

router.get('/', function(req, res, next) {

});

router.post('/', function(req, res, next) {
    console.debug('reportTitle:' + req.body.reportTitle);
    console.debug('reportContents:' + req.body.reportContents);
    console.debug('reportWriter:' + req.body.reportWriter);
    console.debug('contentsId:' + req.body.contentsId);
    console.debug('title:' + req.body.title);
    console.debug('writerName:' + req.body.writerName);
    console.debug('writerIdx:' + req.body.writerIdx);
    console.debug('writeDate:' + req.body.writeDate);

    var datas = new boardVO();
    datas.reportID = 0;
    datas.reportTitle = req.body.reportTitle;
    datas.reportContents = req.body.reportContents;
    datas.reportWriter = req.body.reportWriter;
    datas.contentsID = req.body.contentsId;
    datas.contentsTitle = req.body.title;
    datas.writerName = req.body.writerName;
    datas.writerIdx = req.body.writerIdx;
    datas.writeDate = req.body.writeDate;

    datas.save(function (err) {
        if (err) {
            return res.status(500).send({error: 'database failure = ' + err});
        }
        if (botID == 0) {
            console.debug("disconnect hondalbot....")
        } else {
            var text = req.body.textInput;
            bot.sendMessage(botID, "[신고] " + req.body.reportTitle + "\n[신고내용]: " + req.body.reportContents + "\n[게시글 주소]: http://127.0.0.1:3000/mongo/read/" + req.body.contentsId);
            // next();
        }
        res.json({ok: true});
    })
});



module.exports = router;