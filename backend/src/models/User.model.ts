
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define an initial structure for LifeData to be used as a default
const initialRoutine = Object.fromEntries(
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => [day, []])
);
const initialLifeData = {
    dailyData: {},
    habits: [],
    weeklyRoutine: initialRoutine,
    goals: [],
    credentials: []
};

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password?: string;
    lifeData: any;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    lifeData: {
        type: Schema.Types.Mixed,
        default: initialLifeData
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword: string) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
