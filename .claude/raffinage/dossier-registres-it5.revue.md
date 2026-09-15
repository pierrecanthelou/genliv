# Revue d'itération — `dossier-registres` · itération `5` *(dernière de la feature)*

> Plan : `.claude/raffinage/dossier-registres-it5.plan.md` (validé le 2026-08-19)
> Comité : **5 rôles** (pm-produit · tech-lead · ux-designer · qa · **narratif-ia**) — seul raffinage de la feature à 5
> Exécution : 2 lots séquentiels, **aucun worktree, aucune fusion** — `dev-contrat` puis `dev-lot`
> QA mode B : **8/8 critères VÉRIFIÉS** · Porte : **81 suites / 1173 tests verts**

## En une ligne

L'auteur peut désormais tenir le registre des climats de son aventure — leur nom, leur durée en pas d'horloge, la phrase que le narrateur lira tant qu'ils durent — ce qui referme la dernière racine du dossier et le dernier état vide de l'éditeur.

## Critères — chacun avec sa preuve

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | Non-régression : dossier de référence accepté, `effets_regles` survit au round-trip comme liste vide, `CIBLE_CLIMAT_EXCLUE` inchangée | **VÉRIFIÉ** | `roundtrip.test.ts:115` (`toEqual([])`) et `suffisance.test.ts:266` (`toEqual([CIBLE_CLIMAT_EXCLUE])`) — **non modifiés**, exécutés verts |
| 2 | `duree` entier borné : sous `DUREE_MIN`, décimal, texte, booléen, `null` refusés ; absence calme | **VÉRIFIÉ** | `validate.test.ts:1401-1454`, boucle générique sur `CHAMPS_ENTIERS` — `[min-1,-3,2.5,"min",true,null]` → `valeur-hors-enumeration` ; absence → `errors=[]`, `ok=true` |
| 3 | Audience de `manifestation` = `ia`, **assertion de VALEUR** (KR-174) | **VÉRIFIÉ, discriminance éprouvée** | `couverture.test.ts` — sonde QA : `'ia'` → `'auteur'` dans `destinations.ts` fait **rougir** le test ; restauré |
| 4 | Budget 20 mots : avertit sans bloquer | **VÉRIFIÉ** | `validate.test.ts:~2296-2373` — 4 états (absent / 20 / 21 / corruption chaîne→nombre) ; à 21 mots `warnings=['texte-trop-long']` **avec `errors=[]` et `ok=true`** assertés |
| 5 | Aucun `EditeurEffets` sur `FicheClimat` | **VÉRIFIÉ, discriminance éprouvée** | `panneauConditions.test.tsx:229-239` — porte sur le **RENDU** (`queryByText`, `queryByRole('combobox',{name:'EFFET'})`), jamais sur la source. Sonde QA : injection d'un `<button>+ Ajouter un effet…</button>` → **rouge** ; restauré |
| 6 | Un `effets_regles` non vide ressort intact après édition des trois champs | **VÉRIFIÉ** | `panneauConditions.test.tsx:241-271` — seed non vide hors UI, édition **réelle des trois** champs, `apres.effets_regles` `toEqual([effet])` sur le document persisté |
| 7 | Ajout à commit immédiat `{id, effets_regles: []}` + aucune valeur fabriquée au montage | **VÉRIFIÉ, deux propriétés prouvées séparément** | (a) `panneauConditions.test.tsx:108-126` ; (b) `:128-144` — spy posé **ligne 136, après le seed (131) et avant le rendu (137)** : placement conforme, pas une sonde morte (KR-199a) |
| 8 | Avertissement de budget rendu, région `role="status"` distincte du bandeau de refus | **VÉRIFIÉ** | `panneauConditions.test.tsx` — `getAllByRole`/`queryAllByRole` partout, aucun `getByRole('status')` nu (grep) ; + test d'état calme ajouté après l'intégration (`queryAllByRole('status')` → 0) |

## Diff par lot — comparé à la liste du plan

**Lot 1 `climats-contrat` (`contrat`, seul et en premier)** — 7 fichiers, conforme au § 5 :
`types.ts` (+88) · `tables.ts` (+46) · `destinations.ts` (+33) · `validate.test.ts` (+147) · `couverture.test.ts` (+154) · `dossier-minimal.json` (+10) · `dossier-reference.json` (+10).

**Lot 2 `climats-ecran`** — 5 fichiers touchés sur 6 listés :
`PanneauConditions.tsx` (N, 296 l.) · `FicheClimat.tsx` (N, 164 l.) · `panneauConditions.test.tsx` (N, 13 tests) · `index.ts` (+1) · `App.tsx` (+9).

**Bornes tenues, vérifiées par l'intégrateur puis par la QA** : zéro ligne dans `validate.ts`, `identifiers.ts`, `sections.ts`, `amorce.ts`, `deltas.ts`, `brain/index.ts` ; `roundtrip.test.ts`, `suffisance.test.ts`, `importDossier.test.tsx`, `deltas.test.ts` non modifiés et verts ; `EditeurEffets.tsx` absent du lot 2 et `DELTAS` jamais nommé dans les fichiers neufs.

**Le ricochet redouté ne s'est pas produit** : `importDossier.test.tsx:114` garde son `'5 anomalies'` littéral. Les trois précédents (dossier-fiches it5, n° 6 it1, n° 6 it3) venaient tous d'une référence vers l'espace `pnj` ; ni un entier ni une prose libre n'en produit. **Constaté par exécution, pas présumé** — c'était une borne explicite du plan.

## Ce qui a été refusé — et pourquoi *(ce qu'un diff ne dit pas)*

- **`EditeurEffets` sur la fiche Climat — REJETÉ.** C'est le refus le plus instructif de l'itération, parce que **l'argument du cadrage était faux et que c'est l'UX, seule contre quatre, qui l'a démontré** : KR-208 n'interdit qu'une opération à opérande entier *neuve*, pas l'usage des quatre existantes. Le tech-lead et `narratif-ia` l'ont tous deux concédé au tour 2. La conclusion tient, mais sur deux motifs trouvés seulement au tour 2 : (a) **aucun instant d'application** — `Climat` ne porte ni `declencheur_texte` ni `declencheur_expr`, et `climat_actif` est un état de session (KR-207) ; (b) **aucune idempotence** — rien n'enregistre « déjà appliqué », un climat qui revient ré-applique. Et le besoin exprimé (« la tempête révèle un indice enfoui ») est **déjà servi** par un Événement, qui a un instant daté. *Leçon : un refus juste pour un motif faux reste un refus fragile — il aurait cédé au premier contradicteur si personne n'était allé chercher le vrai.*
- **L'état vide non éditable de la section EFFETS DE RÈGLE — REJETÉ**, arbitré par l'UX **contre** `narratif-ia`, sur le terrain de l'UX : la règle des états vides exige qu'un vide *invite l'action suivante* ; une carte sans geste derrière elle est une promesse affichée sans bouton, l'idiome cassé, pire qu'une absence. Rien ne se rend.
- **`duree` en prose — REJETÉ** au profit d'un entier. La collision KR-198 avec `plan_actions[].duree` **s'éteint** au lieu d'être contournée (même mot, même sens), l'extinction du climat garde un propriétaire de code, et l'entier est borné gratuitement par la boucle `POSEURS_D_ENTIER` là où la prose n'aurait eu aucun instrument (`LIBRES` n'arbitre aucune forme).
- **« La liste de fichiers du lot » comme preuve d'absence — REJETÉE** (QA, tour 2, corrigeant une formulation que `narratif-ia` proposait et que le tech-lead avait signée) : ce n'est pas un instrument rejouable après le merge. Le critère a été scindé en deux niveaux, plus un troisième critère de non-corruption que ni l'un ni l'autre ne couvrait.
- **`PanneauClimats.tsx` / eyebrow `CLIMATS` — REJETÉ.** L'UX a mesuré et s'est corrigée elle-même plus largement que le tech-lead ne le demandait : `EYEBROW_SECTION` égale partout le titre de `sections.ts`, y compris le contre-exemple décisif `JALONS & FINS`, pluriel d'aucune collection.

## Ce qui a été reporté — et où

- **Les 3 dettes de test héritées d'it3/it4** → `implementation.open_questions`, avec propriétaire nommé : (a) `Select` EFFET à `onChange` no-op → prochain lot touchant `brain/components/Select.tsx` ; (b) retour de focus après retrait + (c) axe inter-fiche du jeton KR-216 (jumeau non corrigé dans `FicheQuete.tsx:253`) → **ensemble**, une 6ᵉ itération de durcissement si le retrait est un jour mandaté. Aucune n'était fermable sans sortir des bornes de lot. **Pas de report vers `dossier-controles` (n° 7)**, qui ne touche aucun de ces fichiers.
- **Le § 09 du plan-cible (« effets chiffrés sur les règles ») reste NON TENU à la fin du Temps 1** → `open_questions`. Cette itération referme la *racine* `conditions`, pas ce paragraphe : `Climat.effets_regles` est un `Delta[]` que rien ne peut remplir. Relevé de raffinage à ne pas perdre : `docs/REGLES-DU-JEU.md` ne contient **aucune** section sur les modificateurs ambiants — rien n'y fonde aujourd'hui un effet de climat, ce qui confirme le sens d'écriture doc → table dorée → code (KR-130/208).
- **Le retrait d'un climat** reste hors périmètre, même statut qu'it1–it4.

## Écarts assumés

| Écart | Lot | Avis |
|---|---|---|
| `POSEURS_D_ENTIER` change de forme (`Record<string, fn>` → `Record<string, {poser, ou}>`) | 1 | **Sans conséquence, plutôt un renforcement** — vérifié par l'intégrateur et la QA : `Object.keys()` reste le contrat du test du § 7, et l'assertion `location` passe d'un littéral partagé (qui aurait été *faux* pour un climat) à une valeur résolue par chemin. Aucune assertion relâchée. |
| Deux tests de plus que le § 7 (test-grep du contrat d'injection ; pin du compte de dispenses à 18) | 1 | **Sans conséquence, strictement additif** — motivé par KR-169 (une propriété affirmée en docstring sans test est une intention), précédents `Relation.secret`/`Caractere.cede_si`. Les deux éprouvés discriminants par la QA. |
| Discriminant sur `effets_regles` **dérivé** de `CHEMINS_DE_DELTAS`, pas littéral | 1 | **Sans conséquence** — un littéral fait rougir le test existant « aucune seconde liste de chemins de delta ». Constaté, pas supposé. |
| `styles.ts` listé `R` au plan mais **non touché** | 2 | **Sans conséquence** — tous les tokens existaient déjà. **Deuxième itération consécutive** avec cet écart exact (déjà à it4) → voir `RETOUR-COMITÉ`. |
| Aucun hook local d'écriture créé | 2 | **Sans conséquence** — `Climat` n'a aucun `CHAMPS_REQUIS`, donc aucun brouillon différé (contrairement à it2). |
| Un test ajouté après l'intégration (état calme, `queryAllByRole('status')` → 0) | 2 | Gap relevé par l'**intégrateur**, fermé par l'orchestrateur dans un fichier déjà possédé par le lot 2. Écrit comme **test dédié** plutôt que glissé sous un nom existant (KR-199). |

Aucun `BLOCAGE` remonté par aucun ouvrier.

## Porte qualité

| Instrument | Résultat |
|---|---|
| `npm run format` | vert |
| `tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur** (1 warning **préexistant** hors périmètre : `src/player/components/CharacterCreationScreen.tsx:35`) |
| `npm test` | **81 suites / 1173 tests verts** (80/1156 avant l'itération) |
| `npm run test:mutation` | **non applicable** — confirmé **par le diff**, pas supposé : aucun de `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts` n'y apparaît |
| Suites it1–it4 (`panneauIndices`, `panneauJalonsFins`, `panneauQuetes`, `panneauEvenements`) | inchangées et vertes |

## Ce que personne n'a pu vérifier

1. **La consommation réelle de `Climat.duree` par la n° 14 (`moteur-horloge`)** — le plan le déclarait « non vérifiable en l'état » ; la QA l'a **confirmé par grep** plutôt que contourné : aucun code du dépôt ne lit `climat.duree` aujourd'hui. L'itération pose la donnée, sa borne et son audience — jamais son consommateur.
2. **La coexistence simultanée** des deux régions `role="status"` (avertissement de budget + bandeau de refus) : la garde `getAllByRole` est systématique, donc rien ne casserait, mais aucun scénario ne produit réellement cet état. Gap mineur, hérité du motif de la feature.
3. **L'allumage et l'extinction de `horloge.climat_actif`** : état de session (KR-207), explicitement non spécifié par cette itération — propriété n° 9 / n° 14.

## `RETOUR-COMITÉ` — ce que ce découpage a appris

1. **Convoquer `narratif-ia` a payé, et le critère de convocation mérite d'être élargi.** Les quatre itérations précédentes s'en étaient passées au motif « schéma + écran ». Ici, c'est lui qui a fourni le **motif réel** du refus d'`EditeurEffets` (absence d'instant, absence d'idempotence) après que celui du cadrage se soit révélé faux, **et** la seule proposition `INNOVATION`. Critère proposé pour la suite : le convoquer dès qu'une itération **pose ou déplace une ligne d'audience** (`destinations.ts`), pas seulement quand elle touche un prompt ou le moteur.
2. **Un motif faux peut soutenir une conclusion juste pendant quatre itérations sans que personne ne le voie.** L'argument « KR-208 interdit un éditeur d'effets sur Climat » était écrit au cadrage, recopié dans le `design_contract`, et faux. Il n'est tombé que parce qu'un rôle minoritaire a lu le KR au lieu de le citer. Même famille que KR-176 (un seuil sans source dont la répétition crée l'autorité) : **la citation d'un KR n'est pas sa lecture**.
3. **Une contradiction interne à la spec a été trouvée par la lecture, pas par un test** — `acceptance_criteria[6]` (« éditable ») contredisait `design_contract.editeur_effets` (« n'en a pas besoin ») depuis le cadrage. Aucun instrument ne compare deux sections d'un même document. C'est la 2ᵉ occurrence de BUG-069 dans ce dépôt ; la parade reste la revue, et elle a fonctionné — mais au raffinage, pas à la livraison.
4. **`styles.ts` listé `R` et non touché, deux itérations de suite.** Ce n'est plus un accident : le contrat de design est désormais assez stable pour que les tokens existent tous. Proposition pour les futurs plans de cette famille : lister `styles.ts` comme **`R` conditionnel** avec la mention explicite « propriétaire exclusif du lot, peut rester intact », ce que le tech-lead avait d'ailleurs écrit dans son annexe sans que le § 5 le reprenne.
5. **Le découpage n'a pas fauté** : deux lots séquentiels, un seul contrat, aucun blocage, aucune collision, aucun besoin de communication entre ouvriers. Sur un lot unique après le contrat, le mode « sans worktree » a de nouveau été le bon choix — et l'exécution en **séquence** intégrateur → QA a évité le mode de panne de KR-172.
