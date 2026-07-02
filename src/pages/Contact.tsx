import { useState, type FormEvent } from 'react';
import { Mail, MapPin, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Section, Container } from '@/components/Section';
import type { ContactForm, InquiryType } from '@/types';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const inquiryTypes: { value: InquiryType; label: string }[] = [
  { value: 'enterprise-demo', label: 'Enterprise Demo Request' },
  { value: 'technical-evaluation', label: 'Technical Evaluation' },
  { value: 'partnership', label: 'Strategic Partnership' },
  { value: 'security-audit', label: 'Security Audit Inquiry' },
  { value: 'custom-deployment', label: 'Custom Deployment' },
  { value: 'general', label: 'General Inquiry' },
];

const initialForm: ContactForm = {
  name: '',
  organization: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  inquiry: 'enterprise-demo',
};

export default function Contact() {
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [formState, setFormState] = useState<FormState>('idle');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    // Simulate async submission — wire to backend endpoint in production
    await new Promise((r) => setTimeout(r, 1200));
    setFormState('success');
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 grid-pattern">
        <Container className="relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[10px] text-[#00D4FF] font-mono px-3 py-1.5 bg-[#00D4FF10] border border-[#00D4FF20] rounded-full mb-6">
              <span className="w-1 h-1 bg-[#00D4FF] rounded-full" />
              Enterprise Inquiries — BMSolutions
            </div>
            <h1
              className="text-4xl lg:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Start an Enterprise Conversation
            </h1>
            <p
              className="text-lg text-[#64748B]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Technical evaluations, security audits, and enterprise onboarding.
              Our team responds to qualified enterprise inquiries within one business day.
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid lg:grid-cols-3 gap-12">
            {/* ── Contact Info ── */}
            <div className="space-y-6">
              <div>
                <h2
                  className="text-white font-semibold mb-4"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Contact Details
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      icon: <Mail className="w-4 h-4" />,
                      label: 'Enterprise Email',
                      value: 'contact@bnlvconsulting.com',
                      href: 'mailto:contact@bnlvconsulting.com',
                    },
                    {
                      icon: <MapPin className="w-4 h-4" />,
                      label: 'Headquarters',
                      value: 'BNLV Group — India Operations',
                    },
                    {
                      icon: <Clock className="w-4 h-4" />,
                      label: 'Response SLA',
                      value: '1 business day (qualified enterprise inquiries)',
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#00D4FF15] border border-[#00D4FF30] rounded flex items-center justify-center text-[#00D4FF] flex-shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <div
                          className="text-[10px] text-[#4B5563] uppercase tracking-widest font-mono mb-0.5"
                        >
                          {item.label}
                        </div>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-sm text-[#94A3B8] hover:text-[#00D4FF] transition-colors"
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span
                            className="text-sm text-[#94A3B8]"
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                          >
                            {item.value}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HR Note */}
              <div className="p-4 bg-[#111827] border border-[#1E2A3B] rounded-xl">
                <div
                  className="text-[10px] text-[#4B5563] uppercase tracking-widest font-mono mb-2"
                >
                  HR & Recruitment
                </div>
                <p
                  className="text-xs text-[#64748B] leading-relaxed"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  For HR policies and recruitment inquiries, contact{' '}
                  <a
                    href="mailto:hr@bnlvconsulting.com"
                    className="text-[#00D4FF] hover:underline"
                  >
                    hr@bnlvconsulting.com
                  </a>
                </p>
              </div>

              {/* Platform quick links */}
              <div>
                <div
                  className="text-[10px] text-[#4B5563] uppercase tracking-widest font-mono mb-3"
                >
                  Quick Platform Access
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'JINTO — Infrastructure', color: '#00D4FF' },
                    { label: 'LIMSY — Lab Informatics', color: '#10B981' },
                    { label: 'Nidhivan R&D — Intelligence', color: '#F59E0B' },
                    { label: 'KundaliPro — AI Astrology', color: '#8B5CF6' },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center gap-2 text-xs text-[#64748B]"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: p.color }}
                      />
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Contact Form ── */}
            <div className="lg:col-span-2">
              <div className="p-8 bg-[#111827] border border-[#1E2A3B] rounded-2xl">
                {formState === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 bg-[#10B98115] border border-[#10B98130] rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
                    </div>
                    <h3
                      className="text-xl font-bold text-white mb-2"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      Inquiry Received
                    </h3>
                    <p
                      className="text-sm text-[#64748B] max-w-sm"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      Our enterprise team will review and respond within one business day.
                      Qualified enterprise inquiries receive priority handling.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { name: 'name', label: 'Full Name', placeholder: 'Your full name', type: 'text', required: true },
                        { name: 'organization', label: 'Organization', placeholder: 'Company or institution', type: 'text', required: true },
                        { name: 'email', label: 'Business Email', placeholder: 'your@organization.com', type: 'email', required: true },
                        { name: 'phone', label: 'Phone (Optional)', placeholder: '+91 or +1 country code', type: 'tel', required: false },
                      ].map((field) => (
                        <div key={field.name}>
                          <label
                            htmlFor={field.name}
                            className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-mono mb-1.5"
                          >
                            {field.label}
                            {field.required && <span className="text-[#FF6B35] ml-1">*</span>}
                          </label>
                          <input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={form[field.name as keyof ContactForm]}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2A3B] rounded-lg text-sm text-[#E2E8F0] placeholder-[#2D3E54] focus:outline-none focus:border-[#00D4FF40] transition-colors"
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Inquiry Type */}
                    <div>
                      <label
                        htmlFor="inquiry"
                        className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-mono mb-1.5"
                      >
                        Inquiry Type <span className="text-[#FF6B35]">*</span>
                      </label>
                      <select
                        id="inquiry"
                        name="inquiry"
                        required
                        value={form.inquiry}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2A3B] rounded-lg text-sm text-[#E2E8F0] focus:outline-none focus:border-[#00D4FF40] transition-colors"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {inquiryTypes.map((t) => (
                          <option key={t.value} value={t.value} className="bg-[#111827]">
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-mono mb-1.5"
                      >
                        Subject <span className="text-[#FF6B35]">*</span>
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        placeholder="Brief description of your requirement"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2A3B] rounded-lg text-sm text-[#E2E8F0] placeholder-[#2D3E54] focus:outline-none focus:border-[#00D4FF40] transition-colors"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-mono mb-1.5"
                      >
                        Message <span className="text-[#FF6B35]">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        placeholder="Describe your use case, scale, compliance requirements, or technical questions..."
                        value={form.message}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2A3B] rounded-lg text-sm text-[#E2E8F0] placeholder-[#2D3E54] focus:outline-none focus:border-[#00D4FF40] transition-colors resize-none"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      />
                    </div>

                    {formState === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-[#EF4444] p-3 bg-[#EF444410] border border-[#EF444430] rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Submission failed. Please try again or email directly.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={formState === 'submitting'}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#00D4FF] text-[#0A0E1A] font-bold rounded-lg hover:bg-[#00E5FF] transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {formState === 'submitting' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        'Submit Enterprise Inquiry'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
