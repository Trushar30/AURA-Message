import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/index.js';
import { AuthRequest, createError } from '../middleware/index.js';

const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, config.jwt.secret);
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        const user = await User.create({
            email,
            password,
            name,
            isVerified: true, // For simplicity, auto-verify
        });

        const token = generateToken(user._id.toString());

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                status: user.status,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user || !user.password) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Update status to online
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();

        const token = generateToken(user._id.toString());

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                status: user.status,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

export const googleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.redirect(`${config.clientUrl}/login?error=auth_failed`);
            return;
        }

        const token = generateToken(user._id.toString());

        // Redirect to client with token
        res.redirect(`${config.clientUrl}/auth/callback?token=${token}`);
    } catch (error) {
        res.redirect(`${config.clientUrl}/login?error=server_error`);
    }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                bio: user.bio,
                status: user.status,
                lastSeen: user.lastSeen,
                isProfileComplete: user.isProfileComplete,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        const { name, bio, avatar, username } = req.body;

        if (!user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (username && username !== user.username) {
            // Check if username is taken
            const existingUser = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
            if (existingUser) {
                res.status(400).json({ error: 'Username already taken' });
                return;
            }
            user.username = username.toLowerCase();
        }

        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();

        res.json({
            message: 'Profile updated',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                bio: user.bio,
                status: user.status,
                isProfileComplete: user.isProfileComplete,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const completeProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        const { name, bio, username } = req.body;

        if (!user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!username) {
            res.status(400).json({ error: 'Username is required' });
            return;
        }

        // Check if username is taken
        const existingUser = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
        if (existingUser) {
            res.status(400).json({ error: 'Username already taken' });
            return;
        }

        user.name = name;
        user.username = username.toLowerCase();
        if (bio) user.bio = bio;
        user.isProfileComplete = true;
        user.status = 'online';
        user.lastSeen = new Date();

        await user.save();

        res.json({
            message: 'Profile setup complete',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                bio: user.bio,
                status: user.status,
                isProfileComplete: user.isProfileComplete,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete profile' });
    }
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q } = req.query;
        const currentUserId = req.user?._id;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Search query required' });
            return;
        }

        const users = await User.find({
            $and: [
                { _id: { $ne: currentUserId } },
                {
                    $or: [
                        { name: { $regex: q, $options: 'i' } },
                        { email: { $regex: q, $options: 'i' } },
                        { username: { $regex: q, $options: 'i' } },
                    ],
                },
            ],
        })
            .select('name email avatar status lastSeen username')
            .limit(20);

        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
};

// Check username availability
export const checkUsername = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username } = req.query;
        const currentUserId = req.user?._id;

        if (!username || typeof username !== 'string') {
            res.status(400).json({ error: 'Username required' });
            return;
        }

        // Validate username format
        const usernameRegex = /^[a-z0-9_]+$/;
        if (!usernameRegex.test(username.toLowerCase())) {
            res.json({ available: false, error: 'Username can only contain letters, numbers, and underscores' });
            return;
        }

        if (username.length < 3 || username.length > 30) {
            res.json({ available: false, error: 'Username must be 3-30 characters' });
            return;
        }

        if (username.startsWith('_') || username.endsWith('_')) {
            res.json({ available: false, error: 'Username cannot start or end with underscore' });
            return;
        }

        const existingUser = await User.findOne({
            username: username.toLowerCase(),
            _id: { $ne: currentUserId }
        });

        res.json({ available: !existingUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check username' });
    }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (user) {
            user.status = 'offline';
            user.lastSeen = new Date();
            await user.save();
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
};

