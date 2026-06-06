import { fetchPreferences } from '../actions'
import NotificationsForm from './NotificationsForm'
import { redirect } from 'next/navigation'

export default async function NotificationsPage() {
  const prefs = await fetchPreferences()
  if (!prefs) redirect('/login')
  return <NotificationsForm initial={prefs} />
}