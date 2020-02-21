import mongoose from 'mongoose'

export type AccessRequestModel = mongoose.Document & {
    id: string; 
    consumed: boolean;
};
  
/** Definisce lo schema mongoose per la richiesta di accesso */
const accessRequest = new mongoose.Schema({
    id: String,
    consumed: Boolean,
});

const AccessRequest = mongoose.model<AccessRequestModel>('AccessRequest', accessRequest);

export default AccessRequest;