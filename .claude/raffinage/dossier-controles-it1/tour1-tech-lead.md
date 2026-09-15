# Tour 1 — `tech-lead`

**VERDICT** : recevable sous réserve (objections 1, 2, 3 tenues ; veto si `parSection` devient `Partial`, ou si un lot touche `IssueList.tsx`).

**RISQUE** — la signature figée par la spec est **circulaire et se contredit** : `ControleDescripteur.controler(): Controle[]` avec `Controle.id: ControleId = keyof typeof CONTROLES` — `tsc` refuse, le type de `CONTROLES` dépendant de son initialiseur. `remediation(controle: Controle)` referme la même boucle.

**OBJECTION 1 (dure)** — `niveau` et `section` **ne peuvent pas vivre sur le descripteur**. La règle n° 1 produit un BLOQUANT sur `charpente.depart.texte_ouverture_joueur` (section `depart`) *et* trois ALERTES sur le canon (section `canon`) : un seul couple par règle est faux dès la première règle. KR-219 exige que la règle *déclare* sa section — la déclaration se fait dans le **constat**.

**OBJECTION 2** — « une ligne du panneau sélectionne SA section » est **inlivrable** : `panneaux` est un `ReactNode` déjà construit, il ne peut recevoir aucun rappel, et la destination est un `useState` privé de `DossierEditorScreen`. À REPORTER explicitement, sinon `dev-lot` câblera un clic impossible.

**OBJECTION 3** — **L2 et L3 ne peuvent pas partir en parallèle** : `App.tsx` importe `PanneauControles`, donc le lot d'adoption ne compile pas avant le lot feature. Trois lots = trois vagues sérielles, zéro gain, une fusion de plus.

**PROPOSITION** — **2 lots**, L1 `contrat` puis L2. `ConstatControle` porte `niveau` + `section` ; `Controle extends ConstatControle` ajoute `id` ; `remediation(constat)` — circularité brisée. Onzième destination : **pas d'union dans `brain/`** ; `DESTINATION_CONTROLES` + `DestinationNav` **locaux** à `bascule-editeur`, prop sœur `panneauControles?: ReactNode`, entrée de nav rendue **seulement si** le panneau est injecté (`avecControles`).

## Découpage — 2 lots séquentiels

| LOT | TYPE | FICHIERS |
|---|---|---|
| **L1** | **contrat**, seul et en premier | (N) `src/brain/dossier/controles.ts` · (N) `src/brain/dossier/controles.test.ts` · (R) `src/brain/index.ts` |
| **L2** | feature + adoption | (N) `src/features/dossier-controles/index.ts` · (N) `components/PanneauControles.tsx` · (N) `components/ListeControles.tsx` · (N) `tests/panneauControles.test.tsx` · (R) `src/features/bascule-editeur/components/DossierEditorScreen.tsx` · (R) `SectionNav.tsx` · (R) `tests/dossierEditorScreen.test.tsx` · (R) `src/App.tsx` |

Listes disjointes vérifiées. Le baril appartient à L1 seul.

**Pourquoi pas trois lots** : `App.tsx` importe `PanneauControles` (KR-184 impose l'injection depuis la racine), donc un lot d'adoption séparé ne passe pas `tsc` avant la fusion du lot feature. La `resolved_decision` de cadrage (« un lot unique possédant ces fichiers en exclusivité ») décrit déjà exactement L2.

## Signature figée

`NiveauControle = 'bloquant' | 'alerte' | 'info'` · `ConstatControle { niveau, section, message, location, entityId?, path }` · `Controle extends ConstatControle { id: ControleId }` · `ControleDescripteur { libelle, controler(dossier): ConstatControle[], remediation(constat): string }` · `CONTROLES` armé par la factory `defineRegistre` de `identifiers.ts` (celle qui arme déjà `PREDICATES`/`DELTAS`) · `ControleId = keyof typeof CONTROLES` · `RapportControles { controles: readonly Controle[], jouable, parSection: Record<SectionId, NiveauControle | null> }`.

Sortent au baril : `NiveauControle`, `Controle`, `ControleId`, `RapportControles`, `controlerDossier`, `controleRemediation`. Restent dans `brain/dossier/` : `CONTROLES`, `ControleDescripteur`, `ConstatControle`, la table de gravité.

**`parSection` doit rester TOTAL** : un `Partial` obligerait chaque appelant à écrire `?? null` (deux silences indistinguables, classe KR-199) et une onzième section n'échouerait plus à la compilation. → veto si `Partial`.

## `controles.ts` × `amorce.ts`

- L'import est le bon geste (même répertoire, KR-223 le prévoit, les deux gardes restent vertes).
- **`includes`, pas `startsWith`** : le marqueur est un glyphe qu'on ne tape pas au clavier, sa présence *où que ce soit* prouve un texte semé non remplacé ; `startsWith` laisserait passer le cas exact que le dispositif existe pour empêcher — un marqueur resté au milieu d'une ouverture lue au joueur mot pour mot. → **contredit par la QA**.
- **Une table, pas quatre `if`**, privée à `controles.ts` : `Record<keyof typeof AMORCE, { niveau, section, path, location, lire(d) }>`. Le `Record` total est la garde anti-dérive **par compilation** — une cinquième prose semée casse `tsc` ici, sans test. Elle ne peut pas vivre dans `amorce.ts` : `niveau` et `section` sont du vocabulaire de linter, `amorce.ts` est un semeur.

## Encapsulation

L2-adoption ne sait du panneau que `ReactNode` ; le panneau ne sait rien de la nav (pas de `querySelector`, précédent BUG-078) ; `ListeControles` est un calque local — réutiliser `IssueList` obligerait à forger un `DossierIssue` avec un `code` absent de son union de vingt, un mensonge de type ; le panneau n'affiche jamais la prose fautive (sinon ses tests porteraient le glyphe) ; l'ordre du rapport est rendu tel quel.

## Ce qui rougit — le piège

`amorce.test.ts › l amorce ne sort pas du baril` asserte l'absence de trois chaînes dans `brain/index.ts`, **y compris en commentaire**. Écrire « `controles.ts` importe `MARQUEUR_A_ECRIRE` mais ne le ré-exporte pas » dans le baril **ferait rougir le test**. Interdiction absolue : ces trois chaînes n'apparaissent nulle part dans `brain/index.ts`, pas même en prose. Le motif du non-export s'écrit dans `controles.ts`.

`dossierEditorScreen.test.tsx › rend les 10 ListRow` reste **vert sans modification** grâce à `avecControles` : un écran sans panneau injecté n'offre pas de destination morte. Si la 11ᵉ entrée est rendue inconditionnellement, c'est un défaut de conception, pas une adoption.

## À inscrire au plan

1. **REPORTÉ** — cliquer une ligne pour sélectionner sa section (motif technique neuf, à ajouter aux questions ouvertes). It1 : lignes non cliquables.
2. `'info'` sans producteur avant it3 : le `Record<NiveauControle, string>` côté feature reste exhaustif par compilation.
3. `jouable` sans consommateur d'écran en it1 : prouvé par L1 seul, la revue doit l'écrire.
4. L'`aria-label` de la nav reste `Sections du dossier` — le renommer ferait rougir toutes les requêtes existantes pour un gain nul.
5. Budget : `code-knowledge.json` à trois octets de son plafond, compaction due dans le lot de doc de cette itération.
