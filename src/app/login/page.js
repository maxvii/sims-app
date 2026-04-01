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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/gradient-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Overlay for extra depth */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(54,58,71,0.15) 0%, rgba(20,22,30,0.6) 100%)' }}
      />

      {/* Logo */}
      <div className="relative z-10 mb-14 animate-fade-in">
        <img
          src="/logo.png"
          alt="The Sims App"
          className="h-16 w-auto mx-auto"
          style={{ filter: 'drop-shadow(0 12px 50px rgba(0,0,0,0.5))' }}
        />
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-sm relative z-10 animate-slide-up p-7 rounded-3xl"
        style={{
          background: 'rgba(20,22,30,0.45)',
          backdropFilter: 'blur(40px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
          border: '1px solid rgba(247,249,250,0.08)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(247,249,250,0.06)',
        }}
      >
        {error && (
          <div
            className="text-sm p-3 rounded-2xl text-center font-medium mb-5"
            style={{
              background: 'rgba(212,54,92,0.2)',
              border: '1px solid rgba(212,54,92,0.3)',
              color: '#D0D9E2',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5" style={{ color: 'rgba(208,217,226,0.5)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3.5 px-5 rounded-2xl text-[15px] outline-none transition-all placeholder:text-white/20"
              style={{
                background: 'rgba(247,249,250,0.05)',
                border: '1.5px solid rgba(247,249,250,0.1)',
                color: '#F7F9FA',
              }}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5" style={{ color: 'rgba(208,217,226,0.5)' }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5 px-5 pr-12 rounded-2xl text-[15px] outline-none transition-all placeholder:text-white/20"
                style={{
                  background: 'rgba(247,249,250,0.05)',
                  border: '1.5px solid rgba(247,249,250,0.1)',
                  color: '#F7F9FA',
                }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'rgba(208,217,226,0.4)' }}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-[15px] disabled:opacity-50 transition-all mt-2"
            style={{
              background: 'linear-gradient(135deg, #D0D9E2, #B8C8D5)',
              color: '#2B2E38',
              boxShadow: '0 4px 24px rgba(208,217,226,0.25)',
              letterSpacing: '0.05em',
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

      {/* Bottom text */}
      <p className="relative z-10 mt-10 text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(208,217,226,0.15)' }}>
        The Sims App
      </p>
    </div>
  )
}
