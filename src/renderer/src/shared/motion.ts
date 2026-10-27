/**
 * Motion's copies of the motion tokens in tokens.css, so animations written in
 * CSS and in Motion share one set of durations and curves.
 * See docs/design-principles.md#tokens-to-define.
 */

/** --ease-out: for anything entering or leaving. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** --ease-in-out: only for something moving from one place on screen to another. */
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/** --duration-fast, --duration-base, --duration-slow, in seconds. */
export const DURATION = { fast: 0.1, base: 0.18, slow: 0.28 } as const;
