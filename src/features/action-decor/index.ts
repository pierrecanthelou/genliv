/**
 * action-decor — public API. The composition root calls registerActionDecor to
 * self-register the « Décor » editor with the brain ActionRegistry; node-editor
 * mounts it without importing this feature.
 */
export { registerActionDecor } from './register'
