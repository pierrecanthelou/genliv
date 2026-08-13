/**
 * La SURFACE EXACTE de l'API programmatique d'ESLint utilisée par
 * `src/features/dossier-format/tests/lintIsolation.test.ts` — trois membres, pas un
 * de plus.
 *
 * Pourquoi ici plutôt que `npm i -D @types/eslint` : `eslint` est déjà une
 * dépendance de développement du dépôt, et un seul fichier de test consomme son API.
 * Installer un paquet de types complet pour ça ajoute une dépendance à tenir à jour
 * (et un désalignement possible avec la version réellement installée) là où douze
 * lignes suffisent. Règle du dépôt : « No unnecessary dependencies ».
 *
 * CONTREPARTIE — le mode de panne réel, écrit plutôt que découvert. Ce n'est PAS
 * « ce fichier pourrait diverger de l'API » : une divergence ferait échouer le test
 * à l'exécution, ce qui est le bon sens de l'échec ici. Le vrai risque est que
 * `declare module 'eslint'` soit une déclaration **ambiante globale**, valable pour
 * tout le programme : le jour où `@types/eslint` arrive — typiquement en TRANSITIF,
 * lors d'un bump de `@typescript-eslint/*` — les deux déclarations fusionnent et
 * `tsc` sort un *duplicate identifier* sur `ESLint`, dans un fichier sans rapport
 * avec le bump, avec un message qui n'aide pas.
 *
 * PARADE, en une ligne : supprimer ce fichier et laisser les types du paquet
 * prendre la main. Rien d'autre à faire — la surface déclarée ici est un
 * sous-ensemble de la vraie.
 */
declare module 'eslint' {
	export interface LintMessage {
		message: string
		ruleId: string | null
	}

	export interface LintResult {
		filePath: string
		messages: LintMessage[]
	}

	export class ESLint {
		constructor(options?: { cwd?: string })
		lintText(code: string, options?: { filePath?: string }): Promise<LintResult[]>
	}
}
