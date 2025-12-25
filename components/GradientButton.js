/**
 * GradientButton - Animated Gradient Button
 * Task List App 2026
 */

import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GradientButton({ 
  title, 
  onPress, 
  icon,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  size = 'medium', // 'small' | 'medium' | 'large'
  disabled = false,
  style,
}) {
  const scale = useSharedValue(1);
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const sizeStyles = {
    small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
    large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
  };
  
  const fontSizes = {
    small: typography.fontSize.sm,
    medium: typography.fontSize.md,
    large: typography.fontSize.lg,
  };

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        style={[animatedStyle, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            sizeStyles[size],
            disabled && styles.disabled,
          ]}
        >
          {icon}
          <Text style={[styles.text, { fontSize: fontSizes[size] }]}>
            {title}
          </Text>
        </LinearGradient>
      </AnimatedPressable>
    );
  }
  
  return (
    <AnimatedPressable
      style={[
        styles.secondary,
        sizeStyles[size],
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
      <Text style={[
        styles.text, 
        { fontSize: fontSizes[size] },
        variant === 'ghost' && styles.ghostText,
      ]}>
        {title}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    ...shadows.md,
  },
  
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassMedium,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.sm,
  },
  
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  
  text: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  ghostText: {
    color: colors.textSecondary,
  },
  
  disabled: {
    opacity: 0.5,
  },
});
