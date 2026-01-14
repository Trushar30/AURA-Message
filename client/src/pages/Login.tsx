import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { Button, Input } from '../components/ui';
import './Login.css';

interface LoginForm {
    email: string;
    password: string;
}

interface RegisterForm {
    name: string;
    email: string;
    password: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export const Login: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState(searchParams.get('error') || '');
    const [isLoading, setIsLoading] = useState(false);
    const { login, register: registerUser } = useAuthStore();
    const navigate = useNavigate();

    const loginForm = useForm<LoginForm>();
    const registerForm = useForm<RegisterForm>();

    const handleLogin = async (data: LoginForm) => {
        setError('');
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            navigate('/app/home');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (data: RegisterForm) => {
        setError('');
        setIsLoading(true);
        try {
            await registerUser(data.email, data.password, data.name);
            navigate('/app/home');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/api/auth/google`;
    };

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="bg-gradient" />
                <div className="bg-grid" />
            </div>

            <div className="login-container animate-fade-in-scale">
                <div className="login-header">
                    <div className="logo">
                        <img src="/logo.svg" alt="AURA" />
                    </div>
                    <h1>AURA</h1>
                    <p>Realtime Message Platform</p>
                </div>

                <div className="login-tabs">
                    <button
                        className={isLogin ? 'active' : ''}
                        onClick={() => {
                            setIsLogin(true);
                            setError('');
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        className={!isLogin ? 'active' : ''}
                        onClick={() => {
                            setIsLogin(false);
                            setError('');
                        }}
                    >
                        Sign Up
                    </button>
                </div>

                {error && <div className="login-error">{error === 'auth_failed' ? 'Authentication failed. Please try again.' : error}</div>}

                {isLogin ? (
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="login-form">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Enter your email"
                            {...loginForm.register('email', { required: true })}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            {...loginForm.register('password', { required: true })}
                        />
                        <Button type="submit" isLoading={isLoading}>
                            Sign In
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="login-form">
                        <Input
                            label="Name"
                            type="text"
                            placeholder="Enter your name"
                            {...registerForm.register('name', { required: true })}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Enter your email"
                            {...registerForm.register('email', { required: true })}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Create a password"
                            {...registerForm.register('password', { required: true, minLength: 6 })}
                        />
                        <Button type="submit" isLoading={isLoading}>
                            Create Account
                        </Button>
                    </form>
                )}

                <div className="login-divider">
                    <span>or</span>
                </div>

                <button className="google-login-btn" onClick={handleGoogleLogin} type="button">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </button>

                <div className="login-footer">
                    <p>By continuing, you agree to our Terms of Service</p>
                </div>
            </div>
        </div>
    );
};
