import { getPageMediaUrl } from '@/lib/notion'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pageId = searchParams.get('pageId')
  const type = searchParams.get('type') // cover or icon

  if (!pageId || !type) {
    return NextResponse.json(
      { message: 'page ID and type are required', error: true },
      { status: 404 },
    )
  }

  const media = await getPageMediaUrl(pageId, type as 'cover' | 'icon')
  return NextResponse.json({ media })
}
