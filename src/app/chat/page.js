'use client'
import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

// ── Helpers ──────────────────────────────────────────────────────────────────

const TOOL_LABELS = {
  create_event:  { icon: '📅', loading: 'Creating event...', done: 'Event created' },
  search_events: { icon: '🔍', loading: 'Searching events...', done: 'Search complete' },
  update_event:  { icon: '✏️', loading: 'Updating event...', done: 'Event updated' },
  get_today_brief: { icon: '☀️', loading: 'Fetching brief...', done: 'Brief ready' },
  get_analytics: { icon: '📊', loading: 'Pulling analytics...', done: 'Analytics ready' },
}

function toolLabel(name) {
  return TOOL_LABELS[name] || { icon: '🔧', loading: 'Working...', done: 'Done' }
}

/** Extract text from a message — handles AI SDK v6 parts array and legacy content */
function getMessageText(message) {
  // AI SDK v6: check parts array first
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter(p => p.type === 'text')
      .map(p => p.text || '')
      .join('')
  }
  // Legacy: string content
  if (typeof message.content === 'string') return message.content
  // Legacy: array content
  if (Array.isArray(message.content)) {
    return message.content.map(p => typeof p === 'string' ? p : p?.text || '').join('')
  }
  return ''
}

/** Get tool invocations from a message — handles parts array and legacy */
function getToolInvocations(message) {
  // AI SDK v6: extract from parts
  if (Array.isArray(message.parts)) {
    return message.parts.filter(p => p.type === 'tool-invocation').map(p => p.toolInvocation || p)
  }
  // Legacy
  return message.toolInvocations || []
}

/** Very lightweight "markdown" — handles **bold**, *italic*, `code`, and lists */
function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bullet lists
    if (/^\s*[-*]\s/.test(line)) {
      const content = line.replace(/^\s*[-*]\s/, '')
      return (
        <div key={i} className="flex gap-1.5 pl-1 mb-0.5">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
          <span>{formatInline(content)}</span>
        </div>
      )
    }
    // Numbered lists
    if (/^\s*\d+[.)]\s/.test(line)) {
      const num = line.match(/^\s*(\d+)/)[1]
      const content = line.replace(/^\s*\d+[.)]\s/, '')
      return (
        <div key={i} className="flex gap-1.5 pl-1 mb-0.5">
          <span className="opacity-60 shrink-0 text-xs mt-0.5">{num}.</span>
          <span>{formatInline(content)}</span>
        </div>
      )
    }
    // Empty line → small spacer
    if (!line.trim()) return <div key={i} className="h-2" />
    // Regular paragraph
    return <p key={i} className="mb-1">{formatInline(line)}</p>
  })
}

function formatInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(54,58,71,0.08)' }}>{part.slice(1, -1)}</code>
    return part
  })
}

// ── Quick Action Chips ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { emoji: '☀️', label: 'Brief me today', prompt: 'Brief me on today\'s schedule and pending items' },
  { emoji: '📅', label: 'Add event', prompt: 'I need to add a new event' },
  { emoji: '✍️', label: 'Draft caption', prompt: 'Draft an Instagram caption for' },
  { emoji: '🔍', label: 'Research', prompt: 'Research the latest trends in' },
  { emoji: '📊', label: 'Analytics', prompt: 'Show me event analytics and stats' },
]

// ── Tool Invocation Card ────────────────────────────────────────────────────

function ToolCard({ invocation }) {
  const label = toolLabel(invocation.toolName)
  const isToolLoading = invocation.state === 'call' || invocation.state === 'partial-call'
  const isResult = invocation.state === 'result'

  let resultSummary = null
  if (isResult && invocation.result) {
    const r = invocation.result
    if (invocation.toolName === 'create_event' && r.title) {
      resultSummary = `${r.title} — ${r.date || ''}`
    } else if (invocation.toolName === 'search_events' && Array.isArray(r.events)) {
      resultSummary = `Found ${r.events.length} event${r.events.length !== 1 ? 's' : ''}`
    } else if (invocation.toolName === 'update_event' && r.title) {
      resultSummary = `${r.title} updated`
    } else if (invocation.toolName === 'get_today_brief') {
      const count = r.todayCount ?? r.total ?? (Array.isArray(r.events) ? r.events.length : null)
      resultSummary = count != null ? `${count} event${count !== 1 ? 's' : ''} today` : 'Brief loaded'
    } else if (invocation.toolName === 'get_analytics') {
      resultSummary = r.total != null ? `${r.total} total events tracked` : 'Analytics loaded'
    } else if (typeof r === 'string') {
      resultSummary = r.length > 80 ? r.slice(0, 77) + '...' : r
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl mt-1 mb-1 text-xs"
      style={{
        background: isResult ? 'rgba(54,58,71,0.06)' : 'rgba(107,123,141,0.08)',
        border: '1px solid rgba(54,58,71,0.08)',
      }}
    >
      <span className="text-sm">{label.icon}</span>
      <div className="flex-1 min-w-0">
        <span style={{ color: '#363A47' }} className="font-medium">
          {isToolLoading ? label.loading : label.done}
        </span>
        {resultSummary && (
          <span className="block text-gray-500 truncate mt-0.5">{isResult ? '✅ ' : ''}{resultSummary}</span>
        )}
      </div>
      {isToolLoading && (
        <span className="flex gap-0.5">
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '150ms' }} />
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '300ms' }} />
        </span>
      )}
    </div>
  )
}

// ── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const textContent = getMessageText(message)
  const toolInvocations = getToolInvocations(message)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full shrink-0 mt-1 mr-2 flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}
        >
          S
        </div>
      )}

      <div className="max-w-[80%] flex flex-col gap-0.5">
        {textContent ? (
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? 'text-white rounded-2xl rounded-br-sm'
                : 'rounded-2xl rounded-bl-sm'
            }`}
            style={
              isUser
                ? { background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }
                : {
                    background: 'rgba(247,249,250,0.65)',
                    backdropFilter: 'blur(36px)',
                    WebkitBackdropFilter: 'blur(36px)',
                    border: '1px solid rgba(247,249,250,0.65)',
                    color: '#1f1f1f',
                  }
            }
          >
            {isUser ? textContent : renderMarkdown(textContent)}
          </div>
        ) : null}

        {toolInvocations.map((inv, i) => (
          <ToolCard key={inv.toolCallId || i} invocation={inv} />
        ))}
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const inputRef = useRef(null)

  // Local input state (AI SDK v6 removed input management from useChat)
  const [input, setInput] = useState('')

  // Media attachment state
  const [attachment, setAttachment] = useState(null) // { file, preview, uploading }
  const fileInputRef = useRef(null)

  // Voice state
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef(null)

  const [chatError, setChatError] = useState(null)

  // AI SDK v6 useChat — returns sendMessage, status, messages, error
  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    api: '/api/chat',
    onError: (err) => {
      console.error('Chat error:', err)
      setChatError(err?.message || 'Something went wrong. Please try again.')
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  // ── Check SpeechRecognition support ─────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      setSpeechSupported(!!SR)
    }
  }, [])

  // ── Auto-scroll to newest message ───────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  // ── Handle file selection ───────────────────────────────────────────────
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = file.type.startsWith('video/')
      ? null
      : URL.createObjectURL(file)
    setAttachment({ file, preview, type: file.type.startsWith('video/') ? 'video' : 'image' })
  }

  // ── Send message handler ───────────────────────────────────────────────
  async function handleSend(text) {
    const trimmed = (text || '').trim()
    if ((!trimmed && !attachment) || isLoading) return
    setInput('')

    let mediaUrl = ''
    if (attachment?.file) {
      setAttachment(prev => ({ ...prev, uploading: true }))
      try {
        const formData = new FormData()
        formData.append('file', attachment.file)
        const res = await fetch('/api/chat/upload', { method: 'POST', body: formData })
        const data = await res.json()
        mediaUrl = data.fullUrl || data.url || ''
      } catch (err) {
        console.error('Upload failed:', err)
      }
      setAttachment(null)
    }

    // Build message with media URL if present
    let msg = trimmed
    if (mediaUrl) {
      const prefix = attachment?.type === 'video' ? '[Video attached]' : '[Image attached]'
      msg = mediaUrl + (trimmed ? `\n${trimmed}` : `\n${prefix} Please analyze this.`)
    }

    sendMessage({ text: msg })
  }

  // ── Voice input logic ───────────────────────────────────────────────────
  function toggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      if (transcript.trim()) {
        handleSend(transcript)
      }
      setIsListening(false)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (authStatus === 'loading') return null

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: '#F7F9FA' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 pt-12 pb-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(247,249,250,0.8) 0%, rgba(208,217,226,0.35) 50%, rgba(247,249,250,0.75) 100%)',
          backdropFilter: 'blur(40px) saturate(2)',
          WebkitBackdropFilter: 'blur(40px) saturate(2)',
          borderRadius: '0 0 24px 24px',
          borderBottom: '1.5px solid rgba(247,249,250,0.7)',
          boxShadow: '0 8px 32px rgba(54,58,71,0.06)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #6B7B8D, transparent 70%)' }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #363A47, transparent 70%)' }} />
          <div className="absolute top-4 right-24 w-16 h-16 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #D0D9E2, transparent 70%)' }} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => router.push('/calendar')}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{ background: 'rgba(54,58,71,0.08)' }}
          >
            <svg className="w-5 h-5" style={{ color: '#363A47' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}
          >
            S
          </div>
          <div>
            <h1 className="font-display text-2xl font-black italic text-gray-800">Sims GPT</h1>
            <p className="text-xs text-gray-500 -mt-0.5">Your AI assistant</p>
          </div>
        </div>
      </div>

      {/* ── Quick Action Chips ──────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: 'rgba(247,249,250,0.65)',
                backdropFilter: 'blur(36px)',
                WebkitBackdropFilter: 'blur(36px)',
                border: '1px solid rgba(247,249,250,0.65)',
                color: '#363A47',
              }}
            >
              <span>{action.emoji}</span>
              <span className="whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages Area ───────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-12 animate-fade-in">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D, #D0D9E2)' }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold italic text-gray-800 mb-1">
              Hi, how can I help?
            </h2>
            <p className="text-sm text-gray-500 text-center max-w-xs leading-relaxed">
              I can manage your calendar, draft content, research trends, and give you analytics. Just ask.
            </p>
          </div>
        )}

        {/* Message list */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start animate-fade-in">
            <div
              className="w-7 h-7 rounded-full shrink-0 mt-1 mr-2 flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}
            >
              S
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{
                background: 'rgba(247,249,250,0.65)',
                backdropFilter: 'blur(36px)',
                WebkitBackdropFilter: 'blur(36px)',
                border: '1px solid rgba(247,249,250,0.65)',
              }}
            >
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        {/* Error display */}
        {(chatError || error) && (
          <div className="mx-2 mb-2 px-4 py-3 rounded-2xl text-sm animate-fade-in" style={{ background: 'rgba(212,54,92,0.1)', border: '1px solid rgba(212,54,92,0.2)', color: '#D4365C' }}>
            {chatError || error?.message || 'Something went wrong. Please try again.'}
            <button onClick={() => setChatError(null)} className="ml-2 font-bold">✕</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-2 pb-24">
        {/* Listening indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#e53e3e' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#e53e3e' }} />
            </span>
            <span className="text-xs font-medium" style={{ color: '#e53e3e' }}>
              Listening...
            </span>
          </div>
        )}

        {/* Attachment preview */}
        {attachment && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(54,58,71,0.08)' }}>
              {attachment.type === 'video' ? (
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#6B7B8D" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                </div>
              ) : (
                <img src={attachment.preview} alt="" className="w-16 h-16 object-cover" />
              )}
              {attachment.uploading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
              )}
            </div>
            <span className="text-xs truncate max-w-[150px]" style={{ color: '#6B7B8D' }}>{attachment.file.name}</span>
            <button type="button" onClick={() => setAttachment(null)} className="text-xs" style={{ color: '#e53e3e' }}>Remove</button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend(input)
          }}
          className="flex items-end gap-2"
        >
          <div
            className="flex-1 flex items-end rounded-2xl px-4 py-2.5"
            style={{
              background: 'rgba(247,249,250,0.65)',
              backdropFilter: 'blur(36px)',
              WebkitBackdropFilter: 'blur(36px)',
              border: '1.5px solid rgba(247,249,250,0.7)',
              boxShadow: '0 4px 16px rgba(54,58,71,0.06)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(input)
                }
              }}
              placeholder="Ask Sims GPT..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none max-h-24"
              style={{
                fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
                lineHeight: '1.5',
              }}
            />

            {/* Attach media button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ml-2 shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(54,58,71,0.08)', color: '#6B7B8D' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
            </button>

            {/* Mic button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                className={`ml-2 shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isListening ? 'animate-pulse' : ''
                }`}
                style={{
                  background: isListening
                    ? 'linear-gradient(135deg, #e53e3e, #c53030)'
                    : 'rgba(54,58,71,0.08)',
                  color: isListening ? '#fff' : '#6B7B8D',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachment) || isLoading}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
            style={{
              background: (input.trim() || attachment)
                ? 'linear-gradient(135deg, #363A47, #6B7B8D)'
                : 'rgba(54,58,71,0.12)',
              boxShadow: (input.trim() || attachment) ? '0 4px 16px rgba(54,58,71,0.3)' : 'none',
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={(input.trim() || attachment) ? '#fff' : '#6B7B8D'} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>

      <Navbar />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
