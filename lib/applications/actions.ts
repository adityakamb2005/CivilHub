'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/admin/auth'

export type ApplicationActionState = { error?: string; success?: string }

const APPLICATION_STATUSES = new Set(['pending', 'accepted', 'rejected', 'withdrawn'])
const MIN_COVER_MESSAGE_LENGTH = 20
const MAX_COVER_MESSAGE_LENGTH = 3000

function value(formData: FormData, key: string): string {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function revalidateApplications(opportunityId?: string) {
  revalidatePath('/engineer/dashboard')
  revalidatePath('/admin/applications')
  if (opportunityId) revalidatePath(`/opportunities/${opportunityId}`)
}

export async function submitApplication(
  _previousState: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const opportunityId = value(formData, 'opportunity_id')
  const coverMessage = value(formData, 'cover_message')

  if (!isUuid(opportunityId)) return { error: 'This opportunity is not available for applications.' }
  if (coverMessage.length < MIN_COVER_MESSAGE_LENGTH) {
    return { error: `Please write at least ${MIN_COVER_MESSAGE_LENGTH} characters about your interest.` }
  }
  if (coverMessage.length > MAX_COVER_MESSAGE_LENGTH) {
    return { error: `Your cover message must be ${MAX_COVER_MESSAGE_LENGTH} characters or fewer.` }
  }

  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in to apply.' }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'engineer') {
    return { error: 'Only engineer accounts can apply for opportunities.' }
  }

  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (!engineerProfile) {
    return { error: 'Complete your engineer profile before applying.' }
  }

  const { data: opportunity } = await db
    .from('opportunities')
    .select('id')
    .eq('id', opportunityId)
    .maybeSingle()
  if (!opportunity) return { error: 'This opportunity is no longer open for applications.' }

  const { error } = await db.from('opportunity_applications').insert({
    opportunity_id: opportunityId,
    engineer_profile_id: engineerProfile.id,
    cover_message: coverMessage,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You have already applied for this opportunity.' }
    return { error: 'Your application could not be submitted. Please try again.' }
  }

  revalidateApplications(opportunityId)
  return { success: 'Your application has been submitted.' }
}

export async function withdrawApplication(applicationId: string, opportunityId: string) {
  if (!isUuid(applicationId) || !isUuid(opportunityId)) return
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await db
    .from('opportunity_applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId)
    .eq('status', 'pending')
  if (!error) revalidateApplications(opportunityId)
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  if (!isUuid(applicationId) || !APPLICATION_STATUSES.has(status)) return
  const { supabase, user, isAdmin } = await getAdminContext()
  if (!user || !isAdmin) return

  const { data } = await (supabase as any)
    .from('opportunity_applications')
    .update({ status: status as 'pending' | 'accepted' | 'rejected' | 'withdrawn' })
    .eq('id', applicationId)
    .select('opportunity_id')
    .maybeSingle()
  revalidateApplications(data?.opportunity_id)
}
