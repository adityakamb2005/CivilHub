import { User } from 'lucide-react'

export function ClientDashboardHeader({ name }: { name: string | null }) {
  const displayName = name || 'Client'

  return (
    <div className="mb-8">
      <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-2 flex items-center gap-3">
        <span className="w-10 h-10 bg-[var(--color-ch-orange-light)] rounded-lg flex items-center justify-center">
          <User size={20} className="text-[var(--color-ch-orange)]" />
        </span>
        Welcome back, {displayName}
      </h1>
      <p className="text-[var(--color-ch-text-secondary)] text-lg">
        Manage your projects and engineering needs on CivilHub.
      </p>
    </div>
  )
}
