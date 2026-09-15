# Plan d'itération — `dossier-controles` · itération `2`

> Statut : `validé` — porte 2 franchie le 2026-09-15.
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-09-15
> Composition : `4 rôles` — motif : it2 **rend** une valeur déjà calculée et déjà arbitrée d'audience `auteur` à it1. Elle ne pose ni ne déplace aucune ligne de `destinations.ts`, ne touche aucun prompt, aucune mémoire de session, aucune règle de jeu — le critère élargi hérité de `dossier-registres` ne se déclenche pas, et convoquer `narratif-ia` coûterait deux tours pour un badge.
> Exécution : `séquentielle` (2 lots) — L2 consomme la primitive figée par L1.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur repère, depuis la navigation, quelle section porte une anomalie. » |
| **Tranche** | `brain/dossier/pastilles.ts` (porteur unique du couple mot + teinte, deux fonctions pures) → `DossierEditorScreen` dérive `parSection` → `SectionNav` rend un badge par ligne. Aucune persistance : le rapport est recalculé à chaque rendu. |
| **Lots** | 2 lots · dont `contrat` : **oui** (L1, seul et en premier) |
| **Hors périmètre** | Le compte agrégé par niveau · le badge de l'entrée « Contrôles » · le clic d'une ligne vers sa section (it3) · toute interaction propre au badge · toute assertion de teinte au rendu |
| **Reporté** | Les états « compte réel + niveau » sur un dossier **réel** → it3, faute de règle atteignant une section comptée · la mesure de largeur rendue → passe visuelle |

**Ce que ce raffinage a changé par rapport au cadrage** — trois points, tous mesurés, aucun de style : le cadrage affirmait que la sonde l. 203 était le **seul** test réécrit (faux, `COMPTES_DOSSIER_NEUF` l'est aussi) ; il espérait **zéro lot `brain/`** (impossible, la table mot/teinte existe déjà et une copie serait invisible au lint) ; et l'instrument qui aurait permis de tout prouver par la couleur est **cassé**, pas absent.

---

## 1 — But raffiné

À la fin de cette itération, l'auteur repère, depuis la navigation, quelle section porte une anomalie.

## 2 — Hors périmètre

*(Écrit par le PM, définitif après le tour 2.)*

- **Le compte agrégé par niveau** (« 2 bloquants ») — `RapportControles.parSection` reste `Record<SectionId, NiveauControle | null>` **sans changement de forme** : le lot contrat est une **extraction de présentation**, jamais un contrat de schéma.
- **Section saine** : badge inchangé en texte et en teinte (`muted`, compte existant) — jamais de coche verte, jamais de « 0 anomalie ».
- **Dossier entièrement rédigé** : les badges redeviennent muets automatiquement (`parSection` revient à `null` partout) — comportement dérivé, couvert par un test plutôt que supposé.
- **L'entrée « Contrôles »** (second landmark) ne porte **aucun** badge.
- **Le clic d'une ligne vers sa section, et le focus qui suit** — actés vers it3 par décision humaine au cadrage, non rouvrables.
- **Aucune interaction propre au badge** — ni infobulle, ni popover listant les constats — au-delà du `onSelect` de ligne existant.
- **`IssueList.tsx`, `ListRow.tsx`, et le registre `SECTIONS`** : aucune modification. *(Exporter une constante déjà présente dans `sections.ts` n'est pas une modification du registre.)*
- **Toute assertion de teinte au rendu** — l'instrument est cassé (§ 7), le mot est le seul observable.

## 3 — Contrat de design

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

### La règle d'élision — le cœur de l'itération

**Le mot REMPLACE le tiret, il ne s'y ajoute jamais.** Mesure qui l'impose : les deux sections que les règles d'it1 allument (`canon`, `depart`) sont **exactement** les deux dont `compte()` vaut `SANS_COMPTE` (`—`). Une concaténation mécanique afficherait « — · BLOQUANT » — un badge dont la moitié gauche ne dit rien — et ce serait **le premier rendu de production**, pas un cas limite.

```
niveau === null           → texte = compte,                 ton = 'muted'
compte === SANS_COMPTE    → texte = MOT,                    ton = ton du niveau
sinon                     → texte = `${compte} · ${MOT}`,   ton = ton du niveau
```

### Les neuf états, mot pour mot

| # | Cas | Texte | Ton |
|---|---|---|---|
| 1 | Section saine, compte réel | `6 fiches` | `muted` — **inchangé** |
| 2 | Section saine, sans compte | `—` | `muted` — **inchangé** |
| 3 | **Bloquant, sans compte** — Départ, aujourd'hui | `BLOQUANT` | `bad` |
| 4 | Bloquant, avec compte — it3 | `3 fiches · BLOQUANT` | `bad` |
| 5 | **Alerte seule, sans compte** — Canon, aujourd'hui | `ALERTE` | `neutral` |
| 6 | Alerte seule, avec compte — it3 | `12 fiches · ALERTE` | `neutral` |
| 7 | Info seule — it3 | `4 fiches · INFO` | `muted` — **identique en ton** à une section saine, distinct **par le mot seul** |
| 8 | Plusieurs niveaux mêlés | le pire seul (`parSection` ne porte que lui) — jamais une liste de mots | du pire |
| 9 | Entrée « Contrôles » | **aucun badge** | — |

**Les trois mots et leurs tons sont ceux d'it1, déplacés et non redécidés** : `BLOQUANT`/`bad`, `ALERTE`/`neutral`, `INFO`/`muted`. Mono, capitales, toujours au singulier. Le séparateur `·` est une ponctuation dans la chaîne composée, pas un jeton — même convention que `SECTIONS['jalons-fins'].compte()`.

**Cohérence des deux surfaces garantie mécaniquement** : le panneau Contrôles et le badge de nav lisent la **même** table privée par la même fonction. Aucune discipline de revue n'est requise pour qu'ils ne divergent pas.

### Jetons — aucun jeton neuf

`bad` → `--bad` / `--bad-line` / `--bad-bg-2` · `neutral` → `--ink-2` / `--line-1` / `--paper-0` · `muted` → `--ink-4` / `--line-2` / `--paper-0`. Tous déjà câblés dans `Badge.tsx`.

### Largeur — mesurée, pas supposée

Pire cas théorique, « 0 jalon · 0 fin · BLOQUANT » : colonne 280 px − padding du wrapper (36 px) − padding de `ListRow` (24 px) − `gap` (12 px) = **208 px disponibles** ; badge en mono 10 px, 26 caractères ≈ 156 px + padding 18 px + bordures 2 px = **≈ 176 px**. **Aucun débordement.** Le bloc titre/sous-titre est repoussé à ≈32 px et se replie — comportement déjà prévu par `ListRow` (`flex: 1` / `minWidth: 0`, wrap et non troncature). Et ce cas **ne se produit sous aucune règle vivante** : `jalons-fins` n'est cible ni à it2 ni sous les cinq règles d'it3. Règle de repli : aucune action tant que les trois mots restent ≤ 8 caractères ; si un mot plus long arrivait, préférer le mot court — **jamais** tronquer le compte.

### Clavier

Rien n'est dû : `ListRow` est déjà un `<button>` natif, la fusion n'ajoute aucun élément focalisable et ne change aucun ordre DOM. Le niveau est porté par un **texte** dans le badge, jamais par la seule couleur.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `pastilleNiveau` | fonction | fournit | `(niveau: NiveauControle) => { texte: string; tone: BadgeTone }` — le **mot seul**, ce que rend `ListeControles`. |
| `badgeSection` | fonction | fournit | `(compte: string, niveau: NiveauControle \| null) => { texte: string; tone: BadgeTone }` — le badge de nav, règle d'élision comprise. |
| `PASTILLES` | table privée | — | `Record<NiveauControle, { texte: string; tone: BadgeTone }>` — **non exportée**, porteur unique des trois mots et des trois tons. |
| `SANS_COMPTE` | constante | consomme | `sections.ts` : `const` → `export const`, lue par `pastilles.ts` **seul**. Ne sort **pas** du baril. |
| `NiveauControle`, `BadgeTone` | types | consomme | inchangés. |
| `RapportControles.parSection` | type | consomme | **inchangé** — aucun lot de schéma. |

**Les deux fonctions rendent `{ texte, tone }` en un seul appel**, et c'est la conséquence directe de la mesure du § 7 : le `tone` n'étant **pas observable au rendu**, il ne peut être épinglé qu'au **contrat**. Un retour unique permet à un test unitaire de pincer les deux moitiés **ensemble** et supprime la possibilité qu'elles divergent au site d'appel.

**Le module vit dans un fichier NEUF** `src/brain/dossier/pastilles.ts`, jamais dans `controles.ts` : la docstring de ce dernier affirme « ce module ne connaît ni mot français ni teinte », et garder cette phrase vraie vaut un fichier. Son JSDoc (l. 41-43) est corrigé dans le même lot — il annonce aujourd'hui que les pastilles « restent côté feature », ce que L1 rend faux, et un commentaire contractuel périmé dans le fichier que les comités d'it3 et it4 relisent en premier est un piège.

**Aucun composant partagé.** `PastilleNiveau` a été proposé puis **retiré par son auteur** : les deux surfaces partagent la **décision** (mot + ton), pas le **balisage** — `ListeControles` rend un `<li>` à trois étages, la nav un `trailing`. Un composant commun aurait exigé une prop `compte`, c'est-à-dire le veto V5 de son propre auteur.

**Contrat de feature (pas `brain/`)** — `SectionNavProps` gagne une prop **requise** :

```ts
niveauxParSection: Record<SectionId, NiveauControle | null>
```

Site d'appel unique, dans `DossierEditorScreen`, après l'early-return : `const { parSection } = controlerDossier(dossier)`. **`parSection` seul, jamais le `RapportControles` entier** — la nav n'a rien à faire de `controles` ni de `jouable`. **Requise, jamais optionnelle** : deux chemins dont le testé n'est pas le livré sont pires que pas de prop du tout.

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `pastilles-contrat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser le porteur unique du couple mot + teinte, et y migrer son premier consommateur.
- **Fichiers** : `src/brain/dossier/pastilles.ts` (N) · `src/brain/dossier/pastilles.test.ts` (N) · `src/brain/dossier/sections.ts` (R, **une ligne** : `export const SANS_COMPTE`) · `src/brain/index.ts` (R, une ligne) · `src/brain/dossier/controles.ts` (R, **JSDoc seul**) · `src/features/dossier-controles/components/ListeControles.tsx` (R, perd sa table `PASTILLES`) · `src/features/dossier-controles/tests/panneauControles.test.tsx` (R, **diff nul attendu**)
- **Expose** : `pastilleNiveau`, `badgeSection` (baril). **Consomme** : `NiveauControle`, `BadgeTone`, `SANS_COMPTE`.
- **Critères couverts** : #1, #2, #3
- **Pourquoi ce lot contrat emporte un fichier de feature** : la sonde de **porteur unique** (§ 7) ne peut pas être verte à la porte de L1 tant que `PASTILLES` survit dans `ListeControles.tsx`. Trois issues existaient — mettre la sonde dans L2 (fichier partagé entre deux lots : interdit), l'écrire en allow-list sur-ensemble (garde desserrée à jamais), ou migrer le consommateur ici. Seule la troisième rend l'assertion **d'égalité** tenable. C'est le lot contrat qui livre son premier porteur, précédent `dossier-registres` it3.
- **Interdiction** : `SANS_COMPTE` ne sort **pas** de `brain/index.ts` — une sonde l'exige.

### Lot 2 — `badges-nav`
- **Ouvrier** : `dev-lot` (après L1, contrat figé, lu comme donnée immuable)
- **But** : rendre le niveau de chaque section sur le badge de sa ligne de navigation.
- **Fichiers** : `src/features/bascule-editeur/components/SectionNav.tsx` (R) · `src/features/bascule-editeur/components/DossierEditorScreen.tsx` (R) · `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (R) · `src/features/bascule-editeur/tests/sectionNav.test.tsx` (N)
- **Pourquoi un fichier de test neuf** : le critère 6 rend `SectionNav` **directement**, avec une entrée fabriquée — c'est un test de composant isolé, pas un test d'écran, et `dossierEditorScreen.test.tsx` fait déjà ~495 lignes. Les deux fichiers ont des sujets distincts : l'un monte l'écran, l'autre monte la nav seule.
- **Consomme** : `badgeSection`, `controlerDossier`, `SECTIONS`, `Badge`, `ListRow` — tous par le baril `brain`. **N'expose rien.**
- **Critères couverts** : #4, #5, #6, #7, #8
- **Ne touche pas** : `IssueList.tsx`, `ListRow.tsx`, `sections.ts`, `pastilles.ts`, `App.tsx`.

**Listes disjointes vérifiées.** Une seule feature touchée hors lot `contrat` (`bascule-editeur`).

## 6 — Critères d'acceptation

1. **Étant donné** les trois niveaux, **quand** `pastilleNiveau` est appelée sur chacun, **alors** elle rend `BLOQUANT`/`bad`, `ALERTE`/`neutral`, `INFO`/`muted` — balayés depuis le registre, jamais trois littéraux. — *unitaire* — *lot 1*
2. **Étant donné** les neuf états du § 3, **quand** `badgeSection` est appelée sur chacun, **alors** elle rend le texte et le ton exacts de la table — **y compris les états 4, 6 et 7, qu'aucune règle vivante ne peut produire** : c'est ici, et seulement ici, qu'ils sont prouvés. — *unitaire* — *lot 1*
3. **Étant donné** l'ensemble des fichiers de `src/` hors tests et hors commentaires, **quand** on cherche chacun des trois mots de niveau, **alors** `src/brain/dossier/pastilles.ts` en est le **seul** porteur ; et `src/brain/index.ts` ne nomme jamais `SANS_COMPTE`. — *contrat (balayage de source)* — *lot 1*
4. **Étant donné** un dossier fraîchement créé, **quand** l'écran se rend, **alors** Départ porte `BLOQUANT`, Canon porte `ALERTE`, les huit autres lignes portent leur `compte(dossier)` inchangé, et chaque ligne porte **exactement un** badge (KR-218). — *composant* — *lot 2*
5. **Étant donné** une section saine, **quand** sa ligne se rend, **alors** **aucun** des trois mots n'y apparaît (`queryByText` → `null`) — assertion **négative sur le texte**, jamais sur une teinte. — *composant* — *lot 2*
6. **Étant donné** `niveauxParSection` fabriqué plaçant `bloquant` sur `personnages` (dossier à deux fiches réelles) et `null` sur `canon`/`depart`, **quand** `SectionNav` est rendu **directement**, **alors** Personnages porte `2 fiches · BLOQUANT` tandis que Canon et Départ ne portent aucun mot **malgré leur `—`**. — *composant* — *lot 2*
7. **Étant donné** un dossier neuf dont l'auteur réécrit `charpente.depart.texte_ouverture_joueur`, **quand** `dossier:updated` survient **sans remontage**, **alors** le mot `BLOQUANT` disparaît de la ligne Départ **qui garde son `—`**, pendant que Canon reste en `ALERTE`. — *composant, bus d'événements* — *lot 2*
8. **Étant donné** les suites existantes, **quand** it2 est livrée, **alors** la sonde `KR-013` (l. 194-201) et les deux tests de l'entrée « Contrôles » (l. 396-443, l. 445-455) restent verts **sans modification** ; seuls `COMPTES_DOSSIER_NEUF` (l. 118/190) et la sonde l. 203-211 sont amendés, **nommément et légitimement**. — *non-régression* — *lot 2*

**Les critères 6 et 7 sont complémentaires, et aucun ne remplace l'autre** : le 6 prouve que la vue **lit le contrat** (sur une entrée fabriquée, seul moyen d'atteindre une section comptée avant it3) ; le 7 prouve le **câblage réel** sur un vrai dossier — deux sections au compte identique (`—`), deux badges différents, ce qui tue l'hypothèse « le badge colore les sections sans compte » sans aucune fabrication.

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `pastilles.test.ts › les trois niveaux rendent leur mot et leur ton` | balayage depuis le registre des niveaux, jamais trois littéraux | jest | KR-117, KR-199 | L1 |
| `pastilles.test.ts › les neuf etats du badge de section` | table des neuf cas du § 3, `{ texte, tone }` comparé en bloc | jest | — | L1 |
| `pastilles.test.ts › le mot remplace le tiret, il ne s y ajoute jamais` | `badgeSection('—', 'bloquant').texte === 'BLOQUANT'` et ne contient pas `'—'` — **le discriminant de la règle d'élision** | jest | — | L1 |
| `pastilles.test.ts › porteur unique des trois mots de niveau dans src` | balayage de `src/`, tests exclus, commentaires retirés, **égalité** stricte sur la liste des porteurs | jest (balayage) | KR-109 | L1 |
| `pastilles.test.ts › SANS_COMPTE ne sort pas du baril` | `brain/index.ts` ne contient pas `SANS_COMPTE` — patron `amorce.test.ts:71` | jest (balayage) | KR-215 | L1 |
| `panneauControles.test.tsx` **(existant, diff nul attendu)** | les pastilles du panneau rendent le même DOM qu'avant la migration | jest + RTL | — | L1 (non-régression) |
| `dossierEditorScreen.test.tsx › rend les 10 ListRow…` **(amendé)** | `BADGES_DOSSIER_NEUF`, dix libellés **écrits à la main** — jamais dérivés de l'ancienne table par un `map` qui rejouerait la règle d'élision | jest + RTL | KR-117 | L2 |
| `dossierEditorScreen.test.tsx › une section saine ne porte aucun mot de niveau` | `queryByText` négatif sur les trois mots | jest + RTL | — | L2 |
| `dossierEditorScreen.test.tsx › un seul badge par ligne` | égalité sur `textContent` de la ligne, jamais `toHaveTextContent` (inclusion, BUG-083) | jest + RTL | KR-218 | L2 |
| `sectionNav.test.tsx › lit niveauxParSection et non le compte manquant` | entrée fabriquée : Personnages `2 fiches · BLOQUANT`, Canon/Départ muets malgré `—` | jest + RTL | KR-199 | L2 |
| `dossierEditorScreen.test.tsx › le badge suit une reecriture sans remontage` | patron l. 238-249 ; Départ perd `BLOQUANT` **en gardant `—`**, Canon reste `ALERTE` | jest + RTL | KR-013 | L2 |
| `dossierEditorScreen.test.tsx › SectionNav ne decide jamais d une teinte` **(réécrit, l. 203-211)** | aucune teinte en dur, aucun `BadgeTone`, aucun des trois mots littéraux ; l'appel à `badgeSection` exigé | jest (balayage) | KR-199 | L2 |
| `dossierEditorScreen.test.tsx › KR-013…` **(existant, inchangé)** | pas de `.length`/`.filter(`/`.reduce(` dans `SectionNav.tsx` | jest (balayage) | KR-013 | L2 (non-régression) |

**La sonde l. 203 est réécrite — et le motif écrit ici au raffinage était FAUX.** *(Correction portée après la vérification QA en mode B, confirmée par l'orchestrateur.)* Le comité avait affirmé, aux deux tours, qu'elle « serait restée VERTE » sans amendement, et en avait fait une sixième occurrence de KR-199. **Mesuré : elle aurait rougi.** Son assertion **positive** `expect(source).toMatch(/tone=["']muted["']/)` ne pouvait pas survivre au remplacement de tout `tone="muted"` littéral par `tone={badge.tone}`. La réécriture reste juste — la nouvelle garde interdit strictement plus que l'ancienne — mais pour un autre motif : **l'ancienne sonde aurait échoué en accusant la mauvaise cause** (« le badge muted a disparu » au lieu de « la vue décide d'une teinte »), et un ouvrier l'aurait « réparée » en rétablissant un littéral. C'est la deuxième affirmation de cette itération portant sur le comportement d'un test et avancée **sans l'exécuter** — voir BUG-084.

**Non vérifiable en l'état** — *à recopier dans la revue* :
- **La teinte, à tout niveau de rendu. Instrument CASSÉ, pas absent — mesuré, et reproduit par l'orchestrateur** : `toHaveStyle({ color: 'var(--bad)' })` **passe sur un `Badge tone="muted"`**. `cssstyle` (le CSSOM de jsdom) valide `color`/`border`/`background` contre une grammaire typée et rejette silencieusement un jeton `var(--x)` ; `element.style.color` retombe à `''`, et `toHaveStyle` repassant les deux côtés par le même moteur, ils collapsent tous deux à `''`. Le matcher passe **quelle que soit la teinte**. Conséquence tenue par ce plan : le `tone` est prouvé **au contrat** (fonction pure rendant `'bad'`) et **jamais au rendu** ; la vue est gardée par une sonde de source.
- **Les états 4, 6 et 7 sur un dossier réel bout-en-bout** — aucune règle d'it1 ni d'it2 n'atteint une section à compte réel. **Précision portée après la vérification QA** : seul l'état **4** est prouvé **au composant** (sur entrée fabriquée, critère 6) ; les états **6 et 7 ne sont prouvés qu'au CONTRAT** (`pastilles.test.ts`), le test de composant ne fabriquant que le niveau `bloquant`. Ce n'est pas un trou — le critère 2 dit lui-même « c'est ici, et seulement ici, qu'ils sont prouvés » — mais la phrase groupant les trois états était imprécise, et elle l'était dans le sens qui surestime la couverture (classe KR-199 appliquée à la prose d'un plan). Écart assumé, levé à it3.
- **La largeur rendue** de `3 fiches · BLOQUANT` dans 280 px : jsdom ne calcule aucun layout. La mesure du § 3 est arithmétique, pas observée — due à la passe visuelle.
- **L'ordre de tabulation** entre les dix lignes recolorées.
- **Le second appel de `controlerDossier` par rendu d'écran** (nav + panneau) : pur, borné à quatre proses, non mesuré.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | TL ↔ UX ↔ QA | Ce que dit le badge : substitution / élision conditionnelle / teinte seule | `RETENU` : **élision** — **L1** | Unanime après tour 2. Le TL **retire** la substitution : KR-218 dit « toujours fusionné », et elle effacerait « 6 fiches » aux états 4 et 6, ceux qu'it3 produit. La QA **retire** la teinte seule sur deux motifs de son propre terrain — `info → muted` **est** la teinte du calme, donc le critère serait FAUX et non mal écrit ; et l'instrument est cassé. Le PM **vetoe** la teinte seule (valeur : deux niveaux sur trois deviennent illisibles). |
| 2 | TL ↔ UX | Forme du porteur : composant `PastilleNiveau` ou fonctions pures | `RETENU` : **fonctions pures**, aucun composant — **L1** | Le TL **retire son propre composant** : les deux surfaces partagent la **décision**, pas le **balisage** ; un composant commun aurait exigé une prop `compte`, c'est-à-dire son veto V5. Domaine architecture. |
| 3 | forme de retour | Deux fonctions séparées (`tonNiveau` + `libelleBadgeSection`) ou un retour `{ texte, tone }` | `RETENU` : **`{ texte, tone }`**, un seul appel — **L1** | Arbitrage de l'orchestrateur, imposé par la mesure du § 7 : le `tone` n'étant pas observable au rendu, il ne peut être épinglé qu'au contrat — un retour unique pince les deux moitiés **ensemble** et supprime leur divergence possible au site d'appel. |
| 4 | où vit le module | Fichier neuf `pastilles.ts` (TL) ou dans `controles.ts` (UX) | `RETENU` : **fichier neuf** — **L1** | La docstring de `controles.ts` affirme « ce module ne connaît ni mot français ni teinte » ; garder cette phrase vraie vaut un fichier. Son JSDoc est corrigé dans le même lot. |
| 5 | TL ↔ QA | `SectionNav` reçoit-il le niveau en prop ? | `RETENU` : **prop requise** `niveauxParSection` — **L2** | **Les deux rôles se sont croisés** : le TL a concédé la prop, la QA a retiré son exigence et proposé un `jest.mock` du baril. Je retiens la prop — elle évite un premier mock de baril dans un dépôt dont les tests de feature montent `createBrain()` réel, elle rend `SectionNav` purement présentationnel, et le motif du TL tient : **tester contre le contrat total plutôt que contre le jeu de règles du jour** évite de rouvrir ce fichier à it3. Requise, **jamais optionnelle**. |
| 6 | QA (veto) | Tout critère s'appuyant sur `toHaveStyle` / une couleur rendue | `REJETÉ` | Veto dans son domaine, **mesuré et reproduit par l'orchestrateur** : le cas négatif passe. L'instrument est cassé, pas absent. Conséquence portée au § 4 et au § 7. |
| 7 | cadrage | « La sonde l. 203 est le seul test réécrit » | `REJETÉ` — le cadrage avait tort | Mesuré par le TL, confirmé par la QA : `COMPTES_DOSSIER_NEUF` (l. 118/190) rougit dans **toutes** les variantes de texte. Amendement nommé au critère 8. |
| 8 | PM | « Zéro lot `brain/` » | `REJETÉ` — retiré par son auteur | La table mot/teinte existe déjà, privée ; une copie dans `bascule-editeur` serait **invisible au lint** (c'est une copie, pas un import), les deux suites resteraient vertes, et elle divergerait au premier renommage. |
| 9 | TL | `L1` emporte un fichier de feature (`ListeControles.tsx`) | `RETENU` — **L1** | La sonde de porteur unique ne peut être verte à la porte de L1 tant que `PASTILLES` survit. Les deux alternatives étaient un fichier partagé entre deux lots (interdit) ou une garde desserrée à jamais. |
| 10 | TL (vetos hérités) | `parSection` en `Partial` ou réécrit en `{ pire, comptes }` · tout lot touchant `IssueList.tsx` ou `ListRow.tsx` · tout `ref`/prop ajouté à `ListRow` | `RETENU` (les trois tiennent) | Non contestés. Inscrits au § 2 et au § 5 comme interdictions de lot. |
| 11 | TL (V4, neuf) | Toute table `Record<NiveauControle, …>` subsistant dans un fichier de feature après L1 | `RETENU` — instrumenté au § 7 | « Sans la suppression de `PASTILLES`, l'extraction n'a rien extrait. » Promesse de revue convertie en test. |
| 12 | TL (V5, neuf) | Une seconde prop sur le porteur partagé | `RETENU` (sans objet) | Le composant ayant été retiré, le veto n'a plus de cible — mais il reste écrit : si un jour un composant revient, il ne portera pas de `variant`. |
| 13 | PM ↔ QA | La valeur d'it2, avec seulement deux sections allumables | `RETENU` : it2 **avant** it3 | Le badge **ambiant** — visible pendant qu'on édite Personnages — est ce que le panneau seul n'offre pas. Et prouver le câblage sur le cas le plus pauvre **avant** qu'it3 ne disperse les états est la bonne tranche ; le lot contrat sera consommé tel quel par les cinq règles d'it3, sans second lot contrat à cette date-là. |
| 14 | tous | Le compte agrégé par niveau (« 2 bloquants ») | `REJETÉ` | Mesuré par le TL : trois surfaces `brain/` pour un badge, un seul appelant, aucun second nommé — et ce n'est pas la démo (« **quelle** section », pas combien). Forme admissible écrite en archive dans sa note de tour 1 si le besoin revient. |
| 15 | UX | Badge sur l'entrée « Contrôles » | `REJETÉ` | Unanime, hors périmètre du goal ; symétrique au refus déjà acté du bandeau `jouable` global. |

*(Aucun désaccord sans statut. Aucun veto ne tient après le tour 2 : pas d'escalade.)*

## 9 — Innovation

*Aucune.* Le comité n'a produit aucune proposition hors-cadre à cette itération.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **sans objet** : l'itération ne touche ni `challenge`, ni `combat`, ni `xp`, ni `characteristics`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Non-régression nommée : `KR-013` (l. 194-201) et les deux tests de l'entrée « Contrôles » verts **sans modification** ; `panneauControles.test.tsx` à **diff nul**
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-controles-it2.revue.md`, avec la rubrique « non vérifiable en l'état » recopiée telle quelle — **l'instrument de teinte cassé en tête**
- [ ] Budget de contexte relevé (`code-knowledge.json` est à 410 o de son plafond)

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — élision au § 3, teinte seule exclue, hors-périmètre définitif au § 2 |
| Tech Lead | recevable sous réserve | oui — élision arbitrée au § 8, prop requise au § 4, V4 instrumenté au § 7, sonde l. 203 réécrite |
| UX | recevable sous réserve | oui — élision retenue, mesure de largeur au § 3, veto « — · BLOQUANT » levé |
| QA | recevable sous réserve | oui — `toHaveStyle` banni (§ 2, § 7), `COMPTES_DOSSIER_NEUF` nommée au critère 8, discriminance au critère 6 |
