import React, { createContext, useState, useEffect, useContext } from 'react';

/**
 * AccessibilityContext (WCAG 2.2 AA Compliance - Melhorias 65, 67, 69, 72)
 * 
 * Architectural Intent:
 * Centralizes accessibility settings and DOM attribute manipulation in a single
 * reactive provider with localStorage persistence. Prevents layout regressions
 * by cleanly injecting data attributes onto the document element.
 */
const AccessibilityContext = createContext();

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility deve ser utilizado dentro de AccessibilityProvider');
    }
    return context;
};

export const AccessibilityProvider = ({ children }) => {
    // 1. Alto Contraste Extremo (#000000 e #FFFF00)
    const [highContrast, setHighContrast] = useState(() => {
        return localStorage.getItem('a11y_contrast') === 'high';
    });

    // 2. Escalonamento de Fonte ('normal' = 100%, 'medium' = 115%, 'large' = 130%)
    const [fontScale, setFontScale] = useState(() => {
        return localStorage.getItem('a11y_font_scale') || 'normal';
    });

    // 3. Modo Daltônico ('none', 'protanopia', 'deuteranopia', 'tritanopia')
    const [colorblindMode, setColorblindMode] = useState(() => {
        return localStorage.getItem('a11y_colorblind') || 'none';
    });

    // 4. Pausa de Animações Contínuas
    const [animationsPaused, setAnimationsPaused] = useState(() => {
        return localStorage.getItem('a11y_animations_paused') === 'true';
    });

    // Efeito para sincronizar os data-attributes no <html>
    useEffect(() => {
        const root = document.documentElement;

        // Alto Contraste
        if (highContrast) {
            root.setAttribute('data-a11y-contrast', 'high');
            localStorage.setItem('a11y_contrast', 'high');
        } else {
            root.removeAttribute('data-a11y-contrast');
            localStorage.setItem('a11y_contrast', 'normal');
        }

        // Fonte
        if (fontScale !== 'normal') {
            root.setAttribute('data-font-scale', fontScale);
            localStorage.setItem('a11y_font_scale', fontScale);
        } else {
            root.removeAttribute('data-font-scale');
            localStorage.setItem('a11y_font_scale', 'normal');
        }

        // Daltônicos
        if (colorblindMode !== 'none') {
            root.setAttribute('data-colorblind', colorblindMode);
            localStorage.setItem('a11y_colorblind', colorblindMode);
        } else {
            root.removeAttribute('data-colorblind');
            localStorage.setItem('a11y_colorblind', 'none');
        }

        // Pausa de Animações
        if (animationsPaused) {
            root.setAttribute('data-animations-paused', 'true');
            localStorage.setItem('a11y_animations_paused', 'true');
        } else {
            root.removeAttribute('data-animations-paused');
            localStorage.setItem('a11y_animations_paused', 'false');
        }
    }, [highContrast, fontScale, colorblindMode, animationsPaused]);

    const toggleHighContrast = () => setHighContrast(prev => !prev);

    const cycleFontScale = () => {
        setFontScale(prev => {
            if (prev === 'normal') return 'medium';
            if (prev === 'medium') return 'large';
            return 'normal';
        });
    };

    const toggleAnimationsPaused = () => setAnimationsPaused(prev => !prev);

    return (
        <AccessibilityContext.Provider
            value={{
                highContrast,
                toggleHighContrast,
                fontScale,
                cycleFontScale,
                setFontScale,
                colorblindMode,
                setColorblindMode,
                animationsPaused,
                toggleAnimationsPaused,
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
};