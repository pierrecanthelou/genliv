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
	DEJA_ECRITS_MAX,
	DEROGATIONS_AUDIENCE,
	PARTIES_REQUISES,
} from './registres'
export type { ContexteDetenteurs, ContexteProse, MotifRefusContexte } from './noyau'
export { assemblerProse } from './prose'
export { assemblerDetenteurs } from './detenteurs'
export { assemblerRepliques } from './repliques'
export { assemblerPlan } from './plan'
export { assemblerRelations } from './relations'
export { assemblerDistribution } from './distribution'
// LE SEPTIÈME ASSEMBLEUR (n° 10, `moteur-interprete`) — HORS DE LA COUTURE
// COMMUNE : il ne partage AUCUN registre de `./registres` (voir la docstring de
// tête d'`./interprete.ts`), donc `SAISIE_CARACTERES_MAX` sort AVEC lui plutôt
// que de rejoindre `CANDIDATS_MAX`/`DEJA_ECRITS_MAX` ci-dessus, qui restent
// exclusivement `Record<RoleCopilote, …>`-adjacents.
export { assemblerInterprete, SAISIE_CARACTERES_MAX } from './interprete'
export type { ContexteInterprete } from './interprete'
// LE HUITIÈME ASSEMBLEUR (n° 10 it2, `narrateur`) — HORS DE LA COUTURE COMMUNE lui
// aussi, pour la même raison que le septième. `BUDGET_CARACTERES_NARRATEUR` sort d'ICI
// pour `worker/frontiere.test.ts` SEULEMENT (le plafond HTTP doit couvrir ce rôle) —
// jamais par `brain/index.ts`. `CHAMPS_INJECTES_NARRATEUR` NE SORT PAS de ce baril : son
// seul lecteur hors du module est le test de confinement, qui l'importe en profondeur.
// ⚠ `BORNE_MEMOIRE` (it3) NON PLUS, pour la même raison : c'est un TERME du budget, lu par
// `contexte.test.ts` en profondeur pour prouver son exactitude — le plafond HTTP ne lit que
// la somme. L'it3 étend la branche `ok` de `ContexteNarrateur` (`ancres`, `condensation`)
// sans toucher à ce qui sort d'ici.
export { assemblerNarrateur, BUDGET_CARACTERES_NARRATEUR } from './narrateur'
export type { ContexteNarrateur } from './narrateur'
// LE NEUVIÈME ASSEMBLEUR (n° 11 `moteur-arbitre`, it2) — HORS DE LA COUTURE COMMUNE
// lui aussi, même motif que le septième et le huitième. `BUDGET_CARACTERES_ARBITRE`
// sort d'ICI pour `worker/frontiere.test.ts` SEULEMENT — jamais par `brain/index.ts`.
export { assemblerArbitre, BUDGET_CARACTERES_ARBITRE } from './arbitre'
export type { ContexteArbitre } from './arbitre'
