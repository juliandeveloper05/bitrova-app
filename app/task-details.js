/**
 * Task Details Screen - Task List App 2026
 * View and Edit Task Details with Modern Glassmorphism
 */

import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInRight, FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { TaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, categories, priorities } from '../constants/theme';
import DatePickerButton from '../components/DatePickerButton';
import ReminderToggle from '../components/ReminderToggle';
import DraggableSubtaskList from '../components/DraggableSubtaskList';
import DiscardChangesModal from '../components/DiscardChangesModal';
import SaveIndicator, { SAVE_STATES } from '../components/SaveIndicator';
import TaskDescriptionEditor from '../components/TaskDescriptionEditor';
import RecurringActionModal from '../components/RecurringActionModal';
import AttachmentGallery from '../components/AttachmentGallery';
import AttachmentPicker from '../components/AttachmentPicker';
import AttachmentViewer from '../components/AttachmentViewer';
import { useFilePicker } from '../hooks/useFilePicker';
import { formatRelativeTime } from '../utils/dateHelpers';
import { useHistory, useUndoRedoKeyboard } from '../hooks/useHistory';
import { CommentsSection } from '../components/comments';

// Safe haptics wrapper for web compatibility
const safeHaptics = {
  impact: (style) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  },
  notification: (type) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(type);
    }
  }
};

export default function TaskDetails() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const { 
    tasks, 
    updateTask, 
    deleteTask, 
    toggleCompleted, 
    addSubtask, 
    toggleSubtask, 
    deleteSubtask, 
    updateSubtask, 
    reorderSubtasks,
    // Recurring task methods
    deleteRecurringSeries,
    updateRecurringSeries,
    getAffectedCount,
    skipRecurringInstance,
    unskipRecurringInstance,
    // Attachment methods
    addAttachment,
    deleteAttachment,
  } = useContext(TaskContext);
  const { colors } = useTheme();
  const { pickImage, takePhoto, pickDocument, isLoading: isFilePicking } = useFilePicker();
  
  // Find the task
  const task = tasks.find(t => t.id === taskId);
  
  // Local state for editing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(null);
  const [enableReminder, setEnableReminder] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal and save state
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [saveState, setSaveState] = useState(SAVE_STATES.IDLE);
  
  // Validation state
  const [titleError, setTitleError] = useState('');
  const isTitleValid = title.trim().length > 0;
  const canSave = hasChanges && isTitleValid && saveState !== SAVE_STATES.SAVING;
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  // Recurring task action modal state
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringAction, setRecurringAction] = useState('delete'); // 'delete' or 'edit'
  const [recurringCounts, setRecurringCounts] = useState({ this: 1, future: 1, all: 1 });
  
  // Attachment state
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  
  // History for undo/redo
  const history = useHistory({ title: '', description: '', category: 'personal', priority: 'medium' });
  
  // Enable keyboard shortcuts for undo/redo (web)
  useUndoRedoKeyboard(
    () => {
      if (history.canUndo) {
        const prev = history.value;
        history.undo();
        // Apply undone state
        const undoneValue = history.value;
        if (undoneValue) {
          setTitle(undoneValue.title || '');
          setDescription(undoneValue.description || '');
          setSelectedCategory(undoneValue.category || 'personal');
          setSelectedPriority(undoneValue.priority || 'medium');
        }
        safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    () => {
      if (history.canRedo) {
        history.redo();
        const redoneValue = history.value;
        if (redoneValue) {
          setTitle(redoneValue.title || '');
          setDescription(redoneValue.description || '');
          setSelectedCategory(redoneValue.category || 'personal');
          setSelectedPriority(redoneValue.priority || 'medium');
        }
        safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    true
  );
  
  // Initialize state when task loads
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setSelectedCategory(task.category || 'personal');
      setSelectedPriority(task.priority || 'medium');
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setEnableReminder(task.enableReminder || false);
    }
  }, [task]);
  
  // Track changes
  useEffect(() => {
    if (task) {
      const changed = 
        title !== task.title ||
        description !== (task.description || '') ||
        selectedCategory !== task.category ||
        selectedPriority !== task.priority ||
        (dueDate?.toISOString() || null) !== task.dueDate ||
        enableReminder !== task.enableReminder;
      setHasChanges(changed);
    }
  }, [title, description, selectedCategory, selectedPriority, dueDate, enableReminder, task]);
  
  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }, styles.centered]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Tarea no encontrada</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={[styles.backLinkText, { color: colors.accentPurple }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  // Validate title on change
  const handleTitleChange = useCallback((text) => {
    setTitle(text);
    if (!text.trim()) {
      setTitleError('El título es requerido');
    } else {
      setTitleError('');
    }
  }, []);

  // Handle back button - intercept if there are unsaved changes
  const handleBack = useCallback(() => {
    if (hasChanges) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  }, [hasChanges, router]);

  // Save changes with state indicator
  const handleSave = useCallback(async (shouldNavigateBack = true) => {
    if (!title.trim()) {
      setTitleError('El título es requerido');
      safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    
    setSaveState(SAVE_STATES.SAVING);
    
    try {
      await updateTask(taskId, {
        title: title.trim(),
        description: description,
        category: selectedCategory,
        priority: selectedPriority,
        dueDate: dueDate ? dueDate.toISOString() : null,
        enableReminder: enableReminder && dueDate !== null,
      });
      
      setSaveState(SAVE_STATES.SUCCESS);
      setHasChanges(false);
      
      if (shouldNavigateBack) {
        // Small delay to show success state
        setTimeout(() => {
          router.back();
        }, 500);
      }
      return true;
    } catch (error) {
      setSaveState(SAVE_STATES.ERROR);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, [title, selectedCategory, selectedPriority, dueDate, enableReminder, taskId, updateTask, router]);

  // Modal handlers
  const handleModalSave = async () => {
    const success = await handleSave(true);
    if (success) {
      setShowDiscardModal(false);
    }
  };

  const handleModalDiscard = () => {
    setShowDiscardModal(false);
    router.back();
  };

  const handleModalCancel = () => {
    setShowDiscardModal(false);
  };

  const handleSaveIndicatorHide = () => {
    setSaveState(SAVE_STATES.IDLE);
  };

  const handleDelete = () => {
    // Check if this is a recurring task
    if (task.isRecurring && task.recurringSeriesId) {
      // Show recurring action modal
      const counts = {
        this: 1,
        future: getAffectedCount(task.recurringSeriesId, 'future', taskId),
        all: getAffectedCount(task.recurringSeriesId, 'all', taskId),
      };
      setRecurringCounts(counts);
      setRecurringAction('delete');
      setShowRecurringModal(true);
      return;
    }

    const performDelete = () => {
      deleteTask(taskId);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Eliminar Tarea',
        '¿Estás seguro de que quieres eliminar esta tarea?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  // Handle recurring action modal confirm
  const handleRecurringConfirm = async (scope) => {
    setShowRecurringModal(false);
    
    if (recurringAction === 'delete') {
      await deleteRecurringSeries(task.recurringSeriesId, scope, taskId);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  // Handle skip/unskip recurring instance
  const handleSkipInstance = async () => {
    if (task.skipped) {
      await unskipRecurringInstance(taskId);
    } else {
      await skipRecurringInstance(taskId);
    }
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
  };

  // Attachment handlers
  const handleAddAttachment = () => {
    setShowAttachmentPicker(true);
  };

  const handlePickImage = async () => {
    const attachment = await pickImage(taskId);
    if (attachment) {
      addAttachment(taskId, attachment);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTakePhoto = async () => {
    const attachment = await takePhoto(taskId);
    if (attachment) {
      addAttachment(taskId, attachment);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handlePickDocument = async () => {
    const attachment = await pickDocument(taskId);
    if (attachment) {
      addAttachment(taskId, attachment);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAttachmentPress = (attachment) => {
    setSelectedAttachment(attachment);
    setShowAttachmentViewer(true);
  };

  const handleAttachmentDelete = async (attachment) => {
    await deleteAttachment(taskId, attachment.id);
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    if (showAttachmentViewer) {
      setShowAttachmentViewer(false);
    }
  };

  const handleToggleComplete = () => {
    toggleCompleted(taskId);
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  // Format creation date
  const formatDate = (dateString) => {
    if (!dateString) return 'Desconocida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter out 'all' category
  const taskCategories = Object.values(categories).filter(c => c.id !== 'all');
  const priority = priorities[task.priority] || priorities.medium;

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <Animated.View 
        style={styles.header}
        entering={FadeInUp.springify()}
      >
        <Pressable 
          style={[styles.backButton, { backgroundColor: colors.glassMedium }]}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        
        {/* Undo/Redo Buttons */}
        <View style={styles.undoRedoContainer}>
          <Pressable 
            style={[
              styles.undoRedoButton, 
              { backgroundColor: colors.glassMedium },
              !history.canUndo && styles.undoRedoButtonDisabled
            ]}
            onPress={() => {
              if (history.canUndo) {
                history.undo();
                safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            disabled={!history.canUndo}
          >
            <Ionicons 
              name="arrow-undo" 
              size={18} 
              color={history.canUndo ? colors.textSecondary : colors.textTertiary} 
            />
          </Pressable>
          <Pressable 
            style={[
              styles.undoRedoButton, 
              { backgroundColor: colors.glassMedium },
              !history.canRedo && styles.undoRedoButtonDisabled
            ]}
            onPress={() => {
              if (history.canRedo) {
                history.redo();
                safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            disabled={!history.canRedo}
          >
            <Ionicons 
              name="arrow-redo" 
              size={18} 
              color={history.canRedo ? colors.textSecondary : colors.textTertiary} 
            />
          </Pressable>
        </View>
        
        <Pressable 
          style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </Pressable>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Completion Status */}
        <Animated.View
          entering={FadeInUp.delay(50).springify()}
        >
          <Pressable 
            style={[
              styles.statusCard,
              { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder },
              task.completed && { backgroundColor: colors.success + '10', borderColor: colors.success + '30' },
              task.skipped && { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }
            ]}
            onPress={handleToggleComplete}
          >
            <View style={[
              styles.checkCircle,
              { borderColor: colors.textTertiary },
              task.completed && { backgroundColor: colors.success, borderColor: colors.success },
              task.skipped && { backgroundColor: colors.warning, borderColor: colors.warning }
            ]}>
              {task.completed && (
                <Ionicons name="checkmark" size={20} color={colors.white} />
              )}
              {task.skipped && (
                <Ionicons name="play-skip-forward" size={16} color={colors.white} />
              )}
            </View>
            <Text style={[
              styles.statusText,
              { color: colors.textPrimary },
              task.completed && { color: colors.success },
              task.skipped && { color: colors.warning }
            ]}>
              {task.skipped ? 'Saltada' : task.completed ? 'Completada' : 'Pendiente'}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: task.skipped ? colors.warning + '20' : task.completed ? colors.success + '20' : priority.color + '20' }
            ]}>
              <Ionicons 
                name={task.skipped ? 'play-skip-forward' : task.completed ? 'checkmark-circle' : priority.icon} 
                size={16} 
                color={task.skipped ? colors.warning : task.completed ? colors.success : priority.color} 
              />
            </View>
          </Pressable>
        </Animated.View>

        {/* Recurring Task Info & Actions */}
        {task.isRecurring && (
          <Animated.View
            style={styles.section}
            entering={FadeInUp.delay(75).springify()}
          >
            <View style={[styles.recurringInfoCard, { backgroundColor: colors.accentCyan + '10', borderColor: colors.accentCyan + '30' }]}>
              <View style={styles.recurringInfoHeader}>
                <View style={[styles.recurringIconContainer, { backgroundColor: colors.accentCyan + '20' }]}>
                  <Ionicons name="repeat" size={20} color={colors.accentCyan} />
                </View>
                <View style={styles.recurringInfoText}>
                  <Text style={[styles.recurringInfoTitle, { color: colors.textPrimary }]}>
                    Tarea Recurrente
                  </Text>
                  <Text style={[styles.recurringInfoSubtitle, { color: colors.textSecondary }]}>
                    Parte de una serie recurrente
                  </Text>
                </View>
              </View>
              
              <View style={styles.recurringActions}>
                {/* Skip/Unskip Button */}
                {!task.completed && (
                  <Pressable
                    style={[
                      styles.recurringActionButton,
                      { backgroundColor: task.skipped ? colors.success + '15' : colors.warning + '15' }
                    ]}
                    onPress={handleSkipInstance}
                  >
                    <Ionicons 
                      name={task.skipped ? "play" : "play-skip-forward"} 
                      size={16} 
                      color={task.skipped ? colors.success : colors.warning} 
                    />
                    <Text style={[
                      styles.recurringActionText,
                      { color: task.skipped ? colors.success : colors.warning }
                    ]}>
                      {task.skipped ? 'Reactivar' : 'Saltar esta vez'}
                    </Text>
                  </Pressable>
                )}
                
                {/* View Series Button */}
                <Pressable
                  style={[styles.recurringActionButton, { backgroundColor: colors.accentCyan + '15' }]}
                  onPress={() => router.push(`/recurring-series?seriesId=${task.recurringSeriesId}`)}
                >
                  <Ionicons name="layers-outline" size={16} color={colors.accentCyan} />
                  <Text style={[styles.recurringActionText, { color: colors.accentCyan }]}>
                    Ver serie completa
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Task Title Input */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(100).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Título</Text>
          <TextInput
            style={[
              styles.input, 
              { backgroundColor: colors.glassMedium, borderColor: titleError ? colors.error : colors.glassBorder, color: colors.textPrimary },
              titleError && styles.inputError
            ]}
            placeholder="Nombre de la tarea"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={handleTitleChange}
            multiline
            maxLength={200}
          />
          {/* Validation Error */}
          {titleError && (
            <Animated.View 
              style={styles.errorContainer}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <Ionicons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{titleError}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Description/Notes Editor */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(125).springify()}
        >
          <TaskDescriptionEditor
            value={description}
            onChange={setDescription}
          />
        </Animated.View>

        {/* Creation & Modification Info */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(150).springify()}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Creada:</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{formatDate(task.createdAt)}</Text>
            </View>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                <Ionicons name="create-outline" size={16} color={colors.accentPurple} />
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Modificada:</Text>
                <Text style={[styles.infoText, { color: colors.accentPurple }]}>{formatRelativeTime(task.updatedAt)}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Subtasks Section */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(175).springify()}
        >
          <View style={styles.subtasksHeader}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Subtareas</Text>
            {task.subtasks && task.subtasks.length > 0 && (
              <View style={[styles.subtasksProgress, { backgroundColor: colors.accentPurple + '20' }]}>
                <Text style={[styles.subtasksProgressText, { color: colors.accentPurple }]}>
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </Text>
              </View>
            )}
          </View>
          
          {/* Progress bar */}
          {task.subtasks && task.subtasks.length > 0 && (
            <View style={[styles.progressBarContainer, { backgroundColor: colors.glassMedium }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: colors.accentPurple,
                    width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                  }
                ]} 
              />
            </View>
          )}
          
          {/* Add subtask input */}
          <View style={[styles.addSubtaskContainer, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <TextInput
              style={[styles.addSubtaskInput, { color: colors.textPrimary }]}
              placeholder="Agregar subtarea..."
              placeholderTextColor={colors.textTertiary}
              value={newSubtaskText}
              onChangeText={setNewSubtaskText}
              onSubmitEditing={() => {
                if (newSubtaskText.trim()) {
                  addSubtask(taskId, newSubtaskText);
                  setNewSubtaskText('');
                  safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              returnKeyType="done"
            />
            <Pressable 
              style={[styles.addSubtaskButton, { backgroundColor: colors.accentPurple }]}
              onPress={() => {
                if (newSubtaskText.trim()) {
                  addSubtask(taskId, newSubtaskText);
                  setNewSubtaskText('');
                  safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </Pressable>
          </View>
          
          {/* Subtasks list - Draggable */}
          <DraggableSubtaskList
            subtasks={task.subtasks || []}
            taskId={taskId}
            onToggleSubtask={(tid, sid) => {
              toggleSubtask(tid, sid);
              safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
            }}
            onDeleteSubtask={(tid, sid) => {
              deleteSubtask(tid, sid);
              safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
            }}
            onUpdateSubtask={updateSubtask}
            onReorderSubtasks={reorderSubtasks}
          />
        </Animated.View>

        {/* Attachments Section */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(188).springify()}
        >
          <AttachmentGallery
            attachments={task.attachments || []}
            onAttachmentPress={handleAttachmentPress}
            onAttachmentDelete={handleAttachmentDelete}
            onAddPress={handleAddAttachment}
            editable={!task.completed}
          />
        </Animated.View>

        {/* Comments Section */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(195).springify()}
        >
          <CommentsSection taskId={taskId} collapsed={true} />
        </Animated.View>

        {/* Category Selection */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(200).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Categoría</Text>
          <View style={styles.optionsGrid}>
            {taskCategories.map((category, index) => (
              <Animated.View
                key={category.id}
                entering={FadeInRight.delay(200 + index * 50).springify()}
              >
                <Pressable
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder },
                    selectedCategory === category.id && {
                      backgroundColor: category.color + '20',
                      borderColor: category.color,
                    }
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={[
                    styles.optionIcon,
                    { backgroundColor: category.color + '30' }
                  ]}>
                    <Ionicons 
                      name={category.icon} 
                      size={20} 
                      color={category.color} 
                    />
                  </View>
                  <Text style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    selectedCategory === category.id && { color: category.color }
                  ]}>
                    {category.name}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Due Date Selection */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(250).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Fecha límite</Text>
          <DatePickerButton 
            value={dueDate}
            onChange={(date) => {
              setDueDate(date);
              if (date && !enableReminder) {
                setEnableReminder(true);
              }
            }}
            placeholder="Agregar fecha límite"
          />
          
          {/* Reminder Toggle */}
          {dueDate && (
            <Animated.View
              style={{ marginTop: spacing.md }}
              entering={FadeInUp.springify()}
            >
              <ReminderToggle 
                enabled={enableReminder}
                onToggle={setEnableReminder}
                label="Recordarme a las 9:00 AM"
              />
            </Animated.View>
          )}
        </Animated.View>

        {/* Priority Selection */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(300).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Prioridad</Text>
          <View style={styles.priorityRow}>
            {Object.values(priorities).map((priority, index) => (
              <Animated.View
                key={priority.id}
                style={styles.priorityItem}
                entering={FadeInRight.delay(300 + index * 50).springify()}
              >
                <Pressable
                  style={[
                    styles.priorityCard,
                    { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder },
                    selectedPriority === priority.id && {
                      backgroundColor: priority.color + '20',
                      borderColor: priority.color,
                    }
                  ]}
                  onPress={() => {
                    setSelectedPriority(priority.id);
                    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons 
                    name={priority.icon} 
                    size={24} 
                    color={selectedPriority === priority.id ? priority.color : colors.textTertiary} 
                  />
                  <Text style={[
                    styles.priorityText,
                    { color: colors.textSecondary },
                    selectedPriority === priority.id && { color: priority.color }
                  ]}>
                    {priority.name}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
        
        {/* Spacer for button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save Button - only show if changes and can save */}
      {hasChanges && (
        <Animated.View 
          style={[styles.footer, { backgroundColor: colors.bgPrimary }]}
          entering={FadeInUp.springify()}
        >
          {/* Save Indicator */}
          <View style={styles.saveIndicatorContainer}>
            <SaveIndicator 
              state={saveState}
              onHide={handleSaveIndicatorHide}
              onRetry={() => handleSave(false)}
            />
          </View>
          
          <Pressable 
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]} 
            onPress={() => handleSave(true)}
            disabled={!canSave}
          >
            <LinearGradient
              colors={canSave ? [colors.gradientStart, colors.gradientEnd] : [colors.textTertiary, colors.textTertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              <Ionicons name="checkmark" size={24} color={colors.white} />
              <Text style={[styles.saveText, { color: colors.white }]}>Guardar Cambios</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* Discard Changes Modal */}
      <DiscardChangesModal
        visible={showDiscardModal}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onCancel={handleModalCancel}
        isSaving={saveState === SAVE_STATES.SAVING}
      />

      {/* Recurring Action Modal */}
      <RecurringActionModal
        visible={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        onConfirm={handleRecurringConfirm}
        action={recurringAction}
        counts={recurringCounts}
      />

      {/* Attachment Picker Modal */}
      <AttachmentPicker
        visible={showAttachmentPicker}
        onClose={() => setShowAttachmentPicker(false)}
        onPickImage={handlePickImage}
        onTakePhoto={handleTakePhoto}
        onPickDocument={handlePickDocument}
        isLoading={isFilePicking}
      />

      {/* Attachment Viewer Modal */}
      <AttachmentViewer
        visible={showAttachmentViewer}
        attachment={selectedAttachment}
        attachments={task.attachments || []}
        onClose={() => setShowAttachmentViewer(false)}
        onDelete={handleAttachmentDelete}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  errorText: {
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.lg,
  },
  
  backLink: {
    padding: spacing.md,
  },
  
  backLinkText: {
    fontSize: typography.fontSize.md,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  undoRedoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  
  undoRedoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  undoRedoButtonDisabled: {
    opacity: 0.4,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  
  section: {
    marginBottom: spacing.xl,
  },
  
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statusText: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
  },
  
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  input: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    fontSize: typography.fontSize.lg,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  
  infoCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  infoText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  optionText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  
  priorityItem: {
    flex: 1,
  },
  
  priorityCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  
  priorityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  
  saveText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Subtasks styles
  subtasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  
  subtasksProgress: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  
  subtasksProgressText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  addSubtaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  
  addSubtaskInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  
  addSubtaskButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  subtasksList: {
    gap: spacing.sm,
  },
  
  // Input validation styles
  inputError: {
    borderWidth: 2,
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  
  errorText: {
    fontSize: typography.fontSize.sm,
  },
  
  // Save button states
  saveButtonDisabled: {
    opacity: 0.6,
  },
  
  saveIndicatorContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  
  // Recurring task info card styles
  recurringInfoCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  
  recurringInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  
  recurringIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  recurringInfoText: {
    flex: 1,
  },
  
  recurringInfoTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  
  recurringInfoSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  
  recurringActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  
  recurringActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  
  recurringActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});