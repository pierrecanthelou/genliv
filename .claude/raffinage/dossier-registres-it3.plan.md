# Plan d'itération — `dossier-registres` · itération `3`

> Statut : `validé` (2026-08-17)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-17
> Composition : `4 rôles` — motif : décision actée au cadrage de la feature, confirmée en it1/it2 : cette feature est schéma + écrans, aucune nouvelle frontière prompt/moteur/mémoire de session. `narratif-ia` non convoqué.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut tenir le registre de ses quêtes secondaires, avec leur récompense en effets de règles. » |
| **Tranche** | `PanneauQuetes`/`FicheQuete`/`EditeurEffets` (écran) → `DossierService.update()` (`brain/dossier`) → persistance existante, réutilisée sans changement |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | Retrait (suppression) d'une quête persistée · réordonnancement manuel des étapes · `EtapeQuete.etape` comme champ stocké · récompense en XP (KR-209) · `Quete.lie_au_canon` (KR-206) |
| **Reporté** | Risque UX « gonflement d'`EditeurEffets` » → vigilance non bloquante, à surveiller au lot écran · audience de `etapes[].libelle` tranchée par l'orchestrateur (`ia`), non re-confirmée nommément par le PM au tour 2 → à relire si contestée |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut tenir le registre de ses quêtes secondaires — un donneur (référence à un personnage), une consigne (ce que le donneur demande, injectée au modèle), des étapes en prose, une échéance (note d'auteur) — et gagne son premier éditeur de récompense (`EditeurEffets`, composant né ici, réutilisé sans fork par l'itération Événements).

## 2 — Hors périmètre

- **Retrait (suppression) d'une quête persistée** : hors périmètre, même statut qu'it1 (indices) et it2 (jalons/fins) — engagerait une confirmation modale (CLAUDE.md § Dangerous Actions) et un lot de plus. Aucune itération planifiée de la feature ne le porte — `open_questions` niveau feature, déjà étendu à toutes les collections.
- **Réordonnancement manuel des étapes** : `EtapeQuete` n'a pas de bouton Monter/Descendre — son ordre est celui du tableau, jamais réarrangé par l'auteur (précédent `PlanAction`, `dossier-fiches`). Si un besoin réel de réordonnancement remonte, c'est une itération à part.
- **`EtapeQuete.etape` comme champ stocké** : ÉCARTÉ au raffinage (tour 2, tech-lead + UX convergents). Un ordinal persisté serait de l'état dérivé miroité dans le document (KR-013) — le précédent `plan_actions[].etape` (`dossier-fiches`) désynchronise déjà après un retrait (`1,3,4`, jamais renuméroté). `EtapeQuete = { libelle: string }` seul ; l'étiquette « ÉTAPE N » affichée à l'écran est calculée depuis la position du tableau à CHAQUE rendu, jamais écrite au document.
- **Récompense en XP** (`Quete.recompense` visant `xp`) : hors périmètre, KR-209 — aucune entrée `DELTAS` ne porte d'opérande entier.
- **`Quete.lie_au_canon`** : REJETÉ au cadrage de la feature, KR-206 — forme sans consommateur, même anti-patron que `tier`/`Indice.portee`.
- **Éditeur d'expression** (`declencheur_expr`/`condition_expr`, `…_expr` en général) : sans objet ici, `Quete`/`EtapeQuete` n'entrent dans aucune `FAMILLE_DE_CONDITIONS` (D1) — aucun avertissement de ce type sur cette section.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Composants réutilisés tels quels : `Field`, `ListRow`, `Card`, `IconButton`, `Select`, `IssueList`. Composant NEUF : `EditeurEffets` (né ici, `dossier-registres/components/`, générique via ses props — réutilisé sans fork par it4).

**Colonne liste** (`PanneauQuetes.tsx`, précédent exact `PanneauIndices.tsx`) : eyebrow `QUÊTES`. `ListRow` : `title={localiserEntite('quete', quete, index)}`, `subtitle={quete.id}`. Aucun réordonnancement de quêtes n'est demandé par le cadrage — reprendre le motif Monter/Descendre d'it1 par cohérence de feature (2 `IconButton` frères de `ListRow`). Bouton bas : `+ Ajouter une quête…`. État vide : glyphe `❏` + `Aucune quête — cliquez « + Ajouter une quête… » pour commencer.`

**`FicheQuete.tsx`, dans l'ordre** (une quête n'a AUCUN champ `CHAMPS_REQUIS` — commit immédiat à l'ajout, exactement le geste d'it1, `{id, recompense: []}`) :
1. `Field label="NOM DE LA QUÊTE" hint="interne" placeholder="La dette du forgeron"`.
2. **DONNEUR** — idiome « porte » (précédent `apres_indice_id`, `BlocSavoirs.tsx:430-467`) : tant que `donneur_id` est absent, un `Select` unique dont la première option est `+ Choisir un donneur…` (`value=''`), options = `avecOrpheline(optionsPersonnages, donneur_id ?? '', 'pnj')` — l'espace de noms technique est **`pnj`** (`identifiers.ts`), le libellé affiché à l'auteur reste « Personnage ». Une fois choisi : le `Select` résolu (label `DONNEUR`) + `IconButton label="Retirer le donneur" tone="danger"` (`✕`), qui remet `donneur_id` à `undefined` (jamais `null`).
3. `Field label="CONSIGNE DE LA QUÊTE" hint="IA — ce que le donneur demande, injecté au modèle" multiline rows={2} placeholder="Retrouver l'enclume volée avant la foire de printemps."`
4. `Field label="ÉCHÉANCE" hint="interne — note d'auteur, jamais lue par le modèle" placeholder="Avant que la caravane ne reparte, à l'aube."` (précédent exact `but.echeance`).
5. Section **ÉTAPES** — légende `Le déroulé de la quête, dans l'ordre où le joueur les franchit.` Chaque ligne : eyebrow `` `ÉTAPE {index+1}` `` (dérivé de la position, jamais un champ) + `IconButton label="Retirer l'étape n°{index+1}" tone="danger"` (`✕`) + `Field label="LIBELLÉ" hint="IA — ce que le joueur accomplit à cette étape" multiline rows={2} placeholder="Convaincre le passeur de traverser la rivière de nuit."` Ligne d'ajout : `+ Ajouter une étape…` — BROUILLON DIFFÉRÉ (précédent `useEcriturePlan.ts`/`action`, réimplémenté localement, jamais importé d'une autre feature) : la nouvelle ligne est structurellement identique à une ligne écrite, aucun chrome distinct — le placeholder vide EST le seul signal « pas encore committée ». `libelle` vide ne committe jamais ; une fois non vide au blur, l'étape entre dans `etapes[]`.
6. Section **RÉCOMPENSE** — `EditeurEffets` (voir ci-dessous), dernière section avant le bandeau de refus (même position que « MÈNE À » dans `FicheIndice.tsx`).

**`EditeurEffets.tsx`** — props textuelles jamais codées en dur (condition de réutilisation sans fork en it4) : `titre` (ici `RÉCOMPENSE`), `legende` (ici `Ce que la quête donne au joueur une fois résolue.`).

Anatomie d'une ligne (précédent `enTeteLigneStyle`, section « MÈNE À ») : `Select label="EFFET"`, options = les 4 entrées de `DELTAS` DANS L'ORDRE DU REGISTRE, texte d'option = `DELTAS[clé].label` **verbatim** (« donne l'objet », « retire l'objet », « révèle l'indice », « marque le jalon atteint ») — jamais réécrit ; puis un `Select label="CIBLE"` **par entrée de `refKinds`** (générique sur `descripteur.refKinds.length`, jamais fixé à l'arité 1 observée aujourd'hui — `deltas.ts` déclare l'arité dérivée, jamais stockée), options = `avecOrpheline(optionsDuNamespace, cibleCourante, espace)`, première option `— Choisir une cible —` (`value=''`) tant qu'aucune n'est prise ; puis `IconButton label="Retirer cet effet" tone="danger"` (`✕`).

Trois règles de rendu (évitent trois refus du validateur, à écrire au lot, pas à redécouvrir) :
1. Une `Select` CIBLE par position de `refKinds`, jamais codée en dur à un seul.
2. **Ajout à deux temps, rien au document avant d'être bien formé** : `cibles: ['']` est refusé (`identifiant-invalide`, bloquant). L'EFFET choisi vit en `useState` local d'`EditeurEffets` (aucune copie de la SSOT — rien n'est encore persisté) ; le commit part au choix de la dernière cible non vide. Précédent exact : `handleAjouterLien` de `PanneauIndices.tsx:212`.
3. **On ne mute jamais l'EFFET d'une ligne déjà écrite** — on la retire et on en ajoute une. Changer `donner_objet` → `reveler_indice` laisserait une cible de l'espace `objet` sous un espace `indice` : refus bloquant sur un document qui était valide.

Clé React des lignes d'`EditeurEffets` et des lignes d'`EtapeQuete` : **l'index dans le tableau rendu** (brouillon inclus, toujours en dernière position), JAMAIS une clé dérivée du contenu (`${effet}:${cible}`) — deux effets identiques dans `recompense[]` doivent produire deux `key` distinctes, sans quoi React lève un avertissement et peut faire correspondre l'état d'édition à la mauvaise ligne.

État vide de la section RÉCOMPENSE (`recompense` absent ou `[]`, cas légal) : légende affichée + `Aucune récompense — cliquez « + Ajouter un effet… » pour commencer.`

**Refus** (si une écriture échoue) : bandeau `role="status"`, eyebrow `CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ`, `IssueList` — motif `FicheIndice.tsx`, inchangé.

**Clavier** : Tab suit l'ordre visuel ci-dessus. `Entrée` dans un `Field` mono-ligne (NOM, ÉCHÉANCE) blur-committe ; les `Field` multiline (CONSIGNE, LIBELLÉ) insèrent un saut de ligne. Les `Select` s'ouvrent/valident au clavier natif. Focus revient à l'input déclencheur après tout retrait de ligne.

*(Écrit par l'UX, tour 1 ; libellé du champ 3 et sa clé JSON corrigés au tour 2 par la convergence PM/tech-lead — voir §8 désaccord 1.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtapeQuete` (NOUVEAU) | type | fournit | `{ libelle: string }` — AUCUN champ `etape` (§8 désaccord 2) |
| `Quete extends Entite` | type | fournit | `+= { donneur_id?: string; consigne?: string; etapes?: EtapeQuete[]; echeance?: string }` — `recompense: Delta[]` inchangé |
| `CHAMPS_REQUIS` (`tables.ts`) | registre | fournit | `+= { path: 'monde.quetes[].etapes[].libelle', location: 'Quêtes' }` |
| `LISTES_OPTIONNELLES_STRUCTUREES` (`tables.ts`) | registre | fournit | `+= { path: 'monde.quetes[].etapes', location: 'Quêtes' }` — précédent exact `contre_mesures`/`relations`/`presence` |
| `REFERENCES_SIMPLES` (`tables.ts`) | registre | fournit | `+= { path: 'monde.quetes[].donneur_id', espace: 'pnj', location: 'Quêtes' }` |
| `DESTINATION_DES_CHAMPS` (`destinations.ts`) | registre | fournit | `+= { 'monde.quetes[].donneur_id': 'moteur', 'monde.quetes[].echeance': 'auteur', 'monde.quetes[].consigne': 'ia', 'monde.quetes[].etapes[].libelle': 'ia' }` |
| `DELTAS` (`brain/dossier/deltas.ts`) | registre | fournit (EXPORT NOUVEAU) | `export { DELTAS } from './dossier/deltas'` ajouté à `brain/index.ts` — SEUL consommateur mandaté cette itération : `dossier-registres/components/EditeurEffets.tsx` (§8 désaccord 3) |
| `EditeurEffets` | component | fournit | composant local (KR-109, pas promu `brain/` avant un 2e appelant réel — it4 le réutilise SANS fork, toujours dans `dossier-registres/`) |
| `DossierService.update(id, recette): EcritureDossier` | service | consomme | inchangé |
| `dossier:updated` | événement | émet | `{ dossierId: string }` |
| `{Field, Card, ListRow, IconButton, Select, IssueList}` | component | consomme | inchangés |
| `frapperIdentifiant('quete')`, `localiserEntite('quete', ...)`, `avecOrpheline` | function | consomme | déjà enregistrés/promus (`dossier-format`, `brain/utils/references.ts` KR-110) |

Aucune ligne neuve dans `validate.ts` ni `identifiers.ts` : espaces `quete`/`pnj` déjà enregistrés, `monde.quetes: []` déjà semé par `amorce.ts`, `SECTIONS[7].id === 'quetes'` déjà présent dans `sections.ts` — vérifié par lecture directe au tour 1/2, pas supposé.

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `quetes-contrat` — `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : donner sa forme à `Quete`/`EtapeQuete`, fermer les trois lignes de registre nécessaires, et exporter `DELTAS` pour un unique consommateur nommé sans rouvrir le baril à tout le monde.
- **Fichiers** :
  - R `src/brain/dossier/types.ts`
  - R `src/brain/dossier/tables.ts`
  - R `src/brain/dossier/destinations.ts`
  - R `src/brain/dossier/couverture.test.ts`
  - R `src/brain/dossier/validate.test.ts`
  - R `src/brain/dossier/deltas.test.ts`
  - R `src/brain/dossier/__fixtures__/dossier-minimal.json`
  - R `src/brain/dossier/__fixtures__/dossier-reference.json`
  - R `src/brain/index.ts`
- **Expose/consomme** : voir §4. Le lot NE TOUCHE PAS `validate.ts`, `identifiers.ts`, `amorce.ts`, `sections.ts` — aucune branche neuve, aucun espace de noms neuf.
- **Bornes pour `dev-contrat`, à ne pas redécouvrir en revue** :
  1. **La réécriture de `deltas.test.ts:160-181`** — le test « DELTAS n'est référencé par aucun fichier hors `brain/dossier/` » passe d'une interdiction totale (`expect(porteurs).toEqual([])`) à une ALLOW-LIST NOMMÉE, sous-ensemble strict : `porteurs.filter(f => !AUTORISES.includes(f))` doit être vide, où `AUTORISES` contient EXACTEMENT deux entrées construites avec `path.join(...)` (JAMAIS un littéral `'brain/index.ts'` à la barre oblique — `path.relative` rend des séparateurs natifs de l'OS, et ce dépôt tourne aussi sous Windows) : `path.join('brain', 'index.ts')` et `path.join('features', 'dossier-registres', 'components', 'EditeurEffets.tsx')`. Le test doit être VERT APRÈS CE LOT SEUL (`porteurs = [path.join('brain','index.ts')]`, sous-ensemble de `AUTORISES`) — ce n'est vérifiable qu'après le lot 1 puisque `EditeurEffets.tsx` n'existe pas encore ; le test devient EXHAUSTIVEMENT vérifié une fois le lot 2 livré (`porteurs` = les deux entrées). Le discriminant existant (lignes 179-180 du fichier) reste inchangé.
  2. `EtapeQuete` n'a PAS de champ `etape` — ne pas le recréer par réflexe de symétrie avec `PlanAction`.
  3. `consigne`/`etapes[].libelle` sont `'ia'` ; `donneur_id` est `'moteur'` (un identifiant est un handle, jamais injecté) ; `echeance` est `'auteur'` — les quatre lignes sont à écrire exactement ainsi, ce sont des décisions du raffinage (§8), pas un choix du lot.
  4. Les deux fixtures instancient les cinq chemins neufs (une quête avec `donneur_id` vers un `pnj` existant, `consigne`, `echeance`, au moins deux `etapes`, et une `recompense` non vide si elle ne l'est pas déjà) — sans quoi « aucune ligne morte dans `DESTINATION_DES_CHAMPS` » rougit. La fixture minimale reste sans avertissement.
  5. `validate.test.ts` : un test par ligne de table neuve (3), dont l'orpheline de `donneur_id` et un `etapes: ["du texte"]` refusé (motif BUG-050).
  6. `couverture.test.ts` : dispenses `PROSE_D_ENTITE_LIBRE` pour `consigne` et `echeance` (précédent exact `monde.indices[].verite`/`formulation_joueur`) — le compte des dispenses est REMESURÉ, jamais recopié (KR-159). `etapes[].libelle` n'a PAS de dispense : il est `CHAMPS_REQUIS`, couvert par la corruption générique.
- **Critères couverts** : #1, #2, #3.

### Lot 2 — `quetes-ecran`
- **Ouvrier** : `dev-lot`
- **But** : panneau + fiche de quête + éditeur d'effets, câblés à `App.tsx`, remplaçant l'état vide de la section Quêtes.
- **Fichiers** :
  - N `src/features/dossier-registres/components/PanneauQuetes.tsx`
  - N `src/features/dossier-registres/components/FicheQuete.tsx`
  - N `src/features/dossier-registres/components/EditeurEffets.tsx`
  - N `src/features/dossier-registres/hooks/useEcritureEtapes.ts`
  - N `src/features/dossier-registres/tests/panneauQuetes.test.tsx`
  - R `src/features/dossier-registres/components/styles.ts`
  - R `src/features/dossier-registres/index.ts`
  - R `src/App.tsx` (une entrée `quetes: <PanneauQuetes dossierId={route.dossierId} />`)
- **Expose/consomme** : consomme uniquement `DELTAS`, `type Delta`, `type DeltaId`, `type Quete`, `type EtapeQuete`, `type EspaceDeNoms`, `avecOrpheline`, `localiserEntite`, `frapperIdentifiant('quete')`, `useOpenDossier`, `dossiers.update`, `{Field, Card, Select, ListRow, IconButton, IssueList}`. Démarre une fois le lot 1 figé, le lit comme donnée immuable. `useEcritureEtapes.ts` est RÉIMPLÉMENTÉ localement (jamais importé de `dossier-fiches/hooks/useEcriturePlan.ts` — un import croisé entre features est un veto tech-lead, refusé par l'ESLint d'isolation de toute façon).
- **Vérifié à la lecture** : aucun fichier de `bascule-editeur`, `dossier-canon`, `dossier-fiches` ou `tree-canvas` n'entre dans ce lot — KR-184/204/205 tenus par construction ; `PANNEAU_PAR_SECTION` de `PanneauSection.tsx` garde son repli pour `quetes` sans modification.
- **Critères couverts** : #4 à #8.

*(2 lots, exécution séquentielle — pas d'essaim parallèle, le lot 2 dépend du contrat figé par le lot 1.)*

## 6 — Critères d'acceptation

1. **Étant donné** le dossier de référence, **quand** le lot 1 est livré, **alors** les quêtes déjà persistées restent acceptées par `validateDossier` sans régression de leurs champs hors du lot — *niveau : contrat* — *lot 1*
2. **Étant donné** `DELTAS` non exporté avant cette itération, **quand** le lot 1 puis le lot 2 sont livrés, **alors** `DELTAS` sort du baril `brain/index.ts` pour EXACTEMENT deux porteurs nommés (`brain/index.ts`, `EditeurEffets.tsx`) — un 3ᵉ porteur reste refusé par `deltas.test.ts` — *niveau : contrat* — *lot 1*
3. **Étant donné** deux effets identiques dans `recompense[]`, **quand** `validateDossier` s'exécute, **alors** les deux sont acceptés sans anomalie (doublons autorisés) — *niveau : contrat* — *lot 1*
4. **Étant donné** la section Quêtes vide, **quand** l'auteur clique « + Ajouter une quête… », **alors** une quête est créée IMMÉDIATEMENT (`{id, recompense: []}`, aucun champ requis à remplir d'abord), apparaît dans la liste, et remplace l'état vide — *niveau : composant* — *lot 2*
5. **Étant donné** au moins un personnage existant dans le dossier, **quand** l'auteur choisit un DONNEUR via le `Select`, **alors** `donneur_id` est persisté, résolu à l'affichage, et marqué orphelin (`avecOrpheline`) si le personnage référencé disparaît ailleurs — *niveau : composant* — *lot 2*
6. **Étant donné** un brouillon d'étape dont `libelle` est vide, **quand** l'auteur quitte le champ sans texte, **alors** rien n'est écrit dans `etapes[]` ; une fois `libelle` non vide au blur, l'étape commit et son eyebrow « ÉTAPE N » reste dérivé de sa position (jamais un champ `etape` stocké) — *niveau : composant* — *lot 2*
7. **Étant donné** une ligne d'`EditeurEffets` en cours d'ajout, **quand** seul EFFET est choisi (CIBLE vide), **alors** rien n'est écrit dans `recompense[]` ; une fois CIBLE choisie, le `Delta` commit ; deux effets identiques se rendent en DEUX LIGNES DISTINCTES (clé React = index, jamais fusionnées) — *niveau : composant* — *lot 2*
8. **Étant donné** une quête sans récompense, **quand** sa fiche se rend, **alors** `EditeurEffets` affiche son état vide dédié, jamais un vide muet — *niveau : composant* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `deltas.test.ts` « allow-list nommée, vert lot 1 seul et lot 1+2 » | `AUTORISES` construit via `path.join`, `porteurs` reste un sous-ensemble aux deux étapes | contrat | — | 1 |
| `validate.test.ts` « donneur_id orphelin » | référence pendante bloquante vers un `pnj` inexistant | contrat | — | 1 |
| `validate.test.ts` « etapes avec élément non-objet refusé » | `etapes: ["du texte"]` → anomalie bloquante (BUG-050) | contrat | — | 1 |
| `validate.test.ts` « deux Delta identiques dans recompense[] acceptés » | `errors: []`, doublons autorisés — moitié SSOT du critère #3 | contrat | — | 1 |
| `couverture.test.ts` extension | `consigne`/`echeance` dispensés, `etapes[].libelle` couvert par corruption, sur les deux fixtures | contrat | KR-159 | 1 |
| `panneauQuetes.test.tsx` « ajout immédiat » | commit dès le clic, aucun champ requis à remplir avant | composant | KR-214 (vérifié non applicable ici) | 2 |
| `panneauQuetes.test.tsx` « donneur, choix et retrait » | `donneur_id` persisté, résolu, retrait remet `undefined` | composant | — | 2 |
| `panneauQuetes.test.tsx` « donneur orphelin affiché, jamais retiré silencieusement » | `avecOrpheline` marque sans effacer | composant | — | 2 |
| `panneauQuetes.test.tsx` « ajout étape différé » | `libelle` vide ne committe jamais ; non vide au blur → commit | composant | — | 2 |
| `panneauQuetes.test.tsx` « étiquette ÉTAPE dérivée de la position » | après retrait d'une étape du milieu, les étiquettes affichées restent `1, 2` séquentielles (dérivées, pas stockées) | composant | — | 2 |
| `panneauQuetes.test.tsx` « ajout effet à deux temps » | EFFET seul → rien écrit ; CIBLE choisie → commit | composant | — | 2 |
| `panneauQuetes.test.tsx` « deux effets identiques rendus en deux lignes » | clé React = index, pas de fusion visuelle ni d'avertissement React | composant | — | 2 |
| `panneauQuetes.test.tsx` « cible d'effet orpheline affichée » | `avecOrpheline` sur la cible d'un `Delta`, jamais retirée silencieusement | composant | — | 2 |
| `panneauQuetes.test.tsx` « état vide de RÉCOMPENSE » | `recompense: []` → texte d'état vide dédié | composant | — | 2 |
| `panneauQuetes.test.tsx` « isolation des 8 autres sections » | non-régression, précédent KR-187 | composant | KR-187 | 2 |

Cas limites à couvrir : registre vide (0 quête) · `etapes`/`recompense` absents (état calme, pas une alerte) · deux effets identiques · donneur retiré après référencement (orphelin) · une quête sans donneur (repli « + Choisir un donneur… », jamais un état cassé).

**Non vérifiable en l'état** — la généricité d'`EditeurEffets` sur `refKinds.length > 1` : les 4 entrées actuelles de `DELTAS` sont toutes d'arité 1, donc aucun test ne peut aujourd'hui discriminer un rendu générique d'un rendu fixé à une seule cible. Écrit comme non vérifié dans la revue, pas compté comme prouvé.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM vs Tech Lead (tour 1) puis convergence (tour 2) | Nom du champ prose de la quête : `consigne` (PM) vs `enonce` (tech-lead, tour 1) vs `objectif`/`but` (écartés d'emblée, KR-198) | `RETENU` `consigne` | Convergence tour 2 : le tech-lead retire `enonce` de lui-même — `charpente.jalons[].enonce_texte` existe déjà, recréant en espace de clés le même piège de compréhension qu'il opposait à `but`. `consigne` n'a aucun homonyme. Note d'arbitrage : l'annexe UX tour 2 répondait encore à `enonce` (tours parallèles) — le libellé d'écran est corrigé en « CONSIGNE DE LA QUÊTE » dans ce plan (§3), et l'objection QA sur la collision RTL avec « ÉNONCÉ » (`Jalon.enonce_texte`) devient sans objet. |
| 2 | Tech Lead (durcie au tour 2) | `EtapeQuete.etape` : champ stocké renuméroté (proposition tour 1) vs aucun champ, ordre = index du tableau | `RETENU` aucun champ | Un ordinal stocké est de l'état dérivé miroité dans la SSOT (KR-013) ; le précédent `plan_actions[].etape` désynchronise déjà après un retrait. Confirmé par l'UX tour 2 sans objection. |
| 3 | Tech Lead | `DELTAS` doit sortir de `brain/index.ts` pour qu'`EditeurEffets` le consomme — un contournement (projection dérivée re-listant les libellés) est un **veto tech-lead** | `RETENU` export nommé + allow-list dans `deltas.test.ts` | Le registre est la source unique des 4 libellés et des `refKinds` (KR-117) ; re-lister à la main diverge en silence le jour où un 5ᵉ effet est admis. |
| 4 | QA | La construction de l'allow-list proposée par le tech-lead au tour 1 utilisait un littéral `'index.ts'` sans le préfixe `brain/` — fait rougir le lot 1 seul au lieu de le faire passer | `RETENU`, corrigé | Vérifié par QA (tour 2) par lecture directe de `RACINE_SRC`/`path.relative` dans `deltas.test.ts`. Corrigé plus loin par l'orchestrateur : `path.join(...)` plutôt qu'un littéral à barre oblique, pour tenir sous Windows (ce dépôt y tourne) — voir §5 lot 1, borne 1. |
| 5 | QA | Test nommé de renumérotation d'`etape` après un retrait au milieu de la liste | `REJETÉ` (obviée par #2) | Sans objet une fois `EtapeQuete.etape` supprimé du type (désaccord #2) — il n'y a plus rien à renumérer. Remplacé par un test plus faible mais toujours réel : l'ÉTIQUETTE affichée reste séquentielle après un retrait (§7). |
| 6 | PM | Audience de `consigne` : `auteur` (défaut réversible du tech-lead) vs `ia` | `RETENU` `ia` | La feature existe pour qu'un modèle narrateur joue le dossier — le contenu de la demande d'une quête doit l'atteindre pour être jouable ; `echeance` reste `auteur` (pacing, pas contenu de jeu). |
| 7 | Orchestrateur (non débattu nommément par un rôle) | Audience de `etapes[].libelle` : `auteur` vs `ia` | `RETENU` `ia`, par cohérence | Aucun rôle n'a tranché nommément ce point au tour 2 (le PM a traité `consigne` mais pas `etapes[].libelle`). Arbitré par analogie : une étape de quête est le même type de contenu jouable que `consigne` (ce que le joueur doit accomplir), et `PlanAction.action` — son précédent structurel direct — est déjà `'ia'`. Reporté en vigilance : si contesté au retour, correction en une ligne (`destinations.ts` + `couverture.test.ts`). |
| 8 | UX | Risque de gonflement d'`EditeurEffets` (composant réutilisé par it4, pression à en faire trop dès it3) | `REPORTÉ` vigilance non bloquante | Aucun élément concret au tour 2 ne justifie un lot de plus ; le découpage à 2 lots (§5) borne déjà `EditeurEffets` à la stricte UI du champ `recompense`. À surveiller à la relecture du lot écran, pas un veto. |
| 9 | Tech Lead | Découpage en 3 lots (`EditeurEffets` séparé de l'écran Quêtes) | `REJETÉ` | Nommerait `styles.ts`/`index.ts`/`App.tsx` en commun avec le lot écran, propriété exclusive impossible ; le lot écran importerait un composant qu'il ne possède pas pour compiler. |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

Aucune proposition hors-cadre cette itération.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — non applicable (cette itération ne touche aucun de `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`panneauIndices.test.tsx` it1, `panneauJalonsFins.test.tsx` it2)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-registres-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — `consigne`/`ia` actés (§8-1/6), statut `etapes[].libelle` tranché (§8-2) |
| Tech Lead | recevable sous réserve | oui — veto `DELTAS` résolu par export nommé (§8-3), nommage convergé (§8-1) |
| UX | recevable | oui — condition tour 1 remplie, libellé corrigé en « CONSIGNE DE LA QUÊTE » (§8-1) |
| QA | recevable sous réserve | oui — allow-list corrigée (§8-4), 3 tests UI nommés actés (§7) |
