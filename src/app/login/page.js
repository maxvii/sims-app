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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8"
      style={{ background: 'linear-gradient(170deg, #3D2240 0%, #502D55 30%, #3D2240 60%, #1A1020 100%)' }}
    >
      {/* Logo */}
      <div className="mb-14 animate-fade-in flex flex-col items-center">
        <img
          src="/images/simz-logo.png"
          alt="Simz"
          className="w-40 h-auto mx-auto"
          style={{ filter: 'drop-shadow(0 6px 30px rgba(246,219,192,0.35))' }}
        />
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-sm animate-slide-up p-6 rounded-3xl"
        style={{
          background: 'rgba(26,16,32,0.55)',
          backdropFilter: 'blur(30px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(30px) saturate(1.5)',
          border: '1px solid rgba(248,244,233,0.1)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(248,244,233,0.08)',
        }}
      >
        {error && (
          <div
            className="text-sm p-3 rounded-2xl text-center font-medium mb-5"
            style={{
              background: 'rgba(212,54,92,0.2)',
              border: '1px solid rgba(212,54,92,0.3)',
              color: '#F6DBC0',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full py-3.5 px-5 rounded-2xl text-[15px] outline-none transition-all"
            style={{
              background: 'rgba(248,244,233,0.06)',
              border: '1.5px solid rgba(248,244,233,0.12)',
              color: '#F8F4E9',
              backdropFilter: 'blur(20px)',
            }}
            placeholder="Email"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3.5 px-5 pr-12 rounded-2xl text-[15px] outline-none transition-all"
              style={{
                background: 'rgba(248,244,233,0.06)',
                border: '1.5px solid rgba(248,244,233,0.12)',
                color: '#F8F4E9',
                backdropFilter: 'blur(20px)',
              }}
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'rgba(246,219,192,0.45)' }}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-[15px] disabled:opacity-50 transition-all mt-2"
            style={{
              background: 'linear-gradient(135deg, #F6DBC0, #E8C9A8)',
              color: '#502D55',
              boxShadow: '0 4px 20px rgba(246,219,192,0.3)',
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

        <p className="text-center mt-5">
          <span className="text-[12px] font-medium cursor-pointer transition-colors" style={{ color: 'rgba(246,219,192,0.45)' }}>Forgot password?</span>
        </p>
      </div>

      {/* Subtle branding at bottom */}
      <p className="mt-10 text-[11px] tracking-widest uppercase" style={{ color: 'rgba(246,219,192,0.2)' }}>
        Powered by Simz
      </p>
    </div>
  )
}
