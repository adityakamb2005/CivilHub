'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import {
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']
type ClientProfile = Database['public']['Tables']['client_profiles']['Row']

export function ClientProfileForm({
  profile,
  clientProfile,
}: {
  profile: Profile
  clientProfile: ClientProfile | null
}) {
  const router = useRouter()
  const supabase = createClient()

  // Form State
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [location, setLocation] = useState(profile.location || '')
  const [company, setCompany] = useState(clientProfile?.company || '')
  const [about, setAbout] = useState(clientProfile?.about || '')

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
    if (avatarUrl && !validateUrl(avatarUrl)) {
      setErrorMsg('Avatar image URL must be a valid web address starting with http:// or https://')
      return
    }

    setSaving(true)

    try {
      const db = supabase as any

      // 1. Update profiles table
      const { error: pErr } = await db
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null,
          phone: phone.trim() || null,
          location: location.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (pErr) throw pErr

      // 2. Upsert client_profiles table
      const clientData = {
        company: company.trim() || null,
        about: about.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (clientProfile) {
        const { error: cErr } = await db
          .from('client_profiles')
          .update(clientData)
          .eq('profile_id', profile.id)

        if (cErr) throw cErr
      } else {
        const { error: cErr } = await db
          .from('client_profiles')
          .insert({
            profile_id: profile.id,
            ...clientData,
          })

        if (cErr) throw cErr
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
            href="/client/dashboard"
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
          Personal Information
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
              placeholder="e.g. John Smith"
              className="ch-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555 123 4567"
              className="ch-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mumbai, India"
              className="ch-input"
            />
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

      {/* Company Information */}
      <div className="ch-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
          <Building2 size={18} className="text-[var(--color-ch-orange)]" />
          Company / Organization
        </h2>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Tata Infrastructure Ltd."
            className="ch-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
            About / Bio
          </label>
          <textarea
            rows={4}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={1500}
            placeholder="Tell engineers about yourself, your company, and the kinds of projects you work on..."
            className="ch-input resize-y"
          />
          <div className="text-right text-xs text-[var(--color-ch-text-muted)] mt-1">
            {about.length}/1500 characters
          </div>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <Link
          href="/client/dashboard"
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
