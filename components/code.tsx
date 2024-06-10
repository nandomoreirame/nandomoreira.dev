// 'use client'

import { CopyToClipboard } from '@/components/copy-to-clipboard'
import { highlightCode, transformCode } from '@/lib/shiki'

type NotionCodeProps = {
  children: string
  lang?: string
  caption?: string
}

export async function NotionCode({
  children,
  lang = 'javascript',
  caption,
}: NotionCodeProps) {
  const transformedCode = transformCode(children)
  const markupToHighlight = await highlightCode(transformedCode, lang)

  return (
    <div className="code-highlighting">
      <div className="language">
        <span>{lang}</span>
        <CopyToClipboard code={children} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: markupToHighlight as string }} />
      {caption && <span className="caption">{caption}</span>}
    </div>
  )
}
