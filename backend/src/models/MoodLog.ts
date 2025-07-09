
import mongoose, { Schema } from 'mongoose';

const MoodLogSchema = new Schema({
    mood: { type: String, required: true },
    createdAt: { type: String, required: true },
}, { timestamps: true });

MoodLogSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('MoodLog', MoodLogSchema);