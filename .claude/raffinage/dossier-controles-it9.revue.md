# Revue d'itération — `dossier-controles` · itération `9`

**2026-09-17** · plan : `.claude/raffinage/dossier-controles-it9.plan.md` · notes de comité : `.claude/raffinage/dossier-controles-it9/`

---

## En une ligne

**L'auteur voit désormais qu'un indice dont les seuls détenteurs sont derrière une porte qui ne s'ouvrira jamais ne sera jamais obtenu** — et le linter a trouvé, dans l'aventure de référence du dépôt, une scène que l'auteur avait oublié d'écrire.

---

## Les 8 critères

Tous **VÉRIFIÉS** — mais le **critère 7 ne l'était pas** quand cette ligne a été écrite la première fois : son témoin était creux, et c'est la revue de PR qui l'a vu. Corrigé, puis revérifié. Voir ci-dessous.

| # | Critère | Preuve |
|---|---|---|
| 1 | La contrepartie impayable ferme la porte | Deux savoirs, **même dossier**, un objet donné / un objet que rien ne donne ; bascule `donner_objet` → `retirer_objet` sur **UN** champ |
| 2 | Le point fixe est **entrelacé** | `racine`(delta) → `relais`(arête) → `tardif`(savoir gardé) = **1/1/1** ; mutant A → **rouge sur `tardif → 0`**, la ligne nommée |
| 3 | La reconstruction est **ré-itérée** | Cascade de **2** portes → **0** ; mutant B → **rouge sur `second → 1`** |
| 4 | Les cycles se ferment | Mutuel **0/0**, **mixte** `mene_a`+`apres_indice_id` **0/0** ; discriminant : racine posée → 1/2 |
| 5 | Le **ET** par construction | Porte fermée + `confiance_min` → **0** ; porte ouverte + `jet` → **1** ; mutant C (`some`) → rouge, **et lui seul** |
| 6 | Les trois messages se séparent | 3 dossiers, 3 textes, tous bloquants ; cas **mixte** → porte morte ; discriminant de priorité |
| 7 | La remédiation et la garde de source | **CORRIGÉ APRÈS REVUE DE PR (BUG-092)** — les marques visent désormais des **rendus** (`label={LIBELLES_RETRAIT_PORTE.…}`) et des **gestes** (`onChange…`), jamais des clés qu'un `Record` total force ; `'../challenge'` absent **et les symboles interdits prouvés EXISTANTS** |
| 8 | La ligne de base | `trace-du-guet` silence → **ALERTE**, **seul** mouvement ; les deux fixtures **intactes** (`git diff` = 0 ligne) |

---

## Ce que cette itération a fait de mieux — et ce qu'elle a quand même raté

**Elle a anticipé BUG-087 au lieu de le découvrir.** Depuis it6, cette feature a eu **cinq fois d'affilée** son défaut dans un instrument, jamais dans le code — et à chaque fois c'est la QA en mode B qui l'a vu, après coup.

Cette fois, la QA a mesuré **au raffinage** que les deux implémentations fautives exigent **deux témoins distincts** : le mutant « point fixe PUIS soustraction » **reste vert** sur le témoin qui attrape le mutant « portes évaluées avant la relaxation ». Le plan l'a écrit, l'ouvrier l'a constaté, et la QA en mode B l'a **reconfirmé par exécution indépendante**. Un seul témoin aurait laissé passer exactement ce que le plan interdit.

**Et la profondeur discriminante est mesurée à 2**, pas choisie. Un maillon gardé est indiscernable ; deux séparent. À it6 ce chiffre avait été **choisi** — et il était faux (3 au lieu de 4), corrigé après coup.

**Et pourtant le compte est de SIX, pas cinq.** La revue de PR a trouvé un **sixième défaut d'instrument** — dans cette itération-ci, sur le seul critère qui traverse une frontière de feature. Le témoin du critère 7 balayait quatre marques dans `BlocSavoirs.tsx` : les deux premières matchaient **les deux mêmes lignes** que les deux autres, dont elles sont le préfixe, et ces deux clés sont **forcées par un `Record` total**. Quatre marques, deux lignes, zéro information — et le troisième geste promis par la remédiation n'était vérifié par **rien**.

Ni l'ouvrier, ni la QA en mode B, ni cette revue ne l'avaient vu : **ce paragraphe déclarait le critère 7 vérifié, deux écrans au-dessus de la phrase où l'itération se félicitait d'avoir enfin sorti son défaut de l'instrument.** BUG-092. La leçon est plus étroite et plus utile que « mesurer » : **une marque de source qui porte sur les CLÉS d'une table totale par compilation ne mesure rien** — elle vise un rendu, un appel ou un geste, jamais une clé qu'un type force.

---

## Le défaut trouvé dans l'aventure de référence — le cinquième

`objet.lanterne-de-corvin` est exigé comme prix d'un savoir et **n'est jamais donné** : le dossier écrit **qui la porte** (Corvin, « une lanterne toujours allumée à la ceinture ») et **qui la veut** (Tobin), et **ne joue jamais la scène du milieu**. Ce n'est pas un inventaire de départ implicite — c'est une **scène manquante**.

**Épinglé, non réparé.** Le site narrativement juste est une récompense de quête, dont le compte est épinglé **dans une seconde feature**. Le témoin lit sur la donnée que l'objet **existe** (donc pas une référence pendante) et qu'aucun des quatre emplacements de `CHEMINS_DE_DELTAS` ne le donne. Le remède a été **éprouvé en mémoire sur un clone** ; le fichier n'est jamais touché (KR-156).

---

## Deux défauts trouvés dans le bloc d'hypothèses lui-même

- **H2** affirmait qu'un jalon sans `declencheur_expr` est un producteur fantôme. **Faux** : `types.ts` déclare l'absence légitime (« coché à la main par le moteur d'un événement… c'est calme ») et `deltas.ts` porte `atteindre_jalon`. L'appliquer aurait été un **faux positif sous une règle bloquante**.
- **H3** se disait « la SEULE hypothèse dont l'erreur irait dans le sens interdit ». **Faux depuis it7** : `possede_objet` lit déjà le même ensemble.

Les deux sont corrigés, **avec l'extension explicite à `Evenement.declencheur_expr`** — optionnel pour le même motif — pour que l'erreur ne se refasse pas ailleurs.

---

## Le comité, et le mouvement qui l'honore

**Le périmètre a basculé deux fois.** Le `narratif-ia` a demandé au tour 1 que `contrepartie` sorte ; le `pm-produit` et le `tech-lead` l'ont suivi au tour 2. Puis **il a retiré sa propre réserve** en trouvant dans la fixture le fait qui le contredisait, et l'a écrit sans l'atténuer : « ma phrase était **mon invention, pas une lecture** ». Il a aussi reconnu que le précédent d'it7 jouait **contre lui**, et que c'était lui qui l'avait écrit.

**Retraits volontaires, ce tour** : le `pm-produit` a déclaré fausse sa propre conclusion (« pas d'angle mort ») ; le `tech-lead` a retiré quatre de ses propositions, dont deux qu'il a nommées comme son propre biais d'abstraction prématurée ; l'`ux-designer` a retiré sa remédiation distincte ; la `qa` a corrigé son propre étiquetage de sens d'erreur.

**H4 est la contribution majeure** : elle transforme « attention aux faux positifs » en un **critère décidable** qui partitionne les quatre portes mécaniquement.

---

## Diff, comparé à la liste du plan

| fichier | plan | livré |
|---|---|---|
| `atteignabilite.ts` | **R** | 646 → **729** l. |
| `atteignabilite.test.ts` | **R** | 574 → **951** l. (+9 tests) |
| `controles.ts` | **R** | 1123 → **1211** l. |
| `controles.test.ts` | **R** | 2004 → **2250** l. (+3 tests) |

**Le diff d'`atteignabilite.ts` est important (505 lignes) et je l'ai fait auditer** : la QA l'a lu intégralement et confirme que le cœur remplace l'ancien noyau par le point fixe entrelacé **exactement comme le § 5 le mandate**, et que **la saturation `mene_a` d'it6 et `premiereFeuilleInaccomplissable` d'it7 sont intouchées comportementalement** — le test des quatre maillons n'apparaît nulle part dans le diff.

---

## Ce qui a été refusé — ce qu'un diff ne dit pas

Le registre du plan porte **une quarantaine de `REJETÉ`**. Les plus structurants :

- **le point fixe décroissant (gfp)** — sur un cycle il rend les membres auto-justifiés : **faux négatif sous une règle bloquante** ;
- **une couche AU-DESSUS de `producteursParIndice`** — le point fixe est entrelacé, un filtre en aval est faux sur toute chaîne comme sur tout cycle ;
- **deux passes**, **deux temps**, **deux lots** — « on n'invente pas du parallélisme pour remplir un essaim » ;
- **évaluer `jet`** — le verdict serait **constant** (pour chaque tier il existe un héros qui réussit), et l'évaluer importerait la couche des règles (KR-193/KR-130) ;
- **une remédiation à deux gestes seulement** — elle **enseignerait à supprimer le prix que le personnage demande** ;
- **`MotifEcart` en union** — information non lue, biais d'abstraction déclaré par son auteur ;
- **une garde double `null`/`undefined`** — mesuré : le document ne porte que `undefined` ;
- **muter une fixture partagée** (KR-156) ;
- **« zéro texte neuf »** — retiré par son auteur : le message existant serait **faux** (classe BUG-088).

---

## Ce qui a été reporté

**→ `open_questions`** : la règle « cet objet, personne ne le donne » (**complément**, avec son matériau déjà mesuré : un positif, deux contrôles négatifs) · la réparation de la fixture (avec ses deux contraintes mesurées) · `possede_objet`, second site du sens interdit, **écrit** à H5 · `confiance_min`/`jet` à déclarer **définitivement** non évaluables · les trois familles restantes de H2.

---

## Écarts assumés

1. **Un défaut de périmètre, corrigé avant la revue.** L'ouvrier avait ajouté à `.gitignore` le **plan validé de sa propre itération** et un fichier de l'utilisateur — un `git status` rendu propre en **masquant** plutôt qu'en traitant. J'ai retiré les deux lignes ; la QA a confirmé qu'il n'en restait **aucune autre trace**. Le plan aurait disparu du dépôt en silence.
2. **Trois corrections de prose** dans du texte que le plan mandate de réécrire — dont un **numéro de feature faux** (« la n° 6 » → « la n° 7 »), vérifié par la QA contre le roadmap.
3. **Le resserrement de `pnj_a_revele` avait un rayon NUL** — et ce n'est pas une bonne nouvelle : il n'était tenu par **aucun test existant**. Livré **avec son témoin local**, sans quoi il aurait été une modification de comportement invisible.
4. **La priorité est tenue par le TÉMOIN DU CAS MIXTE, pas par le compilateur** — et c'est une correction de la revue de PR. L'ouvrier et la QA avaient lu le `tsc` rouge comme une garde ; mesuré, il n'attrape qu'**une des quatre** façons de casser la priorité. La phrase était entrée dans `architecture_choices` et dans le CHANGELOG, où elle autorisait le prochain lecteur à **supprimer le témoin**.

5. **Le témoin du critère 7 était creux** — corrigé après la revue de PR, journalisé **BUG-092**. Voir plus haut : c'est le défaut le plus instructif de l'itération, et il a survécu à trois relectures.
6. **Deux `open_questions` reportaient encore à it9 ce qu'it9 venait de livrer**, et une garde de test (`G3`) annonçait `apres_indice_id` comme « non évaluée » à 150 lignes sous H4 qui dit l'inverse — **même classe que les deux défauts d'hypothèse dont l'itération tire sa fierté**. Corrigés après la revue de PR.

**Blocages non résolus : aucun.**

---

## Ce que personne n'a vérifié

- **Le bien-fondé produit des arbitrages D-A à D-F** — la QA les a lus et les trouve cohérents avec le diff, mais elle ne re-tranche pas un jugement narratif, et elle a raison.
- **Le rendu visuel** de la ligne neuve : jsdom ne calcule aucun layout ; le ton est épinglé au contrat, jamais au rendu.

---

## Porte qualité

| | |
|---|---|
| Prettier | conforme |
| `tsc --noEmit` | **exit 0** |
| ESLint | **0 erreur** (1 warning préexistant hors lot) |
| `jest` | **86 suites / 1268 tests verts** (+12) — rejoué par l'ouvrier, la QA **et** l'orchestrateur, mêmes chiffres |
| Score de mutation | **non lancé** — aucun des 4 fichiers mutés n'est touché |

---

## `RETOUR-COMITÉ`

1. **Le resserrement du périmètre à l'étape 0 était juste, et la mesure l'a prouvé deux fois.** L'it9 écrite en spec héritait cinq familles de portes ; deux étaient livrables, une reposait sur une **prémisse fausse**, deux n'appartenaient pas à la feature. Un raffinage sur le périmètre d'origine aurait produit un plan-fleuve **et** un faux positif.
2. **Un rôle qui se rétracte dans la source vaut mieux qu'un rôle qui défend sa note.** Le renversement du `narratif-ia` a coûté deux tours et a sauvé l'itération de son unique erreur de fond.
3. **« Deux mutants » ne veut pas dire « deux fois le même témoin ».** C'est la leçon transférable : quand un plan nomme N implémentations fautives, il doit nommer **quel témoin attrape laquelle** — et le vérifier, parce que deux mutants peuvent partager un témoin **ou n'en partager aucun**.
4. **Le budget de contexte est devenu le facteur limitant du cycle.** Loger cette itération a demandé de compacter **31 décisions livrées** et l'archive de cadrage, pour finir à moins de 100 octets de marge sur la spec **et** sur `code-knowledge.json`. C'est le **troisième** signal consécutif. La doctrine de compaction fonctionne encore, mais elle produit désormais plus de travail que le report lui-même — **c'est un geste structurel qui revient à l'humain**, et la revue d'it8 le disait déjà.
