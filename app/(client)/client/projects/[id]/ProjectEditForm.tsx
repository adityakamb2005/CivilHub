'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Edit3,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Globe,
  Lock,
  Eye,
  Users,
} from 'lucide-react'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

interface ProjectEditFormProps {
  project: ProjectRow
}

const COMMON_PROJECT_TYPES = [
  'Commercial Construction',
  'Residential Development',
  'Infrastructure & Roads',
  'Bridge & Highway',
  'Structural Design',
  'Water & Environmental',
  'Geotechnical',
  'Urban Planning',
  'Industrial & Energy',
  'Other',
]

export function ProjectEditForm({ project }: ProjectEditFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Form State initialized with project values
  const isCustomType = !COMMON_PROJECT_TYPES.includes(project.project_type)
  const [title, setTitle] = useState(project.title)
  const [projectType, setProjectType] = useState(isCustomType ? 'Other' : project.project_type)
  const [customType, setCustomType] = useState(isCustomType ? project.project_type : '')
  const [location, setLocation] = useState(project.location || '')
  const [status, setStatus] = useState<ProjectRow['status']>(project.status)
  const [startDate, setStartDate] = useState(project.start_date || '')
  const [endDate, setEndDate] = useState(project.end_date || '')
  const [description, setDescription] = useState(project.description)
  const [isPublished, setIsPublished] = useState(project.is_published)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    const finalType = projectType === 'Other' ? customType.trim() : projectType.trim()
    if (!title.trim()) {
      setError('Project title is required.')
      return
    }
    if (!finalType) {
      setError('Project category is required.')
      return
    }
    if (!description.trim()) {
      setError('Project description is required.')
      return
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.')
      return
    }

    setSaving(true)

    try {
      const now = new Date().toISOString()
      const wasPublished = project.is_published

      // Calculate published_at timestamp
      let publishedAt = project.published_at
      if (isPublished && !wasPublished) {
        publishedAt = now
      } else if (!isPublished) {
        publishedAt = null
      }

      const { error: updateError } = await (supabase as any)
        .from('projects')
        .update({
          title: title.trim(),
          description: description.trim(),
          project_type: finalType,
          location: location.trim() || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          is_published: isPublished,
          published_at: publishedAt,
          updated_at: now,
        })
        .eq('id', project.id)
        .eq('client_profile_id', project.client_profile_id)
        .select('id')
        .single()

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      console.error('Error updating project:', err)
      setError(err.message || 'Failed to update project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)] flex items-start gap-3 animate-fade-in"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Update failed</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <p className="font-semibold">Project changes saved successfully!</p>
          </div>
          <Link
            href="/client/projects"
            className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
          >
            Back to projects list
          </Link>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="ch-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-ch-border)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[var(--color-ch-orange)]" />
              Edit Project Details
            </h2>
            <p className="text-xs text-[var(--color-ch-text-secondary)] mt-1">
              Update your project specification, location, timeline, and visibility.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href={`/client/projects/${project.id}/applications`}
              className="ch-btn ch-btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <Users className="w-3.5 h-3.5" /> Review Applicants
            </Link>
            {project.is_published && (
              <Link
                href={`/projects/${project.id}`}
                target="_blank"
                className="ch-btn ch-btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> View Public Page
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="ch-text-label">
              Project Title <span className="text-[var(--color-ch-red)]">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ch-input mt-1.5"
            />
          </div>

          {/* Project Type */}
          <div>
            <label htmlFor="project_type" className="ch-text-label">
              Project Category <span className="text-[var(--color-ch-red)]">*</span>
            </label>
            <select
              id="project_type"
              required
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="ch-input mt-1.5 bg-white"
            >
              <option value="">Select category...</option>
              {COMMON_PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Project Type */}
          {projectType === 'Other' && (
            <div>
              <label htmlFor="custom_type" className="ch-text-label">
                Specify Category <span className="text-[var(--color-ch-red)]">*</span>
              </label>
              <input
                id="custom_type"
                type="text"
                required
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="ch-input mt-1.5"
              />
            </div>
          )}

          {/* Location */}
          <div>
            <label htmlFor="location" className="ch-text-label">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="ch-input mt-1.5"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="ch-text-label">
              Project Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="ch-input mt-1.5 bg-white"
            >
              <option value="planned">Planned (Planning & Design phase)</option>
              <option value="in_progress">In Progress (Active execution)</option>
              <option value="on_hold">On Hold (Temporarily paused)</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="ch-text-label">
              Estimated Start Date
            </label>
            <input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ch-input mt-1.5"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="end_date" className="ch-text-label">
              Estimated Completion Date
            </label>
            <input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="ch-input mt-1.5"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="ch-text-label">
              Project Overview & Scope <span className="text-[var(--color-ch-red)]">*</span>
            </label>
            <textarea
              id="description"
              required
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ch-input mt-1.5 resize-y"
            />
          </div>
        </div>

        {/* Visibility Controls */}
        <div className="mt-8 p-5 rounded-xl border border-[var(--color-ch-border)] bg-[#f8fafc] space-y-3">
          <div className="flex items-start gap-3">
            <input
              id="is_published"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mt-1 h-4 w-4 rounded text-[var(--color-ch-orange)] focus:ring-[var(--color-ch-orange)] accent-[var(--color-ch-orange)] cursor-pointer"
            />
            <label htmlFor="is_published" className="cursor-pointer">
              <span className="flex items-center gap-2 font-semibold text-sm text-[var(--color-ch-navy)]">
                {isPublished ? (
                  <>
                    <Globe className="w-4 h-4 text-emerald-600" /> Published in Public CivilHub Directory
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" /> Private Draft Mode
                  </>
                )}
              </span>
              <span className="block text-xs text-[var(--color-ch-text-secondary)] mt-1">
                {isPublished
                  ? 'This project is live and discoverable in the public directory.'
                  : 'Only you can view and edit this project. Toggle on to publish.'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href="/client/projects"
          className="ch-btn ch-btn-outline inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to My Projects
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="ch-btn ch-btn-primary min-w-[160px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  )
}
