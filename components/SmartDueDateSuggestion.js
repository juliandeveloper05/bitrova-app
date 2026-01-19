/**
 * SmartDueDateSuggestion Component
 * TaskList App - Phase 4 Monetization
 * 
 * AI-powered deadline recommendation chip
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { analyzeTaskWithAI, estimatePriorityLocally } from '../services/aiService';

const SmartDueDateSuggestion = ({ 
  taskTitle = '',
  category = 'personal',
  onAccept,
  onDismiss,
  showPriority = true,
  minimumLength = 10, // Don't show for very short titles
}) => {
  const { theme } = useTheme();
  const { smartDueDates, aiPriorities } = useFeatureAccess();
  
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);

  // Animation values
  const scale = useSharedValue(0.9);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  // Trigger AI analysis when task title meets minimum length
  useEffect(() => {
    if (dismissed || analysisTriggered) return;
    if (!taskTitle || taskTitle.length < minimumLength) return;
    
    // Feature gate check
    if (!smartDueDates && !aiPriorities) return;

    const timer = setTimeout(() => {
      analyzeTitleForSuggestions();
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [taskTitle, dismissed, analysisTriggered, smartDueDates, aiPriorities]);

  const analyzeTitleForSuggestions = async () => {
    setLoading(true);
    setAnalysisTriggered(true);

    try {
      // Try AI analysis if Pro user
      if (smartDueDates || aiPriorities) {
        const result = await analyzeTaskWithAI(taskTitle);
        
        if (result && (result.suggestedDueDate || result.priority !== 'Medium')) {
          setSuggestion({
            dueDate: result.suggestedDueDate,
            priority: result.priority,
            reasoning: result.reasoning,
            isAI: true,
          });
          scale.value = 1;
        }
      } else {
        // Fallback to local heuristics
        const localResult = estimatePriorityLocally(taskTitle);
        if (localResult.priority !== 'Medium') {
          setSuggestion({
            dueDate: null,
            priority: localResult.priority,
            reasoning: localResult.reasoning,
            isAI: false,
          });
          scale.value = 1;
        }
      }
    } catch (error) {
      console.error('Smart suggestion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion && onAccept) {
      onAccept({
        dueDate: suggestion.dueDate,
        priority: suggestion.priority,
      });
    }
    setSuggestion(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setSuggestion(null);
    if (onDismiss) onDismiss();
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface + '80' }]}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Analyzing...
        </Text>
      </View>
    );
  }

  // No suggestion to show
  if (!suggestion || dismissed) {
    return null;
  }

  return (
    <Animated.View 
      entering={FadeInUp.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={animatedStyle}
    >
      <View style={[styles.container, { borderColor: theme.border }]}>
        <LinearGradient
          colors={['#8B5CF620', '#6366F110']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* AI Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name="sparkles" 
              size={16} 
              color={theme.primary} 
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {suggestion.isAI ? 'AI Suggestion' : 'Suggested'}
            </Text>
            
            <View style={styles.suggestionRow}>
              {/* Priority Badge */}
              {showPriority && suggestion.priority && suggestion.priority !== 'Medium' && (
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(suggestion.priority) + '20' }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    { color: getPriorityColor(suggestion.priority) }
                  ]}>
                    {suggestion.priority}
                  </Text>
                </View>
              )}

              {/* Due Date */}
              {suggestion.dueDate && (
                <View style={styles.dueDateContainer}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={14} 
                    color={theme.primary} 
                  />
                  <Text style={[styles.dueDateText, { color: theme.text }]}>
                    {formatDueDate(suggestion.dueDate)}
                  </Text>
                </View>
              )}
            </View>

            {/* Reasoning */}
            {suggestion.reasoning && (
              <Text style={[styles.reasoning, { color: theme.textSecondary }]} numberOfLines={1}>
                {suggestion.reasoning}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Ionicons name="checkmark" size={18} color="#22C55E" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.dismissButton]}
              onPress={handleDismiss}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return '#EF4444';
    case 'Low': return '#22C55E';
    default: return '#F59E0B';
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
  },
  gradientBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconContainer: {
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reasoning: {
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#22C55E20',
  },
  dismissButton: {
    backgroundColor: '#00000010',
  },
  loadingText: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default SmartDueDateSuggestion;
