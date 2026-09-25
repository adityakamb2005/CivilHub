'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type PortfolioActionState = { error?: string; success?: string }

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)
}

function value(formData: FormData, key: string): string {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function revalidateEngineerPaths(profileId?: string) {
  revalidatePath('/engineer/dashboard')
  revalidatePath('/engineer/profile')
  revalidatePath('/engineer/portfolio')
  revalidatePath('/engineers')
  if (profileId) {
    revalidatePath(`/engineers/${profileId}`)
  }
}

export async function createPortfolioItem(
  _previousState: PortfolioActionState,
  formData: FormData
): Promise<PortfolioActionState> {
  const title = value(formData, 'title')
  const shortDescription = value(formData, 'short_description')
  const detailedDescription = value(formData, 'detailed_description')
  const rawSkills = value(formData, 'skills')
  const projectDate = value(formData, 'project_date')
  const projectUrl = value(formData, 'project_url')
  const imageUrl = value(formData, 'image_url')

  if (!title) {
    return { error: 'Project title is required.' }
  }
  if (!shortDescription) {
    return { error: 'Short description is required.' }
  }

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to manage portfolio.' }
  }

  // Get engineer profile for user
  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!engineerProfile) {
    return { error: 'Please complete your engineer profile first.' }
  }

  const skills = rawSkills
    ? rawSkills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const { error } = await db.from('engineer_portfolios').insert({
    engineer_profile_id: engineerProfile.id,
    title,
    short_description: shortDescription,
    detailed_description: detailedDescription || null,
    skills,
    project_date: projectDate || null,
    project_url: projectUrl || null,
    image_url: imageUrl || null,
  })

  if (error) {
    return { error: 'Failed to create portfolio entry. Please try again.' }
  }

  revalidateEngineerPaths(user.id)
  return { success: 'Portfolio entry added successfully.' }
}

export async function updatePortfolioItem(
  itemId: string,
  _previousState: PortfolioActionState,
  formData: FormData
): Promise<PortfolioActionState> {
  if (!isUuid(itemId)) {
    return { error: 'Invalid portfolio entry.' }
  }

  const title = value(formData, 'title')
  const shortDescription = value(formData, 'short_description')
  const detailedDescription = value(formData, 'detailed_description')
  const rawSkills = value(formData, 'skills')
  const projectDate = value(formData, 'project_date')
  const projectUrl = value(formData, 'project_url')
  const imageUrl = value(formData, 'image_url')

  if (!title) {
    return { error: 'Project title is required.' }
  }
  if (!shortDescription) {
    return { error: 'Short description is required.' }
  }

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to update portfolio.' }
  }

  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!engineerProfile) {
    return { error: 'Engineer profile not found.' }
  }

  const skills = rawSkills
    ? rawSkills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const { error } = await db
    .from('engineer_portfolios')
    .update({
      title,
      short_description: shortDescription,
      detailed_description: detailedDescription || null,
      skills,
      project_date: projectDate || null,
      project_url: projectUrl || null,
      image_url: imageUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('engineer_profile_id', engineerProfile.id)

  if (error) {
    return { error: 'Failed to update portfolio entry.' }
  }

  revalidateEngineerPaths(user.id)
  return { success: 'Portfolio entry updated successfully.' }
}

export async function deletePortfolioItem(itemId: string) {
  if (!isUuid(itemId)) return

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!engineerProfile) return

  const { error } = await db
    .from('engineer_portfolios')
    .delete()
    .eq('id', itemId)
    .eq('engineer_profile_id', engineerProfile.id)

  if (!error) {
    revalidateEngineerPaths(user.id)
  }
}
