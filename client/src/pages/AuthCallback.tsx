import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import './AuthCallback.css';

export const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkAuth } = useAuthStore();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const needsSetup = searchParams.get('setup') === 'true';
            const errorParam = searchParams.get('error');

            if (errorParam) {
                setError('Authentication failed. Please try again.');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            if (token) {
                api.setToken(token);
                socketService.connect(token);
                await checkAuth();

                if (needsSetup) {
                    navigate('/setup', { replace: true });
                } else {
                    navigate('/app/home', { replace: true });
                }
            } else {
                setError('No authentication token received.');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, checkAuth]);

    return (
        <div className="auth-callback">
            <div className="callback-content">
                <div className="callback-logo">
                    <img src="/logo.svg" alt="AURA" />
                </div>
                {error ? (
                    <>
                        <p className="callback-error">{error}</p>
                        <p className="callback-redirect">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="loading-spinner" />
                        <p className="callback-text">Signing you in...</p>
                    </>
                )}
            </div>
        </div>
    );
};
