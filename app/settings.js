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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { TaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useTheme, colorThemes, fontSizeScales } from '../context/ThemeContext';
import { spacing, typography, borderRadius } from '../constants/theme';
import ColorThemePicker from '../components/ColorThemePicker';
import { useAutoSavePreference } from '../hooks/useAutoSave';

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
  const { tasks, notificationsEnabled, clearCompletedTasks, clearAllData } = useContext(TaskContext);
  const { isDarkMode, toggleTheme, colors, selectedColorTheme, selectedFontSize, setFontSize } = useTheme();
  const { signOut, user, getDisplayName } = useAuth();
  
  // Font size modal state
  const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
  
  // Local settings state
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoDeleteCompleted, setAutoDeleteCompleted] = useState(false);
  const [showBadgeCount, setShowBadgeCount] = useState(true);
  
  // Auto-save preference (persistent)
  const { autoSaveEnabled, setAutoSaveEnabled } = useAutoSavePreference();

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

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
          onPress: async () => {
            await clearCompletedTasks();
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
          onPress: async () => {
            await clearAllData();
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

        <Animated.View 
          style={[styles.themePickerCard, { backgroundColor: colors.glassLight, borderColor: colors.glassBorder }]}
          entering={FadeInUp.delay(340).springify()}
        >
          <View style={styles.themePickerHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.categoryShopping}20` }]}>
              <Ionicons name="color-palette" size={22} color={colors.categoryShopping} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Tema de color</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                {colorThemes[selectedColorTheme]?.name || 'Púrpura'}
              </Text>
            </View>
          </View>
          <ColorThemePicker style={styles.colorPicker} />
        </Animated.View>

        <SettingItem
          icon="text"
          iconColor={colors.categoryWork}
          title="Tamaño de fuente"
          subtitle={fontSizeScales[selectedFontSize]?.name || 'Mediano'}
          onPress={() => setFontSizeModalVisible(true)}
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

        <SettingItem
          icon="save"
          iconColor={colors.success}
          title="Auto-guardado"
          subtitle="Guardar cambios automáticamente"
          delay={480}
          colors={colors}
          isSwitch
          switchValue={autoSaveEnabled}
          onSwitchChange={setAutoSaveEnabled}
        />

        {/* Data Section */}
        <SectionHeader title="DATOS" delay={500} colors={colors} />

        <SettingItem
          icon="cloud-upload"
          iconColor={colors.accentBlue}
          title="Copia de seguridad"
          subtitle="Sincronizar con la nube"
          onPress={() => router.push('/cloud-backup')}
          delay={520}
          colors={colors}
        />

        <SettingItem
          icon="download"
          iconColor={colors.categoryHealth}
          title="Exportar / Importar datos"
          subtitle="Respaldo y restauración de tareas"
          onPress={() => router.push('/data-management')}
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

        {/* Session Section */}
        <SectionHeader title="SESIÓN" delay={700} colors={colors} />
        
        <SettingItem
          icon="person-circle"
          iconColor={colors.accentPurple}
          title={getDisplayName ? getDisplayName() : 'Usuario'}
          subtitle={user?.email || 'No conectado'}
          onPress={() => Alert.alert(
            'Tu cuenta',
            `Nombre: ${getDisplayName ? getDisplayName() : 'Usuario'}\nEmail: ${user?.email || 'No conectado'}`,
            [{ text: 'OK' }]
          )}
          delay={720}
          colors={colors}
        />

        <Animated.View entering={FadeInUp.delay(740).springify()}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}
            onPress={() => {
              Alert.alert(
                'Cerrar sesión',
                '¿Estás seguro de que deseas cerrar sesión?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Cerrar sesión', 
                    style: 'destructive',
                    onPress: async () => {
                      await signOut();
                    }
                  }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>

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

      {/* Font Size Modal */}
      <Modal
        visible={fontSizeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFontSizeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFontSizeModalVisible(false)}
        >
          <Animated.View
            entering={FadeInUp.springify()}
            style={[styles.fontSizeModalContent, { backgroundColor: colors.bgSecondary, borderColor: colors.glassBorder }]}
          >
            <Text style={[styles.fontSizeModalTitle, { color: colors.textPrimary }]}>Tamaño de fuente</Text>
            <Text style={[styles.fontSizeModalSubtitle, { color: colors.textSecondary }]}>Ajusta el tamaño del texto en tus tareas</Text>
            
            <View style={styles.fontSizeOptions}>
              {Object.values(fontSizeScales).map((sizeOption) => (
                <TouchableOpacity
                  key={sizeOption.id}
                  style={[
                    styles.fontSizeOption,
                    { 
                      backgroundColor: selectedFontSize === sizeOption.id ? colors.accentPurple + '20' : colors.glassLight,
                      borderColor: selectedFontSize === sizeOption.id ? colors.accentPurple : colors.glassBorder,
                    }
                  ]}
                  onPress={() => {
                    setFontSize(sizeOption.id);
                    setFontSizeModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.fontSizeOptionText,
                    { 
                      fontSize: sizeOption.id === 'small' ? 14 : sizeOption.id === 'large' ? 20 : 17,
                      color: selectedFontSize === sizeOption.id ? colors.accentPurple : colors.textPrimary,
                      fontWeight: selectedFontSize === sizeOption.id ? '700' : '500',
                    }
                  ]}>
                    {sizeOption.name}
                  </Text>
                  <Text style={[
                    styles.fontSizePreview,
                    { 
                      fontSize: sizeOption.id === 'small' ? 11 : sizeOption.id === 'large' ? 15 : 13,
                      color: colors.textSecondary,
                    }
                  ]}>
                    Aa Bb Cc
                  </Text>
                  {selectedFontSize === sizeOption.id && (
                    <View style={[styles.fontSizeCheck, { backgroundColor: colors.accentPurple }]}>
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.fontSizeCloseButton, { backgroundColor: colors.glassMedium }]}
              onPress={() => setFontSizeModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.fontSizeCloseText, { color: colors.textPrimary }]}>Cerrar</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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

  // Theme Picker Card
  themePickerCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },

  themePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  colorPicker: {
    marginTop: spacing.xs,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },

  logoutText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },

  // Font Size Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  fontSizeModalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },

  fontSizeModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  fontSizeModalSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  fontSizeOptions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  fontSizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },

  fontSizeOptionText: {
    flex: 1,
  },

  fontSizePreview: {
    marginRight: spacing.sm,
    opacity: 0.7,
  },

  fontSizeCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fontSizeCloseButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },

  fontSizeCloseText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});