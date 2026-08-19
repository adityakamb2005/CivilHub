import { BadgeCheck, FolderKanban, Camera } from 'lucide-react'

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: 'Verified Professionals',
    description:
      'Engineers on CivilHub can be verified by the platform team. Verification status is clearly displayed on every profile.',
    detail:
      'We review qualifications, experience, and professional credentials to help you make confident hiring decisions.',
  },
  {
    icon: FolderKanban,
    title: 'Real Project Portfolios',
    description:
      'Every engineer\'s profile showcases their completed work — with photos, project details, and client reviews.',
    detail:
      'Portfolio projects are managed by engineers and visible to the public, giving you genuine insight into their capabilities.',
  },
  {
    icon: Camera,
    title: 'Transparent Project Updates',
    description:
      'Clients can follow their construction project in real time — stages, site photos, and progress updates from the field.',
    detail:
      'Engineers publish updates directly from site. You always know what\'s happening, without needing to make a phone call.',
  },
]

export function TrustSection() {
  return (
    <section className="ch-section bg-white" aria-labelledby="trust-heading">
      <div className="ch-container">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="ch-section-label mb-4 block">Why CivilHub</span>
          <h2
            id="trust-heading"
            className="ch-text-section-heading text-[var(--color-ch-navy)] mb-4"
          >
            Built on Trust and Transparency
          </h2>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl mx-auto leading-relaxed">
            We believe construction relationships work best when both parties have complete clarity and confidence.
          </p>
        </div>

        {/* Trust cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="relative">
                {/* Vertical accent line */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full ${
                    index === 1 ? 'bg-[var(--color-ch-orange)]' : 'bg-[var(--color-ch-border)]'
                  }`}
                  aria-hidden="true"
                />

                <div className="pl-7">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] flex items-center justify-center mb-5">
                    <Icon
                      size={22}
                      className={
                        index === 1
                          ? 'text-[var(--color-ch-orange)]'
                          : 'text-[var(--color-ch-navy)]'
                      }
                    />
                  </div>

                  <h3 className="font-semibold text-[var(--color-ch-navy)] text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[var(--color-ch-text-secondary)] leading-relaxed mb-3">
                    {item.description}
                  </p>
                  <p className="text-sm text-[var(--color-ch-text-muted)] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
