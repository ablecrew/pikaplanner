// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3001'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    // Fetch all pending email notifications
    const { data: pending, error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('channel', 'email')
      .eq('metadata->>pending', 'true')
      .limit(50)
    if (fetchError) throw fetchError
    if (!pending?.length) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    let sent = 0
    let failed = 0
    for (const notif of pending) {
      const email = notif.metadata?.email
      const fullName = notif.metadata?.full_name || email?.split('@')[0] || 'Foodie'
      const isFirstLogin = notif.metadata?.first_login
      if (!email) {
        failed++
        continue
      }
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PikaPlan <welcome@pikaplan.com>',
            to: [email],
            subject: isFirstLogin
              ? `🎉 Welcome to PikaPlan, ${fullName}!`
              : `👋 Welcome back, ${fullName}!`,
            html: buildWelcomeEmail({ fullName, isFirstLogin }),
          }),
        })
        if (res.ok) {
          // Mark as sent (remove pending flag)
          const updatedMetadata = { ...notif.metadata }
          delete updatedMetadata.pending
          updatedMetadata.sent_at = new Date().toISOString()
          await supabase
            .from('notification_logs')
            .update({
              metadata: updatedMetadata,
              is_read: true,
              read_at: new Date().toISOString(),
            })
            .eq('id', notif.id)
          sent++
        } else {
          failed++
          console.error(`Failed to send to ${email}:`, await res.text())
        }
      } catch (err) {
        failed++
        console.error(`Error sending to ${email}:`, err)
      }
    }
    return new Response(
      JSON.stringify({ processed: pending.length, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Cron error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
function buildWelcomeEmail({ fullName, isFirstLogin }: { fullName: string; isFirstLogin: boolean }) {
  const features = [
    { emoji: '🍽️', title: 'Discover Meals', desc: 'Meals tailored to your taste, cuisine, and dietary needs.' },
    { emoji: '📅', title: 'Meal Plans', desc: 'Weekly plans with AI-powered suggestions for your household.' },
    { emoji: '🛒', title: 'Smart Shopping', desc: 'Auto-generated shopping lists. One tap to order via M-Pesa.' },
    { emoji: '🏪', title: 'Local Vendors', desc: 'Order from verified vendors with real-time availability.' },
  ]
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1A5C3A,#126e3d);padding:36px 28px;text-align:center;">
<div style="width:52px;height:52px;background:#1A5C3A;border-radius:14px;display:inline-block;">
<svg width="52" height="52" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1A5C3A"/><path d="M12 28 C12 28 14 18 20 16 C26 14 26 20 22 22 C18 24 16 18 20 14" stroke="#32CD32" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="26" cy="14" r="3" fill="#F4A535"/><path d="M18 28 L22 28" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
</div>
<p style="font-size:26px;font-weight:800;color:#fff;margin:12px 0 0;letter-spacing:-0.5px;">Pika<span style="color:#F4A535;">Plan</span></p>
<p style="font-size:10px;color:rgba(255,255,255,0.55);margin:2px 0 0;letter-spacing:2px;text-transform:uppercase;">Smart Meals</p>
</td></tr>
<!-- Greeting -->
<tr><td style="padding:36px 28px 20px;text-align:center;">
<h2 style="margin:0;font-size:22px;font-weight:700;color:#1A5C3A;">
${isFirstLogin ? `🎉 Welcome, ${fullName}!` : `👋 Welcome back, ${fullName}!`}
</h2>
<p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
${isFirstLogin ? 'Your smart meal journey begins now.' : 'Ready to continue where you left off.'}
</p>
</td></tr>
<!-- Features -->
<tr><td style="padding:8px 28px 28px;">
${features.map((f, i) => `
<table cellpadding="0" cellspacing="0" width="100%"><tr>
<td style="width:40px;height:40px;background:#ecfdf5;border-radius:12px;text-align:center;font-size:18px;">${f.emoji}</td>
<td style="padding-left:12px;${i < 3 ? 'border-bottom:1px solid #f3f4f6;' : ''}padding-top:10px;padding-bottom:10px;">
<p style="margin:0;font-size:13px;font-weight:600;color:#111827;">${f.title}</p>
<p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${f.desc}</p>
</td></tr></table>
`).join('')}
</td></tr>
<!-- CTA -->
<tr><td style="padding:0 28px 32px;text-align:center;">
<a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;text-align:center;">${isFirstLogin ? 'Start Exploring →' : 'Go to Dashboard →'}</a>
</td></tr>
${isFirstLogin ? `
<!-- Premium upsell -->
<tr><td style="padding:0 28px 28px;text-align:center;">
<table cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:14px;"><tr><td style="padding:18px 20px;text-align:center;">
<p style="margin:0;font-size:12px;font-weight:600;color:#d97706;">⭐ Premium from <strong>KES 14/day</strong></p>
<p style="margin:4px 0 0;font-size:10px;color:#92400e;">Unlimited plans · Vendor discounts · Priority support</p>
<a href="${APP_URL}/pricing" style="display:inline-block;margin-top:10px;background:#F4A535;color:#fff;padding:8px 24px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">See Plans</a>
</td></tr></table>
</td></tr>
` : ''}
<!-- Footer -->
<tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
<p style="margin:0;font-size:10px;color:#d1d5db;">© ${new Date().getFullYear()} PikaPlan. All rights reserved.</p>
<p style="margin:6px 0 0;font-size:10px;color:#d1d5db;">
<a href="${APP_URL}/privacy" style="color:#9ca3af;">Privacy</a> · <a href="${APP_URL}/terms" style="color:#9ca3af;">Terms</a>
</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}
