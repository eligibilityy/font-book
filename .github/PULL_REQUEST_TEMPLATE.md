<!-- One feature or fix per PR. The title is a Conventional Commit: `feat(specimen): add waterfall sizes`. -->

## Problem

<!-- What was wrong or missing, and for whom? Link the issue or roadmap step. -->

## Behaviour

<!-- What the app does now. For UI changes, add a screenshot or a short clip. -->

## Validation

- [ ] `npm run check` passes (lint, typecheck, boundaries, knip, tests)
- [ ] `npm run build` passes
- [ ] Tried it in `npm run dev`: <!-- what you clicked and what you saw -->

## Compatibility

- [ ] Works on macOS (Apple Silicon) and Windows: no hard-coded paths or separators
- [ ] Changes to IPC channels or saved data (`src/shared`, userData files) still read data saved by the previous version, or this PR says why not
- [ ] No new network access: the app stays offline
