# Cadrage n°11 `moteur-arbitre` — Tour 1 — Tech Lead

## RISQUE
Deux points de rupture concentrent tout le risque de la feature : où vit `heros` (une seconde structure « session » hors `MagasinDeSession` romprait l'invariant « un seul état par partie, une seule écriture ») et ce qui déclenche R2. Si l'un des deux est mal tranché en it1, les it2/it3 héritent d'un contrat instable — coût multiplié par trois lots, pas un.

## OBJECTION
Le cadrage suppose R2 « probablement déclenché par `monde.lieux[].dangers` ». C'est faux au contrat actuel : `types.ts:985` documente ce champ comme narratif pur — « il ne le déclenche pas », en toutes lettres. En faire un déclencheur mécanique sans rouvrir `types.ts`/`destinations.ts` en lot contrat contournerait un contrat déjà livré.

## PROPOSITION
1. `EtatSession.heros?: HeroState`, type importé tel quel de `src/player/types.ts` (import légal, brain→player), posé dans le SEUL lot contrat d'it1, jamais une seconde forme de héros.
2. R2 n'est pas gaté par `dangers` : il est consulté après l'exécution déterministe, avant R3, sur le contexte `'ia'` déjà injecté ; sortie discriminée `{type:'jet',…}|{type:'aucun'}` dès it1 (deux membres nécessaires d'emblée).
3. Le RNG dérivé de `graine_alea` vit dans un nouveau module (`brain/dossier/alea.ts`), jamais dans `challenge.ts` : n°11 n'a alors aucune raison de toucher les 4 fichiers mutés — j'infirme la ligne du roadmap qui l'annonce.
4. ΔT est déjà écrit (`REGLES-DU-JEU.md` + docstring `deltaBand`) : retirer « définit ΔT » du périmètre, ne reste que `heroTier = tierOf(heros.caracs[carac])`.

## VERDICT
Recevable sous réserve : (2) doit être confirmé au tour 2 par narratif-ia, sinon je durcis en veto.

---

## ANNEXE

### 1. Les contrats `brain/` en jeu

- **`EtatSession.heros?`** (`src/brain/dossier/session.ts`) — champ NEUF, optionnel à vie (KR-251), type = `HeroState` importé de `src/player/types.ts` (`{name, caracs, pvMax, pv, peMax, pe, mcBonus, xp}` — correspond exactement à REGLES-PLAY.md § G1 : « caracs, PV/PE/XP, MC bonus »). Écrit par `ouvrirSession` (ou une nouvelle fonction posée juste après elle), lu par l'UI de jeu et par R2 (via le contexte injecté). **Ne PAS l'ajouter dans `brain/characteristics.ts`** — cela créerait une deuxième forme de héros que `combatEngine.ts`/`XpShopScreen`/`HeroStatusBar` (survivants du § 0 bis) ne consomment pas.
- **`combat`** reste ABSENT — propriété n°13, aucune réservation à faire (même statut que `climat_actif`, non racine, non réservé).
- **`RoleCopilote`** (`src/brain/copilote/types.ts`) + `CorpsDemande`/switch de `CopiloteService.ts` — NEUF membre `'arbitre'` (9ᵉ rôle après `narrateur`), même moule que les 8 précédents : `CibleArbitre { role: 'arbitre'; contexte: string }`, réponse structurée `{carac, tc, pourquoi, enjeu_reussite, enjeu_echec}` validée par un `validerArbitre` dédié (précédent `validerInterprete`), garde `never` dans le `switch (cible.role)`. Worker : nouvelle route `POST /ia/arbitre`, suit la checklist KR-233.
- **RNG déterministe** — nouveau module pur `brain/dossier/alea.ts` (nom à trancher par le comité), `creerRngDeSession(graine: number, curseur: number): () => number`. `curseur` dérivé de `horloge.tour` (un pas = au plus un jet dans le protocole décrit), jamais stocké séparément (KR-013). **Ne touche pas `challenge.ts`** — il consomme seulement le paramètre `rng` déjà injectable de `resolveChallenge`.
- **`EntreeJournal`** — probablement un champ optionnel de plus (`jet?`) pour que le journal porte le jet réellement effectué (carac, tc, roll, marge, issue), sur le même modèle que `deltas?`/`recit?` — à confirmer en it3.
- **`challenge.ts`/`xp.ts`/`characteristics.ts`** — appelés (`resolveChallenge`, `challengeXp`, `tierOf`), **jamais modifiés**. `docs/WORKFLOW.md` dit « toute itération qui **touche** l'un des 4 fichiers relève `break` de +5 » — « touche » s'y lit comme « modifie » (le ratchet n'a de sens que sur un fichier dont le score est recalculé après édition ; B2 le confirme : « zéro ligne de production modifiée » y est la condition qui dispense d'autre chose que la mesure). **Si le plan proposé est suivi (RNG dans un nouveau fichier), n°11 n'a pas à lancer `npm run test:mutation`** — ce qui corrige la ligne du roadmap (« Touche les quatre fichiers mutés »), probablement écrite avant cette lecture fine.

### 2. Ce qui casse dans l'existant
Rien, si (1) et (2) ci-dessus tiennent. `interprete.ts`, `recit.ts`, `commandes.ts`, `session.ts` (hors l'ajout additif `heros?`) restent inchangés dans leur contrat public. Le verrou de tour (KR-265) est un `useState` LOCAL à `src/features/play-mode/hooks/useTourDeJeu.ts` (feature, pas `brain/`) — l'étendre pour couvrir R1→exécution→R2→dés→R3 est un lot feature normal, pas une réouverture de contrat n°10.

### 3. Ordre imposé par les dépendances — proposition de découpage en 3 itérations (le comité tranche le phrasé)

| it | Phrase de démo | Lot contrat | Dépend de |
|---|---|---|---|
| 1 | « À la fin, le joueur voit son héros généré à l'ouverture de partie, caractéristiques affichées. » | `EtatSession.heros?` (session.ts) | rien de neuf — réutilise `rollCreationPool`/`buildHeroFromCreation` (`src/player/engine/charCreation.ts`, déjà écrit, déjà testé, **orphelin depuis toujours** — `CharacterCreationScreen.tsx` n'est monté nulle part, grep à l'appui) |
| 2 | « À la fin, le joueur voit la carte de jet que l'IA a demandée et peut cliquer « lancer ». » | rôle `arbitre` (CopiloteService + worker) | it1 (a besoin de `heros.caracs` pour la carte) |
| 3 | « À la fin, le joueur voit le dé se lancer et l'issue racontée avec la marge. » | `brain/dossier/alea.ts` + branchement `resolveChallenge`/`challengeXp` + extension `EntreeJournal` | it2 |

### 4. Décisions prises en autonomie faute de spécification

- **Type de `EtatSession.heros`** → réutiliser `HeroState` de `src/player/types.ts` tel quel (import brain→player, légal) → sinon deux formes de héros coexistent et n°13 devra écrire un convertisseur — sixième occurrence de l'anti-patron déjà rejeté cinq fois (roadmap § 4).
- **Déclencheur de R2** → « consulté systématiquement sur `agir` (et probablement `aller` vers un lieu à risque), décide lui-même s'il y a jet » plutôt que « code décide sur présence de `dangers` » → sinon il faut rouvrir `types.ts`/`destinations.ts` en lot contrat pour redéfinir un champ déjà livré avec une docstring qui dit explicitement le contraire — veto tech-lead en soi.
- **RNG dérivé de `graine_alea`** → nouveau module plutôt qu'ajout dans `challenge.ts` → sinon chaque itération de n°11 doit lancer `npm run test:mutation` en fin de lot pour un gain d'organisation nul.
- **« Définir ΔT »** (ligne roadmap n°11) → caduque (ΔT déjà écrit dans `REGLES-DU-JEU.md` et dans le docstring de `deltaBand`, `xp.ts:24`) → sinon le comité risque d'écrire une formule qui diverge silencieusement de celle que le score de mutation à 90+ protège déjà.
- **Répartition du bonus 1D4 à la création** → supposée portée par `CharacterCreationScreen.tsx` existant plutôt que réinventée → si ce composant s'avère trop couplé à l'ancien modèle, it1 déborde et il faudra une it1-bis.

## Fichiers lus
`docs/ROADMAP-BASCULE-IA.md`, `docs/REGLES-DU-JEU.md`, `docs/REGLES-PLAY.md`, `src/brain/dossier/{session,commandes,interprete,recit,types,destinations}.ts`, `src/brain/{challenge,xp,characteristics}.ts`, `src/brain/CopiloteService.ts`, `src/player/engine/{heroGen,charCreation}.ts`, `src/player/types.ts`, `src/features/play-mode/hooks/useTourDeJeu.ts`, `docs/WORKFLOW.md` (§ Score de mutation), `.claude/skills/raffinage-iteration/SKILL.md`.
