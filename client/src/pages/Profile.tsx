import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores';
import { Avatar } from '../components/ui';
import { api } from '../services/api';
import { Check, X, Loader2, AtSign } from 'lucide-react';
import './Profile.css';

export const Profile: React.FC = () => {
    const { user, updateProfile } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Username validation regex
    const usernameRegex = /^[a-z0-9_]+$/;

    // Reset form when user changes
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setUsername(user.username || '');
            setBio(user.bio || '');
        }
    }, [user]);

    // Debounced username availability check
    const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
        if (!usernameToCheck || usernameToCheck.length < 3) {
            setUsernameAvailable(null);
            setUsernameError(usernameToCheck.length > 0 ? 'Username must be at least 3 characters' : null);
            return;
        }

        if (!usernameRegex.test(usernameToCheck)) {
            setUsernameAvailable(null);
            setUsernameError('Username can only contain lowercase letters, numbers, and underscores');
            return;
        }

        if (usernameToCheck === user?.username) {
            setUsernameAvailable(null);
            setUsernameError(null);
            return;
        }

        setIsCheckingUsername(true);
        setUsernameError(null);

        try {
            const result = await api.checkUsername(usernameToCheck);
            setUsernameAvailable(result.available);
            if (!result.available) {
                setUsernameError('Username is already taken');
            }
        } catch (error) {
            setUsernameError('Failed to check username availability');
            setUsernameAvailable(null);
        } finally {
            setIsCheckingUsername(false);
        }
    }, [user?.username]);

    // Debounce username check
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (username !== user?.username) {
                checkUsernameAvailability(username);
            } else {
                setUsernameAvailable(null);
                setUsernameError(null);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [username, checkUsernameAvailability, user?.username]);

    const handleStartEditing = () => {
        setName(user?.name || '');
        setUsername(user?.username || '');
        setBio(user?.bio || '');
        setUsernameAvailable(null);
        setUsernameError(null);
        setSaveError(null);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setUsernameAvailable(null);
        setUsernameError(null);
        setSaveError(null);
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(value);
    };

    const handleSave = async () => {
        setSaveError(null);

        // Validate username before save
        if (username !== user?.username) {
            if (username.length < 3) {
                setSaveError('Username must be at least 3 characters');
                return;
            }
            if (!usernameRegex.test(username)) {
                setSaveError('Username can only contain lowercase letters, numbers, and underscores');
                return;
            }
            if (usernameAvailable === false) {
                setSaveError('Username is already taken');
                return;
            }
        }

        setIsSaving(true);
        try {
            const updateData: { name?: string; bio?: string; username?: string } = { name, bio };
            if (username !== user?.username) {
                updateData.username = username;
            }
            await updateProfile(updateData);
            setIsEditing(false);
        } catch (error: any) {
            setSaveError(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const canSave = name.trim().length >= 2 &&
        (username === user?.username || (usernameAvailable === true && !usernameError)) &&
        !isCheckingUsername;

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
                                <div className="input-group">
                                    <label className="input-label">Display Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="name-input"
                                        maxLength={50}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Username</label>
                                    <div className="username-input-wrapper">
                                        <span className="username-prefix">
                                            <AtSign size={16} />
                                        </span>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={handleUsernameChange}
                                            placeholder="username"
                                            className={`username-input ${usernameError ? 'error' : ''} ${usernameAvailable === true ? 'success' : ''}`}
                                            maxLength={30}
                                        />
                                        <span className="username-status">
                                            {isCheckingUsername && <Loader2 size={16} className="spin" />}
                                            {!isCheckingUsername && usernameAvailable === true && <Check size={16} className="success-icon" />}
                                            {!isCheckingUsername && usernameAvailable === false && <X size={16} className="error-icon" />}
                                        </span>
                                    </div>
                                    {usernameError && (
                                        <span className="input-error">{usernameError}</span>
                                    )}
                                    {usernameAvailable === true && (
                                        <span className="input-success">Username is available!</span>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        className="bio-input"
                                        rows={3}
                                        maxLength={200}
                                    />
                                    <span className="char-count">{bio.length}/200</span>
                                </div>

                                {saveError && (
                                    <div className="save-error">{saveError}</div>
                                )}

                                <div className="edit-actions">
                                    <button className="cancel-btn" onClick={handleCancel} disabled={isSaving}>
                                        Cancel
                                    </button>
                                    <button
                                        className="save-btn"
                                        onClick={handleSave}
                                        disabled={!canSave || isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 size={16} className="spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="profile-name">{user?.name}</h1>
                                {user?.username && (
                                    <p className="profile-username">@{user.username}</p>
                                )}
                                <p className="profile-email">{user?.email}</p>
                                {user?.bio && <p className="profile-bio">{user.bio}</p>}
                                <button className="edit-profile-btn" onClick={handleStartEditing}>
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
