/**
 * Shared cross-feature UI constants, in brain so features consume them via
 * the barrel (never a sibling import). The minimum interactive hit-target
 * size in px — the WCAG ≥44px rule applied across the app.
 *
 * It MIRRORS the `--hit-target` CSS token (KR-115): use the token in CSS /
 * style strings, and this numeric constant only where a number is required
 * (e.g. a numeric `size` prop). The two forms must stay in sync.
 */
export const HIT_TARGET_MIN = 44
