/**
 * Activity Feed Component
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Shows recent activity in workspace/organization
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useOrganization } from '../../context/OrganizationContext';
import { Ionicons } from '@expo/vector-icons';
import activityService from '../../services/activityService';

// Activity type icons and colors
const ACTIVITY_CONFIG = {
  task_created: { icon: 'add-circle', color: '#10b981' },
  task_completed: { icon: 'checkmark-circle', color: '#10b981' },
  task_updated: { icon: 'create', color: '#6366f1' },
  task_deleted: { icon: 'trash', color: '#ef4444' },
  task_assigned: { icon: 'person-add', color: '#3b82f6' },
  comment_added: { icon: 'chatbubble', color: '#8b5cf6' },
  member_joined: { icon: 'people', color: '#06b6d4' },
  member_invited: { icon: 'mail', color: '#f59e0b' },
  workspace_created: { icon: 'folder-open', color: '#ec4899' },
  default: { icon: 'ellipse', color: '#6b7280' },
};

export default function ActivityFeed({ 
  workspaceId = null, 
  limit = 20,
  showHeader = true,
  compact = false,
}) {
  const { colors, isDarkMode } = useTheme();
  const { currentOrganization } = useOrganization();
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load activities
  const loadActivities = useCallback(async () => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await activityService.getActivities({
        organizationId: currentOrganization.id,
        workspaceId,
        limit,
      });
      setActivities(data);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentOrganization?.id, workspaceId, limit]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivities();
  }, [loadActivities]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get activity config
  const getConfig = (type) => ACTIVITY_CONFIG[type] || ACTIVITY_CONFIG.default;

  // Format activity message
  const formatMessage = (activity) => {
    const { type, action, metadata } = activity;
    const actorName = metadata?.actorName || 'Someone';
    const targetName = metadata?.targetName || 'an item';

    switch (type) {
      case 'task_created':
        return `${actorName} created "${targetName}"`;
      case 'task_completed':
        return `${actorName} completed "${targetName}"`;
      case 'task_updated':
        return `${actorName} updated "${targetName}"`;
      case 'task_deleted':
        return `${actorName} deleted a task`;
      case 'task_assigned':
        return `${actorName} assigned "${targetName}" to ${metadata?.assigneeName || 'someone'}`;
      case 'comment_added':
        return `${actorName} commented on "${targetName}"`;
      case 'member_joined':
        return `${actorName} joined the team`;
      case 'member_invited':
        return `${actorName} invited ${metadata?.inviteeName || 'someone'}`;
      case 'workspace_created':
        return `${actorName} created workspace "${targetName}"`;
      default:
        return `${actorName} performed ${action || 'an action'}`;
    }
  };

  const styles = createStyles(colors, isDarkMode, compact);

  const renderActivity = ({ item }) => {
    const config = getConfig(item.type);
    
    return (
      <View style={styles.activityItem}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={compact ? 16 : 20} color={config.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.message} numberOfLines={2}>
            {formatMessage(item)}
          </Text>
          <Text style={styles.timestamp}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="pulse-outline" size={48} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No activity yet</Text>
      <Text style={styles.emptySubtitle}>Activity will appear here as your team works</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentPurple} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="pulse" size={20} color={colors.accentPurple} />
            <Text style={styles.title}>Activity</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadActivities}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accentPurple}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={activities.length === 0 && styles.emptyList}
        />
      )}
    </View>
  );
}

const createStyles = (colors, isDarkMode, compact) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: compact ? 10 : 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    iconContainer: {
      width: compact ? 32 : 40,
      height: compact ? 32 : 40,
      borderRadius: compact ? 16 : 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    message: {
      fontSize: compact ? 13 : 14,
      color: colors.textPrimary,
      lineHeight: compact ? 18 : 20,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    emptyList: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    errorContainer: {
      padding: 16,
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
    },
    retryText: {
      fontSize: 14,
      color: colors.accentPurple,
      fontWeight: '600',
    },
  });
