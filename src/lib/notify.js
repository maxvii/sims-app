import prisma from './prisma'
import { sendPushToUsers } from './sendPush'

/**
 * Create in-app notifications for all users except the actor,
 * AND send push notifications to their devices.
 */
export async function notifyOthers({ actorId, type, message, eventId, eventTitle }) {
  const others = await prisma.user.findMany({ where: { NOT: { id: actorId } }, select: { id: true } })
  if (others.length === 0) return

  const userIds = others.map((u) => u.id)

  // In-app notifications
  await prisma.notification.createMany({
    data: userIds.map((uid) => ({ userId: uid, type, message, eventId })),
  })

  // Push notifications
  await sendPushToUsers(userIds, {
    title: 'Sims App',
    body: message,
    tag: `${type}-${eventId || 'general'}`,
    url: eventId ? `/events/${eventId}` : '/notifications',
  })
}
