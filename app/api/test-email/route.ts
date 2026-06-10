// Create a test endpoint
import { NextResponse } from 'next/server'
import { notifyOrderConfirmation } from '@/lib/email/actions'

export async function GET() {
  const result = await notifyOrderConfirmation({
    customerEmail: 'dandemarasighan@gmail.com', 
    customerName: 'Test User',
    orderId: '12345678-1234-1234-1234-123456789012',
    items: [
      { name: 'Chicken Biryani', quantity: 2, price: 450 },
      { name: 'Mandazi', quantity: 1, price: 150 },
    ],
    total: 1050,
    deliveryDate: 'Tomorrow, 6:00 PM',
  })

  return NextResponse.json(result)
}