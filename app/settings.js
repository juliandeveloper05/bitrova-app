/**
 * Settings Screen - Task List App 2025
 * Premium Configuration Interface with Glassmorphism
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { TaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius } from '../constants/theme';

// Setting item component
const SettingItem = ({ 
  icon, 
  iconColor, 
  title, 
  subtitle, 
  onPress, 
  rightElement,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  delay = 0,
  colors 
}) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()}>
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: colors.glassLight, borderColor: colors.glassBorder }]} 
      onPress={onPress}
      activeOpacity={isSwitch ? 1 : 0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.glassMedium, true: colors.accentPurple }}
          thumbColor={switchValue ? colors.white : colors.textSecondary}
          ios_backgroundColor={colors.glassMedium}
        />
      ) : rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  </Animated.View>
);

// Section header component
const SectionHeader = ({ title, delay = 0, colors }) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()}>
    <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>{title}</Text>
  </Animated.View>
);

export default function Settings() {
  const router = useRouter();
  const { tasks, notificationsEnabled } = useContext(TaskContext);
  const { isDarkMode, toggleTheme, colors } = useTheme();
  
  // Local settings state
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoDeleteCompleted, setAutoDeleteCompleted] = useState(false);
  const [showBadgeCount, setShowBadgeCount] = useState(true);

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  // Handle clear completed tasks
  const handleClearCompleted = () => {
    const completedCount = tasks.filter(t => t.completed).length;
    
    if (completedCount === 0) {
      Alert.alert('Sin tareas', 'No hay tareas completadas para eliminar.');
      return;
    }

    Alert.alert(
      'Eliminar completadas',
      `¿Estás seguro de que deseas eliminar ${completedCount} tarea${completedCount > 1 ? 's' : ''} completada${completedCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear completed in TaskContext
            Alert.alert('Éxito', 'Tareas completadas eliminadas.');
          }
        },
      ]
    );
  };

  // Handle clear all data
  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Eliminar todos los datos',
      'Esta acción eliminará todas tus tareas de forma permanente. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar todo', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear all in TaskContext
            Alert.alert('Datos eliminados', 'Todos los datos han sido eliminados.');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.bgPrimary} />
      
      {/* Header */}
      <Animated.View 
        style={[styles.header, { backgroundColor: colors.bgPrimary }]}
        entering={FadeInDown.delay(100).springify()}
      >
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.glassMedium }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Configuración</Text>
        
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <Animated.View 
          style={[styles.profileCard, { backgroundColor: colors.glassLight, borderColor: colors.glassBorder }]}
          entering={FadeInUp.delay(150).springify()}
        >
          <LinearGradient
            colors={[colors.accentPurple, colors.accentPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarEmoji}>👤</Text>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>Usuario</Text>
            <Text style={[styles.profileStats, { color: colors.textSecondary }]}>
              {totalTasks} tareas · {completedTasks} completadas
            </Text>
          </View>
          
          <TouchableOpacity style={[styles.editProfileButton, { backgroundColor: colors.glassMedium }]}>
            <Ionicons name="pencil" size={18} color={colors.accentPurple} />
          </TouchableOpacity>
        </Animated.View>

        {/* Notifications Section */}
        <SectionHeader title="NOTIFICACIONES" delay={200} colors={colors} />
        
        <SettingItem
          icon="notifications"
          iconColor={colors.accentCyan}
          title="Notificaciones"
          subtitle={notificationsEnabled ? 'Activadas' : 'Desactivadas'}
          delay={220}
          colors={colors}
          rightElement={
            <View style={[
              styles.statusBadge, 
              { backgroundColor: notificationsEnabled ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: notificationsEnabled ? colors.success : colors.error }
              ]}>
                {notificationsEnabled ? 'ON' : 'OFF'}
              </Text>
            </View>
          }
        />

        <SettingItem
          icon="alarm"
          iconColor={colors.accentPink}
          title="Recordatorios"
          subtitle="Recordar antes de la fecha límite"
          delay={240}
          colors={colors}
          isSwitch
          switchValue={showBadgeCount}
          onSwitchChange={setShowBadgeCount}
        />

        <SettingItem
          icon="notifications-circle"
          iconColor={colors.accentBlue}
          title="Mostrar insignia"
          subtitle="Contador de tareas pendientes"
          delay={260}
          colors={colors}
          isSwitch
          switchValue={showBadgeCount}
          onSwitchChange={setShowBadgeCount}
        />

        {/* Appearance Section */}
        <SectionHeader title="APARIENCIA" delay={300} colors={colors} />
        
        <SettingItem
          icon={isDarkMode ? "moon" : "sunny"}
          iconColor={colors.accentPurple}
          title="Modo oscuro"
          subtitle={isDarkMode ? "Interfaz con tema oscuro" : "Interfaz con tema claro"}
          delay={320}
          colors={colors}
          isSwitch
          switchValue={isDarkMode}
          onSwitchChange={toggleTheme}
        />

        <SettingItem
          icon="color-palette"
          iconColor={colors.categoryShopping}
          title="Tema de color"
          subtitle="Púrpura"
          onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto.')}
          delay={340}
          colors={colors}
        />

        <SettingItem
          icon="text"
          iconColor={colors.categoryWork}
          title="Tamaño de fuente"
          subtitle="Mediano"
          onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto.')}
          delay={360}
          colors={colors}
        />

        {/* Behavior Section */}
        <SectionHeader title="COMPORTAMIENTO" delay={400} colors={colors} />

        <SettingItem
          icon="phone-portrait"
          iconColor={colors.success}
          title="Vibración"
          subtitle="Retroalimentación háptica"
          delay={420}
          colors={colors}
          isSwitch
          switchValue={hapticFeedback}
          onSwitchChange={setHapticFeedback}
        />

        <SettingItem
          icon="volume-high"
          iconColor={colors.accentCyan}
          title="Efectos de sonido"
          subtitle="Sonidos de la aplicación"
          delay={440}
          colors={colors}
          isSwitch
          switchValue={soundEffects}
          onSwitchChange={setSoundEffects}
        />

        <SettingItem
          icon="trash-bin"
          iconColor={colors.warning}
          title="Auto-eliminar completadas"
          subtitle="Eliminar después de 7 días"
          delay={460}
          colors={colors}
          isSwitch
          switchValue={autoDeleteCompleted}
          onSwitchChange={setAutoDeleteCompleted}
        />

        {/* Data Section */}
        <SectionHeader title="DATOS" delay={500} colors={colors} />

        <SettingItem
          icon="cloud-upload"
          iconColor={colors.accentBlue}
          title="Copia de seguridad"
          subtitle="Sincronizar con la nube"
          onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto.')}
          delay={520}
          colors={colors}
        />

        <SettingItem
          icon="download"
          iconColor={colors.categoryHealth}
          title="Exportar datos"
          subtitle="Descargar como archivo"
          onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto.')}
          delay={540}
          colors={colors}
        />

        <SettingItem
          icon="checkmark-done"
          iconColor={colors.warning}
          title="Limpiar completadas"
          subtitle={`${completedTasks} tareas completadas`}
          onPress={handleClearCompleted}
          delay={560}
          colors={colors}
        />

        <SettingItem
          icon="warning"
          iconColor={colors.error}
          title="Eliminar todos los datos"
          subtitle="Acción irreversible"
          onPress={handleClearAllData}
          delay={580}
          colors={colors}
        />

        {/* About Section */}
        <SectionHeader title="ACERCA DE" delay={600} colors={colors} />

        <SettingItem
          icon="information-circle"
          iconColor={colors.accentPurple}
          title="Versión"
          subtitle="2.0.0 (2025)"
          delay={620}
          colors={colors}
          rightElement={
            <View style={[styles.versionBadge, { backgroundColor: colors.accentPurple + '30' }]}>
              <Text style={[styles.versionText, { color: colors.accentPurple }]}>Nueva</Text>
            </View>
          }
        />

        <SettingItem
          icon="star"
          iconColor={colors.categoryShopping}
          title="Calificar la app"
          subtitle="Déjanos tu opinión"
          onPress={() => Alert.alert('¡Gracias!', 'Te agradecemos tu apoyo.')}
          delay={640}
          colors={colors}
        />

        <SettingItem
          icon="mail"
          iconColor={colors.categoryWork}
          title="Contacto"
          subtitle="Reportar un problema"
          onPress={() => Alert.alert('Contacto', 'soporte@tasklist.app')}
          delay={660}
          colors={colors}
        />

        <SettingItem
          icon="document-text"
          iconColor={colors.textSecondary}
          title="Términos y privacidad"
          subtitle="Políticas de uso"
          onPress={() => Alert.alert('Próximamente', 'Esta sección estará disponible pronto.')}
          delay={680}
          colors={colors}
        />

        {/* Footer */}
        <Animated.View 
          style={styles.footer}
          entering={FadeInUp.delay(700).springify()}
        >
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>Task List App 2025</Text>
          <Text style={[styles.madeWith, { color: colors.textSecondary }]}>Hecho con 💜 por Julian Javier Soto</Text>
          
          {/* Social Media Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#E4405F20', borderColor: colors.glassBorder }]}
              onPress={() => Linking.openURL('https://www.instagram.com/palee_0x71/?hl=es-la')}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-instagram" size={24} color="#E4405F" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#0A66C220', borderColor: colors.glassBorder }]}
              onPress={() => Linking.openURL('https://www.linkedin.com/in/full-stack-julian-soto/')}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: isDarkMode ? '#FFFFFF15' : '#00000015', borderColor: colors.glassBorder }]}
              onPress={() => Linking.openURL('https://github.com/juliandeveloper05')}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-github" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xxxl : spacing.xl,
    paddingBottom: spacing.lg,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },

  headerRight: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },

  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarEmoji: {
    fontSize: 28,
  },

  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },

  profileStats: {
    fontSize: typography.fontSize.sm,
  },

  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Header
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1.5,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  settingTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },

  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },

  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },

  // Version Badge
  versionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },

  versionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginTop: spacing.lg,
  },

  footerText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },

  madeWith: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },

  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },

  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});