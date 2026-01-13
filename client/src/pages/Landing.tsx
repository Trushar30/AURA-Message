import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import Lenis from '@studio-freight/lenis';
import { useAuthStore } from '../stores';
import { MagneticButton } from '../components/ui/MagneticButton';
import { CustomCursor } from '../components/ui/CustomCursor';
import Logo from '../assets/logo.svg';
import './Landing.css';

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize Luxury Smooth Scroll
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    const handleEnter = () => {
        navigate(isAuthenticated ? '/app' : '/login');
    };

    // Text Animation Variants
    const revealText: Variants = {
        hidden: { y: 100, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 1, ease: [0.19, 1, 0.22, 1] }
        }
    };

    const staggerContainer: Variants = {
        visible: { transition: { staggerChildren: 0.1 } }
    };

    return (
        <div className="landing-container" ref={containerRef}>
            <CustomCursor />

            <nav className="zenith-nav">
                <img src={Logo} alt="AURA" className="nav-logo" />
                <MagneticButton onClick={handleEnter} className="nav-cta-btn">
                    {isAuthenticated ? 'Enter Aura' : 'Join Beta'}
                </MagneticButton>
            </nav>

            <header className="z-hero">
                <div className="ambient-light" />

                <motion.div
                    className="z-hero-content"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.div variants={revealText} className="overflow-hidden">
                        <h1 className="z-hero-title">Connection</h1>
                    </motion.div>
                    <motion.div variants={revealText} className="overflow-hidden">
                        <h1 className="z-hero-title" style={{ fontStyle: 'italic', marginLeft: '4rem' }}>
                            Is Art.
                        </h1>
                    </motion.div>

                    <motion.p variants={revealText} className="z-hero-subtitle">
                        Experience the purest form of digital intimacy.<br />
                        No noise. Just you and them.
                    </motion.p>

                    <div className="z-hero-action">
                        <MagneticButton onClick={handleEnter} className="btn-enter">
                            Start Messaging
                        </MagneticButton>
                    </div>
                </motion.div>
            </header>

            <section className="z-philosophy">
                <motion.div
                    className="z-grid"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 1 }}
                >
                    <div className="z-feature-item">
                        <span className="z-feature-number">01</span>
                        <h3 className="z-feature-title">Silence</h3>
                        <p className="z-feature-desc">
                            In a world of noise, we offer silence. A distraction-free interface
                            that disappears when you don't need it.
                        </p>
                    </div>

                    <div className="z-feature-item">
                        <span className="z-feature-number">02</span>
                        <h3 className="z-feature-title">Privacy</h3>
                        <p className="z-feature-desc">
                            Your words are yours alone. End-to-end encryption ensures
                            that your whispers remain whispers.
                        </p>
                    </div>

                    <div className="z-feature-item">
                        <span className="z-feature-number">03</span>
                        <h3 className="z-feature-title">Focus</h3>
                        <p className="z-feature-desc">
                            Designed for deep work and deep connection. Tools that enhance
                            your ability to communicate, not interrupt it.
                        </p>
                    </div>

                    <div className="z-feature-item">
                        <span className="z-feature-number">04</span>
                        <h3 className="z-feature-title">Beauty</h3>
                        <p className="z-feature-desc">
                            Every pixel curated. A digital environment that feels as premium
                            as a well-tailored suit.
                        </p>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};
