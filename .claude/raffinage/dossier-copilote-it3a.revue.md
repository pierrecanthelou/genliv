# Revue d'itération — `dossier-copilote` · itération `3a`

> Exécutée le 2026-09-18 · plan `.claude/raffinage/dossier-copilote-it3a.plan.md` (validé, porte 2 franchie)
> **Exécution séquentielle, 2 lots** — aucun essaim, aucun worktree, aucune fusion. Pipeline : `dev-contrat` (lot 1, seul et en premier) → `dev-lot` (lot 2) → `integrateur` → `qa` mode B.
> Verdict QA : **CONFORME**. Verdict revue de PR (3 passes) : **APPROVE, aucun finding ouvert** — 1 major et 2 minors trouvés puis fermés, `BUG-109`/`110`/`111`.

## En une ligne

**L'auteur peut faire compléter la façon de parler d'un personnage** : une quatrième carte « Écrire des répliques » propose jusqu'à trois répliques types dans la voix du personnage, qu'il accepte ou refuse **une par une**, chaque acceptation **s'ajoutant** à `caractere.parler[]` sous le plafond de deux.

---

## Critères d'acceptation

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | 10 chemins `'ia'`, `DEROGATIONS_AUDIENCE` vide, cible et `cede_si` absents, `synopsis_mj` des deux côtés | **VÉRIFIÉ** *(réserve levée le 2026-09-18 par correction de la rédaction du critère — voir « Écarts assumés » n° 1)* | `contexte.test.ts › confinement du 3e role` · `› cede_si absent de CHAQUE entree` · `› la cible est absente de la liste blanche` · `› synopsis_mj absent ici, PRESENT chez prose`. **Rouge constaté par la QA** sur sabotage réel (fuite de `synopsis_mj` injectée dans `assemblerRepliques` ⇒ 4 tests rouges) |
| 2 | Refus `cible-a-ecrire` sans appel réseau, trois motifs discriminés dans le même test | **VÉRIFIÉ** | `contexte.test.ts › les trois refus, discrimines, 0 fetch` + `CopiloteService.test.ts › les trois refus, discrimines, et AUCUN fetch` — espion `fetch` à zéro appel, 3 motifs deux à deux distincts |
| 3 | `{"repliques": []}` et `["…", "   "]` refusées `vide` par **deux prédicats distincts, chacun rougissant seul** | **VÉRIFIÉ** | Établi **sur le code réel** par la QA, en deux sabotages séparés : prédicat (6) neutralisé ⇒ seuls les tests « liste vide » et « deux predicats distincts » rougissent, « element blanc » reste vert ; prédicat (7) neutralisé ⇒ l'inverse exactement. Indépendance prouvée, pas supposée |
| 4 | Identifiant en **dernière** position ⇒ **lot entier** refusé, scan par élément sans `join`, rejeu exactement une fois puis terminal | **VÉRIFIÉ** | Les **trois mutants appliqués au code réel** par la QA : « ne scanner que `[0]` » ⇒ 4 rouges · « `.join()` avant scan » ⇒ 1 rouge (faux positif de frontière fabriqué) · « repêchage partiel » ⇒ 4 rouges. Restaurés, `diff -q` identique. Rejeu : 2 tests dédiés |
| 5 | Aucun gabarit sous-chaîne d'un autre, aucune invite ne contient le gabarit d'un autre rôle, **3 transpositions rouges** | **VÉRIFIÉ** | `frontiere › precondition` (posée **avant** le canari) + `› balayage exhaustif`. **Rouge constaté par sabotage réel de `worker/index.ts`** — gabarit `personnage-repliques` injecté dans l'invite `personnage-prose` ⇒ 2 tests rouges. La rotation `croiser` est **conservée** comme canari de dérangement total |
| 6 | Budget **mesuré** (jamais `0`, jamais recopié), maximum atteint par exactement un rôle avec cas négatif rouge, borne d'invite = borne du validateur | **VÉRIFIÉ** | **`M = 1200` re-mesuré indépendamment par la QA** (sonde jetable, retirée) ⇒ `ceil(1200×3/1000)×1000` = **4000**. Ni `0`, ni 6000 (prose), ni 17000 (détenteurs). Garde invite↔validateur **vu rouge** par sabotage réel (« trois au plus » → « quatre au plus ») |
| 7 | Acceptation **AJOUTE**, `caractere` créé **sans aucun curseur**, ordre persistance-puis-événement, ligne suivante non acceptable sans que le focus la cible | **VÉRIFIÉ** | `repliques.test.tsx` : AJOUT sans écrasement · `Object.keys(caractere) === ['parler']` (KR-221) · `invocationCallOrder` · plafond par ligne avec `PARLER_REPLIQUES` **importée**. **Deux rouges constatés sur le composant réel** : gel retiré ⇒ le test nommé **BUG-097** rougit ; garde de saut du focus retirée ⇒ le test **BUG-106** rougit exactement |
| 8 | Deux acceptations ⇒ `parler[]` à deux et dossier accepté par `validateDossier` ; écriture refusée ⇒ rien persisté, proposition conservée | **VÉRIFIÉ** *(par un test non nommé au § 7 — écart n° 4)* | `repliques - bout-en-bout (critere 8)` établit **littéralement** les deux moitiés (`validateDossier(...).errors` vide) ; le refus est couvert par un test séparé |

**8 critères sur 8 établis**, le n° 1 portant une réserve de **rédaction du critère**, non de code.

---

## Diff par lot — confronté à la liste du plan

**Lot 1 `troisieme-role` (contrat) — 11 fichiers annoncés, 11 livrés, aucun de plus.**
`src/brain/copilote/{types,schemaSortie,schemaSortie.test,contexte,contexte.test}.ts` · `src/brain/{CopiloteService,CopiloteService.test,index}.ts` · `worker/{index,index.test,frontiere.test}.ts`

**Lot 2 `carte-repliques` — 7 fichiers annoncés, 7 livrés, aucun de plus.**
Neufs : `components/CarteFaireParler.tsx` (279 l.) · `components/LigneReplique.tsx` (114 l.) · `tests/repliques.test.tsx` (434 l., 12 tests)
Modifiés : `components/PanneauCopilote.tsx` · `components/styles.ts` · `textes.ts` · `tests/panneauCopilote.test.tsx`

**La frontière des lots EST la frontière de feature, vérifiée d'un préfixe de chemin** : lot 1 ∌ `src/features/**`, lot 2 ⊂ `src/features/dossier-copilote/**`. **Aucun franchissement**, constaté indépendamment par l'intégrateur **et** par la QA.

`panneauCopilote.test.tsx` affiche `1 1` au `numstat` — **une seule ligne changée**, la 100 (`toHaveLength(2)` → `3`), pour cette raison seule, comme le § 5 l'exigeait.

**Trois fichiers `M` au statut mais absents du `numstat`** — `src/brain/dossier/issues.ts`, `src/brain/dossier/validate.ts`, `src/features/dossier-controles/tests/panneauControles.test.tsx` : **zéro octet de contenu changé**, fins de ligne seulement (`core.autocrlf`, effet de bord de `npm run format`). Mesure confirmée trois fois indépendamment. **Non restaurés** — voir « Point remonté à l'auteur ».

**Aucun fichier de la liste « HORS de tout lot » n'a été touché** : `useDemandeCopilote.ts` (le générique `<C,P>` — un diff y aurait signalé une frontière franchie), `LigneProposition.tsx`, `LigneDetenteur.tsx`, les trois cartes livrées, `BarreLancer.tsx`, `brain/dossier/*`, `Select.tsx`, `lintIsolation.test.ts`.

---

## Ce qui a été REFUSÉ — ce qu'un relecteur ne peut pas deviner du diff

Les décisions ci-dessous sont **invisibles au diff par construction** : elles se lisent dans ce qui n'y est **pas**.

| Refusé | Motif |
|---|---|
| **Les six curseurs proposables** (veto, n° 1) | Proposer un chiffre obligerait à faire franchir le réseau au registre `CURSEURS` — donnée de **code**, sans clé de schéma donc **sans ligne d'audience**. **La gravité n'est pas dans la sortie du modèle, elle est dans l'entrée qu'il aurait fallu ouvrir.** ⇒ **la tranche 3d est SUPPRIMÉE**, la feature passe de 4 à 6 itérations |
| **Semer `CURSEURS_INITIAUX`** en créant le bloc `caractere` (n° 2) | Six valeurs ratifiées par un geste qui en ratifiait une seule. Un bloc tout au plancher est **indistinguable d'un réglage délibéré** (KR-221) : le voyant s'éteint sans que personne ait rien réglé. Écriture imposée : `caractere: { parler: [...déjà, texte] }` **et rien d'autre** |
| **Une 5ᵉ entrée dans `LIBELLE_DES_CHAMPS`** (veto TL3a-3) | `libelles.test.ts` balaie tout `label="…"` et `BlocCaractere.tsx:169` porte déjà `label="RÉPLIQUE"`. **Corollaire, cœur du veto, que le témoin ne voit pas** : le composant neuf ne porte pas non plus ce label — un second domicile serait **invisible à l'instrument**. Vérifié à la main : `LigneReplique.tsx` ne porte aucun `label="RÉPLIQUE"`, et `LIBELLE_DES_CHAMPS` reste à quatre entrées |
| **`CibleRepliques { entiteId }`** (veto TL3a-5) | `entiteId` est commun à `CibleCopilote` : une **variable** s'y assignerait sans erreur (le contrôle d'excédent ne vaut que sur un littéral), le rétrécissement du dispatch redeviendrait faux — rôle annoncé A, validateur exécuté B, `tsc` vert. Fait aggravant : le dernier `return` du dispatch était un **repli**, il devient une **branche** |
| **`join` avant le scan anti-identifiant** (n° 22) | Deux fragments dans deux cases distinctes **ne forment pas** un identifiant — aucun lecteur ne les lira collés. Joindre **détruit la localisation** de l'élément fautif **et fabrique un faux positif à la frontière**. Mutant vu rouge |
| **Le repêchage des éléments sains** (n° 12) | Réparation silencieuse : l'auteur ratifierait une liste amputée sans le savoir. Trouvé indépendamment par deux postes. Mutant vu rouge |
| **« La liste vide est un SUCCÈS »**, transporté de l'it2 (n° 11) | Discriminant **DÉSIGNATION vs RÉDACTION** : un rôle de désignation choisit dans un ensemble fermé que le contexte a fourni — « personne » y est une réponse **vraie** ; un rôle de rédaction écrit un texte que rien ne fournit — « je n'écris rien » est une **non-réponse**. Corollaire : `TEXTE_AUCUNE_REPLIQUE_PROPOSEE` n'a **plus aucun producteur** et n'a pas été écrit |
| **Borner la sortie par `PARLER_REPLIQUES`** (n° 9, retiré par son auteur) | Le nombre de propositions acceptables vaut `PARLER_REPLIQUES − parler.length` : il **varie par personnage**. Borner le validateur à 2 refuserait `schema` une réponse **conforme** à une invite qui en demande trois — **et rien n'aurait rougi**. `REPLIQUES_PROPOSEES_MAX = 3` retenu ; `schemaSortie.ts` **n'importe jamais** `PARLER_REPLIQUES` (vérifié par balayage de source) |
| **`cede_si` dans `CHAMPS_INJECTES`** (n° 16) | Prédicat conditionné par **rôle** ; un rôle de rédaction n'est ni narrateur, ni acteur du porteur, ni arbitre : le prédicat **n'a pas de sujet**. **PROPOSER n'est pas INJECTER** |
| **`canon.mj.synopsis_mj`** dans ce rôle | **Asymétrie du regret** : une réplique qui le paraphrase met du savoir MJ dans une phrase que le Temps 2 fera **prononcer**, alors qu'une note de fiche est **lue**. Le rôle est **strictement plus étroit** que `personnage-prose` |
| **Injecter les répliques déjà écrites** (n° 32) | Canal de paraphrase. **Contrepartie livrée** : ce que le modèle ne voit pas, **l'auteur le voit** — bloc « DÉJÀ ÉCRIT », gelé au lancement |
| **Un 4ᵉ segment au `SegmentedControl` de la carte 1** (n° 15) | `useDemandeCopilote` est instancié **une fois par appel** : deux rôles dans une carte = **deux machines à états** et une correspondance tenue à la main. Le couple (`champ = 'fonction'`, proposition de répliques affichée) deviendrait représentable |
| **Le ciblage depuis le linter `personnage-sans-voix`** (n° 25, retiré sur mesure de son auteur) | Le prédicat du constat est `length > 0`, pas `length >= PARLER_REPLIQUES` : un personnage à **une** réplique (place libre) est muet au linter et deviendrait **inatteignable**. ⇒ `controlerDossier` sort de la tranche, **écran compris** : le `Select` liste tous les personnages |
| **Un registre générique de schémas/bornes par rôle** (n° 8, 3ᵉ refus) | Critère décidable : un `Record<RoleCopilote, …>` n'est légitime que si **chaque** rôle a une entrée **qui veut dire quelque chose**. Le rôle prose n'a pas de liste — son entrée serait un mensonge |
| **Un prédicat de similarité** (n° 33) · **réutiliser `PROPOSITIONS_MAX`** (n° 34) · **recopier le budget de `personnage-prose`** (n° 35) | Respectivement : la frontière testable est la **forme** (KR-229) ; deux bornes sans raison commune d'évoluer ; **desserrer la garde d'un rôle par la mesure d'un autre** |

---

## Ce qui a été REPORTÉ, et où

| Reporté | Destination / condition d'ouverture |
|---|---|
| **`caractere.jamais` et `caractere.cede_si`** | Vers **`personnage-prose`**. **Prix nommé** : passage de `CHAMPS_PROPOSABLES` à des clés **imbriquées**. Pour `cede_si`, prédicat amendé **aux deux sites** avec la 5ᵉ instance de l'instrument « présent aux deux sites » |
| **L'extraction d'une `BarreDecision` partagée** (n° 14) | La première itération qui rouvre déjà `LigneProposition.tsx` ou `LigneDetenteur.tsx`, ou une 4ᵉ occurrence. **Compensation livrée** : le § 3.3 nomme les jetons exacts |
| **Le rétrofit du garde invite↔validateur sur `PROPOSITIONS_MAX`** (n° 37) | La première itération qui rouvre l'entrée `indice-detenteurs` |
| **`BUG-106`, cas « acceptation au plafond »** | Bloqué sur `brain/components/Select.tsx`, primitive partagée. **Prophylaxie livrée** dans cette tranche (le focus ne cible jamais une ligne désactivée), le cas résiduel reste ouvert |
| **Le remontage du panneau à la navigation** | Dette ouverte depuis l'it2, **toujours jamais mesurée** |
| **La variante `GROUPE` de `LigneProposition`** | **Non construite** (KR-109) — le veto n° 1 lui a retiré son unique instance. Inscrite ici pour qu'un ouvrier ne la livre pas « parce qu'elle est écrite » |

---

## Écarts assumés

**1. Critère #1 — la lettre du critère n'est pas tenue ; sa substance l'est. ⚠ Seul point demandant un arbitrage.**
`'monde.personnages[].caractere.parler[]'` **reste dans l'entrée `personnage-prose`** de `CHAMPS_INJECTES` (`contexte.ts:45`), où il est **depuis l'it1**. Le critère #1 dit « `caractere.parler[]` et `cede_si` sont absents de **chaque entrée** » ; le § 4.3 et le nom du test au § 7 (« la cible est absente de **la** liste blanche », **singulier**, contre « `cede_si` absent de **CHAQUE** entree ») montrent que le plan visait **deux portées différentes** et que le critère les a collapsées en une seule formulation.

**Ce qui est livré et prouvé** : la cible est absente de la liste blanche **du rôle neuf**, par **absence** et non par un saut à l'exécution (une ligne morte, KR-235, serait ré-ouvrable par un bogue de cible ; une absence ne se ré-ouvre pas), et **aucune réplique déjà écrite ne figure dans le texte assemblé** (témoin à deux côtés).

**Ce qu'il aurait fallu faire pour tenir la lettre** : retirer le chemin de `personnage-prose` — ce qui **changerait le contexte d'un rôle livré et invaliderait son budget mesuré de 6000**, que le § 2 (hors périmètre) et le désaccord n° 35 (« ne jamais desserrer la garde d'un rôle par la mesure d'un autre ») interdisent tous deux.

**Recommandation convergente du lot 1, de la QA et de l'orchestrateur : corriger la rédaction du critère, ne pas toucher au code.** Le lot 1 a explicitement refusé d'élargir son périmètre de son propre chef — c'est le bon réflexe.

> ✅ **ARBITRÉ PAR L'AUTEUR le 2026-09-18 : rédaction corrigée, code inchangé.** Le § 6 n° 1 du plan porte désormais les **deux portées séparément** (`cede_si` → chaque entrée ; `caractere.parler[]` → l'entrée du rôle neuf), avec la correction **marquée en clair** dans le plan signé plutôt qu'appliquée en silence. **La réserve est levée : le critère #1 est VÉRIFIÉ.**

**2. Le « + » désactivé au plafond n'est pas `IconButton`.** Vérifié : `IconButtonProps` est `{ children, onClick, tone, label, size }` — **aucune prop `disabled`**. Un `<button disabled>` composé localement dans `LigneReplique.tsx`, plutôt que modifier une primitive partagée pour un seul appelant (KR-109). Jetons employés tous issus de la liste § 3.1, `aria-label` et `title` conservés. **Recevable** (QA).

**3. L'eyebrow `eyebrowRepliqueProposee(n)` est rendu par la carte**, pas par `LigneReplique` — dont l'interface figée du § 3.3 ne porte **aucun** paramètre `n`. La prose du § 3.3 était en tension avec sa propre signature ; la rendre depuis la carte est la seule résolution cohérente. Précédent exact : `BlocCaractere.tsx` rend son eyebrow hors du `Field`. **Recevable** (QA).

**4. Un test bout-en-bout non nommé au § 7 a été ajouté** pour le critère #8 : aucun test nommé n'établissait littéralement sa première moitié (« `parler[]` porte deux **et** le dossier reste accepté », depuis un personnage à zéro réplique). **Recevable** (QA) — le critère est réellement établi.

**5. `src/brain/CopiloteService.ts` passe de 332 à 416 lignes** (et `contexte.ts` à 564, `worker/index.ts` à 487). KR-112 vise nommément « composant ou hook » : ces trois modules sont hors de sa lettre, et loin du bloqueur à 800. **Signalé comme surveillance pour 3b**, pas corrigé ici — un 4ᵉ rôle rapprochera `CopiloteService.ts` de 450-470 lignes. Aucun sur-découpage prématuré d'un dispatch à trois branches disjointes.

**6. `MENTION_ZERO_REPLIQUE_AU_LANCER` est un texte HORS du § 3.4 du plan** — ajouté en revue de PR, confirmé par le tech-lead. Le § 3.4 fixait les textes « mot pour mot » et n'avait pas anticipé que le bloc « DÉJÀ ÉCRIT », **gelé**, gèlerait aussi son **état vide** : sur un personnage à zéro réplique, `MENTION_ZERO_REPLIQUE` au présent voisinait deux badges « Accepté » et contredisait le `title` de « Lancer ». L'alternative — **dégeler le bloc** — aurait touché la parade de BUG-097 : mauvais échange. Le texte respecte tout ce que la liste du § 3.4 encode réellement (il vit dans `textes.ts`, en français, **ne porte aucun `label="…"`** donc `LIBELLE_DES_CHAMPS` reste à quatre entrées et le veto TL3a-3 tient, ne recycle le texte d'aucun autre rôle) et — **à la différence de `TEXTE_AUCUNE_REPLIQUE_PROPOSEE`, refusé précisément pour cela** — il **a un producteur**. **Inscrit ici pour que le raffinage de 3b ne le trouve pas dans `textes.ts` comme une dérive non autorisée.**

**Blocages non résolus : aucun.**

---

## Ce que la revue de PR a trouvé — et que les quatre autres portes n'avaient pas vu

Troisième itération d'affilée où la revue de PR trouve la **même famille** de défaut, et cette fois elle était **dans la parade elle-même**.

**`BUG-109` (major) — le repli de focus reconduisait la course que le gel fermait.** `focoApresDecision` visait « Lancer » **exactement** quand `compteurApres >= PARLER_REPLIQUES` — c'est-à-dire dans le rendu où `plafondAtteint`, dérivé du dossier **vif** réveillé par l'acceptation elle-même, bascule ce bouton en `disabled`. En navigateur, `.focus()` sur un bouton désactivé n'a aucun effet : **l'auteur au clavier perd sa place au moment exact où il finit sa tâche.** La prophylaxie annoncée au § 3.5 était **complète sur les lignes et vide sur le repli** — le défaut avait été *déplacé*, pas fermé.

Et l'aggravant est un défaut de **méthode**, pas de code : le témoin assertait `toHaveFocus()` sur ce bouton et **passait**, son propre commentaire reconnaissant que « jsdom laisse un focus posé juste avant que son propre `disabled` ne soit commis ». Un contrat **affirmé vrai par l'environnement** — mot pour mot le mode de panne que la mitigation de BUG-106 avait interdit. Aucun test n'aurait jamais pu le dire.

**Corrigé au fond, pas au minimum** : `LigneRepliqueHandle` gagne `focusRejeter`, et l'invariant devient **« ne jamais viser une cible que ce même rendu désactive »**. Aucune primitive touchée — la cible était dans les fichiers du lot depuis le début. Le tech-lead a vérifié la propriété qui décide de la validité du correctif et que je n'avais pas nommée : au basculement du plafond, seul l'enfant d'indice 0 change de **type** et est démonté ; le « × » garde son type et sa position, donc **React préserve son nœud DOM** et le focus **survit réellement**. La cible n'est pas seulement active, elle est **rémanente**.

**Le résidu est déclaré, et il a désormais sa condition d'ouverture.** Toutes les lignes décidées **et** plafond atteint (3 propositions, 2 acceptées + 1 rejetée) : aucune cible ne survit. On ne pose pas le focus, et un témoin l'asserte. La cible honnête serait le `Select` en tête de carte, qui ne transmet aucun `ref` — primitive partagée (KR-109) : **BUG-106 et BUG-109 se referment du même geste**, le jour où une itération ouvre légitimement `Select.tsx`. Le lien « Ouvrir la fiche » a été **refusé** comme repli : son `onClick` est `onSelectSection('personnages')`, donc y poser le focus **armerait une navigation** sur le prochain Entrée — strictement pire que le résidu.

**`BUG-110` (minor) — et la deuxième passe a trouvé que mon correctif n'était gardé par rien.** Le `regression_test` que j'avais inscrit nommait la suite du gel (BUG-097), **aveugle à ce correctif** : elle sème `parler: ['Ancienne phrase.']`, donc la branche corrigée ne s'y rend jamais. **Un `regression_test` qui nomme un témoin aveugle est pire qu'un champ vide — il sera cru.** Corrigé : deux assertions dans le bout-en-bout (qui part bien de zéro), mutant « ternaire → `MENTION_ZERO_REPLIQUE` seule » posé sur le code réel, **1 test sur 13 vu rouge**, restauré.

**`BUG-111` (minor)** — garde `contexteGele === null` absent de `handleRejeter` alors qu'il est dans `handleAccepter`. Inatteignable aujourd'hui, mais porté par **aucun type** : une dépendance implicite entre deux `useState`, la forme exacte qui a rouvert BUG-101.

**Deux sabotages supplémentaires vus rouges** en traitant ces findings (repli de focus ⇒ 2/13 rouges ; mention au passé ⇒ 1/13 rouge), restaurés et re-vérifiés.

---

## Point remonté à l'auteur

Trois fichiers apparaissent `M` au `git status` **par fin de ligne seulement** (`core.autocrlf`, effet de bord de `npm run format`) : `src/brain/dossier/issues.ts`, `src/brain/dossier/validate.ts`, `src/features/dossier-controles/tests/panneauControles.test.tsx`. `git diff --numstat` est **vide** sur les trois — zéro octet de contenu changé, mesure confirmée trois fois.

Le lot 1 a tenté un `git checkout --` dessus ; **le classifieur de permissions l'a refusé**, et l'agent a demandé que l'orchestrateur le fasse à sa place. **Non fait** : une action refusée à un agent ne se reprend pas à son compte. Le point est sans conséquence sur le diff livré — **à trancher par l'auteur**, qui peut les restaurer ou les laisser.

---

## Porte qualité

| Étape | Résultat |
|---|---|
| `prettier --check "{src,worker}/**"` | **VERT** *(note : `prettier --check .` échoue sur `docs/PLAN-BASCULE-IA.dc.html`, erreur de parsing HTML **préexistante**, fichier hors diff)* |
| `tsc --noEmit` | **VERT** — 0 erreur |
| `npm run lint` | **VERT** — 0 erreur, 1 warning **préexistant** hors diff (`src/player/components/CharacterCreationScreen.tsx`, `exhaustive-deps`) |
| `npm test` | **VERT** — **99 suites / 1516 tests**, 0 échec (+1 après la revue de PR : le témoin du résidu de BUG-109) |
| `npm run test:mutation` | **NON DÛ — constaté, pas supposé.** Aucun des quatre fichiers mutés (`src/brain/{challenge,combat,xp,characteristics}.ts`) n'apparaît au diff. Non lancé |

Porte relancée **indépendamment** par l'intégrateur, par la QA, puis par l'orchestrateur après les huit cycles de sabotage de la QA — même résultat les trois fois, arbre confirmé restauré (`git diff --numstat` liste exactement les 15 fichiers de contenu attendus).

**Non-régression sans une retouche** : `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `cablage`, `acceptation`, `detenteurs`, `useDemandeCopilote` — toutes vertes, **aucune au diff**. `destinations.ts` n'a pas de suite dédiée et est absent du diff, conforme au § 4.3 (« aucune ligne neuve dans `destinations.ts` »).

**KR-013/113 (état dérivé)** — relevé exécuté : **zéro site**. Les deux composants neufs ne contiennent **aucun `useEffect`**. `dejaEcritesGelees`, `compteurAccepte`, `accepterDesactive` sont calculés **en ligne à chaque rendu** depuis l'état gelé au clic « Lancer ».

---

## Ce qui reste non vérifiable en l'état

- **Le pastiche du contexte et la redite d'une réplique déjà écrite** — aucun instrument ne constate une paraphrase (KR-229). **Le canal de paraphrase, fermé par la forme à l'it2, est ROUVERT par cette tranche.** Seule parade : l'auteur voit l'existant, gelé.
- **La généricité d'une réplique** — le refus `cible-a-ecrire` se teste, la généricité non.
- **La distribution réelle de sortie du modèle** — prémisse de l'arbitrage sur `max_tokens: 400`, non mesurable ici. **Mode d'échec nommé d'avance** : trois répliques très longues tronqueraient le JSON ⇒ `schema` ⇒ rejeu ⇒ terminal. C'est le **bon** échec.
- **Le remontage du panneau à la navigation** — dette ouverte depuis l'it2.
- **`BUG-106`, cas « acceptation au plafond »** — bloqué sur `Select.tsx`.
- **Ajouté par la QA** : le **témoin de confinement « les deux côtés »** n'a été vu rouge que **par ricochet** du sabotage `synopsis_mj`, jamais par un sabotage ciblant l'assertion positive `lignesDeValeur.length > 0` isolément. Le bloc réagit à une fuite réelle ; **le pouvoir séparateur de cette ligne-là n'est pas établi**. De même, la précondition du canari croisé sur ses **deux fabrications distinctes** n'a été vérifiée que par les tests intégrés, non re-sabordée par la QA.
- **Ajouté par la revue de PR (3ᵉ passe), donné explicitement comme « pas un finding »** : à `tests/repliques.test.tsx:252`, l'assertion **négative** du témoin de BUG-110 passe par un gabarit (`queryByText(/n'a encore aucune réplique type/)`). Sous le mutant, le rouge est porté par l'assertion **positive** de la ligne 250 : **le pouvoir séparateur de la négative n'a pas été établi séparément**, et si son apostrophe différait de celle du texte rendu, elle serait **inerte sans que rien ne le dise**. Elle est redondante par construction et sa sœur est prouvée, donc le lot n'a **pas** été rouvert pour ça. **Durcissement inscrit ici plutôt qu'oublié** : asserter la constante importée plutôt qu'un gabarit, à la première itération qui repasse dans ce fichier.

---

## Budget de contexte — relevé (LF), et la compaction qu'il a déclenchée

| Fichier | Avant | Après | Plafond | Marge |
|---|---:|---:|---:|---:|
| `CLAUDE.md` + `docs/WORKFLOW.md` | 45 926 | 45 926 | 46 080 | **154 o** |
| `code-knowledge.json` | 76 728 | 76 728 | 76 800 | **72 o** |
| `bug_history.json` | 9 641 | 9 641 | 10 240 | 599 o |
| `features_history.json` | 9 730 | 9 730 | 10 240 | 510 o |
| `docs/ROADMAP-BASCULE-IA.md` | 35 667 | 35 667 | 35 840 | **173 o** |
| `dossier-format/specification.json` | 66 487 | 66 487 | 66 560 | **73 o** |
| `dossier-copilote/specification.json` | 65 907 | **66 208** | 66 560 | 352 o |

**La spec de `dossier-copilote` n'avait que 653 o de marge pour une entrée d'`iterations_log` qui en pèse ~4 900.** La compaction a donc été faite **dans ce lot-ci**, comme la règle l'exige, sur la cible que la doctrine nomme :

- **les dix décisions `[it3a]` de `resolved_decisions`** (8 448 o) réduites à leur phrase d'arbitrage + la contrainte opérante + le renvoi à cette revue — **28 097 → 25 289 o, les 56 items conservés** ; chacun de ces raisonnements figure en entier ci-dessus, « la revue est le dossier, la spec en est l'index » ;
- **les `deviations_from_plan` des entrées 1 et 2** ramenées à leur clause d'arbitrage + renvoi à leurs revues, qui existent ;
- **l'entrée 3a écrite directement en forme d'index**, jamais en forme de journal.

**Aucun plafond n'est franchi.** Le plafond de la spec **ne se re-dérive pas vers le bas** : `ceil(66 208 ÷ 5 kio) × 5 kio` redonne 66 560.

⚠ **Constat structurel à porter à 3b** : `resolved_decisions` pèse encore **25 289 o pour 56 items** et `open_questions` 7 011 o — à eux deux, **la moitié du fichier**. La marge de 352 o ne tiendra pas une itération de plus. `code-knowledge.json` (72 o) et `dossier-format/specification.json` (73 o) sont dans le même état, **et aucune itération n'a encore eu à les écrire**. La prochaine compaction ne sera pas un ajustement.

---

## `RETOUR-COMITÉ` — ce que ce découpage a appris

1. **Un critère d'acceptation qui porte un quantificateur universel (« chaque entrée ») doit nommer son ensemble.** Le critère #1 a collapsé deux portées que le § 4.3 et le § 7 distinguaient correctement — et c'est **le § 7, plus précis que le § 6, qui a sauvé la lecture**. Coût réel : deux postes ont dû arbitrer après coup. Parade pour 3b : quand un critère et un nom de test emploient des quantificateurs différents (« CHAQUE » vs « la »), c'est un **désaccord de rédaction à trancher au tour 2**, pas une nuance de style.
2. **Le plan a imposé « vu rouge avant d'être cru », et c'est ce qui a porté toute la valeur de la passe QA.** Huit sabotages sur **code réel** (pas sur des fabrications internes aux tests) ont établi le pouvoir séparateur ; deux instruments ont été déclarés **non établis** parce que personne n'a pu les saborder isolément. Sans cette exigence, les deux auraient été comptés verts. **À reconduire tel quel.**
3. **Un plan qui écrit « quatre bouchons » sans les avoir comptés se fait corriger par l'ouvrier** : la mesure réelle est **trois** littéraux `{ estDisponible, demander }` (la 4ᵉ occurrence est une docstring). Le lot 1 a corrigé le prédicat plutôt que la propriété — bon réflexe (KR-159), mais le comité gagnerait à **compter avant d'écrire un chiffre dans une mesure attendue**.
4. **L'interface figée du § 3.3 et la prose du même § se contredisaient** sur l'eyebrow (`n` absent de `LigneRepliqueProps`). L'ouvrier a tranché en faveur de la **signature typée**. Règle à inscrire : en cas de tension entre une prose de plan et une signature déclarée dans le même plan, **la signature gagne** — elle seule est vérifiable par `tsc`.
5. **L'exécution séquentielle était le bon choix, et elle n'a rien coûté.** Deux lots, aucun worktree, aucune fusion, aucune collision. Le lot 1 à effort élevé a figé un contrat que le lot 2 a consommé sans une seule question — **zéro message relayé entre ouvriers**, ce qui est le témoin que le découpage était juste.
6. **`CopiloteService.ts` (416 l.), `contexte.ts` (564 l.) et `worker/index.ts` (487 l.) grossissent à chaque rôle.** Hors de la lettre de KR-112 (« composant ou hook »), mais 3b ajoutera un 4ᵉ rôle. **À cadrer au raffinage de 3b**, avant que la question ne se pose sous la pression d'un lot en cours.
