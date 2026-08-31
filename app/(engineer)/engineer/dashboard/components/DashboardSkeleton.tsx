import { HardHat } from 'lucide-react'

export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-10 w-64 bg-[var(--color-ch-border)] rounded-md mb-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-ch-border-subtle)] rounded-lg shrink-0"></div>
          <div className="h-8 w-48 bg-[var(--color-ch-border-subtle)] rounded"></div>
        </div>
        <div className="h-5 w-80 bg-[var(--color-ch-border)] rounded"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="ch-card p-6 h-48">
            <div className="h-6 w-40 bg-[var(--color-ch-border)] rounded mb-2"></div>
            <div className="h-4 w-64 bg-[var(--color-ch-border-subtle)] rounded mb-6"></div>
            <div className="w-full bg-[var(--color-ch-border-subtle)] h-3 rounded-full mb-6"></div>
            <div className="h-10 w-full bg-[var(--color-ch-border)] rounded"></div>
          </div>
          
          <div className="ch-card p-6 h-64">
            <div className="h-6 w-32 bg-[var(--color-ch-border)] rounded mb-6"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-[var(--color-ch-border-subtle)] rounded"></div>
              <div className="h-24 bg-[var(--color-ch-border-subtle)] rounded"></div>
              <div className="h-24 bg-[var(--color-ch-border-subtle)] rounded"></div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="ch-card p-6 h-64 flex flex-col">
            <div className="h-6 w-32 bg-[var(--color-ch-border)] rounded mb-6"></div>
            <div className="space-y-4 flex-1">
              <div className="h-4 w-full bg-[var(--color-ch-border-subtle)] rounded"></div>
              <div className="h-4 w-full bg-[var(--color-ch-border-subtle)] rounded"></div>
              <div className="h-4 w-full bg-[var(--color-ch-border-subtle)] rounded"></div>
              <div className="h-4 w-full bg-[var(--color-ch-border-subtle)] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
