# Tour 2 — `narratif-ia`

**VERDICT** : recevable sous réserve — trois réserves, et un veto.

**RETRAIT — P1, les deux entrées de registre : retirée.** Le motif décisif n'est pas la circularité du tech-lead, c'est **la spec elle-même** : l'itération 4 déclare « objectif sans chemin » comme **une seule règle à deux niveaux**. Scinder une règle parce qu'elle émet deux niveaux obligerait à scinder celle-là — deux codes pour une cause, exactement ce que KR-164 interdit. Second motif, mesuré : la remédiation est déjà par CHAMP, pas par entrée. Le compte d'entrées n'achetait rien. → `niveau` et `section` sur `ConstatControle`.

**Contrepartie demandée** — `ControleDescripteur` déclare `niveaux: readonly NiveauControle[]`, l'ensemble **fermé** que la règle peut émettre (`['bloquant','alerte']` ici, singleton pour les cinq d'it3), et un test balaye `CONTROLES` (KR-199, jamais N littéraux) pour vérifier que tout constat rend un niveau déclaré. Sans ça, « un code par cause » quitte le registre pour la prose d'un `controler()`, et it3/it4 n'ont plus d'ancre. Un champ, un test.

**MAINTIEN** — `includes` contre la QA · P3 réconcilié avec l'UX · **P4 durci en VETO** : les quatre `Controle.path` sont les **clés littérales** de `DESTINATION_DES_CHAMPS`, épinglées par un test — veto si `path` est une chaîne forgée dans `controles.ts`. It1 ne rendant pas la ligne cliquable, `path`/OÙ est le **seul** chemin de retour vers le champ · P5 (`jouable` calculé, jamais rendu) non contesté.

## Réponses nommées

**Tech-lead** — concédé sur `ConstatControle`, et ton argument est plus fort que tu ne l'écris : it4, pas seulement it1. Ta table `Record<keyof typeof AMORCE, …>` est retenue — c'est elle qui fait casser `tsc` sur une cinquième prose semée.

**QA** — la convention « marque EN TÊTE » est une propriété du **semeur**. Le linter lit un texte **édité par l'auteur**, où le marqueur peut finir n'importe où. `includes ⊇ startsWith`, sans coût en faux positif : le glyphe ne se tape pas au clavier.

**UX — le dossier importé, tranché : hors périmètre du linter tout court.** Mesuré : `validate.ts` l. 300 refuse `''` **et** le blanc, donc une prose vide est inatteignable sur un dossier persisté ou importé. Reste le cas réel — une prose non blanche mais creuse (« TODO »). Aucune règle littérale ne la voit, et la seule qui le pourrait est un jugement de qualité : je refuse de le confier au modèle et je ne sais pas l'écrire en code déterministe. La ligne QUOI ne doit **pas** le dire — elle parle d'un contrôle qui s'est déclenché, pas d'un qui n'existe pas. C'est **l'état calme** qui porte l'honnêteté, et la formule de l'UX le fait déjà : « le dossier passe tous les contrôles **connus** » — le mot « connus » est le correctif, il ne se retire pas.

## Notes d'exécution

1. Ordre de rendu : le bloquant, puis `synopsis_mj`, `accroche_joueur`, `ton` — l'ordre du schéma, aucun tri dans la vue.
2. **`remediation` ne recopie pas la consigne semée** : reprendre le texte d'`AMORCE` ferait de `controles.ts` un second porteur d'une prose dont `amorce.ts` est la source, et les deux dériveraient. La consigne s'adresse à un auteur devant un champ ; la remédiation à un auteur qui lit un rapport — même fait, deux registres, deux textes assumés.
3. `remediation(constat)` se résout par `constat.path`, sur une table dérivée de la table des champs, jamais par une chaîne reconstruite.
4. **Le test n'écrit pas le glyphe non plus**, et n'est pas une tautologie : il asserte `message.includes(MARQUEUR_A_ECRIRE)` (constante importée) **et** un fragment français sans glyphe portant la conséquence. Les deux ensemble épinglent les deux propriétés sans recomposer le gabarit.

Aucun contrat de sortie IA concerné : aucun modèle appelé, frontière code/IA inchangée.
