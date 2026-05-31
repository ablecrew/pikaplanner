'use client'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────

export type BusinessType = 'restaurant' | 'home-chef' | 'catering' | 'food-truck' | 'bakery' | 'cloud-kitchen'
export type KitchenType = 'home' | 'commercial' | 'shared' | 'cloud'
export type DeliveryOption = 'self' | 'platform' | 'both'

export type VendorApplication = {
  business_name: string
  business_type: BusinessType | ''
  registration_number: string
  tax_id: string
  owner_name: string
  email: string
  phone: string
  address: string
  city: string
  county: string
  kitchen_type: KitchenType | ''
  capacity_per_day: number
  delivery_option: DeliveryOption | ''
  service_areas: string[]
  cuisine_types: string[]
  dietary_options: string[]
  business_license_url: string
  food_safety_cert_url: string
  id_verification_url: string
  kitchen_photos_urls: string[]
}

export const EMPTY_APPLICATION: VendorApplication = {
  business_name: '',
  business_type: '',
  registration_number: '',
  tax_id: '',
  owner_name: '',
  email: '',
  phone: '',
  address: '',
  city: 'Nairobi',
  county: 'Nairobi County',
  kitchen_type: '',
  capacity_per_day: 20,
  delivery_option: '',
  service_areas: [],
  cuisine_types: [],
  dietary_options: [],
  business_license_url: '',
  food_safety_cert_url: '',
  id_verification_url: '',
  kitchen_photos_urls: [],
}

export const KITCHEN_TYPES: { value: KitchenType; label: string }[] = [
  { value: 'home', label: 'Home Kitchen' },
  { value: 'commercial', label: 'Commercial Kitchen' },
  { value: 'shared', label: 'Shared / Co-working Kitchen' },
]

export const DELIVERY_OPTIONS: { value: DeliveryOption; label: string }[] = [
  { value: 'self', label: 'Self Delivery' },
  { value: 'platform', label: 'Platform Delivery' },
  { value: 'both', label: 'Both' },
]

export const CUISINE_OPTIONS = [
  'Kenyan', 'East African', 'West African', 'Ethiopian', 'Indian',
  'Chinese', 'Italian', 'Mexican', 'Japanese', 'Thai',
  'Mediterranean', 'American', 'Middle Eastern', 'French', 'Fusion',
]

export const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free',
  'Dairy-Free', 'Nut-Free', 'Low-Carb', 'Keto', 'Organic',
]

export const NAIROBI_AREAS = [
  'Westlands', 'Kilimani', 'Kileleshwa', 'Lavington', 'Parklands',
  'Karen', 'Langata', 'South B', 'South C', 'CBD', 'Upper Hill',
  'Ngong Road', 'Mombasa Road', 'Thika Road', 'Kiambu Road',
  'Runda', 'Gigiri', 'Kasarani', 'Ruaka', 'Donholm', 'Buruburu',
  'Eastleigh', 'Hurlingham', 'Ngara', 'Pangani', 'Riverside',
]

// ── API ───────────────────────────────────────────────────

export async function submitVendorApplication(data: VendorApplication): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('vendor_applications').insert({
      user_id: user?.id || null,
      business_name: data.business_name,
      business_type: data.business_type,
      registration_number: data.registration_number,
      tax_id: data.tax_id,
      owner_name: data.owner_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      county: data.county,
      kitchen_type: data.kitchen_type,
      capacity_per_day: data.capacity_per_day,
      delivery_option: data.delivery_option,
      service_areas: data.service_areas,
      cuisine_types: data.cuisine_types,
      dietary_options: data.dietary_options,
      business_license_url: data.business_license_url,
      food_safety_cert_url: data.food_safety_cert_url,
      id_verification_url: data.id_verification_url,
      kitchen_photos_urls: data.kitchen_photos_urls,
      status: 'pending',
    })

    if (error) {
      console.error('Vendor application error:', error)
      return { success: false, message: error.message || 'Failed to submit application' }
    }

    return { success: true, message: 'Application submitted successfully!' }
  } catch (err) {
    console.error('Vendor application exception:', err)
    return { success: false, message: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}

export async function uploadVendorDocument(
  file: File,
  field: string
): Promise<{ url: string } | { error: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${field}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('vendor-docs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: uploadError.message }
    }

    const { data: urlData } = supabase.storage
      .from('vendor-docs')
      .getPublicUrl(fileName)

    return { url: urlData.publicUrl }
  } catch (err) {
    console.error('Upload exception:', err)
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}