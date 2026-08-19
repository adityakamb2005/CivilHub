import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CivilHub — Connect. Build. Manage. Grow.',
    template: '%s | CivilHub',
  },
  description:
    'A professional digital platform connecting civil engineers, clients and the construction ecosystem. Discover engineers, manage projects and track construction progress.',
  keywords: [
    'civil engineering',
    'construction management',
    'engineer directory',
    'construction projects',
    'civil engineer',
    'project tracking',
    'construction platform',
  ],
  authors: [{ name: 'CivilHub' }],
  creator: 'CivilHub',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://civilhub.com',
    title: 'CivilHub — Connect. Build. Manage. Grow.',
    description:
      'A professional digital platform connecting civil engineers, clients and the construction ecosystem.',
    siteName: 'CivilHub',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
