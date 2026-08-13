// Score de mutation — la seule instrumentation qui voit un test VERT sur une
// arithmétique FAUSSE. Tout le dispositif du projet repose sur « l'IA ne lance
// jamais les dés, le code les lance » (décision projet n° 4) : un mutant
// survivant dans `combat.ts` ou `xp.ts` est le défaut le plus cher du dépôt.
//
// ── CADENCE : À L'ITÉRATION, JAMAIS EN CONTINU ───────────────────────────────
// Ce run ne fait PAS partie de la porte de commit. `.claude/hooks/pre-commit-gate.sh`
// n'exécute que `tsc --noEmit` + `jest`, et cela ne change pas : un run de mutation
// dure des minutes, et une porte qu'on contourne ne garde rien.
//
// Il se lance EN FIN D'ITÉRATION, et seulement si l'itération a MODIFIÉ l'un des
// quatre fichiers de `mutate` ci-dessous — pas « appelé », MODIFIÉ. Le contrôle est
// mécanique et tient en une ligne, à recopier dans la revue d'itération :
//
//     git diff --stat main -- src/brain/challenge.ts src/brain/combat.ts src/brain/xp.ts src/brain/characteristics.ts
//
// Diff vide → run non requis, et la revue l'écrit. Diff non vide → run obligatoire,
// les 4 scores par fichier recopiés dans la revue, et `thresholds.break` relevé de
// +5 (plafond 90). Le seuil ne redescend JAMAIS (cliquet), et il s'écrit toujours
// `floor(score mesuré / 5) × 5` — aucun chiffre non mesuré dans ce fichier.
//
// Ce fichier était `stryker.config.json` jusqu'au 2026-08-13. Il est passé en
// `.mjs` pour une seule raison : JSON ne porte pas de commentaire, donc la
// RATIONALE par fichier ci-dessous n'avait nulle part où vivre — elle se
// retransmettait de session en session par la mémoire de quelqu'un. Convergence
// avec projetx / chrono-sabine (`plan-global.md` § 3, ligne « Rigueur du mutation
// testing »). Aucune option n'a changé de valeur dans la conversion.

/**
 * ── PÉRIMÈTRE MUTÉ : POURQUOI CES QUATRE-LÀ, ET AUCUN AUTRE ──────────────────
 *
 * Critère d'inclusion, un seul : **si un mutant survit ici, une partie se joue
 * faux sans que rien ne rougisse.** C'est l'arithmétique des règles du jeu, dont
 * `docs/REGLES-DU-JEU.md` est la source de vérité (KR-130).
 *
 * INCLUS
 *  · `challenge.ts`      — résolution d'un jet (dés ≤ carac, paliers de
 *                          difficulté, marge). Un opérateur de comparaison muté
 *                          change QUI réussit ; aucun test de rendu ne le voit.
 *  · `combat.ts`         — arithmétique d'assaut (attaque, dégâts, postures,
 *                          bouclier). Le fichier le plus dense en opérateurs du
 *                          dépôt, et celui dont l'erreur est la moins visible :
 *                          un combat faux reste un combat plausible.
 *  · `xp.ts`             — gains et coûts de progression. Une erreur y est
 *                          cumulative et irréversible pour le joueur.
 *  · `characteristics.ts`— `maxPV`, `healthState`, `enduranceMalus` : les seuils
 *                          d'inconscience et de mort. Un `<=` muté en `<` tue ou
 *                          sauve un personnage à un point près.
 *
 * EXCLUS, et le motif de chaque exclusion (pas un oubli — une décision)
 *  · `src/brain/dossier/**`  — validation de schéma, pas d'arithmétique de jeu.
 *                          Ses invariants sont tenus par `couverture.test.ts`,
 *                          qui ferme la boucle par la FIXTURE : un instrument
 *                          plus fort que la mutation sur ce terrain-là.
 *  · `src/brain/bestiary.ts`, `equipment.ts`, `monsterCapacities.ts`
 *                        — REGISTRES DE DONNÉES. Ils ne produisent que des
 *                          mutants de littéraux, qui mesurent une densité de
 *                          données et non la qualité des tests. Ils sont tenus
 *                          par la TABLE DORÉE (`src/brain/rules.golden.test.ts`),
 *                          qui tourne, elle, dans la porte de commit.
 *  · `src/brain/components/**` — présentation. Un mutant de style ne fausse
 *                          aucun jet.
 *  · `src/player/**`     — orchestration et écrans. La logique qu'ils appellent
 *                          est déjà mutée ci-dessus ; les muter en plus
 *                          rallongerait le run sans ajouter de signal.
 *  · `src/features/**`   — aucune règle de jeu n'y vit, par construction
 *                          (elles passent toutes par `brain/`).
 *
 * NOTE SUR LA NEUTRALISATION PAR MUTATEUR — à l'intérieur des 4 fichiers, les
 * registres de données (`CHALLENGE_TIERS`, `CHARACTERISTICS`, libellés de
 * `POSTURES`) sont sortis du dénominateur par des commentaires
 * `// Stryker disable StringLiteral,ObjectLiteral,ArrayDeclaration` posés AU PLUS
 * PRÈS — jamais un fichier entier, sans quoi les `ArithmeticOperator` et
 * `ConditionalExpression` du même fichier cesseraient d'être générés. La
 * contrepartie est obligatoire et livrée dans le même lot : `rules.golden.test.ts`
 * épingle valeur par valeur tout ce qui est neutralisé.
 *
 * `RuntimeError` : ZÉRO TOLÉRÉ. Stryker les exclut du dénominateur — ils
 * rétrécissent la base en silence et le score cesse d'être lisible. C'est une
 * panne d'instrument, pas un résultat : on la répare, on ne la contourne pas.
 */
const FICHIERS_MUTES = [
	'src/brain/challenge.ts',
	'src/brain/combat.ts',
	'src/brain/xp.ts',
	'src/brain/characteristics.ts',
]

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
	packageManager: 'npm',
	testRunner: 'jest',
	jest: {
		projectType: 'custom',
		// `jest.mutation.cjs`, pas `jest.config.cjs` : le run n'exécute que la couche
		// logique (`src/brain/**` + `src/player/**`). Conséquence à connaître avant de
		// lire un score — un mutant de règle que seul un test RTL de composant pouvait
		// tuer est, par définition de cet instrument, un SURVIVANT. L'arithmétique
		// s'épingle à l'unité, pas incidemment par un rendu.
		configFile: 'jest.mutation.cjs',
		enableFindRelatedTests: true,
	},
	mutate: FICHIERS_MUTES,
	ignorePatterns: [
		'stryker-tmp',
		'reports',
		'claude-design',
		'livraison',
		'templates',
		'design_handoff_gamebook_editor',
		'docs',
		'brief',
		'public',
		'dist',
		'.claude',
		'genliv_changes',
		'worker',
	],
	disableTypeChecks: '{src,test}/**/*.{ts,tsx}',
	coverageAnalysis: 'perTest',
	reporters: ['clear-text', 'progress', 'json', 'html'],
	jsonReporter: { fileName: 'reports/mutation/mutation.json' },
	htmlReporter: { fileName: 'reports/mutation/index.html' },
	// NE PAS « CORRIGER » CES DEUX RÉGLAGES — ils ont chacun coûté un run cassé.
	//  · `stryker-tmp` SANS POINT : avec `.stryker-tmp`, le `testMatch` ancré sur
	//    `<rootDir>/src/**` ne traverse pas un segment commençant par un point, jest
	//    voit zéro test, et Stryker sort sur « No tests were executed ».
	//  · `cleanTempDir: true` : seule protection de `npm run lint` contre le bac à sable.
	tempDirName: 'stryker-tmp',
	cleanTempDir: true,
	timeoutMS: 20000,
	dryRunTimeoutMinutes: 10,
	concurrency: 4,
	// CLIQUET. `break` ne descend jamais. Valeur posée le 2026-08-02 sur une mesure
	// réelle : score 81,40 % → `break: 80`. Toute itération qui MODIFIE l'un des 4
	// fichiers relève `break` de +5, plafond 90.
	//
	// Le score varie de ±1 mutant d'un run à l'autre (mesuré sur 5 exécutions le
	// 2026-08-02 : 81,40 % quatre fois, 81,01 % une fois) — NE PAS LE LIRE À LA
	// DÉCIMALE. Cause identifiée : le mutant `ObjectLiteral` de `combat.ts:107`
	// remplace `{ shield: …, rng }` par `{}`, ce qui fait retomber `rng` sur son
	// défaut `Math.random` non seedé. Conséquence pratique : le garde-fou « aucun
	// fichier ne recule » se lit À ±1 MUTANT PRÈS, sinon il produit de fausses alertes.
	thresholds: { high: 90, low: 80, break: 80 },
}
