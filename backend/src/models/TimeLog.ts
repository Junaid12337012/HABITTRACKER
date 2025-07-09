
import mongoose, { Schema } from 'mongoose';

const TimeLogSchema = new Schema({
    activity: { type: String, required: true },
    minutes: { type: Number, required: true },
    createdAt: { type: String, required: true },
}, { timestamps: true });

TimeLogSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('TimeLog', TimeLogSchema);