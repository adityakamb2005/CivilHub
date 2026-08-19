import { HardHat } from 'lucide-react'

export const metadata = {
  title: 'Engineer Dashboard',
}

export default function EngineerDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-20 h-20 bg-[var(--color-ch-orange-light)] rounded-2xl border border-[var(--color-ch-orange)]/20 flex items-center justify-center mb-6">
        <HardHat size={36} className="text-[var(--color-ch-orange)]" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-3">
        Engineer Dashboard
      </h1>
      <p className="text-[var(--color-ch-text-secondary)] max-w-md">
        Welcome to your CivilHub workspace. Phase 2 (Engineer Profiles & Portfolios) and Phase 5 (Project Management) will be built here soon.
      </p>
    </div>
  )
}
