// vendor-welcome.ts

interface VendorWelcomeEmailProps {
    vendorName: string
    businessName: string
    planName: string
  }
  
  export function vendorWelcomeEmail({
    vendorName,
    businessName,
    planName,
  }: VendorWelcomeEmailProps): string {
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
          <p style="color: #666; margin-top: 8px;">Welcome to the Vendor Family!</p>
        </div>
  
        <div style="padding: 30px 0;">
          <h2 style="color: #1a1a2e;">Hi ${vendorName}! 👋</h2>
          <p style="color: #555; line-height: 1.6;">
            Your vendor account for <strong>${businessName}</strong> is now active on the 
            <strong>${planName}</strong> plan.
          </p>
          <p style="color: #555; line-height: 1.6;">
            Here's what you can do next:
          </p>
          <ul style="color: #555; line-height: 2;">
            <li>Set up your store profile</li>
            <li>Add your first products</li>
            <li>Configure delivery areas</li>
            <li>Start receiving orders</li>
          </ul>
        </div>
  
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/vendor"
             style="background: #FF6B35; color: white; padding: 14px 32px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold;
                    display: inline-block;">
            Set Up Your Store
          </a>
        </div>
  
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Pika Plan. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  }