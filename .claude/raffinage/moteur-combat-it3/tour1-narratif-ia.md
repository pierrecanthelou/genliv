## Tour 1 -- Narratif & IA -- moteur-combat it3

### RISQUE

La projection structuree (`ProjectionAssaut`) qui sert de SEUL contexte a R5 n'existe nulle part : ni type, ni fichier, ni borne de budget. `CombatLogEntry.text` contient des AT, PV et rounds en dur (`Round 3 -- Heros (AT 7) vs Monstre (AT 5). Coup franc : -4 PV. [Monstre : 12/18]`). KR-294 interdit son injection -- mais R5 n'a rien d'autre a lire tant que `combatProjection.ts` et `ProjectionAssaut` ne sont pas ecrits. La frontiere tient sur une interface qui n'existe pas encore : si elle est mal specifiee, l'invariant tombe.

### OBJECTION

1. **Budget de contexte R5 non borne.** Les dix roles existants ont tous un `BUDGET_CARACTERES_*` calcule ou mesure, et un refus `trop-long` AVANT tout `fetch`. R5 n'a rien. Le cadrage nomme "projection structuree en entree" sans en borner le cout. Le risque : un combat long (15 rounds de Troll regenerant) accumule 15 projections, et sans borne l'assembleur ne sait pas quand s'arreter. Le narrateur R3 a une cascade a 4 paliers pour exactement cette raison. R5 doit nommer sa borne et son comportement quand elle est franchie -- avant le premier lot.

2. **Borne 400 caracteres (KR-296) vs 800 du narrateur (`NARRATION_CARACTERES_MAX`).** La decision est nommee mais pas justifiee par le cadrage. 400 caracteres font environ 2 phrases en francais -- "2-3 phrases" annoncees par le goal risquent de ne pas tenir. Soit le validateur `validerCommentateur` rejette et on entre en rejeu silencieux permanent, soit le modele ecrit des phrases de 25 mots qui sonnent telegraphiques. A verifier au premier prototype ; je ne bloque pas, mais je demande un engagement : si le taux de rejet depasse 30 % en test, la borne remonte a 600 avant livraison, sans second comite.

### PROPOSITION

1. **Definir `ProjectionAssaut` explicitement dans le plan d'iteration** -- un type pur dans `src/brain/copilote/contexte/commentateur.ts` (nouveau fichier, meme pattern que `narrateur.ts`/`arbitre.ts`/`acteur.ts`), portant UNIQUEMENT :
   - `vainqueur: 'heros' | 'monstre' | 'nul'`
   - `qualite: HitQuality` (les 5 valeurs du registre ferme `brain/combat.ts`)
   - `palierSanteHeros: 'plein' | 'blesse' | 'critique' | 'inconscient'` (derive de `healthState` + un seuil 50 %)
   - `palierSanteMonstre: 'plein' | 'blesse' | 'critique' | 'vaincu'` (idem)
   - `capacite?: string` (le `capacityId` du monstre, si son hook s'est declenche ce round)
   - `posture_heros: Posture`, `posture_monstre: Posture`
   - `round: number`
   Aucun AT, aucun PV, aucun ecart numerique. Un seul round par appel.

2. **Budget R5 = un seul round a la fois, pas un historique.** R5 recoit UNE projection pour UN round, il rend UNE narration. Pas de fenetre glissante, pas de memoire de combat -- le log visuel (it1) est la memoire du joueur. BUDGET_CARACTERES_COMMENTATEUR = cout de la projection (calcule exactement, ~200 caracteres) + canon (terme dossier mesure). Borne et refus `trop-long` AVANT tout `fetch`.

3. **Le commentateur ne voit ni le nom du monstre ni celui du heros.** Il voit "l'adversaire" et "le combattant". Motif : `MonsterInstance.name` est un `string` libre (pas un identifiant), et l'injecter dans un prompt c'est donner au modele un nom que l'auteur n'a peut-etre jamais ecrit dans le dossier. Le canon.ton suffit a donner le registre ; le nom du monstre vient du log mecanique (it1), qui est deja affiche.

### VERDICT

**Recevable sous reserve** que le plan d'iteration definisse : (a) le type `ProjectionAssaut` avec ses champs exacts, (b) la borne `BUDGET_CARACTERES_COMMENTATEUR` calculee, (c) le refus `trop-long` avant tout `fetch`, et (d) la doctrine "un round par appel, zero memoire de combat".

---

### ANNEXE -- Contrat de sortie IA R5 (commentateur)

**Entree injectee (CibleCommentateur)** :
```
canon.ton                        -- QUAND ECRIT, optionnel
canon.interdits_ton[]            -- QUAND ECRIT, optionnel
ROUND
  vainqueur: heros | monstre | nul
  qualite: rate | erafle | franc | magistral | critique
  palier_heros: plein | blesse | critique | inconscient
  palier_monstre: plein | blesse | critique | vaincu
  posture_heros: normale | precise | defensive
  posture_monstre: normale | precise | defensive
  capacite: (identifiant de la capacite, si declenchee)
  round: (numero du round)
```
Aucune AT. Aucun PV. Aucun nom (ni monstre, ni heros). Aucun `CombatLogEntry.text`.

**Schema de sortie** :
```json
{"narration": "..."}
```
- `narration` : chaine, non vide apres trim, <= 400 caracteres, `/\d/` refuse (AUCUN chiffre), ne finit pas par `?`, aucun identifiant du dossier, aucun `MARQUEUR_A_ECRIRE`.

**Gabarit du worker** : `'{"narration": "..."}'`

**Comportement en cas d'echec de validation** :
- Rejeu une fois (KR-230/283) -- second appel avec le meme contexte.
- Apres second echec : silence. Le round s'affiche avec le log mecanique seul (it1), sans narration. Aucun repli deterministe, aucun texte genere par le code.

**Ce que l'IA ne fait PAS** :
- Ne lance aucun de. Ne modifie aucune statistique.
- Ne connait ni le nom du monstre, ni le nom du heros, ni les PV, ni les AT, ni la marge.
- Ne recoit aucun historique des rounds precedents -- chaque appel est sans etat.
- Ne propose aucune action, aucune tentative, aucun choix.

**Budget de contexte R5** :
- Terme DOSSIER : canon.ton + canon.interdits_ton[], mesure puis majore x3 (meme doctrine que les 4 roles de jeu). Plafond estime : ~1000 caracteres.
- Terme PROJECTION : calcule exactement a partir du type ProjectionAssaut (tous les champs a valeurs enumerees, cout fixe par round). Pas de terme memoire.
- BUDGET_CARACTERES_COMMENTATEUR = terme dossier + terme projection. Un seul separateur.
- Refus `trop-long` AVANT tout `fetch`.

---

### Decisions prises en autonomie faute de specification

- **Paliers de sante qualitatifs au lieu de PV** -> j'ai choisi 4 paliers (`plein > 50%` / `blesse 25-50%` / `critique < 25%` / `inconscient|vaincu 0`) -> si l'inverse (PV numeriques), le validateur `/\d/` refuse la narration et l'invariant D4 est en danger.

- **Un round par appel, zero memoire** -> j'ai choisi l'appel sans etat, un round = un appel -> si l'inverse (contexte glissant de N rounds), il faut une fenetre, un budget qui grandit, et une cascade -- trois mecanismes que cette iteration n'a pas le temps de livrer.

- **Ni nom du monstre ni nom du heros dans le contexte** -> j'ai choisi de n'injecter aucun nom libre -> si l'inverse, il faut definir si `MonsterInstance.name` est un champ `ia` ou `auteur` dans `destinations`, et ouvrir la question du scanner `porteUnIdentifiant` sur un nom qui n'est pas un identifiant stable. Cout : une iteration de plus.

- **Borne a 400 plutot que 800** -> j'ai accepte la valeur du cadrage (KR-296) sous reserve d'un seuil de rejet mesurable -> si c'est trop serré, remonter a 600 ne casse rien (c'est une constante, un seul site).