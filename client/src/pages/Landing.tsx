import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import './Landing.css';

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCtaClick = () => {
        if (isAuthenticated) {
            navigate('/app');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="landing-page">
            <div className="grain-overlay" />

            {/* Navigation */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-brand">
                    <div className="nav-logo">
                        <img src="/logo.svg" alt="Aura Logo" style={{ width: '100%', height: '100%' }} />
                    </div>
                    <span>Aura</span>
                </div>

                <div className="nav-links">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#security" className="nav-link">Security</a>
                    <a href="#about" className="nav-link">About</a>
                </div>

                <button onClick={handleCtaClick} className="nav-cta">
                    {isAuthenticated ? 'Go to App' : 'Get Started'}
                </button>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-pill">
                    Currently in Beta 2.0
                </div>

                <h1 className="hero-title">
                    Connection,<br />
                    Reimagined.
                </h1>

                <p className="hero-description">
                    Experience messaging in its purest form. Minimal design, maximum privacy,
                    and a truly human way to connect with those who matter most.
                </p>

                <div className="hero-actions">
                    <button onClick={handleCtaClick} className="btn-primary">
                        Start Messaging
                    </button>
                    <button className="btn-secondary">
                        View Demo
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">✨</div>
                        <h3 className="feature-title">Thoughtful Design</h3>
                        <p className="feature-desc">
                            Every pixel crafted with intention. A distraction-free interface that puts your conversations front and center.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3 className="feature-title">Private by Default</h3>
                        <p className="feature-desc">
                            End-to-end encryption ensures your personal moments stay exactly that—personal.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">⚡️</div>
                        <h3 className="feature-title">Lightning Fast</h3>
                        <p className="feature-desc">
                            Built on modern web technologies for instant message delivery and real-time typing indicators.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🎨</div>
                        <h3 className="feature-title">Expressive</h3>
                        <p className="feature-desc">
                            Rich media support, reactions, and beautiful typography make every message feel special.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};
