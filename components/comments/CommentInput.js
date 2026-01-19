/**
 * Comment Input Component
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Input with @mention autocomplete
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import commentService from '../../services/commentService';
import { Ionicons } from '@expo/vector-icons';

export default function CommentInput({
  onSubmit,
  organizationId,
  placeholder = 'Write a comment...',
  autoFocus = false,
}) {
  const { colors, isDarkMode } = useTheme();
  const inputRef = useRef(null);
  
  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Handle text change and detect @mentions
  const handleTextChange = useCallback(async (newText) => {
    setText(newText);

    // Check for @mention trigger
    const result = commentService.getMentionTrigger(newText, cursorPosition);
    
    if (result.trigger) {
      setMentionQuery(result.query);
      setMentionStartIndex(result.startIndex);
      
      // Search for users
      if (result.query.length >= 1 && organizationId) {
        try {
          const users = await commentService.searchUsersForMention(
            result.query,
            organizationId
          );
          setMentionSuggestions(users);
        } catch (error) {
          console.error('Error searching users:', error);
          setMentionSuggestions([]);
        }
      } else {
        setMentionSuggestions([]);
      }
    } else {
      setMentionSuggestions([]);
      setMentionStartIndex(-1);
    }
  }, [cursorPosition, organizationId]);

  // Handle selection change to track cursor
  const handleSelectionChange = useCallback((event) => {
    setCursorPosition(event.nativeEvent.selection.start);
  }, []);

  // Insert mention into text
  const insertMention = useCallback((user) => {
    if (mentionStartIndex >= 0) {
      const before = text.slice(0, mentionStartIndex);
      const after = text.slice(cursorPosition);
      const mentionText = `@[${user.displayName}](${user.id}) `;
      
      const newText = before + mentionText + after;
      setText(newText);
      
      // Reset mention state
      setMentionSuggestions([]);
      setMentionStartIndex(-1);
      setMentionQuery('');
      
      // Focus back on input
      inputRef.current?.focus();
    }
  }, [text, mentionStartIndex, cursorPosition]);

  // Submit comment
  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.(text.trim());
      setText('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, isSubmitting, onSubmit]);

  const styles = createStyles(colors, isDarkMode);

  return (
    <View style={styles.container}>
      {/* Mention Suggestions */}
      {mentionSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={mentionSuggestions}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => insertMention(item)}
              >
                <View style={styles.suggestionAvatar}>
                  <Text style={styles.suggestionAvatarText}>
                    {item.displayName[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{item.displayName}</Text>
                  <Text style={styles.suggestionEmail}>{item.email}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            autoFocus={autoFocus}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!text.trim() || isSubmitting) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!text.trim() || isSubmitting}
        >
          <Ionicons
            name="send"
            size={20}
            color={text.trim() ? '#fff' : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Character count */}
      {text.length > 1800 && (
        <Text style={styles.charCount}>
          {text.length}/2000
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionsContainer: {
      marginBottom: 8,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.bgSecondary : '#fff',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accentPurple,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    suggestionAvatarText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    suggestionInfo: {},
    suggestionName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    suggestionEmail: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 40,
      maxHeight: 120,
    },
    input: {
      fontSize: 15,
      color: colors.textPrimary,
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentPurple,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    charCount: {
      fontSize: 11,
      color: colors.textTertiary,
      textAlign: 'right',
      marginTop: 4,
    },
  });
