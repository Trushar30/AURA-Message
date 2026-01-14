import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserPreferences {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    fontFamily: 'inter' | 'roboto' | 'outfit' | 'poppins' | 'system';
    fontSize: 'small' | 'medium' | 'large';
}

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password?: string;
    name: string;
    username?: string;
    avatar?: string;
    bio?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen: Date;
    googleId?: string;
    isVerified: boolean;
    isProfileComplete: boolean;
    friends: mongoose.Types.ObjectId[];
    preferences: IUserPreferences;
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
        username: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
            validate: {
                validator: function (v: string) {
                    if (!v) return true; // Allow empty during initial registration
                    // Cannot start or end with underscore
                    return !v.startsWith('_') && !v.endsWith('_');
                },
                message: 'Username cannot start or end with underscore'
            }
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
            default: false,
        },
        friends: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        preferences: {
            theme: {
                type: String,
                enum: ['dark', 'light', 'system'],
                default: 'dark',
            },
            accentColor: {
                type: String,
                default: '#f59e0b',
            },
            fontFamily: {
                type: String,
                enum: ['inter', 'roboto', 'outfit', 'poppins', 'system'],
                default: 'inter',
            },
            fontSize: {
                type: String,
                enum: ['small', 'medium', 'large'],
                default: 'medium',
            },
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
userSchema.index({ name: 'text', email: 'text', username: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);
