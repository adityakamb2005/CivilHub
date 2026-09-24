import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']
export type ClientProfile = Database['public']['Tables']['client_profiles']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']
export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type OpportunityApplication = Database['public']['Tables']['opportunity_applications']['Row']
export type ProjectApplication = Database['public']['Tables']['project_applications']['Row']
export type Project = Database['public']['Tables']['projects']['Row']

export type UserRole = 'engineer' | 'client' | 'admin'

export type ProfileWithRole = Profile & {
  role: UserRole
}

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  fullName?: string
  avatarUrl?: string
}

// ---------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------
export interface NavLink {
  label: string
  href: string
}
