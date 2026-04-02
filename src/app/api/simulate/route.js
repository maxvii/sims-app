// ─── OpenClaw gateway caller ───
async function callOpenClaw(message) {
  const url = process.env.OPENCLAW_URL || 'https://fool.khlije.app/agent'
  const token = process.env.OPENCLAW_TOKEN
  if (!token) throw new Error('OPENCLAW_TOKEN not configured')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ message, agent: 'main' }),
  })
  if (!res.ok) throw new Error(`OpenClaw returned ${res.status}: ${await res.text().catch(() => res.statusText)}`)
  const data = await res.json()
  return data.output || data.result || ''
}
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const maxDuration = 60

// ─── BASE METRICS (@thesimaved, 58K followers) ───
const FOLLOWERS = 58000
const BASE = {
  likes: 1500,
  comments: 65,
  saves: 110,
  shares: 45,
  reach: 15000,
  reel_views: 20000,
}

// ─── FORMAT MULTIPLIERS ───
const FORMAT_MULTIPLIERS = {
  reel:     { likes: 1.3, comments: 1.1, saves: 0.9, shares: 1.8, reach: 2.2 },
  carousel: { likes: 1.4, comments: 1.5, saves: 1.8, shares: 1.0, reach: 1.3 },
  static:   { likes: 0.7, comments: 0.6, saves: 0.5, shares: 0.5, reach: 0.8 },
  story:    { likes: 0.3, comments: 0.4, saves: 0,   shares: 0.6, reach: 0.6 },
}

// ─── CATEGORY MULTIPLIERS ───
const CATEGORY_MULTIPLIERS = {
  fashion_personal: 1.4,
  luxury_lifestyle: 1.3,
  behind_scenes: 1.5,
  product_showcase: 1.0,
  brand_collab: 1.2,
  motivational: 0.9,
  employee_culture: 1.1,
  corporate_news: 0.6,
  promotion: 1.3,
  cultural_seasonal: 1.6,
  sustainability: 0.8,
  new_money_luxury_debate: 1.7,
  female_empowerment: 1.45,
  modest_fashion: 1.55,
}

// ─── SEASON MULTIPLIERS ───
const SEASON_MULTIPLIERS = {
  normal: 1.0,
  dsf: 1.6,
  ramadan_early: 1.3,
  ramadan_peak: 1.5,
  eid_fitr: 1.8,
  eid_adha: 1.5,
  summer_surprises: 1.3,
  fashion_season: 1.35,
  diwali: 1.3,
  white_friday: 1.7,
  national_day: 1.4,
  christmas: 1.4,
}

// ─── SEASONAL CALENDAR 2026 ───
const SEASONAL_CALENDAR = [
  { event: 'Dubai Shopping Festival', start: '2025-12-05', end: '2026-01-11', key: 'dsf', multiplier: 1.6 },
  { event: 'Ramadan', start: '2026-02-16', end: '2026-03-22', key: 'ramadan_peak', multiplier: 1.5 },
  { event: 'Eid Al Fitr', start: '2026-03-22', end: '2026-03-24', key: 'eid_fitr', multiplier: 1.8 },
  { event: 'Eid Al Adha', start: '2026-05-30', end: '2026-06-01', key: 'eid_adha', multiplier: 1.5 },
  { event: 'Dubai Summer Surprises', start: '2026-07-03', end: '2026-08-30', key: 'summer_surprises', multiplier: 1.3 },
  { event: 'Diwali', start: '2026-10-15', end: '2026-11-15', key: 'diwali', multiplier: 1.3 },
  { event: 'White Friday', start: '2026-11-27', end: '2026-11-27', key: 'white_friday', multiplier: 1.7 },
  { event: 'UAE National Day', start: '2026-12-02', end: '2026-12-02', key: 'national_day', multiplier: 1.4 },
  { event: 'Christmas & Holidays', start: '2026-12-15', end: '2026-12-31', key: 'christmas', multiplier: 1.4 },
]

// ─── VISUAL QUALITY MULTIPLIERS ───
const QUALITY_MULTIPLIERS = {
  premium: 1.35,
  good: 1.1,
  average: 0.85,
  low: 0.5,
}

// ─── CAPTION STRATEGY MULTIPLIERS ───
const CAPTION_MULTIPLIERS = {
  storytelling: 1.25,
  educational: 1.3,
  cta_question: 1.2,
  explicit_cta: 1.35,
  minimal: 0.7,
  promotional: 0.85,
  inspirational: 1.1,
}

// ─── HASHTAG MULTIPLIERS ───
function getHashtagMultiplier(count) {
  if (count === 0) return 0.75
  if (count >= 1 && count <= 3) return 0.9
  if (count >= 3 && count <= 5) return 1.2
  if (count >= 6 && count <= 10) return 1.1
  if (count >= 11 && count <= 19) return 1.0
  return 0.75 // 20+
}

// ─── FACE MULTIPLIERS ───
const FACE_MULTIPLIERS = {
  self: 1.4,
  other: 1.15,
  no_scene: 0.8,
  product_only: 0.55,
}

// ─── LANGUAGE MULTIPLIERS ───
const LANGUAGE_MULTIPLIERS = {
  english: 1.0,
  arabic: 1.1,
  bilingual: 3.0,
}

// ─── ALT TEXT MULTIPLIERS ───
const ALT_TEXT_MULTIPLIERS = {
  present: 1.05,
  absent: 0.9,
}

// ─── TIME OF DAY MULTIPLIERS (GST) ───
const TIME_MULTIPLIERS = {
  '6-8': 0.85,
  '8-10': 1.1,
  '10-12': 1.25,
  '12-14': 1.15,
  '14-16': 0.9,
  '16-18': 1.05,
  '18-20': 1.3,
  '20-22': 1.2,
  '22-0': 0.8,
  '0-6': 0.5,
}

function getTimeMultiplier(hour) {
  if (hour >= 0 && hour < 6) return 0.5
  if (hour >= 6 && hour < 8) return 0.85
  if (hour >= 8 && hour < 10) return 1.1
  if (hour >= 10 && hour < 12) return 1.25
  if (hour >= 12 && hour < 14) return 1.15
  if (hour >= 14 && hour < 16) return 0.9
  if (hour >= 16 && hour < 18) return 1.05
  if (hour >= 18 && hour < 20) return 1.3
  if (hour >= 20 && hour < 22) return 1.2
  return 0.8 // 22-0
}

// ─── DAY OF WEEK MULTIPLIERS ───
const DAY_MULTIPLIERS = {
  0: 1.15, // Sunday
  1: 1.1,  // Monday
  2: 1.2,  // Tuesday
  3: 1.15, // Wednesday
  4: 1.1,  // Thursday
  5: 0.9,  // Friday
  6: 1.0,  // Saturday
}

// ─── DIMENSION MULTIPLIER (post aspect ratio / format fit) ───
const DIMENSION_MULTIPLIERS = {
  optimal: 1.1,  // 4:5 portrait for feed, 9:16 for reels/stories
  acceptable: 1.0,
  suboptimal: 0.85,
}

// ─── WES CLASSIFICATION THRESHOLDS (@thesimaved 58K) ───
const WES_THRESHOLDS = {
  viral: 0.12,       // >= 85th percentile
  high: 0.08,        // >= 60th percentile
  baseline: 0.05,    // >= 30th percentile
}

// ─── SEASON DETECTION ───
function detectSeason(dateStr) {
  if (!dateStr) return { key: 'normal', multiplier: 1.0, event: null }

  const date = new Date(dateStr)
  // Check each seasonal window — later entries override earlier ones (more specific wins)
  let matched = null
  for (const season of SEASONAL_CALENDAR) {
    const start = new Date(season.start)
    const end = new Date(season.end)
    // Set end to end of day
    end.setHours(23, 59, 59, 999)
    if (date >= start && date <= end) {
      // Prefer higher multiplier if overlapping
      if (!matched || season.multiplier > matched.multiplier) {
        matched = season
      }
    }
  }

  if (matched) {
    return { key: matched.key, multiplier: matched.multiplier, event: matched.event }
  }
  return { key: 'normal', multiplier: 1.0, event: null }
}

// ─── MASTER PREDICTION ENGINE ───
function predict(params) {
  const {
    format = 'reel',
    category = 'fashion_personal',
    postDate,
    postHour = 10,
    captionStrategy = 'storytelling',
    hashtagCount = 5,
    hasFaces = 'self',
    language = 'english',
    hasAltText = 'present',
    visualQuality = 'good',
    dimensions = 'optimal',
  } = params

  // 1. Get all multipliers
  const categoryMul = CATEGORY_MULTIPLIERS[category] || 1.0
  const season = detectSeason(postDate)
  const seasonMul = season.multiplier
  const timeMul = getTimeMultiplier(typeof postHour === 'number' ? postHour : 10)
  const dayOfWeek = postDate ? new Date(postDate).getDay() : 2 // default Tuesday
  const dayMul = DAY_MULTIPLIERS[dayOfWeek] || 1.0
  const qualityMul = QUALITY_MULTIPLIERS[visualQuality] || 1.1
  const captionMul = CAPTION_MULTIPLIERS[captionStrategy] || 1.0
  const hashtagMul = getHashtagMultiplier(typeof hashtagCount === 'number' ? hashtagCount : 5)
  const faceMul = FACE_MULTIPLIERS[hasFaces] || 1.0
  const langMul = LANGUAGE_MULTIPLIERS[language] || 1.0
  const dimMul = DIMENSION_MULTIPLIERS[dimensions] || 1.0
  const altMul = ALT_TEXT_MULTIPLIERS[hasAltText] || 1.0

  // 2. Total context multiplier (everything except format)
  const totalMultiplier = categoryMul * seasonMul * timeMul * dayMul * qualityMul * captionMul * hashtagMul * faceMul * langMul * dimMul * altMul

  // 3. Get format multipliers
  const fmt = FORMAT_MULTIPLIERS[format] || FORMAT_MULTIPLIERS.reel

  // 4. Calculate predicted metrics: Base x Format x TotalMultiplier
  const predictedLikes = Math.round(BASE.likes * fmt.likes * totalMultiplier)
  const predictedComments = Math.round(BASE.comments * fmt.comments * totalMultiplier)
  const predictedSaves = Math.round(BASE.saves * fmt.saves * totalMultiplier)
  const predictedShares = Math.round(BASE.shares * fmt.shares * totalMultiplier)
  const predictedReach = Math.round(BASE.reach * fmt.reach * totalMultiplier)
  const predictedViews = format === 'reel' ? Math.round(BASE.reel_views * fmt.reach * totalMultiplier) : null

  // 5. Variance range (+/- 15%)
  const variance = 0.15
  const range = (val) => val === null ? null : ({
    low: Math.round(val * (1 - variance)),
    mid: val,
    high: Math.round(val * (1 + variance)),
  })

  // 6. Engagement Rate = (Likes + Comments + Saves + Shares) / Reach x 100
  const totalEngagements = predictedLikes + predictedComments + predictedSaves + predictedShares
  const engagementRate = predictedReach > 0
    ? parseFloat(((totalEngagements / predictedReach) * 100).toFixed(2))
    : 0

  // 7. Weighted Engagement Score = [(Likes*1) + (Comments*2) + (Saves*3) + (Shares*4)] / Followers
  const wes = parseFloat(
    ((predictedLikes * 1 + predictedComments * 2 + predictedSaves * 3 + predictedShares * 4) / FOLLOWERS).toFixed(4)
  )

  // 8. Classification
  let classification = 'Suppressed'
  if (wes >= WES_THRESHOLDS.viral) classification = 'Viral'
  else if (wes >= WES_THRESHOLDS.high) classification = 'High Performing'
  else if (wes >= WES_THRESHOLDS.baseline) classification = 'Baseline'

  // 9. Multiplier breakdown for transparency
  const multiplierBreakdown = {
    category: { value: category, multiplier: categoryMul },
    season: { value: season.key, event: season.event, multiplier: seasonMul },
    timeOfDay: { value: `${postHour}:00 GST`, multiplier: timeMul },
    dayOfWeek: { value: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek], multiplier: dayMul },
    visualQuality: { value: visualQuality, multiplier: qualityMul },
    captionStrategy: { value: captionStrategy, multiplier: captionMul },
    hashtags: { value: `${hashtagCount} tags`, multiplier: hashtagMul },
    faces: { value: hasFaces, multiplier: faceMul },
    language: { value: language, multiplier: langMul },
    dimensions: { value: dimensions, multiplier: dimMul },
    altText: { value: hasAltText, multiplier: altMul },
    totalContextMultiplier: parseFloat(totalMultiplier.toFixed(4)),
    format: { value: format, multipliers: fmt },
  }

  return {
    predicted: {
      likes: range(predictedLikes),
      comments: range(predictedComments),
      saves: range(predictedSaves),
      shares: range(predictedShares),
      reach: range(predictedReach),
      views: range(predictedViews),
    },
    engagementRate,
    weightedEngagementScore: wes,
    classification,
    multiplierBreakdown,
  }
}


// ─── API ROUTE ───
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    format,
    category,
    postDate,
    postHour,
    captionStrategy,
    hashtagCount,
    hasFaces,
    language,
    hasAltText,
    visualQuality,
    dimensions,
    topic,
    caption,
    platform,
    description,
    // Legacy fields from old API
    contentType,
  } = body

  // Require at least some input
  const resolvedFormat = format || contentType || 'reel'
  if (!topic && !caption && !description && !category) {
    return Response.json(
      { error: 'Please provide at least a topic, caption, category, or description to simulate.' },
      { status: 400 }
    )
  }

  try {
    // ─── STEP 1: Mathematical prediction ───
    const prediction = predict({
      format: resolvedFormat,
      category: category || 'fashion_personal',
      postDate: postDate || new Date().toISOString().split('T')[0],
      postHour: typeof postHour === 'number' ? postHour : 10,
      captionStrategy: captionStrategy || 'storytelling',
      hashtagCount: typeof hashtagCount === 'number' ? hashtagCount : 5,
      hasFaces: hasFaces || 'self',
      language: language || 'english',
      hasAltText: hasAltText || 'present',
      visualQuality: visualQuality || 'good',
      dimensions: dimensions || 'optimal',
    })

    // ─── STEP 2: Fetch events knowledgebase for Gemini context ───
    const events = await prisma.event.findMany({
      select: {
        title: true,
        category: true,
        status: true,
        postConcept: true,
        visualDirection: true,
        captionDirection: true,
        platforms: true,
        opportunityType: true,
        month: true,
        date: true,
        status: true,
      },
      orderBy: { number: 'asc' },
    })

    const knowledgebase = events
      .filter(e => e.postConcept || e.captionDirection || e.visualDirection)
      .map(e => `- "${e.title}" (${e.category || 'General'}, ${e.status}): Concept: ${e.postConcept || 'N/A'} | Visual: ${e.visualDirection || 'N/A'} | Caption: ${e.captionDirection || 'N/A'} | Platforms: ${e.platforms || 'N/A'}`)
      .join('\n')

    // ─── STEP 3: Gemini qualitative analysis ───
    const geminiPrompt = `You are a social media strategist for Sima Ganwani Ved (@thesimaved, 58K followers) — Founder & Chairwoman of Apparel Group, Dubai. 2,200+ stores, 14 countries, brands include Guess, Tommy Hilfiger, Calvin Klein, DKNY, Victoria's Secret, Tim Hortons. Shark Tank Dubai S2, Forbes Top 100 #12.

CONTENT CALENDAR (${events.length} events):
${knowledgebase}

THE USER WANTS TO SIMULATE THIS POST:
- Format: ${resolvedFormat}
- Category: ${category || 'Not specified'}
- Topic: ${topic || 'Not specified'}
- Caption: ${caption || 'Not specified'}
- Platform: ${platform || 'Instagram'}
- Description: ${description || 'Not specified'}
- Post Date: ${postDate || 'Not specified'}
- Visual Quality: ${visualQuality || 'good'}
- Caption Strategy: ${captionStrategy || 'storytelling'}

OUR MATHEMATICAL MODEL PREDICTED:
- Likes: ${prediction.predicted.likes?.mid || 0}, Comments: ${prediction.predicted.comments?.mid || 0}, Saves: ${prediction.predicted.saves?.mid || 0}, Shares: ${prediction.predicted.shares?.mid || 0}
- Reach: ${prediction.predicted.reach?.mid || 0}${prediction.predicted.views?.mid ? `, Views: ${prediction.predicted.views.mid}` : ''}
- Engagement Rate: ${prediction.engagementRate}%
- WES: ${prediction.weightedEngagementScore}
- Classification: ${prediction.classification}

Given these predictions and the content calendar context, provide QUALITATIVE analysis. Return ONLY raw JSON (no markdown, no code blocks):

{
  "strengths": ["<3 specific strengths of this post idea>", "...", "..."],
  "improvements": ["<3 actionable improvements>", "...", "..."],
  "captionSuggestion": "<an improved caption suggestion tailored to Sima's voice>",
  "contentStrategy": "<2-3 sentence strategic recommendation>",
  "bestTimeToPost": "<specific day and time recommendation in GST>",
  "recommendedHashtags": ["<5 relevant hashtags without #>"],
  "platformFit": "<how well this fits ${platform || 'Instagram'}>",
  "timingAnalysis": "<analysis relative to upcoming calendar events>",
  "similarSuccessfulPosts": ["<reference to similar event from knowledgebase>", "<another>"],
  "brandAlignment": <number 0-100>
}`

    let qualitative = {}
    try {
      const rawText = await callOpenClaw(geminiPrompt)
      let text = (rawText || '').trim()
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      }
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        qualitative = JSON.parse(jsonMatch[0])
      } else if (text) {
        qualitative = { strengths: [text], improvements: [], captionSuggestion: null }
      }
    } catch (openclawErr) {
      console.error('OpenClaw qualitative analysis failed:', openclawErr?.message)
      // Non-fatal — we still return the mathematical predictions
      qualitative = {
        strengths: ['Mathematical prediction completed successfully'],
        improvements: ['Gemini qualitative analysis unavailable — predictions are still accurate'],
        captionSuggestion: null,
        contentStrategy: null,
        bestTimeToPost: null,
        recommendedHashtags: [],
        platformFit: null,
        timingAnalysis: null,
        similarSuccessfulPosts: [],
        brandAlignment: null,
      }
    }

    // ─── STEP 4: Assemble final response ───
    const response = {
      // Mathematical predictions (calculated, not AI-generated)
      prediction: {
        likes: prediction.predicted.likes,
        comments: prediction.predicted.comments,
        saves: prediction.predicted.saves,
        shares: prediction.predicted.shares,
        reach: prediction.predicted.reach,
        views: prediction.predicted.views,
      },
      engagementRate: prediction.engagementRate,
      weightedEngagementScore: prediction.weightedEngagementScore,
      classification: prediction.classification,
      multiplierBreakdown: prediction.multiplierBreakdown,

      // Qualitative analysis (Gemini)
      qualitative: {
        strengths: qualitative.strengths || [],
        improvements: qualitative.improvements || [],
        captionSuggestion: qualitative.captionSuggestion || null,
        contentStrategy: qualitative.contentStrategy || null,
        bestTimeToPost: qualitative.bestTimeToPost || null,
        recommendedHashtags: qualitative.recommendedHashtags || [],
        platformFit: qualitative.platformFit || null,
        timingAnalysis: qualitative.timingAnalysis || null,
        similarSuccessfulPosts: qualitative.similarSuccessfulPosts || [],
        brandAlignment: qualitative.brandAlignment || null,
      },

      // Legacy compat fields (mapped from mathematical model)
      engagementScore: Math.min(100, Math.round(prediction.engagementRate * 8)),
      impactLevel: prediction.classification === 'Viral' ? 'VIRAL'
        : prediction.classification === 'High Performing' ? 'HIGH'
        : prediction.classification === 'Baseline' ? 'MODERATE' : 'LOW',
      estimatedReach: `${formatK(prediction.predicted.reach?.low)}-${formatK(prediction.predicted.reach?.high)}`,
      estimatedLikes: `${formatK(prediction.predicted.likes?.low)}-${formatK(prediction.predicted.likes?.high)}`,
      estimatedComments: `${prediction.predicted.comments?.low}-${prediction.predicted.comments?.high}`,
      estimatedShares: `${prediction.predicted.shares?.low}-${prediction.predicted.shares?.high}`,

      // Input echo
      input: {
        format: resolvedFormat,
        category: category || 'fashion_personal',
        postDate: postDate || new Date().toISOString().split('T')[0],
        postHour: typeof postHour === 'number' ? postHour : 10,
        topic,
        caption,
        platform: platform || 'Instagram',
      },

      // Model metadata
      model: {
        version: '2.0',
        baseFollowers: FOLLOWERS,
        variancePercent: 15,
        engine: 'mathematical_prediction + openclaw_qualitative',
      },
    }

    return Response.json(response, { status: 200 })
  } catch (error) {
    console.error('Simulate error:', error?.message || error)
    return Response.json(
      { error: error?.message || 'Failed to simulate post performance' },
      { status: 500 }
    )
  }
}

// Helper: format numbers as K
function formatK(num) {
  if (num == null) return '0'
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}
