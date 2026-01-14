import { Request, Response, NextFunction } from 'express';
import { summarizeContent } from '../services/aiService';
import { AppError } from '../utils/AppError';

export const summarizeMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return next(new AppError('Please provide a list of messages to summarize', 400));
        }

        const summary = await summarizeContent(messages);

        res.status(200).json({
            status: 'success',
            summary
        });
    } catch (error) {
        next(error);
    }
};
