# CivilHub

A professional platform for the civil engineering ecosystem. CivilHub connects engineers with clients and the broader construction industry through verified profiles, project portfolios, and engineering resources.

The project is under active development.

---

## Implemented Features

- **Authentication** — Registration, login, logout, and forgot-password flows via Supabase Auth
- **Engineer dashboard** — Protected dashboard for signed-in engineers
- **Engineer profile editor** — Create and edit professional information, specializations, and profile visibility
- **Public engineer directory** — Searchable, filterable listing of all public engineer profiles (`/engineers`)
- **Public engineer profile pages** — Individual public profile pages (`/engineers/[id]`)
- **Supabase Row Level Security (RLS)** — Database-level access control on engineer profiles and related tables

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Component primitives | Radix UI |
| Icons | Lucide React |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Database security | PostgreSQL Row Level Security |

---

## Project Structure

```
CivilHub/
├── app/
│   ├── (auth)/          # Login, register, forgot-password
│   ├── (engineer)/      # Protected engineer routes (dashboard, profile editor)
│   ├── (public)/        # Public routes (home, engineers directory, placeholder pages)
│   ├── (admin)/         # Admin area (in progress)
│   ├── (client)/        # Client area (in progress)
│   └── api/             # API routes
├── components/          # Shared UI components
├── lib/                 # Supabase clients, utilities
├── supabase/
│   └── migrations/      # Database migrations
├── types/               # Shared TypeScript types
└── public/              # Static assets
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do **not** commit `.env.local` or any service-role / secret keys.

### Database

Apply the migrations in `supabase/migrations/` to your Supabase project in order:

1. `001_initial_schema.sql`
2. `002_engineer_profiles.sql`

### Commands

```bash
# Install dependencies
npm install

# Start the development server
npm.cmd run dev

# Build for production
npm.cmd run build

# Run the production build
npm.cmd run start
```

The development server starts at `http://localhost:3000` by default.