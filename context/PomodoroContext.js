/**
 * PomodoroContext - Timer State Management
 * Task List App 2026
 */

import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PomodoroContext = createContext();

// Timer modes
export const POMODORO_MODES = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};

// Default durations in seconds
const DEFAULT_DURATIONS = {
  work: 25 * 60,           // 25 minutes
  shortBreak: 5 * 60,      // 5 minutes
  longBreak: 15 * 60,      // 15 minutes
};

// Sessions before long break
const SESSIONS_BEFORE_LONG_BREAK = 4;

const STORAGE_KEY = '@pomodoro_sessions';

export const PomodoroProvider = ({ children }) => {
  // Timer state
  const [mode, setMode] = useState(POMODORO_MODES.WORK);
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  // Configuration (can be customized later)
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  
  // Optional: link to current task
  const [currentTaskId, setCurrentTaskId] = useState(null);
  
  // Interval ref
  const intervalRef = useRef(null);

  // Load saved sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.date === new Date().toDateString()) {
            setSessionsCompleted(data.sessions || 0);
          }
        }
      } catch (error) {
        console.error('Error loading pomodoro sessions:', error);
      }
    };
    loadSessions();
  }, []);

  // Save sessions when they change
  useEffect(() => {
    const saveSessions = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: new Date().toDateString(),
          sessions: sessionsCompleted,
        }));
      } catch (error) {
        console.error('Error saving pomodoro sessions:', error);
      }
    };
    saveSessions();
  }, [sessionsCompleted]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    
    if (mode === POMODORO_MODES.WORK) {
      // Work session completed
      const newSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(newSessionCount);
      
      // Check if it's time for a long break
      if (newSessionCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
        setMode(POMODORO_MODES.LONG_BREAK);
        setTimeRemaining(durations.longBreak);
      } else {
        setMode(POMODORO_MODES.SHORT_BREAK);
        setTimeRemaining(durations.shortBreak);
      }
    } else {
      // Break completed, back to work
      setMode(POMODORO_MODES.WORK);
      setTimeRemaining(durations.work);
    }
  }, [mode, sessionsCompleted, durations]);

  // Start the timer
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  // Pause the timer
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Toggle play/pause
  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Reset current timer
  const reset = useCallback(() => {
    setIsRunning(false);
    switch (mode) {
      case POMODORO_MODES.WORK:
        setTimeRemaining(durations.work);
        break;
      case POMODORO_MODES.SHORT_BREAK:
        setTimeRemaining(durations.shortBreak);
        break;
      case POMODORO_MODES.LONG_BREAK:
        setTimeRemaining(durations.longBreak);
        break;
    }
  }, [mode, durations]);

  // Skip to next phase
  const skip = useCallback(() => {
    setIsRunning(false);
    handleTimerComplete();
  }, [handleTimerComplete]);

  // Set specific mode
  const setTimerMode = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
    switch (newMode) {
      case POMODORO_MODES.WORK:
        setTimeRemaining(durations.work);
        break;
      case POMODORO_MODES.SHORT_BREAK:
        setTimeRemaining(durations.shortBreak);
        break;
      case POMODORO_MODES.LONG_BREAK:
        setTimeRemaining(durations.longBreak);
        break;
    }
  }, [durations]);

  // Reset everything
  const resetAll = useCallback(() => {
    setIsRunning(false);
    setMode(POMODORO_MODES.WORK);
    setTimeRemaining(durations.work);
    setSessionsCompleted(0);
    setCurrentTaskId(null);
  }, [durations]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get progress percentage (0 to 1)
  const getProgress = useCallback(() => {
    let totalDuration;
    switch (mode) {
      case POMODORO_MODES.WORK:
        totalDuration = durations.work;
        break;
      case POMODORO_MODES.SHORT_BREAK:
        totalDuration = durations.shortBreak;
        break;
      case POMODORO_MODES.LONG_BREAK:
        totalDuration = durations.longBreak;
        break;
      default:
        totalDuration = durations.work;
    }
    return 1 - (timeRemaining / totalDuration);
  }, [mode, timeRemaining, durations]);

  // Get mode label in Spanish
  const getModeLabel = useCallback(() => {
    switch (mode) {
      case POMODORO_MODES.WORK:
        return 'Trabajo';
      case POMODORO_MODES.SHORT_BREAK:
        return 'Descanso corto';
      case POMODORO_MODES.LONG_BREAK:
        return 'Descanso largo';
      default:
        return 'Trabajo';
    }
  }, [mode]);

  return (
    <PomodoroContext.Provider
      value={{
        // State
        mode,
        timeRemaining,
        isRunning,
        sessionsCompleted,
        currentTaskId,
        durations,
        
        // Actions
        start,
        pause,
        toggleTimer,
        reset,
        skip,
        setTimerMode,
        resetAll,
        setCurrentTaskId,
        
        // Helpers
        formatTime,
        getProgress,
        getModeLabel,
        
        // Constants
        POMODORO_MODES,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

// Custom hook for easy access
export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
