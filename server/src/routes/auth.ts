import { Router, Request, Response } from 'express';
import { z } from 'zod';
import passport from '../config/passport.js';
import { authenticate, validate, AuthRequest } from '../middleware/index.js';
import { config } from '../config/index.js';
import jwt from 'jsonwebtoken';
import {
    register,
    login,
    getMe,
    updateProfile,
    searchUsers,
    logout,
    completeProfile,
    checkUsername,
    updatePreferences,
} from '../controllers/index.js';

const router = Router();

const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2).max(50),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),
});

const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        bio: z.string().max(200).optional(),
        avatar: z.string().url().optional().or(z.literal('')),
        username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/).optional(),
    }),
});

const completeProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50),
        username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
        bio: z.string().max(200).optional(),
    }),
});

const updatePreferencesSchema = z.object({
    body: z.object({
        theme: z.enum(['dark', 'light', 'system']).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        fontFamily: z.enum(['inter', 'roboto', 'outfit', 'poppins', 'system']).optional(),
        fontSize: z.enum(['small', 'medium', 'large']).optional(),
    }),
});

// Public routes
router.post('/register', validate(registerSchema), register as any);
router.post('/login', validate(loginSchema), login as any);

// Google OAuth routes
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${config.clientUrl}/login?error=auth_failed` }),
    (req: Request, res: Response) => {
        const user = req.user as any;
        const token = jwt.sign({ userId: user._id }, config.jwt.secret);

        // Redirect with token and profile status
        const redirectUrl = user.isProfileComplete
            ? `${config.clientUrl}/auth/callback?token=${token}`
            : `${config.clientUrl}/auth/callback?token=${token}&setup=true`;

        res.redirect(redirectUrl);
    }
);

// Protected routes
router.get('/me', authenticate as any, getMe as any);
router.patch('/profile', authenticate as any, validate(updateProfileSchema), updateProfile as any);
router.patch('/preferences', authenticate as any, validate(updatePreferencesSchema), updatePreferences as any);
router.post('/complete-profile', authenticate as any, validate(completeProfileSchema), completeProfile as any);
router.get('/search', authenticate as any, searchUsers as any);
router.get('/check-username', authenticate as any, checkUsername as any);
router.post('/logout', authenticate as any, logout as any);

export default router;

