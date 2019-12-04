import React from 'react'
import classes from './newjobs.module.styl'

export const Newjobs = ({ isAvailable = false }) => {
  let newjobsClass = ` ${ classes.notAvailable }`
  let newjobsText = 'Não disponível para novos projetos!'

  if (isAvailable) {
    newjobsClass = ` ${ classes.available }`
    newjobsText = 'Disponível para novos projetos!'
  }

  return (
    <div className={`newjobs ${ classes.newjobs }${ newjobsClass }`}>
      <p>{newjobsText}</p>
    </div>
  )
}
