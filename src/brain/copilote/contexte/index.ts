/**
 * L'ASSEMBLEUR DE CONTEXTE — ce que le modèle VOIT, et rien d'autre.
 *
 * NON ré-exporté par `brain/index.ts` : aucun consommateur hors de `brain/`. Une
 * feature n'a aucune raison de composer un contexte elle-même — elle demande,
 * `CopiloteService` assemble.
 *
 * CE BARIL RE-EXPORTE EXACTEMENT ce que `contexte.ts` exportait avant sa scission :
 * les cinq sites d'import du dépôt écrivent `…/copilote/contexte` SANS extension et
 * `tsconfig.json` porte `moduleResolution: "bundler"`, donc AUCUNE instruction
 * d'import ne change nulle part. Il s'appelle `index.ts`, donc il tombe sous le
 * `coveragePathIgnorePatterns: 'index.ts$'` DÉJÀ écrit de `jest.config.cjs` — aucun
 * diff n'y est dû non plus.
 *
 * LA COUTURE DE LA SCISSION, en une phrase : on scinde ce qui VARIE PAR RÔLE (les
 * assembleurs, un fichier chacun) et on garde ENTIER ce qui doit rester TOTAL (les
 * registres `Record<RoleCopilote, …>`, dont la totalité EST le garde — « un rôle
 * ajouté sans entrée ne compile pas », support de KR-232).
 */
export {
	BUDGET_CARACTERES_CONTEXTE,
	CANDIDATS_MAX,
	CHAMPS_INJECTES,
	DEROGATIONS_AUDIENCE,
	PARTIES_REQUISES,
} from './registres'
export type { ContexteDetenteurs, ContexteProse, MotifRefusContexte } from './noyau'
export { assemblerProse } from './prose'
export { assemblerDetenteurs } from './detenteurs'
export { assemblerRepliques } from './repliques'
export { assemblerPlan } from './plan'
