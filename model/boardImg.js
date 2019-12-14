var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var boardSchema = new Schema({
    uid:{type:String},
    file:{type: String},
    path:{type: String},
    text:{type: String},
    num:{type: Number},
});

module.exports = mongoose.model('boardimg', boardSchema);