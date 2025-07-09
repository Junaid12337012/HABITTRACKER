
import mongoose, { Schema } from 'mongoose';

const TaskSchema = new Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, required: true, default: false },
    dueDate: { type: String, required: true },
    notificationMinutes: { type: Number, default: null },
    createdAt: { type: String, required: true },
}, { timestamps: true });

TaskSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('Task', TaskSchema);