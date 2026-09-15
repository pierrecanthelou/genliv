# Revue d'itération — `dossier-controles` · itération 1

> Plan : `.claude/raffinage/dossier-controles-it1.plan.md` (validé le 2026-09-15)
> Exécution : 2 lots séquentiels — `dev-contrat` puis `dev-lot`. Aucun worktree, aucune fusion.
> Vérification : `qa` en **mode B**, contexte neuf — verdict `CONFORME AVEC RÉSERVES`, quatre reprises, toutes traitées.

## En une ligne

**L'auteur peut voir, dans un écran Contrôles, quelles proses de son dossier restent à rédiger** — et la première d'entre elles, le texte d'ouverture, lui est signalée comme **bloquante** parce que le moteur la lirait au joueur mot pour mot.

## Les huit critères

| # | Statut | Preuve |
|---|---|---|
| 1 | **VÉRIFIÉ** | `controles.test.ts › produit les quatre controles sur un dossier fraichement seme` — 4 contrôles balayés depuis `Object.keys(AMORCE)` (jamais quatre littéraux, KR-199), 1 bloquant/`depart`, 3 alertes/`canon`, `jouable === false`. |
| 2 | **VÉRIFIÉ** | `› se declenche sur un champ mute et se tait sur son clone intact, meme test` — clone intact → 0, un seul champ marqué → 1, restauration → 0, dans le même test (KR-197/202). |
| 3 | **VÉRIFIÉ** | `› la section de chaque controle est celle declaree, jamais derivee du path` — le bloquant vaut `'depart'` alors que `path.split('.')[0] === 'charpente'` : la dérivation naïve est explicitement falsifiée (KR-219). |
| 4 | **VÉRIFIÉ** | (a) `amorce.test.ts` : **diff nul** confirmé, ses deux gardes vertes sans modification. (b) `› les messages francais n ecrivent jamais le glyphe en dur` + contrôle indépendant : le glyphe n'est porté que par `amorce.ts` parmi les fichiers TypeScript de `src/` (KR-223). |
| 5 | **VÉRIFIÉ** | `› Controle ne porte jamais de severity` + `› le rapport ne passe jamais par le canal errors ou warnings du validateur` (sonde de source : `controles.ts` n'importe pas `validate.ts`). Les deux couvrent ensemble la totalité du critère (KR-217, KR-225). |
| 6 | **VÉRIFIÉ** | `panneauControles.test.tsx › rend une ligne par controle, pastille et trois etages` et `› dossier calme…` — 1 `BLOQUANT` + 3 `ALERTE` avec leurs phrases françaises ; dossier calme → texte d'amorce, aucun `<li>`. |
| 7 | **VÉRIFIÉ** *(renforcé en revue)* | `dossierEditorScreen.test.tsx › l entree Controles apparait quand un panneau est injecte` — second landmark présent, activable au clic et au clavier, `SECTIONS.length === 10` intact. La clause « aucun badge de compte » était gardée par un `toHaveTextContent`, **test de sous-chaîne** : corrigée en égalité sur `textContent` (BUG-083). |
| 8 | **VÉRIFIÉ** | Le hunk du diff n'ajoute qu'en fin de `describe` ; la ligne « rend les 10 ListRow… » est hors hunk, **diff nul sur son code**, `toHaveLength(10)` intact sans injection de panneau. |

## Diff par lot

| Lot | Fichiers livrés | Conforme à la liste du plan |
|---|---|---|
| **L1** `contrat` | `src/brain/dossier/controles.ts` (N), `controles.test.ts` (N), `src/brain/index.ts` (R) | oui, exactement |
| **L2** | `src/features/dossier-controles/{index.ts, components/PanneauControles.tsx, components/ListeControles.tsx, tests/panneauControles.test.tsx}` (N) · `src/features/bascule-editeur/components/{DossierEditorScreen,SectionNav}.tsx` (R) · `.../tests/dossierEditorScreen.test.tsx` (R) · `src/App.tsx` (R) | oui, exactement |

**Aucun fichier hors liste.** Les trois vetos du tech-lead tiennent, vérifiés par diff nul : `IssueList.tsx`, `ListRow.tsx`, `PanneauSection.tsx`, `sections.ts`. `parSection` est bien un `Record` TOTAL.

## Ce qui a été refusé — et qu'un relecteur ne peut pas deviner du diff

- **Ajouter `'info'` à `DossierIssueSeverity`** (proposé par l'UX au cadrage). `severity` n'est pas un niveau de lecture, c'est le **canal** de `DossierValidation` : deux valeurs parce qu'il a deux effets sur `update()`. Un troisième mot serait une sévérité dont l'effet sur l'écriture n'est pas défini — et il aurait compilé silencieusement partout où `severity === 'error'` tourne déjà.
- **Le verdict `jouable` affiché à l'écran.** Tout dossier neuf naît injouable : un bandeau rouge s'allumerait sur 100 % des dossiers à t=0, miroir exact du voyant tautologiquement vert refusé sous `SANS_COMPTE`. Corollaire refusé d'avance : aucune exemption « dossier jamais édité », dont le seul discriminant serait `updatedAt === createdAt`, faux dès la première édition sans rapport.
- **Couvrir le dossier importé** dont les proses n'ont jamais porté le marqueur. `validate.ts` refuse déjà le vide et le blanc ; reste la prose non blanche mais creuse, qu'aucune règle littérale ne voit et dont le seul juge serait un modèle. L'honnêteté est portée par l'état calme, dont le mot « **connus** » ne se retire pas.
- **Deux entrées de registre** (`amorce-ouverture` / `amorce-canon`), proposées puis retirées par le narratif : la spec déclare déjà « objectif sans chemin » (it4) comme *une* règle à deux niveaux — scinder par niveau obligerait à la scinder aussi, soit deux codes pour une cause, KR-164 en sens inverse.
- **`startsWith`** pour la détection du marqueur : `amorce.test.ts` teste le *semeur*, qui maîtrise la tête de sa chaîne ; le linter lit un texte *édité par l'auteur*, qui ne la maîtrise pas.
- **Extraire une primitive partagée** depuis `IssueList` : la réutiliser aurait exigé de forger un `DossierIssue` porteur d'un `code` absent de son union de vingt — un mensonge de type. L'extraction est due au **second** appelant de forme `Controle` (KR-109).

## Ce qui a été reporté

- **Le clic d'une ligne vers sa section**, et **le focus qui suit** → **it2**, qui rouvre déjà `DossierEditorScreen.tsx` et `SectionNav.tsx` pour les badges. Le render-prop est chiffré à zéro fichier de plus, mais il change la *forme* du contrat de prop d'une autre feature — ce qui excède le « diff sans logique métier » qui justifie que le squelette y touche. Le focus reste plus cher : il exige un `ref` sur `ListRow`, primitive à un seul appelant (veto tech-lead, précédent `onReorder`).
- **La pastille `INFO` exercée par une vraie règle** → it3. Son mapping est néanmoins exhaustif par compilation dès maintenant, sinon it3 rouvrirait `ListeControles.tsx`.

## Écarts assumés

- **Deux features touchées dans le lot non-contrat** — signal de coupe de la skill, non coupé en connaissance de cause, acté par l'humain à la porte 2. Un module `brain/` sans écran n'est pas une tranche verticale.
- **`libelle: 'Amorce non rédigée'`** — champ imposé par le § 4, sans valeur fournie par le § 3. Aucune surface ne le rend en it1.
- **L'agrégation « le plus grave » de `parSection`** — non spécifiée au plan ; retenue par un `Record<NiveauControle, number>` exhaustif par compilation, testée.
- **Cinq tests au-delà des noms du § 7** — aucun ne remplace un test nommé ; ils couvrent des clauses de critère que la table n'épinglait pas.
- **Incohérence interne du plan lui-même**, relevée par la QA : le § 5 annonçait un test séparé pour `ListeControles` fabriquant des messages neutres, le § 7 n'en listait aucun. L'implémentation a suivi le § 7. Sans conséquence — KR-223 tient quand même, vérifié.

## Deux défauts trouvés en revue, corrigés dans ce lot

- **BUG-082 (major)** — `DossierEditorScreen` rendait **deux lignes courantes simultanément** : en activant « Contrôles », la dernière section restait surlignée. Deux `useState` indépendants, donc deux sources pour « ce qui est affiché » — **état illégal représentable**. Corrigé par un état unique ; `SectionNavProps.selectedId` passe à `SectionId | null`, la nav recevant `null` quand la destination ne lui appartient pas. **Sonde de discriminance exécutée** : réintroduire le défaut fait rougir exactement un test, le restaurer le rend vert.
- **BUG-083 (minor)** — la clause « aucun badge de compte » était gardée par `toHaveTextContent`, une inclusion : elle serait restée verte si un `trailing` avait été ajouté. Corrigée en égalité sur `textContent`. Cinquième occurrence de la classe KR-199.

## Porte qualité

| | |
|---|---|
| `tsc --noEmit` | **vert**, 0 erreur |
| ESLint | **vert**, 0 erreur (1 avertissement pré-existant dans `src/player/`, hors périmètre, intact) |
| Jest | **83 suites / 1193 tests verts** (avant itération : **81 / 1173** — le lot contrat en apporte 1 suite et 15 tests, le lot écran 1 suite et 5 tests) |
| `test:mutation` | **sans objet** — l'itération ne touche ni `challenge.ts`, ni `combat.ts`, ni `xp.ts`, ni `characteristics.ts`. Vérifié sur les neuf fichiers du diff, pas supposé. |

## Non vérifié par personne *(recopié du § 7 du plan, confirmé exact par la QA)*

- La séparation visuelle (`border-top`) : jsdom ne calcule aucun layout — seule la présence du jeton est vérifiable, jamais le rendu.
- La **totalité** de `controlerDossier` : prouvée par échantillon de cas limites, jamais par exhaustivité sur tout `Dossier` typé.
- Les sondes de source au-delà de la ligne 415 de `dossierEditorScreen.test.tsx`, fichier jamais relu en entier par le comité.
- **L'ordre de tabulation réel** entre les dix sections et « Contrôles » : le test active par `focus()` programmatique, pas par une traversée `Tab` depuis le haut de la nav.
- `jouable` n'a **aucun consommateur d'écran** : prouvé par L1 seul, jamais par l'interface.

## `RETOUR-COMITÉ`

1. **Une note de raffinage condensée par l'orchestrateur peut perdre la décision qui aurait évité le défaut.** BUG-082 était **nommément rejeté** par le tech-lead au tour 1 (« 4 combinaisons pour 2 états légaux, deux sources pour ce qui est affiché — état illégal représentable »), dans l'annexe de sa note. En la condensant pour le dossier, j'ai gardé sa conclusion et perdu ce rejet : l'ouvrier ne pouvait pas le lire, et la QA en mode B n'a pas pu retrouver la prémisse que je lui citais — elle l'a signalé factuellement plutôt que de forcer le rapprochement, ce qui est exactement le bon réflexe. **Règle à tenir** : les `REJETÉ` d'une annexe se recopient dans le registre des désaccords du plan (§ 8), pas seulement dans la note du rôle. Un refus qui ne franchit pas le § 8 n'existe pas pour l'essaim.
2. **Le découpage en deux lots séquentiels était le bon**, et il l'était pour une raison mécanique qu'aucun rôle n'avait vue au tour 1 : `App.tsx` importe le panneau, donc un lot d'adoption séparé ne compile pas avant le lot feature. C'est le tech-lead qui l'a mesuré au tour 1 et qui a ramené trois lots à deux. **Le compter avant de le proposer** aurait épargné un aller-retour.
3. **Un rôle qui retire une objection en la chiffrant vaut mieux qu'un rôle qui la maintient.** Le tech-lead a écrit « inlivrable » au tour 1, puis l'a retiré au tour 2 en le chiffrant à zéro fichier et ~7 lignes — et c'est ce chiffrage, pas l'intuition initiale, qui a permis au PM de trancher le report sur un motif propre (la forme du contrat de prop) plutôt que sur une impossibilité imaginaire.
4. **La borne de six fichiers a un coût visible** : l'UX a rendu au tour 1 des lignes QUOI FAIRE « provisoires » faute d'avoir pu ouvrir `amorce.ts`, et il a fallu un tour 2 pour les verrouiller. Sur une itération dont la matière EST un fichier précis, ce fichier devrait être imposé dans la liste de lecture du rôle qui écrit les textes, pas laissé à son arbitrage.
5. **Pour it2** : elle rouvrira `DossierEditorScreen.tsx` et `SectionNav.tsx`, donc la même déviation « deux features » se représentera. Si elle devait s'étendre à un troisième fichier ou gagner de la logique, c'est le signe qu'il faut un contrat `brain/` de navigation d'éditeur plutôt qu'une adoption de plus.
