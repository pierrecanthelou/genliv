# Tour 1 — `narratif-ia` · `dossier-copilote` it3b

**RISQUE** — **La durée en prose.** À qui l'on demande des étapes, un modèle écrit « au bout de trois jours », « le lendemain ». Cela entre dans `action`, audience `ia` ; la n° 12 l'injectera au rôle acteur, qui jouera un temps que le moteur n'a jamais compté — alors que `duree` est `moteur` et que l'unité du pas appartient à la n° 9, **non décidée**. Aucun validateur ne le constate (KR-229) : l'invite est le seul endroit qui reste pour l'interdire.

**OBJECTION** —
1. **Une 4ᵉ cible `{ personnageId }` fait diverger le rôle annoncé du validateur exécuté.** `CopiloteService.ts:398-407` dispatche sur la FORME de la cible ; une `CiblePlan { personnageId }` est structurellement identique à `CibleRepliques` et tombe dans la branche répliques — route, invite et validateur répliques, `tsc` vert. *Lu dans le code, non compilé.* C'est le trou que TL3a-5 venait de fermer.
2. **`etape` : la règle existe déjà** — `useEcriturePlan.ts:201`, `etape: index + 1`. L'acceptation la réécrirait dans une **seconde feature** et rien ne rougirait à la divergence : `plan_actions[].etape` n'est pas dans `CHAMPS_ENTIERS`, et `tables.ts:398-403` écrit qu'**aucune règle d'ordonnancement n'a jamais été arbitrée**.

**PROPOSITION** — Le modèle rend une liste de prose, `{"actions": […]}`, et rien d'autre : ni `etape`, ni `duree`, ni `declencheur_texte`, ni `si_bloque` (annexe). Le code pose `etape` **dans la recette d'`update`, depuis la liste vive**, jamais depuis le contexte gelé — sinon trois acceptations successives posent trois fois le même entier, que rien ne refuse. La règle du rang **monte dans `brain/`** au lot contrat. Contexte : neuf chemins, `synopsis_mj` retiré **pour point de vue, pas pour ton**.

**VERDICT** — **recevable sous réserve** (les deux objections traitées dans le lot contrat, avant l'écran).

---

# ANNEXE (hors quota)

## A. Qui rend quoi — les six champs de `PlanAction`

| champ | audience | 3b |
|---|---|---|
| `action` | `ia` | **RENDU PAR LE MODÈLE.** Seul champ qui traverse le réseau. |
| `etape` | `moteur` | **POSÉ PAR LE CODE**, au moment de l'écriture. Le modèle ne rend jamais un entier (doctrine it2). |
| `duree` | `moteur` | **REJETÉ** — un compte de pas d'horloge dont l'unité appartient à la n° 9, non décidée : un modèle qui en propose une tranche une décision que personne n'a prise. Et **le code ne peut pas la poser non plus** (bug du `?? DUREE_MIN`, it4 de la n° 4 : semer une valeur `moteur` que l'auteur n'a pas posée, KR-221). |
| `si_bloque` | `ia` (sous condition d'état) | **REJETÉ** — `validate.ts` § 8 bis (l. 709-737) avertit sur tout `si_bloque` non vide **sans `duree`**. Comme `duree` n'est proposable ni par le modèle ni par le code, **chaque acceptation fabriquerait une anomalie** dans le dossier de l'auteur. *Lu dans le code, non rejoué.* Réponse à la question 3 : PROPOSER n'est pas INJECTER, et le veto d'injection (timing de session) **ne s'appliquerait pas ici** — c'est la **dépendance à `duree`** qui ferme la porte, pas le timing. |
| `declencheur_texte` | `auteur` | **REJETÉ** — jumeau prose d'une condition D1. Un modèle qui l'écrit désigne des entités **par nom libre**, alors que le validateur refuse déjà les identifiants dans sa sortie ; et la famille est délibérément **calme** (`alerteSansExpr: false`, `tables.ts:746-750`), donc rien ne signalerait jamais un dossier rempli de conditions non traduites. |
| `declencheur_expr` | `moteur` | **REJETÉ** — langage de conditions D1, donc du code. Veto sans discussion. |

**Condition de ré-ouverture de `si_bloque`, décidable** : proposable un jour **sur une étape EXISTANTE qui porte déjà une `duree` posée par l'auteur** — la proposition devient alors conditionnée par l'état du **DOCUMENT**, miroir exact de l'injection conditionnée par l'état de **SESSION**. Hors périmètre de 3b, qui est une complétion de liste.

## B. Le contexte du 4ᵉ rôle — `personnage-plan`

**NEUF chemins, tous d'audience `'ia'`** (liste blanche écrite à la main, jamais dérivée de la table) :

```
canon.ton
canon.interdits_ton[]
canon.partage.accroche_joueur
monde.personnages[].fonction
monde.personnages[].description_joueur
monde.personnages[].but.libelle
monde.personnages[].but.pourquoi
monde.personnages[].caractere.jamais
monde.personnages[].plan_actions[].action
```

**RETRAITS, avec motif :**

- **`canon.mj.synopsis_mj` — RETIRÉ, et le motif n'est PAS celui de 3a.** En 3a le risque était la paraphrase *prononcée*. Ici c'est le **point de vue** : le synopsis porte ce que le personnage ne sait **pas**. Un modèle qui l'a écrit des étapes qui anticipent l'intrigue ; la n° 12 injecte cette `action` au rôle acteur, qui joue un personnage **qui devine**. C'est exactement la panne que tout l'appareil `savoirs` / `revele_si` existe pour empêcher. **Ne pas recopier la phrase de 3a** : le motif est différent, l'écrire faux le ferait « harmoniser » un jour.
- **`monde.personnages[].apparence` — RETIRÉ** : une apparence ne dit rien d'une intention. Seul chemin de fiche dont le retrait ne coûte aucune information d'intention, et il rend le rôle strictement plus étroit.
- **`caractere.parler[]` — RETIRÉ** : des répliques ne disent pas ce qu'il *fait*, et ce serait un canal de paraphrase vers un champ qu'un **autre rôle** écrit.
- **`caractere.cede_si`, `caractere.curseurs.*` — RETIRÉS**, précédents 3a inchangés.
- **`savoirs[]` et le contenu des indices — REPORTÉ, pas rejeté.** Ce que le personnage sait est ce qui rend son plan juste, mais c'est la **recomposition par rang** de la n° 12.
- **`presence[]`, `relations[]` — hors tranche** (3c prend les relations).

**Question 4, le point dur — le rôle voit-il le plan DÉJÀ ÉCRIT ? OUI, et c'est un AMENDEMENT explicite au précédent 3a**, à porter au registre :

> **Un champ cible ORDONNÉ s'injecte ; un champ cible INTERCHANGEABLE ne s'injecte pas.**
> `caractere.parler[]` est un ensemble d'échantillons **sans ordre** : les montrer n'apporte qu'un canal de paraphrase (3a, refusé). `plan_actions[]` est une **séquence** : l'étape N n'a de sens qu'après 1…N−1. Le préfixe n'est pas la réponse, **c'est la prémisse de la question**. Sans lui, le modèle repropose systématiquement du matériau d'étape 1.
> **Contrepartie obligatoire** (reprise de 3a) : l'auteur voit les étapes déjà écrites, **gelées**, à côté des propositions — il juge une suite, pas trois phrases orphelines. Et un prédicat de forme (§ E, n° 11) refuse la recopie **verbatim**.
> Un seul des six champs traverse la frontière, `action`, **dans les deux sens** — jamais `duree`, `declencheur_*` ni `si_bloque` des étapes existantes.

**Budget** : `BUDGET_CARACTERES_CONTEXTE['personnage-plan']` — **MESURÉ DANS LE LOT**, protocole it1 : asserter d'abord que les NEUF chemins résolvent non vides (sinon c'est un plancher, pas une mesure), puis `ceil(M × 3 / 1000) × 1000`. **Aucun chiffre écrit ici** : un nombre non mesuré dans la config est précisément ce que la doctrine interdit. Si la mesure déplaît, on ne monte pas le budget.
**`TAILLE_MAX_CORPS_IA` se re-dérive sur les QUATRE rôles par `max`** : « inchangé » ne se suppose pas — ce rôle porte un chemin de liste **non tronqué** que `personnage-repliques` ne portait pas.

## C. L'invite, MOT POUR MOT

```
Tu assistes l'AUTEUR d'un livre-jeu qui écrit le plan d'actions d'un personnage.
À partir du contexte fourni, tu proposes les ÉTAPES SUIVANTES de ce plan : ce que CE personnage-là entreprend, dans l'ordre, pour obtenir ce qu'il veut.

Tu réponds par un objet JSON et rien d'autre, de la forme {"actions": ["…", "…"]} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

Chaque étape est une INTENTION que le personnage poursuit : elle servira plus tard de consigne à qui le fait agir, elle ne sera jamais lue telle quelle à un joueur, et ce n'est jamais une phrase qu'il prononce.
Elles prolongent les étapes déjà listées, sans en répéter aucune, et se lisent dans l'ordre où tu les écris.
Tu en donnes trois au plus, et au moins une : même quand le contexte est maigre, une fonction et un but suffisent à dire ce qu'un personnage entreprend.
Chacune tient en une phrase et ne porte qu'UNE action.
Tu n'écris jamais de durée ni de délai — ni « au bout de trois jours », ni « le lendemain », ni « après une semaine » : le temps est compté ailleurs.
Tu n'écris jamais à quelle condition l'étape commence, ni ce que le personnage fait si elle échoue, ni aucun numéro d'étape.
Tu respectes le ton de l'aventure et ses interdits de ton.
Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.
```

**Trois décisions d'écriture, à ne pas « corriger » :**
1. **Le piège de recopie, l'inverse de celui de 3a.** L'invite répliques dit « ÉCHANTILLON DE VOIX / telles qu'il les dirait » ; recopier cette ligne ici produirait **des répliques au lieu d'intentions**. L'invite it1 dit « NOTE DE FICHE » ; la recopier produirait **des descriptions au lieu d'actions**. La ligne propre à ce rôle est « une INTENTION … ce n'est jamais une phrase qu'il prononce » — et aucun validateur ne peut la constater (KR-229).
2. **La ligne de la durée est la ligne de l'itération.** Elle ne dit ni « pas d'horloge », ni `duree`, ni `DUREE_MIN` — elle interdit le motif en langue naturelle, avec trois exemples, et s'arrête à « le temps est compté ailleurs ».
3. **« trois au plus, et au moins une »** figure EN PLUS du contrat, jamais À LA PLACE.

## D. `max_tokens` — DÉRIVÉ, avec sa mesure

**Mesure** (`String.length`, deux sources indépendantes) : `dossier-reference.json` — six `plan_actions[].action`, la plus longue **67** car. (l. 172) ; `dossier-fiches/tests/fichePersonnage.test.tsx:176` — **68** car.

**Dérivation** : pire élément 68 ; enveloppe `{"actions": ["", "", ""]}` = **25** octets (celle de 3a vaut 27 pour `repliques`, 9 lettres contre 7 — l'écart de 2 se retrouve). `L = 3 × 68 + 25 = 229`. `r=3 ⇒ 300` ; **`r=2` (PIRE) ⇒ 343,5 ⇒ 400**.

⇒ **`max_tokens: 400`**. ⚠ **Le résultat dépend du ratio (300 contre 400)** : on prend le pire, et on le dit. **Ce 400 n'est PAS recopié de 3a** — il sort d'une mesure différente (68 contre 74) et d'une enveloppe différente (25 contre 27) ; **la coïncidence est à écrire dans le commentaire**, sinon un relecteur croira à une recopie et « harmonisera ».
**Mode d'échec nommé** : trois étapes très longues tronqueraient le JSON ⇒ `schema` ⇒ rejeu ⇒ terminal. C'est le **bon** échec.

## E. Forme de sortie et comportement d'échec

**Fil** : `POST /ia/personnage-plan`, corps `{ role: 'personnage-plan', contexte }` — **SANS `champ`** : le rôle EST le champ.
**Gabarit** : `'personnage-plan': '{"actions": ["…", "…"]}'`, **dupliqué à l'identique** dans `worker/index.ts` et `schemaSortie.ts`, forme d'écriture imposée — garde KR-236 par balayage de source, plus le canari croisé.
**Types** : `PlanRendu { actions: readonly string[] }` (réseau) / `PropositionPlan { personnageId, intentions: readonly string[] }` (re-résolu). **ZÉRO clé commune** (KR-231), et `intentions` ≠ `ajouts` **délibérément** : `PropositionPlan { personnageId, ajouts }` serait **structurellement identique** à `PropositionRepliques` et s'écrirait dans `caractere.parler[]` avec `tsc` vert.
**Bornes** : `CLES_SORTIE_PLAN = ['actions']`, `ETAPES_PROPOSEES_MAX = 3` — **registre littéral, quatrième**, jamais un `Record<RoleCopilote, …>` (précédent TL3a-6), et **jamais partagé**.

**Prédicats** — les DIX de `validerRepliques` transposés, **plus un onzième** :

> **(11) aucun élément égal (après `trim`) à une `action` déjà écrite sur ce personnage** ⇒ `'schema'`. C'est **la contrepartie de l'amendement du § B** : le risque de recopie est CRÉÉ par l'injection des étapes existantes, donc il se paie dans le même lot. Il n'attrape que la recopie **verbatim** — une paraphrase passe, et c'est l'acceptation de l'auteur qui la traite.

**`MotifIllisible` INCHANGÉE.** Motifs atteignables : `'schema' | 'vide' | 'marqueur' | 'identifiant'`. **`'rang-inconnu'` SANS OBJET** — ne pas l'écrire (famille BUG-084, KR-235).
**Liste vide = REFUS**, motif `'vide'`. Test de rattachement it3a appliqué : ce rôle rend de la **PROSE QUE RIEN NE FOURNIT** ⇒ RÉDACTION.

**Refus de contexte, ordre figé, tous AVANT le moindre `fetch`** :
1. `a-ecrire` — `canon.ton` absent/marqué ;
2. `cible-a-ecrire` — la cible ne résout plus, **ou** `but.libelle` absent, vide ou marqué. **Prédicat NOMMÉ sur UN chemin** (`CHEMIN_BUT_CIBLE`), exactement le mécanisme de `CHEMIN_VERITE_CIBLE` du rôle 2 — et **non** la disjonction de 3a. Motif : *on ne peut pas inventer un PLAN à partir de rien* — un plan est la suite d'étapes vers un but ; sans but, toute suite se vaut, et le modèle inventerait le but ;
3. `trop-long` — REFUS, jamais de coupe (KR-230).

**Écriture à l'acceptation — le point que je tiens** :
`plan_actions: [...p.plan_actions, { etape: p.plan_actions.length + 1, action: texte }]` — **deux clés, rien d'autre** (KR-221). `etape` **dérivé du `p` de la recette**, donc de la liste vive au moment de l'écriture — **jamais** du contexte gelé ni de l'index de proposition : trois acceptations successives poseraient sinon trois fois le même entier, et **rien ne le refuserait**. Le moteur n° 14 hériterait d'un plan inordonnable, en silence.
**Et la règle `etape = rang + 1` monte dans `brain/`** (deux appelants ⇒ condition de promotion remplie), `useEcriturePlan.ts:201` repointée **dans le même lot**. Sonde de fin de lot : aucun `etape:` littéral ne subsiste dans un fichier de production de `src/features/`.

**Pas de plafond de document** : contrairement à `PARLER_REPLIQUES` (= 2), **rien ne borne `plan_actions[]`**. Donc **aucun** « Lancer » désactivé au plafond, aucun compteur gelé, aucun `+` désactivé. En inventer un serait décider une règle de document que personne n'a arbitrée.

## F. Ce que l'invite N'A PAS le droit de réciter

`DUREE_MIN` ni son chiffre · le mot « pas d'horloge » et toute unité de temps de session · l'existence de `duree`, `si_bloque`, `declencheur_expr`, `declencheur_texte` et leurs noms · le langage de conditions D1 · `ETAPES_PROPOSEES_MAX` présenté comme une règle du dossier · le nom du champ `action` ou de tout autre champ · la table d'audience · les caractéristiques, seuils, tiers · le message ou le seuil d'un contrôle · **le mot « tour », réservé au round de combat**.

## G. Les REJETÉ, à recopier au registre du plan (BUG-082)

1. **REJETÉ — le modèle rend `etape`.** Un modèle ne rend jamais un entier ; l'ordre du plan est du code, et aucune règle d'ordonnancement n'est arbitrée qu'il pourrait respecter.
2. **REJETÉ — le modèle propose `duree`.** L'unité du pas appartient à la n° 9 et n'est pas décidée : proposer une durée tranche en passant une décision que personne n'a prise.
3. **REJETÉ — le code pose `duree` (p. ex. `DUREE_MIN`) pour rendre `si_bloque` atteignable.** Semer une valeur `moteur` que l'auteur n'a jamais posée est le bug déjà corrigé en revue de PR de l'it4 de la n° 4 (KR-221).
4. **REJETÉ — `si_bloque` proposable en 3b.** Sans `duree`, chaque acceptation fabriquerait un avertissement dans le dossier de l'auteur (`validate.ts` § 8 bis).
5. **REJETÉ — `declencheur_texte` proposable.** Condition en prose désignant des entités par **nom libre**, dans une famille délibérément **calme** : rien ne signalerait jamais le dossier rempli de conditions non traduites.
6. **REJETÉ — `declencheur_expr` proposable.** Langage D1 : du code.
7. **REJETÉ — `canon.mj.synopsis_mj` dans le contexte du 4ᵉ rôle.** Il porte ce que le personnage ne sait pas ; un plan écrit depuis lui fait agir un personnage sur un savoir qu'il n'a pas.
8. **REJETÉ — `CiblePlan { personnageId }` telle quelle.** Structurellement identique à `CibleRepliques` : elle tombe dans la branche répliques du dispatch — rôle annoncé A, validateur exécuté B, `tsc` vert.
9. **REJETÉ — `PropositionPlan { personnageId, ajouts }`.** Structurellement identique à `PropositionRepliques` : elle s'écrirait dans `caractere.parler[]` sans erreur de compilation. La clé est `intentions`.
10. **REJETÉ — un plafond de document sur `plan_actions[]`** par symétrie avec `PARLER_REPLIQUES`. Aucune règle de ce genre n'est arbitrée ; l'inventer la déciderait en passant.
11. **REJETÉ — partager `ETAPES_PROPOSEES_MAX`** avec `PROPOSITIONS_MAX` ou `REPLIQUES_PROPOSEES_MAX`. Même valeur aujourd'hui, aucune raison commune d'évoluer.
12. **REPORTÉ — `savoirs[]` / contenu d'indice dans ce contexte.** Condition d'ouverture : le jour où un rôle a besoin du point de vue d'un personnage sur un indice (n° 12).
13. **REPORTÉ — `si_bloque` proposable sur une étape EXISTANTE portant déjà une `duree` posée par l'auteur.** Condition d'ouverture écrite et décidable.

## Ce que je n'ai PAS mesuré

- Aucune forme **compilée** : l'objection n° 1 est une **lecture** de `CopiloteService.ts:398-407`, pas un `tsc` rouge.
- L'avertissement `si_bloque` sans `duree` **non rejoué** : lecture de `validate.ts` l. 723-737.
- Les longueurs du § D comptées **à la main** sur deux fichiers ; à re-compter dans le lot avant d'écrire `400`.
- Aucun budget de contexte avancé : il se mesure dans le lot.
