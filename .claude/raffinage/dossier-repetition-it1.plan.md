# Plan d'itération — `dossier-repetition` · itération `1`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-08
> Composition : 5 rôles — motif : l'itération touche le moteur (boucle de simulation), la frontière code/IA (KR-309, zéro appel modèle) et le dossier d'aventure (lecture du SSOT)
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut lancer une répétition synthétique de son dossier pour voir où le joueur s'arrête. » |
| **Tranche** | PanneauRepetition (écran) → repeter() (logique pure) → brain/dossier (session, commandes, contrôles, alea) + player/engine (rencontre, charCreation, fin) |
| **Lots** | 2 lots · dont `contrat` : oui (L1) |
| **Hors périmètre** | § 2 ci-dessous |
| **Reporté** | mort / combat_sans_issue (it2) · lieux/PNJ non atteints (it3) · règles ESLint UX (dette à déclencheur) |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur peut lancer une répétition synthétique de son dossier pour voir où le joueur s'arrête. »

## 2 — Hors périmètre

- **Motifs d'arrêt `mort` et `combat_sans_issue`** — it2, requiert la résolution de combat.
- **Lieux et PNJ non atteints** — it3, requiert l'analyse de couverture.
- **« Rejouer à l'identique »** — retiré : le rapport est dérivé en ligne de la graine, le bouton n'aurait aucun effet visible. Pas de report.
- **Héros étalon** — it2 : `REGLES-DU-JEU.md` → table dorée. It1 utilise un héros synthétique seedé.
- **Résolution de combat** — hors périmètre complet : un combat ouvert arrête la boucle (KR-312).
- **Persistance du rapport** — jamais (KR-310/013).
- **« Aucun blocage » (message positif)** — retiré : un seul parcours ne prouve pas l'absence de problème.
- **Échap ferme** — sans objet, ce n'est pas une modale.
- **Règles ESLint supplémentaires** (`--good`/`--bad` hors jets, `<button>` sans `--hit-target`) — dette à déclencheur, hors it1.

## 3 — Contrat de design

### Montage

Prop sœur `panneauRepetition?: (onSelectSection: (section: SectionId) => void) => ReactNode` dans `DossierEditorScreen`. Destination `'repetition'` après Copilote. `estSectionId` exclut la 3e destination (BUG-082). Ordre Contrôles / Copilote / Répétition épinglé par test.

### Composants

- `Card` (shadow={false})
- `Badge` (tone="neutral") pour « Parcours n°{n} »
- `ListRow` pour le lieu d'arrêt
- Boutons natifs locaux, styles sur tokens

### Tokens autorisés

`--surface-card`, `--surface-inset`, `--accent`, `--accent-bg`, `--accent-line`, `--text-on-accent`, `--text-strong`, `--text-body`, `--text-muted`, `--text-label`, `--font-ui`, `--font-mono`, `--fs-eyebrow`, `--fs-body`, `--fs-title`, `--fw-semibold`, `--space-*`, `--r-md`, `--border-*`, `--hit-target`.

**Interdits :** `--good*`, `--bad*`, valeurs en dur.

### États du panneau (3)

**1 — Invite (jamais lancé)**
- Fond `--accent-bg`, bordure pointillé `--accent-line`
- Texte : « Lancez la répétition : un joueur synthétique parcourt votre dossier et vous dit où il s'arrête. »
- Bouton : `Lancer la répétition` (accent, autoFocus)

**2 — À corriger (refus `dossier_injouable`)**
- Eyebrow : `RÉPÉTITION IMPOSSIBLE`
- Corps : message du premier bloquant
- Lien : « Corriger dans {section} » → `onSelectSection(bloquant.section)`

**3 — Résultat (rapport `ok: true`)**
- Eyebrow : `ARRÊT — PAS {n} SUR 20`
- Badge : `Parcours n°{graine}` (tone="neutral")
- Titre et corps par motif d'arrêt :
  - `fin` : « Le joueur synthétique a atteint la fin "{nom_fin}". » + ListRow du lieu
  - `impasse` : « Impasse pour un joueur qui ne fait qu'aller. » + ListRow du lieu
  - `combat_ouvert` : « Arrêté sur un combat ({monstre_ref}). La répétition ne le résout pas encore. » + ListRow du lieu
  - `pas_max` : « Le joueur synthétique a parcouru 20 pas sans atteindre de fin. » + ListRow du lieu
- Bouton : `Relancer` (accent, autoFocus) → graine + 1

### Voix et registre

- Le panneau parle à l'auteur **en 3e personne du joueur synthétique**. Jamais en 2e personne.
- Afficher `nom` (identifiant interne), jamais `description_joueur` ni `texte_ouverture_joueur`.
- Vocabulaire : « arrêt » partout, « impasse » pour le seul motif impasse, « blocage » n'apparaît nulle part.

### Clavier

Tab visuel, Entrée active le bouton focalisé, Échap sans effet.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `DomaineAlea` | type union | étendu | `'heros' \| 'jet' \| 'combat' \| 'repetition'` |
| `creerRng` | fonction | consomme | `creerRng(graine, 'repetition', pas)` — un rng par pas |
| `controlerDossier` | fonction | consomme | `.jouable` lu, jamais recalculé |
| `ouvrirSession` | fonction | consomme | `ouvrirSession(dossier, { graine_alea: graine })` |
| `fixerHeros` | fonction | consomme | `fixerHeros(session, heroState)` |
| `destinationsPossibles` | fonction | consomme | retourne les accès jouables |
| `executerCommande` | fonction | consomme | seul décideur de la jouabilité d'un accès |
| `useOpenDossier` | hook | consomme | le dossier reste une vue du SSOT |
| `rollCreationPool` | fonction | consomme (player/engine) | `rollCreationPool(rng)` |
| `buildHeroFromCreation` | fonction | consomme (player/engine) | affectation séquentielle |
| `ouvrirRencontreSiDue` | fonction | consomme (player/engine) | ouvre un combat si dû |
| `finAtteinte` | fonction | consomme (player/engine) | vérifie les conditions de fin |

## 5 — Lots

> Deux lots, séquentiels. Aucun fichier commun.

### Lot 1 — `alea-repetition` `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : Étendre `DomaineAlea` avec le domaine `'repetition'`
- **Fichiers** :
  - `src/brain/dossier/alea.ts` (R)
  - `src/brain/dossier/alea.test.ts` (R)
- **Expose** :
  ```ts
  export type DomaineAlea = 'heros' | 'jet' | 'combat' | 'repetition'
  // usage : creerRng(graine, 'repetition', pas) — un rng par pas, un seul tirage
  ```
- **Critères couverts** : #8

### Lot 2 — `repetition-it1`

- **Ouvrier** : `dev-lot`
- **But** : Implémenter `repeter()`, `PanneauRepetition`, câblage dans l'éditeur, gardes d'isolation
- **Fichiers** :
  - `src/features/dossier-repetition/utils/repeter.ts` (N)
  - `src/features/dossier-repetition/components/PanneauRepetition.tsx` (N)
  - `src/features/dossier-repetition/index.ts` (N)
  - `src/features/dossier-repetition/tests/repeter.test.ts` (N)
  - `src/features/dossier-repetition/tests/panneauRepetition.test.tsx` (N)
  - `src/features/dossier-repetition/tests/cablage.test.ts` (N)
  - `src/features/bascule-editeur/components/DossierEditorScreen.tsx` (R)
  - `src/features/bascule-editeur/tests/slotRepetition.test.tsx` (N)
  - `src/App.tsx` (R)
  - `src/features/play-mode/tests/moteurSansIA.test.ts` (R)
- **Consomme** :
  - Barrel `brain` : `controlerDossier`, `ouvrirSession`, `fixerHeros`, `destinationsPossibles`, `executerCommande`, `creerRng`, `useOpenDossier`, types `Controle`, `Dossier`, `SectionId`
  - `player/engine` : `finAtteinte` (pont), `ouvrirRencontreSiDue`, `rollCreationPool`, `buildHeroFromCreation`
- **Expose** (module `repeter.ts`, pas du barrel) :
  ```ts
  export const PAS_MAX = 20
  export type MotifArret = 'fin' | 'impasse' | 'combat_ouvert' | 'pas_max'
  export type RapportRepetition = {
    readonly graine: number
    readonly pas: number
    readonly lieu_id: string
  } & (
    | { readonly arret: 'fin'; readonly fin_id: string }
    | { readonly arret: 'combat_ouvert'; readonly monstre_ref: string }
    | { readonly arret: 'impasse' }
    | { readonly arret: 'pas_max' }
  )
  export type ResultatRepetition =
    | { readonly ok: true; readonly rapport: RapportRepetition }
    | { readonly ok: false; readonly refus: 'dossier_injouable'; readonly bloquant: Controle }
  export function repeter(dossier: Dossier, graine: number): ResultatRepetition
  ```
  Barrel `index.ts` : `PanneauRepetition` uniquement.
- **Critères couverts** : #1–#7

### Chaîne de `repeter` (ordre contraignant, pour l'ouvrier)

1. `controlerDossier(d).jouable` — sinon refus avec `bloquants[0]`.
2. `ouvrirSession(d, { graine_alea: graine })` → `fixerHeros(creerHerosSynthetique(creerRng(graine, 'heros', 0)))`.
3. `finAtteinte` au pas 0 — si fin → `{ arret: 'fin', fin_id, lieu_id, pas: 0 }`.
4. Boucle `pas = 1..PAS_MAX` :
   - `choisirDestination(destinationsPossibles(session), creerRng(graine, 'repetition', pas))` — liste vide → `impasse`.
   - `executerCommande(session, destination)` — refus → `impasse`.
   - `ouvrirRencontreSiDue(session)` — si `session.combat` → `combat_ouvert` avec `monstre_ref`.
   - `finAtteinte(session)` — si fin → `{ arret: 'fin' }` (la fin gagne sur le combat au même pas, KR-303).
   - À `PAS_MAX` sans sortie → `{ arret: 'pas_max' }`.

### `creerHerosSynthetique(rng)` — spécification (pour l'ouvrier)

- `rollCreationPool(rng)` → 8 jets.
- Affectation séquentielle : `rolls[i]` → `CHARACTERISTIC_VALUES[i]` (dans l'ordre du registre).
- Bonus 1D4 (`rollCreationPool` le fournit) : réparti un par un sur la caractéristique la plus basse (première en cas d'égalité).
- `buildHeroFromCreation('Héros synthétique', pool, assignment)`.
- Fonction privée au module `repeter.ts`, exportée pour test mais pas du barrel.

### `choisirDestination(accessibles, rng)` — spécification

- Fonction locale dans `repeter.ts`, pas exportée.
- Tire un index dans `accessibles` via `rng()`. Liste vide → retour `null` (impasse).
- Pas de rotation, pas de tri : un seul tirage, un seul accès tenté.

### Panneau — câblage

- Seul état local : `graine: number | null`. `null` = jamais lancé.
- Rapport dérivé en ligne par `useMemo(() => repeter(dossier, graine!), [dossier, graine])` quand `graine !== null`.
- `useOpenDossier(dossierId)` fournit le dossier (vue du SSOT).
- `DossierEditorScreen` : constante `DESTINATION_REPETITION = 'repetition'`, render-prop, même patron que Copilote.
- `App.tsx` : câblage du slot `panneauRepetition` dans `DossierEditorScreen`.
- `moteurSansIA.test.ts` : racine `features/dossier-repetition`, plancher 1.

## 6 — Critères d'acceptation

1. **ÉD** un dossier jouable et une graine **Q** `repeter(dossier, graine)` est appelé **A** le résultat est calculé sans fetch, sans CopiloteService, sans import de `play-mode/` — *unitaire* — *lot L2*
2. **ÉD** un dossier et une graine **Q** le panneau affiche un résultat **A** le rapport est dérivé en ligne par `useMemo`, aucun `useState` ne le stocke, aucun `PersistenceService` n'est appelé — *composant* — *lot L2*
3. **ÉD** un dossier linéaire de plus de 20 lieux **Q** `repeter(dossier, 1)` **A** `rapport.pas === 20` et `rapport.arret === 'pas_max'` — *unitaire* — *lot L2*
4. **ÉD** des dossiers couvrant chaque motif **Q** `repeter(dossier, graine)` pour chaque **A** les 4 motifs (fin, impasse, combat_ouvert, pas_max) sont produits, chacun avec ses champs discriminants (`fin_id`, `monstre_ref`, ou rien) — *unitaire* — *lot L2*
5. **ÉD** un dossier et graine=42 **Q** `repeter(dossier, 42)` appelé deux fois **A** les deux rapports sont `deepEqual` — *unitaire* — *lot L2*
6. **ÉD** un dossier non jouable **Q** `repeter(dossier, 1)` **A** `{ ok: false, refus: 'dossier_injouable', bloquant }` et le panneau affiche « Répétition impossible » avec lien vers `bloquant.section` — *composant* — *lot L2*
7. **ÉD** le panneau rendu avec un dossier jouable **Q** « Lancer la répétition » cliqué, puis « Relancer » **A** les 3 états sont visibles dans l'ordre (invite → résultat graine 1 → résultat graine 2), avec les textes du contrat de design — *composant* — *lot L2*
8. **ÉD** `DomaineAlea` **Q** `creerRng(42, 'repetition', 1)` et `creerRng(42, 'repetition', 2)` **A** les deux rng produisent des suites distinctes, et indépendantes des domaines `'heros'`, `'jet'`, `'combat'` — *contrat* — *lot L1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `alea.test.ts::repetition_meme_cle_meme_suite` | même graine+domaine+indice → même suite | contrat | — | L1 |
| `alea.test.ts::repetition_independance_domaines` | `'repetition'` indépendant de `'heros'`, `'jet'`, `'combat'` | contrat | — | L1 |
| `alea.test.ts::repetition_pas_distincts` | indices distincts → suites distinctes | contrat | — | L1 |
| `repeter.test.ts::fin_pas_0` | fin atteinte dès l'ouverture → arret='fin', pas=0, fin_id | unitaire | KR-310 | L2 |
| `repeter.test.ts::fin_pas_n` | fin atteinte au pas n > 0 | unitaire | — | L2 |
| `repeter.test.ts::combat_ouvert_avec_monstre_ref` | arrêt sur combat, monstre_ref présent | unitaire | KR-312 | L2 |
| `repeter.test.ts::combat_et_fin_meme_pas` | fin l'emporte sur combat au même pas | unitaire | KR-303 | L2 |
| `repeter.test.ts::impasse_pas_0` | aucune destination au départ → impasse | unitaire | — | L2 |
| `repeter.test.ts::impasse_pas_n` | destination refusée → impasse au pas n | unitaire | — | L2 |
| `repeter.test.ts::va_et_vient_PAS_MAX` | dossier cyclique → arret='pas_max', pas=20 | unitaire | KR-315 | L2 |
| `repeter.test.ts::reproductibilite_graine` | `repeter(d,42)` === `repeter(d,42)` | unitaire | KR-310 | L2 |
| `repeter.test.ts::dossier_injouable` | dossier non jouable → refus avec bloquant | unitaire | — | L2 |
| `repeter.test.ts::graines_differentes_parcours_differents` | graine 1 ≠ graine 2 quand le dossier a ≥ 2 accès | unitaire | — | L2 |
| `panneauRepetition.test.tsx::invite` | texte d'invite + bouton « Lancer la répétition » | composant | — | L2 |
| `panneauRepetition.test.tsx::resultat_fin` | eyebrow ARRÊT, texte fin, ListRow lieu | composant | — | L2 |
| `panneauRepetition.test.tsx::refus_dossier_injouable` | eyebrow IMPOSSIBLE, lien section | composant | — | L2 |
| `panneauRepetition.test.tsx::relancer_incremente` | Relancer → graine +1 | composant | — | L2 |
| `cablage.test.ts::zero_import_ia` | aucun CopiloteService/fetch/ia/ dans la feature | contrat | KR-309 | L2 |
| `slotRepetition.test.tsx::3e_slot_present` | DossierEditorScreen rend panneauRepetition | composant | — | L2 |
| `moteurSansIA.test.ts::racine_dossier_repetition` | feature balayée, plancher 1 | contrat | KR-309/313 | L2 |

**Non vérifiable en l'état** : aucun.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | TL | Veto : `DomaineAlea` clos, `'repetition'` requis | `RETENU` | Lot L1 contrat |
| 2 | TL | « Rejouer à l'identique » sans effet | `RETENU` | Retiré de l'it1, sans report |
| 3 | TL | Aucun pré-filtre : `executerCommande` décide seul | `RETENU` | Pas de rotation ni de filtre dans repeter |
| 4 | TL | Un seul refus, `ouverture_a_ecrire` inatteignable | `RETENU` | Un seul état « à corriger » |
| 5 | TL | KR-309/313 couverts par lint, pas de test sur mesure | `RETENU` | `lintIsolation` + `moteurSansIA` dérivés du disque |
| 6 | PM | 8 critères max, ventilés par itération | `RETENU` | 8 critères it1, motifs it2/it3 reportés |
| 7 | PM | « Aucun blocage » positif non fondé | `RETENU` | Copie factuelle, aucun vert |
| 8 | PM | `ouverture_a_ecrire` pas d'état propre, Échap sans objet | `RETENU` | 3 états, Échap inerte |
| 9 | UX | `Chip`/`CardHead` n'existent pas | `RETENU` | Badge neutral + eyebrow local |
| 10 | UX | 4 états faux → 3 | `RETENU` | 3 états : invite, résultat, à corriger |
| 11 | UX | Cible du lien = `bloquants[0].section` | `RETENU` | Pas seulement « Jalons & fins » |
| 12 | UX | Vocabulaire « arrêt » partout, « blocage » nulle part | `RETENU` | Contrat de design |
| 13 | UX | Règles ESLint (`--good`/`--bad`, `--hit-target`) | `REPORTÉ` | Dette à déclencheur, hors it1 |
| 14 | QA | Scinder critère 3 (4 motifs it1, 2 it2) | `RETENU` | 4 motifs it1, 2 motifs it2 |
| 15 | QA | moteurSansIA : 4e racine, plancher à re-mesurer | `RETENU` | Racine = feature entière, plancher 1 (TL) |
| 16 | QA | KR-312 : combat_ouvert = arrêt, pas défaut | `RETENU` | Motif d'arrêt, état « résultat », pas « à corriger » |
| 17 | NIA | Affectation héros spécifiée avant le code | `RETENU` | Séquentielle, bonus sur la plus basse |
| 18 | NIA | `choisirDestination` isolé comme site d'appel | `RETENU` | Fonction locale dans repeter.ts |
| 19 | NIA | 3e personne du joueur synthétique | `RETENU` | Contrat de design |
| 20 | NIA | Noms internes seulement | `RETENU` | Contrat de design |
| 21 | TL (annexe t1) | Registre de politiques (Strategy) | `REJETÉ` | Un seul appelant, abstraction prématurée |
| 22 | TL (annexe t1) | `avancerPas` commun | `REJETÉ` | Déjà rejeté au cadrage |
| 23 | TL (annexe t1) | Rapport en `useState` | `REJETÉ` | Miroir périssable (KR-305/013) |
| 24 | TL (annexe t1) | Exécuteur dans `brain/` | `REJETÉ` | Arête `brain→player` interdite |
| 25 | TL (annexe t2) | Rotation des accès | `REJETÉ` | Accès pendant refusé au SSOT, un seul tirage suffit |

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-repetition-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | 8 critères ventilés, L1 avant L2, 3 états |
| Tech Lead | recevable sous réserve | lot contrat L1, un seul refus |
| UX | recevable | — |
| QA | recevable sous réserve | 9 témoins nommés, scission actée |
| Narratif & IA | recevable sous réserve | affectation héros spécifiée |
