## RISQUE / OBJECTION / PROPOSITION / VERDICT

**RISQUE** — Le mot « camp » existe déjà deux fois dans les références avec des vocabulaires différents : `Personnage.camp` (`PLAN-BASCULE-IA.dc.html` §1.4, hors périmètre it3, référence partiellement périmée) est `protagoniste|antagoniste` — singulier, sans « joueur » — alors qu'`Objectif.camp` (cette itération) est `protagonistes|antagonistes|joueur` — pluriel, trois valeurs. Un dev qui recopierait l'énuméré depuis le wireframe au lieu de `types.ts`/la spec introduirait un troisième vocabulaire divergent. Le contrat en annexe fixe les trois valeurs et leurs libellés `Select` pour couper court.

**OBJECTION** — Imbriquer `Card` par objectif dans la `Card` du panneau double une surface porteuse d'ombre pour rien : `Card` peint toujours `--shadow-card` (ou `--ring-selected`), jamais une simple bordure — ma règle « hiérarchie par filets/teintes, ombres réservées menus/modales » interdit de l'utiliser comme conteneur répété d'une liste. `interdits_ton` a déjà résolu ce problème sans composant : un `div` stylé, borduré, sans ombre.

**PROPOSITION** — Bloc interne borduré/teinté (pas `Card`) : `border: var(--border-subtle)`, `background: var(--surface-inset)`, `border-radius: var(--r-xl)` (« inner cards » — nommé pour ça dans les tokens). Champs dans l'ordre nom → camp → réussite → échec. `IconButton` de retrait en pied de bloc, sans confirmation (aucune référence vivante à `objectif.id` aujourd'hui, même régime que retirer un interdit). Bouton pointillé « + Ajouter un objectif… » identique au patron livré. Liste vide = seul ce bouton, pas de texte d'état vide séparé.

**VERDICT** — GO avec objection non bloquante — absorbée par la proposition. Contrat en annexe.

---

## Annexe — contrat de design

### Composants
`Card` (le panneau englobant seul — inchangé, déjà en place dans `PanneauCanon`), `Field` (nom, condition de réussite, condition d'échec), `Select` (camp), `IconButton` (retrait), `IssueList` (bandeau de refus, inchangé). Bloc interne « carte objectif » : **pas un composant nouveau** — un `div` stylé au même idiome que `ligneInterditStyle`/`listeInterditsStyle` déjà dans le fichier, scié en plus grand. Zéro composant maison.

### Emplacement dans `PanneauCanon.tsx`
Cinquième bloc du `champsStyle`, après « INTERDITS DE TON », avant le bandeau de refus — suit l'ordre du schéma (`canon.ton`, `canon.interdits_ton`, `canon.objectifs`).

### Section — eyebrow
```
OBJECTIFS DES CAMPS — interne, condition de victoire, injectée au modèle
```
Style : identique à `titreInterditsStyle` (mono, `--fs-eyebrow`, `--text-label`, `--track-eyebrow`, suffixe en `--ink-6`).

### Bloc interne par objectif (nouveau, pas `Card`)
```css
border: 1px solid var(--border-subtle);
border-radius: var(--r-xl);
background: var(--surface-inset);
padding: var(--space-6);
display: flex; flex-direction: column; gap: var(--space-4);
```

**Champ 1 — Nom**
```
label:       NOM DE L'OBJECTIF
hint:        interne
placeholder: Percer le secret du Gouffre scellé
```
Registre AUTEUR — terse, mono eyebrow label, valeur libre en `--font-ui`.

**Champ 2 — Camp** (`Select`, commit immédiat au `onChange`, pas de brouillon — même régime que `lieu_id` dans `PanneauDepart`)
```
label: CAMP
options, dans cet ordre exact (source : acceptance_criteria + resolved_decisions) :
  { value: 'protagonistes', label: 'Protagonistes' }
  { value: 'antagonistes',  label: 'Antagonistes' }
  { value: 'joueur',        label: 'Joueur' }
```
Valeur par défaut à la création d'un objectif : `'protagonistes'` (premier de l'ordre).

**Champ 3 — Condition de réussite**
```
label:       CONDITION DE RÉUSSITE
hint:        phrase factuelle pour le moteur, jamais de fiction
multiline, rows=2
placeholder: Le héros a atteint le fond du Gouffre scellé.
```
(Placeholder repris mot pour mot de l'exemple JSDoc de `reussi_si_texte` dans `types.ts` — canonique, pas inventé.)

**Champ 4 — Condition d'échec**
```
label:       CONDITION D'ÉCHEC
hint:        phrase factuelle pour le moteur, jamais de fiction
multiline, rows=2
placeholder: Le héros meurt, ou quitte Val-Cendre sans avoir percé le sceau.
```

**Pied de bloc — retrait**
```jsx
<IconButton label={`Retirer l'objectif n°${index + 1}`} tone="danger" size={HIT_TARGET_MIN}>✕</IconButton>
```
Aligné à droite, seul sur sa ligne. **Pas de dialogue de confirmation** : aucune autre entité du dossier ne référence `objectif.id` à ce stade (aucun `personnages[].objectif.rattachement` avant n°4+) — même régime que le retrait d'un interdit de ton, déjà livré sans confirmation.

### Bouton d'ajout
```
+ Ajouter un objectif…
```
Style : `boutonAjouterStyle` existant, réutilisé tel quel (bordure pointillée `--accent`, fond `--accent-bg`, texte `--accent`, `--r-md`, `min-height: var(--hit-target)`).

### État vide de la liste
Aucun objectif créé → la liste ne contient QUE le bouton pointillé « + Ajouter un objectif… ». Pas de texte d'état vide séparé — précédent exact d'`interdits_ton` : l'affordance porte l'invitation.

### Registre de langue
Nom, camp, condition de réussite, condition d'échec : **registre AUTEUR/MJ** — prose factuelle, jamais lue par le joueur (aligné sur `registres_de_langue` du `design_contract`, comme `synopsis_mj`/`ton`). Aucun placeholder de ces quatre champs ne bascule en deuxième personne ni en présent immersif — c'est le test qui distinguerait un objectif d'une `accroche_joueur`.

### Clavier
Pas de modale ici : Tab traverse nom → camp (`select` natif) → réussite → échec → retirer, dans cet ordre, sans `tabIndex` custom. `Select` change au `onChange` natif (pas d'Entrée à intercepter). Les deux `Field` commitent au blur, comme le reste du panneau — cohérent avec le rythme de frappe déjà établi par Canon/Départ.

### Ce que je n'ai PAS dessiné (hors périmètre, exclu explicitement)
Aucun `Select` « condition moteur », aucun `TargetPicker`, aucun emplacement grisé en attente de `…_expr` — conforme à `objectifs_texte_seul`.

### Note de cohérence avec le tour 1 tech-lead
L'eyebrow proposé ci-dessus dit « injectée au modèle » — à vérifier au tour 2 contre `destinations.ts` : `reussi_si_texte`/`echoue_si_texte` sont destination `'auteur'`, jamais `'ia'` (cadrage §5). Si confirmé, l'eyebrow doit être corrigé pour ne pas mentir sur l'audience — probablement « interne, condition de victoire du camp » sans mention d'injection.
