import { Transition } from 'framer-motion';

/**
 * Shared motion tokens: spring physics curves and durations.
 * Crisp, snappy, responsive feel instead of sluggish easeInOut.
 */

export const transitions = {
  // Snappy spring for button taps and toggle switches
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
    mass: 0.8,
  } as Transition,

  // Bouncy spring for unlocks, badges, and celebration cards
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 18,
    mass: 1,
  } as Transition,

  // Smooth layout expansion / tab slide
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 28,
  } as Transition,

  // Micro-interaction duration tokens
  pressDuration: 0.12,
  cardPopDuration: 0.25,
  feedbackFlashDuration: 0.35,
};

export const microVariants = {
  buttonTap: {
    scale: 0.96,
  },
  cardHover: {
    y: -2,
  },
  shake: {
    x: [-6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.35 },
  },
  pop: {
    scale: [0.9, 1.08, 1],
    transition: transitions.bouncy,
  },
};
