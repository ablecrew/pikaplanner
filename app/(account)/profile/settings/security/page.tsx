import { fetch2FAFactors, fetchSessions } from '../actions'
import PasswordForm from './PasswordForm'
import TwoFactorSetup from './TwoFactorSetup'
import SessionsList from './SessionsList'

export default async function SecurityPage() {
  const factors = await fetch2FAFactors()
  const sessions = await fetchSessions()
  const has2FA = factors.some((f) => f.status === 'verified')
  const factorId = factors[0]?.id

  return (
    <div className="space-y-6">
      <PasswordForm />
      <TwoFactorSetup enabled={has2FA} factorId={factorId} />
      <SessionsList sessions={sessions} />
    </div>
  )
}