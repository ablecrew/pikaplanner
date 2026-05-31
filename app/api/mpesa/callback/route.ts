import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2))

    // M-Pesa sends the callback data in Body.stkCallback
    const callback = body?.Body?.stkCallback
    
    if (!callback) {
      console.error('Invalid callback - no stkCallback found:', body)
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback' })
    }

    const { 
      ResultCode, 
      ResultDesc, 
      MerchantRequestID, 
      CheckoutRequestID, 
      CallbackMetadata 
    } = callback

    console.log('Callback Result:', { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID })

    // Extract payment details from metadata
    const metadata = CallbackMetadata?.Item || []
    const getItem = (name: string) => {
      const found = metadata.find((item: any) => item.Name === name)
      return found?.Value
    }

    const transactionId = getItem('MpesaReceiptNumber')
    const phoneNumber = getItem('PhoneNumber')
    const amount = getItem('Amount')
    const orderId = MerchantRequestID || CheckoutRequestID
    const mpesaAmount = amount ? Number(amount) : 0

    console.log('Payment details:', { transactionId, phoneNumber, amount, orderId })

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (ResultCode === 0) {
      // ✅ Payment successful - Safaricom confirmed the transaction
      console.log(`Payment successful for ${orderId}. Transaction: ${transactionId}`)

      // ── DETECT IF THIS IS A SUBSCRIPTION PAYMENT ────────
      // Subscription order IDs start with "SUB-"
      const isSubscription = orderId?.startsWith('SUB-')
      const isVendorSubscription = orderId?.startsWith('VSUB-')

      if (isSubscription || isVendorSubscription) {
        // ── SUBSCRIPTION PAYMENT ──────────────────────────
        console.log(`Processing subscription payment for ${orderId}`)

        if (isSubscription) {
          // Customer meal plan subscription
          // Format: SUB-{userId}-{timestamp}
          const parts = orderId.split('-')
          const userId = parts[1] // Extract user ID
          
          if (userId) {
            // Determine tier from amount
            let tier = 'daily'
            let durationDays = 1
            if (mpesaAmount >= 2000) { tier = 'yearly'; durationDays = 365 }
            else if (mpesaAmount >= 199) { tier = 'monthly'; durationDays = 30 }
            else if (mpesaAmount >= 50) { tier = 'weekly'; durationDays = 7 }
            else if (mpesaAmount >= 14) { tier = 'daily'; durationDays = 1 }

            const now = new Date()
            const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

            // Expire old active subscriptions
            await supabase
              .from('subscriptions')
              .update({ status: 'expired' })
              .eq('user_id', userId)
              .eq('status', 'active')

            // Create new subscription
            const { error: subError } = await supabase.from('subscriptions').insert({
              user_id: userId,
              tier,
              status: 'active',
              starts_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              amount_paid: mpesaAmount,
              currency: 'KES',
              auto_renew: tier !== 'yearly',
              mpesa_transaction_id: transactionId,
            })

            if (subError) {
              console.error('Failed to create subscription:', subError)
            } else {
              console.log(`Subscription activated for user ${userId}: ${tier} plan`)

              // Notify user
              await supabase.from('notification_logs').insert({
                user_id: userId,
                title: '🎉 Subscription Activated!',
                body: `Your ${tier} meal plan has been activated. Enjoy your meal planning!`,
                type: 'success',
                channel: 'in_app',
                is_read: false,
                sent_at: new Date().toISOString(),
                metadata: { trigger: 'subscription_activated', tier, amount: mpesaAmount, transaction_id: transactionId },
              })
            }
          }
        }

        if (isVendorSubscription) {
          // Vendor subscription
          // Format: VSUB-{vendorId}-{timestamp}
          const parts = orderId.split('-')
          const vendorId = parts[1]
          
          if (vendorId) {
            const now = new Date()
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

            const { error: subError } = await supabase.from('vendor_subscriptions').insert({
              vendor_id: vendorId,
              tier: 'premium',
              status: 'active',
              price_paid: mpesaAmount,
              starts_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              mpesa_transaction_id: transactionId,
              auto_renew: true,
            })

            if (subError) {
              console.error('Failed to create vendor subscription:', subError)
            } else {
              // Update vendor profile
              await supabase.from('vendors').update({
                subscription_tier: 'premium',
                subscription_end_date: expiresAt.toISOString(),
                commission_rate: 0.10,
              }).eq('id', vendorId)

              console.log(`Vendor subscription activated for ${vendorId}`)

              await supabase.from('notification_logs').insert({
                user_id: vendorId,
                title: '🎉 Premium Subscription Activated!',
                body: `Your premium vendor subscription is now active. Enjoy unlimited listings and priority visibility!`,
                type: 'success',
                channel: 'in_app',
                is_read: false,
                sent_at: new Date().toISOString(),
                metadata: { trigger: 'vendor_subscription_activated', amount: mpesaAmount },
              })
            }
          }
        }
      } else {
        // ── REGULAR ORDER PAYMENT ─────────────────────────
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, user_id, vendor_id, total_amount, delivery_fee, platform_fee, order_number')
          .eq('id', orderId)
          .single()

        if (orderError) {
          console.error('Failed to fetch order:', orderError)
          return NextResponse.json({ ResultCode: 1, ResultDesc: 'Order not found' })
        }

        const totalAmount = Number(order.total_amount || 0)
        const deliveryFee = Number(order.delivery_fee || 0)
        const vendorEarnings = totalAmount - deliveryFee

        await supabase
          .from('orders')
          .update({
            status: 'delivered',
            payment_status: 'paid',
            mpesa_transaction_id: transactionId,
            mpesa_phone: phoneNumber ? String(phoneNumber) : null,
            mpesa_amount: mpesaAmount,
            platform_fee: 0,
            net_amount: vendorEarnings,
            commission_rate: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('payment_status', 'pending')

        // Update vendor balance
        if (order.vendor_id && vendorEarnings > 0) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('available_balance, total_earnings, total_orders')
            .eq('id', order.vendor_id)
            .single()

          if (vendor) {
            await supabase.from('vendors').update({
              available_balance: Number(vendor.available_balance || 0) + vendorEarnings,
              total_earnings: Number(vendor.total_earnings || 0) + vendorEarnings,
              total_orders: Number(vendor.total_orders || 0) + 1,
              updated_at: new Date().toISOString(),
            }).eq('id', order.vendor_id)
          }
        }

        // Send notifications
        await supabase.from('notification_logs').insert({
          user_id: order.user_id,
          title: '✅ Payment Confirmed!',
          body: `Your payment of KES ${totalAmount} for order #${order.order_number} has been received. M-Pesa Ref: ${transactionId}`,
          type: 'success',
          channel: 'in_app',
          is_read: false,
          sent_at: new Date().toISOString(),
          metadata: { trigger: 'payment_confirmed', order_id: orderId, order_number: order.order_number, mpesa_code: transactionId, amount: totalAmount },
        })

        if (order.vendor_id) {
          await supabase.from('notification_logs').insert({
            user_id: order.vendor_id,
            title: '🛵 New Order Received!',
            body: `Order #${order.order_number} has been paid. KES ${vendorEarnings.toFixed(0)} has been added to your balance.`,
            type: 'success',
            channel: 'in_app',
            is_read: false,
            sent_at: new Date().toISOString(),
            metadata: { trigger: 'new_order', order_id: orderId, order_number: order.order_number, amount: vendorEarnings },
          })
        }
      }
    } else {
      // ❌ Payment failed
      console.warn(`Payment failed for ${orderId}. Code: ${ResultCode}, Desc: ${ResultDesc}`)

      // Try to update order payment status if it's a regular order
      try {
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            mpesa_result_code: ResultCode,
            mpesa_result_desc: ResultDesc || 'Payment failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('payment_status', 'pending')
      } catch { /* order might not exist for subscriptions */ }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
    
  } catch (error: any) {
    console.error('Callback handler error:', error)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  }
}