import { env } from '@/env'
import type { Link, Post } from '@/types/blog'
import type {
  Block,
  BlockResponse,
  BlockTypes,
  BulletedListItemBlock,
  BulletedListItemResponse,
  CalloutResponse,
  DateResponse,
  EmbedBlock,
  EmbedBlockResponse,
  FileBlock,
  GetDatabasePagesParameters,
  GetDatabaseParameters,
  GetDatabasePostParameters,
  Heading2Block,
  Heading2BlockResponse,
  Heading3Block,
  Heading3BlockResponse,
  Heading4Block,
  Heading4BlockResponse,
  ImageBlockResponse,
  MultiSelect,
  NumberedListItemBlock,
  NumberedListItemResponse,
  PageResponse,
  ParagraphBlock,
  ParagraphResponse,
  People,
  PlainText,
  QuoteResponse,
  RichText,
  Select,
  Title,
  Url,
  VideoBlockResponse,
} from '@/types/notion'
import type { Page } from '@/types/page'
import { Client } from '@notionhq/client'
import type {
  ListBlockChildrenParameters,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { unstable_cache } from 'next/cache'

const client = new Client({
  auth: env.NOTION_ACCESS_TOKEN,
})

const getDatabasePosts = async (
  args: GetDatabaseParameters,
): Promise<{ posts: Array<Post> }> => {
  const _cacheTag = `${args.database_id}-database`

  return unstable_cache(
    async () =>
      client.databases
        .query({
          ...args,
          page_size: 100,
          sorts: [
            {
              property: 'date',
              direction: 'descending',
            },
          ],
          filter: {
            and: [
              { property: 'status', status: { equals: 'Publicado' } },
              { property: 'title', rich_text: { is_not_empty: true } },
              { property: 'slug', rich_text: { is_not_empty: true } },
              { property: 'date', date: { is_not_empty: true } },
            ],
          },
        })
        .then(({ results }) => {
          const posts = results.map((post) => {
            const {
              id,
              cover,
              properties,
              // ...rest
            } = post as PageObjectResponse

            return {
              id,
              slug: properties.slug as RichText,
              title: properties.title as Title,
              description: properties.description as RichText,
              date: properties.date as DateResponse,
              category: properties.category as Select,
              tags: properties.tags as MultiSelect,
              author: properties.author as People,
              cover: cover as FileBlock,
            } satisfies Post
          })

          return { posts }
        })
        .catch((e) => {
          console.error('[Error retrieving database]', e)
          throw new Error(e)
        }),
    [_cacheTag],
    {
      revalidate: 900,
      tags: [_cacheTag],
    },
  )()
}

const getDatabaseLinks = async ({
  slug,
  ...args
}: GetDatabaseParameters & { slug?: string }): Promise<{
  links: Array<Link>
}> => {
  const _cacheTag = `${args.database_id}-database`

  // @ts-ignore
  const filters = []
  if (slug) {
    filters.push({ property: 'slug', rich_text: { equals: slug } })
  }

  return unstable_cache(
    async () =>
      client.databases
        .query({
          ...args,
          page_size: 100,
          sorts: [
            {
              property: 'title',
              direction: 'ascending',
            },
          ],
          filter: {
            and: [
              { property: 'title', rich_text: { is_not_empty: true } },
              { property: 'slug', rich_text: { is_not_empty: true } },
              { property: 'published', checkbox: { equals: true } },
              // @ts-ignore
              ...filters,
            ],
          },
        })
        .then(({ results }) => {
          const links = results.map((link) => {
            const {
              id,
              icon,
              properties,
              // ...rest
            } = link as PageObjectResponse

            return {
              id,
              slug: properties.slug as RichText,
              title: properties.title as Title,
              description: properties.description as RichText,
              link: properties.link as Url,
              image: icon as FileBlock,
            } satisfies Link
          })

          return { links }
        })
        .catch((e) => {
          console.error('[Error retrieving database]', e)
          throw new Error(e)
        }),
    [_cacheTag],
    {
      revalidate: 900,
      tags: [_cacheTag],
    },
  )()
}

const getDatabasePost = async ({
  slug,
  ...args
}: GetDatabasePostParameters): Promise<Post | undefined> => {
  const _cacheTag = `${args.database_id}-${slug}-database-slug`

  return unstable_cache(
    async () =>
      client.databases
        .query({
          ...args,
          page_size: 1,
          filter: {
            and: [
              { property: 'status', status: { equals: 'Publicado' } },
              { property: 'slug', rich_text: { is_not_empty: true } },
              { property: 'title', rich_text: { is_not_empty: true } },
              { property: 'date', date: { is_not_empty: true } },
              { property: 'slug', rich_text: { equals: slug } },
            ],
          },
        })
        .then(({ results }) => {
          if (!results) return
          const [post] = results.map((post) => {
            const { id, properties, cover, ...rest } =
              post as PageObjectResponse

            return {
              id,
              slug: properties.slug as RichText,
              title: properties.title as Title,
              description: properties.description as RichText,
              date: properties.date as DateResponse,
              category: properties.category as Select,
              tags: properties.tags as MultiSelect,
              author: properties.author as People,
              cover: cover as FileBlock,
              ...rest,
            } satisfies Post
          })

          return post
        })
        .catch((e) => {
          console.error('[Error retrieving database]', e)
          throw new Error(e)
        }),
    [_cacheTag],
    {
      revalidate: 900,
      tags: [_cacheTag],
    },
  )()
}

const getDatabasePages = async (
  args: GetDatabaseParameters,
): Promise<{ pages: Page[] }> => {
  const _cacheTag = `--${args.database_id}-database-pages`

  return unstable_cache(
    async () =>
      client.databases
        .query({ ...args })
        .then(({ results }) => {
          const pages = results.map((page) => {
            const { id, properties, cover } = page as PageObjectResponse

            return {
              id,
              slug: properties.slug as RichText,
              title: properties.title as Title,
              description: properties.description as RichText,
              metaTitle: properties['meta-title'] as RichText,
              metaDescription: properties['meta-description'] as RichText,
              cover: cover as FileBlock,
            } satisfies Page
          })

          return { pages }
        })
        .catch((e) => {
          console.error('[Error retrieving database]', e)
          throw new Error(e)
        }),
    [_cacheTag],
    {
      revalidate: 900,
      tags: [_cacheTag],
    },
  )()
}

const getDatabasePage = async ({
  slug,
  ...args
}: GetDatabasePagesParameters): Promise<{ page: Page }> => {
  const _cacheTag = `--${args.database_id}-${slug}-database-page`

  return unstable_cache(
    async () =>
      client.databases
        .query({
          ...args,
          filter: { property: 'slug', rich_text: { contains: slug } },
        })
        .then(({ results }) => {
          const [page] = results.map((page) => {
            const { id, properties, cover } = page as PageObjectResponse

            return {
              id,
              slug: properties.slug as RichText,
              title: properties.title as Title,
              description: properties.description as RichText,
              metaTitle: properties['meta-title'] as RichText,
              metaDescription: properties['meta-description'] as RichText,
              cover: cover as FileBlock,
            } satisfies Page
          })

          return { page }
        })
        .catch((e) => {
          console.error('[Error retrieving database]', e)
          throw new Error(e)
        }),
    [_cacheTag],
    {
      revalidate: 900,
      tags: [_cacheTag],
    },
  )()
}

async function getBlockResult(block: BlockResponse): Promise<BlockResponse> {
  let children: Array<BlockResponse> = []

  if ('has_children' in block && !!block.has_children) {
    children = await getBlocksResult({ block_id: block.id })
  }

  return {
    ...block,
    children,
  }
}

const getBlocksResult = async (args: ListBlockChildrenParameters) => {
  if (!args.block_id) return Promise.resolve([])

  const _cacheTag = `--${args.block_id}-db-page-blocks`

  return unstable_cache(
    async () => {
      const blocks = await client.blocks.children.list({
        ...args,
        block_id: args.block_id.split('-').join(''),
        page_size: 100,
      })

      return await Promise.all(
        blocks.results.map(async (block) => {
          return await getBlockResult(block as unknown as BlockResponse)
        }),
      )
    },
    [_cacheTag],
    {
      revalidate: 900,
      tags: [_cacheTag],
    },
  )()
}

export async function getPageMediaUrl(pageId: string, type: 'cover' | 'icon') {
  const page = await client.pages
    .retrieve({ page_id: pageId })
    .then((p) => p as unknown as PageResponse)
    .catch((e) => {
      console.log('[ Error retrieving block ]', e)
    })

  if (page) {
    const { cover, icon } = page

    if (type === 'cover') {
      if (cover?.type === 'external') return cover?.external.url
      return cover?.file.url
    }

    if (type === 'icon') {
      if (icon?.type === 'external') return icon?.external.url
      if (icon?.type === 'emoji') return icon?.emoji as string
      return icon?.file.url
    }
  }
}

export async function getBlockMediaUrl(
  blockId: string,
  type: 'image' | 'video',
) {
  const block = await client.blocks
    .retrieve({ block_id: blockId })
    .then((b) => {
      const newBlock = b as unknown
      return newBlock as ImageBlockResponse | VideoBlockResponse
    })
    .catch((e) => {
      console.log('[ Error retrieving block ]', e)
    })

  if (block) {
    if (block.type !== type) {
      throw new Error('[ Block is not an image or video ]')
    }

    if (block.type === 'image') {
      if (block.image.type === 'external') return block.image.external.url
      return block.image.file.url
    }

    if (block.type === 'video') {
      if (block.video.type === 'external') return block.video.external.url
      return block.video.file.url
    }
  }
}

export const notion = {
  async getPages(params: GetDatabasePagesParameters) {
    return await getDatabasePages(params)
  },

  async getPage(params: GetDatabasePagesParameters) {
    return await getDatabasePage(params)
  },

  async getPageBlocks(pageId: string, params?: GetDatabaseParameters) {
    const blocks = await getBlocksResult({ block_id: pageId, ...params })
    return { blocks }
  },

  async getPosts(params: GetDatabaseParameters) {
    return await getDatabasePosts(params)
  },

  async getLinks(params: GetDatabaseParameters & { slug?: string }) {
    return await getDatabaseLinks(params)
  },

  async getPost(params: GetDatabasePostParameters) {
    const post = await getDatabasePost(params)

    if (!post) return

    const blocks = await getBlocksResult({ block_id: post.id, ...params })

    return { post, blocks }
  },
}

export function getPlainText(richText: PlainText[]) {
  if (!richText) return ''
  return richText.map(({ text }) => text.content.replace('\n', ' ')).join(' ')
}

export function getBlockText(block: Block, type?: BlockTypes) {
  let _type = block && 'type' in block ? block.type : undefined
  const unknownBlock = block as unknown

  if (type) _type = type

  switch (_type) {
    case 'heading_1': {
      return getPlainText(
        ((unknownBlock as Heading2BlockResponse).heading_1 as Heading2Block)
          .rich_text as PlainText[],
      )
    }

    case 'heading_2': {
      return getPlainText(
        ((unknownBlock as Heading3BlockResponse).heading_2 as Heading3Block)
          .rich_text as PlainText[],
      )
    }

    case 'heading_3': {
      return getPlainText(
        ((unknownBlock as Heading4BlockResponse).heading_3 as Heading4Block)
          .rich_text as PlainText[],
      )
    }

    case 'paragraph': {
      return getPlainText(
        ((unknownBlock as ParagraphResponse).paragraph as ParagraphBlock)
          .rich_text as PlainText[],
      )
    }

    case 'quote': {
      return getPlainText(
        (unknownBlock as QuoteResponse).quote.rich_text as PlainText[],
      )
    }

    case 'callout': {
      return getPlainText(
        (unknownBlock as CalloutResponse).callout.rich_text as PlainText[],
      )
    }

    case 'bulleted_list_item': {
      const bulletedListItem = (unknownBlock as BulletedListItemResponse)
        .bulleted_list_item as BulletedListItemBlock
      return getPlainText(bulletedListItem.rich_text as PlainText[])
    }

    case 'numbered_list_item': {
      const numberedListItem = (unknownBlock as NumberedListItemResponse)
        .numbered_list_item as NumberedListItemBlock
      return getPlainText(numberedListItem.rich_text as PlainText[])
    }

    case 'embed': {
      const { url } = (unknownBlock as EmbedBlockResponse).embed as EmbedBlock
      return url
    }
  }

  return ''
}
