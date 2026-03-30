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
    const poll = () =>
      fetch('/api/notifications')
        .then((r) => r.json())
        .then((data) => setUnread(data.filter((n) => !n.read).length))
        .catch(() => {})
    poll()
    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [session])

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/')
  const homeActive = isActive('/calendar')

  const nav = [
    {
      href: '/calendar',
      label: 'Home',
      active: homeActive,
      icon: (
        <svg className="w-[22px] h-[22px]" fill={homeActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={homeActive ? 0 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/events-calendar',
      label: 'Calendar',
      active: isActive('/events-calendar'),
      icon: (
        <svg className="w-[22px] h-[22px]" fill={isActive('/events-calendar') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/events-calendar') ? 0 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/chat',
      label: 'Sims GPT',
      isCenter: true,
      active: isActive('/chat'),
      icon: (
        <svg className="w-[26px] h-[26px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
    },
    {
      href: '/notifications',
      label: 'Alerts',
      active: isActive('/notifications'),
      icon: (
        <div className="relative">
          <svg className="w-[22px] h-[22px]" fill={isActive('/notifications') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/notifications') ? 0 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      ),
    },
    {
      href: '/profile',
      label: 'You',
      active: isActive('/profile'),
      icon: (
        <svg className="w-[22px] h-[22px]" fill={isActive('/profile') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/profile') ? 0 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div
        className="mx-3 mb-2"
        style={{
          background: 'linear-gradient(135deg, rgba(248,244,233,0.75) 0%, rgba(246,219,192,0.3) 50%, rgba(248,244,233,0.68) 100%)',
          backdropFilter: 'blur(40px) saturate(2)',
          WebkitBackdropFilter: 'blur(40px) saturate(2)',
          border: '1.5px solid rgba(248,244,233,0.7)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px rgba(80,45,85,0.1), inset 0 1.5px 0 rgba(248,244,233,0.85)',
        }}
      >
        <div className="flex justify-around items-end py-1.5 px-1 max-w-lg mx-auto">
          {nav.map((item) => {
            // Center Sims GPT tab — special elevated gradient orb
            if (item.isCenter) {
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-6 px-1">
                  <div
                    className={`w-[54px] h-[54px] rounded-full flex items-center justify-center mb-0.5 transition-all active:scale-95 ${item.active ? 'scale-105' : ''}`}
                    style={{
                      background: 'linear-gradient(135deg, #502D55, #935073)',
                      boxShadow: '0 6px 24px rgba(80,45,85,0.45), inset 0 1px 0 rgba(246,219,192,0.3)',
                      border: '2.5px solid rgba(248,244,233,0.6)',
                    }}
                  >
                    <span className="text-white">{item.icon}</span>
                  </div>
                  <span className="text-[8px] font-bold tracking-wide bg-gradient-to-r from-[#502D55] to-[#935073] bg-clip-text text-transparent">
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all active:scale-95 ${
                  item.active ? 'text-[#502D55]' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                {item.icon}
                <span className={`text-[9px] font-semibold tracking-wide ${item.active ? 'text-[#502D55]' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
