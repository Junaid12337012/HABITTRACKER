
import mongoose, { Schema } from 'mongoose';

const MilestoneSchema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, required: true, default: false },
    createdAt: { type: String, required: true },
}, { _id: false });

const GoalSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    targetDate: { type: String },
    milestones: [MilestoneSchema],
    createdAt: { type: String, required: true },
}, { timestamps: true });

GoalSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('Goal', GoalSchema);