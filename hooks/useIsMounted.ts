import { useCallback, useEffect, useRef } from 'react'

// Usage
// https://usehooks-ts.com/react-hook/use-is-mounted
// const isMounted = useIsMounted()
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  return useCallback(() => isMounted.current, [])
}
