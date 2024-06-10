import { cn } from '@/lib/utils'
import type { PlainText, RichText } from '@/types/notion'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function NotionText({
  richText,
  className,
}: {
  richText: Array<RichText> | Array<PlainText>
  className?: string
}): JSX.Element {
  return (
    <>
      {richText.map((value, index) => {
        const {
          annotations: { bold, code, italic, strikethrough, underline },
          text: { link, content },
        } = value as PlainText

        let Comp: React.ElementType = 'span'
        if (code) Comp = 'code'
        if (bold) Comp = 'strong'
        if (italic) Comp = 'em'
        if (underline) Comp = 'u'
        if (strikethrough) Comp = 's'

        if (link !== null) {
          return (
            <Link
              key={`richTextLink${index}`}
              className={cn('external-link', className)}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{content}</span>
              <ExternalLink className="size-3 opacity-70" />
            </Link>
          )
        }

        return (
          <Comp
            key={`richText${index}`}
            className={cn(
              {
                italic: italic,
                'font-bold': bold,
                'underline underline-offset-4': underline,
                'line-through': strikethrough,
                'whitespace-normal break-words rounded bg-foreground/10 p-1 font-mono text-sm text-muted-foreground':
                  code,
              },
              className,
            )}
            dangerouslySetInnerHTML={{
              __html: content.replace('\n', '<br />'),
            }}
          />
        )
      })}
    </>
  )
}
