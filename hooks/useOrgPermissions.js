/**
 * useOrgPermissions Hook
 * Bitrova TaskList App - Phase 3 B2B (Milestone 3)
 * 
 * Clean permissions API for role-based UI guards.
 * 
 * Usage:
 *   const { can, role, isOwner, isAdmin } = useOrgPermissions();
 *   if (can('invite_members')) { ... }
 *   if (can('delete_org')) { ... }
 */

import { useMemo } from 'react';
import { useOrganization } from '../context/OrganizationContext';

// ============================================
// PERMISSION MATRIX (deterministic by role — not fetched)
// ============================================
const PERMISSION_MATRIX = {
  owner: [
    'invite_members',
    'remove_members',
    'change_roles',
    'edit_tasks',
    'delete_tasks',
    'view_members',
    'view_tasks',
    'manage_content',
    'manage_settings',
    'delete_org',
    'change_owner',
    'manage_billing',
    'view_analytics',
    'create_workspace',
    'delete_workspace',
  ],
  admin: [
    'invite_members',
    'remove_members',
    'change_roles',
    'edit_tasks',
    'delete_tasks',
    'view_members',
    'view_tasks',
    'manage_content',
    'manage_settings',
    'view_analytics',
    'create_workspace',
    // NOT: delete_org, change_owner, manage_billing
  ],
  editor: [
    'edit_tasks',
    'view_members',
    'view_tasks',
    'manage_content',
  ],
  viewer: [
    'view_members',
    'view_tasks',
  ],
};

/**
 * @returns {{ can: (permission: string) => boolean, role: string, isOwner: boolean, isAdmin: boolean, isEditor: boolean }}
 */
export default function useOrgPermissions() {
  const { membership, currentOrganization } = useOrganization();

  // Personal space → full access (no org guard applies)
  const isPersonalSpace = !currentOrganization;
  
  const role = isPersonalSpace ? 'owner' : (membership?.role || 'viewer');
  const permissions = PERMISSION_MATRIX[role] || PERMISSION_MATRIX.viewer;

  const permissionSet = useMemo(() => new Set(permissions), [role]);

  const can = (permission) => permissionSet.has(permission);

  return {
    can,
    role,
    isPersonalSpace,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    isEditor: ['owner', 'admin', 'editor'].includes(role),
  };
}
