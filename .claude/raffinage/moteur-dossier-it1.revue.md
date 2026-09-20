# Revue d'itération — `moteur-dossier` · itération `1`

> Livrée le 2026-09-20 · Plan : `.claude/raffinage/moteur-dossier-it1.plan.md` (validé) · Notes de comité : `.claude/raffinage/moteur-dossier-it1/`
> Exécution : **L1 `contrat` seul et premier**, puis **L2 et L3 en séquence** (2 lots après le contrat → pas d'essaim, pas de worktree, pas de fusion)
> Vérification : `integrateur` → **`INTÉGRABLE`** · `qa` mode B, contexte neuf → **`CONFORME`**, 4 réserves mineures

## En une ligne

**L'auteur qui a rédigé son texte d'ouverture voit s'allumer « Aperçu du jeu », clique, et lit ce texte mot pour mot dans un écran de partie.** Avant cette itération, le CTA était désactivé en dur depuis le Temps 1 et aucun écran de jeu ne lisait un dossier.

Et le dossier qui porte encore un contrôle bloquant garde le CTA éteint **avec la raison dans l'infobulle** ; la route `partie` atteinte directement refuse de monter une session — la porte n'est pas contournable par l'URL.

## Critères — 8 sur 8 ont un témoin écrit et passant

| # | Verdict | Preuve mesurée (QA mode B, contexte neuf) |
|---|---|---|
| 1 · refus/acceptation du marqueur | **VÉRIFIÉ** | `brain/dossier/session.test.ts › refuse le dossier marque et accepte son jumeau reecrit, dans le MEME test` — les deux dossiers dans le même `it` (KR-244/197/202). Deux témoins de portée en renfort : seul le texte d'ouverture bloque, une `fins[].texte` marquée n'empêche pas d'ouvrir |
| 2 · `previewDisabledReason` en lecture dérivée | **VÉRIFIÉ POUR 3 DE SES 4 ÉTATS** | `dossierEditorScreen.test.tsx › la raison suit l etat courant sans remontage…` — premier bloquant courant, suffixe du RESTE, égalité composée `raison2 === "${raison3} (et 1 de plus)"`, le tout **sans remontage**. La 4ᵉ clause (« puis `undefined` ») n'a **aucun pouvoir séparateur** : voir Écart 2 |
| 3 · le CTA navigue | **VÉRIFIÉ** | même fichier › `clic sur Apercu du jeu: navigation vers la route partie; desactive, il ne navigue nulle part` — les deux états dans le même test, assertion sur `brain.router.current()` |
| 4 · la porte au montage du shell (KR-239) | **VÉRIFIÉ** | `play-mode/tests/porteJouable.test.tsx` — et c'est bien **`<App/>`** qui est monté sur `initialRoute: { name:'partie' }`. La mesure préalable exigée au § 10 (« `<App/>` monte-t-il en RTL ? ») est **faite et positive** : la moitié route → racine → shell n'est pas « vérifiée par personne » |
| 5 · `lieu_courant` = le départ | **VÉRIFIÉ** | `session.test.ts › le lieu courant est le DEPART, et non le premier lieu declare` — **la séparation elle-même est assertée** (`expect(dossier.monde.lieux[0].id).not.toBe(depart)`). BUG-113 est fermé, pas supposé fermé |
| 6 · l'oracle du tour zéro | **VÉRIFIÉ** | `brain/dossier/tourzeroOracle.test.ts` — non-vacuité constatée à **6 cellules**, nommées par la sortie du mutant : 1 `possede_objet`, 2 `indice_connu`, 1 `lieu_courant_est`, 2 `pnj_a_revele`. `tourzero.test.ts` **absent du diff** et **8/8** |
| 7 · la table d'audience de session | **VÉRIFIÉ** | `brain/dossier/sessionCouverture.test.ts`, 7 `it`. Trois preuves re-mesurées par la QA : (a) l'exhaustivité **par compilation** est réelle — retirer la ligne `memoire` donne `TS2741: Property 'memoire' is missing` ; (b) l'assertion `INNOVATION` **rougit sur une table vide**, donc elle n'est pas vacue ; (c) les deux `@ts-expect-error` sont **vivants** |
| 8 · aucune génération de texte (KR-250) | **VÉRIFIÉ** | `play-mode/tests/moteurSansIA.test.ts` — périmètre dérivé du disque (3 racines), plancher de non-vacuité 20, **mesuré 47 fichiers**, échec par nom de fichier |

### Les quatre mutants : rejoués par la QA, tous vus ROUGES

La skill interdit de croire une phrase sur la couleur d'un test. Les trois ouvriers ont affirmé avoir vu leurs mutants rouges ; **la QA les a reposés un par un, en contexte neuf, et les trois disaient vrai.**

| Mutant | Résultat | Ligne de rupture |
|---|---|---|
| A · critère 2 — raison recopiée dans un `useEffect` (deps `[]`) | **ROUGE** | `dossierEditorScreen.test.tsx:633` |
| B · critère 4 — garde `jouable` retirée **du shell**, conservée au CTA | **ROUGE** | `porteJouable.test.tsx:85` — et le témoin distingue **quel** refus, pas seulement « un refus » : sous le mutant, le shell tombe sur l'écran `ouverture_a_ecrire` |
| C · critère 6 — `indices_connus: ['indice.sceau-brise']` à l'ouverture | **ROUGE** | `tourzeroOracle.test.ts:142` — l'échec **nomme la cellule** |
| D · critère 8 — `import type { CopiloteService }` dans `OutcomeBlock.tsx` | **ROUGE** | `moteurSansIA.test.ts:95` |

**Mesure de l'orchestrateur, avant même le tour 2 du comité** : appliquée au dépôt, la forme à trois bras de `lieu_visite` que le tech-lead proposait faisait rougir `tourzero.test.ts` en `:200` et `:242` et forçait à réécrire `VALEUR_ATTENDUE:106`. C'est cette mesure qui a retourné le plan vers l'oracle. Le tech-lead l'a reconnue en une phrase : « j'avais mesuré l'*absence* d'amendement et cité cette mesure pour couvrir sa *présence* » — BUG-087, la faute même que sa note invoquait.

## Diff par lot — 23 fichiers, exactement les listes du § 5

| Lot | Attendu | Livré | Conforme |
|---|---|---|---|
| **L1 `session-contrat`** (`contrat`) | 6 N + 6 R | `session.ts` · `session.test.ts` · `sessionDestinations.ts` · `sessionCouverture.test.ts` · `tourzeroOracle.test.ts` · `__fixtures__/session-saturee.ts` (N) · `tourzero.ts` · `predicates.ts` · `Router.ts` · `index.ts` · `persistenceKeys.ts` · `docs/EXIGENCE-APERCU-DU-JEU.md` (R) | **12/12** |
| **L2 `cta-apercu`** | 2 R | `DossierEditorScreen.tsx` · `dossierEditorScreen.test.tsx` | **2/2** |
| **L3 `shell-partie`** | 8 N + 1 R | `index.ts` · `EcranPartie.tsx` · `OutcomeBlock.tsx` · `useSessionPersistee.ts` · 4 tests (N) · `src/App.tsx` (R) | **9/9** |

**Aucun fichier interdit touché** : `tourzero.test.ts`, `feuilles.ts`, `couverture.test.ts`, `expr.test.ts`, `controles.ts`, `EditorTopBar.tsx`, `PlayerModal.tsx`, `EditorScreen.tsx` — absents du diff. **`src/player/` : zéro fichier** (D-5). Aucun lot n'a écrit dans le périmètre d'un autre. Les noms réservés `ouvrirSession.ts` n'ont pas servi : `session.ts` fait 208 lignes, KR-112 non déclenché.

**Frontières, vérifiées par l'intégrateur** : zéro import croisé `bascule-editeur` ↔ `play-mode` — le seul rendez-vous est la variante de `Route`. Un point neuf nommé pour mémoire : `EcranPartie.tsx:3` importe `MARQUEUR_A_ECRIRE` en profondeur depuis `brain/dossier/amorce` — **premier fichier de production d'une feature à le faire**, prescrit par le plan (§ 3.C règle 3), accepté par ESLint, et les deux gardes d'`amorce.test.ts` restent vertes.

## Ce qui a été REFUSÉ — ce qu'un diff ne dit pas

*(Le registre complet est au § 8 du plan. Voici les refus qu'un relecteur ne peut pas deviner du code.)*

- **Amender une cellule de `VALEUR_AU_TOUR_ZERO` en it1** (D-2) — mesuré : ça fait rougir deux cas de Kleene existants et force la réécriture de l'attendu, ce que le critère 3 interdisait mot pour mot. Remplacé par l'oracle.
- **Deux lignes `'ia'` dans la table d'audience** (D-3) — **veto du narratif, dans son domaine, levé dans le même tour** par le tech-lead qui les a retirées. Une ligne `ia` est une **autorisation**, pas une prévision : les lignes de `destinations.ts` se corrigent en commentaire, jamais en valeur (KR-195/196, trois corrections datées, zéro valeur changée), donc la n° 10 l'aurait trouvée signée d'avance par l'itération qui n'a ni assembleur, ni borne, ni comportement d'échec.
- **Le nom `inventaire`** (D-4) — arbitrage mesuré de l'orchestrateur après que les deux rôles eurent **échangé** leur position : `predicates.ts` donne un nom `monde.*` à six prédicats sur sept, et le septième renvoyait à l'inventaire de l'**arbre**, condamné en it4. `objets_possedes` ; et L1 a corrigé la docstring de `predicates.ts:49`.
- **Les clés réservées non racines** `horloge.climat_actif` et `pnj.<id>.confiance` (D-12) — KR-249 ne réserve que les clés **racines**, et KR-251 rend l'ajout futur optionnel à vie : la réservation n'achète rien qu'un commentaire ne donne, et un `confiance: null` devrait s'écrire sur **chaque** entrée `pnj`, à jamais.
- **`lieux_visites: []` à l'ouverture** (D-13) — état incohérent, pas décision en attente : un héros présent dans un lieu jamais visité, et une ouverture qui **décrit** ce lieu verbatim avant de le faire re-découvrir au passage suivant.
- **`monde.pnj.<id>.sait`** (D-11) — 6ᵉ occurrence de KR-013 : aucun prédicat ne le lit, aucun delta ne peut l'écrire. Refusé **ni comme champ, ni comme clé réservée**, et tenu par un `@ts-expect-error` vivant.
- **`attente` et sa racine** (D-11) — une racine `attente: null` rendrait indistinguables « aucune attente en cours » et « variante non supportée ».
- **Le port de stockage en it1** (D-5) — voir « Reporté ». Et **`src/player/utils/persist.ts` converti en port** (D-19) : unique appelant `usePlaySession`, orphelin en it4 ; la duplication KR-134 meurt avec son propriétaire, elle ne se refactore pas deux fois.
- **`useOpenDossier` dans le shell** (D-20) — le dossier est **gelé** ; s'y abonner rouvrirait la porte KR-239 en cours de partie.
- **`controlerDossier` appelé depuis `src/player/` ou `brain/dossier/`** (D-21) — ferait entrer le linter de l'éditeur dans le bundle extractible.
- **`genliv:dossier:session:` comme préfixe** (D-22) — ce namespace réserve `:` au découpage du **document**.
- **Modifier `feuilles.ts`** pour lui apprendre les clés de `Record` (D-24) — `couverture.test.ts:515` exige `porteurs === ['feuilles.ts']`, mesuré rouge par sonde. La normalisation `<id>` vit côté test de session.
- **Un axe de variante sur `OutcomeBlock`** (D-18, veto UX levé par la signature) — le fichier de référence du handoff teinte `--good-bg` / `--bad-bg`, les deux seules couleurs sémantiques, réservées au **jet**. Le texte d'ouverture n'est pas un jet.
- **Un quatrième lot** (D-9) — les deux moitiés du shell ne se démontrent pas seules.

## Ce qui a été REPORTÉ, et où

| Reporté | Vers | Déclencheur |
|---|---|---|
| Le **port de stockage** `{ lire, écrire, effacer }` (D-5) | **it2**, avec son premier appelant | `ouvrirSession` est descendue dans `brain/dossier/session.ts`, donc `src/player/` n'a reçu aucun fichier et le seul code qui persiste est une feature, qui a déjà `PersistenceService` + `dossierSessionKey` |
| L'**enveloppe `<span title>`** sur le CTA désactivé (D-6) | **raffinage d'it2** | Un **relevé navigateur consigné** (Chrome + Firefox, dossier non jouable, survol du CTA). Aucun instrument du dépôt ne mesure la prémisse |
| Les **deux cellules de `tourzero.ts`**, (i) et (ii) (D-2 bis) | **it3**, lot `contrat` — **le troisième de la feature, désormais prévu** | L'édition de `VALEUR_ATTENDUE` est payée une fois ; it2 n'a pas de lot `contrat` |
| Le **replay déterministe** intra-process (D-8) | **it2** | it1 n'a aucune action à rejouer : le critère épinglerait une coïncidence (BUG-113) |
| `effacer()`, « Reprendre », la **lecture** d'une session persistée | **it2** | it1 écrit, rien ne relit |

## Écarts assumés

1. **Le témoin du critère 2 ne tue pas un miroir `useEffect` à dépendances justes** — déclaré spontanément par L2, **confirmé par mesure** de la QA (mutant A′ : vert). `act()` vidange les effets avant chaque assertion, donc le miroir rattrape son retard. C'est une limite de l'instrument RTL, **pas un défaut de code** : c'est la règle de projet (interdiction du miroir) qui couvre cette variante, pas le test.
2. **La 4ᵉ clause du critère 2 — « puis `undefined` » — n'a aucun pouvoir séparateur.** Trouvée par la QA, **non déclarée par le lot** (mutant A″ : remplacer `undefined` par une chaîne résiduelle laisse le test vert). Motif : `EditorTopBar:126` rend `title={onPreview ? 'Aperçu du jeu' : previewDisabledReason}` — dès que le bouton se rallume, la prop est **masquée**. Le code est juste ; c'est la **preuve** qui manque, et son instrument arrive avec D-6.
3. **`dossier === null`, pas `undefined`** — le plan § 5 dictait `=== undefined` ; `DossierService.get` rend `Dossier | null` et `=== undefined` n'aurait pas compilé. Le lot a corrigé de lui-même. Voir `RETOUR-COMITÉ`.
4. **`EcranPartie.tsx` fait 388 lignes**, 12 sous le signal de scission de KR-112 — et it2 y ajoute la console et `JournalRow`. La scission (extraction d'`EcranRefus` + `Cadre`) est à armer au raffinage d'it2.
5. **`Aperçu du jeu` seul dans le header quand le dossier est introuvable** — « Aperçu du jeu · undefined » aurait été pire.

**Blocages non résolus : aucun.** Les trois lots ont rendu sans `BLOCAGE`.

## Porte qualité

| Étape | Résultat |
|---|---|
| Prettier `--check` | **conforme** sur les 22 fichiers `src/` touchés |
| `tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur**, 1 warning **pré-existant hors périmètre** (`src/player/components/CharacterCreationScreen.tsx:35`) |
| `npx jest` | **113 suites / 1805 tests verts** — contribution propre d'it1 : **+7 suites, +33 tests** |
| `npm run test:mutation` | **non lancé, et c'est correct** — voir ci-dessous |

**La porte est verte, elle n'est pas déterministe, et il faut l'écrire.** `dossier-fiches/tests/panneauPersonnages.test.tsx › Force se clampe aux deux bornes 1 et 12` rougit au timeout **1 run complet sur 2** (mesuré : 3 591 ms seul contre 5 000 ms de budget ; suite à 20,8 s sous charge). **Démontré pré-existant par soustraction** — l'intégrateur a relancé la suite entière *en excluant les 7 suites neuves d'it1* et a retrouvé **le même échec unique**. Le fichier n'est pas au diff. Mais it1 ajoute 4 suites à la charge, et le hook `pre-commit-gate.sh` lance `jest` : **ce flake peut bloquer le commit**. Propriétaire : `dossier-fiches` ; correctif (timeout explicite ou moins de clics `userEvent`) à loger en `bug_history.json` par l'itération qui rouvrira ce fichier.

**KR-243, noir sur blanc plutôt que tu :** aucun des quatre fichiers du périmètre muté (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est au diff, donc pas de score de mutation. **Conséquence à ne pas escamoter** : l'arithmétique livrée ici — `ouvrirSession`, l'oracle, la table d'audience — n'est tenue par **aucun** score de mutation, et ce sera encore vrai pour l'évaluateur bivalent d'it3. `jest` en couverture de lignes est son unique instrument. La table dorée n'est pas concernée : aucun registre de règles touché.

## Ce que personne n'a vérifié

1. **Le clic bout en bout éditeur → shell** — couvert en **deux moitiés** (L2 asserte la navigation sur `DossierEditorScreen` seul ; L3 monte `<App/>` sur la route déjà posée). Aucun test ne fait les deux. Conforme au plan, mais **ce n'est pas la démo**.
2. **La clause « puis `undefined` » du critère 2** — écart 2.
3. **Un miroir `useEffect` à dépendances justes** — écart 1.
4. **Le texte de l'écran `ouverture_a_ecrire`** — aucun test ne l'asserte (conforme au plan § 3.C règle 2 : branche totale, inatteignable par l'interface). Mesuré au passage par le mutant B : elle **se rend réellement** quand la garde 3 saute, donc elle n'est pas morte, seulement non assertée.
5. **KR-242** (replay intra-process) — reporté it2, aucun instrument aujourd'hui.
6. **KR-251** (champ optionnel à vie) — aucun témoin possible en it1 ; la prémisse tient, la session **est** persistée.
7. **L'infobulle réellement lisible par l'auteur** — D-6. Toute la valeur d'usage de la formule KR-245 repose sur une prémisse **que rien dans le dépôt ne mesure**. Le texte est juste ; sa visibilité est inconnue.
8. **La fidélité visuelle au § 3** — vérifiée par lecture seulement. Les auteurs ont **délibérément** évité `toHaveStyle({ color: 'var(--x)' })`, vacue en jsdom (BUG-084) ; le seul `toHaveStyle` du lot porte sur `pre-wrap`, valeur littérale réellement rendue. **Personne ne peut affirmer que l'écran ressemble au contrat de design.**
9. **`Échap` sur un écran de refus** — testé sur la partie démarrée seulement. `Cadre` est partagé, donc c'est structurellement le même code, mais ce n'est pas mesuré.
10. **`useSessionPersistee` en réécriture / StrictMode** — seul l'état final persisté est asserté ; ni le nombre d'écritures, ni le double montage.

## La revue de PR — `REQUEST-CHANGES`, puis `APPROVE`

Le tech-lead a rendu **`REQUEST-CHANGES` : 2 majeurs, 4 mineurs**, sur une tranche que l'intégrateur disait intégrable et la QA conforme. Aucun n'était un défaut de logique — les deux majeurs portaient sur **des décisions prises par défaut** que trois itérations allaient hériter sans pouvoir les rouvrir.

| Constat | Traitement |
|---|---|
| **Majeur 1 — la session part au nuage, et personne ne l'a décidé** | **Re-mesuré par l'orchestrateur avant correction, et exact** : `useBrain().persistence` est le décorateur `CloudSyncService` (`BrainContext.tsx:101`), dont `set()` fait `queuePush` pour toute clé non-livre (`CloudSyncService.ts:415-423`) ; `remove()` n'est **pas** propagé (`:425-427`) ; et les trois familles d'état **par appareil** (préférences d'UI KR-022, librairie de monstres, réglages du worker) sont justement câblées sur le magasin **brut** (`BrainContext.tsx:84-94`). **Non corrigé ici, ÉCRIT** — trois docstrings (`useSessionPersistee.ts`, `persistenceKeys.ts`, `EtatSession`) et deux `open_questions`. Inventer un accès au magasin brut depuis une feature aurait été un contrat `brain/` non planifié, pris après la validation de la QA ; le tech-lead a confirmé qu'il l'aurait bloqué. |
| **Majeur 2 — le contrat gèle l'écriture sans nommer la lecture** | **Les deux voies prises, pas seulement la documentaire.** `dossier_maj: string` entre au contrat comme **2ᵉ exemption nommée à KR-249**, avec exactement le motif de `graine_alea` : une estampille ne se **rétro-ajoute pas**, et ajoutée en it2, KR-251 l'aurait rendue *optionnelle à vie* — « session sans estampille » serait resté un état légal pour toujours. **L'argument de D-16 n'avait été appliqué qu'une fois par le comité ; c'est le RETOUR-COMITÉ n° 6 ci-dessous.** Plus les trois points (écrasement au montage, estampille, absence de `validerSession`) en tête de la docstring d'`EtatSession`, et les trois clauses d'usage pour it2 (contre quoi comparer, ne jamais ré-estampiller en place, la réconciliation cloud est un écrivain légitime). |
| Mineur 1 — deux commentaires rendus faux par le diff | Corrigés dans `brain/index.ts` et `amorce.ts`. **Et la correction a mordu** : ma première rédaction écrivait `MARQUEUR_A_ECRIRE` dans le commentaire du baril, ce qui a fait **rougir `amorce.test.ts:77`** — la garde interdit la **chaîne** dans la source, et un grep ne lit pas les intentions. Le commentaire ne nomme donc plus ni la constante ni le chemin, **et dit pourquoi**. `amorce.test.ts:74-76` corrigé au passage : ce test garde **le baril, pas l'import profond**. |
| Mineur 2 — `DOSSIER_SESSION_KEY_PREFIX` au baril sans appelant | Retiré ; seule `dossierSessionKey` sort, avec son déclencheur de sortie future (le premier `keys(prefix)`, it2). |
| Mineur 3 — liste d'extraction non close en types | `docs/EXIGENCE-APERCU-DU-JEU.md` § 6 nomme les quatre dépendances de type (`expr.ts`, `deltas.ts`, `curseurs.ts`, `destinations.ts`) et dit **pourquoi** `sessionDestinations.ts` voyage. |
| Mineur 4 — budget et KR non mirrorés | Relevé complet au CHANGELOG. Le rattrapage des **17 KR du cadrage** (KR-237→253, jamais mirrorés, dette du commit `0fd44db`) est inscrit en `open_questions` comme **arbitrage chiffré** — ~10 kio sur 113 o de marge — et non comme un oubli. |

**Trois comptes devenus faux** par l'arrivée de `dossier_maj` (7 racines → 8) ont été corrigés à la seconde passe : `sessionDestinations.ts` ×2, `brain/index.ts` ×1.

**Le mutant de `dossier_maj`, que la seconde passe a exigé et que l'orchestrateur a posé** — parce qu'un champ entré **après** la validation QA est précisément celui qui n'a pas eu son tour :

```
Mutant : dossier_maj: dossier.createdAt        (session.ts)
Tests: 1 failed, 7 passed
  ✕ session.test.ts:171 — sessionDe(plusTard, 1).dossier_maj === plusTard.updatedAt
```

**Une seule des trois assertions le tue**, et c'est mesuré : `construireAmorce` pose `createdAt` et `updatedAt` à la même valeur, donc les deux premières restent vertes — elles épinglent une coïncidence (BUG-113). La ligne porteuse est désormais **annotée comme telle dans le test**, pour qu'un futur relecteur ne la supprime pas comme redondante.

## `RETOUR-COMITÉ`

1. **Le découpage était juste, et la mesure le prouve** : zéro collision, zéro fichier partagé, zéro `BLOCAGE`, et les deux pièges d'interface (le nom `objets_possedes`, la variante de `Route`) étaient **tous deux dans L1**, donc figés avant que L2 et L3 n'y touchent. « L1 seul et premier, puis 2 lots en séquence » a coûté trois passes et rien d'autre.
2. **Une seule correction à apporter au rituel** : le § 5 dictait une garde `dossier === undefined` alors que le contrat consommé rend `Dossier | null`. Le comité applique déjà « mesure d'abord » aux lignes de fichier qu'il cite ; **il doit l'appliquer aussi aux signatures dont il dicte un test d'égalité**. `tsc` l'aurait attrapé, mais un plan qui se trompe sur une signature existante est un plan dont l'ouvrier apprend à se méfier.
3. **Le geste qui a le plus payé** : l'orchestrateur a rejoué au dépôt l'affirmation la plus load-bearing du tour 1 **avant** d'ouvrir le tour 2. Elle était fausse, et elle a changé la forme de l'itération. Deux rôles s'y appuyaient. À refaire systématiquement sur toute affirmation de couleur de test citée par un rôle.
4. **La QA en mode B a trouvé ce que les trois ouvriers et l'intégrateur n'avaient pas vu** (le trou A″), en cherchant explicitement le pouvoir séparateur *manquant* plutôt qu'en rejouant les mutants annoncés. C'est cette question-là — « quel mutant personne ne m'a demandé de poser ? » — qui distingue le mode B d'une relecture.
6. **Un argument que le comité a posé une fois et n'a pas rejoué.** « Une graine ne se rétro-ajoute pas » (D-16) a valu une exemption nommée à KR-249 pour `graine_alea`. **Personne n'a posé la même question pour l'estampille du dossier joué**, qui la méritait autant — c'est la revue de PR qui l'a trouvée. Quand le comité accorde une exemption sur un motif, il doit **balayer le contrat avec ce motif** avant de le figer : une exemption est une règle, pas un cas particulier.
7. **« Mesure d'abord » vaut aussi pour l'implémentation derrière un type consommé.** Le plan a écrit `useSessionPersistee` sur `PersistenceService` sans ouvrir ce qu'est `useBrain().persistence` — un décorateur de synchronisation. Même classe d'erreur que le `dossier === undefined` : une signature citée sans être ouverte, une fois sur le *type*, une fois sur l'*instance*.
8. **Pour it2** : trois dettes à ouvrir dès le cadrage de l'itération — la scission d'`EcranPartie.tsx` (KR-112 à 12 lignes), le port de stockage avec son premier appelant, et le relevé navigateur qui débloque D-6. Plus le rappel que **it3 porte un troisième lot `contrat`**, prévu et non subi.
