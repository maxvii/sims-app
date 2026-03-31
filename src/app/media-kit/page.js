'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

const BRANDS = [
  { name: 'Guess', cat: 'Fashion' },
  { name: 'Tommy Hilfiger', cat: 'Fashion' },
  { name: 'Calvin Klein', cat: 'Fashion' },
  { name: 'DKNY', cat: 'Fashion' },
  { name: 'Aeropostale', cat: 'Fashion' },
  { name: 'Nine West', cat: 'Fashion' },
  { name: 'Aldo', cat: 'Footwear' },
  { name: 'Skechers', cat: 'Footwear' },
  { name: 'Charles & Keith', cat: 'Footwear' },
  { name: "Victoria's Secret", cat: 'Lifestyle' },
  { name: 'Tim Hortons', cat: 'F&B' },
  { name: 'Rituals', cat: 'Lifestyle' },
]

const STATS = [
  { value: '2,200+', label: 'Retail Stores' },
  { value: '14', label: 'Countries' },
  { value: '22,000+', label: 'Employees' },
  { value: '80+', label: 'Brands' },
]

const ACHIEVEMENTS = [
  { title: 'Forbes Top 100', detail: '#12 Most Powerful Businesswomen', year: '2024 & 2025' },
  { title: 'Shark Tank Dubai', detail: 'Season 2 Panelist', year: '2025' },
  { title: 'YPO MENA STAR', detail: 'Founder & First Female Member', year: '' },
  { title: 'Retail ME Awards', detail: 'Retail Leader of the Year', year: '' },
]

const SOCIAL_LINKS = [
  { name: 'Instagram', handle: '@thesimaved', url: 'https://instagram.com/thesimaved', color: '#E4405F' },
  { name: 'LinkedIn', handle: 'Sima Ganwani Ved', url: 'https://linkedin.com/in/simaved', color: '#0A66C2' },
  { name: 'Website', handle: 'simaved.com', url: 'https://simaved.com', color: '#502D55' },
]

function Section({ title, children }) {
  return (
    <div className="animate-fade-in">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{title}</h3>
      {children}
    </div>
  )
}

export default function MediaKitPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('card')

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  if (authStatus === 'loading') return null

  const tabs = [
    { id: 'card', label: 'Business Card' },
    { id: 'brands', label: 'Portfolio' },
    { id: 'press', label: 'Press' },
  ]

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F8F4E9' }}>
      {/* Header */}
      <div className="liquid-glass px-5 pt-12 pb-4 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <div className="relative z-10">
          <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="font-display text-3xl font-black italic text-gray-800">Media Kit</h1>
          <p className="text-xs text-gray-500">Press assets & brand materials</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 px-4 mt-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, #502D55, #935073)' : 'rgba(255,255,255,0.5)',
              color: activeTab === tab.id ? '#fff' : '#888',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-5 space-y-5">
        {/* ── BUSINESS CARD TAB ── */}
        {activeTab === 'card' && (
          <div className="space-y-5 animate-fade-in">
            {/* Digital Business Card */}
            <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #502D55 0%, #935073 50%, #F6DBC0 100%)' }}>
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10" style={{ background: '#fff' }} />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10" style={{ background: '#fff' }} />

              <div className="relative p-6">
                {/* Photo + Name */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0">
                    <img src="/images/sima-hero.jpg" alt="Sima Ved" className="w-full h-full object-cover" onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/images/sima-office.jpg'
                    }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">Sima Ganwani Ved</h2>
                    <p className="text-white/70 text-xs font-medium mt-0.5">Founder & Chairwoman</p>
                    <p className="text-white/50 text-[10px] mt-0.5">Apparel Group, Dubai</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {STATS.map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-white font-black text-sm">{s.value}</div>
                      <div className="text-white/50 text-[8px] font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/10 mb-4" />

                {/* Contact row */}
                <div className="flex gap-2">
                  {SOCIAL_LINKS.map(link => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl text-center text-[10px] font-semibold text-white/90 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.15)' }}
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Bio */}
            <Section title="About">
              <div className="liquid-glass-card p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Sima Ganwani Ved is the Founder & Chairwoman of Apparel Group, one of the largest fashion and lifestyle retail conglomerates in the Middle East. With over 2,200 stores across 14 countries and 80+ international brands, she has built an empire spanning fashion, footwear, lifestyle, and F&B.
                </p>
                <p className="text-xs text-gray-600 leading-relaxed mt-2">
                  Ranked #12 on Forbes' Most Powerful Businesswomen list, she is also a Shark Tank Dubai Season 2 panelist and founder of YPO MENA STAR chapter.
                </p>
              </div>
            </Section>

            {/* Achievements */}
            <Section title="Key Achievements">
              <div className="space-y-2">
                {ACHIEVEMENTS.map((a, i) => (
                  <div key={i} className="liquid-glass-card p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${i % 2 === 0 ? '#502D55' : '#935073'}, ${i % 2 === 0 ? '#935073' : '#F6DBC0'})` }}>
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-700">{a.title}</div>
                      <div className="text-[10px] text-gray-400">{a.detail} {a.year && `(${a.year})`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Social Links */}
            <Section title="Connect">
              <div className="space-y-2">
                {SOCIAL_LINKS.map(link => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="liquid-glass-card p-3 rounded-xl flex items-center gap-3 hover:scale-[1.01] transition-transform"
                    style={{ background: 'rgba(255,255,255,0.6)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: link.color }}>
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-700">{link.name}</div>
                      <div className="text-[10px] text-gray-400">{link.handle}</div>
                    </div>
                  </a>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {activeTab === 'brands' && (
          <div className="space-y-5 animate-fade-in">
            {/* Overview */}
            <div className="liquid-glass-card p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <h3 className="text-sm font-bold text-gray-700 mb-1">Brand Portfolio</h3>
              <p className="text-[10px] text-gray-400 mb-4">80+ international brands across multiple categories</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {STATS.map(s => (
                  <div key={s.label} className="text-center p-2 rounded-xl" style={{ background: 'rgba(80,45,85,0.05)' }}>
                    <div className="text-sm font-black" style={{ color: '#502D55' }}>{s.value}</div>
                    <div className="text-[8px] text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Grid */}
            <Section title="Featured Brands">
              <div className="grid grid-cols-2 gap-2">
                {BRANDS.map((brand, i) => (
                  <div
                    key={brand.name}
                    className="liquid-glass-card p-3.5 rounded-xl flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.6)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${
                          ['#502D55', '#935073', '#7B3F5E', '#B86B8A', '#6A4C6D', '#C98BA5'][i % 6]
                        }, ${
                          ['#935073', '#F6DBC0', '#935073', '#F6DBC0', '#935073', '#F6DBC0'][i % 6]
                        })`,
                      }}
                    >
                      {brand.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-700 truncate">{brand.name}</div>
                      <div className="text-[9px] text-gray-400">{brand.cat}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Categories */}
            <Section title="Sectors">
              {['Fashion & Apparel', 'Footwear & Accessories', 'Lifestyle & Beauty', 'Food & Beverage'].map((sector, i) => (
                <div
                  key={sector}
                  className="liquid-glass-card p-3 rounded-xl flex items-center gap-3 mb-2"
                  style={{ background: 'rgba(255,255,255,0.6)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: ['#502D55', '#935073', '#7B3F5E', '#F6DBC0'][i] }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />}
                      {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />}
                      {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />}
                      {i === 3 && <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />}
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-gray-700">{sector}</div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* ── PRESS TAB ── */}
        {activeTab === 'press' && (
          <div className="space-y-5 animate-fade-in">
            {/* Press Contact */}
            <div className="liquid-glass-card p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <h3 className="text-sm font-bold text-gray-700 mb-1">Press Inquiries</h3>
              <p className="text-[10px] text-gray-400 mb-4">For interviews, features, and media requests</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(80,45,85,0.05)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#935073' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-xs text-gray-600">press@apparelgroup.com</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(80,45,85,0.05)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#935073' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  <span className="text-xs text-gray-600">simaved.com</span>
                </div>
              </div>
            </div>

            {/* Key Facts */}
            <Section title="Key Facts">
              <div className="liquid-glass-card p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                {[
                  { q: 'Full Name', a: 'Sima Ganwani Ved' },
                  { q: 'Title', a: 'Founder & Chairwoman, Apparel Group' },
                  { q: 'Headquarters', a: 'Dubai, United Arab Emirates' },
                  { q: 'Industry', a: 'Fashion, Retail & Lifestyle' },
                  { q: 'Portfolio', a: '80+ international brands' },
                  { q: 'Global Presence', a: '2,200+ stores in 14 countries' },
                  { q: 'Team', a: '22,000+ employees worldwide' },
                  { q: 'Instagram', a: '@thesimaved' },
                ].map(item => (
                  <div key={item.q} className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-400 w-20 flex-shrink-0 pt-0.5">{item.q}</span>
                    <span className="text-xs font-medium text-gray-700">{item.a}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Speaking Topics */}
            <Section title="Speaking Topics">
              <div className="space-y-2">
                {[
                  'Building a Global Retail Empire from Dubai',
                  'Women in Leadership & Entrepreneurship',
                  'Scaling Multi-Brand Portfolio Strategy',
                  'Fashion & Technology in the Middle East',
                  'Philanthropy & Corporate Social Responsibility',
                ].map((topic, i) => (
                  <div
                    key={i}
                    className="liquid-glass-card p-3 rounded-xl flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.6)' }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#935073' }}>
                      {i + 1}
                    </div>
                    <span className="text-xs text-gray-700 font-medium">{topic}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Brand Guidelines Note */}
            <div className="liquid-glass-card p-4 rounded-2xl text-center" style={{ background: 'rgba(80,45,85,0.05)' }}>
              <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#935073' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p className="text-xs text-gray-500 leading-relaxed">
                Brand guidelines, logos, and press-ready imagery are available upon request. Contact the press team for high-resolution assets.
              </p>
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      <Navbar />
    </div>
  )
}
