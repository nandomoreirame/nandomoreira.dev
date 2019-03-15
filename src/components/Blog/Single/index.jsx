import React from 'react'

import {
  SEO,
  Layout,
  Container,
  SocialShare,
  ListTags,
  ScrollProgress,
} from 'Components/Common'

import { Header, Content, Comments, AuthorBox } from 'Components/Blog'

import classes from './postSingle.module.styl'

export const Single = ({ data, pageContext }) => {
  const post = data.markdownRemark
  const avatar = data.file
  const {
    siteUrl,
    isProduction,
    author,
    disqusShortname,
    social,
  } = data.site.siteMetadata
  const disqusConfig = {
    identifier: `${post.frontmatter.path}/`.replace(`/blog`, ``),
    title: post.frontmatter.title,
  }

  return (
    <Layout
      className={classes.single}
      itemProp="blogPost"
      itemScope
      itemType="https://schema.org/BlogPosting"
    >
      <SEO
        title={post.frontmatter.title}
        description={post.frontmatter.description}
        image={post.frontmatter.image.publicURL}
        pathname={post.frontmatter.path}
        article={post.frontmatter}
      />
      <ScrollProgress />
      <Header frontmatter={post.frontmatter} />
      <Container className={classes.small}>
        <meta itemProp="mainEntityOfPage" content={post.frontmatter.path} />
        <Content html={post.html}>
          <ListTags
            tags={post.frontmatter.tags}
            style={{
              marginTop: '1.875rem',
              paddingTop: '1.875rem',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          />
        </Content>

        <AuthorBox
          author={Object.assign({}, author, { avatar })}
          socialIcons={social}
        />

        <SocialShare
          link={`${siteUrl}${post.frontmatter.path}`}
          message={post.frontmatter.title}
        />

        {isProduction && (
          <Comments shortname={disqusShortname} config={disqusConfig} />
        )}
      </Container>
    </Layout>
  )
}