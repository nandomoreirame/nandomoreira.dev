import { useEffect } from 'react'

export const useAsyncEffect = (
  f: () => any | Promise<any>,
  args: Array<any> = [],
) => {
  useEffect(() => {
    const p = f()
    if (p) {
      p.then(() => undefined).catch(() => undefined)
    }
  }, args)
}
