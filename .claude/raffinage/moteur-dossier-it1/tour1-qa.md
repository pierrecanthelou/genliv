# Tour 1 — QA — `moteur-dossier` it1

**RISQUE** — Mesuré (sondes jetables, arbre restauré) : deux gardes EXISTANTS de `brain/dossier/` rougissent sur le lot `contrat`. `expr.test.ts:420` recense les lecteurs d'`ExprNode` par regex sur la **source, commentaires compris** : un `session.ts` dont une docstring écrit `noeud.op === '` entre dans la liste close (sonde ROUGE). `couverture.test.ts:515` exige `porteurs === ['feuilles.ts']` : un balayage de session qui réécrit `function feuillesDeLaFixture` rougit (sonde ROUGE). Deux non-régressions à nommer au plan, pas à découvrir à la fusion.

**OBJECTION** — **7(b), mesuré, pas déduit.** Baseline `tourzero.test.ts` 8/8 verte. Amendement **documentaire seul** (H6) : 125/125 vertes sur `tourzero+expr+controles+couverture` — rien ne rougit, **et rien n'est « ajouté »**. Amendement de **cellule** : `indice_connu→indecidable` = 1 rouge (`:217`) ; décision (ii) sur `lieu_visite` = 2 rouges (`:200`, et le Kleene `:228` qui prend `lieu_visite` comme `INDECIS`). Les deux forcent à toucher `VALEUR_ATTENDUE` (`:106`). Donc **critère 3 est soit vide, soit faux** : il sort d'it1 et voyage avec sa cellule (it2/it3).
**Critère 5** (replay) : it1 n'a aucune action, journal vide — deux inits coïncident même sans déterminisme (BUG-113). REPORTÉ it2.
**7(a)** : découpage testable, aucun test de façade requis — `dossierEditorScreen.test.tsx` existe, le shell se monte seul.

**PROPOSITION — 8 critères it1** (`ÉD/Q/A`, niveau, fichier) :
1. ÉD dossier marqué `MARQUEUR_A_ECRIRE` **et** son jumeau réécrit / Q ouverture / A refus nommé vs accepté, **même test** (KR-244). Unit — `brain/dossier/session.test.ts`.
2. ÉD deux `RapportControles` (jouable false→true) sur le **même montage, sans remontage** / Q re-rendu / A `previewDisabledReason` = `message` du 1ᵉʳ bloquant + « (et {n} de plus) » — un état miroir rendrait la 1ʳᵉ valeur, c'est l'état séparateur (KR-245). Composant — `dossierEditorScreen.test.tsx`.
3. ÉD dossier jouable / Q clic CTA / A `navigate({name:'partie',dossierId})`, routeur factice. Composant — idem.
4. ÉD shell monté **directement** sur jouable=false, puis true / Q montage / A refuse puis monte (KR-239). Composant — `features/play-mode/tests/porteJouable.test.tsx`. **Mutant obligatoire dans le lot** : garde retirée du shell, conservée au CTA → ROUGE.
5. ÉD départ **qui n'est pas le premier de `monde.lieux[]`** / Q init / A `lieu_courant === charpente.depart.lieu_id` — sans cette fixture, « départ » et « premier lieu » coïncident (BUG-113). Unit — `session.test.ts`.
6. ÉD session initiale / Q rendu / A `texte_ouverture_joueur` verbatim, chaîne exacte, dans `OutcomeBlock`, **journal à zéro entrée**. Composant — `features/play-mode/tests/ouvertureVerbatim.test.tsx`. (Pas de `toHaveStyle({color:'var(--x)'})` : vert sur tout en jsdom, BUG-084.)
7. ÉD `Record<keyof EtatSession, Destination>` + fixture de session / Q balayage / A échec **par nom de champ**, `memoire` typée `null`, aucun `pnj.<id>.sait` (`@ts-expect-error`), **walker réutilisé depuis `feuilles.ts`** (KR-241/249/253). Contrat — `brain/dossier/sessionCouverture.test.ts`.
8. ÉD liste de fichiers dérivée du disque / Q balayage / A zéro `fetch`, zéro `CopiloteService`, zéro URL `/ia/` (KR-250, modèle `features/dossier-format/tests/lintIsolation.test.ts`). **Mutant dans le lot qui le livre** : import ajouté → ROUGE → retiré.

Mutants exigés, tous **dans leur propre lot** : n° 4 et n° 8. Critères hors it1 : 3, 5.

**Vérifiable par aucun instrument existant — à écrire tel quel dans la revue** : (a) la **jonction** éditeur→shell (« lancée depuis l'éditeur ») — pas d'`App.test.tsx` ; soit un test monte `App` sur `{name:'partie'}`, soit la phrase de démo n'est vérifiée par personne ; (b) le port de stockage **côté surface extraite** — seul l'adaptateur éditeur est atteignable par jest ; (c) KR-243 : ni évaluateur ni session ne sont dans le périmètre muté — couverture de lignes seule.

**DÉFINITION DE FINI** — Prettier → `tsc` → ESLint → jest verts ; les 8 témoins nommés écrits et passants ; les 2 mutants exécutés, ROUGE consigné dans la revue ; `tourzero.test.ts`, `expr.test.ts`, `couverture.test.ts`, `controles.test.ts` verts **sans modification** ; pas de `test:mutation` (hors périmètre). **Hors test** : déplacement, console, deltas, jalons, démolition.

**VERDICT — recevable sous réserve** : critères 3 et 5 retirés d'it1 ; les deux mutants et les deux non-régressions `brain/dossier/` inscrits dans le lot `contrat`.
