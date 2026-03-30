'use client'
import { useState, useRef } from 'react'

export default function ImageViewer({ media, onRefresh }) {
  const imgRef = useRef(null)
  const [comment, setComment] = useState('')
  const [pinMode, setPinMode] = useState(false)
  const [pendingPin, setPendingPin] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [activePin, setActivePin] = useState(null)
  const [showPins, setShowPins] = useState(true)

  const comments = media.comments || []
  const pinComments = comments.filter((c) => c.pinX != null && c.pinY != null)
  const generalComments = comments.filter((c) => c.pinX == null && c.pinY == null)

  const handleImageClick = (e) => {
    if (!pinMode) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPendingPin({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
  }

  const handlePostPin = async (e) => {
    e.preventDefault()
    if (!comment.trim() || !pendingPin) return
    setSubmitting(true)
    await fetch('/api/media/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId: media.id, content: comment, pinX: pendingPin.x, pinY: pendingPin.y }),
    })
    setComment('')
    setPendingPin(null)
    setPinMode(false)
    setSubmitting(false)
    onRefresh()
  }

  const handlePostGeneral = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    await fetch('/api/media/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId: media.id, content: comment }),
    })
    setComment('')
    setSubmitting(false)
    onRefresh()
  }

  return (
    <div className="space-y-3">
      {/* Image with Pin Overlay */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          ref={imgRef}
          src={media.filepath}
          alt={media.filename}
          className={`w-full rounded-2xl ${pinMode ? 'cursor-crosshair' : 'cursor-default'}`}
          onClick={handleImageClick}
        />

        {/* Existing pin markers */}
        {showPins && pinComments.map((c) => (
          <button
            key={c.id}
            onClick={(e) => { e.stopPropagation(); setActivePin(activePin === c.id ? null : c.id) }}
            className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center shadow-lg transition-all z-10 ${activePin === c.id ? 'bg-[#935073] scale-125' : 'bg-white/90 hover:bg-[#935073]/10'}`}
            style={{ left: `${c.pinX}%`, top: `${c.pinY}%` }}
          >
            <svg className={`w-3.5 h-3.5 ${activePin === c.id ? 'text-white' : 'text-[#935073]'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          </button>
        ))}

        {/* Active pin comment popup */}
        {activePin && (() => {
          const c = pinComments.find((p) => p.id === activePin)
          if (!c) return null
          return (
            <div
              className="absolute z-20 glass-card p-3 max-w-[200px] animate-fade-in shadow-xl"
              style={{ left: `${Math.min(c.pinX, 70)}%`, top: `${c.pinY + 4}%` }}
            >
              <p className="text-xs font-semibold text-[#935073]">{c.user.name}</p>
              <p className="text-sm text-gray-700">{c.content}</p>
              <p className="text-[9px] text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )
        })()}

        {/* Pending pin marker */}
        {pendingPin && (
          <div
            className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#935073] flex items-center justify-center shadow-lg animate-bounce z-20"
            style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          </div>
        )}

        {/* Pin mode indicator */}
        {pinMode && !pendingPin && (
          <div className="absolute top-3 left-3 right-3 glass-card px-3 py-2 text-center animate-fade-in">
            <p className="text-xs font-semibold text-[#935073]">Click anywhere on the image to drop a pin</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => { setPinMode(!pinMode); setPendingPin(null); setComment('') }}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${pinMode ? 'bg-[#935073] text-white shadow-md' : 'bg-white/50 text-gray-600 hover:bg-white/70'}`}
        >
          {pinMode ? 'Cancel Pin' : 'Drop Pin Comment'}
        </button>
        <button
          onClick={() => setShowPins(!showPins)}
          className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${showPins ? 'bg-white/50 text-gray-600' : 'bg-gray-200 text-gray-500'}`}
        >
          {showPins ? 'Hide Pins' : 'Show Pins'}
        </button>
      </div>

      {/* Pin Comment Form */}
      {pendingPin && (
        <form onSubmit={handlePostPin} className="glass-card p-4 animate-slide-up space-y-2">
          <p className="text-xs font-semibold text-[#935073]">Pin at ({pendingPin.x.toFixed(0)}%, {pendingPin.y.toFixed(0)}%)</p>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your comment on this spot..."
            className="w-full bg-white/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40"
            autoFocus
          />
          <div className="flex gap-2">
            <button type="submit" disabled={submitting || !comment.trim()} className="gradient-btn px-4 py-2 text-xs disabled:opacity-50">
              Post Pin Comment
            </button>
            <button type="button" onClick={() => { setPendingPin(null); setComment('') }} className="px-4 py-2 text-xs text-gray-500">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* General Comment Form (when not in pin mode) */}
      {!pinMode && !pendingPin && (
        <form onSubmit={handlePostGeneral} className="glass-card p-3 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a general comment..."
            className="flex-1 bg-white/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40"
          />
          <button type="submit" disabled={submitting || !comment.trim()} className="gradient-btn px-4 py-2 text-xs disabled:opacity-50">
            Post
          </button>
        </form>
      )}

      {/* Comments List */}
      {pinComments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pin Comments ({pinComments.length})</h4>
          {pinComments.map((c) => (
            <button
              key={c.id}
              onClick={() => setActivePin(activePin === c.id ? null : c.id)}
              className={`glass-card p-3 w-full text-left flex items-start gap-3 transition-all hover:scale-[1.01] ${activePin === c.id ? 'ring-2 ring-[#B0688A]' : ''}`}
            >
              <div className="w-7 h-7 rounded-full bg-[#935073]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-[#935073]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700">{c.user.name}</p>
                <p className="text-sm text-gray-600">{c.content}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {generalComments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">General Comments ({generalComments.length})</h4>
          {generalComments.map((c) => (
            <div key={c.id} className="glass-card p-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#935073] to-coral flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{c.user.name[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700">{c.user.name}</p>
                <p className="text-sm text-gray-600">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
