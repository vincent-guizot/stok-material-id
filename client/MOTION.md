# Frontend motion

This branch starts from main (`4dbe8f7`) and is independent of the API/Swagger branch.

- `MotionConfig` honors the operating system's reduced-motion setting.
- Shared short easing/duration presets live in `src/components/motion/presets.js`.
- Route content fades without a transform on its ancestor, so fixed-position modals and receipts keep their viewport positioning. The route animation key uses pathname, preserving same-page query/tab state.
- Mobile navigation animates in/out with AnimatePresence, traps keyboard focus, supports Escape, and restores focus to the trigger.
- Clickable statistic cards use native buttons with keyboard focus and restrained hover/tap feedback. Static cards remain noninteractive.
- Notifications animate in/out, wrap within mobile viewports, announce status or errors, and retain their close action.
- Login and product cards use subtle entrance/interaction feedback. Movement is disabled for reduced-motion users.
- Global focus-visible styling and reduced-motion CSS cover controls and existing CSS animations.

Validation: production build, oxlint, and git diff whitespace checks pass. Browser smoke with mocked API responses verifies login, product hover/cart, checkout navigation, all dashboard routes, toast enter/exit, mobile drawer keyboard/focus behavior, and reduced-motion navigation, with no runtime errors. Desktop (1440 px) and mobile (390 px) screenshots were inspected locally.

These checks cover frontend interactions only; they do not repeat backend API tests or modify server logic. The existing production bundle size warning remains.
