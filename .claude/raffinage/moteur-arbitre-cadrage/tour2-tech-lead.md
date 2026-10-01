# Cadrage n°11 `moteur-arbitre` — Tour 2 — Tech Lead

## RISQUE
Le point de rupture n'est plus le déclenchement de R2 (résolu ci-dessous) mais la **granularité de la clause mutation** : si elle est lue « feature-wide » plutôt que « par lot », it1 traîne un run inutile ou it2 s'en croit dispensée à tort.

## OBJECTION — réponse nommée à narratif-ia sur le routage
Sa proposition évite l'écueil visé par `types.ts:985`. Ma citation ciblait un **déclenchement par CONTENU** (parser la prose pour décider d'un piège) — exactement ce qu'elle a rejeté en § F. Un gate de **non-vacuité structurelle** (présence/absence, jamais lecture sémantique) est un motif déjà légal dans ce dépôt : KR-244 fait exactement ça sur `texte_ouverture_joueur`. Vérifié dans `types.ts` : `dangers?: string` ne change pas de forme, et `destinations.ts:397` porte déjà `'ia'` — aucun des deux n'a besoin d'un lot contrat dédié. Mais la docstring `types.ts:985` (« il ne le déclenche pas ») devient littéralement fausse et doit être corrigée — dans le lot contrat d'it1 déjà prévu.

## PROPOSITION
1. Docstring `types.ts:985` corrigée dans le lot contrat d'it1.
2. KR-248 amendée (détail annexe) : `{lieu_id, carac, tc}` entre au rejeu, la prose n'y entre jamais.
3. Mutation testing : lue **par itération**, pas par feature — it1 exempte, l'itération qui extrait `MARGE_FRANCHE` de `xp.ts` non.
4. Découpage : j'adopte la forme de narratif-ia (annexe § 4).

## VERDICT
Veto conditionnel du tour 1 **levé** (routage recevable, amendement docstring mineur). Recevable sous les réserves annexées (KR-248, découpage à confirmer par PM).

---

## ANNEXE

### 1. Statut de mes propositions tour 1
| # | Proposition tour 1 | Statut |
|---|---|---|
| `EtatSession.heros?: HeroState` (import `player/types.ts`) | **MAINTENUE** — aucune objection reçue. |
| R2 « consulté systématiquement, décide lui-même » | **RETIRÉE** — remplacée par un gate de présence (plus sobre, évite un appel réseau sur un lieu sans danger écrit). |
| `brain/dossier/alea.ts`, hors des 4 fichiers mutés | **MAINTENUE** — confirmée indépendamment par narratif-ia. |
| « ΔT déjà écrit, retirer du périmètre » | **NUANCÉE** — vrai pour it1, faux pour l'itération « la marge compte ». |
| Découpage 3 lots (héros / carte / résolution) | **RETIRÉE** — je me range derrière QA et narratif-ia : mon it2 exposait un bouton « lancer » sans branchement réel, exactement le no-op que QA a nommé (KR-263 généralisé). Auto-critique : j'ai écrit KR-263 sur la n°10, je l'ai moi-même enfreint en tour 1 sur la n°11. |

### 2. KR-248 — réponse à l'objection de narratif-ia
Je confirme son objection 3. KR-248 a été écrite avant qu'un rôle IA choisisse une valeur qui conditionne la suite (`{carac, tc}`) — la graine ne la reproduit pas. Amendement :
- **Entre au rejeu** : `EntreeJournal.jet?: { lieu_id, carac, tc }` — requis dès qu'un jet a eu lieu.
- **N'entre jamais** : `pourquoi`, `enjeu_reussite`, `enjeu_echec` (prose, I4 de `session.ts:219`) ; `marge`/`issue` (dérivés, jamais stockés, KR-013).
- Formule de rejeu généralisée : `(dossier + graine + entrées joueur + décisions structurées des rôles IA qui conditionnent l'état)`.

### 3. Clause mutation — réponse à QA
`resolveChallenge` a déjà `rng` injectable, `tierOf`/`challengeXp` sont des fonctions pures déjà exportées — les appeler depuis un nouveau `brain/dossier/arbitre.ts` ne modifie AUCUNE ligne de `challenge.ts`/`xp.ts`/`characteristics.ts`. Lecture opérationnelle de « touche » : un diff staged qui contient une ligne dans un des 4 fichiers de production OU leur fichier de test dédié — pas « est appelé depuis un nouveau fichier ». Sous cette lecture : l'itération « jet binaire » n'y touche pas — exemptée. L'itération « la marge compte » : le seuil `margin >= 3` de `xp.ts:48` est câblé en littéral inline — si R3 doit classer « réussit nettement/de justesse » avec le MÊME seuil, il faut extraire une constante nommée hors de `xp.ts`, ce qui **touche** `xp.ts`. `npm run test:mutation` est donc dû sur cette itération-là, pas sur la première.

### 4. Arbitrage du découpage
Je retiens la forme de narratif-ia : le rôle IA (R2) doit entrer avec son consommateur narratif réel (R3) ET son consommateur mécanique réel (`resolveChallenge`) dans la MÊME itération — exactement KR-263/266. Ma version tour 1 (héros / carte-sans-branchement / résolution) violait ce précédent. `monde.lieux[].dangers` passe de FERMÉ à OUVERT n°11 : R2 seul — déjà anticipé littéralement par `narrateur.ts:73`. Point laissé au PM : où atterrit A4 (+5 PE). `heroTier` est calculé par le CODE, jamais par R2 — compatible avec le veto 2 de narratif-ia : le code lit `heros.caracs` seulement APRÈS que R2 a choisi `{carac,tc}` à l'aveugle des valeurs.

### 5. Clarification de ma propre phrase tour 1
« L'issue racontée avec la marge » visait l'EXPÉRIENCE joueur (il perçoit dans le récit que la réussite était nette ou de justesse), jamais l'implémentation littérale — le veto 1 de narratif-ia (le code classe, R3 ne voit jamais les chiffres) est correctement scopé, confirmé sans réserve.

### 6. Décisions en autonomie (tour 2)
- Lecture opérationnelle de « touche un fichier muté » (diff sur le fichier de production OU son test dédié) → sinon toute feature qui appelle une fonction pure de `brain/` traînerait un run Stryker à chaque itération.
- `MARGE_FRANCHE` extrait de `xp.ts` plutôt que dupliqué dans le classificateur narratif → sinon deux seuils `3` divergeraient un jour silencieusement (KR-261).
- KR-248 amendée plutôt que laissée avec une exception non écrite → sinon un futur outil de rejeu reconstruit une partie sans pouvoir reproduire la décision de R2.

## Fichiers vérifiés ce tour
`src/brain/dossier/types.ts:950-1018`, `destinations.ts:397`, `session.ts:180-260`, `src/brain/copilote/contexte/narrateur.ts:40-89`, `src/brain/challenge.ts:60-90`, `src/brain/xp.ts:1-60`, `docs/REGLES-DU-JEU.md:196-209`, `docs/ROADMAP-BASCULE-IA.md:105-225`, `code-knowledge.json` (KR-244, 248, 249, 251, 259-269), notes tour 1 des 5 rôles.
