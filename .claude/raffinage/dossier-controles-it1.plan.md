# Plan d'itération — `dossier-controles` · itération `1`

> Statut : `validé` — porte 2 franchie le 2026-09-15, la déviation « deux features touchées » actée en connaissance de cause.
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-15
> Composition : `5 rôles` — motif : l'arbitrage central de l'itération est une question d'**audience** (`moteur` contre `ia`), et la leçon de `dossier-registres` élargit le critère de convocation de `narratif-ia` à toute itération qui raisonne sur les destinations, pas seulement à celles qui touchent un prompt.
> Exécution : `séquentielle` (2 lots) — `App.tsx` importe `PanneauControles`, donc aucun parallélisme n'est possible : le lot d'adoption ne compile pas avant le lot feature.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur voit, dans un écran Contrôles, quelles proses de son dossier restent à rédiger. » |
| **Tranche** | `brain/dossier/controles.ts` (registre fermé de règles, rapport dérivé, seuil `jouable`) → `PanneauControles` / `ListeControles` → une entrée de navigation dans `DossierEditorScreen` → injection par `App.tsx`. Aucune persistance : le rapport est **calculé à chaque rendu**, jamais stocké. |
| **Lots** | 2 lots · dont `contrat` : **oui** (L1, seul et en premier) |
| **Hors périmètre** | Badges de nav (it2) · les cinq règles de registre (it3) · atteignabilité (it4) · verdict `jouable` affiché · clic d'une ligne vers sa section · détection qualitative sur dossier importé · tri, groupement, compteur d'en-tête, persistance |
| **Reporté** | Le clic d'une ligne vers sa section **et** le focus qui suit → it2 · La pastille INFO exercée par une vraie règle → it3 |

**Déviation assumée, à connaître avant de valider** — l'itération touche **deux features** (`dossier-controles`, neuve, et une adoption dans `bascule-editeur`), ce qui est un signal de coupe de la skill. Elle n'est pas coupée : un module `brain/` sans écran n'est pas une tranche verticale, la démo ne survit pas à l'ablation de l'écran, et l'édition de `bascule-editeur` est déjà arbitrée au cadrage (`resolved_decisions` : admise quand le diff n'ajoute aucune logique métier). Le report du clic de ligne (désaccord 3) ramène précisément ce diff à sa forme annoncée.

---

## 1 — But raffiné

À la fin de cette itération, l'auteur voit, dans un écran Contrôles, quelles proses de son dossier restent à rédiger.

## 2 — Hors périmètre

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

- **Verdict global « jouable »** — non affiché ; calculé, exporté, testé seulement. Un voyant rouge sur 100 % des dossiers à t=0 est le miroir du voyant vert tautologique déjà refusé sous `SANS_COMPTE` (`sections.ts`). Son premier rendu légitime est `previewDisabledReason` (n° 9).
- **Détection qualitative sur dossier importé** dont les proses n'ont jamais porté le marqueur — hors périmètre, et hors périmètre du linter tout court : `validate.ts` l. 300 refuse déjà la chaîne vide **et** le blanc, donc une prose requise vide est inatteignable sur un dossier persisté. Reste la prose non blanche mais creuse (« TODO »), qu'aucune règle littérale ne voit et dont le seul juge serait un modèle — refusé. L'honnêteté est portée par l'**état calme**, dont le mot « connus » ne se retire pas.
- **Clic sur une ligne du panneau pour sélectionner sa section** — REPORTÉ, lignes non cliquables en it1 (voir § 8, désaccord 3).
- **Rafraîchissement ou synchro entre deux panneaux ouverts simultanément** — le calcul dérivé au rendu suffit (KR-013) ; aucun cache, aucun `useEffect` miroir.
- **Pastille INFO exercée par une vraie règle** — aucune règle `info` avant it3 ; seul le mapping exhaustif des trois tons est dû.
- **Tri des contrôles, groupement par niveau, compteur d'en-tête, persistance du rapport, masquage d'une ligne** — aucun requis.
- **Sous-titre sur l'entrée de nav « Contrôles »** — aucun ; une `cle` technique y serait inventée.
- **Badges de nav** (it2) · **les cinq règles de registre et les avertissements du validateur** (it3) · **atteignabilité et canon sans objectif** (it4) · **tout lot contrat sur `validate.ts` / `types.ts` / `destinations.ts`** · **focus dans le champ fautif d'une autre feature**.

## 3 — Contrat de design

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

### Surfaces — deux, pas plus

1. **Un second `<nav aria-label="Contrôles">`**, frère du `<nav aria-label="Sections du dossier">` existant et placé **après lui dans l'ordre du DOM**, empilés par un `<div>` en colonne dans `DossierEditorScreen`. Il porte une seule ligne, un `ListRow` identique aux dix autres. **Il n'est rendu que si un panneau Contrôles est injecté.** `SectionNav.tsx` cède au wrapper `width` / `borderRight` / `overflowY` / `padding`, et **rien d'autre** — ses trois sondes de source restent vertes.
   - Libellé : `Contrôles`, casse phrase. **Aucun sous-titre.** Aucun badge de compte.
   - Séparation : `border-top: 1px solid var(--border-rule)` + `padding-top: var(--space-3)`.
   - État sélectionné : mécanisme `selected` existant de `ListRow`, aucun jeton neuf.
2. **`PanneauControles`**, injecté par `App.tsx` (KR-184), fichier neuf qui n'étend pas `PanneauSection.tsx`. Wrapper de page calqué sur `PanneauSection.page` : `flex: 1`, `min-height: 0`, `box-sizing: border-box`, `overflow-y: auto`, `padding: var(--space-12)` — **c'est lui qui défile**, pas la liste.

### `ListeControles` — calque d'`IssueList`, jamais `IssueList` elle-même

`IssueList.tsx` n'est **pas** touchée (veto tech-lead) : la réutiliser obligerait à forger un `DossierIssue` porteur d'un `code` absent de son union de vingt, et à appeler `dossierIssueRemediation` sur un code inexistant — un mensonge de type. L'extraction d'une primitive partagée est due au **second** appelant de forme `Controle`, pas avant (KR-109).

Repris d'`IssueList` **à l'identique** — le `<ul>` : `list-style: none`, `margin: 0`, `padding: 0`, `border: 1px solid var(--border-divider)`, `border-radius: var(--r-md)`.
**Deux lignes changent** : `max-height: 240` et `overflow-y: auto` sont **retirées** du `<ul>` — gabarit de modale, la page défile déjà.
Chaque `<li>` passe en `flex-direction: row`, `gap: var(--space-3)`, `align-items: flex-start`, `padding: var(--space-4)`, filet `border-bottom: 1px solid var(--border-divider)` sauf la dernière : premier enfant la **pastille**, second enfant une colonne (`gap: var(--space-1)`) portant les trois `<p>` aux jetons d'`IssueList` inchangés.

- OÙ : `--font-mono`, `--fs-eyebrow`, `--text-label`, `--track-eyebrow`
- QUOI : `--font-ui`, `--fs-body`, `--text-body`
- QUOI FAIRE : `--font-ui`, `--fs-meta`, `--text-muted`

### Pastilles — trois niveaux, deux couleurs sémantiques

Le produit n'a que `--good` et `--bad`, et `CLAUDE.md` en fait les **seules** couleurs sémantiques : les trois niveaux se séparent par le **mot**, jamais par une teinte neuve. Mono, capitales, toujours au singulier (un mot par ligne, jamais d'agrégat), aucun glyphe.

| Niveau | Composant | Jetons |
|---|---|---|
| `BLOQUANT` | `Badge tone="bad"` | `--bad`, `--bad-line`, `--bad-bg-2` |
| `ALERTE` | `Badge tone="neutral"` | `--ink-2`, `--line-1`, `--paper-0` |
| `INFO` | `Badge tone="muted"` | `--ink-4`, `--line-2`, `--paper-0` |

Le mapping est un `Record<NiveauControle, …>` **exhaustif par compilation** dès it1, `INFO` compris bien qu'aucune règle ne le produise avant it3 — sinon it3 rouvrirait `ListeControles.tsx`, ce que la promesse d'extension du registre interdit.

### Les quatre lignes, mot pour mot

`${MARQUEUR_A_ECRIRE}` désigne l'**interpolation** de la constante importée de `./amorce`. Le glyphe **rendu à l'exécution** est licite ; le glyphe **écrit en source** ne l'est nulle part (§ 7, KR-223). Ces trois lignes vivent dans la table privée de `controles.ts`, jamais dans le composant.

Ordre de rendu : le bloquant, puis `synopsis_mj`, `accroche_joueur`, `ton` — l'ordre du schéma, rendu tel quel, **aucun tri dans la vue**.

**1 · `charpente.depart.texte_ouverture_joueur` — BLOQUANT, section `depart`**
- OÙ : `DÉPART · TEXTE D'OUVERTURE — lu par le joueur, mot pour mot`
- QUOI : « Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le moteur le lira au joueur mot pour mot, marqueur compris. »
- QUOI FAIRE : « Rédigez le texte que le joueur doit lire en arrivant. »

**2 · `canon.mj.synopsis_mj` — ALERTE, section `canon`**
- OÙ : `CANON · SYNOPSIS — matériau du modèle, jamais lu tel quel`
- QUOI : « Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le synopsis partira tel quel dans le contexte du modèle. »
- QUOI FAIRE : « Rédigez le synopsis qui orientera le modèle sur l'intrigue. »

**3 · `canon.partage.accroche_joueur` — ALERTE, section `canon`**
- OÙ : `CANON · ACCROCHE — matériau du modèle, jamais lu tel quel`
- QUOI : « Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : l'accroche partira telle quelle dans le contexte du modèle. »
- QUOI FAIRE : « Rédigez l'accroche qui donnera envie de commencer. »

**4 · `canon.ton` — ALERTE, section `canon`**
- OÙ : `CANON · TON — matériau du modèle, jamais lu tel quel`
- QUOI : « Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le ton partira tel quel dans le contexte du modèle. »
- QUOI FAIRE : « Rédigez le ton qui doit guider le modèle — ambiance, registre, limites. »

Chaque QUOI s'ouvre sur le **manque** — le repère qu'un auteur cherche en premier — et se ferme sur la **conséquence par destination**, qui seule distingue bloquant d'alerte. Sans cette différence, les deux niveaux ne se sépareraient que par la pastille : classe KR-199/KR-222 appliquée à la rédaction.

**Aucune de ces lignes ne recopie la consigne semée par `amorce.ts`** — ni « la vérité de cette aventure… », ni « ce que le joueur sait… », ni « par exemple : sombre et feutré ». La consigne s'adresse à un auteur devant un champ ; la remédiation à un auteur qui lit un rapport. Même fait, deux registres, deux textes assumés.

### États

- **Dossier neuf** (`construireAmorce`) : les quatre lignes ci-dessus, dans cet ordre.
- **État calme** (aucun contrôle) : gabarit `emptyState` de `PanneauSection` — `border: 1.5px dashed var(--border-field)`, `border-radius: var(--r-xl)`, `background: var(--paper-1)`, `padding: var(--space-10) var(--space-8)`, `max-width: 480`, glyphe `⬚` en `--fs-h1` / `--text-faint`, texte en `--text-muted` / `--lh-body`.
  Texte exact : **« Aucun contrôle à signaler — le dossier passe tous les contrôles connus. »**
  Jamais « les quatre proses » (faux dès it3). Jamais `✓` : le vert reste réservé au jet. Le mot **« connus » ne se retire pas** — c'est lui qui porte la limite du dossier importé.
- **Ligne de rapport** : un seul état, *affiché*. Pas de survol, pas de sélection, pas de focus — ce ne sont pas des cibles, ce sont des constats à lire.

### Clavier

L'entrée « Contrôles » est un `ListRow` identique aux dix autres : Tab l'atteint **en onzième position**, l'ordre de tabulation suivant le DOM et non le landmark ; Entrée ou Espace l'active par le même canal `onSelect` ; le focus **reste sur la ligne de nav activée**. Aucun contrat nouveau à inventer.

À l'intérieur du panneau, **aucun arrêt de tabulation** : les `<li>` sont sémantiques, sans `role="button"`, sans `tabindex`, sans `onClick`.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `NiveauControle` | type | fournit | `'bloquant' \| 'alerte' \| 'info'` — le **mot**, jamais une couleur. Les libellés français restent côté feature (précédent `sections.ts` : ni glyphe ni numéro de feature dans `brain/`). |
| `ConstatControle` | type | fournit | `{ niveau: NiveauControle; section: SectionId; message: string; location: string; path: string; entityId?: string }` |
| `Controle` | type | fournit | `interface Controle extends ConstatControle { id: ControleId }` |
| `ControleDescripteur` | type (privé) | — | `{ libelle: string; niveaux: readonly NiveauControle[]; controler(dossier: Dossier): ConstatControle[]; remediation(constat: ConstatControle): string }` |
| `CONTROLES` | registre (privé) | — | `defineRegistre<ControleDescripteur>()({ 'amorce-non-redigee': … })` — la factory d'identité de `identifiers.ts`, celle qui arme déjà `PREDICATES` et `DELTAS`. Jamais un `as const` maison. |
| `ControleId` | type | fournit | `keyof typeof CONTROLES` — union **dérivée**, jamais re-listée (KR-117) |
| `RapportControles` | type | fournit | `{ controles: readonly Controle[]; jouable: boolean; parSection: Record<SectionId, NiveauControle \| null> }` |
| `controlerDossier` | fonction | fournit | `(dossier: Dossier) => RapportControles` — **pure, totale, synchrone** |
| `controleRemediation` | fonction | fournit | `(controle: Controle) => string` = `CONTROLES[controle.id].remediation(controle)` — jamais interpolé au site d'appel |
| `MARQUEUR_A_ECRIRE`, `AMORCE` | constantes | consomme | par `import { … } from './amorce'`, interne à `brain/dossier/` |
| `SECTIONS`, `SectionId` | registre | consomme | inchangés — `SECTIONS` ne gagne aucune ligne |
| `DESTINATION_DES_CHAMPS` | registre | consomme **au test seul** | `controles.test.ts` importe `./destinations` pour épingler que les quatre `path` en sont des clés. **Aucun couplage runtime dans `controles.ts`.** |

**Deux axes distincts, à écrire dans la docstring de `controles.ts`** — c'est ce qui rend le type frère lisible plutôt qu'arbitraire : `DossierIssueSeverity` répond « ce document peut-il être **écrit** ? » (deux valeurs, parce qu'elle a deux effets sur `DossierService.update`) ; `NiveauControle` répond « cette aventure peut-elle être **jouée** ? » (trois mots, aucun effet sur l'écriture). Un dossier parfaitement écrivable peut être totalement injouable.

**`parSection` est un `Record` TOTAL**, construit depuis `SECTIONS` et jamais dix clés re-listées. Un `Partial` obligerait chaque appelant à écrire `?? null` — deux silences indistinguables, classe KR-199 — et une onzième section n'échouerait plus à la compilation. **Veto tech-lead si `Partial`.**

**`jouable` est dérivé ici et nulle part ailleurs** : `controles.every(c => c.niveau !== 'bloquant')`. Jamais stocké, jamais recalculé par une vue (KR-013). C'est déjà le prédicat que n° 9 appellera — aucun `peutOuvrirUnePartie()` n'est écrit d'avance.

**Sortent au baril** `brain/index.ts` : `NiveauControle`, `Controle`, `ControleId`, `RapportControles`, `controlerDossier`, `controleRemediation`.
**Restent privés à `brain/dossier/`** : `CONTROLES`, `ControleDescripteur`, `ConstatControle`, la table des proses.

**Contrat consommé par L2, à lire comme donnée immuable :**

```ts
interface DossierEditorScreenProps {
	dossierId: string
	panneaux?: Partial<Record<SectionId, ReactNode>>   // INCHANGÉ
	panneauControles?: ReactNode                        // prop SŒUR, jamais une 11e clé
}
```

L'union `SectionId | 'controles'` reste **locale à `bascule-editeur`** (`DESTINATION_CONTROLES`, `DestinationNav`) et ne remonte pas dans `brain/` : l'y élargir ferait de `PANNEAU_PAR_SECTION` un `Record` réclamant un glyphe et un numéro de feature pour une destination livrée maintenant — un état vide qui ne peut jamais s'afficher, exactement le défaut `SANS_COMPTE`.

## 4 bis — Contrat de sortie IA

**Néant, et c'est vérifié.** Aucun modèle appelé, aucune sortie de modèle consommée, aucun prompt écrit ni modifié, aucune route worker. Le rapport est d'audience `auteur` : il n'entre dans aucun contexte de modèle et ne gagne **aucune ligne** dans `DESTINATION_DES_CHAMPS` — ce n'est pas un champ du document, c'est un calcul. Les quatre règles sont des règles de **rédaction**, pas de jeu : elles ne touchent aucun des quatre fichiers sous mutation, donc ni `npm run test:mutation` ni la table dorée.

Cette itération **renforce** la frontière côté code : c'est le premier dispositif du dépôt qui empêche une consigne de rédaction d'entrer dans le contexte du modèle.

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `controles-contrat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser le registre fermé, le rapport dérivé et la règle « amorce non rédigée ».
- **Fichiers** : `src/brain/dossier/controles.ts` (N) · `src/brain/dossier/controles.test.ts` (N) · `src/brain/index.ts` (R)
- **Expose** : la signature du § 4, mot pour mot. **Consomme** : `./amorce` (`MARQUEUR_A_ECRIRE`, `AMORCE`), `./sections`, `./types` ; `./destinations` **au test seul**.
- **Critères couverts** : #1, #2, #3, #4, #5
- **Trois interdictions, à ne pas laisser au jugement de l'ouvrier** :
  1. **Aucune des trois chaînes `MARQUEUR_A_ECRIRE`, `construireAmorce`, `dossier/amorce` n'apparaît dans `brain/index.ts`, pas même en commentaire** — `amorce.test.ts` asserte leur absence par balayage de texte, une prose explicative le ferait rougir. Le motif du non-export s'écrit dans `controles.ts`.
  2. **Le glyphe n'est jamais écrit en source**, ni dans `controles.ts`, ni dans son test : toujours `${MARQUEUR_A_ECRIRE}` interpolé depuis la constante importée.
  3. **Détection par `includes`, jamais `startsWith`** — écrit au JSDoc de la règle, avec son motif (§ 8, désaccord 2).
- **La table des proses** est privée à `controles.ts` : `Record<keyof typeof AMORCE, { niveau, section, path, location, message, remediation, lire(d: Dossier): string }>`. Le `Record` **total sur `keyof typeof AMORCE`** est la garde anti-dérive **par compilation** — une cinquième prose semée dans `amorce.ts` casse `tsc` ici, sans qu'aucun test soit dû. Elle ne peut pas vivre dans `amorce.ts` : `niveau` et `section` sont du vocabulaire de linter, `amorce.ts` est un semeur.

### Lot 2 — `controles-ecran`
- **Ouvrier** : `dev-lot` (après fusion de L1)
- **But** : rendre le rapport dans un panneau, et l'atteindre depuis la navigation.
- **Fichiers** : `src/features/dossier-controles/index.ts` (N) · `src/features/dossier-controles/components/PanneauControles.tsx` (N) · `src/features/dossier-controles/components/ListeControles.tsx` (N) · `src/features/dossier-controles/tests/panneauControles.test.tsx` (N) · `src/features/bascule-editeur/components/DossierEditorScreen.tsx` (R) · `src/features/bascule-editeur/components/SectionNav.tsx` (R) · `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (R) · `src/App.tsx` (R)
- **Consomme** : L1 **par le baril `brain` uniquement**. **Expose** : `PanneauControles` par le baril de la feature, injecté par `App.tsx`.
- **Critères couverts** : #6, #7, #8
- **Ne touche pas** : `IssueList.tsx` (veto), `ListRow.tsx` (veto), `PanneauSection.tsx`, `sections.ts`.
- **Répartition du glyphe, conséquence de l'interdiction 2** : `ListeControles` reçoit `controles: readonly Controle[]` et **son test fabrique des contrôles à messages neutres** ; seul `PanneauControles` lit le dossier réel. Assertions autorisées sur les messages : des fragments français sans glyphe (`/mot pour mot/`, `/contexte du modèle/`).
- `dossierEditorScreen.test.tsx` **gagne des cas, n'en amende aucun** (critère #8).

**Propriété exclusive vérifiée** : aucune intersection entre L1 et L2.

## 6 — Critères d'acceptation

*(Les huit ci-dessous sont les critères de **l'itération 1**. Ils remplacent toute lecture directe des douze critères de `plan.acceptance_criteria`, qui sont ceux de la **feature entière** — désaccord 11.)*

1. **Étant donné** un dossier produit par `construireAmorce()`, **quand** `controlerDossier` est appelé, **alors** `controles` compte exactement 4 éléments — 1 `bloquant`/`depart` sur `charpente.depart.texte_ouverture_joueur`, 3 `alerte`/`canon` balayés depuis les clés d'`AMORCE` (jamais quatre littéraux) — et `jouable === false`. — *unitaire* — *lot 1*
2. **Étant donné**, dans le **même test**, un clone de `dossier-minimal.json` (aucune prose marquée) et ce clone muté d'**un seul** champ préfixé de `MARQUEUR_A_ECRIRE` importé, **quand** `controlerDossier` est appelé sur chacun, **alors** le premier produit 0 contrôle et le second exactement 1, au niveau attendu ; restaurer la valeur retombe à 0 dans le même test. — *unitaire* — *lot 1*
3. **Étant donné** le rapport du critère 1, **quand** on compare la section de chaque contrôle à celle que sa règle déclare, **alors** les quatre coïncident — le bloquant vaut `'depart'`, jamais `'charpente'`, ce que donnerait une dérivation naïve du premier segment de `path`. — *unitaire (contrat de registre)* — *lot 1*
4. **Étant donné** `amorce.test.ts` inchangé **et** une sonde nouvelle locale à `controles.test.ts`, **quand** `controles.ts` est ajouté, **alors** (a) ses deux tests-grep restent verts **sans modification d'assertion**, et (b) `controles.ts` ne porte le glyphe qu'à travers l'identifiant importé, jamais recopié en littéral. — *contrat (balayage de source)* — *lot 1*
5. **Étant donné** le rapport du critère 1, **quand** on inspecte chaque contrôle, **alors** aucun ne porte `severity`, aucun `niveau` ne sort de `bloquant|alerte`, et le rapport est produit **sans jamais lire** `validateDossier(...).errors` ni `.warnings`. — *unitaire* — *lot 1*
6. **Étant donné** le rapport du critère 1 puis un dossier calme, **quand** le panneau est rendu, **alors** on lit une ligne `BLOQUANT` et trois `ALERTE` avec leur phrase française (jamais un code technique), et le dossier calme rend le texte d'état calme — jamais une liste vide nue. — *composant* — *lot 2*
7. **Étant donné** l'écran rendu **avec** un panneau Contrôles injecté, **quand** l'auteur active l'entrée « Contrôles » (clic, ou Tab jusqu'à elle puis Entrée), **alors** le panneau apparaît, `SECTIONS.length === 10` reste vrai, et l'entrée ne porte aucun badge de compte. — *bout-en-bout* — *lot 2*
8. **Étant donné** `dossierEditorScreen.test.tsx › nav des dix sections › rend les 10 ListRow…` tel qu'il existe (son `renderScreen` n'injecte **aucun** panneau), **quand** le lot 2 livre l'entrée, **alors** ce test reste vert **sans aucune modification de son code** : `within(nav).getAllByRole('button')` reste de longueur 10. Toute rougeur, ou toute nécessité de le modifier, est un **défaut** signalant un rendu inconditionnel. — *bout-en-bout* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `controles.test.ts › produit les quatre controles sur un dossier fraichement seme` | 4 contrôles, 1 bloquant `depart` + 3 alertes `canon`, **balayés depuis `Object.keys(AMORCE)`** ; `jouable === false` | jest | KR-199 | L1 |
| `controles.test.ts › jouable ne bascule vrai qu une fois le bloquant reecrit` | reste faux avec les trois alertes seules ; vrai quand seul `texte_ouverture_joueur` est réécrit ; et `jouable === controles.every(c => c.niveau !== 'bloquant')` sur les deux dossiers | jest | KR-013 | L1 |
| `controles.test.ts › se declenche sur un champ mute et se tait sur son clone intact, meme test` | clone + 1 champ marqué → 1 contrôle ; clone intact → 0 ; restauration → 0 | jest | KR-197, KR-202 | L1 |
| `controles.test.ts › detecte un marqueur reste au milieu d une prose partiellement reecrite` | prose rédigée **autour** du marqueur → contrôle présent, `niveau === 'alerte'`. Avec `startsWith` ce contrôle n'existe pas : c'est le discriminant de l'arbitrage 2 | jest | — | L1 |
| `controles.test.ts › la section de chaque controle est celle declaree, jamais derivee du path` | `section` du constat == section déclarée ; le bloquant vaut `'depart'` | jest | KR-219 | L1 |
| `controles.test.ts › tout constat rend un niveau declare par sa regle` | balayage de `CONTROLES` (jamais N littéraux) : tout `constat.niveau ∈ descripteur.niveaux` | jest | KR-199 | L1 |
| `controles.test.ts › les quatre path sont des cles de DESTINATION_DES_CHAMPS` | `path in DESTINATION_DES_CHAMPS` pour les quatre, la table importée de `./destinations` | jest | veto narratif | L1 |
| `controles.test.ts › Controle ne porte jamais de severity` | `not.toHaveProperty('severity')` × 4 ; `niveau ∈ {bloquant, alerte}` | jest | KR-217, KR-225 | L1 |
| `controles.test.ts › les messages francais n ecrivent jamais le glyphe en dur` | la source de `controles.ts` **ne contient pas** le glyphe et **contient** l'identifiant `MARQUEUR_A_ECRIRE` | jest (balayage de source) | KR-223 | L1 |
| `controles.test.ts › parSection porte les dix sections, dans l ordre du registre` | `Object.keys(parSection)` == les `id` de `SECTIONS` ; les huit sections sans contrôle valent `null` | jest | KR-117 | L1 |
| `controles.test.ts › cas limite : marqueur seul sans consigne` | `texte === MARQUEUR_A_ECRIRE` → 1 contrôle | jest | — | L1 |
| `amorce.test.ts › la marque n est ecrite nulle part ailleurs dans src` **(existant, non modifié)** | `porteurs === ['brain/dossier/amorce.ts']` malgré les deux fichiers neufs | jest | KR-223 | L1 (non-régression) |
| `amorce.test.ts › l amorce ne sort pas du baril brain/index.ts` **(existant, non modifié)** | le baril ne contient aucune des trois chaînes | jest | KR-223 | L1 (non-régression) |
| `panneauControles.test.tsx › rend une ligne par controle, pastille et trois etages` | 1 `BLOQUANT` + 3 `ALERTE` ; fragments français **sans glyphe** (`/mot pour mot/`, `/contexte du modele/`) | jest + RTL | — | L2 |
| `panneauControles.test.tsx › dossier calme : texte d amorce, jamais une liste vide` | le texte d'état calme est rendu ; aucun `<li>` | jest + RTL | — | L2 |
| `panneauControles.test.tsx › aucune ligne n est un arret de tabulation` | aucun `role="button"`, aucun `tabindex` dans la liste | jest + RTL | — | L2 |
| `dossierEditorScreen.test.tsx › l entree Controles apparait quand un panneau est injecte` | second landmark `Contrôles` présent ; activation clavier → panneau rendu ; aucun badge de compte sur la ligne | jest + RTL | — | L2 |
| `dossierEditorScreen.test.tsx › rend les 10 ListRow…` **(existant, non modifié)** | `toHaveLength(10)` reste vrai, sans injection de panneau | jest + RTL | KR-117 | L2 (non-régression) |
| `lintIsolation.test.ts` **(existant, non modifié)** | la feature neuve est couverte automatiquement, sa liste étant dérivée du disque : `bascule-editeur` n'importe pas `dossier-controles` et réciproquement — le panneau ne transite que par `App.tsx` | jest (balayage de source) | KR-184 | L2 (non-régression) |

**Cas limites couverts** : prose vide (ne plante pas, ne déclenche pas) · marqueur seul · **marqueur au milieu** · prose rédigée contenant le glyphe par hasard · dossier jamais passé par `construireAmorce` (branche calme du critère 2) · collections vides (hors périmètre : la règle ne lit que quatre champs scalaires).

**Non vérifiable en l'état** — *à recopier dans la revue* :
- La séparation visuelle (`border-top`) : jsdom ne calcule aucun layout ; seule la présence du jeton est vérifiable, jamais le rendu.
- La **totalité** de `controlerDossier` : aucun test ne prouve l'absence d'exception sur tout `Dossier` typé possible — seulement l'échantillon des cas limites ci-dessus.
- Les sondes de source au-delà de la ligne 415 de `dossierEditorScreen.test.tsx`, fichier non lu en entier par le comité.
- L'ordre de tabulation exact entre les dix sections et « Contrôles », et le focus visible.
- `jouable` n'a **aucun consommateur d'écran** en it1 : il est prouvé par L1 seul, jamais par l'interface.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | narratif ↔ tech-lead | Forme du registre : deux entrées (`amorce-ouverture`, `amorce-canon`) contre une entrée avec `niveau`/`section` sur le constat | `RETENU` (composé) — **L1** | Le narratif **retire** ses deux entrées : la spec déclare déjà « objectif sans chemin » (it4) comme **une** règle à deux niveaux — scinder par niveau obligerait à la scinder aussi, soit deux codes pour une cause, KR-164 en sens inverse. Le tech-lead **obtient** `ConstatControle`, et son motif décisif est it4 : « référence orpheline » est une cause qui atteint cinq sections. |
| 2 | QA ↔ tech-lead + narratif | `startsWith` contre `includes` | `RETENU` : **`includes`** — **L1** | `amorce.test.ts` teste le **semeur**, qui maîtrise la tête de sa chaîne ; `controles.ts` lit un texte **édité par l'auteur**, qui ne la maîtrise pas. `startsWith` éteindrait le voyant sur une prose rédigée autour du glyphe — le cas exact que le dispositif existe pour attraper. La QA retire son hedge : c'est le **test** qui tranche, et elle l'écrit. |
| 3 | PM + UX ↔ tech-lead | Cliquer une ligne pour sélectionner sa section | `REPORTÉ` → **it2** | Le tech-lead a **retiré** son « inlivrable » et l'a chiffré à zéro fichier de plus. Mais le render-prop change la **forme** du contrat de prop de `bascule-editeur`, ce qui excède le « diff sans logique métier » qui justifiait au cadrage qu'une autre feature soit touchée — motif du PM, dans son domaine. It2 rouvre déjà ces fichiers pour les badges : la forme de prop y changera dans une itération qui reshape légitimement cette surface. |
| 4 | UX ↔ tech-lead + QA | Où vit l'entrée « Contrôles » | `RETENU` : **second `<nav aria-label="Contrôles">`**, rendu sous injection — **L2** | Sortie hors des deux options : l'UX garde sa 11ᵉ position par Tab (l'ordre de tabulation suit le DOM, pas le landmark), la QA garde son test vert sans modification, et le landmark « Sections du dossier » cesse de mentir — « Contrôles » n'est pas une section. L'UX retire sa prescription de placement. |
| 5 | mesure | Le glyphe recopié en source dans les textes de l'UX | `RETENU` : interpolation obligatoire — **L1 + L2** | La garde d'`amorce.test.ts` balaie **tout `src/`** : ni la feature ni ses tests ne peuvent l'écrire. Conséquence de conception : `ListeControles` reçoit ses contrôles et son test les **fabrique** à messages neutres ; seul `PanneauControles` lit le dossier réel. |
| 6 | UX ↔ narratif | Registre de la phrase QUOI : le manque, ou la destination | `RETENU` : **la composition de l'UX** — **L1** | Manque en ouverture (le repère qu'un auteur cherche), conséquence par destination en fermeture (ce qui distingue les deux niveaux). Domaine UX, et le narratif l'a lui-même formulé ainsi : « l'UX avait raison sur le sujet, j'avais raison sur le prédicat. » |
| 7 | narratif (veto) | `Controle.path` doit être une **clé littérale** de `DESTINATION_DES_CHAMPS` | `RETENU` — **L1** | Veto dans son domaine (référence par identifiant, jamais par nom libre). It1 ne rendant pas la ligne cliquable, `path` et OÙ sont le **seul** chemin de retour vers le champ. Épinglé par un test ; aucun couplage runtime, c'est le test qui importe `./destinations`. |
| 8 | narratif | Contrepartie du retrait n° 1 : `ControleDescripteur.niveaux` | `RETENU` — **L1** | Sans l'ensemble fermé des niveaux émissibles déclaré au registre, « un code par cause » quitte le registre pour la prose d'un `controler()`, et it3/it4 n'ont plus d'ancre. Un champ, un test de balayage. |
| 9 | UX ↔ PM + narratif | Dossier importé dont les proses n'ont jamais porté le marqueur | `REJETÉ` (hors périmètre) | `validate.ts` l. 300 refuse déjà le vide **et** le blanc ; reste la prose non blanche mais creuse, qu'aucune règle littérale ne voit et dont le seul juge serait un modèle. L'honnêteté est portée par l'état calme, dont le mot « connus » ne se retire pas. |
| 10 | tech-lead + narratif + PM | `jouable` rendu à l'écran | `REJETÉ` | Calculé, exporté, testé ; jamais rendu en verdict global à it1. Un rouge sur 100 % des dossiers à t=0 est le miroir du voyant tautologiquement vert refusé sous `SANS_COMPTE`. Premier rendu légitime : `previewDisabledReason` (n° 9). Corollaire refusé d'avance : **aucune exemption « dossier jamais édité »** — le seul discriminant serait `updatedAt === createdAt`, faux dès la première édition sans rapport. |
| 11 | PM | Portée des critères : les douze de la spec, ou ceux de l'itération | `RETENU` — **§ 6** | Les huit du § 6 sont ceux d'it1 ; les douze de `plan.acceptance_criteria` sont ceux de la feature. La substitution est écrite en clair. |
| 12 | UX ↔ tech-lead (veto V3) | Le focus qui suit sur la ligne de nav après activation | `REPORTÉ` → **it2, avec le désaccord 3** | Exigerait un `ref` sur `ListRow`, primitive `brain/` à un seul appelant — refus déjà écrit dans son propre JSDoc (l. 26-32, précédent `onReorder`, KR-109). L'UX a retiré sa version A et recommande la version B. |
| 13 | tech-lead (vetos V1, V2) | `parSection` en `Partial` · un lot touchant `IssueList.tsx` | `RETENU` (les deux vetos tiennent) | Personne ne les conteste ; inscrits au § 4 et au § 5 comme interdictions de lot. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto ne tient après le tour 2 : pas d'escalade.)*

## 9 — Innovation

*Aucune.* Le comité n'a produit aucune proposition hors-cadre à cette itération.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **sans objet** : l'itération ne touche ni `challenge`, ni `combat`, ni `xp`, ni `characteristics`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants — nommément `amorce.test.ts` (deux gardes) et `dossierEditorScreen.test.tsx › rend les 10 ListRow…`, tous **sans modification de leur code**
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-controles-it1.revue.md`, avec la rubrique « non vérifiable en l'état » du § 7 recopiée telle quelle
- [ ] **Budget de contexte relevé** : `code-knowledge.json` était à trois octets de son plafond au cadrage — la compaction est due **dans le lot de doc de cette itération**, pas au suivant

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | oui — critères d'itération fixés au § 6, clic reporté au § 8 n° 3 |
| Tech Lead | recevable sous réserve | oui — trois vetos inscrits (§ 4 `parSection` total, § 5 `IssueList.tsx` et `ListRow.tsx` intouchés) |
| UX | recevable | oui — `amorce.ts` lu, textes définitifs au § 3 |
| QA | recevable | oui — les deux tests conditionnels sont au § 7, lot L1 |
| Narratif & IA | recevable sous réserve | oui — `niveaux` déclarés (§ 4), `includes` (§ 8 n° 2), `path` = clés littérales (§ 7, veto) |
