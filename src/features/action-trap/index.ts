/**
 * action-trap — public API. The composition root calls registerActionTrap to
 * self-register the « Piège » editor with the brain ActionRegistry; node-editor
 * mounts it without importing this feature.
 */
export { registerActionTrap } from './register'
