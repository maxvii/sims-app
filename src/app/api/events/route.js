import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const where = {}
  if (month) where.month = month
  if (status) where.status = status
  if (priority) where.priority = priority

  const events = await prisma.event.findMany({
    where,
    include: { comments: { include: { user: { select: { name: true } } } }, approvals: true },
    orderBy: { number: 'asc' },
  })
  return NextResponse.json(events)
}
