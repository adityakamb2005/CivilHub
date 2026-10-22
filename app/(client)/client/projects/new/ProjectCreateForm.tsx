'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  FolderPlus,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Globe,
  Lock,
} from 'lucide-react'

interface ProjectCreateFormProps {
  clientProfileId: string
  clientName: string | null
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

export function ProjectCreateForm({ clientProfileId, clientName }: ProjectCreateFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [projectType, setProjectType] = useState('')
  const [customType, setCustomType] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<'planned' | 'in_progress' | 'completed' | 'on_hold'>('planned')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const submitting = useRef(false)
  const submissionId = useRef<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current || success) return
    setError(null)

    // Validation
    const finalType = projectType === 'Other' ? customType.trim() : projectType.trim()
    if (!title.trim()) {
      setError('Project title is required.')
      return
    }
    if (!finalType) {
      setError('Project type is required.')
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

    submitting.current = true
    setSaving(true)

    try {
      submissionId.current ??= crypto.randomUUID()
      const now = new Date().toISOString()
      const { data, error: insertError } = await (supabase as any)
        .from('projects')
        .insert({
          id: submissionId.current,
          title: title.trim(),
          description: description.trim(),
          project_type: finalType,
          location: location.trim() || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          client_profile_id: clientProfileId,
          client_name: clientName || null,
          is_published: isPublished,
          published_at: isPublished ? now : null,
        })
        .select('id')
        .single()

      if (insertError) {
        // A lost response can leave a committed project. Reuse this form's ID
        // and verify ownership before reporting an earlier attempt as saved.
        if (insertError.code !== '23505') throw insertError
        const { data: saved, error: savedError } = await (supabase as any)
          .from('projects').select('id').eq('id', submissionId.current)
          .eq('client_profile_id', clientProfileId).maybeSingle()
        if (savedError || !saved) throw insertError
      } else if (!data?.id) {
        throw new Error('The project could not be confirmed. Please try again.')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/client/projects')
        router.refresh()
      }, 1200)
    } catch {
      submitting.current = false
      setError('Failed to create project. Please try again.')
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
            <p className="font-semibold">Creation failed</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-3 animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <p className="font-semibold">Project created successfully! Redirecting to My Projects...</p>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="ch-card p-6 md:p-8 space-y-6">
        <div className="border-b border-[var(--color-ch-border)] pb-4 mb-6">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-[var(--color-ch-orange)]" />
            Project Details
          </h2>
          <p className="text-xs text-[var(--color-ch-text-secondary)] mt-1">
            Provide the information needed for engineers and prospective partners to understand your project requirements.
          </p>
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
              placeholder="e.g. Metro Line Extension Phase 2 / Coastal Protection Structure"
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

          {/* Custom Project Type if Other */}
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
                placeholder="e.g. Tunnel Engineering, Dam Rehabilitation"
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
              placeholder="e.g. Chicago, IL / Onsite (City, State)"
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
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scope, objectives, technical requirements, and key deliverables of this civil engineering project..."
              className="ch-input mt-1.5 resize-y"
            />
          </div>
        </div>

        {/* Visibility Card */}
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
                    <Globe className="w-4 h-4 text-emerald-600" /> Publish immediately to CivilHub Directory
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" /> Save as Private Draft
                  </>
                )}
              </span>
              <span className="block text-xs text-[var(--color-ch-text-secondary)] mt-1">
                {isPublished
                  ? 'This project will be visible to civil engineers and visitors in the public CivilHub project directory.'
                  : 'Only you can view and edit this project in your Client Workspace. You can publish it anytime later.'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href="/client/projects"
          className="ch-btn ch-btn-outline inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || success}
          className="ch-btn ch-btn-primary min-w-[160px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating...
            </>
          ) : (
            'Create Project'
          )}
        </button>
      </div>
    </form>
  )
}
