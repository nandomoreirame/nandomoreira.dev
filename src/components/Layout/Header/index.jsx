import React from 'react'
import { Container, Brand, Nav } from 'components/Layout'
import { DarkSwitcher, DonateButton, Newjobs } from 'components/Common'
import classes from './header.module.styl'
import './header.styl'

export const Header = ({ navLinks, donateLink }) => (
  <header className={`header ${ classes.header }`}>
    <Newjobs isAvailable={false} />
    <div className={`headerInner ${classes.headerInner}`}>
      <Container>
        <div className={classes.inner}>
          <Brand />
          <Nav navLinks={navLinks} />
          <nav className={classes.navRight}>
            <DarkSwitcher />
            <DonateButton link={donateLink} />
          </nav>
        </div>
      </Container>
    </div>
  </header>
)
