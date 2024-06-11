import type {
  DateResponse,
  FileBlock,
  MultiSelect,
  People,
  RichText,
  Select,
  Title,
  Url,
} from './notion'

export type Post = {
  id: string
  slug: RichText
  title: Title
  description: RichText
  date: DateResponse
  category: Select
  tags: MultiSelect
  author: People
  cover: FileBlock
  createdAt: string
  updatedAt: string
}

export type MediaResponse = {
  media: string
}

export type Link = {
  id: string
  slug: RichText
  title: Title
  description: RichText
  link: Url
  image: FileBlock
}
