/**
 * CategoryFilter - Horizontal Category Chips
 * Task List App 2026
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, categories } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {Object.values(categories).map((category, index) => (
        <CategoryChip
          key={category.id}
          category={category}
          isSelected={selected === category.id}
          onPress={() => onSelect(category.id)}
          delay={index * 50}
        />
      ))}
    </ScrollView>
  );
}

function CategoryChip({ category, isSelected, onPress, delay }) {
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

  return (
    <Animated.View entering={FadeInRight.delay(delay).springify()}>
      <AnimatedPressable
        style={[
          styles.chip,
          isSelected && { 
            backgroundColor: category.color + '30',
            borderColor: category.color,
          },
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Ionicons 
          name={category.icon} 
          size={16} 
          color={isSelected ? category.color : colors.textSecondary} 
        />
        <Text style={[
          styles.chipText,
          isSelected && { color: category.color }
        ]}>
          {category.name}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
});
