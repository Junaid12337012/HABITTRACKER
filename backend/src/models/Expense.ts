
import mongoose, { Schema } from 'mongoose';

const ExpenseSchema = new Schema({
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    createdAt: { type: String, required: true },
}, { timestamps: true });

ExpenseSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('Expense', ExpenseSchema);