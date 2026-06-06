import { fetchPreferences } from '../actions'
import PreferencesForm from './PreferencesForm'
import { redirect } from 'next/navigation'

export default async function PreferencesPage() {
  const prefs = await fetchPreferences()
  if (!prefs) redirect('/login')
  return <PreferencesForm initial={prefs} />
}