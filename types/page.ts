import type { FileBlock, RichText, Title } from './notion'

export type Page = {
  id: string
  slug: RichText
  title: Title
  description: RichText
  metaTitle: RichText
  metaDescription: RichText
  cover: FileBlock
}
