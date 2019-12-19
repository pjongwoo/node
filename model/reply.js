var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var reply = new Schema({
    contentId : { type: String, required: true },   //게시글 Id
    userId : { type: String, required: true },      //사용자 ID
    content : { type: String, required: true },     //댓글내용
    regdate: { type: Date, default: Date.now  }     //등록날짜
});

module.exports = mongoose.model('reply', reply);