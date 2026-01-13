import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password?: string;
    name: string;
    avatar?: string;
    bio?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen: Date;
    googleId?: string;
    isVerified: boolean;
    isProfileComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            minlength: 6,
            select: false,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        avatar: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            maxlength: 200,
            default: '',
        },
        status: {
            type: String,
            enum: ['online', 'offline', 'away', 'busy'],
            default: 'offline',
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        googleId: {
            type: String,
            sparse: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isProfileComplete: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Index for search
userSchema.index({ name: 'text', email: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);
