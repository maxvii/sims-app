'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
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
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative" style={{ background: '#F7F9FA' }}>

      {/* Subtle cream-dark radial accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(208,217,226,0.35) 0%, rgba(247,249,250,0) 60%)',
        }}
      />

      {/* ── Hero: Script logo ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
        <div className="text-center">
          <h1
            className="font-script text-[72px] leading-none"
            style={{
              color: '#363A47',
              fontFamily: 'Great Vibes, cursive',
              transform: 'rotate(-3deg)',
            }}
          >
            The
          </h1>
          <h1
            className="font-display text-[84px] leading-[0.9] font-black italic mt-1"
            style={{
              color: '#2B2E38',
              fontFamily: 'Playfair Display, serif',
              letterSpacing: '-0.02em',
            }}
          >
            Sims
          </h1>
        </div>

        {/* ── Sign In (hidden until tapped) ── */}
        {showForm ? (
          <div className="w-full max-w-xs mt-12 animate-fade-in">
            {error && (
              <div
                className="text-sm p-3 rounded-2xl text-center font-medium mb-4"
                style={{
                  background: 'rgba(212,54,92,0.08)',
                  border: '1px solid rgba(212,54,92,0.2)',
                  color: '#D4365C',
                }}
              >
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3.5 px-5 rounded-2xl text-[14px] outline-none transition-all"
                style={{
                  background: '#fff',
                  border: '1.5px solid #E7ECF1',
                  color: '#2B2E38',
                }}
                placeholder="Email"
                required
                autoFocus
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5 px-5 rounded-2xl text-[14px] outline-none transition-all"
                style={{
                  background: '#fff',
                  border: '1.5px solid #E7ECF1',
                  color: '#2B2E38',
                }}
                placeholder="Password"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-semibold text-[15px] disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{
                  background: '#363A47',
                  color: '#F7F9FA',
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-16 px-10 py-3.5 rounded-full font-semibold text-[14px] transition-all active:scale-95"
            style={{
              background: '#D0D9E2',
              color: '#2B2E38',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 16px rgba(54,58,71,0.08)',
            }}
          >
            Sign In
          </button>
        )}
      </div>

      {/* ── Bottom: version ── */}
      <p className="relative z-10 pb-8 text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(54,58,71,0.35)' }}>
        Update 1.2
      </p>
    </div>
  )
}
