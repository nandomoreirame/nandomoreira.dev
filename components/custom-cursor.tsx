'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect } from 'react'

export const CustomCursor = () => {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16)
      cursorY.set(e.clientY - 16)
    }

    window.addEventListener('mousemove', moveCursor)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
    }
  }, [])

  return (
    <motion.div
      // animate={{ x: position.x + 10, y: position.y + 10 }}
      style={{
        translateX: cursorXSpring,
        translateY: cursorYSpring,
      }}
      className="pointer-events-none fixed z-cursor hidden size-12 items-center justify-center rounded-full border-2 border-primary lg:flex"
    />
  )
}
