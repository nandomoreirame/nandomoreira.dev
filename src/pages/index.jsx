import React from 'react'
import { graphql } from 'gatsby'
import { Home } from 'components/Home'

const Index = ({ data }) => {
  const { social, navLinks } = data.site.siteMetadata
  const { fixed } = data.file.childImageSharp
  return <Home navLinks={navLinks} social={social} avatar={fixed} />
}

export default Index

export const indexQuery = graphql`
  query IndexQuery {
    file(relativePath: { eq: "sobre/avatar.jpg" }) {
      childImageSharp {
        fixed(width: 300, height: 300, quality: 90) {
          src
          srcSet
          base64
          width
          height
        }
      }
    }
    site {
      siteMetadata {
        navLinks {
          name
          path
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
  }
`
