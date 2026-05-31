'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  Heart, Trash2, Plus, ShoppingCart, Calendar, Star,
  Clock, Users, Flame, ChefHat, Store, MapPin,
  UtensilsCrossed, Sparkles, Search, Filter,
  ExternalLink, Package, Loader2, X, Check,
  BookOpen, ListChecks, ChevronRight, RefreshCw,
  AlertCircle, Coffee, Salad, Leaf,
} from 'lucide-react';
// ─── Types ───────────────────────────────────────────────────────────────────
type ItemType = 'all' | 'meal' | 'recipe' | 'vendor' | 'vendor_meal';
interface FavoriteRecord {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  created_at: string;
  notes: string | null;
}
interface MealData {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  image_url?: string;
  calories?: number;
  prep_time?: number;
  servings?: number;
  meal_type?: string;
  category?: string;
  dietary_tags?: string[];
  [key: string]: unknown;
}
interface VendorData {
  id: string;
  business_name?: string;
  name?: string;
  logo_url?: string;
  image_url?: string;
  cuisine_types?: string[];
  rating?: number;
  delivery_option?: string;
  service_areas?: string[];
  is_active?: boolean;
  [key: string]: unknown;
}
interface VendorMealData {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  image_url?: string;
  price?: number;
  vendor_id?: string;
  vendor_name?: string;
  calories?: number;
  prep_time?: number;
  servings?: number;
  [key: string]: unknown;
}
interface EnrichedFavorite {
  favorite: FavoriteRecord;
  data: MealData | VendorData | VendorMealData | null;
}
// ─── Tab Config ──────────────────────────────────────────────────────────────
const TABS: { value: ItemType; label: string; icon: typeof Heart }[] = [
  { value: 'all', label: 'All', icon: Heart },
  { value: 'meal', label: 'Meals', icon: UtensilsCrossed },
  { value: 'recipe', label: 'Recipes', icon: BookOpen },
  { value: 'vendor', label: 'Vendors', icon: Store },
  { value: 'vendor_meal', label: 'Vendor Meals', icon: Package },
];
// ─── Helper: Get display fields from any data shape ──────────────────────────
function getField(obj: Record<string, unknown> | null, ...keys: string[]): string {
  if (!obj) return '';
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'string' && val.trim()) return val;
    if (typeof val === 'number') return String(val);
  }
  return '';
}
function getArrayField(obj: Record<string, unknown> | null, ...keys: string[]): string[] {
  if (!obj) return [];
  for (const key of keys) {
    const val = obj[key];
    if (Array.isArray(val)) return val.map(String);
  }
  return [];
}
// ─── Main Page ───────────────────────────────────────────────────────────────
export default function UserFavoritesPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [favorites, setFavorites] = useState<EnrichedFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ItemType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  // ── Fetch Favorites ────────────────────────────────────────────────────────
  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: favRecords, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error || !favRecords) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      // Group by item_type for batch fetching
      const grouped: Record<string, string[]> = {};
      for (const fav of favRecords) {
        if (!grouped[fav.item_type]) grouped[fav.item_type] = [];
        grouped[fav.item_type].push(fav.item_id);
      }
      // Fetch related data for each type
      const dataMap: Record<string, Record<string, unknown>> = {};
      // Meals & Recipes (both from meals table)
      const mealIds = [...(grouped['meal'] || []), ...(grouped['recipe'] || [])];
      if (mealIds.length > 0) {
        const { data: meals } = await supabase
          .from('meals')
          .select('*')
          .in('id', mealIds);
        if (meals) {
          for (const m of meals) dataMap[m.id] = m;
        }
      }
      // Vendors
      if (grouped['vendor']?.length) {
        const { data: vendors } = await supabase
          .from('vendors')
          .select('*')
          .in('id', grouped['vendor']);
        if (vendors) {
          for (const v of vendors) dataMap[v.id] = v;
        }
      }
      // Vendor Meals
      if (grouped['vendor_meal']?.length) {
        const { data: vendorMeals } = await supabase
          .from('vendor_meals')
          .select('*')
          .in('id', grouped['vendor_meal']);
        if (vendorMeals) {
          for (const vm of vendorMeals) dataMap[vm.id] = vm;
        }
      }
      // Enrich favorites with data
      const enriched: EnrichedFavorite[] = favRecords.map((fav: { item_id: string | number; }) => ({
        favorite: fav,
        data: (dataMap[fav.item_id] as MealData | VendorData | VendorMealData) || null,
      }));
      setFavorites(enriched);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      setFavorites([]);
    }
    setLoading(false);
  }, [user, supabase]);
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);
  // ── Actions ────────────────────────────────────────────────────────────────
  const removeFavorite = async (favoriteId: string) => {
    setRemovingId(favoriteId);
    await supabase.from('user_favorites').delete().eq('id', favoriteId);
    setFavorites(prev => prev.filter(f => f.favorite.id !== favoriteId));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(favoriteId);
      return next;
    });
    setRemovingId(null);
  };
  const addToMealPlan = async (itemId: string, itemType: string) => {
    if (!user) return;
    showFeedback(itemId, 'Added to meal plan!');
    // Create or get active meal plan
    let { data: plan } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!plan) {
      const { data: newPlan } = await supabase
        .from('meal_plans')
        .insert({ user_id: user.id, name: 'My Meal Plan' })
        .select('id')
        .single();
      plan = newPlan;
    }
    if (plan) {
      await supabase.from('meal_plan_entries').insert({
        meal_plan_id: plan.id,
        meal_id: itemId,
      });
    }
  };
  const addToShoppingList = async (mealId: string) => {
    if (!user) return;
    showFeedback(mealId, 'Ingredients added to shopping list!');
    // Get recipe ingredients
    const { data: ingredients } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('meal_id', mealId);
    if (!ingredients || ingredients.length === 0) return;
    // Get or create shopping list
    let { data: list } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!list) {
      const { data: newList } = await supabase
        .from('shopping_lists')
        .insert({ user_id: user.id, name: 'My Shopping List' })
        .select('id')
        .single();
      list = newList;
    }
    if (list) {
      const items = ingredients.map((ing: Record<string, unknown>) => ({
        shopping_list_id: list!.id,
        name: getField(ing, 'ingredient', 'name', 'item_name') || 'Item',
        quantity: getField(ing, 'amount', 'quantity', 'measurement') || '',
        is_checked: false,
      }));
      await supabase.from('shopping_list_items').insert(items);
    }
  };
  const reorderVendorMeal = async (itemId: string) => {
    showFeedback(itemId, 'Order started! Redirecting...');
    // In production, this would create an order draft
    // For now, redirect to order page
    setTimeout(() => {
      window.location.href = `/dashboard/user/orders?reorder=${itemId}`;
    }, 1000);
  };
  const bulkAddToPlan = async () => {
    const mealFavs = favorites.filter(f =>
      selectedIds.has(f.favorite.id) &&
      ['meal', 'recipe', 'vendor_meal'].includes(f.favorite.item_type)
    );
    for (const fav of mealFavs) {
      await addToMealPlan(fav.favorite.item_id, fav.favorite.item_type);
    }
    setSelectedIds(new Set());
    setBulkMode(false);
  };
  const bulkRemove = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from('user_favorites').delete().eq('id', id);
    }
    setFavorites(prev => prev.filter(f => !selectedIds.has(f.favorite.id)));
    setSelectedIds(new Set());
    setBulkMode(false);
  };
  const showFeedback = (id: string, message: string) => {
    setActionFeedback({ id, message });
    setTimeout(() => setActionFeedback(null), 2500);
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // ── Filter & Search ────────────────────────────────────────────────────────
  const filtered = favorites.filter(f => {
    if (activeTab !== 'all' && f.favorite.item_type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = getField(f.data as Record<string, unknown>, 'name', 'title', 'business_name', 'meal_name').toLowerCase();
      const desc = getField(f.data as Record<string, unknown>, 'description', 'summary', 'notes').toLowerCase();
      if (!name.includes(q) && !desc.includes(q)) return false;
    }
    return true;
  });
  const counts = {
    all: favorites.length,
    meal: favorites.filter(f => f.favorite.item_type === 'meal').length,
    recipe: favorites.filter(f => f.favorite.item_type === 'recipe').length,
    vendor: favorites.filter(f => f.favorite.item_type === 'vendor').length,
    vendor_meal: favorites.filter(f => f.favorite.item_type === 'vendor_meal').length,
  };
  // ── Render Cards ───────────────────────────────────────────────────────────
  const renderMealCard = (item: EnrichedFavorite, isRecipe = false) => {
    const d = item.data as MealData | null;
    const name = getField(d as Record<string, unknown>, 'name', 'title', 'meal_name') || 'Unnamed Meal';
    const desc = getField(d as Record<string, unknown>, 'description', 'summary');
    const image = getField(d as Record<string, unknown>, 'image_url', 'photo_url', 'thumbnail_url');
    const calories = getField(d as Record<string, unknown>, 'calories');
    const prepTime = getField(d as Record<string, unknown>, 'prep_time', 'cooking_time');
    const servings = getField(d as Record<string, unknown>, 'servings', 'serving_size');
    const tags = getArrayField(d as Record<string, unknown>, 'dietary_tags', 'tags', 'categories');
    const mealType = getField(d as Record<string, unknown>, 'meal_type', 'category', 'type');
    return (
      <motion.div
        key={item.favorite.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg group ${
          selectedIds.has(item.favorite.id) ? 'border-[#32CD32] ring-2 ring-[#32CD32]/20' : 'border-gray-100'
        }`}
      >
        {/* Image / Placeholder */}
        <div className="relative h-44 bg-gradient-to-br from-[#f0fdf4] to-[#f8faf8] overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isRecipe ? (
                <BookOpen className="w-12 h-12 text-[#32CD32]/30" />
              ) : (
                <UtensilsCrossed className="w-12 h-12 text-[#32CD32]/30" />
              )}
            </div>
          )}
          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              isRecipe
                ? 'bg-purple-100 text-purple-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isRecipe ? 'Recipe' : mealType || 'Meal'}
            </span>
          </div>
          {/* Favorite heart */}
          <button
            onClick={() => removeFavorite(item.favorite.id)}
            disabled={removingId === item.favorite.id}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
          >
            {removingId === item.favorite.id ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            )}
          </button>
          {/* Bulk select */}
          {bulkMode && (
            <button
              onClick={() => toggleSelect(item.favorite.id)}
              className={`absolute bottom-3 left-3 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                selectedIds.has(item.favorite.id)
                  ? 'bg-[#32CD32] border-[#32CD32] text-white'
                  : 'bg-white/90 border-gray-300'
              }`}
            >
              {selectedIds.has(item.favorite.id) && <Check className="w-4 h-4" />}
            </button>
          )}
          {/* Action feedback */}
          <AnimatePresence>
            {actionFeedback?.id === item.favorite.item_id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#126e3d]/90 flex items-center justify-center"
              >
                <div className="text-center text-white">
                  <Check className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-semibold">{actionFeedback.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base truncate">{name}</h3>
          {desc && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{desc}</p>}
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
            {calories && (
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                {calories} kcal
              </span>
            )}
            {prepTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {prepTime} min
              </span>
            )}
            {servings && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                {servings} servings
              </span>
            )}
          </div>
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => addToMealPlan(item.favorite.item_id, item.favorite.item_type)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#126e3d] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Add to Plan
            </button>
            <button
              onClick={() => addToShoppingList(item.favorite.item_id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Shopping List
            </button>
            {isRecipe && (
              <Link
                href={`/recipes/${item.favorite.item_id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Recipe
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    );
  };
  const renderVendorCard = (item: EnrichedFavorite) => {
    const d = item.data as VendorData | null;
    const name = getField(d as Record<string, unknown>, 'business_name', 'name') || 'Unnamed Vendor';
    const logo = getField(d as Record<string, unknown>, 'logo_url', 'image_url', 'photo_url');
    const cuisines = getArrayField(d as Record<string, unknown>, 'cuisine_types', 'cuisines');
    const rating = getField(d as Record<string, unknown>, 'rating');
    const delivery = getField(d as Record<string, unknown>, 'delivery_option');
    const areas = getArrayField(d as Record<string, unknown>, 'service_areas');
    const isActive = d?.is_active !== false;
    return (
      <motion.div
        key={item.favorite.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg ${
          selectedIds.has(item.favorite.id) ? 'border-[#32CD32] ring-2 ring-[#32CD32]/20' : 'border-gray-100'
        }`}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {logo ? (
                <img src={logo} alt={name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Store className="w-7 h-7 text-[#32CD32]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 truncate">{name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isActive ? 'Open' : 'Closed'}
                </span>
              </div>
              {/* Rating */}
              {rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 text-[#F4A535] fill-[#F4A535]" />
                  <span className="text-sm font-semibold text-gray-700">{rating}</span>
                </div>
              )}
              {/* Cuisines */}
              {cuisines.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {cuisines.slice(0, 3).map(c => (
                    <span key={c} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-semibold rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {/* Delivery & Areas */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {delivery && (
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {delivery}
                  </span>
                )}
                {areas.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {areas.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
            </div>
            {/* Remove */}
            <button
              onClick={() => removeFavorite(item.favorite.id)}
              disabled={removingId === item.favorite.id}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0"
            >
              {removingId === item.favorite.id ? (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              ) : (
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              )}
            </button>
            {/* Bulk select */}
            {bulkMode && (
              <button
                onClick={() => toggleSelect(item.favorite.id)}
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                  selectedIds.has(item.favorite.id)
                    ? 'bg-[#32CD32] border-[#32CD32] text-white'
                    : 'bg-white border-gray-300'
                }`}
              >
                {selectedIds.has(item.favorite.id) && <Check className="w-4 h-4" />}
              </button>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
            <Link
              href={`/dashboard/user/vendors?id=${item.favorite.item_id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#126e3d] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              View Vendor
            </Link>
            <Link
              href={`/dashboard/user/meals?vendor=${item.favorite.item_id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              View Meals
            </Link>
            <button
              onClick={() => reorderVendorMeal(item.favorite.item_id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Order
            </button>
          </div>
        </div>
      </motion.div>
    );
  };
  const renderVendorMealCard = (item: EnrichedFavorite) => {
    const d = item.data as VendorMealData | null;
    const name = getField(d as Record<string, unknown>, 'name', 'title') || 'Vendor Meal';
    const desc = getField(d as Record<string, unknown>, 'description');
    const image = getField(d as Record<string, unknown>, 'image_url', 'photo_url');
    const price = getField(d as Record<string, unknown>, 'price');
    const vendorName = getField(d as Record<string, unknown>, 'vendor_name');
    const calories = getField(d as Record<string, unknown>, 'calories');
    const prepTime = getField(d as Record<string, unknown>, 'prep_time');
    return (
      <motion.div
        key={item.favorite.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg group ${
          selectedIds.has(item.favorite.id) ? 'border-[#32CD32] ring-2 ring-[#32CD32]/20' : 'border-gray-100'
        }`}
      >
        <div className="relative h-40 bg-gradient-to-br from-orange-50 to-[#f8faf8] overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-[#F4A535]/30" />
            </div>
          )}
          {price && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-[#126e3d]">
              {price} KES
            </div>
          )}
          <button
            onClick={() => removeFavorite(item.favorite.id)}
            disabled={removingId === item.favorite.id}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
          >
            {removingId === item.favorite.id ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            )}
          </button>
          {bulkMode && (
            <button
              onClick={() => toggleSelect(item.favorite.id)}
              className={`absolute bottom-3 left-3 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                selectedIds.has(item.favorite.id)
                  ? 'bg-[#32CD32] border-[#32CD32] text-white'
                  : 'bg-white/90 border-gray-300'
              }`}
            >
              {selectedIds.has(item.favorite.id) && <Check className="w-4 h-4" />}
            </button>
          )}
          <AnimatePresence>
            {actionFeedback?.id === item.favorite.item_id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#126e3d]/90 flex items-center justify-center"
              >
                <div className="text-center text-white">
                  <Check className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-semibold">{actionFeedback.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 truncate">{name}</h3>
          {vendorName && (
            <p className="text-xs text-[#126e3d] font-medium mt-0.5 flex items-center gap-1">
              <Store className="w-3 h-3" />
              {vendorName}
            </p>
          )}
          {desc && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{desc}</p>}
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            {calories && (
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                {calories} kcal
              </span>
            )}
            {prepTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {prepTime} min
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => reorderVendorMeal(item.favorite.item_id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#f97316] rounded-lg hover:bg-[#ea580c] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Order Again
            </button>
            <button
              onClick={() => addToMealPlan(item.favorite.item_id, 'vendor_meal')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#126e3d] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Add to Plan
            </button>
          </div>
        </div>
      </motion.div>
    );
  };
  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <Heart className="w-6 h-6 text-red-500" />
            Favorites
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Your saved meals, recipes, and vendors in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {favorites.length > 0 && (
            <>
              <button
                onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  bulkMode
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {bulkMode ? <X className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
                {bulkMode ? 'Cancel' : 'Select'}
              </button>
              <Link
                href="/meal-generator"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-[#32CD32]/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Generate Plan
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Bulk Action Bar */}
      <AnimatePresence>
        {bulkMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#126e3d] text-white rounded-xl p-4 flex items-center justify-between"
          >
            <p className="text-sm font-medium">{selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected</p>
            <div className="flex items-center gap-2">
              <button
                onClick={bulkAddToPlan}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Add to Plan
              </button>
              <button
                onClick={bulkRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Search & Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search favorites..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#32CD32]/20 focus:border-[#32CD32] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const IconComp = tab.icon;
            const count = counts[tab.value];
            const isActive2 = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive2
                    ? 'bg-[#126e3d] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <IconComp className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive2 ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#32CD32] animate-spin" />
            <p className="text-sm text-gray-500">Loading favorites...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {searchQuery ? 'No matches found' : 'No favorites yet'}
          </h3>
          <p className="text-gray-500 text-sm text-center max-w-md">
            {searchQuery
              ? `No favorites match "${searchQuery}". Try a different search.`
              : 'Save meals, recipes, or vendors to find them quickly later. Tap the heart icon on any item to save it here.'
            }
          </p>
          {!searchQuery && (
            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="/dashboard/user/meals"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Browse Meals
              </Link>
              <Link
                href="/recipes"
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Explore Recipes
              </Link>
              <Link
                href="/dashboard/user/vendors"
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                <Store className="w-4 h-4" />
                Find Vendors
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(item => {
              switch (item.favorite.item_type) {
                case 'meal':
                  return renderMealCard(item, false);
                case 'recipe':
                  return renderMealCard(item, true);
                case 'vendor':
                  return renderVendorCard(item);
                case 'vendor_meal':
                  return renderVendorMealCard(item);
                default:
                  return renderMealCard(item, false);
              }
            })}
          </AnimatePresence>
        </div>
      )}
      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-gray-400 pb-4">
          Showing {filtered.length} of {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
        </p>
      )}
    </motion.div>
  );
}