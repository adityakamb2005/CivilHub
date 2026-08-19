import { Users, FolderKanban, Wrench, BookOpen, Briefcase } from 'lucide-react'

const PILLARS = [
  {
    icon: Users,
    title: 'Engineers',
    description:
      'Discover and connect with verified civil engineers. Search by specialization, location, and experience.',
    color: 'text-[var(--color-ch-navy)]',
    bg: 'bg-[var(--color-ch-surface)]',
  },
  {
    icon: FolderKanban,
    title: 'Projects',
    description:
      'Manage construction projects end-to-end — stages, progress, updates, materials, expenses, and documents.',
    color: 'text-[var(--color-ch-orange)]',
    bg: 'bg-[var(--color-ch-orange-light)]',
  },
  {
    icon: Wrench,
    title: 'Tools',
    description:
      'Purpose-built calculators for concrete, steel, brick, cost estimation, unit conversion, and more.',
    color: 'text-[var(--color-ch-navy)]',
    bg: 'bg-[var(--color-ch-surface)]',
  },
  {
    icon: BookOpen,
    title: 'Resources',
    description:
      'Articles, engineering formulas, tutorials, career resources, and construction knowledge — all in one place.',
    color: 'text-[var(--color-ch-navy)]',
    bg: 'bg-[var(--color-ch-surface)]',
  },
  {
    icon: Briefcase,
    title: 'Opportunities',
    description:
      'Browse civil engineering job listings, project tenders, and career opportunities across the industry.',
    color: 'text-[var(--color-ch-navy)]',
    bg: 'bg-[var(--color-ch-surface)]',
  },
]

export function PlatformOverview() {
  return (
    <section className="ch-section bg-white" aria-labelledby="platform-heading">
      <div className="ch-container">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="ch-section-label mb-4 block">The Platform</span>
          <h2
            id="platform-heading"
            className="ch-text-section-heading text-[var(--color-ch-navy)] mb-4"
          >
            Everything Civil Engineering, In One Place
          </h2>
          <p className="text-[var(--color-ch-text-secondary)] max-w-2xl mx-auto leading-relaxed">
            CivilHub brings together the people, tools, and knowledge that drive the construction industry forward.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="ch-card p-6 hover:shadow-[0_4px_16px_0_rgb(15_28_46/0.10)] transition-shadow duration-200 group"
              >
                <div
                  className={`w-11 h-11 rounded-lg ${pillar.bg} border border-[var(--color-ch-border)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon size={20} className={pillar.color} />
                </div>
                <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
