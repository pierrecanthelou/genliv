# Revue d'itération — `dossier-fiches` · itération 3

> Plan : `.claude/raffinage/dossier-fiches-it3.plan.md` (validé le 2026-08-13)
> Exécution : **séquentielle**, 2 lots — `dev-contrat` seul et en premier, puis `dev-lot`
> Livré le 2026-08-13 · porte qualité verte · **67 suites / 940 tests**

## En une ligne

**L'auteur peut régler les 8 caractéristiques d'un personnage** — et voir son PV, qui n'est jamais saisi ni stocké, se recalculer sous ses yeux.

## Critères d'acceptation

| # | Verdict | Preuve |
|---|---|---|
| 1 | **VÉRIFIÉ** | `fichePersonnage.test.tsx — "bloc stats absent : seule la CTA, aucune ecriture au montage"` : 1 bouton, 0 Stepper, 0 ligne PV, `update` jamais appelé — **spy posé avant le rendu** (corrigé, voir BUG-068), doublé de `not.toHaveProperty('stats')` qui relit l'état persisté. |
| 2 | **VÉRIFIÉ** | `fichePersonnage.test.tsx — "le clic sur regler ecrit les 8 cles en un seul commit"` : `toHaveBeenCalledTimes(1)`, 8 clés à `CARACTERISTIQUE_MIN`, la grille remplace le CTA, PV `3`, focus posé sur « Diminuer FORCE (FO) ». |
| 3 | **VÉRIFIÉ** | `panneauPersonnages.test.tsx — "Force se clampe aux deux bornes 1 et 12"` : 8× Diminuer → reste à 1, 20× Augmenter → plafonne à 12, **affiché et écrit**. Le clamp est structurel : `Stepper` borne *avant* d'appeler `onChange`, aucune valeur hors bornes ne transite par le handler. |
| 4 | **VÉRIFIÉ** | `fichePersonnage.test.tsx — "PV derive exactement de FO+AG+EN, jamais stocke"` (FO 7 / AG 9 / EN 6 → `22`, aucune clé `pv`) **+** `pvDerive.test.ts` (structurel, 99 fichiers balayés) dont l'assertion discriminante — `FichePersonnage.tsx` importe `maxPV` — empêche le vert par vacuité. |
| 5 | **VÉRIFIÉ** | `panneauPersonnages.test.tsx — "lecture au montage sur DEUX personnages, sans interaction"` : A (PV 22) lu au montage sans sélection, puis B (PV 17) après **clic de ligne**. **Les 8** caractéristiques vérifiées pour A et pour B (balayage de `CHARACTERISTIC_VALUES`, jamais 8 littéraux) — élargi de 3 à 8 après la QA (BUG-068). Aucune valeur `1`, aucun PV `3` semé. |
| 6 | **VÉRIFIÉ** | `couverture.test.ts — "les 8 caracs sont moteur et instanciees dans les DEUX fixtures"` : audience par chemin, exhaustivité, dérivation non vide, cohérence avec `ENUMERES_FERMES`, absence de ligne porteuse. Sonde : basculer les 8 en `ia` → rouge **nommant** `monde.personnages[].stats.FO → moteur / reçu ia`. |
| 7 | **VÉRIFIÉ** | `validate.test.ts`, 6 tests neufs : `0` / `13` / `2.5` / `"3"` refusés, bloc à 1-7 clés refusé, bloc à 1 clé refusé, bloc absent **calme**, 8×12 valeurs valides acceptées. Non-régression de la référence tenue par `couverture.test.ts` (voir écart n° 1). |
| 8 | **VÉRIFIÉ** | `git diff --stat -- src/brain/characteristics.ts` rend **vide** (mesuré trois fois : ouvrier, intégrateur, QA). `npm run test:mutation` **non requis**, `thresholds.break` reste à **80**. |

## Diff par lot

**Lot 1 `contrat-caracteristiques`** (`dev-contrat`, seul et en premier) — **9 fichiers, exactement ceux du plan** :
`docs/REGLES-DU-JEU.md` (+2 l., § 1 seul, **écrit en premier**) · `src/brain/dossier/types.ts` · `tables.ts` · `destinations.ts` · `__fixtures__/dossier-minimal.json` · `__fixtures__/dossier-reference.json` · `couverture.test.ts` · `validate.test.ts` · `src/brain/index.ts`.

**Lot 2 `bloc-caracteristiques`** (`dev-lot`, contrat figé) — **5 fichiers, exactement ceux du plan** :
`components/FichePersonnage.tsx` · `components/PanneauPersonnages.tsx` · `tests/panneauPersonnages.test.tsx` · `tests/fichePersonnage.test.tsx` (N) · `tests/pvDerive.test.ts` (N).

**Hors diff, vérifié** : `validate.ts` (0 ligne — les 8 bornes entrent par la boucle générique), `characteristics.ts`, `suffisance.test.ts`, `sections.ts`, `amorce.ts`, `read.ts`, `roundtrip.test.ts`, `rules.golden.test.ts`, `brain/components/Stepper.tsx`, `LIBRES`, `SANS_DESTINATION`. **Aucun incident de propriété** : 14 fichiers attendus, 14 touchés.

## Ce qui a été refusé

- **`Partial<Record<…>>`** (position tech-lead au tour 2) → le schéma est **TOTAL quand présent**. Deux motifs, tous deux hors du terrain où le tech-lead argumentait : un bloc partiel crée un état où le moteur **ne peut pas résoudre un jet**, dont la troisième issue est « laisser le modèle improviser » ; et sur un `schema: 1` sans migration, desserrer TOTAL→Partial est gratuit alors que resserrer est impossible.
- **`Stepper` élargi à `value: number | undefined`** (UX, retirée par elle-même) → sous le schéma total, `Stepper` n'est jamais monté quand `stats` est absent. Zéro extension, `Stepper.tsx` et `ObjectEditor.tsx` hors lot. Le `Stepper.test.tsx` neuf que la QA réclamait tombe avec.
- **`CHARACTERISTIC_MIN` dans `characteristics.ts`** (PM) → fichier sous score de mutation : y toucher déclenche le run **et** le cliquet `break` 80 → 85, qu'une mesure à 81,40 % ne paie pas pour une constante d'une ligne.
- **Toute table générique « Record à clés fixes »** → un `Object.fromEntries(REGISTRE.map(…))` **étalé au site**, une fois par itération. Deux étalements de trois lignes valent mieux qu'une abstraction à deux appelants dont le rayon d'explosion est le garde d'audience du schéma.
- **Une ligne de destination porteuse `monde.personnages[].stats`** (veto tech-lead) → `feuillesDeLaFixture` ne rend jamais un objet non vide comme feuille : la ligne serait **morte le jour où elle est écrite**. Personne ne l'a proposée ; le veto n'a rien bloqué.
- **Un bandeau de refus pour ce bloc** → le clamp rend l'erreur inatteignable. On ne construit pas un bandeau qui ne peut jamais s'allumer (doctrine posée à it1, réemployée ici).
- **L'extraction `hooks/useEcriturePersonnages.ts`** → un seul appelant aujourd'hui ; déclencheur **daté it4**, quand `plan_actions[]` apportera une seconde famille de handlers.

## Ce qui a été reporté

| Question | Destination |
|---|---|
| **La suffisance** — « un personnage qui se bat doit-il avoir ses 3 caracs ? » | **n° 9 `moteur-dossier`** — question de suffisance (linter d'aventure / état du héros en session), pas de typage : la trancher dans le schéma reviendrait à rendre `stats` requis, ce que KR-191 interdit. |
| **Le libellé narratif dérivé du chiffre** (« FO élevée ») | **n° 10** — entrée `open_questions` **élargie** aux deux occurrences (caracs it3, curseurs it6), jamais dupliquée. |
| **`tier`** | **n° 13 `moteur-combat`** — aucun consommateur avant lui. |
| **`statut:'absent'` affiché différemment selon les panneaux** | **it4** — it3 n'ouvre aucun chemin de refus, donc ne peut rien y prouver. |
| **Jurisprudence it6** — `caractere.curseurs` suivra la même **forme**, sans **mécanisme** partagé | écrite dès maintenant dans `resolved_decisions` pour qu'it6 ne rejoue pas le débat. Motif **différent** : un curseur manquant ne rend aucun jet irrésoluble, ce qu'il casse est en aval, chez l'assembleur n° 10. |

## Écarts assumés

1. **Le § 7 du plan attribue à `validate.test.ts` le test « le dossier de reference ne produit ni erreur ni avertissement »** — il vit dans `couverture.test.ts`. Il est inchangé et vert avec les fixtures étendues. Imprecision du plan, pas défaut de code.
2. **`docs/REGLES-DU-JEU.md` n'est pas sous Prettier** (`npm run format` ne cible que `src/**`) : un premier passage avait reformaté 111/96 lignes de tableaux. Annulé, seul le paragraphe est au diff (**+2 lignes**).
3. ~~Le style du CTA répliqué localement~~ — **fermé à la revue de PR** : `components/styles.ts` neuf, `boutonPointilleStyle` importé par les deux composants. Le motif de la duplication (un import de valeur en sens inverse ferait un vrai cycle) était exact, mais la troisième issue n'avait pas été essayée.
4. ~~Le focus post-CTA par deux `useRef` + deux `useEffect`~~ — **fermé à la revue de PR** : la garde tenait par l'**ordre de déclaration** des deux effets, que ni le linter ni un test ne voient. L'intention porte désormais l'identité du personnage — un ref, un effet. L'usage reste impératif (focus DOM), jamais un miroir d'état (KR-013/113).
5. **`FichePersonnage.tsx` franchit le signal KR-112** (317 → **456** l.) — franchissement qu'**aucune ligne du plan n'avait daté**, seul `PanneauPersonnages.tsx` étant suivi. Non traité ici : l'extraction est datée it4, et deux extractions à un seul appelant seraient la dette habituelle du dépôt. **Dette datée it4**, consignée, pas passée sous silence.
6. **Trois plafonds de budget de contexte franchis, compactés dans ce lot** (voir plus bas).

**Aucun `BLOCAGE`.** Aucun message relayé entre agents — le découpage n'en a pas demandé.

## Défaut trouvé et corrigé avant livraison

**BUG-068** (`minor`) — deux tests d'it3 promettaient dans leur **nom** plus que leurs assertions ne prouvaient : un `jest.spyOn` posé **après** le rendu qu'il observe (mort ; c'est sa voisine qui tenait le critère), et « les 8 Stepper » prouvé sur **3**, l'échantillon **recouvrant** le PV — ce qui laissait DX/IN/IG/SE sans aucune preuve de lecture. Trouvés par la QA en mode B sur un lot déjà vert, à porte verte et compte rendu d'ouvrier les listant comme preuves. Aucun changement de code de production. **3ᵉ occurrence de la classe** (BUG-064, BUG-065) → frappée en **KR-199**.

Détail de sonde qui vaut d'être gardé : pour prouver que c'est bien le **spy** qui rougit et non l'assertion voisine, il a fallu **inverser temporairement l'ordre des deux assertions**. Sans cette inversion, la sonde validait la voisine et laissait la garde nommée sans preuve — le mode de panne exact qu'elle était censée fermer.

## Revue de PR — `REQUEST_CHANGES` puis correctifs

Le `tech-lead` a rendu `REQUEST_CHANGES` sur la tranche non committée : **le code de production est bon** (contrats `brain/` conformes point par point, isolation tenue, aucun état miroir), **les deux majeurs sont dans la documentation**.

| Sévérité | Constat | Correctif |
|---|---|---|
| **Majeur** | `specification.json` disait encore `stats?: Partial<Record<…>>` **et** un troisième état d'affichage (« `—` sinon ») dans `design_contract` et `brain_contracts[0]` — renversés par D1, contredits par le code livré. Le fichier disait donc **deux choses opposées**, et `design_contract` est la section qu'un raffinage ouvre en premier : it6 a l'ordre explicite de suivre « la MÊME FORME », et aurait lu `Partial` juste au-dessus de son propre paragraphe. | Les deux réécrits en `Record<…>`, **annotés en place** (« MISE À JOUR DU 2026-08-13 : … est CADUQUE », convention déjà établie dans ce fichier) ; clause du troisième état supprimée ; jurisprudence it6 rappelée **sous** la ligne corrigée. → **BUG-069** |
| **Majeur** | La règle d'unicité des `BUG-xxx` disait encore « max des **quatre** fichiers » (`docs/WORKFLOW.md` + une `open_question`) alors que ce lot crée le **cinquième**. Panne auto-infligée, exactement celle de BUG-062. | « quatre » → « cinq » aux deux endroits, **coût nul en octets** — le 5ᵉ axe reste dans les `_about`, l'ajouter ici ferait franchir le plafond au lot qui vient de le défendre. → **BUG-069** |
| Mineur | `{ ...p, stats: STATS_INITIALES }` écrivait la **référence partagée** exportée de `brain/` dans le document candidat. Inoffensif aujourd'hui — `validateDossier` gèle une copie — mais l'innocuité tenait à une propriété située **deux couches** plus loin, alors que le test écrit dans le même lot, lui, se protégeait. | `stats: { ...STATS_INITIALES }`, commenté. |
| Mineur | Le garde de focus était **correct mais dépendant de l'ordre de déclaration** des deux effets : les permuter — ce qu'aucun linter ni test ne voit — réintroduisait en silence le défaut que le commentaire dit prévenir. | L'intention de focus porte désormais l'**identité** du personnage (`useRef<string \| null>`), pas un booléen : **un ref, un effet, zéro dépendance à l'ordre**. Vérifié au passage que `FichePersonnage` n'est **pas** remontée par un `key` côté panneau — le ref survit bien à la sélection, la garde est donc réelle. |
| Mineur | Les 13 propriétés du CTA dupliquées entre les deux composants (motif exact : un import de valeur en sens inverse créerait un **vrai cycle**, `PanneauPersonnages` important `LIBELLES_CAMP`/`LIBELLES_PORTEE`) — mais la troisième issue n'avait pas été essayée, et son précédent a une itération (`refusMessages.ts`, it2). | `components/styles.ts` neuf, `boutonPointilleStyle` importé par les deux — aucun cycle, **deux appelants réels**. Élargissement hors plan assumé, même forme que celui d'it2. |
| Mineur | La dette KR-112 datée it4 nommait **le mauvais fichier** : le désaccord n° 17 ne date que `hooks/useEcriturePersonnages.ts`, qui soulage le **panneau** — pas la **fiche**, seule à franchir le signal dans ce lot. it4 pouvait extraire le hook, déclarer KR-112 traité, et laisser la fiche passer 600 l. | Dette élargie **aux deux fichiers**, dans la spec **et** dans la docstring de `FichePersonnage.tsx` (dont la note « reste sous le seuil » était devenue fausse). |
| Mineur | Coquille `itineration` dans `code-knowledge.json`. | Corrigée. |

**Jugements demandés au tech-lead, rendus** : le 5ᵉ axe de scission est **défendable** — les quatre précédents étaient des axes de *cycle de vie*, celui-ci est un axe de **redondance**, et son critère se vérifie entrée par entrée ; la clause de BUG-065 remontée dans KR-197 **suffit** (ce qui se perd est un récit, pas une règle). La réduction des décisions it1/it2 **n'a perdu aucune règle opérante** — vérifié une par une : la règle permanente sur `dossier-reference.json`, `SegmentedControl value: T | undefined` et son « jamais un 3ᵉ segment », `PORTEE_INITIALE` « plancher du schéma, pas une intention d'auteur », `{statut:'absent'}` sans `errors`/`warnings`, le repli de brouillon par champ, la doctrine « pas de bandeau inatteignable » sont tous intacts. **KR-199 est bien transverse** : la panne qu'il décrit est une propriété de **l'instrument** (la porte compte des tests verts, elle ne compare jamais la portée d'un nom à celle de ses assertions), pas de cette feature.

**Second franchissement de plafond, dans le même lot** : BUG-069 refait passer `bug_history.json` au-dessus de 10 kio. Le 5ᵉ axe s'applique alors **à lui-même** — BUG-068, dont la parade est passée en KR-199 le jour même, part à l'archive : l'axe porte sur la **redondance**, pas sur l'âge. Restent en lecture obligatoire les seuls défauts dont la leçon n'est promue nulle part : BUG-066 (question ouverte, it4 propriétaire) et BUG-069. **10 926 → 8 259 o** (mesure finale).

## Porte qualité

| Instrument | Résultat |
|---|---|
| `npm run format` | aucun fichier reformaté |
| `npm run typecheck` (`tsc --noEmit`) | **0 erreur** |
| `npm run lint` | **0 erreur**, 1 warning **préexistant** hors diff (`CharacterCreationScreen.tsx`) — aucun warning neuf |
| `npm test` | **67 suites / 940 tests**, tous verts (65 / 923 avant l'itération) |
| `npm run test:mutation` | **non requis et non lancé** — `characteristics.ts`, `challenge.ts`, `combat.ts`, `xp.ts` tous absents du diff. `thresholds.break` **reste à 80** |

**Mesures de la définition de fini** (relevées par la QA, pas recopiées de l'ouvrier) :
`PanneauPersonnages.tsx` **443 → 478** l. · `FichePersonnage.tsx` **317 → 456** l.

**Budget de contexte** — trois plafonds franchis, tous compactés **dans ce lot** :
- `bug_history.json` (10 234 o / 10 kio, **6 o** de marge) → **5ᵉ axe de scission** : une entrée dont la mitigation est déjà **promue** dans un instrument lui-même en lecture obligatoire part à l'archive. BUG-064 (→ 11ᵉ critère d'acceptation) et BUG-065 (→ clause remontée dans KR-197) partent dans `bug_history.dossier-fiches.json` ; BUG-066 reste, sa question étant encore ouverte (it4 en est propriétaire). **10 234 → 8 259 o** après les deux passes (plafond re-dérivé : `ceil(8259 ÷ 5120) × 5 kio` = **10 kio**, inchangé — le cliquet ne monte pas).
- `code-knowledge.json` (76 411 o / 75 kio, 389 o) → corps de KR-095 déplacé dans la spec de `cloud-sync` (feature survivante mais **repointée**, qu'aucun travail en cours ne lit), pointeur conservé. **76 411 → 76 564 o**, KR-199 et la clause de KR-197 inclus.
- `src/features/dossier-fiches/specification.json` (67 493 o après écriture / 65 kio) → blocs de décisions **it1 et it2 livrées** réduits à leur phrase d'arbitrage + renvoi au dossier de raffinage, qui porte déjà le raisonnement. Franchi **deux fois** (les correctifs de la revue de PR l'ont remis au-dessus) : trois décisions **it3** dont la revue porte désormais le motif ont subi le même traitement. **67 493 → 66 295 o** (marge 265 o — it4 devra compacter à son tour, cf. RETOUR-COMITÉ).

## Non vérifiable en l'état

*(recopié verbatim du § 7 du plan, comme la définition de fini l'exige — jamais coché)*

- **Que `stats` n'atteint aucun contexte de modèle.** `destinations.ts` le **déclare** ; rien ne le **démontre** avant l'assembleur n° 10. C'est une limite, pas une garantie.
- **`wc -l PanneauPersonnages.tsx` réel** — le « ~460 » du tech-lead est une projection sur du code pas encore écrit. À **mesurer** en QA mode B, pas à accepter sur parole. Départ : 443 l. (déjà au-dessus du signal KR-112 à 400).
- **Le comportement réel du walker sur un bloc partiel** — affirmé par lecture de code ; vrai seulement une fois les cas `validate.test.ts` écrits et passants.
- **Le déclencheur d'extraction daté « it4 »** (KR-112) — aucune date de note de raffinage n'est vérifiable par un instrument avant qu'it4 arrive.
- **La lisibilité du message d'anomalie à 12 valeurs** (« attendu : 1, 2, … ou 12 ») — aucun test de message n'existe dans ce dépôt. Hors instrument, donc hors critère, mais noté plutôt que silencieusement accepté.

**Devenues vérifiées pendant l'itération** (relevé de la QA, à ne pas confondre avec un décochage) : la 2ᵉ ligne (`wc -l` **mesuré** à 478) et la 3ᵉ (le walker sur bloc partiel, désormais **prouvé** par les tests de `validate.test.ts`). Les trois autres restent vraies.

## RETOUR-COMITÉ

1. **Le plan a bien tenu la mesure sur KR-190, deuxième fois de suite.** Il annonçait `validate.ts` à 0 ligne en s'appuyant sur une lecture de `sitesDe` ; c'est exact, et le lot contrat est resté plus étroit que le pire cas. **KR-190 borne le pire cas, il ne prescrit pas la liste** — continuer à faire nommer les fichiers un par un, jamais recopier « les 8 ».
2. **Un plan qui nomme un test doit nommer le bon fichier.** L'écart n° 1 est bénin, mais il a coûté à l'ouvrier une vérification et à la QA une ligne de rapport. Le § 7 se remplit en ouvrant le fichier, pas de mémoire.
3. **La QA mode B a de nouveau attrapé ce que la porte verte ne voit pas** — 3ᵉ itération consécutive, 3ᵉ défaut de la même famille (BUG-064, 065, 068). La porte compte des tests verts ; elle ne compare jamais la portée d'un **nom** à la portée de ses **assertions**. KR-199 pose la parade côté écriture ; le comité devrait désormais exiger, pour tout critère qui **énumère** (« les 8 », « les deux »), que le § 7 dise **par quoi l'énumération est balayée**.
4. **Le franchissement de seuil KR-112 doit être projeté sur les DEUX fichiers, pas sur le seul fichier suivi.** Le plan suivait `PanneauPersonnages.tsx` (déjà au-dessus) et n'a pas vu que `FichePersonnage.tsx` allait franchir 400 dans le même lot. À it4, les deux sont à mesurer **avant**, et l'extraction datée devra dire **lequel des deux** elle soulage.
5. **Trois plafonds de contexte franchis dans une seule itération** — la mesure du 2026-08-13 laissait 6 o à `bug_history.json` et 389 o à `code-knowledge.json`. Ce n'est pas une surprise, c'est le cliquet qui fonctionne ; mais it4 partira avec 2,2 kio de marge sur sa spec et devra compacter à son tour. Le raffinage d'it4 gagnerait à **décider son axe de compaction à l'avance** plutôt qu'à le découvrir à l'étape 4.
