var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var boardSchema = new Schema({
    id:{type: String},
    name: { type: String, required: true },
    title: { type: String, required: true },
    content: {type: String},
    regdate: { type: Date, default: Date.now  },
    modidate: { type: Date, default: Date.now  },
    idx : { type: String, required: true },
    hit : { type: Number, required: true },
    recommen : { type: Number, default: 0 },
    flag : { type: Boolean, default:false},
    stregdate: { type: String   },
    stmodidate: { type: String },
    mainImg:{type:String},
    tag:{type:String},
    mainDscrpt:{type:String, default: '내용이 없습니다.'},
});

module.exports = mongoose.model('board', boardSchema);