'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createResource, updateResource, type AdminActionState } from '@/lib/admin/actions'
import type { Resource } from '@/types'
import { AdminSubmitButton } from './AdminSubmitButton'

const initialState: AdminActionState = {}

export function AdminResourceForm({ resource }: { resource?: Resource | null }) {
  const action = resource ? updateResource.bind(null, resource.id) : createResource
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div role="alert" className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]">
          {state.error}
        </div>
      )}

      <div className="ch-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="title" className="ch-text-label">Title <span className="text-[var(--color-ch-red)]">*</span></label>
            <input id="title" name="title" required defaultValue={resource?.title || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="category" className="ch-text-label">Category <span className="text-[var(--color-ch-red)]">*</span></label>
            <input id="category" name="category" required defaultValue={resource?.category || ''} className="ch-input mt-1.5" placeholder="Guides, formulas, careers…" />
          </div>
          <div>
            <label htmlFor="author_name" className="ch-text-label">Author name</label>
            <input id="author_name" name="author_name" defaultValue={resource?.author_name || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="source_name" className="ch-text-label">Source name</label>
            <input id="source_name" name="source_name" defaultValue={resource?.source_name || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="source_url" className="ch-text-label">Source URL</label>
            <input id="source_url" name="source_url" type="url" defaultValue={resource?.source_url || ''} className="ch-input mt-1.5" placeholder="https://…" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="ch-text-label">Description <span className="text-[var(--color-ch-red)]">*</span></label>
            <textarea id="description" name="description" required rows={4} defaultValue={resource?.description || ''} className="ch-input mt-1.5 resize-y" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="content" className="ch-text-label">Content <span className="text-[var(--color-ch-red)]">*</span></label>
            <textarea id="content" name="content" required rows={12} defaultValue={resource?.content || ''} className="ch-input mt-1.5 resize-y" />
          </div>
        </div>
        <label className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] cursor-pointer">
          <input type="checkbox" name="is_published" defaultChecked={resource?.is_published ?? false} className="mt-1 accent-[var(--color-ch-orange)]" />
          <span>
            <span className="block text-sm font-semibold text-[var(--color-ch-navy)]">Publish resource</span>
            <span className="block text-xs text-[var(--color-ch-text-secondary)] mt-1">Published resources are visible in the public Resources library.</span>
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/resources" className="ch-btn ch-btn-outline">Cancel</Link>
        <AdminSubmitButton label={resource ? 'Save changes' : 'Create resource'} />
      </div>
    </form>
  )
}
