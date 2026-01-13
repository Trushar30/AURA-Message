import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
    _id: Types.ObjectId;
    type: 'direct' | 'group';
    name?: string;
    avatar?: string;
    description?: string;
    participants: {
        user: Types.ObjectId;
        role: 'admin' | 'member';
        joinedAt: Date;
        lastRead?: Date;
    }[];
    lastMessage?: Types.ObjectId;
    isArchived: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        type: {
            type: String,
            enum: ['direct', 'group'],
            required: true,
        },
        name: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        avatar: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            maxlength: 500,
        },
        participants: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['admin', 'member'],
                    default: 'member',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
                lastRead: {
                    type: Date,
                },
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding user's conversations
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ updatedAt: -1 });

// Ensure direct conversations are unique between two users
conversationSchema.index(
    { type: 1, 'participants.user': 1 },
    {
        unique: true,
        partialFilterExpression: { type: 'direct' }
    }
);

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
