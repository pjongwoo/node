var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var boardSchema = new Schema({
    reportID: {type: Number, required: true},
    reportTitle: {type: String},
    reportContents: {type: String},
    reportWriter: {type: String},
    contentsID: {type: String, required: true},
    contentsTitle: {type: String},
    writerName: {type: String},
    writerIdx: {type: Number, required: true},
    writeDate: {type: Date, default: Date.now},
});

module.exports = mongoose.model('report', boardSchema);