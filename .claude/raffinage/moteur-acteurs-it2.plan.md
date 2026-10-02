# Plan d'itération — `moteur-acteurs` · itération 2

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-02
> Composition : `5 rôles` — motif : nouveau rôle IA étendu (R4 gagne un choix borné), moteur, dossier d'aventure.
> Exécution : `essaim` (2 lots, dont un lot contrat volumineux)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur voit un PNJ confier, dans sa réplique, le savoir dont le joueur vient de remplir la condition posée — visible aussitôt dans son carnet d'indices. » |
| **Tranche** | `PlayerInputBar` (le joueur parle, comme en it1) → R1 (inchangé) → R4 reçoit désormais un bloc « ce qu'il peut confier » (rangs des savoirs déjà éligibles, calculés par le moteur) → R4 choisit, dans `indices_reveles`, lesquels confier dans CETTE réplique → le moteur re-vérifie et applique (`reveler_indice`, `a_dit`, `recit`) → le carnet (nouveau, vue dérivée du journal) affiche la révélation. |
| **Lots** | 2 lots · dont `contrat` : oui (lot A, seul et en premier) |
| **Hors périmètre** | `confiance_min`, `jet` (portes toujours FERMÉES, leur mécanisme n'existe pas) ; `contrepartie.consomme:true` (porte structurellement fermée, aucun retrait d'objet en it2) ; verbe `donner <objet> <pnj>` ; relations/`cede_si` ; `JournalRow.tsx` (registre développeur-débogueur, déjà conforme) ; règle `dossier-controles.ts` sur `consomme` inerte. |
| **Reporté** | `consomme:true` → verbe `donner` futur (consentement structuré). Modèle qui ne confie jamais un rang offert → résidu de playtest (KR-229), aucune échéance forcée en it2. |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur voit un PNJ confier, dans sa réplique, le savoir dont le joueur vient de remplir la condition qu'il avait posée (un objet déjà en sa possession, ou un autre indice déjà obtenu — conjonction stricte des deux portes `contrepartie`/`apres_indice_id`, `confiance_min`/`jet` restant fermées) — et retrouve cet indice, visible, dans son carnet. Le moteur calcule l'ensemble des savoirs déjà éligibles (fail-closed, conjonction ET) ; R4 choisit, dans cet ensemble borné et seulement dedans, lequel confier à cette réplique précise (`ReponseActeur.indices_reveles`, au plus un par réplique) ; le moteur re-vérifie avant d'écrire et applique (`reveler_indice`, `a_dit`, `recit`). Le carnet est une vue dérivée du journal, zéro état neuf.

## 2 — Hors périmètre

- `confiance_min`, `jet` — portes toujours FERMÉES (fail-closed, KR-280), leur mécanisme n'existe pas avant it3/it4.
- `contrepartie.consomme:true` — porte structurellement fermée en it2 : aucun objet n'est retiré. Le champ `consomme` reste écrit au schéma (Temps 1), simplement non appliqué. Reporté via un futur verbe `donner <objet> <pnj>` (consentement structuré du joueur), seul chemin légitime de retour.
- Verbe `donner` lui-même — hors périmètre, aucune nouvelle commande en it2.
- `relations[]`/`cede_si` — toujours hors contexte R4 (inchangé depuis it1).
- `JournalRow.tsx` — affiche un identifiant brut (`[reveler_indice:indice.xxx]`) pour toute entrée portant ce delta : **conforme, pas un défaut**. Le Journal est le registre développeur-débogueur de l'Aperçu du jeu (`EcranPartie.tsx:226-228`, `docs/EXIGENCE-APERCU-DU-JEU.md` § 5), distinct du registre joueur que porte le carnet. Aucun lot ne le touche.
- Règle `dossier-controles.ts` signalant un `consomme:true` inerte — `controles.ts` porte sa propre dette à déclencheur, non rouverte ici.
- `BandeauHeros.tsx` — écarté comme point de montage du carnet (promesse « stats lecture seule » du composant).

*(Écrit par le PM.)*

## 3 — Contrat de design

**Composants** : `CadrePartie.tsx` (étendu, prop `actionsEntete?: ReactNode`, header à deux enfants, aucun changement pour `EcranRefus.tsx`), `IconButton` 🗝 (existant), `Modal` (étendu, `hideFooter?: boolean`), `ListRow` (étendu, `onSelect?` optionnel → `<div>` non focusable si absent), `Badge tone="neutral"` (compteur total, masqué si 0).

**Point de montage, nommé explicitement (évite BUG-142)** : le bouton 🗝 + son compteur (`ActionsCarnet`, composant interne à `EcranPartie.tsx`, sous le seuil KR-112) entrent dans le header de `CadrePartie` via `actionsEntete`, monté UNIQUEMENT par `PartieEnCours` dans `EcranPartie.tsx` — jamais sur l'écran de création de héros (aucun indice révélable avant que le héros existe). `CarnetIndices` (composant neuf) se monte en fragment à côté de `CadrePartie`, affiché conditionnellement (`carnetOuvert`).

**Textes exacts**
| Élément | Texte |
|---|---|
| `aria-label` de l'`IconButton` | `Carnet d'indices` |
| Titre de la `Modal` | `Carnet d'indices` (sentence case, aligné sur les 5 `Modal` existantes) |
| État vide | `Aucun indice découvert pour l'instant — explorez, parlez, fouillez.` |
| Libellé de ligne (`ListRow.subtitle`) | `#{tour} — {VERBE}`, ex. `#4 — PARLER` |

**Contenu d'une ligne du carnet** : `ListRow.title` = `recit` de l'entrée qui porte `{delta:'reveler_indice', effet:'applique'}` — **garanti porter de la vraie prose** (la réplique réelle du PNJ, écrite par `consignerReponseActeur` dans le même geste que le delta, jamais un gabarit mécanique `'indices_connus : <id>'`). `ListRow.subtitle` = `#tour — VERBE`, dérivé du journal. **Jamais `monde.indices[].nom`** (audience `auteur`, peut contredire `Indice.verite`).

**États** : vide (placeholder + glyphe, mêmes tokens que l'état vide déjà défini dans `EcranPartie.tsx`, dupliqués ou exportés au choix du Tech Lead — jamais réinventés) · liste (`ListRow` lecture seule par `ListRow`). Compteur total (`indices_connus.length`), masqué si 0, pas de distinction « lu/non lu ».

**Clavier** : `IconButton` natif, Tab/Entrée/Espace standard. `Modal` capture et restaure le focus (déjà câblé). Piège de focus déjà écrit dans `Modal.tsx` ; avec `ListRow` non focusable, seul `✕ Fermer` reste focusable dans le tiroir. `Échap` → `onFermer` → focus revient sur 🗝.

**Discipline de l'accent** : aucun usage nouveau. **Zéro valeur en dur** : tokens déjà existants (`--space-3/8/10`, `--bw-strong`, `--border-field`, `--r-xl`, `--paper-1`, `--fs-h1`, `--text-faint`, `--text-muted`, `--lh-body`, `--font-mono`, `--fs-meta`, `--font-ui`, `--fs-body`).

**ESLint proposée** : test greppable verrouillant KR-286 — « `play-mode/components/**` ne lit jamais `.indices[` suivi de `.nom` ».

*(Écrit par l'UX.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `brain/dossier/revelation.ts` (nouveau) | registre | émet | `evaluerSavoir(dossier, faits, personnageId, savoir): EtatSavoir` (`'absent'\|'revelable'\|'deja_confie'`) ; `savoirsRevelables(dossier, faits, personnageId): readonly string[]` ; `savoirsDejaConfies(...)`. Fail-closed, conjonction stricte, délègue à `PREDICATES.possede_objet`/`indice_connu`. NON exporté par `brain/index.ts` (doctrine `PREDICATES`/`DELTAS`). |
| `brain/dossier/recit.ts` | registre | émet | `consignerReponseActeur(session, pas, dossier, {recit, personnageId, indicesReveles: readonly string[]}): EtatSession` — SEUL écrivain combiné de `recit`+`reveler_indice`+`a_dit` sur la même entrée. Lève si un id n'est plus `revelable` à la ré-évaluation (précondition KR-238, appelant fautif). `consignerNarration` intacte, non touchée. |
| `brain/copilote/types.ts` | type | émet | `ReponseActeur { replique: string; indices_reveles: readonly string[] }` — IDENTIFIANTS, jamais des rangs (résolus par `CopiloteService`). `SortieActeurBrute` (type intermédiaire côté validateur, rangs bruts) distinct de `ReponseActeur`. |
| `brain/copilote/schemaSortie.ts` | registre | émet | `CLES_SORTIE_ACTEUR = ['replique','indices_reveles']` (toujours exigées) ; `REVELATIONS_PAR_REPLIQUE_MAX = 1` ; `validerActeur(brut, dossier, rangsOuverts: ReadonlySet<RangInjecte>)` — prédicats étendus (tableau, chaînes, longueur ≤1, chaque élément ∈ `rangsOuverts`, motif `rang-inconnu`, membre existant). Liste vide = succès. |
| `brain/copilote/contexte/acteur.ts` | registre | émet | Deux blocs neufs (« CE QUE TU LUI AS DÉJÀ CONFIÉ », « CE QUE TU PEUX CONFIER », rangs `S<n>` recalculés à chaque appel, jamais persistés). `assemblerActeur` rend `ReadonlyMap<RangInjecte,string>` (table des rangs → indice_id), seule source de `validerActeur` et de la re-résolution. |
| `brain/CopiloteService.ts` | service | émet | `demanderActeur` étendu : calcule `rangsOuverts`, valide, re-résout en identifiants (`Map.get`, jamais côté modèle — précédent `demanderDetenteurs`). |
| `worker/index.ts` | registre | émet | `GABARIT_SORTIE.acteur`/`INVITES.acteur.systeme` étendus, `BUDGET_CARACTERES_ACTEUR` re-mesuré sur la fixture enrichie (×3). |
| `brain/components/Modal.tsx` | composant | émet | `hideFooter?: boolean` (défaut `false`), additif, zéro régression sur les 5 appelants existants. |
| `brain/components/ListRow.tsx` | composant | émet | `onSelect?: () => void` optionnel → `<div>` non focusable si absent, mêmes styles moins `cursor:pointer`. Additif. |
| `brain/dossier/types.ts` `Revelation.contrepartie.consomme` | — | consomme | lu mais JAMAIS appliqué en it2 (porte structurellement fermée si `true`) |
| `brain/dossier/types.ts`/`destinations.ts`/`validate.ts` | — | — | **INTOUCHÉS** (KR-284, Décision A) |

## 4 bis — Contrat de sortie IA

### Entrée injectée — `acteur.ts`, deux blocs neufs après `TU AS DIT`, avant `ICI`
```
CE QUE TU LUI AS DÉJÀ CONFIÉ
· tu le crois · <formulation_joueur>

CE QUE TU PEUX CONFIER
S1 · tu le sais · <formulation_joueur> · <revele_comment si rédigé>
```
- Libellé de certitude via un `Record<Certitude, string>` exhaustif.
- Rangs `S1…Sk` SEULEMENT pour les savoirs `revelable` (évaluateur déjà passé, fail-closed) dans l'ordre de la fiche ; les lignes « déjà confié » n'ont ni rang ni didascalie.
- Un savoir `absent` (fermé, ou sans `formulation_joueur` rédigée) n'apparaît dans AUCUN bloc — aucun drapeau visible du modèle.
- N'entrent jamais : `indice_id`, `Indice.nom`, `Indice.verite`, `revele_si` et ses champs, l'objet de la contrepartie, `a_dit`/`indices_connus` bruts, les savoirs d'un autre PNJ.

### Schéma de sortie
```
{"replique": "…", "indices_reveles": []}
```
`CLES_SORTIE_ACTEUR` toujours les deux clés, même si `indices_reveles` vide (succès, pas un refus — refuser la franchise pousserait à la complaisance). `REVELATIONS_PAR_REPLIQUE_MAX = 1`. Prédicats : (1-8 inchangés d'it1) + (9) tableau + (10) chaînes + (11) longueur ≤1 + (12) chaque élément ∈ `rangsOuverts` (motif `rang-inconnu`, refus atomique, toute la sortie y compris la réplique).

### Échec de validation
Rang hors table (inventé, ou pris dans « déjà confié ») → `rang-inconnu` → rejeu une fois (KR-230) → second échec → `illisible` → KR-283 (aucune réplique, aucune révélation, aucun `a_dit`, bannière existante). Jamais d'acceptation partielle.

### Application (code, après validation)
`consignerReponseActeur` : (1) re-constate avec le MÊME évaluateur que chaque id est `revelable` (sinon lève, appelant fautif) ; (2) `appliquerDelta(reveler_indice)` ; (3) `pnj[id].a_dit += id` (premier écrivain RUNTIME du dépôt) ; (4) `recit = replique` sur la même entrée ; (5) une session rendue, persistée une fois. Aucun `retirer_objet` en it2.

### Ce que l'IA ne fait PAS
Elle ne décide jamais qu'une porte est ouverte (le code l'a déjà évalué avant l'appel) ; elle ne choisit que DANS un ensemble déjà fermé ou ouvert. Dés, stats, inventaire — inchangés depuis it1.

*(Écrit conjointement par le Tech Lead et Narratif & IA.)*

## 5 — Lots

### Lot A — `contrat-revelation` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : évaluateur conjonctif fail-closed des portes `contrepartie`/`apres_indice_id`, écriture combinée réplique+révélation+mémoire, extension du schéma de sortie R4, extensions additives de deux primitives `brain/components/`.
- **Fichiers** :
  - `src/brain/dossier/revelation.ts` (N) + `revelation.test.ts` (N)
  - `src/brain/dossier/recit.ts` (R) + `recit.test.ts` (R)
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R) — Harek gagne un `savoirs[]` gardé par `contrepartie`(consomme:false)+`apres_indice_id` en conjonction, `formulation_joueur` rédigée (aucun PNJ atteignable ne porte cette conjonction aujourd'hui) ; un second savoir de test avec `formulation_joueur` vide ; un troisième sans `revele_si`
  - `src/brain/copilote/types.ts` (R)
  - `src/brain/copilote/schemaSortie.ts` (R) + `schemaSortie.test.ts` (R)
  - `src/brain/copilote/contexte/acteur.ts` (R) + `acteur.test.ts` (R)
  - `src/brain/CopiloteService.ts` (R) + `CopiloteService.test.ts` (R)
  - `worker/index.ts` (R) + `worker/index.test.ts` (R) + `worker/frontiere.test.ts` (R)
  - `src/brain/components/Modal.tsx` (R) + `Modal.test.tsx` (N)
  - `src/brain/components/ListRow.tsx` (R) + `ListRow.test.tsx` (R)
  - `src/brain/dossier/controles.test.ts` (R) — **ajouté après coup (revue tech-lead PR, 2e passage)** : `recit.ts` construit littéralement `{delta:'reveler_indice', …}` pour `appliquerDelta`, rejoignant la marque qu'un test de non-duplication limitait à `atteignabilite.ts`. Array attendu étendu à `['atteignabilite.ts','recit.ts']`, commentaire distinguant FILTRE (compte un producteur) d'APPLIQUE (construit l'effet) — ricochet légitime et nécessaire, pas un fichier hors périmètre.
  - `src/brain/dossier/commandes.ts` (R) — **ajouté après coup (revue tech-lead PR, 3e passage, BUG-145/146)** : malgré le retrait de ce fichier du lot contrat (§ 8, désaccord #8), un troisième correctif sur le libellé du carnet (BUG-143 → BUG-145) a dû y ajouter une fonction exportée `verbeDeCommande(id)` pour que `CarnetIndices.tsx` (Lot B) lise le verbe sans importer `COMMANDES` directement — la frontière `commandes.test.ts`/KR-260 réserve cet import au seul `useTourDeJeu.ts`. Zéro réouverture du mécanisme écarté en tour 2 (`TRANSITIONS.parler` inchangé) : une seule fonction pure ajoutée, même forme que `verbesDisponibles()` déjà présente.
- **Expose / consomme** : signatures figées au § 4
- **Critères couverts** : #1 à #6, #8

### Lot B — `carnet-indices` `feature`
- **Ouvrier** : `dev-lot`
- **But** : câbler l'appel R4 étendu dans la boucle de jeu, monter le carnet d'indices.
- **Fichiers** :
  - `src/features/play-mode/components/CarnetIndices.tsx` (N) + `CarnetIndices.test.tsx` (N)
  - `src/features/play-mode/components/CadrePartie.tsx` (R) + `CadrePartie.test.tsx` (N)
  - `src/features/play-mode/components/EcranPartie.tsx` (R) + `EcranPartie.test.tsx` (R)
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R) + `useTourDeJeu.test.ts` (R)
- **Expose / consomme** : consomme le Lot A entier (figé)
- **Critères couverts** : #5 (affichage), #7

*(2 lots, sous le plafond de 4.)*

## 6 — Critères d'acceptation

1. **Étant donné** un savoir gardé par `contrepartie`(consomme:false) ET `apres_indice_id`, **quand** les deux conditions sont vraies, **alors** l'évaluateur rend `'revelable'` ; **quand** UNE SEULE est vraie (cas A : contrepartie seule, cas B : apres_indice_id seule), **alors** il rend `'absent'`. — *contrat* — *lot A*
2. **Étant donné** un savoir dont `confiance_min` ou `jet` est posé (même si `contrepartie`/`apres_indice_id` sont vrais), **quand** l'évaluateur est appelé, **alors** il rend `'absent'` — fail-closed, jamais ouvert par vacuité. — *contrat* — *lot A*
3. **Étant donné** un indice sans `revele_si`, ou dont `formulation_joueur` est absente/vide, **quand** l'évaluateur est appelé, **alors** il rend `'absent'`, zéro ligne injectée à R4. — *contrat* — *lot A*
4. **Étant donné** une sortie R4 proposant un rang gardé par `contrepartie.consomme:true`, **quand** `validerActeur` l'examine, **alors** TOUTE la sortie est refusée (réplique comprise), aucun `reveler_indice`/`a_dit` écrit. — *contrat* — *lot A*
5. **Étant donné** un rang hors de `rangsOuverts` (inventé, ou pris dans le bloc « déjà confié »), **quand** `validerActeur` l'examine, **alors** refus `rang-inconnu`, toute la sortie refusée ; **étant donné** `indices_reveles: []`, **alors** c'est un SUCCÈS (jamais un refus). — *contrat* — *lot A*
6. **Étant donné** un savoir déjà confié (`a_dit`), **quand** l'évaluateur est appelé, **alors** il rend `'deja_confie'` (testé EN PREMIER, avant les portes), sans rang, sans didascalie — et reste `'deja_confie'` même si une porte se referme ensuite. — *contrat* — *lot A*
7. **Étant donné** une révélation appliquée (`reveler_indice`, `effet:'applique'`), **quand** le carnet s'affiche, **alors** chaque ligne est une jointure sur cette entrée de journal (libellé dérivé, jamais `monde.indices[].nom`), le corps = `recit` réel (jamais un gabarit mécanique) ; **étant donné** aucune révélation, **alors** état vide affiché, zéro `ListRow`. — *composant* — *lot B*
8. **Étant donné** le périmètre balayé par `moteurSansIA.test.ts`, **quand** cette itération est livrée, **alors** aucun nouveau fichier n'entre dans l'exclusion nommée hors de ceux qui appellent réellement `CopiloteService`. — *contrat* — *lot A*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `revelation.test.ts` — conjonction ET | 5 branches (A/B/C/D/E), seule C (les deux vraies, rien d'autre posé) rend `revelable` | contrat | KR-280 | A |
| `revelation.test.ts` — vacuité | savoir sans `revele_si`, ou avec `{}` → `absent`, jamais `revelable` par `every()` fautif | contrat | KR-280 | A |
| `revelation.test.ts` — contenu | `formulation_joueur` absente/vide → `absent` du contexte (fixture : indice sans contenu) | contrat | — | A |
| `revelation.test.ts` — mémoire | `a_dit` testé en premier ; `deja_confie` résiste à la fermeture ultérieure d'une porte | contrat | KR-013/175 | A |
| `schemaSortie.test.ts` — `validerActeur` | `consomme:true` → refus total ; rang hors `rangsOuverts` → `rang-inconnu`, refus total ; liste vide → succès | contrat | KR-230 | A |
| `acteur.test.ts` — isolation des blocs | PNJ A ≠ PNJ B, aucun savoir de B dans le contexte de A ; aucune clé `revele_si`/`a_dit` brute injectée | contrat | KR-282 | A |
| `recit.test.ts` — écriture combinée | `consignerReponseActeur` pose `recit`+`reveler_indice`+`a_dit` sur la MÊME entrée, lève si id non `revelable` | contrat | KR-238 | A |
| `CarnetIndices.test.tsx` — jointure | ligne = entrée `reveler_indice`/`applique`, libellé dérivé, corps = `recit` réel ; état vide si aucune révélation | composant | KR-286 | B |
| `grep porteOuverte` | aucun appelant hors `atteignabilite.ts` (jamais réutilisée au runtime de révélation) | contrat | — | A |
| `lintIsolation.test.ts` | exclusion `moteurSansIA` inchangée | contrat | KR-260 | A |

Cas limites couverts : savoir sans porte · porte non câblée (confiance_min/jet) malgré les deux autres vraies · indice sans contenu écrit · `consomme:true` tenté par R4 · rang inventé · rang pris dans le mauvais bloc · déjà confié, porte refermée ensuite · indice connu par une autre source (jalon) mais pas confié par ce PNJ · carnet vide · double révélation du même indice (idempotence, no-op).

**Non vérifiable en l'état** — à recopier dans la revue : le modèle cite un rang sans confier le savoir dans sa réplique (ou l'inverse) — KR-229, playtest. Un modèle avare qui ne cite jamais un rang offert — résidu accepté, pas d'échéance forcée en it2.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | Tech Lead ↔ Narratif-IA | Révélation 100% structurelle (zéro IA) vs « catalogue borné » (R4 choisit dans un ensemble déjà fermé/ouvert par le code) | `RETENU` | Catalogue borné — Tech Lead se rallie entièrement après vérification au code : précédent exact déjà livré 4 fois (`validerDetenteurs`/`demanderDetenteurs`, R1/`destinationsPossibles`). La version structurelle rouvrait une décision déjà actée au cadrage (AC#4, `brain_contracts`, KR-285) sans mandat. **Nouveau KR-287** : le patron « catalogue borné » (le moteur calcule/ferme un ensemble, le modèle choisit dedans par rang, le moteur re-vérifie avant d'appliquer) est conforme à KR-280 et réutilisable sans re-débat en it3 (confiance)/it4 (jet). |
| 2 | PM (tour1) → PM lui-même (tour2) | `contrepartie.consomme:true` câblé en it2 | `REJETÉ` | Narratif-IA : le modèle ne décide jamais d'une perte d'inventaire, même indirectement. PM retire sa proposition initiale. Reporté en `open_questions` (verbe `donner` futur). |
| 3 | Narratif-IA → UX | `JournalRow.tsx` affiche un identifiant brut d'auteur | `REJETÉ` (non-défaut) | UX vérifie : registre développeur-débogueur de l'Aperçu du jeu, déjà établi depuis l'itération jalons (n°9). Le carnet reste le seul affichage en registre joueur. |
| 4 | UX | L'entrée qui porte la révélation doit porter de la vraie prose, jamais un écho mécanique `'indices_connus : <id>'` | `RETENU` | Orthogonal au désaccord #1. Résolu par construction dans `consignerReponseActeur` (Lot A) : `recit` = la réplique réelle, toujours, aucun repli nécessaire. |
| 5 | UX | `Modal.hideFooter`/`ListRow.onSelect?` | `RETENU` | Extensions additives, migrées au Lot A (brain/components/, contrat) sur la propre règle du Tech Lead. |
| 6 | Tech Lead (tour1) | Hedge `EcranPartie.tsx` OU `BandeauHeros.tsx` pour le montage du carnet | `RETENU` | Mécanisme UX exact adopté (`CadrePartie`+`actionsEntete`) ; `BandeauHeros.tsx` écarté (promesse « lecture seule » du composant). |
| 7 | QA | Réutilisation possible de `porteOuverte` pour l'évaluateur de révélation | `REJETÉ` | Polarité inverse confirmée (analyse statique optimiste vs évaluation runtime fermée par défaut) — jamais réutilisée, témoin greppable au § 7. |
| 8 | Tech Lead (tour1) | `commandes.ts`/`commandes.test.ts` dans le lot contrat | `REJETÉ` (son propre retrait) | Erreur de mécanisme identifiée au tour 2 : `TRANSITIONS.parler` ne pose que la garde structurelle, l'écriture combinée vit dans `recit.ts`/`useTourDeJeu.ts`. Retiré du lot. |
| 9 | — | Modèle avare qui ne cite jamais un rang offert | `REPORTÉ` | Résidu de playtest (KR-229), aucune échéance forcée en it2 — une échéance serait une règle neuve, à écrire d'abord dans `REGLES-PLAY.md`. |

## 9 — Innovation

*(aucune proposition `INNOVATION` — supprimé)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — non dû (aucun des 4 fichiers de règles touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-acteurs-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — `indices_reveles` confirmé au schéma, `consomme:true` tracé en `open_questions` |
| Tech Lead | recevable | oui — veto de tour 1 retiré intégralement, lots révisés |
| UX | recevable | oui — point `JournalRow.tsx` clos (non-défaut), prose garantie par `consignerReponseActeur` |
| QA | recevable sous réserve | oui — scénario séparateur à 5 branches, prérequis fixture nommé |
| Narratif & IA | recevable sous réserve | oui — catalogue borné retenu, `consomme:true` fermé |
