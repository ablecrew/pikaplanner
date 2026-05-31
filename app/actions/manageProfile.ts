'use server'

type ProfileInput = {
  id: string
  email?: string
  fullName?: string
  avatarUrl?: string
  phone?: string
  city?: string
  address?: string
  savedAddresses?: any[]
  paymentMethods?: any[]
  privacySettings?: {
    profile_visibility?: boolean
    share_usage_stats?: boolean
    allow_merchant_search?: boolean
  }
}

type ActionResult = {
  success: boolean
  message?: string
  error?: string
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return { url, serviceRoleKey }
}

export async function saveUserProfile(input: ProfileInput): Promise<ActionResult> {
  const config = getConfig()

  if (!config) {
    return { success: false, error: 'Missing Supabase server configuration.' }
  }

  if (!input.id) {
    return { success: false, error: 'User id is required.' }
  }

  try {
    const headers = {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
    }

    // First, get the existing profile to know the current email
    const getResponse = await fetch(
      `${config.url}/rest/v1/profiles?select=id,email&id=eq.${input.id}`,
      { headers }
    )

    let existingEmail: string | null = null
    if (getResponse.ok) {
      const existingData = await getResponse.text()
      if (existingData && existingData.trim()) {
        const parsed = JSON.parse(existingData)
        if (Array.isArray(parsed) && parsed.length > 0) {
          existingEmail = parsed[0].email
        }
      }
    }

    // Build payload - always include email
    const payload: Record<string, any> = {
      email: existingEmail || input.email || `user-${input.id.slice(0, 8)}@pikaplan.com`,
      updated_at: new Date().toISOString()
    }

    // Only add fields that were actually provided
    if (input.fullName !== undefined) payload.full_name = input.fullName
    if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl
    if (input.phone !== undefined) payload.phone = input.phone
    if (input.city !== undefined) payload.city = input.city
    if (input.address !== undefined) payload.address = input.address
    if (input.savedAddresses !== undefined) payload.saved_addresses = input.savedAddresses
    if (input.paymentMethods !== undefined) payload.payment_methods = input.paymentMethods
    if (input.privacySettings !== undefined) payload.privacy_settings = input.privacySettings

    // Try UPDATE first
    const updateResponse = await fetch(
      `${config.url}/rest/v1/profiles?id=eq.${input.id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      }
    )

    if (updateResponse.ok || updateResponse.status === 204) {
      return { success: true, message: 'Settings saved successfully!' }
    }

    const updateErrorText = await updateResponse.text()

    // If profile does not exist, INSERT instead
    if (updateResponse.status === 406 || updateResponse.status === 404) {
      const insertPayload = {
        id: input.id,
        ...payload,
        created_at: new Date().toISOString(),
      }

      const insertResponse = await fetch(
        `${config.url}/rest/v1/profiles`,
        {
          method: 'POST',
          headers: {
            ...headers,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(insertPayload),
        }
      )

      if (insertResponse.ok || insertResponse.status === 201) {
        return { success: true, message: 'Settings saved successfully!' }
      }

      const insertErrorText = await insertResponse.text()
      return { success: false, error: `Insert failed: ${insertErrorText}` }
    }

    return { success: false, error: `Update failed: ${updateErrorText}` }
  } catch (error) {
    console.error('saveUserProfile error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save settings.',
    }
  }
}

export async function getUserProfile(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const config = getConfig()

  if (!config) {
    return { success: false, error: 'Missing Supabase server configuration.' }
  }

  try {
    const headers = {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    }

    const response = await fetch(
      `${config.url}/rest/v1/profiles?select=*&id=eq.${userId}`,
      { headers }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Fetch failed: ${errorText}` }
    }

    const text = await response.text()
    if (!text || text.trim() === '') {
      return { success: true, data: null }
    }

    const profiles = JSON.parse(text)
    if (Array.isArray(profiles) && profiles.length > 0) {
      return { success: true, data: profiles[0] }
    }

    return { success: true, data: null }
  } catch (error) {
    console.error('getUserProfile error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user profile.',
    }
  }
}