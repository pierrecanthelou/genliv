# Raffinage `moteur-arbitre` it1 — Tour 1 — Tech Lead

## RISQUE
Le point de rupture n'est pas `EtatSession.heros?` lui-même mais l'**exhaustivité par compilation** de `src/brain/dossier/sessionDestinations.ts` (`Record<keyof EtatSession | Chemin, Destination>`) : ajouter une racine à `EtatSession` casse ce fichier à la compilation tant qu'il ne déclare pas `heros` et ses feuilles. Idem pour `__fixtures__/session-saturee.ts` — sans instance `heros`, `sessionCouverture.test.ts` rougit sur « ligne morte ».

## OBJECTION
J'objecte au périmètre de fichiers du cadrage (point 5 de la tâche) : il ne nomme **ni** `sessionDestinations.ts` **ni** la fixture saturée. Si le lot contrat les omet, l'agent découvre le blocage `tsc` EN COURS DE LOT, et la règle « un seul lot contrat, en premier » serait violée en pratique — un second passage de contrat improvisé, avec l'audience des feuilles `heros.*` décidée sans relecture comité, alors que le veto narratif-ia (durci au tour 2 du cadrage, étendu à `heros.name`) l'exige `'moteur'` partout, sans exception.

## PROPOSITION
1. **KR-013 tranché** : `pvMax`/`peMax` restent des champs STOCKÉS du type importé tel quel, écrits UNE SEULE FOIS par `buildHeroState`/`buildHeroFromCreation` (déjà `maxPV(caracs)`/`caracs.EN` — une dérivation pure, pas un chiffre choisi). `BandeauHeros` les LIT tels quels, ne les recalcule JAMAIS une seconde fois — deux formules du même fait est exactement la forme des 5 précédents rejetés.
2. **Deux lots, séquentiels** : `contrat` (brain/ seul, 7 fichiers) puis `feature` (composants React), jamais en parallèle — le second lit le premier comme donnée gelée.
3. **Signature finale d'`alea.ts`** : celle retenue au cadrage tour 2 — `alea(graine,domaine,indice):number` + `creerRng(graine,domaine):()=>number`. Ma proposition tour 1 (`creerRngDeSession(graine,curseur)`) est caduque, je la retire moi-même.

## VERDICT
Recevable sous réserve stricte : le lot contrat embarque explicitement `sessionDestinations.ts` + la fixture saturée. Sans ça, je bloque la PR.

---

# ANNEXE

## A. Tranche KR-013 — détail du raisonnement

`src/player/types.ts:24-33` fixe `HeroState { name, caracs, pvMax, pv, peMax, pe, mcBonus, xp }` — **non modifiable** (import tel quel, décision déjà actée, non rouverte ici). La question n'est donc pas « le champ existe-t-il » mais « qui l'écrit et combien de fois ».

J'ai lu le code qui construit déjà ce type (`src/player/engine/heroGen.ts:6-19` et `charCreation.ts:67-85`, réutilisés tels quels par décision du cadrage) :

```ts
const pvMax = maxPV({ FO: caracs.FO, AG: caracs.AG, EN: caracs.EN })
const peMax = caracs.EN
return { name, caracs, pvMax, pv: pvMax, peMax, pe: peMax, mcBonus: 0, xp: 0 }
```

C'est déjà la bonne forme : `pvMax`/`peMax` sont **dérivés de `caracs` par la fonction canonique `maxPV`**, à la construction, en UN SEUL site d'écriture. Ce n'est pas l'anti-patron KR-013 (un champ dérivable qu'une source indépendante peut faire diverger sans que rien ne resynchronise) — c'est un instantané pur, calculé une fois, par la formule unique.

**Ce qui ferait basculer ça dans l'anti-patron** : un second site qui recalcule `maxPV(heros.caracs)` indépendamment (ex. `BandeauHeros` qui ignorerait `heros.pvMax` et referait le calcul). Deux formules pour le même fait, c'est exactement la forme des 5 précédents rejetés (roadmap § 4) — elles divergent le jour où l'une des deux est éditée sans l'autre. **Tranché : `BandeauHeros` lit `heros.pvMax`/`heros.peMax` comme des feuilles de l'EtatSession, point.**

**Risque reporté, à loger dans `known_risks` (pas à résoudre ici)** : le jour où une feature future mute `caracs` après la création (boutique de progression, objet qui buff une carac — explicitement hors périmètre d'it1, cf. `resolved_decisions`), son lot d'écriture devra recalculer `pvMax`/`peMax` via `maxPV` **dans le même commit**, sous peine de devenir la 6ᵉ occurrence du champ dérivable stocké périmé.

## B. Contrats `brain/` — signatures exactes

```ts
// src/brain/dossier/session.ts — ADDITIF, EtatSession reste satisfait par toute session écrite avant ce lot
import type { HeroState } from '../../player/types'

export interface EtatSession {
	// ... 8 clés existantes inchangées ...
	readonly heros?: HeroState   // optionnel à vie (KR-251) — absent = pas encore créé
}

/** Pure, UN SEUL écrivain de `heros` dans toute la feature — même statut que `executerCommande` :
 *  le feature code ne construit JAMAIS lui-même un EtatSession par spread, il appelle une
 *  fonction de brain/. Admis malgré l'appelant unique (biais à surveiller) PARCE QU'il préserve
 *  un invariant déjà établi (un seul point de construction de session), pas pour sa réutilisabilité. */
export function fixerHeros(session: EtatSession, heros: HeroState): EtatSession
```

```ts
// src/brain/dossier/alea.ts — NOUVEAU, module pur
/** Un tirage dans [0, 1), keyé explicitement — jamais Math.random, jamais un compteur global.
 *  Même (graine, domaine, indice) → même valeur, toujours (rejeu). */
export function alea(graine: number, domaine: string, indice: number): number

/** Adapte `alea` au contrat `rng: () => number` attendu par `rollDice`/`rollCreationPool`/`rollHero`
 *  (brain/challenge.ts, player/engine/*.ts). Curseur LOCAL à cette fermeture, remis à zéro à
 *  chaque appel de `creerRng` — jamais partagé entre deux domaines, donc un tirage inséré demain
 *  dans le domaine 'combat' (n°13) ne décale aucun indice du domaine 'heros_creation'. */
export function creerRng(graine: number, domaine: string): () => number
```

```ts
// src/brain/dossier/commandes.ts — TRANSITIONS.aller, ajout APRÈS le calcul de `visites`
heros: session.heros === undefined
	? undefined
	: { ...session.heros, pe: Math.min(session.heros.peMax, session.heros.pe + 5) },
```
Gardé inconditionnel sur `lieuCible.id === depuis` (REGLES-PLAY §A4 : « appliqué à chaque transition de nœud », lu littéralement — pas de clause de changement réel de lieu dans le texte de la règle). `ouvrirSession` reste **inchangée** : `heros` absent à l'ouverture, même statut que `attente` (clé optionnelle non écrite par cette fonction, écrite plus tard par un autre point d'entrée).

```ts
// src/brain/dossier/sessionDestinations.ts — 8 lignes neuves, TOUTES 'moteur' (veto narratif-ia durci, aucune exception)
heros: 'moteur',
'heros.name': 'moteur',
'heros.caracs.<id>': 'moteur',
'heros.pvMax': 'moteur',
'heros.pv': 'moteur',
'heros.peMax': 'moteur',
'heros.pe': 'moteur',
'heros.mcBonus': 'moteur',
'heros.xp': 'moteur',
```

## C. Découpage en lots

| Lot | Type | Propriété exacte des fichiers | Dépend de |
|---|---|---|---|
| **A — contrat** | `contrat`, seul, premier | N `src/brain/dossier/alea.ts` ; N `src/brain/dossier/alea.test.ts` ; R `src/brain/dossier/session.ts` ; R `src/brain/dossier/session.test.ts` ; R `src/brain/dossier/sessionDestinations.ts` ; R `src/brain/dossier/__fixtures__/session-saturee.ts` ; R `src/brain/dossier/commandes.ts` ; R `src/brain/dossier/commandes.test.ts` ; R `src/brain/index.ts` (barrel : exporte `alea`, `creerRng`, `fixerHeros`) | rien |
| **B — feature** | `feature`, après gel de A | N `src/features/play-mode/components/BandeauHeros.tsx` + test ; N `src/features/play-mode/components/EcranCreationHeros.tsx` + test ; R `src/features/play-mode/components/EcranPartie.tsx` + test | A (lit `fixerHeros`/`alea`/`creerRng`/`EtatSession.heros?` comme contrat gelé) |

Aucun fichier partagé entre A et B — propriété disjointe confirmée. **Exécution séquentielle, pas de worktree parallèle à inventer** (règle 6) : B ne compile pas avant que A existe, le parallélisme n'apporterait rien ici.

## D. Ordre interne du lot A
1. `session.ts` — champ + `fixerHeros` (tout le reste en dépend par compilation).
2. `sessionDestinations.ts` — les 8 lignes (sinon `tsc` rouge sur l'exhaustivité `keyof EtatSession`).
3. `__fixtures__/session-saturee.ts` — instance `heros` concrète (sinon `sessionCouverture.test.ts` rouge sur ligne morte).
4. `alea.ts` + test — indépendant des 3 précédents, peut être écrit en parallèle intellectuellement mais même agent, même lot.
5. `commandes.ts` — câblage A4, dépend de (1).
6. `brain/index.ts` — exports additifs, dépend de (1) et (4).

## E. Ce qui casse dans l'existant
Rien, **à condition que B et C de la section D soient dans le lot** (c'est tout l'objet de mon objection). `ouvrirSession` garde sa signature `(dossier, { graine_alea })`. `interprete.ts`, `recit.ts`, le verrou `useTourDeJeu` : inchangés. Toute session déjà persistée (schéma 1, sans `heros`) reste lisible (KR-251).

## F. Décisions prises en autonomie faute de spécification

- **KR-013 : `pvMax`/`peMax` stockés vs dérivés** → stockés, écrits une seule fois par `maxPV`/`caracs.EN` à la construction, jamais recalculés à la lecture → si c'était l'inverse (recalcul indépendant dans `BandeauHeros`), rien ne casse aujourd'hui mais ça ouvre une seconde formule du même fait que `combatEngine.ts`/`HeroStatusBar` (survivants) ne liraient pas — divergence silencieuse le jour où l'un des deux chemins change.
- **`fixerHeros` comme fonction `brain/` plutôt qu'un spread fait dans le composant React** → ajoutée malgré l'appelant unique, pour préserver l'invariant « un seul point de construction de `EtatSession` » déjà en vigueur (`executerCommande`) → si c'était l'inverse (spread dans `EcranCreationHeros.tsx`), la feature construirait directement la forme d'un type `brain/`, deuxième site de construction de session à maintenir en cohérence si une règle future doit s'appliquer à CHAQUE écriture (ex. horodatage, validation).
- **Signature finale d'`alea.ts`** → celle du cadrage tour 2 (`alea(graine,domaine,indice)`), ma propre proposition tour 1 (`creerRngDeSession(graine,curseur)`) écartée → si un agent construisait sur ma version tour 1 non retirée du dossier de cadrage, il livrerait un module en contradiction avec la décision finale du comité, découverte seulement à la revue PR.
- **A4 inconditionnel sur `lieuCible.id === depuis`** → appliqué même en cas d'accès auto-référent (texte de la règle ne distingue pas) → si c'était conditionné à un changement réel de lieu, un auteur câblant un accès auto-référent verrait son héros ne jamais récupérer de PE sur une action que la règle nomme « transition de nœud » sans réserve.

## Fichiers lus ce tour
`src/player/types.ts`, `src/brain/characteristics.ts`, `src/features/moteur-arbitre/specification.json`, `.claude/raffinage/moteur-arbitre-cadrage/tour{1,2}-tech-lead.md`, `src/brain/dossier/session.ts`, `src/brain/dossier/sessionDestinations.ts`, `src/brain/dossier/__fixtures__/session-saturee.ts` (en-tête), `src/brain/dossier/commandes.ts` (TRANSITIONS.aller/agir), `src/features/play-mode/components/EcranPartie.tsx`, `src/player/engine/{heroGen,charCreation}.ts`, `src/brain/index.ts` (grep), `docs/REGLES-PLAY.md` § A4, `src/brain/dossier/sessionCouverture.test.ts` (extraits).
