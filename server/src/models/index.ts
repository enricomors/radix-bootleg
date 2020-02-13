import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import Bootleg from './bootleg'

const path = `${__dirname}/../../.env`

dotenv.config({ path: path})

const dbUrl = `mongodb+srv://enrico:<${process.env.DB_PASSWORD}>@cluster0-modkb.gcp.mongodb.net/test?retryWrites=true&w=majority`

const connectDb = () => {
    console.log(dbUrl)
    return mongoose.connect(dbUrl, { useNewUrlParser: true })
}

const models = { Bootleg }

export { connectDb }

export default models