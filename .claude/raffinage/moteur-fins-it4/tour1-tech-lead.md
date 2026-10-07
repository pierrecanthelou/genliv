# Tech Lead — moteur-fins it4 (4/4), Tour 1

Lu : CLAUDE.md, WORKFLOW.md, `docs/ROADMAP-BASCULE-IA.md`, `specification.json` de la feature, `AiguillagePartie.tsx`, `PartieEnCours.tsx`, `EcranFin.tsx`, `EcranMort.tsx`, `EcranPartie.tsx`, `useSessionPersistee.ts`, `brain/dossier/alea.ts`, `rencontre.ts` (en partie), les tests `reprise`/`mortDuHeros`/`EcranMort`, les plans d'it1/it2/it3.

## Note d'ouverture

**RISQUE** — La promesse « mêmes tirages » dépasse ce que l'itération peut prouver. Le moteur est déjà keyé : en production, `Math.random` n'apparaît que dans `tirerGraine`, donc le code à écrire est quasi gratuit. Le danger est double. Soit on écrit un critère invérifiable (KR-242). Soit on livre un bouton qui rejoue avec la mauvaise graine : une graine collante (Nouvelle partie réutilise celle de Rejouer), ou un `||` qui avale la graine 0.

**OBJECTION**
1. CA 21 (« mêmes commandes + même graine ») : aucune commande n'est persistée, car le journal est un constat (KR-248). En saisie libre, les commandes sortent de R1, qui n'est pas déterministe. Le critère n'est falsifiable que sur le canal console, par fonctions pures. KR-306 décrit un moteur de rejeu depuis des entrées, alors que le but écrit n'en demande aucun.
2. CA 22 est vrai par construction (rien ne rejoue de décision modèle). Ce n'est pas un test.
3. « Cas limites navigateur » regroupe trois sujets sans critère. Le crash est couvert par it2 (illisible). Le hors ligne est étranger au moteur sans IA. Seul le rechargement après Rejouer touche la graine.

**PROPOSITION** — Un lot, zéro fichier `brain/`.
- Rejouer relance avec le `session.graine_alea` de la session vivante.
- AiguillagePartie porte un état unique `{generation, graine?}`.
- Libellé « Rejouer avec la même graine » (jamais « la partie »), sans autoFocus : Entrée doit rester une partie neuve.
- Trois preuves :
  - (a) Pur : même graine et script console donnent des sessions égales à chaque pas. Une graine différente donne des journaux différents (anti-vacuité). Le dossier reste inchangé.
  - (b) RTL : Rejouer ne tire pas de graine et les dés de création sont identiques. Nouvelle partie après Rejouer tire une graine neuve. Cas graine 0.
  - (c) Rechargement après Rejouer : même graine reprise.
- Aucun nouveau KR : `code-knowledge.json` a 4 o de marge.

**VERDICT** — **Recevable sous réserve.** Réécrire CA 21/22 aux niveaux (a) et (b), et fermer les cas limites sauf (c).

---

## ANNEXE TECH-LEAD — découpage en lots

**Un seul lot, de type `feature`.** Aucun lot `contrat` : zéro fichier `brain/`, aucun champ d'`EtatSession`, rien dans `sessionDestinations`. Exécution séquentielle, sans worktree.

Pourquoi pas deux lots (feuilles / câblage) : les tests d'intégration du câblage cliquent des boutons que les feuilles créent. Le second lot ne serait donc pas vérifiable seul.

| Lot | Type | Crée (N) / remplace (R) |
|---|---|---|
| **L1 `rejouer`** | feature | R `src/features/play-mode/components/EcranFin.tsx` |
| | | R `src/features/play-mode/components/EcranMort.tsx` |
| | | R `src/features/play-mode/components/PartieEnCours.tsx` (381 l., cible ≤ 390 ; au-delà de 400, signal KR-112) |
| | | R `src/features/play-mode/components/AiguillagePartie.tsx` |
| | | R `src/features/play-mode/components/EcranFin.test.tsx` |
| | | R `src/features/play-mode/components/EcranMort.test.tsx` |
| | | N `src/features/play-mode/tests/rejeuDeterministe.test.ts` (pur, sans DOM) |
| | | N `src/features/play-mode/tests/rejouer.test.tsx` (RTL, `AiguillagePartie` avec `tirerGraine` injectée) |
| | | Doc, même lot (étape 4) : R `src/features/moteur-fins/specification.json`, `CHANGELOG.md`, `features_history.json`, `README.md`, `docs/ROADMAP-BASCULE-IA.md`, `package.json` |

**Interdits à ce lot :**
- `brain/**` et `player/**`.
- `reprise.ts` : la dette « refus dans illisible » reste armée.
- `useTourDeJeu.ts` : la dette > 400 l. reste armée, car ce lot ne le rouvre pas.
- `session.ts`.
- `code-knowledge.json` : 4 o de marge, tout KR ajouté imposerait une compaction.

**Signatures (point de rendez-vous unique) :**
```ts
// EcranFin.tsx — miroir exact de onNouvellePartie
EcranFinProps  += readonly onRejouer?: () => void
// EcranMort.tsx
EcranMortProps += readonly onRejouer: () => void
// PartieEnCours.tsx
PartieEnCoursProps   += readonly onRejouer: (graine: number) => void   // reçoit session.graine_alea du VIVANT
PartieDemarreeProps  += readonly graineImposee?: number
                      += readonly onRejouer: (graine: number) => void
//   graine = graineImposee ?? tirerGraine()      // jamais ||  (graine 0 valide)
// AiguillagePartie.tsx — UN état, pas deux
useState<{ readonly generation: number; readonly graine?: number }>({ generation: 0 })
handleNouvellePartie → { generation: n+1, graine: undefined }
handleRejouer(g)     → { generation: n+1, graine: g }
// rendu PartieDemarree : key={relance.generation}, graineImposee={relance.graine}
```

**Consommé en lecture seule :**
- `EtatSession.graine_alea: number`
- `ouvrirSession(dossier, { graine_alea })`
- `creerRng`
- `executerCommande`, `ouvrirRencontreSiDue`, `jouerPosture`, `cloreCombat`, `fixerHeros`
- `finAtteinte` (`player/engine/fin`)
- `rejouerCombat` (`player/engine/rencontre`)

**Tests exigés (un par risque nommé) :**
- **Pur (`rejeuDeterministe.test.ts`)**
  - Script `aller` → rencontre → postures → clore → fin, joué deux fois avec la même graine : sessions `toEqual` à chaque pas, `rejouerCombat.log` égaux.
  - Même script avec une autre graine : journal de combat différent. Choisir deux graines dont la différence est observée, pas supposée.
  - `graine_alea` inchangée de l'ouverture à la fin.
  - Dossier `structuredClone` avant/après = égal (KR-304, immutabilité).
  - Sonde `jest.spyOn(Math, 'random')` posée après les setups, zéro appel pendant la partie.
- **RTL (`rejouer.test.tsx`)**
  - Rejouer : `tirerGraine` n'est PAS rappelée, les dés de création sont identiques aux premiers.
  - Rejouer puis fin puis Nouvelle partie : `tirerGraine` rappelée (piège de la graine collante).
  - Même chose avec graine 0 (piège `||`).
  - Rejouer depuis une session reprise (`key="reprise"`) : même graine.
  - Rechargement après Rejouer : `sessions.lire` donne `reprenable` avec la même graine.
  - `onRejouer` appelé avec `session.graine_alea` sur EcranFin ET sur EcranMort.
- **Composant (`EcranFin`/`EcranMort`)**
  - Le bouton Rejouer existe et appelle `onRejouer`.
  - `EcranMort` : l'autoFocus reste sur Nouvelle partie (test existant inchangé).
  - L'absence de `onRejouer` sur `EcranFin` ne rend aucun bouton.

**Porte :** Prettier, `tsc --noEmit`, ESLint, jest. Pas de `test:mutation` : aucun des 4 fichiers muets n'est touché. `moteurSansIA.test.ts` doit rester vert.

**Limite assumée à écrire dans la docstring d'AiguillagePartie :** Rejouer n'existe que sur l'écran de fin ou de mort *vivant*. Après rechargement, la session terminée est routée vers une ouverture directe (AC d'it2) et écrasée par la nouvelle. La graine est perdue, et c'est cohérent avec « intra-process » (KR-242). La phrase de démo doit être jouée sans recharger la page.

**Coupe si le comité élargit :** s'il exige un rejeu automatique des commandes (journal de commandes persisté), c'est un lot `contrat` (champ optionnel d'`EtatSession` + `sessionDestinations` + `validerSession` dans `reprise.ts` + KR-248 à réconcilier) plus un lot feature. Cela sort du plafond de dimensionnement de cette itération. Il faut alors une **it5** : it4 = Rejouer par graine seule (ce cadrage), it5 = journal des commandes et rejeu.

**Point ouvert sans propriétaire :** « réécriture de `docs/EXIGENCE-APERCU-DU-JEU.md` : lot .md en fin de feature » est REPORTÉ, et it4 est la fin de feature. Deux issues :
- Soit un lot L2 `docs`, .md seul, fichier disjoint, exécuté après L1, sans PR tech-lead (WORKFLOW). Le plafond de 4 lots n'est pas en jeu.
- Soit une ligne armée dans la table « dette à déclencheur » du roadmap (marge 1 206 o).
Je recommande L2. Je n'ai pas vérifié la péremption du fichier au-delà d'un grep.

**Doc à corriger au passage (L1) :** roadmap l.166 (`3/4` devient `4/4`) et l.181 (« 3 itérations » est déjà périmé).

## Décisions prises en autonomie faute de spécification

- Ce que « relancer avec la même graine » rejoue → relance avec la graine seule ; l'auteur retape ses commandes, aucun journal de commandes → si l'inverse : une it5 et un lot `contrat` (champ d'`EtatSession`, `sessionDestinations`, `validerSession`), avec KR-248 à réconcilier.
- Où prouver l'égalité des tirages → un test pur dans `play-mode/tests/` important le baril `brain`, pas dans `brain/` → si l'inverse : le lot devient `contrat` et passe à 2 lots séquentiels sans gain.
- Les trois « cas limites navigateur » → seul le rechargement après Rejouer est testé ; crash déjà couvert par it2 ; hors ligne exclu (il exige un mock de `fetch` R1/R3, périmètre n° 10) → si l'inverse : deux tests de plus, dont un qui empiète sur n° 10.
- Optionalité de `onRejouer` → optionnel sur `EcranFin`, requis sur `EcranMort`, comme `onNouvellePartie` → si l'inverse : une dizaine de rendus de test à éditer (même lot) pour un bouton qui ne peut plus manquer en silence sur `EcranFin`.
- Focus auto → aucun sur Rejouer ; `EcranMort` garde le focus sur Nouvelle partie (test existant), `EcranFin` n'en a pas (it1) → si l'inverse : Entrée sur un écran terminal relance avec la même graine sans que l'auteur l'ait voulu.
- Confirmation de Rejouer → aucune (la partie est terminée, non reprenable, comme Nouvelle partie sur ces écrans) → si l'inverse : un `Modal` `color="error"` de plus, dans `PartieEnCours` déjà à 381 l.
- État de relance → un objet `{generation, graine?}` plutôt que deux `useState` → si l'inverse : la graine collante devient possible (Nouvelle partie qui oublie de réinitialiser la graine).
- Nouveau KR (graine collante, `||` contre `??`) → aucun, la garde est le test ; `code-knowledge.json` n'a que 4 o de marge → si l'inverse : compaction de `code-knowledge.json` obligatoire dans le même lot.
- Affichage de la valeur de la graine à l'auteur → non, les dés de création identiques font foi → si l'inverse : une ligne de lecture sur `EcranFin`/`EcranMort` et un test (fichiers déjà dans L1) ; relève du PM/UX, je ne bloque pas.
- Libellé du bouton → « ↻ Rejouer avec la même graine » (ne contient pas « Nouvelle partie », ce qui préserve les requêtes `/Nouvelle partie/i` existantes) → si l'inverse (« Rejouer » seul) : promesse de rejeu de partie, que KR-242 déclare non observable.
- Rejouer après rechargement → non offert ; l'ouverture directe d'it2 n'est pas rouverte → si l'inverse : `AiguillagePartie` et l'AC « reprise d'une partie terminée » d'it2 changent de contrat, et `reprise.test.tsx` bouge.

Fichiers pertinents :
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\AiguillagePartie.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\PartieEnCours.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\EcranFin.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\EcranMort.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\EcranPartie.tsx` (porte `tirerGraine`, non modifié)
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\alea.ts` (non modifié)
- `C:\Users\pierr\Desktop\genliv\src\features\moteur-fins\specification.json`
- `C:\Users\pierr\Desktop\genliv\docs\ROADMAP-BASCULE-IA.md`
