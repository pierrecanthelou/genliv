# Raffinage `moteur-arbitre` it1 — Tour 2 — Tech Lead

## RISQUE
Deux de mes propres décisions du tour 1 sont fausses une fois recroisées avec la source (REGLES-DU-JEU.md) et avec les appelants réels : `alea.ts` tel que je l'avais signé expose `alea(...):number`, une fonction que **personne n'appelle jamais** (`rollCreationPool`/`resolveChallenge` attendent `()=>number`), et son complément `creerRng(graine,domaine)` — sans indice — **reproduit le même tirage à chaque appel** : une relance qui invoque `creerRng('heros')` une seconde fois obtiendrait EXACTEMENT les mêmes dés que le lancer initial. Un bug caché, pas un détail de style. Symétriquement, A4 câblée « inconditionnelle » crédite +5 PE sur un `aller` auto-référent, alors que `docs/REGLES-DU-JEU.md:43` dit « changer d'écran/zone » — et que `commandes.ts:209-211` distingue déjà, de sa propre main, le « déplacement auto-référent, dont le monde ne bouge pas ».

## OBJECTION
Je cède **nommément** aux deux objections de narratif-ia (tour 1, § alea et § A4 — architecture/contrat `brain/`, mon domaine) : sa signature unique évite structurellement la collision de relance que la mienne permettait, et sa lecture d'A4 est la seule compatible avec le texte des règles ET avec le vocabulaire déjà posé dans `commandes.ts` par la n°10. Mes deux propositions tour 1 sur ces points sont retirées.

## PROPOSITION
`fluxAlea(graine,domaine,indice):()=>number` (DomaineAlea='heros' seul), A4 sur `lieuCible.id !== depuis`, ajout de `sessionCouverture.test.ts` (ligne 123, `9`→`10`) au lot A — omis par moi au tour 1, maintien de `pvMax`/`peMax` stockés (KR-013, raisonnement refait en annexe D).

## VERDICT
APPROVE sous réserve que le lot A embarque les deux corrections de contrat + `sessionCouverture.test.ts` + les tests d'invariance narrateur/interprète. Aucun veto restant sur le découpage.

---

# ANNEXE

## A. Réponse nommée à narratif-ia — signature d'`alea` (résolution 3a)

**Je cède entièrement.** Relecture de ma propre proposition tour 1 :

```ts
export function alea(graine: number, domaine: string, indice: number): number
export function creerRng(graine: number, domaine: string): () => number
```

Narratif-ia pointe deux défauts réels, pas une préférence de style :

1. **`alea(...):number` n'a aucun appelant réel.** `rollCreationPool(rng: () => number)`, `rollHero(name, rng: () => number)`, `resolveChallenge` — tous les consommateurs vérifiés dans `src/player/engine/{charCreation,heroGen}.ts` et `brain/challenge.ts` attendent un **flux**, jamais un scalaire. Exposer `alea` isolé, c'est exactement le biais que je dois surveiller (« une abstraction qui n'a qu'un seul appelant — ici zéro — est une dette, pas un contrat ») : je l'ai écrite pour « faire joli » dans le contrat, sans vérifier qui la consomme.
2. **`creerRng(graine,domaine)` sans `indice` est un bug, pas juste une API maladroite.** Sa docstring dit « curseur LOCAL à cette fermeture, remis à zéro à chaque appel de `creerRng` ». Deux appels `creerRng(g,'heros')` — un pour le lancer initial, un pour la relance (REGLES-PLAY §B2) — produisent donc **deux fermetures dont le curseur redémarre à 0 chacune**, donc **les mêmes dés**. Narratif-ia l'a vu dès le tour 1 (« la relance chevaucherait alors le pool 0 ») ; je l'avais manqué en écrivant ma propre signature.

Sa proposition :

```ts
export type DomaineAlea = 'heros' // 'jet' entre en it2 avec son consommateur (KR-249)

/** Retourne un flux consommable (() => number dans [0,1)) pour une clé (graine, domaine, indice).
 *  Même clé → même suite de tirages, toujours (rejeu). SÉQUENTIEL à l'intérieur d'une clé (la
 *  fonction rendue avance à chaque appel) ; JAMAIS séquentiel ENTRE deux clés (deux indices, ou
 *  deux domaines, ne partagent aucun curseur) — un tirage inséré demain par une itération future
 *  (n°13, domaine 'combat') n'en décale aucun autre. */
export function fluxAlea(graine: number, domaine: DomaineAlea, indice: number): () => number
```

Usage réel en it1 : `rollCreationPool(fluxAlea(g,'heros',0))` (lancer initial), `fluxAlea(g,'heros',1)` (relance, indice différent donc flux indépendant — plus de collision), aucun indice 2 atteignable (B2, une seule relance). C'est la forme qui alimente réellement un appelant, et la seule qui ferme le bug. J'adopte sans réserve. `creerRng` et `alea` disparaissent du barrel `brain/index.ts` ; seuls `fluxAlea`, `DomaineAlea`, `fixerHeros` y entrent.

## B. Réponse nommée à narratif-ia — condition d'A4 (résolution 3b)

J'ai relu moi-même `docs/REGLES-DU-JEU.md` § « Endurance (PE) » :

> `docs/REGLES-DU-JEU.md:43` — « **Récupération** : changer d'écran/zone = **+5 PE** ; repos total = requiert une **potion**. »

Le verbe est « **changer** ». `docs/REGLES-PLAY.md` E3 (complément d'orchestration) répète la même exigence : « Uniquement +5 par **changement** d'écran (§ 1), pas de régénération passive. » Ma lecture tour 1 s'appuyait uniquement sur la glose d'A4 dans REGLES-PLAY (« appliqué à chaque transition de nœud ») sans la recroiser avec le texte normatif de REGLES-DU-JEU.md — exactement l'erreur que KR-130 interdit : « ne jamais régler une ambiguïté de règle depuis le code [ou depuis une glose], retourner à REGLES-DU-JEU.md ». Lu seule, ma citation n'était pas fausse, elle était **incomplète** : une « transition de nœud » n'est, par construction, qu'un mouvement entre deux nœuds distincts — un aller-vers-soi-même n'en est pas une, au même titre qu'une boucle n'est pas une arête dans le modèle de graphe hérité.

Et je retrouve la même distinction **déjà écrite dans le code que je m'apprêtais à modifier** : `commandes.ts:209-211` (commentaire de la n°10, non touché par cette feature avant ce lot) :

> « un déplacement auto-référent, dont **le monde ne bouge pas**, en consomme un [pas] quand même (`docs/REGLES-PLAY.md` § J1) »

Ce commentaire distingue déjà, pour une autre règle (J1, consommation de pas), la **DEMANDE** (toujours consommée, même auto-référente) de l'**EFFET** (qui ne se produit que si le monde bouge réellement). A4 est un EFFET — exactement la catégorie que ce commentaire réserve aux cas où quelque chose change. Appliquer A4 inconditionnellement aurait traité un effet comme une demande, en contradiction avec un vocabulaire que la feature n°10 avait déjà posé.

**Je cède entièrement sur ce point.** Condition finale :

```ts
// TRANSITIONS.aller, après les refus, dans la branche ok:true
heros: session.heros === undefined || lieuCible.id === depuis
	? session.heros
	: { ...session.heros, pe: Math.min(session.heros.peMax, session.heros.pe + 5) },
```

Docstring de la garde A4 (`commandes.ts:207-211`, « CE QU'IL ÉCRIT, ET RIEN D'AUTRE ») à corriger dans le même lot — elle ment dès que `heros` existe.

**Test ajouté, pas seulement les deux séparateurs de narratif-ia** (`pe=peMax−6` et `pe=peMax−2`) : un troisième scénario **auto-référent avec héros présent** (`cible === depuis`) doit affirmer `pe` inchangé — c'est le scénario exact qui distingue ma proposition tour 1 (fausse) de la version retenue ; sans lui, la régression inverse repasserait inaperçue demain.

## C. Statut de mes objections/décisions du tour 1 — une par une

| # | Point tour 1 | Statut tour 2 | Motif |
|---|---|---|---|
| 1 | Objection : périmètre de fichiers (sessionDestinations.ts + fixture absents du cadrage) | **Maintenue, et résolue** | Convergence indépendante avec narratif-ia §C (même 3 fichiers nommés). Je la durcis d'un cran moi-même : j'avais oublié `sessionCouverture.test.ts` (assertion `toHaveLength(9)`, ligne 123, à passer à `10`) — ajouté explicitement au lot A ce tour, voir § E. |
| 2 | KR-013 tranché : `pvMax`/`peMax` stockés | **Maintenue** | Voir § D — le signal de narratif-ia ne change pas la conclusion, il la précise. |
| 3 | Deux lots séquentiels (contrat puis feature) | **Maintenue, inchangée** | Aucun rôle ne l'a contestée ; PM/QA/UX confirment absence de veto sur le découpage. |
| 4 | Signature `alea(...):number` + `creerRng(graine,domaine):()=>number` | **Retirée** | § A — remplacée par `fluxAlea(graine,domaine,indice):()=>number` de narratif-ia, qui corrige un bug réel (collision de relance) et alimente un appelant réel, contrairement à la mienne. |
| 5 | A4 inconditionnel sur `lieuCible.id === depuis` | **Retirée** | § B — remplacée par `lieuCible.id !== depuis`, sur citation exacte de `docs/REGLES-DU-JEU.md:43` et cohérence avec le vocabulaire déjà posé par `commandes.ts:209-211`. |

## D. Signal narratif-ia §G (item 4) — KR-013 maintenu, raisonnement complété

Le signal : si `pvMax`/`peMax` sont stockés, `heros.caracs` n'a aucun lecteur **côté session, après construction** — le bandeau n'affiche que nom/PV/PE/XP.

Je ne reconsidère pas « stocké ». Deux lectures distinctes de « lecteur », et les deux sont satisfaites :

1. **Lecteur à la construction, dans CE lot** : `maxPV({FO,AG,EN})` et `caracs.EN` lisent `caracs` **au moment même** où `heros` est bâti (`buildHeroFromCreation`/`buildHeroState`) — c'est un calcul réel, dans la même itération, pas une promesse.
2. **Lecteur de session, nommément annoncé pour it2** : l'acceptance criterion n°4 de la spec FEATURE (pas une hypothèse de ma part) dit explicitement « c'est le CODE qui lit `heros.caracs[carac]` APRÈS que R2 a choisi `{carac,tc}` ». C'est exactement l'exception que ma propre règle anti-abstraction-à-un-appelant réserve : « sauf si le plan de la feature en annonce un deuxième [consommateur] nommément ». Ici le deuxième consommateur est nommé, dans le plan de LA MÊME feature, pour l'itération immédiatement suivante — pas une feature tierce hypothétique.

Donc `heros.caracs` n'est pas « posé sans lecteur » au sens KR-249 (qui vise `graine_alea`, restée sans AUCUN lecteur pendant une itération entière, toutes features confondues) : il a un lecteur immédiat (construction) et un second lecteur annoncé et daté (it2). Ce signal ferme aussi la question posée par PM (tour 1, tension HeroState-tel-quel vs KR-013) et par QA (tour 1, objection 2) — les deux demandaient un arbitrage écrit ; le voici, inchangé depuis le tour 1, complété par cette précision.

## E. Fichiers — confirmation de convergence (item 5)

Objection satisfaite, et durcie. Narratif-ia (§C) nomme indépendamment `sessionDestinations.ts`, `__fixtures__/session-saturee.ts`, `sessionCouverture.test.ts` — les trois mêmes fichiers que je visais, avec un luxe de détail que je n'avais pas (décompte exact 9→10, docstring de `heros.name`, `lignesIa` inchangé en valeur). Je retiens sa version intégralement et j'y ajoute l'unique ligne de fixation que j'avais moi-même manquée au tour 1 : `sessionCouverture.test.ts:123`, `expect(racines).toHaveLength(9)` → `toHaveLength(10)`. Plus aucune réserve sur le périmètre de fichiers.

## F. Découpage en lots — table révisée

| Lot | Type | Fichiers exacts (N=crée, R=remplace) | Dépend de |
|---|---|---|---|
| **A — contrat** | `contrat`, seul, premier | N `src/brain/dossier/alea.ts` (`fluxAlea`, `DomaineAlea`) ; N `src/brain/dossier/alea.test.ts` ; R `src/brain/dossier/session.ts` (`EtatSession.heros?`, `fixerHeros`) ; R `src/brain/dossier/session.test.ts` ; R `src/brain/dossier/sessionDestinations.ts` (racine `heros` + toutes feuilles `heros.*`, `'moteur'` sans exception) ; R `src/brain/dossier/__fixtures__/session-saturee.ts` (instance `heros` sentinelle, caracs non-défaut) ; R `src/brain/dossier/sessionCouverture.test.ts` (`toHaveLength(9→10)`) ; R `src/brain/dossier/commandes.ts` (A4, condition `!==depuis`, docstring corrigée) ; R `src/brain/dossier/commandes.test.ts` (3 scénarios séparateurs : `peMax−6`, `peMax−2`, auto-référent) ; R `src/brain/copilote/contexte/narrateur.test.ts` (invariance avec/sans `heros`) ; R `src/brain/copilote/contexte/interprete.test.ts` (idem) ; R `src/brain/index.ts` (barrel : `fluxAlea`, `DomaineAlea`, `fixerHeros`) | rien |
| **B — feature** | `feature`, après gel de A | N `src/features/play-mode/components/BandeauHeros.tsx` + test ; N `src/features/play-mode/components/EcranCreationHeros.tsx` + test (wiring `fluxAlea(g,'heros',0|1)`, `spyOn(Math.random)` à 0 appel) ; R `src/features/play-mode/components/EcranPartie.tsx` + test (garde 7, inline) | A — lit `fixerHeros`/`fluxAlea`/`EtatSession.heros?` comme contrat gelé |

Propriété disjointe confirmée, aucun fichier partagé. Exécution séquentielle (A puis B), aucun worktree parallèle à inventer — inchangé depuis le tour 1.

## G. Signatures finales exposées par le lot A (point de rendez-vous de l'essaim)

```ts
export interface EtatSession { /* 8 clés existantes */ readonly heros?: HeroState }
export function fixerHeros(session: EtatSession, heros: HeroState): EtatSession
export type DomaineAlea = 'heros'
export function fluxAlea(graine: number, domaine: DomaineAlea, indice: number): () => number
```

## Décisions prises en autonomie faute de spécification

- **Compte exact de lignes `sessionDestinations.ts` pour `heros.caracs`** (une ligne template-literal `` `heros.caracs.${Characteristic}` `` couvrant les 8 ids, ou 8 lignes littérales) → non tranché, laissé à l'agent du lot A puisque c'est un détail d'exhaustivité TypeScript sans impact de contrat observable → si c'est l'inverse de mon hypothèse (8 lignes littérales), aucun coût : les deux formes satisfont `sessionCouverture.test.ts`, seule la verbosité du fichier change.
- **Test d'invariance narrateur/interprète logé dans le lot `contrat` plutôt que dans le lot `feature`** → choisi parce que ces fichiers sont `brain/copilote/contexte/*`, donc une garantie de contrat (« R1/R3 restent aveugles à `heros` ») doit être gelée AVANT que le lot feature construise dessus → si c'était l'inverse (test dans le lot B), un agent feature pourrait livrer `BandeauHeros` avant que la non-lecture de `heros` par R1/R3 soit vérifiée, et une régression d'audience ne serait détectée qu'à la PR globale, pas à la porte qualité du lot qui l'a introduite.
- **`creerRng`/`alea` retirés du barrel sans période de dépréciation** (suppression nette, pas un export conservé puis marqué obsolète) → choisi parce qu'ils n'ont aucun appelant existant à casser (jamais livrés, encore dans un lot non committé) → si un agent les avait déjà utilisés ailleurs dans une branche parallèle, leur retrait silencieux casserait la compilation sans message dédié — risque nul ici puisque rien n'est encore committé sur `main`.

## Fichiers lus/consultés ce tour

- `.claude/raffinage/moteur-arbitre-it1/tour1-{tech-lead,narratif-ia,pm-produit,ux-designer,qa}.md`
- `src/features/moteur-arbitre/specification.json`
- `docs/REGLES-DU-JEU.md` — section exacte relue pour A4 : **§ « Endurance (PE) », ligne 43** (« Récupération : changer d'écran/zone = +5 PE ; repos total = requiert une potion. ») — + lignes 37-48 autour (contexte PV/PE), et confirmation croisée dans `docs/REGLES-PLAY.md` lignes 11-21 (encart « Deux règles … 0 site restant », A4/E3), 29 (A4, glose « transition de nœud »), 45 (B4, PE de départ), 104 (E3, « Uniquement +5 par changement d'écran »), 131 (G1, sauvegarde), 190-194 (J1, unité du pas).
- `src/player/engine/charCreation.ts`, `src/player/engine/heroGen.ts` (signatures `rollCreationPool`, `rollHero`, `buildHeroState`/`buildHeroFromCreation`)
- `src/brain/dossier/commandes.ts` (registre `TRANSITIONS`, branche `aller`, lignes 197-280 et 370-377 — y compris le commentaire 209-211 sur le déplacement auto-référent)
- `src/brain/dossier/deltas.ts` (registre `DELTAS`, confirmation que `modifier_pe` est écarté — motif à lever avant réouverture, non levé par cette feature)
- `src/brain/dossier/sessionDestinations.ts` (en-tête, docstring des dispenses)
- `src/brain/dossier/sessionCouverture.test.ts` (lignes 90-149 — assertion `toHaveLength(9)` ligne 123, identifiée comme devant passer à `10`)

## Pour le comité

Verdict : **APPROVE**, sous réserve stricte que le lot A livré embarque exactement les fichiers de la table § F (notamment `sessionCouverture.test.ts`, omis par moi au tour 1) et les deux signatures de § G. Plus aucun point d'architecture, de contrat `brain/`, ou de découpage en lots laissé ouvert de mon côté pour cette itération.
