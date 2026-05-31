import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function WelcomeEmail({ fullName, isFirstLogin }: { fullName: string; isFirstLogin: boolean }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Poppins',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,92,58,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1A5C3A 0%,#126e3d 100%);padding:40px 32px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width:56px;height:56px;background-color:#1A5C3A;border-radius:14px;display:inline-block;position:relative;">
                      <svg width="56" height="56" viewBox="0 0 40 40" fill="none" style="display:block;">
                        <rect width="40" height="40" rx="10" fill="#1A5C3A"/>
                        <path d="M12 28 C12 28 14 18 20 16 C26 14 26 20 22 22 C18 24 16 18 20 14" stroke="#32CD32" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                        <circle cx="26" cy="14" r="3" fill="#F4A535"/>
                        <path d="M18 28 L22 28" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        <path d="M16 31 L24 31" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                      Pika<span style="color:#F4A535;">Plan</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:4px;">
                    <span style="font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">Smart Meals</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:40px 32px 24px;text-align:center;">
              <h2 style="margin:0;font-size:24px;font-weight:700;color:#1A5C3A;line-height:1.3;">
                ${isFirstLogin
                  ? `🎉 Welcome to PikaPlan, ${fullName}!`
                  : `👋 Welcome back, ${fullName}!`
                }
              </h2>
              <p style="margin:12px 0 0;font-size:15px;color:#6b7280;line-height:1.6;">
                ${isFirstLogin
                  ? "Your smart meal journey begins now. We're thrilled to have you on board!"
                  : "Ready to continue your meal planning journey? Let's pick up right where you left off."
                }
              </p>
            </td>
          </tr>

          <!-- Features Grid -->
          <tr>
            <td style="padding:8px 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  { icon: '🍽️', title: 'Discover Meals', desc: 'Browse meals tailored to your taste, cuisine preferences, and dietary needs.' },
                  { icon: '📅', title: 'Meal Plans', desc: 'Create weekly meal plans with AI-powered suggestions for your household.' },
                  { icon: '🛒', title: 'Smart Shopping', desc: 'Auto-generate shopping lists from your meal plans. One tap to order.' },
                  { icon: '🏪', title: 'Local Vendors', desc: 'Order from verified local vendors with M-Pesa checkout integration.' },
                ].map((feat, i) => `
                  <tr>
                    <td style="padding:12px 0;${i < 3 ? 'border-bottom:1px solid #f3f4f6;' : ''}">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width:44px;height:44px;background-color:#ecfdf5;border-radius:12px;text-align:center;vertical-align:middle;font-size:20px;">
                            ${feat.icon}
                          </td>
                          <td style="padding-left:14px;">
                            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${feat.title}</p>
                            <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;line-height:1.4;">${feat.desc}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px 40px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard"
                 style="display:inline-block;background:linear-gradient(135deg,#1A5C3A 0%,#126e3d 100%);color:#ffffff;padding:16px 40px;border-radius:14px;text-decoration:none;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(26,92,58,0.3);">
                ${isFirstLogin ? 'Start Exploring →' : 'Go to Dashboard →'}
              </a>
            </td>
          </tr>

          <!-- Discover Link -->
          ${isFirstLogin ? `
          <tr>
            <td style="padding:0 32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">
                Or <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/discover" style="color:#F4A535;text-decoration:none;font-weight:600;">browse available meals</a> right now
              </p>
            </td>
          </tr>
          ` : ''}

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #f3f4f6;">
            </td>
          </tr>

          <!-- Premium Banner (first login only) -->
          ${isFirstLogin ? `
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border-radius:14px;width:100%;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:#d97706;">
                      ⭐ Upgrade to Premium — from just <strong>KES 14/day</strong>
                    </p>
                    <p style="margin:6px 0 0;font-size:11px;color:#92400e;">
                      Unlimited meal plans · Vendor discounts · Priority support
                    </p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/pricing"
                       style="display:inline-block;margin-top:12px;background:#F4A535;color:#ffffff;padding:10px 28px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;">
                      See Plans
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#d1d5db;line-height:1.6;">
                © ${new Date().getFullYear()} PikaPlan. All rights reserved.<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/privacy" style="color:#9ca3af;text-decoration:underline;">Privacy</a> · 
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/terms" style="color:#9ca3af;text-decoration:underline;">Terms</a> · 
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/contact" style="color:#9ca3af;text-decoration:underline;">Contact</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing RESEND_API_KEY environment variable',
        },
        { status: 500 }
      )
    }

    const resend = new Resend(apiKey)

    const { email, fullName, isFirstLogin } = await req.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const displayName = fullName || email.split('@')[0]

    const { data, error } = await resend.emails.send({
      from: 'PikaPlan <welcome@pikaplan.com>',
      to: [email],
      subject: isFirstLogin
        ? `🎉 Welcome to PikaPlan, ${displayName}!`
        : `👋 Welcome back, ${displayName}!`,
      html: WelcomeEmail({ fullName: displayName, isFirstLogin: !!isFirstLogin }),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Welcome email failed:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send welcome email',
      },
      { status: 500 }
    )
  }
}