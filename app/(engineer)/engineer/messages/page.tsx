import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InboxView, ConversationItem } from '@/components/messaging/InboxView'

export const metadata = {
  title: 'Engineer Messages | CivilHub',
  description: 'Direct communications with project clients.',
}

export default async function EngineerMessagesPage() {
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

  if (!profile || profile.role !== 'engineer') redirect('/')

  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!engineerProfile) redirect('/engineer/dashboard')

  // Fetch conversations involving this engineer profile
  const { data: rawConvs } = await db
    .from('conversations')
    .select(`
      id,
      project_id,
      updated_at,
      project:projects(title),
      client_profile:client_profiles(
        id,
        company,
        profiles(full_name, avatar_url)
      ),
      messages(id, body, created_at, read_at, sender_profile_id)
    `)
    .eq('engineer_profile_id', engineerProfile.id)
    .order('updated_at', { ascending: false })

  const conversations: ConversationItem[] = (rawConvs || []).map((c: any) => {
    const clientUser = c.client_profile?.profiles
    const clientCompany = c.client_profile?.company
    const participantName = clientUser?.full_name || clientCompany || 'Client Project Owner'

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
      project_title: c.project?.title || 'Civil Project',
      participant_name: participantName,
      participant_role: 'Client',
      participant_avatar: clientUser?.avatar_url,
      last_message: lastMsg?.body || null,
      last_message_at: lastMsg?.created_at || c.updated_at,
      unread_count: unreadCount,
    }
  })

  return <InboxView conversations={conversations} role="engineer" />
}
