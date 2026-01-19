/**
 * Header - App Header with Personalized Greeting
 * Bitrova 2026
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing, typography } from '../constants/theme';

export default function Header() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, getDisplayName } = useAuth();
  
  const today = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const formattedDate = today.toLocaleDateString('es-ES', options);
  
  // Capitalize first letter
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
  // Get greeting based on time of day
  const hour = today.getHours();
  let greeting = 'Buenos días';
  if (hour >= 12 && hour < 18) greeting = 'Buenas tardes';
  if (hour >= 18) greeting = 'Buenas noches';
  
  // Get user's first name
  const userName = getDisplayName ? getDisplayName().split(' ')[0] : '';

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeInDown.delay(100).springify()}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          {greeting}{userName ? `, ${userName}` : ''} 👋
        </Text>
        <Text style={[styles.date, { color: colors.textPrimary }]}>{displayDate}</Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        {/* Kanban Board Button */}
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}
          onPress={() => router.push('/kanban')}
          activeOpacity={0.7}
        >
          <Ionicons name="grid" size={22} color={colors.accentBlue} />
        </TouchableOpacity>

        {/* Stats Button */}
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}
          onPress={() => router.push('/stats')}
          activeOpacity={0.7}
        >
          <Ionicons name="stats-chart" size={22} color={colors.accentPurple} />
        </TouchableOpacity>
        
        {/* Settings Button */}
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  
  textContainer: {
    flex: 1,
  },
  
  greeting: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  
  date: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});