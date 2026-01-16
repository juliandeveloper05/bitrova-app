/**
 * RecurringActionModal - Scope selection modal for recurring tasks
 * Task List App 2026
 * 
 * Shows options when editing/deleting a recurring task:
 * - This instance only
 * - This and future instances
 * - All instances
 */

import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown, 
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Scope option button component
 */
const ScopeOption = ({ 
  id, 
  icon, 
  title, 
  description, 
  count, 
  selected, 
  onPress, 
  colors 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.scopeOption,
        { 
          backgroundColor: selected ? colors.accentCyan + '15' : colors.glassMedium,
          borderColor: selected ? colors.accentCyan : colors.glassBorder,
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[
        styles.radioCircle,
        { 
          borderColor: selected ? colors.accentCyan : colors.textTertiary,
          backgroundColor: selected ? colors.accentCyan : 'transparent',
        }
      ]}>
        {selected && (
          <View style={[styles.radioInner, { backgroundColor: colors.bgPrimary }]} />
        )}
      </View>
      
      <View style={styles.scopeContent}>
        <View style={styles.scopeTitleRow}>
          <Ionicons 
            name={icon} 
            size={18} 
            color={selected ? colors.accentCyan : colors.textSecondary} 
          />
          <Text style={[
            styles.scopeTitle,
            { color: selected ? colors.accentCyan : colors.textPrimary }
          ]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.scopeDescription, { color: colors.textTertiary }]}>
          {description}
        </Text>
      </View>
      
      <View style={[styles.countBadge, { backgroundColor: colors.glassLight }]}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {count}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

/**
 * RecurringActionModal component
 * @param {Object} props
 * @param {boolean} props.visible - Modal visibility
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onConfirm - Confirm callback with scope
 * @param {string} props.action - 'edit' or 'delete'
 * @param {Object} props.counts - { this: 1, future: N, all: M }
 */
const RecurringActionModal = ({ 
  visible, 
  onClose, 
  onConfirm,
  action = 'edit',
  counts = { this: 1, future: 1, all: 1 },
}) => {
  const { colors } = useTheme();
  const [selectedScope, setSelectedScope] = useState('this');

  const isDelete = action === 'delete';
  const title = isDelete ? '¿Eliminar tarea recurrente?' : 'Editar tarea recurrente';
  const confirmLabel = isDelete ? 'Eliminar' : 'Continuar';
  const confirmColor = isDelete ? colors.error : colors.accentCyan;

  const scopes = [
    {
      id: 'this',
      icon: 'radio-button-on-outline',
      title: 'Solo esta tarea',
      description: 'Las demás instancias no se verán afectadas',
      count: counts.this || 1,
    },
    {
      id: 'future',
      icon: 'arrow-forward-outline',
      title: 'Esta y futuras',
      description: 'Las tareas pasadas se mantendrán',
      count: counts.future || 1,
    },
    {
      id: 'all',
      icon: 'layers-outline',
      title: 'Todas las tareas',
      description: 'Se afectará toda la serie',
      count: counts.all || 1,
    },
  ];

  const handleConfirm = () => {
    onConfirm(selectedScope);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        
        <Animated.View 
          style={[styles.modalContent, { backgroundColor: colors.bgSecondary }]}
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.duration(200)}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accentCyan + '20' }]}>
              <Ionicons name="repeat" size={24} color={colors.accentCyan} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              ¿Qué instancias deseas {isDelete ? 'eliminar' : 'modificar'}?
            </Text>
          </View>

          {/* Scope Options */}
          <View style={styles.scopeContainer}>
            {scopes.map((scope) => (
              <ScopeOption
                key={scope.id}
                {...scope}
                selected={selectedScope === scope.id}
                onPress={() => setSelectedScope(scope.id)}
                colors={colors}
              />
            ))}
          </View>

          {/* Warning for delete all */}
          {isDelete && selectedScope === 'all' && (
            <Animated.View 
              style={[styles.warningBanner, { backgroundColor: colors.error + '15' }]}
              entering={FadeIn.duration(200)}
            >
              <Ionicons name="warning" size={18} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                Esta acción no se puede deshacer
              </Text>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.cancelButton, { borderColor: colors.glassBorder }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.confirmButton, 
                { backgroundColor: confirmColor }
              ]}
              onPress={handleConfirm}
            >
              <Text style={[styles.confirmText, { color: colors.white }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  scopeContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  scopeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scopeContent: {
    flex: 1,
  },
  scopeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  scopeTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  scopeDescription: {
    fontSize: typography.fontSize.sm,
    marginLeft: 26,
  },
  countBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  countText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default RecurringActionModal;
