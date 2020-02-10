import mongoose from 'mongoose'

export type BootlegModel = mongoose.Document & {
    tokenUri: string,
    title: string,
    artist: string,
    description: string,
    contentUrl: string,
    bootlegger: string,
}

const bootlegSchema = new mongoose.Schema({
    tokenUri: {
        type: String,
        unique: true
    },
    title: String,
    artist: String,
    description: String,
    contentUrl: String,
    bootlegger: String,
})

const Bootleg = mongoose.model<BootlegModel>('Bootleg', bootlegSchema)

export default Bootleg