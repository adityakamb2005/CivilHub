import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsView, NotificationItem } from '@/components/notifications/NotificationsView'

export const metadata = {
  title: 'Client Notifications | CivilHub',
  description: 'In-app notifications for project applications and messages.',
}

export default async function ClientNotificationsPage() {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'client') redirect('/')

  // Fetch notifications for user
  const { data: rawNotifs } = await db
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  const notifications: NotificationItem[] = (rawNotifs || []).map((n: any) => ({
    id: n.id,
    profile_id: n.profile_id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.data?.link || null,
    is_read: n.is_read,
    created_at: n.created_at,
  }))

  return <NotificationsView notifications={notifications} role="client" />
}
