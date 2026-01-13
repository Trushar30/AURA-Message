import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({ children, onClick, className = '' }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { width, height, left, top } = ref.current!.getBoundingClientRect();

        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);

        setPosition({ x: x * 0.3, y: y * 0.3 }); // 0.3 strength
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <motion.button
            ref={ref}
            className={className}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            {children}
        </motion.button>
    );
};
