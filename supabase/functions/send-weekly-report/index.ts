/**
 * Supabase Edge Function: send-weekly-report
 * TaskList App - Phase 4 Monetization
 * 
 * Generates and sends weekly productivity email reports
 * 
 * Deploy: supabase functions deploy send-weekly-report
 * Set secrets:
 *   supabase secrets set RESEND_API_KEY=re_...
 *   supabase secrets set FROM_EMAIL=noreply@bitrova.app
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Bitrova <noreply@resend.dev>'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date()
    const dayOfWeek = today.getDay()

    // Find users who should receive reports today
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, display_name, weekly_report_day, tier')
      .eq('weekly_report_enabled', true)
      .eq('weekly_report_day', dayOfWeek)
      .in('tier', ['pro', 'enterprise']) // Only Pro/Enterprise users

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to send reports to today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const user of users) {
      try {
        // Get stats for the past 7 days
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, completed, created_at, updated_at, category, priority')
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toISOString())

        if (tasksError) throw tasksError

        // Calculate stats
        const totalTasks = tasks?.length || 0
        const completedTasks = tasks?.filter(t => t.completed).length || 0
        const completionRate = totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100) 
          : 0

        // Category breakdown
        const categoryBreakdown = tasks?.reduce((acc: Record<string, number>, task) => {
          const cat = task.category || 'personal'
          acc[cat] = (acc[cat] || 0) + 1
          return acc
        }, {}) || {}

        // Generate email HTML
        const emailHtml = generateEmailHtml({
          displayName: user.display_name || user.email?.split('@')[0] || 'User',
          totalTasks,
          completedTasks,
          completionRate,
          categoryBreakdown,
          weekStart: weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weekEnd: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })

        // Send via Resend
        if (RESEND_API_KEY) {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: user.email,
              subject: `📊 Your Bitrova Weekly Report - ${completedTasks} tasks completed`,
              html: emailHtml,
            }),
          })

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text()
            throw new Error(`Resend API error: ${errorText}`)
          }

          results.push({ userId: user.id, status: 'sent' })
        } else {
          results.push({ userId: user.id, status: 'skipped', reason: 'No Resend API key' })
        }

      } catch (userError) {
        console.error(`Failed to send report to user ${user.id}:`, userError)
        results.push({ 
          userId: user.id, 
          status: 'failed', 
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Weekly report function error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailHtml(stats: {
  displayName: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  categoryBreakdown: Record<string, number>
  weekStart: string
  weekEnd: string
}): string {
  const categoryRows = Object.entries(stats.categoryBreakdown)
    .map(([cat, count]) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-transform: capitalize;">${cat}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${count}</td>
      </tr>
    `)
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">📊 Weekly Report</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
        ${stats.weekStart} - ${stats.weekEnd}
      </p>
    </div>
    
    <!-- Greeting -->
    <div style="padding: 24px 32px 0 32px;">
      <p style="color: #333; font-size: 16px; margin: 0;">
        Hi ${stats.displayName},
      </p>
      <p style="color: #666; font-size: 15px; margin: 12px 0 0 0;">
        Here's your productivity summary for the past week.
      </p>
    </div>
    
    <!-- Stats Grid -->
    <div style="padding: 24px 32px; display: flex; gap: 16px;">
      <div style="flex: 1; background: #F9FAFB; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #8B5CF6;">${stats.completedTasks}</div>
        <div style="color: #666; font-size: 13px; margin-top: 4px;">Completed</div>
      </div>
      <div style="flex: 1; background: #F9FAFB; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #22C55E;">${stats.completionRate}%</div>
        <div style="color: #666; font-size: 13px; margin-top: 4px;">Completion Rate</div>
      </div>
      <div style="flex: 1; background: #F9FAFB; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #F59E0B;">${stats.totalTasks}</div>
        <div style="color: #666; font-size: 13px; margin-top: 4px;">Tasks Created</div>
      </div>
    </div>
    
    <!-- Category Breakdown -->
    ${Object.keys(stats.categoryBreakdown).length > 0 ? `
    <div style="padding: 0 32px 24px 32px;">
      <h3 style="color: #333; font-size: 16px; margin: 0 0 12px 0;">By Category</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${categoryRows}
      </table>
    </div>
    ` : ''}
    
    <!-- CTA -->
    <div style="padding: 0 32px 32px 32px; text-align: center;">
      <a href="https://bitrova.app" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Open Bitrova
      </a>
    </div>
    
    <!-- Footer -->
    <div style="background: #F9FAFB; padding: 20px 32px; text-align: center;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        You're receiving this because you enabled weekly reports in Bitrova settings.
        <br>
        <a href="#" style="color: #8B5CF6;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}
