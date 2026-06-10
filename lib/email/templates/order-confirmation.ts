// order-confirmation.ts

interface OrderEmailProps {
    customerName: string
    orderId: string
    items: { name: string; quantity: number; price: number }[]
    total: number
    deliveryDate?: string
  }
  
  export function orderConfirmationEmail({
    customerName,
    orderId,
    items,
    total,
    deliveryDate,
  }: OrderEmailProps): string {
    const itemRows = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            ${item.name}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            KES ${item.price.toLocaleString()}
          </td>
        </tr>
      `
      )
      .join('')
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FF6B35;">
          <h1 style="color: #1a1a2e; margin: 0;">🍳 Pika Plan</h1>
          <p style="color: #666; margin-top: 8px;">Order Confirmation</p>
        </div>
  
        <!-- Greeting -->
        <div style="padding: 30px 0;">
          <h2 style="color: #1a1a2e;">Hi ${customerName}!</h2>
          <p style="color: #555; line-height: 1.6;">
            Thank you for your order. We've received it and are getting everything ready.
          </p>
        </div>
  
        <!-- Order Details -->
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1a1a2e;">Order #${orderId.slice(0, 8)}</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #1a1a2e; color: white;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; font-size: 18px;">
                <td colspan="2" style="padding: 12px;">Total</td>
                <td style="padding: 12px; text-align: right; color: #FF6B35;">
                  KES ${total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
  
        ${deliveryDate ? `
        <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <strong>📅 Expected Delivery:</strong> ${deliveryDate}
        </div>
        ` : ''}
  
        <!-- CTA -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders"
             style="background: #FF6B35; color: white; padding: 14px 32px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold;
                    display: inline-block;">
            View Order Status
          </a>
        </div>
  
        <!-- Footer -->
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>Questions? Reply to this email or contact us at support@pikaplan.com</p>
          <p>© ${new Date().getFullYear()} Pika Plan. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  }