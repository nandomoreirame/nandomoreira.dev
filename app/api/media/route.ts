import { getBlockMediaUrl } from '@/lib/notion'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const blockId = searchParams.get('blockId')
  const type = searchParams.get('type')

  if (!blockId || !type) {
    return NextResponse.json(
      { message: 'block ID and type are required', error: true },
      { status: 404 },
    )
  }

  const media = await getBlockMediaUrl(blockId, type as 'video' | 'image')
  return NextResponse.json({ media })
}
