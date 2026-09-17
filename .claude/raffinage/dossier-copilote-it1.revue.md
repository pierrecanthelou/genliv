# Revue d'itération — `dossier-copilote` · itération 1

> Plan : `.claude/raffinage/dossier-copilote-it1.plan.md` (validé le 2026-09-17)
> Exécution : 2 lots **séquentiels** dans le même arbre — `dev-contrat` (lot 1, 22 fichiers) puis `dev-lot` (lot 2, 10 fichiers). Aucun worktree, **aucune fusion**.
> Vérification : `qa` en **mode B**, contexte neuf — **conforme avec réserves** · puis **revue de PR tech-lead** — `CHANGES REQUESTED`, 2 `major` + 8 `minor`, **tous corrigés** (§ 5 bis).

## En une ligne

L'auteur ouvre la destination « Copilote », désigne un personnage et un champ de prose, lance le copilote, et **accepte ou refuse** le texte proposé — c'est la première fois que le dépôt appelle un modèle, et **aucun texte n'entre dans le dossier sans son geste**.

---

## 1 — Les 8 critères, chacun avec sa preuve

Le mode B n'a compté **aucun** critère comme vérifié parce que jest était vert : pour quatre d'entre eux, elle a **reposé le mutant elle-même**.

| # | Statut | Preuve | Rejoué par la QA mode B |
|---|---|---|---|
| 1 | **VÉRIFIÉ** | `CopiloteService.test.ts` (1 appel si conforme) + `panneauCopilote.test.tsx › un seul appel en vol` — deux `fireEvent.click` dans le **même `act()`**, pour que le second frappe le DOM avant que `disabled` soit re-rendu | **Oui** — `enVolRef.current ||` retiré du garde ⇒ `Expected: 1, Received: 2`. Restauré, revert vérifié |
| 2 | **VÉRIFIÉ** | Deux témoins **distincts** (KR-230) : « il rejoue » et « il s'arrête » | **Oui, les deux mutants** — `essai < 1` ⇒ 4 tests rouges ; `essai < 1000` ⇒ « le second échec est TERMINAL » rouge avec `Received number of calls: 3`. Le 3ᵉ bouchon est **conforme** : c'est lui qui porte le pouvoir séparateur |
| 3 | **VÉRIFIÉ** | `panneauCopilote.test.tsx › quatre textes discriminés` — `.textContent` comparé par `toBe` (**exact**, jamais `toContain`) motif par motif, **plus** `new Set(...).size === 4` | **Oui** — branches `illisible`/défaut inversées ⇒ rouge sur le bon cas. C'est le mutant que le `Set` seul ne voit pas |
| 4 | **VÉRIFIÉ, avec une réserve écrite** | `acceptation.test.ts › écriture par update seul` : `Brain` **réel**, espions sur `update`/`persistence.set`/`events.emit`, ordre épinglé par `invocationCallOrder`, valeur relue dans le dossier | Motif du bouchon **vérifié exact** — voir § 5 |
| 5 | **VÉRIFIÉ** | `schemaSortie.test.ts` — deux canaris littéraux **et les trois mutants du § 4 ter écrits en dur** | **Oui, le mutant n° 3** : la forme resserrée laisse bien échapper `lieu.amorce` pendant que la vraie forme le voit |
| 6 | **VÉRIFIÉ** | `contexte.test.ts › confinement d'audience` — 12 chemins, cardinalité assertée, `DEROGATIONS_AUDIENCE` vide **assertée**, inclusion par `feuillesDeLaFixture` **sans seuil numérique**, `CHAMPS_PROPOSABLES.length === 3` | Promotion de `feuillesDeLaFixture` vérifiée réelle et correctement câblée |
| 7 | **VÉRIFIÉ** | `canon.ton` marqué ⇒ refus nommant `chemin:'canon.ton'`, **zéro `fetch`** · deux lancers ⇒ corps **strictement** égaux, sur des fixtures **disjointes** de celles du rejeu | Disjonction des fixtures vérifiée |
| 8 | **VÉRIFIÉ** | `worker/index.test.ts` (env `node`, 7 branches, `POST` dans `BASE_CORS`, garde en octets) · `worker/frontiere.test.ts` (KR-236 + cas négatif, liaison des deux plafonds) · `dossierEditorScreen.test.tsx` (10 sections en état vide, ordre nav épinglé) | Garde KR-236 rejoué : une invite bavarde satisfait `includes('valeur')` **et échoue** le garde |

**Le garde KR-236 a gagné un troisième cas négatif que le plan ne demandait pas** — et c'est le plus instructif : une invite disant « Tu décris **la valeur** de ce personnage… » passe `includes('valeur')` mais échoue le garde sur `GABARIT_SORTIE`. C'est la démonstration **exécutable** que le garde devait porter sur le gabarit et non sur la clé nue, exactement l'arbitrage du § 8 n° 2.

## 2 — Les valeurs mesurées, et comment

Aucune n'a été choisie.

| Constante | Valeur | Obtention |
|---|---|---|
| `M` | 1783 | plus long des trois assemblages réels (la cible étant retirée de sa propre demande, chacune donne un texte différent) |
| `BUDGET_CARACTERES_CONTEXTE` | **6000** | `ceil(1783 × 3 / 1000) × 1000` |
| `E` | 815 | 122 (enveloppe JSON) + 693 (invite composée), mesurés sur un corps réel |
| `TAILLE_MAX_CORPS_IA` | **19 456** | `ceil((3 × 6000 + 815) / 1024) × 1024` |
| `max_tokens` | 200 | dérivé de la plus longue prose du dossier de référence (146 car.), pas choisi |

Borne haute de 3 octets/unité de code **confirmée par mesure** : `'€'` = 3 octets pour 1 unité ; `'\u{1F600}'` = 4 octets pour **2** unités, soit 2/unité. Écrire 4 aurait été une marge inventée présentée comme une borne.

Les deux canaris de plafond sont posés **à ±1** : 6000 caractères passent / 6001 refusés ; 19 456 octets passent / 19 457 rendent `413`. Plus un **discriminant de grandeur** : un corps dont `String.length < 19456` mais dont l'UTF-8 dépasse est refusé — la mesure est bien en octets. Et l'enveloppe du test de liaison est **construite depuis les constantes réellement exportées**, jamais retapée : une enveloppe retapée aurait cassé en silence le lien que le test garantit.

## 3 — Diff par lot, comparé au plan

| Lot | Fichiers prévus | Touchés | Écart |
|---|---|---|---|
| 1 `tuyau` (`contrat`) | 22 | **22** | aucun |
| 2 `panneau` | 9 | **10** | +1 en revue de PR : `tests/useDemandeCopilote.test.tsx` |

Aucun fichier nommé par les deux lots. `src/App.tsx` et `src/features/dossier-copilote/**` sont restés intacts pendant tout le lot 1 — le découpage a tenu. Les artefacts de l'orchestrateur (plan, notes de tour, `specification.json`) n'appartiennent à aucun lot, conformément à l'étape 4 du cycle.

**Non-régression de l'extraction des libellés — la preuve exigée par le plan** : `git diff --stat src/features/` ne liste, côté features « done », que `PanneauCanon.tsx` et `BlocIdentite.tsx` — **aucun fichier de `tests/`**. Les suites de `dossier-fiches` (132 tests) et `dossier-canon` (46) sont vertes **sans une seule retouche**, et les quatre paires libellé/hint sont **verbatim** celles d'origine (diff ligne à ligne). `lintIsolation.test.ts` vert sans retouche ; `dossier-copilote` est entré automatiquement dans `OVERRIDES_PAR_FEATURE`, dérivé du disque.

## 4 — Ce qui a été REFUSÉ, et pourquoi *(ce qu'un diff ne dit pas)*

Le mode B a **balayé les 50 `REJETÉ` du § 8 un par un**. **Aucun n'a été livré quand même** — c'est le mode de panne de BUG-082, et il ne s'est pas reproduit. Vérifiés nommément : pas d'écho du champ sur le fil · pas de `PLAFOND_PROSE` dans le validateur · pas de `chemin` sur `trop-long` · **zéro `import` dans `worker/index.ts`** · pas de `fetchImpl` ni de `copilote?` dans `CreateBrainOptions` · pas de `Field.readOnly` · badges `accent`/`muted` seulement · aucun glyphe coche · `SYNOPSIS MJ` et `ACCROCHE JOUEUR` toujours inline · pas d'événement `copilote:*` · pas de SSE · `persistenceKeys.ts` non touché.

Les refus qui portent le plus de valeur, parce qu'ils ont coûté un tour de comité :

- **L'écho du champ dans la sortie du modèle.** Une sortie conforme au schéma pouvait nommer le **mauvais** champ, et rien n'arbitrait : croire le modèle, c'est lui laisser choisir la cible. Le Tech Lead a cédé au tour 2 en vérifiant qu'une liste à une entrée sert le garde KR-236 à l'identique.
- **`canon.mj.synopsis_mj` requis.** Mesuré en source : `ton` **et** `synopsis_mj` portent tous deux le marqueur sur un dossier neuf, donc l'exiger n'élargissait **pas** l'atteignabilité du refus — seulement le refus, sur l'auteur qui a posé son ton et pas encore son synopsis.
- **La disjonction « identité du personnage, 1 sur 5 »**, retirée par son propre auteur : elle livrait un **jugement éditorial déguisé en garde de forme**. Conséquence en cascade tranchée à l'arbitrage — l'union `{requis|parmi}` perdait son unique instance `parmi`, donc devenait une abstraction à un seul appelant.
- **`PLAFOND_PROSE`.** Il bornait trois champs que le schéma laisse **délibérément** non bornés (doctrine de famille, KR-203), depuis un second site, sur un nombre non mesuré. Remplacé par `max_tokens` dans le worker : paramètre de requête, pas règle du dossier.
- **Le resserrage du scanner** proposé par la QA du tour 1 sur une mesure juste. Il tuait bien le faux positif visé — mais il laissait échapper `lieu.amorce`, semé dans **tout** dossier créé. Sa prémisse (« un identifiant contient toujours un tiret ») est vraie de `randomToken()` et **fausse des identifiants semés**.
- **La coupe de la variante REMPLACEMENT**, retirée par son auteur le PM : elle ne retirait pas « un cas sur deux », elle laissait un **état non dessiné** où le texte de l'auteur disparaissait sans trace.

Et un retrait qui mérite d'être lu : le rôle Narratif a **retiré sa propre affirmation** selon laquelle le bloc AVANT était « le seul garde anti-complaisance de l'itération ». Elle était fausse — le diff attrape l'auto-paraphrase de la **cible**, jamais la paraphrase du **contexte**. Il l'a qualifiée de **surestimation de couverture**, la seule direction dangereuse. Le trou réel est reporté au § 6 ci-dessous.

## 5 — Écarts assumés

1. **Le critère 4 est prouvé en CONTRAT, pas en bout-en-bout.** Le test « refus de `validateDossier` » bouchonne `dossiers.update` au lieu de déclencher un refus réel. **Motif vérifié exact par le mode B** : `fonction`, `apparence` et `description_joueur` sont absents de `CHAMPS_REQUIS` **et** de `BUDGETS_DE_MOTS` — aucun refus réel n'est constructible sur ces trois champs. Conséquence à écrire plutôt qu'à masquer : le plan appelait ce refus le « cas nominal de la feature », et il **ne l'est pas encore à l'it1**. Il le deviendra dès qu'un champ proposable portera une contrainte de validation (it3, les six curseurs).
2. **`PanneauCopilote.tsx` fait 421 lignes** (408 avant la revue de PR, +13 de commentaires de motif) — au-dessus du signal de coupe KR-112 (400), loin du bloqueur (800). Le hook, la ligne et les textes étaient **déjà extraits dès le départ**, comme le plan l'exigeait ; il n'y avait pas de fichier de styles dans le périmètre du lot où déplacer les constantes. À surveiller dès l'it2.
3. **Le fournisseur amont n'est nommé nulle part dans le plan.** L'ouvrier a refusé d'inventer une URL et un identifiant de modèle **dans le code** : ce sont des secrets d'environnement (`IA_BASE_URL`, `IA_MODEL`), et la route rend `503 non-configure` tant qu'ils manquent. Le protocole écrit dans `handleIa` est **Anthropic Messages** — c'est **le choix de l'ouvrier**, imposé par le couple `{systeme, max_tokens}` du plan, **pas une décision du comité**. À confirmer avant le premier déploiement ; le contrat de la route (7 branches, JSON, CORS, garde d'octets, KR-236) ne bouge pas si le fournisseur change.
4. **L'entité de mesure du budget est COMPOSÉE.** Aucun personnage de `dossier-reference.json` ne remplit les 12 chemins injectés (6/8 au mieux). La fixture est hors des deux lots. La mesure a été prise sur le mieux rempli, greffé du `but` du seul porteur — **aucune valeur inventée**, mais ce n'est pas la mesure littérale du § 4 quater.
5. **Nav « Copilote » APRÈS « Contrôles »** : le plan disait « sœur » sans fixer l'ordre. Posé par l'ouvrier, **épinglé par un test dédié** plutôt que laissé implicite.
6. **`CardHead` n'existe pas** dans ce dépôt (l'UX l'avait relevé au cadrage) : en-tête recomposée localement. Le **titre** emploie des jetons réels mais **hors de la liste explicite du § 3.1** (`--fs-title`, `--fw-semibold`, `--text-strong`, `--font-ui`), repris de `book-library/DossierCard.tsx`.
7. **`Select` ne supporte pas d'option `disabled`** : l'état vide « 0 personnage » rend l'option informative sans l'attribut natif. Le comportement (Lancer désactivé + `title` nommant la raison) est intact ; seul le rendu natif diverge du texte du § 3.3.
8. **`variante` est dérivée sans tester `MARQUEUR_A_ECRIRE`** — la constante n'est délibérément pas exportée aux features (KR-223), et le plan documentait déjà cette branche comme **inerte**.

## 5 bis — Ce que la revue de PR a trouvé, et que personne d'autre n'avait regardé

Verdict initial : **`CHANGES REQUESTED`** — 2 `major`, 8 `minor`, aucun `critical`, aucun veto d'architecture. **Les dix ont été corrigés**, et les deux `major` méritent d'être lus, parce qu'ils étaient invisibles aux trois portes précédentes.

**`major` 1 — le bloc AVANT affichait le texte qu'on venait d'écrire** (BUG-097). `valeurAvant` était recalculé **à chaque rendu** depuis `useOpenDossier`, qui se réveille sur `dossier:updated` — c'est-à-dire sur **l'effet de bord de l'acceptation elle-même**. Sur une cible vide, un bloc « AVANT » **apparaissait de nulle part** à l'acceptation ; sur une cible rédigée, le texte de l'auteur **disparaissait de l'écran à l'instant précis où il était écrasé** — exactement l'« état non dessiné » qui avait fait retirer la coupe de REMPLACEMENT (§ 8 n° 16 du plan). Le seul instrument anti-complaisance de l'itération devenait, après décision, un diff montrant `A` contre `A`.
*Pourquoi personne ne l'a vu* : **tous les témoins existants s'arrêtaient AVANT l'acceptation**. Le plan décrivait `valeurAvant` comme « la valeur actuelle du champ cible » sans dire **à quel instant** elle est lue, et le bloc n'était conditionné qu'à `variante`, jamais à `decision`.
*Correction* : `valeurAvant` devient un **état d'écran gelé sur le geste**, jamais relu au rendu. Les deux témoins neufs ont été **mesurés ROUGES** sur le code d'origine avant d'être verts, et chacun relit d'abord la valeur **écrite dans le dossier** — sinon l'absence du bloc pourrait venir d'une écriture qui n'a pas eu lieu.
*Écart assumé au § 3.7, tranché par l'ouvrier avec son motif écrit* : le `Field` complet est **conservé** au lieu de la « ligne compacte » ; seule la barre d'actions se compacte. L'acceptation est le seul geste irréversible de l'écran, et la ligne compacte effacerait le diff à l'instant où il devient la **seule trace** de ce qui a été remplacé.

**`major` 2 — `code-knowledge.json` prescrivait encore le garde rejeté** (BUG-098). KR-236 se terminait par « un test qui asserte que l'invite de chaque rôle contient **chaque clé de son schéma** » — littéralement la forme rejetée au § 8 n° 2, et dont cette tranche venait de livrer la démonstration exécutable qu'elle est creuse. `code-knowledge.json` est le **seul fichier lu en entier avant d'écrire du code** : laissé tel quel, il enseignait le garde creux au lot contrat de l'it2, qui pose précisément une deuxième invite.
**La règle qui en sort, et elle vaut au-delà de cette feature** : quand un raffinage **mesure** qu'un instrument décrit dans un KR est faux, l'amendement du KR part dans le **même lot** que le code. Un KR est de la mémoire obligatoire, pas un commentaire. Même famille que BUG-082 — un arbitrage qui vit dans une note et pas là où on code.

**Les huit `minor`, tous corrigés** : `PropositionRendue` était un **type mort** (la branche de succès de `validerSortie` la traverse désormais ; la ré-export retirée) · une **course sur `enVolRef`**, remis à zéro par l'appel *qui se termine* et non par l'appel *courant* (BUG-099) · un `.then()` sans `.catch`, qui aurait laissé le panneau mort sans trace · le glob de `format` n'avait pas suivi `worker/` alors que `testMatch` et `tsconfig.include`, si · un **cas négatif creux** qui n'exécutait jamais la comparaison qu'il prétendait éprouver (BUG-100) · l'aller-retour amont sans délai, **nommé** en docstring · `collectCoverageFrom`, tranché avec un motif **factuel** (l'unique fichier de production du worker s'appelle `index.ts`, donc il tombe sous `coveragePathIgnorePatterns` — l'ajouter aurait donné l'**apparence** d'une couverture) · et le **protocole amont**, désormais nommé dans le code avec son statut de choix d'ouvrier.

Deux `minor` étaient des **latences**, pas des pannes observables aujourd'hui : la course sur `enVolRef` était couverte par le `disabled` du bouton — c'est-à-dire exactement ce que le plan interdit de faire porter au `disabled`. Le garde **est** le ref ; `disabled` n'en est que la face visible.

**Un candidat KR non écrit, et son motif.** Le `major` 1 est une forme que **KR-013/113 ne couvre pas** : il n'y a ici aucun `useEffect` miroir, seulement un calcul **en ligne** — c'est-à-dire précisément ce que la règle du dépôt **recommande**. Un état d'écran calculé en ligne depuis un abonnement qui se réveille sur son propre effet de bord n'affiche pas l'avant, il affiche le résultat. Non écrit dans `code-knowledge.json` : le fichier est à **+8 octets** de son plafond et l'y faire entrer aurait exigé une compaction que je n'ai pas voulu mener à l'aveugle sur des entrées que je connais moins. La leçon est portée par BUG-097, avec son test de régression, et `bug_history.json` est relu par le travail en cours — c'est-à-dire par l'it2.

## 6 — Ce que PERSONNE n'a vérifié *(jamais compté comme couvert parce que jest est vert)*

- **La paraphrase du CONTEXTE** (`but.libelle` recyclé en `fonction`) : aucun instrument. Le bloc AVANT/APRÈS n'attrape que l'auto-paraphrase d'une **cible** déjà rédigée.
- **La forme réelle de la réponse du fournisseur** (`content[].type` / `.text`) : jamais confrontée à une vraie réponse — tout est moqué des deux côtés. **Risque d'intégration externe qu'aucun instrument de ce dépôt ne couvre**, et que le mode B a nommé de sa propre initiative.
- **Une fuite d'identifiant par un EN-TÊTE HTTP** plutôt que par le corps : le témoin d'absence de mémoire ne couvre que le corps.
- **La casse du scanner** : `'Objet.favori-2'` en début de phrase capitalisée ne matche pas. **Assertée comme limite** dans un test nommé, jamais comblée.
- **La branche « cible marquée » de REMPLISSAGE** : test de **contrat**. Aucun mécanisme du dépôt ne peut la produire en usage réel (`useEcritureIdentite.ts` sème `''`).
- **`porteUnIdentifiant` sur un identifiant préfixe d'un autre** : si la prose porte `pnj.aldur-2` et le dossier `pnj.aldur`, la sous-chaîne appariée est la plus longue et l'appartenance échoue. Cas non traité, non couvert.
- **`entitesInjectees` quand la cible ne résout pas** : le plan ne donnait aucun motif de refus pour une `entiteId` inconnue. Comportement livré, total et documenté : aucune fiche injectée, `entitesInjectees: []`, le contexte part si `canon.ton` est écrit. Ce n'est **pas** prouvé souhaitable.
- **L'exposition de la route** : `ALLOWED_ORIGINS` commenté ⇒ repli `'*'` en production, et `X-Sync-Key` est **une clé d'espace de noms, pas une autorisation** (KR-148). **Quiconque en connaît une valide peut brûler du budget modèle.** Aucun limiteur de débit livré — point d'extension nommé, non livré.
- **Aucun rendu navigateur** : uniquement jsdom/RTL, aucune capture.
- **L'accessibilité** : hors cadre par décision projet.

## 7 — Ce qui a été REPORTÉ, et où

| Vers | Quoi |
|---|---|
| **it2** | le rang et sa re-résolution · l'ordre de coupe du budget + `SECTEUR_DES_CHAMPS` · le texte « vide-mais-réussi » (son producteur réel est « Tisser les indices ») · l'allow-list de sortie à 29 exclusions nommées — **sans objet sous le schéma `{valeur}`**, le modèle ne nommant plus aucun champ |
| **it3** | `caractere.cede_si` et `relations[].lien` (décision d'**audience**, à prendre au lot contrat, jamais par défaut) · le lieu · les contre-mesures · la variante GROUPE des six curseurs |
| **`open_questions`** | la garde « identité du personnage » — sa condition d'ouverture est écrite : il faut un **prédicat de vacuité** que rien n'écrit aujourd'hui · l'édition du texte « APRÈS » avant acceptation |
| **hors feature** | `ALLOWED_ORIGINS` et le limiteur de débit — condition d'ouverture : premier relevé de consommation anormale, ou première mise en ligne publique |

## 8 — Porte qualité, chiffrée *(exécutée par la QA mode B, pas déduite)*

| Étape | Résultat |
|---|---|
| `npx prettier --check` | 3 écarts, **tous préexistants et hors du diff** : `src/brain/dossier/issues.ts`, `validate.ts`, `dossier-controles/tests/panneauControles.test.tsx` |
| `npx tsc --noEmit` | **0 erreur** — confirme aussi que `"worker"` dans `tsconfig.include` ne fait rien rougir |
| `npm run lint` | **0 erreur**, 1 warning préexistant hors périmètre (`CharacterCreationScreen.tsx`, dette KR-025/BUG-025) |
| `npx jest` | **97 suites / 1388 tests — 100 % verts** *(96/1383 avant la revue de PR ; +1 suite, +5 tests)* |
| Score de mutation | **sans objet, confirmé par le diff** : ni `challenge.ts`, ni `combat.ts`, ni `xp.ts`, ni `characteristics.ts` |
| Table dorée | **sans objet, confirmé de même** — `LIBELLE_DES_CHAMPS` n'est pas un registre couvert |

Départ : 87 suites / ~1295 tests. Ajout : **10 suites neuves, +93 tests** — 6 suites / +88 au lot 1, 3 suites / +15 au lot 2, 1 suite / +5 en revue de PR.

Instrument de typage prouvé capable d'échouer : une sonde `const sondeDeTypage: number = "une chaine"` a fait rougir `tsc` (`TS2322`), puis le fichier a été restauré avec **SHA-256 identique**. Même discipline pour les mutants posés sur du code de production.

## 9 — `RETOUR-COMITÉ` — ce que ce découpage a appris

1. **Deux mesures justes peuvent se contredire, et aucun tour de comité ne le voit.** La QA a mesuré un faux positif et proposé un resserrage ; le Narratif a proposé une appartenance. Chacun avait raison **de son côté**, et le resserrage cassait l'appartenance sur un identifiant semé. Ce croisement n'a été attrapé qu'à l'**arbitrage**, en vérifiant une prémisse (« un identifiant contient toujours un tiret ») que personne n'avait posée comme telle. **À reprendre : quand deux rôles mesurent le même objet séparément, l'orchestrateur vérifie leurs prémisses l'une contre l'autre avant de retenir l'une des deux.**
2. **Un motif conditionné à une position retirée devient faux sans que son auteur le sache.** Le Tech Lead a justifié le retrait du libellé `TON` par l'existence de la disjonction R2 ; R2 a été retirée dans la **même** note, par un autre rôle. Le motif est mort avec elle. **À reprendre : à l'arbitrage, relire chaque motif dont la prémisse a été retirée au même tour.**
3. **Le budget de 8 critères a tenu — mais seulement après que le PM eut retiré une catégorie « hors budget ».** Treize critères déguisés en huit. La règle a fonctionné **parce que la QA a proposé un regroupement réel**, pas parce que le plafond était énoncé.
4. **Deux lots séquentiels, c'était le bon découpage.** Aucun blocage, aucun message à relayer entre agents, aucune fusion. Le parallélisme n'aurait rien acheté : le chemin critique était le lot contrat, et le lot 2 n'a pas pu démarrer avant.
5. **Le lot contrat a produit six écarts, tous déclarés et tous justes.** Le plus instructif : il a **refusé d'inventer** une URL de fournisseur, et a rendu le défaut visible (`503 non-configure`) plutôt que de le cacher derrière une valeur plausible. C'est exactement le comportement qu'on veut d'un poste à effort élevé.
6. **Le plan n'avait pas nommé le fournisseur de modèle.** Sur la première feature qui appelle un modèle, c'est un manque de cadrage, pas d'exécution. **À reprendre : toute itération qui pose une route d'appel modèle nomme le fournisseur et son protocole au § 4 bis, ou déclare explicitement que c'est un secret d'environnement à trancher.**

7. **Une exclusion de couverture écrite pour les barils masque désormais de la logique.** Relevé par le tech-lead en re-revue, sans action exigée : `coveragePathIgnorePatterns: ['index.ts$']` a été écrit pour exclure les barils de ré-export — et il exclut maintenant les **361 lignes de production** de `worker/index.ts`, qui n'est pas un baril. C'est pourquoi ajouter `worker/**` à `collectCoverageFrom` n'aurait **rien** mesuré, et aurait donné l'apparence d'une couverture : le motif a été tranché en commentaire plutôt qu'en ajout. **Le jour où le worker gagne un second fichier de production, ce n'est pas le glob qu'il faudra ajouter, c'est l'exclusion qu'il faudra rendre spécifique aux barils.** Écrit ici parce que c'est le genre de chose qu'on ne retrouve qu'en la cherchant.
8. **Une règle d'entrée pour les KR, posée en revue de PR** : une occurrence mesurée **plus** un test de régression, c'est un **BUG** ; cela devient un **KR** à la **deuxième** occurrence — et c'est le lot de cette deuxième occurrence qui paie la compaction de `code-knowledge.json`. Le déclencheur de compaction écrit dans `docs/WORKFLOW.md` est le **franchissement**, jamais la proximité : compacter à +8 octets pour faire place à un KR à une seule occurrence, ce serait opérer à l'aveugle sur des entrées que ce lot ne possède pas.

## 10 — Signalé, hors périmètre

`docs/REGLES-DU-JEU-PAPIER.md` (non suivi, ~16,5 Ko) **était déjà présent dans l'arbre au démarrage de la session** — il n'a été produit par aucun des deux lots. Le mode B relève que rien dans le dépôt ne le référence et que son contenu **diverge** de `docs/REGLES-DU-JEU.md`, source de vérité des mécaniques (KR-130) : plancher de caractéristique à 2 au lieu de 1, seuil de mort `PV ≤ -FV` (concept « Force vitale ») au lieu de `PV ≤ -CA`, règles de soins ajoutées. **Non touché, non commité.** Un second document de règles divergent dans `docs/` est précisément ce que la règle de source unique existe pour éviter — à trancher séparément.
