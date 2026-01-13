import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login, Chat, AuthCallback, ProfileSetup, Landing } from './pages';
import { useAuthStore } from './stores';
import './styles/index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuthStore();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <div className="loading-logo">
                        <img src="/logo.svg" alt="AURA" />
                    </div>
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to setup if profile incomplete
    if (user && !user.isProfileComplete) {
        return <Navigate to="/setup" replace />;
    }

    return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <div className="loading-logo">
                        <img src="/logo.svg" alt="AURA" />
                    </div>
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    return isAuthenticated ? <Navigate to="/app" replace /> : <>{children}</>;
};

const SetupRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuthStore();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <div className="loading-logo">
                        <img src="/logo.svg" alt="AURA" />
                    </div>
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Already completed setup, go to chat
    if (user?.isProfileComplete) {
        return <Navigate to="/app" replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                    path="/setup"
                    element={
                        <SetupRoute>
                            <ProfileSetup />
                        </SetupRoute>
                    }
                />
                <Route
                    path="/app"
                    element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    }
                />
                {/* Redirect unknown routes to Landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
