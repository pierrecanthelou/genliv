# Plan d'itération — `moteur-arbitre` · itération `3`

> Statut : `validé` — le 2026-10-01
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-01
> Composition : `5 rôles` — motif : l'itération touche le moteur (classification d'issue, calcul d'XP) et le contrat narratif-ia injecté à R3 ; convoquée dès le cadrage.
> Exécution : `séquentielle` (2 lots, le lot B dépend des exports figés par le lot A)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin de cette itération, l'auteur voit son héros gagner l'XP correspondant à la marge réelle de son jet. » |
| **Tranche** | `CarteJet` (résultat déjà affiché) → `useTourDeJeu.lancerLeDe` → `brain/dossier/arbitre.ts` (xpDuJet, classifierIssue) → `brain/dossier/session.ts` (crediterXp) → session persistée → `BandeauHeros` (lecteur déjà existant, aucune modification) |
| **Lots** | 2 lots · dont `contrat` : oui (lot A, seul et premier) |
| **Hors périmètre** | `combatXp`, la boutique de progression (dépense d'XP), toute modification de `caracs`, une nuance sur l'échec, un affichage visuel de la marge (`CarteJet`/`BandeauHeros` inchangés), la duplication `src/player/engine/actionEngine.ts` (code orphelin gelé, KR-240) |
| **Reporté** | « R3 raconte un gain sur "réussit nettement" alors que la ligne dit "aucun changement" » → open_question de playtest existante (KR-229), aucun instrument jest ne la couvre |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur voit son héros gagner l'XP correspondant à la marge réelle de son jet — calculée par `challengeXp`/`deltaBand` (déjà purs), sur le seuil nommé `MARGE_FRANCHE`, extrait une seule fois de `xp.ts`, jamais dupliqué (la nuance du récit de R3 sur ce même seuil, détaillée au § 3/§ 4 bis, en est une conséquence directe, pas un second comportement).

## 2 — Hors périmètre

- `combatXp` et la boucle de combat (n°13, hors de cette feature).
- La boutique de progression (dépense de l'XP, `XpShopScreen`) — question d'accès non tranchée, déjà rejetée au cadrage.
- Toute modification de `heros.caracs` (seule la lecture de la caractéristique testée est utilisée pour `heroTier`).
- Une nuance sur l'échec (« échoue de peu »/« échoue largement ») — aucun seuil négatif dans `docs/REGLES-DU-JEU.md` §5 ; un second seuil violerait KR-261.
- Un affichage visuel de la marge ou de la classe de réussite : `CarteJet.tsx` et `BandeauHeros.tsx` ne changent pas d'une ligne. Si un retour visuel est souhaité plus tard, ce sera une itération dédiée, additive.
- La duplication apparente entre `brain/dossier/arbitre.ts` et `src/player/engine/actionEngine.ts` (qui assemble déjà les mêmes arguments pour `challengeXp`) : confirmé code **orphelin gelé** de l'ancien runtime (KR-240, aucun producteur depuis `moteur-dossier` it4) — CLAUDE.md interdit d'y toucher hors de son propriétaire nommé (n°9/extraction). Aucune action dans ce lot.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Aucun composant `.tsx` n'est modifié.** `CarteJet.tsx` reste binaire (Badge `tone="good"|"bad"` sur `resultat.success`, dés bruts inchangés) ; `BandeauHeros.tsx` affiche déjà `XP {heros.xp}` (`--text-strong`), lu tel quel — seule la VALEUR augmente, aucun changement de JSX/CSS/token.

Les trois valeurs d'`AMORCE_ISSUE` ne sont **jamais affichées à l'écran** : elles sont injectées dans le contexte du narrateur IA (R3), qui compose sa propre prose à partir d'elles — ce n'est donc pas un texte d'interface statique, mais le dictionnaire source doit être écrit exactement ainsi (registre figé, KR-269 : 3e personne du présent, infinitif, jamais « vous », jamais de chiffre) :

```ts
const AMORCE_ISSUE: Record<IssueEpreuve, string> = {
  reussit: 'réussit',              // inchangé depuis it2
  reussit_nettement: 'réussit nettement', // nouveau (marge >= MARGE_FRANCHE)
  echoue: 'échoue',                 // inchangé depuis it2
}
```

Aucun « de justesse » : la classe médiane reste le mot nu « réussit » (inchangé), jamais qualifié — un qualificatif affirmerait une étroitesse que le code ne mesure pas (ex. TC1 à 1D6 contre une caractéristique de 3 : un jet à 1 est le meilleur résultat possible et resterait « de justesse » avec un seuil fixe à 3, ce qui est trompeur).

Aucun nouvel état vide, aucune nouvelle interaction clavier, aucune couleur sémantique neuve.

*(Écrit par l'UX, confirmé par narratif-ia pour le registre.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `IssueEpreuve` (`brain/dossier/arbitre.ts`) | type | émet | `'echoue' \| 'reussit' \| 'reussit_nettement'` — **ajout pur**, `'reussit'`/`'echoue'` inchangés depuis it2 |
| `classifierIssue` | fonction | émet | `classifierIssue(resultat: ChallengeResult): IssueEpreuve` — signature **inchangée** (`ChallengeResult.margin` existe déjà, zéro second paramètre) |
| `xpDuJet` (nouveau) | fonction | émet | `xpDuJet(session: EtatSession, tour: number): number \| undefined` — même sélection d'entrée de journal et même garde `undefined` que `issueDuJet` ; `heroTier = tierOf(session.heros.caracs[entree.jet.carac])` (caractéristique TESTÉE, jamais la MC, docs/REGLES-DU-JEU.md §5 amendée dans ce lot) |
| `crediterXp` (nouveau, `brain/dossier/session.ts`) | fonction | émet | `crediterXp(session: EtatSession, xp: number): EtatSession` — SEULE porte d'écriture de `heros.xp` (précédent `fixerHeros`/`consignerJet`) ; no-op si `session.heros === undefined` ou `xp <= 0` |
| `MARGE_FRANCHE` (`brain/xp.ts`) | registre interne | émet | `export const MARGE_FRANCHE = 3` — sourcée `docs/REGLES-DU-JEU.md` §5 ligne 204 ; consommée par `challengeXp` (bonus) ET `classifierIssue`/`xpDuJet` (classification), jamais un second seuil ; interne à `brain/`, non ré-exportée par `brain/index.ts` (un seul paquet d'appelants) |
| `challengeXp` / `deltaBand` / `resolveChallenge` (Temps 1, déjà purs) | fonction | consomme | inchangées |

## 4 bis — Contrat de sortie IA

**Aucun changement de schéma de sortie.** R2 (`{epreuve}|{sans_epreuve}`) et R3 (`validerNarrateur`) restent strictement identiques à it2. Le seul changement est le dictionnaire `AMORCE_ISSUE` (texte INJECTÉ dans le contexte, jamais une sortie de modèle), qui passe de 2 à 3 entrées par ajout pur.

| | |
|---|---|
| Contexte injecté | inchangé — la ligne `CE PAS` reste `<amorce> — <enjeu advenu>`, jamais un chiffre, jamais `carac`/`tc`/`heros.*`/XP |
| Schéma de sortie | inchangé |
| Échec de validation | inchangé (rejeu unique puis dégradation `degrade`) |
| Ce que l'IA **ne** fait **pas** | ne lance aucun dé, ne voit jamais `heros.*` ni l'XP, ne calcule jamais l'XP — `xpDuJet`/`crediterXp` sont des fonctions pures de `brain/`, appelées par le hook, jamais par un rôle IA |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot A — `contrat-xp-et-classification` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : extraire le seuil nommé, étendre la classification d'issue à 3 états par ajout pur, créer les deux fonctions pures `xpDuJet`/`crediterXp`, corriger le bug de sélection d'enjeu sur l'issue nuancée, et sourcer la règle `heroTier` dans la doc qui fait foi.
- **Fichiers** :
  - `docs/REGLES-DU-JEU.md` (R) — §5, ajoute : « Hors combat, `Tier_personnage` se lit sur la caractéristique **testée** par le jet, jamais la MC — réservée aux jets de fuite / combat (n°13). » (KR-130, sens d'écriture : doc avant code)
  - `src/brain/xp.ts` (R) — extrait `export const MARGE_FRANCHE = 3` (remplace le littéral inline `opts.margin >= 3` de `challengeXp`)
  - `src/brain/xp.test.ts` (R) — test de frontière `margin = MARGE_FRANCHE - 1` vs `MARGE_FRANCHE`
  - `src/brain/dossier/arbitre.ts` (R) — `IssueEpreuve` étendu à 3 membres (ajout pur) ; `classifierIssue` gagne une branche (`success && margin >= MARGE_FRANCHE` → `'reussit_nettement'`, sinon comportement inchangé) ; ajoute `xpDuJet` ; corrige la docstring « seule appelante dans tout le dépôt » → « seule appelante dans `brain/`+`features/**` ; `src/player/engine/{actionEngine,combatEngine,capacityEffects}.ts` appellent aussi `resolveChallenge` directement — orphelins gelés (KR-240), hors périmètre »
  - `src/brain/dossier/arbitre.test.ts` (R) — tests `classifierIssue` à 3 états (frontière exacte), tests `xpDuJet` (déterministe, distinction `0` légal vs `undefined`), témoin KR-261 (`jest.mock('../xp', () => ({MARGE_FRANCHE: 5}))` ⇒ la frontière bouge, preuve que les deux consommateurs lisent la même adresse)
  - `src/brain/dossier/session.ts` (R) — ajoute `crediterXp`, juste après `consignerJet`
  - `src/brain/dossier/session.test.ts` (R) — `crediterXp` n'écrit que `heros.xp`, no-op sans héros, no-op sur `xp <= 0`
  - `src/brain/copilote/contexte/narrateur.ts` (R) — `AMORCE_ISSUE` étendu à 3 entrées (ajout pur) ; **corrige `ligneDeJet` (~ligne 517)** : le choix de l'enjeu doit se faire sur `resolution.success`, **jamais** sur `issue === 'reussit'` (qui ferait tomber `'reussit_nettement'` dans la branche échec — bug trouvé en raffinage, trouvaille narratif-ia)
  - `src/brain/copilote/contexte.test.ts` (R) — met à jour les cas qui basculent vers `'reussit_nettement'` (FO 12 contre TC1) ; ajoute la contre-épreuve du bug de ligne 517 (une issue `'reussit_nettement'` doit choisir `enjeu_reussite`)
  - `src/brain/index.ts` (R) — barrel : ré-exporte `xpDuJet`, `crediterXp` depuis `./dossier/arbitre` et `./dossier/session`
  - `worker/index.ts` (R) — remesure la docstring ~ligne 903 (mot le plus long d'`AMORCE_ISSUE` devient `'réussit nettement'`, 18 car.) ; aucune route ni logique modifiée, hors périmètre de la parité worker
- **Expose / consomme** : signatures figées au § 4 — point de rendez-vous du lot B
- **Critères couverts** : #1, #2, #3, #4, #5, #6

### Lot B — `feature-credit-xp`
- **Ouvrier** : `dev-lot`
- **But** : créditer l'XP dans le hook de jeu, au bon moment, sans toucher à la vue.
- **Fichiers** :
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R) — dans `lancerLeDe`, après résolution de `issue` (`issueDuJet`) : appelle `xpDuJet(sessionAvecJet, tour)` ; si le résultat est défini et `> 0`, `crediterXp` la session et persiste (`onSessionChange`) **avant** l'appel à R3 — la session créditée est celle dont héritent les DEUX branches (succès et dégradation), sinon `consignerNarration` écraserait silencieusement le crédit (trouvaille narratif-ia, REGLES-PLAY §F3). `classifierIssue` n'est PAS importée ici : la classification pour R3 reste interne à l'assembleur du narrateur.
  - `src/features/play-mode/hooks/useTourDeJeu.test.ts` (R) — scénario déterministe (fixture rng existante) : `heros.xp` crédité du montant exact avant l'appel à R3, aucun crédit si `xpDuJet` rend `0`/`undefined`, `heros.xp` seule feuille modifiée (témoin négatif sur `pv`/`pe`), crédit conservé même si R3 est dégradé.
- **Expose / consomme** : consomme `xpDuJet`/`crediterXp` du lot A, sans en changer la signature
- **Critères couverts** : #7, #8

*(2 lots. Le lot B ne démarre qu'une fois le lot A figé et le gate vert.)*

## 6 — Critères d'acceptation

1. **Étant donné** un jet réussi avec une marge ≥ `MARGE_FRANCHE`, **quand** `challengeXp` crédite l'XP, **alors** `heros.xp` augmente du montant de la bande ΔT courante PLUS le bonus de marge — *niveau : unitaire* — *lot A*
2. **Étant donné** un jet réussi avec une marge < `MARGE_FRANCHE`, **quand** `challengeXp` crédite l'XP, **alors** `heros.xp` augmente du montant de la bande SEUL, sans bonus — *niveau : unitaire* — *lot A*
3. **Étant donné** un jet échoué, **quand** `xpDuJet` est appelée, **alors** aucune XP n'est créditée — *niveau : unitaire* — *lot A*
4. **Étant donné** un jet résolu avec une marge ≥ `MARGE_FRANCHE`, **quand** `classifierIssue` classe l'issue, **alors** elle rend `'reussit_nettement'` (jamais `'reussit'` nu) — *niveau : unitaire* — *lot A*
5. **Étant donné** un jet résolu avec une marge < `MARGE_FRANCHE` (réussite), **quand** `classifierIssue` classe l'issue, **alors** elle rend `'reussit'` (comportement inchangé depuis it2) — *niveau : unitaire* — *lot A*
6. **Étant donné** une issue `'reussit_nettement'`, **quand** l'assembleur du narrateur compose la ligne de jet, **alors** il choisit `enjeu_reussite` (jamais `enjeu_echec`) — régression du bug de ligne 517 — *niveau : contrat* — *lot A*
7. **Étant donné** un tour complet avec jet réussi (agir → R2 → clic Lancer → résolution), **quand** le joueur voit le résultat, **alors** `heros.xp` est crédité dans la session persistée AVANT l'appel à R3, et la ligne `CE PAS` injectée à R3 ne contient jamais de chiffre ni le mot « XP » — *niveau : composant/hook* — *lot B*
8. **Étant donné** le même scénario que #7 mais R3 dégradé (contexte trop long ou indisponible), **quand** le pas se termine, **alors** `heros.xp` reste crédité malgré l'absence de récit — *niveau : composant/hook* — *lot B*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `xp.test.ts` — *« challengeXp : la marge MARGE_FRANCHE donne le bonus, MARGE_FRANCHE-1 ne le donne pas »* | frontière exacte du bonus | jest unitaire | KR-261 | A |
| `arbitre.test.ts` — *« classifierIssue : marge >= MARGE_FRANCHE rend reussit_nettement »* | 3 états, frontière exacte | jest unitaire | KR-261/273 | A |
| `arbitre.test.ts` — *« KR-261 : seuil unique, un MARGE_FRANCHE mocké à 5 déplace la frontière des deux côtés »* | non-duplication du seuil (`jest.mock('../xp')`) | jest unitaire (mock) | KR-261 | A |
| `arbitre.test.ts` — *« xpDuJet : crédite selon challengeXp/deltaBand, undefined sans jet ni héros, 0 est une valeur légale »* | déterminisme + garde | jest unitaire | KR-249/013 | A |
| `session.test.ts` — *« crediterXp : n'écrit que heros.xp, no-op sans héros, no-op sur xp<=0 »* | isolation de l'écriture | jest unitaire | KR-013 | A |
| `contexte.test.ts` — *« ligneDeJet : reussit_nettement choisit enjeu_reussite (régression ligne 517) »* | contre-épreuve sur la version fautive (`issue === 'reussit'`) | jest contrat | KR-262/273 | A |
| `contexte.test.ts` — *« AMORCE_ISSUE : aucune valeur ne contient de chiffre ni de 2e personne »* | grep/assert sur les 3 valeurs | jest unitaire | KR-262/269 | A |
| `useTourDeJeu.test.ts` — *« lancerLeDe crédite heros.xp avant l'appel à R3, seule feuille modifiée »* | ordre + isolation | jest composant/hook | KR-249/013 | B |
| `useTourDeJeu.test.ts` — *« lancerLeDe : R3 dégradé, heros.xp reste crédité »* | indépendance XP / R3 | jest composant/hook | KR-249 | B |

Cas limites couverts : marge exactement à la frontière (×2, succès et test de non-duplication) ; jet échoué (zéro XP) ; héros absent (garde `undefined`) ; R3 dégradé (crédit conservé) ; double déclenchement (garde de ré-entrance déjà posée en it2, inchangée).

**Non vérifiable en l'état** (à recopier dans la revue) :
- « R3 raconte un gain sur "réussit nettement" alors que la ligne `CE PAS` affiche "aucun changement" » : aucun instrument jest ne lit la prose du modèle contre son invite ; reporté à l'open_question de playtest déjà ouverte (KR-229).
- La correspondance exacte entre `docs/REGLES-DU-JEU.md` §5 (ligne ajoutée au lot A) et le code (`heroTier = tierOf(...)`) : KR-130 est un **sens d'écriture** (doc avant code), pas une assertion qu'un test peut exécuter — la revue d'itération cite la ligne de doc comme preuve, aucun instrument automatique ne la vérifie.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM / Tech Lead / Narratif-IA | Quelle caractéristique fixe `Tier_personnage` hors combat | `RETENU` | Convergence indépendante des 3 rôles : `tierOf(heros.caracs[carac testée])`, inline, jamais stocké ; sourcée dans `docs/REGLES-DU-JEU.md` §5 avant le code (lot A) |
| 2 | Tech Lead (t1) vs Narratif-IA (t1/t2) | Naming de `IssueEpreuve` : renommer `'reussit'` en 2 membres, ou l'ajouter par-dessus | `RETENU` | En faveur de narratif-ia (ajout pur) — le tech-lead s'y est rallié au tour 2 : zéro gain fonctionnel au renommage, et il casse 2 tests existants sans raison |
| 3 | Narratif-IA | Critère d'acceptation n°6 de `specification.json` (4 états) contredit le `goal` d'it3 (3 états) | `RETENU` | Réécrit à 3 états, reporté dans `specification.json` à l'étape 7 du raffinage |
| 4 | Narratif-IA | Le mot « de justesse » affirme une étroitesse non mesurée (ex. TC1 contre carac faible) | `REJETÉ` | Non par arbitrage de vocabulaire mais par construction : la décision #2 retire ce mot du dictionnaire (classe médiane = « réussit » nu). L'objection est satisfaite, pas tranchée |
| 5 | Narratif-IA | Bug potentiel `narrateur.ts` ~ligne 517 (`issue === 'reussit'` perdrait `'reussit_nettement'`) | `RETENU` | Fix obligatoire dans le lot A, avec contre-épreuve nommée (§7) |
| 6 | Narratif-IA | Duplication potentielle avec `src/player/engine/actionEngine.ts` | `REJETÉ` | Tech-lead confirme : code orphelin gelé (KR-240, runtime ancien sans producteur) ; CLAUDE.md interdit d'y toucher hors de son propriétaire nommé (n°9) |
| 7 | QA | `classifierIssue` nécessiterait un second paramètre `margin` | `REJETÉ` | Retirée par QA elle-même au tour 2 : `ChallengeResult.margin` existe déjà, signature à un seul paramètre inchangée |
| 8 | Tech Lead (t2) | Ajout de `docs/REGLES-DU-JEU.md` et `worker/index.ts` au lot A, absents au tour 1 | `RETENU` | Fichiers déjà rouverts par le même lot, coût marginal nul ; ferme un trou KR-130 et une docstring obsolète |
| 9 | UX | Aucune modification de `CarteJet.tsx`/`BandeauHeros.tsx` | `RETENU` | Confirmé explicitement : aucun fichier `.tsx` dans la liste des lots A/B |
| 10 | Narratif-IA | Ordre entre le crédit d'XP et l'appel à R3 | `RETENU` | Crédit AVANT l'`await` de R3, dans la session dont héritent les deux branches — câblé au lot B |
| 11 | QA / Narratif-IA | Scénarios de test sur des valeurs de marge abstraites, non dérivables du rng réel | `RETENU` | Réconciliés : scénarios dérivés du `roll` déjà résolu (`carac = roll + offset`), jamais une marge injectée directement — précisé au §7 |
| 12 | Narratif-IA | R3 pourrait raconter un gain sur une ligne qui affiche « aucun changement » | `REPORTÉ` | Vers l'open_question de playtest déjà ouverte dans `specification.json` (KR-229) — aucun instrument jest ne la couvre |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(aucune — supprimé)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` au-dessus de `thresholds.break` (90) — hors porte de commit, en fin d'itération puisque `xp.ts` est touché ; les 4 scores clear-text recopiés dans la revue, `xp.ts` ne recule pas (à ±1 mutant près)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (131+ suites, `arbitre.test.ts`/`contexte.test.ts` en particulier)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-arbitre-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | critère n°6 réécrit à 3 états (§8 #3) |
| Tech Lead | recevable sous réserve | `docs/REGLES-DU-JEU.md` + `worker/index.ts` ajoutés au lot A (§8 #8) |
| UX | recevable | aucune réserve restante |
| QA | recevable | objection sur l'API `classifierIssue` retirée (§8 #7) |
| Narratif & IA | recevable sous réserve | fix de la ligne 517 inclus au lot A (§8 #5), ordre XP/R3 câblé (§8 #10) |
