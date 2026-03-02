import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useOrganization } from '../context/OrganizationContext';
import { spacing, typography } from '../constants/theme';
import { BlurView } from 'expo-blur';
import { GlassCard } from './GlassCard';

export default function OrganizationSwitcher() {
  const { colors, isDarkMode } = useTheme();
  const { 
    organizations, 
    currentOrganization, 
    setCurrentOrganization, 
    createOrganization,
    loading
  } = useOrganization();

  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback name if no org
  const displayName = currentOrganization?.name || 'Espacio Personal';

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      Alert.alert('Error', 'El nombre de la organización no puede estar vacío');
      return;
    }

    try {
      setIsSubmitting(true);
      await createOrganization({ name: newOrgName.trim() });
      setNewOrgName('');
      setIsCreating(false);
      setModalVisible(false); // Close everything on success
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la organización: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOrg = async (orgId) => {
    await setCurrentOrganization(orgId);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Trigger Button */}
      <TouchableOpacity 
        style={[styles.triggerButton, { 
          backgroundColor: colors.glassMedium,
          borderColor: colors.glassBorder 
        }]}
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.triggerText, { color: colors.textSecondary }]}>
          {loading ? 'Cargando...' : displayName}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Switcher Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setIsCreating(false);
        }}
      >
        <BlurView 
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint={isDarkMode ? 'dark' : 'light'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <GlassCard style={styles.card}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {isCreating ? 'Nueva Organización' : 'Cambiar de Espacio'}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    if (isCreating) {
                      setIsCreating(false);
                    } else {
                      setModalVisible(false);
                    }
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name={isCreating ? "arrow-back" : "close"} size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {isCreating ? (
                // Create Organization Form
                <View style={styles.formContainer}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Nombre de la organización
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        color: colors.textPrimary,
                        backgroundColor: colors.bgSecondary,
                        borderColor: colors.glassBorder
                      }
                    ]}
                    placeholder="Ej. Mi Equipo, Proyecto X..."
                    placeholderTextColor={colors.textTertiary}
                    value={newOrgName}
                    onChangeText={setNewOrgName}
                    autoFocus
                  />
                  
                  <TouchableOpacity 
                    style={[
                      styles.submitButton, 
                      { backgroundColor: colors.accentPurple },
                      (!newOrgName.trim() || isSubmitting) && { opacity: 0.5 }
                    ]}
                    onPress={handleCreateOrg}
                    disabled={!newOrgName.trim() || isSubmitting}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSubmitting ? 'Creando...' : 'Crear Organización'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // List of Organizations
                <>
                  <FlatList
                    data={organizations}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    renderItem={({ item }) => {
                      const isSelected = currentOrganization?.id === item.id;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.orgItem,
                            isSelected && { backgroundColor: `${colors.accentPurple}20` },
                            { borderColor: colors.glassBorder }
                          ]}
                          onPress={() => handleSelectOrg(item.id)}
                        >
                          <View style={styles.orgItemLeft}>
                            <View style={[
                              styles.orgIcon,
                              { backgroundColor: isSelected ? colors.accentPurple : colors.bgSecondary }
                            ]}>
                              <Text style={[
                                styles.orgIconText,
                                { color: isSelected ? 'white' : colors.textPrimary }
                              ]}>
                                {item.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <Text style={[styles.orgName, { color: colors.textPrimary }]}>
                                {item.name}
                              </Text>
                              <Text style={[styles.orgRole, { color: colors.textTertiary }]}>
                                Rol: {item.role}
                              </Text>
                            </View>
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.accentPurple} />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={() => (
                      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                        No perteneces a ninguna organización aún.
                      </Text>
                    )}
                  />

                  <TouchableOpacity 
                    style={[styles.createButton, { borderColor: colors.glassBorder }]}
                    onPress={() => setIsCreating(true)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.accentPurple} />
                    <Text style={[styles.createButtonText, { color: colors.accentPurple }]}>
                      Crear nueva organización
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </GlassCard>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xl,
    borderWidth: 1,
    gap: spacing.xs,
  },
  triggerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  card: {
    padding: spacing.lg,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  list: {
    maxHeight: 300,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  orgItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgIconText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  orgName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  orgRole: {
    fontSize: typography.fontSize.xs,
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.lg,
    fontSize: typography.fontSize.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    marginTop: spacing.sm,
  },
  createButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  formContainer: {
    gap: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: spacing.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
  },
  submitButton: {
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonText: {
    color: 'white',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
