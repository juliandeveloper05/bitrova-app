/**
 * Organization Settings Screen
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Manage organization name/slug, members (with role-change), invitations, and danger zone.
 * Spec: Milestone 1 — Organization Settings Screen
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { useTheme } from '../context/ThemeContext';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { useRole, useAssignableRoles, Permission } from '../hooks/usePermission';
import invitationService from '../services/invitationService';
import { canManageRole } from '../services/rbacService';
import { supabase, TABLES } from '../config/supabase';
import { spacing, typography } from '../constants/theme';

// ============================================
// SLUG VALIDATION
// ============================================
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 32;

function validateSlug(slug) {
  if (!slug || slug.length === 0) return 'El slug no puede estar vacío';
  if (slug.length > MAX_SLUG_LENGTH) return `Máximo ${MAX_SLUG_LENGTH} caracteres`;
  if (!SLUG_REGEX.test(slug)) return 'Solo minúsculas, números y guiones (sin espacios ni al inicio/final)';
  return null;
}

// ============================================
// ROLE BADGE COLORS (per spec)
// ============================================
const ROLE_COLORS = {
  owner: '#7C3AED',
  admin: '#2563EB',
  editor: '#059669',
  viewer: '#6B7280',
};

export default function OrganizationSettingsScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const {
    currentOrganization,
    members,
    updateOrganization,
    loadMembers,
    loadOrganizations,
    isOwner,
    isAdmin,
    memberCount,
    isAtMemberLimit,
  } = useOrganization();
  const { role: myRole } = useRole();
  const assignableRoles = useAssignableRoles();

  // --- State ---
  const [activeTab, setActiveTab] = useState('members');
  
  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);

  // Settings state
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [slugError, setSlugError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Role change state
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Initialize edit fields when org loads
  useEffect(() => {
    if (currentOrganization) {
      setEditName(currentOrganization.name || '');
      setEditSlug(currentOrganization.slug || '');
    }
  }, [currentOrganization?.id]);

  // ============================================
  // SUPABASE REALTIME — live member updates
  // ============================================
  useEffect(() => {
    if (!currentOrganization?.id) return;

    const channel = supabase
      .channel(`org_members:${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.MEMBERS,
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          loadMembers(currentOrganization.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization?.id]);

  // ============================================
  // INVITATIONS
  // ============================================
  const loadInvitations = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const invites = await invitationService.getPendingInvitations(currentOrganization.id);
      setPendingInvites(invites);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  }, [currentOrganization?.id]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Ingresá un email');
      return;
    }
    if (isAtMemberLimit) {
      Alert.alert(
        'Límite alcanzado',
        `Tu plan ${currentOrganization?.plan || 'free'} permite ${currentOrganization?.max_members || 3} miembros. Actualizá para invitar más.`
      );
      return;
    }

    setIsInviting(true);
    try {
      await invitationService.createInvitation({
        organizationId: currentOrganization.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        invitedBy: user.id,
      });
      Alert.alert('Invitación enviada', `Se envió la invitación a ${inviteEmail}`);
      setInviteEmail('');
      loadInvitations();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = (inviteId) => {
    Alert.alert('Revocar invitación', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Revocar',
        style: 'destructive',
        onPress: async () => {
          try {
            await invitationService.revokeInvitation(inviteId);
            loadInvitations();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  // ============================================
  // SETTINGS — save name + slug
  // ============================================
  const handleSaveSettings = async () => {
    const slugErr = validateSlug(editSlug);
    if (slugErr) {
      setSlugError(slugErr);
      return;
    }
    setSlugError(null);
    setIsSaving(true);
    try {
      await updateOrganization(currentOrganization.id, {
        name: editName.trim(),
        slug: editSlug.trim(),
      });
      Alert.alert('Guardado', 'Los cambios se guardaron correctamente');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // ROLE CHANGE
  // ============================================
  const openRoleModal = (member) => {
    if (member.user_id === user.id) {
      Alert.alert('Acción no permitida', 'No podés cambiar tu propio rol');
      return;
    }
    if (!canManageRole(myRole, member.role)) {
      Alert.alert('Sin permisos', 'No tenés permisos para cambiar este rol');
      return;
    }
    setSelectedMember(member);
    setRoleModalVisible(true);
  };

  const handleRoleChange = async (newRole) => {
    if (!selectedMember) return;
    try {
      const { error } = await supabase
        .from(TABLES.MEMBERS)
        .update({ role: newRole })
        .eq('id', selectedMember.id);

      if (error) throw error;

      // Realtime will pick up the change, but also refresh immediately
      await loadMembers(currentOrganization.id);
      setRoleModalVisible(false);
      setSelectedMember(null);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRemoveMember = async (member) => {
    if (member.user_id === user.id) {
      Alert.alert('Error', 'No podés removerte a vos mismo');
      return;
    }
    Alert.alert(
      'Remover miembro',
      `¿Estás seguro de que querés remover a este miembro?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(TABLES.MEMBERS)
                .delete()
                .eq('id', member.id);
              if (error) throw error;
              await loadMembers(currentOrganization.id);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  // ============================================
  // DELETE ORGANIZATION — verbatim name confirmation
  // ============================================
  const handleDeleteOrganization = async () => {
    if (deleteConfirmText !== currentOrganization.name) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from(TABLES.ORGANIZATIONS)
        .delete()
        .eq('id', currentOrganization.id);

      if (error) throw error;

      setDeleteModalVisible(false);
      await loadOrganizations();
      router.replace('/');
    } catch (err) {
      Alert.alert('Error', err.message);
      setIsDeleting(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const styles = createStyles(colors, isDarkMode);

  if (!currentOrganization) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accentPurple} />
        </View>
      </View>
    );
  }

  const getRoleBadgeStyle = (role) => ({
    backgroundColor: (ROLE_COLORS[role] || ROLE_COLORS.viewer) + '25',
    borderColor: ROLE_COLORS[role] || ROLE_COLORS.viewer,
  });

  const getRoleBadgeTextStyle = (role) => ({
    color: ROLE_COLORS[role] || ROLE_COLORS.viewer,
  });

  // ============================================
  // RENDER
  // ============================================
  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.duration(400)}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{currentOrganization.name}</Text>
          <View style={[styles.planBadge, getRoleBadgeStyle(myRole)]}>
            <Text style={[styles.planText, getRoleBadgeTextStyle(myRole)]}>
              {myRole?.toUpperCase() || 'MEMBER'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['members', 'invitations', 'settings'].map((tab) => {
          // Hide settings tab for non-owners
          if (tab === 'settings' && !isOwner) return null;
          // Hide invitations tab for non-admins
          if (tab === 'invitations' && !isAdmin) return null;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab);
                if (tab === 'invitations') loadInvitations();
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'members' ? 'Miembros' : tab === 'invitations' ? 'Invitaciones' : 'Ajustes'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ============ MEMBERS TAB ============ */}
        {activeTab === 'members' && (
          <>
            {/* Stats */}
            <Animated.View style={styles.statsCard} entering={FadeInUp.delay(100)}>
              <Ionicons name="people" size={28} color={colors.accentPurple} />
              <Text style={styles.statsValue}>
                {memberCount} / {currentOrganization.max_members || 3}
              </Text>
              <Text style={styles.statsTitle}>Miembros del equipo</Text>
              {isAtMemberLimit && (
                <Text style={styles.limitWarning}>⚠️ Límite de miembros alcanzado</Text>
              )}
            </Animated.View>

            {/* Quick Invite (admins only) */}
            {isAdmin && (
              <Animated.View style={styles.inviteSection} entering={FadeInUp.delay(200)}>
                <Text style={styles.sectionTitle}>Invitar miembro</Text>
                <View style={styles.inviteForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email del compañero"
                    placeholderTextColor={colors.textTertiary}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <View style={styles.roleSelector}>
                    {assignableRoles.map((r) => (
                      <TouchableOpacity
                        key={r.value}
                        style={[
                          styles.roleOption,
                          inviteRole === r.value && {
                            backgroundColor: (ROLE_COLORS[r.value] || ROLE_COLORS.viewer) + '20',
                            borderColor: ROLE_COLORS[r.value] || ROLE_COLORS.viewer,
                          },
                        ]}
                        onPress={() => setInviteRole(r.value)}
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            inviteRole === r.value && {
                              color: ROLE_COLORS[r.value] || ROLE_COLORS.viewer,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.inviteButton, (isAtMemberLimit || isInviting) && styles.buttonDisabled]}
                    onPress={handleInvite}
                    disabled={isInviting || isAtMemberLimit}
                  >
                    {isInviting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.inviteButtonText}>Enviar invitación</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Member List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Miembros</Text>
              {members.map((member, index) => {
                const isMe = member.user_id === user?.id;
                const memberDisplayName =
                  member.user?.raw_user_meta_data?.display_name ||
                  member.user?.email?.split('@')[0] ||
                  'Usuario';
                const canManage = isAdmin && !isMe && canManageRole(myRole, member.role);

                return (
                  <Animated.View
                    key={member.id}
                    style={styles.memberCard}
                    entering={FadeInUp.delay(100 + index * 50)}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: ROLE_COLORS[member.role] || ROLE_COLORS.viewer }]}>
                      <Text style={styles.avatarText}>
                        {memberDisplayName[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {memberDisplayName}{isMe ? ' (tú)' : ''}
                      </Text>
                      <Text style={styles.memberEmail}>{member.user?.email}</Text>
                    </View>

                    {/* Role badge — tappable for admins */}
                    <TouchableOpacity
                      style={[styles.roleBadge, getRoleBadgeStyle(member.role)]}
                      onPress={() => canManage && openRoleModal(member)}
                      disabled={!canManage}
                      activeOpacity={canManage ? 0.7 : 1}
                    >
                      <Text style={[styles.roleBadgeText, getRoleBadgeTextStyle(member.role)]}>
                        {member.role}
                      </Text>
                      {canManage && (
                        <Ionicons
                          name="chevron-down"
                          size={12}
                          color={ROLE_COLORS[member.role]}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </TouchableOpacity>

                    {/* Remove button */}
                    {canManage && (
                      <TouchableOpacity
                        style={styles.removeMemberButton}
                        onPress={() => handleRemoveMember(member)}
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}

        {/* ============ INVITATIONS TAB ============ */}
        {activeTab === 'invitations' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invitaciones pendientes</Text>
            {pendingInvites.length === 0 ? (
              <Animated.View style={styles.emptyState} entering={FadeInUp.delay(100)}>
                <Ionicons name="mail-open-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No hay invitaciones pendientes</Text>
              </Animated.View>
            ) : (
              pendingInvites.map((invite, index) => (
                <Animated.View
                  key={invite.id}
                  style={styles.inviteCard}
                  entering={FadeInUp.delay(100 + index * 50)}
                >
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteEmail}>{invite.email}</Text>
                    <View style={styles.inviteMetaRow}>
                      <View style={[styles.roleBadge, getRoleBadgeStyle(invite.role)]}>
                        <Text style={[styles.roleBadgeText, getRoleBadgeTextStyle(invite.role)]}>
                          {invite.role}
                        </Text>
                      </View>
                      <Text style={styles.inviteExpiry}>
                        Expira: {new Date(invite.expires_at).toLocaleDateString('es-AR')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.inviteActions}>
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => invitationService.resendInvitation(invite.id)}
                    >
                      <Ionicons name="refresh" size={20} color={colors.accentBlue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => handleRevokeInvite(invite.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        )}

        {/* ============ SETTINGS TAB (Owner only) ============ */}
        {activeTab === 'settings' && isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración de la organización</Text>

            {/* Name */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Nombre</Text>
              <TextInput
                style={styles.settingInput}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Slug */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Slug (URL)</Text>
              <TextInput
                style={[styles.settingInput, slugError && styles.inputError]}
                value={editSlug}
                onChangeText={(text) => {
                  const sanitized = text.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setEditSlug(sanitized);
                  setSlugError(validateSlug(sanitized));
                }}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={MAX_SLUG_LENGTH}
                placeholderTextColor={colors.textTertiary}
              />
              {slugError && <Text style={styles.errorText}>{slugError}</Text>}
              <Text style={styles.slugPreview}>bitrova.app/org/{editSlug || '...'}</Text>
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.buttonDisabled]}
              onPress={handleSaveSettings}
              disabled={isSaving || !!slugError}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>

            {/* Plan Info */}
            <View style={[styles.settingRow, { marginTop: spacing.lg }]}>
              <Text style={styles.settingLabel}>Plan actual</Text>
              <View style={styles.planInfo}>
                <Text style={styles.planValue}>
                  {currentOrganization.plan?.charAt(0).toUpperCase() + currentOrganization.plan?.slice(1) || 'Free'}
                </Text>
                <TouchableOpacity style={styles.upgradeButton}>
                  <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ============ DANGER ZONE ============ */}
            <View style={styles.dangerZone}>
              <Ionicons name="warning" size={22} color="#ef4444" />
              <Text style={styles.dangerTitle}>Zona peligrosa</Text>
              <Text style={styles.dangerDescription}>
                Esta acción eliminará permanentemente la organización, todos los miembros, workspaces y datos asociados.
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setDeleteModalVisible(true)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteButtonText}>Eliminar organización</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ============ ROLE CHANGE MODAL ============ */}
      <Modal visible={roleModalVisible} transparent animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint={isDarkMode ? 'dark' : 'light'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cambiar rol</Text>
            <Text style={styles.modalSubtitle}>
              {selectedMember?.user?.email || 'Miembro'}
            </Text>

            {assignableRoles.map((r) => {
              const isCurrentRole = selectedMember?.role === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleModalOption,
                    isCurrentRole && { borderColor: ROLE_COLORS[r.value], backgroundColor: (ROLE_COLORS[r.value] || ROLE_COLORS.viewer) + '15' },
                  ]}
                  onPress={() => handleRoleChange(r.value)}
                  disabled={isCurrentRole}
                >
                  <View style={[styles.roleModalDot, { backgroundColor: ROLE_COLORS[r.value] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleModalLabel, { color: colors.textPrimary }]}>{r.label}</Text>
                    <Text style={[styles.roleModalDesc, { color: colors.textTertiary }]}>{r.description}</Text>
                  </View>
                  {isCurrentRole && <Ionicons name="checkmark-circle" size={22} color={ROLE_COLORS[r.value]} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.modalCancel} onPress={() => setRoleModalVisible(false)}>
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ============ DELETE CONFIRMATION MODAL ============ */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint={isDarkMode ? 'dark' : 'light'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>¿Eliminar organización?</Text>
            <Text style={[styles.modalSubtitle, { textAlign: 'center', marginBottom: 16 }]}>
              Escribí el nombre de la organización para confirmar:{'\n'}
              <Text style={{ fontWeight: '700', color: '#ef4444' }}>{currentOrganization.name}</Text>
            </Text>

            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="Escribí el nombre exacto..."
              placeholderTextColor={colors.textTertiary}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.deleteButton,
                deleteConfirmText !== currentOrganization.name && styles.buttonDisabled,
              ]}
              onPress={handleDeleteOrganization}
              disabled={deleteConfirmText !== currentOrganization.name || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>Eliminar permanentemente</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setDeleteModalVisible(false);
                setDeleteConfirmText('');
              }}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

// ============================================
// STYLES — Glassmorphism design language
// ============================================
const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 56,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    backButton: { marginRight: 16, padding: 4 },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    planBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    planText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    // Tabs
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    tab: {
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: colors.accentPurple },
    tabText: { fontSize: 14, color: colors.textSecondary },
    tabTextActive: { color: colors.accentPurple, fontWeight: '600' },

    // Content
    content: { flex: 1, padding: 20 },
    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 16,
    },

    // Stats Card
    statsCard: {
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.2)',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
      gap: 6,
    },
    statsValue: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.accentPurple,
    },
    statsTitle: { fontSize: 13, color: colors.textSecondary },
    limitWarning: { fontSize: 12, color: '#f59e0b', marginTop: 4 },

    // Invite Section
    inviteSection: { marginBottom: 24 },
    inviteForm: { gap: 12 },
    input: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.textPrimary,
    },
    inputError: { borderColor: '#ef4444' },
    roleSelector: { flexDirection: 'row', gap: 8 },
    roleOption: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
    },
    roleOptionText: { fontSize: 13, color: colors.textSecondary },
    inviteButton: {
      backgroundColor: colors.accentPurple,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.4 },
    inviteButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    // Member Card
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    memberAvatar: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    memberInfo: { flex: 1, marginLeft: 12 },
    memberName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    memberEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    // Role Badge
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
    },
    roleBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    removeMemberButton: { marginLeft: 8, padding: 4 },

    // Invite Card
    inviteCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 14,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    inviteInfo: { flex: 1 },
    inviteEmail: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
    inviteMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    inviteExpiry: { fontSize: 11, color: colors.textTertiary },
    inviteActions: { flexDirection: 'row', gap: 8 },
    actionIcon: { padding: 6 },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 14, color: colors.textTertiary },

    // Settings
    settingRow: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    settingLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 8, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
    settingInput: {
      fontSize: 16,
      color: colors.textPrimary,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
      paddingBottom: 8,
    },
    errorText: { color: '#ef4444', fontSize: 12, marginTop: 6 },
    slugPreview: { fontSize: 12, color: colors.textTertiary, marginTop: 6, fontStyle: 'italic' },
    saveButton: {
      backgroundColor: colors.accentPurple,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    // Plan
    planInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    upgradeButton: {
      backgroundColor: colors.accentPurple,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
    },
    upgradeText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Danger Zone
    dangerZone: {
      marginTop: 32,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.4)',
      borderRadius: 16,
      backgroundColor: 'rgba(239, 68, 68, 0.06)',
      gap: 10,
    },
    dangerTitle: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
    dangerDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
    deleteButton: {
      flexDirection: 'row',
      backgroundColor: '#ef4444',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 4,
    },
    deleteButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    // Modals
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalCard: {
      width: '88%',
      maxWidth: 380,
      backgroundColor: isDarkMode ? '#1a1a2e' : '#fff',
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    roleModalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      marginBottom: 8,
      gap: 12,
    },
    roleModalDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    roleModalLabel: { fontSize: 15, fontWeight: '600' },
    roleModalDesc: { fontSize: 12, marginTop: 2 },
    modalCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    modalCancelText: { fontSize: 15, fontWeight: '500' },
  });
