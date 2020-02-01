var mongoose = require('mongoose')
var Schema = mongoose.Schema

var bootlegSchema = new Schema({
    tokenUri: {
        type: String,
        unique: true
    },
    title: String,
    artist: String,
    description: String,
    contentUrl: String
})

var Bootleg = mongoose.model('Bootleg', bootlegSchema)

module.exports = Bootleg