# Revue — moteur-combat it1 (combat-sans-ia)

**Ce que l'auteur peut faire maintenant qu'il ne pouvait pas** : lancer un aperçu, se déplacer vers un lieu portant un événement à monstre, et résoudre un combat round par round en choisissant sa posture — sans IA, en log mécanique.

## Critères

| # | Critère | Statut | Preuve |
|---|---------|--------|--------|
| 1 | Événement `monstre_ref` au bon lieu ouvre un combat | VÉRIFIÉ | `combatParConsole.test.tsx` — console ALLER ouvre EcranCombat |
| 2 | Posture Normale/Précise/Défensive via SegmentedControl | VÉRIFIÉ | `EcranCombat.test.tsx` — sélection Précise → `onJouer('precise')` |
| 3 | Rejeu déterministe `{monstre_ref, postures[]}` | VÉRIFIÉ | `rencontre.test.ts` — sensibilité graine + préfixe stable |
| 4 | Clôture victoire/mort, PV/PE reflétés | VÉRIFIÉ | `EcranCombat.test.tsx` + `BandeauHeros.test.tsx` pvLive/peLive |
| 5 | Événement consommé à l'ouverture | VÉRIFIÉ | `rencontre.test.ts` — `ouvrirRencontreSiDue` |

## Diff par lot

### Lot 1 — `contrat-combat` (brain/)

- `src/brain/dossier/alea.ts` (R) — domaine `'combat'` dans `DomaineAlea`
- `src/brain/dossier/alea.test.ts` (R) — tests du nouveau domaine
- `src/brain/dossier/commandes.ts` (R) — refus `combat_en_cours`
- `src/brain/dossier/commandes.test.ts` (R) — tests du refus
- `src/brain/dossier/evaluate.ts` (R) — prédicat `lieu_visite`
- `src/brain/dossier/evaluate.test.ts` (R) — tests du prédicat
- `src/brain/dossier/monstre.ts` (N) — résolution bestiaire copy-on-use
- `src/brain/dossier/monstre.test.ts` (N) — tests complets
- `src/brain/dossier/session.ts` (R) — `jouerPosture`, `cloreCombat`
- `src/brain/dossier/session.test.ts` (R) — tests session combat
- `src/brain/dossier/sessionDestinations.ts` (R) — destinations combat
- `src/brain/dossier/sessionCouverture.test.ts` (R) — couverture étendue
- `src/brain/dossier/__fixtures__/session-saturee.ts` (R) — combat dans fixture
- `src/brain/index.ts` (R) — réexportations

### Lot 2 — `feature-combat` (play-mode/)

- `src/features/play-mode/components/EcranCombat.tsx` (N) — écran de combat
- `src/features/play-mode/components/EcranCombat.test.tsx` (N) — tests unitaires
- `src/features/play-mode/components/EcranPartie.tsx` (R) — intégration combat
- `src/features/play-mode/components/BandeauHeros.tsx` (R) — props pvLive/peLive
- `src/features/play-mode/components/BandeauHeros.test.tsx` (R) — tests pvLive/peLive
- `src/features/play-mode/hooks/useTourDeJeu.ts` (R) — court-circuit combat
- `src/features/play-mode/tests/combatParConsole.test.tsx` (N) — intégration console→combat
- `src/features/play-mode/tests/jalonAuJournal.test.tsx` (R) — adaptation fixture
- `src/player/engine/rencontre.ts` (N) — rejeu pur
- `src/player/engine/rencontre.test.ts` (N) — tests rejeu
- `src/player/engine/combatEngine.test.ts` (R) — sonde D2-bis
- `src/player/components/CombatScreen.tsx` (S) — supprimé
- `src/player/hooks/useCombat.ts` (S) — supprimé

## Ce qui a été refusé

- **Sonde D2-bis comme critère séparé** (tour 1 PM) — intégrée directement dans le lot contrat comme sonde de caractérisation
- **Extensions SegmentedControl (flèches/tabindex itinérant)** (tour 2 UX) — non additif, 23 appelants, reporté
- **Zone récit vide en it1** (tour 1 UX) — un placeholder pour un emplacement qui ne se remplit pas est un mensonge
- **pickMonsterPosture enrichi par IG** (tour 1 narratif-IA) — pas de règle écrite (KR-130)
- **Pending* (maladie, vol, magie)** — pas de feuille de session

## Ce qui a été reporté

- Test du court-circuit `useTourDeJeu` (canal IA → combat) — nécessite mocks narrateur IA, hors scope it1
- Déplacement `PREFIXE_BESTIAIRE` de `validate.ts` vers `identifiers.ts` — 6 fichiers brain/, dette technique
- Fuite (hero-fled) — it2
- Narrateur R5 commentateur — it3
- Écran de mort/fin de partie — n° 15

## Écarts assumés

- D2-bis intégré dans le lot contrat (pas un lot séparé) — PM a cédé, deux lots suffisent
- `rencontre.ts` dans `src/player/engine/` plutôt que `brain/dossier/` — évite le premier arc runtime brain→player

## Porte qualité

- **tsc** : vert
- **ESLint** : vert
- **jest** : 141 suites, 2545 tests, 0 échec
- **mutation** : non due (aucun des 4 fichiers mutés touché)

## Bugs trouvés en revue

- **BUG-151** (MAJOR) : test `peLive` tautologique — `toContain('1')` toujours vrai car la fixture contient '10', '12', '150'. Corrigé par `toMatch(/PE\s*2\/6/)` + assertion négative.

## RETOUR-COMITÉ

- Les tests de substitution de valeur (pvLive/peLive) doivent systématiquement vérifier l'ABSENCE de l'ancienne valeur, pas seulement la PRÉSENCE de la nouvelle — un test à une seule assertion positive est un candidat au faux positif.
- Le canal IA (useTourDeJeu) qui ouvre un combat reste sans test unitaire dédié — la couverture de ce chemin dépend de l'intégration console. À combler quand les mocks narrateur seront en place.
