import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { AppError } from '../utils/AppError';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const summarizeContent = async (messages: string[]): Promise<string> => {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new AppError('Groq API Key is not configured', 500);
        }

        const formattedMessages = messages.map(msg => `- ${msg}`).join('\n');

        const prompt = `Please summarize the following conversation messages into a concise and clear summary. key points and decisions if any.
        
Messages:
${formattedMessages}

Summary:`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that summarizes conversation messages clearly and concisely.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error: any) {
        console.error('AI Service Error:', error);
        throw new AppError(error.message || 'Failed to generate summary', 500);
    }
};
