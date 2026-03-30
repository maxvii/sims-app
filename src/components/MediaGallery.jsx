'use client'
import { useState, useRef } from 'react'
import VideoPlayer from './VideoPlayer'
import ImageViewer from './ImageViewer'

export default function MediaGallery({ eventId, media, onRefresh }) {
  const [uploading, setUploading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const fileRef = useRef(null)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Only images and videos are supported')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('File too large. Max 100MB.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('eventId', eventId)

    await fetch('/api/media', { method: 'POST', body: formData })
    setUploading(false)
    fileRef.current.value = ''
    onRefresh()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this media?')) return
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (selectedMedia?.id === id) setSelectedMedia(null)
    onRefresh()
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // If viewing a specific media item
  if (selectedMedia) {
    const current = media.find((m) => m.id === selectedMedia.id) || selectedMedia
    return (
      <div className="space-y-3 animate-fade-in">
        <button onClick={() => setSelectedMedia(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back to Gallery
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-700 truncate">{current.filename}</h4>
            <p className="text-[10px] text-gray-400">{formatSize(current.size)} &middot; by {current.user.name}</p>
          </div>
          <button onClick={() => handleDelete(current.id)} className="text-gray-400 hover:text-red-500 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>

        {current.type === 'VIDEO' ? (
          <VideoPlayer media={current} onRefresh={onRefresh} />
        ) : (
          <ImageViewer media={current} onRefresh={onRefresh} />
        )}
      </div>
    )
  }

  // Gallery grid view
  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="glass-card p-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full py-4 border-2 border-dashed border-[#935073]/20 rounded-xl hover:border-[#935073] hover:bg-[#935073]/5 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="w-8 h-8 text-[#935073] animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span className="text-sm font-semibold text-[#935073]">Uploading...</span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-[#B0688A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <span className="text-sm font-semibold text-gray-500">Upload Video or Image</span>
              <span className="text-[10px] text-gray-400">MP4, MOV, WebM, JPG, PNG, GIF &middot; Max 100MB</span>
            </>
          )}
        </button>
      </div>

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {media.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMedia(m)}
              className="glass-card overflow-hidden hover:scale-[1.02] transition-all text-left"
            >
              {m.type === 'VIDEO' ? (
                <div className="relative aspect-square bg-gray-900 flex items-center justify-center">
                  <video src={m.filepath} className="w-full h-full object-cover" preload="metadata" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#935073] ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-square overflow-hidden">
                  <img src={m.filepath} alt={m.filename} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold text-gray-700 truncate">{m.filename}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400">{m.user.name}</span>
                  {m.comments?.length > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#935073] font-semibold">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      {m.comments.length}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-6">
          No media uploaded yet. Add videos or images to start collaborating!
        </div>
      )}
    </div>
  )
}
