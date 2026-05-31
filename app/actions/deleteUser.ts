'use server'
type DeleteUserResult = {
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
export async function deleteUser(userId: string): Promise<DeleteUserResult> {
  const config = getConfig()
  if (!config) {
    return {
      success: false,
      error: 'Missing Supabase server configuration. Add SUPABASE_SERVICE_ROLE_KEY to your environment.',
    }
  }
  if (!userId) {
    return { success: false, error: 'User id is required.' }
  }
  try {
    const deleteAuthResponse = await fetch(`${config.url}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!deleteAuthResponse.ok) {
      const errorBody = await deleteAuthResponse.text()
      return {
        success: false,
        error: errorBody || 'Failed to delete auth user.',
      }
    }
    return {
      success: true,
      message: 'User deleted successfully.',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user.',
    }
  }
}