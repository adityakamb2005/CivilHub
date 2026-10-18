'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markNotificationRead(notificationId: string): Promise<{ error?: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(notificationId)) return { error: 'Invalid notification.' }

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Please sign in to update notifications.' }

  const { data, error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('profile_id', user.id)
    .select('id')
    .maybeSingle()

  if (error || !data) return { error: 'Could not mark the notification as read. Please try again.' }

  revalidatePath('/engineer/notifications')
  revalidatePath('/client/notifications')
  return {}
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Please sign in to update notifications.' }

  const { error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', user.id)
    .eq('is_read', false)

  if (error) return { error: 'Could not mark notifications as read. Please try again.' }

  revalidatePath('/engineer/notifications')
  revalidatePath('/client/notifications')
  return {}
}
