'use client'
import { useState, useRef, useEffect } from 'react'

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoPlayer({ media, onRefresh }) {
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeComment, setActiveComment] = useState(null)

  const comments = media.comments || []

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime)
    const onDur = () => setDuration(v.duration)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onDur)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onDur)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
    }
  }, [])

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    await fetch('/api/media/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId: media.id, content: comment, timestamp: currentTime }),
    })
    setComment('')
    setSubmitting(false)
    onRefresh()
  }

  const jumpTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      videoRef.current.pause()
    }
  }

  // Find comments near current time (within 2 seconds)
  const nearbyComments = comments.filter(
    (c) => c.timestamp != null && Math.abs(c.timestamp - currentTime) < 2
  )

  return (
    <div className="space-y-3">
      {/* Video */}
      <div className="relative rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={media.filepath}
          className="w-full rounded-2xl"
          playsInline
          preload="metadata"
        />

        {/* Overlay comments bubble */}
        {nearbyComments.length > 0 && playing && (
          <div className="absolute top-3 left-3 right-3 animate-fade-in">
            {nearbyComments.map((c) => (
              <div key={c.id} className="glass-card px-3 py-2 mb-1 text-xs">
                <span className="font-semibold text-[#935073]">{c.user.name}</span>
                <span className="text-gray-600 ml-1">{c.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => playing ? videoRef.current?.pause() : videoRef.current?.play()}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#935073] to-coral flex items-center justify-center flex-shrink-0"
          >
            {playing ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
            ) : (
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          {/* Timeline bar with comment markers */}
          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value) }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #935073 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%)` }}
            />
            {/* Comment markers on timeline */}
            {comments.filter((c) => c.timestamp != null).map((c) => (
              <button
                key={c.id}
                onClick={() => { jumpTo(c.timestamp); setActiveComment(c.id) }}
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#935073] border-2 border-white shadow-sm hover:scale-150 transition-transform z-10"
                style={{ left: `${(c.timestamp / (duration || 1)) * 100}%` }}
                title={`${c.user.name}: ${c.content}`}
              />
            ))}
          </div>

          <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Add comment at current timestamp */}
        <form onSubmit={handlePostComment} className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Comment at ${formatTime(currentTime)}...`}
            className="flex-1 bg-white/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40"
          />
          <button type="submit" disabled={submitting || !comment.trim()} className="gradient-btn px-4 py-2 text-xs disabled:opacity-50">
            Post
          </button>
        </form>
      </div>

      {/* Comment List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Timeline Comments ({comments.filter((c) => c.timestamp != null).length})
        </h4>
        {comments
          .filter((c) => c.timestamp != null)
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((c) => (
            <button
              key={c.id}
              onClick={() => jumpTo(c.timestamp)}
              className={`glass-card p-3 w-full text-left flex items-start gap-3 transition-all hover:scale-[1.01] ${activeComment === c.id ? 'ring-2 ring-[#B0688A]' : ''}`}
            >
              <span className="px-2 py-0.5 rounded-lg bg-[#935073]/10 text-[#935073] text-xs font-mono font-bold flex-shrink-0">
                {formatTime(c.timestamp)}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700">{c.user.name}</p>
                <p className="text-sm text-gray-600">{c.content}</p>
              </div>
            </button>
          ))}
        {comments.filter((c) => c.timestamp != null).length === 0 && (
          <p className="text-center text-gray-400 text-xs py-4">No timestamp comments yet. Play the video and add one!</p>
        )}
      </div>
    </div>
  )
}
