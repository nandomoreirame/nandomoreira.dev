import React, { useState, useEffect } from 'react'
import { useIsMounted } from 'hooks'
import classes from './newjobs.module.styl'

const Newjobs = () => {
  const isMounted = useIsMounted()
  const [isLoading, setLoading] = useState(false)
  const [isHireable, setHireable] = useState(false)
  const [timer, removeSetTimeout] = useState(null)

  useEffect(() => {
    setLoading(true)

    if (isMounted.current) {
      removeSetTimeout(setTimeout(() => fetchHireable(), 800))
      clearTimeout(timer)
    }
  }, [])

  const fetchHireable = () =>
    fetch('https://api.github.com/users/nandomoreirame')
      .then(response => response.json())
      .then(({ hireable }) => setHireable(!!hireable))
      .catch(error => console.error(error))
      .finally(() => setLoading(false))

  return (
    <div className={`newjobs ${ classes.newjobs } ${ isHireable ? classes.hireable : classes.notHireable }`}>
      {isLoading && <p>carregando...</p>}
      {!isLoading && <p>{`${ (isHireable ? '' : 'não ') }disponível para novos projetos!`}</p>}
    </div>
  )
}

export default Newjobs
