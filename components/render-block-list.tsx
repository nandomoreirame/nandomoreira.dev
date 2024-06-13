import type {
  BlockList,
  BulletedListItemBlock,
  BulletedListItemResponse,
  NumberedListItemBlock,
  NumberedListItemResponse,
} from '@/types/notion'

import { NotionText } from '@/components/text'

export async function RenderBlockList({ list }: { list: BlockList }) {
  const { type, items } = list

  if (type === 'bulleted_list_item') {
    return (
      <>
        <ul className="list-disc">
          {/* <li>{type}</li> */}
          {items.length > 0 &&
            items.map((block) => {
              const bulletedListItem = (
                block as unknown as BulletedListItemResponse
              ).bulleted_list_item as BulletedListItemBlock

              // if (block.children.length > 0) {
              //   return <RenderBlockList list={block.children as BlockList[]} />
              // }

              return (
                <li key={block.id}>
                  <NotionText richText={bulletedListItem.rich_text} />
                </li>
              )
            })}
        </ul>
      </>
    )
  }

  if (type === 'numbered_list_item') {
    return (
      <>
        <ol className="list-decimal">
          {/* <li>{type}</li> */}
          {items.length > 0 &&
            items.map((block) => {
              const numberedListItem = (
                block as unknown as NumberedListItemResponse
              ).numbered_list_item as NumberedListItemBlock

              return (
                <li key={block.id}>
                  <NotionText richText={numberedListItem.rich_text} />
                </li>
              )
            })}
        </ol>
      </>
    )
  }

  return null
}
