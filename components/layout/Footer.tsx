import Link from 'next/link'
import { HardHat, Mail, MapPin } from 'lucide-react'

const FOOTER_LINKS = {
  Platform: [
    { label: 'Engineers', href: '/engineers' },
    { label: 'Projects', href: '/projects' },
    { label: 'Tools', href: '/tools' },
    { label: 'Resources', href: '/resources' },
    { label: 'Opportunities', href: '/opportunities' },
  ],
  Engineers: [
    { label: 'Join as Engineer', href: '/register?role=engineer' },
    { label: 'Create Profile', href: '/register?role=engineer' },
    { label: 'Manage Projects', href: '/register?role=engineer' },
    { label: 'Engineer Dashboard', href: '/engineer/dashboard' },
  ],
  Clients: [
    { label: 'Find an Engineer', href: '/engineers' },
    { label: 'Post a Project', href: '/register?role=client' },
    { label: 'Track Progress', href: '/register?role=client' },
    { label: 'Client Dashboard', href: '/client/dashboard' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-ch-navy)] text-white">
      {/* Main footer content */}
      <div className="ch-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-[var(--color-ch-orange)] rounded-md flex items-center justify-center">
                <HardHat size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                Civil<span className="text-[var(--color-ch-orange)]">Hub</span>
              </span>
            </Link>

            <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-xs">
              A professional digital platform connecting civil engineers, clients, and the construction ecosystem.
            </p>

            <p className="text-xs font-semibold text-[var(--color-ch-orange)] uppercase tracking-widest mb-2">
              Connect. Build. Manage. Grow.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Mail size={12} />
                <span>hello@civilhub.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <MapPin size={12} />
                <span>India</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                {category}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="ch-container py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {currentYear} CivilHub. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Built for the construction and civil engineering profession.
          </p>
        </div>
      </div>
    </footer>
  )
}
