RISQUE — le veto de mon poste porte sur un précédent : `EditeurEffets` est le premier composant du genre du dépôt, donc le premier endroit où un dev-lot pourrait réinventer les libellés des 4 options « EFFET » au lieu de réutiliser verbatim `DELTAS[clé].label`, ou coder un select maison au lieu de composer `Select`+`avecOrpheline`+`localiserEntite`. Second risque : le champ candidat `objectif` (cadrage L5) reprend le mot que KR-198 proscrit précisément pour ne jamais confondre prose libre et référence — et `but.echeance` existe déjà comme précédent qui évite ce piège pour `échéance`, pas pour `objectif`.

OBJECTION — le cadrage écrit `objectif?` sans consigne de libellé d'écran distinct : affiché tel quel (« OBJECTIF »), un auteur qui vient de lire « DONNEUR » (une référence) juste au-dessus lira ce champ comme potentiellement référentiel, alors que c'est de la prose libre au même titre que `but.libelle`.

PROPOSITION — (1) `Field` labellé « OBJECTIF DE LA QUÊTE » (jamais « OBJECTIF » seul), hint « prose libre — jamais une référence », miroir exact du hint de `but.libelle`. (2) Les 4 options du `Select` EFFET reprennent mot pour mot `DELTAS[clé].label` (« donne l'objet », « retire l'objet », « révèle l'indice », « marque le jalon atteint ») — zéro texte réinventé. (3) ÉTAPES suit `PlanAction` à l'identique : pas de réordonnancement, `etape` dérivé de l'index (jamais un champ de formulaire), brouillon différé sur `libelle` (précédent `useEcriturePlan.ts`).

VERDICT — recevable sous réserve (le libellé d'écran « OBJECTIF DE LA QUÊTE » doit accompagner tout choix de clé JSON fait par le tech-lead).

---

## ANNEXE — contrat de design

### `FicheQuete.tsx` — ordre des champs (dans un `Card`, `champsStyle` = colonne, gap `--space-6`, précédent `FicheIndice.tsx`)

1. **NOM DE LA QUÊTE** — `Field`, hint `interne`, placeholder `La dette du forgeron`.
2. **DONNEUR** — `Select` optionnel, idiome « porte » (précédent `apres_indice_id`, `BlocSavoirs.tsx:430-467`) : tant que `donneur_id` est absent, une seule ligne `Select` dont la première option est `+ Choisir un donneur…` (value `''`), options = `avecOrpheline(optionsPersonnages, donneur_id ?? '', 'personnage')`. Une fois choisi : le `Select` résolu (label `DONNEUR`) + `IconButton` `label="Retirer le donneur"` `tone="danger"` `✕`, qui remet `donneur_id` à `undefined` (jamais `null`, cohérent avec le type optionnel du cadrage).
3. **OBJECTIF DE LA QUÊTE** — `Field` multiline `rows={2}`, hint `interne — prose libre, jamais une référence`, placeholder `Retrouver l'enclume volée avant la foire de printemps.`
4. **ÉCHÉANCE** — `Field` mono-ligne, hint `interne — note d'auteur, jamais lue par le modèle` (précédent exact `but.echeance`), placeholder `Avant que la caravane ne reparte, à l'aube.`
5. **ÉTAPES** — voir ci-dessous.
6. **RÉCOMPENSE** — `EditeurEffets` (voir ci-dessous), dernière section avant le bandeau de refus — même position que « MÈNE À » dans `FicheIndice.tsx`.

### Section ÉTAPES

Décision : **une étape n'a pas d'ordre manuel** — même patron que `PlanAction` (précédent direct, `BlocPlanActions.tsx`), pas de Monter/Descendre. `eyebrowStyle` « ÉTAPES », légende `Le déroulé de la quête, dans l'ordre où le joueur les franchit.` Chaque ligne (`ligneStyle`) : eyebrow `` `ÉTAPE {index+1}` `` (jamais un champ — `etape` est dérivé de l'index, écrit `index+1` au commit) + `IconButton` `label="Retirer l'étape n°{index+1}"` `tone="danger"` `✕` + `Field` multiline `rows={2}` label `LIBELLÉ`, hint `interne — ce que le joueur accomplit à cette étape`, placeholder `Convaincre le passeur de traverser la rivière de nuit.` Ligne d'ajout : `+ Ajouter une étape…` (`boutonPointilleStyle`), brouillon différé — `libelle` vide ne committe jamais (précédent `useEcriturePlan.ts`, `action`).

### `EditeurEffets.tsx`

Props textuelles (jamais codées en dur dans le composant — passées par l'appelant, condition de réutilisation sans fork en it4) : `titre` (ici `RÉCOMPENSE`), `legende` (ici `Ce que la quête donne au joueur une fois résolue.`).

Anatomie d'une ligne (précédent `enTeteLigneStyle`, la ligne « MÈNE À ») : `Select` label `EFFET`, options = les 4 entrées de `DELTAS` dans l'ordre du registre, **texte d'option = `DELTAS[clé].label` verbatim** (`donne l'objet`, `retire l'objet`, `révèle l'indice`, `marque le jalon atteint`) — jamais réécrit ; puis `Select` label `CIBLE`, options = `avecOrpheline(optionsDuNamespace, cibleCourante, refKinds[0])` où le namespace dépend de l'EFFET choisi (`objet`/`indice`/`jalon`), première option `— Choisir une cible —` (value `''`) tant qu'aucune n'est prise ; puis `IconButton` `label="Retirer cet effet"` `tone="danger"` `✕`.

Comportement : changer EFFET sur une ligne déjà écrite vide `CIBLE` et repasse la ligne en brouillon (évite un `Delta` transitoire malformé — `cibles` doit rester un identifiant du bon espace). Ligne d'ajout : `+ Ajouter un effet…` (`boutonPointilleStyle`) — ajoute une ligne locale (EFFET = première entrée du registre, CIBLE vide) ; écrite au document seulement quand CIBLE est renseignée (brouillon différé, précédent `EtapeQuete`/`useEcriturePlan.ts`). Retirer une ligne déjà écrite est immédiat (✕, pas de modale — retrait de LIGNE, pas de fiche entière).

État vide (`recompense` absent ou `[]`, cas légal) : légende affichée + `Aucune récompense — cliquez « + Ajouter un effet… » pour commencer.` (`emptyTextStyle`/`legendeStyle`, jamais un vide muet).

### Clavier

Identique au patron `FicheIndice.tsx` : `Tab` suit l'ordre visuel des champs déclaré ci-dessus ; `Entrée` dans NOM/DONNEUR/OBJECTIF-mono-ligne/ÉCHÉANCE blur-committe (les deux `Field` multiline — OBJECTIF, ÉTAPES.libelle — insèrent un saut de ligne comme tout `<textarea>`) ; les `Select` s'ouvrent/valident au clavier natif (comportement HTML natif du composant `Select`, aucun geste souris requis) ; focus revient à l'input déclencheur après tout retrait de ligne (`IconButton` ✕), jamais perdu dans le vide.
