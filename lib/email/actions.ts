import { sendEmail } from './client'
import { orderConfirmationEmail } from './templates/order-confirmation'
import { subscriptionConfirmationEmail } from './templates/subscription-confirmation'
import { vendorWelcomeEmail } from './templates/vendor-welcome'

// ── Order Notifications ──────────────────────────────────
export async function notifyOrderConfirmation(params: {
  customerEmail: string
  customerName: string
  orderId: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  deliveryDate?: string
}) {
  return sendEmail({
    to: params.customerEmail,
    subject: `Order Confirmed! #${params.orderId.slice(0, 8)} 🎉`,
    html: orderConfirmationEmail({
      customerName: params.customerName,
      orderId: params.orderId,
      items: params.items,
      total: params.total,
      deliveryDate: params.deliveryDate,
    }),
  })
}

// ── Customer Subscription Notifications ──────────────────
export async function notifyCustomerSubscription(params: {
  userEmail: string
  userName: string
  planName: string
  planPrice: number
  billingCycle: 'monthly' | 'yearly'
}) {
  return sendEmail({
    to: params.userEmail,
    subject: `Welcome to ${params.planName}! 🎉`,
    html: subscriptionConfirmationEmail({
      userName: params.userName,
      planName: params.planName,
      planPrice: params.planPrice,
      billingCycle: params.billingCycle,
      role: 'customer',
    }),
  })
}

// ── Vendor Subscription Notifications ────────────────────
export async function notifyVendorSubscription(params: {
  vendorEmail: string
  vendorName: string
  businessName: string
  planName: string
  planPrice: number
  billingCycle: 'monthly' | 'yearly'
}) {
  // Send vendor a welcome email
  const vendorEmailResult = await sendEmail({
    to: params.vendorEmail,
    subject: `Welcome to Pika Plan, ${params.businessName}! 🚀`,
    html: vendorWelcomeEmail({
      vendorName: params.vendorName,
      businessName: params.businessName,
      planName: params.planName,
    }),
  })

  // Also send subscription confirmation
  const subscriptionEmailResult = await sendEmail({
    to: params.vendorEmail,
    subject: `Your ${params.planName} subscription is active`,
    html: subscriptionConfirmationEmail({
      userName: params.vendorName,
      planName: params.planName,
      planPrice: params.planPrice,
      billingCycle: params.billingCycle,
      role: 'vendor',
    }),
  })

  return { vendorEmailResult, subscriptionEmailResult }
}