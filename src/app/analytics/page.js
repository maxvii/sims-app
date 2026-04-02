'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const FORMATS = [
  { label: 'Reel', value: 'reel' },
  { label: 'Carousel', value: 'carousel' },
  { label: 'Static', value: 'static' },
  { label: 'Story', value: 'story' },
]

const PLATFORMS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'X', value: 'x' },
]

function PillSelector({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt.value
        const l = typeof opt === 'string' ? opt : opt.label
        const active = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(active ? '' : v)}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{
              background: active ? '#363A47' : 'rgba(208,217,226,0.3)',
              color: active ? '#F7F9FA' : '#6B7B8D',
            }}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

// Convert number to High/Medium/Low label
function levelLabel(value, thresholds) {
  if (value == null) return null
  if (value >= thresholds.high) return { text: 'High', color: '#10B981', bg: 'rgba(16,185,129,0.1)' }
  if (value >= thresholds.mid) return { text: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
  return { text: 'Low', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
}

function LevelBadge({ label, level }) {
  if (!level) return null
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(54,58,71,0.06)' }}>
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className="text-xs font-bold px-3 py-1 rounded-full"
        style={{ background: level.bg, color: level.color }}
      >
        {level.text}
      </span>
    </div>
  )
}

function ClassificationBadge({ classification }) {
  const configs = {
    'Viral': { bg: '#DC2626', icon: '\u{1F525}' },
    'High Performing': { bg: '#F59E0B', icon: '\u{1F31F}' },
    'Baseline': { bg: '#3B82F6', icon: '\u{1F4CA}' },
    'Suppressed': { bg: '#94A3B8', icon: '\u{1F4A4}' },
  }
  const c = configs[classification] || configs['Baseline']
  return (
    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-black text-white" style={{ background: c.bg }}>
      <span className="mr-1.5">{c.icon}</span>
      {classification?.toUpperCase()}
    </span>
  )
}

export default function SimulatePage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const fileRef = useRef(null)

  const [format, setFormat] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [caption, setCaption] = useState('')
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaName, setMediaName] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { if (authStatus === 'unauthenticated') router.push('/login') }, [authStatus, router])

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

  async function handleSimulate() {
    if (!caption) { setError('Add a caption.'); return }
    if (!format) { setError('Pick a format.'); return }
    setLoading(true); setError(null); setResult(null)

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format, platform,
          topic: caption,
          caption,
          category: 'fashion_personal',
          postDate: new Date().toISOString().split('T')[0],
          description: mediaName ? `Uploaded: ${mediaName}` : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (authStatus === 'loading') return null

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-400 mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-800">Post Simulator</h1>
        <p className="text-xs text-gray-400 mt-0.5">Predict engagement levels for your content</p>
      </div>

      <div className="px-4 space-y-4">
        {!result ? (
          <>
            {/* Upload */}
            <div>
              {mediaPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  {mediaPreview.startsWith('data:video') ? (
                    <video src={mediaPreview} className="w-full max-h-40 object-cover rounded-xl" controls />
                  ) : (
                    <img src={mediaPreview} className="w-full max-h-40 object-cover rounded-xl" />
                  )}
                  <button onClick={() => { setMediaPreview(null); setMediaName('') }} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full py-6 rounded-xl border border-dashed flex flex-col items-center gap-1" style={{ borderColor: 'rgba(107,123,141,0.25)' }}>
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  <span className="text-[11px] text-gray-400">Upload (optional)</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Format */}
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Format</label>
              <PillSelector options={FORMATS} value={format} onChange={setFormat} />
            </div>

            {/* Platform */}
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Platform</label>
              <PillSelector options={PLATFORMS} value={platform} onChange={setPlatform} />
            </div>

            {/* Caption */}
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Caption</label>
              <textarea
                value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Write or paste your caption..."
                rows={3}
                className="w-full px-4 py-2.5 text-sm rounded-xl outline-none resize-none"
                style={{ background: 'rgba(54,58,71,0.04)', border: '1px solid rgba(54,58,71,0.08)', color: '#363A47' }}
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <button
              onClick={handleSimulate} disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
              style={{ background: '#363A47' }}
            >
              {loading ? 'Simulating...' : 'Simulate'}
            </button>

            <div className="h-4" />
          </>
        ) : (
          /* ═══ RESULTS ═══ */
          <>
            <button onClick={() => setResult(null)} className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              New
            </button>

            {/* Classification */}
            <div className="text-center py-4">
              <ClassificationBadge classification={result.classification} />
              <p className="text-xs text-gray-400 mt-2">Predicted performance level</p>
            </div>

            {/* Engagement Levels — High/Medium/Low instead of numbers */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(54,58,71,0.03)', border: '1px solid rgba(54,58,71,0.06)' }}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Engagement Levels</h3>
              <LevelBadge label="Likes" level={result.prediction?.likes ? levelLabel(result.prediction.likes.mid, { high: 2000, mid: 800 }) : null} />
              <LevelBadge label="Comments" level={result.prediction?.comments ? levelLabel(result.prediction.comments.mid, { high: 100, mid: 40 }) : null} />
              <LevelBadge label="Saves" level={result.prediction?.saves ? levelLabel(result.prediction.saves.mid, { high: 150, mid: 60 }) : null} />
              <LevelBadge label="Shares" level={result.prediction?.shares ? levelLabel(result.prediction.shares.mid, { high: 80, mid: 30 }) : null} />
              <LevelBadge label="Reach" level={result.prediction?.reach ? levelLabel(result.prediction.reach.mid, { high: 20000, mid: 8000 }) : null} />
              {result.prediction?.views && (
                <LevelBadge label="Views" level={levelLabel(result.prediction.views.mid, { high: 30000, mid: 12000 })} />
              )}
            </div>

            {/* Engagement Rate */}
            {result.engagementRate != null && (
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(54,58,71,0.03)', border: '1px solid rgba(54,58,71,0.06)' }}>
                <span className="text-sm text-gray-600">Engagement Rate</span>
                <span className="text-sm font-bold" style={{ color: result.engagementRate >= 5 ? '#10B981' : result.engagementRate >= 3 ? '#F59E0B' : '#EF4444' }}>
                  {result.engagementRate >= 5 ? 'High' : result.engagementRate >= 3 ? 'Medium' : 'Low'}
                </span>
              </div>
            )}

            {/* AI Analysis */}
            {result.qualitative && (
              <div className="space-y-3">
                {result.qualitative.strengths?.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Strengths</h3>
                    {result.qualitative.strengths.map((s, i) => (
                      <p key={i} className="text-sm text-gray-600 mb-1">- {s}</p>
                    ))}
                  </div>
                )}

                {result.qualitative.improvements?.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
                    <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Improvements</h3>
                    {result.qualitative.improvements.map((s, i) => (
                      <p key={i} className="text-sm text-gray-600 mb-1">- {s}</p>
                    ))}
                  </div>
                )}

                {result.qualitative.captionSuggestion && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(54,58,71,0.03)', border: '1px solid rgba(54,58,71,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Suggested Caption</h3>
                    <p className="text-sm text-gray-700 italic">"{result.qualitative.captionSuggestion}"</p>
                  </div>
                )}

                {result.qualitative.contentStrategy && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(54,58,71,0.03)', border: '1px solid rgba(54,58,71,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Strategy</h3>
                    <p className="text-sm text-gray-600">{result.qualitative.contentStrategy}</p>
                  </div>
                )}

                {result.qualitative.bestTimeToPost && (
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(54,58,71,0.03)', border: '1px solid rgba(54,58,71,0.06)' }}>
                    <span className="text-sm text-gray-600">Best Time</span>
                    <span className="text-sm font-semibold text-gray-800">{result.qualitative.bestTimeToPost}</span>
                  </div>
                )}

                {result.qualitative.recommendedHashtags?.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(54,58,71,0.03)', border: '1px solid rgba(54,58,71,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hashtags</h3>
                    <div className="flex flex-wrap gap-1">
                      {result.qualitative.recommendedHashtags.map((h, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(54,58,71,0.06)', color: '#6B7B8D' }}>#{h}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="h-6" />
          </>
        )}
      </div>

      <Navbar />
    </div>
  )
}
