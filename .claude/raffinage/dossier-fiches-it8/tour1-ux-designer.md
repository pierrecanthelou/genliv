# TOUR 1 — UX Designer — dossier-fiches itération 8

**RISQUE** — C'est le premier bloc de la feature qui combine DEUX jurisprudences distinctes dans une seule section d'accordéon : le gating « TOTAL-en-bloc » de `stats`/`BlocCaracteristiques` (une CTA sème les 8/6 clés d'un coup) et le rendu « toujours visible » des proses de `but`/`BlocIdentite` (Field + placeholder, jamais de geste de révélation). Le risque est qu'un agent, lisant le point (a) du cadrage à la lettre, fasse porter la CTA « + Régler le caractère… » sur `parler`/`jamais`/`cede_si` aussi — brisant la jurisprudence retenue à it3 *et* l'ergonomie établie depuis it2 (une prose ne se « révèle » jamais par un clic).

**OBJECTION** — La question (a) du cadrage suppose une troisième option qui n'existe pas : une prose n'a jamais besoin d'être « semée » pour apparaître, `Field multiline` se rend vide avec son `placeholder` sans écrire au document (précédent `but.libelle`, `fonction`). Il n'y a donc pas de choix à trancher entre « CTA sur les 6 curseurs seuls » et « CTA sur tout » — seule la première branche est cohérente avec le reste de la feature.

**PROPOSITION** — Découper le bloc en 3 sous-sections fixes, dans cet ordre : CURSEURS (gating TOTAL-en-bloc, CTA dédiée, seed des 6 clés SEULEMENT) ; MANIÈRE DE PARLER (toujours visible, 0-2 lignes répétées, CTA d'ajout qui **disparaît** au plafond plutôt que se désactiver) ; LIGNES ROUGES (`jamais` + `cede_si`, 2 Field toujours visibles). Textes exacts en annexe.

**VERDICT** — recevable sous réserve : les 3 sous-sections restent dissociées comme ci-dessus, et la CTA « + Régler le caractère… » n'écrit que `caractere.curseurs`.

---

## ANNEXE — Contrat de design

### Structure du bloc « Caractère exploitable » (8e emplacement de l'accordéon)

Trois sous-sections, toujours dans cet ordre, séparées par `separateurStyle` (précédent PV/Contre-mesures) :

**1. CURSEURS DE CARACTÈRE** (gating TOTAL-en-bloc — précédent exact `BlocCaracteristiques.tsx`)

- Eyebrow (`eyebrowStyle`) : `CURSEURS DE CARACTÈRE`
- État `caractere.curseurs === undefined` : **un seul** bouton `boutonPointilleStyle`, texte `+ Régler le caractère…`, qui sème les 6 clés à `CURSEUR_MIN` en un commit. Aucun autre champ du bloc n'est touché par ce geste.
- État présent : légende (`legendeStyle`) `Curseurs de caractère — jamais lus par le narrateur.` puis grille 2 colonnes (`grilleStyle`, précédent) de 6 `Stepper` (0-10, bornes `CURSEUR_MIN`/`CURSEUR_MAX`, **jamais** de `prefix` signé — contrairement à `intensite`). Label de chaque Stepper : `${CURSEURS[id].label.toUpperCase()} (${CURSEURS[id].affinite})` — ex. `COURAGE (CA)`, `MÉFIANCE (IN)`, `VERVE (IG)` : reprend telle quelle la convention `${label} (${abrégé})` de `BlocCaracteristiques`, le champ `affinite` étant documentaire (KR-193) — l'afficher n'est pas un calcul.
- Focus après clic CTA : déplacement impératif vers le premier `<button>` sous la grille (« Diminuer {premier label} »), précédent exact `BlocCaracteristiques` (`useRef` booléen + `useEffect`, pas besoin de porter l'identité du personnage — même raisonnement, section rendue sous `Accordion key={personnage.id}`).
- Ordre des 6 curseurs dans la grille : celui de `CURSEURS`/`CURSEUR_VALUES` (contrat). Suggestion UX non bloquante : grouper visuellement par affinité (CA, CA, IN, IN, IG, IG) plutôt que l'ordre du goal brut — à trancher par le dev-contrat, ne conditionne pas mon verdict.

**2. MANIÈRE DE PARLER** (toujours visible — aucun gating, précédent `OBJECTIF PERSONNEL`/étapes)

- Eyebrow : `MANIÈRE DE PARLER`
- Légende : `Jusqu'à deux répliques type — donnent le ton, jamais citées mot pour mot par le modèle.`
- Lignes répétées (`listeLignesStyle` + `ligneStyle` + `enTeteLigneStyle`, précédent étapes/relations) : eyebrow `RÉPLIQUE {n}` + `IconButton` `tone="danger"` label `Retirer la réplique n°{n}` glyphe `✕` + un seul `Field` **non multiline** (une réplique est courte, comme `ÉCHÉANCE`) :
  - label `RÉPLIQUE`
  - hint `interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur` (texte identique à `HINT_BUT_LIBELLE`, même catégorie `ia`/didascalie)
  - placeholder : `« Ne traînez pas dehors après la cloche — la garde ne pose pas de questions. »`
- Sous la liste : si `parler.length < PARLER_REPLIQUES` → bouton `boutonPointilleStyle` texte `+ Ajouter une réplique…`, focus après clic sur le nouveau `Field` (précédent `nouvelleEtapeRef`). Si `parler.length === PARLER_REPLIQUES` → **le bouton disparaît**, remplacé au même emplacement par `legendeStyle` : `Deux répliques, pas plus — de quoi calibrer une voix sans la scripter davantage.` Jamais de bouton `disabled` (l'accent ne se ternit pas, il s'efface).

**3. LIGNES ROUGES** (toujours visible, 2 champs, précédent `BlocIdentite`)

- Eyebrow : `LIGNES ROUGES`
- `Field` 1 — label `CE QU'IL NE FERA JAMAIS`, hint `interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur`, multiline rows=2, placeholder : `Il ne trahira jamais un secret confié sous serment, même sous la torture.`
- `Field` 2 — label `CE QUI LE FAIT CÉDER`, même hint, multiline rows=2, placeholder : `Face à une preuve que son fils est vivant, il cède immédiatement — le reste, jamais.`
- Brouillon-local, commit au blur, champ vidé retire sa clé (précédent `useEcritureIdentite`).

### États clavier
- CTA curseurs / CTA réplique : `type="button"`, activables par Entrée/Espace, focus déplacé programmatique après écriture (pas de `useEffect` de synchronisation d'état — lecture dérivée de la longueur, précédent KR-013/113 déjà appliqué dans `BlocPlanActions`).
- Tab traverse : grille curseurs (ordre DOM = ordre d'affichage) → répliques (chacune : champ puis son IconButton retrait) → jamais/cède si. Aucune modale introduite par ce bloc — pas de retour de focus déclencheur à gérer.
- Retrait d'une réplique : pas de confirmation (précédent étapes/relations/contre-mesures — édition réversible, pas une action dangereuse au sens CLAUDE.md).

### Composants utilisés — zéro composant maison
`Stepper` (0-10, sans `prefix`), `Field` (multiline et simple), `IconButton` (`tone="danger"`, `size={HIT_TARGET_MIN}`), styles partagés `boutonPointilleStyle`/`eyebrowStyle`/`legendeStyle`/`separateurStyle`/`listeLignesStyle`/`ligneStyle`/`enTeteLigneStyle` (`styles.ts`, déjà 3 consommateurs).

Fichiers lus : `src/features/dossier-fiches/components/BlocCaracteristiques.tsx`, `BlocPlanActions.tsx`, `BlocIdentite.tsx`, `BlocRelations.tsx`, `styles.ts`, `FichePersonnage.tsx`, `src/brain/components/Stepper.tsx`, `src/brain/characteristics.ts`, `docs/REGLES-DU-JEU.md` (table CA/IN/IG), `src/features/dossier-fiches/specification.json`.
