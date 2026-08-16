# Note UX — Tour 1 — `dossier-objets` it1

```
RISQUE — Le design_contract présuppose « la poignée de glisser » comme mécanisme de réordonnancement (§reordonnancement). Or ListRow.tsx documente lui-même que ce glyphe ⠿ est aria-hidden/décoratif dans la source de design, sans AUCUN équivalent clavier écrit nulle part dans le dépôt (cadrage pt.3). Construit tel quel, ça livre la seule capacité neuve de cette itération inopérable au clavier — un auteur qui écrit au clavier ne peut pas réordonner ses objets — et aucun des 8 critères d'acceptation ne teste autre chose que « la poignée » au sens souris : rien n'alerterait en revue.

OBJECTION — Le design_contract écrit « la poignée de glisser [...] réordonne monde.objets » comme un mécanisme déjà tranché. Il ne l'est pas : c'est une présupposition héritée du docstring de ListRow, pas une décision UX actée. Le construire en glisser-only exigerait en plus d'inventer, sans précédent dans tout le dépôt, un schéma clavier de repli (grab/move/drop) — hors du périmètre d'un walking skeleton.

PROPOSITION — it1 réordonne par DEUX IconButton (▲ monter / ▼ descendre), même famille Unicode que ▾ déjà canonique, précédent direct : Stepper.tsx (paire IconButton −/+, brain/components/). Rendus seulement quand les props de réordonnancement sont fournies — ListRow reste STRICTEMENT INCHANGÉ (même DOM, mêmes tests) pour ses 3 appelants existants qui ne les passent pas. Bouton omis (pas désactivé) en tête/queue de liste. Abandon du ⠿ : une poignée qui ne fonctionne pas est une fausse promesse.

VERDICT — recevable sous réserve : que le comité retienne le mécanisme « boutons » (et non glisser) pour it1. Sinon veto — sur l'opérabilité clavier de la seule capacité neuve livrée.
```

## Annexe — contrat de design

### Surface et layout
Même patron que `PanneauLieux.tsx`/`FicheLieu.tsx` : deux colonnes dans `pageStyle` (`gap: var(--space-8)`, `padding: var(--space-8)`). Colonne gauche 320px fixe (`eyebrowStyle` « OBJETS » en mono `--fs-eyebrow`, liste `ListRow` en `--space-3)`, bouton `+ Ajouter un objet…` en pointillé accent). Colonne droite : `<Card>` avec la fiche de l'objet sélectionné. Aucun accordéon (entité trop mince, déjà tranché en `design_contract`).

### Composants réutilisés — aucun composant maison
`ListRow` (étendu, voir plus bas), `Card`, `Field`, `IconButton` — tous depuis `brain/components` via `../../../brain`. Pas de `Badge` en it1 (aucun champ catégorisant sur `Objet` cette itération). `Modal`/`IssueList` restent hors périmètre (it2, retrait).

### `PanneauObjets.tsx`
- `EYEBROW_SECTION = 'OBJETS'`
- `TEXTE_VIDE = 'Aucun objet — cliquez « + Ajouter un objet… » pour commencer.'` — même glyphe `❏` (`aria-hidden`) que `PanneauLieux`/`PanneauPersonnages`, 3ᵉ occurrence, consolide le motif plutôt que d'en introduire un nouveau.
- Bouton ajout : `+ Ajouter un objet…` (identique au gabarit `+ Ajouter un lieu…`/`+ Ajouter un personnage…`).
- Sélection par défaut : premier objet, calculée en ligne (`objets.find(...) ?? objets[0]`), jamais un `useEffect` de resynchronisation — même idiome que `PanneauLieux`.
- `title` de chaque `ListRow` = `localiserEntite('objet', objet, index)` → `Objet « Le grimoire scellé d'Aldûr »` ou repli `Objet n°N (sans nom)` (déjà exporté par `identifiers.ts`, aucune reconstruction locale du texte).
- `subtitle` = `objet.id`.

### `FicheObjet.tsx` — champs, textes exacts
Deux `Field`, aucun autre champ en it1 :

| Champ | `label` | `hint` (rendu « — hint » par `Field`) | `placeholder` |
|---|---|---|---|
| `nom` | `NOM DE L'OBJET` | `interne` | `Le grimoire scellé d'Aldûr` |
| `description_joueur` | `DESCRIPTION` | `lue par le joueur` | `Une couverture de cuir craquelé, fermée par une lanière de plomb ; les pages, entrevues sous la reliure, semblent respirer.` |

Registre : `nom` reste de l'interface (frappe technique, jamais lu par le joueur) ; `description_joueur` est de la fiction — présent, sensoriel, immersif, jamais un résumé mécanique (« objet magique qui donne +2 »). Les deux placeholders ne réutilisent aucune valeur des fixtures (`Le sceau de cendre`, etc.) pour ne jamais laisser croire à une donnée déjà persistée.

Pas de bouton retirer en it1 (hors périmètre, it2).

### Extension de `ListRow` — proposition de signature
```ts
export interface ListRowProps {
  // ...existant, inchangé...
  /** Bornes ET callback fournis ENSEMBLE ou pas du tout — un composant partiel serait un état impossible. */
  onMonter?: () => void
  onDescendre?: () => void
}
```
Rendu additif : quand les deux props sont `undefined` (les 3 appelants actuels — `SectionNav`, `PanneauPersonnages`, `PanneauLieux`), `ListRow` produit exactement le même DOM qu'aujourd'hui, zéro régression visuelle ni de test. Quand fournis, les deux `IconButton` (`▲`/`▼`, `size` par défaut 24 — pas `HIT_TARGET_MIN`, hors cadre) rendent HORS du `<button>` de sélection — pas dans `leading`/`trailing`, tous deux aujourd'hui À L'INTÉRIEUR du bouton (`{leading}...{trailing}` dans le `<button>` racine, vérifié en lisant le composant) : imbriquer un `<button>` dans un `<button>` est un HTML invalide et un conflit d'événement (`onClick` de sélection se déclenche aussi). `PanneauObjets` passe `onMonter`/`onDescendre` `undefined` pour le premier/dernier objet — le bouton est OMIS, jamais rendu désactivé (une cible Tab morte est pire qu'absente).

Libellés (calculés dans `PanneauObjets.tsx`, jamais lus depuis `FicheObjet.tsx` — pas de recherche DOM à distance) :
- `Monter l'objet « {nom} »` / repli `Monter l'objet n°{index+1} (sans nom)`
- `Descendre l'objet « {nom} »` / repli symétrique

### États
- **Défaut** : liste peuplée, fiche du premier objet affichée.
- **Sélectionné** : `ListRow selected` → `--accent`/`--accent-bg-2`, seul usage de l'accent sur cet écran.
- **Vide** (0 objet) : bandeau pointillé `❏` + `TEXTE_VIDE`, colonne fiche vide de droite (même gabarit exact que `PanneauLieux`/`PanneauPersonnages`).
- **Champ vide** : placeholder ci-dessus, jamais un champ sans amorce.
- **Erreur/refus** : hors périmètre it1 (pas de retrait).
- **Chargement** : hors périmètre — `dossier` résolu de façon synchrone comme les écrans précédents.

### Clavier
Tab traverse : liste (`ListRow`, `<button>` natif) → boutons monter/descendre quand présents → `+ Ajouter…` → champs `Nom`/`Description`. Entrée/Espace activent tout bouton nativement (aucun `onKeyDown` maison à écrire). Ajout d'un objet : focus posé sur le champ Nom (même idiome `intentionFocus`/`useEffect` DOM impératif que `PanneauLieux`, usage légitime KR-013). Pas de modale en it1 → pas d'Échap à câbler, pas de retour de focus au déclencheur à prévoir cette itération.

Fichiers consultés : `src/features/dossier-objets/specification.json`, `src/brain/components/ListRow.tsx`, `src/brain/components/Stepper.tsx`, `src/brain/components/Field.tsx`, `src/brain/components/IconButton.tsx`, `src/features/dossier-canon/components/{PanneauLieux,FicheLieu}.tsx`, `src/features/dossier-fiches/components/{PanneauPersonnages,BlocIdentite}.tsx`, `src/brain/dossier/identifiers.ts`, `src/brain/dossier/__fixtures__/dossier-reference.json`, `design_handoff_gamebook_editor/DESIGN-SYSTEM.md`, `design_handoff_gamebook_editor/components/surfaces/ListRow.jsx`, `design_handoff_gamebook_editor/Editeur Livre-Jeu - Wireframes.dc.html`.
