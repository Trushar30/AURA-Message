import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendRequest extends Document {
    _id: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const friendRequestSchema = new Schema<IFriendRequest>(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate requests
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Index for quick lookups
friendRequestSchema.index({ receiver: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });

export const FriendRequest = mongoose.model<IFriendRequest>('FriendRequest', friendRequestSchema);
