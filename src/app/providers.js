'use client'
import { SessionProvider } from 'next-auth/react'
import PushInit from '@/components/PushInit'

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <PushInit />
      {children}
    </SessionProvider>
  )
}
