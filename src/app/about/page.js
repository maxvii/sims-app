'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from '@/components/Navbar'

export default function AboutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (!session) return null

  const achievements = [
    { label: 'Forbes Top 100', value: '#12', sub: 'Businesswomen 2024 & 2025' },
    { label: 'Shark Tank Dubai', value: 'S2', sub: 'Panelist' },
    { label: 'YPO MENA STAR', value: 'Founder', sub: 'First female member, 52% female chapter' },
    { label: 'Retail Stores', value: '2,200+', sub: 'Across the globe' },
    { label: 'Countries', value: '14', sub: 'International presence' },
  ]

  return (
    <div className="min-h-screen pb-safe-nav">
      {/* Back button */}
      <div className="absolute top-12 left-5 z-20">
        <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-white/80 hover:text-white backdrop-blur-sm bg-black/20 rounded-full px-3 py-1.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
      </div>

      {/* ── Hero Section ── */}
      <div className="relative w-full h-[520px] overflow-hidden animate-fade-in">
        <img
          src="/images/sima-office.jpg"
          alt="Sima Ganwani Ved"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(54,58,71,0.15) 0%, rgba(54,58,71,0.35) 50%, rgba(61,34,64,0.92) 100%)',
          }}
        />
        {/* name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <p className="font-script text-[#D0D9E2] text-lg mb-1 opacity-90">Founder &amp; Chairwoman</p>
          <h1 className="font-display text-4xl font-bold text-[#F7F9FA] leading-tight tracking-tight">
            Sima Ganwani Ved
          </h1>
          <p className="text-[#D0D9E2]/80 text-sm mt-2 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Dubai, UAE
          </p>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-10 space-y-6">
        {/* ── Bio Section ── */}
        <section className="liquid-glass-card p-6 animate-slide-up">
          <h2 className="font-display text-xl font-semibold gradient-text mb-4">The Visionary</h2>
          <div className="space-y-3 text-sm leading-relaxed text-[#2B2E38]/85">
            <p>
              Born in Africa and raised in Dubai, Sima Ganwani Ved began her retail journey managing
              a department in her father&apos;s shopping mall in the early 1990s. With an unwavering
              vision for luxury retail, she founded <strong>Apparel Group</strong> in 1999 &mdash; and
              transformed it into one of the Middle East&apos;s largest fashion conglomerates.
            </p>
            <p>
              Today, Apparel Group operates <strong>2,200+ stores</strong> across{' '}
              <strong>14 countries</strong>, employing over <strong>22,000 people</strong> worldwide. Its
              portfolio includes globally renowned brands such as Guess, Tommy Hilfiger, Aldo, Steve
              Madden, Adidas, and Rituals.
            </p>
            <p>
              Beyond retail, Sima has championed new ventures including{' '}
              <strong>F5 Global</strong> (athleisure, with her daughter),{' '}
              <strong>NESSA</strong> (a beauty platform with her eldest daughter Selina), and the TV
              show <em>Hi Tea with Sima Ved</em> on Star Plus International (2010).
            </p>
          </div>
        </section>

        {/* ── Social Links ── */}
        <section className="flex gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <a
            href="https://instagram.com/thesimaved"
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass-card flex-1 flex items-center gap-3 p-4 no-underline"
          >
            {/* Instagram icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#F7F9FA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#6B7B8D] font-medium">Instagram</p>
              <p className="text-sm font-semibold text-[#363A47]">@thesimaved</p>
            </div>
          </a>

          <a
            href="https://linkedin.com/in/thesimaved"
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass-card flex-1 flex items-center gap-3 p-4 no-underline"
          >
            {/* LinkedIn icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#F7F9FA]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#6B7B8D] font-medium">LinkedIn</p>
              <p className="text-sm font-semibold text-[#363A47]">@thesimaved</p>
            </div>
          </a>
        </section>

        {/* ── Philanthropy ── */}
        <section className="editorial-card p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="font-display text-lg font-semibold text-[#363A47] mb-3">Philanthropy &amp; Impact</h2>
          <p className="text-sm leading-relaxed text-[#2B2E38]/80">
            A passionate philanthropreneur, Sima dedicates herself to education, women&apos;s
            empowerment, and social welfare across the Middle East. She was named{' '}
            <strong>Philanthropreneur of the Year</strong> and founded the{' '}
            <strong>YPO MENA STAR chapter</strong> &mdash; becoming its first female member and
            growing it to a 52% female chapter.
          </p>
        </section>

        {/* ── Achievements Horizontal Scroll ── */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-display text-lg font-semibold gradient-text mb-4 px-1">Achievements</h2>
          <div className="touch-scroll-x flex gap-3 -mx-5 px-5">
            {achievements.map((item, i) => (
              <div
                key={i}
                className="liquid-glass-card shrink-0 p-5 flex flex-col items-center text-center"
                style={{ width: '150px', minHeight: '140px' }}
              >
                <span
                  className="font-display text-2xl font-bold mb-1"
                  style={{
                    background: 'linear-gradient(135deg, #363A47, #6B7B8D)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {item.value}
                </span>
                <span className="text-xs font-semibold text-[#363A47] mb-1">{item.label}</span>
                <span className="text-[10px] leading-tight text-[#6B7B8D]/70">{item.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Brands Banner ── */}
        <section className="editorial-card p-5 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="font-display text-base font-semibold text-[#363A47] mb-3">Brand Portfolio</h3>
          <div className="flex flex-wrap gap-2">
            {['Guess', 'Tommy Hilfiger', 'Aldo', 'Steve Madden', 'Adidas', 'Rituals'].map((brand) => (
              <span
                key={brand}
                className="liquid-glass-pill px-3 py-1.5 text-xs font-medium text-[#363A47]"
              >
                {brand}
              </span>
            ))}
          </div>
        </section>

        {/* ── Quote ── */}
        <section
          className="rounded-2xl p-6 text-center animate-slide-up"
          style={{
            animationDelay: '0.3s',
            background: 'linear-gradient(135deg, #363A47, #6B7B8D)',
          }}
        >
          <p className="font-script text-2xl text-[#D0D9E2] mb-2">
            &ldquo;Empowering women, one opportunity at a time.&rdquo;
          </p>
          <p className="text-xs text-[#F7F9FA]/60 tracking-widest uppercase">Sima Ganwani Ved</p>
        </section>
      </div>

      <Navbar />
    </div>
  )
}
