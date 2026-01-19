/**
 * Comment List Component
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Displays comments with replies and reactions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { Ionicons } from '@expo/vector-icons';

export default function CommentList({
  comments,
  loading,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReaction,
  onReply,
  organizationId,
  currentUserId,
}) {
  const { colors, isDarkMode } = useTheme();
  const [replyingTo, setReplyingTo] = useState(null);

  const handleReply = useCallback((comment) => {
    setReplyingTo(comment);
  }, []);

  const handleSubmitReply = useCallback(async (content) => {
    if (replyingTo) {
      await onReply?.(replyingTo.id, content);
      setReplyingTo(null);
    }
  }, [replyingTo, onReply]);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const styles = createStyles(colors, isDarkMode);

  const renderComment = ({ item }) => (
    <CommentItem
      comment={item}
      onEdit={onEditComment}
      onDelete={onDeleteComment}
      onReaction={onReaction}
      onReply={handleReply}
      isOwner={item.author_id === currentUserId}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No comments yet</Text>
      <Text style={styles.emptySubtitle}>Be the first to comment on this task</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{comments.length}</Text>
        </View>
      </View>

      {/* Comment Input */}
      <CommentInput
        onSubmit={onAddComment}
        organizationId={organizationId}
        placeholder="Add a comment..."
      />

      {/* Reply Input (when replying) */}
      {replyingTo && (
        <View style={styles.replyBanner}>
          <View style={styles.replyInfo}>
            <Text style={styles.replyLabel}>Replying to </Text>
            <Text style={styles.replyAuthor}>
              {replyingTo.author?.raw_user_meta_data?.display_name || 
               replyingTo.author?.email?.split('@')[0]}
            </Text>
          </View>
          <TouchableOpacity onPress={cancelReply}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      {replyingTo && (
        <CommentInput
          onSubmit={handleSubmitReply}
          organizationId={organizationId}
          placeholder="Write a reply..."
          autoFocus
        />
      )}

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentPurple} />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    countBadge: {
      marginLeft: 8,
      backgroundColor: colors.accentPurple + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    countText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accentPurple,
    },
    listContent: {
      paddingVertical: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    replyBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.accentPurple + '10',
      borderLeftWidth: 3,
      borderLeftColor: colors.accentPurple,
    },
    replyInfo: {
      flexDirection: 'row',
    },
    replyLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    replyAuthor: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accentPurple,
    },
  });
