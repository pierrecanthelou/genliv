## Note d'ouverture — Narratif-IA, moteur-fins it1

### RISQUE

Le critère 6 de la spec nomme un GARDE dans `useTourDeJeu` qui coupe AVANT l'appel à R3 et R5. Or `useCommentaireCombat` (R5) vit dans un hook séparé, appelé depuis `CombatEnCours.tsx` — son point de coupe n'est PAS dans `useTourDeJeu` mais dans le callback `commenter` qui teste `etat.outcome`. Si la garde de fin vit uniquement dans `useTourDeJeu.executeAction`, elle ne couvre PAS R5 : le commentaire de round est déjà déclenché AVANT la clôture, dans la boucle de combat elle-même. Vérifier que `commenter` NE SE DÉCLENCHE PAS sur un round dont l'outcome est `hero-mort` — ce n'est pas une garde de fin à écrire mais un comportement DÉJÀ PRÉSENT à vérifier (projection absente si `phase === 'ended'`, `combatProjection.ts`). Si cette garde n'est PAS là, c'est un veto narratif : un commentaire IA raconte un round qui tue le héros, puis le moteur affiche l'écran de mort — le modèle parle en dernier, usurpant la prose constante.

### OBJECTION

**Le texte constant de mort n'est défini nulle part.** KR-308 dit `--text-strong`, mais la PROSE elle-même — la phrase affichée au joueur quand il meurt — n'est spécifiée ni dans `REGLES-PLAY.md`, ni dans la spec, ni dans `types.ts`. Ce n'est PAS du lore à inventer : c'est un libellé d'interface (`moteur`, pas `ia`). Une constante non spécifiée est un choix de l'implémenteur qui ne sera revu par personne. Où vit-elle ? Qui la valide ?

### PROPOSITION

La constante de mort est un LIBELLÉ DU MOTEUR, pas une prose d'auteur. Elle se définit DANS le composant `EcranFin.tsx` comme constante exportée et testée (ex. `TEXTE_MORT = 'Votre aventure s achève ici.'`). Elle n'entre dans aucun prompt, aucun contexte de modèle, aucune feuille du dossier. Un test vérifie qu'elle est rendue verbatim, comme `texte_ouverture_joueur`.

### VERDICT

Pas de veto. La frontière code/IA est respectée : `Fin.texte` est verbatim, les dés restent au moteur, aucune stat n'est touchée par l'IA. L'objection sur le texte de mort est non bloquante — c'est un trou de spec, pas une violation de frontière — mais elle doit être tranchée AVANT le code.

---

## Annexe — FRONTIÈRE CODE/IA (hors quota)

### Contrat de sortie IA concerné par cette itération

**Aucun appel IA neuf.** Cette itération RETIRE des appels :
- R3 (narrateur) n'est PAS appelé au pas dont l'issue est une fin. La garde se pose dans `useTourDeJeu.executeAction`, APRÈS la persistance de la commande acceptée et AVANT l'appel à `copilote.demander({role: 'narrateur', ...})`. Le test vérifie : commande acceptée + `finAtteinte(dossier, session) !== undefined` → R3 non appelé, `issueNarrateur` reste `null`.
- R5 (commentateur) n'est PAS appelé au round dont l'issue est `hero-mort`. La garde est déjà dans `projeterAssaut` (`combatProjection.ts`) qui rend `null` quand `phase === 'ended'`. À VÉRIFIER qu'elle couvre le cas `hero-mort` et pas seulement `hero-victory`.

### Entrée injectée

Néant — aucune donnée de fin n'entre dans un contexte de modèle. `condition_texte` est `auteur`, `condition_expr` est `moteur`, `texte` est `moteur` et émis verbatim. Le narrateur (`narrateur.ts:79-80`) exclut déjà `fins[].texte` de ses champs injectés.

### Schéma de sortie

Néant — aucune sortie IA n'est consommée par cette itération.

### Comportement en cas d'échec de validation

Non applicable (aucun appel IA).

---

## Décisions prises en autonomie faute de spécification

- Le texte de mort (la phrase rendue au joueur) n'est spécifié nulle part → j'ai choisi de demander qu'il soit une constante nommée dans `EcranFin.tsx` → si c'est une prose d'auteur dans le dossier, il faut un champ `Dossier.charpente.texte_mort` optionnel, un lot contrat, et une troisième prose émise verbatim (coût : une itération de plus et un champ de plus en schema 1)
- Le point de coupe de R5 n'est pas dans `useTourDeJeu` contrairement à ce que le critère 6 dit → j'ai choisi de vérifier que `projeterAssaut` couvre déjà `hero-mort` via `phase === 'ended'` → si cette garde manque, c'est un bug à ajouter au périmètre (coût : un test de plus, une ligne de garde, zéro risque de frontière)
