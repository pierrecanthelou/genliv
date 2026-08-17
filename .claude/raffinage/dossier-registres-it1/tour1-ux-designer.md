RISQUE — la partie neuve du contrat (`portee`, `mene_a[]`) n'a aucun précédent direct 1-pour-1 : `BlocSituation` traite une portée requise (SegmentedControl toujours sélectionné), la nôtre est optionnelle. Un copier-coller mécanique du SegmentedControl écrirait silencieusement une valeur que l'auteur n'a jamais choisie.

OBJECTION — le cadrage ne tranche ni le rendu de `portee` (SegmentedControl vs Select à défaut vide), ni l'auto-référence de `mene_a` (un indice peut-il « mener à » lui-même ?). Sans ça, `avecOrpheline()` reçoit une liste d'options non déterministe et deux agents de l'essaim la rendront différemment.

PROPOSITION —
1. `portee` en `Select` (pas SegmentedControl) avec option vide « Non précisée » en tête.
2. Auto-exclusion de l'indice édité dans les options de `mene_a` — motif exact de `apres_indice_id` (`BlocSavoirs`) : un indice ne mène jamais à lui-même.
3. Eyebrow « PORTÉE » (jamais « PLAN »).
4. Glyphe d'état vide `❏` (continuité `PanneauSection.tsx`).

VERDICT — recevable sous réserve des points 1 et 2, à figer avant l'essaim.

---

## Annexe — contrat de design (`PanneauIndices` / `FicheIndice`)

**Composants** : `ListRow` + 2×`IconButton` (▲/▼) + `Card` + `Field` (×2, multiline) + `Select` (×2 : portée, mene_a) + `IconButton` retrait ligne (✕, `tone="danger"`) + bouton pointillé `+ Ajouter…`. Aucun composant neuf.

**Colonne liste** : eyebrow `INDICES`. `ListRow` : `title={localiserEntite('indice', indice, index)}`, `subtitle={indice.id}`. Bouton bas : `+ Ajouter un indice…`.

**État vide (liste)** : glyphe `❏` + texte `Aucun indice — cliquez « + Ajouter un indice… » pour commencer.`

**Fiche, dans l'ordre** :
1. `Field label="NOM DE L'INDICE" hint="interne" placeholder="Le sceau brisé"`.
2. `Select label="PORTÉE"` options `[{value:'',label:'Non précisée'}, {value:'canon',label:'Canon'}, {value:'quete',label:'Liée à une quête'}]`, `value={indice.portee ?? ''}`.
3. `Field label="VÉRITÉ" hint="MJ — jamais vue du joueur" multiline rows={3} placeholder="Le sceau a été brisé par le gardien lui-même, vingt ans plus tôt."`
4. `Field label="FORMULATION JOUEUR" hint="lue par le joueur" multiline rows={3} placeholder="Une odeur de cendre froide, là où elle ne devrait pas être."`
5. Section « MÈNE À » : légende « Les indices que celui-ci débloque une fois obtenu — le moteur les lira dans cet ordre. » Chaque ligne : `Select label="INDICE CIBLE" options={avecOrpheline(optionsAutresIndices, valeur, 'indice')}` + `IconButton label="Retirer le lien vers « X »" tone="danger"` ✕. Ligne d'ajout : `Select ariaLabel="Ajouter un lien vers un autre indice" options=[{value:'',label:'+ Ajouter un indice vers lequel celui-ci mène…'}, ...optionsAutresIndices]`. `optionsAutresIndices` EXCLUT l'indice affiché (self-exclusion). État vide de section : `Aucun autre indice à relier — créez-en un second dans ce registre.`
6. Pied de fiche : `IconButton label="Retirer l'indice « X »" tone="danger"` ✕ (toujours actif, refus après tentative SSOT).

**Refus** : bandeau `role="status"`, eyebrow `CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ`, `IssueList` — identique à `FicheObjet`.

**Clavier** : Tab suit l'ordre visuel ; `Entrée` dans un `Field` mono-ligne blur-committe ; retrait réussi ramène le focus sur le bouton retirer de la fiche retombée, ou sur `+ Ajouter un indice…` si la liste est vide.