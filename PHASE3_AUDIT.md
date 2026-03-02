# Phase 3 — Data Isolation Audit (Milestone 4)

Every file below was audited for multi-tenant data isolation.
Queries that previously filtered only by `user_id` now also filter by `organization_id` when an organization context is active.

## Changed Files

| File | Change | Status |
|------|--------|--------|
| `services/cloudSyncService.js` | Added `activeOrgId` parameter to `uploadToCloud`, `downloadFromCloud`, `syncTasks`, and `taskToCloudFormat`. Queries now branch: `organization_id = activeOrgId` when in an org, `organization_id IS NULL` for personal space. | ✅ Done |

## Reviewed — No Changes Needed

| File | Reason |
|------|--------|
| `context/TaskContext.js` | Uses local AsyncStorage only (`loadTasks`/`saveTasks`). Does not query Supabase directly. Isolation is handled at the sync layer. |
| `context/WorkspaceContext.js` | Already scoped by org — uses `OrganizationContext.currentOrganization.id` in all queries. |
| `context/OrganizationContext.js` | Manages org membership — inherently multi-tenant. |
| `services/rbacService.js` | Queries `TABLES.MEMBERS` by `organization_id` — already tenant-isolated. |
| `services/invitationService.js` | Queries by `organization_id` in all functions — already isolated. |
| `services/commentService.js` | Queries tasks for validation but uses task-level RLS — inherits isolation from task ownership. |

## RLS Note

All Supabase-side enforcement depends on the Row Level Security policies defined in the spec's SQL migration. These policies are the **source of truth** — client-side filtering is defense-in-depth.
