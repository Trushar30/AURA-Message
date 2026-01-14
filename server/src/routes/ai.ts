import express from 'express';
import { summarizeMessages } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/summarize', authenticate, summarizeMessages);

export default router;
