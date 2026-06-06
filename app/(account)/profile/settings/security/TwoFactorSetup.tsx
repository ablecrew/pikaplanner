'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck, Smartphone, Loader2, Copy, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { enroll2FAAction, verify2FAAction, disable2FAAction } from '../actions'
import ConfirmModal from '../_components/ConfirmModal'

type Props = {
  enabled: boolean
  factorId?: string
}

export default function TwoFactorSetup({ enabled, factorId }: Props) {
  const [setup, setSetup] = useState<{ qr: string; secret: string; factorId: string } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showDisable, setShowDisable] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const handleEnroll = () => {
    setError(null)
    startTransition(async () => {
      const r = await enroll2FAAction()
      if (r.success && r.data) setSetup(r.data)
      else setError(r.success ? 'Unknown error' : r.error)
    })
  }

  const handleVerify = () => {
    if (!setup) return
    setError(null)
    startTransition(async () => {
      const r = await verify2FAAction(setup.factorId, code)
      if (!r.success) {
        setError(r.error)
        return
      }
      setSetup(null)
      setCode('')
      window.location.reload()
    })
  }

  const handleDisable = () => {
    if (!factorId) return
    startTransition(async () => {
      await disable2FAAction(factorId)
      setShowDisable(false)
      window.location.reload()
    })
  }

  const copySecret = () => {
    if (!setup) return
    navigator.clipboard.writeText(setup.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#126e3d]" /> Two-Factor Authentication
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Add an extra layer of security using an authenticator app.
            </p>
          </div>
          {enabled && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-[#126e3d] px-3 py-1 text-[10px] font-black uppercase">
              <CheckCircle2 size={10} /> Enabled
            </span>
          )}
        </div>

        {!enabled && !setup && (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <div className="flex items-start gap-3 mb-4">
              <Smartphone size={22} className="text-[#126e3d] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <p className="font-bold">Recommended for all accounts</p>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Use Google Authenticator, Authy, or 1Password to generate one-time codes
                  alongside your password.
                </p>
              </div>
            </div>
            <button
              onClick={handleEnroll}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1A5C3A] hover:bg-[#0d3d26] px-5 py-2.5 text-xs font-black uppercase text-white transition disabled:opacity-60"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              Enable 2FA
            </button>
            {error && <p className="mt-3 text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircle size={11} /> {error}</p>}
          </div>
        )}

        {setup && (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-900 mb-2">Step 1: Scan the QR code</p>
              <p className="text-xs text-slate-500 mb-3">
                Open your authenticator app and scan this QR code:
              </p>
              <div className="inline-block p-3 bg-white rounded-xl border-2 border-slate-200">
                <img src={setup.qr} alt="2FA QR code" width={180} height={180} />
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Or enter this secret manually:</p>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <code className="flex-1 text-xs font-mono text-slate-900 break-all">{setup.secret}</code>
                <button
                  onClick={copySecret}
                  className="flex-shrink-0 px-2 py-1 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1"
                >
                  {copied ? <CheckCircle2 size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900 mb-2">Step 2: Enter the 6-digit code</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-mono font-bold text-slate-900 tracking-widest text-center focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]/20"
                />
                <button
                  onClick={handleVerify}
                  disabled={isPending || code.length !== 6}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-5 py-3 text-xs font-black uppercase text-white transition disabled:opacity-60"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  Verify & Enable
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircle size={11} /> {error}</p>}
            </div>

            <button
              onClick={() => { setSetup(null); setCode(''); setError(null) }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <X size={11} /> Cancel
            </button>
          </div>
        )}

        {enabled && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle2 className="text-[#126e3d] flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-emerald-900 font-semibold">
                Two-factor authentication is active on your account.
              </p>
            </div>
            <button
              onClick={() => setShowDisable(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700"
            >
              Disable 2FA
            </button>
          </div>
        )}
      </section>

      <ConfirmModal
        open={showDisable}
        title="Disable 2FA?"
        description="Your account will be less secure without two-factor authentication. You can re-enable it any time."
        confirmLabel="Disable 2FA"
        variant="warning"
        loading={isPending}
        onClose={() => setShowDisable(false)}
        onConfirm={handleDisable}
      />
    </>
  )
}