/**
 * DatePickerButton - Due Date Selector
 * Task List App 2026
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

// Safe haptics wrapper for web compatibility
const safeHaptics = {
  impact: (style) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  },
  notification: (type) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(type);
    }
  }
};

export default function DatePickerButton({ value, onChange, placeholder = "Sin fecha límite" }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());
  
  const handlePress = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setShowPicker(true);
  };
  
  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      setTempDate(selectedDate || tempDate);
    }
  };
  
  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
  };
  
  const handleCancel = () => {
    setShowPicker(false);
    setTempDate(value || new Date());
  };
  
  const handleClear = () => {
    onChange(null);
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return null;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Hoy';
    if (isTomorrow) return 'Mañana';
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };
  
  // Check if date is overdue
  const isOverdue = value && value < new Date() && value.toDateString() !== new Date().toDateString();
  
  return (
    <>
      <Pressable 
        style={[
          styles.button,
          value && styles.buttonActive,
          isOverdue && styles.buttonOverdue,
        ]} 
        onPress={handlePress}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={value ? "calendar" : "calendar-outline"} 
            size={20} 
            color={isOverdue ? colors.error : value ? colors.accentCyan : colors.textTertiary} 
          />
        </View>
        
        <Text style={[
          styles.text,
          value && styles.textActive,
          isOverdue && styles.textOverdue,
        ]}>
          {formatDate(value) || placeholder}
        </Text>
        
        {value && (
          <Pressable 
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </Pressable>
      
      {/* iOS Modal Picker */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showPicker}
          onRequestClose={handleCancel}
        >
          <Pressable style={styles.overlay} onPress={handleCancel}>
            <Animated.View 
              style={styles.pickerContainer}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <View style={styles.pickerHeader}>
                <Pressable onPress={handleCancel}>
                  <Text style={styles.pickerCancelText}>Cancelar</Text>
                </Pressable>
                <Text style={styles.pickerTitle}>Fecha límite</Text>
                <Pressable onPress={handleConfirm}>
                  <Text style={styles.pickerConfirmText}>Confirmar</Text>
                </Pressable>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={new Date()}
                textColor={colors.textPrimary}
                themeVariant="dark"
                style={styles.picker}
              />
            </Animated.View>
          </Pressable>
        </Modal>
      )}
      
      {/* Android Picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={new Date()}
        />
      )}
      
      {/* Web fallback */}
      {Platform.OS === 'web' && showPicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showPicker}
          onRequestClose={handleCancel}
        >
          <Pressable style={styles.overlay} onPress={handleCancel}>
            <Animated.View 
              style={styles.webPickerContainer}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text style={styles.pickerTitle}>Seleccionar fecha</Text>
              <input
                type="date"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.glassBorder}`,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: 16,
                  marginVertical: spacing.lg,
                }}
                min={new Date().toISOString().split('T')[0]}
                defaultValue={tempDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  onChange(newDate);
                  setShowPicker(false);
                }}
              />
              <Pressable style={styles.webCancelButton} onPress={handleCancel}>
                <Text style={styles.pickerCancelText}>Cancelar</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.glassMedium,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.sm,
  },
  
  buttonActive: {
    backgroundColor: colors.accentCyan + '15',
    borderColor: colors.accentCyan + '40',
  },
  
  buttonOverdue: {
    backgroundColor: colors.error + '15',
    borderColor: colors.error + '40',
  },
  
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  text: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
  },
  
  textActive: {
    color: colors.accentCyan,
    fontWeight: typography.fontWeight.medium,
  },
  
  textOverdue: {
    color: colors.error,
  },
  
  clearButton: {
    padding: spacing.xs,
  },
  
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  
  pickerContainer: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xxl,
  },
  
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  
  pickerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  pickerCancelText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  
  pickerConfirmText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accentCyan,
  },
  
  picker: {
    height: 200,
  },
  
  // Web picker
  webPickerContainer: {
    backgroundColor: colors.bgSecondary,
    margin: spacing.xl,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  
  webCancelButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
});
