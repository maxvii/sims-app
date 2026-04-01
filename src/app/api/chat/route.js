import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createEvent, searchEvents, updateEvent, getTodayBrief, getAnalytics } from '@/lib/agent-tools'
import WebSocket from 'ws'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are Sims GPT, the personal AI assistant for Sima Ganwani Ved — Founder & Chairwoman of Apparel Group, Dubai. You manage her brand calendar, create content, and provide strategic insights.

Sima's brand portfolio includes: Guess, Tommy Hilfiger, Calvin Klein, DKNY, Aeropostale, Nine West, Aldo, Skechers, Charles & Keith, Tim Hortons, Victoria's Secret, and many more across 2,200+ stores in 14 countries with 22,000+ employees.

She is @thesimaved on Instagram and LinkedIn. She appeared on Shark Tank Dubai Season 2, is Forbes Top 100 (#12), and YPO MENA STAR.

Event categories: Social/Key Moments, Sponsorships, Corporate Campaign, Corporate Event, Gifting, PR Birthdays, HR & CSR, Coca Cola Arena.
Priority levels: CRITICAL, HIGH, MEDIUM, LOW.

You help with: scheduling events, reviewing the calendar, drafting content, providing analytics, and strategic advice.

Be professional, concise, and proactive. Never mention OpenClaw or any backend system. You are Sims GPT.`

// Call OpenClaw gateway via WebSocket
function callOpenClaw(message, sessionId) {
  return new Promise((resolve, reject) => {
    const gwUrl = process.env.OPENCLAW_GATEWAY_URL || 'ws://host.docker.internal:18789'
    const gwToken = process.env.OPENCLAW_GATEWAY_TOKEN || 'simzgpt2026'

    const ws = new WebSocket(`${gwUrl}?auth.token=${gwToken}`)
    let response = ''
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        ws.close()
        resolve(response || 'I apologize, the request timed out. Please try again.')
      }
    }, 50000)

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'agent.run',
        payload: {
          sessionId: sessionId,
          message: message,
          systemPrompt: SYSTEM_PROMPT,
        }
      }))
    })

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'agent.text' || msg.type === 'agent.delta') {
          response += msg.payload?.text || msg.payload?.delta || ''
        } else if (msg.type === 'agent.done' || msg.type === 'agent.complete') {
          clearTimeout(timeout)
          if (!resolved) {
            resolved = true
            ws.close()
            resolve(response || msg.payload?.text || 'Done.')
          }
        } else if (msg.type === 'agent.error') {
          clearTimeout(timeout)
          if (!resolved) {
            resolved = true
            ws.close()
            reject(new Error(msg.payload?.error || 'Agent error'))
          }
        }
      } catch (e) {
        // Non-JSON message, accumulate as text
        response += data.toString()
      }
    })

    ws.on('error', (err) => {
      clearTimeout(timeout)
      if (!resolved) {
        resolved = true
        reject(err)
      }
    })

    ws.on('close', () => {
      clearTimeout(timeout)
      if (!resolved) {
        resolved = true
        resolve(response || 'Connection closed.')
      }
    })
  })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  let body
  try {
    body = await req.json()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { messages } = body
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMsg) {
    return new Response(JSON.stringify({ error: 'No user message found' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const userText = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : lastUserMsg.content?.map(c => c.text).join(' ') || ''

  try {
    const sessionId = `simzgpt-${session.user.id}`
    const aiText = await callOpenClaw(userText, sessionId)

    // Stream the response in Vercel AI SDK UI format
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: {"type":"start"}\n\n`))
        controller.enqueue(encoder.encode(`data: {"type":"start-step"}\n\n`))
        controller.enqueue(encoder.encode(`data: {"type":"text-start","id":"txt-0"}\n\n`))

        const words = aiText.split(' ')
        for (let i = 0; i < words.length; i++) {
          const word = (i > 0 ? ' ' : '') + words[i]
          const escaped = JSON.stringify(word).slice(1, -1)
          controller.enqueue(encoder.encode(`data: {"type":"text-delta","id":"txt-0","delta":"${escaped}"}\n\n`))
        }

        controller.enqueue(encoder.encode(`data: {"type":"text-end","id":"txt-0"}\n\n`))
        controller.enqueue(encoder.encode(`data: {"type":"finish-step"}\n\n`))
        controller.enqueue(encoder.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Sims GPT error:', error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to process chat request.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
