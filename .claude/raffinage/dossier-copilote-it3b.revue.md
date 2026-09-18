# Revue d'itération — `dossier-copilote` · itération `3b`

> Exécutée le 2026-09-18 · plan `.claude/raffinage/dossier-copilote-it3b.plan.md` (validé, porte 2 franchie)
> **Exécution séquentielle, 2 lots** — aucun essaim, aucun worktree, aucune fusion. Pipeline : `dev-contrat` (lot 1, seul et en premier, **scission incluse**) → `dev-lot` (lot 2) → `integrateur` → `qa` mode B.
> Verdict QA : **livrable après correction d'un finding majeur** — le mutant survivant du critère #7, **corrigé et vu rouge** (`BUG-113`).

## En une ligne

**L'auteur peut faire compléter le plan d'actions d'un personnage** : le copilote propose **une** prochaine étape, l'auteur l'accepte ou la refuse, et l'acceptation écrit `{ etape, action }` à la suite de `plan_actions[]` — `etape` posé **par le code, sur la liste vive**.

---

## Critères d'acceptation

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | 9 chemins `'ia'`, `DEROGATIONS_AUDIENCE` vide, **préfixe injecté DANS L'ORDRE non tronqué**, `synopsis_mj` des deux côtés | **VÉRIFIÉ** | La QA a **recontrôlé les 9 chemins un par un dans `destinations.ts`** (fichier non touché), et constaté que le test du préfixe compare une **liste réordonnée**, pas un `toContain` |
| 2 | Refus `cible-a-ecrire` sur **un chemin nommé**, 0 fetch, trois motifs discriminés | **VÉRIFIÉ** | `new Set(...).size === 3`, espion `fetch` à zéro |
| 3 | Tableau refusé `schema` **sans repêchage**, chaîne vide `vide`, prédicats séparables | **VÉRIFIÉ** | **Trois mutants rejoués par la QA sur le code réel** : `[0]` ⇒ 3 rouges · clé en trop ⇒ 2 rouges · `String(…)` ⇒ 3 rouges |
| 4 | Étape A : **diff vide sur les cinq importateurs** avant la 1ʳᵉ ligne du 4ᵉ rôle | **NON VÉRIFIÉ — et le critère est INFAISABLE tel qu'écrit** | Voir « Écarts assumés » n° 1. La QA refuse de le compter bon : l'artefact intermédiaire n'existe pas dans un diff final. **Ce qui EST établi** : aucune ligne d'import n'a changé, et le diff de `contexte.test.ts` est **borné aux chemins et à leurs discriminants, sans aucune assertion affaiblie** |
| 5 | Ligne 319 vue rouge, **neuf instruments à zéro diff** | **VÉRIFIÉ** | Ligne 319 **rejouée rouge par la QA** (`Received length: 6`) ; les neuf confirmés intacts — 4 hunks au total dans le fichier, aucun ne touche leur définition |
| 6 | Budget **mesuré**, `TAILLE_MAX_CORPS_IA` re-dérivé sur les quatre, borne d'invite = borne du validateur | **VÉRIFIÉ** | **`M = 1022` reproduit par sonde indépendante** ⇒ 4000. `TAILLE_MAX_CORPS_IA` re-dérivé **en octets UTF-8, pas en `.length`** ⇒ 52 224, toujours porté par `indice-detenteurs` |
| 7 | `etape` posé par le code, `1…k+N` sans doublon, **depuis la liste vive** | **VÉRIFIÉ après correction** | Le code était correct ; **le témoin ne l'était pas** — voir `BUG-113`. Témoin ajouté, **mutant vu rouge** |
| 8 | Bout-en-bout, dossier accepté par `validateDossier` ; refus ⇒ rien persisté | **VÉRIFIÉ** | `planActions.test.tsx`, nominal + sous-cas refus |

**7 critères sur 8 établis par preuve**, le n° 4 déclaré **non vérifiable par construction** plutôt que compté bon.

---

## Ce que la QA en mode B a trouvé — et que quatre autres portes n'ont pas vu

**`BUG-113` (major) — le test cardinal de l'itération ne gardait rien.**

Le comité avait explicitement préféré une **assertion de résultat** (« les `etape` valent `1…k+N` ») à une formule recopiée, au motif qu'*une formule recopiée ne se vérifie pas, un résultat si*. La QA a posé le mutant que le plan exigeait de voir rouge — `etape` calculé depuis le bloc **gelé** au lieu de la liste **vive** — et **les treize tests sont restés verts**, toute la suite comprise.

**Motif** : le test faisait précéder **chaque** acceptation d'un clic « Lancer », qui **re-gèle sur l'état courant**. Gel et liste vive **coïncidaient donc toujours** au moment de l'écriture, et l'assertion était vraie **des deux côtés du mutant**. Le témoin gardait **le CALCUL**, jamais **LA SOURCE**.

Or la source **est** l'invariant. Le plan l'écrit lui-même : *entre la demande et l'acceptation, le plan bouge*, et un numéro calculé au mauvais instant est **périmé en silence** — aucune règle d'unicité n'étant arbitrée, le SSOT ne refuserait pas le doublon.

**Corrigé** : un témoin qui instrumente **le seul scénario où les deux sources divergent** — une écriture externe (l'auteur ajoute une étape à la main) **entre** le clic Lancer et le clic Accepter. Gel = 1, document = 2, la neuve doit valoir **3** ; depuis le gel elle vaudrait 2, **doublon** avec l'étape ajoutée à la main. **Mutant exact de la QA reposé ⇒ 1 test sur 14 rouge**, restauré, porte rejouée verte.

> **LEÇON QUI GÉNÉRALISE, à porter au comité** : *une assertion de résultat ne remplace une formule que si le scénario de test **fait diverger les sources possibles du résultat**.* Sinon elle épingle une **coïncidence**. Le comité avait raison de préférer le résultat à la formule — **il lui manquait d'exiger le scénario qui sépare**.

**C'est la QUATRIÈME occurrence de la classe** dans ce dépôt : un instrument qui reste **vert en cessant de prouver ce que son nom promet**.

---

## Les trois pièges d'instrument — deux réels, un imaginaire

| Piège | Statut |
|---|---|
| **`frontiere.test.ts:638-640`** — fabrication « deux rôles étroits égaux » | **RÉEL, ET IL A SAUTÉ.** Le budget mesuré vaut **4000, exactement celui de `personnage-repliques`** ⇒ l'assertion était vraie **avant** la fabrication : le test **restait vert en cessant de mesurer**. Le lot 1 l'a **prouvé** en retirant la fabrication, puis réparé par un couple **dérivé**. **La QA a vérifié que la réparation mesure réellement** : retirer la fabrication rougit **maintenant** (`Expected: 4000, Received: 6000`) |
| **`worker/index.test.ts:346`** — « plafonds deux à deux distincts » | **RÉEL, TROUVÉ HORS PLAN.** Devenu faux (`personnage-plan` dérive 200, comme `personnage-prose`). Le maintenir aurait forcé à **inventer un chiffre pour faire verdir un test** — exactement le défaut de la ligne 384 à 3a. Réparé, **pouvoir séparateur local conservé**, diff borné |
| **`frontiere.test.ts:608-621`** | **FAUSSE ALERTE, confirmée par la QA.** Seul un **commentaire périmé** a changé ; les deux assertions réelles sont **identiques à l'original**. Le plan disait de ne pas le « corriger » — il ne l'a pas été |

---

## Diff par lot

**Lot 1 `plan-contrat` (contrat) — 18 fichiers annoncés, 18 livrés.** `contexte.ts` supprimé, scindé en **7 fichiers** : `index` 31 · `noyau` 123 · `registres` 247 · `prose` 84 · `detenteurs` 133 · `repliques` 90 · `plan` 110 — **tous très confortablement sous 400**, là où le monolithe atteignait 564 et projetait ~784 à 3c.

**Lot 2 `carte-plan` — 7 annoncés, 6 touchés.** `styles.ts` **laissé hors diff** : aucun jeton ne manquait. `CarteCompleterPlan.tsx` 255 l. · `planActions.test.tsx` 453 l. (**14** tests après correction).

**Contraintes fortes, vérifiées mécaniquement** : `LigneReplique.tsx` = **docstring seule**, filtre appliqué, **zéro ligne de code** · `panneauCopilote.test.tsx` = **une ligne** (`3` → `4`) · les **neuf instruments** de `frontiere.test.ts` à **zéro diff** · **zéro diff** sur `src/brain/dossier/**` (dont `destinations.ts`), `src/features/dossier-fiches/**`, `jest.config.cjs`, `useDemandeCopilote.ts`, `CarteFaireParler.tsx`, `tests/repliques.test.tsx`.

**Aucune violation de propriété**, constatée par l'intégrateur **et** par la QA.

---

## Ce qui a été REFUSÉ — ce qu'un relecteur ne peut pas deviner du diff

| Refusé | Motif |
|---|---|
| **`si_bloque`, `duree`, `declencheur_texte`, `declencheur_expr`** — 4 rôles | `si_bloque` non vide **sans `duree`** allume le constat de `controles.ts:727` : **chaque acceptation fabriquerait l'avertissement que le copilote prétend épargner**. `duree` n'est proposable ni par le modèle (unité du pas non décidée, n° 9) ni par le code (KR-221). Et **`si_bloque` AFFICHÉ sans être écrit** est refusé aussi : une proposition que l'auteur ne peut pas accepter est **un mensonge d'écran que le premier mainteneur câblera** |
| **Clé réseau `actions`** (veto) | Elle nomme **le champ que l'acceptation écrit** ; aucun des trois gabarits livrés ne nomme sa destination. **Argument retourné à son auteur par sa propre règle** : le § F de son invite interdit de réciter le nom d'un champ, et son gabarit le récitait |
| **Clé réseau `etapes`** | À une lettre de `etape`, entier `moteur` que le modèle ne rend jamais |
| **`CiblePlan { personnageId }`** (veto) | **Même type** que `CibleRepliques` ⇒ branche répliques, `tsc` vert. Trouvé **indépendamment** par les deux postes à effort élevé. Rendu **exécutable** : parmi les 13 erreurs `tsc` des `@ts-expect-error`, **le couple `CiblePlan`/rôle répliques est celui qu'une cible `{ personnageId }` aurait laissé compiler** |
| **Une sortie de LISTE bornée à un** | Une liste de un rend « deux » **représentable** et ne l'interdit que par une constante ; le scalaire le rend **non représentable** — *la meilleure garde est celle qui n'existe pas*. Emporte **une constante et quatre prédicats en moins** |
| **Le prédicat de doublon** | Le refus est **par lot** ⇒ rejeu ⇒ **échec terminal** sur lequel l'auteur ne peut rien, alors que le défaut prévenu est un doublon **visible sous le bloc gelé**, rejeté **d'un clic**. **On échangerait un clic contre une impasse** — et `MotifIllisible` restant inchangée, l'écran rendrait **un message faux sur la cause** |
| **La promotion de `etape = rang+1` dans `brain/`** (veto) | Mesuré : `useEcriturePlan.ts:197` garantit **déjà** que `index + 1` **vaut** `length + 1` — **les deux écrivains appliquent la même règle**, la promotion n'achète aucune couverture. Et **elle ne corrige pas le défaut visé** : `handleRetirerEtape` filtre **sans renuméroter**, un helper partagé serait **vert par-dessus ce trou**. Raison de fond : **on ne promeut pas une règle avant qu'elle soit juste** |
| **Un plafond de document sur `plan_actions[]`** | Aucune règle arbitrée ; l'inventer par symétrie avec `PARLER_REPLIQUES` la **déciderait en passant**. **Conséquence livrée** : aucune logique de plafond à l'écran, **zéro cas de la famille BUG-109 à instrumenter** |
| **Un 4ᵉ composant `LigneEtape`** et **le renommage `LigneDecision`** | `LigneRepliqueProps` est déjà `{ texte, … }` sans membre propre aux répliques : le réemploi coûte **zéro diff**, un composant neuf dupliquerait 110 lignes, et le renommage ouvrirait **trois surfaces vertes pour un nom**. **Les deux auteurs ont retiré leur propre proposition** |
| **Un numéro d'étape sur la PROPOSITION** | Il serait calculé sur la liste **gelée** quand l'écriture le calcule sur la liste **vive** : **l'écran annoncerait un entier que le code n'a pas encore décidé** |
| **`synopsis_mj` au contexte** | **Motif DIFFÉRENT de 3a, et il ne faut pas recopier la phrase de 3a** : ici c'est le **point de vue** — le synopsis porte ce que le personnage **ne sait pas**, et un plan écrit depuis lui fait agir un personnage **qui devine** |
| **Recopier « INTENTION » / « SI LE JOUEUR BLOQUE »** depuis `BlocPlanActions.tsx` | **Le risque a été SUPPRIMÉ, pas documenté** : **aucun nom de champ n'est écrit à l'écran**, seulement un eyebrow positionnel. Il ne peut plus y avoir de second domicile, faute de chaîne à dupliquer |
| **Un `Record<RoleCopilote,…>` générique**, **scinder les registres**, **déplacer `INVITES` hors de `worker/index.ts`**, **scinder `CopiloteService.ts`** | Respectivement : le rôle prose n'a pas de liste, son entrée serait un mensonge · leur **totalité EST le garde** · **déplacer la chose mesurée dans le lot qui la mesure rend le garde inerte en le laissant vert** · condition d'ouverture = la **5ᵉ** branche |

---

## Ce qui a été REPORTÉ, et où

| Reporté | Condition d'ouverture |
|---|---|
| **La promotion de `etape`** | La renumérotation à la suppression **réparée** (`BUG-112`) |
| **Le prédicat de doublon** | Une recopie verbatim **COMPTÉE** (un run, pas une intuition) ⇒ `validerIntention(brut, dossier, dejaEcrites)` + motif `'doublon'` + son texte |
| **`si_bloque`** | Sur une étape **existante portant déjà une `duree` posée par l'auteur** — miroir de l'injection conditionnée par l'état de session |
| **L'union étiquetée des cibles** | **3c** : un **troisième** synonyme d'identifiant de personnage est le signal |
| **Le renommage `LigneDecision`** | Un **troisième** consommateur, ou des props cessant d'être neutres |
| **`savoirs[]` au contexte** | La recomposition par rang (n° 12) |

---

## Écarts assumés

**1. Le critère #4 est INFAISABLE tel qu'écrit — fait mesuré, pas négligence.** Le plan exigeait un diff vide sur les **cinq** importateurs de `contexte.ts`. **Quatre le sont** (hachés `git hash-object` identiques à l'avant-scission). Le cinquième ne peut pas l'être : `contexte.test.ts` ne se contente pas d'**importer** le module, il le **LIT SUR DISQUE** (`readFileSync`) pour ses gardes de balayage de source — et un chemin de disque, lui, se déplace. **Le relevé du comité était un `grep` sur les instructions d'import : il ne pouvait pas voir un `readFileSync`.** Diff borné aux chemins + leurs discriminants, **aucune assertion affaiblie**, gardes adaptées **vues rouges**. **Reformulation pour 3c** : « diff vide sur les importateurs **purs** ; celui qui lit le module sur disque ne change que ses chemins de balayage ».

**2. `worker/index.test.ts:346` réparé hors liste du plan.** Assertion « plafonds deux à deux distincts » devenue fausse. **Le site n'était pas listé — il l'aurait été si la mesure avait précédé le plan.** Réparation bornée, pouvoir séparateur local conservé, coïncidence 200/200 **épinglée en commentaire** pour prévenir une future « harmonisation ».

**3. Deux `toHaveLength(3)` de `contexte.test.ts` passés à 4** — discriminants de registre qu'un 4ᵉ rôle rend faux. Édition mécanique, dans le lot.

**4. Garde de source `not.toContain('[0]')` abandonnée.** **Faux positif MESURÉ** : `CLES_SORTIE_PLAN[0]` indexe la **liste de clés**, pas la valeur. Remplacée par `Array.isArray` / `String(` / `intention[`.

**5. Cinq tests non nommés au § 7, ajoutés par le lot 1** — les décisions les plus « harmonisables » du plan (« aucune constante de borne », « aucun nom de champ dans l'invite », les deux vetos) **n'avaient aucun témoin**. *Un arbitrage sans instrument est un commentaire.*

**6. Docstring de `PanneauCopilote.tsx` corrigée au-delà de l'insertion** — elle disait « les trois Card » alors que **quatre** cartes actives existaient **depuis 3a**. Staleness préexistante, corrigée parce que le lot 2 modifiait exactement cet endroit.

**7. `CopiloteService.ts` passe à 502 l.** (416 avant). Hors de la lettre de KR-112 (« composant ou hook »), et le comité a **explicitement examiné puis écarté** la scission (condition d'ouverture : la **5ᵉ** branche). Signalé, non traité.

**Blocages non résolus : aucun.**

---

## Porte qualité

| Étape | Résultat |
|---|---|
| `prettier --check "{src,worker}/**"` | **VERT** |
| `tsc --noEmit` | **VERT** — 0 erreur |
| `npm run lint` | **VERT** — 0 erreur, 1 warning **préexistant hors diff** |
| `npm test` | **VERT** — **100 suites / 1579 tests** (+1 après la correction de `BUG-113`) |
| `npm run test:mutation` | **NON DÛ — constaté.** Aucun des quatre fichiers mutés n'apparaît au diff |
| **Table dorée** | **Sans objet** — aucun registre couvert n'est touché, donc **aucune section de `docs/REGLES-DU-JEU.md` à citer** : ce lot ne pose, ne modifie et n'étend **aucune valeur de règle de jeu** |

Porte relancée **quatre fois indépendamment** (les deux ouvriers, l'intégrateur, la QA), puis par l'orchestrateur après la correction de `BUG-113`.

**KR-013/113** : `rg` exécuté ⇒ **zéro site**. `CarteCompleterPlan.tsx` ne contient **aucun `useEffect`**.

---

## Ce qui reste non vérifiable en l'état

- **Le critère #4 au sens strict** — l'artefact intermédiaire de l'étape A n'existe pas dans un diff final. La QA refuse de le compter bon.
- **La recopie verbatim d'une étape existante n'est refusée par AUCUN prédicat** (reporté). Parades livrées : le bloc gelé (visuel) et la ligne d'invite (persuasive). **L'écran ne promet rien d'autre** — `MENTION_RELANCE_PLAN` a été vérifié mot pour mot sur ce point.
- **La PARAPHRASE, la CONTRADICTION avec une étape existante, la REDITE du but** — aucun instrument (KR-229).
- **LA DURÉE EN PROSE** (« au bout de trois jours ») : l'invite l'interdit avec trois exemples, **aucun validateur ne la constate**. C'est le **risque majeur du rôle**, et il est nommé.
- **L'arithmétique de `max_tokens: 100`** (`indice-detenteurs`, it2) **ne se reproduit pas** par la formule du dépôt — **confirmé réel par la QA**, hors périmètre, non corrigé.
- **Le défaut `handleRetirerEtape`** (`BUG-112`) — préexistant, non corrigé, **sans test de régression à ce jour, et c'est dit**.

---

## Budget de contexte — relevé

*(à compléter à l'étape 4 — voir le relevé chiffré dans la section suivante du cycle)*

---

## `RETOUR-COMITÉ` — ce que ce découpage a appris

1. **Une assertion de résultat ne remplace une formule que si le scénario FAIT DIVERGER les sources possibles du résultat.** Le comité a eu raison de préférer le résultat à la formule ; il lui manquait d'exiger **le scénario qui sépare**. Sans ça, le témoin épingle une **coïncidence** — et c'est ce qui est arrivé au test cardinal de l'itération. **À inscrire comme exigence de rédaction des critères.**
2. **Un critère d'acceptation qui porte sur un ÉTAT INTERMÉDIAIRE n'est pas vérifiable par un diff final.** Le critère #4 exigeait une preuve « avant la première ligne de l'étape B » ; rien dans le dépôt ne conserve cet instant. Soit le critère exige un **artefact** (un commit de travail, un relevé horodaté), soit il porte sur l'état final.
3. **Un relevé par `grep` ne voit que ce qu'il cherche.** La QA avait mesuré les **instructions d'import** pour conclure au diff vide ; elle ne pouvait pas voir un `readFileSync`. **Quand un plan affirme « aucun fichier ne change », il doit dire PAR QUEL RELEVÉ** — et ce relevé doit couvrir les accès **par chemin**, pas seulement par symbole.
4. **Deux pièges d'instrument sur trois étaient CONDITIONNÉS À UNE MESURE NON ENCORE FAITE.** Ni l'un ni l'autre n'était visible au raffinage ; les deux ont sauté au lot, exactement là où le tour 2 les avait annoncés. **Le format « si la mesure tombe sur X, alors l'instrument devient inerte » est à reconduire** — c'est ce qui a permis de les attraper.
5. **La fausse alerte a coûté zéro** parce qu'elle a été vérifiée avant d'entrer au plan. Un poste à effort élevé avait lu un test et **inversé sa conclusion** ; l'orchestrateur l'a rejouée. **À reconduire : toute alerte de comité sur la couleur d'un test se vérifie avant d'être inscrite.**
6. **La scission a tenu sa promesse et n'a rien coûté.** Sept fichiers, tous très au-dessous du seuil, **aucune instruction d'import changée**, et un seul fichier a dû bouger — pour une raison que le comité pouvait connaître et n'a pas cherchée. 3c ajoutera son assembleur sans rouvrir la question.
