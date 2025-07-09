
import mongoose, { Schema } from 'mongoose';

const HabitSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    completions: [{ type: String }],
    createdAt: { type: String, required: true },
}, { timestamps: true });

HabitSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('Habit', HabitSchema);