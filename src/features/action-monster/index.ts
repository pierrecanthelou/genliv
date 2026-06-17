/**
 * action-monster — public API. The composition root calls registerActionMonster
 * to self-register the « Monstre » editor with the brain ActionRegistry;
 * node-editor mounts it without importing this feature.
 */
export { registerActionMonster } from './register'
