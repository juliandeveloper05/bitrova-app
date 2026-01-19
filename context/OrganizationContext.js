/**
 * Organization Context
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Manages organization state and multi-tenant context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, TABLES } from '../config/supabase';
import { useAuth } from './AuthContext';
import { clearRBACCache } from '../services/rbacService';

const OrganizationContext = createContext();

// Storage key for current org
const CURRENT_ORG_KEY = '@bitrova_current_org';

/**
 * Hook to access organization context
 */
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

/**
 * Organization Provider Component
 */
export const OrganizationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganizationState] = useState(null);
  const [membership, setMembership] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // LOAD ORGANIZATIONS
  // ============================================

  /**
   * Fetch all organizations user is a member of
   */
  const loadOrganizations = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setOrganizations([]);
      setCurrentOrganizationState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user's memberships with org details
      const { data: memberships, error: membershipsError } = await supabase
        .from(TABLES.MEMBERS)
        .select(`
          id,
          role,
          status,
          joined_at,
          organization:organizations (
            id,
            name,
            slug,
            plan,
            subscription_status,
            max_members,
            max_workspaces,
            settings,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (membershipsError) throw membershipsError;

      // Extract organizations from memberships
      const orgs = memberships
        .filter(m => m.organization)
        .map(m => ({
          ...m.organization,
          membershipId: m.id,
          role: m.role,
          joinedAt: m.joined_at,
        }));

      setOrganizations(orgs);

      // Restore or set current org
      const savedOrgId = await AsyncStorage.getItem(CURRENT_ORG_KEY);
      const savedOrg = orgs.find(o => o.id === savedOrgId);
      
      if (savedOrg) {
        await setCurrentOrganization(savedOrg.id);
      } else if (orgs.length > 0) {
        await setCurrentOrganization(orgs[0].id);
      }

    } catch (err) {
      console.error('Error loading organizations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load on auth change
  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // ============================================
  // SWITCH ORGANIZATION
  // ============================================

  /**
   * Set current organization and load its data
   */
  const setCurrentOrganization = useCallback(async (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (!org && organizations.length > 0) {
      // Reload if org not found (might be new)
      await loadOrganizations();
      return;
    }

    setCurrentOrganizationState(org);
    clearRBACCache(); // Clear RBAC cache on org switch
    
    // Persist selection
    await AsyncStorage.setItem(CURRENT_ORG_KEY, orgId);

    // Load membership details
    if (org) {
      const { data: member } = await supabase
        .from(TABLES.MEMBERS)
        .select('*')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .single();
      
      setMembership(member);

      // Load org members
      await loadMembers(orgId);
    }
  }, [organizations, user]);

  // ============================================
  // MEMBERS MANAGEMENT
  // ============================================

  /**
   * Load members of an organization
   */
  const loadMembers = useCallback(async (orgId) => {
    try {
      const { data: membersList, error: membersError } = await supabase
        .from(TABLES.MEMBERS)
        .select(`
          id,
          role,
          status,
          joined_at,
          last_active_at,
          user:auth.users!user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true });

      if (membersError) {
        // Fallback without user join (RLS might block)
        const { data: simpleMembers } = await supabase
          .from(TABLES.MEMBERS)
          .select('*')
          .eq('organization_id', orgId);
        
        setMembers(simpleMembers || []);
      } else {
        setMembers(membersList || []);
      }
    } catch (err) {
      console.error('Error loading members:', err);
    }
  }, []);

  // ============================================
  // ORGANIZATION CRUD
  // ============================================

  /**
   * Create a new organization
   */
  const createOrganization = useCallback(async ({ name, slug }) => {
    if (!user) throw new Error('Must be authenticated');

    try {
      // Generate slug if not provided
      const orgSlug = slug || name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from(TABLES.ORGANIZATIONS)
        .insert({
          name,
          slug: orgSlug,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from(TABLES.MEMBERS)
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'owner',
          status: 'active',
        });

      if (memberError) throw memberError;

      // Create default workspace
      await supabase
        .from(TABLES.WORKSPACES)
        .insert({
          organization_id: org.id,
          name: 'General',
          type: 'list',
          visibility: 'organization',
          created_by: user.id,
        });

      // Reload organizations
      await loadOrganizations();

      return { success: true, organization: org };
    } catch (err) {
      console.error('Error creating organization:', err);
      throw err;
    }
  }, [user, loadOrganizations]);

  /**
   * Update organization settings
   */
  const updateOrganization = useCallback(async (orgId, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORGANIZATIONS)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setOrganizations(prev => 
        prev.map(o => o.id === orgId ? { ...o, ...data } : o)
      );

      if (currentOrganization?.id === orgId) {
        setCurrentOrganizationState(prev => ({ ...prev, ...data }));
      }

      return { success: true, organization: data };
    } catch (err) {
      console.error('Error updating organization:', err);
      throw err;
    }
  }, [currentOrganization]);

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Check if current user is owner of current org
   */
  const isOwner = membership?.role === 'owner';

  /**
   * Check if current user is admin or owner
   */
  const isAdmin = ['owner', 'admin'].includes(membership?.role);

  /**
   * Get member count
   */
  const memberCount = members.filter(m => m.status === 'active').length;

  /**
   * Check if at plan limit
   */
  const isAtMemberLimit = memberCount >= (currentOrganization?.max_members || 3);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // State
    organizations,
    currentOrganization,
    membership,
    members,
    loading,
    error,

    // Actions
    loadOrganizations,
    setCurrentOrganization,
    createOrganization,
    updateOrganization,
    loadMembers,

    // Helpers
    isOwner,
    isAdmin,
    memberCount,
    isAtMemberLimit,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export default OrganizationContext;
