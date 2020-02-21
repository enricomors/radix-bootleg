import mongoose from 'mongoose'
// import * as dotenv from 'dotenv'
import Bootleg from './bootleg'
import AccessRequest from './accessRequest'

/*
const path = `${__dirname}/../../.env`
dotenv.config({ path: path})
*/

const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL : 'mongodb://localhost:27017/radix-bootleg'

const connectDb = () => {
    console.log(dbUrl)
    return mongoose.connect(dbUrl, { useNewUrlParser: true })
}

const models = { Bootleg, AccessRequest }

export { connectDb }

export default models