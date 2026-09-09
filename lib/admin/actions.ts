'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminContext } from './auth'

export type AdminActionState = { error?: string }

const OPPORTUNITY_STATUSES = new Set(['open', 'closed'])
const PROJECT_STATUSES = new Set(['planned', 'in_progress', 'completed', 'on_hold'])

function value(formData: FormData, key: string): string {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function optionalValue(formData: FormData, key: string): string | null {
  const result = value(formData, key)
  return result || null
}

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidDate(input: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false
  return !Number.isNaN(new Date(`${input}T00:00:00Z`).getTime())
}

function isUuid(input: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)
}

function unauthorized(): AdminActionState {
  return { error: 'Your admin session is no longer authorized. Please sign in again.' }
}

async function adminDbOrLogin(path: string) {
  const context = await getAdminContext()
  if (!context.user) redirect(`/login?redirect=${encodeURIComponent(path)}`)
  if (!context.isAdmin) return null
  return context.supabase as any
}

async function adminDbOrRedirect(path: string) {
  const context = await getAdminContext()
  if (!context.user) redirect(`/login?redirect=${encodeURIComponent(path)}`)
  if (!context.isAdmin) redirect('/')
  return context.supabase as any
}

function revalidateContent(path: string, id?: string) {
  revalidatePath(path)
  if (id) revalidatePath(`${path}/${id}`)
  revalidatePath('/admin/dashboard')
}

export async function createResource(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const db = await adminDbOrLogin('/admin/resources/new')
  if (!db) return unauthorized()

  const title = value(formData, 'title')
  const category = value(formData, 'category')
  const description = value(formData, 'description')
  const content = value(formData, 'content')
  const sourceUrl = optionalValue(formData, 'source_url')

  if (!title || !category || !description || !content) {
    return { error: 'Title, category, description, and content are required.' }
  }
  if (sourceUrl && !isValidUrl(sourceUrl)) {
    return { error: 'Source URL must be a valid HTTP or HTTPS URL.' }
  }

  const isPublished = formData.get('is_published') === 'on'
  const { error } = await db.from('resources').insert({
    title,
    category,
    description,
    content,
    author_name: optionalValue(formData, 'author_name'),
    source_name: optionalValue(formData, 'source_name'),
    source_url: sourceUrl,
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
  })

  if (error) return { error: 'The resource could not be created. Please try again.' }

  revalidateContent('/resources')
  redirect('/admin/resources?message=created')
}

export async function updateResource(
  id: string,
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const db = await adminDbOrLogin('/admin/resources')
  if (!db) return unauthorized()

  const title = value(formData, 'title')
  const category = value(formData, 'category')
  const description = value(formData, 'description')
  const content = value(formData, 'content')
  const sourceUrl = optionalValue(formData, 'source_url')
  if (!title || !category || !description || !content) {
    return { error: 'Title, category, description, and content are required.' }
  }
  if (sourceUrl && !isValidUrl(sourceUrl)) {
    return { error: 'Source URL must be a valid HTTP or HTTPS URL.' }
  }

  const { data: existing, error: readError } = await db
    .from('resources')
    .select('published_at')
    .eq('id', id)
    .maybeSingle()
  if (readError || !existing) return { error: 'Resource not found.' }

  const isPublished = formData.get('is_published') === 'on'
  const { error } = await db
    .from('resources')
    .update({
      title,
      category,
      description,
      content,
      author_name: optionalValue(formData, 'author_name'),
      source_name: optionalValue(formData, 'source_name'),
      source_url: sourceUrl,
      is_published: isPublished,
      published_at: isPublished ? existing.published_at ?? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) return { error: 'The resource could not be updated. Please try again.' }

  revalidateContent('/resources', id)
  redirect('/admin/resources?message=updated')
}

export async function toggleResourcePublication(id: string) {
  const db = await adminDbOrRedirect('/admin/resources')

  const { data: existing, error: readError } = await db
    .from('resources')
    .select('is_published, published_at')
    .eq('id', id)
    .maybeSingle()
  if (readError || !existing) redirect('/admin/resources?error=not_found')

  const isPublished = !existing.is_published
  const { error } = await db
    .from('resources')
    .update({
      is_published: isPublished,
      published_at: isPublished ? existing.published_at ?? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) redirect('/admin/resources?error=update_failed')

  revalidateContent('/resources', id)
  redirect(`/admin/resources?message=${isPublished ? 'published' : 'unpublished'}`)
}

export async function deleteResource(id: string) {
  const db = await adminDbOrRedirect('/admin/resources')
  const { error } = await db.from('resources').delete().eq('id', id)
  if (error) redirect('/admin/resources?error=delete_failed')
  revalidateContent('/resources', id)
  redirect('/admin/resources?message=deleted')
}

export async function createOpportunity(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const db = await adminDbOrLogin('/admin/opportunities/new')
  if (!db) return unauthorized()

  const title = value(formData, 'title')
  const description = value(formData, 'description')
  const opportunityType = value(formData, 'opportunity_type')
  const deadline = optionalValue(formData, 'deadline')
  if (!title || !description || !opportunityType) {
    return { error: 'Title, description, and opportunity type are required.' }
  }
  if (deadline && !isValidDate(deadline)) return { error: 'Deadline must be a valid date.' }

  const isPublished = formData.get('is_published') === 'on'
  const { error } = await db.from('opportunities').insert({
    title,
    description,
    opportunity_type: opportunityType,
    organization_name: optionalValue(formData, 'organization_name'),
    location: optionalValue(formData, 'location'),
    deadline,
    status: OPPORTUNITY_STATUSES.has(value(formData, 'status')) ? value(formData, 'status') : 'open',
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
  })
  if (error) return { error: 'The opportunity could not be created. Please try again.' }

  revalidateContent('/opportunities')
  redirect('/admin/opportunities?message=created')
}

export async function updateOpportunity(
  id: string,
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const db = await adminDbOrLogin('/admin/opportunities')
  if (!db) return unauthorized()

  const title = value(formData, 'title')
  const description = value(formData, 'description')
  const opportunityType = value(formData, 'opportunity_type')
  const deadline = optionalValue(formData, 'deadline')
  const status = value(formData, 'status')
  if (!title || !description || !opportunityType) {
    return { error: 'Title, description, and opportunity type are required.' }
  }
  if (deadline && !isValidDate(deadline)) return { error: 'Deadline must be a valid date.' }
  if (!OPPORTUNITY_STATUSES.has(status)) return { error: 'Choose a valid opportunity status.' }

  const { data: existing, error: readError } = await db
    .from('opportunities')
    .select('published_at')
    .eq('id', id)
    .maybeSingle()
  if (readError || !existing) return { error: 'Opportunity not found.' }

  const isPublished = formData.get('is_published') === 'on'
  const { error } = await db
    .from('opportunities')
    .update({
      title,
      description,
      opportunity_type: opportunityType,
      organization_name: optionalValue(formData, 'organization_name'),
      location: optionalValue(formData, 'location'),
      deadline,
      status,
      is_published: isPublished,
      published_at: isPublished ? existing.published_at ?? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) return { error: 'The opportunity could not be updated. Please try again.' }

  revalidateContent('/opportunities', id)
  redirect('/admin/opportunities?message=updated')
}

export async function toggleOpportunityPublication(id: string) {
  const db = await adminDbOrRedirect('/admin/opportunities')
  const { data: existing, error: readError } = await db
    .from('opportunities')
    .select('is_published, published_at')
    .eq('id', id)
    .maybeSingle()
  if (readError || !existing) redirect('/admin/opportunities?error=not_found')

  const isPublished = !existing.is_published
  const { error } = await db
    .from('opportunities')
    .update({
      is_published: isPublished,
      published_at: isPublished ? existing.published_at ?? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) redirect('/admin/opportunities?error=update_failed')

  revalidateContent('/opportunities', id)
  redirect(`/admin/opportunities?message=${isPublished ? 'published' : 'unpublished'}`)
}

export async function deleteOpportunity(id: string) {
  const db = await adminDbOrRedirect('/admin/opportunities')
  const { error } = await db.from('opportunities').delete().eq('id', id)
  if (error) redirect('/admin/opportunities?error=delete_failed')
  revalidateContent('/opportunities', id)
  redirect('/admin/opportunities?message=deleted')
}

export async function createProject(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const db = await adminDbOrLogin('/admin/projects/new')
  if (!db) return unauthorized()

  const title = value(formData, 'title')
  const description = value(formData, 'description')
  const projectType = value(formData, 'project_type')
  const startDate = optionalValue(formData, 'start_date')
  const endDate = optionalValue(formData, 'end_date')
  const engineerProfileId = optionalValue(formData, 'engineer_profile_id')
  if (!title || !description || !projectType) {
    return { error: 'Title, description, and project type are required.' }
  }
  if (startDate && !isValidDate(startDate)) return { error: 'Start date must be a valid date.' }
  if (endDate && !isValidDate(endDate)) return { error: 'End date must be a valid date.' }
  if (startDate && endDate && endDate < startDate) return { error: 'End date cannot be before start date.' }
  if (engineerProfileId && !isUuid(engineerProfileId)) return { error: 'Choose a valid engineer profile.' }

  const isPublished = formData.get('is_published') === 'on'
  const status = value(formData, 'status')
  const { error } = await db.from('projects').insert({
    title,
    description,
    project_type: projectType,
    location: optionalValue(formData, 'location'),
    client_name: optionalValue(formData, 'client_name'),
    engineer_profile_id: engineerProfileId,
    status: PROJECT_STATUSES.has(status) ? status : 'planned',
    start_date: startDate,
    end_date: endDate,
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
  })
  if (error) return { error: 'The project could not be created. Please try again.' }

  revalidateContent('/projects')
  redirect('/admin/projects?message=created')
}

export async function updateProject(
  id: string,
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const db = await adminDbOrLogin('/admin/projects')
  if (!db) return unauthorized()

  const title = value(formData, 'title')
  const description = value(formData, 'description')
  const projectType = value(formData, 'project_type')
  const startDate = optionalValue(formData, 'start_date')
  const endDate = optionalValue(formData, 'end_date')
  const engineerProfileId = optionalValue(formData, 'engineer_profile_id')
  const status = value(formData, 'status')
  if (!title || !description || !projectType) {
    return { error: 'Title, description, and project type are required.' }
  }
  if (!PROJECT_STATUSES.has(status)) return { error: 'Choose a valid project status.' }
  if (startDate && !isValidDate(startDate)) return { error: 'Start date must be a valid date.' }
  if (endDate && !isValidDate(endDate)) return { error: 'End date must be a valid date.' }
  if (startDate && endDate && endDate < startDate) return { error: 'End date cannot be before start date.' }
  if (engineerProfileId && !isUuid(engineerProfileId)) return { error: 'Choose a valid engineer profile.' }

  const { data: existing, error: readError } = await db
    .from('projects')
    .select('published_at')
    .eq('id', id)
    .maybeSingle()
  if (readError || !existing) return { error: 'Project not found.' }

  const isPublished = formData.get('is_published') === 'on'
  const { error } = await db
    .from('projects')
    .update({
      title,
      description,
      project_type: projectType,
      location: optionalValue(formData, 'location'),
      client_name: optionalValue(formData, 'client_name'),
      engineer_profile_id: engineerProfileId,
      status,
      start_date: startDate,
      end_date: endDate,
      is_published: isPublished,
      published_at: isPublished ? existing.published_at ?? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) return { error: 'The project could not be updated. Please try again.' }

  revalidateContent('/projects', id)
  redirect('/admin/projects?message=updated')
}

export async function toggleProjectPublication(id: string) {
  const db = await adminDbOrRedirect('/admin/projects')
  const { data: existing, error: readError } = await db
    .from('projects')
    .select('is_published, published_at')
    .eq('id', id)
    .maybeSingle()
  if (readError || !existing) redirect('/admin/projects?error=not_found')

  const isPublished = !existing.is_published
  const { error } = await db
    .from('projects')
    .update({
      is_published: isPublished,
      published_at: isPublished ? existing.published_at ?? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) redirect('/admin/projects?error=update_failed')

  revalidateContent('/projects', id)
  redirect(`/admin/projects?message=${isPublished ? 'published' : 'unpublished'}`)
}

export async function deleteProject(id: string) {
  const db = await adminDbOrRedirect('/admin/projects')
  const { error } = await db.from('projects').delete().eq('id', id)
  if (error) redirect('/admin/projects?error=delete_failed')
  revalidateContent('/projects', id)
  redirect('/admin/projects?message=deleted')
}
