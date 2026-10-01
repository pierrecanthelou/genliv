RISQUE — Inchangé : heroTier gelé en signature, score de mutation sur xp.ts à surveiller en fin de lot A. Risque neuf trouvé en révisant mon propre tableau tour 1 : il ne touchait jamais `docs/REGLES-DU-JEU.md`. La lecture « hors combat, Tier_personnage = caractéristique testée » n'existait QUE dans la docstring/signature d'`xpDuJet` — jamais dans la doc qui fait foi (KR-130). Sans cette ligne, `actionEngine.ts:38` (code orphelin, voir ci-dessous) restait la seule trace écrite de cette règle au dépôt — exactement le mode de panne que KR-130 interdit.

OBJECTION — **(1) Naming** : j'adopte le découpage de narratif-ia — `'echoue' | 'reussit' | 'reussit_nettement'`, zéro renommage. Motif de tech-lead, pas narratif : mon découpage à 2 renommages cassait `arbitre.test.ts:103` et `contexte.test.ts:4432/4452` sans aucun gain fonctionnel — surface de diff inutile sur un contrat déjà figé en it2. `classifierIssue` garde sa signature actuelle : réserve QA #4 **RETIRÉE**, `ChallengeResult.margin` existe déjà (confirmé en lisant `arbitre.ts:58-66`), aucun second paramètre. **(2) Duplication** : confirmé **ORPHELINE**, pas une règle dupliquée. `src/player/types.ts:37-42` documente nommément que `combatEngine.ts` et ses pairs — dont `actionEngine.ts` (`resolveRoll`) — sont des « survivants orphelins » de l'`AdventureDocument`, retiré en `moteur-dossier` it4 (KR-240), sans producteur. `challengeXp`/`resolveChallenge` restent une seule source dans `brain/` ; seul l'assemblage glue, lié à des types `HeroState` morts, coexiste — geler, ne pas toucher (CLAUDE.md). Aucune action. **(3)** Confirmé : docstring `arbitre.ts` + `worker/index.ts:903` bundlées dans le lot A, fichiers déjà rouverts, coût marginal nul. Réserves croisées : QA scénarios A/B/C → MAINTENUE (déjà dans le lot A) ; QA DoD mutation → MAINTENUE ; UX « zéro `.tsx` » → alignée ; PM source unique + heroTier inline → alignée.

PROPOSITION — `IssueEpreuve` par ajout pur, duplication non traitée (orpheline gelée), docstrings bundlées lot A, **+1 fichier lot A** : `docs/REGLES-DU-JEU.md` §5.

VERDICT — recevable sous réserve : (a) la ligne `REGLES-DU-JEU.md` §5 avant tout code lot A, (b) lot B reste zéro impact.

---

## ANNEXE — Amendements au découpage (Lot A seulement ; Lot B inchangé)

| Fichier | N/R | Changement vs tour 1 |
|---|---|---|
| `docs/REGLES-DU-JEU.md` | R | **Ajout de ligne**, §5 : « Hors combat, `Tier_personnage` se lit sur la caractéristique **testée** (celle du jet), jamais la MC — réservée aux jets de fuite / combat (n°13) ». Source écrite avant propagation au code (KR-130, sens d'écriture permanent). |
| `src/brain/dossier/arbitre.ts` | R | **Révisé** : `IssueEpreuve = 'echoue' \| 'reussit' \| 'reussit_nettement'` (ajout pur, pas de renommage). `classifierIssue(resultat: ChallengeResult): IssueEpreuve` — signature **inchangée** ; ajoute une branche : `!success` → `'echoue'` (inchangé), `success && margin >= MARGE_FRANCHE` → `'reussit_nettement'` (neuf), sinon `'reussit'` (inchangé, littéral et comportement identiques à it2). Docstring corrigée : retire « seule appelante dans tout le dépôt », remplace par « seule appelante dans `brain/`+`features/**` ; `src/player/engine/{actionEngine,combatEngine,capacityEffects}.ts` appellent aussi `resolveChallenge` directement — orphelins gelés (KR-240), hors périmètre ». `xpDuJet`/reste inchangé vs tour 1. |
| `src/brain/dossier/arbitre.test.ts` | R | Le cas marge=3 bascule de `'reussit'` à `'reussit_nettement'` (changement de comportement, pas de renommage de littéral — `'reussit'` reste testé ailleurs sur marge<3). Reste : témoin KR-261 (`jest.mock` MARGE_FRANCHE), tests `xpDuJet`. |
| `src/brain/copilote/contexte/narrateur.ts` | R | `AMORCE_ISSUE` passe à 3 entrées **par ajout** : `reussit: 'réussit'` (inchangé), `reussit_nettement: 'réussit nettement'` (neuf), `echoue: 'échoue'` (inchangé). |
| `src/brain/copilote/contexte.test.ts` | R | Met à jour **uniquement** le(s) cas qui basculent vers `reussit_nettement` (FO 12/TC1, déjà cité :4432/:4452) ; aucune autre assertion `'reussit'`/`'échoue'` ne change — diff minimal, gain direct du choix narratif-ia. |
| `worker/index.ts` | **R (ajouté)** | Remesure la docstring ~ligne 903 : mot le plus long d'`AMORCE_ISSUE` devient `'réussit nettement'` (18 car.) ; recalcul de la borne citée. Aucune route/logique modifiée — hors périmètre parité worker. |

Tout le reste du lot A (xp.ts, xp.test.ts, session.ts, session.test.ts, brain/index.ts) et tout le lot B sont inchangés vs tour 1.

## Décisions prises en autonomie (tour 2)

- Naming d'`IssueEpreuve` laissé en suspens entre mon découpage (tour 1) et celui de narratif-ia → j'ai choisi celui de narratif-ia (ajout pur, 0 renommage) → si c'était l'inverse, deux tests déjà verts (`arbitre.test.ts:103`, `contexte.test.ts:4432/4452`) casseraient sur un littéral de type sans raison fonctionnelle, pur coût de revue.
- Portée exacte de la correction de docstring `arbitre.ts` (silence vs réécriture complète) → j'ai choisi une reformulation scopée (« seule appelante dans `brain/`+`features/**` ») plutôt qu'un simple retrait de la phrase → si on retire sans reformuler, un futur lecteur perd la garantie d'unicité qui motivait le témoin de balayage du test.
- `docs/REGLES-DU-JEU.md` absent de mon lot A tour 1 → je l'ajoute maintenant → si on le laisse hors lot, la règle heroTier hors-combat reste non sourcée au sens KR-130 malgré un code qui l'applique déjà.
