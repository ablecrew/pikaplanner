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
      .eq('is_read', false)
      .is('read_at', null)
      .limit(100)
      .order('sent_at', { ascending: true, nullsFirst: true })
      
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
      const fullName = notif.metadata?.full_name || email?.split('@')[0] || 'there'
      const trigger = notif.metadata?.trigger

      if (!email) {
        failed++
        await markAsFailed(supabase, notif.id, 'No email address')
        continue
      }

      try {
        // Get email content based on trigger type
        const emailContent = getEmailContent(trigger, notif, fullName, APP_URL)

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PikaPlan <onboarding@resend.dev>',
            to: [email],
            subject: emailContent.subject,
            html: emailContent.html,
          }),
        })

        if (res.ok) {
          await markAsSent(supabase, notif.id)
          sent++
        } else {
          const errorText = await res.text()
          console.error(`Failed to send to ${email}:`, errorText)
          await markAsFailed(supabase, notif.id, errorText)
          failed++
        }
      } catch (err) {
        console.error(`Error sending to ${email}:`, err)
        await markAsFailed(supabase, notif.id, err instanceof Error ? err.message : 'Unknown error')
        failed++
      }
    }

    return new Response(
      JSON.stringify({ processed: pending.length, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Email cron error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Mark notification as sent
async function markAsSent(supabase: any, id: string) {
  await supabase
    .from('notification_logs')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
      metadata: { sent: true, sent_at: new Date().toISOString() },
    })
    .eq('id', id)
}

// Mark notification as failed
async function markAsFailed(supabase: any, id: string, reason: string) {
  await supabase
    .from('notification_logs')
    .update({
      metadata: { sent: false, failed: true, failure_reason: reason },
    })
    .eq('id', id)
}

// Get email content based on trigger type
function getEmailContent(trigger: string, notif: any, fullName: string, appUrl: string) {
  const tier = notif.metadata?.tier || 'subscription'
  const expiresAt = notif.metadata?.expires_at ? new Date(notif.metadata.expires_at).toLocaleDateString('en-GB') : ''
  const amount = notif.metadata?.amount || '0'

  switch (trigger) {
    // ── USER SUBSCRIPTION EXPIRING ──
    case 'user_sub_expiring_7_days':
      return {
        subject: '⏰ Your Subscription Ends in 7 Days',
        html: buildSubscriptionExpiringEmail({ fullName, tier, days: 7, appUrl }),
      }
    case 'user_sub_expiring_1_day':
      return {
        subject: '⚠️ Your Subscription Ends Tomorrow',
        html: buildSubscriptionExpiringEmail({ fullName, tier, days: 1, appUrl }),
      }
    case 'user_sub_expired':
      return {
        subject: '😔 Your Subscription Has Expired',
        html: buildSubscriptionExpiredEmail({ fullName, tier, appUrl }),
      }
    case 'user_sub_renewed':
      return {
        subject: '✅ Subscription Renewed Successfully',
        html: buildSubscriptionRenewedEmail({ fullName, tier, amount, appUrl }),
      }
    case 'user_sub_renewal_failed':
      return {
        subject: '⚠️ Auto-Renewal Failed',
        html: buildRenewalFailedEmail({ fullName, tier, appUrl }),
      }

    // ── VENDOR TRIAL EXPIRING ──
    case 'vendor_trial_expiring_7_days':
      return {
        subject: '⏰ Your Free Trial Ends in 7 Days',
        html: buildVendorTrialExpiringEmail({ fullName, days: 7, appUrl }),
      }
    case 'vendor_trial_expiring_1_day':
      return {
        subject: '⚠️ Last Day of Your Free Trial!',
        html: buildVendorTrialExpiringEmail({ fullName, days: 1, appUrl }),
      }
    case 'vendor_trial_expired':
      return {
        subject: '😔 Your Free Trial Has Expired',
        html: buildVendorTrialExpiredEmail({ fullName, appUrl }),
      }
    case 'vendor_sub_renewed':
      return {
        subject: '✅ Vendor Subscription Renewed',
        html: buildVendorRenewedEmail({ fullName, appUrl }),
      }

    // ── DEFAULT ──
    default:
      return {
        subject: 'PikaPlan Notification',
        html: buildGenericEmail({ fullName, title: notif.title, body: notif.body, appUrl }),
      }
  }
}

// ── EMAIL TEMPLATES WITH LUCIDE ICONS (SVG) ──

function buildSubscriptionExpiringEmail({ fullName, tier, days, appUrl }: { fullName: string; tier: string; days: number; appUrl: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1A5C3A,#126e3d);padding:36px 28px;text-align:center;">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;">
            ${getLucideIcon('clock', '#fff', 28)}
          </div>
          <p style="font-size:26px;font-weight:800;color:#fff;margin:12px 0 0;">Pika<span style="color:#F4A535;">Plan</span></p>
        </td></tr>
        
        <!-- Content -->
        <tr><td style="padding:36px 28px 20px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#1A5C3A;">
            ${days === 1 ? '⚠️ Your Subscription Ends Tomorrow' : '⏰ Your Subscription Ends in ' + days + ' Days'}
          </h2>
          <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Hi ${fullName}, your <strong>${tier}</strong> meal plan subscription ends in ${days} day${days > 1 ? 's' : ''}. 
            Renew now to continue enjoying AI-powered meal planning without interruption!
          </p>
        </td></tr>
        
        <!-- Features -->
        <tr><td style="padding:8px 28px 28px;">
          ${buildFeatureRow('utensils', 'AI Meal Plans', 'Personalized meal suggestions tailored to your preferences')}
          ${buildFeatureRow('shopping-cart', 'Smart Shopping', 'Auto-generated shopping lists with one-tap ordering')}
          ${buildFeatureRow('trending-up', 'Nutrition Tracking', 'Track calories, macros, and health goals')}
        </td></tr>
        
        <!-- CTA -->
        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="${appUrl}/dashboard/user/subscription" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            Renew Subscription →
          </a>
        </td></tr>
        
        <!-- Footer -->
        <tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} PikaPlan. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildSubscriptionExpiredEmail({ fullName, tier, appUrl }: { fullName: string; tier: string; appUrl: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
        <tr><td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:36px 28px;text-align:center;">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;">
            ${getLucideIcon('circle-x', '#fff', 28)}
          </div>
          <p style="font-size:26px;font-weight:800;color:#fff;margin:12px 0 0;">Pika<span style="color:#F4A535;">Plan</span></p>
        </td></tr>
        
        <tr><td style="padding:36px 28px 20px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#dc2626;">😔 Your Subscription Has Expired</h2>
          <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Hi ${fullName}, your <strong>${tier}</strong> plan has expired. You've lost access to AI meal suggestions and shopping lists. 
            Subscribe again to regain full access!
          </p>
        </td></tr>
        
        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="${appUrl}/dashboard/user/subscription" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            Subscribe Now →
          </a>
        </td></tr>
        
        <tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} PikaPlan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildSubscriptionRenewedEmail({ fullName, tier, amount, appUrl }: { fullName: string; tier: string; amount: string; appUrl: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:36px 28px;text-align:center;">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;">
            ${getLucideIcon('check-circle', '#fff', 28)}
          </div>
          <p style="font-size:26px;font-weight:800;color:#fff;margin:12px 0 0;">Pika<span style="color:#F4A535;">Plan</span></p>
        </td></tr>
        
        <tr><td style="padding:36px 28px 20px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#16a34a;">✅ Subscription Renewed Successfully!</h2>
          <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Hi ${fullName}, great news! Your <strong>${tier}</strong> plan has been renewed successfully. 
            ${amount !== '0' ? `<strong>KES ${amount}</strong> was charged to your payment method.` : ''}
            You can continue enjoying uninterrupted meal planning!
          </p>
        </td></tr>
        
        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="${appUrl}/dashboard/meal-generator" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            Start Planning →
          </a>
        </td></tr>
        
        <tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} PikaPlan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildRenewalFailedEmail({ fullName, tier, appUrl }: { fullName: string; tier: string; appUrl: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
        <tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:36px 28px;text-align:center;">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;">
            ${getLucideIcon('alert-circle', '#fff', 28)}
          </div>
          <p style="font-size:26px;font-weight:800;color:#fff;margin:12px 0 0;">Pika<span style="color:#F4A535;">Plan</span></p>
        </td></tr>
        
        <tr><td style="padding:36px 28px 20px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#d97706;">⚠️ Auto-Renewal Failed</h2>
          <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Hi ${fullName}, we couldn't process your auto-renewal for the <strong>${tier}</strong> plan. 
            This could be due to insufficient funds or an expired payment method. 
            Please update your payment details or renew manually to avoid service interruption.
          </p>
        </td></tr>
        
        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="${appUrl}/dashboard/user/subscription" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            Update Payment Method →
          </a>
        </td></tr>
        
        <tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} PikaPlan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildVendorTrialExpiringEmail({ fullName, days, appUrl }: { fullName: string; days: number; appUrl: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1A5C3A,#126e3d);padding:36px 28px;text-align:center;">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;">
            ${getLucideIcon('clock', '#fff', 28)}
          </div>
          <p style="font-size:26px;font-weight:800;color:#fff;margin:12px 0 0;">Pika<span style="color:#F4A535;">Plan</span></p>
        </td></tr>
        
        <tr><td style="padding:36px 28px 20px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#1A5C3A;">
            ${days === 1 ? '⚠️ Last Day of Your Free Trial!' : '⏰ Your Free Trial Ends in ' + days + ' Days'}
          </h2>
          <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Hi ${fullName}, your 2-month free vendor trial ends in ${days} day${days > 1 ? 's' : ''}. 
            Upgrade now to keep your restaurant visible to customers and continue receiving orders!
          </p>
        </td></tr>
        
        <tr><td style="padding:8px 28px 28px;">
          ${buildFeatureRow('store', 'Unlimited Listings', 'Show all your menu items to customers')}
          ${buildFeatureRow('trending-up', 'Priority Visibility', 'Appear higher in search results')}
          ${buildFeatureRow('shield', 'Verified Badge', 'Build trust with verified status')}
        </td></tr>
        
        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="${appUrl}/dashboard/vendor/subscription" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            Upgrade Now →
          </a>
        </td></tr>
        
        <tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} PikaPlan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildVendorTrialExpiredEmail({ fullName, appUrl }: { fullName: string; appUrl: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
        <tr><td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:36px 28px;text-align:center;">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;">
            ${getLucideIcon('circle-x', '#fff', 28)}
          </div>
          <p style="font-size:26px;font-weight:800;color:#fff;margin:12px 0 0;">Pika<span style="color:#F4A535;">Plan</span></p>
        </td></tr>
        
        <tr><td style="padding:36px 28px 20px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#dc2626;">😔 Your Free Trial Has Expired</h2>
          <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Hi ${fullName}, your 2-month free trial has ended. Your restaurant is now hidden from customers. 
            Upgrade to premium to reactivate your listings and start receiving orders again!
          </p>
        </td></tr>
        
        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="${appUrl}/dashboard/vendor/subscription" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            Reactivate Now →
          </a>
        </td></tr>
        
        <tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} PikaPlan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildVendorRenewedEmail({ fullName, appUrl }: { fullName: string; appUrl: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:36px 28px;text-align:center;">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;">
            ${getLucideIcon('check-circle', '#fff', 28)}
          </div>
          <p style="font-size:26px;font-weight:800;color:#fff;margin:12px 0 0;">Pika<span style="color:#F4A535;">Plan</span></p>
        </td></tr>
        
        <tr><td style="padding:36px 28px 20px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#16a34a;">✅ Vendor Subscription Renewed!</h2>
          <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Hi ${fullName}, your vendor subscription has been renewed successfully for another month. 
            Your restaurant remains visible to customers. Happy selling!
          </p>
        </td></tr>
        
        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="${appUrl}/dashboard/vendor/listings" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            Manage Listings →
          </a>
        </td></tr>
        
        <tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} PikaPlan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildGenericEmail({ fullName, title, body, appUrl }: { fullName: string; title: string; body: string; appUrl: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1A5C3A,#126e3d);padding:36px 28px;text-align:center;">
          <p style="font-size:26px;font-weight:800;color:#fff;margin:0;">Pika<span style="color:#F4A535;">Plan</span></p>
        </td></tr>
        
        <tr><td style="padding:36px 28px 20px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#1A5C3A;">${title}</h2>
          <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">${body}</p>
        </td></tr>
        
        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#1A5C3A,#126e3d);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            Go to Dashboard →
          </a>
        </td></tr>
        
        <tr><td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} PikaPlan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// Helper to build feature rows with Lucide icons
function buildFeatureRow(iconName: string, title: string, desc: string) {
  return `
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="width:40px;height:40px;background:#ecfdf5;border-radius:12px;text-align:center;font-size:18px;">
        ${getLucideIcon(iconName, '#16a34a', 20)}
      </td>
      <td style="padding-left:12px;border-bottom:1px solid #f3f4f6;padding-top:10px;padding-bottom:10px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#111827;">${title}</p>
        <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${desc}</p>
      </td>
    </tr>
  </table>`
}

// Lucide Icons as SVG (inline for email compatibility)
function getLucideIcon(name: string, color: string, size: number) {
  const icons: Record<string, string> = {
    'clock': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    'circle-x': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    'check-circle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    'alert-circle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    'utensils': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
    'shopping-cart': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
    'trending-up': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    'store': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`,
    'shield': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    'bell': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  }
  return icons[name] || icons['bell']
}