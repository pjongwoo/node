var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var boardUp = new Schema({
    contentId : { type: String, required: true },   //게시글ID
    userId : { type: String, required: true },      //사용자ID
    regdate: { type: Date, default: Date.now  }     //등록날짜
});

module.exports = mongoose.model('boardup', boardUp);