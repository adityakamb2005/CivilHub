import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InboxView, ConversationItem } from '@/components/messaging/InboxView'
import { missingMessagingSchema } from '@/lib/messaging/messagingErrors'

export const metadata = {
  title: 'Engineer Messages | CivilHub',
  description: 'Direct communications with project clients.',
}

export default async function EngineerMessagesPage() {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'engineer') redirect('/')

  const { data: engineerProfile, error: engineerProfileError } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (engineerProfileError) {
    return (
      <div className="ch-card p-8" role="alert">
        <h1 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
          Messages are temporarily unavailable
        </h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)]">
          We couldn't load your engineer profile. Please refresh the page to try again.
        </p>
      </div>
    )
  }

  if (!engineerProfile) {
    return (
      <div className="ch-card p-8">
        <h1 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
          Complete your engineer profile
        </h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)] mb-6">
          Save your engineer profile to access messages with clients associated
          with your project applications.
        </p>
        <Link href="/engineer/profile" className="ch-btn ch-btn-primary">
          Set Up Engineer Profile
        </Link>
      </div>
    )
  }

  // Fetch conversations involving this engineer profile
  const { data: rawConvs, error: conversationsError } = await db
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

  const { data: cards, error: cardsError } = !conversationsError && rawConvs?.length
    ? await db.rpc('conversation_participant_cards')
    : { data: [], error: null }
  const cardById = new Map((cards || []).map((card: any) => [card.conversation_id, card]))

  const conversations: ConversationItem[] = (rawConvs || []).map((c: any) => {
    const clientProfile = Array.isArray(c.client_profile) ? c.client_profile[0] : c.client_profile
    const clientUser = Array.isArray(clientProfile?.profiles) ? clientProfile?.profiles[0] : clientProfile?.profiles
    const proj = Array.isArray(c.project) ? c.project[0] : c.project
    const clientCompany = clientProfile?.company
    const card = cardById.get(c.id) as any
    const participantName = card?.client_name || clientUser?.full_name || clientCompany || 'Client Project Owner'

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
      participant_role: 'Client',
      participant_avatar: card?.client_avatar || clientUser?.avatar_url,
      last_message: lastMsg?.body || null,
      last_message_at: lastMsg?.created_at || c.updated_at,
      unread_count: unreadCount,
    }
  })

  return <InboxView conversations={conversations} role="engineer" loadError={(conversationsError || cardsError) ? (missingMessagingSchema(conversationsError || cardsError) ? 'migration' : 'generic') : null} />
}
