import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createEvent, searchEvents, updateEvent, getTodayBrief, getAnalytics } from '@/lib/agent-tools'

export const maxDuration = 120

const SYSTEM_PROMPT = `You are Sims GPT, the personal AI assistant for Sima Ganwani Ved — Founder & Chairwoman of Apparel Group, Dubai. You manage her brand calendar, create content, and provide strategic insights.

Sima's brand portfolio includes: Guess, Tommy Hilfiger, Calvin Klein, DKNY, Aeropostale, Nine West, Aldo, Skechers, Charles & Keith, Tim Hortons, Victoria's Secret, and many more across 2,200+ stores in 14 countries with 22,000+ employees.

She is @thesimaved on Instagram and LinkedIn. She appeared on Shark Tank Dubai Season 2, is Forbes Top 100 (#12), and YPO MENA STAR.

Event categories: Brand Events, Conferences, Internal Communications, Social Greetings.
Priority levels: CRITICAL, HIGH, MEDIUM, LOW.

## YOUR TOOLS (call by responding with JSON)

You have access to these database tools. To use them, respond with ONLY a JSON block like this:
\`\`\`json
{"tool": "tool_name", "params": {...}}
\`\`\`

Available tools:

1. **search_events** — Search and filter calendar events
   Params: { "query": "optional search text", "dateFrom": "DD Mon YYYY", "dateTo": "DD Mon YYYY", "category": "Brand Events|Conferences|Internal Communications|Social Greetings", "status": "Not Started|In Progress|Completed|Cancelled", "priority": "CRITICAL|HIGH|MEDIUM|LOW", "limit": 10 }
   All params are optional.

2. **create_event** — Create a new calendar event
   Params: { "title": "Event title (required)", "date": "DD Mon YYYY (required)", "category": "optional", "priority": "optional, default MEDIUM", "opportunityType": "optional", "platforms": "optional", "notes": "optional" }

3. **update_event** — Update an existing event (need eventId from search results)
   Params: { "eventId": "the event ID (required)", "status": "optional new status", "notes": "optional new notes", "priority": "optional new priority" }

4. **get_today_brief** — Get today's events + upcoming 7 days + stats
   Params: {} (no params needed)

5. **get_analytics** — Get full analytics: totals by category/priority/status/month
   Params: {} (no params needed)

## RULES
- When the user asks about schedule/events/calendar, USE search_events or get_today_brief.
- When the user asks to add/create/schedule an event, USE create_event. Format dates as "DD Mon YYYY".
- When the user asks to update/change/modify an event, first search for it, then use update_event.
- When the user asks about stats/analytics/overview, USE get_analytics.
- If you need to call a tool, respond with ONLY the JSON block. Nothing else.
- If you can answer directly without tools, just respond normally with text.
- After receiving tool results, give a clear, helpful summary to the user.
- Be professional, concise, and proactive. Use emojis sparingly.
- Today's date is ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`

// ─── Available tools map ───
const TOOLS = {
  search_events: searchEvents,
  create_event: createEvent,
  update_event: updateEvent,
  get_today_brief: getTodayBrief,
  get_analytics: getAnalytics,
}

// ─── Call OpenClaw webhook ───
async function callOpenClaw(message) {
  const tunnelUrl = process.env.OPENCLAW_TUNNEL_URL
  const secret = process.env.OPENCLAW_WEBHOOK_SECRET

  if (!tunnelUrl) throw new Error('OPENCLAW_TUNNEL_URL not configured')

  const res = await fetch(tunnelUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'X-Webhook-Secret': secret } : {}),
    },
    body: JSON.stringify({ message, agent: 'main' }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`OpenClaw returned ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return data.result || data.response || data.message || data.output || ''
}

// ─── Parse tool call from OpenClaw response ───
function parseToolCall(text) {
  if (!text) return null
  // Try to find JSON block with tool field
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{"tool"\s*:[\s\S]*?\})/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[1])
    if (parsed.tool && TOOLS[parsed.tool]) {
      return { tool: parsed.tool, params: parsed.params || {} }
    }
  } catch {}
  return null
}

// ─── Build AI SDK v6 stream response ───
function streamResponse(text) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
      controller.enqueue(encoder.encode(`e:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 0, completionTokens: 0 }, isContinued: false })}\n`))
      controller.enqueue(encoder.encode(`d:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 0, completionTokens: 0 } })}\n`))
      controller.close()
    },
  })
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
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

  const { messages: rawMessages } = body

  if (!rawMessages || !Array.isArray(rawMessages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  // AI SDK v6: convert UIMessage[] to clean messages
  const messages = rawMessages.map(msg => {
    if (Array.isArray(msg.parts)) {
      const text = msg.parts.filter(p => p.type === 'text').map(p => p.text || '').join('')
      return { role: msg.role, content: text || '' }
    }
    if (typeof msg.content === 'string') return { role: msg.role, content: msg.content }
    if (Array.isArray(msg.content)) {
      const text = msg.content.map(p => typeof p === 'string' ? p : p?.text || '').join('')
      return { role: msg.role, content: text || '' }
    }
    return { role: msg.role, content: '' }
  })

  try {
    // ─── PHASE 1: Send conversation to OpenClaw ───
    let prompt = SYSTEM_PROMPT + '\n\n'
    const recentMessages = messages.slice(-12)
    prompt += 'Conversation:\n'
    for (const msg of recentMessages) {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
    }
    prompt += '\nAssistant:'

    const phase1Response = await callOpenClaw(prompt)

    // ─── PHASE 2: Check if OpenClaw wants to call a tool ───
    const toolCall = parseToolCall(phase1Response)

    if (toolCall) {
      console.log(`[Sims GPT] Tool call: ${toolCall.tool}`, JSON.stringify(toolCall.params))

      // Execute the tool on the VPS database
      let toolResult
      try {
        toolResult = await TOOLS[toolCall.tool](toolCall.params)
      } catch (toolErr) {
        console.error(`[Sims GPT] Tool ${toolCall.tool} failed:`, toolErr?.message)
        toolResult = { error: toolErr?.message || 'Tool execution failed' }
      }

      // ─── PHASE 3: Send tool results back to OpenClaw for final response ───
      const phase2Prompt = `${SYSTEM_PROMPT}

The user asked: "${messages.filter(m => m.role === 'user').pop()?.content || ''}"

You called the tool "${toolCall.tool}" with params: ${JSON.stringify(toolCall.params)}

Tool result:
${JSON.stringify(toolResult, null, 2)}

Now give the user a clear, helpful response based on these results. Do NOT output JSON. Respond naturally.`

      const finalResponse = await callOpenClaw(phase2Prompt)
      return streamResponse(finalResponse || 'I found the data but got an empty response. Please try again.')
    }

    // No tool call — direct text response
    return streamResponse(phase1Response || 'I received your message but got an empty response. Please try again.')
  } catch (error) {
    console.error('Sims GPT chat error:', error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to process chat request. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
