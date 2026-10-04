# Tour 2 — Tech Lead · moteur-combat it2

## Note

**RÉPONSES NOMMÉES**
- **UX O3** (bouton désactivé si `fleeTarget` null, texte d'aide) : tombe. Rien ne lit `fleeTarget`. L'état « désactivé » n'a aucun déclencheur, et « FUITE IMPOSSIBLE » décrirait une règle que D5 amendé supprime. Je corrige ma propre proposition : `onFuir` est **requis**. Optionnel et toujours passé en production, ce serait une branche morte. Le bouton disparaît à l'issue terminale. Le veto UX « section ISSUE vide », je le rends impossible à la compilation. Une table `Record<Exclude<CombatOutcome,'ongoing'>, …>` remplace les `&&` en chaîne.
- **QA O2** (chaîne KR-292) : recevable, bornée. Aucun lecteur de session n'existe : `useSessionPersistee` n'a que `ecrire` (KR-116). « Relire depuis le magasin » exigerait de bâtir `lire`. Testable : rejeu pur ×2, aller-retour JSON, `ecrire` reçoit `combat.fuite === true`.
- **QA O3** : `hero-fled` retire `combat` (`CLOTURES`), épinglé par test.

**MES OBJECTIONS**
1. Second écrivain de `lieu_courant` : **retirée**. D5 amendé l'éteint. Elle devient un test (`monde`, `horloge`, `journal` inchangés par la clôture). **Veto** si D5 n'est pas adopté.
2. `fuite` terminale : **maintenue** (lot 1).
3. Inconscient = mort : **maintenue**, avec son motif. E1 dit « hors combat, inconscient = mort » et la fuite sort du combat. Épinglée à la frontière PV 0 / PV 1.
4. `round + 1` : **maintenue**, trois lignes de journal.

**NOUVEAU** — `session.ts` fait 798 lignes et le lot 1 le pousse au-delà de 800. KR-112 vise composants et hooks : pas de veto, dette à déclencheur nommée.

**VERDICT** — Approuvé sous condition : D5 amendé avant tout code. Deux lots, inchangés.

---

## ANNEXE

### A. D5 amendé — texte proposé (lot 1)

> **D5. Fuite.** Le héros peut fuir au début d'un round, tant que le combat est en cours. Il subit **un assaut gratuit** du monstre (Normale vs sa propre Défensive), journalisé au round N+1. Si ses PV sont ≤ 0 après cet assaut, il meurt (E1, hors combat : inconscient = mort ; la fuite sort du combat). Sinon il sort du combat avec ses PV restants et **reste au lieu courant** : aucun déplacement, aucun `fleeTarget` lu. Ni XP, ni butin, ni variation de plafonds. L'événement reste consommé. La fuite est terminale : aucune posture ne se joue après. ✍️ *Décision (n° 13, it2).*

### B. Lots (exécution séquentielle)

| Lot | Type | Fichiers |
|---|---|---|
| **1 `contrat-fuite`** | contrat | R `docs/REGLES-PLAY.md` · R `session.ts` · R `session.test.ts` · R `sessionDestinations.ts` · R `sessionCouverture.test.ts` · R `session-saturee.ts` · R `brain/index.ts` |
| **2 `feature-fuite`** | feature | R `combatEngine.ts` · R `combatEngine.test.ts` · R `rencontre.ts` · R `rencontre.test.ts` · R `combatTypes.ts` · R `EcranCombat.tsx` · R `EcranCombat.test.tsx` · R `EcranPartie.tsx` · R `combatParConsole.test.tsx` |

### C. Signatures

**Lot 1 expose**
```ts
export interface EtatCombat {
	readonly monstre_ref: string
	readonly postures: readonly Posture[]
	readonly fuite?: true
}
export type IssueCombat =
	| 'hero-victory' | 'monster-fled' | 'hero-survived-unconscious' | 'hero-mort' | 'hero-fled'
export function fuirRencontre(session: EtatSession): EtatSession
```

**Lot 2 consomme**
```ts
// rencontre.ts — rejouerCombat: après la boucle, if (ongoing && combat.fuite) → tryHeroFlee
// bilanDe: seul 'ongoing' rend undefined
// combatEngine.ts — tryHeroFlee: round: state.round + 1
// EcranCombat.tsx — onFuir REQUIS, bouton ssi !isTerminal
```

### D. Tests nommés

**Lot 1** : `fuirRencontre pose fuite et ne touche ni postures ni monde ni horloge ni journal ni heros` · `fuirRencontre sans combat rend la meme reference` · `fuirRencontre deux fois rend la meme reference` · `jouerPosture apres fuite rend la meme reference` · `cloreCombat hero-fled retire combat, ecrete pv et pe, aucune xp, plafonds intacts` · `cloreCombat hero-fled laisse monde horloge journal identiques`

**Lot 2** : `tryHeroFlee numerote round+1` · `tryHeroFlee frontiere inconscient` (PV 0 → mort, PV 1 → fled) · `rejouerCombat applique la fuite apres les postures` · `rejouerCombat est pur : deux appels identiques` · `rejouerCombat identique apres aller-retour JSON de la session` · `rejouerCombat ignore une fuite sur issue deja terminale` · `bilanDe hero-fled rend un bilan` · `Fuir present et actif en cours de combat` · `Fuir hors du groupe POSTURE` · `clic Fuir appelle onFuir une fois` · `Fuir absent en issue terminale` · `issue hero-fled : badge FUITE et Continuer focus` · `chaque issue terminale a un badge` · parcours console complet

### E. Décisions prises en autonomie

- Fuite + PV ≤ 0 → mort (E1 « hors combat »). `onFuir` requis. Fuir n'est pas une action dangereuse. `combatTypes.ts` : seul commentaire L14 corrigé. `fuite?: true` (littéral, pas boolean). Événement reste consommé.
- **Dette** : `session.ts` > 800 l. → dette à déclencheur (le prochain lot qui le rouvre sort les portes combat dans `sessionCombat.ts`).
