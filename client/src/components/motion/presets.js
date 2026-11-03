// Short, consistent transitions for a busy POS interface.
export const motionTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] };
export const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
export const lift = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};
