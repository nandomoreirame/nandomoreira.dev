import type {
  BlockObjectRequest,
  BulletedListItemBlockObjectResponse,
  CalloutBlockObjectResponse,
  CodeBlockObjectResponse,
  ColumnBlockObjectResponse,
  ColumnListBlockObjectResponse,
  EmbedBlockObjectResponse,
  FileBlockObjectResponse,
  GetBlockResponse,
  Heading1BlockObjectResponse,
  Heading2BlockObjectResponse,
  Heading3BlockObjectResponse,
  ImageBlockObjectResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  GetPageParameters as NotionGetPageParameters,
  QueryDatabaseParameters as NotionQueryDatabaseParameters,
  NumberedListItemBlockObjectResponse,
  PageObjectResponse,
  ParagraphBlockObjectResponse,
  QuoteBlockObjectResponse,
  VideoBlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'

export type GetDatabaseParameters = NotionQueryDatabaseParameters
export type GetDatabasePostParameters = GetDatabaseParameters & {
  slug: string
}
export type GetDatabasePagesParameters = GetDatabaseParameters & {
  slug: string
}
export type GetPageParameters = NotionGetPageParameters
export type GetListBlocksParameters = ListBlockChildrenParameters

export type PageResponse = PageObjectResponse

export type BlockTypes = BlockObjectRequest['type']
export type Block = {
  id: string
  type: BlockTypes
} & BlockObjectRequest &
  BlockWithChildren

export type BlockWithChildren = {
  children: Array<Block>
}

export type BlockResponse = GetBlockResponse & {
  children: Array<BlockResponse>
  child_page: { title: string }
}

export type GetChildrenBlockParameters = { block: BlockResponse }
export type ListBlockResponse = ListBlockChildrenResponse & {
  results: Array<BlockResponse>
}

export type UserResponse = {
  type: 'person'
  person: {
    email?: string
  }
  name: string | null
  avatar_url: string | null
  id: string
  object: 'user'
}

export type PlainTextContent = {
  content: string
  link: {
    url: string
  } | null
}

export type PlainText = {
  type: 'text'
  text: PlainTextContent
  annotations: Annotations
  plain_text: string
  href: any
}

export type SelectColor =
  | 'default'
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'

export type Color = SelectColor &
  (
    | 'gray_background'
    | 'brown_background'
    | 'orange_background'
    | 'yellow_background'
    | 'green_background'
    | 'blue_background'
    | 'purple_background'
    | 'pink_background'
    | 'red_background'
  )

export type Annotations = {
  bold: boolean
  italic: boolean
  strikethrough: boolean
  underline: boolean
  code: boolean
  color: Color
}

export type Formula = {
  id: string
  type: 'formula'
  formula: {
    type: string
    string: string
  }
}

export type RichText = {
  id: string
  type: 'rich_text'
  rich_text: Array<PlainText>
}

export type PartialSelect = {
  id: string
  name: string
  color: SelectColor
}

export type DateResponse = {
  type: 'date'
  date: {
    start: string
    end: string | null
    time_zone: string
  }
  object: 'property_item'
  id: string
}

export type Select = {
  id: string
  type: 'select'
  select: PartialSelect | null
}

export type MultiSelect = {
  id: string
  type: 'multi_select'
  multi_select: Array<PartialSelect>
}

export type Title = {
  id: string
  type: 'title'
  title: Array<PlainText>
}

export type People = {
  id: string
  type: 'people'
  people: Array<UserResponse>
}

export type CalloutResponse = CalloutBlockObjectResponse
export type CalloutBlock = CalloutBlockObjectResponse['callout'] & {
  rich_text: Array<RichText> | Array<PlainText>
}

export type CodeResponse = CodeBlockObjectResponse
export type CodeBlock = CodeBlockObjectResponse['code'] & {
  rich_text: Array<RichText> | Array<PlainText>
}

export type Heading2BlockResponse = Heading1BlockObjectResponse
export type Heading2Block = Heading2BlockResponse['heading_1'] & {
  rich_text: Array<RichText> | Array<PlainText>
}

export type Heading3BlockResponse = Heading2BlockObjectResponse
export type Heading3Block = Heading3BlockResponse['heading_2'] & {
  rich_text: Array<RichText> | Array<PlainText>
}

export type Heading4BlockResponse = Heading3BlockObjectResponse
export type Heading4Block = Heading4BlockResponse['heading_3'] & {
  rich_text: Array<RichText> | Array<PlainText>
}

export type ParagraphResponse = ParagraphBlockObjectResponse
export type ParagraphBlock = ParagraphBlockObjectResponse['paragraph'] & {
  rich_text: Array<RichText> | Array<PlainText>
}

export type QuoteResponse = QuoteBlockObjectResponse
export type QuoteBlock = QuoteBlockObjectResponse['quote'] & {
  rich_text: Array<RichText> | Array<PlainText>
}

export type BulletedListItemResponse = BulletedListItemBlockObjectResponse
export type BulletedListItemBlock =
  BulletedListItemBlockObjectResponse['bulleted_list_item'] & {
    rich_text: Array<RichText> | Array<PlainText>
  }

export type NumberedListItemResponse = NumberedListItemBlockObjectResponse
export type NumberedListItemBlock =
  NumberedListItemResponse['numbered_list_item'] & {
    rich_text: Array<RichText> | Array<PlainText>
  }

export type FileBlockResponse = FileBlockObjectResponse
export type FileBlock = FileBlockResponse['file']
export type FileFileBlock = {
  type: 'file'
  file: {
    url: string
    expiry_time: string
  }
  caption: Array<PlainText>
  name: string
}
export type FileExternalBlock = {
  type: 'external'
  external: {
    url: string
  }
  caption: Array<PlainText>
  name: string
}

export type ImageBlockResponse = ImageBlockObjectResponse
export type ImageBlock = ImageBlockResponse['image']

export type VideoBlockResponse = VideoBlockObjectResponse
export type VideoBlock = VideoBlockObjectResponse['video']

export type EmbedBlockResponse = EmbedBlockObjectResponse
export type EmbedBlock = EmbedBlockResponse['embed']

export type ColumnListBlockResponse = ColumnListBlockObjectResponse &
  BlockWithChildren
export type ColumnListBlock = ColumnListBlockResponse['column_list']

export type ColumnBlockResponse = ColumnBlockObjectResponse & BlockWithChildren
export type ColumnBlock = ColumnBlockResponse['column']
