import { createClient } from '@/lib/supabase/server'

export async function createInAppNotification({
  profileId,
  type,
  title,
  body,
  link,
}: {
  profileId: string
  type: string
  title: string
  body?: string
  link?: string
}) {
  if (!profileId || !title) return

  const supabase = await createClient()
  const db = supabase as any

  await db.from('notifications').insert({
    profile_id: profileId,
    type,
    title,
    body: body || null,
    data: link ? { link } : null,
    is_read: false,
  })
}
