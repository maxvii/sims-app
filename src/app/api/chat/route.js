import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createEvent, searchEvents, updateEvent, getTodayBrief, getAnalytics } from '@/lib/agent-tools'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const maxDuration = 60

const SYSTEM_PROMPT = `You are Sims GPT, the personal AI assistant for Sima Ganwani Ved — Founder & Chairwoman of Apparel Group, Dubai. You manage her brand calendar, create content, and provide strategic insights.

Sima's brand portfolio includes: Guess, Tommy Hilfiger, Calvin Klein, DKNY, Aeropostale, Nine West, Aldo, Skechers, Charles & Keith, Tim Hortons, Victoria's Secret, and many more across 2,200+ stores in 14 countries with 22,000+ employees.

She is @thesimaved on Instagram and LinkedIn. She appeared on Shark Tank Dubai Season 2, is Forbes Top 100 (#12), and YPO MENA STAR.

Event categories: Social/Key Moments, Sponsorships, Corporate Campaign, Corporate Event, Gifting, PR Birthdays, HR & CSR, Coca Cola Arena.
Priority levels: CRITICAL, HIGH, MEDIUM, LOW.

You can help with: scheduling events, reviewing the calendar, drafting content, providing analytics, and strategic advice.

Be professional, concise, and proactive. Never mention OpenClaw or any backend system. You are Sims GPT.`

// Process tool calls from the AI response
async function processToolCall(name, args) {
  switch (name) {
    case 'create_event': return await createEvent(args)
    case 'search_events': return await searchEvents(args)
    case 'update_event': return await updateEvent(args)
    case 'get_today_brief': return await getTodayBrief()
    case 'get_analytics': return await getAnalytics()
    default: return { error: `Unknown tool: ${name}` }
  }
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

  // Get last user message
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMsg) {
    return new Response(JSON.stringify({ error: 'No user message found' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const userText = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : lastUserMsg.content?.map(c => c.text).join(' ') || ''

  try {
    // Build context from conversation history (last 10 messages)
    const recentHistory = messages.slice(-10).map(m => {
      const role = m.role === 'user' ? 'User' : 'Assistant'
      const text = typeof m.content === 'string' ? m.content : m.content?.map(c => c.text).join(' ') || ''
      return `${role}: ${text}`
    }).join('\n')

    // Combine system prompt + context + user message for OpenClaw
    const fullPrompt = `${SYSTEM_PROMPT}\n\nRecent conversation:\n${recentHistory}\n\nRespond to the user's latest message. If they want to add/search/update events or get a brief/analytics, say TOOL_CALL:<toolname>:<json_args> on a separate line, then continue your response. Available tools: create_event, search_events, update_event, get_today_brief, get_analytics.`

    // Call OpenClaw agent on VPS (runs locally since app is on same VPS)
    const escapedPrompt = userText.replace(/'/g, "'\\''").replace(/\n/g, ' ')
    const { stdout } = await execAsync(
      `openclaw agent --local --session-id "simzgpt-${session.user.id}" -m '${escapedPrompt}' --json`,
      { timeout: 55000, env: { ...process.env, PATH: '/usr/local/bin:/usr/bin:/bin:/root/.nvm/versions/node/v22.22.2/bin' } }
    )

    const result = JSON.parse(stdout)
    const aiText = result?.payloads?.[0]?.text || 'I apologize, I was unable to process your request. Please try again.'

    // Check for tool calls in the response and execute them
    let finalText = aiText
    const toolCallRegex = /TOOL_CALL:(\w+):(\{.*?\})/g
    let match
    while ((match = toolCallRegex.exec(aiText)) !== null) {
      const toolName = match[1]
      try {
        const toolArgs = JSON.parse(match[2])
        const toolResult = await processToolCall(toolName, toolArgs)
        finalText = finalText.replace(match[0], `\n✅ Done. ${JSON.stringify(toolResult).slice(0, 200)}`)
      } catch (e) {
        finalText = finalText.replace(match[0], `\n❌ Error: ${e.message}`)
      }
    }

    // Stream the response using SSE format matching Vercel AI SDK UI protocol
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: {"type":"start"}\n\n`))
        controller.enqueue(encoder.encode(`data: {"type":"start-step"}\n\n`))
        controller.enqueue(encoder.encode(`data: {"type":"text-start","id":"txt-0"}\n\n`))

        // Send text in chunks for streaming feel
        const words = finalText.split(' ')
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
