'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

const FORMATS = [
  { label: 'Reel', value: 'reel' },
  { label: 'Carousel', value: 'carousel' },
  { label: 'Static Image', value: 'static' },
  { label: 'Story', value: 'story' },
]

const CATEGORIES = [
  { label: 'Fashion/OOTD', value: 'fashion_personal' },
  { label: 'Luxury Lifestyle', value: 'luxury_lifestyle' },
  { label: 'Behind the Scenes', value: 'behind_scenes' },
  { label: 'Cultural/Seasonal', value: 'cultural_seasonal' },
  { label: 'Female Empowerment', value: 'female_empowerment' },
  { label: 'Modest Fashion', value: 'modest_fashion' },
  { label: 'Promotion/Sale', value: 'promotion' },
  { label: 'Brand Collab', value: 'brand_collab' },
  { label: 'Corporate News', value: 'corporate_news' },
]

const PLATFORMS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'X', value: 'x' },
  { label: 'YouTube', value: 'youtube' },
]

const VISUAL_QUALITY = ['Premium', 'Good', 'Average']
const CAPTION_STRATEGY = ['Storytelling', 'Educational', 'CTA', 'Promotional', 'Inspirational']
const HASHTAG_COUNT = ['0', '1-3', '3-5', '6-10', '20+']
const FACES_OPTIONS = [
  { label: 'Yes (Self/Sima)', value: 'self' },
  { label: 'Yes (Others)', value: 'others' },
  { label: 'No', value: 'none' },
  { label: 'Product Only', value: 'product' },
]
const LANGUAGES = ['English', 'Arabic', 'Bilingual']
const ALT_TEXT_OPTIONS = ['Yes', 'No']

function PillSelector({ options, value, onChange, multi = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const optValue = typeof opt === 'string' ? opt : opt.value
        const optLabel = typeof opt === 'string' ? opt : opt.label
        const isActive = multi ? (value || []).includes(optValue) : value === optValue
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => {
              if (multi) {
                const arr = value || []
                onChange(isActive ? arr.filter(v => v !== optValue) : [...arr, optValue])
              } else {
                onChange(isActive ? '' : optValue)
              }
            }}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{
              background: isActive ? 'linear-gradient(135deg, #363A47, #6B7B8D)' : 'rgba(208,217,226,0.3)',
              color: isActive ? '#F7F9FA' : '#6B7B8D',
              border: isActive ? 'none' : '1px solid rgba(208,217,226,0.5)',
            }}
          >
            {optLabel}
          </button>
        )
      })}
    </div>
  )
}

function MultiplierBar({ label, value, isMax, isMin }) {
  const pct = Math.min(Math.max((value - 0.5) / 1.5 * 100, 5), 100)
  const barColor = value >= 1.2 ? '#10B981' : value >= 1.0 ? '#3B82F6' : value >= 0.8 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-24 text-[10px] font-medium text-right truncate" style={{ color: '#6B7B8D' }}>{label}</div>
      <div className="flex-1 h-5 rounded-full overflow-hidden relative" style={{ background: 'rgba(208,217,226,0.25)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
          style={{ width: `${pct}%`, background: barColor, minWidth: '30px' }}
        >
          <span className="text-[9px] font-bold text-white">{value.toFixed(2)}x</span>
        </div>
        {isMax && (
          <span className="absolute right-1 top-0.5 text-[8px] font-bold" style={{ color: '#10B981' }}>BEST</span>
        )}
        {isMin && (
          <span className="absolute right-1 top-0.5 text-[8px] font-bold" style={{ color: '#EF4444' }}>WEAK</span>
        )}
      </div>
    </div>
  )
}

function formatNum(n) {
  if (n == null) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function MetricRangeCard({ icon, label, low, mid, high, color }) {
  return (
    <div className="liquid-glass-card p-4 rounded-2xl animate-scale-in" style={{ background: 'rgba(255,255,255,0.6)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-black" style={{ color: color || '#363A47' }}>{formatNum(mid)}</div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[9px] font-medium" style={{ color: '#6B7B8D' }}>{formatNum(low)}</span>
        <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(208,217,226,0.3)' }}>
          <div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color || '#6B7B8D'}44, ${color || '#6B7B8D'})`, width: '100%' }} />
        </div>
        <span className="text-[9px] font-medium" style={{ color: '#6B7B8D' }}>{formatNum(high)}</span>
      </div>
    </div>
  )
}

function ClassificationBadge({ classification, wes, confidence }) {
  const configs = {
    'Viral': { bg: 'linear-gradient(135deg, #DC2626, #F97316)', icon: '\u{1F525}', text: '#fff' },
    'High Performing': { bg: 'linear-gradient(135deg, #F59E0B, #FBBF24)', icon: '\u{1F31F}', text: '#fff' },
    'Baseline': { bg: 'linear-gradient(135deg, #3B82F6, #60A5FA)', icon: '\u{1F4CA}', text: '#fff' },
    'Suppressed': { bg: 'linear-gradient(135deg, #94A3B8, #CBD5E1)', icon: '\u{1F4A4}', text: '#fff' },
  }
  const c = configs[classification] || configs['Baseline']
  return (
    <span
      className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-wide"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="mr-1.5">{c.icon}</span>
      {classification?.toUpperCase()}
    </span>
  )
}

export default function SimulatePage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const fileRef = useRef(null)

  // Form state
  const [format, setFormat] = useState('')
  const [category, setCategory] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [topic, setTopic] = useState('')
  const [caption, setCaption] = useState('')
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaName, setMediaName] = useState('')

  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [visualQuality, setVisualQuality] = useState('Good')
  const [captionStrategy, setCaptionStrategy] = useState('Storytelling')
  const [hashtagCount, setHashtagCount] = useState('3-5')
  const [hasFaces, setHasFaces] = useState('self')
  const [language, setLanguage] = useState('English')
  const [altText, setAltText] = useState('Yes')
  const [postDate, setPostDate] = useState(() => new Date().toISOString().split('T')[0])

  // Result state
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaName(file.name)
    if (file.type.startsWith('video/') && !format) setFormat('reel')
    else if (file.type.startsWith('image/') && !format) setFormat('static')
    const reader = new FileReader()
    reader.onload = (ev) => setMediaPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function clearMedia() {
    setMediaPreview(null)
    setMediaName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSimulate() {
    if (!topic && !caption) {
      setError('Please provide at least a topic or caption.')
      return
    }
    if (!format) {
      setError('Please select a format.')
      return
    }
    if (!category) {
      setError('Please select a category.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          category,
          platform,
          topic: topic || undefined,
          caption: caption || undefined,
          visualQuality: visualQuality.toLowerCase(),
          captionStrategy: captionStrategy.toLowerCase() === 'cta' ? 'explicit_cta' : captionStrategy.toLowerCase(),
          hashtagCount: hashtagCount === '0' ? 0 : hashtagCount === '1-3' ? 2 : hashtagCount === '3-5' ? 5 : hashtagCount === '6-10' ? 8 : 25,
          hasFaces: hasFaces === 'others' ? 'other' : hasFaces === 'none' ? 'no_scene' : hasFaces === 'product' ? 'product_only' : 'self',
          language: language.toLowerCase(),
          hasAltText: altText === 'Yes' ? 'present' : 'absent',
          postDate,
          description: mediaName ? `Uploaded media: ${mediaName}` : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Simulation failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  if (authStatus === 'loading') return null

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>
      {/* Header */}
      <div className="liquid-glass px-5 pt-12 pb-4 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <div className="relative z-10">
          <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="font-display text-2xl font-black italic" style={{ color: '#363A47' }}>Post Simulator</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI-powered performance predictions powered by 68 academic sources</p>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4 animate-fade-in">
        {!result ? (
          /* ═══════════════════ INPUT FORM ═══════════════════ */
          <>
            {/* Upload Area */}
            <div className="liquid-glass-card p-5 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: '#6B7B8D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                Upload Content
              </h3>
              {mediaPreview ? (
                <div className="relative">
                  {mediaPreview.startsWith('data:video') ? (
                    <video src={mediaPreview} className="w-full rounded-xl max-h-48 object-cover" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full rounded-xl max-h-48 object-cover" />
                  )}
                  <button
                    onClick={clearMedia}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(54,58,71,0.7)', color: '#fff' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="mt-2 text-[10px] text-gray-400 truncate">{mediaName}</div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-colors"
                  style={{ borderColor: 'rgba(107,123,141,0.3)', background: 'rgba(247,249,250,0.5)' }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Upload image or video</span>
                  <span className="text-[10px] text-gray-400">Optional — for visual reference</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Format */}
            <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Format</label>
              <PillSelector options={FORMATS} value={format} onChange={setFormat} />
            </div>

            {/* Category */}
            <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Category</label>
              <PillSelector options={CATEGORIES} value={category} onChange={setCategory} />
            </div>

            {/* Platform */}
            <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Platform</label>
              <PillSelector options={PLATFORMS} value={platform} onChange={setPlatform} />
            </div>

            {/* Topic */}
            <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Topic / Theme</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Mother's Day, Ramadan Collection, Store Opening..."
                className="liquid-glass-input w-full px-4 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none rounded-xl"
                style={{ color: '#363A47' }}
              />
            </div>

            {/* Caption */}
            <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write your caption or paste existing text..."
                rows={3}
                className="liquid-glass-input w-full px-4 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none resize-none rounded-xl"
                style={{ color: '#363A47' }}
              />
            </div>

            {/* Advanced Settings */}
            <div className="liquid-glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-4 py-3 flex items-center justify-between"
              >
                <span className="text-xs font-bold" style={{ color: '#363A47' }}>
                  <span className="mr-2">\u2699\uFE0F</span>Advanced Settings
                </span>
                <svg
                  className="w-4 h-4 transition-transform duration-300"
                  style={{ color: '#6B7B8D', transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAdvanced && (
                <div className="px-4 pb-4 space-y-4 animate-fade-in">
                  {/* Visual Quality */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Visual Quality</label>
                    <PillSelector options={VISUAL_QUALITY} value={visualQuality} onChange={setVisualQuality} />
                  </div>

                  {/* Caption Strategy */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Caption Strategy</label>
                    <PillSelector options={CAPTION_STRATEGY} value={captionStrategy} onChange={setCaptionStrategy} />
                  </div>

                  {/* Hashtag Count */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Hashtag Count</label>
                    <PillSelector options={HASHTAG_COUNT} value={hashtagCount} onChange={setHashtagCount} />
                  </div>

                  {/* Has Faces */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Has Faces</label>
                    <PillSelector options={FACES_OPTIONS} value={hasFaces} onChange={setHasFaces} />
                  </div>

                  {/* Language */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Language</label>
                    <PillSelector options={LANGUAGES} value={language} onChange={setLanguage} />
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Alt Text</label>
                    <PillSelector options={ALT_TEXT_OPTIONS} value={altText} onChange={setAltText} />
                  </div>

                  {/* Post Date */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Post Date</label>
                    <input
                      type="date"
                      value={postDate}
                      onChange={e => setPostDate(e.target.value)}
                      className="liquid-glass-input w-full px-4 py-2.5 text-sm focus:outline-none rounded-xl"
                      style={{ color: '#363A47' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl text-sm text-red-600 font-medium" style={{ background: 'rgba(220,38,38,0.08)' }}>
                {error}
              </div>
            )}

            {/* Simulate Button */}
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all liquid-gradient-btn flex items-center justify-center gap-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin" style={{ borderTopColor: '#fff' }} />
                  Simulating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  Simulate Performance
                </>
              )}
            </button>

            <div className="h-2" />
          </>
        ) : (
          /* ═══════════════════ RESULTS VIEW ═══════════════════ */
          <>
            {/* Back link */}
            <button onClick={handleReset} className="flex items-center gap-1 text-xs font-medium mb-1" style={{ color: '#6B7B8D' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              New Simulation
            </button>

            {/* ── 1. HERO CARD ── */}
            <div className="liquid-glass-card p-6 rounded-2xl text-center animate-scale-in" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="mb-3">
                <ClassificationBadge classification={result.classification} />
              </div>

              {/* WES Score */}
              <div className="mb-2">
                <div className="text-5xl font-black font-display" style={{ color: '#363A47' }}>
                  {result.weightedEngagementScore != null ? result.weightedEngagementScore.toFixed(1) : '—'}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">Weighted Engagement Score</div>
              </div>

              {/* Engagement Rate */}
              {result.engagementRate != null && (
                <div className="text-sm font-bold mt-2" style={{ color: '#6B7B8D' }}>
                  {result.engagementRate}% engagement rate
                </div>
              )}

              {/* Confidence */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(54,58,71,0.06)', color: '#6B7B8D' }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                85-90% confidence | 68 sources
              </div>
            </div>

            {/* ── 2. PREDICTED METRICS GRID ── */}
            {result.prediction && (
              <div className="grid grid-cols-2 gap-3">
                {result.prediction.likes && (
                  <MetricRangeCard
                    icon={"\u2764\uFE0F"}
                    label="Likes"
                    low={result.prediction.likes.low}
                    mid={result.prediction.likes.mid}
                    high={result.prediction.likes.high}
                    color="#EF4444"
                  />
                )}
                {result.prediction.comments && (
                  <MetricRangeCard
                    icon={"\u{1F4AC}"}
                    label="Comments"
                    low={result.prediction.comments.low}
                    mid={result.prediction.comments.mid}
                    high={result.prediction.comments.high}
                    color="#3B82F6"
                  />
                )}
                {result.prediction.saves && (
                  <MetricRangeCard
                    icon={"\u{1F516}"}
                    label="Saves"
                    low={result.prediction.saves.low}
                    mid={result.prediction.saves.mid}
                    high={result.prediction.saves.high}
                    color="#8B5CF6"
                  />
                )}
                {result.prediction.shares && (
                  <MetricRangeCard
                    icon={"\u{1F4E4}"}
                    label="Shares"
                    low={result.prediction.shares.low}
                    mid={result.prediction.shares.mid}
                    high={result.prediction.shares.high}
                    color="#10B981"
                  />
                )}
                {result.prediction.reach && (
                  <MetricRangeCard
                    icon={"\u{1F441}\uFE0F"}
                    label="Reach"
                    low={result.prediction.reach.low}
                    mid={result.prediction.reach.mid}
                    high={result.prediction.reach.high}
                    color="#F59E0B"
                  />
                )}
                {result.prediction.views && format === 'reel' && (
                  <MetricRangeCard
                    icon={"\u25B6\uFE0F"}
                    label="Views"
                    low={result.prediction.views.low}
                    mid={result.prediction.views.mid}
                    high={result.prediction.views.high}
                    color="#6366F1"
                  />
                )}
              </div>
            )}

            {/* ── 3. MULTIPLIER BREAKDOWN ── */}
            {result.multiplierBreakdown && (
              <div className="liquid-glass-card p-5 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold" style={{ color: '#363A47' }}>Multiplier Breakdown</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)', color: '#fff' }}>
                    {result.multiplierBreakdown.totalContextMultiplier?.toFixed(2)}x total
                  </span>
                </div>
                {(() => {
                  const mb = result.multiplierBreakdown
                  const entries = [
                    ['Category', mb.category?.multiplier],
                    ['Season', mb.season?.multiplier],
                    ['Time', mb.timeOfDay?.multiplier],
                    ['Day', mb.dayOfWeek?.multiplier],
                    ['Quality', mb.visualQuality?.multiplier],
                    ['Caption', mb.captionStrategy?.multiplier],
                    ['Hashtags', mb.hashtags?.multiplier],
                    ['Faces', mb.faces?.multiplier],
                    ['Language', mb.language?.multiplier],
                    ['Dimensions', mb.dimensions?.multiplier],
                    ['Alt Text', mb.altText?.multiplier],
                  ].filter(([, v]) => v != null)
                  const values = entries.map(([, v]) => v)
                  const maxVal = Math.max(...values)
                  const minVal = Math.min(...values)
                  return entries.map(([key, val]) => (
                    <MultiplierBar
                      key={key}
                      label={key}
                      value={val}
                      isMax={val === maxVal && val > 1.0}
                      isMin={val === minVal && val < 1.0}
                    />
                  ))
                })()}
              </div>
            )}

            {/* ── 4. ACTIVE SEASON ── */}
            {result.multiplierBreakdown?.season?.event && (
              <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(245,158,11,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)' }}>
                    {"\u{1F389}"}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#363A47' }}>{result.multiplierBreakdown.season.event}</div>
                    <div className="text-[11px]" style={{ color: '#6B7B8D' }}>
                      +{((result.multiplierBreakdown.season.multiplier - 1) * 100).toFixed(0)}% seasonal boost active
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. QUALITATIVE ANALYSIS ── */}
            {result.qualitative && (
              <>
                {/* Strengths */}
                {result.qualitative.strengths?.length > 0 && (
                  <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(16,185,129,0.04)' }}>
                    <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span style={{ color: '#10B981' }}>{"\u2713"}</span> Strengths
                    </h3>
                    <ul className="space-y-1.5">
                      {result.qualitative.strengths.map((s, i) => (
                        <li key={i} className="text-[11px] text-gray-600 leading-snug flex gap-1.5">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">{"\u2022"}</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {result.qualitative.improvements?.length > 0 && (
                  <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(245,158,11,0.04)' }}>
                    <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span style={{ color: '#F59E0B' }}>{"\u26A0"}</span> Areas to Improve
                    </h3>
                    <ul className="space-y-1.5">
                      {result.qualitative.improvements.map((s, i) => (
                        <li key={i} className="text-[11px] text-gray-600 leading-snug flex gap-1.5">
                          <span className="text-amber-500 mt-0.5 flex-shrink-0">{"\u2022"}</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Caption Suggestion */}
                {result.qualitative.captionSuggestion && (
                  <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>{"\u270F\uFE0F"}</span> Suggested Caption
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      &ldquo;{result.qualitative.captionSuggestion}&rdquo;
                    </p>
                  </div>
                )}

                {/* Content Strategy */}
                {result.qualitative.contentStrategy && (
                  <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>{"\u{1F3AF}"}</span> Content Strategy
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{result.qualitative.contentStrategy}</p>
                  </div>
                )}

                {/* Timing Analysis */}
                {result.qualitative.timingAnalysis && (
                  <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>{"\u{1F4C5}"}</span> Timing Analysis
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{result.qualitative.timingAnalysis}</p>
                  </div>
                )}

                {/* Best Time to Post */}
                {result.qualitative.bestTimeToPost && (
                  <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}>
                        <span className="text-white text-sm">{"\u{1F552}"}</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">Best Time to Post</div>
                        <div className="text-sm font-bold" style={{ color: '#363A47' }}>{result.qualitative.bestTimeToPost}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommended Hashtags */}
                {result.qualitative.recommendedHashtags?.length > 0 && (
                  <div className="liquid-glass-card p-4 rounded-2xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>#</span> Recommended Hashtags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.qualitative.recommendedHashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="pill-tag px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background: 'rgba(54,58,71,0.08)', color: '#363A47' }}
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── 6. NEW SIMULATION BUTTON ── */}
            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl font-bold text-sm liquid-gradient-btn flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
              New Simulation
            </button>

            <div className="h-4" />
          </>
        )}
      </div>

      <Navbar />
    </div>
  )
}
