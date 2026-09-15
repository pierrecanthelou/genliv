# Tour 1 — `tech-lead`

**VERDICT** : recevable sous réserve (4 réserves, 5 vetos).

**RISQUE** — **le mapping niveau → (MOT, teinte) existe DÉJÀ** : `PASTILLES`, privé de `dossier-controles/components/ListeControles.tsx` (l. 58-62). Si `SectionNav` (`bascule-editeur`) s'en écrit une copie, **deux features rendent le même mot depuis deux tables**. Aucune règle de lint ne le voit — c'est une copie, pas un import — les deux suites restent vertes, et ça diverge en silence le jour où it3 ou la passe visuelle renomme ALERTE. C'est le seul défaut d'it2 qui survivrait à la livraison sans bruit.

**OBJECTION 1** — « fusionné au badge de compte » est **inconstructible tel qu'écrit**. Composer `{compte} · {MOT}` est une décision de PHRASE, que `sections.ts` interdit nommément à la vue (« rendre un nombre obligerait chaque vue à recomposer la phrase, donc à re-décider de l'accord »). Pire, **mesuré** : les deux sections que les règles d'it1 allument (`canon`, `depart`) sont **exactement** les deux qui rendent `SANS_COMPTE` — le premier rendu de l'itération afficherait « — · BLOQUANT », un badge dont la moitié gauche ne dit rien. Le plan doit trancher **SUBSTITUTION ou CONCATÉNATION**.

**OBJECTION 2** — **le cadrage se trompe sur un fait mesuré** : la l. 203 n'est PAS le seul test réécrit. `dossierEditorScreen.test.tsx` l. 118 (`COMPTES_DOSSIER_NEUF`, lue l. 190) épingle `'—'` sur Canon et Départ ; elle rougit dans les DEUX variantes de texte.

**PROPOSITION** — extraire le couple mot/teinte en primitive `brain/components/PastilleNiveau.tsx` (`{ niveau }` → `<Badge tone>{libelle}</Badge>`), porteur UNIQUE ; `ListeControles` perd `PASTILLES` et la consomme. C'est le **deuxième appelant nommé** que KR-109 et la revue d'it1 exigeaient — pas une abstraction anticipée. `SectionNav` fait `niveau === null ? <Badge tone="muted">{compte}</Badge> : <PastilleNiveau niveau={niveau} />` et appelle `controlerDossier(dossier)` lui-même, en ligne. **`DossierEditorScreen.tsx` n'est pas touché.** Aucun lot contrat sur `controles.ts` : `parSection` reste intact.

## Découpage — 2 lots séquentiels

| LOT | TYPE | FICHIERS |
|---|---|---|
| **L1** | `contrat`, seul et en premier | (N) `src/brain/components/PastilleNiveau.tsx` · (N) `PastilleNiveau.test.tsx` · (R) `src/brain/components/index.ts` (une ligne) · (R) `src/brain/dossier/controles.ts` (**JSDoc seul**, l. 41-43) |
| **L2** | feature | (R) `src/features/bascule-editeur/components/SectionNav.tsx` · (R) `tests/dossierEditorScreen.test.tsx` · (R) `src/features/dossier-controles/components/ListeControles.tsx` · (R) `tests/panneauControles.test.tsx` *(diff nul attendu)* |

**Pourquoi `controles.ts` dans L1 pour un commentaire** : sa docstring affirme « les libellés français et les pastilles restent côté feature ». L1 rend cette phrase FAUSSE. Un commentaire contractuel périmé dans le fichier que les comités d'it3 et it4 relisent en premier est un piège.

**Trois lots : refusé.** Scinder L2 ferait deux lots dont l'un ne passe pas la porte seul (supprimer `PASTILLES` sans consommateur laisse un import mort), pour zéro parallélisme.

## Qui appelle `controlerDossier` — `SectionNav`, pas l'écran

1. « L'écran l'appellera de toute façon à it3 » est **faux au code** : `PanneauControles.tsx` l. 31 appelle `controlerDossier` lui-même et est injecté comme `ReactNode` opaque. `DossierEditorScreen` n'a jamais eu, et n'aura pas à it3, de raison de tenir le rapport.
2. Deux **appels** d'une fonction pure ne sont pas deux **sources**. Ce qui serait une seconde source, c'est une seconde **dérivation** — une vue qui recalculerait « le pire ». Rien ici ne le fait.
3. `DossierEditorScreen.tsx` **sort de la liste**, ce qui répond par construction à l'alerte n° 5 du `RETOUR-COMITÉ` d'it1 : le compte de fichiers `bascule-editeur` **baisse** de 3 à 2.

`SectionNavProps` **ne change pas d'une ligne**. Pas de `.length`, `.filter(`, `.reduce(` → sonde l. 194 verte sans modification.

## La sonde l. 203, version d'après — durcie, pas levée

> ⚠ **FAUX, corrigé après coup (BUG-084)** — l'affirmation « serait restée VERTE » du paragraphe ci-dessous est réfutée : la sonde **aurait rougi**, son assertion positive `toMatch(/tone="muted"/)` ne survivant pas au remplacement du littéral par `tone={badge.tone}`. La conclusion (réécrire la sonde) reste juste ; le motif ne l'était pas, et « sixième occurrence de KR-199 » n'en est pas une. **Le texte est conservé tel quel, délibérément** : c'est la pièce sur laquelle repose le `root_cause` du bug (« posé au tour 1, maintenu au tour 2 »), et le réécrire détruirait la preuve du défaut — même doctrine que l'append-only de `bug_history`. Motif exact : plan § 7.

Elle **serait restée VERTE sans amendement** (SectionNav n'écrit plus aucun `tone=` coloré), et c'est précisément pourquoi il faut la réécrire : **un test dont le NOM devient faux pendant qu'il reste vert est une garde perdue plus dangereuse qu'une garde supprimée** (classe KR-199, sixième occurrence). Version proposée : interdits permanents `tone="good"` et `tone="accent"` ; **renforcés** `tone="bad"` et `tone={` en bloc (c'est la forme qu'aurait prise la table locale) ; aucun des trois niveaux nommé dans le fichier ; `tone="muted"` toujours requis.

## Si le comité veut le COMPTE — la seule forme admissible, et pourquoi je la refuse

Forme : un `Record` TOTAL **frère** (`comptesParSection`), jamais un objet composite. **`{ pire, comptes }` : VETO** — `pire` est dérivable de `comptes`, deux champs pour un fait, état illégal représentable : classe exacte de BUG-082. **Remplacer `parSection` : VETO** — chaque appelant re-dériverait le pire, `GRAVITE` fuirait hors de `brain/`.

Refus motivé par **mesure de largeur** : la colonne fait 280 px et `Badge` est en `nowrap` ; « 0 jalon · 0 fin · 2 bloquants » ne tient pas. Plus : un seul appelant, aucun second nommé ; trois surfaces `brain/` pour un badge ; et ce n'est pas la démo (« **quelle** section », pas combien).

## Vetos

**V1** `parSection` en `Partial`, ou réécrit en `{ pire, comptes }` · **V2** tout lot touchant `IssueList.tsx` ou `ListRow.tsx` · **V3** tout `ref`/prop ajouté à `ListRow` · **V4 (neuf)** toute table `Record<NiveauControle, …>` subsistant dans un fichier de feature après L2 — sans la suppression de `PASTILLES`, l'extraction n'a rien extrait · **V5 (neuf)** `PastilleNiveau` avec une seconde prop (`compact`, `variant`, `children`) — la dette `onReorder` reposée.

## Deux notes de fond pour le tour 2

- **La teinte seule ne peut pas porter le niveau.** `info` → `muted` est *la teinte du badge calme*, et `alerte` → `neutral` n'en diffère que d'un gris. Toute variante « on ne change que la couleur » rend `info` **invisible** dès it3. Le MOT est obligatoire — doctrine écrite du contrat de design.
- Les `REJETÉ` de cette annexe doivent être **recopiés au § 8 du plan**, pas condensés dans ma note : règle tirée de BUG-082.
