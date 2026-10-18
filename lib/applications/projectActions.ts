'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ApplicationActionState = { error?: string; success?: string }

const MIN_COVER_MESSAGE_LENGTH = 20
const MAX_COVER_MESSAGE_LENGTH = 3000

function value(formData: FormData, key: string): string {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)
}

function revalidateProjectPaths(projectId?: string) {
  revalidatePath('/engineer/dashboard')
  revalidatePath('/engineer/projects')
  revalidatePath('/engineer/notifications')
  revalidatePath('/client/dashboard')
  revalidatePath('/client/projects')
  revalidatePath('/client/notifications')
  revalidatePath('/projects')
  if (projectId) {
    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/client/projects/${projectId}`)
    revalidatePath(`/client/projects/${projectId}/applications`)
  }
}

export async function submitProjectApplication(
  _previousState: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const projectId = value(formData, 'project_id')
  const coverMessage = value(formData, 'cover_message')

  if (!isUuid(projectId)) {
    return { error: 'This project is not available for engineer applications.' }
  }
  if (coverMessage.length < MIN_COVER_MESSAGE_LENGTH) {
    return {
      error: `Please write at least ${MIN_COVER_MESSAGE_LENGTH} characters describing your interest and approach.`,
    }
  }
  if (coverMessage.length > MAX_COVER_MESSAGE_LENGTH) {
    return {
      error: `Your cover message must be ${MAX_COVER_MESSAGE_LENGTH} characters or fewer.`,
    }
  }

  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Please log in to apply for this project.' }
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'engineer') {
    return { error: 'Only engineer accounts can submit project applications.' }
  }

  const { data: engineerProfile, error: engineerProfileError } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (engineerProfileError) return { error: 'Could not load your engineer profile. Please try again.' }
  if (!engineerProfile) {
    return { error: 'Please complete your engineer profile before applying.' }
  }

  // Check project eligibility
  const { data: project, error: projectError } = await db
    .from('projects')
    .select('id, is_published, status, engineer_profile_id')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError) return { error: 'Could not load the project. Please try again.' }
  if (
    !project ||
    !project.is_published ||
    project.engineer_profile_id !== null ||
    (project.status !== 'planned' && project.status !== 'in_progress')
  ) {
    return {
      error: 'This project is no longer accepting engineer applications.',
    }
  }

  const { error } = await db.from('project_applications').insert({
    project_id: projectId,
    engineer_profile_id: engineerProfile.id,
    cover_message: coverMessage,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'You have already submitted an application for this project.' }
    }
    return { error: 'Your project application could not be submitted. Please try again.' }
  }

  revalidateProjectPaths(projectId)
  return { success: 'Your application has been submitted successfully.' }
}

export async function withdrawProjectApplication(
  projectId: string,
  applicationId: string
): Promise<ApplicationActionState> {
  if (!isUuid(projectId) || !isUuid(applicationId)) return { error: 'Invalid project or application.' }

  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to withdraw your application.' }

  const { data: profile, error: roleError } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (roleError || profile?.role !== 'engineer') return { error: 'Only engineers can withdraw their applications.' }

  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!engineerProfile) return { error: 'Your engineer profile could not be loaded.' }

  const { data, error } = await db
    .from('project_applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId)
    .eq('project_id', projectId)
    .eq('engineer_profile_id', engineerProfile.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error || !data) return { error: 'The application could not be withdrawn. Refresh the page and try again.' }
  revalidateProjectPaths(projectId)
  return { success: 'Application withdrawn.' }
}

export async function acceptProjectApplication(
  projectId: string,
  applicationId: string
): Promise<ApplicationActionState> {
  if (!isUuid(projectId) || !isUuid(applicationId)) return { error: 'Invalid project or application.' }

  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to review applications.' }

  const { data: profile, error: roleError } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (roleError || profile?.role !== 'client') return { error: 'Only clients can review project applications.' }

  const { data: clientProfile } = await db
    .from('client_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!clientProfile) return { error: 'Your client profile could not be loaded.' }

  // Verify project ownership by client
  const { data: project } = await db
    .from('projects')
    .select('id, client_profile_id, engineer_profile_id, status')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.client_profile_id !== clientProfile.id) {
    return { error: 'You cannot review applications for this project.' }
  }

  // Get target application engineer_profile_id
  const { data: application } = await db
    .from('project_applications')
    .select('id, engineer_profile_id, status')
    .eq('id', applicationId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!application || !['pending', 'accepted'].includes(application.status)) {
    return { error: 'This application is no longer available for acceptance.' }
  }
  if (project.engineer_profile_id && project.engineer_profile_id !== application.engineer_profile_id) {
    return { error: 'This project already has an assigned engineer.' }
  }
  if (application.status !== 'accepted' && !['planned', 'in_progress'].includes(project.status)) {
    return { error: 'This project is not active. Update its status before accepting an engineer.' }
  }
  if (application.status === 'accepted' && project.engineer_profile_id !== application.engineer_profile_id) {
    return { error: 'The application and assignment are inconsistent. Please contact an administrator.' }
  }

  // Migration-013-compatible workflow: three requests, not a transaction.
  // Do not deploy this action after migration 016's assignment guards activate.
  const { data: assignedProject, error: assignError } = project.engineer_profile_id
    ? { data: project, error: null }
    : await db
      .from('projects')
      .update({ engineer_profile_id: application.engineer_profile_id })
      .eq('id', projectId)
      .eq('client_profile_id', clientProfile.id)
      .is('engineer_profile_id', null)
      .in('status', ['planned', 'in_progress'])
      .select('id')
      .maybeSingle()

  if (assignError || !assignedProject) return { error: 'The assignment could not be saved. Refresh the page before trying again.' }

  const { data: acceptedApplication, error: acceptError } = await db
    .from('project_applications')
    .update({ status: 'accepted' })
    .eq('id', applicationId)
    .eq('project_id', projectId)
    .in('status', ['pending', 'accepted'])
    .select('id')
    .maybeSingle()

  if (acceptError || !acceptedApplication) {
    revalidateProjectPaths(projectId)
    return { error: 'The engineer was assigned, but the application status could not be saved. Refresh and retry acceptance; contact an administrator if the application was withdrawn.' }
  }

  const { error: rejectError } = await db
    .from('project_applications')
    .update({ status: 'rejected' })
    .eq('project_id', projectId)
    .neq('id', applicationId)
    .eq('status', 'pending')

  revalidateProjectPaths(projectId)
  if (rejectError) return { error: 'The engineer was accepted, but competing applications could not be closed. Retry acceptance to finish updating them.' }
  return { success: 'Engineer accepted and assigned.' }
}

export async function rejectProjectApplication(
  projectId: string,
  applicationId: string
): Promise<ApplicationActionState> {
  if (!isUuid(projectId) || !isUuid(applicationId)) return { error: 'Invalid project or application.' }

  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to review applications.' }

  const { data: profile, error: roleError } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (roleError || profile?.role !== 'client') return { error: 'Only clients can review project applications.' }

  const { data: clientProfile } = await db
    .from('client_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!clientProfile) return { error: 'Your client profile could not be loaded.' }

  // Verify project ownership
  const { data: project } = await db
    .from('projects')
    .select('id, client_profile_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.client_profile_id !== clientProfile.id) {
    return { error: 'You cannot review applications for this project.' }
  }

  const { data: rejectedApplication, error } = await db
    .from('project_applications')
    .update({ status: 'rejected' })
    .eq('id', applicationId)
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error || !rejectedApplication) return { error: 'The application could not be rejected. Refresh the page and try again.' }
  revalidateProjectPaths(projectId)
  return { success: 'Application rejected.' }
}
