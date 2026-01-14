import { create } from 'zustand';
import { api } from '../services/api';

export interface UserPreferences {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    fontFamily: 'inter' | 'roboto' | 'outfit' | 'poppins' | 'system';
    fontSize: 'small' | 'medium' | 'large';
}

export const defaultPreferences: UserPreferences = {
    theme: 'dark',
    accentColor: '#f59e0b',
    fontFamily: 'inter',
    fontSize: 'medium',
};

// Preset color palettes
export const colorPresets = [
    { name: 'Gold', color: '#f59e0b', hover: '#fbbf24' },
    { name: 'Blue', color: '#3b82f6', hover: '#60a5fa' },
    { name: 'Purple', color: '#8b5cf6', hover: '#a78bfa' },
    { name: 'Green', color: '#22c55e', hover: '#4ade80' },
    { name: 'Rose', color: '#f43f5e', hover: '#fb7185' },
    { name: 'Cyan', color: '#06b6d4', hover: '#22d3ee' },
    { name: 'Orange', color: '#f97316', hover: '#fb923c' },
    { name: 'Pink', color: '#ec4899', hover: '#f472b6' },
];

// Font options
export const fontOptions = [
    { id: 'inter', name: 'Inter', family: "'Inter', sans-serif" },
    { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif" },
    { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif" },
    { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif" },
    { id: 'system', name: 'System Default', family: '-apple-system, BlinkMacSystemFont, sans-serif' },
] as const;

// Font size mappings
const fontSizeMap = {
    small: {
        '--font-size-xs': '0.6875rem',
        '--font-size-sm': '0.75rem',
        '--font-size-base': '0.875rem',
        '--font-size-lg': '1rem',
        '--font-size-xl': '1.125rem',
        '--font-size-2xl': '1.375rem',
        '--font-size-3xl': '1.75rem',
    },
    medium: {
        '--font-size-xs': '0.75rem',
        '--font-size-sm': '0.8125rem',
        '--font-size-base': '0.9375rem',
        '--font-size-lg': '1.0625rem',
        '--font-size-xl': '1.25rem',
        '--font-size-2xl': '1.5rem',
        '--font-size-3xl': '2rem',
    },
    large: {
        '--font-size-xs': '0.875rem',
        '--font-size-sm': '0.9375rem',
        '--font-size-base': '1.0625rem',
        '--font-size-lg': '1.1875rem',
        '--font-size-xl': '1.375rem',
        '--font-size-2xl': '1.625rem',
        '--font-size-3xl': '2.25rem',
    },
};

// Generate accent color variants
function generateAccentVariants(color: string) {
    // Calculate a lighter hover color
    const lighten = (hexColor: string, percent: number) => {
        const num = parseInt(hexColor.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    };

    const hoverColor = lighten(color, 15);
    const subtleColor = `${color}26`; // 15% opacity
    const glowColor = `${color}4D`; // 30% opacity

    return {
        '--color-accent': color,
        '--color-accent-hover': hoverColor,
        '--color-accent-subtle': subtleColor,
        '--color-accent-glow': glowColor,
        '--color-message-sent': `linear-gradient(135deg, ${color} 0%, ${hoverColor} 100%)`,
    };
}

interface ThemeStore {
    preferences: UserPreferences;
    isInitialized: boolean;
    setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
    setPreferences: (prefs: Partial<UserPreferences>) => void;
    initializeFromUser: (prefs?: UserPreferences) => void;
    resetToDefaults: () => void;
    saveToServer: () => Promise<void>;
    applyTheme: () => void;
}

const STORAGE_KEY = 'aura-theme-preferences';

export const useThemeStore = create<ThemeStore>((set, get) => ({
    preferences: { ...defaultPreferences },
    isInitialized: false,

    setPreference: (key, value) => {
        set((state) => ({
            preferences: { ...state.preferences, [key]: value },
        }));
        get().applyTheme();
        // Persist to localStorage immediately
        localStorage.setItem(STORAGE_KEY, JSON.stringify(get().preferences));
    },

    setPreferences: (prefs) => {
        set((state) => ({
            preferences: { ...state.preferences, ...prefs },
        }));
        get().applyTheme();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(get().preferences));
    },

    initializeFromUser: (serverPrefs) => {
        // Try localStorage first, then server prefs, then defaults
        const stored = localStorage.getItem(STORAGE_KEY);
        let prefs = { ...defaultPreferences };

        if (serverPrefs) {
            prefs = { ...prefs, ...serverPrefs };
        }

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                prefs = { ...prefs, ...parsed };
            } catch {
                // Ignore parse errors
            }
        }

        set({ preferences: prefs, isInitialized: true });
        get().applyTheme();
    },

    resetToDefaults: () => {
        set({ preferences: { ...defaultPreferences } });
        get().applyTheme();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences));
    },

    saveToServer: async () => {
        const { preferences } = get();
        try {
            await api.updatePreferences(preferences);
        } catch (error) {
            console.error('Failed to save preferences to server:', error);
        }
    },

    applyTheme: () => {
        const { preferences } = get();
        const root = document.documentElement;

        // Apply accent colors
        const accentVars = generateAccentVariants(preferences.accentColor);
        Object.entries(accentVars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Apply font family
        const font = fontOptions.find((f) => f.id === preferences.fontFamily);
        if (font) {
            root.style.setProperty('--font-family', font.family);
        }

        // Apply font size
        const fontSizes = fontSizeMap[preferences.fontSize];
        Object.entries(fontSizes).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Apply theme mode (light/dark/system)
        const applyMode = (mode: 'dark' | 'light') => {
            if (mode === 'light') {
                root.style.setProperty('--color-bg-primary', '#fafafa');
                root.style.setProperty('--color-bg-secondary', '#ffffff');
                root.style.setProperty('--color-bg-tertiary', '#f4f4f5');
                root.style.setProperty('--color-bg-elevated', '#e4e4e7');
                root.style.setProperty('--color-bg-hover', 'rgba(0, 0, 0, 0.04)');
                root.style.setProperty('--color-surface', 'rgba(255, 255, 255, 0.9)');
                root.style.setProperty('--color-surface-light', 'rgba(244, 244, 245, 0.8)');
                root.style.setProperty('--color-border', 'rgba(0, 0, 0, 0.08)');
                root.style.setProperty('--color-border-hover', 'rgba(0, 0, 0, 0.15)');
                root.style.setProperty('--color-text-primary', '#18181b');
                root.style.setProperty('--color-text-secondary', '#52525b');
                root.style.setProperty('--color-text-tertiary', '#71717a');
                root.style.setProperty('--color-text-muted', '#a1a1aa');
                root.style.setProperty('--color-message-received', 'rgba(244, 244, 245, 0.9)');
            } else {
                root.style.setProperty('--color-bg-primary', '#09090b');
                root.style.setProperty('--color-bg-secondary', '#18181b');
                root.style.setProperty('--color-bg-tertiary', '#27272a');
                root.style.setProperty('--color-bg-elevated', '#3f3f46');
                root.style.setProperty('--color-bg-hover', 'rgba(255, 255, 255, 0.04)');
                root.style.setProperty('--color-surface', 'rgba(24, 24, 27, 0.8)');
                root.style.setProperty('--color-surface-light', 'rgba(39, 39, 42, 0.6)');
                root.style.setProperty('--color-border', 'rgba(255, 255, 255, 0.08)');
                root.style.setProperty('--color-border-hover', 'rgba(255, 255, 255, 0.15)');
                root.style.setProperty('--color-text-primary', '#fafafa');
                root.style.setProperty('--color-text-secondary', '#a1a1aa');
                root.style.setProperty('--color-text-tertiary', '#71717a');
                root.style.setProperty('--color-text-muted', '#52525b');
                root.style.setProperty('--color-message-received', 'rgba(39, 39, 42, 0.9)');
            }
        };

        if (preferences.theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyMode(prefersDark ? 'dark' : 'light');
        } else {
            applyMode(preferences.theme);
        }
    },
}));

// Listen for system theme changes
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const { preferences, applyTheme } = useThemeStore.getState();
        if (preferences.theme === 'system') {
            applyTheme();
        }
    });
}
