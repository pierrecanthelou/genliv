# Plan d'itération — `dossier-registres` · itération `4`

> Statut : `validé` (2026-08-19)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-18, validé par l'utilisateur le 2026-08-19
> Composition : `4 rôles` — motif : décision actée au cadrage de la feature, confirmée en it1/it2/it3 : cette feature est schéma + écrans, aucune nouvelle frontière prompt/moteur/mémoire de session. `narratif-ia` non convoqué.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut tenir le registre de ses événements, filtrés entre « liés à la trame » / « libres », avec leurs résolutions, chacune porteuse de ses propres effets. » |
| **Tranche** | `PanneauEvenements`/`FicheEvenement`/`EditeurEffets` (écran, réutilisé sans fork) → `DossierService.update()` (`brain/dossier`) → persistance existante |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | `Evenement.nature` (REJETÉ, voir §8-1) · retrait (suppression) d'un événement persisté · réordonnancement manuel des résolutions · graphe visuel (KR-204) · `lieux[].acces` (KR-205) · `conditions.contraintes` (KR-207) · récompense en XP / opérande entier (KR-208/209) |
| **Reporté** | Aucun désaccord reporté cette itération — les 6 désaccords ouverts au tour 1 sont tous statués `RETENU` au tour 2 (voir §8). Aucune proposition `INNOVATION`. |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut tenir le registre de ses événements — chacun filtré entre « liés à la trame » et « libres » (`lie_a_histoire`), optionnellement adossé à un monstre du bestiaire existant (`monstre_ref`, déjà câblé depuis `dossier-format`), et porteur de ses résolutions (`resolutions[]`, déjà typées) — chaque résolution éditant ses propres conséquences via `EditeurEffets`, le composant né à l'itération Quêtes, réutilisé ici **sans une ligne modifiée**.

## 2 — Hors périmètre

- **`Evenement.nature` / `NatureEvenement` / `NATURES_EVENEMENT`** : REJETÉ au complet — convergence unanime des 4 rôles au tour 2 (§8-1). Aucun consommateur nommé pour `scene`/`obstacle` ; le cas `monstre` est dérivable de `monstre_ref` sans champ stocké. Troisième occurrence du même anti-patron dans cette feature (`tier` KR-192, `lie_au_canon` KR-206, `Indice.portee`). Le libellé « Monstre : {nom} » affiché à l'écran DÉRIVE de `monstre_ref` au rendu, jamais une clé persistée.
- **Retrait (suppression) d'un événement persisté** (l'entité top-level) : hors périmètre, même statut qu'it1 (indices), it2 (jalons/fins), it3 (quêtes) — engagerait une confirmation modale (CLAUDE.md § Dangerous Actions) et un lot de plus. Aucune itération planifiée de la feature ne le porte — `open_questions` niveau feature.
- **Réordonnancement manuel des résolutions** au sein d'une fiche événement : aucun bouton Monter/Descendre sur `resolutions[]` — son ordre est celui du tableau (précédent `EtapeQuete`, it3, même motif). Si un besoin réel remonte, itération à part.
- **Éditeur d'expression** (`declencheur_expr`, `…_expr` en général) : sans écran dédié — `FAMILLES_DE_CONDITIONS` porte `alerteSansExpr: false` sur `evenements[].declencheur_texte`, donc **aucune région D1** n'est rendue sur cette fiche (§8-4). Le champ `declencheur_texte` reste un simple `Field` prose.
- **Graphe visuel** (repointage `tree-canvas`) : KR-204, hors périmètre total de la feature.
- **`lieux[].acces`** : KR-205, propriété recommandée de `dossier-canon`, pas de cette feature.
- **`conditions.contraintes`** (faim/froid/poursuite) : KR-207, état de session, pas une donnée du dossier auteur.
- **Récompense en XP / tout `Delta` à opérande entier** : KR-208/209 — `DELTAS` n'admet aujourd'hui aucune opération numérique ; sans objet pour `resolutions[].consequence`, qui réutilise le registre existant tel quel.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Composants réutilisés tels quels : `Field`, `ListRow`, `Card`, `IconButton`, `Select`, `SegmentedControl`, `IssueList`. Composant réutilisé **sans fork** : `EditeurEffets` (né it3, `dossier-registres/components/`) — une instance **par résolution**. Aucun composant neuf.

**Colonne liste** (`PanneauEvenements.tsx`, précédent exact `PanneauJalonsFins.tsx` pour le `SegmentedControl`, `PanneauQuetes.tsx` pour la structure) : eyebrow `ÉVÉNEMENTS`.

1. `SegmentedControl` (`role="radiogroup"`, composant réel — précédent it2) pleine largeur, **FILTRE** d'une seule collection (pas une bascule entre deux collections comme en it2) : `{ value:'lies', label:'LIÉS À LA TRAME' }` / `{ value:'libres', label:'LIBRES' }`, défaut `'lies'`. Pilote `lie_a_histoire === true` vs `!== true`. Jamais un chip par ligne. Jamais le mot « canon » côté Événements.
2. Compteur unique, **dérivé du sous-ensemble filtré affiché**, jamais du total du dossier : `N événement(s) lié(s) à la trame` / `N événement(s) libre(s)`.
3. `ListRow` (`title={localiserEntite('evenement', ev, index)}`, `subtitle={ev.id}`) + 2 `IconButton` Monter/Descendre — le déplacement s'opère **entre voisins du sous-ensemble filtré affiché** (traduit vers les index réels de `evenements[]` dans le panneau, jamais dans le hook).
4. Bouton bas : `+ Ajouter un événement…`. **Commit immédiat** (précédent it1/it3, aucun champ `CHAMPS_REQUIS` au niveau de l'entité) : `{ id: frapperIdentifiant('evenement'), resolutions: [], lie_a_histoire: filtre === 'lies' }` — **jamais `undefined`**, condition pour que l'événement apparaisse aussitôt dans l'onglet où il a été créé.
5. État vide, par filtre, glyphe `❏` : `Aucun événement lié à la trame — cliquez « + Ajouter un événement… » pour commencer.` / `Aucun événement libre — cliquez « + Ajouter un événement… » pour commencer.`
6. **Sélection par identifiant, jamais par index.** Au changement de filtre, si la fiche affichée sort du sous-ensemble filtré, la sélection retombe sur la première ligne du sous-ensemble — calculé **au rendu** (KR-013, aucun `useEffect` de resynchronisation) ; sous-ensemble vide → aucune fiche à droite, l'état vide de la liste suffit.

**`FicheEvenement.tsx`, dans l'ordre** (aucun champ `CHAMPS_REQUIS` au niveau de l'entité — commit immédiat, exactement le geste d'it1/it3) :

1. `Field label="NOM DE L'ÉVÉNEMENT" hint="interne" placeholder="L'embuscade du pont de pierre"`.
2. **MONSTRE** (optionnel) — idiome « porte » (précédent DONNEUR `FicheQuete.tsx`), **SANS `avecOrpheline`** (§8-5 : `BESTIARY` est un registre constant, aucune entrée ne peut devenir orpheline) : tant que `monstre_ref` est absent, `Select` unique dont la première option est `+ Adosser un monstre du bestiaire…` (`value=''`), options = `BESTIARY.map(m => ({ value: m.templateId, label: m.name }))`, dans l'ordre du registre. Une fois choisi : le `Select` résolu (label `MONSTRE`) + `IconButton label="Retirer le monstre" tone="danger"` (`✕`), qui remet `monstre_ref` à `undefined` (jamais `null`). À côté du titre de fiche, un texte dérivé non éditable : `Monstre : {nom}` si `monstre_ref` renseigné, rien sinon — DÉRIVÉ de `monstre_ref` à chaque rendu, jamais une clé `nature` (§8-1).
3. `Field label="DÉCLENCHEUR" hint="auteur — jamais injecté au modèle" multiline rows={2} placeholder="Le joueur revient à Val-Cendre après la tempête."` (exemple verbatim du docstring `types.ts:1091`). **Aucune région `role="status"` D1 sous ce champ** — silence par construction (`alerteSansExpr: false`, `tables.ts:685-690`, §8-4), la preuve est l'absence de code, pas une omission.
4. Section **RÉSOLUTIONS** — légende `Les issues possibles de cet événement, et ce que chacune change.` Chaque résolution persistée :
   - `Field label="RÉSULTAT" hint="IA — ce que le narrateur joue quand cette issue survient" multiline rows={2} placeholder="Le loup blessé bat en retraite ; le passage reste libre."`
   - `IconButton label="Retirer cette résolution" tone="danger"` (`✕`) — retrait immédiat, DANS le périmètre (§8-2, contrairement à la proposition initiale du tech-lead) ; la clé React de la ligne inclut le **jeton de remontage** pour qu'aucun brouillon d'effet ouvert sur une résolution voisine ne migre après le retrait.
   - `EditeurEffets` scopé à `resolution.consequence` : `titre="CONSÉQUENCES"`, `legende="Ce que cette résolution change dans le monde."`, `texteVide="Aucune conséquence — cliquez « + Ajouter un effet… » pour commencer."` Les trois callbacks (`onAjouterEffet`/`onChangerCible`/`onRetirerEffet`) se **ferment** sur le rang de la résolution côté `FicheEvenement` — `EditeurEffets` continue d'ignorer qu'il en existe plusieurs, aucune prop d'index ne lui est ajoutée (encapsulation, Loi de Déméter).
   - Ligne d'ajout `+ Ajouter une résolution…` — **BROUILLON DIFFÉRÉ** (précédent it2 Jalon/Fin, it3 étape — `resultat` est `CHAMPS_REQUIS`) : la nouvelle ligne est structurellement identique à une ligne écrite, le placeholder vide est le seul signal « pas encore committée ». `resultat` vide au blur ne committe jamais ; une fois non vide au blur, la résolution entre dans `resolutions[]` en `{ resultat, consequence: [] }` — alors seulement son `EditeurEffets` apparaît (on ne peut pas ajouter de conséquence à une résolution qui n'existe pas encore au document).
   - État vide de la section : `Aucune résolution — cliquez « + Ajouter une résolution… » pour commencer.`
5. Bandeau de refus (`role="status"`, `IssueList`, motif `FicheIndice.tsx` inchangé), dernière position.

**Clavier** : Tab suit l'ordre visuel — eyebrow → `SegmentedControl` filtre (flèches gauche/droite, `role="radiogroup"`) → liste + Monter/Descendre → `+ Ajouter un événement…` → NOM → MONSTRE → DÉCLENCHEUR → RÉSOLUTIONS (RÉSULTAT puis EFFET/CIBLE de chaque résolution) → bandeau refus (non focusable). `Entrée` dans un `Field` mono-ligne (NOM) blur-committe ; les `Field` multiline (DÉCLENCHEUR, RÉSULTAT) insèrent un saut de ligne. Focus revient à l'élément déclencheur après tout retrait de ligne (résolution ou effet).

*(Écrit par l'UX, tour 1 ; bloc conditionnel NATURE retiré au tour 2 après convergence sur le rejet de `nature` — voir §8-1.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Evenement extends Entite` | type | fournit | `+= { lie_a_histoire?: boolean }` — `monstre_ref`, `declencheur_texte`/`_expr`, `resolutions: Resolution[]` INCHANGÉS (déjà livrés par `dossier-format` n°1, avant cette feature) |
| ~~`NatureEvenement` / `NATURES_EVENEMENT`~~ | ~~type/registre~~ | — | **REJETÉ, aucune ligne écrite** (§8-1) |
| `ENUMERES_FERMES` (`tables.ts`) | registre | fournit | `+= { path: 'monde.evenements[].lie_a_histoire', location: 'Événements', valeurs: [true, false], requis: false }` — précédent exact `monde.personnages[].relations[].secret` (`tables.ts:274`) |
| `DESTINATION_DES_CHAMPS` (`destinations.ts`) | registre | fournit | `+= { 'monde.evenements[].lie_a_histoire': 'moteur' }` |
| `PREFIXE_BESTIAIRE` (`validate.ts`) | constante | fournit (EXPORT NOUVEAU) | `` export const PREFIXE_BESTIAIRE = `${ESPACE_BESTIAIRE}.` `` (= `'bestiaire.'`), ré-exportée par `brain/index.ts` — évite de retaper le littéral à l'écran (KR-165/117) |
| `BESTIARY` / `BESTIARY_BY_TEMPLATE` (`brain/bestiary.ts`) | registre | consomme | **DÉJÀ exporté** de `brain/index.ts` depuis `dossier-format` — aucun export nouveau à ouvrir (contrairement à `DELTAS` en it3) |
| `EditeurEffets` | component | consomme | inchangé — réutilisé sans fork, une instance par résolution |
| `DossierService.update(id, recette): EcritureDossier` | service | consomme | inchangé |
| `dossier:updated` | événement | émet | `{ dossierId: string }` |
| `{Field, Card, ListRow, IconButton, Select, SegmentedControl, IssueList}` | component | consomme | inchangés |
| `frapperIdentifiant('evenement')`, `localiserEntite('evenement', ...)` | function | consomme | déjà enregistrés (`identifiers.ts`, depuis `dossier-format`) |

Aucune ligne neuve dans `identifiers.ts`, `sections.ts`, `deltas.ts`, `amorce.ts` — espace `evenement` déjà enregistré, `monde.evenements: []` déjà semé, `SECTIONS[8].id === 'evenements'` déjà présent — vérifié par lecture directe au tour 1/2, pas supposé. `avecOrpheline` **n'entre pas** dans la liste de fonctions consommées par le lot écran (§8-5) — il reste utilisé à l'intérieur d'`EditeurEffets`, inchangé.

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `evenements-contrat` — `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : donner sa forme à `Evenement.lie_a_histoire`, fermer la ligne de registre nécessaire, et publier `PREFIXE_BESTIAIRE` — sans toucher à `monstre_ref`/`declencheur_texte`/`resolutions`, déjà livrés.
- **Fichiers** :
  - R `src/brain/dossier/types.ts`
  - R `src/brain/dossier/tables.ts`
  - R `src/brain/dossier/destinations.ts`
  - R `src/brain/dossier/validate.ts`
  - R `src/brain/index.ts`
  - R `src/brain/dossier/couverture.test.ts`
  - R `src/brain/dossier/validate.test.ts`
  - R `src/brain/dossier/__fixtures__/dossier-minimal.json`
  - R `src/brain/dossier/__fixtures__/dossier-reference.json`
- **Expose/consomme** : voir §4. Le lot NE TOUCHE PAS `identifiers.ts`, `sections.ts`, `deltas.ts`, `amorce.ts`, `FAMILLES_DE_CONDITIONS` — aucune branche neuve, aucun espace de noms neuf, aucun registre `NatureEvenement`.
- **Bornes pour `dev-contrat`, à ne pas redécouvrir en revue** :
  1. **AUCUNE ligne `nature`/`NatureEvenement`/`NATURES_EVENEMENT` nulle part** — c'est la borne du lot, pas un détail de style (§8-1). Une PR qui en ajoute une doit être refusée en auto-revue avant même le tech-lead.
  2. `lie_a_histoire` va dans `ENUMERES_FERMES`, PAS `CHAMPS_REQUIS` (c'est un booléen optionnel, précédent `relations[].secret` ligne 274) : `{ path: 'monde.evenements[].lie_a_histoire', location: 'Événements', valeurs: [true, false], requis: false }`. `DESTINATION_DES_CHAMPS` reçoit `'monde.evenements[].lie_a_histoire': 'moteur'`.
  3. `PREFIXE_BESTIAIRE` est dérivé de `ESPACE_BESTIAIRE` existant (`validate.ts:105`), jamais un second littéral `'bestiaire.'` — un seul mot-clé `export` ajouté devant la déclaration existante, aucune branche neuve dans `validate.ts`.
  4. Les deux fixtures instancient `lie_a_histoire` avec les DEUX valeurs représentées entre elles (au moins un `true` et un `false` dans la référence) — sans quoi « aucune ligne morte dans `DESTINATION_DES_CHAMPS` » rougit. La fixture minimale reste sans avertissement.
  5. `validate.test.ts` : un test par ligne de table neuve — `lie_a_histoire` hors énumération refusé (ex. `'oui'`), `lie_a_histoire` absent accepté (pas d'anomalie).
  6. `couverture.test.ts` : le compte de dispenses est REMESURÉ, jamais recopié d'it3 (KR-159).
  7. **Ricochets à EXÉCUTER, pas à supposer** : `roundtrip.test.ts` et `dossier-format/tests/importDossier.test.tsx` ont rougi trois fois sur des lots ajoutant une référence vers l'espace `pnj` (it1/it2/it3 de cette feature) — `lie_a_histoire` ne référence aucune collection, ce ricochet ne devrait PAS se déclencher cette fois, mais le lot doit lancer ces deux suites et le constater, pas le présumer.
- **Critères couverts** : #1, #8 (voir §6).

### Lot 2 — `evenements-ecran`
- **Ouvrier** : `dev-lot`
- **But** : panneau + fiche d'événement + résolutions à brouillon différé, câblés à `App.tsx`, remplaçant l'état vide de la section Événements — sans toucher à `EditeurEffets.tsx`.
- **Fichiers** :
  - N `src/features/dossier-registres/components/PanneauEvenements.tsx`
  - N `src/features/dossier-registres/components/FicheEvenement.tsx`
  - N `src/features/dossier-registres/hooks/useEcritureResolutions.ts`
  - N `src/features/dossier-registres/tests/panneauEvenements.test.tsx`
  - R `src/features/dossier-registres/components/styles.ts`
  - R `src/features/dossier-registres/index.ts`
  - R `src/App.tsx` (une entrée `evenements: <PanneauEvenements dossierId={route.dossierId} />`)
- **Expose/consomme** : consomme uniquement `type Evenement`, `type Resolution`, `type Delta`, `type DeltaId`, `type EspaceDeNoms`, `type EcritureDossier`, `BESTIARY`, `PREFIXE_BESTIAIRE`, `localiserEntite`, `frapperIdentifiant('evenement')`, `useOpenDossier`, `dossiers.update`, `{Field, Card, ListRow, IconButton, Select, SegmentedControl, IssueList, HIT_TARGET_MIN}`. Démarre une fois le lot 1 figé, le lit comme donnée immuable. `useEcritureResolutions.ts` est RÉIMPLÉMENTÉ localement (précédent `useEcritureEtapes.ts`/`useEcritureJalons.ts` — jamais un import croisé entre features, refusé par l'ESLint d'isolation de toute façon).
- **`EditeurEffets.tsx` n'apparaît dans AUCUN fichier de ce lot** — c'est la preuve du critère d'architecture n°6 de la feature (réutilisation sans fork). Une instance par résolution, callbacks fermés sur le rang de la résolution.
- **Le jeton de remontage** (réponse à §8-2) : un compteur monotone incrémenté au seul retrait d'une résolution, inclus dans la clé React de chaque ligne (`` key={`${jetonDeRemontage}:${rang}`} ``). Ce n'est PAS de l'état dérivé (KR-013/113) : il ne miroite aucune donnée du document, il force React à démonter/remonter les `N` instances d'`EditeurEffets` après un retrait pour qu'aucun brouillon d'effet en cours de saisie ne se retrouve appliqué à la mauvaise résolution une fois les index décalés. Aucun `id` de résolution n'est ajouté au schéma pour cet usage.
- **Trois contraintes dures** (ferment les trous nommés au raffinage, à ne pas redécouvrir en revue) :
  1. **Sélection par identifiant, jamais par index** — le repli au changement de filtre est calculé au rendu (`filtres.find(e => e.id === evenementId) ?? filtres[0]`), sans `useEffect` de resynchronisation.
  2. **Création : commit immédiat, valeur `lie_a_histoire` toujours explicite** — jamais `undefined` au moment de l'écriture, sous peine que l'événement créé n'apparaisse pas dans l'onglet où il vient de naître.
  3. **Monter/Descendre opèrent entre voisins du sous-ensemble filtré affiché**, traduits vers les index réels de `monde.evenements[]` dans le panneau (jamais dans le hook).
- **Vérifié à la lecture** : aucun fichier de `bascule-editeur`, `dossier-canon`, `dossier-fiches`, `dossier-objets` ou `tree-canvas` n'entre dans ce lot — KR-184/204/205 tenus par construction ; `PANNEAU_PAR_SECTION` de `PanneauSection.tsx` garde son repli pour `evenements` sans modification.
- **Critères couverts** : #2 à #7 (voir §6).

*(2 lots, exécution séquentielle — pas d'essaim parallèle, le lot 2 dépend du contrat figé par le lot 1.)*

## 6 — Critères d'acceptation

1. **Étant donné** le dossier de référence, **quand** le lot 1 est livré, **alors** les événements déjà persistés restent acceptés par `validateDossier` sans régression de leurs champs hors du lot (non-régression, précédent it1-3) — *niveau : contrat* — *lot 1*
2. **Étant donné** `nature` absent du schéma, **quand** l'auteur renseigne `monstre_ref` via le `Select` MONSTRE, **alors** le libellé « Monstre : {nom} » affiché DÉRIVE de `monstre_ref` au rendu, et aucune clé `nature` n'existe dans le document persisté (§8-1) — *niveau : composant* — *lot 2*
3. **Étant donné** un événement `lie_a_histoire: true` et un second `lie_a_histoire: false`, **quand** le panneau Événements se rend, **alors** le premier apparaît dans « Liés à la trame » et jamais dans « Libres », et réciproquement (discriminance à deux entités, KR-197/199/202) — *niveau : composant* — *lot 2*
4. **Étant donné** la section Événements vide, **quand** l'auteur clique « + Ajouter un événement… » sous un filtre donné, **alors** un événement est créé IMMÉDIATEMENT avec `lie_a_histoire` posé explicitement selon le filtre actif (jamais `undefined`), et apparaît dans le bon onglet — *niveau : composant* — *lot 2*
5. **Étant donné** un événement existant, **quand** l'auteur ajoute une résolution dont le RÉSULTAT est laissé vide, **alors** rien n'est écrit dans `resolutions[]` ; une fois RÉSULTAT non vide au blur, la résolution commit `{ resultat, consequence: [] }` et son `EditeurEffets` apparaît alors seulement (KR-214) — *niveau : composant* — *lot 2*
6. **Étant donné** une résolution persistée portant un brouillon d'effet ouvert dans son `EditeurEffets`, **quand** l'auteur retire une résolution VOISINE, **alors** aucun brouillon d'effet ne migre vers la résolution qui prend sa place (jeton de remontage) — *niveau : composant* — *lot 2*
7. **Étant donné** un monstre choisi via le `Select` MONSTRE, **quand** l'auteur clique « Retirer le monstre », **alors** `monstre_ref` repasse à `undefined` (jamais `null`), et le `Select` repropose « + Adosser un monstre du bestiaire… » — *niveau : composant* — *lot 2*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur : aucun import direct entre `dossier-registres` et `bascule-editeur`/`dossier-canon`/`dossier-fiches`/`tree-canvas` (KR-184/204/205), aucune couleur en dur, et aucune ligne `NatureEvenement`/`NATURES_EVENEMENT` dans le diff — *niveau : contrat* — *lot 1+2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `couverture.test.ts` extension | `lie_a_histoire` dispensé/couvert sur les deux fixtures, compte remesuré | contrat | KR-159 | 1 |
| `validate.test.ts` « lie_a_histoire hors énumération refusé » | valeur ex. `'oui'` → anomalie bloquante | contrat | — | 1 |
| `validate.test.ts` « lie_a_histoire absent accepté » | pas d'anomalie sur un événement sans le champ | contrat | — | 1 |
| `panneauEvenements.test.tsx` « discriminance des deux onglets » | 2 événements distincts (`true`/`false`), chacun visible dans son seul onglet, absence croisée assertée | composant | KR-197/199/202 | 2 |
| `panneauEvenements.test.tsx` « ajout immédiat, valeur explicite » | clic sous un filtre → `lie_a_histoire` posé, événement visible dans le bon onglet | composant | — | 2 |
| `panneauEvenements.test.tsx` « libellé monstre dérivé » | `Select` MONSTRE renseigné → « Monstre : {nom} » affiché ; document écrit sans clé `nature` | composant | — | 2 |
| `panneauEvenements.test.tsx` « retrait du monstre » | `IconButton` Retirer → `monstre_ref` `undefined`, `Select` repropose le placeholder | composant | — | 2 |
| `panneauEvenements.test.tsx` « brouillon différé de résolution » | `resultat` vide au blur → rien écrit ; non vide → commit `{resultat, consequence:[]}`, `EditeurEffets` apparaît alors ; DANS LE MÊME TEST, la création de l'événement lui-même reste immédiate (contraste geste-création/geste-résolution) | composant | KR-214 | 2 |
| `panneauEvenements.test.tsx` « jeton de remontage » | brouillon d'effet ouvert sur la résolution n°2, retrait de la n°1 → aucun brouillon affiché sur la ligne qui prend sa place | composant | — | 2 |
| `panneauEvenements.test.tsx` « sélection par identifiant, repli au filtrage » | fiche ouverte sort du sous-ensemble filtré → sélection bascule sur la première ligne visible, jamais un index fantôme | composant | — | 2 |
| `panneauEvenements.test.tsx` « isolation des 9 autres sections » | non-régression, précédent KR-187 | composant | KR-187 | 2 |

Cas limites à couvrir : registre vide (0 événement) · `resolutions` absent/vide (état calme, pas une alerte) · un événement sans monstre (repli « + Adosser un monstre… », jamais un état cassé) · deux effets identiques dans une même résolution (héritage it3, `EditeurEffets` inchangé) · deux résolutions dont une avec conséquences et une sans.

**Non vérifiable en l'état** (même réserve qu'it3) — la généricité d'`EditeurEffets` sur `refKinds.length > 1` : les 4 entrées actuelles de `DELTAS` sont toutes d'arité 1, aucun test ne peut discriminer un rendu générique d'un rendu fixé à une seule cible. Écrit comme non vérifié dans la revue.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM (tour 1) + QA (tour 1) vs Tech Lead (tour 1) | Forme de `Evenement.nature` : dérivée-légère pour le seul cas `monstre` (PM/QA tour 1) vs retrait total, zéro ligne (Tech Lead tour 1) | `RETENU` retrait total | Convergence unanime au tour 2 : aucun consommateur nommé pour `scene`/`obstacle` (PM), `nature` stocké serait une seconde source de vérité pour « cet événement est un combat », déjà portée par `monstre_ref` (Tech Lead), l'UX retire son bloc conditionnel #4, la QA reformule son test de cohérence en test de dérivation du libellé. Troisième occurrence du même anti-patron dans cette feature (`tier`, `lie_au_canon`, `Indice.portee`). |
| 2 | Tech Lead (tour 1) vs UX (tour 1, contrat d'écran) | Retrait d'une résolution persistée : hors périmètre (Tech Lead tour 1) vs geste attendu par l'écran — l'UX avait déjà écrit un `IconButton "Retirer cette résolution"` dans son annexe de tour 1, sans le savoir hors périmètre | `RETENU` dans le périmètre | Le Tech Lead concède au tour 2 : une résolution non retirable est un piège de donnée, précédent direct `EtapeQuete`/effet retirables en it3. Porté par un mécanisme neuf, le « jeton de remontage » (compteur monotone dans la clé React des lignes de résolution) — zéro champ `id` ajouté au schéma, évite la migration d'un brouillon d'effet `EditeurEffets` vers la résolution voisine après un retrait. |
| 3 | QA (tour 1, maintenue tour 2) | Absence de test nommé distinguant le geste de création d'un événement (commit immédiat, comme it1/it3) du geste d'ajout d'une résolution (brouillon différé, KR-214) | `RETENU` | Porté par le lot 2, test nommé « brouillon différé de résolution » (§7) qui contraste explicitement les deux gestes dans le même test — exigence formulée par la QA au tour 1, satisfaite par le découpage figé du Tech Lead au tour 2. |
| 4 | UX (objection 1, tour 1) | Le cadrage laissait croire à une région D1 (`role="status"`) visible sur la fiche Événement pour `declencheur_texte`/`declencheur_expr` | `RETENU` silence total | `tables.ts:685-690` fixe `alerteSansExpr: false` sur `evenements[].declencheur_texte` — même régime que `Jalon` (jamais `Fin`, qui seul porte l'alerte visible depuis it2). Aucune région D1 n'est codée sur `FicheEvenement.tsx` ; la preuve du silence est l'absence de code, pas une omission de rendu. |
| 5 | UX (objection 2, tour 1) | Faut-il appliquer `avecOrpheline` au `Select` MONSTRE, par analogie avec le `Select` DONNEUR de `FicheQuete.tsx` (it3) ? | `RETENU` non | `BESTIARY` est un registre constant du code (`brain/bestiary.ts`), pas une collection du dossier — aucune entrée ne peut devenir orpheline. Le Tech Lead retire `avecOrpheline` de la liste des fonctions consommées par le lot 2 ; elle reste utilisée à l'intérieur d'`EditeurEffets`, inchangé, pour les cibles de `Delta`. |
| 6 | Tech Lead (tour 1) | Sémantique de l'absence de `lie_a_histoire` (compat des événements déjà persistés) vs valeur toujours écrite à la création | `RETENU` les deux | En LECTURE, absent se traite comme « libre » (compat documents existants, précédent `relations[].secret`). En ÉCRITURE, l'écran pose TOUJOURS la valeur explicitement à la création (`lie_a_histoire: filtre === 'lies'`, jamais `undefined`) — sans quoi l'événement n'apparaîtrait pas dans l'onglet où il vient de naître. Convergence dès le tour 1 : l'UX avait proposé indépendamment le même comportement côté écran. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto ne tient après le tour 2 — pas de bloc `ESCALADE`.)*

## 9 — Innovation

Aucune proposition hors-cadre cette itération. Le « jeton de remontage » (§5 lot 2, §8-2) est une technique d'implémentation à l'intérieur du cadre de l'itération (corrige un risque identifié au tour 1, ne modifie ni le schéma ni le périmètre), pas une proposition `INNOVATION` au sens de la skill.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — non applicable (cette itération ne touche aucun de `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`panneauIndices.test.tsx` it1, `panneauJalonsFins.test.tsx` it2, `panneauQuetes.test.tsx` it3)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `roundtrip.test.ts` et `dossier-format/tests/importDossier.test.tsx` exécutés et vérifiés verts (ricochet potentiel, §5 lot 1 borne 7)
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-registres-it4.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — `nature` retiré du contrat et du code (§8-1) |
| Tech Lead | recevable sous réserve | oui — `nature` retiré (§8-1), retrait de résolution assumé via jeton de remontage (§8-2) |
| UX | recevable sous réserve | oui — silence D1 confirmé (§8-4), `avecOrpheline` écarté du Select MONSTRE (§8-5) |
| QA | recevable sous réserve | oui — test de discriminance geste-création/geste-résolution nommé (§8-3) |
