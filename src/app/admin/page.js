'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
    if (authStatus === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/calendar')
  }, [authStatus, session, router])

  const fetchUsers = () => {
    fetch('/api/users').then((r) => r.json()).then(setUsers).catch(() => {})
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create user')
      setSubmitting(false)
      return
    }
    setForm({ name: '', email: '', password: '', role: 'VIEWER' })
    setShowForm(false)
    setSubmitting(false)
    fetchUsers()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchUsers()
  }

  const avatarGradients = [
    'from-[#363A47] to-[#6B7B8D]',
    'from-[#6B7B8D] to-coral',
    'from-[#7C6FD4] to-[#A78BFA]',
    'from-[#F59E0B] to-[#EF4444]',
    'from-[#10B981] to-[#3B82F6]',
    'from-[#EC4899] to-[#8B5CF6]',
    'from-[#F97316] to-[#DB2777]',
    'from-[#06B6D4] to-[#8B5CF6]',
  ]

  return (
    <div className="min-h-screen pb-safe-nav">
      <div className="liquid-glass px-5 pt-12 pb-4 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="font-display text-3xl font-black italic text-gray-800">Team</h1>
            <p className="text-xs text-gray-500">{users.length} team members</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="liquid-gradient-btn px-4 py-2 text-sm">
            {showForm ? 'Cancel' : '+ Add User'}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {showForm && (
          <form onSubmit={handleCreate} className="liquid-glass-card p-5 space-y-3 animate-slide-up">
            <h3 className="text-sm font-bold text-gray-700">New Team Member</h3>
            {error && <div className="bg-red-50 text-red-600 text-xs p-2.5 rounded-xl">{error}</div>}
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#6B7B8D]/20 border border-white/40"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#6B7B8D]/20 border border-white/40"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#6B7B8D]/20 border border-white/40"
              required
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#6B7B8D]/20 border border-white/40"
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
              <option value="APPROVER">Approver</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" disabled={submitting} className="w-full liquid-gradient-btn py-3 text-sm disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        )}

        {users.map((u, i) => (
          <div key={u.id} className="liquid-glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center flex-shrink-0`}>
              <span className="text-sm font-bold text-white">{u.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-700 truncate">{u.name}</p>
              </div>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
            </div>
            {u.id !== session?.user?.id && (
              <button onClick={() => handleDelete(u.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  )
}
