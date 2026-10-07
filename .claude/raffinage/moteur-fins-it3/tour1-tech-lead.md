# Tech Lead — moteur-fins it3 — tour 1

RISQUE
Trois décisions que le code ne laisse pas ouvertes. (a) Rechargement sur héros mort : la session est `reprenable` (finAtteinte rend undefined sous combat). L'écran de mort reviendrait, alors que la fin ouvre une nouvelle partie directe (#20). Deux comportements pour « partie terminée ». (b) Le critère R5 dit « garde dans useTourDeJeu ». R5 n'y est pas : il part de CombatEnCours.handleJouer. (c) Deux verbes « Nouvelle partie » : le ↻ d'en-tête (modal « Abandonner ») et le bouton de l'écran.

OBJECTION
1. `mort_confirmee` : dérivable du rejeu, donc stocké = KR-013. Il n'a aucun lecteur (KR-249). Refusé. `cloreCombat(hero-mort)` reste l'identité, c'est décidé.
2. « Refus dans illisible » touche `LectureSession` (reprise.ts, brain/). Ce serait un lot contrat seul, sans lecteur : EcranReprise n'a qu'une phrase et qu'une action. Je le sors d'it3.
3. EcranCombat garde sa branche `isDead` et son « PARTIE TERMINÉE ». Une fois hero-mort intercepté, c'est un second texte de mort, inatteignable, épinglé par deux tests.
4. « Ligne de journal » (report it2) = écriture en session = contrat, et fin de l'« identique ». Absente du cadrage : à rejeter nommément.

PROPOSITION
Un lot feature, aucun contrat.
- PartieEnCours : `combatRejeu?.outcome === 'hero-mort'` calculé en ligne → EcranMort à la place de CombatEnCours. Bandeau conservé (pvLive), `actionsEntete` omis (précédent de la branche fin). Un seul bouton, sans dialogue (non reprenable). +5 lignes : 363 → ~368, sous 400 (KR-112).
- AiguillagePartie : reprenable + rejeu hero-mort → ouverture directe (+4 lignes, inline, pas de helper : un seul appelant).
- CombatEnCours : `&& outcome !== 'hero-mort'`, testé des deux moitiés.
- Test d'intégration : session pré-écrite, graine fixe.

VERDICT
Recevable sous réserve. Réserves : trancher 1 et 2 (hors it3), corriger le critère R5 dans la spec.

ANNEXE — lots (1 seul ; aucun lot contrat, brain/ intact)

| Lot | Type | Crée (N) | Remplace (R) |
|---|---|---|---|
| L1 `mort-ecran` | feature | N EcranMort.tsx ; N EcranMort.test.tsx ; N mortDuHeros.test.tsx | R PartieEnCours.tsx ; R AiguillagePartie.tsx ; R CombatEnCours.tsx ; R CombatEnCours.test.tsx ; R EcranCombat.tsx (retrait isDead) ; R EcranCombat.test.tsx ; R reprise.test.tsx |

Signatures :
- Expose : `export const TEXTE_MORT_HEROS: string`, `export function EcranMort(props): JSX.Element`
- TEXTE_MORT_HEROS dans EcranMort.tsx (feature), pas dans brain/ (un seul lecteur).
- Inchangées : PartieEnCoursProps, AiguillagePartieProps, CombatEnCoursProps.
- brain/ : aucun contrat touché.
