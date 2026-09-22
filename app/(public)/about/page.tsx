import type { Metadata } from 'next'
import Link from 'next/link'
import {
  HardHat,
  Users,
  Calculator,
  BookOpen,
  Briefcase,
  FolderKanban,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'About CivilHub | Digital Platform for Civil Engineers & Construction',
  description:
    'Learn about CivilHub — the professional digital platform connecting civil engineers, clients, tools, and infrastructure projects.',
}

export default function AboutPage() {
  const pillars = [
    {
      title: 'Engineer Directory',
      description:
        'A verified showcase for civil engineering professionals to display credentials, specialization, years of experience, and project portfolios.',
      icon: Users,
    },
    {
      title: 'Engineering Calculators & Tools',
      description:
        '9+ interactive civil engineering tools for area, volume, concrete, cement, sand, steel, unit conversion, block estimation, and cost modeling.',
      icon: Calculator,
    },
    {
      title: 'Knowledge Resource Hub',
      description:
        'Curated technical articles, structural design formulas, industry codes, career guides, and field references for practicing engineers.',
      icon: BookOpen,
    },
    {
      title: 'Opportunity Marketplace',
      description:
        'Direct connection to engineering jobs, project tenders, consultancies, and career advancements across the construction industry.',
      icon: Briefcase,
    },
    {
      title: 'Client Project Showcase',
      description:
        'A transparent project workspace enabling clients to post projects, manage timelines, and collaborate with qualified civil engineers.',
      icon: FolderKanban,
    },
    {
      title: 'Trust & Security',
      description:
        'Role-scoped authorization and server-enforced security models ensuring project data integrity and verified engineer identities.',
      icon: ShieldCheck,
    },
  ]

  const stats = [
    { label: 'Specialized Calculators', value: '9+' },
    { label: 'Engineering Disciplines', value: 'Civil & Structural' },
    { label: 'Platform Access', value: '24 / 7 Public & Portal' },
    { label: 'Security Standard', value: 'Supabase RLS Protected' },
  ]

  return (
    <div className="py-12 space-y-16">
      {/* Hero Header */}
      <section className="ch-container text-center max-w-3xl mx-auto space-y-4">
        <span className="ch-section-label inline-block mb-2">About CivilHub</span>
        <h1 className="ch-text-page-heading text-[var(--color-ch-navy)]">
          Empowering Civil Engineers & Building the Future of Infrastructure
        </h1>
        <p className="text-lg text-[var(--color-ch-text-secondary)] leading-relaxed">
          CivilHub is a dedicated digital ecosystem built specifically for civil engineers, structural designers, contractors, and project clients. We streamline engineering workflows, knowledge sharing, and professional discovery.
        </p>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-[var(--color-ch-border)] py-10">
        <div className="ch-container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="text-3xl font-extrabold text-[var(--color-ch-navy)]">
                {stat.value}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-secondary)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="ch-container space-y-10">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--color-ch-navy)]">
            Platform Capabilities & Ecosystem
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">
            Everything engineers and construction clients need in one cohesive workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map(({ title, description, icon: Icon }) => (
            <div key={title} className="ch-card p-6 space-y-3 hover:border-[var(--color-ch-orange)]/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-ch-surface)] flex items-center justify-center text-[var(--color-ch-orange)]">
                <Icon size={20} />
              </div>
              <h3 className="font-bold text-[var(--color-ch-navy)] text-lg">{title}</h3>
              <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Statement Banner */}
      <section className="ch-container">
        <div className="ch-card p-8 md:p-12 bg-gradient-to-br from-[var(--color-ch-navy)] to-[#1A2E4B] text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-ch-orange)] rounded-lg flex items-center justify-center shrink-0">
              <HardHat size={22} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ch-orange)]">
                Our Mission
              </span>
              <h3 className="text-xl md:text-2xl font-bold">Bridging Professional Expertise with Infrastructure Needs</h3>
            </div>
          </div>
          <p className="text-white/80 leading-relaxed text-sm md:text-base max-w-3xl">
            Civil engineering is the backbone of modern society — from roads and bridges to high-rises and environmental systems. CivilHub was created to eliminate operational friction, provide reliable digital calculation tools, and offer a transparent platform where verified engineering talent meets quality construction projects.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link href="/register" className="ch-btn ch-btn-primary">
              Join CivilHub Today <ArrowRight size={16} />
            </Link>
            <Link href="/tools" className="ch-btn bg-white/10 text-white hover:bg-white/20 border border-white/20">
              Explore Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
