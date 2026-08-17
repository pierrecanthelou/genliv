# Plan d'itération — `dossier-registres` · itération `1`

> Statut : `validé` (2026-08-17)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-17
> Composition : `4 rôles` — motif : décision actée au cadrage de la feature (`docs/ROADMAP-BASCULE-IA.md` §2 l.150/220) : cette feature est schéma + écrans, aucune nouvelle frontière prompt/moteur/mémoire de session.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut tenir le registre des indices de son aventure. » |
| **Tranche** | `PanneauIndices`/`FicheIndice` (écran) → `DossierService.update()` (`brain/dossier`) → persistance existante, réutilisée sans changement |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | `portee` (reste au type, non rendu) · retrait d'un indice · graphe visuel (`tree-canvas`) · `lieux[].acces` |
| **Reporté** | `portee` → quand un consommateur réel existe (n°7 ou autre) · retrait d'indice → open_question niveau feature, aucune itération ne le porte aujourd'hui |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut tenir le registre des indices de son aventure — une vérité pour le MJ, une formulation lue par le joueur, et les indices vers lesquels chacun mène.

## 2 — Hors périmètre

- **`Indice.portee`** : reste posé au type (contrat déjà validé au cadrage, `PorteeIndice`/`PORTEES_INDICE`) mais N'EST PAS rendu dans `FicheIndice.tsx` — aucun consommateur réel cette itération, même forme que `tier` (KR-192) et `lie_au_canon` (KR-206), déjà écartés deux fois dans cette même feature. Revient en un seul bloc (type + registre + destination + écran) quand un consommateur concret existe (candidat : n°7 `dossier-controles`, règle de lint « Intrigue en second plan »).
- **Retrait d'un indice** (suppression) : hors périmètre. L'ajouterait exigerait une confirmation modale (CLAUDE.md § Dangerous Actions) et un lot supplémentaire. Aucune itération planifiée de cette feature ne le porte aujourd'hui — signalé en `open_questions` de la feature, pas silencieusement laissé de côté.
- **Graphe visuel des indices** (repointage `tree-canvas`) : hors périmètre total de la feature (KR-204, cadrage).
- **`lieux[].acces`** : hors périmètre (KR-205, cadrage).
- **Extension de la grammaire `DELTAS`** (opérande entier) : sans objet ici, `Indice` ne porte aucun `Delta[]`.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Composants réutilisés tels quels : `Field`, `ListRow`, `Card`, `Select`, `IconButton`, `IssueList`. Aucun composant neuf.

**Colonne liste** : eyebrow `INDICES`. `ListRow` : `title={localiserEntite('indice', indice, index)}`, `subtitle={indice.id}`. Réordonnancement composé par 2 `IconButton` (▲/▼), frères de `ListRow` dans le `<li>` qui les entoure — jamais une prop sur `ListRow.tsx` (précédent `dossier-objets`). Bouton bas : `+ Ajouter un indice…`.

**État vide (liste)** : glyphe `❏` (continuité `PanneauSection.tsx`, section indices déjà à `❏`) + texte `Aucun indice — cliquez « + Ajouter un indice… » pour commencer.`

**Fiche, dans l'ordre** :
1. `Field label="NOM DE L'INDICE" hint="interne" placeholder="Le sceau brisé"`.
2. `Field label="VÉRITÉ" hint="MJ — jamais vue du joueur" multiline rows={3} placeholder="Le sceau a été brisé par le gardien lui-même, vingt ans plus tôt."`
3. `Field label="FORMULATION JOUEUR" hint="lue par le joueur" multiline rows={3} placeholder="Une odeur de cendre froide, là où elle ne devrait pas être."`
4. Section « MÈNE À » — légende : `Les indices que celui-ci débloque une fois obtenu — le moteur les lira dans cet ordre.`
   - Chaque **ligne existante** : `Select label="INDICE CIBLE" options={avecOrpheline(optionsTousIndices, valeur, 'indice')}` (liste COMPLÈTE, self comprise — sinon une auto-référence déjà persistée s'affiche « introuvable » alors qu'elle résout) + `IconButton label="Retirer le lien vers « X »" tone="danger"` (✕).
   - **Ligne d'ajout** : `Select ariaLabel="Ajouter un lien vers un autre indice" options=[{value:'', label:'+ Ajouter un indice vers lequel celui-ci mène…'}, ...optionsTousIndices.filter(o => o.value !== indice.id)]` — l'indice édité est EXCLU de cette liste (self-exclusion, motif `apres_indice_id`/`BlocSavoirs.tsx:435-450`).
   - État vide de section (aucun autre indice dans le registre) : `Aucun autre indice à relier — créez-en un second dans ce registre.`
5. **Aucun bouton de retrait de fiche** cette itération (retrait hors périmètre, §2 — précédent : `dossier-objets` it1 n'en avait pas non plus).

**Refus** (si une écriture échoue) : bandeau `role="status"`, eyebrow `CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ`, `IssueList` — motif `FicheObjet`.

**Clavier** : Tab suit l'ordre visuel ci-dessus ; `Entrée` dans un `Field` mono-ligne blur-committe (sans effet sur les `Field` multiline).

*(Écrit par l'UX, corrigé au tour 2 par l'arbitrage tech-lead sur `mene_a`.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Indice extends Entite` | type | fournit | `{ portee?: PorteeIndice; verite?: string; formulation_joueur?: string; mene_a?: string[] }` — `portee` reste sur le type (contrat déjà validé au cadrage) mais N'A AUCUN CHAMP DE FORMULAIRE dans `FicheIndice.tsx` cette itération (§2, §8-2) |
| `REFERENCES_SIMPLES` | registre | fournit | `+= { path: 'monde.indices[].mene_a[]', espace: 'indice', location: 'Indices' }` |
| `LISTES_OPTIONNELLES_TEXTUELLES` (NOUVEAU) | registre | fournit | `[{ path: 'monde.indices[].mene_a', location: 'Indices' }, { path: 'monde.personnages[].caractere.parler', location: 'Personnages' }]` |
| `avecOrpheline` (NOUVEAU, `brain/utils/references.ts`) | fonction | fournit | `(options: SelectOption<string>[], valeur: string, espace: EspaceDeNoms) => SelectOption<string>[]` — promue depuis `dossier-fiches/components/BlocSavoirs.tsx` (KR-110, 2 appelants réels) |
| `DossierService.update(id, recette): EcritureDossier` | service | consomme | inchangé |
| `dossier:updated` | événement | émet | `{ dossierId: string }` |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `indices-contrat` — `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : donner sa forme à `Indice` (verite, formulation_joueur, mene_a), fermer trois trous de validation sur les listes de références (première liste de références du schéma), promouvoir `avecOrpheline()`.
- **Fichiers** :
  - R `src/brain/dossier/types.ts`
  - R `src/brain/dossier/tables.ts`
  - R `src/brain/dossier/validate.ts`
  - R `src/brain/dossier/identifiers.ts`
  - R `src/brain/dossier/destinations.ts`
  - R `src/brain/dossier/issues.ts`
  - R `src/brain/dossier/__fixtures__/dossier-reference.json`
  - R `src/brain/dossier/__fixtures__/dossier-minimal.json`
  - R `src/brain/dossier/couverture.test.ts`
  - R `src/brain/dossier/validate.test.ts`
  - R `src/brain/dossier/identifiers.test.ts`
  - N `src/brain/utils/references.ts`
  - N `src/brain/utils/references.test.ts`
  - R `src/brain/index.ts`
  - R `src/features/dossier-fiches/components/BlocSavoirs.tsx` (extraction seule : importe `avecOrpheline` depuis `brain/utils/references.ts` au lieu de la définir localement — zéro changement de comportement, couvert par `savoirs.test.tsx` existant)
- **Expose/consomme** : voir §4.
- **Correctifs de validation portés par ce lot** :
  - `validate.ts:386` — `if (site.valeur === undefined) continue`, puis toute non-chaîne ⇒ anomalie `identifiant-invalide`. La chaîne vide reste calme (c'est ce qu'écrit un `Select` « aucun » sur `objectif_id`). Deux tests de non-régression nommés sur `objectif_id` et `apres_indice_id` (même trou préexistant).
  - `identifiers.ts:211` — `feuille.replace(/\[\d*\]$/, '')` (le `*` remplace le `+` pour matcher `[]` littéral). Test dédié : `'monde.indices[].mene_a[]' → 'mene_a'`.
  - 3e trou (`mene_a` non-tableau plante `sitesDe`) — **Option A retenue** : table `LISTES_OPTIONNELLES_TEXTUELLES` + boucle calquée sur `validate.ts` §6 quater, un seul code neuf (`liste-non-textuelle`), couvre `mene_a` ET `caractere.parler` par la même cause (précédent explicite du fichier, KR-164) — zéro fichier de `dossier-fiches` touché par cette table.
- **Deux bornes pour `dev-contrat`, à ne pas redécouvrir en revue** :
  1. La fixture (`dossier-reference.json`) doit porter un `mene_a` **NON VIDE** — une liste vide est une feuille pour le balayage, la clé `monde.indices[].mene_a[]` ne serait jamais exercée (précédent inverse : `climat[].effets_regles`).
  2. `Monde.indices: Entite[] → Indice[]` ne casse aucun appelant existant (`Indice extends Entite`, assignable) — vérifié à la lecture par le tech-lead sur les 3 lecteurs de features (`BlocSavoirs`, `FichePersonnage`, `PanneauPersonnages`), pas supposé.
- **Critères couverts** : #7, #8.

### Lot 2 — `indices-ecran`
- **Ouvrier** : `dev-lot`
- **But** : panneau + fiche des indices, câblés à `App.tsx`, remplaçant l'état vide de la section Indices.
- **Fichiers** :
  - N `src/features/dossier-registres/index.ts`
  - N `src/features/dossier-registres/components/PanneauIndices.tsx`
  - N `src/features/dossier-registres/components/FicheIndice.tsx`
  - N `src/features/dossier-registres/components/styles.ts`
  - N `src/features/dossier-registres/tests/panneauIndices.test.tsx`
  - R `src/App.tsx` (une entrée `indices` dans la prop `panneaux`, KR-184 — `DossierEditorScreen` déclare déjà `panneaux?: Partial<Record<SectionId, ReactNode>>`, `SECTIONS` porte déjà `id: 'indices'`)
- **Expose/consomme** : consomme uniquement `type Indice`, `avecOrpheline`, `localiserEntite`, `frapperIdentifiant('indice')`, `DossierService.update`, `{Field, Card, ListRow, IconButton, Select, IssueList}`. Démarre une fois le lot 1 figé, le lit comme donnée immuable.
- **Vérifié à la lecture** : aucun fichier de `bascule-editeur`, `dossier-canon` ou `tree-canvas` n'entre dans ce lot — KR-184/204/205 tenus par construction.
- **Critères couverts** : #1 à #6.

*(2 lots, exécution séquentielle — pas d'essaim parallèle, le lot 2 dépend du contrat figé par le lot 1.)*

## 6 — Critères d'acceptation

1. **Étant donné** la section Indices vide, **quand** l'auteur clique « + Ajouter un indice… », **alors** un indice est créé (`frapperIdentifiant('indice')`), apparaît dans la liste (`ListRow`, repli « Indice n°N (sans nom) »), et remplace l'état vide de la section — *niveau : composant* — *lot 2*
2. **Étant donné** un indice sélectionné, **quand** l'auteur écrit son nom, sa vérité et sa formulation joueur, **alors** `DossierService.update()` persiste les trois champs et la fiche les reflète au montage SANS AUCUNE INTERACTION (non-régression lecture-au-montage, précédent BUG-064) — *niveau : composant* — *lot 2*
3. **Étant donné** au moins deux indices dans le registre, **quand** l'auteur active Monter ou Descendre sur une ligne (clic ou clavier), **alors** l'ordre de `monde.indices` est persisté et reflété au rendu suivant ; le bouton est OMIS (jamais `disabled`) aux bornes de la liste — *niveau : composant* — *lot 2*
4. **Étant donné** deux indices A et B existants, **quand** l'auteur ajoute B à `mene_a[]` de A via le Select de la ligne d'ajout, **alors** A affiche B en liste textuelle d'identifiants (jamais un canevas, KR-204), et A N'APPARAÎT PAS dans les options de sa propre ligne d'ajout (auto-exclusion) — *niveau : composant* — *lot 2*
5. **Étant donné** un indice A dont `mene_a[]` contient l'id d'un indice B existant et l'id d'un indice C inexistant, **quand** la fiche de A se rend, **alors** B s'affiche sans marque et C s'affiche marqué orphelin — LES DEUX PROUVÉS DANS LE MÊME TEST (discriminance KR-197/199/202) — *niveau : composant* — *lot 2*
6. **Étant donné** un indice dont `mene_a[]` contient SA PROPRE référence (auto-référence déjà persistée, ex. import), **quand** sa fiche se rend, **alors** cette référence s'affiche RÉSOLUE (pas orpheline) même si elle n'apparaît plus dans les options de la ligne d'ajout — *niveau : composant* — *lot 2*
7. **Étant donné** un `mene_a` corrompu (valeur non-tableau, ex. une chaîne), **quand** `validateDossier` s'exécute, **alors** une anomalie typée (`liste-non-textuelle`) est renvoyée — jamais un throw qui casse le panneau — *niveau : contrat* — *lot 1*
8. **Étant donné** le dossier de référence, **quand** le lot 1 est livré, **alors** les indices déjà persistés (et les `savoirs[].indice_id`/`apres_indice_id` qui les référencent) restent acceptés par `validateDossier` sans régression de leurs champs hors du lot — *niveau : contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `validate.test.ts` « mene_a orphelin isolé au bon rang » | un id C inexistant dans `mene_a[]` est signalé, B valide ne l'est pas, dans le même test | contrat | KR-197/199/202 | 1 |
| `validate.test.ts` « mene_a message nomme le champ pas l'indice » | `feuilleDe('monde.indices[].mene_a[]')` → `'mene_a'`, pas `'mene_a[]'` | contrat | — | 1 |
| `validate.test.ts` « mene_a non-tableau ne plante pas » | `mene_a: "x"` → anomalie `liste-non-textuelle`, pas de throw | contrat | — | 1 |
| `validate.test.ts` « objectif_id/apres_indice_id valeur non-string reste calme » (régression) | le correctif du trou n°1 ne casse pas les deux champs existants qui partagent la cause racine | contrat | — | 1 |
| `couverture.test.ts` extension | `Indice.verite`/`formulation_joueur`/`mene_a` couverts par le balayage de corruption générique | contrat | — | 1 |
| `references.test.ts` « avecOrpheline » | comportement inchangé après promotion (reprise du test existant de `BlocSavoirs`) | unitaire | KR-110 | 1 |
| `panneauIndices.test.tsx` « lecture au montage » | 3 champs affichés sans interaction, sur 2 indices distincts | composant | BUG-064 | 2 |
| `panneauIndices.test.tsx` « reorder clic + clavier » | 2 tests distincts (clic, Tab+Entrée), la fiche affichée reste celle du même id après permutation | composant | — | 2 |
| `panneauIndices.test.tsx` « mene_a self-exclusion à l'ajout » | l'indice édité est absent des options de la ligne d'ajout | composant | — | 2 |
| `panneauIndices.test.tsx` « mene_a auto-référence déjà persistée se résout » | rendu résolu, pas orphelin, même si absent des options d'ajout | composant | — | 2 |
| `panneauIndices.test.tsx` « mene_a discriminance orphelin/valide » | B résolu, C orphelin, dans le même test | composant | KR-197/199/202 | 2 |
| `panneauIndices.test.tsx` « isolation des 9 autres sections » | test-grep de non-régression, les 9 autres sections affichent toujours leur état vide honnête, intact | composant | KR-187 | 2 |

Cas limites à couvrir : vide (0 indice) · très long (`formulation_joueur` sans borne, même famille que `Objet.description_joueur`) · doublon (deux indices se référençant mutuellement dans `mene_a`) · référence orpheline · auto-référence.

**Non vérifiable en l'état** — aucun. Le graphe visuel est explicitement hors périmètre (§2), pas seulement non testé.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | Tech Lead | `avecOrpheline()` recopiée dans la feature (assumé par UX tour 1) vs promue `brain/utils/` | `RETENU` | promotion vers `brain/utils/references.ts`, 2 appelants réels dès ce lot (KR-110) |
| 2 | PM+UX(tour1)/Tech Lead(tour2) | `Indice.portee` rendu (Select) cette itération, ou déféré | `RETENU` report — exclu du rendu, reste au type | veto PM (valeur nulle sans lecteur observable cette itération), confirmé par la convergence UX+QA au tour 2 ; l'argument tech-lead tour 2 (`destination: 'auteur'` suffirait, précédent `titre`/`but.echeance`) est écarté par l'orchestrateur : ces précédents sont de la PROSE librement lisible par un humain, `portee` est une ÉNUMÉRATION FERMÉE dont la seule valeur est instrumentale (un futur lint) — plus proche de `tier` que de `but.echeance`. Revient en bloc avec son consommateur. |
| 3 | UX(tour1) vs QA(tour1) | auto-référence dans `mene_a` : exclure des options (UX) vs tolérer sans garde (QA) | `RETENU` les deux, précisés | ligne d'ajout exclut l'indice édité (UX) ; SSOT + lignes existantes tolèrent/résolvent une auto-référence déjà persistée sans la marquer orpheline (QA, précédent `BlocSavoirs.tsx:435-450` ; mécanisme exact — deux listes d'options distinctes — précisé par tech-lead tour 2 pour éviter un faux orphelin) |
| 4 | Tech Lead | 3e trou de validation (`mene_a` non-tableau) : Option A (table générique) vs Option B (accepter, KR daté) | `RETENU` Option A | ~15 lignes, couvre `mene_a` ET `caractere.parler` par la même cause (précédent §6 quater de `validate.ts`, KR-164), zéro fichier de feature touché |
| 5 | QA | le critère #2 de `plan.acceptance_criteria` (niveau FEATURE, `specification.json`) mélange deux sens de référence différents (mene_a authored vs savoirs référencé) | `RETENU`, corrigé | reformulé en critères §6.4/§6.5/§6.6/§6.8 de ce plan, distincts ; correction à reporter dans `specification.json` de la feature (défaut trouvé dans un artefact déjà écrit par l'orchestrateur) |
| 6 | Tech Lead | retrait (suppression) d'un indice : dans it1, ou hors périmètre | `RETENU` hors périmètre | Dangerous Actions (Modal) ajouterait un lot ; aucune itération planifiée de la feature ne le porte — signalé en `open_question` niveau feature, pas silencieusement omis |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

Aucune proposition hors-cadre cette itération.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — non applicable (cette itération ne touche aucun de `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`dossier-fiches`, notamment `savoirs.test.tsx` après l'extraction d'`avecOrpheline`)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-registres-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — `portee` exclu du rendu (§2, §8-2) |
| Tech Lead | recevable sous réserve | oui — retrait hors périmètre acté, manifeste corrigé (§5, §8-6) |
| UX | recevable sous réserve | oui — alignée sur `portee` et `mene_a` (§3, §8-2, §8-3) |
| QA | recevable sous réserve | oui — 3 tests nommés + critère reformulé actés (§6, §7, §8-5) |
