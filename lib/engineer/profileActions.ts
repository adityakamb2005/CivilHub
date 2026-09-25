'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileActionState = { error?: string; success?: string }

function value(formData: FormData, key: string): string {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

export async function updateEngineerProfileEnhanced(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const fullName = value(formData, 'full_name')
  const location = value(formData, 'location')
  const phone = value(formData, 'phone')
  const avatarUrl = value(formData, 'avatar_url')

  const title = value(formData, 'title')
  const headline = value(formData, 'headline')
  const specialization = value(formData, 'specialization')
  const yearsExperienceRaw = value(formData, 'years_experience')
  const about = value(formData, 'about')
  const isAvailable = formData.get('is_available') === 'on' || formData.get('is_available') === 'true'
  const visibility = value(formData, 'visibility') === 'public' ? 'public' : 'private'
  const websiteUrl = value(formData, 'website_url')
  const linkedinUrl = value(formData, 'linkedin_url')

  const rawSkills = value(formData, 'skills')
  const rawEducation = value(formData, 'education_json')
  const rawCertifications = value(formData, 'certifications_json')
  const rawWorkExperience = value(formData, 'work_experience_json')

  if (!fullName) {
    return { error: 'Full name is required.' }
  }

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to update your profile.' }
  }

  // 1. Update public.profiles
  const { error: profileError } = await db
    .from('profiles')
    .update({
      full_name: fullName,
      location: location || null,
      phone: phone || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'Failed to update user profile details.' }
  }

  // Parse arrays / JSON
  const skills = rawSkills
    ? rawSkills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  let education = []
  if (rawEducation) {
    try {
      education = JSON.parse(rawEducation)
    } catch {
      education = []
    }
  }

  let certifications = []
  if (rawCertifications) {
    try {
      certifications = JSON.parse(rawCertifications)
    } catch {
      certifications = []
    }
  }

  let workExperience = []
  if (rawWorkExperience) {
    try {
      workExperience = JSON.parse(rawWorkExperience)
    } catch {
      workExperience = []
    }
  }

  const yearsExperience = yearsExperienceRaw !== '' ? parseInt(yearsExperienceRaw, 10) : null

  // 2. Upsert engineer_profiles
  const { error: engProfileError } = await db
    .from('engineer_profiles')
    .upsert(
      {
        profile_id: user.id,
        title: title || null,
        headline: headline || null,
        specialization: specialization || null,
        years_experience: yearsExperience,
        about: about || null,
        is_available: isAvailable,
        visibility,
        website_url: websiteUrl || null,
        linkedin_url: linkedinUrl || null,
        skills,
        education,
        certifications,
        work_experience: workExperience,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' }
    )

  if (engProfileError) {
    return { error: 'Failed to update engineer professional profile.' }
  }

  revalidatePath('/engineer/dashboard')
  revalidatePath('/engineer/profile')
  revalidatePath('/engineers')
  revalidatePath(`/engineers/${user.id}`)

  return { success: 'Engineer profile updated successfully.' }
}
