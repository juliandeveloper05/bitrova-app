/**
 * Invitation Service
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Handles team invitations with email sending via Resend
 */

import { supabase, TABLES } from '../config/supabase';
import { Platform } from 'react-native';

// ============================================
// CONFIGURATION
// ============================================

// Resend API key (use environment variable in production)
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_YOUR_API_KEY';
const APP_URL = Platform.select({
  web: typeof window !== 'undefined' ? window.location.origin : 'https://bitrova.app',
  default: 'https://bitrova.app',
});

// ============================================
// INVITATION CRUD
// ============================================

/**
 * Create and send an invitation
 * @param {Object} params
 * @param {string} params.organizationId - Org to invite to
 * @param {string} params.email - Email to invite
 * @param {string} params.role - Role to assign
 * @param {string} params.invitedBy - User ID of inviter
 * @returns {Promise<Object>} Created invitation
 */
export async function createInvitation({ organizationId, email, role = 'editor', invitedBy }) {
  // Validate email
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  // Check if user already exists in org
  const existingMember = await checkExistingMember(organizationId, email);
  if (existingMember) {
    throw new Error('User is already a member of this organization');
  }

  // Check for pending invitation
  const existingInvite = await checkPendingInvitation(organizationId, email);
  if (existingInvite) {
    throw new Error('An invitation is already pending for this email');
  }

  // Generate secure token
  const token = generateSecureToken();

  // Create invitation record
  const { data: invitation, error } = await supabase
    .from(TABLES.INVITATIONS)
    .insert({
      organization_id: organizationId,
      email: email.toLowerCase(),
      role,
      token,
      invited_by: invitedBy,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select(`
      id,
      email,
      role,
      token,
      expires_at,
      organization:organizations (
        name
      )
    `)
    .single();

  if (error) throw error;

  // Get inviter info
  const { data: inviter } = await supabase
    .from(TABLES.PROFILES)
    .select('display_name, email')
    .eq('id', invitedBy)
    .single();

  // Send invitation email
  try {
    await sendInvitationEmail({
      to: email,
      inviterName: inviter?.display_name || inviter?.email || 'A team member',
      organizationName: invitation.organization?.name || 'Organization',
      role,
      inviteUrl: `${APP_URL}/invite?token=${token}`,
      expiresAt: invitation.expires_at,
    });
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
    // Don't throw - invitation is still valid, user can share link manually
  }

  return invitation;
}

/**
 * Get pending invitations for an organization
 */
export async function getPendingInvitations(organizationId) {
  const { data, error } = await supabase
    .from(TABLES.INVITATIONS)
    .select(`
      id,
      email,
      role,
      status,
      expires_at,
      created_at,
      inviter:profiles!invited_by (
        display_name,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Accept an invitation
 * @param {string} token - Invitation token
 * @param {string} userId - Accepting user's ID
 */
export async function acceptInvitation(token, userId) {
  // Find invitation
  const { data: invitation, error: findError } = await supabase
    .from(TABLES.INVITATIONS)
    .select(`
      id,
      organization_id,
      role,
      status,
      expires_at
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (findError || !invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from(TABLES.INVITATIONS)
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    throw new Error('Invitation has expired');
  }

  // Create membership
  const { error: memberError } = await supabase
    .from(TABLES.MEMBERS)
    .insert({
      user_id: userId,
      organization_id: invitation.organization_id,
      role: invitation.role,
      status: 'active',
      invited_by: invitation.invited_by,
    });

  if (memberError) {
    if (memberError.code === '23505') { // Unique constraint
      throw new Error('You are already a member of this organization');
    }
    throw memberError;
  }

  // Mark invitation as accepted
  await supabase
    .from(TABLES.INVITATIONS)
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  // Log activity
  await supabase
    .from(TABLES.ACTIVITIES)
    .insert({
      organization_id: invitation.organization_id,
      actor_id: userId,
      action: 'member.joined',
      target_type: 'member',
      target_id: userId,
      metadata: { role: invitation.role },
    });

  return { success: true, organizationId: invitation.organization_id };
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId) {
  const { error } = await supabase
    .from(TABLES.INVITATIONS)
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) throw error;
  return { success: true };
}

/**
 * Resend invitation email
 */
export async function resendInvitation(invitationId) {
  const { data: invitation, error } = await supabase
    .from(TABLES.INVITATIONS)
    .select(`
      id,
      email,
      role,
      token,
      expires_at,
      invited_by,
      organization:organizations (name)
    `)
    .eq('id', invitationId)
    .eq('status', 'pending')
    .single();

  if (error || !invitation) {
    throw new Error('Invitation not found or already used');
  }

  // Extend expiration
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from(TABLES.INVITATIONS)
    .update({ expires_at: newExpiry })
    .eq('id', invitationId);

  // Get inviter
  const { data: inviter } = await supabase
    .from(TABLES.PROFILES)
    .select('display_name, email')
    .eq('id', invitation.invited_by)
    .single();

  // Resend email
  await sendInvitationEmail({
    to: invitation.email,
    inviterName: inviter?.display_name || inviter?.email || 'A team member',
    organizationName: invitation.organization?.name || 'Organization',
    role: invitation.role,
    inviteUrl: `${APP_URL}/invite?token=${invitation.token}`,
    expiresAt: newExpiry,
  });

  return { success: true };
}

// ============================================
// EMAIL SENDING (Resend)
// ============================================

/**
 * Send invitation email via Resend
 */
async function sendInvitationEmail({ to, inviterName, organizationName, role, inviteUrl, expiresAt }) {
  // Skip in development if no API key
  if (!RESEND_API_KEY || RESEND_API_KEY === 're_YOUR_API_KEY') {
    console.log('📧 [DEV] Invitation email would be sent to:', to);
    console.log('   Invite URL:', inviteUrl);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Bitrova <invitations@bitrova.app>',
      to: [to],
      subject: `${inviterName} invited you to join ${organizationName} on Bitrova`,
      html: generateInvitationEmailHTML({
        inviterName,
        organizationName,
        role,
        inviteUrl,
        expiresAt,
      }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }

  return response.json();
}

/**
 * Generate invitation email HTML
 */
function generateInvitationEmailHTML({ inviterName, organizationName, role, inviteUrl, expiresAt }) {
  const roleLabel = {
    admin: 'an Administrator',
    editor: 'an Editor',
    viewer: 'a Viewer',
    guest: 'a Guest',
  }[role] || 'a member';

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${organizationName} on Bitrova</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 32px;
    }
    .invite-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .org-name {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }
    .role-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 500;
      margin-top: 8px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .footer {
      padding: 24px 32px;
      background: #f8fafc;
      font-size: 14px;
      color: #6b7280;
    }
    .expiry {
      color: #9ca3af;
      font-size: 13px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Bitrova</h1>
    </div>
    <div class="content">
      <p>Hi there!</p>
      <p><strong>${inviterName}</strong> has invited you to join their team on Bitrova as ${roleLabel}.</p>
      
      <div class="invite-box">
        <div class="org-name">${organizationName}</div>
        <div class="role-badge">${role.charAt(0).toUpperCase() + role.slice(1)}</div>
      </div>
      
      <center>
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </center>
      
      <p class="expiry">This invitation expires on ${expiryDate}</p>
    </div>
    <div class="footer">
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <p>— The Bitrova Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// HELPERS
// ============================================

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateSecureToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function checkExistingMember(organizationId, email) {
  const { data: user } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) return null;

  const { data: member } = await supabase
    .from(TABLES.MEMBERS)
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  return member;
}

async function checkPendingInvitation(organizationId, email) {
  const { data: invitation } = await supabase
    .from(TABLES.INVITATIONS)
    .select('id')
    .eq('organization_id', organizationId)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .single();

  return invitation;
}

export default {
  createInvitation,
  getPendingInvitations,
  acceptInvitation,
  revokeInvitation,
  resendInvitation,
};
