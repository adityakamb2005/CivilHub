'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { 
  User, 
  Briefcase, 
  MapPin, 
  Globe, 
  Linkedin, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  HardHat,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']
type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']
type SpecializationType = NonNullable<EngineerProfile['specialization']>

const SPECIALIZATION_OPTIONS: SpecializationType[] = [
  'Structural Engineering',
  'Civil Construction',
  'Geotechnical Engineering',
  'Transportation Engineering',
  'Water Resources',
  'Environmental Engineering',
  'Construction Management',
  'Surveying',
  'Quantity Surveying',
  'Other',
]

export function ProfileEditorForm({
  profile,
  engineerProfile,
}: {
  profile: Profile
  engineerProfile: EngineerProfile | null
}) {
  const router = useRouter()
  const supabase = createClient()

  // Form State
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [location, setLocation] = useState(profile.location || '')

  const [title, setTitle] = useState(engineerProfile?.title || '')
  const [specialization, setSpecialization] = useState<SpecializationType | ''>(
    engineerProfile?.specialization || ''
  )
  const [yearsExperience, setYearsExperience] = useState<string>(
    engineerProfile?.years_experience !== null && engineerProfile?.years_experience !== undefined
      ? String(engineerProfile.years_experience)
      : ''
  )
  const [about, setAbout] = useState(engineerProfile?.about || '')
  const [websiteUrl, setWebsiteUrl] = useState(engineerProfile?.website_url || '')
  const [linkedinUrl, setLinkedinUrl] = useState(engineerProfile?.linkedin_url || '')
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    engineerProfile?.visibility || 'public'
  )

  // Status State
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true
    try {
      const parsed = new URL(url.trim())
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    // Validation
    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.')
      return
    }
    if (!title.trim()) {
      setErrorMsg('Professional Title is required.')
      return
    }
    if (yearsExperience !== '' && (isNaN(Number(yearsExperience)) || Number(yearsExperience) < 0)) {
      setErrorMsg('Years of experience must be a non-negative number.')
      return
    }
    if (websiteUrl && !validateUrl(websiteUrl)) {
      setErrorMsg('Website URL must be a valid web address starting with http:// or https://')
      return
    }
    if (linkedinUrl && !validateUrl(linkedinUrl)) {
      setErrorMsg('LinkedIn URL must be a valid web address starting with http:// or https://')
      return
    }
    if (avatarUrl && !validateUrl(avatarUrl)) {
      setErrorMsg('Avatar image URL must be a valid web address starting with http:// or https://')
      return
    }

    setSaving(true)

    try {
      // Note: Manual Phase 1 database types require explicit client query builder casting for mutation overloads
      const db = supabase as any

      // 1. Update profiles table
      const { error: pErr } = await db
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null,
          location: location.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (pErr) throw pErr

      // 2. Upsert engineer_profiles table
      const engData = {
        title: title.trim(),
        specialization: specialization || null,
        about: about.trim() || null,
        years_experience: yearsExperience !== '' ? Number(yearsExperience) : null,
        visibility,
        website_url: websiteUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (engineerProfile) {
        const { error: eErr } = await db
          .from('engineer_profiles')
          .update(engData)
          .eq('profile_id', profile.id)

        if (eErr) throw eErr
      } else {
        const { error: eErr } = await db
          .from('engineer_profiles')
          .insert({
            profile_id: profile.id,
            ...engData,
          })

        if (eErr) throw eErr
      }

      setSuccessMsg('Your profile has been saved successfully!')
      router.refresh()
    } catch (err: unknown) {
      console.error('Error saving profile:', err)
      const message = (err as { message?: string })?.message || 'Failed to save profile. Please try again.'
      setErrorMsg(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-[var(--color-ch-red)] flex items-start gap-3 animate-fade-in">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-[var(--color-ch-green-light)] border border-[var(--color-ch-green)]/20 text-[var(--color-ch-green)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0" />
            <div className="text-sm font-medium">{successMsg}</div>
          </div>
          <Link
            href="/engineer/dashboard"
            className="ch-btn ch-btn-navy text-xs py-2 px-3 self-start sm:self-auto"
          >
            <span>Return to Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Basic Information */}
      <div className="ch-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
          <User size={18} className="text-[var(--color-ch-orange)]" />
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Full Name <span className="text-[var(--color-ch-red)]">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="ch-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Professional Title <span className="text-[var(--color-ch-red)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lead Structural Engineer, PE"
              className="ch-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Chicago, IL or London, UK"
                className="ch-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Profile Photo URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="ch-input"
            />
          </div>
        </div>

        {/* Avatar Live Preview */}
        {avatarUrl.trim() && validateUrl(avatarUrl) && (
          <div className="pt-2 flex items-center gap-3">
            <span className="text-xs text-[var(--color-ch-text-muted)]">Avatar Preview:</span>
            <div className="w-10 h-10 rounded-full border border-[var(--color-ch-border)] overflow-hidden">
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Professional Information */}
      <div className="ch-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
          <HardHat size={18} className="text-[var(--color-ch-orange)]" />
          Professional Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Specialization
            </label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value as SpecializationType)}
              className="ch-input bg-white"
            >
              <option value="">Select Specialization...</option>
              {SPECIALIZATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              max="70"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="e.g. 8"
              className="ch-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
            About / Professional Bio
          </label>
          <textarea
            rows={4}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={1500}
            placeholder="Summarize your engineering expertise, key project achievements, and professional background..."
            className="ch-input resize-y"
          />
          <div className="text-right text-xs text-[var(--color-ch-text-muted)] mt-1">
            {about.length}/1500 characters
          </div>
        </div>
      </div>

      {/* Online Presence */}
      <div className="ch-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
          <Globe size={18} className="text-[var(--color-ch-orange)]" />
          Online Presence
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Website URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="ch-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              LinkedIn Profile URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="ch-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="ch-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
          <Eye size={18} className="text-[var(--color-ch-orange)]" />
          Profile Visibility
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            onClick={() => setVisibility('public')}
            className={`p-4 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
              visibility === 'public'
                ? 'border-[var(--color-ch-orange)] bg-[var(--color-ch-orange-light)]/20'
                : 'border-[var(--color-ch-border)] bg-white hover:border-[var(--color-ch-navy)]/30'
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
              className="mt-1 accent-[var(--color-ch-orange)]"
            />
            <div>
              <div className="font-semibold text-sm text-[var(--color-ch-navy)] flex items-center gap-1.5">
                <Eye size={15} className="text-[var(--color-ch-green)]" />
                Public Profile
              </div>
              <p className="text-xs text-[var(--color-ch-text-secondary)] mt-0.5">
                Visible to registered clients and structural project managers on CivilHub.
              </p>
            </div>
          </label>

          <label
            onClick={() => setVisibility('private')}
            className={`p-4 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
              visibility === 'private'
                ? 'border-[var(--color-ch-orange)] bg-[var(--color-ch-orange-light)]/20'
                : 'border-[var(--color-ch-border)] bg-white hover:border-[var(--color-ch-navy)]/30'
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === 'private'}
              onChange={() => setVisibility('private')}
              className="mt-1 accent-[var(--color-ch-orange)]"
            />
            <div>
              <div className="font-semibold text-sm text-[var(--color-ch-navy)] flex items-center gap-1.5">
                <EyeOff size={15} className="text-[var(--color-ch-text-muted)]" />
                Private Profile
              </div>
              <p className="text-xs text-[var(--color-ch-text-secondary)] mt-0.5">
                Hidden from public searches. Only visible to you in your dashboard workspace.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <Link
          href="/engineer/dashboard"
          className="ch-btn ch-btn-outline"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="ch-btn ch-btn-primary min-w-[140px]"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Profile</span>
          )}
        </button>
      </div>
    </form>
  )
}
