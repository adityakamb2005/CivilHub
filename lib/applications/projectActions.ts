'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createInAppNotification } from '@/lib/notifications/internalNotifications'

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
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'engineer') {
    return { error: 'Only engineer accounts can submit project applications.' }
  }

  const { data: engineerProfile } = await db
    .from('engineer_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!engineerProfile) {
    return { error: 'Please complete your engineer profile before applying.' }
  }

  // Check project eligibility
  const { data: project } = await db
    .from('projects')
    .select('id, title, is_published, status, engineer_profile_id, client_profile_id')
    .eq('id', projectId)
    .maybeSingle()

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

  // Trigger Notification to Client owner
  if (project.client_profile_id) {
    const { data: clientProfile } = await db
      .from('client_profiles')
      .select('profile_id')
      .eq('id', project.client_profile_id)
      .maybeSingle()

    if (clientProfile?.profile_id) {
      const applicantName = profile.full_name || 'An engineer'
      await createInAppNotification({
        profileId: clientProfile.profile_id,
        type: 'project_application',
        title: 'New project application',
        body: `${applicantName} submitted an application for "${project.title}".`,
        link: `/client/projects/${projectId}/applications`,
      })
    }
  }

  revalidateProjectPaths(projectId)
  return { success: 'Your application has been submitted successfully.' }
}

export async function withdrawProjectApplication(
  projectId: string,
  applicationId: string
) {
  if (!isUuid(projectId) || !isUuid(applicationId)) return

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
    .from('project_applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId)
    .eq('project_id', projectId)
    .eq('engineer_profile_id', engineerProfile.id)
    .eq('status', 'pending')

  if (!error) {
    revalidateProjectPaths(projectId)
  }
}

export async function acceptProjectApplication(
  projectId: string,
  applicationId: string
) {
  if (!isUuid(projectId) || !isUuid(applicationId)) return

  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: clientProfile } = await db
    .from('client_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!clientProfile) return

  // Verify project ownership by client
  const { data: project } = await db
    .from('projects')
    .select('id, title, client_profile_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.client_profile_id !== clientProfile.id) {
    return
  }

  // Get target application engineer_profile_id
  const { data: application } = await db
    .from('project_applications')
    .select('id, engineer_profile_id, status')
    .eq('id', applicationId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!application || application.status === 'withdrawn') return

  // Fetch competing pending applications before updating
  const { data: competingApps } = await db
    .from('project_applications')
    .select('id, engineer_profile:engineer_profiles(profile_id)')
    .eq('project_id', projectId)
    .neq('id', applicationId)
    .eq('status', 'pending')

  // 1. Assign engineer to project
  const { error: assignError } = await db
    .from('projects')
    .update({ engineer_profile_id: application.engineer_profile_id })
    .eq('id', projectId)
    .eq('client_profile_id', clientProfile.id)

  if (assignError) return

  // 2. Set this application status to accepted
  await db
    .from('project_applications')
    .update({ status: 'accepted' })
    .eq('id', applicationId)

  // 3. Close/reject competing pending applications for this project
  await db
    .from('project_applications')
    .update({ status: 'rejected' })
    .eq('project_id', projectId)
    .neq('id', applicationId)
    .eq('status', 'pending')

  // 4. Notify accepted engineer
  const { data: acceptedEngineer } = await db
    .from('engineer_profiles')
    .select('profile_id')
    .eq('id', application.engineer_profile_id)
    .maybeSingle()

  if (acceptedEngineer?.profile_id) {
    await createInAppNotification({
      profileId: acceptedEngineer.profile_id,
      type: 'application_accepted',
      title: 'Application Accepted!',
      body: `Your project application for "${project.title}" was accepted. You are now assigned to this project.`,
      link: '/engineer/dashboard',
    })
  }

  // 5. Notify competing rejected engineers
  if (competingApps && competingApps.length > 0) {
    for (const compApp of competingApps) {
      const compUserId = compApp.engineer_profile?.profile_id
      if (compUserId && compUserId !== acceptedEngineer?.profile_id) {
        await createInAppNotification({
          profileId: compUserId,
          type: 'application_rejected',
          title: 'Project Application Status',
          body: `Applications for "${project.title}" have closed.`,
          link: '/engineer/dashboard',
        })
      }
    }
  }

  revalidateProjectPaths(projectId)
}

export async function rejectProjectApplication(
  projectId: string,
  applicationId: string
) {
  if (!isUuid(projectId) || !isUuid(applicationId)) return

  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: clientProfile } = await db
    .from('client_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!clientProfile) return

  // Verify project ownership
  const { data: project } = await db
    .from('projects')
    .select('id, title, client_profile_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.client_profile_id !== clientProfile.id) {
    return
  }

  // Get application engineer details
  const { data: application } = await db
    .from('project_applications')
    .select('id, engineer_profile:engineer_profiles(profile_id)')
    .eq('id', applicationId)
    .eq('project_id', projectId)
    .maybeSingle()

  await db
    .from('project_applications')
    .update({ status: 'rejected' })
    .eq('id', applicationId)
    .eq('project_id', projectId)
    .eq('status', 'pending')

  if (application?.engineer_profile?.profile_id) {
    await createInAppNotification({
      profileId: application.engineer_profile.profile_id,
      type: 'application_rejected',
      title: 'Your project application was not selected',
      body: `Your application for "${project.title}" was not selected.`,
      link: '/engineer/dashboard',
    })
  }

  revalidateProjectPaths(projectId)
}
