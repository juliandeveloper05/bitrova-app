/**
 * Comment Item Component
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Single comment with author, reactions, and actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { formatMentionsForDisplay } from '../../services/commentService';
import { Ionicons } from '@expo/vector-icons';

// Common reactions
const REACTIONS = ['👍', '❤️', '🎉', '😄', '🤔', '👀'];

export default function CommentItem({
  comment,
  onEdit,
  onDelete,
  onReaction,
  onReply,
  isOwner,
}) {
  const { colors, isDarkMode } = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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

  // Group reactions by emoji
  const groupedReactions = (comment.reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.userId);
    return acc;
  }, {});

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete?.(comment.id),
        },
      ]
    );
  };

  const getAuthorName = () => {
    return comment.author?.raw_user_meta_data?.display_name || 
           comment.author?.email?.split('@')[0] || 
           'Unknown';
  };

  const getAuthorInitial = () => {
    return getAuthorName()[0]?.toUpperCase() || '?';
  };

  const styles = createStyles(colors, isDarkMode);

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getAuthorInitial()}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.authorName}>{getAuthorName()}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(comment.created_at)}</Text>
          {comment.edited_at && (
            <Text style={styles.editedLabel}>(edited)</Text>
          )}
        </View>

        {/* Comment Text */}
        <Text style={styles.commentText}>
          {formatMentionsForDisplay(comment.content)}
        </Text>

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <View style={styles.reactionsRow}>
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionBadge}
                onPress={() => onReaction?.(comment.id, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{users.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => setShowReactions(!showReactions)}
          >
            <Ionicons name="happy-outline" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => onReply?.(comment)}
          >
            <Ionicons name="arrow-undo-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>

          {isOwner && (
            <>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => onEdit?.(comment)}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Reaction Picker */}
        {showReactions && (
          <View style={styles.reactionPicker}>
            {REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionOption}
                onPress={() => {
                  onReaction?.(comment.id, emoji);
                  setShowReactions(false);
                }}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <View key={reply.id} style={styles.reply}>
                <View style={styles.replyAvatar}>
                  <Text style={styles.replyAvatarText}>
                    {(reply.author?.raw_user_meta_data?.display_name || 
                      reply.author?.email || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.replyContent}>
                  <Text style={styles.replyAuthor}>
                    {reply.author?.raw_user_meta_data?.display_name || 
                     reply.author?.email?.split('@')[0]}
                  </Text>
                  <Text style={styles.replyText}>{reply.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accentPurple,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 6,
    },
    authorName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    editedLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      fontStyle: 'italic',
    },
    commentText: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    reactionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    reactionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 12,
      gap: 4,
    },
    reactionEmoji: {
      fontSize: 14,
    },
    reactionCount: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 16,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    reactionPicker: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? colors.bgSecondary : '#fff',
      borderRadius: 24,
      padding: 8,
      marginTop: 8,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    reactionOption: {
      padding: 4,
    },
    reactionOptionEmoji: {
      fontSize: 20,
    },
    repliesContainer: {
      marginTop: 12,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
    },
    reply: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    replyAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accentBlue,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    replyAvatarText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
    },
    replyContent: {
      flex: 1,
    },
    replyAuthor: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    replyText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
