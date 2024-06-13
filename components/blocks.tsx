import { RenderBlock } from '@/components/render-block'
import { groupBlocksList, notion } from '@/lib/notion'
import { cn } from '@/lib/utils'
import type { Block, BlockList } from '@/types/notion'
import { cva, type VariantProps } from 'class-variance-authority'
import { ComponentProps } from 'react'
import { RenderBlockList } from './render-block-list'

const blocksVariants = cva('blocks', {
  variants: {
    size: {
      base: 'blocks-base',
      lg: 'blocks-lg',
      sm: 'blocks-sm',
    },
  },
  defaultVariants: {
    size: 'base',
  },
})

interface BlocksProps
  extends ComponentProps<'div'>,
    VariantProps<typeof blocksVariants> {
  blockId: string
}

export async function Blocks({
  blockId,
  children,
  className,
  size,
  ...props
}: BlocksProps) {
  const blocks = await notion.getBlocks({ block_id: blockId })
  const blocksWithLists = groupBlocksList(blocks as unknown as Block[])

  return (
    <div className={cn(blocksVariants({ size }), className)} {...props}>
      {blocksWithLists.map((block) => {
        if (
          block.type === 'numbered_list_item' ||
          block.type === 'bulleted_list_item'
        ) {
          return (
            <RenderBlockList
              data-id={`blocklist-${block.id}`}
              key={`blocklist-${block.id}`}
              list={block as unknown as BlockList}
            />
          )
        }

        return <RenderBlock key={`block-${block.id}`} block={block} />
      })}
    </div>
  )
}
