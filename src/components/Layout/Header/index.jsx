import React, { lazy, Suspense } from 'react'
import ErrorBoundary from 'components/ErrorBoundary'
import { Container, Brand, Nav } from 'components/Layout'
import { DarkSwitcher, DonateButton } from 'components/Common'
import classes from './header.module.styl'
import './header.styl'

const Newjobs = lazy(() => import('components/Common/Alerts/newjobs'))

export const Header = ({ navLinks, donateLink }) => (
  <header className={`header ${ classes.header }`}>
    {typeof window !== 'undefined' && <ErrorBoundary>
      <Suspense fallback={<span />}><Newjobs /></Suspense>
    </ErrorBoundary>}
    <div className={`headerInner ${ classes.headerInner }`}>
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
