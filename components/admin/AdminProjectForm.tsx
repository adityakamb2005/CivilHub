'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createProject, updateProject, type AdminActionState } from '@/lib/admin/actions'
import type { Project } from '@/types'
import { AdminSubmitButton } from './AdminSubmitButton'

type EngineerOption = { id: string; name: string }
const initialState: AdminActionState = {}

export function AdminProjectForm({ project, engineers }: { project?: Project | null; engineers: EngineerOption[] }) {
  const action = project ? updateProject.bind(null, project.id) : createProject
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <div role="alert" className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]">{state.error}</div>}
      <div className="ch-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="title" className="ch-text-label">Title <span className="text-[var(--color-ch-red)]">*</span></label>
            <input id="title" name="title" required defaultValue={project?.title || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="project_type" className="ch-text-label">Project type <span className="text-[var(--color-ch-red)]">*</span></label>
            <input id="project_type" name="project_type" required defaultValue={project?.project_type || ''} className="ch-input mt-1.5" placeholder="Bridge, building, road…" />
          </div>
          <div>
            <label htmlFor="status" className="ch-text-label">Status</label>
            <select id="status" name="status" defaultValue={project?.status || 'planned'} className="ch-input mt-1.5 bg-white">
              <option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="on_hold">On hold</option>
            </select>
          </div>
          <div>
            <label htmlFor="location" className="ch-text-label">Location</label>
            <input id="location" name="location" defaultValue={project?.location || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="client_name" className="ch-text-label">Client / organization</label>
            <input id="client_name" name="client_name" defaultValue={project?.client_name || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="engineer_profile_id" className="ch-text-label">Associated engineer</label>
            <select id="engineer_profile_id" name="engineer_profile_id" defaultValue={project?.engineer_profile_id || ''} className="ch-input mt-1.5 bg-white">
              <option value="">No engineer association</option>
              {engineers.map((engineer) => <option key={engineer.id} value={engineer.id}>{engineer.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="start_date" className="ch-text-label">Start date</label>
            <input id="start_date" name="start_date" type="date" defaultValue={project?.start_date || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="end_date" className="ch-text-label">End date</label>
            <input id="end_date" name="end_date" type="date" defaultValue={project?.end_date || ''} className="ch-input mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="ch-text-label">Description <span className="text-[var(--color-ch-red)]">*</span></label>
            <textarea id="description" name="description" required rows={10} defaultValue={project?.description || ''} className="ch-input mt-1.5 resize-y" />
          </div>
        </div>
        <label className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] cursor-pointer">
          <input type="checkbox" name="is_published" defaultChecked={project?.is_published ?? false} className="mt-1 accent-[var(--color-ch-orange)]" />
          <span><span className="block text-sm font-semibold text-[var(--color-ch-navy)]">Publish project</span><span className="block text-xs text-[var(--color-ch-text-secondary)] mt-1">Published projects are visible in the public project directory.</span></span>
        </label>
      </div>
      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/projects" className="ch-btn ch-btn-outline">Cancel</Link>
        <AdminSubmitButton label={project ? 'Save changes' : 'Create project'} />
      </div>
    </form>
  )
}
