import Image from 'next/image'
import { BarChart3, Camera, FileText, TrendingUp } from 'lucide-react'

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Live Stage Progress',
    description: 'See exactly which construction stages are complete, in progress, or upcoming.',
  },
  {
    icon: Camera,
    title: 'Site Photos',
    description: 'Engineers publish photo updates directly from the construction site.',
  },
  {
    icon: FileText,
    title: 'Shared Documents',
    description: 'Access drawings, reports, bills, and agreements — as permitted by your engineer.',
  },
  {
    icon: BarChart3,
    title: 'Materials & Expenses',
    description: 'Understand what has been spent and what materials have been used on your project.',
  },
]

export function ProjectTransparency() {
  return (
    <section className="ch-section bg-[var(--color-ch-navy)] text-white" aria-labelledby="transparency-heading">
      <div className="ch-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <span className="ch-section-label mb-4 block text-[var(--color-ch-orange)]">
              Project Transparency
            </span>
            <h2
              id="transparency-heading"
              className="ch-text-section-heading text-white mb-5"
            >
              Always Know What's Happening on Your Build
            </h2>
            <p className="text-white/70 leading-relaxed mb-10">
              No more chasing updates. With CivilHub, you have a dedicated project workspace where you can see exactly what stage your construction is at, view fresh site photos, and access key documents — all with your engineer&apos;s permission.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} className="text-[var(--color-ch-orange)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right — mock project UI */}
          <div className="relative">
            <div className="ch-card bg-white rounded-xl overflow-hidden shadow-2xl">
              {/* Project header */}
              <div className="p-5 border-b border-[var(--color-ch-border)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[var(--color-ch-navy)]">
                    Greenleaf Residence
                  </h3>
                  <span className="ch-badge ch-badge-orange">In Progress</span>
                </div>
                <p className="text-xs text-[var(--color-ch-text-muted)]">
                  Overall Progress
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-2 rounded-full bg-[var(--color-ch-surface)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-ch-orange)] rounded-full transition-all"
                    style={{ width: '68%' }}
                    role="progressbar"
                    aria-valuenow={68}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <p className="text-right text-xs font-semibold text-[var(--color-ch-navy)] mt-1">
                  68%
                </p>
              </div>

              {/* Stages */}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ch-text-muted)] mb-3">
                  Construction Stages
                </p>
                {[
                  { stage: 'Planning', pct: 100, done: true },
                  { stage: 'Foundation', pct: 100, done: true },
                  { stage: 'Structure', pct: 75, done: false },
                  { stage: 'Brickwork', pct: 20, done: false },
                  { stage: 'Electrical', pct: 0, done: false },
                  { stage: 'Plumbing', pct: 0, done: false },
                ].map(({ stage, pct, done }) => (
                  <div key={stage} className="flex items-center gap-3 mb-2.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        done ? 'bg-[var(--color-ch-green)]' : pct > 0 ? 'bg-[var(--color-ch-orange)]' : 'bg-[var(--color-ch-border)]'
                      }`}
                    >
                      {done && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-[var(--color-ch-text-primary)] w-20 shrink-0">
                      {stage}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-ch-surface)] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${done ? 'bg-[var(--color-ch-green)]' : pct > 0 ? 'bg-[var(--color-ch-orange)]' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[var(--color-ch-text-muted)] w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Latest site photo */}
              <div className="relative h-32 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=60"
                  alt="Latest site update photo"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <p className="absolute bottom-3 left-4 text-xs font-medium text-white">
                  Latest update: 2 days ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
