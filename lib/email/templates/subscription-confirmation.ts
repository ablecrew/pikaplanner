// subscription-confirmation.ts

interface SubscriptionEmailProps {
    userName: string
    planName: string
    planPrice: number
    billingCycle: 'monthly' | 'yearly'
    role: 'customer' | 'vendor'
  }
  
  export function subscriptionConfirmationEmail({
    userName,
    planName,
    planPrice,
    billingCycle,
    role,
  }: SubscriptionEmailProps): string {
    const dashboardUrl =
      role === 'vendor'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/vendor`
        : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FF6B35;">
          <h1 style="color: #1a1a2e; margin: 0;">🍳 Pika Plan</h1>
          <p style="color: #666; margin-top: 8px;">Subscription Confirmed!</p>
        </div>
  
        <div style="padding: 30px 0;">
          <h2 style="color: #1a1a2e;">Welcome aboard, ${userName}! 🎉</h2>
          <p style="color: #555; line-height: 1.6;">
            Your <strong>${planName}</strong> subscription is now active.
          </p>
        </div>
  
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Plan</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">
                ${planName}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Price</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #FF6B35;">
                KES ${planPrice.toLocaleString()}/${billingCycle === 'monthly' ? 'mo' : 'yr'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Status</td>
              <td style="padding: 8px 0; text-align: right;">
                <span style="background: #4caf50; color: white; padding: 4px 12px; 
                             border-radius: 12px; font-size: 12px;">
                  Active
                </span>
              </td>
            </tr>
          </table>
        </div>
  
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}"
             style="background: #FF6B35; color: white; padding: 14px 32px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold;
                    display: inline-block;">
            Go to Dashboard
          </a>
        </div>
  
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>Questions? Reply to this email or contact us at support@pikaplan.com</p>
          <p>© ${new Date().getFullYear()} Pika Plan. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  }