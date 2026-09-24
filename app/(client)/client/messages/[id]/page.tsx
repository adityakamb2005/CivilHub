import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ConversationView, MessageItem } from '@/components/messaging/ConversationView'

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function ClientConversationPage({ params }: PageProps) {
  const { id: conversationId } = await params
  if (!UUID_PATTERN.test(conversationId)) notFound()

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/client/messages/${conversationId}`)

  const { data: clientProfile } = await db
    .from('client_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!clientProfile) redirect('/client/dashboard')

  // Fetch conversation & ensure ownership
  const { data: conv } = await db
    .from('conversations')
    .select(`
      id,
      project_id,
      client_profile_id,
      project:projects(title),
      engineer_profile:engineer_profiles(
        id,
        headline,
        specialization,
        profiles(full_name)
      )
    `)
    .eq('id', conversationId)
    .maybeSingle()

  if (!conv || conv.client_profile_id !== clientProfile.id) {
    notFound()
  }

  // Fetch messages thread
  const { data: rawMsgs } = await db
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const engUser = conv.engineer_profile?.profiles
  const engHeadline = conv.engineer_profile?.headline || conv.engineer_profile?.specialization
  const participantName = engUser?.full_name || engHeadline || 'Civil Engineer'

  const initialMessages: MessageItem[] = (rawMsgs || []).map((m: any) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    sender_profile_id: m.sender_profile_id,
    sender_name: m.sender_profile_id === user.id ? 'You' : participantName,
    body: m.body,
    created_at: m.created_at,
    read_at: m.read_at,
  }))

  return (
    <ConversationView
      conversationId={conversationId}
      projectId={conv.project_id}
      projectTitle={conv.project?.title || 'Civil Project'}
      participantName={participantName}
      participantRole="Engineer"
      currentUserId={user.id}
      role="client"
      initialMessages={initialMessages}
    />
  )
}
