import React from 'react'
import { Helmet } from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'

import defaultImage from './share.jpg'

export const SEO = ({
  name = null,
  title = null,
  description = null,
  image = null,
  pathname = null,
  article = {}
}) => (
  <StaticQuery
    query={graphql`
      query seoquery {
        site {
          siteMetadata {
            name
            defaultTitle: title
            titleTemplate
            defaultDescription: description
            siteUrl
            twitterUsername
            facebookAppID
            author {
              name
            }
          }
        }
      }
    `}
    render={({
      site: {
        siteMetadata: {
          name,
          defaultTitle,
          titleTemplate,
          defaultDescription,
          siteUrl,
          twitterUsername,
          facebookAppID,
          author
        }
      }
    }) => {
      const data = {
        name: name || author.name,
        title: title || defaultTitle,
        description: description || defaultDescription,
        image: `${ siteUrl }${ image || defaultImage }`,
        url: `${ siteUrl }${ pathname || '/' }`,
        fbType: article.title ? `article` : `website`,
        card: `summary_large_image`,
        appId: facebookAppID
      }

      const cleanDescription = data.description.replace(/<[^>]*>/g, '')

      return (
        <Helmet title={data.title} titleTemplate={titleTemplate}>
          <meta httpEquiv="content-language" content="pt-br" />
          <meta name="description" content={cleanDescription} />
          <meta name="image" content={data.image} />
          <meta name="robots" content="index,follow,noodp" />
          <meta name="country" content="Brazil" />
          <meta name="revisit-after" content="1 days" />
          <meta name="resource-type" content="document" />
          <meta name="distribution" content="global" />
          <meta name="rating" content="general" />
          <meta property="og:url" content={data.url} />}
          <meta property="og:locale" content="pt_BR" />
          <meta property="og:title" content={data.title} />
          <meta property="og:type" content={data.fbType} />
          <meta property="og:description" content={cleanDescription} />
          <meta property="og:image" content={data.image} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="600" />
          <meta property="og:image:height" content="315" />
          <meta property="og:image:alt" content={`${siteUrl}${defaultImage}`} />
          <meta property="og:site_name" content={data.name} />
          {article.title && (
            <meta property="article:author" content={author.name} />
          )}
          {article.category && (
            <meta property="article:section" content={article.category.join(',')} />
          )}
          {article && article.tags &&
            article.tags.map((tag, i) => {
              return <meta key={i} property="article:tag" content={tag} />
            })
          }
          {article.date && (
            <meta property="article:published_time" content={article.date} />
          )}
          {data.appId && <meta property="fb:app_id" content={data.appId} />}
          <meta name="twitter:card" content={data.card} />
          <meta name="twitter:site" content={twitterUsername} />
          <meta name="twitter:creator" content={twitterUsername} />
          <meta name="twitter:title" content={data.title} />
          <meta name="twitter:description" content={cleanDescription} />
          <meta name="twitter:image" content={data.image} />
          <meta name="twitter:domain" content={`${ siteUrl.replace(/(https?|http):\/\//i, '') }`} />
          {/* <link rel="canonical" href={data.url} /> */}
          <link rel="author" href={`${ siteUrl }/humans.txt`} />
          <link rel="index" href={`${ siteUrl }/`} />
          <html lang="pt-br" />
        </Helmet>
      )
    }}
  />
)
