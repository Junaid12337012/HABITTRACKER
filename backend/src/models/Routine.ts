
import mongoose, { Schema } from 'mongoose';

const RoutineTaskSchema = new Schema({
    id: { type: String, required: true },
    time: { type: String, required: true },
    text: { type: String, required: true },
}, { _id: false });

const RoutineSchema = new Schema({
    weeklyRoutine: {
        type: Map,
        of: [RoutineTaskSchema],
        required: true,
    }
}, { timestamps: true });

RoutineSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('Routine', RoutineSchema);