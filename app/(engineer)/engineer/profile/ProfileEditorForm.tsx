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
  ArrowRight,
  GraduationCap,
  Award,
  CalendarCheck
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
  const [phone, setPhone] = useState(profile.phone || '')

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
  const [isAvailable, setIsAvailable] = useState<boolean>(
    engineerProfile?.is_available ?? true
  )
  const [websiteUrl, setWebsiteUrl] = useState(engineerProfile?.website_url || '')
  const [linkedinUrl, setLinkedinUrl] = useState(engineerProfile?.linkedin_url || '')
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    engineerProfile?.visibility || 'public'
  )

  const [skills, setSkills] = useState<string>(
    (engineerProfile as any)?.skills?.join(', ') || ''
  )

  // JSON fields
  const [educationList, setEducationList] = useState<any[]>(
    (engineerProfile as any)?.education || []
  )
  const [certificationsList, setCertificationsList] = useState<any[]>(
    (engineerProfile as any)?.certifications || []
  )
  const [workList, setWorkList] = useState<any[]>(
    (engineerProfile as any)?.work_experience || []
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
      const db = supabase as any

      // 1. Update profiles table
      const { error: pErr } = await db
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null,
          location: location.trim() || null,
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (pErr) throw pErr

      // Parse skills array
      const parsedSkills = skills
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      // 2. Upsert engineer_profiles table
      const engData = {
        title: title.trim(),
        specialization: specialization || null,
        about: about.trim() || null,
        years_experience: yearsExperience !== '' ? Number(yearsExperience) : null,
        is_available: isAvailable,
        visibility,
        website_url: websiteUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        skills: parsedSkills,
        education: educationList,
        certifications: certificationsList,
        work_experience: workList,
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

      setSuccessMsg('Your professional profile has been updated successfully!')
      router.refresh()
    } catch (err: unknown) {
      console.error('Error saving profile:', err)
      const message = (err as { message?: string })?.message || 'Failed to save profile. Please try again.'
      setErrorMsg(message)
    } finally {
      setSaving(false)
    }
  }

  // Dynamic Item Helper Handlers
  const addEdu = () => setEducationList([...educationList, { degree: '', institution: '', field_of_study: '', end_year: '' }])
  const removeEdu = (idx: number) => setEducationList(educationList.filter((_, i) => i !== idx))
  const updateEdu = (idx: number, key: string, val: string) => {
    const next = [...educationList]
    next[idx] = { ...next[idx], [key]: val }
    setEducationList(next)
  }

  const addCert = () => setCertificationsList([...certificationsList, { title: '', issuing_organization: '', issue_date: '' }])
  const removeCert = (idx: number) => setCertificationsList(certificationsList.filter((_, i) => i !== idx))
  const updateCert = (idx: number, key: string, val: string) => {
    const next = [...certificationsList]
    next[idx] = { ...next[idx], [key]: val }
    setCertificationsList(next)
  }

  const addWork = () => setWorkList([...workList, { position_title: '', company_name: '', location: '', start_date: '', end_date: '', description: '' }])
  const removeWork = (idx: number) => setWorkList(workList.filter((_, i) => i !== idx))
  const updateWork = (idx: number, key: string, val: string) => {
    const next = [...workList]
    next[idx] = { ...next[idx], [key]: val }
    setWorkList(next)
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
      <div id="basic-info" className="ch-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
          <User size={18} className="text-[var(--color-ch-orange)]" />
          Basic Profile Information
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
              placeholder="e.g. Sarah Jenkins, PE"
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
              placeholder="e.g. Senior Structural Engineer"
              className="ch-input"
              required
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
              placeholder="e.g. Chicago, IL or London, UK"
              className="ch-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="ch-input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Profile Photo Image URL
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

      {/* Professional Details & Bio */}
      <div id="summary" className="ch-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
          <HardHat size={18} className="text-[var(--color-ch-orange)]" />
          Discipline & Bio
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              Engineering Discipline
            </label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value as SpecializationType)}
              className="ch-input bg-white"
            >
              <option value="">Select Discipline...</option>
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

        <div id="skills">
          <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
            Technical Skills & Software Tools
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. AutoCAD, Revit, STAAD Pro, ETABS, Foundation Design, Site Supervision, Eurocodes"
            className="ch-input"
          />
          <span className="text-[11px] text-[var(--color-ch-text-muted)] mt-1 block">
            Comma-separated list of civil engineering skills and tools.
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
            Professional Summary / Overview
          </label>
          <textarea
            rows={5}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={1500}
            placeholder="Summarize your engineering background, key structural project achievements, licensing, and client service approach..."
            className="ch-input resize-y text-xs"
          />
          <div className="text-right text-xs text-[var(--color-ch-text-muted)] mt-1">
            {about.length}/1500 characters
          </div>
        </div>

        {/* Availability Status */}
        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--color-ch-orange)] focus:ring-[var(--color-ch-orange)] accent-[var(--color-ch-orange)]"
            />
            <span className="text-xs font-semibold text-[var(--color-ch-navy)] flex items-center gap-1.5">
              <CalendarCheck size={14} className="text-emerald-600" />
              Available for New Project Contracts & Opportunities
            </span>
          </label>
        </div>
      </div>

      {/* Work Experience */}
      <div id="experience" className="ch-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-ch-border-subtle)] pb-3">
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
            <Briefcase size={18} className="text-[var(--color-ch-orange)]" />
            Work History
          </h2>
          <button
            type="button"
            onClick={addWork}
            className="ch-btn ch-btn-outline text-xs px-2.5 py-1 inline-flex items-center gap-1"
          >
            + Add Position
          </button>
        </div>

        {workList.length === 0 ? (
          <p className="text-xs text-[var(--color-ch-text-muted)] italic">
            No work history positions added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {workList.map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[var(--color-ch-navy)]">
                    Position #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeWork(idx)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Position Title (e.g. Senior Project Manager)"
                    value={item.position_title || ''}
                    onChange={(e) => updateWork(idx, 'position_title', e.target.value)}
                    className="ch-input"
                  />
                  <input
                    type="text"
                    placeholder="Company / Firm Name"
                    value={item.company_name || ''}
                    onChange={(e) => updateWork(idx, 'company_name', e.target.value)}
                    className="ch-input"
                  />
                  <input
                    type="text"
                    placeholder="Start Date / Year (e.g. 2020)"
                    value={item.start_date || ''}
                    onChange={(e) => updateWork(idx, 'start_date', e.target.value)}
                    className="ch-input"
                  />
                  <input
                    type="text"
                    placeholder="End Date / Year (or Present)"
                    value={item.end_date || ''}
                    onChange={(e) => updateWork(idx, 'end_date', e.target.value)}
                    className="ch-input"
                  />
                  <textarea
                    rows={2}
                    placeholder="Description of responsibilities and projects managed..."
                    value={item.description || ''}
                    onChange={(e) => updateWork(idx, 'description', e.target.value)}
                    className="ch-input md:col-span-2 resize-y"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education & Certifications */}
      <div id="education" className="ch-card p-6 space-y-6">
        {/* Education */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-ch-border-subtle)] pb-3">
            <h2 className="text-base font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
              <GraduationCap size={18} className="text-[var(--color-ch-orange)]" />
              Education
            </h2>
            <button
              type="button"
              onClick={addEdu}
              className="ch-btn ch-btn-outline text-xs px-2.5 py-1 inline-flex items-center gap-1"
            >
              + Add Education
            </button>
          </div>

          {educationList.length === 0 ? (
            <p className="text-xs text-[var(--color-ch-text-muted)] italic">
              No education entries added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {educationList.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--color-ch-navy)]">
                      Degree / Qualification #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEdu(idx)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Degree (e.g. B.S. Civil Engineering)"
                      value={item.degree || ''}
                      onChange={(e) => updateEdu(idx, 'degree', e.target.value)}
                      className="ch-input"
                    />
                    <input
                      type="text"
                      placeholder="Institution / University"
                      value={item.institution || ''}
                      onChange={(e) => updateEdu(idx, 'institution', e.target.value)}
                      className="ch-input"
                    />
                    <input
                      type="text"
                      placeholder="Graduation Year (e.g. 2018)"
                      value={item.end_year || ''}
                      onChange={(e) => updateEdu(idx, 'end_year', e.target.value)}
                      className="ch-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[var(--color-ch-border-subtle)] pb-3">
            <h2 className="text-base font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
              <Award size={18} className="text-[var(--color-ch-orange)]" />
              Certifications & Engineering Licenses
            </h2>
            <button
              type="button"
              onClick={addCert}
              className="ch-btn ch-btn-outline text-xs px-2.5 py-1 inline-flex items-center gap-1"
            >
              + Add Certification
            </button>
          </div>

          {certificationsList.length === 0 ? (
            <p className="text-xs text-[var(--color-ch-text-muted)] italic">
              No certifications added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {certificationsList.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--color-ch-navy)]">
                      License / Certification #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCert(idx)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Title (e.g. Licensed Professional Engineer PE)"
                      value={item.title || ''}
                      onChange={(e) => updateCert(idx, 'title', e.target.value)}
                      className="ch-input"
                    />
                    <input
                      type="text"
                      placeholder="Issuing Organization (e.g. NCEES)"
                      value={item.issuing_organization || ''}
                      onChange={(e) => updateCert(idx, 'issuing_organization', e.target.value)}
                      className="ch-input"
                    />
                    <input
                      type="text"
                      placeholder="Issue Date / Year"
                      value={item.issue_date || ''}
                      onChange={(e) => updateCert(idx, 'issue_date', e.target.value)}
                      className="ch-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Online Links */}
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
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="ch-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ch-text-primary)] mb-1">
              LinkedIn Profile URL
            </label>
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
                Visible in public directory and to clients on CivilHub.
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
                Hidden from public searches. Only visible in your dashboard workspace.
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
