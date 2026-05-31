export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'user' | 'vendor' | 'admin'
export type SubscriptionTier = 'free' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
export type CuisineType = 'kenyan' | 'swahili' | 'italian' | 'american' | 'healthy' | 'occasion' | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  is_verified: boolean
  is_active: boolean
  dietary_preferences: string[]
  allergies: string[]
  location_city: string | null
  onboarding_complete: boolean
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: 'active' | 'expired' | 'cancelled'
  starts_at: string
  expires_at: string | null
  amount_paid: number | null
  currency: string
  created_at: string
}

export interface Meal {
  id: string
  name: string
  slug: string
  description: string | null
  category: MealCategory
  cuisine: CuisineType
  image_url: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number
  calories_per_serving: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  tags: string[]
  is_premium: boolean
  is_active: boolean
  created_at: string
}

export interface RecipeIngredient {
  id: string
  meal_id: string
  name: string
  quantity: string
  unit: string | null
  is_optional: boolean
  sort_order: number
}

export interface RecipeStep {
  id: string
  meal_id: string
  step_number: number
  instruction: string
  duration_minutes: number | null
  tip: string | null
  image_url: string | null
}

export interface Vendor {
  id: string
  profile_id: string
  business_name: string
  business_description: string | null
  logo_url: string | null
  cover_image_url: string | null
  phone: string
  location_city: string
  location_address: string | null
  delivery_radius_km: number | null
  min_order_amount: number | null
  is_verified: boolean
  is_active: boolean
  is_accepting_orders: boolean
  average_rating: number | null
  total_orders: number
}

export interface VendorMeal {
  id: string
  vendor_id: string
  meal_id: string
  price: number
  currency: string
  is_available: boolean
  preparation_time_minutes: number | null
  vendor?: Vendor
  meal?: Meal
}

export interface MealPlan {
  id: string
  user_id: string
  title: string
  plan_type: 'daily' | 'weekly' | 'monthly'
  start_date: string
  end_date: string
  is_ai_generated: boolean
  is_active: boolean
  created_at: string
}

export interface MealPlanEntry {
  id: string
  meal_plan_id: string
  meal_id: string
  scheduled_date: string
  meal_category: MealCategory
  servings: number
  is_ordered: boolean
  is_cooked: boolean
  meal?: Meal
}

export interface ShoppingList {
  id: string
  user_id: string
  meal_plan_id: string | null
  title: string
  is_completed: boolean
  items?: ShoppingListItem[]
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  ingredient_name: string
  quantity: string | null
  unit: string | null
  category: string | null
  is_checked: boolean
}

export interface SubscriptionPlan {
  tier: SubscriptionTier
  display_name: string
  price_kes: number
  duration_days: number | null
  features: string[]
  is_active: boolean
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> }
      meals: { Row: Meal; Insert: Partial<Meal>; Update: Partial<Meal> }
      recipe_ingredients: { Row: RecipeIngredient; Insert: Partial<RecipeIngredient>; Update: Partial<RecipeIngredient> }
      recipe_steps: { Row: RecipeStep; Insert: Partial<RecipeStep>; Update: Partial<RecipeStep> }
      vendors: { Row: Vendor; Insert: Partial<Vendor>; Update: Partial<Vendor> }
      vendor_meals: { Row: VendorMeal; Insert: Partial<VendorMeal>; Update: Partial<VendorMeal> }
      meal_plans: { Row: MealPlan; Insert: Partial<MealPlan>; Update: Partial<MealPlan> }
      meal_plan_entries: { Row: MealPlanEntry; Insert: Partial<MealPlanEntry>; Update: Partial<MealPlanEntry> }
      shopping_lists: { Row: ShoppingList; Insert: Partial<ShoppingList>; Update: Partial<ShoppingList> }
      shopping_list_items: { Row: ShoppingListItem; Insert: Partial<ShoppingListItem>; Update: Partial<ShoppingListItem> }
      subscription_plans: { Row: SubscriptionPlan; Insert: Partial<SubscriptionPlan>; Update: Partial<SubscriptionPlan> }
    }
  }
}