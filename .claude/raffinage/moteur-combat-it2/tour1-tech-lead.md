# Tour 1 — Tech Lead · moteur-combat it2

**RISQUE** — `fleeTarget` n'existe pas en mode dossier. Aucune des 22 entrées du bestiaire n'en porte. Un bouton conditionné à ce champ ne s'affiche jamais. Un test vert sur une fixture bricolée serait un vert trompeur.

**OBJECTION**
1. Naviguer vers `fleeTarget` crée un second écrivain de `monde.lieu_courant` hors `executerCommande`, sur une référence non validée au SSOT.
2. `fuite` doit être terminale. Si `jouerPosture` accepte une posture après, le rejeu la joue avant la fuite et l'histoire est réécrite.
3. `tryHeroFlee` tue le héros inconscient là où E1 lui laisse 1 PV. La bande (−CA, 0] n'est ni testée ni écrite pour la fuite.
4. Le journal de `tryHeroFlee` porte `round: state.round`, donc « ROUND 0 » à l'écran. Doit être `state.round + 1`.

**PROPOSITION** — Amender D5 d'abord (KR-130) : fuir = rester au lieu courant, événement déjà consommé. Inconscient après l'assaut gratuit = mort (comportement actuel, épinglé). 2 lots séquentiels disjoints.

**VERDICT** — APPROUVÉ SOUS CONDITION : D5 amendé avant tout code.

## ANNEXE — Découpage en lots

| Lot | Type | Fichiers |
|---|---|---|
| 1 `contrat-fuite` | contrat | `docs/REGLES-PLAY.md` (R) · `session.ts` (R) · `session.test.ts` (R) · `sessionDestinations.ts` (R) · `sessionCouverture.test.ts` (R) · `session-saturee.ts` (R) · `brain/index.ts` (R) |
| 2 `feature-fuite` | feature | `rencontre.ts` (R) · `rencontre.test.ts` (R) · `combatEngine.ts` (R) · `combatEngine.test.ts` (R) · `EcranCombat.tsx` (R) · `EcranCombat.test.tsx` (R) · `EcranPartie.tsx` (R) · `combatParConsole.test.tsx` (R) |

### Signatures lot 1
```ts
// session.ts
interface EtatCombat { …; readonly fuite?: true }
type IssueCombat = … | 'hero-fled'
function fuirRencontre(session: EtatSession): EtatSession
// jouerPosture: no-op si fuite === true
// CLOTURES['hero-fled']: sansCombat, pv/pe écrêtés, ni XP ni delta de plafonds
```

### Signatures lot 2
```ts
// rencontre.ts
// rejouerCombat: après la boucle, if (combat.fuite && ongoing) → tryHeroFlee
// bilanDe: seul 'ongoing' rend undefined (hero-fled produit un bilan)
// EcranCombat.tsx
interface EcranCombatProps { …; readonly onFuir?: () => void }
```
