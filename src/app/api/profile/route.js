import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PATCH(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, currentPassword, newPassword } = await req.json()

  // Update name
  if (name) {
    await prisma.user.update({ where: { id: session.user.id }, data: { name } })
  }

  // Update password
  if (currentPassword && newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })
  }

  const updated = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  })
  return NextResponse.json(updated)
}
