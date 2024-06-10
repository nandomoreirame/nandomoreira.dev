import type {
  FileBlock,
  MultiSelect,
  People,
  RichText,
  Select,
  Title,
} from './notion'

export type Post = {
  id: string
  slug: RichText
  title: Title
  description: RichText
  category: Select
  tags: MultiSelect
  author: People
  cover: FileBlock
  createdAt: string
  editedAt: string
}

export type MediaResponse = {
  media: string
}
