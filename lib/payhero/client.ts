import 'server-only'
import type {
  STKPushRequest,
  STKPushResponse,
  TransactionStatusResponse,
} from './types'

// ── Configuration ──────────────────────────────────────────
const PAYHERO_BASE_URL = 'https://backend.payhero.co.ke/api/v2'

function getCredentials() {
  const username = process.env.PAYHERO_API_USERNAME
  const password = process.env.PAYHERO_API_PASSWORD
  const channelId = process.env.PAYHERO_CHANNEL_ID

  if (!username || !password || !channelId) {
    throw new Error(
      'Payhero credentials missing. Set PAYHERO_API_USERNAME, PAYHERO_API_PASSWORD, and PAYHERO_CHANNEL_ID in your environment.'
    )
  }

  return { username, password, channelId }
}

function getAuthHeader(): string {
  const { username, password } = getCredentials()
  const token = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${token}`
}

// ── Initiate STK Push ──────────────────────────────────────
export async function initiateSTKPush(params: {
  amount: number
  phoneNumber: string         // Already normalized 254...
  externalReference: string
  customerName?: string
  callbackUrl: string
}): Promise<STKPushResponse> {
  const { channelId } = getCredentials()

  const body: STKPushRequest = {
    amount: params.amount,
    phone_number: params.phoneNumber,
    channel_id: channelId,
    provider: (process.env.PAYHERO_PROVIDER as 'm-pesa') ?? 'm-pesa',
    external_reference: params.externalReference,
    customer_name: params.customerName,
    callback_url: params.callbackUrl,
  }

  try {
    const response = await fetch(`${PAYHERO_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Payhero] STK Push HTTP error:', response.status, data)
      return {
        success: false,
        status: 'FAILED',
        error: data?.error_message ?? data?.message ?? `HTTP ${response.status}`,
      }
    }

    return {
      success: true,
      status: data.status ?? 'QUEUED',
      reference: data.CheckoutRequestID ?? data.reference,
      CheckoutRequestID: data.CheckoutRequestID,
      ExternalReference: data.ExternalReference ?? params.externalReference,
      ResponseCode: data.ResponseCode,
      ResponseDescription: data.ResponseDescription,
      CustomerMessage: data.CustomerMessage,
    }
  } catch (err) {
    console.error('[Payhero] STK Push network error:', err)
    return {
      success: false,
      status: 'FAILED',
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

// ── Check Transaction Status ───────────────────────────────
export async function getTransactionStatus(
  reference: string
): Promise<TransactionStatusResponse> {
  try {
    const response = await fetch(
      `${PAYHERO_BASE_URL}/transaction-status?reference=${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: { Authorization: getAuthHeader() },
        cache: 'no-store',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        status: 'FAILED',
        error: data?.error_message ?? `HTTP ${response.status}`,
      }
    }

    return {
      status: data.status ?? 'PENDING',
      amount: data.amount,
      mpesa_receipt_number: data.mpesa_receipt_number ?? data.MpesaReceiptNumber,
      transaction_date: data.transaction_date,
      phone_number: data.phone_number,
      reference: data.reference,
      external_reference: data.external_reference,
      ResultCode: data.ResultCode,
      ResultDesc: data.ResultDesc,
    }
  } catch (err) {
    console.error('[Payhero] Status check error:', err)
    return {
      status: 'FAILED',
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}