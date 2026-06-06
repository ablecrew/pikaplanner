'use client'

import { useState, useTransition } from 'react'
import {
  Monitor, Smartphone, Tablet, MapPin, Clock, LogOut, Loader2, AlertCircle,
} from 'lucide-react'
import { revokeSessionAction, revokeAllSessionsAction, type Session } from '../actions'
import ConfirmModal from '../_components/ConfirmModal'

const DEVICE_ICONS = { mobile: Smartphone, tablet: Tablet, desktop: Monitor }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export default function SessionsList({ sessions }: { sessions: Session[] }) {
  const [confirmAll, setConfirmAll] = useState(false)
  const [confirmOne, setConfirmOne] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const others = sessions.filter((s) => !s.is_current)

  const handleRevokeAll = () => {
    startTransition(async () => {
      await revokeAllSessionsAction()
      setConfirmAll(false)
      window.location.reload()
    })
  }

  const handleRevokeOne = () => {
    if (!confirmOne) return
    startTransition(async () => {
      await revokeSessionAction(confirmOne)
      setConfirmOne(null)
      window.location.reload()
    })
  }

  return (
    <>
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Monitor size={18} className="text-[#126e3d]" /> Active Sessions
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Devices currently signed into your account.
            </p>
          </div>
          {others.length > 0 && (
            <button
              onClick={() => setConfirmAll(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700"
            >
              Sign out all other sessions
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <Monitor size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No active sessions tracked.</p>
            <p className="text-xs text-slate-400 mt-1">Sessions appear here as you sign in from new devices.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const DeviceIcon = DEVICE_ICONS[s.device_type as keyof typeof DEVICE_ICONS] ?? Monitor
              return (
                <div
                  key={s.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                    s.is_current
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                    s.is_current ? 'bg-[#32CD32]/20 text-[#126e3d]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <DeviceIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">
                        {s.device_name || s.browser || 'Unknown device'}
                      </p>
                      {s.is_current && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#126e3d] text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[s.os, s.browser].filter(Boolean).join(' · ')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                      {s.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={9} /> {s.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={9} /> Active {timeAgo(s.last_active_at)}
                      </span>
                    </div>
                  </div>
                  {!s.is_current && (
                    <button
                      onClick={() => setConfirmOne(s.id)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition inline-flex items-center gap-1"
                    >
                      <LogOut size={11} /> Revoke
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <ConfirmModal
        open={confirmAll}
        title="Sign out all other sessions?"
        description="All other devices will be signed out. Your current session will stay active."
        confirmLabel="Sign Out All"
        variant="warning"
        loading={isPending}
        onClose={() => setConfirmAll(false)}
        onConfirm={handleRevokeAll}
      />

      <ConfirmModal
        open={!!confirmOne}
        title="Revoke this session?"
        description="This device will be immediately signed out."
        confirmLabel="Revoke"
        variant="warning"
        loading={isPending}
        onClose={() => setConfirmOne(null)}
        onConfirm={handleRevokeOne}
      />
    </>
  )
}