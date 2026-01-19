/**
 * Workspace Context
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Manages workspace state within an organization
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, TABLES } from '../config/supabase';
import { useOrganization } from './OrganizationContext';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

// Storage key prefix for current workspace per org
const CURRENT_WORKSPACE_KEY = '@bitrova_current_workspace_';

/**
 * Hook to access workspace context
 */
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

/**
 * Workspace Provider Component
 */
export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const { currentOrganization, membership } = useOrganization();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState(null);
  const [kanbanColumns, setKanbanColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // LOAD WORKSPACES
  // ============================================

  /**
   * Fetch all accessible workspaces in current organization
   */
  const loadWorkspaces = useCallback(async () => {
    if (!currentOrganization) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: ws, error: wsError } = await supabase
        .from(TABLES.WORKSPACES)
        .select(`
          id,
          name,
          description,
          type,
          visibility,
          settings,
          created_at,
          created_by,
          team:teams (
            id,
            name,
            color
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: true });

      if (wsError) throw wsError;

      setWorkspaces(ws || []);

      // Restore or set current workspace
      const storageKey = CURRENT_WORKSPACE_KEY + currentOrganization.id;
      const savedWorkspaceId = await AsyncStorage.getItem(storageKey);
      const savedWorkspace = ws?.find(w => w.id === savedWorkspaceId);
      
      if (savedWorkspace) {
        await setCurrentWorkspace(savedWorkspace.id, ws);
      } else if (ws && ws.length > 0) {
        await setCurrentWorkspace(ws[0].id, ws);
      } else {
        setCurrentWorkspaceState(null);
      }

    } catch (err) {
      console.error('Error loading workspaces:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  // Reload when org changes
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // ============================================
  // SWITCH WORKSPACE
  // ============================================

  /**
   * Set current workspace
   */
  const setCurrentWorkspace = useCallback(async (workspaceId, workspacesList = workspaces) => {
    const workspace = workspacesList.find(w => w.id === workspaceId);
    if (!workspace) return;

    setCurrentWorkspaceState(workspace);

    // Persist selection per org
    if (currentOrganization) {
      const storageKey = CURRENT_WORKSPACE_KEY + currentOrganization.id;
      await AsyncStorage.setItem(storageKey, workspaceId);
    }

    // Load kanban columns if kanban type
    if (workspace.type === 'kanban') {
      await loadKanbanColumns(workspaceId);
    } else {
      setKanbanColumns([]);
    }
  }, [workspaces, currentOrganization]);

  // ============================================
  // KANBAN COLUMNS
  // ============================================

  /**
   * Load kanban columns for a workspace
   */
  const loadKanbanColumns = useCallback(async (workspaceId) => {
    try {
      const { data: columns, error } = await supabase
        .from(TABLES.KANBAN_COLUMNS)
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true });

      if (error) throw error;
      setKanbanColumns(columns || []);
    } catch (err) {
      console.error('Error loading kanban columns:', err);
      setKanbanColumns([]);
    }
  }, []);

  /**
   * Create a new kanban column
   */
  const createKanbanColumn = useCallback(async ({ name, color, wipLimit }) => {
    if (!currentWorkspace) throw new Error('No workspace selected');

    const position = kanbanColumns.length;

    const { data: column, error } = await supabase
      .from(TABLES.KANBAN_COLUMNS)
      .insert({
        workspace_id: currentWorkspace.id,
        name,
        color: color || '#94a3b8',
        position,
        wip_limit: wipLimit,
      })
      .select()
      .single();

    if (error) throw error;

    setKanbanColumns(prev => [...prev, column]);
    return column;
  }, [currentWorkspace, kanbanColumns]);

  /**
   * Reorder kanban columns
   */
  const reorderColumns = useCallback(async (columnId, newPosition) => {
    const oldIndex = kanbanColumns.findIndex(c => c.id === columnId);
    if (oldIndex === -1) return;

    // Optimistic update
    const newColumns = [...kanbanColumns];
    const [removed] = newColumns.splice(oldIndex, 1);
    newColumns.splice(newPosition, 0, removed);
    
    // Update positions
    const updatedColumns = newColumns.map((col, idx) => ({ ...col, position: idx }));
    setKanbanColumns(updatedColumns);

    // Persist to database
    try {
      for (const col of updatedColumns) {
        await supabase
          .from(TABLES.KANBAN_COLUMNS)
          .update({ position: col.position })
          .eq('id', col.id);
      }
    } catch (err) {
      console.error('Error reordering columns:', err);
      // Reload on error
      await loadKanbanColumns(currentWorkspace.id);
    }
  }, [kanbanColumns, currentWorkspace]);

  // ============================================
  // WORKSPACE CRUD
  // ============================================

  /**
   * Create a new workspace
   */
  const createWorkspace = useCallback(async ({ name, description, type = 'list', visibility = 'team', teamId }) => {
    if (!currentOrganization || !user) throw new Error('Not authenticated');

    // Check workspace limit
    if (workspaces.length >= currentOrganization.max_workspaces) {
      throw new Error(`Workspace limit reached (${currentOrganization.max_workspaces}). Upgrade plan for more.`);
    }

    const { data: workspace, error } = await supabase
      .from(TABLES.WORKSPACES)
      .insert({
        organization_id: currentOrganization.id,
        team_id: teamId,
        name,
        description,
        type,
        visibility,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    setWorkspaces(prev => [...prev, workspace]);
    return workspace;
  }, [currentOrganization, user, workspaces]);

  /**
   * Update workspace settings
   */
  const updateWorkspace = useCallback(async (workspaceId, updates) => {
    const { data, error } = await supabase
      .from(TABLES.WORKSPACES)
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) throw error;

    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, ...data } : w));

    if (currentWorkspace?.id === workspaceId) {
      setCurrentWorkspaceState(prev => ({ ...prev, ...data }));
    }

    return data;
  }, [currentWorkspace]);

  /**
   * Delete workspace
   */
  const deleteWorkspace = useCallback(async (workspaceId) => {
    const { error } = await supabase
      .from(TABLES.WORKSPACES)
      .delete()
      .eq('id', workspaceId);

    if (error) throw error;

    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));

    // Switch to next workspace if deleted current
    if (currentWorkspace?.id === workspaceId) {
      const remaining = workspaces.filter(w => w.id !== workspaceId);
      if (remaining.length > 0) {
        await setCurrentWorkspace(remaining[0].id, remaining);
      } else {
        setCurrentWorkspaceState(null);
      }
    }
  }, [currentWorkspace, workspaces]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // State
    workspaces,
    currentWorkspace,
    kanbanColumns,
    loading,
    error,

    // Actions
    loadWorkspaces,
    setCurrentWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,

    // Kanban
    loadKanbanColumns,
    createKanbanColumn,
    reorderColumns,

    // Helpers
    isKanban: currentWorkspace?.type === 'kanban',
    workspaceCount: workspaces.length,
    canCreateWorkspace: workspaces.length < (currentOrganization?.max_workspaces || 2),
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceContext;
