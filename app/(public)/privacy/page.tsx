import type { Metadata } from 'next'
import { ShieldCheck, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | CivilHub',
  description:
    'Read the CivilHub Privacy Policy to understand how user data, engineer profiles, and platform interactions are protected.',
}

export default function PrivacyPage() {
  const lastUpdated = 'September 2026'

  return (
    <div className="py-12 space-y-10 max-w-4xl mx-auto ch-container">
      {/* Page Header */}
      <div className="space-y-3 text-center sm:text-left">
        <span className="ch-section-label inline-block">Legal & Privacy</span>
        <h1 className="ch-text-page-heading text-[var(--color-ch-navy)]">
          CivilHub Privacy Policy
        </h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)]">
          Last updated: {lastUpdated} · CivilHub Platform Version MVP
        </p>
      </div>

      {/* Main Notice Card */}
      <div className="ch-card p-6 bg-[var(--color-ch-surface)] border-l-4 border-l-[var(--color-ch-orange)] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[var(--color-ch-navy)] text-base">
          <ShieldCheck size={20} className="text-[var(--color-ch-orange)]" />
          Data Protection Statement
        </div>
        <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed">
          CivilHub values your privacy. This policy explains how we collect, handle, and safeguard your personal and professional information when using CivilHub services, engineering tools, and client directories.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="ch-card p-8 space-y-8 text-sm text-[var(--color-ch-text-secondary)] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            1. Information We Collect
          </h2>
          <p>
            When registering on CivilHub or utilizing platform capabilities, we collect information provided directly by you:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Account & Profile Data:</strong> Name, email address, selected role (engineer or client), location, and phone contact details.
            </li>
            <li>
              <strong>Engineer Credentials:</strong> Headline, professional summary, years of experience, website/LinkedIn URLs, and project showcase details.
            </li>
            <li>
              <strong>Client & Project Information:</strong> Organization name, project descriptions, project types, and opportunity submissions.
            </li>
            <li>
              <strong>Usage & Tool Calculations:</strong> Temporary inputs provided to interactive civil engineering calculators for formula execution.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            2. How We Use Your Information
          </h2>
          <p>
            CivilHub processes user information solely for legitimate operational platform purposes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Facilitating discovery between verified civil engineers and project clients.</li>
            <li>Displaying public engineer directories, portfolio projects, and opportunity listings.</li>
            <li>Delivering interactive calculator results and maintaining user workspace settings.</li>
            <li>Sending essential service notifications and application updates.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            3. Data Visibility & Row-Level Security
          </h2>
          <p>
            CivilHub uses database Row-Level Security (RLS) policies to protect user records:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Public Profile Content:</strong> Public engineer profiles, published opportunities, and published projects are viewable by platform visitors.
            </li>
            <li>
              <strong>Private Data:</strong> Draft resources, pending opportunity applications, and account settings are restricted strictly to authorized profile owners and platform administrators.
            </li>
            <li>
              <strong>No Third-Party Sale:</strong> CivilHub does not sell, rent, or trade your personal information to advertisers or external data brokers.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            4. Cookies & Session Management
          </h2>
          <p>
            CivilHub utilizes secure, essential HTTP cookies to maintain authenticated user sessions and route permissions. We do not place invasive cross-site tracking cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            5. Your Data Rights & Choices
          </h2>
          <p>
            You retain control over your information. Registered users may update their profile visibility, edit details, or request account modification at any time by accessing their dashboard settings.
          </p>
        </section>

        <section className="space-y-3 border-t border-[var(--color-ch-border)] pt-6">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            6. Contact Us Regarding Privacy
          </h2>
          <p>
            If you have questions or concerns regarding this Privacy Policy or data handling on CivilHub, please contact our team at:
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
