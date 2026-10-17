'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'

// Fade in
export const FadeIn = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, delay = 0, duration = 0.3, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
FadeIn.displayName = 'FadeIn'

// Slide up
export const SlideUp = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, delay = 0, duration = 0.4, y = 20, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
SlideUp.displayName = 'SlideUp'

// Scale in
export const ScaleIn = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, delay = 0, duration = 0.2, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
ScaleIn.displayName = 'ScaleIn'

// Stagger container
export const StaggerContainer = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, stagger = 0.1, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { transition: { staggerChildren: stagger } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
StaggerContainer.displayName = 'StaggerContainer'

// Stagger item
export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
StaggerItem.displayName = 'StaggerItem'

// Pulse animation for loading states
export const Pulse = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
Pulse.displayName = 'Pulse'

// Shake for errors
export const Shake = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, trigger = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      animate={{ x: [0, -10, 10, -10, 10, 0] }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
Shake.displayName = 'Shake'

// Floating action button animation
export const FloatingActionButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
)
FloatingActionButton.displayName = 'FloatingActionButton'

// Page transition
export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
)

// Skeleton loader with shimmer
export const Skeleton = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave'
}) => {
  const baseStyle = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: variant === 'circular' ? '50%' : variant === 'rectangular' ? '8px' : '4px',
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : variant === 'rectangular' ? '100px' : '16px'),
  }

  const motionProps = animation === 'wave'
    ? { animate: { backgroundPositionX: ['-200%', '200%'] }, transition: { duration: 1.5, repeat: Infinity, ease: 'linear' } }
    : { animate: { opacity: [1, 0.4, 1] }, transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }

  return (
    <motion.div
      style={baseStyle}
      {...motionProps}
      className={className}
    />
  )
}