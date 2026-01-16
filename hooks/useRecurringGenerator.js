/**
 * useRecurringGenerator Hook
 * Task List App 2026
 * 
 * Automatically generates recurring task instances on app startup
 * and when new series are created.
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  generateAllMissingInstances, 
  shouldGenerateMoreInstances 
} from '../utils/recurringGenerator';

/**
 * Hook to manage automatic generation of recurring task instances
 * @param {Object} options
 * @param {Array} options.recurringSeries - All recurring series
 * @param {Array} options.tasks - All tasks
 * @param {Function} options.addGeneratedTasks - Function to add generated tasks
 * @param {boolean} options.loading - Whether data is still loading
 * @returns {{ regenerate: Function, isGenerating: boolean }}
 */
export const useRecurringGenerator = ({ 
  recurringSeries, 
  tasks, 
  addGeneratedTasks,
  loading 
}) => {
  const isGeneratingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  /**
   * Generate missing instances for all series
   */
  const regenerate = useCallback(() => {
    if (isGeneratingRef.current || !recurringSeries?.length) {
      return;
    }

    isGeneratingRef.current = true;

    try {
      // Find series that need more instances
      const seriesNeedingGeneration = recurringSeries.filter(series =>
        series.active && shouldGenerateMoreInstances(series, tasks)
      );

      if (seriesNeedingGeneration.length === 0) {
        isGeneratingRef.current = false;
        return;
      }

      // Generate missing instances
      const newInstances = generateAllMissingInstances(
        seriesNeedingGeneration,
        tasks,
        30 // Generate for next 30 days
      );

      if (newInstances.length > 0) {
        addGeneratedTasks(newInstances);
      }
    } catch (error) {
      console.error('Error generating recurring instances:', error);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [recurringSeries, tasks, addGeneratedTasks]);

  /**
   * Initial generation on app load
   */
  useEffect(() => {
    if (!loading && !hasInitializedRef.current && recurringSeries?.length > 0) {
      hasInitializedRef.current = true;
      // Delay slightly to ensure all data is loaded
      const timeout = setTimeout(() => {
        regenerate();
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [loading, recurringSeries, regenerate]);

  return {
    regenerate,
    isGenerating: isGeneratingRef.current,
  };
};

export default useRecurringGenerator;
