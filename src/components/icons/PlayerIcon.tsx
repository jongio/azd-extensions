import { forwardRef, useImperativeHandle, useCallback } from 'react'
import type { AnimatedIconHandle, AnimatedIconProps } from './types'
import { motion, useAnimate } from 'motion/react'

const PlayerIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, className = '', color = 'currentColor', strokeWidth = 2 }, ref) => {
    const [scope, animate] = useAnimate()

    const start = useCallback(async () => {
      await animate('.play-icon', { scale: [1, 0.85, 1.1, 1] }, { duration: 0.4, ease: 'easeOut' })
    }, [animate])

    const stop = useCallback(async () => {
      await animate('.play-icon', { scale: 1 }, { duration: 0.2, ease: 'easeOut' })
    }, [animate])

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }))

    return (
      <motion.div
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        className={`inline-flex ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="play-icon"
          style={{ transformOrigin: '50% 50%' }}
        >
          <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
      </motion.div>
    )
  }
)

PlayerIcon.displayName = 'PlayerIcon'

export default PlayerIcon
