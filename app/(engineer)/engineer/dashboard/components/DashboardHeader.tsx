import { HardHat } from 'lucide-react'

export function DashboardHeader({ name }: { name: string | null }) {
  const displayName = name || 'Engineer'
  
  return (
    <div className="mb-8">
      <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-2 flex items-center gap-3">
        <span className="w-10 h-10 bg-[var(--color-ch-orange-light)] rounded-lg flex items-center justify-center">
          <HardHat size={20} className="text-[var(--color-ch-orange)]" />
        </span>
        Welcome back, {displayName}
      </h1>
      <p className="text-[var(--color-ch-text-secondary)] text-lg">
        Manage your professional presence on CivilHub.
      </p>
    </div>
  )
}
