import { CheckCircle2, Eye, MessageSquare, TrendingUp, FileText } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Eye,
    title: 'Discover',
    description: 'Browse verified civil engineers. Filter by specialization, location, experience, and ratings.',
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'Connect',
    description: 'Send an enquiry directly to the engineer. Review their portfolio and previous projects.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Build',
    description: 'Once hired, your engineer creates and manages a structured project workspace for your build.',
  },
  {
    number: '04',
    icon: FileText,
    title: 'Manage',
    description: 'Track stages, view site photos and updates, access documents, and communicate — all in one place.',
  },
  {
    number: '05',
    icon: CheckCircle2,
    title: 'Grow',
    description: 'Complete your project, leave a review, and help build a stronger civil engineering community.',
  },
]

export function HowItWorks() {
  return (
    <section className="ch-section bg-[var(--color-ch-surface)]" aria-labelledby="how-it-works-heading">
      <div className="ch-container">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="ch-section-label mb-4 block">How It Works</span>
          <h2
            id="how-it-works-heading"
            className="ch-text-section-heading text-[var(--color-ch-navy)] mb-4"
          >
            From Discovery to Completion
          </h2>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl mx-auto leading-relaxed">
            CivilHub guides you through the entire construction journey — from finding the right engineer to completing your project.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-[var(--color-ch-border)]"
            aria-hidden="true"
          />

          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Step circle */}
                <div
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-5 border-2 ${
                    index === 0
                      ? 'bg-[var(--color-ch-navy)] border-[var(--color-ch-navy)]'
                      : index === 4
                        ? 'bg-[var(--color-ch-orange)] border-[var(--color-ch-orange)]'
                        : 'bg-white border-[var(--color-ch-border)]'
                  }`}
                >
                  <Icon
                    size={22}
                    className={
                      index === 0 || index === 4
                        ? 'text-white'
                        : 'text-[var(--color-ch-text-secondary)]'
                    }
                  />
                  {/* Step number */}
                  <span
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      index === 0
                        ? 'bg-[var(--color-ch-orange)] text-white'
                        : 'bg-[var(--color-ch-border)] text-[var(--color-ch-text-muted)]'
                    }`}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
