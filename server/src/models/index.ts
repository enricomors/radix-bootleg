import mongoose from 'mongoose'

import Bootleg from './bootleg'

const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL : 'mongodb://localhost:27017/radix-bootleg'
const connectDb = () => {
    return mongoose.connect(dbUrl, { useNewUrlParser: true })
}

const models = { Bootleg }

export { connectDb }

export default models