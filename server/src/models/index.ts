import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import Bootleg from './bootleg'

const path = `${__dirname}/../../.env`

dotenv.config({ path: path})

const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-modkb.gcp.mongodb.net/radix-bootleg?retryWrites=true&w=majority`
const connectDb = () => {
    return mongoose.connect(dbUrl, { useNewUrlParser: true })
}

const models = { Bootleg }

export { connectDb }

export default models