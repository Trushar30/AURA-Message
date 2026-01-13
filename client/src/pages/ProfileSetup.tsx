import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores';
import { api } from '../services/api';
import { Button, Input } from '../components/ui';
import './ProfileSetup.css';

interface SetupForm {
    name: string;
    bio?: string;
}

export const ProfileSetup: React.FC = () => {
    const { user, checkAuth } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<SetupForm>({
        defaultValues: {
            name: user?.name || '',
            bio: '',
        },
    });

    const onSubmit = async (data: SetupForm) => {
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

                    <Button type="submit" isLoading={isLoading}>
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
