import { fetchProfile } from '../actions'
import GeneralForm from './GeneralForm'
import { redirect } from 'next/navigation'

export default async function GeneralPage() {
  const profile = await fetchProfile()
  if (!profile) redirect('/login')

  return <GeneralForm initial={profile} />
}