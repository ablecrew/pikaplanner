import {
    Sparkles, Flame, Trophy, Heart, Star, Zap, Crown, Rocket, Lock,
    type LucideIcon,
  } from 'lucide-react'
  import type { Achievement } from './actions'
  
  const ACHIEVEMENT_ICONS: Record<Achievement['iconName'], LucideIcon> = {
    sparkles: Sparkles,
    flame: Flame,
    trophy: Trophy,
    heart: Heart,
    star: Star,
    zap: Zap,
    crown: Crown,
    rocket: Rocket,
  }
  
  export default function AchievementsList({ achievements }: { achievements: Achievement[] }) {
    const earned = achievements.filter((a) => a.earned)
    const inProgress = achievements.filter((a) => !a.earned)
  
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#126e3d]">
            Achievements
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {earned.length} / {achievements.length} unlocked
          </span>
        </div>
  
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((achievement) => {
            const Icon = ACHIEVEMENT_ICONS[achievement.iconName]
            return (
              <div
                key={achievement.id}
                className={`relative bg-white border-2 rounded-2xl p-4 transition-all ${
                  achievement.earned
                    ? 'border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                    : 'border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={
                      achievement.earned
                        ? { backgroundColor: achievement.bg, color: achievement.color }
                        : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                    }
                  >
                    {achievement.earned ? <Icon size={18} /> : <Lock size={14} />}
                  </div>
                  {achievement.earned && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-[#126e3d]">
                      Earned
                    </span>
                  )}
                </div>
  
                <h3 className={`font-black text-sm leading-tight ${
                  achievement.earned ? 'text-slate-900' : 'text-slate-500'
                }`}>
                  {achievement.title}
                </h3>
                <p className={`text-[11px] mt-1 leading-relaxed ${
                  achievement.earned ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {achievement.description}
                </p>
  
                {achievement.progress && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress.current} / {achievement.progress.target}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (achievement.progress.current / achievement.progress.target) * 100)}%`,
                          backgroundColor: achievement.color,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    )
  }