'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { missingMessagingSchema } from '@/lib/messaging/messagingErrors'

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
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Please sign in to start a conversation.' }
  }

  // The database resolves the eligible relationship without exposing private
  // counterpart profiles. It validates canonical roles and participant identity.
  const { data: context, error: contextError } = await db.rpc('project_messaging_context', {
    target_project_id: projectId,
    target_engineer_id: engineerProfileId,
  })
  if (contextError) return { error: 'Could not load the project participants. Please try again.' }
  if (!context || ![context.client_user_id, context.engineer_user_id].includes(user.id)) {
    return { error: 'You are not authorized to start this conversation.' }
  }
  const clientProfile = { id: context.client_profile_id }
  const engineerProfile = { id: context.engineer_profile_id }

  // Check if conversation already exists
  const { data: existingConv, error: existingError } = await db
    .from('conversations')
    .select('id')
    .eq('project_id', projectId)
    .eq('client_profile_id', clientProfile.id)
    .eq('engineer_profile_id', engineerProfile.id)
    .maybeSingle()

  if (missingMessagingSchema(existingError)) {
    return { error: 'Messaging is not configured yet. A project administrator must apply database migration 011 and the current messaging security migration.' }
  }
  if (existingError) return { error: 'Could not check for an existing conversation. Please try again.' }

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
    if (createError?.code === '23505') {
      const { data: racedConversation } = await db
        .from('conversations')
        .select('id')
        .eq('project_id', projectId)
        .eq('client_profile_id', clientProfile.id)
        .eq('engineer_profile_id', engineerProfile.id)
        .maybeSingle()
      if (racedConversation) return { conversationId: racedConversation.id }
    }
    if (missingMessagingSchema(createError)) {
      return { error: 'Messaging is not configured yet. A project administrator must apply database migration 011 and the current messaging security migration.' }
    }
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
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Please sign in to send messages.' }
  }

  // Fetch conversation and participant profiles
  const { data: conv, error: conversationError } = await db
    .from('conversations')
    .select(
      `
      id,
      project_id,
      client_profile:client_profiles(id, profile_id),
      engineer_profile:engineer_profiles(id, profile_id)
    `
    )
    .eq('id', conversationId)
    .maybeSingle()

  if (missingMessagingSchema(conversationError)) {
    return { error: 'Messaging is not configured yet. A project administrator must apply database migration 011 and the current messaging security migration.' }
  }

  if (conversationError) return { error: 'Could not load the conversation. Please try again.' }

  if (!conv) {
    return { error: 'Conversation not found.' }
  }

  const clientProfileObj = Array.isArray(conv.client_profile)
    ? conv.client_profile[0]
    : conv.client_profile
  const engineerProfileObj = Array.isArray(conv.engineer_profile)
    ? conv.engineer_profile[0]
    : conv.engineer_profile

  const clientProfileUser = clientProfileObj?.profile_id
  const engineerProfileUser = engineerProfileObj?.profile_id

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
    if (missingMessagingSchema(insertError)) {
      return { error: 'Messaging is not configured yet. A project administrator must apply database migration 011 and the current messaging security migration.' }
    }
    return { error: 'Could not send message. Please try again.' }
  }

  revalidatePath(`/client/messages/${conversationId}`)
  revalidatePath(`/engineer/messages/${conversationId}`)
  revalidatePath('/client/messages')
  revalidatePath('/engineer/messages')
  revalidatePath('/client/notifications')
  revalidatePath('/engineer/notifications')

  return { success: 'Message sent.' }
}

export async function markConversationMessagesAsRead(conversationId: string): Promise<MessageActionState> {
  if (!isUuid(conversationId)) return { error: 'Invalid conversation.' }

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Please sign in to update message read status.' }

  const now = new Date().toISOString()

  const { data, error } = await db
    .from('messages')
    .update({ read_at: now })
    .eq('conversation_id', conversationId)
    .neq('sender_profile_id', user.id)
    .is('read_at', null)
    .select('id')

  if (error) return { error: 'Could not update message read status. Please refresh to try again.' }
  if (data && data.length > 0) {
    revalidatePath(`/client/messages/${conversationId}`)
    revalidatePath(`/engineer/messages/${conversationId}`)
    revalidatePath('/client/messages')
    revalidatePath('/engineer/messages')
  }
  return {}
}
