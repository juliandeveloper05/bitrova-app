/**
 * useComments Hook
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Manage comments for a task
 */

import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '../context/OrganizationContext';
import { useWorkspace } from '../context/WorkspaceContext';
import commentService from '../services/commentService';

export function useComments(taskId) {
  const { currentOrganization } = useOrganization();
  const { currentWorkspace } = useWorkspace();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load comments for the task
  const loadComments = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await commentService.getTaskComments(taskId);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Load on mount and when taskId changes
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Add a new comment
  const addComment = useCallback(async (content) => {
    if (!taskId || !currentOrganization?.id) {
      throw new Error('Missing required context');
    }

    const newComment = await commentService.createComment({
      taskId,
      content,
      workspaceId: currentWorkspace?.id,
      organizationId: currentOrganization.id,
    });

    setComments((prev) => [newComment, ...prev]);
    return newComment;
  }, [taskId, currentOrganization?.id, currentWorkspace?.id]);

  // Reply to a comment
  const replyToComment = useCallback(async (parentId, content) => {
    if (!taskId || !currentOrganization?.id) {
      throw new Error('Missing required context');
    }

    const reply = await commentService.createComment({
      taskId,
      content,
      workspaceId: currentWorkspace?.id,
      organizationId: currentOrganization.id,
      parentId,
    });

    // Add reply to parent comment
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          };
        }
        return comment;
      })
    );

    return reply;
  }, [taskId, currentOrganization?.id, currentWorkspace?.id]);

  // Edit a comment
  const editComment = useCallback(async (commentId, content) => {
    const updated = await commentService.updateComment(commentId, content);
    
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, ...updated } : comment
      )
    );

    return updated;
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId) => {
    await commentService.deleteComment(commentId);
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  }, []);

  // Add reaction to a comment
  const addReaction = useCallback(async (commentId, emoji) => {
    const updated = await commentService.addReaction(commentId, emoji);
    
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, reactions: updated.reactions } : comment
      )
    );
  }, []);

  return {
    comments,
    loading,
    error,
    addComment,
    replyToComment,
    editComment,
    deleteComment,
    addReaction,
    refresh: loadComments,
    organizationId: currentOrganization?.id,
  };
}

export default useComments;
