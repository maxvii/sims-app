'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MediaGallery from '@/components/MediaGallery'
import GradientSpheres from '@/components/GradientSpheres'

const statusColors = {
  'Not Started': 'bg-gray-100/80 text-gray-500',
  'Approved': 'bg-emerald-50/80 text-emerald-600',
  'Rescheduled': 'bg-amber-50/80 text-amber-600',
  'Cancelled': 'bg-red-50/80 text-red-500',
  'Published': 'bg-purple-50/80 text-purple-600',
}

function computeStatus(event) {
  const approvals = event.approvals || []
  const artworkApprovals = approvals.filter(a => a.tab === 'artwork')
  const mediaApprovals = approvals.filter(a => a.tab === 'media')
  const copyApprovals = approvals.filter(a => a.tab === 'copywriting')

  const latestArtwork = artworkApprovals[0]
  const latestMedia = mediaApprovals[0]
  const latestCopy = copyApprovals[0]

  // Check for any rejections
  if (latestArtwork?.status === 'REJECTED' || latestMedia?.status === 'REJECTED' || latestCopy?.status === 'REJECTED') {
    return 'Needs Revision'
  }

  // Check if all 3 are approved
  const artApproved = latestArtwork?.status === 'APPROVED'
  const medApproved = latestMedia?.status === 'APPROVED'
  const copyApproved = latestCopy?.status === 'APPROVED'

  if (artApproved && medApproved && copyApproved) return 'Approved'

  // If any tab has an approval submitted
  if (artApproved || medApproved || copyApproved) return 'In Progress'

  // Check creative brief due date
  if (event.creativeBriefDue) {
    try {
      const parts = event.creativeBriefDue.split(' ')
      const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
      const d = new Date(parseInt(parts[2]), MONTHS[parts[1]], parseInt(parts[0]))
      if (d < new Date()) return 'Planned'
    } catch {}
  }

  return 'Not Started'
}

const CATEGORIES = ['Social/Key Moments', 'Corporate Campaign', 'Corporate Event', 'Sponsorships', 'Gifting', 'PR Birthdays', 'HR & CSR', 'Coca Cola Arena']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function EventDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('artwork')
  const [comment, setComment] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [refUrl, setRefUrl] = useState('')
  const [refTitle, setRefTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [media, setMedia] = useState([])
  const [showEdit, setShowEdit] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)

  const fetchEvent = () => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then(setEvent)
      .catch(() => {})
  }

  const fetchMedia = () => {
    fetch(`/api/media?eventId=${params.id}`)
      .then((r) => r.json())
      .then(setMedia)
      .catch(() => {})
  }

  useEffect(() => { fetchEvent(); fetchMedia() }, [params.id])

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-[#9AAAB8] border-t-[#6B7B8D] rounded-full animate-spin" />
    </div>
  )

  const computedStatus = computeStatus(event)

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment, eventId: event.id, tab: 'copywriting' }),
    })
    setComment('')
    setSubmitting(false)
    fetchEvent()
  }

  const handleApproval = async (status, tab) => {
    setSubmitting(true)
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, status, note: approvalNote, tab }),
    })
    setApprovalNote('')
    setSubmitting(false)
    fetchEvent()
  }

  const handleAddRef = async (e) => {
    e.preventDefault()
    if (!refUrl.trim() || !refTitle.trim()) return
    setSubmitting(true)
    await fetch('/api/references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, url: refUrl, title: refTitle, type: refUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? 'IMAGE' : 'LINK' }),
    })
    setRefUrl('')
    setRefTitle('')
    setSubmitting(false)
    fetchEvent()
  }

  const tabs = [
    { id: 'artwork', label: 'Artwork' },
    { id: 'media', label: `Media (${media.length})` },
    { id: 'copywriting', label: 'Copywriting' },
  ]

  // Filter approvals by tab
  const getTabApprovals = (tab) => (event.approvals || []).filter(a => a.tab === tab)

  return (
    <div className="min-h-screen pb-safe-nav">
      {/* ── Header ── */}
      <div className="liquid-glass px-5 pt-12 pb-5 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 mb-3 hover:text-gray-700 relative z-10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`pill-tag text-[10px] ${statusColors[computedStatus] || 'bg-gray-100/80 text-gray-500'}`}>{computedStatus}</span>
              {event.category && (
                <span className="pill-tag text-[10px] bg-[#6B7B8D]/10 text-[#6B7B8D]">{event.category}</span>
              )}
            </div>
            <h1 className="font-display text-xl font-black italic text-gray-800 mb-1">{event.title}</h1>
            <p className="text-sm text-gray-500">{event.date}{event.endDate ? ` -- ${event.endDate}` : ''}</p>
          </div>
          <span className="font-display text-3xl font-black italic text-lavender/60">#{event.number}</span>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-2 px-4 pt-4">
        <button
          onClick={() => setShowEdit(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: 'rgba(54,58,71,0.06)', color: '#363A47', border: '1px solid rgba(54,58,71,0.1)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
          Edit
        </button>
        <button
          onClick={() => setShowReschedule(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: 'rgba(59,130,246,0.06)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          Reschedule
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 px-4 pt-3 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#6B7B8D] text-white shadow-md' : 'liquid-glass-pill text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="px-4 pt-4 animate-fade-in">

        {/* ========== ARTWORK TAB ========== */}
        {activeTab === 'artwork' && (
          <div className="space-y-4">
            {/* Deadlines Grid */}
            <div className="liquid-glass-card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Creative Deadlines</h3>
              <div className="grid grid-cols-2 gap-3">
                <DeadlineCell label="Brief Due" value={event.creativeBriefDue} />
                <DeadlineCell label="Round 1" value={event.round1Due} />
                <DeadlineCell label="Round 2" value={event.round2Due} />
                <DeadlineCell label="Final Creative" value={event.finalCreativeDue} />
              </div>
            </div>

            {/* Visual Direction */}
            <InfoCard title="Visual Direction" content={event.visualDirection} />

            {/* Post Concept */}
            <InfoCard title="Post Concept" content={event.postConcept} />

            {/* Opportunity Type */}
            <InfoCard title="Opportunity Type" content={event.opportunityType} />

            {/* Target Platforms */}
            <InfoCard title="Target Platforms" content={event.platforms} />

            {/* Notes */}
            {event.notes && <InfoCard title="Notes" content={event.notes} />}

            {/* References Section */}
            <div className="liquid-glass-card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">References</h3>

              {event.references?.length > 0 && (
                <div className="space-y-2 mb-4">
                  {event.references.map((r) => (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl bg-white/40 hover:bg-white/60 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-[#6B7B8D]/10 flex items-center justify-center flex-shrink-0">
                        {r.type === 'IMAGE' ? (
                          <svg className="w-4 h-4 text-[#6B7B8D]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        ) : (
                          <svg className="w-4 h-4 text-[#6B7B8D]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{r.title}</p>
                        <p className="text-[10px] text-gray-500">by {r.user.name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Add Reference Form */}
              <form onSubmit={handleAddRef} className="space-y-2">
                <input
                  value={refTitle}
                  onChange={(e) => setRefTitle(e.target.value)}
                  placeholder="Reference title..."
                  className="w-full bg-white/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6B7B8D]/20 border border-white/40"
                />
                <input
                  value={refUrl}
                  onChange={(e) => setRefUrl(e.target.value)}
                  placeholder="URL or image link..."
                  className="w-full bg-white/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6B7B8D]/20 border border-white/40"
                />
                <button type="submit" disabled={submitting || !refUrl.trim() || !refTitle.trim()} className="liquid-gradient-btn px-4 py-2 text-sm disabled:opacity-50">
                  Add Reference
                </button>
              </form>
            </div>

            {/* Artwork Approval */}
            <ApprovalSection
              tab="artwork"
              approvals={getTabApprovals('artwork')}
              approvalNote={approvalNote}
              setApprovalNote={setApprovalNote}
              handleApproval={handleApproval}
              submitting={submitting}
              session={session}
            />
          </div>
        )}

        {/* ========== MEDIA TAB ========== */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <MediaGallery eventId={event.id} media={media} onRefresh={() => { fetchMedia(); fetchEvent() }} />

            {/* Media Approval */}
            <ApprovalSection
              tab="media"
              approvals={getTabApprovals('media')}
              approvalNote={approvalNote}
              setApprovalNote={setApprovalNote}
              handleApproval={handleApproval}
              submitting={submitting}
              session={session}
            />
          </div>
        )}

        {/* ========== COPYWRITING TAB ========== */}
        {activeTab === 'copywriting' && (
          <div className="space-y-4">
            {/* Caption Direction */}
            <InfoCard title="Caption Direction" content={event.captionDirection} />

            {/* Comments Section */}
            <div className="liquid-glass-card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Comments</h3>

              <form onSubmit={handleComment} className="mb-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add copywriting feedback..."
                  rows={3}
                  className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#6B7B8D]/20 resize-none border border-white/40"
                />
                <button type="submit" disabled={submitting || !comment.trim()} className="mt-2 liquid-gradient-btn px-5 py-2 text-sm disabled:opacity-50">
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </form>

              {event.comments?.filter(c => !c.tab || c.tab === 'copywriting').map((c) => (
                <div key={c.id} className="mb-3 p-3 rounded-xl bg-white/30 animate-fade-in">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6B7B8D] to-coral flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{c.user.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{c.user.name}</p>
                      <p className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 pl-9">{c.content}</p>
                </div>
              ))}

              {(!event.comments || event.comments.filter(c => !c.tab || c.tab === 'copywriting').length === 0) && (
                <p className="text-center text-gray-400 text-sm py-4">No comments yet</p>
              )}
            </div>

            {/* Copywriting Approval */}
            <ApprovalSection
              tab="copywriting"
              approvals={getTabApprovals('copywriting')}
              approvalNote={approvalNote}
              setApprovalNote={setApprovalNote}
              handleApproval={handleApproval}
              submitting={submitting}
              session={session}
            />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditEventModal
          event={event}
          onClose={() => setShowEdit(false)}
          onSaved={() => { fetchEvent(); setShowEdit(false) }}
        />
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <RescheduleModal
          event={event}
          onClose={() => setShowReschedule(false)}
          onSaved={() => { fetchEvent(); setShowReschedule(false) }}
        />
      )}

      <Navbar />
    </div>
  )
}

/* ── Edit Event Modal ── */
function EditEventModal({ event, onClose, onSaved }) {
  const [title, setTitle] = useState(event.title)
  const [category, setCategory] = useState(event.category || '')
  const [status, setStatus] = useState(event.status)
  const [platforms, setPlatforms] = useState(event.platforms || '')
  const [postConcept, setPostConcept] = useState(event.postConcept || '')
  const [visualDirection, setVisualDirection] = useState(event.visualDirection || '')
  const [captionDirection, setCaptionDirection] = useState(event.captionDirection || '')
  const [notes, setNotes] = useState(event.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title) return
    setSaving(true)
    await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, status, platforms, postConcept, visualDirection, captionDirection, notes: notes || null }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10 animate-slide-up max-h-[85vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(145deg, rgba(247,249,250,0.97), rgba(208,217,226,0.3))',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
        <h3 className="font-display text-xl font-bold text-gray-800 italic mb-5">Edit Event</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 outline-none focus:border-[#6B7B8D]/50" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 outline-none">
                <option value="Not Started">Not Started</option>
                <option value="Approved">Approved</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Platforms</label>
              <input value={platforms} onChange={(e) => setPlatforms(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 placeholder-gray-400 outline-none" placeholder="Instagram, LinkedIn..." />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Post Concept</label>
            <textarea value={postConcept} onChange={(e) => setPostConcept(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none" placeholder="Describe the post concept..." />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Visual Direction</label>
            <textarea value={visualDirection} onChange={(e) => setVisualDirection(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none" placeholder="Visual style and tone..." />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Caption Direction</label>
            <textarea value={captionDirection} onChange={(e) => setCaptionDirection(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none" placeholder="Caption guidelines..." />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none" placeholder="Additional notes..." />
          </div>
          <button type="submit" disabled={saving || !title} className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6B7B8D, #363A47)' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Reschedule Modal ── */
function RescheduleModal({ event, onClose, onSaved }) {
  const [newDate, setNewDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newDate) return
    setSaving(true)
    const d = new Date(newDate + 'T00:00:00')
    const formatted = `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
    const month = MONTHS_SHORT[d.getMonth()]

    const data = { date: formatted, month, status: 'Rescheduled' }
    if (endDate) {
      const ed = new Date(endDate + 'T00:00:00')
      data.endDate = `${String(ed.getDate()).padStart(2, '0')} ${MONTHS_SHORT[ed.getMonth()]} ${ed.getFullYear()}`
    }

    await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{
          background: 'linear-gradient(145deg, rgba(247,249,250,0.97), rgba(208,217,226,0.3))',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
        <h3 className="font-display text-xl font-bold text-gray-800 italic mb-2">Reschedule Event</h3>
        <p className="text-sm text-gray-500 mb-5">{event.title}</p>
        <p className="text-xs text-gray-400 mb-4">Current: <span className="font-semibold text-gray-600">{event.date}{event.endDate ? ` — ${event.endDate}` : ''}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">New Date *</label>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 outline-none focus:border-[#6B7B8D]/50" required />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date (optional)</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 outline-none focus:border-[#6B7B8D]/50" />
          </div>
          <button type="submit" disabled={saving || !newDate} className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
            {saving ? 'Rescheduling...' : 'Reschedule'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Deadline Cell ── */
function DeadlineCell({ label, value }) {
  const isPast = (() => {
    if (!value) return false
    try {
      const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
      const parts = value.split(' ')
      const d = new Date(parseInt(parts[2]), MONTHS[parts[1]], parseInt(parts[0]))
      return d < new Date()
    } catch { return false }
  })()

  return (
    <div className={`rounded-xl p-3 ${isPast ? 'bg-red-50/60' : 'bg-white/50'}`}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase">{label}</p>
      <p className={`text-sm font-bold ${isPast ? 'text-red-600' : 'text-gray-700'}`}>{value || '--'}</p>
    </div>
  )
}

/* ── Info Card ── */
function InfoCard({ title, content }) {
  if (!content) return null
  return (
    <div className="liquid-glass-card p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  )
}

/* ── Per-Tab Approval Section ── */
function ApprovalSection({ tab, approvals, approvalNote, setApprovalNote, handleApproval, submitting, session }) {
  const canApprove = session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR' || session?.user?.role === 'APPROVER'
  const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1)

  return (
    <div className="liquid-glass-card p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        {tabLabel} Approval
      </h3>

      {/* Submit form */}
      {canApprove && (
        <div className="mb-4">
          <textarea
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
            placeholder={`Add a note for ${tab} approval (optional)...`}
            rows={2}
            className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#6B7B8D]/20 resize-none border border-white/40 mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleApproval('APPROVED', tab)}
              disabled={submitting}
              className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-all disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleApproval('REJECTED', tab)}
              disabled={submitting}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Approval history */}
      {approvals.length > 0 ? (
        <div className="space-y-2.5">
          {approvals.map((a) => (
            <div key={a.id} className="p-3 rounded-xl bg-white/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${a.status === 'APPROVED' ? 'bg-green-100' : a.status === 'REJECTED' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  {a.status === 'APPROVED' ? (
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  ) : a.status === 'REJECTED' ? (
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {a.user.name} -- <span className={a.status === 'APPROVED' ? 'text-green-600' : a.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}>{a.status}</span>
                  </p>
                  <p className="text-[10px] text-gray-500">{new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              {a.note && <p className="text-sm text-gray-600 pl-8">{a.note}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-3">No {tab} approvals yet</p>
      )}
    </div>
  )
}
