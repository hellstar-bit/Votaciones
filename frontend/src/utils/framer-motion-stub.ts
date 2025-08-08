// 📁 frontend/src/utils/framer-motion-stub.ts
import React from 'react'

const createMotionComponent = (tag: keyof JSX.IntrinsicElements) => {
  return React.forwardRef<any, any>((props, ref) => {
    const { 
      initial, animate, exit, transition, whileHover, whileTap, 
      variants, ...restProps 
    } = props
    
    return React.createElement(tag, { ...restProps, ref })
  })
}

export const motion = {
  div: createMotionComponent('div'),
  button: createMotionComponent('button'),
  span: createMotionComponent('span'),
  p: createMotionComponent('p'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  form: createMotionComponent('form'),
  section: createMotionComponent('section')
}

export const AnimatePresence: React.FC<{
  children: React.ReactNode
  mode?: string
}> = ({ children }) => {return children}

export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {}
})