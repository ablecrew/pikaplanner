/**
 * Normalize a Kenyan phone number to international format (254...)
 * Accepts: 0712345678, +254712345678, 254712345678, 712345678
 */
export function normalizeKenyanPhone(input: string): string | null {
    if (!input) return null
    const digits = input.replace(/\D/g, '')
  
    if (digits.startsWith('254') && digits.length === 12) return digits
    if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
    if (digits.length === 9 && /^[71]/.test(digits)) return `254${digits}`
  
    return null
  }
  
  /** Validate phone is a Safaricom/Airtel Kenya number */
  export function isValidKenyanPhone(input: string): boolean {
    const normalized = normalizeKenyanPhone(input)
    if (!normalized) return false
    // Safaricom (70x, 71x, 72x, 74x, 79x), Airtel (75x, 78x), Telkom (77x)
    return /^254(7[0124589]|11)\d{7}$/.test(normalized)
  }
  
  /** Generate a unique internal reference */
  export function generateReference(prefix = 'PKP'): string {
    const ts = Date.now().toString(36).toUpperCase()
    const rnd = Math.random().toString(36).substring(2, 7).toUpperCase()
    return `${prefix}-${ts}-${rnd}`
  }
  
  /** Mask phone for display (last 4 digits visible) */
  export function maskPhone(phone: string): string {
    if (!phone || phone.length < 8) return phone
    return `${phone.slice(0, 4)}****${phone.slice(-4)}`
  }
  
  /** Format KES amount */
  export function formatKES(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }