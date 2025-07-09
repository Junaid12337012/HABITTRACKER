
import mongoose, { Schema } from 'mongoose';

const CredentialSchema = new Schema({
    website: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String },
    note: { type: String },
}, { timestamps: true });

CredentialSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('Credential', CredentialSchema);