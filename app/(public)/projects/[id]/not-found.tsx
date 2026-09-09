import Link from 'next/link'
import { ArrowLeft, FolderKanban } from 'lucide-react'

export default function ProjectNotFound() {
  return (
    <div className="ch-section">
      <div className="ch-container max-w-2xl">
        <div className="ch-card p-10 sm:p-14 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] flex items-center justify-center mb-5">
            <FolderKanban size={32} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-2">
            Project not found
          </h1>
          <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md mb-6">
            This project may have been unpublished, removed, or the link may be incorrect.
          </p>
          <Link href="/projects" className="ch-btn ch-btn-primary">
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
        </div>
      </div>
    </div>
  )
}
