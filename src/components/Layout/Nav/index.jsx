import React from 'react'
import Link from 'gatsby-link'
import { Icon } from 'components/Common'
import classes from './nav.module.styl'

export class Nav extends React.Component {
  constructor () {
    super()

    this.state = {
      isOpen: false
    }

    this.handleNavToggle = this.handleNavToggle.bind(this)
  }

  handleNavToggle (event) {
    this.setState({
      isOpen: event.target.checked
    })
  }

  componentDidMount () {
    this.setState({ isOpen: false })
  }

  componentWillUnmount () {
    this.setState({ isOpen: false })
  }

  render () {
    return (
      <nav
        className={`nav ${ classes.nav } ${
          this.state.isOpen ? classes.isOpen : ''
        }`}
        aria-label="Navigation"
        itemType="https://schema.org/SiteNavigationElement"
        itemScope
      >
        <input type="checkbox" id="toggleNav" onChange={this.handleNavToggle} />
        <label htmlFor="toggleNav" type="button" role="button" className={`toggle-button ${ classes.button }`}>
          {!this.state.isOpen && (
            <Icon id="menu" className={classes.iconMenu} />
          )}
          {this.state.isOpen && (
            <Icon id="close" className={classes.iconClose} />
          )}
        </label>

        <ul className={`nav__list ${ classes.list }`}>
          {this.props.navLinks.map(item => {
            return (
              <li className={`nav__item ${ classes.item }`} key={item.path}>
                {item.name === 'Blog' ?
                  (<a
                    className={`nav__link ${ classes.link }`}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    itemProp="url"
                  >
                    {item.name}
                  </a>) : (<Link
                    className={`nav__link ${ classes.link }`}
                    activeClassName={`nav__link--active ${ classes.linkActive }`}
                    to={item.path}
                    itemProp="url"
                  >
                    {item.name}
                  </Link>)}
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }
}
