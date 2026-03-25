'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) { setError('Invalid email or password'); setLoading(false) }
    else router.push('/calendar')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(170deg, #F8D7DE 0%, #F2C0CC 30%, #EDB3BF 50%, #F5C6D0 100%)' }}>
      {/* ── Hero Section with faded image ── */}
      <div className="relative h-[45vh] overflow-hidden">
        {/* Soft iridescent glow spots */}
        <div className="absolute top-[10%] left-[5%] w-[200px] h-[200px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(201,160,220,0.4), transparent)' }} />
        <div className="absolute top-[20%] right-[10%] w-[150px] h-[150px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(255,171,145,0.4), transparent)' }} />

        {/* Hero Image — pushed up, faded at bottom */}
        <div className="absolute inset-0">
          <img
            src="/hero.png"
            alt="Sims"
            className="w-full h-full object-cover object-top"
            style={{ objectPosition: 'center 15%' }}
          />
          {/* Heavy fade gradient bottom */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 10%, transparent 30%, rgba(248,215,222,0.4) 55%, rgba(248,215,222,0.85) 75%, #F8D7DE 92%)' }} />
          {/* Side fade */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(248,215,222,0.3) 0%, transparent 20%, transparent 80%, rgba(248,215,222,0.3) 100%)' }} />
          {/* Top subtle fade */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(248,215,222,0.15) 0%, transparent 15%)' }} />
        </div>

        {/* "Sims App" Title — positioned bottom-left over the fade */}
        <div className="absolute bottom-6 left-7 z-10">
          <h1 className="font-script text-[48px] text-gray-800 leading-none" style={{ textShadow: '0 1px 12px rgba(255,255,255,0.5)' }}>Sims</h1>
          <p className="text-gray-500 text-[11px] mt-0.5 tracking-[0.3em] uppercase font-medium">App</p>
        </div>
      </div>

      {/* ── Liquid Glass Login Card ── */}
      <div className="flex-1 -mt-10 relative z-10 px-5 pb-10">
        <div
          className="animate-slide-up"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.35) 100%)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.1)',
            padding: '32px 28px',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Login Title */}
            <h2 className="font-display text-[26px] font-bold text-gray-800 mb-7">Login</h2>

            {error && (
              <div
                className="text-red-500 text-sm p-3 rounded-2xl text-center font-medium mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,220,220,0.5), rgba(255,200,200,0.3))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,180,180,0.3)',
                }}
              >
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="mb-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 bg-transparent border-b border-white/40 focus:border-[#C9A0DC]/60 outline-none transition-all text-gray-700 text-[15px] placeholder-gray-400/70"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-2 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 bg-transparent border-b border-white/40 focus:border-[#C9A0DC]/60 outline-none transition-all text-gray-700 text-[15px] placeholder-gray-400/70 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400/70 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                )}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-right mb-6">
              <span className="text-[12px] text-[#C9A0DC] font-medium cursor-pointer hover:text-[#B080C9] transition-colors">Forgot password?</span>
            </div>

            {/* Remember Me - liquid glass checkbox */}
            <label className="flex items-center gap-2.5 mb-7 cursor-pointer">
              <div
                className="w-[18px] h-[18px] rounded flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2))',
                  border: '1px solid rgba(255,255,255,0.5)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              />
              <span className="text-[13px] text-gray-500/80">Remember me</span>
            </label>

            {/* Sign In - Liquid gradient button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold text-[15px] text-white disabled:opacity-50 transition-all relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #C9A0DC, #FF6F97)',
                boxShadow: '0 4px 20px rgba(201, 160, 220, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
