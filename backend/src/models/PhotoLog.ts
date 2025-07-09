
import mongoose, { Schema } from 'mongoose';

const PhotoLogSchema = new Schema({
    imageDataUrl: { type: String, required: true },
    note: { type: String },
    createdAt: { type: String, required: true },
}, { timestamps: true });

PhotoLogSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('PhotoLog', PhotoLogSchema);