/**
 * AI Service
 * TaskList App - Phase 4 Monetization
 * 
 * OpenAI integration for task prioritization and smart features
 */

import { supabase, isSupabaseConfigured } from '../config/supabase';

// Direct OpenAI client for fallback (if Edge Function fails)
// Note: API key should be stored in Supabase Edge Function secrets, not client
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

/**
 * Analyze a task using AI and get priority/due date suggestions
 * Uses Supabase Edge Function for security (API key not exposed to client)
 * 
 * @param {string} taskContent - The task title/description
 * @returns {Object} { priority, suggested_due_date, reasoning }
 */
export const analyzeTaskWithAI = async (taskContent) => {
  try {
    // Basic check: Don't waste API calls on empty strings
    if (!taskContent?.trim()) return null;

    // Minimum length check (avoid analyzing single words)
    if (taskContent.trim().length < 5) return null;

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-task', {
      body: {
        task_content: taskContent,
        current_date: new Date().toISOString(),
      },
    });

    if (error) throw error;

    // data returns: { priority: "High", suggested_due_date: "2026-01-20", reasoning: "..." }
    return {
      priority: data?.priority || 'Medium',
      suggestedDueDate: data?.suggested_due_date || null,
      reasoning: data?.reasoning || null,
      confidence: data?.confidence || 0.7,
    };

  } catch (err) {
    console.error('AI Analysis Failed:', err);
    // Fail gracefully: return default values so the user can still create the task
    return { 
      priority: 'Medium', 
      suggestedDueDate: null, 
      reasoning: null,
      error: err.message,
    };
  }
};

/**
 * Batch analyze multiple tasks for priority sorting
 * 
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Tasks sorted by AI-computed priority
 */
export const prioritizeTasks = async (tasks) => {
  try {
    if (!tasks || tasks.length === 0) return tasks;

    // Prepare task summaries for batch analysis
    const taskSummaries = tasks.map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      category: t.category,
      hasSubtasks: (t.subtasks?.length || 0) > 0,
    }));

    const { data, error } = await supabase.functions.invoke('prioritize-tasks', {
      body: {
        tasks: taskSummaries,
        current_date: new Date().toISOString(),
      },
    });

    if (error) throw error;

    // data returns: { prioritized: [{ id, score, reason }] }
    const scores = data?.prioritized || [];
    
    // Create a score map
    const scoreMap = new Map(scores.map(s => [s.id, s]));
    
    // Sort tasks by AI score (higher = more urgent)
    return tasks
      .map(task => ({
        ...task,
        aiScore: scoreMap.get(task.id)?.score || 50,
        aiReason: scoreMap.get(task.id)?.reason || null,
      }))
      .sort((a, b) => b.aiScore - a.aiScore);

  } catch (err) {
    console.error('AI Prioritization Failed:', err);
    // Return original order on failure
    return tasks;
  }
};

/**
 * Generate smart due date suggestion based on task details
 * 
 * @param {Object} taskData - Task data including title, category, subtasks
 * @returns {Object} { date, confidence, reasoning }
 */
export const suggestDueDate = async (taskData) => {
  try {
    const { data, error } = await supabase.functions.invoke('suggest-due-date', {
      body: {
        task_title: taskData.title,
        category: taskData.category,
        subtask_count: taskData.subtasks?.length || 0,
        description_length: taskData.description?.length || 0,
        current_date: new Date().toISOString(),
      },
    });

    if (error) throw error;

    return {
      date: data?.suggested_date || null,
      confidence: data?.confidence || 0.5,
      reasoning: data?.reasoning || null,
    };

  } catch (err) {
    console.error('Smart Due Date Failed:', err);
    return { date: null, confidence: 0, reasoning: null };
  }
};

/**
 * Generate weekly productivity insights summary
 * 
 * @param {Object} stats - Weekly stats data
 * @returns {Object} { summary, tips, highlights }
 */
export const generateWeeklyInsights = async (stats) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-insights', {
      body: {
        stats,
        current_date: new Date().toISOString(),
      },
    });

    if (error) throw error;

    return {
      summary: data?.summary || 'No insights available',
      tips: data?.tips || [],
      highlights: data?.highlights || [],
    };

  } catch (err) {
    console.error('Weekly Insights Failed:', err);
    return {
      summary: 'Unable to generate insights at this time.',
      tips: [],
      highlights: [],
    };
  }
};

/**
 * Local priority estimation (fallback when AI is unavailable)
 * Uses simple heuristics instead of LLM
 * 
 * @param {string} taskContent - The task title/description
 * @returns {Object} { priority, reasoning }
 */
export const estimatePriorityLocally = (taskContent) => {
  const text = taskContent.toLowerCase();
  
  // High priority keywords
  const urgentKeywords = ['urgent', 'asap', 'now', 'immediately', 'emergency', 'critical', 'deadline'];
  const highKeywords = ['important', 'today', 'tonight', 'must', 'need to', 'required'];
  const lowKeywords = ['sometime', 'maybe', 'eventually', 'later', 'when possible', 'no rush'];
  
  // Check for urgent indicators
  if (urgentKeywords.some(kw => text.includes(kw))) {
    return { priority: 'High', reasoning: 'Contains urgent keywords' };
  }
  
  // Check for high priority indicators
  if (highKeywords.some(kw => text.includes(kw))) {
    return { priority: 'High', reasoning: 'Time-sensitive task' };
  }
  
  // Check for low priority indicators
  if (lowKeywords.some(kw => text.includes(kw))) {
    return { priority: 'Low', reasoning: 'No immediate deadline' };
  }
  
  // Default to medium
  return { priority: 'Medium', reasoning: 'Standard task' };
};

/**
 * Check if AI features are available (Pro+ tier required)
 * This should be called before invoking AI functions
 */
export const checkAIAvailability = async () => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return { available: false, reason: 'Cloud features not configured' };
    }

    // Try a simple health check
    const { data, error } = await supabase.functions.invoke('ai-health', {
      body: { check: true },
    });

    if (error) {
      return { available: false, reason: 'AI service unavailable' };
    }

    return { available: true, reason: null };

  } catch (err) {
    return { available: false, reason: err.message };
  }
};

export default {
  analyzeTaskWithAI,
  prioritizeTasks,
  suggestDueDate,
  generateWeeklyInsights,
  estimatePriorityLocally,
  checkAIAvailability,
};
