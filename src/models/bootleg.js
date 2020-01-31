var mongoose = require('mongoose')
var Schema = mongoose.Schema

var bootlegSchema = new Schema({
    title: String,
    artist: String,
    contentUrl: String
})

var Bootleg = mongoose.model('Bootleg', bootlegSchema)

module.exports = Bootleg