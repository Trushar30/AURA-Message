import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login, AuthCallback, ProfileSetup, Landing, Home, Search, Request, Teams, Settings, Profile } from './pages';
import { AppShell } from './components/layout';
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

    return isAuthenticated ? <Navigate to="/app/home" replace /> : <>{children}</>;
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

    if (user?.isProfileComplete) {
        return <Navigate to="/app/home" replace />;
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

                {/* Protected App Routes with AppShell */}
                <Route
                    path="/app"
                    element={
                        <ProtectedRoute>
                            <AppShell />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/app/home" replace />} />
                    <Route path="home" element={<Home />} />
                    <Route path="search" element={<Search />} />
                    <Route path="request" element={<Request />} />
                    <Route path="teams" element={<Teams />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<Profile />} />
                </Route>

                {/* Redirect unknown routes to Landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
