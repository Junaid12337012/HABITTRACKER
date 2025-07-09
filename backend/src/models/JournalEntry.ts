
import mongoose, { Schema } from 'mongoose';

const JournalEntrySchema = new Schema({
    text: { type: String, required: true },
    createdAt: { type: String, required: true },
}, { timestamps: true });

JournalEntrySchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model('JournalEntry', JournalEntrySchema);