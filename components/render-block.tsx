import { extractYoutubeId, getMediaProperties, titleToSlug } from '@/lib'
import type {
  Block,
  BulletedListItemBlock,
  BulletedListItemResponse,
  CalloutBlock,
  CalloutResponse,
  CodeBlock,
  CodeResponse,
  ColumnBlockResponse,
  ColumnListBlockResponse,
  EmbedBlockResponse,
  FileEmojiBlock,
  Heading2Block,
  Heading2BlockResponse,
  Heading3Block,
  Heading3BlockResponse,
  Heading4Block,
  Heading4BlockResponse,
  ImageBlock,
  ImageBlockResponse,
  NumberedListItemBlock,
  NumberedListItemResponse,
  ParagraphBlock,
  ParagraphResponse,
  QuoteBlock,
  QuoteResponse,
  VideoBlock,
  VideoBlockResponse,
} from '@/types/notion'
import { Suspense } from 'react'
import type { BundledLanguage } from 'shiki'

import { H2, H3, H4 } from '@/components/anchor-heading'
import { NotionBlockquote } from '@/components/blockquote'
import { NotionCode } from '@/components/code'
import { Container } from '@/components/container'
import { NotionEmbed } from '@/components/embed'
import { NotionImage } from '@/components/image'
import { Separator } from '@/components/separator'
import { Skeleton } from '@/components/skeleton'
import { NotionText } from '@/components/text'
import { NotionVideo } from '@/components/video'
import { getBlockText } from '@/lib/notion'
import Image from 'next/image'
import { Alert, AlertDescription } from './alert'

function getTitleId(block: Block) {
  return titleToSlug(getBlockText(block))
}

export async function RenderBlock({ block }: { block: Block }) {
  const type = 'type' in block ? block.type : undefined
  const unknownBlock = block as unknown

  switch (type) {
    case 'heading_1': {
      const heading2Block = (unknownBlock as Heading2BlockResponse)[
        type
      ] as Heading2Block
      return (
        <H2 anchor={getTitleId(block)}>
          <NotionText richText={heading2Block.rich_text} />
        </H2>
      )
    }

    case 'heading_2': {
      const heading3Block = (unknownBlock as Heading3BlockResponse)[
        type
      ] as Heading3Block
      return (
        <H3 anchor={getTitleId(block)}>
          <NotionText richText={heading3Block.rich_text} />
        </H3>
      )
    }

    case 'heading_3': {
      const heading4Block = (unknownBlock as Heading4BlockResponse)[
        type
      ] as Heading4Block
      return (
        <H4 anchor={getTitleId(block)}>
          <NotionText richText={heading4Block.rich_text} />
        </H4>
      )
    }

    case 'paragraph': {
      const paragraphBlock = (unknownBlock as ParagraphResponse)[
        type
      ] as ParagraphBlock

      if (getBlockText(block) === '') {
        return <div className="space" />
      }

      return (
        <p>
          <NotionText richText={paragraphBlock.rich_text} />
        </p>
      )
    }

    case 'quote': {
      const quoteBlock = (unknownBlock as QuoteResponse)[type] as QuoteBlock
      return (
        <NotionBlockquote>
          <NotionText richText={quoteBlock.rich_text} />
        </NotionBlockquote>
      )
    }

    case 'callout': {
      const calloutBlock = (unknownBlock as CalloutResponse)[
        type
      ] as CalloutBlock

      console.log('[ calloutBlock ]', calloutBlock)

      const { icon } = calloutBlock

      let iconUrl = null
      if (icon && icon.type === 'external') {
        iconUrl = icon.external?.url
      } else if (icon && icon.type === 'file') {
        iconUrl = icon.file?.url
      }

      let iconEmoji = null
      if (icon && (icon as unknown as FileEmojiBlock).type === 'emoji') {
        iconEmoji = (icon as unknown as FileEmojiBlock).emoji
      }

      return (
        <Alert className="callout">
          {icon && iconUrl && (
            <Image
              src={iconUrl}
              className="size-6"
              alt="callout icon"
              width={100}
              height={100}
            />
          )}
          {icon && iconEmoji && <span>{iconEmoji}</span>}
          <AlertDescription>
            <NotionText richText={calloutBlock.rich_text} />
          </AlertDescription>
        </Alert>
      )
    }

    case 'bulleted_list_item':
      const bulletedListItem = (unknownBlock as BulletedListItemResponse)
        .bulleted_list_item as BulletedListItemBlock

      return (
        <li>
          <NotionText richText={bulletedListItem.rich_text} />
        </li>
      )

    case 'numbered_list_item': {
      const numberedListItem = (unknownBlock as NumberedListItemResponse)
        .numbered_list_item as NumberedListItemBlock

      return (
        <li>
          <NotionText richText={numberedListItem.rich_text} />
        </li>
      )
    }

    case 'code': {
      const {
        language,
        rich_text: [richText],
        caption: [cap],
      } = (unknownBlock as CodeResponse).code as CodeBlock

      return (
        <>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <NotionCode
              lang={language as BundledLanguage}
              caption={cap?.plain_text}
            >
              {richText.plain_text}
            </NotionCode>
          </Suspense>
        </>
      )
    }

    case 'image': {
      const image = (unknownBlock as ImageBlockResponse)[type] as ImageBlock
      const { source, caption } = getMediaProperties(image)

      if (!source.startsWith('https://')) return <></>

      return (
        <NotionImage
          src={source}
          alt={caption}
          caption={caption}
          // @ts-ignore blockId is not defined
          blockId={block?.id}
          height={1000}
          width={1000}
        />
      )
    }

    case 'video': {
      const video = (unknownBlock as VideoBlockResponse)[type] as VideoBlock
      const { source, caption } = getMediaProperties(video)
      const youtubeId = extractYoutubeId(source)

      return (
        <NotionVideo src={source} caption={caption} youtubeId={youtubeId} />
      )
    }

    case 'embed': {
      const { url, caption } = (unknownBlock as EmbedBlockResponse)[type]
      if (!url.startsWith('https://')) return <></>
      return <NotionEmbed embedUrl={url} caption={caption[0]?.plain_text} />
    }

    case 'divider': {
      return <Separator className="divider" />
    }

    case 'column_list': {
      const columnListBlock = unknownBlock as ColumnListBlockResponse
      const columnListChildren = columnListBlock.children

      return (
        <Container size={'sm'} className="columns">
          {columnListChildren.length > 0 &&
            columnListChildren.map((columnList) => (
              <RenderBlock key={columnList.id} block={columnList} />
            ))}
        </Container>
      )
    }

    case 'column': {
      const columnBlock = unknownBlock as ColumnBlockResponse
      const children = columnBlock.children

      return (
        <div className="column">
          {children.length > 0 &&
            children.map((child) => (
              <RenderBlock key={child.id} block={child} />
            ))}
        </div>
      )
    }
  }

  return null

  // return (
  //   <div>
  //     <p>[type]: {type}</p>
  //     <pre>{JSON.stringify(block, null, 2)}</pre>
  //   </div>
  // )
}
