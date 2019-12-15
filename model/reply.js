var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var reply = new Schema({
    contentId : { type: String, required: true },
    userId : { type: String, required: true },
    content : { type: String, required: true },
    regdate: { type: Date, default: Date.now  }
});

module.exports = mongoose.model('reply', reply);