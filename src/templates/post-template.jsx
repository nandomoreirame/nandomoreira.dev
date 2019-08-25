import React from 'react'
import { graphql } from 'gatsby'
import { Single } from 'components/Blog'

export default function Template ({ data, pageContext }) {
  if (!data.markdownRemark) return null
  return <Single data={data} pageContext={pageContext} />
}

export const postQuery = graphql`
  query PostByPath($path: String!) {
    site {
      siteMetadata {
        siteUrl
        isProduction
        disqusShortname
        author {
          name
          bio
        }
        social {
          paypal
          github
          instagram
          twitter
          codepen
          linkedin
          dribbble
          behance
          npm
        }
      }
    }
    file(relativePath: { eq: "sobre/avatar.png" }) {
      childImageSharp {
        fixed(width: 220, height: 220, quality: 90) {
          src
          srcSet
          base64
          width
          height
        }
      }
    }
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      excerpt(pruneLength: 250)
      frontmatter {
        path
        title
        date
        description
        category
        tags
        image {
          childImageSharp {
            fluid(maxWidth: 1300, quality: 90) {
              src
            }
          }
          publicURL
        }
      }
      fields {
        readingTime {
          text
        }
      }
    }
  }
`
