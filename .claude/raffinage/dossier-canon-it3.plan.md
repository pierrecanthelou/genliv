# Plan d'itération — `dossier-canon` · itération `3`

> Statut : `validé` (2026-08-10)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-10
> Composition : `4 rôles` — motif : `dossier-canon` (n°3) n'est pas dans la liste n°1/4/7/8+Temps2 de `docs/ROADMAP-BASCULE-IA.md` §4 ; `camp` est un enum fermé descriptif analogue à `Personnage.portee` (déjà `moteur`, jamais injecté au modèle) — `reussi_si_texte`/`echoue_si_texte` sont déjà destination `'auteur'` dans `destinations.ts`, jamais `'ia'`. Même motif qu'it1/it2 (voir `.claude/raffinage/dossier-canon-it2.plan.md`, en-tête).
> Exécution : `séquentielle` (2 lots, le 2e attend le gel du 1er — pas d'essaim parallèle, propriété disjointe mais dépendance d'ordre)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur rédige les objectifs de victoire de son histoire dans la section Canon — un par camp (protagonistes, antagonistes, joueur), condition de réussite, condition d'échec, en prose factuelle. » |
| **Tranche** | `ObjectifsCanon` (nouveau, monté par `PanneauCanon.tsx`) → `DossierService.update()` (même chemin qu'it1/it2) → `PersistenceService`/`CloudSyncService` ; lecture d'avertissement dérivée via `validateDossier(dossier)` (`useMemo`, jamais un `useEffect`) |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul, premier, 9 fichiers remesurés — pas ~6) |
| **Hors périmètre** | éditeur structuré `…_expr` · validation d'unicité/complétude par camp · compteur de nav sur ajout d'objectif (réservé à Lieux, it4) · confirmation au retrait · généralisation de `Select`/`TargetPicker`/`Field` · budget de mots sur les textes d'objectif |
| **Reporté** | `Field.maxLength`/`showCounter` (ouvert depuis it1, aucun 2e appelant réel) · éditeur `…_expr` (ouvert depuis it1, `open_questions`) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur ouvre un dossier, sélectionne la section Canon et y trouve, sous les interdits de ton, la liste de ses objectifs de victoire : il en ajoute un (« + Ajouter un objectif… »), lui donne un nom, choisit son camp (protagonistes / antagonistes / joueur, `Select` fermé) et rédige sa condition de réussite et d'échec en prose factuelle — jamais une syntaxe d'expression. Chaque champ persiste par `DossierService.update()`, le chemin d'écriture posé par it1. Aucune contrainte de nombre par camp : la liste est libre, comme `interdits_ton`. Un objectif dont la condition de réussite ou d'échec est renseignée sans son jumeau structuré (`…_expr`, hors périmètre) déclenche l'avertissement D1 (`condition-sans-expr`), visible à l'écran dès le premier rendu — dossier réouvert ou champ édité, jamais retourné en silence (KR-183).

## 2 — Hors périmètre

- Tout éditeur structuré de `reussi_si_expr`/`echoue_si_expr` (Select PREDICATES + TargetPicker) — reporté depuis it1 (`open_questions`), sans propriétaire assigné.
- Toute validation d'unicité ou de complétude par camp — ni minimum, ni maximum, ni obligation de couvrir les trois camps. « Un objectif par camp » est descriptif, pas une règle (§8, désaccord 1).
- Le compteur de la nav (`SECTIONS.compte()`) sur ajout/retrait d'objectif — `SECTIONS[0]` (canon) a un compte codé en dur `'—'` (`sections.ts:83`, épinglé par `sections.test.ts`) : structurellement insatisfiable pour cette section, réservé à Lieux (it4), seule section dont le compte reflète réellement sa collection (§8, désaccord 2).
- Dialogue de confirmation au retrait d'un objectif — aucune référence vivante à `objectif.id` avant n°4+ (personnages, fins, jalons), même régime que le retrait d'un interdit de ton.
- Généralisation de `Select`, `TargetPicker`, ou extension de `Field` (`maxLength`/`showCounter`) — un seul appelant réel chacun cette itération, précédent du dépôt : jamais avant un 2e appelant réel.
- Aucun budget de mots (compteur) sur `reussi_si_texte`/`echoue_si_texte` — `BUDGETS_DE_MOTS` (`tables.ts`) n'en porte aucun, même contraste explicite que Départ (it2) avec Canon.
- Migration des dossiers déjà persistés dont un objectif porterait un `camp` absent — `schema` reste `1`, et aucune UI n'a jamais permis de créer un objectif avant cette itération (seules les deux fixtures en portent, mises à jour dans le lot contrat).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Patron repris de `PanneauCanon.tsx` (it1) : `pageStyle` → `Card` → `champsStyle` (`gap: var(--space-6)`). Le bloc Objectifs est un **composant séparé**, `ObjectifsCanon`, monté par `PanneauCanon` comme cinquième enfant de `champsStyle`, après « INTERDITS DE TON » et avant le bandeau de refus de Canon (§5, lot 2, motif : taille de fichier).

**Eyebrow de section** (mono, `--fs-eyebrow`, `--text-label`, `--track-eyebrow`, comme `titreInterditsStyle`) :
```
OBJECTIFS DES CAMPS — interne, jamais injecté au modèle
```
*(Corrigé en tour 2 : `camp` est destination `moteur`, `reussi_si_texte`/`echoue_si_texte` sont `auteur` — aucun des quatre champs de la carte n'est `ia`. « injectée au modèle » aurait menti sur l'audience.)*

**Bloc interne par objectif** — PAS un `Card` imbriqué (`Card` peint toujours une ombre/anneau, réservée menus/modales, jamais un conteneur de liste répété) : un `div` bordé/teinté, même idiome que `interdits_ton` scié en plus grand.
```css
border: 1px solid var(--border-subtle);
border-radius: var(--r-xl);
background: var(--surface-inset);
padding: var(--space-6);
display: flex; flex-direction: column; gap: var(--space-4);
```

Ordre des champs : nom → camp → réussite → échec.

**Champ 1 — Nom**
```
label:       NOM DE L'OBJECTIF
hint:        interne
placeholder: Percer le secret du Gouffre scellé
```
Brouillon local, seedé une fois par `objectif.id`, commit au blur (idiome it1).

**Champ 2 — Camp** (`Select`, commit immédiat au `onChange`, AUCUN brouillon — même régime que `lieu_id` en it2 : un `<select>` n'a pas de blur)
```
label: CAMP
options, dans cet ordre exact :
  { value: 'protagonistes', label: 'Protagonistes' }
  { value: 'antagonistes',  label: 'Antagonistes' }
  { value: 'joueur',        label: 'Joueur' }
```
Valeur posée à la création d'un objectif : `CAMP_INITIAL = 'protagonistes'` (constante nommée dans `ObjectifsCanon.tsx`, jamais `CAMPS[0]` par position).

**Champ 3 — Condition de réussite**
```
label:       CONDITION DE RÉUSSITE
hint:        phrase factuelle pour le moteur, jamais de fiction
multiline, rows=2
placeholder: Le héros a atteint le fond du Gouffre scellé.
```
*(Repris mot pour mot de l'exemple JSDoc de `reussi_si_texte`, `types.ts`.)*

**Champ 4 — Condition d'échec**
```
label:       CONDITION D'ÉCHEC
hint:        phrase factuelle pour le moteur, jamais de fiction
multiline, rows=2
placeholder: Le héros meurt, ou quitte Val-Cendre sans avoir percé le sceau.
```
Champs 3 et 4 : brouillon local par `objectif.id`, commit au blur.

**Pied de bloc — retrait**
```jsx
<IconButton label={`Retirer l'objectif n°${index + 1}`} tone="danger" size={HIT_TARGET_MIN}>✕</IconButton>
```
Aligné à droite, seul sur sa ligne. Commit immédiat, **aucun dialogue de confirmation**.

**Bouton d'ajout** (réutilise `boutonAjouterStyle` existant, à l'identique) :
```
+ Ajouter un objectif…
```

**État vide de la liste** : aucun objectif créé ⇒ seul le bouton pointillé est visible, pas de texte d'état vide séparé (précédent `interdits_ton`).

**Bandeau d'avertissement** (nouveau, distinct et indépendant du bandeau de refus de `PanneauCanon` — les deux peuvent coexister à l'écran, d'où la garde de test `getAllByRole` au §7) :
```jsx
{avertissementsObjectifs.length > 0 && (
  <div role="status" style={bandeauStyle}>
    <p style={eyebrowAvertissementStyle}>{EYEBROW_AVERTISSEMENT_OBJECTIFS}</p>
    <IssueList issues={avertissementsObjectifs} />
  </div>
)}
```
```
const EYEBROW_AVERTISSEMENT_OBJECTIFS = 'ENREGISTRÉ, AVEC AVERTISSEMENT'
```
`eyebrowAvertissementStyle` = copie exacte de `eyebrowRefusStyle` (mono, `--fs-eyebrow`, `--track-eyebrow`, `--bad`) — seul le texte change (jamais « N'A PAS ÉTÉ ENREGISTRÉ », qui serait faux : D1 avertit, ne bloque pas). `avertissementsObjectifs` = `validateDossier(dossier).warnings.filter(w => w.path.startsWith('canon.objectifs'))`, texte rendu = `issue.message` verbatim via `IssueList`, jamais re-rédigé côté feature.

**Registre de langue** : nom, camp, condition de réussite, condition d'échec — AUTEUR/MJ, prose factuelle, jamais lus par le joueur (comme `synopsis_mj`/`ton`). Aucun placeholder ne bascule en deuxième personne ni présent immersif.

**Clavier** : Tab traverse nom → camp (`<select>` natif) → réussite → échec → retirer, dans cet ordre, aucun `tabIndex` custom. Le `Select` change au `onChange` natif ; les deux `Field` commitent au blur.

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CAMPS` / `Camp` | registre + type | émet *(nouveau)* | `export const CAMPS = ['protagonistes', 'antagonistes', 'joueur'] as const` · `export type Camp = (typeof CAMPS)[number]` — `types.ts`, à côté de `PORTEES`/`CERTITUDES` |
| `Objectif.camp` | type | émet *(champ ajouté, non optionnel)* | `Objectif { id; nom?; reussi_si_texte?; reussi_si_expr?; echoue_si_texte?; echoue_si_expr?; camp: Camp }` |
| `frapperIdentifiant` | fonction | émet *(nouveau, promu à `identifiers.ts`)* | `frapperIdentifiant(espace: EspaceDeNoms): string` → `` `${espace}.${randomToken()}` `` — motif de la promotion (pas privé) : le 2e appelant réel est déjà nommé dans la spec (`plan.iterations[3]`, Lieux, it4) |
| `validateDossier` | fonction | consomme *(inchangée, 2e usage réel côté feature : lecture dérivée des warnings)* | `validateDossier(input: unknown): DossierValidation` |
| `DossierService.update()` | service | consomme *(inchangé depuis it1)* | `update(id: string, recette: (dossier: Dossier) => CorpsDossier): EcritureDossier` |
| `brain/components/{Select, Field, IssueList, IconButton}` | composant | consomme *(inchangés)* | — |

Pas de §4 bis : cette itération ne touche ni le moteur ni un contrat de sortie IA.

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-camp-objectif` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé)
- **But** : ajouter `camp` à `Objectif` (registre fermé `CAMPS`), promouvoir `frapperIdentifiant` au baril, mettre les deux fixtures à jour.
- **Fichiers** :
  - `src/brain/dossier/types.ts` (R) — `CAMPS`, `Camp`, `Objectif.camp: Camp`
  - `src/brain/dossier/tables.ts` (R) — `ENUMERES_FERMES` += `{ path: 'canon.objectifs[].camp', location: 'Objectifs', valeurs: CAMPS, requis: true }`
  - `src/brain/dossier/destinations.ts` (R) — `'canon.objectifs[].camp': 'moteur'`
  - `src/brain/dossier/identifiers.ts` (R) — `export function frapperIdentifiant(espace: EspaceDeNoms): string`, import `randomToken` de `../utils/id`
  - `src/brain/index.ts` (R) — export `CAMPS`, `type Camp`, `frapperIdentifiant`
  - `src/brain/dossier/__fixtures__/dossier-minimal.json` (R) — `camp` sur l'objectif existant
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R) — `camp` sur l'objectif existant — **piège** : `suffisance.test.ts` (« aucune clé en trop face à `dossier-minimal` ») rougit si un seul des deux fichiers reçoit la clé
  - `src/brain/dossier/identifiers.test.ts` (R) — propriété : pour chaque espace de `ESPACES_DE_NOMS`, `estIdentifiantBienForme(frapperIdentifiant(espace), espace)` vrai ; non-collision sur deux frappes successives
  - `src/brain/dossier/validate.test.ts` (R) — `camp` absent ⇒ refus ; `camp` hors énumération ⇒ `valeur-hors-enumeration`, message nommant `camp`
- **Intouché, et c'est une décision mesurée, pas une supposition** : `src/brain/dossier/couverture.test.ts` — `corrompre()` remplace la chaîne `camp` par `42`, `ENUMERES_FERMES` la refuse ⇒ le chemin est *couvert* par la corruption existante ; la 4e assertion (tout chemin de table instancié) est satisfaite dès que les deux fixtures portent `camp` ; aucune entrée `LIBRES`/`SANS_DESTINATION` à écrire. Également intouchés : `amorce.ts` (`objectifs: []`, aucun objectif semé), `sections.ts`, `suffisance.test.ts`, `DossierService.ts`, `Select.tsx`.
- **Expose / consomme** : voir §4.
- **Critères couverts** : #6 (contrat).

### Lot 2 — `objectifs-canon`
- **Ouvrier** : `dev-lot` — démarre seulement une fois le lot 1 gelé (`camp` disponible au typage).
- **But** : le composant `ObjectifsCanon`, monté par `PanneauCanon`, qui rend la liste des objectifs et écrit par le même chemin `DossierService.update()`.
- **Fichiers** :
  - `src/features/dossier-canon/components/ObjectifsCanon.tsx` (N) — `export function ObjectifsCanon({ dossierId }: { dossierId: string }): JSX.Element | null`
  - `src/features/dossier-canon/components/PanneauCanon.tsx` (R) — ≤ 6 lignes : import + `<ObjectifsCanon dossierId={dossierId} />` entre le bloc Interdits et le bandeau de refus de Canon
  - `src/features/dossier-canon/tests/objectifsCanon.test.tsx` (N)
  - `src/features/dossier-canon/tests/panneauCanon.test.tsx` (R) — une assertion de présence du bloc, rien de plus (les tests synopsis/accroche/ton/interdits_ton restent intacts)
- **Pourquoi un composant neuf, pas un bloc de plus dans `PanneauCanon.tsx`** : le fichier fait 381 lignes — signal de découpe KR-112 à 400 ; un bloc liste+carte+`Select`+2 `Field` le pousserait au-delà de 550.
- **Recette d'écriture** : `dossiers.update(dossierId, (d) => ({ canon: { ...d.canon, objectifs: … }, monde: d.monde, charpente: d.charpente }))` — trois racines nommées, `monde`/`charpente` traversent intacts (§6, critère #7).
- **Ajout** : `frapperIdentifiant('objectif')` — jamais `createId()` (séparateur `_` refusé par `FORME_IDENTIFIANT`) ni un id dérivé du `nom` (KR-003). Nouvel objectif : `{ id, camp: CAMP_INITIAL, nom: '', reussi_si_texte: '', echoue_si_texte: '' }`.
- **Retrait** : filtre la liste par `id`, commit immédiat.
- **Camp** : lu en ligne depuis `useOpenDossier`, aucun brouillon, commit immédiat au `change`.
- **Nom/textes** : brouillon local `Record<string, {nom, reussi_si_texte, echoue_si_texte}>` indexé par `objectif.id`, seedé une fois (`useState(() => …)`, KR-013/113), jamais resynchronisé, commit au blur.
- **Aucun état `Refus`/bandeau de refus dans ce composant** : `statut: 'refuse'` y est structurellement inatteignable (id frappé bien formé, `camp` fermé par `Select`, `nom`/`…_texte` libres, aucun prédicat ne cible l'espace `objectif`). Construire un bandeau qui ne peut jamais s'allumer serait du code non testable.
- **Avertissements — atteignables, et rendus** : `const avertissementsObjectifs = useMemo(() => validateDossier(dossier).warnings.filter((w) => w.path.startsWith('canon.objectifs')), [dossier])` — recalculé à chaque nouvelle identité de `dossier` (donc à l'ouverture d'un dossier importé ET après chaque commit), jamais un état local semé une seule fois. Rendu via `IssueList`, région `role="status"` distincte de tout bandeau de refus.
- **Critères couverts** : #1 à #5, #7, #8 (partiel, lint du lot).

*(2 lots. Le lot 2 n'est pas un essaim : il dépend du typage figé par le lot 1, exécution séquentielle.)*

## 6 — Critères d'acceptation

1. **Étant donné** un dossier ouvert sur la section Canon, **quand** l'auteur clique « + Ajouter un objectif… », **alors** une nouvelle carte apparaît avec `camp` initialisé à `protagonistes` (`CAMP_INITIAL`), nom/condition de réussite/condition d'échec vides, immédiatement persistée par `DossierService.update()` — une réouverture du dossier relit le même objectif. — *niveau : composant* — *lot 2*
2. **Étant donné** une carte objectif, **quand** l'auteur change le camp dans le `Select`, **alors** le choix est committé immédiatement (sans blur) et persiste à la réouverture du dossier — aucun brouillon sur ce champ, même régime que `lieu_id` (it2). — *composant* — *lot 2*
3. **Étant donné** une carte objectif, **quand** l'auteur modifie le nom, la condition de réussite ou la condition d'échec et quitte le champ, **alors** `DossierService.update()` persiste le changement et une réouverture relit la valeur persistée — brouillon local seedé une fois par `objectif.id` (KR-013/113), deux objectifs simultanés ne mélangent jamais leurs brouillons. — *composant* — *lot 2*
4. **Étant donné** la liste des objectifs, **quand** l'auteur clique le bouton de retrait d'une carte, **alors** l'objectif est retiré immédiatement et persisté, sans dialogue de confirmation. — *composant* — *lot 2*
5. **Étant donné** un objectif dont `reussi_si_texte` ou `echoue_si_texte` est renseigné sans son `…_expr` jumeau (D1, `condition-sans-expr`), **quand** le panneau se rend — au montage (dossier réouvert, aucune édition de session) ou après un commit — **alors** un bandeau d'avertissement (`role="status"`, distinct du bandeau de refus) affiche le message exact du validateur via `IssueList` ; **et quand** aucun objectif ne déclenche cet avertissement, aucune région n'est rendue. — *composant* — *lot 2*
6. **Étant donné** un candidat portant un `camp` hors de l'énumération fermée (`CAMPS`), **quand** `validateDossier` le contrôle, **alors** le document est refusé (`valeur-hors-enumeration`, bloquant, message nommant `camp`) — structurellement inatteignable depuis cette UI (`Select` fermé) mais garanti au contrat. — *contrat* — *lot 1*
7. **Étant donné** une carte objectif, **quand** un commit est effectué (ajout, retrait, ou édition d'un champ), **alors** `monde` et `charpente` traversent intacts — aucune mutation en dehors de `canon.objectifs`. — *composant* — *lot 2*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur : aucun import croisé `dossier-canon`↔`bascule-editeur`, aucune couleur en dur, `camp` frappé exclusivement par `frapperIdentifiant` (jamais `createId()`). — *lint/contrat* — *lots 1+2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `CAMPS` fermé + `Objectif.camp` | `ENUMERES_FERMES` porte `canon.objectifs[].camp`, `valeurs: CAMPS`, `requis: true` | jest / contrat | KR-117 | 1 |
| `camp` hors énumération | `validateDossier` refuse (`valeur-hors-enumeration`), message nomme `camp` | jest / contrat | — | 1 |
| `camp` absent | `validateDossier` refuse (`champ-requis-vide`/énumération selon la branche exacte du validateur) | jest / contrat | — | 1 |
| `frapperIdentifiant` bien formé | pour chaque espace de `ESPACES_DE_NOMS`, `estIdentifiantBienForme(frapperIdentifiant(espace), espace)` vrai | jest / contrat | KR-003 | 1 |
| `frapperIdentifiant` non-collision | deux frappes successives produisent des id distincts | jest / contrat | KR-003 | 1 |
| Fixtures rejouées | `couverture.test.ts` (non modifié) reste vert : les deux fixtures valident sans erreur ni avertissement | jest / contrat | — | 1 |
| Ajout d'objectif | clic « + Ajouter… » ⇒ carte avec `camp='protagonistes'`, persistance immédiate, réouverture relit | jest / composant | — | 2 |
| Commit `camp` immédiat | `onChange` du `Select` commite sans blur, aucun brouillon | jest / composant | — | 2 |
| Brouillon nom/textes par `objectif.id` | deux objectifs édités dans la même session ne mélangent pas leurs brouillons | jest / composant | KR-013/113 | 2 |
| Retrait sans confirmation | clic `IconButton` ⇒ objectif retiré, aucune boîte de dialogue, persistance immédiate | jest / composant | — | 2 |
| Avertissement au montage | dossier importé avec un objectif déjà non conforme ⇒ bandeau visible au premier rendu, **sans édition préalable** | jest / composant | KR-183 | 2 |
| Avertissement après édition | saisie d'un `…_texte` puis blur ⇒ bandeau apparaît sans rechargement | jest / composant | KR-183 | 2 |
| Cas négatif du bandeau | objectif sans aucun `…_texte` renseigné ⇒ aucune région d'avertissement rendue | jest / composant | — | 2 |
| Coexistence refus + avertissement | quand Canon (refus) et Objectifs (avertissement) affichent chacun leur région, `getAllByRole('status')` — jamais `getByRole` nu | jest / composant | RTL Query Safety (`docs/WORKFLOW.md`) | 2 |
| `monde`/`charpente` intacts | deep-equal avant/après un commit sur `canon.objectifs` | jest / composant | KR-020 | 2 |
| Non-régression `panneauCanon` | tests existants (synopsis/accroche/ton/interdits_ton) inchangés | jest / composant | — | 2 |
| Non-régression `bascule-editeur` | `dossierEditorScreen.test.tsx` non modifié — aucune section autre que Canon touchée (KR-187 hors sujet cette itération : les objectifs vivent dans la section déjà réécrite par it1) | jest / contrat | KR-187 | — |

Cas limites couverts : vide (nom/textes vides — pas d'erreur, D1 les rend optionnels), doublon (aucune contrainte d'unicité de camp — testé par absence), hors ligne (hors périmètre, aucun test dédié), référence orpheline (sans objet — aucun champ de cette carte ne référence une autre entité en it3), annulation/double soumission (pas de modale, commit direct comme it1/it2).

**Non vérifiable en l'état** — aucun. Les 8 critères sont tous couverts par jest + Testing Library, déjà en place.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM / Tech Lead | « Un objectif par camp » : lecture descriptive (liste libre) ou règle de cardinalité 1:1 validée ? | `RETENU` (lecture descriptive) | Le critère #6 pré-existant de la feature (« il choisit un camp… ») penche pour l'ajout libre, pas une exigence de couverture des trois camps ; PM et tech-lead convergent indépendamment au tour 2. La lecture 1:1 est `REJETÉE` : elle ouvrirait un second lot contrat (nouveau code d'anomalie, validation d'unicité/complétude) hors du périmètre annoncé (« ajoute `camp` à `Objectif`, rien de plus »). |
| 2 | Tech Lead | Le critère #7/8 de la spec **feature** (« un lieu ou un objectif ajouté ⇒ le compteur de la nav se met à jour ») est insatisfiable pour un objectif : `SECTIONS[0]` (canon) a `compte: () => SANS_COMPTE`, codé en dur (`sections.ts:83`). | `RETENU` | Retiré des critères d'it3 (§6 ne le porte pas) ; réservé à Lieux (it4), seule section dont le compte reflète réellement sa collection. Confirmé indépendamment par QA (lecture directe de `sections.test.ts:183`). |
| 3 | QA | `commit()` jette `resultat.warnings` : `condition-sans-expr` (D1) est systématique dès la première saisie d'un `…_texte` sans `…_expr` — chemin nominal, KR-183 l'exige à l'écran. **Veto initial.** | `RETENU` | Le tech-lead remplace le filtrage post-`commit()` par une lecture dérivée `useMemo(() => validateDossier(dossier).warnings…, [dossier])`, recalculée à chaque rendu — couvre le montage (dossier réouvert, jamais édité) ET l'édition, sans état local. Convergence indépendante avec la demande UX de tour 2 (bandeau visible « y compris à l'ouverture »). |
| 3 bis | QA | Veto maintenu-allégé tant que 3 points ne sont pas des critères nommés : comportement au montage, cas négatif (aucun `…_texte` ⇒ pas de bandeau), garde `getAllByRole` (deux régions `role="status"` peuvent coexister). | `RETENU` | Les trois inscrits : critère #5 (§6) pour le montage/négatif, test « Coexistence refus + avertissement » (§7) pour la garde RTL. |
| 4 | UX | `Card` imbriqué dans la `Card` du panneau viole la règle « ombres réservées menus/modales » (une `Card` peint toujours une ombre/anneau). | `RETENU` | Bloc interne bordé/teinté (`--border-subtle`/`--r-xl`/`--surface-inset`), pas de `Card` par objectif — idiome `interdits_ton`, non contesté par les autres rôles. |
| 5 | UX (auto-correction) | Eyebrow de tour 1 (« injectée au modèle ») contredit l'audience réelle : `camp` est `moteur`, `reussi_si_texte`/`echoue_si_texte` sont `auteur`, aucun n'est `ia`. | `RETENU` | Texte corrigé au §3 : « OBJECTIFS DES CAMPS — interne, jamais injecté au modèle ». |
| 6 | Tech Lead | Frappeur d'identifiant d'objectif : privé à la feature, ou promu à `brain/dossier/identifiers.ts` ? | `RETENU` (promu) | Le 2e appelant réel est déjà nommé dans la spec (`plan.iterations[3]`, Lieux, it4, dans 1-2 itérations) — précédent `localiserEntite`/`compterMots`, promus au 2e appelant réel identifié, pas avant. Aucune objection des autres rôles. |
| 7 | Tech Lead | Libellés français des camps (`Record<Camp,string>`) : registre à descripteurs dans `brain/`, ou côté feature ? | `RETENU` (côté feature) | Un seul consommateur réel cette itération ; précédent `sections.ts` (glyphe et n° de feature restent côté feature, jamais dans `brain/`). |
| 8 | Tech Lead | `camp: requis:true` invalide rétroactivement tout dossier stocké portant un objectif sans `camp` (aucune migration, `schema` reste `1`). | `RETENU` (décision écrite, pas un effet de bord) | Acceptable : aucune UI n'a jamais permis de créer un objectif avant it3 ; seules les deux fixtures en portent aujourd'hui, mises à jour dans le lot 1. L'anomalie serait nommée (`lisible: false` en bibliothèque), jamais silencieuse. |
| 9 | Tech Lead | Composant neuf `ObjectifsCanon.tsx`, ou bloc de plus dans `PanneauCanon.tsx` ? | `RETENU` (composant neuf) | `PanneauCanon.tsx` fait 381 lignes — signal de découpe KR-112 à 400 ; le bloc Objectifs le pousserait au-delà de 550. |
| 10 | UX | Dialogue de confirmation au retrait d'un objectif ? | `RETENU` (aucun) | Aucune référence vivante à `objectif.id` avant n°4+ (confirmé par tech-lead) — même régime que le retrait d'un interdit de ton, déjà livré sans confirmation. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto ne tient après le tour 2 — pas d'escalade.)*

## 9 — Innovation

*(Aucune proposition hors-cadre ce tour — la promotion de `frapperIdentifiant` applique la règle existante du 2e appelant réel déjà nommé, ce n'est pas une exception à elle.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — sans objet (aucun des 4 fichiers mutés — `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts` — n'est touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`panneauCanon.test.tsx` hors l'assertion de présence ajoutée, `panneauDepart.test.tsx` intact, `dossierEditorScreen.test.tsx` non touché)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `code-knowledge.json` — mirroiter tout nouveau KR (frappeur d'identifiant promu, `camp` requis rétroactif) si non déjà couvert par KR-186
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-canon-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable → **levée** | ambiguïté « un objectif par camp » tranchée (descriptif), critère #7/8 restreint à it4 acté |
| Tech Lead | recevable sous réserve → **levée** | cardinalité tranchée par le PM, critère #7/8 restreint, rendu de `condition-sans-expr` spécifié (§3, §5, §7) |
| UX | GO avec objection → **levée** | bloc non-`Card` inscrit, eyebrow corrigé, bandeau d'avertissement ajouté au contrat |
| QA | rejet → maintenu-allégé → **levée** | montage/cas négatif/`getAllByRole` inscrits en critère #5 et au §7 |
