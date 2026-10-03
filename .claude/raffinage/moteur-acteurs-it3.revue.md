# Revue — `moteur-acteurs` itération 3 (n°12 du roadmap, Temps 2)

## En une ligne

L'auteur voit la confiance qu'un PNJ accorde au joueur, gagnée réplique après réplique, finir par lui ouvrir un savoir qu'il gardait — la 3e des quatre portes de révélation (`confiance_min`) est désormais honorée.

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Savoir gardé uniquement par `confiance_min=N` → 3 branches (<N fermé, =N/>N ouverts) | **VÉRIFIÉ** | `revelation.test.ts:215-229` |
| 2 | `delta_confiance` hors `{-1,0,1}` → refus atomique total (réplique comprise) | **VÉRIFIÉ** | `schemaSortie.test.ts:3288` |
| 3 | Saturation aux DEUX bornes (`-3+(-1)→-3`, `+3+(+1)→+3`) | **VÉRIFIÉ** | `session.test.ts:502-514` |
| 4 | PNJ sans `faits.pnj[id]` → lecture `CONFIANCE_DEPART=0` | **VÉRIFIÉ** | `session.test.ts:488`, `revelation.test.ts:231` |
| 5 | Ordre figé : révélation + Δ au même appel → révélation AVANT Δ, `crediterConfiance` APRÈS | **VÉRIFIÉ** (contre-épreuve : le test rougirait si l'ordre était inversé) | `recit.test.ts:562-577` |
| 6 | Écriture croisée `a_dit`/`confiance`, deux ordres → les deux survivent | **VÉRIFIÉ** | `recit.test.ts:586, 609` |
| 7 | Invite système du rôle acteur : `'confiance'` retiré de `interdits`, aucune borne/seuil récité | **VÉRIFIÉ** | `worker/index.test.ts:2005` |
| 8 | `delta_confiance` d'une réponse R4 réelle (mockée) → session créditée/saturée | **VÉRIFIÉ** | `useTourDeJeu.test.ts:1255, 1284, 1320` |

## Diff par lot

- **Lot A — `contrat-confiance` (`dev-contrat`, seul et en premier)** : `docs/REGLES-DU-JEU.md` (§6 Confiance & Persuasion), `brain/dossier/types.ts` (`CONFIANCE_DEPART`), `brain/dossier/faits.ts` + `faits.test.ts` (nouveau — `EtatPnj.confiance?`), `brain/dossier/session.ts` + test (`crediterConfiance`), `brain/dossier/sessionDestinations.ts` + `sessionCouverture.test.ts`, `brain/dossier/recit.ts` + test (fix `avecIndiceConfie`, ordre figé — **corrigé une 2e fois en cours de revue, voir écarts assumés**), `brain/dossier/revelation.ts` + test (`portesOuvertes` + `personnageId`), `brain/dossier/__fixtures__/dossier-reference.json` (3e savoir de Harek), `brain/copilote/types.ts`, `brain/copilote/schemaSortie.ts` + test, `brain/CopiloteService.ts` + test, `worker/index.ts` + `worker/index.test.ts`.
- **Lot B — `cablage-confiance` (`dev-lot`)** : `play-mode/hooks/useTourDeJeu.ts` + test (passthrough `deltaConfiance`).
- **Ricochets légitimes, documentés** : `__fixtures__/session-saturee.ts` (confiance de test), `worker/frontiere.test.ts` (canari croisé worker↔brain cassé par la 3e clé requise), `copilote/contexte/narrateur.ts` + `contexte.test.ts` (re-mesure de budget après le 3e savoir de Harek), `__fixtures__/dossier-reference.json` (lien `mene_a` ajouté depuis `indice.sceau-brise-a-nouveau` vers le nouvel indice, pour lui donner un 2e producteur et éviter une alerte `indice-sans-source` dans `controles.test.ts` — ce dernier fichier n'est lui-même PAS modifié, la règle qu'il porte classe déjà ce cas en silence), `dossier-registres/tests/panneauIndices.test.tsx` (compte d'indices 4→5).

## Ce qui a été refusé

- **Signal qualitatif de confiance injecté au contexte R4** (« bloc ENVERS LUI », proposé par Narratif-IA tour 1, retiré par elle-même au tour 2 après vérification critère par critère) — aucun AC d'it3 ne l'exige, le catalogue borné suffit à démontrer l'ouverture d'un savoir. Même statut que le bloc `PRESENTS` rejeté en it1. Versé en dette à déclencheur (playtest KR-229).
- **Forme réseau enum `elan` (3 jetons) pour `delta_confiance`** (Narratif-IA, retirée au tour 2) — l'entier brut `-1|0|1` est conforme au cadrage signé et ne présente aucun désavantage de robustesse démontré.
- **Fichier `motsInterdits.ts` séparé** (UX, rejeté au tour 2, convergence Tech Lead/Narratif-IA) — le besoin se résout en étendant la liste `interdits` déjà existante de `worker/index.test.ts` (précédent `'jet'`/`'indice'`).
- **Filtrer « confiance » dans la réplique elle-même** (proposition initiale de l'UX, amendée après l'objection de Narratif-IA) — seule l'invite système est scannée ; la réplique reste prose libre et peut légitimement dire « confiance » en diégèse.
- **Lot contrat unique, sans lot B** (proposition du Tech Lead, rejetée en arbitrage) — `useTourDeJeu.ts` devait nécessairement être touché pour le câblage, précédent exact d'it1/it2.

## Ce qui a été reporté

- Signal qualitatif de confiance vers R4 → dette à déclencheur, déclencheur = incohérence ton/état mesurée en playtest réel (KR-229) au-delà de K=4 répliques. Texte complet du bloc proposé conservé dans `.claude/raffinage/moteur-acteurs-it3/tour1-narratif-ia.md`.
- `contrepartie.consomme:true` → futur verbe `donner <objet> <pnj>` (report déjà acté en it2, non rouvert ici).
- Curseur `caractere.curseurs.mefiance` (`'moteur'`, aucun lecteur) — nécessiterait d'abord une règle dans `docs/REGLES-DU-JEU.md`.

## Écarts assumés et incident

**Incident critique, résolu avant présentation à l'utilisateur (BUG-148)** : lors de la vérification QA en mode B (1er passage), l'agent a probablement exécuté une commande git destructive (`git checkout` ou équivalent) pendant une contre-épreuve, qui a effacé silencieusement le travail déjà livré et vérifié du lot A dans `src/brain/dossier/recit.ts` (fichier jamais annoncé dans sa méthodologie) — le fichier était redevenu identique à `HEAD` (avant it3), alors que son fichier de test gardait les nouveaux tests, produisant 13 erreurs de compilation. Le rapport QA a conclu, de bonne foi mais à tort, à une « lacune d'implémentation majeure » du lot A. L'orchestrateur a diagnostiqué la cause réelle par un `git diff --stat` ciblé (contredisant le rapport du dev-contrat et de l'intégrateur, tous deux vérifiés exacts par ailleurs) et a ré-appliqué directement le correctif déjà validé (import `crediterConfiance`, spread dans `avecIndiceConfie`, ordre figé) sans redéléguer. Un 2e passage QA, explicitement mis en garde contre les commandes git destructives sur du travail non committé, confirme `CONFORME`.

**Incident de process récidivant (BUG-147, même classe que BUG-128/139/143/146)** : l'intégrateur a lancé un `prettier`/`npm run format` non scopé qui a reformaté `panneauPersonnages.test.tsx` (hors des deux lots), effaçant le timeout explicite de 15000ms et son commentaire BUG-128 — une régression du correctif historique, pas un simple écart de style. Reverté par l'orchestrateur avant mise en index ; confirmé vierge au 2e passage QA.

## Porte qualité

- `tsc --noEmit` : vert.
- `jest` : 137 suites / 2369 tests, tous verts (vérifié indépendamment par l'orchestrateur après résolution de l'incident, pas seulement rapporté par un agent).
- ESLint : 0 erreur (1 warning pré-existant, hors périmètre).
- Mutation (`src/brain/{challenge,combat,xp,characteristics}.ts`) : non due, aucun des 4 fichiers de règles touché.
- Table dorée (`rules.golden.test.ts`) : non touchée, aucun registre doré concerné par cette itération.

## RETOUR-COMITÉ

- Le découpage en 2 lots (A contrat, B feature) était correct — les deux incidents de cette itération viennent de l'EXÉCUTION (un ouvrier de vérification, un ouvrier d'intégration), jamais du plan ni des lots eux-mêmes.
- **Leçon nouvelle, transverse à tout essaim futur** : un rapport d'agent qui conclut à une régression ou une lacune doit être confronté à un diff indépendant AVANT d'être accepté à la lettre — surtout quand il contredit deux comptes rendus convergents antérieurs (ici dev-contrat + intégrateur). Un agent de vérification avec accès Bash qui fait une contre-épreuve doit restaurer par l'édit inverse exact, jamais par une commande git sur un fichier dont il n'a pas vérifié l'état committé au préalable.
- Le débat architectural central (signal qualitatif vers R4) a été résolu SANS escalade : Narratif-IA a elle-même reconnu, critère par critère, qu'aucun AC ne l'exigeait — un comité qui se corrige lui-même au tour 2 évite une escalade inutile vers l'humain.
