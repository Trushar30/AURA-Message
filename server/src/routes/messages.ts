import { Router } from 'express';
import { z } from 'zod';
import { authenticate, validate } from '../middleware/index.js';
import {
    getMessages,
    sendMessage,
    markAsRead,
    editMessage,
    deleteMessage,
    searchMessages,
} from '../controllers/index.js';

const router = Router();

const sendMessageSchema = z.object({
    body: z.object({
        content: z.string().min(1).max(5000),
        type: z.enum(['text', 'image', 'file', 'audio', 'video']).optional(),
        replyTo: z.string().optional(),
        attachments: z
            .array(
                z.object({
                    url: z.string().url(),
                    type: z.string(),
                    name: z.string(),
                    size: z.number(),
                })
            )
            .optional(),
    }),
});

const editMessageSchema = z.object({
    body: z.object({
        content: z.string().min(1).max(5000),
    }),
});

// All routes require authentication
router.use(authenticate);

router.get('/search', searchMessages);
router.get('/:conversationId', getMessages);
router.post('/:conversationId', validate(sendMessageSchema), sendMessage);
router.patch('/:conversationId/read', markAsRead);
router.patch('/:messageId/edit', validate(editMessageSchema), editMessage);
router.delete('/:messageId', deleteMessage);

export default router;
