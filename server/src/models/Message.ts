import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
    _id: Types.ObjectId;
    conversationId: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
    attachments: {
        url: string;
        type: string;
        name: string;
        size: number;
    }[];
    replyTo?: Types.ObjectId;
    readBy: {
        user: Types.ObjectId;
        readAt: Date;
    }[];
    deliveredTo: {
        user: Types.ObjectId;
        deliveredAt: Date;
    }[];
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000,
        },
        type: {
            type: String,
            enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
            default: 'text',
        },
        attachments: [
            {
                url: String,
                type: String,
                name: String,
                size: Number,
            },
        ],
        replyTo: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
        },
        readBy: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User' },
                readAt: { type: Date, default: Date.now },
            },
        ],
        deliveredTo: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User' },
                deliveredAt: { type: Date, default: Date.now },
            },
        ],
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient message retrieval
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Full-text search index
messageSchema.index({ content: 'text' });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
