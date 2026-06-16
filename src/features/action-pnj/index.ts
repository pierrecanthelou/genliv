/**
 * action-pnj — public API. The composition root calls registerActionPnj to
 * self-register the « PNJ » editor with the brain ActionRegistry; node-editor
 * mounts it without importing this feature.
 */
export { registerActionPnj } from './register'
