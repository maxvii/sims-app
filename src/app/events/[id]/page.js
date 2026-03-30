'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MediaGallery from '@/components/MediaGallery'
import GradientSpheres from '@/components/GradientSpheres'

const priorityColors = { CRITICAL: 'bg-priority-critical/90 text-white', HIGH: 'bg-priority-high/90 text-white', MEDIUM: 'bg-priority-medium/90 text-gray-800', LOW: 'bg-priority-low/90 text-white' }
const statusColors = { 'Not Started': 'bg-gray-100/80 text-gray-500', 'Planned': 'bg-blue-50/80 text-blue-600', 'In Progress': 'bg-amber-50/80 text-amber-600', 'Approved': 'bg-emerald-50/80 text-emerald-600', 'Needs Revision': 'bg-red-50/80 text-red-500', 'Published': 'bg-purple-50/80 text-purple-600' }
const STATUSES = ['Not Started', 'Planned', 'In Progress', 'Approved', 'Needs Revision', 'Published']

export default function EventDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('workflow')
  const [comment, setComment] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [refUrl, setRefUrl] = useState('')
  const [refTitle, setRefTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [media, setMedia] = useState([])

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
      <div className="w-10 h-10 border-3 border-[#B0688A] border-t-[#935073] rounded-full animate-spin" />
    </div>
  )

  const handleStatusChange = async (newStatus) => {
    await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchEvent()
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment, eventId: event.id }),
    })
    setComment('')
    setSubmitting(false)
    fetchEvent()
  }

  const handleApproval = async (status) => {
    setSubmitting(true)
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, status, note: approvalNote }),
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
    { id: 'workflow', label: 'Workflow' },
    { id: 'media', label: `Media (${media.length})` },
    { id: 'comments', label: `Comments (${event.comments?.length || 0})` },
    { id: 'approvals', label: 'Approval' },
    { id: 'references', label: 'Refs' },
  ]

  return (
    <div className="min-h-screen pb-safe-nav">
      {/* Header */}
      <div className="liquid-glass px-5 pt-12 pb-5 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 mb-3 hover:text-gray-700 relative z-10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`pill-tag text-[10px] ${priorityColors[event.priority]}`}>{event.priority}</span>
              <span className={`pill-tag text-[10px] ${statusColors[event.status] || 'bg-gray-100/80 text-gray-500'}`}>{event.status}</span>
            </div>
            <h1 className="font-display text-xl font-black italic text-gray-800 mb-1">{event.title}</h1>
            <p className="text-sm text-gray-500">{event.date}{event.endDate ? ` — ${event.endDate}` : ''}</p>
          </div>
          <span className="font-display text-3xl font-black italic text-lavender/60">#{event.number}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#935073] text-white shadow-md' : 'liquid-glass-pill text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4 animate-fade-in">
        {activeTab === 'workflow' && (
          <div className="space-y-4">
            {/* Status Changer */}
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR' || session?.user?.role === 'APPROVER') && (
              <div className="liquid-glass-card p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${event.status === s ? statusColors[s] + ' ring-2 ring-[#B0688A]' : 'bg-white/50 text-gray-500 hover:bg-white/70'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step-by-Step Workflow */}
            <WorkflowStep num={1} title="Opportunity Type" content={event.opportunityType} />
            <WorkflowStep num={2} title="Post Concept" content={event.postConcept} />
            <WorkflowStep num={3} title="Visual Direction" content={event.visualDirection} />
            <WorkflowStep num={4} title="Caption Direction" content={event.captionDirection} />
            <WorkflowStep num={5} title="Target Platforms" content={event.platforms} />

            {/* Deadlines */}
            <div className="liquid-glass-card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Deadlines</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase">Brief Due</p>
                  <p className="text-sm font-bold text-gray-700">{event.creativeBriefDue}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase">Creative Due</p>
                  <p className="text-sm font-bold text-gray-700">{event.creativeDue}</p>
                </div>
              </div>
            </div>

            {event.notes && (
              <div className="liquid-glass-card p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{event.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <MediaGallery eventId={event.id} media={media} onRefresh={() => { fetchMedia(); fetchEvent() }} />
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <form onSubmit={handleComment} className="liquid-glass-card p-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 resize-none border border-white/40"
              />
              <button type="submit" disabled={submitting || !comment.trim()} className="mt-2 liquid-gradient-btn px-5 py-2 text-sm disabled:opacity-50">
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>

            {event.comments?.map((c) => (
              <div key={c.id} className="liquid-glass-card p-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#935073] to-coral flex items-center justify-center">
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

            {event.comments?.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">No comments yet</div>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR' || session?.user?.role === 'APPROVER') && (
              <div className="liquid-glass-card p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Submit Decision</h3>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  rows={2}
                  className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 resize-none border border-white/40 mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleApproval('APPROVED')} disabled={submitting} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-all disabled:opacity-50">
                    Approve
                  </button>
                  <button onClick={() => handleApproval('REJECTED')} disabled={submitting} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </div>
            )}

            {event.approvals?.map((a) => (
              <div key={a.id} className="liquid-glass-card p-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${a.status === 'APPROVED' ? 'bg-green-100' : a.status === 'REJECTED' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    {a.status === 'APPROVED' ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    ) : a.status === 'REJECTED' ? (
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    ) : (
                      <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{a.user.name} — <span className={a.status === 'APPROVED' ? 'text-green-600' : a.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}>{a.status}</span></p>
                    <p className="text-[10px] text-gray-500">{new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                {a.note && <p className="text-sm text-gray-600 pl-9">{a.note}</p>}
              </div>
            ))}

            {event.approvals?.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">No approval decisions yet</div>
            )}
          </div>
        )}

        {activeTab === 'references' && (
          <div className="space-y-4">
            <form onSubmit={handleAddRef} className="liquid-glass-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Reference</h3>
              <input
                value={refTitle}
                onChange={(e) => setRefTitle(e.target.value)}
                placeholder="Reference title..."
                className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40"
              />
              <input
                value={refUrl}
                onChange={(e) => setRefUrl(e.target.value)}
                placeholder="URL or image link..."
                className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40"
              />
              <button type="submit" disabled={submitting || !refUrl.trim() || !refTitle.trim()} className="liquid-gradient-btn px-5 py-2 text-sm disabled:opacity-50">
                Add Reference
              </button>
            </form>

            {event.references?.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="liquid-glass-card p-4 flex items-center gap-3 hover:scale-[1.01] transition-all block">
                <div className="w-10 h-10 rounded-xl bg-[#935073]/10 flex items-center justify-center flex-shrink-0">
                  {r.type === 'IMAGE' ? (
                    <svg className="w-5 h-5 text-[#935073]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#935073]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{r.title}</p>
                  <p className="text-xs text-gray-500">by {r.user.name}</p>
                </div>
              </a>
            ))}

            {event.references?.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">No references added yet</div>
            )}
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}

function WorkflowStep({ num, title, content }) {
  return (
    <div className="liquid-glass-card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#502D55] to-[#935073] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{num}</span>
        </div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]">{title}</h3>
      </div>
      <p className="text-sm text-gray-700 pl-11 leading-relaxed">{content}</p>
    </div>
  )
}
