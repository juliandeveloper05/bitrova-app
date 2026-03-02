/**
 * Comments Section Component (Debug Version)
 * Bitrova TaskList App - Phase 3 B2B
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useComments } from '../../hooks/useComments';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import { Ionicons } from '@expo/vector-icons';

export default function CommentsSection({ taskId, collapsed = true }) {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const {
    comments,
    loading,
    error: loadError,
    addComment,
    replyToComment,
    editComment,
    deleteComment,
    addReaction,
    refresh,
    organizationId,
  } = useComments(taskId);

  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // 🚨 NUEVO: Estado para capturar el error y mostrarlo en pantalla
  const [submitError, setSubmitError] = useState(null);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleAddComment = useCallback(async (content) => {
    setSubmitError(null); // Limpiamos errores previos
    try {
      await addComment(content);
    } catch (error) {
      console.error('Error adding comment:', error);
      // Guardamos el mensaje para mostrarlo en la UI
      setSubmitError(error.message || 'Error desconocido al enviar');
    }
  }, [addComment]);

  const handleReply = useCallback((comment) => {
    setReplyingTo(comment);
    setSubmitError(null);
  }, []);

  const handleSubmitReply = useCallback(async (content) => {
    if (replyingTo) {
      setSubmitError(null);
      try {
        await replyToComment(replyingTo.id, content);
        setReplyingTo(null);
      } catch (error) {
        console.error('Error replying:', error);
        setSubmitError(error.message || 'Error al responder');
      }
    }
  }, [replyingTo, replyToComment]);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
    setSubmitError(null);
  }, []);

  const styles = createStyles(colors, isDarkMode);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={handleToggle}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubbles" size={18} color={colors.accentPurple} />
          </View>
          <Text style={styles.title}>Comments</Text>
          {comments.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{comments.length}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View style={styles.content}>
          
          {/* 🚨 ZONA DE ERROR VISIBLE 🚨 */}
          {submitError && (
            <View style={{ padding: 12, backgroundColor: '#ffebee', borderBottomWidth: 1, borderBottomColor: '#ffcdd2' }}>
              <Text style={{ color: '#c62828', fontWeight: 'bold' }}>
                ❌ Error: {submitError}
              </Text>
            </View>
          )}

          {/* Comment Input */}
          {user && organizationId && (
            <CommentInput
              onSubmit={handleAddComment}
              organizationId={organizationId}
              placeholder="Add a comment..."
            />
          )}

          {/* Reply Banner */}
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

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accentPurple} />
            </View>
          )}

          {/* Load Error State */}
          {loadError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading: {loadError}</Text>
              <TouchableOpacity onPress={refresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Comments List */}
          {!loading && comments.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment</Text>
            </View>
          )}

          {!loading && comments.length > 0 && (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onEdit={editComment}
                  onDelete={deleteComment}
                  onReaction={addReaction}
                  onReply={handleReply}
                  isOwner={comment.author_id === user?.id}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.glassMedium,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.accentPurple + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    countBadge: {
      backgroundColor: colors.accentPurple,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    countText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    content: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    loadingContainer: {
      padding: 24,
      alignItems: 'center',
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
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
      gap: 8,
    },
    emptyText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    commentsList: {
      paddingVertical: 8,
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