import Link from 'next/link'
import {
  Calendar, ChefHat, ShoppingBag, Award, MessageSquare, Edit3, Activity,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityItem } from './actions'

const TYPE_CONFIG: Record<ActivityItem['type'], { icon: LucideIcon; color: string; bg: string }> = {
  meal_plan:      { icon: Calendar, color: '#1A5C3A', bg: '#f0fdf4' },
  order:          { icon: ShoppingBag, color: '#2563eb', bg: '#eff6ff' },
  meal_cooked:    { icon: ChefHat, color: '#f97316', bg: '#fff7ed' },
  achievement:    { icon: Award, color: '#F4A535', bg: '#fffbeb' },
  review:         { icon: MessageSquare, color: '#7c3aed', bg: '#f5f3ff' },
  profile_update: { icon: Edit3, color: '#64748b', bg: '#f1f5f9' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  if (day < 30) return `${Math.floor(day / 7)}w ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#126e3d] flex items-center gap-2">
          <Activity size={14} /> Recent Activity
        </h2>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl">
          <Activity size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">No activity yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Start by generating your first meal plan
          </p>
          <Link
            href="/meal-plans"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A5C3A] hover:bg-[#0d3d26] px-4 py-2 text-xs font-black uppercase text-white transition"
          >
            Generate Plan
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-100" />

          <div className="space-y-3">
            {activities.map((activity) => {
              const cfg = TYPE_CONFIG[activity.type]
              const Icon = cfg.icon
              return (
                <div key={activity.id} className="relative flex items-start gap-3 pl-1">
                  <div
                    className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-4 ring-white"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1 pb-1">
                    <p className="text-sm font-bold text-slate-900">{activity.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{activity.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      {timeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}