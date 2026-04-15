'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

export default function NotificationsPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then(setNotifications)
      .catch(() => {})
  }

  useEffect(() => { fetchNotifications() }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readAll: true }),
    })
    fetchNotifications()
  }

  const markRead = async (id, eventId) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (eventId) router.push(`/events/${eventId}`)
    else fetchNotifications()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const typeIcons = {
    COMMENT: <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
    APPROVAL: <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  }

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>
      {/* ── Minimal Header ── */}
      <div className="px-5 pt-14 pb-4">
        <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-black italic" style={{ color: '#2B2E38' }}>Alerts</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-semibold text-[#6B7B8D] hover:text-[#363A47]">
              Mark all read
            </button>
          )}
        </div>
        {unreadCount > 0 && <p className="text-xs text-gray-400 mt-1">{unreadCount} unread</p>}
      </div>

      <div className="px-4 pt-2 space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id, n.event?.id)}
            className={`p-4 w-full text-left flex items-start gap-3 transition-all active:scale-[0.98] rounded-2xl ${!n.read ? '' : 'opacity-70'}`}
            style={{
              background: '#fff',
              border: `1px solid ${!n.read ? 'rgba(107,123,141,0.2)' : '#E7ECF1'}`,
            }}
          >
            <div className="mt-0.5">{typeIcons[n.type] || typeIcons.COMMENT}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{n.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-[#6B7B8D] flex-shrink-0 mt-2" />}
          </button>
        ))}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#E7ECF1' }}
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}
