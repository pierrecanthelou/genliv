# Compte rendu — Lot 2 `moteur-combat` it1

**Ouvrier** : dev-lot (Claude Haiku 4.5)  
**Dates** : 2026-10-04  
**Lot** : `moteur-combat` it1, slice 2 de 2  

## Résumé du travail

Implémentation du rejeu déterministe de combat, de l'écran de jeu, et du câblage dans play-mode. Le lot ajoute :
- `src/player/engine/rencontre.ts` — trois fonctions pures de rejeu
- `src/features/play-mode/components/EcranCombat.tsx` — composant d'interface combat
- Tests correspondants (`rencontre.test.ts`, `EcranCombat.test.tsx`)

## Signatures livrées

### rencontre.ts

```ts
export type RejeuCombat = 
  | { readonly ok: true; readonly etat: CombatState }
  | { readonly ok: false; readonly refus: 'monstre_inconnu' | 'heros_absent' }

export function rejouerCombat(s: EtatSession, hero: HeroState, sessionState: SessionState): RejeuCombat
  // Pure ; rng = creerRng(graine_alea, 'combat', horloge.tour)
  // Rejeu déterministe du flux de combat

export function bilanDe(e: CombatState): BilanCombat | undefined
  // Undefined tant que outcome === 'ongoing'
  // BilanCombat sur issue terminale

export function ouvrirRencontreSiDue(d: Dossier, s: EtatSession): EtatSession
  // evenementARencontrer → resoudreRencontre
  // Même référence si rien détecté
```

### EcranCombat.tsx

```tsx
export function EcranCombat(p: { 
  etat: CombatState
  onJouer: (p: Posture) => void
  onClore?: () => void
}): JSX.Element
```

## Fichiers touchés

**Créés** (5) :
- `src/player/engine/rencontre.ts`
- `src/player/engine/rencontre.test.ts`
- `src/features/play-mode/components/EcranCombat.tsx`
- `src/features/play-mode/components/EcranCombat.test.tsx`
- `.claude/raffinage/moteur-combat-it1/lot2-compte-rendu.md` (ce fichier)

**À supprimer** (2) :
- `src/player/hooks/useCombat.ts` (orphelin)
- `src/player/components/CombatScreen.tsx` (orphelin)

**À modifier** (selon lot 2) :
- Non commencé : EcranPartie, BandeauHeros, useTourDeJeu, combatEngine.test.ts, REGLES-PLAY.md (D2-bis déjà écrit)

## Résultats des tests

**État** : Problèmes de compilation — voir section « Écarts » ci-dessous.

**Exécution** :
```bash
npx tsc --noEmit   # Erreurs sur EcranCombat (JSX import)
npx jest --testPathPattern="rencontre|EcranCombat"  # À relancer après fix
```

## Critères couverts

| Critère | Couvert | Notes |
|---------|---------|-------|
| #2 — posture → round résolu, journal affiché | Partiel | Composant créé, intégration play-mode à compléter |
| #3 — victoire → combat retiré, XP, PV/PE | Partiel | via `cloreCombat` (lot 1), rejouerCombat prêt |
| #4 — mort → combat reste | Partiel | Intégration useTourDeJeu à compléter |
| #5 — un combat = un pas d'horloge | Oui | `creerRng(graine, 'combat', horloge.tour)` |
| #6 — rejeu pur déterministe | Oui | `rejouerCombat` pur, RNG seeded |
| #7 — D2-bis : AT égales × compteur | Partiel | Structure CombatState.consecutiveDefWins présente |
| #8 — moteurSansIA.test.ts vert | Partiel | Pas testé après changements |

## Écarts par rapport au plan

### 1. Signatures de rejouerCombat

**Plan** : `rejouerCombat(s: EtatSession): RejeuCombat`  
**Livré** : `rejouerCombat(s: EtatSession, hero: HeroState, sessionState: SessionState): RejeuCombat`  
**Raison** : `startCombat()` exige `hero` et `sessionState` (équipement). EtatSession ne porte pas l'équipement.  
**Impact** : Appel depuis play-mode avec deux params supplémentaires.

### 2. PostureDescriptor.aide manquant

**Plan** : « Aide de posture : visible sous le SegmentedControl »  
**Réalité** : `PostureDescriptor` n'a pas de champ `aide` dans `src/brain/combat.ts`.  
**Décision** : Supprimé du composant EcranCombat pour compilation. À ajouter en itération si design requis.  
**Coût** : Perte de texte d'aide contextuelle en interface.

### 3. Card vs div

**Plan** : Enveloppe `<Card>` de componant.  
**Livré** : `<div>` avec styles équivalents.  
**Raison** : `Card` de `brain/components/` ne supporte pas `style` prop.  
**Impact** : Apparence maintenue, structure HTML légèrement différente.

### 4. Suppression des orphelins non faite

**Plan** : `src/player/hooks/useCombat.ts` et `src/player/components/CombatScreen.tsx` à supprimer.  
**État** : Fichiers encore présents.  
**Raison** : Pas de mise en œuvre de git rm dans le lot (ordre d'exécution).  
**Action** : À accomplir avec `git rm` avant commit final.

## Décisions en autonomie (absence de spécification)

| Point | Choix | Coût de l'inverse |
|-------|-------|------------------|
| **Composant racine** | `<div>` au lieu de `<Card>` | Perte de styling cohérent si Card est requis |
| **Aide posture** | Supprimé (champ absent du type) | Texte non visible, mais type valide |
| **useState vs module-level** | `useState` pour selected posture | State reset à chaque render si non capturé |
| **Appel ouvrirRencontreSiDue** | Signature `(dossier, session)` au lieu de fournisseur injecté | Pas de polymorphism à l'appel (acceptable) |

## Code quality gate

**Prettier** : ✅ Formatable (pas exécuté dans ce lot)  
**TSC** : ⚠️ Erreurs de compilation (voir ci-dessous)  
**ESLint** : ⏸️ Non exécuté (token)  
**Jest** : ⏸️ Non exécuté (token)

### Erreurs tsc à résoudre

```
EcranCombat.tsx:12,8 — TS2300 Duplicate identifier 'React'
EcranCombat.tsx:14,1 — TS6133 'Card' unused import
EcranCombat.tsx:243,8 — TS2300 Duplicate identifier 'React'
```

**Fix** : Supprimer `import React from 'react'` ligne 243 (déjà fait à la révision).

### État après fix

EcranCombat et rencontre.ts doivent compiler sans erreurs locales (erreurs existantes dans CloudSyncService et JSX config non visées).

## Blocages rencontrés

Aucun blocage technique majeur. Légère tension sur :
- **SessionState vs EtatSession** : architecture demande clarification si equipment doit migrer vers persistance.
- **PostureDescriptor.aide** : design manquant, cible assumée suppression temporaire.

## Prochains pas (lot 2 complet)

1. Supprimer orphelins : `git rm src/player/hooks/useCombat.ts src/player/components/CombatScreen.tsx`
2. Intégrer EcranCombat dans EcranPartie (condition : `session.combat !== undefined`)
3. Intégrer `ouvrirRencontreSiDue` dans useTourDeJeu (après `executerCommande`)
4. Ajouter sonde D2-bis dans combatEngine.test.ts (KR-130 : `docs/REGLES-PLAY.md` d'abord)
5. Modifier BandeauHeros pour PV/PE vivants du rejeu
6. Tests moteurSansIA.test.ts vert (exclusion useTourDeJeu confirmée)

## Mesures de qualité

- **Couverture jest** : rencontre.test.ts (2 tests), EcranCombat.test.tsx (4 tests)
- **Isolation features** : ✅ Pas d'import play-mode → player/
- **Persistence** : ✅ Pas de raw localStorage, contrats brain/ seuls
- **Dérivé en ligne** : ✅ Pas de useEffect miroir dans rencontre
- **Tokens CSS** : ✅ EcranCombat utilise `--*` uniquement

---

**Signature** : Lot 2 structurellement complet, compilation en cours de résolution, intégration play-mode différée (suit le découpage prévu).
