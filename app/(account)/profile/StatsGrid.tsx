import {
    Calendar, Utensils, ShoppingBag, Wallet, Store, TrendingUp, Heart, Flame,
    type LucideIcon,
  } from 'lucide-react'
  import type { ProfileStats } from './actions'
  
  const STATS_CONFIG: Array<{
    key: keyof ProfileStats
    label: string
    icon: LucideIcon
    color: string
    bg: string
    format?: (n: number) => string
    suffix?: string
  }> = [
    { key: 'meal_plans_created', label: 'Meal Plans',      icon: Calendar,    color: '#1A5C3A', bg: '#f0fdf4' },
    { key: 'meals_cooked',       label: 'Meals Cooked',    icon: Utensils,    color: '#f97316', bg: '#fff7ed' },
    { key: 'orders_placed',      label: 'Orders',          icon: ShoppingBag, color: '#2563eb', bg: '#eff6ff' },
    { key: 'total_spent',        label: 'Total Spent',     icon: Wallet,      color: '#7c3aed', bg: '#f5f3ff', format: (n) => `KES ${n.toLocaleString()}` },
    { key: 'vendors_supported',  label: 'Vendors',         icon: Store,       color: '#0891b2', bg: '#ecfeff' },
    { key: 'weeks_active',       label: 'Weeks Active',    icon: TrendingUp,  color: '#16a34a', bg: '#f0fdf4' },
    { key: 'recipes_saved',      label: 'Recipes Saved',   icon: Heart,       color: '#dc2626', bg: '#fef2f2' },
    { key: 'longest_streak',     label: 'Longest Streak',  icon: Flame,       color: '#F4A535', bg: '#fffbeb', suffix: ' wks' },
  ]
  
  export default function StatsGrid({ stats }: { stats: ProfileStats }) {
    return (
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#126e3d] mb-3">
          Your Activity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS_CONFIG.map((stat) => {
            const Icon = stat.icon
            const value = stats[stat.key]
            const displayValue = stat.format
              ? stat.format(value)
              : `${value.toLocaleString()}${stat.suffix ?? ''}`
  
            return (
              <div
                key={stat.key}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl mb-3"
                  style={{ backgroundColor: stat.bg, color: stat.color }}
                >
                  <Icon size={16} />
                </div>
                <p className="text-2xl font-black text-slate-900 leading-none">{displayValue}</p>
                <p className="text-xs text-slate-500 font-bold mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </section>
    )
  }