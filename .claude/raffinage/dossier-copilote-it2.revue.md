# Revue d'itération — `dossier-copilote` · itération `2`

> Plan : `.claude/raffinage/dossier-copilote-it2.plan.md` (validé le 2026-09-17, comité à 5 rôles, 2 tours, 43 désaccords statués).
> Exécution : 2 lots **séquentiels**, même arbre de travail, aucune branche, aucun worktree, aucune fusion.
> Verdict QA mode B : **CONFORME**. Aucun défaut bloquant.

## En une ligne

**L'auteur peut maintenant confier un indice mal servi à un personnage que le copilote lui désigne** — il ne le pouvait pas : jusqu'ici, un indice signalé par `indice-sans-source` ne se réparait qu'à la main, fiche par fiche.

---

## 1 — Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Confinement d'audience + `entitesInjectees` par **égalité** | **VÉRIFIÉ** | `contexte.test.ts › confinement d audience du second role` (les 9 chemins à `'ia'`, `DEROGATIONS_AUDIENCE` vide) · `› entitesInjectees egale cible plus rangs` : `toEqual([indiceId, ...rangs.values()])`, jamais une inclusion |
| 2 | Refus `cible-a-ecrire`, **0 fetch**, 4 motifs discriminés | **VÉRIFIÉ** | `contexte.test.ts › les quatre refus, discrimines` : 4 dossiers fautifs, `new Set(motifs).size === 4`, `espionFetch` jamais appelé |
| 3 | Liste vide = **SUCCÈS**, texte discriminé | **VÉRIFIÉ à trois niveaux** | `schemaSortie.test.ts › la liste vide est un SUCCES` · `CopiloteService.test.ts › une liste vide est un SUCCES, pas un echec` · `detenteurs.test.tsx` : 7 cas d'état, `new Set(textesRendus).size === 7` |
| 4 | Rang inconnu ⇒ **lot entier** refusé, rejeu une fois puis terminal, doublon refusé | **VÉRIFIÉ** | `CopiloteService.test.ts › un rang inconnu rejette le LOT ENTIER` (2 appels, aucun repêchage de `['P1']`) · `› le second echec est TERMINAL` avec un **3ᵉ bouchon conforme** et `toHaveBeenCalledTimes(2)` — le pouvoir séparateur exact que le nom promet · `schemaSortie.test.ts › doublon non adjacent` |
| 5 | Garde KR-236, gabarit apparié, **canari croisé** | **VÉRIFIÉ, et reprouvé par la QA** en éditant le vrai `worker/index.ts` | Gabarits intervertis ⇒ **7 tests rouges**, dont `canari croise`, `totalite des gabarits par role` et les deux témoins exécutables |
| 6 | Les deux plafonds, `describe.each`, rôle le plus large **dérivé** | **VÉRIFIÉ, + mesure indépendante** | `worker/frontiere.test.ts` : `describe.each(ROLES)`, `ROLE_LE_PLUS_LARGE` par `.reduce`, jamais écrit. Mesure QA : `indice-detenteurs` pire cas **51 899 o** / plafond **52 224 o** ⇒ marge **325 o** ; `personnage-prose` marge 33 441 o |
| 7 | Écriture par `update`, ordre KR-004, `Savoir` à **exactement deux clés** | **VÉRIFIÉ** | `detenteurs.test.tsx › accepter pose un Savoir a EXACTEMENT deux cles` : `Object.keys(savoirs[0]).sort() === ['certitude','indice_id']`, `certitude === CERTITUDE_INITIALE` importée · `› ordre persistance puis evenement` : `setSpy.invocationCallOrder[0] < emitSpy.invocationCallOrder[0]` |
| 8 | Bout-en-bout accepté **+** référence orpheline par course | **VÉRIFIÉ, avec une nuance à inscrire** | Moitié « course » : **directement** prouvée — `detenteurs.test.tsx › reference orpheline par course` retire l'indice entre proposition et acceptation, `setSpy`/`emitSpy` non appelés, `savoirs` vide, anomalie affichée, ligne **non décidée**. Moitié « le dossier reste valide » : prouvée **TRANSITIVEMENT** — `DossierService.update` ne rend `'ecrit'` que si `validateDossier` a passé (contrat couvert ailleurs), et non par une assertion directe sur `validateDossier` dans ce lot |

**La nuance du critère 8 est la même famille que l'écart de l'it1** (« critère 4 prouvé en contrat, pas en bout-en-bout ») : elle est plus faible ici que l'it1 ne l'était, puisque la moitié la plus dure — le refus réel par validation — est cette fois prouvée directement, sur une course et non sur un bouchon. C'est le cas nominal KR-234 que l'it1 ne pouvait pas construire.

## 2 — Diff par lot, comparé à la liste du plan

| Lot | Annoncé | Livré | Écart |
|---|---|---|---|
| 1 `second-role` (`contrat`) | 14 fichiers, aucun sous `src/features/` | **14 / 14**, tous sous `src/brain/` ou `worker/` | aucun |
| 2 `deux-cartes` | 13 fichiers, tous sous `src/features/dossier-copilote/` | **13 / 13** (6 R + 7 N) | aucun |

**Disjonction par préfixe de chemin : vérifiée.** Les dix fichiers « hors de tout lot » — `LigneProposition.tsx`, `cablage.test.ts`, `dossier-copilote/index.ts`, `libelles.ts`/`.test.ts`, `controles.ts`/`.test.ts`, `atteignabilite.ts`, `pastilles.ts`, `dossier-reference.json`, `App.tsx`, `lintIsolation.test.ts`, et tout fichier de `dossier-canon`/`dossier-fiches`/`dossier-registres` — ont **zéro diff**, constaté par `git diff --stat` ciblé.

`src/features/dossier-copilote/specification.json` porte un diff. **Arbitrage de l'orchestrateur, relevé par la QA et tranché ici** : ce fichier est écrit par l'orchestrateur à l'étape de report du raffinage et à l'étape 4 des Build Steps, il n'appartient à aucun lot par construction, et aucun ouvrier ne l'a ouvert. Ce n'est pas une fuite de périmètre. La définition de fini gagnerait à le dire au lieu de laisser un vérificateur le découvrir.

## 3 — Ce que la QA a reposé elle-même (BUG-084 : un témoin qui ne sait pas échouer ne prouve rien)

Six sondes, **toutes posées en éditant le vrai fichier de production** — pas une perturbation en mémoire dans le test — exécutées, puis restaurées avec `git diff --stat` identique vérifié à chaque fois :

| # | Implémentation fautive écrite | Résultat |
|---|---|---|
| 1 | Les deux gabarits de `worker/index.ts` **intervertis** | **7 rouges** — la panne se propage réellement à l'invite composée |
| 2 | Un mot changé d'**un seul** côté de la condition d'état (`destinations.ts`) | **rouge** immédiat |
| 3 | Garde `enVolRef` retiré | **les deux** témoins de double-clic (carte 1 **et** carte 2) rougissent, 1 → 2 appels |
| 4 | Le gel retiré de `CarteTisserIndices.tsx` | **rouge** — le `Select` retombe sur « Aucun indice signalé » pendant l'acceptation |
| 5 | `@ts-expect-error` retiré sur l'appel incompatible | **TS2769** réel à la ligne exacte — le test de type n'est pas une directive morte |
| 6 | Marge du plafond réseau, mesurée par script jetable | **325 o au chiffre près**, confirme la valeur annoncée |

**Aucune sonde ne subsiste** : `git status --porcelain` et `git diff --stat` identiques avant/après, `jest` et `tsc` rejoués verts en dernier lieu.

Sur la marge de 325 octets, jugée tenable et motivée : ce n'est pas une marge de sécurité, c'est **l'arrondi au kilo-octet supérieur de la formule** — doctrine déjà écrite (« l'arrondi EST la marge, on n'en ajoute pas une seconde »). Le plafond réseau est en outre un filet **redondant** : le refus primaire se fait en amont, en caractères, et suppose déjà le pire cas d'encodage à 3 octets/caractère, mesuré et non inventé.

## 4 — Ce qui a été REFUSÉ, et pourquoi *(ce qu'un relecteur ne peut pas deviner du diff)*

Les 43 désaccords du § 8 du plan sont balayés. **Aucun `REJETÉ` n'a été livré quand même** — vérifié un par un sur le code, pas sur les comptes rendus.

- **La certitude choisie par le modèle — REJETÉ.** Un `croit` est une information **fausse** ; et la mesure qui tranche est que `certitude` **ne décide de rien** dans `atteignabilite.ts` : un détenteur menteur éteindrait l'alerte exactement comme un sincère. Le copilote aurait fait disparaître son propre déclencheur. *Vérifié : `CarteTisserIndices.tsx` pose `CERTITUDE_INITIALE` importée, jamais une valeur lue de la réponse.*
- **Re-filtrer à l'acceptation les détenteurs déjà détenteurs — VETO TL-7.** Deux autorités pour un même prédicat, donc source de vérité dupliquée. *Vérifié : aucun filtre côté écran ; l'exclusion est structurelle dans l'assembleur — ils sont **inénonçables**, pas filtrés.*
- **Une 5ᵉ entrée dans `LIBELLE_DES_CHAMPS` — VETO TL-8.** `label="VÉRITÉ"` vit dans `dossier-registres`, fichier interdit ; la seule façon de reverdir aurait été d'éditer un fichier interdit ou **de modifier le témoin**. *Vérifié : `libelles.ts`/`.test.ts` absents du diff, rejoués verts.*
- **La liste vide traitée comme un échec — REJETÉ.** Punir la réponse honnête est une machine à complaisance : un modèle qui ne peut pas dire « personne » nommera quelqu'un. *Vérifié : aucun prédicat de non-vacuité dans `validerDetenteurs`.*
- **Accepter les rangs valides d'un lot en écartant les autres — REJETÉ.** Réparation silencieuse : l'auteur ratifierait une liste tronquée sans le savoir.
- **`LigneDetenteur` en variante de `LigneProposition` — REJETÉ.** *Vérifié : fichier séparé, aucune prop `chemin`/`valeurAvant`/`valeurApres`/`certitude`.*
- **`brain/copilote/` important `controlerDossier` — REJETÉ.** Le constat gouverne quel indice l'auteur peut confier, à l'écran ; il n'entre ni dans le contexte, ni dans la légalité d'une demande. *Vérifié par lecture des imports.*
- **Le message du contrôle injecté dans le contexte, le seuil du linter récité dans l'invite, `apparence` injectée, un motif en prose par détenteur, le prefill, élargir `PARTIES_REQUISES` à `string[]`, un registre-valeur des rôles, un `ReponseCopilote<P>` à défaut générique, partager les styles avec `LigneProposition`, un 3ᵉ lot `worker/` — tous REJETÉS**, motifs au § 8 du plan.

## 5 — Ce qui a été REPORTÉ, et où

Quatre reports, tous inscrits dans `implementation.open_questions` de la spec avec leur **condition d'ouverture écrite** :

| Report | Condition d'ouverture |
|---|---|
| Promouvoir `LIBELLES_CERTITUDE` vers `brain/` | La première itération autorisée à toucher `dossier-fiches` **et** ayant un second consommateur réel |
| Exclure d'une relance les candidats refusés | Forme imposée : un ensemble d'identifiants exclus appliqué **à l'assemblage**, jamais un historique dans l'invite |
| Éditer la certitude d'un détenteur | Question **distincte** de celle du texte « APRÈS » (prose libre) — ne pas les fusionner |
| Injecter `relations[].lien` | Une extension **nommée** du prédicat écrite aux deux sites et épinglée par le test « présent aux DEUX sites » |

**Deux `open_questions` ont été CLOSES** et sorties de la liste : le protocole amont (Anthropic Messages `2023-06-01` **ratifié comme décision de comité**, les deux passages « choix de l'ouvrier » de `worker/index.ts` réécrits) et `estDisponible()` (**consommée**, dette KR-109 fermée).

## 6 — Écarts assumés

1. **`assemblerContexte` renommé `assemblerProse`** et privé de son paramètre `role`. Zéro appelant hors lot, vérifié avant écriture. Sans conséquence pour la feature.
2. **Une incohérence d'un caractère dans le plan lui-même** : le § 4.7 écrivait `**en JEU**` en minuscule dans le paragraphe normatif et `'**En JEU**'` en majuscule dans la clause à asserter. L'ouvrier a tranché correctement — **le paragraphe qui part aux deux sites fait foi**. À corriger dans le plan si on le relit.
3. **`vide-mais-réussi` fusionné** dans le test « sept textes d'état » plutôt qu'isolé : même propriété prouvée dans un balayage cohérent, un doublon de montage en moins.
4. **Warning React `act(...)`** sur `detenteurs.test.tsx › reference orpheline par course` — le retrait d'indice déclenche une mise à jour hors `act`. Le test passe. **Relevé par l'intégrateur, non corrigé, à porter à la revue `tech-lead`** : un warning `act` est exactement le genre de bruit qui masque un vrai défaut plus tard.
5. **`contexte.ts` fait 430 lignes** (≈ 60 % de docstrings) et `CopiloteService.ts` 327. KR-112 vise les composants et hooks ; aucun fichier du lot 1 n'en est un, et le plan cadrait l'heuristique sur le lot 2. À trancher si on veut généraliser le seuil.

**Aucun blocage non résolu.**

## 6 bis — La revue de PR (`tech-lead`), et ce qu'elle a changé

Verdict initial : **`REQUEST_CHANGES`** — un `major`, quatre `minor`. Tous traités, tous journalisés (`BUG-101` à `BUG-105`).

**Le `major` est la récurrence exacte du défaut que cette même porte avait trouvé à l'it1** (`BUG-097`) : un état dérivé vif recalculé sur l'effet de bord de son propre geste. Le gel du § 3.6 couvrait le constat affiché et les options — **pas la valeur sélectionnée**. Après une acceptation, `constatId` se re-dérivait de `constatsLive`, qui vient d'un abonnement réveillé par `dossier:updated`, c'est-à-dire par l'acceptation elle-même. À deux constats, le `Select` nommait une cible que la carte ne servait pas. Rien ne corrompait — `handleAccepter` lit `contexteGele.indiceId` — **l'écran mentait pendant que l'auteur ratifiait**.

**Et le motif de la revue était à moitié faux — mesuré, pas supposé.** Elle décrivait un cas (a) « à un seul constat, le champ INDICE s'affiche VIDE ». **Ce cas n'existe pas** : sans `<option>` correspondante, React ne marque aucune option `selected`, et un `<select>` de taille 1 sans option sélectionnée retombe **par spécification** sur la première — qui est l'option gelée. L'écran restait juste par accident. Conséquence directe : **le premier témoin que j'ai écrit restait VERT sous le mutant**, et je ne l'ai su qu'en reposant la faute. Le défaut n'est atteignable qu'au cas (b), à **deux** constats — c'est là que le témoin livré le pose. Une conclusion juste sur un motif faux cède au premier contradicteur (famille `BUG-080`) ; les deux ont été corrigés.

| # | Sévérité | Finding | Traitement |
|---|---|---|---|
| 1 | `major` | Le gel ne couvre pas la valeur du `Select` | Corrigé — la cible gelée prime ; dégel explicite au changement de cible. **Mutant écrit, vu rouge.** `BUG-101` |
| 2 | `minor` | « Lancer » actif et silencieusement inopérant | Corrigé — `constatVivant` entre dans `desactive`, avec un texte dédié. **Mutant écrit, vu rouge.** `BUG-102` |
| 3 | `minor` | Warning React `act(...)` | Corrigé — une ligne. Règle portable écrite. `BUG-103` |
| 4 | `minor` | KR-236 incomplet, KR-233 périmé | Amendés dans **ce lot** — récurrence de `BUG-098`, sous sa forme « incomplet » plutôt que « faux ». `BUG-104` |
| 5 | `minor` | Relevé du budget non tracé | Tracé — et il avait trouvé **deux** dépassements. `BUG-105` |

**Un texte hors du § 3.3 du plan**, ajouté au correctif n° 2 et à inscrire comme écart : `TITRE_INDICE_PLUS_SIGNALE`. Il nomme un état que le plan n'avait pas prévu — la cible gelée a quitté la liste des signalés, typiquement parce que le détenteur qu'on vient d'accepter l'a réparée. `TITRE_AUCUN_INDICE_SIGNALE` parle du **dossier entier** et serait faux ici.

**Ce que la revue a vérifié et trouvé bon**, pour que le relecteur sache ce qui a été regardé : encapsulation (les handles sont nommés par leur **intention**, `focusAccepter()` et non `getRef()` ; aucun `ref` DOM ne traverse une frontière ; `CarteAssistant` expose son `aria-label` comme point d'ancrage délibéré) · KR-013/113 (deux `useEffect` dans le périmètre, aucun miroir d'état) · Timer Safety (minuteur **et** écouteur retirés dans le `finally`, `AbortController` abandonné au démontage) · les signatures contre le § 4 · **les 43 désaccords re-passés un par un sur le code** — aucun `REJETÉ` livré.

### Second tour de revue — quatre findings de plus, dont un dans un fichier **toujours chargé**

Verdict du second tour : **REQUEST_CHANGES**, sans **aucun** changement demandé sur le code des correctifs — les cinq premiers findings étaient tenus. Ce qu'il a trouvé est ailleurs, et c'est plus intéressant.

| # | Sévérité | Finding | Traitement |
|---|---|---|---|
| 6 | `major` | **`docs/WORKFLOW.md` § Worker Route Parity décrivait un worker révolu** — 111 lignes, une famille de routes, un appelant, liste de contrôle IA « à écrire ». Mesuré : **424 lignes, deux familles, deux appelants, liste livrée**. Et sa **recette de relevé manquait l`appelant IA** (0 résultat) : le service compose son URL dans une variable puis appelle `fetch(url, …)`. | Section réécrite sur l`état mesuré, **net-négative** (1168 → 1030 o) : le couple passe de **28 à 154 o** de marge. Recette neuve **rejouée telle qu'écrite** — elle rend bien les deux appelants. `BUG-107` |
| 7 | `minor` | Le retour de focus sur « Lancer » est **défait par le correctif n° 2** : si la dernière décision éteint le constat, le focus vise un bouton que le même rendu désactive. jsdom l`accepte, un navigateur renvoie à `body`. | **Dette assumée, pas corrigée** — la correction propre viserait `brain/components/Select.tsx`, une **primitive partagée** qu`un lot feature ne touche pas en douce. Le témoin cesse de prétendre le contraire : sa dernière décision est un **rejet**, qui n`écrit rien, garde « Lancer » actif, et asserte `toBeEnabled()`. `BUG-106` |
| 8 | `minor` | **La contrepartie du correctif majeur n`avait aucun témoin.** Retirer `setContexteGele(null)` laissait la suite **entièrement verte** et bloquait le `Select` pour toujours — un écran **mort**, pire que l`écran qui ment. | Trois assertions ajoutées. **Mutant écrit et vu rouge.** `BUG-108` |
| 9 | `minor` | Renvoi **circulaire** créé par ma propre compaction de KR-159 : les deux fichiers s`envoyaient mutuellement le détail. | Les deux adresses pointent ce qui existe. Touche `dossier-format/specification.json`, **hors des deux listes de lots** — écart inscrit. `BUG-107` |

**Ce que le second tour apprend, et qui vaut plus que les quatre findings** : le balayage des documents périmés s'était arrêté **un fichier trop tôt**, et juste avant le plus cher. J'avais amendé KR-236 et KR-233 dans `code-knowledge.json` ; leur jumeau vivait dans le couple lu **à chaque session, avant** `code-knowledge.json`. Un instrument de relevé **inversé** y est pire qu'aucun : il rend un vert qu'on cite.

## 7 — Ce que personne n'a vérifié

*Recopié du § 7 du plan, augmenté de ce que la vérification a trouvé. Un critère qu'aucun instrument existant ne couvre n'est pas « vérifié parce que jest est vert ».*

- **La qualité de la désignation et tout taux de complaisance** — aucun instrument du dépôt ne constate une cohérence narrative (KR-229). Tout est porté par des **refus déterministes** et par l'impossibilité de dire certaines choses, jamais par une consigne d'invite.
- **La justesse** du texte de la condition d'état réécrite : seule sa **présence aux deux sites, mot pour mot** est instrumentée. Revue humaine seule.
- **⚠ LE REMONTAGE DU PANNEAU À LA NAVIGATION — NON VÉRIFIÉ, et le plan l'exigeait.** `estDisponible()` n'est pas réactif (il délègue à `CloudSettingsService.isConfigured()`, sans abonnement) : un réglage cloud posé après coup laisse « Lancer » désactivé jusqu'à un re-rendu déclencheur. Le § 5.1 et le § 8 n° 43 du plan demandaient une **mesure au lot 2, pas une supposition**. La QA n'a trouvé **aucun test qui l'exerce**, et l'ouvrier signale honnêtement ne pas l'avoir mesurée. C'est la seule promesse du plan qui n'a pas été tenue. Direction de la panne correcte (l'auteur lit une raison, il ne perd aucune donnée), mais **à mesurer avant que quiconque s'appuie dessus**.
- **Le retour de focus après une décision qui éteint le constat** : non couvert, et **non couvrable en jsdom** — il ne rejoue pas le blur-sur-`disabled`. Dette nommée `BUG-106`, direction de panne sûre (un contrôle visible et voisin), correction bloquée sur une primitive partagée.
- **`CANDIDATS_MAX = 8`** reste une valeur d'**entrée**, pas une mesure. `M = 5361` a été mesuré **après** l'avoir posée. Si le budget de 17 000 déplaît un jour : **on baisse K, on ne monte jamais le budget.**
- **Le comportement réel du fournisseur amont** : les deux témoins exécutables **moquent** l'amont. Le protocole est ratifié, pas éprouvé en production.
- **Le majorant du test de plafond** : `frontiere.test.ts` construit son enveloppe avec un squelette portant `champ`, que seul le rôle prose envoie. Pour `indice-detenteurs` c'est un **majorant** (+49 octets) — sens d'erreur correct pour une garde, mais ce n'est pas l'enveloppe exacte. Écrit dans le test.

- **La recette de relevé du § Worker Route Parity est couplée aux noms de variables d`aujourd'hui** (`base` / `workerUrl`, sensible à la casse). Un troisième appelant qui nommerait sa racine autrement lui échappe **en silence** — c`est la classe de `BUG-107`, déplacée de la syntaxe d`appel vers le nom de la variable. Le moment où ça mordra est nommé par la section elle-même : la route SSE du Temps 2. **Des trois items ci-dessous, c`est celui à retenir** — il vit dans le fichier lu à chaque session. La recette se **rejoue** au prochain appelant, elle ne se relit pas.
- **La cellule « dernière décision = acceptation » × « retour du focus sur Lancer » n`est couverte par personne**, et elle est atteignable **sans dette** : une proposition à **un seul** détenteur porte l`indice de 0 à 1 producteur, le constat survit, « Lancer » reste actif. Le geste le moins cher pour fermer `BUG-106` sans toucher à une primitive partagée.
- **`setRefusEcriture(null)` dans `handleChangerConstat` est observable et sans témoin** : `IssueList` est rendue **hors** du garde de phase, donc après un refus par course, changer de cible laisserait la liste d`anomalies périmée à l`écran si l`instruction sautait. Atténué par `handleLancer`, qui la remet à `null`.

*(Les trois ci-dessus viennent du troisième tour de revue, qui a rendu `APPROVE` : aucun ne bloque, tous sont des angles morts nommés plutôt que des défauts constatés.)*

## 8 — Porte qualité

| Étape | Résultat |
|---|---|
| `prettier --check` | Propre sur **tous** les fichiers du diff. 3 warnings pré-existants hors périmètre (`issues.ts`, `validate.ts`, `panneauControles.test.tsx`) |
| `tsc --noEmit` | **0 erreur** |
| `eslint` | **0 erreur**, 1 warning pré-existant hors périmètre (`player/CharacterCreationScreen.tsx:35`) |
| `jest` | **98 suites / 1445 tests, tous verts** (départ : 87 suites / ~1295 à l'it1 ; 97 / 1433 après le lot 1) |
| `test:mutation` | **SANS OBJET, confirmé sur le diff** — ni `challenge.ts`, ni `combat.ts`, ni `xp.ts`, ni `characteristics.ts` dans `git diff --name-only`. Table dorée sans objet de même : aucun registre couvert n'est touché, **aucune section de `docs/REGLES-DU-JEU.md` à citer** — ce lot ne pose, ne modifie et n'étend aucune valeur de règle de jeu |

**Budget de contexte, relevé dans ce lot (octets LF de l'index) et compacté ici, pas au suivant** : `specification.json` de la feature **69 253 → 66 079** (plafond 66 560 — les neuf arbitrages `[it1]`, code livré et revue portant le raisonnement, réduits à leur phrase d'arbitrage + renvoi ; 46 entrées conservées) · `code-knowledge.json` **76 792 → 77 593 → 76 621** (plafond 76 800 — l'amendement de KR-236 l'a fait franchir, résorbé par le resserrage des deux KR amendés puis la compaction de KR-159 sur l'axe nommé par le fichier) · `bug_history.json` **10 213 → 9 510** (plafond 10 240 — **scission** : BUG-097 à BUG-100 partent dans `bug_history.dossier-copilote.json`). Tiennent sans geste : `features_history.json` 9 730/10 240 · `docs/ROADMAP-BASCULE-IA.md` 35 695/35 840. **À la corde, et dit comme tel** : le couple `CLAUDE.md` + `docs/WORKFLOW.md` à **28 octets** de son plafond, `code-knowledge.json` à 179 — la prochaine itération qui a quelque chose à y écrire compacte **avant**, pas après.

Non-régression : `controles.test.ts`, `libelles.test.ts`, `cablage.test.ts`, `lintIsolation.test.ts` **rejoués verts sans une seule retouche**, et absents du `git diff --stat`.

## 9 — `RETOUR-COMITÉ`

Ce que ce découpage a appris, pour l'itération suivante :

1. **La frontière des lots peut être un PRÉFIXE DE CHEMIN, et c'est strictement mieux qu'une liste.** « Lot 1 ∌ `src/features/**`, lot 2 ⊂ `src/features/dossier-copilote/**` » se vérifie d'un `grep`, par n'importe qui, sans relire 27 lignes. Toutes les autres tentatives de découpage de cette itération échouaient sur la disjonction ; celle-là ne pouvait pas. **À rechercher activement au prochain raffinage.**
2. **Une contrainte d'outillage peut dicter une décision de contrat, et il faut la mesurer AVANT de trancher.** Le choix « surcharge » plutôt que « deux méthodes » n'est pas venu d'un goût d'architecture : il est venu de trois bouchons de test annotés `jest.Mock` nu. Un membre de plus et le lot contrat ne passait plus `tsc` seul, donc il happait des fichiers de feature, donc le découpage s'effondrait. **Le tech-lead ne pouvait pas le savoir au tour 1 — il l'a mesuré au tour 2, et ça a tout réorganisé.**
3. **Faire vérifier par l'orchestrateur les faits que le comité ne peut que LIRE a un rendement élevé.** Le tech-lead n'avait aucun outil d'exécution et marquait ses faits `LU`. Les sept que j'ai mesurés portaient deux vetos et toute la frontière des lots — tous confirmés, mais la mesure coûtait dix minutes et l'erreur aurait coûté l'itération.
4. **Une assertion verte déjà au dépôt peut redessiner la moitié d'un plan.** `controles.test.ts:1143` disait depuis l'it1 que le seul indice signalé de la fixture n'a ni `verite` ni `formulation_joueur`. Personne ne l'avait lue sous cet angle. Elle a fait du **refus l'écran nominal**, promu un cas limite en critère d'acceptation, et interdit le chemin passant sur la fixture. **Chercher l'assertion existante qui contredit le plan est moins cher que de la découvrir à l'essaim.**
5. **Deux rôles qui échangent leurs positions entre les tours est un signal, pas un bruit.** C'est arrivé deux fois (le gabarit en `Record`, le budget par rôle). L'arbitrage utile a été de trancher **sur l'argument, pas sur le mouvement** — et dans les deux cas l'objection qui avait tué la proposition au tour 1 s'était dissoute entre-temps pour une raison mesurable.
6. **Ce qu'il faut corriger la prochaine fois** : la définition de fini dit « aucun fichier touché hors de la liste de son lot » sans excepter `specification.json`, que l'orchestrateur écrit toujours. Un vérificateur en contexte neuf l'a signalé comme une possible violation — à lui coûter zéro seconde la prochaine fois.
