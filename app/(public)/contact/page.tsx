'use client'

import { useState } from 'react'
import { Mail, MapPin, MessageSquare, CheckCircle2, Send, Info } from 'lucide-react'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'general',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.email && formData.message) {
      const subject = encodeURIComponent('CivilHub: ' + formData.topic)
      const body = encodeURIComponent(formData.message + '\n\nFrom: ' + formData.name + '\nReply to: ' + formData.email)
      window.location.href = 'mailto:hello@civilhub.com?subject=' + subject + '&body=' + body
      setSubmitted(true)
    }
  }

  return (
    <div className="py-12 space-y-12">
      {/* Header */}
      <section className="ch-container max-w-3xl mx-auto text-center space-y-3">
        <span className="ch-section-label inline-block">Contact CivilHub</span>
        <h1 className="ch-text-page-heading text-[var(--color-ch-navy)]">
          Get in Touch with Our Team
        </h1>
        <p className="text-[var(--color-ch-text-secondary)]">
          Have questions about engineer profiles, client project tools, or platform feedback? Prepare your inquiry below, then send it using your email app.
        </p>
      </section>

      <section className="ch-container max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Column */}
          <div className="space-y-6">
            <div className="ch-card p-6 space-y-5">
              <h2 className="font-bold text-lg text-[var(--color-ch-navy)] flex items-center gap-2">
                <MessageSquare size={18} className="text-[var(--color-ch-orange)]" />
                Contact Information
              </h2>
              <div className="space-y-4 text-sm text-[var(--color-ch-text-secondary)]">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-[var(--color-ch-orange)] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-[var(--color-ch-navy)]">Informational Contact</div>
                    <a href="mailto:hello@civilhub.com" className="hover:underline text-[var(--color-ch-orange)]">
                      hello@civilhub.com
                    </a>
                    <div className="text-xs text-[var(--color-ch-text-muted)] mt-0.5">
                      Informational platform address
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[var(--color-ch-orange)] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-[var(--color-ch-navy)]">Location</div>
                    <div>India</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ch-card p-6 bg-[var(--color-ch-surface)] border-dashed space-y-2">
              <h3 className="font-semibold text-sm text-[var(--color-ch-navy)] flex items-center gap-1.5">
                <Info size={16} className="text-[var(--color-ch-navy)]" />
                Registered User Support
              </h3>
              <p className="text-xs text-[var(--color-ch-text-secondary)] leading-relaxed">
                Registered engineers and clients can manage project applications, profile settings, and opportunity listings directly inside their respective role dashboards.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="ch-card p-6 sm:p-8">
              {submitted ? (
                <div className="py-8 text-center space-y-4" role="status">
                  <div className="w-12 h-12 bg-[var(--color-ch-green-light)] text-[var(--color-ch-green)] rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-ch-navy)]">
                    Continue in your email app
                  </h3>
                  <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md mx-auto">
                    Thank you, <span className="font-semibold text-[var(--color-ch-navy)]">{formData.name}</span>. Your inquiry regarding <span className="font-semibold">{formData.topic}</span> is ready in your email app. Please send it there to contact us. This form does not store or send messages.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({ name: '', email: '', topic: 'general', message: '' })
                    }}
                    className="ch-btn ch-btn-outline text-xs mt-4"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="font-bold text-lg text-[var(--color-ch-navy)]">CivilHub Inquiry Form</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="ch-text-label">
                        Your Name <span className="text-[var(--color-ch-red)]">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="ch-input mt-1.5"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="ch-text-label">
                        Email Address <span className="text-[var(--color-ch-red)]">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="ch-input mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="topic" className="ch-text-label">Inquiry Topic</label>
                    <select
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="ch-input mt-1.5 bg-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="verification">Engineer Verification</option>
                      <option value="project">Project Support</option>
                      <option value="partnership">Partnership & Media</option>
                      <option value="feedback">Platform Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="ch-text-label">
                      Message <span className="text-[var(--color-ch-red)]">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help you?"
                      className="ch-input mt-1.5 resize-y"
                    />
                  </div>

                  <button type="submit" className="ch-btn ch-btn-primary w-full sm:w-auto">
                    <Send size={16} /> Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
