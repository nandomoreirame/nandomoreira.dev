import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  const tag = request.nextUrl.searchParams.get('tag')
  const dbId = request.nextUrl.searchParams.get('db')
  const slug = request.nextUrl.searchParams.get('slug')

  if (path) {
    revalidatePath(path)

    return NextResponse.json({
      path,
      revalidated: true,
      now: Date.now(),
    })
  }

  if (tag) {
    revalidateTag(tag)

    return NextResponse.json({
      tag,
      revalidated: true,
      now: Date.now(),
    })
  }

  if (dbId) {
    if (!slug) revalidateTag(`${dbId}-database`)
    if (slug) revalidateTag(`${dbId}-${slug}-database-slug`)

    return NextResponse.json({
      dbId,
      slug,
      revalidated: true,
      now: Date.now(),
    })
  }

  return NextResponse.json(
    {
      revalidated: false,
      now: Date.now(),
      message: 'Missing path to revalidate',
    },
    { status: 400 },
  )
}
