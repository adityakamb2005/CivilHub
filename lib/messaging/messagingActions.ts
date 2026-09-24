'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createInAppNotification } from '@/lib/notifications/internalNotifications'

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)
}

export type MessageActionState = { error?: string; success?: string }

export async function getOrCreateConversation(
  projectId: string,
  engineerProfileId: string
): Promise<{ conversationId?: string; error?: string }> {
  if (!isUuid(projectId) || !isUuid(engineerProfileId)) {
    return { error: 'Invalid project or engineer reference.' }
  }

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to start a conversation.' }
  }

  // Fetch project & client profile details
  const { data: project } = await db
    .from('projects')
    .select('id, client_profile_id, engineer_profile_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || !project.client_profile_id) {
    return { error: 'Project context not found.' }
  }

  // Fetch client profile and target engineer profile
  const { data: clientProfile } = await db
    .from('client_profiles')
    .select('id, profile_id')
    .eq('id', project.client_profile_id)
    .maybeSingle()

  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id, profile_id')
    .eq('id', engineerProfileId)
    .maybeSingle()

  if (!clientProfile || !engineerProfile) {
    return { error: 'Participant profiles not found.' }
  }

  // Authorization check: User must be either the client or the engineer participant
  const isClientUser = clientProfile.profile_id === user.id
  const isEngineerUser = engineerProfile.profile_id === user.id

  if (!isClientUser && !isEngineerUser) {
    return { error: 'You are not authorized to start this conversation.' }
  }

  // Eligibility check: Must be assigned engineer or have an application
  const isAssigned = project.engineer_profile_id === engineerProfile.id

  let hasApplication = false
  if (!isAssigned) {
    const { data: application } = await db
      .from('project_applications')
      .select('id')
      .eq('project_id', projectId)
      .eq('engineer_profile_id', engineerProfile.id)
      .maybeSingle()
    hasApplication = Boolean(application)
  }

  if (!isAssigned && !hasApplication) {
    return {
      error:
        'Conversations can only be started between clients and engineers associated via a project application or assignment.',
    }
  }

  // Check if conversation already exists
  const { data: existingConv } = await db
    .from('conversations')
    .select('id')
    .eq('project_id', projectId)
    .eq('client_profile_id', clientProfile.id)
    .eq('engineer_profile_id', engineerProfile.id)
    .maybeSingle()

  if (existingConv) {
    return { conversationId: existingConv.id }
  }

  // Create new conversation
  const { data: newConv, error: createError } = await db
    .from('conversations')
    .insert({
      project_id: projectId,
      client_profile_id: clientProfile.id,
      engineer_profile_id: engineerProfile.id,
    })
    .select('id')
    .single()

  if (createError || !newConv) {
    return { error: 'Failed to create conversation. Please try again.' }
  }

  return { conversationId: newConv.id }
}

export async function sendMessage(
  conversationId: string,
  bodyText: string
): Promise<MessageActionState> {
  const body = bodyText.trim()
  if (!isUuid(conversationId)) {
    return { error: 'Invalid conversation.' }
  }
  if (!body) {
    return { error: 'Message cannot be empty.' }
  }
  if (body.length > 2000) {
    return { error: 'Message must be 2000 characters or fewer.' }
  }

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to send messages.' }
  }

  // Fetch conversation and participant profiles
  const { data: conv } = await db
    .from('conversations')
    .select(
      `
      id,
      project_id,
      client_profile:client_profiles(id, profile_id),
      engineer_profile:engineer_profiles(id, profile_id),
      project:projects(title)
    `
    )
    .eq('id', conversationId)
    .maybeSingle()

  if (!conv) {
    return { error: 'Conversation not found.' }
  }

  const clientProfileUser = conv.client_profile?.profile_id
  const engineerProfileUser = conv.engineer_profile?.profile_id

  const isClient = clientProfileUser === user.id
  const isEngineer = engineerProfileUser === user.id

  if (!isClient && !isEngineer) {
    return { error: 'You are not a participant in this conversation.' }
  }

  // Insert message
  const { error: insertError } = await db.from('messages').insert({
    conversation_id: conversationId,
    sender_profile_id: user.id,
    body,
  })

  if (insertError) {
    return { error: 'Could not send message. Please try again.' }
  }

  // Touch conversation updated_at
  await db
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  // Identify recipient user ID
  const recipientUserId = isClient ? engineerProfileUser : clientProfileUser
  const recipientRole = isClient ? 'engineer' : 'client'
  const messagePreview = body.length > 60 ? `${body.slice(0, 60)}...` : body
  const projectTitle = conv.project?.title || 'Project'

  if (recipientUserId) {
    await createInAppNotification({
      profileId: recipientUserId,
      type: 'new_message',
      title: `New message regarding ${projectTitle}`,
      body: messagePreview,
      link: `/${recipientRole}/messages/${conversationId}`,
    })
  }

  revalidatePath(`/client/messages/${conversationId}`)
  revalidatePath(`/engineer/messages/${conversationId}`)
  revalidatePath('/client/messages')
  revalidatePath('/engineer/messages')

  return { success: 'Message sent.' }
}

export async function markConversationMessagesAsRead(conversationId: string) {
  if (!isUuid(conversationId)) return

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const now = new Date().toISOString()

  await db
    .from('messages')
    .update({ read_at: now })
    .eq('conversation_id', conversationId)
    .neq('sender_profile_id', user.id)
    .is('read_at', null)

  revalidatePath(`/client/messages/${conversationId}`)
  revalidatePath(`/engineer/messages/${conversationId}`)
  revalidatePath('/client/messages')
  revalidatePath('/engineer/messages')
}
