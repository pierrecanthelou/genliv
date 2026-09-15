# Revue d'itération — `dossier-controles` · itération 4

> Livrée le 2026-09-15 · **1 lot unique, sans marque `contrat`** · **non committée** au moment d'écrire
> Plan : `.claude/raffinage/dossier-controles-it4.plan.md` (validé, porte 2 franchie **avec une case rouge acceptée**)
> Notes de comité : `.claude/raffinage/dossier-controles-it4/` (4 rôles × 2 tours + `mesure-orchestrateur.md`)

## En une ligne

**L'auteur atteint désormais, depuis une ligne du rapport, la section où le constat a été produit** — et chaque ligne lui dit **où elle mène avant qu'il clique**.

## Les 8 critères

| # | Verdict | Preuve |
|---|---|---|
| 1 — câblage, l'écran réagit | **VÉRIFIÉ** | `la sonde du panneau selectionne la section demandee` : destination initiale Canon vérifiée **avant** tout clic, puis `aria-current` en **égalité stricte** du tableau filtré sur « Indices » |
| 2 — contrat, clic **et** clavier | **VÉRIFIÉ** | Deux sections **différentes** dans le même rendu (KR-197/202), clic puis `{Enter}`, `toHaveBeenNthCalledWith` ×2. Aucun `querySelector` |
| 3 — le rendu ne ment jamais | **VÉRIFIÉ**, **sonde exécutée** | Titre dérivé **des deux côtés** par le même mécanisme. La QA a cassé le lien (émettre la section *suivante*) → **le test rougit** ; restauration `IDENTICAL` |
| 4 — doublon de section | **VÉRIFIÉ** | Deux proses Canon, deux appels `'canon'` |
| 5 — dossier calme | **VÉRIFIÉ**, écart de formulation | Assertions identiques ; le `render` a dû gagner `onSelectSection={jest.fn()}`, la prop étant requise. **Mécanique, aucune assertion touchée** — le plan disait « aucune modification », c'était inexact |
| 6 — câblage réel de la racine | **VÉRIFIÉ** | `it` séparé ; regex de source + `indexOf` prouvent l'ordre `panneauControles` avant `panneaux` |
| 7 — forme de la ligne | **VÉRIFIÉ** | **Seule** `queryAllByRole('button')` a changé ; les deux assertions `role`/`tabindex` du `<li>` sont **mot pour mot inchangées** ; test **renommé, même `describe`**, jamais supprimé. `[data-etage]` → 3 non vides, sur deux tests |
| 8 — porte `jest` **et** `tsc` | **VÉRIFIÉ** | 4 suites du périmètre **39/39** ; `tsc --noEmit` 0 erreur |

## Diff — conforme au plan, aucune violation

| Fichier | Prévu | Livré |
|---|---|---|
| `DossierEditorScreen.tsx` | R | R (+11) |
| `PanneauControles.tsx` | R | R (+13) |
| `ListeControles.tsx` | R | R (+80) |
| `src/App.tsx` | R | R (+4) |
| `panneauControles.test.tsx` | R | R (+127, 4 → **7** tests) |
| `dossierEditorScreen.test.tsx` | R | R (+106, 26 → **27** tests) |

`specification.json` est modifié **hors lot**, par l'orchestrateur — légitime et attendu.
**Aucun fichier CSS, aucun `src/brain/**`.** `SectionNav.tsx`, `ListRow.tsx`, `Badge.tsx`, les barils, `sectionNav.test.tsx`, `createDossierFlow.test.tsx` : **inchangés**.

## Ce qui a été REFUSÉ — ce qu'un diff ne dira jamais

- **Un contexte ou service de navigation dans `brain/`** — primitive à un seul appelant.
- **Lever `destination` dans `App.tsx`** — seconde source de vérité sur « ce qui est affiché », classe de BUG-082.
- **Une union `ReactNode | ((…) => ReactNode)`** — deux chemins pour une prop dont un seul aurait un appelant de production.
- **Un rappel optionnel** — il n'aurait acheté qu'un découpage, au prix d'un chemin que personne n'exerce.
- **Un champ `remedeSection` sur `Controle`** — cible **plurielle** (trois remèdes pour `indice-sans-source`) : une itération de logique, pas un ajout de nav. Co-signé PM + tech-lead.
- **Une table `ControleId → SectionId`, ou toute table locale `SectionId → libellé`** — seconde vérité divergeant de `sections.ts`.
- **Garder le rapport affiché à côté de la section atteinte** — change la mise en page et rouvre l'état unique ; le retour est déjà à un clic.
- **Un défilement ou un focus sur la ligne de nav atteinte** — exige un `ref` sur `ListRow`, veto maintenu depuis it1.
- **Extraire une primitive « ligne de constat cliquable » vers `brain/components/`** — aucun second appelant.
- **Un verbe dans l'affordance, ou un nom de section écrit en dur** — le libellé se **dérive**.
- **Tout survol, et donc tout fichier CSS** — la doctrine est écrite (`ListRow.tsx` l. 93-94), il n'existe **aucun `.css` de composant** dans `src/`, et **aucun instrument ne vérifie un `:hover`**.
- **Marquer le lot `contrat` par précaution** — `contrat` signifie `brain/` ; un faux `contrat` apprendrait à l'essaim que la marque ne veut rien dire.

## Ce qui a été REPORTÉ

- **Le routage vers la section du REMÈDE** → `open_questions`, avec la clause de la QA **mot pour mot** : il sera ***superseded*, jamais régressé**.
- **Le focus après clic** (le bouton se démonte, le focus retombe sur `<body>`) → signalé par l'UX **et** le tech-lead, non mandaté.
- **La saturation de `mene_a`** → it6 · **le pont vers les avertissements** → it5 (inchangés).

## Écarts assumés

1. **Le signal de coupe « plus d'une feature » a FEU**, et la case de porte 1 est restée **rouge** : acceptée en connaissance de cause par l'humain (précédent it1). Mesure qui l'accompagne : it1/it2 touchaient **deux** fichiers de production de `bascule-editeur`, **it4 n'en touche qu'un**, sans logique métier — *le diff recule*.
2. **La conversion `<p>` → `<span>` est un CHOIX, pas une nécessité** — mesuré deux fois. Retenue pour la validité HTML et le précédent `ListRow`. **Écrit ainsi pour qu'aucun relecteur ne re-dérive une fausse nécessité.**
3. **Le plan disait le test « dossier calme » inchangé** ; il a dû gagner la prop requise. Mécanique, aucune assertion touchée.

## Ce que personne n'a vérifié

- **Le veto D-3** (ne jamais dériver une destination depuis un texte d'affichage) — **aucun instrument ne peut le garder** : c'est une propriété de ce que le code *ne fait pas*. Constaté **par lecture** ; le seul garde-fou mécanique est indirect (`const section` lue une seule fois, qui ne laisse aucun texte à parser).
- **Survol, casse et couleur au rendu réel** — `toHaveStyle` est cassé sur les jetons `var()`.
- **La largeur rendue du trailing** — jsdom ne calcule aucun layout.

## Porte qualité

| | |
|---|---|
| `prettier --check` | clean |
| `tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur**, 1 warning préexistant hors lot |
| `npm test` | **85 suites / 1218 tests** (avant : 85 / 1214) |
| Score de mutation | **sans objet, confirmé par mesure** — aucun des 4 fichiers mutés au diff |

## Budget de contexte — relevé le 2026-09-15, franchi DEUX fois dans ce lot

| Fichier | Mesuré | Plafond | Marge |
|---|---:|---:|---:|
| `CLAUDE.md` + `docs/WORKFLOW.md` | 46 454 o | 46 080 | **−374** |
| `code-knowledge.json` | 76 390 o | 76 800 | 410 |
| `bug_history.json` | 9 816 o | 10 240 | 424 |
| `features_history.json` | 5 723 o | 10 240 | 4 517 |
| `docs/ROADMAP-BASCULE-IA.md` | 35 384 o | 35 840 | 456 |
| **`dossier-controles/specification.json`** | **65 915 o** | **66 560** | **645** |

**La spec a franchi son plafond DEUX fois dans ce seul lot, et a été compactée deux fois.** D'abord au report du raffinage (76 210 o → 65 507), puis à l'écriture du journal d'it4 (70 885 → 65 915). Ce qui est parti, dans l'ordre prescrit : les **13 décisions d'it3** puis les **11 d'it4** réduites à leur phrase d'arbitrage plus le renvoi vers leur revue · **3 questions tranchées** retirées (garder ouverte une question réglée est un mensonge d'état) · **6 décisions de cadrage** historiques raccourcies · les **entrées de journal d'it1, it2 et it3** ramenées à leurs choix et leurs écarts, sans le récit.

**49 décisions avant, 49 après. 4 entrées de journal.** Rien n'est perdu — tout est déplacé là où c'est lu au bon moment.

**Le couple `CLAUDE.md` + `WORKFLOW.md` reste au-dessus, et c'est délibéré** : les 374 octets sont un **artefact de fins de ligne**, pas du contenu. Le dépôt est en `core.autocrlf=true`, la sortie canonique de `git checkout` est en CRLF, et le même contenu mesure **45 974 o en LF**. Compacter de vraies règles pour payer des octets que personne n'a tapés serait strictement pire que le dépassement. *La dette de convention est écrite dans la revue d'it3, à payer au prochain commit `.md` seul.*

## `RETOUR-COMITÉ`

1. **TROIS affirmations fausses ont traversé le comité, toutes présentées comme mesurées, et DEUX venaient de l'orchestrateur** : la tension n° 2 du cadrage · le rayon de souffle chiffré en tests rouges · la conversion `<p>` donnée pour forcée. **Aucune n'a été arrêtée par le raisonnement** — les trois l'ont été parce que deux rôles sont allés **lire le registre et exécuter des sondes**. Le PM l'a formulé : il n'avait « aucun moyen de détecter » l'erreur, travaillant sur un fait donné comme mesuré. ***Un cadrage faux ne se corrige pas par le débat.***
2. **Le vrai risque n'était aucune des quatre tensions du cadrage** : un test existant épinglait **l'inverse exact** de l'itération. Leçon reconduite d'it3 : *le tour 1 lit le fichier qu'on modifie, le tour 2 lit ceux qui le consomment* — ici, c'est le tour 1 qui l'a vu, parce qu'on l'avait explicitement envoyé lire les suites.
3. **« Combien de tests rougissent » peut être la mauvaise question.** `jest` reste vert sur un type mésapparié pendant que `tsc` rougit. **La porte réelle d'un changement de signature est le compilateur**, et le fichier qui *consomme* la prop compte autant que ceux qui la passent.
4. **Deux rôles se sont cédé mutuellement le même point** — deuxième fois après it2. Quand cela arrive, **seule la position argumentée sur le fond doit l'emporter**, pas la politesse du dernier qui cède.
5. **Une question posée pour affaiblir une position peut la renforcer.** J'ai demandé à l'UX si son trailing survivait à ma correction ; elle a **changé de motif** et en a trouvé un meilleur, appuyé sur une mesure que personne n'avait faite. *Une objection dont le motif tombe ne meurt pas forcément : elle peut en trouver un vrai.*
7. **Une dette laissée VOLONTAIREMENT, et le motif compte autant que la dette.** Le tech-lead a relevé en revue de PR que `chaque ligne est un arret de tabulation` porte **un nom plus large que ses assertions** (forme KR-199) : il compte les boutons sur **toute la `<ul>`**, donc deux boutons dans une ligne et zéro dans une autre passeraient. **Il a demandé de NE PAS le corriger ici**, pour deux raisons : le trou est fermé de fait par `le titre affiche est la section emise`, qui boucle sur chaque ligne ; et y toucher **rouvrirait le critère 7 du plan signé** (« la SEULE assertion renversée »). À reprendre à it5, en une ligne : `lignes.forEach(l => expect(within(l).getAllByRole('button')).toHaveLength(1))`. *Refuser une amélioration juste parce qu'elle contredirait un critère signé est la bonne réponse — le critère se renégocie au raffinage suivant, pas en douce dans un lot.*

6. **Un agent qui mesure sur l'arbre partagé doit VÉRIFIER son revert**, pas l'annoncer. Un revert non effectif a cassé `tsc` au tour 1 ; la QA en mode B, elle, a vérifié `IDENTICAL` après sa sonde.
