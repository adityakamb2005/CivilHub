import { ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard',
}

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-20 h-20 bg-[var(--color-ch-red-light)] rounded-2xl border border-[var(--color-ch-red)]/20 flex items-center justify-center mb-6">
        <ShieldAlert size={36} className="text-[var(--color-ch-red)]" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-3">
        Admin Dashboard
      </h1>
      <p className="text-[var(--color-ch-text-secondary)] max-w-md">
        Welcome to the platform administration area. Phase 7 (Admin System) will be built here for managing users, verifying engineers, and moderating content.
      </p>
    </div>
  )
}
