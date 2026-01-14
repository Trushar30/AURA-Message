import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Avatar } from '../components/ui';
import './Teams.css';

interface User {
    _id: string;
    name: string;
    email: string;
    username?: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
}

interface Category {
    _id: string;
    name: string;
    color: string;
    icon: string;
    friends: User[];
    order: number;
}

const CATEGORY_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
];

const CATEGORY_ICONS = [
    { id: 'users', label: 'Friends', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { id: 'home', label: 'Home', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { id: 'briefcase', label: 'Work', icon: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
    { id: 'graduation', label: 'School', icon: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5' },
    { id: 'book', label: 'Study', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 4h16v16H4z M9 4v13' },
    { id: 'heart', label: 'Family', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
    { id: 'star', label: 'Favorites', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { id: 'coffee', label: 'Hangout', icon: 'M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3' },
];

export const Teams: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [allFriends, setAllFriends] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCategoryDetail, setShowCategoryDetail] = useState<Category | null>(null);
    const [showAddFriends, setShowAddFriends] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
    const [newCategoryIcon, setNewCategoryIcon] = useState('users');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [categoriesRes, friendsRes] = await Promise.all([
                api.getCategories(),
                api.getFriends()
            ]);
            setCategories(categoriesRes.categories);
            setAllFriends(friendsRes.friends);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { category } = await api.createCategory({
                name: newCategoryName.trim(),
                color: newCategoryColor,
                icon: newCategoryIcon,
            });
            setCategories(prev => [...prev, category]);
            setShowCreateModal(false);
            resetForm();
        } catch (error: any) {
            console.error('Failed to create category:', error);
            alert(error.message || 'Failed to create category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !newCategoryName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { category } = await api.updateCategory(editingCategory._id, {
                name: newCategoryName.trim(),
                color: newCategoryColor,
                icon: newCategoryIcon,
            });
            setCategories(prev => prev.map(c => c._id === category._id ? category : c));
            if (showCategoryDetail?._id === category._id) {
                setShowCategoryDetail(category);
            }
            setEditingCategory(null);
            resetForm();
        } catch (error: any) {
            console.error('Failed to update category:', error);
            alert(error.message || 'Failed to update category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm('Are you sure you want to delete this category? Friends will be removed from this category but will remain your friends.')) {
            return;
        }
        try {
            await api.deleteCategory(categoryId);
            setCategories(prev => prev.filter(c => c._id !== categoryId));
            setShowCategoryDetail(null);
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    const handleAddFriend = async (friendId: string) => {
        if (!showCategoryDetail) return;
        try {
            const { category } = await api.addFriendToCategory(showCategoryDetail._id, friendId);
            setCategories(prev => prev.map(c => c._id === category._id ? category : c));
            setShowCategoryDetail(category);
        } catch (error) {
            console.error('Failed to add friend:', error);
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!showCategoryDetail) return;
        try {
            const { category } = await api.removeFriendFromCategory(showCategoryDetail._id, friendId);
            setCategories(prev => prev.map(c => c._id === category._id ? category : c));
            setShowCategoryDetail(category);
        } catch (error) {
            console.error('Failed to remove friend:', error);
        }
    };

    const resetForm = () => {
        setNewCategoryName('');
        setNewCategoryColor(CATEGORY_COLORS[0]);
        setNewCategoryIcon('users');
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setNewCategoryColor(category.color);
        setNewCategoryIcon(category.icon);
    };

    const getIconPath = (iconId: string) => {
        return CATEGORY_ICONS.find(i => i.id === iconId)?.icon || CATEGORY_ICONS[0].icon;
    };

    const getAvailableFriends = () => {
        if (!showCategoryDetail) return [];
        const categoryFriendIds = new Set(showCategoryDetail.friends.map(f => f._id));
        return allFriends.filter(f => !categoryFriendIds.has(f._id));
    };

    if (isLoading) {
        return (
            <div className="teams-page">
                <div className="teams-container">
                    <header className="page-header">
                        <div>
                            <h1>Teams</h1>
                            <p>Organize your friends into categories</p>
                        </div>
                    </header>
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Loading categories...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="teams-page">
            <div className="teams-container">
                <header className="page-header">
                    <div>
                        <h1>Teams</h1>
                        <p>Organize your friends into categories</p>
                    </div>
                    <button className="create-team-btn primary" onClick={() => setShowCreateModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Category
                    </button>
                </header>

                <div className="teams-content">
                    {categories.length > 0 ? (
                        <div className="categories-grid">
                            {categories.map((category) => (
                                <div
                                    key={category._id}
                                    className="category-card"
                                    style={{ '--category-color': category.color } as React.CSSProperties}
                                    onClick={() => setShowCategoryDetail(category)}
                                >
                                    <div className="category-icon-wrapper">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d={getIconPath(category.icon)} />
                                        </svg>
                                    </div>
                                    <h3>{category.name}</h3>
                                    <p className="friend-count">
                                        {category.friends.length} {category.friends.length === 1 ? 'friend' : 'friends'}
                                    </p>
                                    {category.friends.length > 0 && (
                                        <div className="category-avatars">
                                            {category.friends.slice(0, 4).map((friend, index) => (
                                                <div key={friend._id} className="avatar-stack" style={{ zIndex: 4 - index }}>
                                                    <Avatar name={friend.name} src={friend.avatar} size="sm" />
                                                </div>
                                            ))}
                                            {category.friends.length > 4 && (
                                                <div className="avatar-stack more">+{category.friends.length - 4}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h3>No categories yet</h3>
                            <p>Create categories to organize your friends into groups like Work, School, Family, and more.</p>
                            <button className="create-team-btn primary" onClick={() => setShowCreateModal(true)}>
                                Create your first category
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Category Modal */}
            {(showCreateModal || editingCategory) && (
                <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingCategory(null); resetForm(); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                            <button className="close-btn" onClick={() => { setShowCreateModal(false); setEditingCategory(null); resetForm(); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Category Name</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g., College Friends, Work"
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Color</label>
                                <div className="color-picker">
                                    {CATEGORY_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            className={`color-option ${newCategoryColor === color ? 'active' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setNewCategoryColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Icon</label>
                                <div className="icon-picker">
                                    {CATEGORY_ICONS.map((iconItem) => (
                                        <button
                                            key={iconItem.id}
                                            className={`icon-option ${newCategoryIcon === iconItem.id ? 'active' : ''}`}
                                            onClick={() => setNewCategoryIcon(iconItem.id)}
                                            title={iconItem.label}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d={iconItem.icon} />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => { setShowCreateModal(false); setEditingCategory(null); resetForm(); }}>
                                Cancel
                            </button>
                            <button
                                className="submit-btn"
                                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                                disabled={!newCategoryName.trim() || isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Create Category')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Detail Modal */}
            {showCategoryDetail && (
                <div className="modal-overlay" onClick={() => { setShowCategoryDetail(null); setShowAddFriends(false); }}>
                    <div className="modal-content large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ '--category-color': showCategoryDetail.color } as React.CSSProperties}>
                            <div className="category-header-info">
                                <div className="category-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d={getIconPath(showCategoryDetail.icon)} />
                                    </svg>
                                </div>
                                <div>
                                    <h2>{showCategoryDetail.name}</h2>
                                    <p>{showCategoryDetail.friends.length} {showCategoryDetail.friends.length === 1 ? 'friend' : 'friends'}</p>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button className="icon-btn" onClick={() => openEditModal(showCategoryDetail)} title="Edit">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button className="icon-btn delete" onClick={() => handleDeleteCategory(showCategoryDetail._id)} title="Delete">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                                <button className="close-btn" onClick={() => { setShowCategoryDetail(null); setShowAddFriends(false); }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="modal-body">
                            <div className="section-header">
                                <h3>Friends in this category</h3>
                                <button className="add-btn" onClick={() => setShowAddFriends(!showAddFriends)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Add Friends
                                </button>
                            </div>

                            {showAddFriends && (
                                <div className="add-friends-section">
                                    <h4>Available Friends</h4>
                                    {getAvailableFriends().length > 0 ? (
                                        <div className="friends-list">
                                            {getAvailableFriends().map((friend) => (
                                                <div key={friend._id} className="friend-item">
                                                    <Avatar name={friend.name} src={friend.avatar} size="sm" status={friend.status} showStatus />
                                                    <div className="friend-info">
                                                        <span className="name">{friend.name}</span>
                                                        {friend.username && <span className="username">@{friend.username}</span>}
                                                    </div>
                                                    <button className="add-friend-btn" onClick={() => handleAddFriend(friend._id)}>
                                                        Add
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-friends-msg">All your friends are already in this category</p>
                                    )}
                                </div>
                            )}

                            {showCategoryDetail.friends.length > 0 ? (
                                <div className="friends-list">
                                    {showCategoryDetail.friends.map((friend) => (
                                        <div key={friend._id} className="friend-item">
                                            <Avatar name={friend.name} src={friend.avatar} size="md" status={friend.status} showStatus />
                                            <div className="friend-info">
                                                <span className="name">{friend.name}</span>
                                                {friend.username && <span className="username">@{friend.username}</span>}
                                            </div>
                                            <button className="remove-friend-btn" onClick={() => handleRemoveFriend(friend._id)}>
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-friends">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <line x1="19" y1="8" x2="19" y2="14" />
                                        <line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                    <p>No friends in this category yet</p>
                                    <button className="add-btn" onClick={() => setShowAddFriends(true)}>Add friends</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
