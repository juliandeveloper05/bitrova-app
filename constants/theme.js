/**
 * Task List App 2026 - Theme System
 * Premium Dark Mode with Glassmorphism
 */

export const colors = {
  // Backgrounds
  bgPrimary: '#0A0A0F',
  bgSecondary: '#12121A',
  bgTertiary: '#1A1A2E',
  
  // Glassmorphism
  glassLight: 'rgba(255, 255, 255, 0.05)',
  glassMedium: 'rgba(255, 255, 255, 0.08)',
  glassStrong: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Primary Gradient (Purple to Cyan)
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  
  // Accent Colors
  accentCyan: '#00D9FF',
  accentPurple: '#A855F7',
  accentPink: '#EC4899',
  accentBlue: '#3B82F6',
  
  // Priority Colors
  priorityHigh: '#EF4444',
  priorityMedium: '#F59E0B',
  priorityLow: '#10B981',
  
  // Category Colors
  categoryWork: '#3B82F6',
  categoryPersonal: '#EC4899',
  categoryShopping: '#F59E0B',
  categoryHealth: '#10B981',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.3)',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  // Font families (using system fonts for performance)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  
  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
};

// Animation presets for Reanimated
export const animations = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
  springGentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

// Category configuration with icons and colors
export const categories = {
  all: {
    id: 'all',
    name: 'Todas',
    icon: 'apps',
    color: colors.accentPurple,
  },
  work: {
    id: 'work',
    name: 'Trabajo',
    icon: 'briefcase',
    color: colors.categoryWork,
  },
  personal: {
    id: 'personal',
    name: 'Personal',
    icon: 'heart',
    color: colors.categoryPersonal,
  },
  shopping: {
    id: 'shopping',
    name: 'Compras',
    icon: 'cart',
    color: colors.categoryShopping,
  },
  health: {
    id: 'health',
    name: 'Salud',
    icon: 'fitness',
    color: colors.categoryHealth,
  },
};

// Priority configuration
export const priorities = {
  high: {
    id: 'high',
    name: 'Alta',
    color: colors.priorityHigh,
    icon: 'arrow-up-circle',
  },
  medium: {
    id: 'medium',
    name: 'Media',
    color: colors.priorityMedium,
    icon: 'remove-circle',
  },
  low: {
    id: 'low',
    name: 'Baja',
    color: colors.priorityLow,
    icon: 'arrow-down-circle',
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animations,
  categories,
  priorities,
};
