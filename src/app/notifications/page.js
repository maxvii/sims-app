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
    <div className="min-h-screen pb-safe-nav">
      <div className="liquid-glass px-5 pt-12 pb-4 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="font-display text-3xl font-black italic text-gray-800">Alerts</h1>
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-semibold text-pink-500 hover:text-pink-600">
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id, n.event?.id)}
            className={`liquid-glass-card p-4 w-full text-left flex items-start gap-3 transition-all hover:scale-[1.01] ${!n.read ? 'ring-1 ring-pink-200' : 'opacity-70'}`}
          >
            <div className="mt-0.5">{typeIcons[n.type] || typeIcons.COMMENT}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{n.message}</p>
              <p className="text-[10px] text-gray-500 mt-1">{new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-pink-500 flex-shrink-0 mt-1.5" />}
          </button>
        ))}

        {notifications.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-16">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            No notifications yet
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}
