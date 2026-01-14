import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendCategory extends Document {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    name: string;
    color: string;
    icon: string;
    friends: mongoose.Types.ObjectId[];
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const friendCategorySchema = new Schema<IFriendCategory>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        color: {
            type: String,
            default: '#6366f1', // Default indigo color
        },
        icon: {
            type: String,
            default: 'users', // Default icon
        },
        friends: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for user's categories
friendCategorySchema.index({ user: 1, order: 1 });

// Ensure unique category names per user
friendCategorySchema.index({ user: 1, name: 1 }, { unique: true });

export const FriendCategory = mongoose.model<IFriendCategory>('FriendCategory', friendCategorySchema);
