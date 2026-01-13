import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CustomCursor: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position state
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Spring physics for smooth follow
    const springConfig = { damping: 25, stiffness: 700 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleHoverStart = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                setIsHovered(true);
            }
        };

        const handleHoverEnd = () => {
            setIsHovered(false);
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleHoverStart);
        window.addEventListener('mouseout', handleHoverEnd);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleHoverStart);
            window.removeEventListener('mouseout', handleHoverEnd);
        };
    }, [cursorX, cursorY]);

    return (
        <>
            <motion.div
                className="cursor-dot"
                style={{
                    translateX: cursorXSpring,
                    translateY: cursorYSpring,
                }}
            />
            <motion.div
                className="cursor-outline"
                style={{
                    translateX: cursorXSpring,
                    translateY: cursorYSpring,
                }}
                animate={{
                    scale: isHovered ? 1.5 : 1,
                    backgroundColor: isHovered ? "rgba(255, 255, 255, 0.1)" : "transparent",
                    borderColor: isHovered ? "transparent" : "rgba(255, 255, 255, 0.5)"
                }}
                transition={{ duration: 0.15 }}
            />
        </>
    );
};
