import { streamText, tool, stepCountIs } from 'ai'
import { createGroq } from '@ai-sdk/groq'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createEvent, searchEvents, updateEvent, getTodayBrief, getAnalytics } from '@/lib/agent-tools'

export const maxDuration = 60

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

  // AI SDK v6: client sends UIMessage[] with parts array — convert to clean ModelMessage[]
  const messages = rawMessages.map(msg => {
    if (Array.isArray(msg.parts)) {
      const text = msg.parts
        .filter(p => p.type === 'text')
        .map(p => p.text || '')
        .join('')
      return { role: msg.role, content: text || '' }
    }
    if (typeof msg.content === 'string') {
      return { role: msg.role, content: msg.content }
    }
    if (Array.isArray(msg.content)) {
      const text = msg.content
        .map(p => typeof p === 'string' ? p : p?.text || '')
        .join('')
      return { role: msg.role, content: text || '' }
    }
    return { role: msg.role, content: '' }
  })

  try {
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are Sims GPT, the personal AI assistant for Sima Ganwani Ved — Founder & Chairwoman of Apparel Group, Dubai. You manage her brand calendar, create content, and provide strategic insights.

Sima's brand portfolio includes: Guess, Tommy Hilfiger, Calvin Klein, DKNY, Aeropostale, Nine West, Aldo, Skechers, Charles & Keith, Tim Hortons, Victoria's Secret, and many more across 2,200+ stores in 14 countries with 22,000+ employees.

She is @thesimaved on Instagram and LinkedIn. She appeared on Shark Tank Dubai Season 2, is Forbes Top 100 (#12), and YPO MENA STAR.

Event categories available: Brand Events, Conferences, Internal Communications, Social Greetings.

Priority levels: CRITICAL, HIGH, MEDIUM, LOW.

When users ask to add events via voice or text, extract the details (title, date, category, priority) and use the create_event tool. Format dates as 'DD Mon YYYY' (e.g. '07 Apr 2026').

When asked about schedule, use search_events or get_today_brief tools.

Be professional, concise, and proactive. Use emojis sparingly. Always confirm actions taken.`,
      messages,
      stopWhen: stepCountIs(5),
      tools: {
        create_event: tool({
          description: 'Create a new calendar event for Sima Ved. Use this when the user asks to add, schedule, or create an event.',
          parameters: z.object({
            title: z.string().describe('The event title'),
            date: z.string().describe('Event date in "DD Mon YYYY" format, e.g. "07 Apr 2026"'),
            category: z.enum([
              'Brand Events',
              'Conferences',
              'Internal Communications',
              'Social Greetings',
            ]).optional().describe('Event category'),
            priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Event priority level'),
            opportunityType: z.string().optional().describe('Type of opportunity, e.g. "Instagram Reel", "Press Release"'),
            platforms: z.string().optional().describe('Target platforms, e.g. "Instagram, LinkedIn"'),
            notes: z.string().optional().describe('Additional notes for the event'),
          }),
          execute: async (params) => {
            return await createEvent(params)
          },
        }),

        search_events: tool({
          description: 'Search and filter calendar events. Use this when the user asks about upcoming events, schedule, or searches for specific events.',
          parameters: z.object({
            query: z.string().optional().describe('Search query to match against event titles and notes'),
            dateFrom: z.string().optional().describe('Start date filter in "DD Mon YYYY" format'),
            dateTo: z.string().optional().describe('End date filter in "DD Mon YYYY" format'),
            category: z.string().optional().describe('Filter by event category'),
            status: z.string().optional().describe('Filter by status: UPCOMING, IN_PROGRESS, COMPLETED, CANCELLED'),
            priority: z.string().optional().describe('Filter by priority: CRITICAL, HIGH, MEDIUM, LOW'),
            limit: z.number().optional().describe('Maximum number of results to return'),
          }),
          execute: async (params) => {
            return await searchEvents(params)
          },
        }),

        update_event: tool({
          description: 'Update an existing calendar event. Use this when the user asks to change status, add notes, or modify an event.',
          parameters: z.object({
            eventId: z.string().describe('The ID of the event to update'),
            status: z.string().optional().describe('New status: UPCOMING, IN_PROGRESS, COMPLETED, CANCELLED'),
            notes: z.string().optional().describe('Updated notes for the event'),
            priority: z.string().optional().describe('Updated priority: CRITICAL, HIGH, MEDIUM, LOW'),
          }),
          execute: async (params) => {
            return await updateEvent(params)
          },
        }),

        get_today_brief: tool({
          description: 'Get a brief summary of today\'s events and upcoming priorities. Use this when the user asks "what\'s on today", "daily brief", or similar.',
          parameters: z.object({}),
          execute: async () => {
            return await getTodayBrief()
          },
        }),

        get_analytics: tool({
          description: 'Get analytics and statistics about the calendar events. Use this when the user asks about metrics, stats, or overview numbers.',
          parameters: z.object({}),
          execute: async () => {
            return await getAnalytics()
          },
        }),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Sims GPT chat error:', error?.message || error)
    console.error('Stack:', error?.stack)
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to process chat request. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
