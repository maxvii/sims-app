'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function AppHeader() {
  const { data: session } = useSession()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!session) return
    const poll = () =>
      fetch('/api/notifications')
        .then((r) => r.json())
        .then((data) => setUnread(data.filter((n) => !n.read).length))
        .catch(() => {})
    poll()
    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [session])

  return (
    <div
      className="flex items-center justify-between px-4 h-12 sticky top-0 z-40"
      style={{
        background: 'rgba(26,16,32,0.45)',
        backdropFilter: 'blur(30px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
        borderBottom: '1px solid rgba(248,244,233,0.08)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
      }}
    >
      {/* Logo + Brand */}
      <Link href="/calendar" className="flex items-center gap-2">
        <img
          src="/images/simz-logo.png"
          alt="Simz"
          className="w-6 h-6 object-contain"
          style={{ filter: 'drop-shadow(0 1px 4px rgba(246,219,192,0.3))' }}
        />
        <span
          className="font-script text-lg leading-none"
          style={{ color: '#F6DBC0' }}
        >
          Simz
        </span>
      </Link>

      {/* Notification Bell */}
      <Link href="/notifications" className="relative p-1.5 rounded-full transition-all active:scale-95">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          style={{ color: 'rgba(246,219,192,0.7)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </div>
  )
}
