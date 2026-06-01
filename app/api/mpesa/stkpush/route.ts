import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const IntaSend = require('intasend-node')

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

function safeOrigin(value?: string | null, fallback = 'https://pikaplanner.vercel.app'): string {
  try {
    const raw = value?.trim() || fallback
    return new URL(raw).origin
  } catch {
    return fallback
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!name || !domain) return '***'
  const visible = name.slice(0, 2)
  return `${visible}***@${domain}`
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  if (digits.length < 6) return '***'
  return `${digits.slice(0, 4)}***${digits.slice(-2)}`
}

function maskRef(ref: string): string {
  if (!ref) return '***'
  if (ref.length <= 8) return '***'
  return `${ref.slice(0, 4)}***${ref.slice(-4)}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, phone, orderId, userId } = body as {
      amount: number
      phone: string
      orderId: string
      userId?: string
    }

    const numericAmount = Number(amount)
    if (!phone || !Number.isFinite(numericAmount) || numericAmount <= 0 || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing payment parameters (Phone, Amount, or OrderID)' },
        { status: 400 }
      )
    }

    // Format phone number
    let cleanPhone = phone.trim().replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.slice(1)
    } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
      cleanPhone = '254' + cleanPhone
    }

    const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY
    const INTASEND_SECRET_KEY = process.env.INTASEND_SECRET_KEY

    console.log('Intasend SDK check:', {
      hasPublishable: !!INTASEND_PUBLISHABLE_KEY,
      hasSecret: !!INTASEND_SECRET_KEY,
    })

    let mpesaCode = ''
    let isMockPayment = false

    // Try Intasend SDK STK Push
    if (INTASEND_PUBLISHABLE_KEY && INTASEND_SECRET_KEY) {
      try {
        console.log('Initiating Intasend SDK STK Push...')

        const appUrl =
          process.env.INTASEND_HOST ||
          process.env.NEXT_PUBLIC_APP_URL ||
          'https://pikaplanner.vercel.app'

        const merchantEmail =
          process.env.INTASEND_MERCHANT_EMAIL ||
          'pikaplan.app@gmail.com'

        const safeHost = safeOrigin(appUrl)

        const payload = {
          first_name: 'Pika',
          last_name: 'Plan',
          email: merchantEmail,
          host: safeHost,
          amount: Math.round(numericAmount),
          phone_number: cleanPhone,
          api_ref: orderId.slice(0, 20),
        }

        console.log('IntaSend payload (safe log):', {
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: maskEmail(payload.email),
          host: payload.host,
          amount: payload.amount,
          phone_number: maskPhone(payload.phone_number),
          api_ref: maskRef(payload.api_ref),
          sandbox: true,
        })

        // Initialize IntaSend SDK
        const intasend = new IntaSend(
          INTASEND_PUBLISHABLE_KEY,
          INTASEND_SECRET_KEY,
          true // true = sandbox/test environment
        )

        const collection = intasend.collection()

        const response = await new Promise((resolve, reject) => {
          collection
            .mpesaStkPush(payload)
            .then((resp: any) => resolve(resp))
            .catch((err: any) => reject(err))
        })

        console.log('Intasend SDK response (safe):', {
          hasInvoice: !!(response as any)?.invoice,
          hasTrackingId: !!((response as any)?.invoice?.tracking_id || (response as any)?.tracking_id),
          status: (response as any)?.status,
          message: (response as any)?.message,
        })

        const respData = response as any
        if (respData?.invoice?.tracking_id || respData?.tracking_id) {
          mpesaCode = respData.invoice?.tracking_id || respData.tracking_id
          console.log('Intasend SDK STK Push sent successfully:', maskRef(mpesaCode))
        } else {
          throw new Error(respData?.message || 'No tracking ID returned')
        }
      } catch (intasendErr: any) {
        console.warn(
          'Intasend SDK failed, falling back to simulator:',
          intasendErr?.message || intasendErr
        )
        await new Promise(resolve => setTimeout(resolve, 2000))
        mpesaCode = generateMpesaCode()
        isMockPayment = true
      }
    } else {
      console.log('Intasend credentials not found, running in SIMULATOR mode.')
      await new Promise(resolve => setTimeout(resolve, 2000))
      mpesaCode = generateMpesaCode()
      isMockPayment = true
    }

    // ──────────────────────────────────────────────────────────
    // DATABASE FULFILLMENT (unchanged)
    // ──────────────────────────────────────────────────────────
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

        let vendorId: string | null = null
        if (listItems && listItems.length > 0) {
          const firstItem = listItems[0]
          const firstMealId =
            (Array.isArray(firstItem.meal_ids) && firstItem.meal_ids.length > 0
              ? firstItem.meal_ids[0]
              : null) || firstItem.meal_id || firstItem.id

          if (firstMealId) {
            const { data: vmRow } = await supabaseAdmin
              .from('vendor_meals')
              .select('vendor_id')
              .eq('meal_id', firstMealId)
              .maybeSingle()
            vendorId = vmRow?.vendor_id || null
          }
        }

        const { data: order, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            user_id: resolvedUserId,
            vendor_id: vendorId, // use resolved vendor if found
            order_number: orderNumber,
            subtotal: Math.max(Math.round(numericAmount) - 250, 0),
            platform_fee: 50,
            delivery_fee: 200,
            total_amount: Math.round(numericAmount),
            status: 'pending',
            payment_status: 'pending',
            currency: 'KES',
            mpesa_transaction_id: mpesaCode,
            delivery_address: deliveryDetails,
            customer_phone: cleanPhone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (orderErr) throw orderErr

        if (listItems && listItems.length > 0) {
          const itemsPayload = listItems.map((item: any) => {
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
              created_at: new Date().toISOString(),
            }
          })

          await supabaseAdmin.from('order_items').insert(itemsPayload)
        }

        await supabaseAdmin.from('shopping_list_items').delete().eq('shopping_list_id', orderId)

        try {
          await supabaseAdmin.from('notification_logs').insert({
            user_id: resolvedUserId,
            title: '🛍️ Order Placed Successfully!',
            body: `Your order #${orderNumber} for KES ${Math.round(numericAmount)} has been received. Ref: ${mpesaCode}`,
            type: 'system',
            channel: 'in_app',
            is_read: false,
            sent_at: new Date().toISOString(),
            metadata: { trigger: 'order', order_number: orderNumber, mpesa_code: mpesaCode },
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
        ? `[SIMULATED] Payment processed in simulator mode. Ref: ${mpesaCode}`
        : `STK push sent to ${maskPhone(cleanPhone)}. Please check your phone and enter M-Pesa PIN.`,
    })
  } catch (error: any) {
    console.error('API checkout error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}