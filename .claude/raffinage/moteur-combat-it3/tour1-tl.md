# Tech Lead, moteur-combat it3, tour 1

**RISQUE** — La projection n'a pas de source. `resolveCombatRound` (`combatEngine.ts:193-462`) ne produit que du texte (`log[].text`, interdit d'injection par KR-294) et `bestHeroHit`, un agrégat du combat. Le vainqueur et la HitQuality du round (`band.quality`) sont des locales perdues au `return`, et `rejouerCombat` ne rend que l'état final. « Projection à part » (KR-293) se réduit donc à diffuser des états ou à parser la prose.

**OBJECTION**
1. Veto sur tout `combatProjection.ts` qui lit `.text` ou `.log`. Le moteur doit émettre un enregistrement structuré par round. C'est un fait de moteur, KR-293 tient.
2. Les paliers de santé ne se classent pas côté feature. Précédent : `CibleNarrateur.epreuve` (`types.ts:533-551`), aucune règle hors de `brain/`.
3. `combatProjection.ts` n'appartient pas à `player/`. Il importerait un type `brain/copilote`, hors de la liste d'imports du runtime extractible (`EXIGENCE-APERCU-DU-JEU.md:20`).
4. `RefusCommande` et `sessionDestinations`, cités au cadrage, sont livrés depuis it1. La narration n'a aucune feuille de session : `session.ts` reste fermé.

**PROPOSITION** — Deux lots.
- Lot 1 `contrat` : types R5, `validerCommentateur`, assembleur (PV bruts en cible, paliers en mots, aucun chiffre sur le fil), 12ᵉ surcharge, worker.
- Lot 2 `feature` : enregistrement moteur par round, projection en liste blanche dans `play-mode/utils/`, `CombatEnCours` monté pour la durée du combat (état et abort meurent avec lui), exclusion nommée `moteurSansIA` du nouveau hook.
- Narrations indexées par round, jamais persistées.
- Si le lot 2 dépasse ~16 fichiers : scinder moteur / feature, séquentiel.

**VERDICT** — recevable sous réserve : l'enregistrement moteur par round est acquis avant le lot 2.

---

## ANNEXE — Découpage en lots

Exécution séquentielle : lot 1 seul et en premier, puis lot 2. Aucun worktree n'est nécessaire.
Propriété disjointe : lot 1 = `src/brain/**` + `worker/**` ; lot 2 = `src/player/**` + `src/features/play-mode/**`. Aucun fichier n'est nommé deux fois.

| Lot | Type | Fichiers (N = créé, R = remplacé) |
|---|---|---|
| **1 `contrat-commentateur`** | `contrat` | `src/brain/copilote/types.ts` (R) |
| | | `src/brain/copilote/schemaSortie.ts` (R) |
| | | `src/brain/copilote/schemaSortie.test.ts` (R) |
| | | `src/brain/copilote/contexte/commentateur.ts` (N) |
| | | `src/brain/copilote/contexte/commentateur.test.ts` (N) |
| | | `src/brain/copilote/contexte/index.ts` (R) |
| | | `src/brain/CopiloteService.ts` (R) |
| | | `src/brain/CopiloteService.test.ts` (R) |
| | | `worker/index.ts` (R) |
| | | `worker/index.test.ts` (R) |
| | | `worker/frontiere.test.ts` (R) |
| **2 `feature-commentaire-combat`** | `feature` | `src/player/engine/combatTypes.ts` (R) |
| | | `src/player/engine/combatEngine.ts` (R) |
| | | `src/player/engine/combatEngine.test.ts` (R) |
| | | `src/features/play-mode/utils/combatProjection.ts` (N) |
| | | `src/features/play-mode/utils/combatProjection.test.ts` (N) |
| | | `src/features/play-mode/hooks/useCommentaireCombat.ts` (N) |
| | | `src/features/play-mode/hooks/useCommentaireCombat.test.ts` (N) |
| | | `src/features/play-mode/components/CombatEnCours.tsx` (N) |
| | | `src/features/play-mode/components/CombatEnCours.test.tsx` (N) |
| | | `src/features/play-mode/components/EcranCombat.tsx` (R) |
| | | `src/features/play-mode/components/EcranCombat.test.tsx` (R) |
| | | `src/features/play-mode/components/EcranPartie.tsx` (R) |
| | | `src/features/play-mode/tests/moteurSansIA.test.ts` (R) |
| | | `src/features/play-mode/tests/combatParConsole.test.tsx` (R) |

### Signatures exactes

**Lot 1 expose** (lot 2 consomme, par import direct de `brain/copilote/types`, comme `useTourDeJeu.ts:36`) :

```ts
// brain/copilote/types.ts
export interface ProjectionAssaut {
  readonly vainqueur: 'heros' | 'monstre' | 'nul'
  readonly qualite: HitQuality | null            // null si et seulement si vainqueur === 'nul'
  readonly monstre: string                       // nom de bestiaire (registre de code, pas une feuille)
  readonly heroPv: number;    readonly heroPvMax: number      // fin de round ; JAMAIS sur le fil
  readonly monstrePv: number; readonly monstrePvMax: number   // idem
  readonly issue?: Exclude<IssueCombat, 'hero-fled'>          // présent si et seulement si le round clôt
}
export interface CibleCommentateur { role: 'commentateur'; readonly projection: ProjectionAssaut }
export type ReponseCommentateur = { readonly narration: string } | EchecCopilote  // discrimine par 'statut' in r

// brain/CopiloteService.ts — 12e surcharge, aux DEUX sites (interface l.266-311 ET implémentation l.1058-1079)
demander(dossier: Dossier, cible: CibleCommentateur, signal?: AbortSignal): Promise<ReponseCommentateur>

// brain/copilote/schemaSortie.ts — forme de retour alignée sur validerActeur
export const CLES_SORTIE_COMMENTATEUR = ['narration'] as const
export const NARRATION_COMBAT_CARACTERES_MAX = 400
export function validerCommentateur(brut: unknown): /* ok:true + narration | ok:false + motif */

// brain/copilote/contexte/commentateur.ts
export function assemblerCommentateur(dossier: Dossier, cible: CibleCommentateur): ContexteCommentateur
export const BUDGET_CARACTERES_COMMENTATEUR: number   // calculé, jamais coupé : 'trop-long' avant tout fetch
```

Choix de conception du lot 1 :
- Le seul refus de contexte atteignable est `trop-long` (précédent `arbitre.ts`, KR-235).
- `palierDeSante` est interne à l'assembleur, avec des tests de borne des deux côtés de chaque seuil.
- Le contexte injecte uniquement `canon.ton`, `canon.interdits_ton[]`, vainqueur, qualité, paliers et nom du monstre.
- Un test affirme qu'aucun `\d` n'atteint le contexte.
- Côté worker : `INVITES.commentateur`, `GABARIT_SORTIE.commentateur = '{"narration": "…"}'`, la checklist KR-233 (413, 405, 404, 503, tout en JSON) et `ROLES`/`ROLES_PLAFONNES` de `frontiere.test.ts`.
- `TAILLE_MAX_CORPS_IA` est re-mesuré et pinné, même si le plafond reste porté par `narrateur` (83 968).

**Lot 2 expose / consomme** :

```ts
// player/engine/combatTypes.ts
export interface AssautRound { readonly vainqueur: 'heros'|'monstre'|'nul'; readonly qualite: HitQuality | null }
// CombatState gagne : readonly dernierAssaut?: AssautRound   (OPTIONNEL : absent avant le round 1,
//   donc aucun littéral CombatState des tests existants ne bouge)

// features/play-mode/utils/combatProjection.ts
export function projeterAssaut(etat: CombatState, heroPvMax: number): ProjectionAssaut | null
// null si et seulement si etat.dernierAssaut === undefined. Liste blanche : lit vainqueur, qualite,
// monster.name, heroPv, monster.pv, outcome. Jamais .log ni .text (balayage de source en test).

// features/play-mode/hooks/useCommentaireCombat.ts
export function useCommentaireCombat(dossier: Dossier): {
  readonly commentaires: ReadonlyMap<number, string>
  readonly commenter: (round: number, projection: ProjectionAssaut) => void  // idempotent par round
}

// features/play-mode/components/CombatEnCours.tsx
export function CombatEnCours(p: { dossier: Dossier; session: EtatSession; etat: CombatState;
  onSession: (s: EtatSession) => void }): JSX.Element
// EcranCombat gagne la prop REQUISE : commentaires: ReadonlyMap<number, string> (précédent onFuir)
```

Points d'exécution du lot 2 (critères de revue) :
- **Déclenchement dans le handler.** L'appel part dans `handleJouer`, après `onSession(next)`, jamais dans un `useEffect`. Il est gardé par `next !== session` (no-op de `jouerPosture`) et par un `Set` de rounds déjà demandés. Test : un double clic ne produit qu'un appel R5 par round.
- **Pas de verrou.** R5 n'écrit rien en session, donc il n'y a ni verrou ni problème d'ordre de persistance. Les rounds sont indexés, un retard d'un round sur l'autre est sans effet.
- **Abort au démontage.** `AbortController` annulé au démontage de `CombatEnCours`. Le seul `useEffect` légitime est ce nettoyage.
- **Échec muet.** Échec ou `EchecCopilote` : aucune entrée dans la map, ni bannière ni texte de repli (KR-230/283).
- **Survie du champ.** `dernierAssaut` est posé aux 3 sites où `workingState` reçoit son journal (égalité, victoire héros, victoire monstre) et survit aux hooks de capacité par la propagation `...workingState`. Test paramétré (`describe.each` sur `MONSTER_CAPACITIES`) : le champ survit à chaque capacité.
- **Fuite non commentée.** Test : `fuirRencontre` ne déclenche aucun appel R5.
- **Piège `moteurSansIA`.** Le balayage `moteurSansIA.test.ts:92-94` rougit sur le mot « CopiloteService », même en commentaire, dans tout fichier de `play-mode/` hors exclusion. Seuls le hook `useCommentaireCombat.ts` et `useTourDeJeu.ts` sont exclus. Les autres fichiers neufs ne doivent jamais écrire ce mot. Le mutant obligatoire (ligne 100-103) reste dû pour la nouvelle ligne d'exclusion.

### Ce qui ne bouge pas, par construction
- `session.ts`, `sessionDestinations.ts`, `session-saturee.ts` : la narration n'a pas de feuille. La dette « extraire `sessionCombat.ts` » (déclencheur : rouvrir `session.ts`) n'est pas armée.
- `brain/index.ts` : import direct de `brain/copilote/types`.
- `useTourDeJeu.ts` (552 l.) : il ne porte que `ouvrirRencontreSiDue`, R5 n'y entre pas.
- `rencontre.ts`, `capacityEffects.ts`.
- `combat.ts`, `challenge.ts`, `xp.ts`, `characteristics.ts` : `npm run test:mutation` n'est pas dû.
- `CopiloteService.ts`, `worker/index.ts` et `schemaSortie.ts` sont déjà au-dessus de 800 lignes. Je ne demande aucune extraction (arbitrage it2 #13 : KR-112 vise composants et hooks). Croissance limitée à la 12ᵉ surcharge, à une entrée de gabarit et à un validateur.

### Note pour l'étape docs (hors lot)
`code-knowledge.json` a 4 o de marge sous son plafond, et le couple `CLAUDE.md` + `WORKFLOW.md` en a 6. Tout KR neuf (enregistrement moteur, narration éphémère) force la compaction dans le même commit de docs. La liste « Contrats spec » du cadrage est à corriger : `RefusCommande` et `sessionDestinations` sont livrés.

---

## Décisions prises en autonomie faute de spécification

- Où vit `combatProjection.ts` (le cadrage ne dit pas où) → `features/play-mode/utils/`, pas `player/` → si inverse : `player/` importe `brain/copilote/types`, et l'extraction du runtime embarque le vocabulaire IA ou casse.
- D'où viennent vainqueur et HitQuality du round → champ optionnel `CombatState.dernierAssaut`, posé par le moteur aux 3 sites de `resolveCombatRound` → si inverse (diff d'états) : HitQuality introuvable, ou lecture de `log[].text` (violation KR-294). Si le champ était requis : `capacityEffects.test.ts` et `EcranCombat.test.tsx` entrent au lot 2.
- Qui classe les paliers de santé → l'assembleur de `brain/`, avec PV bruts dans la cible et jamais sur le fil → si inverse : la projection porte des mots, mais la règle vit dans une feature, le précédent `CibleNarrateur.epreuve` est rompu et les seuils se testent hors de `brain/`.
- Narration persistée ou non → éphémère, aucune feuille de session (KR-292 : rejeu pur) → si inverse : une feuille `combat.narrations[]` avec audience à trancher. Cela impose destinations + fixture saturée, rouvre `session.ts` (dette de 846 l. armée) et ajoute un lot `contrat`. À l'it3, un rechargement en cours de combat perd les commentaires des rounds déjà joués.
- La fuite est-elle commentée → non, seuls les rounds de posture le sont → si inverse : `tryHeroFlee` pose aussi un `AssautRound`, `ProjectionAssaut` gagne un discriminant de nature, et le contrat grossit d'une branche.
- La `capacite` du monstre dans la projection (KR-294 la liste) → absente de l'it3 → si inverse : les hooks de `capacityEffects.ts` (37 sites de journal) doivent dire ce qu'ils ont fait, soit une itération de plus. Sinon, une capacité statique annoncée à chaque round ferait raconter des effets qui n'ont pas eu lieu. L'ajout ultérieur est additif côté type.
- R5 sans mémoire des rounds précédents → chaque appel est indépendant → si inverse : appels sérialisés, un verrou, et une sortie modèle réinjectée en entrée modèle (KR-294).
- Où orchestrer R5 → hook neuf `useCommentaireCombat` et 2ᵉ ligne d'exclusion `moteurSansIA` → si inverse (greffe sur `useTourDeJeu`) : ce hook passe d'environ 552 à 600 lignes et mêle le verrou de tour R1→R3 au combat, mais le garde reste intact.
- Où loge le câblage du combat → `CombatEnCours.tsx` extrait d'`EcranPartie.tsx` (391 l.) → si inverse : `EcranPartie.tsx` franchit 400 lignes, et la map de narrations devrait se réinitialiser à la main entre deux combats, sans démontage.
- Forme de `ReponseCommentateur` → nue, `{narration} | EchecCopilote`, même clé côté réseau et côté résolu (précédent `ReponseActeur.replique`) → si inverse : enveloppe `{statut:'propose', proposition}` et clé résolue renommée, sans lecteur qui en profite.
- Nombre de lots → 2 (le moteur reste dans le lot feature, comme `combatEngine.ts` à l'it2) → si inverse : 3 lots séquentiels (contrat, moteur, feature). Cela reste sous le plafond de 4 et ne change pas l'étanchéité. Je le déclenche seulement si le lot 2 dépasse ~16 fichiers.
- Le nom du monstre est injecté (registre de code, pas une feuille de destination), le nom du héros jamais (`heros.name` = `moteur`) → si inverse : une dérogation de destination, ce qui est interdit (KR-232).
