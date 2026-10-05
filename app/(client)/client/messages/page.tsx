import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InboxView, ConversationItem } from '@/components/messaging/InboxView'
import { missingMessagingSchema } from '@/lib/messaging/messagingErrors'

export const metadata = {
  title: 'Client Messages | CivilHub',
  description: 'Direct communications with civil engineers.',
}

export default async function ClientMessagesPage() {
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

  const { data: clientProfile } = await db
    .from('client_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!clientProfile) redirect('/client/dashboard')

  // Fetch conversations for client profile
  const { data: rawConvs, error: conversationsError } = await db
    .from('conversations')
    .select(`
      id,
      project_id,
      updated_at,
      project:projects(title),
      engineer_profile:engineer_profiles(
        id,
        headline,
        specialization,
        profiles(full_name, avatar_url)
      ),
      messages(id, body, created_at, read_at, sender_profile_id)
    `)
    .eq('client_profile_id', clientProfile.id)
    .order('updated_at', { ascending: false })

  const conversations: ConversationItem[] = (rawConvs || []).map((c: any) => {
    const engProfile = Array.isArray(c.engineer_profile) ? c.engineer_profile[0] : c.engineer_profile
    const engUser = Array.isArray(engProfile?.profiles) ? engProfile?.profiles[0] : engProfile?.profiles
    const proj = Array.isArray(c.project) ? c.project[0] : c.project
    const engHeadline = engProfile?.headline || engProfile?.specialization
    const participantName = engUser?.full_name || engHeadline || 'Civil Engineer'

    const msgs = (c.messages || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastMsg = msgs[0]
    const unreadCount = (c.messages || []).filter(
      (m: any) => m.sender_profile_id !== user.id && !m.read_at
    ).length

    return {
      id: c.id,
      project_id: c.project_id,
      project_title: proj?.title || 'Civil Project',
      participant_name: participantName,
      participant_role: 'Engineer',
      participant_avatar: engUser?.avatar_url,
      last_message: lastMsg?.body || null,
      last_message_at: lastMsg?.created_at || c.updated_at,
      unread_count: unreadCount,
    }
  })

  return <InboxView conversations={conversations} role="client" loadError={conversationsError ? (missingMessagingSchema(conversationsError) ? 'migration' : 'generic') : null} />
}
