# Plan d'itération — `dossier-canon` · itération `2`

> Statut : `validé` (2026-08-10)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-10
> Composition : `4 rôles` — motif : formulaire d'édition sur un schéma déjà défini (`Charpente.depart` existe depuis `dossier-format`), aucun contact avec les prompts, le moteur, la mémoire de session ou le mode jeu — `narratif-ia` n'est pas convoqué, même motif qu'à l'it1 (dossier-canon, n° 3, n'est pas dans la liste n° 1/4/7/8 + Temps 2 de `docs/ROADMAP-BASCULE-IA.md` § 4).
> Exécution : `séquentielle` (**1 lot**, marqué `contrat`, exécuté par `dev-contrat` — pas d'essaim parallèle)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur fixe le point de départ de son aventure — lieu de départ, texte d'ouverture — dans un formulaire qui remplace l'état vide de la section Départ. » |
| **Tranche** | `PanneauDepart` (Select sans brouillon, Field avec brouillon+blur) → `DossierEditorScreen` (slot `panneaux`, déjà existant depuis it1) → `DossierService.update()` (même chemin d'écriture qu'it1) → `PersistenceService`/`CloudSyncService` |
| **Lots** | 1 lot · `contrat` : oui (seul lot, il touche `brain/index.ts`) |
| **Hors périmètre** | création/suppression de lieu depuis ce panneau · généralisation du composant `Select` (`Select.tsx` intouché) · type `Lieu` enrichi (it4) · tout `…_expr` · `TargetPicker` générique · compteur de mots / bandeau d'avertissement sur Départ (aucun budget) · modification de `PanneauSection.tsx`/`PANNEAU_PAR_SECTION` |
| **Reporté** | rien de nouveau — `Field.maxLength`/`showCounter` reste ouvert depuis it1 (toujours aucun 2ᵉ appelant réel) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur ouvre un dossier, sélectionne la section Départ et y trouve un vrai formulaire (et non plus l'état vide générique) : un `Select` qui liste les lieux existants (libellés par `localiserEntite()`, y compris le repli « Lieu n°N (sans nom) ») et commit **immédiatement** au changement — sans brouillon local, une référence à une entité n'a pas de mi-chemin éditable — et un champ de texte d'ouverture, brouillon local classique, committé au blur. Départ est le **premier consommateur réel** de `Select` (`brain/components/Select.tsx`), déjà générique sur `{value,label}` depuis toujours mais sans appelant : cette itération ne le « généralise » pas, elle l'utilise pour la première fois. Tant que la feature Lieux (it4) n'est pas livrée, un dossier réel n'a qu'un seul lieu (`lieu.amorce`) ; le Select le montre normalement (jamais grisé ni en erreur) accompagné d'une légende qui nomme l'attente.

## 2 — Hors périmètre

- Création ou suppression d'un lieu depuis `PanneauDepart` — réservé à la feature Lieux (it4). Testé par absence (§7, test 8).
- Généralisation du composant `Select` (`brain/components/Select.tsx`) — il reste inchangé à l'octet près ; `PanneauDepart` en est le premier consommateur, pas le déclencheur d'une extension.
- Le type `Lieu` enrichi (description, ambiance, dangers) — it4, lot contrat séparé (KR-186).
- Tout `…_expr`, `TargetPicker` générique — aucun appelant dans cette itération.
- Compteur de mots ou bandeau d'avertissement sur la section Départ — aucun budget ne porte `charpente.depart.lieu_id` ni `charpente.depart.texte_ouverture_joueur` dans `BUDGETS_DE_MOTS` (`tables.ts`), vérifié par lecture directe : aucun chemin d'avertissement n'existe structurellement pour ce panneau.
- `PanneauSection.tsx` / `PANNEAU_PAR_SECTION` (bascule-editeur) — la table à 10 entrées reste intacte, le slot d'injection d'it1 suffit.
- Un test dédié `identifiers.test.ts` pour la joignabilité du barrel — le repli de `localiserEntite()` est déjà épinglé par `validate.test.ts:146` ; sa résolution de module est prouvée par `tsc` (gate de commit) au moment où `PanneauDepart` l'importe, et son comportement réel par le test du libellé rendu (§7, test 2). Voir §8, désaccord 6.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Patron repris à l'identique de `PanneauCanon.tsx` (it1) pour le layout : `pageStyle` (`padding: var(--space-8)`, `flex:1`, `overflowY:auto`) → `Card` → `champsStyle` (`display:flex; flex-direction:column; gap:var(--space-6)`).

**Champ 1 — Select « lieu de départ »**
- Composant `Select` (`brain/components/Select.tsx`), aucune extension.
- `label` = `"LIEU DE DÉPART"`. Pas de `hint` (référence technique, hors registre de prose).
- `options` = `dossier.monde.lieux.map((lieu, i) => ({ value: lieu.id, label: localiserEntite('lieu', lieu, i) }))`, dans l'ordre du tableau — **jamais retrié** (un tri désynchroniserait l'index du repli de `localiserEntite`).
- `value` = `dossier.charpente.depart.lieu_id` lu **directement depuis le dossier ouvert**, jamais un brouillon local.
- Commit : `onChange` appelle `dossiers.update()` **immédiatement** (pas de blur sur `Select`).
- États : défaut / survol / sélectionné, comme partout ailleurs. **Jamais d'état erreur** (structurellement infaillible : le Select n'offre que des `lieu.id` déjà existants, donc toujours une référence valide) ni d'état « disabled » visuel, même à une seule option — il reste pleinement opérable.
- **Cas à une seule option** (`options.length === 1`) : légende sous le Select, texte exact :
  `« Seul lieu existant — Lieux (à venir) permettra d'en ajouter d'autres. »`
  Style : `font-family: var(--font-mono); font-size: var(--fs-meta); color: var(--text-faint); margin-top: var(--space-2)`. Disparaît dès que `monde.lieux.length > 1`.
- Clavier : natif (`<select>`) — Tab atteint le contrôle, flèches/Entrée/Espace l'opèrent, Échap ferme sans changer la valeur.

**Champ 2 — texte d'ouverture**
- `Field` multiline, `label="TEXTE D'OUVERTURE"`, `hint="lue par le joueur, mot pour mot"`, `rows={5}`.
- `placeholder` (repris tel quel de `dossier-minimal.json`, `charpente.depart.texte_ouverture_joueur`) :
  `"Vous poussez la porte de l'auberge du Fanal ; la salle se tait."`
- Brouillon local, seedé une fois (`useState(() => ...)`), commit au blur — même idiome que `PanneauCanon`.
- **Aucun compteur de mots** — `charpente.depart.texte_ouverture_joueur` n'est pas dans `BUDGETS_DE_MOTS`.

**Refus** (uniquement possible sur `texte_ouverture_joueur`, jamais sur `lieu_id`) : même composant, même microcopie que it1 — `role="status"`, eyebrow `"CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"` (`var(--bad)`), `IssueList`, brouillon jamais réinitialisé.

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `localiserEntite` | fonction | émet *(nouvellement exporté du baril, jusqu'ici privé à `dossier/identifiers.ts`)* | `localiserEntite(espace: EspaceDeNoms, entite: unknown, index: number): string` — repli `` `${label} n°${index+1} (sans nom)` `` |
| `DossierService.update()` | service | consomme *(inchangé depuis it1)* | `update(id: string, recette: (dossier: Dossier) => CorpsDossier): EcritureDossier` |
| `brain/components/{Select, Field, Card, IssueList}` | composant | consomme *(inchangés)* | — |

## 5 — Lots

> Un lot `contrat` s'exécute seul, en premier. Ici : un seul lot, qui EST le lot contrat — pas de second lot feature à faire attendre.

### Lot 1 — `panneau-depart` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé — le lot touche `brain/index.ts`)
- **But** : exporter `localiserEntite()` du baril `brain/` puis construire `PanneauDepart`, le câbler sur le slot `depart` de `DossierEditorScreen` depuis `App.tsx`, et réécrire la seule assertion de `bascule-editeur` concernée par ce panneau (KR-187).
- **Ordre interne, contraignant** : la ligne d'export de `brain/index.ts` s'écrit et compile (`tsc` vert) *avant* que `PanneauDepart.tsx` ne l'utilise — même geste que le lot 1 d'it1, réduit ici à une ligne parce que la mesure ne demande rien de plus (aucun champ de schéma ajouté, contrairement à it3/it4 — KR-186 ne s'applique pas).
- **Fichiers** :
  - `src/brain/index.ts` (R) — ajoute `localiserEntite` à la ligne d'export de `./dossier/identifiers`
  - `src/features/dossier-canon/components/PanneauDepart.tsx` (N)
  - `src/features/dossier-canon/tests/panneauDepart.test.tsx` (N)
  - `src/features/dossier-canon/index.ts` (R) — exporte `PanneauDepart`
  - `src/App.tsx` (R) — câble `panneaux={{ canon: <PanneauCanon .../>, depart: <PanneauDepart dossierId={route.dossierId} /> }}`
  - `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (R) — **uniquement** : `SondePanneauDepart` locale (KR-184, jamais le vrai composant), la branche `index === 1` du describe paramétré « sélection d'une section : état vide au mot près », et l'assertion-grep du câblage `App.tsx` (gagne `depart:`)
- **Intouchés à l'octet près** : `src/brain/components/Select.tsx`, `src/brain/dossier/identifiers.ts` (le corps de la fonction ne change pas, seul son export au baril), `src/brain/dossier/tables.ts`, `src/brain/DossierService.ts`, `src/features/bascule-editeur/components/DossierEditorScreen.tsx` (le slot accepte déjà `depart`, aucune extension requise), `src/features/bascule-editeur/components/PanneauSection.tsx`.
- **Expose** : `export interface PanneauDepartProps { dossierId: string }` / `export function PanneauDepart({ dossierId }: PanneauDepartProps): JSX.Element | null` (même forme que `PanneauCanon` : `null` si dossier absent).
- **Consomme** (contrat figé) : `localiserEntite`, `Select`, `Field`, `Card`, `IssueList`, `useOpenDossier`, `useBrain().dossiers.update(id, recette)`.
- **Recette d'écriture, exacte** : `dossiers.update(dossierId, (d) => ({ canon: d.canon, monde: d.monde, charpente: { ...d.charpente, depart: { ...d.charpente.depart, ...patch } } }))` — trois racines nommées, `monde` traverse intact (§7, test 9 le vérifie).
- **Réouverture du lot en 2** si un futur comité ajoute : un `hint` sur `Select`, un budget de mots sur `texte_ouverture_joueur` dans `tables.ts`, ou tout champ ajouté à `Depart` — chacun de ces trois redemande un lot contrat séparé (KR-186).
- **Critères couverts** : #1 à #8 (tous).

*(1 lot. La mesure — une ligne d'export sans test dédié, cf. §8 désaccord 6 — ne justifie pas un second lot ni un essaim : le parallélisme n'existerait que sur le papier.)*

## 6 — Critères d'acceptation

1. **Étant donné** un dossier ouvert sur la section Départ avec au moins deux lieux (fixture seedée via `dossiers.update()`, chemin public), **quand** l'auteur choisit un autre lieu dans le Select, **alors** `charpente.depart.lieu_id` est persisté **immédiatement** (sans blur) par `DossierService.update()`, et une réouverture du dossier relit la valeur persistée. — *niveau : composant* — *lot 1*
2. **Étant donné** le Select de la section Départ, **quand** ses options sont construites, **alors** chaque lieu sans nom est libellé par le repli de `localiserEntite()` (ex. « Lieu n°1 (sans nom) »), jamais une chaîne vide ni `'undefined'`. — *composant* — *lot 1*
3. **Étant donné** la section Départ, **quand** l'auteur réécrit le texte d'ouverture et quitte le champ, **alors** `DossierService.update()` persiste `texte_ouverture_joueur`, et une réouverture du dossier relit la valeur persistée. — *composant* — *lot 1*
4. **Étant donné** un patch qui viderait `texte_ouverture_joueur`, **quand** l'auteur le soumet (blur), **alors** rien n'est persisté (`statut: 'refuse'`), l'erreur est visible à l'écran, le texte tapé reste affiché — et `lieu_id` n'est jamais concerné par ce chemin de refus (aucun brouillon sur ce champ). — *composant* — *lot 1*
5. **Étant donné** la section Départ, **quand** elle se rend quel que soit le contenu des deux champs, **alors** aucun compteur de mots ni aucun avertissement ne s'affiche — contraste explicite avec la section Canon, aucun budget ne portant sur `charpente.depart`. — *composant* — *lot 1*
6. **Étant donné** un dossier fraîchement créé (un seul lieu, `lieu.amorce`), **quand** l'auteur ouvre la section Départ, **alors** le Select affiche cette unique option, sans affordance de création, accompagnée de la légende qui nomme l'attente de la feature Lieux — jamais un contrôle grisé ni une erreur. — *composant* — *lot 1*
7. **Étant donné** la section Départ, **quand** un commit est effectué sur l'un des deux champs, **alors** `monde` et les autres racines du dossier traversent intacts — aucune mutation en dehors de `charpente.depart`. — *composant* — *lot 1*
8. **Étant donné** les 10 sections de la nav, **quand** l'auteur sélectionne l'index 1 (Départ), **alors** `dossierEditorScreen.test.tsx` constate le panneau injecté (sonde) et non plus l'état vide générique — non-régression KR-187, câblage `App.tsx` confirmé par test-grep. — *composant/contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| Select 2 options via fixture seedée | pas de `monde.lieux[0]` en dur ; les deux `id` apparaissent en options | jest / composant | — | 1 |
| Libellé du repli sans-nom | option d'un lieu sans `nom` === `localiserEntite('lieu', lieu, index)` exact | jest / composant | — | 1 |
| Refus sur `texte_ouverture_joueur` | vidé au blur → `statut:'refuse'`, bandeau `role="status"`, brouillon intact ; assertion explicite que `lieu_id` n'apparaît dans aucun `Refus.champs` | jest / composant | KR-183 | 1 |
| Commit `lieu_id` sans brouillon | `onChange` commite immédiatement ; un second changement écrase le premier sans divergence affichée | jest / composant | — | 1 |
| Absence de tout avertissement sur Départ | aucun `data-etat="avertissement"` ni compteur ne se rend, texte court ou très long | jest / composant | — | 1 |
| Sonde + non-régression KR-187 | `dossierEditorScreen.test.tsx`, cas `index === 1` : panneau injecté remplace l'état vide ; assertion-grep `App.tsx` gagne `panneaux=.*depart:\s*<PanneauDepart` | jest / contrat | KR-187, KR-184 | 1 |
| Absence d'affordance de création de lieu | `queryByRole`/`queryByText` sur « + ajouter »/« nouveau lieu » → `null` | jest / composant | — | 1 |
| `monde` traverse intact | deep-equal `dossiers.get(id).monde` avant/après un commit sur `charpente.depart` | jest / composant | — | 1 |

Cas limites couverts : vide (`texte_ouverture_joueur` vidé), doublon (aucun — `lieu_id` référence une entité déjà unique), référence orpheline (structurellement impossible — options toujours issues de `monde.lieux` existant), annulation/double soumission (hors périmètre : pas de modale, commit direct).

**Non vérifiable en l'état** — aucun. Les 8 critères sont tous couverts par jest + Testing Library, déjà en place.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | La définition ne dit pas comment démontrer un choix réel entre lieux alors qu'un dossier réel n'en a qu'un avant it4. | `RETENU` | Critère #1 exige une fixture ≥2 lieux, seedée via le chemin public `dossiers.update()`. |
| 2 | Tech Lead | « Généraliser le Select » est un abus de langage : `Select` est déjà générique, zéro consommateur, `PanneauDepart` en est le premier. | `RETENU` | §1 corrigé ; `Select.tsx` reste hors périmètre (§2). |
| 3 | Tech Lead | Un brouillon local sur `lieu_id` (calqué sur `PanneauCanon`) créerait une seconde source de vérité (le Select n'a pas de blur ; une adoption cloud retirant le lieu produirait un `selectedIndex=-1` puis un écrasement silencieux). | `RETENU` | `lieu_id` lu en ligne depuis le dossier, commit immédiat au `change`, aucun brouillon (§3, critères #1/#4). |
| 4 | Tech Lead + QA | KR-183 (« warnings rendus ») est inapplicable à Départ : aucun budget de mots ne porte sur ses deux champs (vérifié dans `tables.ts`). | `RETENU` | Aucun chemin d'avertissement pour Départ, écrit explicitement au critère #5 (contraste nommé avec Canon), plutôt que laissé comme un trou de couverture silencieux. |
| 5 | Tech Lead | Le découpage initial en 2 lots (contrat séparé + feature) est ramené à 1 lot unique marqué `contrat`. | `RETENU` | Le lot contrat mesuré ne pèse qu'une ligne d'export sans test neuf (désaccord 6) ; un worktree/fusion séparé pour une ligne dont tout le reste dépend fabrique de la cérémonie, aucun parallélisme réel. |
| 6 | Tech Lead vs QA | Faut-il un test dédié (`identifiers.test.ts`) à la seule joignabilité de l'export du baril ? | `REJETÉ` | Le repli de `localiserEntite()` est déjà épinglé par `validate.test.ts:146` ; la résolution du module est garantie par `tsc` (gate de commit) au moment où `PanneauDepart` l'importe ; son comportement réel est couvert par le test du libellé (§7, test 2). Un test qui ne vérifierait que la résolution de module testerait le compilateur, pas le code. |
| 7 | UX | Le cas à une seule option (état normal avant it4) a besoin d'un contrat de design explicite plutôt que d'un Select laissé seul face à un unique choix muet. | `RETENU` | Texte et tokens figés au §3, repris mot pour mot par le lot. |
| 8 | QA vs Tech Lead | Technique de seed pour démontrer ≥2 lieux : écriture directe `persistence.set`+`events.emit` (comme `dossierEditorScreen.test.tsx`) ou chemin public `DossierService.update()` ? | `RETENU (variante Tech Lead)` | Le test passe par le chemin public `dossiers.update()` — plus simple, et il exerce le même chemin d'écriture que celui utilisé par l'auteur, pas une simulation d'adoption cloud hors sujet ici. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto ne tient après le tour 2 — pas d'escalade.)*

## 9 — Innovation

*(aucune proposition hors-cadre ce tour — la légende UX pour le cas à une option applique la règle existante des états vides, ce n'est pas une exception à elle.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — sans objet (aucun des 4 fichiers mutés — `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts` — n'est touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`panneauCanon.test.tsx`, `dossierEditorScreen.test.tsx` hors du cas `index===1`)
- [ ] Aucun fichier touché hors de la liste du lot 1
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-canon-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **levée** | fixture ≥2 lieux + hors-périmètre création de lieu inscrits (§2, §6 critère 1) |
| Tech Lead | recevable sous réserve → **levée** | découpage 1 lot, `lieu_id` sans brouillon, `Select.tsx` hors périmètre — tous inscrits |
| UX | recevable sous réserve → **levée** | contrat de design complet inscrit mot pour mot (§3) |
| QA | recevable sous réserve (durcie : 8 tests nommés) → **levée** | les 8 tests inscrits au §7, aucun retiré |
