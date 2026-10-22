import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InboxView, type ConversationItem } from '@/components/messaging/InboxView'
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
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'client') redirect('/')

  const { data: clientProfile, error: clientProfileError } = await db
    .from('client_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (clientProfileError) {
    return (
      <div className="ch-card p-8" role="alert">
        <h1 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
          Messages are temporarily unavailable
        </h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)]">
          We couldn’t load your client profile. Please refresh the page to try again.
        </p>
      </div>
    )
  }

  if (!clientProfile) {
    return (
      <div className="ch-card p-8">
        <h1 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
          Complete your client profile
        </h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)] mb-6">
          Save your client profile to access messages with engineers associated
          with your projects.
        </p>
        <Link href="/client/profile" className="ch-btn ch-btn-primary">
          Set Up Client Profile
        </Link>
      </div>
    )
  }

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

  const { data: cards, error: cardsError } = !conversationsError && rawConvs?.length
    ? await db.rpc('conversation_participant_cards')
    : { data: [], error: null }
  const cardById = new Map((cards || []).map((card: any) => [card.conversation_id, card]))

  const conversations: ConversationItem[] = (rawConvs || []).map((c: any) => {
    const engProfile = Array.isArray(c.engineer_profile)
      ? c.engineer_profile[0]
      : c.engineer_profile

    const engUser = Array.isArray(engProfile?.profiles)
      ? engProfile.profiles[0]
      : engProfile?.profiles

    const proj = Array.isArray(c.project) ? c.project[0] : c.project
    const engHeadline = engProfile?.headline || engProfile?.specialization
    const card = cardById.get(c.id) as any
    const participantName = card?.engineer_name || engUser?.full_name || engHeadline || 'Civil Engineer'

    const msgs = (c.messages || []).sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
      participant_avatar: card?.engineer_avatar || engUser?.avatar_url,
      last_message: lastMsg?.body || null,
      last_message_at: lastMsg?.created_at || c.updated_at,
      unread_count: unreadCount,
    }
  })

  return (
    <InboxView
      conversations={conversations}
      role="client"
      loadError={
        (conversationsError || cardsError)
          ? missingMessagingSchema(conversationsError || cardsError)
            ? 'migration'
            : 'generic'
          : null
      }
    />
  )
}
