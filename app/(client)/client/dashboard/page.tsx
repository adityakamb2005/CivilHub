import { User } from 'lucide-react'

export const metadata = {
  title: 'Client Dashboard',
}

export default function ClientDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-20 h-20 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mb-6">
        <User size={36} className="text-[var(--color-ch-navy)]" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-3">
        Client Dashboard
      </h1>
      <p className="text-[var(--color-ch-text-secondary)] max-w-md">
        Welcome. Phase 4 (Client System) and Phase 5 (Project Tracking) will be built here, allowing you to hire engineers and monitor your construction projects.
      </p>
    </div>
  )
}
