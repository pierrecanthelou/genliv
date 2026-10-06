## Tech Lead — moteur-horloge it4 — tour 1

**RISQUE** — Trois pièges silencieux que le design ne montre pas.
(a) `commandes.ts:348/394/457` réécrit `horloge: { tour }`. Le premier pas efface donc `climat_actif`.
(b) `climat_actif?: string` (KR-301) interdit l'extinction : le pas d'activation ne se dérive de rien, sauf du journal.
(c) La ligne d'activation porte `deltas`, et `narrateur.ts:653-655` lit les deltas de toute entrée du pas. Les effets du climat entrent donc dans « CE PAS » du R3, et le budget est à re-mesurer.

**OBJECTION** — Route B (5e delta `activer_climat`) : **veto**.
- `DELTAS.ecrit` écrit `FaitsDeSession`, jamais `horloge`.
- La clause (c) de `deltas.ts` exige des `refKinds` nommés par un prédicat, et aucun prédicat ne nomme `climat`.
- Un delta admis dans `Climat.effets_regles` ferait activer un climat par un climat.
- Le drapeau « déjà appliqué » en session est une seconde source de vérité : `evenements_consommes` joue déjà ce rôle.

**PROPOSITION** — Route C.
- `Evenement.climat_id?` (précédent `donneur_id`).
- Sélecteur `evenementDeClimat` dans `evaluate.ts`, seul lecteur de `declencheur_expr` (KR-246).
- `tickClimat` dans un `climat.ts` neuf, appelé en tête de `tickHorloge`.
- `climat_actif?: { id, depuis }`.
- Extinction en `>=`, parce qu'elle efface l'état. Le blocage reste en `===`, parce qu'il n'écrit rien.
- Extraction `sessionCombat.ts` fusionnée dans le lot contrat, sans quoi `session.ts` serait nommé par deux lots.
- Manifestation R3 : hors it4.

**VERDICT** — recevable sous réserve.

---

## ANNEXE TECHNIQUE

### Découpage en lots (3)

| Lot | Titre | Type | Fichiers |
|---|---|---|---|
| L1 | contrat-climat | contrat, seul, en premier | session.ts, commandes.ts, horloge.ts, evaluate.ts, types.ts, tables.ts, destinations.ts, sessionDestinations.ts, brain/index.ts, fixtures, tests + sessionCombat.ts (N), climat.ts (N), climat.test.ts (N) |
| L2 | bandeau-pas-climat | feature play-mode | BandeauHeros.tsx, BandeauHeros.test.tsx, EcranPartie.tsx, EcranPartie.test.tsx |
| L3 | lien-evenement-climat | feature dossier-registres, conditionnel | FicheEvenement.tsx, PanneauEvenements.tsx, FicheClimat.tsx, tests |

### Signatures

```ts
// types.ts
interface Evenement { climat_id?: string }

// session.ts
readonly horloge: { readonly tour: number; readonly climat_actif?: { readonly id: string; readonly depuis: number } }

// evaluate.ts
export interface ActivationDeClimat { readonly evenement_id: string; readonly climat_id: string }
export function evenementDeClimat(dossier, session): ActivationDeClimat | undefined

// climat.ts (N)
export function tickClimat(dossier: Dossier, session: EtatSession): EtatSession

// BandeauHerosProps
{ heros, pas: number, climat?: string, pvLive?, peLive? }
```

### Mécanisme d'activation : tickClimat
1. Extinction si climat_actif existe et tour − depuis >= duree
2. Activation si aucun climat actif : evenementDeClimat → appliquerDelta → climat_actif = {id, depuis: tour}
3. Puis boucle PNJ

### Extinction >= vs === : >= parce qu'elle efface l'état (un dossier raccourci laisse un climat éternel avec ===). Le blocage reste ===, parce qu'il n'écrit rien.
