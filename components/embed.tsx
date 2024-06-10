type NotionEmbedProps = {
  embedUrl: string
  caption?: string
}

export function NotionEmbed({
  embedUrl,
  caption,
}: NotionEmbedProps): JSX.Element {
  return (
    <div className="embed">
      <iframe className="iframe" src={embedUrl} allowFullScreen />
      {caption && <span className="caption">{caption}</span>}
    </div>
  )
}
