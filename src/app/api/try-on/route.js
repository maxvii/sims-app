import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Replicate from 'replicate'

export const maxDuration = 120

export async function POST(request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Replicate token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not set')
      return NextResponse.json(
        { error: 'Try-on service not configured', code: 'NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    // Parse form data
    let formData
    try {
      formData = await request.formData()
    } catch (e) {
      return NextResponse.json(
        { error: 'Please upload both a person photo and a garment photo.' },
        { status: 400 }
      )
    }
    const personImage = formData.get('personImage')
    const garmentImage = formData.get('garmentImage')

    if (!personImage || !garmentImage) {
      return NextResponse.json(
        { error: 'Both person image and garment image are required' },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(personImage.type) || !allowedTypes.includes(garmentImage.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, and WebP images are supported' },
        { status: 400 }
      )
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024
    if (personImage.size > maxSize || garmentImage.size > maxSize) {
      return NextResponse.json(
        { error: 'Images must be under 10MB each' },
        { status: 400 }
      )
    }

    // Convert images to data URIs
    const personBuffer = Buffer.from(await personImage.arrayBuffer())
    const personDataUri = `data:${personImage.type};base64,${personBuffer.toString('base64')}`

    const garmentBuffer = Buffer.from(await garmentImage.arrayBuffer())
    const garmentDataUri = `data:${garmentImage.type};base64,${garmentBuffer.toString('base64')}`

    console.log('Starting try-on request with IDM-VTON model...')
    console.log(`Person image: ${personImage.type}, ${(personImage.size / 1024).toFixed(1)}KB`)
    console.log(`Garment image: ${garmentImage.type}, ${(garmentImage.size / 1024).toFixed(1)}KB`)

    // Call Replicate IDM-VTON model
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const output = await replicate.run("cuuupid/idm-vton", {
      input: {
        human_img: personDataUri,
        garm_img: garmentDataUri,
        garment_des: "clothing item",
        category: "upper_body",
      }
    })

    console.log('Try-on output type:', typeof output, Array.isArray(output) ? 'array' : '')
    console.log('Try-on output:', JSON.stringify(output).slice(0, 200))

    // Handle different output formats from Replicate
    let resultUrl
    if (typeof output === 'string') {
      resultUrl = output
    } else if (Array.isArray(output) && output.length > 0) {
      resultUrl = output[0]
    } else if (output?.output) {
      resultUrl = output.output
    } else if (output?.url) {
      resultUrl = output.url
    } else {
      console.error('Unexpected output format from Replicate:', output)
      return NextResponse.json(
        { error: 'Unexpected response from try-on model' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resultUrl })
  } catch (error) {
    console.error('Try-on API error:', error?.message || error)
    console.error('Try-on API error stack:', error?.stack)

    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      return NextResponse.json(
        { error: 'The try-on process timed out. Please try again with smaller images.' },
        { status: 504 }
      )
    }

    if (error.message?.includes('Invalid') || error.message?.includes('authentication')) {
      return NextResponse.json(
        { error: 'Try-on service authentication failed. Please check API configuration.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process try-on request. Please try again.' },
      { status: 500 }
    )
  }
}
