'use client'

import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

type AdminServerAction = (id: string) => Promise<unknown>

export function AdminRowActions({
  id,
  editHref,
  isPublished,
  toggleAction,
  deleteAction,
}: {
  id: string
  editHref: string
  isPublished: boolean
  toggleAction: AdminServerAction
  deleteAction: AdminServerAction
}) {
  const handleToggle = async (_formData: FormData) => {
    await toggleAction(id)
  }
  const handleDelete = async (_formData: FormData) => {
    await deleteAction(id)
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href={editHref} className="ch-btn ch-btn-outline text-xs px-3 py-2">
        <Pencil size={14} />
        Edit
      </Link>
      <form action={handleToggle}>
        <button type="submit" className="ch-btn ch-btn-ghost text-xs px-3 py-2" title={isPublished ? 'Unpublish' : 'Publish'}>
          {isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
          {isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </form>
      <form
        action={handleDelete}
        onSubmit={(event) => {
          if (!window.confirm('Delete this item permanently? This cannot be undone.')) {
            event.preventDefault()
          }
        }}
      >
        <button type="submit" className="ch-btn text-xs px-3 py-2 text-[var(--color-ch-red)] hover:bg-[var(--color-ch-red-light)]" title="Delete">
          <Trash2 size={14} />
          Delete
        </button>
      </form>
    </div>
  )
}
