import { ContactForm } from '@/components/contact-form'
import { Container } from '@/components/container'
import { Loader } from '@/components/loader'
import { Page } from '@/components/page'
import { env } from '@/env'
import { getDomain, metadata } from '@/lib'
import { notion } from '@/lib/notion'
import { Suspense } from 'react'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'contato',
  })

  if (!page) return {}

  const [title] = page.metaTitle.rich_text
  const [description] = page.metaDescription.rich_text
  const [slug] = page.slug.rich_text

  return metadata({
    title: title.plain_text,
    description: description.plain_text,
    baseUrl: getDomain(),
    slug: slug.plain_text,
  })
}

export default function ContactPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Page
        slug="contato"
        pageTitle={
          <>
            E ai! bão <span className="text-primary">ou não?</span>
          </>
        }
        pageBadge={'Contato'}
      >
        <Container
          size={'sm'}
          className="animate-fade-in-up pb-12 animate-delay-500 animate-duration-slow"
        >
          <ContactForm />
        </Container>
      </Page>
    </Suspense>
  )
}
