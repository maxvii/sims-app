'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

const photos = [
  { id: 1, src: '/images/sima-portrait.jpg', alt: 'Close-up portrait in red outfit', span: 'tall' },
  { id: 2, src: '/images/sima-office.jpg', alt: 'Office look in fuchsia pink', span: 'normal' },
  { id: 3, src: '/images/sima-pink.jpg', alt: 'Pink satin artistic shot', span: 'normal' },
  { id: 4, src: '/images/sima-gold.jpg', alt: 'Pink outfit with gold background', span: 'tall' },
  { id: 5, src: '/images/sima-teal.jpg', alt: 'Teal outfit luxury portrait', span: 'normal' },
  { id: 6, src: '/images/sima-sofa.jpg', alt: 'Sofa portrait in leopard print', span: 'tall' },
  { id: 7, src: '/images/sima-event.jpg', alt: 'Full body event photo', span: 'normal' },
]

export default function GalleryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [loaded, setLoaded] = useState({})

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIndex === null) return
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev + 1) % photos.length)
      if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedIndex])

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#F7F9FA] pb-safe-nav">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-6">
        <GradientSpheres variant="compact" />
        <div className="relative z-10">
          <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1
            className="text-3xl font-bold tracking-tight animate-fade-in"
            style={{ color: '#363A47' }}
          >
            Gallery
          </h1>
          <p
            className="text-sm mt-1 animate-fade-in"
            style={{ color: '#6B7B8D', animationDelay: '0.1s' }}
          >
            Curated moments, captured in style
          </p>
        </div>
      </div>

      {/* Masonry Photo Grid */}
      <div className="px-4 pb-28 scrollbar-hide">
        <div
          className="animate-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            animationDelay: '0.2s',
          }}
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="animate-scale-in"
              style={{
                gridRow: photo.span === 'tall' ? 'span 2' : 'span 1',
                animationDelay: `${0.1 + index * 0.07}s`,
              }}
            >
              <button
                onClick={() => setSelectedIndex(index)}
                className="relative w-full h-full rounded-2xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#6B7B8D]/50"
                style={{
                  minHeight: photo.span === 'tall' ? '320px' : '150px',
                  background: 'linear-gradient(135deg, rgba(54,58,71,0.08), rgba(107,123,141,0.06))',
                }}
              >
                {/* Shimmer placeholder */}
                {!loaded[photo.id] && (
                  <div className="absolute inset-0 animate-pulse" style={{
                    background: 'linear-gradient(135deg, rgba(208,217,226,0.4), rgba(107,123,141,0.15), rgba(208,217,226,0.3))',
                  }} />
                )}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  onLoad={() => setLoaded((prev) => ({ ...prev, [photo.id]: true }))}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{
                    opacity: loaded[photo.id] ? 1 : 0,
                    transition: 'opacity 0.4s ease, transform 0.5s ease',
                  }}
                />
                {/* Subtle gradient overlay at bottom */}
                <div
                  className="absolute inset-x-0 bottom-0 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(to top, rgba(54,58,71,0.5), transparent)',
                  }}
                />
                {/* Glass border effect */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    border: '1px solid rgba(247,249,250,0.25)',
                    boxShadow: 'inset 0 1px 0 rgba(247,249,250,0.15), 0 2px 12px rgba(54,58,71,0.1)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Photo count */}
        <div className="flex justify-center mt-6">
          <div
            className="liquid-glass-card px-4 py-2 rounded-full"
            style={{ color: '#6B7B8D', fontSize: '13px' }}
          >
            {photos.length} photos
          </div>
        </div>
      </div>

      {/* Full-screen Lightbox Viewer */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ animation: 'fadeIn 0.25s ease' }}
        >
          {/* Dark blurred backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(30, 15, 32, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={() => setSelectedIndex(null)}
          />

          {/* Close button */}
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-12 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: 'rgba(247,249,250,0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(247,249,250,0.15)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F7F9FA" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Navigation arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length) }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: 'rgba(247,249,250,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(247,249,250,0.12)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F7F9FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedIndex((prev) => (prev + 1) % photos.length) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: 'rgba(247,249,250,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(247,249,250,0.12)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F7F9FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative z-10 w-full h-full flex items-center justify-center px-4 py-20"
            onClick={() => setSelectedIndex(null)}
          >
            <img
              key={selectedIndex}
              src={photos[selectedIndex].src}
              alt={photos[selectedIndex].alt}
              className="max-w-full max-h-full rounded-xl"
              style={{
                objectFit: 'contain',
                animation: 'scaleIn 0.3s ease',
                boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Photo counter */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full"
            style={{
              background: 'rgba(247,249,250,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(247,249,250,0.1)',
              color: '#D0D9E2',
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '0.02em',
            }}
          >
            {selectedIndex + 1} / {photos.length}
          </div>

          {/* Swipe hint - shows briefly */}
          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50"
            style={{
              color: 'rgba(208,217,226,0.45)',
              fontSize: '11px',
              animation: 'fadeIn 0.5s ease 1s both, fadeOut 0.5s ease 4s both',
            }}
          >
            Swipe or use arrow keys to navigate
          </div>
        </div>
      )}

      {/* Inline keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <Navbar />
    </div>
  )
}
