const {
  join,
  resolve,
  parse
} = require('path')
const kebabCase = require('lodash.kebabcase')
const webpackLodashPlugin = require('lodash-webpack-plugin')
const slugify = require('slugify')

const templatePath = join(__dirname, `src`, `templates`)

const slugifySettings = {
  replacement: '-',
  remove: true,
  lower: true
}

let postNodes = []

function addSiblingNodes (createNodeField) {
  postNodes = postNodes.filter(post => {
    return (post.id.indexOf('/posts/') > 0) ? post : null
  })

  postNodes.sort(
    ({
      frontmatter: {
        date: date1
      }
    }, {
      frontmatter: {
        date: date2
      }
    }) =>
      new Date(date1) - new Date(date2)
  )

  for (let i = 0; i < postNodes.length; i += 1) {
    const nextID = i + 1 < postNodes.length ? i + 1 : 0
    const prevID = i - 1 > 0 ? i - 1 : postNodes.length - 1
    const currNode = postNodes[i]
    const nextNode = postNodes[nextID]
    const prevNode = postNodes[prevID]

    createNodeField({
      node: currNode,
      name: 'nextTitle',
      value: nextNode.frontmatter.title
    })

    createNodeField({
      node: currNode,
      name: 'nextSlug',
      value: nextNode.fields.slug
    })

    createNodeField({
      node: currNode,
      name: 'prevTitle',
      value: prevNode.frontmatter.title
    })

    createNodeField({
      node: currNode,
      name: 'prevSlug',
      value: prevNode.fields.slug
    })
  }
}

exports.onCreateNode = ({
  node,
  actions,
  getNode
}) => {
  let slug
  const {
    createNodeField
  } = actions

  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent)
    const parsedFilePath = parse(fileNode.relativePath)

    if (
      Object.prototype.hasOwnProperty.call(node, 'frontmatter') &&
      Object.prototype.hasOwnProperty.call(node.frontmatter, 'title')
    ) {
      slug = `/${ kebabCase(node.frontmatter.title) }`
    } else if (parsedFilePath.name !== 'index' && parsedFilePath.dir !== '') {
      slug = `/${ parsedFilePath.dir }/${ parsedFilePath.name }/`
    } else if (parsedFilePath.dir === '') {
      slug = `/${ parsedFilePath.name }/`
    } else {
      slug = `/${ parsedFilePath.dir }/`
    }

    if (
      Object.prototype.hasOwnProperty.call(node, 'frontmatter') &&
      Object.prototype.hasOwnProperty.call(node.frontmatter, 'path')
    ) {
      slug = `/${ kebabCase(node.frontmatter.path) }`
    }

    createNodeField({
      node,
      name: 'slug',
      value: slug
    })

    postNodes.push(node)
  }
}

exports.setFieldsOnGraphQLNodeType = ({
  type,
  actions
}) => {
  if (type.name === 'MarkdownRemark') {
    addSiblingNodes(actions.createNodeField)
  }
}

exports.createPages = ({
  graphql,
  actions
}) => {
  const {
    createPage
  } = actions

  return new Promise((resolve, reject) => {
    resolve(
      graphql(
        `
        {
          postsQuery: allMarkdownRemark(
            sort: { order: DESC, fields: [frontmatter___date] }
            filter: { frontmatter: { layout: { eq: "post" } } },
          ) {
            edges {
              node {
                excerpt(pruneLength: 250)
                frontmatter {
                  layout
                  path
                  title
                  date
                  category
                }
              }
            }
          }
          projectsQuery: allMarkdownRemark(
            sort: { order: DESC, fields: [frontmatter___date] }
            filter: { frontmatter: { layout: { eq: "project" } } },
          ) {
            edges {
              node {
                excerpt(pruneLength: 250)
                frontmatter {
                  layout
                  path
                  title
                  date
                  category
                }
              }
            }
          }
          allMarkdownRemark {
            edges {
              node {
                id
                frontmatter {
                  layout
                  path
                  title
                  tags
                  category
                }
              }
            }
          }
        }
      `
      ).then(result => {
        if (result.errors) reject(result.errors)

        const {
          postsQuery,
          projectsQuery,
          allMarkdownRemark
        } = result.data

        allMarkdownRemark.edges.forEach(({
          node
        }) => {
          createSinglePages(createPage, node.frontmatter)
        })

        contentPaginate(createPage, projectsQuery, '/portfolio', 'projects', 10)
      })
    )
  })
}

exports.onCreatePage = ({
  page
}) => {
  if (page.path.startsWith('/404')) {
    page.layout = '404.index'
  }
}

exports.onCreateWebpackConfig = ({
  stage,
  actions
}) => {
  if (stage === `build-javascript`) {
    actions.setWebpackConfig({
      devtool: false,
      plugins: [webpackLodashPlugin]
    })
  }

  actions.setWebpackConfig({
    resolve: {
      modules: [
        resolve(__dirname),
        resolve(__dirname, 'src'),
        resolve(__dirname, 'src', 'stylus'),
        'node_modules'
      ],
      alias: {
        stylus: resolve(__dirname, 'src', 'stylus')
      }
    }
  })
}

function createSinglePages (createPage, frontmatter) {
  const _layout = frontmatter.layout ? String(frontmatter.layout) : `project`
  const _slug = slugify(frontmatter.title, slugifySettings)
  let _path = `/${ _slug }`

  if (_layout === 'project') {
    _path = `/projeto${ _path }`
  }

  if (frontmatter.path) {
    _path = slugify(`${ frontmatter.path }`, slugifySettings)
  }

  createPage({
    path: _path,
    component: join(templatePath, `${ _layout }-template.jsx`),
    context: {}
  })
}

function contentPaginate (
  createPage,
  posts,
  path = '/projeto',
  template = 'project',
  totalPerPage = 12
) {
  const totalPages = Math.ceil(posts.edges.length / totalPerPage)

  Array.from({
    length: totalPages
  }).forEach((_, i) => {
    createPage({
      path: i === 0 ? `${ path }` : `${ path }/${ i + 1 }`,
      component: join(templatePath, `${ template }-template.jsx`),
      context: {
        limit: totalPerPage,
        skip: i * totalPerPage,
        numPages: totalPages,
        currentPage: i + 1
      }
    })
  })
}
