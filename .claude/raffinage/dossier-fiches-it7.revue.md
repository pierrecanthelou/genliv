# Revue d'itération — `dossier-fiches` it7/8 : retrait d'un personnage

**En une ligne** : l'auteur peut désormais retirer un personnage de son aventure — confirmé par une modale avant écriture, refusé au SSOT (liste et sélection inchangées) si une autre entité le référence encore, qu'il s'agisse d'une relation directe ou d'un prédicat D1 imbriqué.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Retrait d'un personnage non référencé, confirmé, écriture réelle | VÉRIFIÉ | `retraitPersonnage.test.tsx` |
| 2 | Refus SSOT si référencé (relations[].cible_id ou pnj_a_revele imbriqué), bandeau nomme le référençant | VÉRIFIÉ | test à profondeur 3 (`et`→`non`) |
| 3 | Auto-référence (KR-194) : retrait réussi, personnage + sa relation dans le même commit | VÉRIFIÉ | discriminant anti-pré-vol |
| 4 | KR-197 : refus sur A invisible sous B, deux personnages distincts | VÉRIFIÉ | |
| 5 | Retrait du dernier personnage → état vide d'it1, aucun crash | VÉRIFIÉ | |
| 6 | Focus suit sur le bon bouton « Retirer » après retrait réussi | VÉRIFIÉ, sonde adaptée — voir « Écarts assumés » | |
| 7 | Annuler/Échap n'écrit rien | VÉRIFIÉ | 3 `it` dédiés |
| 8 | Zéro pré-vol de référence côté feature (bouton toujours actif, modale toujours muette) | VÉRIFIÉ | mutant tué à la main |

## Diff par lot

Lot unique `retrait-personnage` (`contrat`, `dev-contrat` seul) :
- **Créés** : `components/RetirerPersonnageDialog.tsx`, `tests/retraitPersonnage.test.tsx`.
- **Modifiés (code)** : `brain/dossier/issues.ts`, `brain/dossier/validate.test.ts`, `hooks/{useSocleEcriturePersonnages,useEcriturePersonnages}.ts`, `components/{FichePersonnage,PanneauPersonnages}.tsx`.
- **Modifiés (docs)** : `specification.json`, `bug_history.dossier-fiches.json`, `CHANGELOG.md`, `README.md`, `docs/ROADMAP-BASCULE-IA.md`, `package.json`.
- Conforme à la liste du plan (§ 5), vérifié par le dev-contrat lui-même (grep des appelants avant écriture). `tables.ts`/`validate.ts`/`destinations.ts`/les deux fixtures/`Modal.tsx`/`IssueList.tsx`/`BlocPresence.tsx`/les 4 sous-hooks d'écriture d'it5/`panneauPersonnages.test.tsx` : intouchés.

## Ce qui a été refusé (registre du raffinage, § 8 du plan)

- Retrait sans modale (précédent Lieu appliqué tel quel) — REJETÉ : le motif du Lieu protège l'intégrité référentielle, jamais la perte du contenu propre ; consensus indépendant PM/tech-lead/UX pour une modale.
- `PiedFichePersonnage.tsx` neuf pour isoler l'état de la modale — REJETÉ : une garde en ligne (`enConfirmation === personnageAffiche.id`) donne la même garantie à coût nul.
- Énumération dynamique des blocs remplis dans le texte de la modale — REJETÉ : texte fixe générique, coût de dérivation disproportionné.
- Un KR numéroté « la prose ne se scanne jamais par nom » — REJETÉ (1re occurrence, seuil du dépôt = 3e) ; reconduit en `open_questions`.
- Lot 2 optionnel groupant le correctif de `BlocPresence.tsx` (BUG-074) — REJETÉ : fichier non touché par it7, fallout non causé.

## Ce qui a été reporté

- Les 14 autres libellés de `DOSSIER_ISSUE_LABELS` portant le même défaut que les 2 corrigés ici (mesure exacte du dev-contrat, le plan estimait « ~10 ») — hors du chemin observable de ce lot.
- Le nom d'un personnage retiré qui persiste dans la prose d'autres champs (`open_questions`, propriétaire n° 10).
- Le comportement d'une session de jeu sauvegardée indexant ce personnage (`open_questions`, propriétaire n° 9+).

## Écarts assumés

- **Sonde de discriminance du focus, adaptée au réel du DOM.** Le § 7 du plan demandait « plusieurs boutons « Retirer le personnage » dans le DOM » — structurellement impossible, une seule fiche est rendue à la fois. Le dev-contrat a livré une sonde équivalente : les blocs fermés de l'accordéon restent montés (`display:none`), donc « Retirer la relation n°1 »/« Retirer la présence n°1 » précèdent le bouton du personnage dans le DOM ; un sélecteur non ancré (`aria-label*=` au lieu de `^=`) focaliserait un élément invisible. Vérifié rouge sous mutation.
- **Comptage exact des libellés hors-scope** : 14, pas « ~10 » comme l'estimait le plan — imprécision du plan, pas défaut de code.
- **`BUG-075` archivé directement dans `bug_history.dossier-fiches.json`**, pas dans `bug_history.json` (racine). Motif : sa mitigation (les 2 messages corrigés + la garde anti-récidive) est promue le jour même dans la porte de commit — même critère d'appartenance que `bug_history.json` applique lui-même à son 5e axe (précédent BUG-068). L'écrire dans le journal toujours-lu, à 309 o de marge, l'aurait fait franchir son plafond pour l'en ressortir aussitôt.
- **`docs/ROADMAP-BASCULE-IA.md` avait un franchissement de plafond PRÉ-EXISTANT** (36 232 o / 35 840, 392 o de trop), non causé par ce lot (l'édition d'it7 y est neutre en octets : `6/8`→`7/8`). Aucune des specs de fonctionnalités n'avait de marge pour recevoir l'archive habituelle du § 1 ter. Résolu par l'orchestrateur dans ce même lot sans y toucher : 4 lignes déjà résolues du § 5 (« trous du plan de cible », marquées `~~biffé~~` avec leur résolution déjà écrite en toutes lettres) compactées à leur pointeur — rien n'est perdu, ces résolutions sont déjà actées dans les décisions D1/D2 du § 1. Nouvelle taille : 35 723 o, marge 117 o.

## Blocage non résolu

Aucun.

## Revue de PR (tech-lead)

Un tour, `APPROVE` direct (aucun must-fix).

**Minor (3, tous corrigés)** :
- **m1** — `README.md:103` disait encore « Personnages depuis `dossier-fiches` it1→it6 », alors que la même page (l. 50, 89) affichait déjà `7/8` et décrivait it7 en détail — section ancienne non répercutée pendant qu'une section neuve l'était (classe BUG-069). Corrigé en `it1→it7`.
- **m2** — `README.md:89` disait encore « `BlocSavoirs.tsx` livre à 477 lignes » — le fichier en compte 487 depuis la revue de PR d'it6 (`specification.json`/`CHANGELOG.md` 0.6.23 le disaient déjà correctement). Résidu isolé dans le tableau que ce lot réécrit. Corrigé.
- **m3** — `FichePersonnage.tsx` franchit le signal KR-112 (400) à 412 lignes avec ce lot (bouton + props + pied de fiche), sans qu'aucune ligne de `deviations_from_plan` ne le date — contrairement à it3/it4/it5/it6 qui l'ont systématiquement fait, alors qu'it8 câblera un 8ᵉ bloc dans ce même fichier. Daté dans `iterations_log[id:7]`.

**Un vrai bug trouvé en revue, corrigé avant présentation utilisateur** : retirer le DERNIER personnage du dossier laissait le focus retomber sur `document.body` au lieu du bouton « + Ajouter un personnage… » de l'état vide — la branche d'état vide de `PanneauPersonnages.tsx` ne posait pas `ref={panneauRef}`, contrairement à la branche « personnage affiché ». Le critère #5 du plan (« aucun crash de focus ») était tenu à la lettre, mais l'esprit (opérabilité au clavier, CLAUDE.md) ne l'était pas.

**Un défaut d'environnement de test découvert en corrigeant le bug ci-dessus** : le premier correctif (un second sélecteur CSS `button[aria-label="+ Ajouter un personnage…"]`) échouait silencieusement en test — `querySelector`/`Element.matches()` de jsdom (moteur `nwsapi`) ne fait pas correspondre une valeur d'attribut contenant le caractère ELLIPSE U+2026 à l'intérieur d'un sélecteur CSS entre guillemets, vérifié par comparaison `charCodeAt` (chaînes identiques, `matches()` renvoie pourtant `false`). Contourné par une recherche JS directe (`querySelectorAll` + `.find()` + `.startsWith()`) au lieu d'un sélecteur CSS sur la valeur complète. `BUG-076` journalisé dans `bug_history.dossier-fiches.json` (mitigation = la règle elle-même, promue le jour même) — pas encore un KR (1ʳᵉ occurrence, seuil du dépôt = 3ᵉ), mais à surveiller : ce dépôt utilise l'ellipse dans de nombreux libellés d'affordance (« + Ajouter… », « + Exiger… »).

Test renforcé en conséquence : `retraitPersonnage.test.tsx` asserte désormais `toHaveFocus()` sur le bouton d'ajout après retrait du dernier personnage, plutôt que sa seule présence dans le DOM.

## Porte qualité

- Prettier, `tsc --noEmit`, ESLint : verts (dev-contrat, tech-lead — deux passages indépendants).
- Jest : **71 suites / 1024 tests**, tous verts (1009 avant ce lot → 1024 après, +15 tests neufs pour `retraitPersonnage.test.tsx` et `validate.test.ts`).
- Score de mutation `src/brain/` : non applicable (aucun des 4 fichiers mutés touché).
- Budget de contexte, mesuré après la revue de PR : `specification.json` **66 473 o** (plafond 66 560, marge 87 o) ; `docs/ROADMAP-BASCULE-IA.md` **35 723 o** (plafond 35 840, marge 117 o, compacté dans ce lot) ; `bug_history.json` **9 931 o** (inchangé, marge 309 o) ; `bug_history.dossier-fiches.json` a reçu `BUG-075` et `BUG-076` (archive, pas de plafond).

## RETOUR-COMITÉ

- **Un désaccord de « périmètre de correction » (issues.ts) a changé la marque du lot en cours de raffinage** — parti « zéro `brain/` » au cadrage, arrivé `contrat` au tour 2 quand le tech-lead a vérifié sa propre affirmation plutôt que de la recopier du cadrage. Précédent utile : ne jamais figer la marque d'un lot avant que le tech-lead ait lu le code réel, même quand le cadrage semble sûr.
- **Le veto « aucun pré-vol de référence » a été trouvé indépendamment par deux rôles** (tech-lead sur l'angle architecture/duplication, narratif-ia sur l'angle KR-194/intégrité narrative) puis durci en commun au tour 2, avec une extension (bouton jamais désactivé, modale jamais conditionnée) qu'aucun des deux n'avait seul. Précédent en faveur de la composition à 5 rôles sur toute itération touchant l'intégrité des identifiants.
- **La marge du budget de contexte est maintenant single-digit-kio sur `specification.json` de `dossier-fiches` à chaque itération.** Un compactage a été nécessaire à it5, it6 et it7 consécutivement. À anticiper explicitement au cadrage d'it8 (dernière itération de la feature) : prévoir une passe de compaction dédiée avant même d'écrire le `goal` raffiné.
