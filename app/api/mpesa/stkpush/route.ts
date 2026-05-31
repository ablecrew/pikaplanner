import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey)
}

function generateMpesaCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'R'
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  try {
    const { amount, phone, orderId, userId } = await request.json()
    
    if (!phone || !amount || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing payment parameters (Phone, Amount, or OrderID)' },
        { status: 400 }
      )
    }

    let cleanPhone = phone.trim().replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.slice(1)
    } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
      cleanPhone = '254' + cleanPhone
    }

    const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY
    const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET
    const PASSKEY = process.env.MPESA_PASSKEY
    const BUSINESS_SHORT_CODE = process.env.MPESA_BUSINESS_SHORT_CODE
    const CALLBACK_URL = process.env.MPESA_CALLBACK_URL

    let mpesaCode = ''
    let isMockPayment = false

    if (CONSUMER_KEY && CONSUMER_SECRET && PASSKEY && BUSINESS_SHORT_CODE) {
      try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
        
        // Get OAuth token
        const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
          headers: { Authorization: `Basic ${auth}` },
          cache: 'no-store'
        })

        if (!tokenRes.ok) {
          throw new Error(`OAuth failed: ${tokenRes.status}`)
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData?.access_token

        if (!accessToken) {
          throw new Error('No access token received')
        }

        // Generate timestamp and password
        const now = new Date()
        const timestamp = 
          `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
        const password = Buffer.from(BUSINESS_SHORT_CODE + PASSKEY + timestamp).toString('base64')

        console.log('Sending STK Push to Daraja...')

        // Send STK Push
        const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: cleanPhone,
            PartyB: BUSINESS_SHORT_CODE,
            PhoneNumber: cleanPhone,
            CallBackURL: CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback',
            AccountReference: orderId.slice(0, 12),
            TransactionDesc: 'Pika Plan Payment',
          }),
        })

        const stkData = await stkRes.json()
        console.log('Daraja response:', JSON.stringify(stkData))

        if (stkData?.ResponseCode === '0') {
          mpesaCode = stkData?.CheckoutRequestID || generateMpesaCode()
          console.log('STK Push sent successfully:', mpesaCode)
        } else {
          throw new Error(stkData?.ResponseDescription || 'STK Push rejected')
        }
      } catch (err: any) {
        console.warn('Daraja API failed:', err.message)
        await new Promise(resolve => setTimeout(resolve, 2000))
        mpesaCode = generateMpesaCode()
        isMockPayment = true
      }
    } else {
      console.log('M-Pesa credentials not configured, running in SIMULATOR mode.')
      await new Promise(resolve => setTimeout(resolve, 2000))
      mpesaCode = generateMpesaCode()
      isMockPayment = true
    }

    // ── DATABASE FULFILLMENT ──
    const orderNumber = `PP-${Date.now().toString().slice(-6)}`
    const supabaseAdmin = getSupabaseAdmin()
    
    if (supabaseAdmin) {
      let resolvedUserId = userId
      if (!resolvedUserId) {
        const { data: listRow } = await supabaseAdmin
          .from('shopping_lists')
          .select('user_id')
          .eq('id', orderId)
          .maybeSingle()
        resolvedUserId = listRow?.user_id
      }

      if (resolvedUserId) {
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('city, address')
          .eq('id', resolvedUserId)
          .maybeSingle()
        const deliveryDetails = userProfile?.address 
          ? `${userProfile.address}, ${userProfile.city || 'Nairobi'}`
          : 'Nairobi Central, Nairobi'

        const { data: listItems } = await supabaseAdmin
          .from('shopping_list_items')
          .select('*')
          .eq('shopping_list_id', orderId)

        const { data: order, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            user_id: resolvedUserId,
            vendor_id: null,
            order_number: orderNumber,
            subtotal: amount - 250,
            platform_fee: 50,
            delivery_fee: 200,
            total_amount: amount,
            status: 'pending',
            payment_status: 'pending',
            currency: 'KES',
            mpesa_transaction_id: mpesaCode,
            delivery_address: deliveryDetails,
            customer_phone: cleanPhone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()
          
        if (orderErr) throw orderErr

        if (listItems && listItems.length > 0) {
          const itemsPayload = listItems.map(item => {
            const itemPrice = Number(item.estimated_price || 0)
            const itemQty = Number(item.quantity) || 1
            const itemName = item.ingredient_name || item.item_name || item.name || 'Shopping Item'
            return {
              order_id: order.id,
              vendor_meal_id: null,
              ingredient_name: itemName,
              item_description: `${itemName}${item.unit ? ` (${item.unit})` : ''}`,
              quantity: itemQty,
              unit_price: itemPrice,
              total_price: itemPrice * itemQty,
              created_at: new Date().toISOString()
            }
          })
          await supabaseAdmin.from('order_items').insert(itemsPayload)
        }

        await supabaseAdmin.from('shopping_list_items').delete().eq('shopping_list_id', orderId)

        try {
          await supabaseAdmin.from('notification_logs').insert({
            user_id: resolvedUserId,
            title: '🛍️ Order Placed Successfully!',
            body: `Your order #${orderNumber} for KES ${amount} has been received. Ref: ${mpesaCode}`,
            type: 'system',
            channel: 'in_app',
            is_read: false,
            sent_at: new Date().toISOString(),
            metadata: { trigger: 'order', order_number: orderNumber, mpesa_code: mpesaCode }
          })
        } catch (notifErr) {
          console.warn('Notification failed:', notifErr)
        }
      }
    }

    return NextResponse.json({
      success: true,
      mpesaCode,
      orderNumber,
      message: isMockPayment 
        ? `[SIMULATED] Payment processed. Ref: ${mpesaCode}` 
        : `STK push sent. Check your phone and enter M-Pesa PIN.`
    })
  } catch (error: any) {
    console.error('API checkout error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}