# Tour 2 — PM Produit · `dossier-format` it4

## Mon objection du tour 1 — statut

**MAINTENUE, durcie sur la forme.** Les cinq rôles convergent (C1/C2) : `relations`, `presences`, `acces`, `mene_a`, `monstre_ref` sortent du texte du but. Je ne la retire pas tant que `specification.json` (`plan.iterations[3].goal`) porte encore ces cinq mots — **un consensus de comité qui ne redescend pas dans le fichier que l'essaim va lire n'est rien.** Condition de recevabilité, pas veto : je fournis le texte corrigé.

## Réponse nommée — QA, sur BUG-050

La QA a raison sur le **constat** (« BUG-050 n'apparaît dans aucun critère écrit ») mais se trompe sur le **statut** : ce n'est pas une extension de périmètre à arbitrer au tour 2, c'est une **décision déjà prise**. `open_questions` le dit noir sur blanc : *« REPORTÉ it4 (raffinage it3, condition ferme de la QA) — BUG-050 … journalisé DANS le lot d'it3 et non seulement mentionné en revue — un report dit en revue disparaît »*. BUG-050 **est** dans it4, tranché depuis it3. Je rejoins donc la QA sur la forme — il doit passer en critère écrit — et je signale la citation à qui rouvrirait le fond.

## C13 — ma décision : **une itération, pas deux**

1. **`dossier-format` reste à cinq itérations** — décision actée (« CONSÉQUENCE À TENIR »). Créer un it4bis la rouvrirait sans motif nouveau, et il n'y a nulle part où mettre un fragment excédentaire : it5 a déjà son but propre et est explicitement la dernière.
2. **BUG-050 est déjà dans le périmètre d'it4**, pas une addition que je pourrais reporter en la retirant.
3. Le précédent existe dans cette feature : it3 a plié **cinq familles de conditions** hétérogènes sous UNE phrase à quantificateur universel. (a) les deltas-références et (b) les trois champs de `savoirs[]` sont **la même mécanique** (résolution de référence) — ça se plie sans effort. (c) BUG-050 est une mécanique différente (forme d'élément, pas résolution) mais partage l'**instrument** — mêmes fichiers, même `couverture.test.ts`, indivisibilité confirmée par le tech-lead — et un quantificateur bien choisi l'absorbe sans « et » d'actions.

**But corrigé que je propose** (remplace `plan.iterations[3].goal`) :

> « L'auteur peut voir refusé tout effet ou savoir mal formé de son dossier — référence à une entité qui n'existe pas, opération que le moteur ne reconnaît pas, ou élément de liste qui n'est pas un objet — sans que rien ne passe silencieusement en `ok:true`. »

Zéro « et » d'action, **un seul verbe** (« voir refusé »), trois instances nommées d'une même propriété. Je vérifie mes propres seuils : 1 lot, 8 critères (à la limite, pas au-dessus), 1 feature — aucun ne déclenche la règle de coupe. **Je ne scinde pas.**

Ce que je retire pour compenser : rien de *nouveau* — ce lot ne grossit pas par rapport à ce qu'it3 avait acté pour it4, il **se resserre** (les cinq mots fantômes disparaissent).

## C9 — écrire une section de règles : **hors périmètre**

Non, ce n'est pas le travail de `dossier-format`. Inventer « les effets de climat » pour combler un trou de schéma serait écrire une règle de jeu **dans une itération de format** — l'inversion exacte que KR-130 interdit. Je rejoins `narratif-ia` : `climat[].effets_regles: []` reste légitime sous la doctrine absent/vide déjà tranchée en it2. La réouverture viendra de la feature qui a besoin du mécanisme, **avec sa section dans `docs/REGLES-DU-JEU.md` d'abord**. Ce n'est pas un veto — personne ne propose de le faire ici — c'est une clarification pour que personne ne le tente à l'exécution.

## C3 — pas mon veto, mais ma valeur

Je penche pour `narratif-ia` contre l'UX sur l'exclusion des opérandes entiers, **même motif que C9** : la doc des règles ne pose aucune magnitude d'auteur pour l'XP ou les PV, donc admettre `gagner_xp: 3` fige une valeur de jeu que personne n'a arbitrée, **dans le dossier d'un auteur, avant qu'elle existe dans la source de vérité**. C'est une question de valeur et de périmètre, pas d'architecture — je n'y mets pas de veto, mais je signale que la version à six entrées rouvrirait implicitement une décision de règles qui n'est pas la sienne à prendre ici.

## Verdict

**Recevable sous réserve** : (1) but d'it4 réécrit tel que ci-dessus **dans `specification.json` avant tout lot** ; (2) BUG-050 promu en critère écrit ; (3) aucune section de règles de jeu écrite dans ce lot ; (4) opérande entier hors `DELTAS` schéma 1. **Aucun veto de mon fait sur ce tour.**
