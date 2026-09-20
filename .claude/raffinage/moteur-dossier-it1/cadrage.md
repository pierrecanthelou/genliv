# Cadrage envoyé aux 5 rôles — `moteur-dossier` itération 1

Composition : **5 rôles** (PM, Tech Lead, UX, QA, **Narratif & IA**).
Motif de la convocation du cinquième : l'itération pose l'**état de session** et sa **table d'audience**
(`sessionDestinations.ts`), et émet la **première prose verbatim** jamais lue par un joueur
(`charpente.depart.texte_ouverture_joueur`). Frontière code/IA et audience de champ : son terrain exact.
`docs/ROADMAP-BASCULE-IA.md` § 6 le convoque de toute façon sur tout le § 3.

1. `goal` brut = `plan.iterations[0]` de `src/features/moteur-dossier/specification.json`.
2. Phrase de démo proposée : « À la fin, l'auteur lit le texte d'ouverture de son dossier dans une partie lancée depuis l'éditeur. »
3. Sources : la spec (11 clauses de `design_contract`, 13 critères de niveau FEATURE, KR-237→253, 21 `resolved_decisions`, 7 `open_questions`) + `.claude/raffinage/moteur-dossier-cadrage.plan.md` (43 arbitrages, non rejouables).
4. KR applicables à it1 : KR-239, 241, 242, 244, 245, 249, 250, 251, 252, 253 + KR-013/113, 109, 011/111/134, 117, 197/202.
5. Fichiers probables : `brain/dossier/session.ts` (N), `brain/dossier/sessionDestinations.ts` (N), `brain/Router.ts` (R), `brain/index.ts` (R), `brain/persistenceKeys.ts` (R), `brain/dossier/tourzero.ts` (R ?), `player/utils/persist.ts` (R), `App.tsx` (R), `bascule-editeur/components/DossierEditorScreen.tsx` (R), `features/play-mode/components/*` (N).
6. Mesures du dépôt fournies aux rôles (non redémontrables) : `EditorTopBar.tsx:40-48,124-136` ; `DossierEditorScreen.tsx:81,141,162` ; `persist.ts:4-5` ; `play-mode/` = 1 fichier importé par `EditorScreen.tsx:4` ; `Route` = 3 variantes ; `amorce.ts:46,58` ; `destinations.ts:40`.
7. Deux points NON tranchés au cadrage, soumis au comité : **(a)** it1 traverse deux features — dérogation nommée ou découpe ? **(b)** quel amendement de `tourzero.ts` exactement en it1, alors que les décisions (i) et (ii) sont assignées à it3 et it2 ?
8. Hors périmètre déjà acté : évaluateur, deltas, `faits.ts`, console (it2), `JournalRow` (it2), déplacement (it2), jalons (it3), démolition (it4), saut au champ fautif, `quetes[].etapes`, forme interne de `memoire`.
