import mongoose from 'mongoose'

export type BootlegModel = mongoose.Document & {
    tokenUri: string,
    title: string,
    artist: string,
    price: number, 
    description: string,
    contentUrl: string,
    bootlegger: string,
    franhisors: [string],
}

const bootlegSchema = new mongoose.Schema({
    tokenUri: {
        type: String,
        unique: true
    },
    title: String,
    artist: String,
    price: Number,
    description: String,
    contentUrl: String,
    bootlegger: String,
    franchisors: [String],
})

const Bootleg = mongoose.model<BootlegModel>('Bootleg', bootlegSchema)

export default Bootleg