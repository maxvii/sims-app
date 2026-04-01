'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function VirtualTryOnPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [personImage, setPersonImage] = useState(null)
  const [personPreview, setPersonPreview] = useState(null)
  const [garmentImage, setGarmentImage] = useState(null)
  const [garmentPreview, setGarmentPreview] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [cameraActive, setCameraActive] = useState(false)

  const personInputRef = useRef(null)
  const garmentInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // Progress simulation during generation
  useEffect(() => {
    if (!loading) return
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90 }
        // Fast at start, slows down
        const increment = prev < 30 ? 3 : prev < 60 ? 2 : 0.5
        return Math.min(prev + increment, 90)
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [loading])

  function handleImageSelect(file, type) {
    if (!file) return
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Image must be under 10MB')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are supported')
      return
    }
    setError(null)
    const preview = URL.createObjectURL(file)
    if (type === 'person') {
      setPersonImage(file)
      setPersonPreview(preview)
      setStep(2)
    } else {
      setGarmentImage(file)
      setGarmentPreview(preview)
    }
  }

  async function startCamera() {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch (err) {
      setError('Could not access camera. Please check permissions.')
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
        handleImageSelect(file, 'person')
      }
    }, 'image/jpeg', 0.9)
    stopCamera()
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  async function handleGenerate() {
    if (!personImage || !garmentImage) return
    setLoading(true)
    setError(null)
    setResultUrl(null)
    setStep(3)

    try {
      const formData = new FormData()
      formData.append('personImage', personImage)
      formData.append('garmentImage', garmentImage)

      const res = await fetch('/api/try-on', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'NOT_CONFIGURED') {
          setError('COMING_SOON')
        } else {
          setError(data.error || 'Something went wrong')
        }
        return
      }

      setProgress(100)
      setResultUrl(data.resultUrl)
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        setError('Request timed out. Please try again with smaller images.')
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `simz-tryon-${Date.now()}.png`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handleReset() {
    setStep(1)
    setPersonImage(null)
    setPersonPreview(null)
    setGarmentImage(null)
    setGarmentPreview(null)
    setResultUrl(null)
    setError(null)
    setProgress(0)
    setLoading(false)
  }

  if (authStatus === 'loading') return null

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>
      {/* Header */}
      <div className="liquid-glass px-5 pt-12 pb-4 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <div className="relative z-10">
          <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="font-display text-3xl font-black italic text-gray-800">Virtual Try-On</h1>
          <p className="text-xs text-gray-500 mt-1">See yourself in any outfit</p>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-lg mx-auto">
        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  background: step >= s ? 'linear-gradient(135deg, #363A47, #6B7B8D)' : 'rgba(107,123,141,0.15)',
                  color: step >= s ? '#fff' : '#6B7B8D',
                }}
              >
                {step > s ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                ) : s}
              </div>
              {s < 3 && (
                <div className="w-8 h-0.5 rounded" style={{ background: step > s ? '#6B7B8D' : 'rgba(107,123,141,0.2)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload Person Photo */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">Upload Your Photo</h2>

            {!cameraActive ? (
              <>
                {/* Upload Zone */}
                <button
                  onClick={() => personInputRef.current?.click()}
                  className="w-full rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  style={{
                    border: '2px dashed rgba(107,123,141,0.3)',
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    minHeight: '220px',
                  }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(107,123,141,0.1)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#363A47' }}>Tap to upload your photo</span>
                  <span className="text-xs text-gray-400">JPG, PNG, or WebP</span>
                </button>
                <input
                  ref={personInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => handleImageSelect(e.target.files?.[0], 'person')}
                />

                {/* Camera Button */}
                <button
                  onClick={startCamera}
                  className="w-full mt-3 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-[0.97]"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: '#363A47',
                    border: '1px solid rgba(107,123,141,0.2)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Take a Selfie
                </button>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Use a full-body photo for best results
                </p>
              </>
            ) : (
              /* Camera View */
              <div className="relative rounded-2xl overflow-hidden animate-scale-in" style={{ background: '#000' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-2xl"
                  style={{ maxHeight: '400px', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center self-center"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload Garment */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">Upload Outfit</h2>

            {/* Person Preview (small) */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
              <img
                src={personPreview}
                alt="Your photo"
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">Your Photo</p>
                <p className="text-xs text-gray-400">Ready</p>
              </div>
              <button
                onClick={() => { setStep(1); setPersonImage(null); setPersonPreview(null) }}
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ color: '#6B7B8D', background: 'rgba(107,123,141,0.1)' }}
              >
                Change
              </button>
            </div>

            {!garmentPreview ? (
              <>
                <button
                  onClick={() => garmentInputRef.current?.click()}
                  className="w-full rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  style={{
                    border: '2px dashed rgba(107,123,141,0.3)',
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    minHeight: '220px',
                  }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(107,123,141,0.1)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.38 3.46L16 2 12 5.5 8 2 3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#363A47' }}>Tap to upload outfit</span>
                  <span className="text-xs text-gray-400">JPG, PNG, or WebP</span>
                </button>
                <input
                  ref={garmentInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => handleImageSelect(e.target.files?.[0], 'garment')}
                />
                <p className="text-center text-xs text-gray-400 mt-4">
                  Use a photo of the clothing on a white or plain background
                </p>
              </>
            ) : (
              <>
                {/* Garment Preview */}
                <div className="relative rounded-2xl overflow-hidden animate-scale-in" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
                  <img
                    src={garmentPreview}
                    alt="Selected outfit"
                    className="w-full rounded-2xl object-contain"
                    style={{ maxHeight: '300px' }}
                  />
                  <button
                    onClick={() => { setGarmentImage(null); setGarmentPreview(null) }}
                    className="absolute top-3 right-3 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ color: '#fff', background: 'rgba(54,58,71,0.7)', backdropFilter: 'blur(8px)' }}
                  >
                    Change
                  </button>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  className="w-full mt-5 py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.97] shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #363A47, #6B7B8D)',
                    boxShadow: '0 8px 24px rgba(54,58,71,0.3)',
                  }}
                >
                  Try It On
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <div className="animate-fade-in">
            {loading && (
              <div className="flex flex-col items-center gap-5 py-10">
                {/* Spinner */}
                <div className="relative w-20 h-20">
                  <div
                    className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(107,123,141,0.2)', borderTopColor: '#6B7B8D' }}
                  />
                  <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: 'rgba(107,123,141,0.08)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.38 3.46L16 2 12 5.5 8 2 3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">Creating your look...</p>
                  <p className="text-xs text-gray-400 mt-1">This may take up to a minute</p>
                </div>
                {/* Progress bar */}
                <div className="w-full max-w-xs h-2 rounded-full overflow-hidden" style={{ background: 'rgba(107,123,141,0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #363A47, #6B7B8D)',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">{Math.round(progress)}%</p>
              </div>
            )}

            {/* Error States */}
            {error && !loading && (
              <div className="flex flex-col items-center gap-4 py-10 animate-fade-in">
                {error === 'COMING_SOON' ? (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(107,123,141,0.1)' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-800">Coming Soon</p>
                      <p className="text-sm text-gray-500 mt-1 max-w-xs">
                        The virtual try-on feature is being set up. Check back soon!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,50,50,0.08)' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc3232" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-800">Oops</p>
                      <p className="text-sm text-gray-500 mt-1 max-w-xs">{error}</p>
                    </div>
                  </>
                )}
                <button
                  onClick={handleReset}
                  className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                  style={{ color: '#363A47', background: 'rgba(107,123,141,0.1)' }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Result Display */}
            {resultUrl && !loading && (
              <div className="animate-scale-in">
                <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Your New Look</h2>

                {/* Before / After */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
                    <img src={personPreview} alt="Before" className="w-full h-48 object-cover" />
                    <p className="text-center text-xs text-gray-500 py-2 font-medium">Before</p>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
                    <img src={resultUrl} alt="After" className="w-full h-48 object-cover" />
                    <p className="text-center text-xs text-gray-500 py-2 font-medium">After</p>
                  </div>
                </div>

                {/* Full Result */}
                <div
                  className="rounded-2xl overflow-hidden mb-5"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(54,58,71,0.12)',
                  }}
                >
                  <img src={resultUrl} alt="Try-on result" className="w-full object-contain" style={{ maxHeight: '500px' }} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                    style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                    style={{ color: '#363A47', background: 'rgba(107,123,141,0.1)', border: '1px solid rgba(107,123,141,0.2)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                    Try Another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}
