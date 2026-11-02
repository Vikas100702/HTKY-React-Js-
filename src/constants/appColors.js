/**
 * @file src/constants/appColors.js
 * @description Centralized color definitions for the application. 
 * This file acts as the single source for JS-based styling logic (if needed outside Tailwind)
 * and should ideally mirror your tailwind.config.js theme settings.
 * Uses Object.freeze() to prevent memory leaks or runtime mutations 
 * ensuring a crash-free, predictable state.
 */

export const APP_COLORS = Object.freeze({
    // Brand Colors
    // primary: '#00527e',
    primary: '#7E0000',
    primaryDark: '#B45309',
    secondary: '#FBBF24',

    // Background & Surface
    background: '#FFFFFF',
    surfaceLight: '#FFFBEB',
    // surfaceDark: '#00527e',
    surfaceDark: '#7E0000',
    surfaceOverlay: 'rgba(0, 0, 0, 0.5)',

    // Text Colors
    textPrimary: '#171717',
    textSecondary: '#525252',
    // textBrandPrimary: '#00527e',
    textBrandPrimary: '#7E0000',
    textInverse: '#FFFFFF',
    textAccentGold: '#FEF3C7',

    // Semantic/Status Colors
    activeState: '#F59E0B',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#F59E0B',
    info: '#2563EB',

    // Borders & Dividers
    border: '#E7E5E4',
    divider: '#D6D3D1',
});