import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowRight } from 'lucide-react'

// Demo projects — clearly marked as sample data
const FEATURED_PROJECTS = [
  {
    id: 'demo-proj-1',
    title: 'Greenleaf Residential Complex',
    type: 'Residential',
    location: 'Bengaluru, Karnataka',
    status: 'Completed',
    year: '2024',
    description:
      'A 5-storey residential complex with 24 units. Structural RCC framing, deep pile foundation, and full MEP coordination.',
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60',
    engineer: 'Aravind Krishnamurthy',
    statusColor: 'ch-badge-green',
  },
  {
    id: 'demo-proj-2',
    title: 'NH-48 Service Road Widening',
    type: 'Infrastructure',
    location: 'Chennai, Tamil Nadu',
    status: 'Completed',
    year: '2023',
    description:
      'Road widening project spanning 4.2 km with drainage improvements, subgrade stabilization, and bituminous surfacing.',
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=60',
    engineer: 'Priya Subramaniam',
    statusColor: 'ch-badge-green',
  },
  {
    id: 'demo-proj-3',
    title: 'Skyline Commercial Tower',
    type: 'Commercial',
    location: 'Hyderabad, Telangana',
    status: 'In Progress',
    year: '2025',
    description:
      'A 12-storey commercial office tower with deep raft foundation, structural steel frame, and glass curtain wall.',
    image:
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&auto=format&fit=crop&q=60',
    engineer: 'Mohammed Iqbal Siddiqui',
    statusColor: 'ch-badge-orange',
  },
]

export function FeaturedProjects() {
  return (
    <section className="ch-section bg-white" aria-labelledby="projects-heading">
      <div className="ch-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="ch-section-label mb-3 block">Featured Projects</span>
            <h2
              id="projects-heading"
              className="ch-text-section-heading text-[var(--color-ch-navy)]"
            >
              Real Work. Real Results.
            </h2>
          </div>
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ch-orange)] hover:underline whitespace-nowrap"
          >
            Browse all projects
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Demo notice */}
        <p className="text-xs text-[var(--color-ch-text-muted)] mb-6 italic">
          * Sample projects shown for demonstration. Real engineer portfolio projects will appear here.
        </p>

        {/* Project cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {FEATURED_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="ch-card overflow-hidden hover:shadow-[0_4px_20px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Type badge overlay */}
                <div className="absolute top-3 left-3">
                  <span className="ch-badge ch-badge-navy text-xs backdrop-blur-sm bg-[var(--color-ch-navy)]/80 text-white">
                    {project.type}
                  </span>
                </div>
                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  <span className={`ch-badge ${project.statusColor}`}>{project.status}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-[var(--color-ch-navy)] mb-1.5">
                  {project.title}
                </h3>
                <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed mb-4 flex-1">
                  {project.description}
                </p>

                <div className="flex flex-col gap-1.5 text-xs text-[var(--color-ch-text-muted)] mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} />
                    <span>{project.year}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ch-text-muted)]">
                    by <span className="font-medium text-[var(--color-ch-navy)]">{project.engineer}</span>
                  </span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline flex items-center gap-1"
                  >
                    View
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
