import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { PlatformOverview } from '@/components/home/PlatformOverview'
import { FeaturedEngineers } from '@/components/home/FeaturedEngineers'
import { FeaturedProjects } from '@/components/home/FeaturedProjects'
import { ProjectTransparency } from '@/components/home/ProjectTransparency'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ToolsShowcase } from '@/components/home/ToolsShowcase'
import { ResourcesPreview } from '@/components/home/ResourcesPreview'
import { TrustSection } from '@/components/home/TrustSection'
import { HomeCTA } from '@/components/home/HomeCTA'

export const metadata: Metadata = {
  title: 'CivilHub — Connect. Build. Manage. Grow.',
  description:
    'A professional digital platform connecting civil engineers, clients and the construction ecosystem. Find verified engineers, manage projects, and track construction progress.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PlatformOverview />
      <FeaturedEngineers />
      <FeaturedProjects />
      <ProjectTransparency />
      <HowItWorks />
      <ToolsShowcase />
      <ResourcesPreview />
      <TrustSection />
      <HomeCTA />
    </>
  )
}
