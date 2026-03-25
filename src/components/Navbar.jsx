'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!session) return
    const poll = () => fetch('/api/notifications').then((r) => r.json()).then((data) => setUnread(data.filter((n) => !n.read).length)).catch(() => {})
    poll()
    const interval = setInterval(poll, 15000)
    return () => clearInterval(interval)
  }, [session])

  const nav = [
    { href: '/calendar', label: 'Home', icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
    )},
    { href: '/notifications', label: 'Alerts', icon: (
      <div className="relative">
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-priority-critical text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
        )}
      </div>
    )},
    ...(session?.user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Team', icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
    )}] : []),
    { href: '/profile', label: 'You', icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
    )},
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-3 mb-2 liquid-glass" style={{ borderRadius: '20px' }}>
        <div className="flex justify-around items-center py-2.5 px-2 max-w-lg mx-auto">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-all ${active ? 'text-mauve' : 'text-gray-400 hover:text-gray-500'}`}>
                {item.icon}
                <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
