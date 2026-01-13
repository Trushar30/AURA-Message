import { Router } from 'express';
import { z } from 'zod';
import { authenticate, validate } from '../middleware/index.js';
import {
    getConversations,
    getConversation,
    createDirectConversation,
    createGroupConversation,
    updateGroup,
    addParticipant,
    leaveGroup,
} from '../controllers/index.js';

const router = Router();

const createDirectSchema = z.object({
    body: z.object({
        recipientId: z.string(),
    }),
});

const createGroupSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100),
        participantIds: z.array(z.string()).min(1),
        description: z.string().max(500).optional(),
    }),
});

const updateGroupSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        avatar: z.string().url().optional().or(z.literal('')),
    }),
});

const addParticipantSchema = z.object({
    body: z.object({
        participantId: z.string(),
    }),
});

// All routes require authentication
router.use(authenticate);

router.get('/', getConversations);
router.get('/:id', getConversation);
router.post('/direct', validate(createDirectSchema), createDirectConversation);
router.post('/group', validate(createGroupSchema), createGroupConversation);
router.patch('/group/:id', validate(updateGroupSchema), updateGroup);
router.post('/:id/participants', validate(addParticipantSchema), addParticipant);
router.delete('/:id/leave', leaveGroup);

export default router;
