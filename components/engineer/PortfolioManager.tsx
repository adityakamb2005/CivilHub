'use client'

import { useState, useTransition } from 'react'
import { Plus, Edit2, Trash2, ExternalLink, Calendar, Loader2, FolderKanban, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { createPortfolioItem, updatePortfolioItem, deletePortfolioItem, type PortfolioActionState } from '@/lib/engineer/portfolioActions'
import type { EngineerPortfolio } from '@/types'

export function PortfolioManager({
  portfolioItems,
}: {
  portfolioItems: EngineerPortfolio[]
}) {
  const [editingItem, setEditingItem] = useState<EngineerPortfolio | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [state, setState] = useState<PortfolioActionState>({})
  const [isPending, startTransition] = useTransition()

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState({})
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createPortfolioItem({}, formData)
      setState(res)
      if (res.success) {
        setIsCreating(false)
      }
    })
  }

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingItem) return
    setState({})
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updatePortfolioItem(editingItem.id, {}, formData)
      setState(res)
      if (res.success) {
        setEditingItem(null)
      }
    })
  }

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete portfolio project "${title}"?`)) {
      startTransition(async () => {
        await deletePortfolioItem(id)
      })
    }
  }

  return (
    <div id="portfolio" className="ch-card p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-ch-border)] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
            <FolderKanban size={20} className="text-[var(--color-ch-orange)]" />
            Engineering Portfolio Projects
          </h2>
          <p className="text-xs text-[var(--color-ch-text-secondary)] mt-1">
            Showcase your key civil engineering projects, structural designs, and site accomplishments.
          </p>
        </div>

        {!isCreating && !editingItem && (
          <button
            type="button"
            onClick={() => {
              setIsCreating(true)
              setState({})
            }}
            className="ch-btn ch-btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 font-medium"
          >
            <Plus size={15} /> Add Portfolio Project
          </button>
        )}
      </div>

      {state.error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-xs text-[var(--color-ch-red)] flex items-start gap-2"
        >
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2"
        >
          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
          <span>{state.success}</span>
        </div>
      )}

      {/* Form: Create or Edit */}
      {(isCreating || editingItem) && (
        <form
          onSubmit={isCreating ? handleCreateSubmit : handleUpdateSubmit}
          className="p-5 rounded-xl border border-[var(--color-ch-orange)]/40 bg-[var(--color-ch-surface)] space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-ch-border-subtle)] pb-3">
            <h3 className="font-bold text-sm text-[var(--color-ch-navy)]">
              {isCreating ? 'New Portfolio Project' : `Edit "${editingItem?.title}"`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false)
                setEditingItem(null)
                setState({})
              }}
              className="text-[var(--color-ch-text-muted)] hover:text-[var(--color-ch-navy)]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="title" className="ch-text-label">
                Project Title <span className="text-[var(--color-ch-red)]">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={editingItem?.title || ''}
                placeholder="e.g. Metro Bridge Structural Reinforcement & Inspection"
                className="ch-input mt-1 text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="short_description" className="ch-text-label">
                Short Description / Overview <span className="text-[var(--color-ch-red)]">*</span>
              </label>
              <input
                id="short_description"
                name="short_description"
                type="text"
                required
                defaultValue={editingItem?.short_description || ''}
                placeholder="Summary of engineering scope, challenges resolved, and client deliverables..."
                className="ch-input mt-1 text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="detailed_description" className="ch-text-label">
                Detailed Scope & Methodology (Optional)
              </label>
              <textarea
                id="detailed_description"
                name="detailed_description"
                rows={4}
                defaultValue={editingItem?.detailed_description || ''}
                placeholder="Elaborate on calculation codes used (e.g. IS 456, Eurocodes), software tools, site supervision, and soil reports..."
                className="ch-input mt-1 text-xs resize-y"
              />
            </div>

            <div>
              <label htmlFor="skills" className="ch-text-label">
                Skills & Technologies Used
              </label>
              <input
                id="skills"
                name="skills"
                type="text"
                defaultValue={editingItem?.skills?.join(', ') || ''}
                placeholder="e.g. STAAD Pro, Foundation Design, Concrete Testing"
                className="ch-input mt-1 text-xs"
              />
              <span className="text-[10px] text-[var(--color-ch-text-muted)] mt-0.5 block">
                Comma-separated list of skills
              </span>
            </div>

            <div>
              <label htmlFor="project_date" className="ch-text-label">
                Completion / Project Date
              </label>
              <input
                id="project_date"
                name="project_date"
                type="date"
                defaultValue={editingItem?.project_date || ''}
                className="ch-input mt-1 text-xs"
              />
            </div>

            <div>
              <label htmlFor="project_url" className="ch-text-label">
                Project Link / Document URL (Optional)
              </label>
              <input
                id="project_url"
                name="project_url"
                type="url"
                defaultValue={editingItem?.project_url || ''}
                placeholder="https://..."
                className="ch-input mt-1 text-xs"
              />
            </div>

            <div>
              <label htmlFor="image_url" className="ch-text-label">
                Thumbnail / Photo URL (Optional)
              </label>
              <input
                id="image_url"
                name="image_url"
                type="url"
                defaultValue={editingItem?.image_url || ''}
                placeholder="https://..."
                className="ch-input mt-1 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false)
                setEditingItem(null)
              }}
              className="ch-btn ch-btn-ghost text-xs px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="ch-btn ch-btn-primary text-xs px-4 py-1.5 inline-flex items-center gap-1.5 font-medium"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              {isCreating ? 'Save Project Entry' : 'Update Project Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Portfolio List */}
      {portfolioItems.length === 0 && !isCreating && (
        <div className="p-8 text-center border-2 border-dashed border-[var(--color-ch-border)] rounded-xl space-y-2">
          <FolderKanban size={32} className="mx-auto text-[var(--color-ch-text-muted)]" />
          <h3 className="font-bold text-sm text-[var(--color-ch-navy)]">No portfolio entries added yet</h3>
          <p className="text-xs text-[var(--color-ch-text-secondary)] max-w-sm mx-auto">
            Adding key projects and structural designs builds client trust and boosts your public profile completion.
          </p>
        </div>
      )}

      {portfolioItems.length > 0 && (
        <div className="space-y-4">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-[var(--color-ch-border)] hover:border-[var(--color-ch-orange)]/40 transition-all space-y-3 bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-[var(--color-ch-navy)]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--color-ch-text-secondary)] font-medium">
                    {item.short_description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item)
                      setIsCreating(false)
                      setState({})
                    }}
                    className="ch-btn ch-btn-outline text-xs px-2.5 py-1 inline-flex items-center gap-1 text-[var(--color-ch-navy)]"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(item.id, item.title)}
                    className="ch-btn ch-btn-ghost text-xs px-2 py-1 text-[var(--color-ch-red)] hover:bg-[var(--color-ch-red-light)]"
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {item.detailed_description && (
                <p className="text-xs text-[var(--color-ch-text-secondary)] whitespace-pre-line bg-[var(--color-ch-surface)] p-3 rounded-lg border border-[var(--color-ch-border-subtle)] leading-relaxed">
                  {item.detailed_description}
                </p>
              )}

              {/* Skills badges & meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-[var(--color-ch-border-subtle)]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.skills && item.skills.map((sk) => (
                    <span key={sk} className="ch-badge bg-slate-100 text-slate-700 text-[11px]">
                      {sk}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--color-ch-text-muted)] ml-auto">
                  {item.project_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} /> {new Date(item.project_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                    </span>
                  )}
                  {item.project_url && (
                    <a
                      href={item.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-ch-orange)] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Project Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
