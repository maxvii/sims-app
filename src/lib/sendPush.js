import webpush from 'web-push'
import prisma from './prisma'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:sims@ai-gcc.com', VAPID_PUBLIC, VAPID_PRIVATE)
}

/**
 * Send push notification to all devices of specified user IDs.
 * Silently skips if VAPID keys not configured or no subscriptions found.
 */
export async function sendPushToUsers(userIds, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  })

  const promises = subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    } catch (err) {
      // If subscription expired (410 Gone), remove it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    }
  })

  await Promise.allSettled(promises)
}
