import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ConversationView, MessageItem } from '@/components/messaging/ConversationView'

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function EngineerConversationPage({ params }: PageProps) {
  const { id: conversationId } = await params
  if (!UUID_PATTERN.test(conversationId)) notFound()

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/engineer/messages/${conversationId}`)

  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!engineerProfile) redirect('/engineer/dashboard')

  // Fetch conversation & ensure authorization
  const { data: conv } = await db
    .from('conversations')
    .select(`
      id,
      project_id,
      engineer_profile_id,
      project:projects(title),
      client_profile:client_profiles(
        id,
        company,
        profiles(full_name)
      )
    `)
    .eq('id', conversationId)
    .maybeSingle()

  if (!conv || conv.engineer_profile_id !== engineerProfile.id) {
    notFound()
  }

  // Fetch messages thread
  const { data: rawMsgs } = await db
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const clientUser = conv.client_profile?.profiles
  const clientCompany = conv.client_profile?.company
  const participantName = clientUser?.full_name || clientCompany || 'Client Project Owner'

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
      participantRole="Client"
      currentUserId={user.id}
      role="engineer"
      initialMessages={initialMessages}
    />
  )
}
