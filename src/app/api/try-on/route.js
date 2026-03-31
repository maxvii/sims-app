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
      return NextResponse.json(
        { error: 'Try-on service not configured', code: 'NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    // Parse form data
    const formData = await request.formData()
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

    // Call Replicate IDM-VTON model
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const output = await replicate.run("cuuupid/idm-vton", {
      input: {
        human_img: personDataUri,
        garm_img: garmentDataUri,
        garment_des: "clothing item",
      }
    })

    // Output is a URL string to the result image
    return NextResponse.json({ resultUrl: output })
  } catch (error) {
    console.error('Try-on API error:', error)

    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      return NextResponse.json(
        { error: 'The try-on process timed out. Please try again with smaller images.' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process try-on request. Please try again.' },
      { status: 500 }
    )
  }
}
