import type { Metadata } from 'next'
import { AlertTriangle, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | CivilHub',
  description:
    'Read the CivilHub Terms of Service governing platform usage, engineer registrations, client project postings, and calculation tools.',
}

export default function TermsPage() {
  const lastUpdated = 'September 2026'

  return (
    <div className="py-12 space-y-10 max-w-4xl mx-auto ch-container">
      {/* Page Header */}
      <div className="space-y-3 text-center sm:text-left">
        <span className="ch-section-label inline-block">Legal & Governance</span>
        <h1 className="ch-text-page-heading text-[var(--color-ch-navy)]">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)]">
          Last updated: {lastUpdated} · CivilHub Platform Version MVP
        </p>
      </div>

      {/* Engineering Disclaimer Alert */}
      <div className="ch-card p-6 bg-[var(--color-ch-surface)] border-l-4 border-l-[var(--color-ch-navy)] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[var(--color-ch-navy)] text-base">
          <AlertTriangle size={20} className="text-[var(--color-ch-orange)]" />
          Engineering Tools & Calculator Disclaimer
        </div>
        <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed">
          The engineering calculators and analytical reference tools provided on CivilHub are designed for quick estimations, educational reference, and conceptual project planning. Final structural design, permit submissions, and construction execution must always be verified and stamped by a licensed professional civil engineer in your jurisdiction.
        </p>
      </div>

      {/* Terms Sections */}
      <div className="ch-card p-8 space-y-8 text-sm text-[var(--color-ch-text-secondary)] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using CivilHub (including public directory listings, calculation tools, resources, and account portals), you agree to be bound by these Terms of Service. If you do not agree to these terms, you should discontinue use of the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            2. Platform Roles & Account Responsibilities
          </h2>
          <p>
            CivilHub provides account capabilities tailored for Civil Engineers, Clients, and Administrators:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Engineer Accounts:</strong> Engineers represent that profile information, professional experience, licenses, and portfolio submissions are accurate.
            </li>
            <li>
              <strong>Client Accounts:</strong> Clients posting project descriptions or opportunity listings warrant that project requirements comply with applicable regulations.
            </li>
            <li>
              <strong>Account Security:</strong> Users are responsible for safeguarding login credentials and activities occurring under their accounts.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            3. User Content & Intellectual Property
          </h2>
          <p>
            Users retain ownership of content submitted to CivilHub (such as project descriptions and profile summaries). By submitting public content, you grant CivilHub a non-exclusive license to display the content within the platform ecosystem. Published engineering resources and tools remain the intellectual property of CivilHub or their respective authors.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            4. Prohibited Conduct
          </h2>
          <p>Users agree not to engage in any of the following activities on CivilHub:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Submitting false credentials, misleading project requirements, or deceptive opportunity listings.</li>
            <li>Attempting unauthorized access to administrative or non-public user accounts.</li>
            <li>Interfering with server performance or circumventing Row-Level Security controls.</li>
            <li>Scraping platform directories for unauthorized bulk commercial contact compilation.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            5. Limitation of Liability
          </h2>
          <p>
            CivilHub provides platform services on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. While we maintain reliable uptime and data security standards, CivilHub makes no warranties regarding uninterrupted service or specific outcomes from posted opportunities or calculator outputs. To the maximum extent permitted by law, CivilHub disclaims liability for indirect, incidental, or consequential damages.
          </p>
        </section>

        <section className="space-y-3 border-t border-[var(--color-ch-border)] pt-6">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            6. Questions & Contact Information
          </h2>
          <p>
            For legal inquiries or questions regarding these Terms of Service, please reach out to:
          </p>
          <div className="flex items-center gap-2 font-medium text-[var(--color-ch-navy)]">
            <Mail size={16} className="text-[var(--color-ch-orange)]" />
            <a href="mailto:hello@civilhub.com" className="hover:underline text-[var(--color-ch-orange)]">
              hello@civilhub.com
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
