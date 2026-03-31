'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user?.name) setNewName(session.user.name)
  }, [session])

  if (!session) return null

  const handleSaveName = async () => {
    if (!newName.trim() || newName === session.user.name) { setEditingName(false); return }
    setSaving(true)
    setMessage({ type: '', text: '' })
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) {
      // Trigger session refresh — JWT callback fetches fresh name from DB
      await update({})
      setMessage({ type: 'success', text: 'Name updated' })
      setEditingName(false)
    } else {
      setMessage({ type: 'error', text: 'Failed to update name' })
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    setMessage({ type: '', text: '' })
    if (!currentPassword || !newPassword) { setMessage({ type: 'error', text: 'Fill in all fields' }); return }
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Passwords do not match' }); return }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (res.ok) {
      setMessage({ type: 'success', text: 'Password changed' })
      setChangingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      const data = await res.json()
      setMessage({ type: 'error', text: data.error || 'Failed to change password' })
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen pb-safe-nav">
      <div className="liquid-glass px-5 pt-12 pb-8 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <div className="relative z-10 mb-3">
          <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
        </div>
        <div className="flex flex-col items-center relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#502D55] to-[#935073] flex items-center justify-center mb-3 shadow-lg">
            <span className="text-2xl font-extrabold text-white">{session.user.name[0]}</span>
          </div>
          <h1 className="font-display text-xl font-black italic text-gray-800">{session.user.name}</h1>
          <p className="text-sm text-gray-500">{session.user.email}</p>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-3">
        {/* Status message */}
        {message.text && (
          <div className={`p-3 rounded-2xl text-center text-sm font-medium animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {message.text}
          </div>
        )}

        {/* Account Info */}
        <div className="liquid-glass-card p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account</h3>
          <div className="space-y-3">
            {/* Name - editable */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Name</span>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white/50 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40 w-36 text-right"
                    autoFocus
                  />
                  <button onClick={handleSaveName} disabled={saving} className="text-emerald-500 text-xs font-semibold">Save</button>
                  <button onClick={() => { setEditingName(false); setNewName(session.user.name) }} className="text-gray-500 text-xs">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{session.user.name}</span>
                  <button onClick={() => setEditingName(true)} className="text-[#935073] hover:text-[#502D55] transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-semibold text-gray-800">{session.user.email}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="liquid-glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</h3>
            {!changingPassword && (
              <button onClick={() => setChangingPassword(true)} className="text-xs font-semibold text-[#935073] hover:text-[#502D55] transition-colors">
                Change
              </button>
            )}
          </div>
          {changingPassword ? (
            <div className="space-y-3 animate-fade-in">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-white/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#935073]/20 border border-white/40"
              />
              <div className="flex gap-2">
                <button onClick={handleChangePassword} disabled={saving} className="flex-1 liquid-gradient-btn py-2.5 text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
                <button onClick={() => { setChangingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 bg-white/40">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">••••••••</p>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full liquid-glass-card p-4 text-center text-red-500 font-semibold text-sm hover:bg-red-50 transition-all"
        >
          Sign Out
        </button>
      </div>

      <Navbar />
    </div>
  )
}
