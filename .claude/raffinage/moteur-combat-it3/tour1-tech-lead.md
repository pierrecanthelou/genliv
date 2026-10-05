# Tech Lead, moteur-combat it3, tour 1

**RISQUE** — La projection n'a pas de source. `resolveCombatRound` (`combatEngine.ts:193-462`) ne produit que du texte (`log[].text`, interdit d'injection par KR-294) et `bestHeroHit`, un agrégat du combat. Le vainqueur et la HitQuality du round (`band.quality`) sont des locales perdues au `return`, et `rejouerCombat` ne rend que l'état final. « Projection à part » (KR-293) se réduit donc à diffuser des états ou à parser la prose.

**OBJECTION**
1. Veto sur tout `combatProjection.ts` qui lit `.text` ou `.log`. Le moteur doit émettre un enregistrement structuré par round. C'est un fait de moteur, KR-293 tient.
2. Les paliers de santé ne se classent pas côté feature. Précédent : `CibleNarrateur.epreuve` (`types.ts:533-551`), aucune règle hors de `brain/`.
3. `combatProjection.ts` n'appartient pas à `player/`. Il importerait un type `brain/copilote`, hors de la liste d'imports du runtime extractible (`EXIGENCE-APERCU-DU-JEU.md:20`).
4. `RefusCommande` et `sessionDestinations`, cités au cadrage, sont livrés depuis it1. La narration n'a aucune feuille de session : `session.ts` reste fermé.

**PROPOSITION** — Deux lots.
- Lot 1 `contrat` : types R5, `validerCommentateur`, assembleur (PV bruts en cible, paliers en mots, aucun chiffre sur le fil), 12e surcharge, worker.
- Lot 2 `feature` : enregistrement moteur par round, projection en liste blanche dans `play-mode/utils/`, `CombatEnCours` monté pour la durée du combat, exclusion nommée `moteurSansIA` du nouveau hook.
- Narrations indexées par round, jamais persistées.
- Si le lot 2 dépasse ~16 fichiers : scinder moteur / feature, séquentiel.

**VERDICT** — recevable sous réserve : l'enregistrement moteur par round est acquis avant le lot 2.

---

## ANNEXE — Découpage en lots

Exécution séquentielle : lot 1 seul et en premier, puis lot 2. Aucun worktree n'est nécessaire.
Propriété disjointe : lot 1 = `src/brain/**` + `worker/**` ; lot 2 = `src/player/**` + `src/features/play-mode/**`. Aucun fichier n'est nommé deux fois.

| Lot | Type | Fichiers (N = créé, R = remplacé) |
|---|---|---|
| **1 `contrat-commentateur`** | `contrat` | `src/brain/copilote/types.ts` (R), `src/brain/copilote/schemaSortie.ts` (R), `src/brain/copilote/schemaSortie.test.ts` (R), `src/brain/copilote/contexte/commentateur.ts` (N), `src/brain/copilote/contexte/commentateur.test.ts` (N), `src/brain/copilote/contexte/index.ts` (R), `src/brain/CopiloteService.ts` (R), `src/brain/CopiloteService.test.ts` (R), `worker/index.ts` (R), `worker/index.test.ts` (R), `worker/frontiere.test.ts` (R) |
| **2 `feature-commentaire-combat`** | `feature` | `src/player/engine/combatTypes.ts` (R), `src/player/engine/combatEngine.ts` (R), `src/player/engine/combatEngine.test.ts` (R), `src/features/play-mode/utils/combatProjection.ts` (N), `src/features/play-mode/utils/combatProjection.test.ts` (N), `src/features/play-mode/hooks/useCommentaireCombat.ts` (N), `src/features/play-mode/hooks/useCommentaireCombat.test.ts` (N), `src/features/play-mode/components/CombatEnCours.tsx` (N), `src/features/play-mode/components/CombatEnCours.test.tsx` (N), `src/features/play-mode/components/EcranCombat.tsx` (R), `src/features/play-mode/components/EcranCombat.test.tsx` (R), `src/features/play-mode/components/EcranPartie.tsx` (R), `src/features/play-mode/tests/moteurSansIA.test.ts` (R), `src/features/play-mode/tests/combatParConsole.test.tsx` (R) |

### Signatures exactes

**Lot 1 expose** :

```ts
// brain/copilote/types.ts
export interface ProjectionAssaut {
  readonly vainqueur: 'heros' | 'monstre' | 'nul'
  readonly qualite: HitQuality | null
  readonly monstre: string
  readonly heroPv: number;    readonly heroPvMax: number
  readonly monstrePv: number; readonly monstrePvMax: number
  readonly issue?: Exclude<IssueCombat, 'hero-fled'>
}
export interface CibleCommentateur { role: 'commentateur'; readonly projection: ProjectionAssaut }
export type ReponseCommentateur = { readonly narration: string } | EchecCopilote

// brain/CopiloteService.ts — 12e surcharge
demander(dossier: Dossier, cible: CibleCommentateur, signal?: AbortSignal): Promise<ReponseCommentateur>

// brain/copilote/schemaSortie.ts
export const CLES_SORTIE_COMMENTATEUR = ['narration'] as const
export const NARRATION_COMBAT_CARACTERES_MAX = 400
export function validerCommentateur(brut: unknown): /* ok:true + narration | ok:false + motif */

// brain/copilote/contexte/commentateur.ts
export function assemblerCommentateur(dossier: Dossier, cible: CibleCommentateur): ContexteCommentateur
export const BUDGET_CARACTERES_COMMENTATEUR: number
```

**Lot 2 expose / consomme** :

```ts
// player/engine/combatTypes.ts
export interface AssautRound { readonly vainqueur: 'heros'|'monstre'|'nul'; readonly qualite: HitQuality | null }
// CombatState gagne : readonly dernierAssaut?: AssautRound

// features/play-mode/utils/combatProjection.ts
export function projeterAssaut(etat: CombatState, heroPvMax: number): ProjectionAssaut | null

// features/play-mode/hooks/useCommentaireCombat.ts
export function useCommentaireCombat(dossier: Dossier): {
  readonly commentaires: ReadonlyMap<number, string>
  readonly commenter: (round: number, projection: ProjectionAssaut) => void
}

// features/play-mode/components/CombatEnCours.tsx
export function CombatEnCours(p: { dossier: Dossier; session: EtatSession; etat: CombatState;
  onSession: (s: EtatSession) => void }): JSX.Element
```

### Ce qui ne bouge pas, par construction
- `session.ts`, `sessionDestinations.ts`, `session-saturee.ts` : la narration n'a pas de feuille.
- `useTourDeJeu.ts` (552 l.) : il ne porte que `ouvrirRencontreSiDue`, R5 n'y entre pas.
- `rencontre.ts`, `capacityEffects.ts`.
- `combat.ts`, `challenge.ts`, `xp.ts`, `characteristics.ts` : `npm run test:mutation` n'est pas dû.

### Note pour l'étape docs (hors lot)
`code-knowledge.json` a 4 o de marge sous son plafond. Tout KR neuf force la compaction dans le même commit de docs.

---

## Décisions prises en autonomie faute de spécification

- Où vit `combatProjection.ts` → `features/play-mode/utils/`, pas `player/` (runtime extractible).
- D'où viennent vainqueur et HitQuality du round → champ optionnel `CombatState.dernierAssaut`, posé par le moteur aux 3 sites de `resolveCombatRound`.
- Qui classe les paliers de santé → l'assembleur de `brain/`, avec PV bruts dans la cible et jamais sur le fil.
- Narration persistée ou non → éphémère, aucune feuille de session (KR-292 : rejeu pur).
- La fuite est-elle commentée → non, seuls les rounds de posture le sont.
- La `capacite` du monstre dans la projection → absente de l'it3.
- R5 sans mémoire des rounds précédents → chaque appel est indépendant.
- Où orchestrer R5 → hook neuf `useCommentaireCombat` et 2e ligne d'exclusion `moteurSansIA`.
- Où loge le câblage du combat → `CombatEnCours.tsx` extrait d'`EcranPartie.tsx` (391 l.).
- Nombre de lots → 2. Le moteur reste dans le lot feature.
- Le nom du monstre est injecté (registre de code), le nom du héros jamais (`heros.name` = `moteur`, KR-232).
