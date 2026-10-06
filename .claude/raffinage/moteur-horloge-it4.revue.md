# Revue — moteur-horloge it4 (0.7.24)

**L'auteur lit au bandeau PAS #n en permanence, CLIMAT · {nom} quand un climat s'active, puis le retour au calme après sa durée.**

## Critères

| # | Critère | Statut | Preuve |
|---|---------|--------|--------|
| C1 | `tickClimat` active un climat quand un événement fournit `climat_id` | VÉRIFIÉ | `climat.test.ts` — 15 tests d'activation (route C, idempotence, remplacement interdit) |
| C2 | `tickClimat` éteint le climat quand `tour − depuis >= duree` | VÉRIFIÉ | `climat.test.ts` — 6 tests d'extinction (>=, sans duree = permanent, introuvable) |
| C3 | `climat_actif: {id, depuis}` dans `EtatSession.horloge` | VÉRIFIÉ | `session.ts` — type vérifié par tsc, 33 tests |
| C4 | `Evenement.climat_id?` optionnel dans `types.ts` | VÉRIFIÉ | `types.ts` — champ ajouté, `destinations.ts` → `'moteur'`, `tables.ts` → référence simple |
| C5 | `BandeauHeros` affiche PAS #n (toujours) | VÉRIFIÉ | `BandeauHeros.test.tsx` — `PAS #3` rendu, prop `pas: number` requise |
| C6 | `BandeauHeros` affiche CLIMAT · {nom} (conditionnel) | VÉRIFIÉ | `BandeauHeros.test.tsx` — `CLIMAT · Tempête` présent quand `climatNom` fourni, absent sinon |
| C7 | `EcranPartie` résout `climatNom` depuis `dossier.monde.conditions.climat` | VÉRIFIÉ | `EcranPartie.tsx` — calcul inline sur `climat_actif.id` → `.nom` ; `climatAuBandeau.test.tsx` — 3 tests d'intégration (activation, affichage, extinction) |
| C8 | Extraction `sessionCombat.ts` — session.ts passe sous 800 lignes | VÉRIFIÉ | `session.ts` 707 lignes (était 846). `sessionCombat.ts` : `jouerPosture`, `fuirRencontre`, `cloreCombat`, `CLOTURES`, types combat |

## Diff par lot

### L1 — contrat `brain/dossier` (8 fichiers)

| Fichier | (N)/(R) | Plan |
|---------|---------|------|
| `src/brain/dossier/climat.ts` | (N) | conforme |
| `src/brain/dossier/climat.test.ts` | (N) | conforme |
| `src/brain/dossier/sessionCombat.ts` | (N) | conforme |
| `src/brain/dossier/types.ts` | (R) | conforme |
| `src/brain/dossier/evaluate.ts` | (R) | conforme |
| `src/brain/dossier/horloge.ts` | (R) | conforme |
| `src/brain/dossier/commandes.ts` | (R) | conforme |
| `src/brain/dossier/tables.ts` | (R) | conforme |

Fichiers hors plan touchés par L1 : `destinations.ts` (R), `sessionDestinations.ts` (R), `session.ts` (R), `validate.test.ts` (R), `horloge.test.ts` (R), `commandes.test.ts` (R), `couverture.test.ts` (R), `sessionCouverture.test.ts` (R), `blocage.test.ts` (R), `evaluate.test.ts` (R), `session.test.ts` (R), `__fixtures__/dossier-minimal.json` (R), `__fixtures__/dossier-reference.json` (R), `__fixtures__/session-saturee.ts` (R), `src/brain/index.ts` (R).

### L2 — feature `play-mode` (3 fichiers)

| Fichier | (N)/(R) | Plan |
|---------|---------|------|
| `src/features/play-mode/components/BandeauHeros.tsx` | (R) | conforme |
| `src/features/play-mode/components/BandeauHeros.test.tsx` | (R) | conforme |
| `src/features/play-mode/components/EcranPartie.tsx` | (R) | conforme |
| `src/features/play-mode/tests/climatAuBandeau.test.tsx` | (N) | ajouté en correction de revue PR (M1) |

Plan listait `EcranPartie.test.tsx` (R) mais noté « Non vérifiable en l'état » — couvert par `climatAuBandeau.test.tsx` à la place.

## Ce qui a été refusé

| Désaccord | Statut | Motif |
|-----------|--------|-------|
| Route B (5e delta `activer_climat`) | REJETÉ | TL veto : DELTAS.ecrit écrit `FaitsDeSession`, pas `horloge` |
| R3 manifestation (bloc CLIMAT du narrateur) | REPORTÉ | PM veto O5 : hors scope it4, ligne ROADMAP ajoutée |
| Éditeur `climat_id`/`effets_regles` | REPORTÉ | PM O3 : auteur-only, pas moteur |
| Extinction `===` au lieu de `>=` | REJETÉ | 3 rôles pour `>=` : extinction efface l'état (pas de répétition), sémantique différente du blocage `===` |
| L3 hors périmètre (EcranPartie tests intégration) | REJETÉ au plan, corrigé en revue PR | M1 : test d'intégration `climatAuBandeau.test.tsx` ajouté |

## Ce qui a été reporté

- **R3 manifestation** → ligne ROADMAP dette à déclencheur
- **Éditeur `climat_id` + `effets_regles`** → ligne ROADMAP dette à déclencheur
- **KR atteindre_jalon saute effet[]** → `open_questions` de la spec

## Écarts assumés

- `dossier-minimal.json` : `climat_id` posé sur l'événement hybride existant (évite casse `identifiers.test.ts` et `suffisance.test.ts` hors lot)
- `resoudreRencontre` reste dans `session.ts` avec type-only re-export (évite modification de `rencontre.ts` hors lot)
- `EcranPartie.tsx` à 406 lignes (était 393 avant it4, signal KR-112, dette au roadmap)
- `panneauPersonnages.test.tsx` reformaté par `npm run format` de L1, restauré par `git checkout`

## Porte qualité

- **tsc --noEmit** : vert
- **jest** : 149 suites / 2869 tests, 0 échec
- **ESLint** : vert
- **Prettier** : vert

## RETOUR-COMITÉ

- L'extraction de fichier (`sessionCombat.ts`) comme dette adjacente fonctionne bien dans un lot contrat quand les importeurs restent stables (type-only re-export). La dette résiduelle (re-pointer `rencontre.ts`) est bien tracée.
- Route C (champ optionnel sur entité existante) est le patron le plus simple pour l'activation d'un état de session par un événement — pas de 5e delta, pas de nouveau type de commande.
- Le motif extinction `>=` vs blocage `===` est un bon précédent de design : deux gardes qui SEMBLENT identiques mais dont les sémantiques d'effacement/constat diffèrent.
