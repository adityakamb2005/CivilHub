'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markNotificationRead(notificationId: string) {
  if (!notificationId) return

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await db
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('profile_id', user.id)

  revalidatePath('/engineer/notifications')
  revalidatePath('/client/notifications')
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await db
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', user.id)
    .eq('is_read', false)

  revalidatePath('/engineer/notifications')
  revalidatePath('/client/notifications')
}
