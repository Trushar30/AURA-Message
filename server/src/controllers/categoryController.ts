import { Response } from 'express';
import mongoose from 'mongoose';
import { FriendCategory, User } from '../models/index.js';
import { AuthRequest } from '../middleware/index.js';

// Create a new category
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { name, color, icon } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!name?.trim()) {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }

        // Get the highest order number for this user
        const lastCategory = await FriendCategory.findOne({ user: userId })
            .sort({ order: -1 })
            .select('order');

        const order = (lastCategory?.order ?? -1) + 1;

        const category = await FriendCategory.create({
            user: userId,
            name: name.trim(),
            color: color || '#6366f1',
            icon: icon || 'users',
            friends: [],
            order,
        });

        res.status(201).json({ category });
    } catch (error: any) {
        console.error('Create category error:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Category with this name already exists' });
            return;
        }
        res.status(500).json({ error: 'Failed to create category' });
    }
};

// Get all categories for current user
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const categories = await FriendCategory.find({ user: userId })
            .sort({ order: 1 })
            .populate('friends', 'name email avatar username status lastSeen');

        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
};

// Update a category
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { name, color, icon } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const category = await FriendCategory.findOne({ _id: id, user: userId });

        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        if (name) category.name = name.trim();
        if (color) category.color = color;
        if (icon) category.icon = icon;

        await category.save();

        await category.populate('friends', 'name email avatar username status lastSeen');

        res.json({ category });
    } catch (error: any) {
        console.error('Update category error:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Category with this name already exists' });
            return;
        }
        res.status(500).json({ error: 'Failed to update category' });
    }
};

// Delete a category
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const category = await FriendCategory.findOneAndDelete({ _id: id, user: userId });

        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
};

// Add friend to category
export const addFriendToCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id, friendId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Verify the friend is actually a friend
        const user = await User.findById(userId);
        if (!user?.friends?.includes(new mongoose.Types.ObjectId(friendId))) {
            res.status(400).json({ error: 'User is not your friend' });
            return;
        }

        const category = await FriendCategory.findOneAndUpdate(
            { _id: id, user: userId },
            { $addToSet: { friends: friendId } },
            { new: true }
        ).populate('friends', 'name email avatar username status lastSeen');

        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        res.json({ category });
    } catch (error) {
        console.error('Add friend to category error:', error);
        res.status(500).json({ error: 'Failed to add friend to category' });
    }
};

// Remove friend from category
export const removeFriendFromCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id, friendId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const category = await FriendCategory.findOneAndUpdate(
            { _id: id, user: userId },
            { $pull: { friends: friendId } },
            { new: true }
        ).populate('friends', 'name email avatar username status lastSeen');

        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        res.json({ category });
    } catch (error) {
        console.error('Remove friend from category error:', error);
        res.status(500).json({ error: 'Failed to remove friend from category' });
    }
};

// Reorder categories
export const reorderCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { categoryIds } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!Array.isArray(categoryIds)) {
            res.status(400).json({ error: 'categoryIds must be an array' });
            return;
        }

        // Update order for each category
        const updatePromises = categoryIds.map((categoryId: string, index: number) =>
            FriendCategory.findOneAndUpdate(
                { _id: categoryId, user: userId },
                { order: index }
            )
        );

        await Promise.all(updatePromises);

        const categories = await FriendCategory.find({ user: userId })
            .sort({ order: 1 })
            .populate('friends', 'name email avatar username status lastSeen');

        res.json({ categories });
    } catch (error) {
        console.error('Reorder categories error:', error);
        res.status(500).json({ error: 'Failed to reorder categories' });
    }
};
