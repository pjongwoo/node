var mongoose = require('mongoose'); // JWCHEON: 몽고디비 모듈 사용
var Schema = mongoose.Schema;

// JWCHEON: 신고 목록 저장할 수 있는 테이블 구조
var boardSchema = new Schema({
    reportID: {type: Number, required: true},   // JWCHEON: 신고번호
    reportTitle: {type: String},                // JWCHEON: 신고 카테고리
    reportContents: {type: String},             // JWCHEON: 신고 컨텐츠
    reportWriter: {type: String},               // JWCHEON: 신고자
    contentsID: {type: String, required: true}, // JWCHEON: 신고 당한 글 ID
    contentsTitle: {type: String},              // JWCHEON: 신고 당한 글의 제목
    writerName: {type: String},                 // JWCHEON: 신고 당한 글의 작성자
    writerIdx: {type: Number, required: true},  // JWCHEON: 신고 당한 글의 작성자 번호
    writeDate: {type: String},                  // JWCHEON: 신고 당한 글의 작성 날짜
});

module.exports = mongoose.model('report', boardSchema);