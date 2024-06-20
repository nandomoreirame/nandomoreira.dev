'use server'

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

function bufferToBase64(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString('base64')}`
}

async function getFileBufferLocal(filepath: string) {
  const realFilepath = path.join(process.cwd(), 'public', filepath)
  return fs.readFile(realFilepath)
}

export async function getPlaceholderImage(filepath: string | null) {
  if (!filepath) return { src: '', placeholder: '' }

  try {
    const originalBuffer = await getFileBufferLocal(filepath)
    const resizedBuffer = await sharp(originalBuffer).resize(20).toBuffer()

    return {
      src: filepath,
      placeholder: bufferToBase64(resizedBuffer),
    }
  } catch {
    return {
      src: filepath,
      placeholder:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==',
    }
  }
}
