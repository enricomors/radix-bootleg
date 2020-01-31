var Bootleg = require('./bootleg')
var mongoose = require('mongoose')

const dbUrl = 'mongodb://localhost:27017/radix-bootleg'
const connectDb = () => {
    return mongoose.connect(dbUrl, { useNewUrlParser: true })
}

module.exports = { Bootleg, connectDb }