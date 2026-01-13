import React, { useState } from 'react';
import { useAuthStore } from '../stores';
import { Avatar } from '../components/ui';
import './Profile.css';

export const Profile: React.FC = () => {
    const { user, updateProfile } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');

    const handleSave = async () => {
        try {
            await updateProfile({ name, bio });
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-cover" />
                    <div className="profile-info">
                        <Avatar
                            name={user?.name || 'User'}
                            src={user?.avatar}
                            size="xl"
                            status="online"
                            showStatus
                        />
                        {isEditing ? (
                            <div className="profile-edit-form">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="name-input"
                                />
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    className="bio-input"
                                    rows={3}
                                />
                                <div className="edit-actions">
                                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </button>
                                    <button className="save-btn" onClick={handleSave}>
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="profile-name">{user?.name}</h1>
                                <p className="profile-email">{user?.email}</p>
                                {user?.bio && <p className="profile-bio">{user.bio}</p>}
                                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-item">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Conversations</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Teams</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Connections</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
