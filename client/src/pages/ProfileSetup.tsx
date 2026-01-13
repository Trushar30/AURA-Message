import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores';
import { api } from '../services/api';
import { Button, Input } from '../components/ui';
import './ProfileSetup.css';

interface SetupForm {
    name: string;
    username: string;
    bio?: string;
}

export const ProfileSetup: React.FC = () => {
    const { user, checkAuth } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [usernameError, setUsernameError] = useState('');

    const { register, handleSubmit, watch, formState: { errors } } = useForm<SetupForm>({
        defaultValues: {
            name: user?.name || '',
            username: '',
            bio: '',
        },
    });

    const usernameValue = watch('username');

    // Debounced username check
    const checkUsername = useCallback(async (username: string) => {
        if (!username || username.length < 3) {
            setUsernameStatus('idle');
            return;
        }

        setUsernameStatus('checking');

        try {
            const response = await api.checkUsername(username);
            if (response.available) {
                setUsernameStatus('available');
                setUsernameError('');
            } else {
                setUsernameStatus(response.error ? 'invalid' : 'taken');
                setUsernameError(response.error || 'Username is already taken');
            }
        } catch (err) {
            setUsernameStatus('idle');
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (usernameValue && usernameValue.length >= 3) {
                checkUsername(usernameValue);
            } else {
                setUsernameStatus('idle');
                setUsernameError('');
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [usernameValue, checkUsername]);

    const onSubmit = async (data: SetupForm) => {
        if (usernameStatus !== 'available') {
            setError('Please choose a valid username');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            await api.completeProfile(data);
            await checkAuth();
            navigate('/', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Failed to complete setup');
        } finally {
            setIsLoading(false);
        }
    };

    const getUsernameStatusIcon = () => {
        switch (usernameStatus) {
            case 'checking':
                return <div className="username-spinner" />;
            case 'available':
                return <span className="username-check">✓</span>;
            case 'taken':
            case 'invalid':
                return <span className="username-error">✗</span>;
            default:
                return null;
        }
    };

    return (
        <div className="setup-page">
            <div className="setup-background">
                <div className="bg-gradient" />
                <div className="bg-grid" />
            </div>

            <div className="setup-container animate-fade-in-scale">
                <div className="setup-header">
                    <div className="logo">
                        <img src="/logo.svg" alt="AURA" />
                    </div>
                    <h1>Complete Your Profile</h1>
                    <p>Tell us a bit about yourself</p>
                </div>

                {user?.avatar && (
                    <div className="setup-avatar">
                        <img src={user.avatar} alt={user.name} />
                    </div>
                )}

                {error && <div className="setup-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="setup-form">
                    <Input
                        label="Display Name"
                        placeholder="How should we call you?"
                        {...register('name', {
                            required: 'Name is required',
                            minLength: { value: 2, message: 'Name must be at least 2 characters' },
                            maxLength: { value: 50, message: 'Name must be less than 50 characters' }
                        })}
                        error={errors.name?.message}
                    />

                    <div className="input-wrapper username-input-wrapper">
                        <label className="input-label">Username</label>
                        <div className="username-input-container">
                            <span className="username-prefix">@</span>
                            <input
                                className={`setup-input username-input ${usernameStatus === 'available' ? 'valid' : ''} ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'invalid' : ''}`}
                                placeholder="your_username"
                                {...register('username', {
                                    required: 'Username is required',
                                    minLength: { value: 3, message: 'Username must be at least 3 characters' },
                                    maxLength: { value: 30, message: 'Username must be less than 30 characters' },
                                    pattern: {
                                        value: /^[a-z0-9_]+$/,
                                        message: 'Only lowercase letters, numbers, and underscores'
                                    },
                                    validate: {
                                        noStartUnderscore: v => !v.startsWith('_') || 'Cannot start with underscore',
                                        noEndUnderscore: v => !v.endsWith('_') || 'Cannot end with underscore'
                                    }
                                })}
                            />
                            <div className="username-status">
                                {getUsernameStatusIcon()}
                            </div>
                        </div>
                        {(errors.username?.message || usernameError) && (
                            <span className="input-error-text">{errors.username?.message || usernameError}</span>
                        )}
                        {usernameStatus === 'available' && (
                            <span className="input-success-text">Username is available!</span>
                        )}
                    </div>

                    <div className="input-wrapper">
                        <label className="input-label">Bio (optional)</label>
                        <textarea
                            className="setup-textarea"
                            placeholder="A short bio about yourself..."
                            maxLength={200}
                            {...register('bio', {
                                maxLength: { value: 200, message: 'Bio must be less than 200 characters' }
                            })}
                        />
                        {errors.bio && <span className="input-error-text">{errors.bio.message}</span>}
                    </div>

                    <Button type="submit" isLoading={isLoading} disabled={usernameStatus !== 'available'}>
                        Get Started
                    </Button>
                </form>

                <p className="setup-note">
                    You can always update your profile later in settings
                </p>
            </div>
        </div>
    );
};
