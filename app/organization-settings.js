/**
 * Organization Settings Screen
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Manage organization, members, and invitations
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useOrganization } from '../context/OrganizationContext';
import { useRole, useAssignableRoles, Permission } from '../hooks/usePermission';
import invitationService from '../services/invitationService';
import { Ionicons } from '@expo/vector-icons';

export default function OrganizationSettingsScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const {
    currentOrganization,
    members,
    updateOrganization,
    loadMembers,
    isOwner,
    isAdmin,
    memberCount,
    isAtMemberLimit,
  } = useOrganization();
  const { role } = useRole();
  const assignableRoles = useAssignableRoles();

  const [activeTab, setActiveTab] = useState('members');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load pending invitations
  const loadInvitations = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const invites = await invitationService.getPendingInvitations(currentOrganization.id);
      setPendingInvites(invites);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  }, [currentOrganization?.id]);

  // Send invitation
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (isAtMemberLimit) {
      Alert.alert(
        'Member Limit Reached',
        `Your ${currentOrganization?.plan || 'free'} plan allows ${currentOrganization?.max_members || 3} members. Upgrade to invite more.`
      );
      return;
    }

    setIsInviting(true);
    try {
      await invitationService.createInvitation({
        organizationId: currentOrganization.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        invitedBy: currentOrganization.membershipId, // This should be userId
      });

      Alert.alert('Invitation Sent', `Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      loadInvitations();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsInviting(false);
    }
  };

  // Revoke invitation
  const handleRevokeInvite = (inviteId) => {
    Alert.alert(
      'Revoke Invitation',
      'Are you sure you want to revoke this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
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
      ]
    );
  };

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{currentOrganization.name}</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planText}>{currentOrganization.plan?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['members', 'invitations', 'settings'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab);
              if (tab === 'invitations') loadInvitations();
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* Members Tab */}
        {activeTab === 'members' && (
          <>
            {/* Member Stats */}
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Team Members</Text>
              <Text style={styles.statsValue}>
                {memberCount} / {currentOrganization.max_members}
              </Text>
              {isAtMemberLimit && (
                <Text style={styles.limitWarning}>Member limit reached</Text>
              )}
            </View>

            {/* Invite Section */}
            {isAdmin && (
              <View style={styles.inviteSection}>
                <Text style={styles.sectionTitle}>Invite Team Member</Text>
                <View style={styles.inviteForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={colors.textSecondary}
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
                          inviteRole === r.value && styles.roleOptionActive,
                        ]}
                        onPress={() => setInviteRole(r.value)}
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            inviteRole === r.value && styles.roleOptionTextActive,
                          ]}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.inviteButton, isAtMemberLimit && styles.buttonDisabled]}
                    onPress={handleInvite}
                    disabled={isInviting || isAtMemberLimit}
                  >
                    {isInviting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.inviteButtonText}>Send Invitation</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Member List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              {members.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {(member.user?.email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.user?.raw_user_meta_data?.display_name ||
                        member.user?.email?.split('@')[0] ||
                        'User'}
                    </Text>
                    <Text style={styles.memberEmail}>{member.user?.email}</Text>
                  </View>
                  <View style={[styles.roleBadge, styles[`role_${member.role}`]]}>
                    <Text style={styles.roleBadgeText}>{member.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Invitations</Text>
            {pendingInvites.length === 0 ? (
              <Text style={styles.emptyText}>No pending invitations</Text>
            ) : (
              pendingInvites.map((invite) => (
                <View key={invite.id} style={styles.inviteCard}>
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteEmail}>{invite.email}</Text>
                    <Text style={styles.inviteRole}>Role: {invite.role}</Text>
                    <Text style={styles.inviteExpiry}>
                      Expires: {new Date(invite.expires_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.inviteActions}>
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={() => invitationService.resendInvitation(invite.id)}
                    >
                      <Ionicons name="refresh" size={20} color={colors.accentBlue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.revokeButton}
                      onPress={() => handleRevokeInvite(invite.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organization Settings</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Organization Name</Text>
              <TextInput
                style={styles.settingInput}
                value={currentOrganization.name}
                onEndEditing={(e) =>
                  updateOrganization(currentOrganization.id, { name: e.nativeEvent.text })
                }
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Plan</Text>
              <View style={styles.planInfo}>
                <Text style={styles.planValue}>{currentOrganization.plan}</Text>
                <TouchableOpacity style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>Upgrade</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <TouchableOpacity style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete Organization</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    planBadge: {
      marginLeft: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: colors.accentPurple + '20',
      borderRadius: 12,
    },
    planText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accentPurple,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.accentPurple,
    },
    tabText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.accentPurple,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    statsCard: {
      backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : '#f8f7ff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      alignItems: 'center',
    },
    statsTitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    statsValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.accentPurple,
      marginTop: 4,
    },
    limitWarning: {
      fontSize: 12,
      color: '#f59e0b',
      marginTop: 8,
    },
    inviteSection: {
      marginBottom: 24,
    },
    inviteForm: {
      gap: 12,
    },
    input: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.textPrimary,
    },
    roleSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    roleOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    roleOptionActive: {
      backgroundColor: colors.accentPurple + '20',
      borderColor: colors.accentPurple,
    },
    roleOptionText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    roleOptionTextActive: {
      color: colors.accentPurple,
      fontWeight: '600',
    },
    inviteButton: {
      backgroundColor: colors.accentPurple,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    inviteButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    memberAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentPurple,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
    },
    memberInfo: {
      flex: 1,
      marginLeft: 12,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    memberEmail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    roleBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    role_owner: {
      backgroundColor: '#fef3c7',
    },
    role_admin: {
      backgroundColor: '#dbeafe',
    },
    role_editor: {
      backgroundColor: '#dcfce7',
    },
    role_viewer: {
      backgroundColor: '#f3e8ff',
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    inviteCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inviteInfo: {
      flex: 1,
    },
    inviteEmail: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    inviteRole: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    inviteExpiry: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    inviteActions: {
      flexDirection: 'row',
      gap: 12,
    },
    resendButton: {
      padding: 8,
    },
    revokeButton: {
      padding: 8,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 32,
    },
    settingRow: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    settingInput: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    planInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    planValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    upgradeButton: {
      backgroundColor: colors.accentGradientStart,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    upgradeButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    dangerZone: {
      marginTop: 32,
      padding: 20,
      borderWidth: 1,
      borderColor: '#ef4444',
      borderRadius: 12,
    },
    dangerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ef4444',
      marginBottom: 12,
    },
    deleteButton: {
      backgroundColor: '#ef4444',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
