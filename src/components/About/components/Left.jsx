import React, { lazy, Suspense } from 'react'
import ErrorBoundary from 'components/ErrorBoundary'
import { SocialIcons, Image } from 'components/Common'
import { Feed } from 'components/Instagram'
import { Skills } from 'components/About/Skills'

const Newjobs = lazy(() => import('components/Common/Alerts/newjobs'))

export const Left = ({ data, classes }) => (
  <div className={`about__left ${ classes.left }`}>
    <div className={`card ${ classes.inner }`}>
      <Image
        node={data.file}
        className={classes.image}
        title="Foto de Fernando Moreira Costa"
        alt="Foto de Fernando Moreira Costa"
      />
      {typeof window !== 'undefined' && <ErrorBoundary>
        <Suspense fallback={<span />}><Newjobs /></Suspense>
      </ErrorBoundary>}
      <SocialIcons icons={data.site.siteMetadata.social} />
      <Feed
        show={data.site.siteMetadata.isProduction}
        options={{
          total: 8,
          accessToken: '304341723.1677ed0.4f4681f740ed4a9daadc777de9fe2716',
          clientId: '4503fb5f1ba64fcbb61b7994dd792cee',
          get: 'user', // popular, user
          userId: 304341723,
          user: `${ data.site.siteMetadata.author.instagram }`
        }}
      />

      <Skills size="small" skills={data.site.siteMetadata.skills} />
    </div>
  </div>
)
