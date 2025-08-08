// 📁 frontend/src/utils/framer-motion-stub.ts - REEMPLAZO SIN JSX SYNTAX
import React from 'react'

// 🔧 Componentes stub que reemplazan motion.* en producción
const createMotionComponent = (tag: keyof JSX.IntrinsicElements) => {
  return React.forwardRef<any, any>((props, ref) => {
    const { 
      initial, animate, exit, transition, whileHover, whileTap, 
      variants, ...restProps 
    } = props
    
    return React.createElement(tag, { ...restProps, ref })
  })
}

// 🔧 Motion components stub
export const motion = {
  div: createMotionComponent('div'),
  button: createMotionComponent('button'),
  span: createMotionComponent('span'),
  p: createMotionComponent('p'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  form: createMotionComponent('form'),
  section: createMotionComponent('section'),
  article: createMotionComponent('article'),
  nav: createMotionComponent('nav'),
  header: createMotionComponent('header'),
  main: createMotionComponent('main'),
  footer: createMotionComponent('footer'),
  aside: createMotionComponent('aside'),
  ul: createMotionComponent('ul'),
  li: createMotionComponent('li'),
  img: createMotionComponent('img'),
  svg: createMotionComponent('svg'),
  path: createMotionComponent('path')
}

// 🔧 AnimatePresence stub - SIN JSX
export const AnimatePresence: React.FC<{
  children: React.ReactNode
  mode?: string
  initial?: boolean
  exitBeforeEnter?: boolean
}> = ({ children }) => {
  return React.createElement(React.Fragment, {}, children)
}

// 🔧 Hooks stub
export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {}
})

export const useMotionValue = (initial: any) => ({
  get: () => initial,
  set: () => {},
  onChange: () => () => {}
})

export const useTransform = (value: any, ) => value

export const useSpring = (value: any) => value

export const useScroll = () => ({
  scrollX: { get: () => 0 },
  scrollY: { get: () => 0 },
  scrollXProgress: { get: () => 0 },
  scrollYProgress: { get: () => 0 }
})

// 🔧 Utilities stub
export const animate = () => Promise.resolve()
export const stagger = (delay: number) => delay
export const easeIn = 'ease-in'
export const easeOut = 'ease-out'
export const easeInOut = 'ease-in-out'

// 🔧 Default export
export default {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  animate,
  stagger,
  easeIn,
  easeOut,
  easeInOut
}