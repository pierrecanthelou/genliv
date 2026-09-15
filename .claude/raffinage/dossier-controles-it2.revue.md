# Revue d'itération — `dossier-controles` · itération 2

> Plan : `.claude/raffinage/dossier-controles-it2.plan.md` (validé le 2026-09-15)
> Exécution : 2 lots séquentiels — `dev-contrat` puis `dev-lot`. Aucun worktree, aucune fusion.
> Vérification : `qa` en **mode B**, contexte neuf — verdict `CONFORME AVEC RÉSERVES`, deux réserves, **toutes deux dans le raisonnement écrit du plan, aucune dans le code**.

## En une ligne

**L'auteur repère, depuis la navigation, quelle section porte une anomalie** — sans ouvrir le panneau Contrôles, pendant qu'il édite autre chose.

## Les huit critères

| # | Statut | Preuve |
|---|---|---|
| 1 | **VÉRIFIÉ** | `pastilles.test.ts › les trois niveaux rendent leur mot et leur ton` — balayage depuis un `Record` total, plus une sonde reliant la table au linter vivant (tout niveau qu'une règle peut émettre a son mot). |
| 2 | **VÉRIFIÉ** | `› les neuf etats du badge de section` — les sept états appelables comparés `{texte, tone}` en bloc ; l'état 8 (le pire seul, jamais une liste) et l'état 9 (aucune entrée `controles` dans `SECTIONS`) assertés dans le même test. |
| 3 | **VÉRIFIÉ** | `› porteur unique des trois mots de niveau dans src` (**égalité**, pas inclusion) et `› SANS_COMPTE ne sort pas du baril`. Recontrôlés indépendamment par la QA et par l'orchestrateur. |
| 4 | **VÉRIFIÉ** | `dossierEditorScreen.test.tsx › rend les 10 ListRow…` (table `BADGES_DOSSIER_NEUF` écrite à la main) + `› un seul badge par ligne` (**égalité sur `textContent`**, jamais `toHaveTextContent`, BUG-083). |
| 5 | **VÉRIFIÉ** *(renforcé en revue de PR)* | `› une section saine ne porte aucun mot de niveau` — assertion négative sur le **`textContent`** de la ligne, sur les huit lignes calmes. La première version employait `queryByText`, une correspondance **exacte** : elle serait restée verte sur la forme fusionnée « 0 fiche · BLOQUANT », c'est-à-dire aveugle à la forme même que cette itération crée (KR-199). |
| 6 | **VÉRIFIÉ** | `sectionNav.test.tsx › lit niveauxParSection et non le compte manquant` — entrée fabriquée, Personnages rend `2 fiches · BLOQUANT`, Canon et Départ restent muets **malgré leur `—`**. |
| 7 | **VÉRIFIÉ** | `› le badge suit une reecriture sans remontage` — Départ perd `BLOQUANT` **en gardant son `—`**, Canon reste `ALERTE`. Deux sections au compte identique, deux badges différents. |
| 8 | **VÉRIFIÉ** | Contrôlé **sur le diff, pas sur la couleur** : la sonde `KR-013` et les deux tests de l'entrée « Contrôles » n'apparaissent dans aucun hunk ; `panneauControles.test.tsx` à **diff nul**. |

## Diff par lot

| Lot | Fichiers livrés | Conforme |
|---|---|---|
| **L1** `contrat` | `brain/dossier/pastilles.ts` + son test (N) · `sections.ts` (R, une ligne) · `brain/index.ts` (R, une ligne) · `controles.ts` (R, JSDoc seul) · `ListeControles.tsx` (R) · `panneauControles.test.tsx` (**diff nul**) | oui |
| **L2** | `SectionNav.tsx` (R) · `DossierEditorScreen.tsx` (R) · `dossierEditorScreen.test.tsx` (R) · `sectionNav.test.tsx` (N) | oui |

**Aucun fichier hors liste.** `IssueList.tsx`, `ListRow.tsx`, `App.tsx` et les dix entrées de `SECTIONS` sont intacts.

## Ce qui a été refusé — et qu'un relecteur ne peut pas deviner du diff

- **La substitution** (le mot remplaçant toujours le compte) — retirée **par son auteur**, le tech-lead : KR-218 dit « toujours fusionné avec le compte », et elle aurait effacé « 6 fiches » aux états que produit it3.
- **La teinte seule** (texte inchangé, seule la couleur bouge) — retirée **par son auteur**, la QA, sur deux motifs de son propre terrain : `info → muted` **est** la teinte du calme, donc le critère aurait été *faux* et non mal écrit ; et l'instrument est cassé. Plus un veto PM sur la valeur : deux niveaux sur trois deviendraient illisibles.
- **Le composant partagé `PastilleNiveau`** — retiré **par son auteur** : les deux surfaces partagent la **décision** (mot + ton), pas le **balisage** ; un composant commun aurait exigé une prop `compte`, c'est-à-dire son propre veto V5.
- **Le compte agrégé par niveau** (« 2 bloquants ») — trois surfaces `brain/` pour un badge, un seul appelant, et ce n'est pas la démo (« **quelle** section », pas combien). La forme admissible s'il revenait est archivée dans la note de tour 1 du tech-lead.
- **Une prop optionnelle** sur `SectionNav` — « deux chemins dont le testé n'est pas le livré, c'est pire que pas de prop du tout ».
- **Un badge sur l'entrée « Contrôles »** — hors périmètre du goal, symétrique au refus déjà acté du bandeau `jouable`.

## Ce qui a été reporté

- **Les états « compte réel + niveau » sur un dossier réel** → it3 : aucune règle d'it1 ni d'it2 n'atteint une section comptée.
- **La largeur rendue** → passe visuelle : jsdom ne calcule aucun layout ; la mesure de l'UX (≈176 px pour 208 px disponibles) est arithmétique, pas observée.

## Écarts assumés

- **`L1`, lot contrat, emporte un fichier de feature** (`ListeControles.tsx`) : la sonde de porteur unique ne pouvait pas être verte à sa porte tant que la table `PASTILLES` survivait ailleurs. Les deux alternatives étaient un fichier partagé entre deux lots (interdit) ou une garde desserrée à jamais.
- **Deux commentaires corrigés au-delà de la lettre du lot** par `dev-contrat` (`brain/index.ts` et `ListeControles.tsx`), chacun parce que sa prose devenait fausse du fait du lot. Même motif que la correction de JSDoc explicitement commandée sur `controles.ts`.

## Les deux réserves de la QA — toutes deux dans le raisonnement, aucune dans le code

**Elles portent le même défaut, et c'est la leçon de l'itération : une affirmation sur ce qu'un test *ferait* a été raisonnée au lieu d'être exécutée.** Les deux sont consignées en **BUG-084**.

1. **« La sonde de teinte serait restée verte sans amendement » — FAUX.** Elle aurait rougi : son assertion **positive** `expect(source).toMatch(/tone=["']muted["']/)` ne pouvait pas survivre au remplacement du littéral par `tone={badge.tone}`. Le motif a été posé par le tech-lead au tour 1, **maintenu** au tour 2, recopié **deux fois** dans le plan par l'orchestrateur, et a traversé la porte mécanique — personne n'a lancé l'ancien test contre le nouveau fichier. **La réécriture reste juste** (la nouvelle garde interdit strictement plus), mais pour un autre motif : l'ancienne sonde aurait échoué **en accusant la mauvaise cause** — « le badge muted a disparu » au lieu de « la vue décide d'une teinte » — et un ouvrier l'aurait « réparée » en rétablissant un littéral.
2. **« Les états 4, 6 et 7 sont prouvés au contrat ET au composant » — imprécis.** Seul l'état **4** l'est au composant ; les états **6 et 7** ne sont prouvés **qu'au contrat**, le test de composant ne fabriquant que le niveau `bloquant`. Pas un trou — le critère 2 dit lui-même « c'est ici, et seulement ici » — mais l'imprécision allait dans le sens qui **surestime** la couverture.

*(Corrigées dans le plan, § 7 — puis, la revue de PR ayant montré que la correction n'avait PAS atteint les deux sites où l'affirmation fausse était encore ÉCRITE, dans le JSDoc de la sonde réécrite — **seul site en source** — et dans une `open_question` qui contredisait `deviations_from_plan` du même fichier. C'est la classe BUG-080 reproduite dans le lot même qui en fait sa leçon : on ne corrige pas « les endroits auxquels on pense », on **grep la formule renversée** et on traite la liste.)*

## Porte qualité

| | |
|---|---|
| `tsc --noEmit` | **vert**, 0 erreur |
| ESLint | **vert**, 0 erreur (1 avertissement pré-existant dans `src/player/`, hors diff) |
| Jest | **85 suites / 1202 tests verts** — avant l'itération : 83 / 1193 ; après le lot contrat seul : 84 / 1198 |
| `test:mutation` | **sans objet** — aucun fichier du diff n'appartient au périmètre muté, vérifié |

## Budget de contexte — relevé (étape 4 du cycle, `wc -c`, 1 kio = 1024 o)

| Fichier | Mesuré | Plafond | Marge |
|---|---:|---:|---:|
| `CLAUDE.md` + `docs/WORKFLOW.md` | 45 992 | 46 080 | 88 o |
| `code-knowledge.json` | 76 390 | 76 800 | 410 o |
| `bug_history.json` | 8 549 | 10 240 | ~1,65 kio |
| `features_history.json` | 5 723 | 10 240 | ~4,41 kio |
| `docs/ROADMAP-BASCULE-IA.md` | 35 704 | 35 840 | 136 o |
| `dossier-controles/specification.json` | 52 126 | 66 560 | ~14 kio |

**Aucun franchissement, aucune compaction due.** `code-knowledge.json` n'a pas bougé : la leçon de cette itération porte sur **la manière dont les plans sont écrits**, pas sur un invariant de code — son domicile est la skill `raffinage-iteration`, comme celle de BUG-082 à l'itération précédente. Deux fichiers restent serrés et le seront au prochain lot : le couple toujours-chargé (88 o) et le roadmap (136 o).

## Non vérifié par personne

- **La teinte, à tout niveau de rendu. Instrument CASSÉ, pas absent — mesuré trois fois** (par la QA au raffinage, par l'orchestrateur, puis à nouveau par la QA en mode B) : `toHaveStyle({ color: 'var(--bad)' })` **passe sur un `Badge tone="muted"`**, `element.style.color` valant `''`. Le CSSOM de jsdom rejette les jetons `var()` sur `color`, et les deux côtés du matcher collapsent. **Conséquence tenue par cette itération** : le `tone` est prouvé **au contrat** (fonction pure rendant `'bad'`), la vue est gardée par une **sonde de source**, et aucun critère ne s'appuie sur une couleur rendue.
- **Les états 6 et 7 au composant** — prouvés au contrat seulement (voir réserve 2).
- **La largeur rendue** de `3 fiches · BLOQUANT` dans 280 px — arithmétique, jamais observée.
- **L'ordre de tabulation** entre les dix lignes recolorées.
- **Le second appel de `controlerDossier` par rendu d'écran** (nav + panneau) : pur, borné, non mesuré.

## `RETOUR-COMITÉ`

1. **Une affirmation sur la couleur d'un test se MESURE, elle ne se déduit pas.** Trois fois dans cette feature, un rôle a affirmé ce qu'un test ferait sans l'exécuter : la « faisabilité vérifiée » de `toHaveStyle` (qui passait parce qu'elle passe toujours), et les deux réserves ci-dessus. Le coût est un `jest` ciblé ; le coût de l'erreur est un motif faux qui survit à deux tours de comité, à une porte mécanique et à une revue. **Règle** : tout plan qui écrit « ce test resterait vert » ou « ce test rougirait » rejoue le test contre l'état cible avant de l'écrire. C'est la méthode que la QA a employée pour trouver les deux — rejouer le corps de l'ancien test contre le fichier livré.
2. **Le comité s'est corrigé lui-même sur les trois désaccords structurants**, et chaque retrait est venu de l'auteur de la position, pas de son contradicteur : le tech-lead a retiré sa substitution *et* son composant partagé, la QA a retiré sa variante « teinte seule ». Un tour 2 où chacun défend sa position de tour 1 n'aurait rien produit de tout cela.
3. **Deux rôles se sont croisés sur la prop** — le tech-lead l'a concédée pendant que la QA retirait son exigence. C'est un cas que le rituel ne prévoit pas : les deux notes de tour 2 sont écrites sans se voir, et la convergence peut donc se manquer. L'orchestrateur a tranché (la prop), mais le signal vaut d'être noté : quand deux rôles cèdent l'un à l'autre, aucun des deux ne porte plus la position retenue.
4. **La mesure qui a le plus servi ne venait d'aucun rôle mais du fichier de test lu en entier.** `COMPTES_DOSSIER_NEUF` a été trouvée par le tech-lead au tour 1 parce qu'il a ouvert `dossierEditorScreen.test.tsx`, que mon cadrage n'avait pas lu. **Un cadrage qui affirme « un seul test bouge » doit avoir lu le fichier de test, pas seulement le fichier de code.**
5. **Pour it3** : elle rouvrira `SectionNav.tsx` et `DossierEditorScreen.tsx` (le clic d'une ligne vers sa section, reporté deux fois). Elle consommera `pastilles.ts` **tel quel** — les cinq règles de registre n'ajoutent aucune forme, seulement des entrées au registre `CONTROLES`. Aucun second lot contrat n'est dû de ce fait.
