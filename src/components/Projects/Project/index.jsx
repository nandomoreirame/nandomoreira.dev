import React from 'react'
import Link from 'gatsby-link'
import { Icon, Image } from 'components/Common'
import classes from './project.module.styl'
import './project.styl'

export const Project = ({ project, mod }) => (
  <article
    className={`project ${ classes.project } ${
      mod === 0 ? classes.left : classes.right
    }`}
  >
    <Link to={project.path} className={`card ${ classes.inner }`}>
      <div className={classes.content}>
        <header className={classes.header}>
          <small>{project.date}</small>
          <h1>{project.title}</h1>
        </header>
        <p
          className={classes.description}
          dangerouslySetInnerHTML={{
            __html: `${project.description}`
          }}
        />
        <div className={`Project__view ${ classes.view }`}>
          <span>Ver projeto </span>
          <Icon id="arrow-right" />
        </div>
      </div>
      <div to={project.path} className={classes.image}>
        <Image node={project.image} />
      </div>
    </Link>
  </article>
)
