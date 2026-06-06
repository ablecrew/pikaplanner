import { fetchPreferences, fetchExportHistory, fetchDeletionStatus } from '../actions'
import { Toggle } from '../_components/SettingsInput'
import DataExportButton from './DataExportButton'
import DeleteAccountModal from './DeleteAccountModal'
import PrivacyToggles from './PrivacyToggles'
import { redirect } from 'next/navigation'
import {
  Shield, Download, Trash2, Clock, FileText, AlertTriangle, CheckCircle2,
} from 'lucide-react'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default async function PrivacyPage() {
  const prefs = await fetchPreferences()
  if (!prefs) redirect('/login')

  const [exports, deletion] = await Promise.all([
    fetchExportHistory(),
    fetchDeletionStatus(),
  ])

  return (
    <div className="space-y-6">
      {/* Privacy Toggles */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <Shield size={18} className="text-[#126e3d]" /> Privacy Settings
        </h2>
        <p className="text-sm text-slate-500 mb-3">Control how your data is used.</p>

        <PrivacyToggles initial={prefs} />
      </section>

      {/* Data Export */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <Download size={18} className="text-[#126e3d]" /> Download Your Data
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Get a copy of all your personal data in compliance with the Kenya Data Protection Act 2019 and GDPR.
          We'll prepare a ZIP file with your profile, meal plans, orders, and preferences.
        </p>

        <DataExportButton />

        {exports.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
              Recent Exports
            </p>
            <div className="space-y-2">
              {exports.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <FileText size={14} className="text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      Requested {formatDate(e.requested_at)}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{e.status}</p>
                  </div>
                  {e.status === 'ready' && e.file_url && (
                    <a
                      href={e.file_url}
                      className="text-xs font-bold text-[#126e3d] hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Account Deletion */}
      {deletion ? (
        <section className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="text-red-600" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-red-900">Account Deletion Scheduled</h2>
              <p className="text-sm text-red-700 mt-1">
                Your account will be permanently deleted on{' '}
                <strong>{formatDate(deletion.scheduled_for)}</strong>.
              </p>
              <p className="text-xs text-red-600 mt-2">
                Sign in any time before then to cancel.
              </p>
            </div>
          </div>
          <form action={async () => {
            'use server'
            const { cancelDeletionAction } = await import('../actions')
            await cancelDeletionAction()
          }}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-white border-2 border-red-300 hover:border-red-400 px-5 py-2.5 text-xs font-black uppercase text-red-700 transition"
            >
              <CheckCircle2 size={12} /> Cancel Deletion
            </button>
          </form>
        </section>
      ) : (
        <section className="bg-white rounded-2xl border-2 border-red-100 p-6">
          <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
            <Trash2 size={18} className="text-red-600" /> Delete Account
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Permanently delete your account, meal plans, orders, and all associated data.
            This action has a <strong className="text-slate-700">30-day grace period</strong> —
            you can cancel any time before final deletion.
          </p>

          <DeleteAccountModal />
        </section>
      )}
    </div>
  )
}