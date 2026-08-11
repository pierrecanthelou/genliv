# Plan d'itération — `dossier-fiches` · itération `1`

> Statut : `validé` (2026-08-11) — porte 1 (mécanique) verte, porte 2 (humaine) franchie
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-11
> Composition : `5 rôles` — motif : cette itération touche `brain/dossier/types.ts` (le dossier d'aventure) ; `dossier-fiches` (n°4) est nommément listée par `docs/ROADMAP-BASCULE-IA.md` § 4 comme feature à 5 rôles.
> Exécution : `essaim` (3 lots : 1 `contrat` puis 2 `feature` en parallèle)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « L'auteur peut situer un nouveau personnage dans son histoire — son nom, son camp, son plan, l'objectif auquel il se rattache. » |
| **Tranche** | Écran (`PanneauPersonnages`/`FichePersonnage`/`Accordion`, section Personnages de l'éditeur de dossier) → service `brain/` (`DossierService.update()`, patch étroit sur `monde.personnages`) → persistance (`PersistenceService` sous la clé du dossier, via le clone gelé rendu par `validateDossier`) |
| **Lots** | 3 lots · dont `contrat` : 1 (lot 1, seul et en premier) |
| **Hors périmètre** | Retrait d'un personnage · fonction/apparence/description_joueur/caractéristiques (it2) · objectif prose + plan d'actions + contre-mesures (it3) · savoirs/relations/présence (it4) · curseurs de caractère (it5) · tout appel IA |
| **Reporté** | Retrait d'un personnage → it2+ (open_question). `RefusEnCours{personnageId,issues}` dans `PanneauPersonnages` → recommandation pour it2 (quand la prose libre l'exposera réellement), pas un blocage d'it1. |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut créer un personnage, lui donner un nom, un camp (protagoniste/antagoniste) et confirmer son plan (premier/second), le rattacher optionnellement à un objectif du canon, et voir l'accordéon à 8 emplacements qui portera le reste de sa fiche — remplaçant l'état vide de la section Personnages (index 2 de `SECTIONS`).

## 2 — Hors périmètre

- Retrait d'un personnage (pas de bouton, pas de dialogue, pas de test) — un personnage nu en it1 est un objet jetable sans coût de nettoyage réel ; reporté à it2+.
- Les 7 autres blocs de l'accordéon (Identité, Caractéristiques, Objectif & plan d'actions, Savoirs, Relations, Présence, Caractère exploitable) : placeholder seulement, aucun champ éditable.
- `contre_mesures[]`, curseurs, `relations[]`, `presence[]`, `stats`, `plan_actions[]` étendu (durée/porte de sortie) : arrivent en it2 à it5.
- Tout appel au modèle : cette itération ne fait aucune génération, aucun rôle R1-R4 impliqué.
- `RefusEnCours{personnageId, issues}` dans `PanneauPersonnages` : aucun champ d'it1 ne peut produire `statut:'refuse'` depuis ce bloc (camp/plan fermés, objectif_id résout-ou-vide) — construire cette architecture maintenant violerait la doctrine déjà posée par `ObjectifsCanon.tsx` v1 (« ne pas construire un bandeau qui ne peut jamais s'allumer »). Recommandé pour it2 (fonction/apparence/description_joueur, texte libre, exposera un vrai refus).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Layout général — `PanneauPersonnages.tsx`.** Deux colonnes, motif `PanneauLieux` : colonne liste (largeur `320px`, `gap: var(--space-3)`, eyebrow `PERSONNAGES`) + colonne fiche (`flex: 1`).

Bouton d'ajout, texte exact, toujours visible sous la liste : `+ Ajouter un personnage…` — style `boutonAjouterStyle` de `PanneauLieux.tsx` (bordure `1.5px dashed var(--accent)`, fond `var(--accent-bg)`, texte `var(--accent)`, `r-md`, `hit-target`).

**Liste vide** (état réel : `monde.personnages` démarre à `[]`) : gabarit centré pointillé, glyphe `❏`, texte exact : `Aucun personnage — cliquez « + Ajouter un personnage… » pour commencer.` Tokens : `border: 1.5px dashed var(--border-field)`, `border-radius: var(--r-xl)`, `background: var(--surface-inset)`, `padding: var(--space-10) var(--space-8)`, `max-width: 480px`.

**`ListRow`** par personnage : `title` = `localiserEntite('pnj', personnage, index)` (repli « Personnage n°N (sans nom) »), `subtitle` = `personnage.id`, `trailing` = Badge(s) `tone="neutral"` — plan toujours présent (`Premier plan`/`Second plan`), camp seulement si défini (`Protagoniste`/`Antagoniste`). **Jamais `tone="bad"`/`tone="good"`** : camp n'est pas un résultat de jet.

**Champ NOM — en-tête de fiche, HORS accordéon** (précédent `FicheLieu`, « NOM DU LIEU » comme premier `Field`, au-dessus de toute structure interne) : `Field label="NOM DU PERSONNAGE" hint="interne"` (registre déjà établi : nom interne vs description joueur), placeholder d'exemple `Aldûr le Sage`, patron brouillon local + commit au blur (idiome `PanneauCanon`/`FicheLieu`). Alimente `Entite.nom`, destination `auteur`, inchangée.

**Accordéon — `components/Accordion.tsx`** (composant NEUF, local à la feature, 1 seul consommateur, jamais promu à `brain/components/` avant un 2e appelant, KR-109) :
```ts
interface AccordionSection { id: string; title: string; trailing?: ReactNode; content: ReactNode }
interface AccordionProps { sections: AccordionSection[]; defaultOpenId: string }
```
Un seul bloc ouvert à la fois (`useState<string>(defaultOpenId)`). Le parent force le retour au bloc 1 en posant `key={personnage.id}` sur `<Accordion>` — remontage React, **jamais un `useEffect`** (KR-013/113). Racine : `overflow:'hidden', borderRadius:'var(--r-3xl)'`. En-tête de bloc = `<button type="button">`, `minHeight: var(--hit-target)`, `padding: var(--space-4) var(--space-5)`, chevron `▾` (`rotate(-90deg)` replié / `rotate(0deg)` déplié, `text-muted`, `fs-meta`). Contenu déplié : `padding: var(--space-5)`.

**Ordre et titres exacts des 8 blocs** (bloc 1 renommé pour dire ce qu'il porte réellement — ni « Identité », réservé au bloc 2 d'it2) :

| # | Titre exact | Contenu it1 | Placeholder si vide (textes DISTINCTS par bloc) |
|---|---|---|---|
| 1 | `Camp, plan & rattachement` | camp + plan + objectif_id | — (rempli dès cette itération) |
| 2 | `Identité` | — | `Pas encore renseigné — ce bloc arrive à l'itération 2 de dossier-fiches.` |
| 3 | `Caractéristiques` | — | `Pas encore renseigné — ce bloc arrive à l'itération 2 de dossier-fiches.` |
| 4 | `Objectif & plan d'actions` | — | `Pas encore renseigné — ce bloc arrive à l'itération 3 de dossier-fiches.` |
| 5 | `Savoirs` | — | `Pas encore renseigné — ce bloc arrive à l'itération 4 de dossier-fiches.` |
| 6 | `Relations` | — | `Pas encore renseigné — ce bloc arrive à l'itération 4 de dossier-fiches.` |
| 7 | `Présence` | — | `Pas encore renseigné — ce bloc arrive à l'itération 4 de dossier-fiches.` |
| 8 | `Caractère exploitable` | — | `Pas encore renseigné — ce bloc arrive à l'itération 5 de dossier-fiches.` |

Bloc 1 ouvert par défaut à la création et à chaque sélection dans la liste.

**Contenu du bloc 1** :
- **CAMP** — eyebrow `CAMP`, `SegmentedControl<CampPersonnage>` : `{value:'protagoniste',label:'Protagoniste'}`, `{value:'antagoniste',label:'Antagoniste'}`, `ariaLabel="Camp du personnage"`. **Aucune valeur forcée à la création** — reste `undefined` tant que l'auteur n'a pas cliqué.
- **PLAN** — eyebrow `PLAN`, `SegmentedControl<Portee>` : `{value:'premier',label:'Premier plan'}`, `{value:'second',label:'Second plan'}`, `ariaLabel="Plan du personnage"`. **Valeur forcée à la création** via `PORTEE_INITIALE: Portee = 'premier'` (constante nommée, jamais `PORTEES[0]`) — docstring précisant que c'est **le plancher du schéma** (`portee` est requis par `LISTES_REQUISES` depuis `dossier-format`), **pas une intention d'auteur**, pour que la n°12 ne le lise pas comme un choix narratif.
- **OBJECTIF RATTACHÉ** — eyebrow `OBJECTIF RATTACHÉ`. Si `canon.objectifs.length === 0` : pas de `Select`, paragraphe texte exact (idiome `legendeStyle` de `PanneauDepart.tsx`) : `Aucun objectif défini dans le canon — ce personnage restera sans objectif tant qu'aucun n'existe.` Sinon : `Select<string>` avec en première option `{value:'', label:'Aucun objectif rattaché'}` puis une option par `canon.objectifs` dans l'ordre du tableau, `label = localiserEntite('objectif', objectif, index)`. `value` = `personnage.objectif_id ?? ''`. Aucun filtrage par camp.

**Composant à étendre (pas neuf)** : `brain/components/SegmentedControl.tsx` — élargir `SegmentedControlProps<T>.value` à `T | undefined`. `undefined` = aucun segment actif (état inactif natif existant, zéro CSS nouveau). `onChange: (value: T) => void` reste inchangé — il ne peut jamais émettre `undefined` : un retour à « non renseigné » se ferait par un `IconButton` « effacer » séparé, jamais un 3ᵉ segment « Aucun » qui écrirait une valeur.

**Refus / bandeau dans `PanneauPersonnages`** : aucun `IssueList` en it1 (voir Hors périmètre). Refus dans `ObjectifsCanon.tsx` (lot 3, régression réelle) : réutilise le patron déjà existant du bandeau d'avertissement (`IssueList`, `role="status"`, bandeau « CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ »).

**Clavier** : pas de modale cette itération. `ListRow` et boutons d'en-tête d'accordéon sont des `<button>` natifs (Tab : liste → « + Ajouter… » → blocs 1→8 ; dans le bloc 1 déplié : Field nom → SegmentedControl camp → SegmentedControl plan → Select objectif). Entrée/Espace activent nativement ; aucun `onKeyDown` maison.

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Personnage` étendu | type | émet (lot 1) / consomme (lots 2-3) | `interface Personnage extends Entite { portee: Portee; plan_actions: PlanAction[]; savoirs: Savoir[]; camp?: CampPersonnage; objectif_id?: string }` |
| `CAMPS_PERSONNAGE` / `CampPersonnage` | registre | émet (lot 1) / consomme (lot 2) | `export const CAMPS_PERSONNAGE = ['protagoniste', 'antagoniste'] as const` — registre DISTINCT de `CAMPS`/`Camp` (canon.objectifs) |
| `ENUMERES_FERMES` étendu | registre | émet (lot 1) | `{ path: 'monde.personnages[].camp', location: 'Personnages', valeurs: CAMPS_PERSONNAGE, requis: false }` |
| `REFERENCES_SIMPLES` étendu | registre | émet (lot 1) | `{ path: 'monde.personnages[].objectif_id', espace: 'objectif', location: 'Personnages', sujet: 'Le rattachement de ce personnage' }` |
| `destinations.ts` étendu | registre | émet (lot 1) | `'monde.personnages[].camp': 'moteur'` · `'monde.personnages[].objectif_id': 'moteur'` |
| `SegmentedControl<T>` | component | émet (lot 1) / consomme (lot 2) | `value: T \| undefined` (élargi, additif, tous appelants actuels compilent) |
| `DossierService.update(id, recette)` | service | consomme (lots 2-3) | signature inchangée, 5 temps déjà stables |
| `dossier:updated` | event | émet (lots 2-3, via `update()`) | `{ dossierId: string }` |

*(Aucun contrat de sortie IA cette itération — § 4 bis supprimée.)*

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-camp-rattachement` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser `camp`/`objectif_id` sur `Personnage` (registres, tables, destinations), élargir `SegmentedControl` à une valeur optionnelle, et fermer le gate `FEATURE_DIRS` (rouge dès aujourd'hui, avant même ce lot, car `src/features/dossier-fiches/` existe déjà sur disque avec sa seule `specification.json`).
- **Fichiers** :
  - `src/brain/dossier/types.ts` (R)
  - `src/brain/dossier/tables.ts` (R)
  - `src/brain/dossier/destinations.ts` (R)
  - `src/brain/index.ts` (R)
  - `src/brain/dossier/__fixtures__/dossier-minimal.json` (R)
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R) — au moins une instance de `camp` et `objectif_id` (ex. `pnj.selene-la-vigie` + `objectif_id` pointant un objectif existant), car le garde d'exhaustivité de `couverture.test.ts` balaie la FIXTURE, pas le type (narratif-ia, tour 2)
  - `src/brain/dossier/couverture.test.ts` (R)
  - `src/brain/dossier/validate.test.ts` (R)
  - `src/brain/components/SegmentedControl.tsx` (R)
  - `src/brain/components/SegmentedControl.test.tsx` (N)
  - `.eslintrc.cjs` (R) — `FEATURE_DIRS += 'dossier-fiches'` : doit être fait ICI, pas au lot 2, sinon le lot 1 lui-même ne passerait pas sa propre porte (`featureDirs.test.ts` est déjà rouge, indépendamment de tout lot).
- **Expose / consomme** : voir § 4 (toutes les lignes émises par ce lot).
- **Critères couverts** : #1 (partiel — la forme), #7, #8.

### Lot 2 — `fiche-personnage-situee`
- **Ouvrier** : `dev-lot`
- **But** : l'écran de la section Personnages — liste, nom, accordéon à 8 emplacements, bloc 1 éditable.
- **Fichiers** :
  - `src/features/dossier-fiches/index.ts` (N)
  - `src/features/dossier-fiches/components/PanneauPersonnages.tsx` (N)
  - `src/features/dossier-fiches/components/FichePersonnage.tsx` (N)
  - `src/features/dossier-fiches/components/Accordion.tsx` (N)
  - `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` (N)
  - `src/App.tsx` (R) — `panneaux={{ …, personnages: <PanneauPersonnages dossierId={route.dossierId} /> }}`
  - `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (R) — sonde `personnages: <PanneauPersonnages`, branche `index === 2` (KR-187)
- **Expose / consomme** : consomme intégralement le lot 1 (§ 4) + `frapperIdentifiant('pnj')`, `localiserEntite`, `useOpenDossier`, `useBrain().dossiers.update`, `ListRow`, `Select`, `Card`, `Badge`, `Field`.
- **Critères couverts** : #1, #2, #3, #4, #5, #7, #8.

### Lot 3 — `objectifs-canon-refus-reference`
- **Ouvrier** : `dev-lot`
- **But** : corriger la régression que ce contrat introduit — retirer un objectif référencé par un personnage devient réellement refusable dès le lot 1, et `ObjectifsCanon.tsx` ignore aujourd'hui la valeur de retour de `commit()`.
- **Fichiers** :
  - `src/features/dossier-canon/components/ObjectifsCanon.tsx` (R)
  - `src/features/dossier-canon/tests/objectifsCanon.test.tsx` (R)
- **Expose / consomme** : consomme `IssueList`, `DossierIssue`, `EcritureDossier` du lot 1 (types inchangés) ; ne touche à rien du lot 2.
- **Critères couverts** : #6.

*(3 lots. Lots 2 et 3 sont fichiers-disjoints et ne dépendent que du contrat figé du lot 1 : exécutables en parallèle par deux `dev-lot`, précisément le cas où l'essaim a un sens.)*

## 6 — Critères d'acceptation

1. **Étant donné** la section Personnages vide, **quand** l'auteur clique « + Ajouter un personnage… », **alors** un personnage est créé (`{id, portee:'premier', plan_actions:[], savoirs:[]}` — camp et nom absents), apparaît dans la liste (repli « Personnage n°N (sans nom) »), et sa fiche s'ouvre avec le bloc « Camp, plan & rattachement » déplié. — *niveau : composant* — *lot 2*
2. **Étant donné** une fiche personnage ouverte, **quand** l'auteur saisit un nom (Field en en-tête, hors accordéon) et quitte le champ, **alors** `DossierService.update()` persiste `Entite.nom` et la liste/le titre reflètent la nouvelle valeur. — *niveau : composant* — *lot 2*
3. **Étant donné** une fiche personnage, **quand** l'auteur choisit un camp ou un plan (SegmentedControl), **alors** la valeur est persistée immédiatement (commit direct, pas de brouillon) et le badge correspondant apparaît dans la liste — camp seulement si défini. — *niveau : composant* — *lot 2*
4. **Étant donné** un canon sans objectif, **quand** l'auteur ouvre le champ « Objectif rattaché », **alors** un message explicite remplace le Select ; **étant donné** un canon avec au moins un objectif, **alors** un Select propose « Aucun objectif rattaché » + chaque objectif, et le choix persiste `objectif_id`. — *niveau : composant* — *lot 2*
5. **Étant donné** les 7 autres emplacements de l'accordéon, **quand** la fiche se rend, **alors** chacun affiche son texte de placeholder exact nommant l'itération qui le livrera — assertion de COMPTE exacte (7, pas 6 ni 8). — *niveau : composant* — *lot 2*
6. **Étant donné** un objectif du canon référencé par le `objectif_id` d'un personnage, **quand** l'auteur tente de le retirer depuis `ObjectifsCanon.tsx`, **alors** l'écriture est refusée (`statut:'refuse'`, `reference-pendante`), l'objectif reste dans la liste, et un bandeau de refus (`role="status"`) l'affiche. — *niveau : composant* — *lot 3*
7. **Étant donné** le dossier de référence (6 personnages), **quand** le lot 1 est livré, **alors** les 6 personnages restent acceptés par `validateDossier` — `camp`/`objectif_id` optionnels (absents = calme) sauf sur l'instance enrichie pour la couverture. — *niveau : contrat* — *lot 1*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur : `FEATURE_DIRS` contient `dossier-fiches`, aucun import croisé `dossier-fiches`↔`bascule-editeur` ni `dossier-fiches`↔`dossier-canon`, aucune couleur en dur. — *niveau : lint* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `validate.test.ts` — camp absent | `ok:true`, ni erreur ni avertissement | unitaire | KR-191 | 1 |
| `validate.test.ts` — camp hors énuméré | erreur bloquante `valeur-hors-enumeration` | unitaire | KR-117 | 1 |
| `validate.test.ts` — objectif_id pendant | erreur `reference-pendante` | unitaire | KR-021 | 1 |
| `validate.test.ts` — objectif_id espace invalide (`pnj.xxx`) | erreur `identifiant-invalide` | unitaire | — | 1 |
| `couverture.test.ts` — camp/objectif_id | destination `'moteur'` présente + instance dans `dossier-reference.json` | contrat | — | 1 |
| `SegmentedControl.test.tsx` — value undefined | aucun segment actif, `onChange(value)` toujours typé `T` | unitaire | — | 1 |
| `panneauPersonnages.test.tsx` — création | `statut:'ecrit'`, `portee:'premier'`, `plan_actions:[]`, `savoirs:[]` | composant | KR-190 | 2 |
| `panneauPersonnages.test.tsx` — nom en-tête | Field hors accordéon, persiste au blur | composant | — | 2 |
| `panneauPersonnages.test.tsx` — camp/plan | commit immédiat, badge conditionnel sur camp | composant | KR-191 | 2 |
| `panneauPersonnages.test.tsx` — objectif Select état vide | message exact si 0 objectif dans le canon | composant | — | 2 |
| `panneauPersonnages.test.tsx` — 7 placeholders | compte exact = 7, textes distincts par itération cible | composant | — | 2 |
| `dossierEditorScreen.test.tsx` — index 2 | sonde `PanneauPersonnages` rendue, plus l'état vide générique | composant | KR-187 | 2 |
| `featureDirs.test.ts` | `dossier-fiches` ⊆ `FEATURE_DIRS` | lint/contrat | — | 1 |
| `objectifsCanon.test.tsx` — retrait référencé | `statut:'refuse'`, bandeau `role="status"`, objectif reste dans la liste | composant | KR-183 | 3 |

Cas limites à couvrir : vide (liste personnages vide, couvert par le lot 2) · référence orpheline (`objectif_id` pendant, couvert) · double clic sur « + Ajouter… » (chaque clic frappe un `id` distinct via `frapperIdentifiant`, comportement normal, pas de garde dédiée nécessaire).

**Non vérifiable en l'état** : aucun.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Où éditer le nom du personnage ? | `RETENU` | Field « NOM DU PERSONNAGE » en en-tête de fiche, hors accordéon, lot 2 — coût nul (`Entite.nom` existe déjà), précédent `FicheLieu`, ferme le trou relevé au tour 1 |
| 2 | PM / UX | Retrait d'un personnage en it1 ? | `REJETÉ` | Hors périmètre : ne sert pas la démo, pas de coût de nettoyage réel pour un objet encore vide. Reporté à it2+ (`open_questions`) |
| 3 | QA | `RefusEnCours{personnageId,issues}` dans `PanneauPersonnages` ? | `REJETÉ` (retiré par QA elle-même en tour 2) | Aucun champ d'it1 ne produit `statut:'refuse'` depuis ce bloc ; construire cet état violerait la doctrine déjà posée par `ObjectifsCanon.tsx` v1. Recommandé pour it2 |
| 4 | Tech Lead | Refus muet dans `ObjectifsCanon.tsx` sur retrait d'un objectif référencé | `RETENU` — lot 3 | Régression réelle et vérifiée par QA (`reference-pendante` en erreur bloquante, `commit()` actuel jette le retour) |
| 5 | Tech Lead / UX | `SegmentedControl<T>.value` élargi à `T \| undefined` ? | `RETENU` — lot 1 | Nécessaire pour respecter KR-191 (camp jamais forcé) sans composant maison ; convergence indépendante des deux rôles au tour 1 |
| 6 | Narratif-IA vs Tech Lead | `dossier-reference.json` touché par le lot contrat ? | `RETENU` (touché) | Le garde d'exhaustivité de `couverture.test.ts` balaie la fixture de référence, pas le type — au moins une instance de `camp` et `objectif_id` y est nécessaire |
| 7 | Tech Lead / Narratif-IA | `PORTEE_INITIALE = 'premier'` à la création | `RETENU` | `portee` est structurellement requis depuis `dossier-format` (`LISTES_REQUISES`) — exception légitime à « rien d'écrit que l'auteur n'a pas choisi », docstring précisant « plancher du schéma, pas un choix d'auteur » |
| 8 | UX | Placement des blocs : bloc 1 = « Camp, plan & rattachement » (pas « Identité ») ? | `RETENU` | Le bloc « Identité » reste réservé à it2 (fonction/apparence/description_joueur) ; camp/plan/objectif_id ont leur propre bloc |

*(Aucun désaccord ne disparaît sans statut. Aucun veto n'a survécu au tour 2 — pas de bloc `ESCALADE`.)*

## 9 — Innovation

*(Aucune proposition `INNOVATION` — section supprimée.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **sans objet** (KR-161-like : cette itération ne touche aucun des 4 fichiers mutés `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature `dossier-canon` (`ObjectifsCanon.tsx` corrigé, pas régressé) ni de `bascule-editeur`
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-fiches-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | favorable sous réserve | nom en Field d'en-tête (retenu), retrait hors périmètre (acté) |
| Tech Lead | pas de veto | ObjectifsCanon corrigé (lot 3, retenu) |
| UX | pas de veto | — |
| QA | favorable (veto initial retiré, transféré au lot 3) | critère #6 ajouté (retenu) |
| Narratif & IA | favorable | instance fixture ajoutée au lot 1 (retenu) |
