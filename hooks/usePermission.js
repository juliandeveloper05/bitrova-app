/**
 * usePermission Hook
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * React hook for checking user permissions
 */

import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '../context/OrganizationContext';
import rbacService, { Permission, ROLES } from '../services/rbacService';

/**
 * Hook to check if current user has a specific permission
 * 
 * @param {string} permission - Permission to check (from Permission enum)
 * @param {Object} context - Optional context (workspaceId, taskId)
 * @returns {{ hasPermission: boolean, loading: boolean, refresh: Function }}
 * 
 * @example
 * const { hasPermission } = usePermission(Permission.TASK_CREATE);
 * if (hasPermission) {
 *   // Show create button
 * }
 */
export function usePermission(permission, context = {}) {
  const { currentOrganization, membership } = useOrganization();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPermission = useCallback(async () => {
    if (!currentOrganization || !membership) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allowed = await rbacService.hasPermission(permission, {
        organizationId: currentOrganization.id,
        ...context,
      });
      setHasPermission(allowed);
    } catch (error) {
      console.error('Permission check failed:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, [permission, currentOrganization, membership, context.workspaceId, context.taskId]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    loading,
    refresh: checkPermission,
  };
}

/**
 * Hook to check multiple permissions at once
 * 
 * @param {string[]} permissions - Array of permissions to check
 * @param {Object} context - Optional context
 * @returns {{ permissions: Record<string, boolean>, loading: boolean, hasAll: boolean, hasAny: boolean }}
 */
export function usePermissions(permissions, context = {}) {
  const { currentOrganization, membership } = useOrganization();
  const [permissionMap, setPermissionMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAllPermissions = async () => {
      if (!currentOrganization || !membership) {
        setPermissionMap({});
        setLoading(false);
        return;
      }

      setLoading(true);
      const results = {};

      for (const permission of permissions) {
        try {
          results[permission] = await rbacService.hasPermission(permission, {
            organizationId: currentOrganization.id,
            ...context,
          });
        } catch {
          results[permission] = false;
        }
      }

      setPermissionMap(results);
      setLoading(false);
    };

    checkAllPermissions();
  }, [permissions.join(','), currentOrganization?.id, membership?.role]);

  const hasAll = Object.values(permissionMap).every(Boolean);
  const hasAny = Object.values(permissionMap).some(Boolean);

  return {
    permissions: permissionMap,
    loading,
    hasAll,
    hasAny,
  };
}

/**
 * Hook to get current user's role info
 * 
 * @returns {{ role: string, roleInfo: Object, isOwner: boolean, isAdmin: boolean }}
 */
export function useRole() {
  const { membership } = useOrganization();

  const role = membership?.role || 'guest';
  const roleInfo = ROLES[role] || ROLES.guest;
  
  return {
    role,
    roleInfo,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    isEditor: ['owner', 'admin', 'editor'].includes(role),
    isViewer: ['owner', 'admin', 'editor', 'viewer'].includes(role),
  };
}

/**
 * Hook to get roles that can be assigned by current user
 * 
 * @returns {Array<{value: string, label: string, description: string}>}
 */
export function useAssignableRoles() {
  const { role } = useRole();
  return rbacService.getAssignableRoles(role);
}

// Re-export Permission enum for convenience
export { Permission };

export default usePermission;
