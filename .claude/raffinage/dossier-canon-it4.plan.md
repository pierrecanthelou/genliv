# Plan d'itération — `dossier-canon` · itération `4`

> Statut : `validé` (2026-08-11)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-11
> Composition : `4 rôles` — motif : `dossier-canon` (roadmap n°3) n'est pas dans la liste n°1/4/7/8+Temps2 du roadmap §4 (features touchant le dossier d'aventure côté moteur, les prompts, la mémoire de session ou le mode jeu) ; les 3 nouveaux champs de `Lieu` sont de la prose descriptive classée par le tech-lead dans `destinations.ts` (registre déjà existant, aucun contact avec un prompt ni un contrat de sortie IA). Même motif retenu identique à it1/it2/it3.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « L'auteur consigne les lieux de son aventure dans la section Lieux : il en ajoute, y modifie nom, description, ambiance, dangers, en retire un devenu inutile — sauf le lieu de départ, protégé par le dossier lui-même. » |
| **Tranche** | Écran (`PanneauLieux.tsx`, liste `ListRow` à gauche + fiche à droite) → `DossierService.update()` (chemin déjà éprouvé it1-3) → persistance (schéma `Lieu` neuf dans `brain/dossier/types.ts` + classification `destinations.ts`) |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et premier) |
| **Hors périmètre** | acces, personnages, objets, indices, evenements sur `Lieu` (différés n°4/5/6) ; éditeur structuré d'expression (sans objet, Lieu n'a pas de paire texte/expr) ; Modal de confirmation au retrait (rejetée, voir désaccord #1) ; promotion du bandeau Refus vers `brain/` (reportée, voir désaccord #2) |
| **Reporté** | Extraction du couple Refus/commit vers `features/dossier-canon/hooks/` — 3ᵉ appelant réel atteint mais différé au 4ᵉ (open_questions) |

C'est la **dernière itération** de `dossier-canon` (roadmap 3/4 → 4/4) : après elle, la feature passe `done`.

---

## 1 — But raffiné

L'auteur consigne les lieux de son aventure dans la section Lieux : il en ajoute, y modifie nom, description, ambiance, dangers, en retire un devenu inutile — sauf le lieu de départ, protégé par le dossier lui-même.

## 2 — Hors périmètre

- `lieux[].acces` et toute référence croisée (`personnages[]`, `objets[]`, `indices[]`, `evenements[]`) sur `Lieu` — différées aux features qui possèdent ces collections (n° 4/5/6), déjà arbitré par `resolved_decisions` de la feature.
- Tout éditeur structuré d'expression (`Select PREDICATES` + `TargetPicker`) — sans objet ici, `Lieu` ne porte aucune paire `…_texte`/`…_expr`, aucun avertissement D1 ne le concerne (KR-189 non déclenché).
- Généralisation de `TargetPicker` — non concernée par cette itération, aucune nouvelle référence à choisir (KR-185, inchangé).
- Modal de confirmation au retrait d'un lieu — proposée puis rejetée (désaccord #1) : le seul cas dangereux est déjà bloqué par le SSOT.
- Promotion du bandeau Refus (`role="status"` + `IssueList`) vers `brain/components/` — le 3ᵉ appelant réel est atteint par cette itération, mais l'extraction est différée au 4ᵉ appelant réel (désaccord #2, `open_questions`).
- Toute limite de mots (`BUDGETS_DE_MOTS`) sur les champs de `Lieu` — non demandée par le contrat de design de la feature, aucun budget n'existe pour `monde.lieux[]` aujourd'hui et cette itération n'en ouvre pas.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

### Composants
`ListRow` (`brain/components/ListRow.tsx`, premier consommateur en écriture — signature inchangée), `Card`, `Field` (`multiline`/`rows`/`hint`/`autoFocus` — props déjà existantes, vérifiées dans le code), `IconButton` (`tone="danger"`). **Aucune primitive neuve, aucun `Modal`.**

### Layout
Deux colonnes : gauche = liste `ListRow` (une ligne par `monde.lieux[]`, jamais triée — même garde que `PanneauDepart`), sous elle un bouton dashed accent « + Ajouter un lieu… ». Droite = `Card` unique contenant la fiche du lieu sélectionné. Sélection par défaut au montage : premier lieu du tableau (`index 0`, donc `lieu.amorce` sur un dossier neuf).

### Textes exacts
- Eyebrow de section : `LIEUX`
- Bouton d'ajout : `+ Ajouter un lieu…`
- `ListRow.title` : sortie brute de `localiserEntite('lieu', lieu, index)` (`Lieu « Val-Cendre »` / `Lieu n°1 (sans nom)`) — jamais reformatée.
- `ListRow.subtitle` : `lieu.id` (mono, technique).
- `Field label="NOM DU LIEU"` hint `interne` — placeholder `La Caverne d'Aldûr`
- `Field label="DESCRIPTION" multiline rows={3}` hint `interne — jamais lu par le joueur` — placeholder `Une grotte basse aux parois calcaires, à une heure de marche au nord de Val-Cendre ; l'entrée est dissimulée par un rideau de lierre.`
- `Field label="AMBIANCE" multiline rows={2}` hint `interne — jamais lu par le joueur` — placeholder `Air humide, écho des gouttes, une odeur de cendre froide qui ne devrait pas être là.`
- `Field label="DANGERS" multiline rows={2}` hint `interne — jamais lu par le joueur` — placeholder `Un piège à lanière tendu près de l'autel ; les échos attirent parfois un loup des cendres.`
- `IconButton label="Retirer le lieu « {titre} »"` (repli sans nom → `Retirer le lieu n°{index}`), `tone="danger"`, glyphe `✕` — déclenche le retrait **directement**, sans étape intermédiaire.
- Bandeau de refus (retrait du lieu de départ) : réutilise `EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"` déjà câblé — aucun texte neuf.
- Vide défensif (0 lieu, cas non normalement atteignable) : `Aucun lieu — cliquez « + Ajouter un lieu… » pour commencer.`, gabarit dashed identique à `PanneauSection` (`border 1.5px dashed var(--border-field)`, glyphe `❏`).

### États
- **Défaut** : liste ≥1 ligne (jamais vide, `lieu.amorce` toujours semé) ; fiche du lieu sélectionné à droite, ses 4 champs vides affichent leur placeholder.
- **Sélectionné** : `ListRow` teinte `--accent-bg-2` / bordure `--accent`, `aria-current="true"` — géré par le composant.
- **Retrait réussi** : sélection retombe sur le lieu d'`index - 1` (ou le premier restant si l'élément retiré était en tête) ; focus suit sur le bouton retirer de la fiche nouvellement affichée.
- **Retrait refusé** (lieu de `charpente.depart.lieu_id`) : liste et sélection inchangées, aucun retrait optimiste, bandeau `role="status"` visible au-dessus de la fiche.

### Clavier
`Tab` traverse les `ListRow` (racine `<button>` native) puis le bouton d'ajout puis les 4 champs de la fiche puis le bouton retirer. Ajout : `Entrée`/clic → commit immédiat → nouvelle `ListRow` sélectionnée → focus posé sur `NOM DU LIEU` (`autoFocus`). Retrait : `Entrée`/`Espace` sur le bouton retirer supprime immédiatement (ou refuse, voir États).

### Tokens (noms vérifiés dans `src/styles/tokens/*.css`)
`--space-1..12`, `--hit-target`, `--r-md`, `--r-xl`, `--surface-card`, `--surface-inset`, `--border-subtle`, `--border-field`, `--accent`, `--accent-bg-2`, `--bad`, `--bad-line`, `--text-strong`, `--text-body`, `--text-faint`, `--text-label`, `--text-muted`, `--font-ui`, `--font-mono`.

*(Écrit par l'UX, révisé au tour 2 après retrait du Modal — voir désaccord #1.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Lieu` | type/registre | émet (nouveau) | `interface Lieu extends Entite { description?: string; ambiance?: string; dangers?: string }` ; `Monde.lieux: Lieu[]` (remplace `Entite[]` nu, extension covariante) |
| `destinations.ts` (3 lignes) | registre | émet (nouveau) | `'monde.lieux[].description'\|'.ambiance'\|'.dangers': 'ia'` (désaccord #3) |
| `DossierService.update()` | service | consomme | inchangé depuis it1 (KR-183) |
| `frapperIdentifiant('lieu')` | fonction | consomme | déjà promue it3, `Lieux` était son 2e appelant annoncé |
| `localiserEntite('lieu', …)` | fonction | consomme | déjà promue it2 |
| `dossier:updated` | événement | émet | inchangé, via `update()` |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-lieu` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : créer le type `Lieu`, remplacer `Monde.lieux: Entite[]` par `Lieu[]`, déclarer la destination des 3 nouveaux champs, peupler les fixtures pour que la déclaration ne soit pas une ligne morte.
- **Fichiers** :
  - `src/brain/dossier/types.ts` (R) — `interface Lieu extends Entite`, `Monde.lieux: Lieu[]` (L291)
  - `src/brain/index.ts` (R) — `export type { Lieu }`
  - `src/brain/dossier/destinations.ts` (R) — 3 lignes, après `'monde.lieux[].nom'`
  - `src/brain/dossier/__fixtures__/dossier-minimal.json` (R) — les 3 champs sur `lieu.val-cendre` — **obligatoire, même geste que la ligne de destination (durci en veto tour 2, tech-lead) : les deux partent ensemble ou pas du tout**
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R) — au moins 1 lieu sur 5 porte les 3 champs
  - `src/brain/dossier/couverture.test.ts` (R) — 3 entrées sous une constante **neuve** (ex. `PROSE_D_ENTITE_LIBRE` — ne pas recopier `TEXTE_OPTIONNEL_LIBRE`, motif différent : prose optionnelle d'une entité, pas jumeau d'une condition)
- **Expose / consomme** :
  ```ts
  export interface Lieu extends Entite {
  	description?: string
  	ambiance?: string
  	dangers?: string
  }
  // Monde.lieux: Lieu[]
  ```
  ```ts
  'monde.lieux[].description': 'ia',
  'monde.lieux[].ambiance': 'ia',
  'monde.lieux[].dangers': 'ia',
  ```
- **Non touchés, vérifiables à l'octet** : `tables.ts`, `validate.ts`, `amorce.ts` (sentinelle `amorce.test.ts:107` — `SEME.monde.lieux` reste `[{ id: 'lieu.amorce' }]`, rien n'est semé), `identifiers.ts`, `sections.ts`.
- **Critères couverts** : #5, #8 (partiel)

### Lot 2 — `panneau-lieux` `feature`
- **Ouvrier** : `dev-lot`
- **But** : l'écran Lieux — liste + fiche, création, édition des 4 champs, retrait immédiat, câblage dans `DossierEditorScreen` via `App.tsx`, réécriture de l'assertion d'état-vide de l'index 3 (KR-187).
- **Fichiers** :
  - `src/features/dossier-canon/components/PanneauLieux.tsx` (N)
  - `src/features/dossier-canon/components/FicheLieu.tsx` (N, **conditionnel** — seulement si `PanneauLieux.tsx` dépasse ~350 lignes, KR-112 ; même propriétaire, aucune collision)
  - `src/features/dossier-canon/tests/panneauLieux.test.tsx` (N)
  - `src/features/dossier-canon/index.ts` (R) — `export { PanneauLieux }`
  - `src/App.tsx` (R) — `lieux: <PanneauLieux dossierId={route.dossierId} />`, après `depart:`
  - `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (R) — branche `index === 3`, sonde `PanneauLieux`, non-régression indices 0,1,2,4-9 (KR-187)
- **Expose / consomme** :
  ```ts
  import { useOpenDossier, frapperIdentifiant, localiserEntite,
           ListRow, Field, IconButton, type Lieu } from '../../../brain'

  export interface PanneauLieuxProps { dossierId: string }
  export function PanneauLieux({ dossierId }: PanneauLieuxProps): JSX.Element | null

  // écriture — patch étroit, précédent ObjectifsCanon.tsx :
  dossiers.update(dossierId, (d) => ({ canon: d.canon, monde: { ...d.monde, lieux }, charpente: d.charpente }))
  ```
- **Contraintes** :
  - `commit()` lit le retour de `dossiers.update()` et allume le bandeau `role="status"` sur `statut === 'refuse'` — **interdit** tout prédicat feature type `lieu.id === dossier.charpente.depart.lieu_id` en pré-vol : le SSOT est la seule autorité (garde vraie le jour où n°5/n°6 ajouteront des référents).
  - Retrait **immédiat**, aucun `Modal` (désaccord #1).
  - Sélection = `useState<string | null>` local, lieu courant calculé **en ligne** (`lieux.find(...) ?? null`) — jamais un `useEffect` de resynchronisation (KR-013/113).
  - Brouillons `Record<id, BrouillonLieu>`, garde d'absence en **lecture et mutation** (BUG-058, patron `ObjectifsCanon.tsx`).
  - Zéro import de `bascule-editeur` (KR-184). `PanneauSection.tsx`/`PANNEAU_PAR_SECTION` restent intouchés.
- **Critères couverts** : #1, #2, #3, #4, #6, #7, #8 (partiel)

*(2 lots. Aucun parallélisme réel : le lot feature dépend du contrat figé, même forme qu'it1/it3 — exécution séquentielle, pas un essaim à vagues.)*

## 6 — Critères d'acceptation

1. **Étant donné** un dossier ouvert sur la section Lieux, **quand** l'auteur clique « + Ajouter un lieu… », **alors** un nouveau lieu (id frappé par `frapperIdentifiant('lieu')`) est créé et persisté via `DossierService.update()`, apparaît dans la liste (repli « Lieu n°{index} (sans nom) »), devient la sélection courante et le focus se pose sur le champ Nom — *niveau : composant* — *lot 2*
2. **Étant donné** un lieu sélectionné, **quand** l'auteur modifie nom/description/ambiance/dangers et quitte le champ (blur), **alors** `DossierService.update()` persiste le nouveau lieu et une réouverture du dossier relit la valeur persistée — *niveau : composant* — *lot 2*
3. **Étant donné** une liste d'au moins deux lieux, **quand** l'auteur retire un lieu non référencé par `charpente.depart.lieu_id`, **alors** il est retiré immédiatement (sans confirmation), la liste passe de N à N-1 lignes et la sélection retombe sur le lieu précédent (ou le premier restant) — *niveau : composant* — *lot 2*
4. **Étant donné** le lieu actuellement référencé par `charpente.depart.lieu_id`, **quand** l'auteur tente de le retirer, **alors** `DossierService.update()` refuse (`statut:'refuse'`, code `reference-pendante`, déjà testé au niveau contrat), la liste reste inchangée à l'écran et un bandeau `role="status"` nomme l'anomalie — jamais un retrait optimiste suivi d'un rollback — *niveau : composant* — *lot 2*
5. **Étant donné** les 3 nouveaux champs de `Lieu`, **quand** `npm test` tourne, **alors** `couverture.test.ts` confirme qu'aucune des 3 lignes de `destinations.ts` n'est une ligne morte (instance présente dans `dossier-minimal.json`) et qu'aucune feuille de `Lieu` n'est sans destination déclarée — *niveau : contrat* — *lot 1*
6. **Étant donné** les 7 sections encore non livrées et les 2 sections Canon/Départ déjà livrées, **quand** l'écran d'édition se rend, **alors** elles restent inchangées — non-régression sur `dossierEditorScreen.test.tsx` (indices 0,1,2,4-9 intacts, seul l'index 3 réécrit) — *niveau : composant* — *lot 2*
7. **Étant donné** la section Lieux, **quand** un lieu est ajouté ou retiré avec succès, **alors** le compteur de la nav (`SECTIONS[3].compte()`, déjà câblé sur `monde.lieux.length`) se met à jour sans qu'aucune vue de cette feature ne recalcule elle-même une longueur (KR-013) — *niveau : composant* — *lot 2*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur : aucun import direct entre `dossier-canon` et `bascule-editeur`, aucune couleur en dur, `panneauDepart.test.tsx` et `amorce.test.ts` restent verts **sans être modifiés** (extension `Entite[]`→`Lieu[]` purement covariante) — *niveau : bout-en-bout* — *lot 1+2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `panneauLieux.test.tsx` — « ajout d'un lieu » | liste +1 ligne, sélection + focus sur Nom, persistance relue après réouverture | jest / composant | KR-183 | 2 |
| `panneauLieux.test.tsx` — « édition des 4 champs, blur, réouverture » | brouillon commité au blur, relecture identique après remount | jest / composant | KR-183, KR-013/113 | 2 |
| `panneauLieux.test.tsx` — « retrait d'un lieu non référencé » | suppression immédiate, N→N-1, sélection retombe sur `index-1`, focus suit | jest / composant | (patron BUG-058) | 2 |
| `panneauLieux.test.tsx` — « retrait du lieu de `charpente.depart` refusé » | liste inchangée, `role="status"` visible, aucun retrait optimiste | jest / composant | KR-183 (warnings/refus rendus) | 2 |
| `couverture.test.ts` (étendu) — « description/ambiance/dangers ont une destination déclarée, aucune ligne morte » | 2 assertions existantes (L293/L301) passent grâce aux 3 lignes + fixture peuplée dans le même lot | jest / contrat | KR-186 | 1 |
| `dossierEditorScreen.test.tsx` (réécrit) — « index 3 Lieux : sonde rendue » | sonde `PanneauLieux` affichée à l'index 3, indices 0,1,2,4-9 intacts (grep de non-régression) | jest / composant | KR-187 | 2 |
| `panneauDepart.test.tsx` — non modifié, doit rester vert | `Select` peuple depuis `Lieu[]` covariant, aucune édition requise | jest / composant, régression | — | garde (aucun fichier touché) |
| `amorce.test.ts:107` — non modifié, doit rester vert | `SEME.monde.lieux` reste `[{ id: 'lieu.amorce' }]`, rien n'est semé | jest / contrat, régression | — | garde (aucun fichier touché) |

Cas limites à couvrir : vide (0 lieu, gabarit dashed défensif, non normalement atteignable) · très long texte (pas de budget de mots sur `Lieu`, texte libre) · doublon de nom (aucune contrainte d'unicité) · référence orpheline (test dédié #4 ci-dessus) · double soumission / annulation (sans objet, pas de `Modal`, commit synchrone local).

**Non vérifiable en l'état** — aucun : chaque critère du § 6 est couvert par un test nommé ci-dessus ou par la couverture contrat déjà existante (`reference-pendante`, `validate.test.ts:270-278`).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM, Tech Lead *(pour)* / UX *(contre, après rétractation)* | Le retrait d'un lieu doit-il être gardé par un `Modal` de confirmation (CLAUDE.md § Dangerous Actions) ? | `REJETÉ` | Le seul cas réellement dangereux (le lieu de `charpente.depart`) est déjà bloqué par le SSOT (`reference-pendante`, `tables.ts:222`, `validate.test.ts:270`) et rendu par le bandeau Refus existant sans code neuf ; pour les autres lieux, le précédent déjà livré (`ObjectifsCanon`, it3) supprime un volume de prose comparable (4 champs, 2 multiligne) sans confirmation — un `Modal` ici créerait une incohérence d'interaction entre les 3 panneaux de la même feature sans gain de sécurité réel. Le rôle mandaté sur ce terrain (UX) a lui-même retiré sa proposition après vérification empirique du précédent. |
| 2 | Tech Lead | `PanneauLieux` est le 3ᵉ appelant réel du couple Refus/commit (`PanneauCanon`, `PanneauDepart`) — l'extraire maintenant vers `features/dossier-canon/hooks/`, comme l'anticipait l'`open_question` posée depuis it1/it2 ? | `REPORTÉ` | → `open_questions`, relevé au 4ᵉ appelant réel. Extraire maintenant imposerait de rouvrir deux fichiers déjà livrés et clos (`PanneauCanon.tsx`, `PanneauDepart.tsx`) au moment où la feature se termine, pour dédupliquer du JSX dont aucune ligne de comportement ne varie. |
| 3 | Tech Lead *(auto-révision tour 1 → tour 2)* | `description`/`ambiance`/`dangers` : destination `'auteur'` ou `'ia'` ? | `RETENU` | Lot 1 — `'ia'` pour les 3 champs. `'auteur'` est réservé aux notes de rédaction qui ne sont pas de la donnée de jeu (`destinations.ts:34-36`) ; un piège ou un prédateur décrit dans `dangers` EST de la donnée de jeu que le futur narrateur (Temps 2) devra lire, au même titre que `description`/`ambiance`. Aucun autre rôle n'a objecté sur ce point. |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(Aucune proposition hors-cadre marquée `INNOVATION` par un rôle à ce raffinage — section supprimée.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **sans objet** : aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (en particulier `panneauDepart.test.tsx` et `amorce.test.ts`, verts **sans modification**)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-canon-it4.revue.md`
- [ ] `bug_history.json` : si l'essaim ouvre une anomalie, scinder d'abord les 5 entrées `discovered_at='iteration-bascule-0'` vers `bug_history.features-terminees.json` (marge actuelle : 43 o sous le plafond de 15 KiB, contrainte déjà notée en `open_questions` de la feature)

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | Surface d'écriture (création + retrait) explicitement dans le lot 2 |
| Tech Lead | recevable sous réserve → réserves closes par l'arbitrage | Découpage 6+5 fichiers mesuré, fixtures/destinations atomiques (durci en veto, honoré au lot 1), Modal tranché par l'arbitrage (désaccord #1) |
| UX | recevable | Modal retirée après vérification du précédent `ObjectifsCanon` ; contrat de design complet sans `Modal` |
| QA | recevable sous réserve → réserve close par l'arbitrage | Tests nommés au § 7, y compris la non-régression `panneauDepart.test.tsx`/`amorce.test.ts` par garde de compilation plutôt que par réécriture |
