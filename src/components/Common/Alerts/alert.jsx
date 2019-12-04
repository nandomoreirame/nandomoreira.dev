import React from 'react'
import classes from './alert.module.styl'

export const Alert = ({ message, type = 'default' }) => {
  let alertClass = `alert ${ classes.alert }`

  switch (type) {
  case 'success':
    alertClass += ` ${ classes.success }`
    break

  case 'danger':
  case 'error':
    alertClass += ` ${ classes.danger }`
    break

  case 'info':
    alertClass += ` ${ classes.info }`
    break

  case 'warning':
    alertClass += ` ${ classes.warning }`
    break

  default:
    alertClass += ` ${ classes.default }`
    break
  }

  return (
    <div className={alertClass}>
      <p>{message}</p>
    </div>
  )
}
