// ── STK Push Request ──────────────────────────────────────
export type STKPushRequest = {
    amount: number
    phone_number: string         // 254712345678 format
    channel_id: string | number
    provider: 'm-pesa' | 'sasapay'
    external_reference: string   // Your unique ref
    customer_name?: string
    callback_url: string
  }
  
  // ── STK Push Response ─────────────────────────────────────
  export type STKPushResponse = {
    success: boolean
    status: string               // 'QUEUED' | 'SUCCESS' | 'FAILED'
    reference?: string           // CheckoutRequestID
    CheckoutRequestID?: string
    ExternalReference?: string
    ResponseCode?: string
    ResponseDescription?: string
    CustomerMessage?: string
    error?: string
  }
  
  // ── Status Check Response ─────────────────────────────────
  export type TransactionStatusResponse = {
    status: 'QUEUED' | 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED'
    amount?: number
    mpesa_receipt_number?: string
    transaction_date?: string
    phone_number?: string
    reference?: string
    external_reference?: string
    error?: string
    ResultCode?: number
    ResultDesc?: string
  }
  
  // ── Webhook Callback Payload ──────────────────────────────
  export type PayheroCallback = {
    response: {
      Amount: number
      CheckoutRequestID: string
      ExternalReference: string
      MerchantRequestID?: string
      MpesaReceiptNumber?: string
      Phone?: string
      ResultCode: number
      ResultDesc: string
      Status: 'Success' | 'Failed' | 'Cancelled' | string
      TransactionDate?: string
    }
  }
  
  // ── Internal types ────────────────────────────────────────
  export type TransactionStatus =
    | 'pending'
    | 'processing'
    | 'success'
    | 'failed'
    | 'cancelled'
    | 'expired'
  
  export type PaymentChannel = 'mpesa' | 'card' | 'bank'
  
  export type PaymentPurpose =
    | 'meal_order'
    | 'subscription'
    | 'vendor_listing'
    | 'shopping_cart'
    | 'donation'
    | 'other'