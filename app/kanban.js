/**
 * Kanban Board Screen
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Full-screen Kanban board view
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useOrganization } from '../context/OrganizationContext';
import { KanbanBoard } from '../components/kanban';
import { Ionicons } from '@expo/vector-icons';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export default function KanbanScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { currentWorkspace, workspaces, setCurrentWorkspace, loadKanbanColumns } = useWorkspace();
  const { currentOrganization } = useOrganization();
  
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

  // Load kanban columns when workspace changes
  useEffect(() => {
    if (currentWorkspace?.type === 'kanban') {
      loadKanbanColumns(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  // Handle task press
  const handleTaskPress = useCallback((task) => {
    router.push({
      pathname: '/task-details',
      params: { taskId: task.id },
    });
  }, [router]);

  // Handle add task
  const handleAddTask = useCallback((columnId) => {
    router.push({
      pathname: '/add-task',
      params: { kanbanColumnId: columnId },
    });
  }, [router]);

  // Switch workspace
  const handleWorkspaceSwitch = useCallback(async (workspace) => {
    await setCurrentWorkspace(workspace.id);
    setShowWorkspaceSelector(false);
  }, [setCurrentWorkspace]);

  const styles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Workspace Selector */}
        <TouchableOpacity 
          style={styles.workspaceSelector}
          onPress={() => setShowWorkspaceSelector(true)}
        >
          <View style={styles.workspaceInfo}>
            <Text style={styles.orgName}>{currentOrganization?.name || 'My Workspace'}</Text>
            <View style={styles.workspaceRow}>
              <View style={styles.boardIcon}>
                <Ionicons name="grid" size={14} color={colors.accentPurple} />
              </View>
              <Text style={styles.workspaceName}>
                {currentWorkspace?.name || 'Select Workspace'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity 
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* View Switcher */}
      <View style={styles.viewSwitcher}>
        <TouchableOpacity 
          style={[styles.viewTab, styles.viewTabActive]}
        >
          <Ionicons name="grid" size={18} color={colors.accentPurple} />
          <Text style={[styles.viewTabText, styles.viewTabTextActive]}>Board</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.viewTab}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="list" size={18} color={colors.textSecondary} />
          <Text style={styles.viewTabText}>List</Text>
        </TouchableOpacity>
      </View>

      {/* Kanban Board */}
      <View style={styles.boardContainer}>
        <KanbanBoard 
          onTaskPress={handleTaskPress}
          onAddTask={handleAddTask}
        />
      </View>

      {/* Workspace Selector Modal */}
      <Modal
        visible={showWorkspaceSelector}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWorkspaceSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Handle */}
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Workspace</Text>
              <TouchableOpacity onPress={() => setShowWorkspaceSelector(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {workspaces.map((workspace) => (
                <TouchableOpacity
                  key={workspace.id}
                  style={[
                    styles.workspaceOption,
                    workspace.id === currentWorkspace?.id && styles.workspaceOptionActive,
                  ]}
                  onPress={() => handleWorkspaceSwitch(workspace)}
                >
                  <View style={styles.workspaceOptionIcon}>
                    <Ionicons 
                      name={workspace.type === 'kanban' ? 'grid' : 'list'} 
                      size={20} 
                      color={workspace.id === currentWorkspace?.id ? colors.accentPurple : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.workspaceOptionInfo}>
                    <Text style={styles.workspaceOptionName}>{workspace.name}</Text>
                    <Text style={styles.workspaceOptionType}>
                      {workspace.type?.charAt(0).toUpperCase() + workspace.type?.slice(1)} view
                    </Text>
                  </View>
                  {workspace.id === currentWorkspace?.id && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accentPurple} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Create Kanban Workspace */}
              <TouchableOpacity style={styles.createWorkspaceBtn}>
                <Ionicons name="add-circle-outline" size={22} color={colors.accentPurple} />
                <Text style={styles.createWorkspaceText}>Create Kanban Board</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
      paddingHorizontal: 16,
      paddingTop: STATUSBAR_HEIGHT + 16,
      paddingBottom: 12,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    workspaceSelector: {
      flex: 1,
    },
    workspaceInfo: {
      gap: 2,
    },
    orgName: {
      fontSize: 11,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    workspaceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    boardIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.accentPurple + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    workspaceName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    settingsBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewSwitcher: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    viewTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
    viewTabActive: {
      backgroundColor: colors.accentPurple + '20',
    },
    viewTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    viewTabTextActive: {
      color: colors.accentPurple,
    },
    boardContainer: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.bgPrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 8,
      paddingBottom: 40,
      maxHeight: '70%',
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    workspaceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    workspaceOptionActive: {
      backgroundColor: colors.accentPurple + '10',
    },
    workspaceOptionIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    workspaceOptionInfo: {
      flex: 1,
    },
    workspaceOptionName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    workspaceOptionType: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    createWorkspaceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      marginTop: 8,
      marginHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.accentPurple + '50',
    },
    createWorkspaceText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accentPurple,
    },
  });
