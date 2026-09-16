# Tour 2 — ux-designer — dossier-controles it7

**1. Réponse à C4 (priorité). Je cède.** `MESSAGE_INDICE_SANS_RACINE` (`controles.ts:321-322`) tranche déjà mon cas exactement, et je ne l'avais pas relu avant le tour 1. L'argument tech-lead tient **même quand le OÙ nomme déjà l'objectif** : nommer l'objectif dit « où aller corriger », nommer le prédicat / la cible dirait « quoi corriger » — et c'est cette seconde résolution qui coûte une traversée `ExprNode` → français **inexistante dans le dépôt**, plus un terme interne dans la prose. Je retire mon patron nommant `PREDICATES[…].label` et la cible. **Effet collatéral favorable** : un gabarit qui ne nomme rien **dissout de lui-même** mon problème d'arité 2 (`pnj_a_revele`) — plus de cas spécial à écrire.

**2. Statue.** Mon OBJECTION tour 1 (absence de traducteur `ExprNode` → phrase, arité 2) : **RETIRÉE**, sans objet sous le texte retenu. Mes deux `REJETÉ` (clé technique brute ; id brut) : **MAINTENUS** comme garde-fous pour l'essaim, même si le texte final ne les sollicite plus directement.

**C1** — je ne durcis pas en veto (périmètre hors mandat) mais je précise le point demandé : **la règle des états vides ne s'applique pas ici comme suggéré**. « Aucun contrôle à signaler » n'est pas un vide à combler par un placeholder, c'est une **confirmation positive** ; sa non-atteignabilité à t=0 n'est pas un vide muet — c'est un badge BLOQUANT qui pointe une action réelle et non ambiguë, au même titre que `texte_ouverture_joueur`, accepté depuis l'it1. Je maintiens ma distinction **bandeau global (refusé it1) / ligne de panneau (jamais jugée)**. Si le comité retient le report, cela ne me coûte aucun texte : le contrat ci-dessous est inchangé dans les deux cas.

**C3** — oui, **sans réserve** : c'est exactement le genre de constat qu'un auteur veut voir s'allumer (un objectif « protéger X » où X n'est jamais donné). Le texte retenu le raconte fidèlement sans jamais nommer `sceau-de-cendre` ni `possede_objet`, en pointant l'objectif comme lieu d'action. Je rejoins la QA : **corriger la fixture dans ce lot, jamais affaiblir la règle pour la faire taire**.

**VERDICT : recevable.**

---

## Annexe — Contrat de design FINAL (textes figés, mot pour mot)

### Règle 1 — `canon-sans-objectif` *(si elle reste au périmètre)*

- `niveaux: ['bloquant']`, `section: 'canon'`.
- **Condition exacte** : `dossier.canon.objectifs.length === 0`.
- **location** (statique) : « CANON · OBJECTIFS — décide si la partie est gagnée ou perdue. »
- **message** (statique) : « Aucun objectif n'est posé : rien ne dit au moteur quand cette aventure est gagnée ou perdue. »
  *Anti-BUG-088* : la condition dit « collection vide » ; le message dit « aucun objectif posé » + la conséquence exacte — rien de plus, aucune affirmation sur « le jeu est injouable ».
- **remediation** (statique) : « Posez au moins un objectif (Objectifs). »
- `path: 'canon.objectifs[].id'` (forme mesurée valide par `estCheminDeChamp`). `entityId` : absent.
- Pastille de section : **aucune ligne de `pastilles.ts` à toucher** (élision d'it2 déjà générique).

### Règle 2 — `objectif-sans-chemin`

- `niveaux: ['bloquant']`, `section: 'canon'`.
- **Condition exacte** : pour un objectif dont `reussi_si_expr !== undefined`, `conditionAccomplissable(dossier, reussi_si_expr) === false` (bottom-up : `et`=∀, `ou`=∃, `non`=vrai sans descente). **Silence** si `reussi_si_expr === undefined` (c'est `condition-sans-expr` qui parle) ou si `canon.objectifs === []`.
- **location** (dynamique, fonction existante, **aucun texte neuf à écrire**) : `localiserEntite('objectif', objectif, index)` → ex. `Objectif « Protéger le sceau »`, repli `Objectif n°2 (sans nom)`.
- **message** (statique, **identique pour tout prédicat et toute arité**) :
  « Cette condition de réussite ne pourra jamais s'accomplir : aucun chemin de ce dossier ne peut l'établir. »
  *Anti-BUG-088* : la condition établit « racine de `reussi_si_expr` non satisfiable » ; le message dit exactement cela — ne nomme ni prédicat ni cible, ne prétend pas que l'objectif entier est perdu (`echoue_si_expr` n'est pas concerné), et **couvre nativement l'arité 2 sans gabarit spécial**.
- **remediation** (statique) : « Reliez cette condition à un fait que le dossier peut produire, ou simplifiez l'expression (Objectifs → Condition de réussite). »
- `path: 'canon.objectifs[].reussi_si_expr'`. `entityId: objectif.id`.

### Ce qui ne change pas (confirmé, pas supposé)

- Zéro composant neuf, zéro token neuf — les règles vivent dans le registre `CONTROLES` existant, anatomie OÙ/QUOI/QUOI FAIRE + pastille fusionnée (KR-218) inchangée.
- Clavier : la ligne de rapport est un `<button>` natif déjà livré.
- Registre de langue : les messages restent adressés à l'auteur, aucun terme technique (`ExprNode`, `predicat`, id brut) — conforme au précédent `MESSAGE_INDICE_SANS_RACINE` et à la ligne 462 (« Cette condition de réussite reste en prose : rien ne l'évaluera. »).
