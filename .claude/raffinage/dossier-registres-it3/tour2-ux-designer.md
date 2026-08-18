RISQUE — sans clé explicite, l'instinct naturel d'un dev-lot est une clé React dérivée du contenu (`${effet}:${cible}`) : elle collisionne exactement sur le cas que QA veut garantir (deux Delta identiques dans recompense[]), produisant un avertissement React et une fusion de comportement entre les deux lignes.

OBJECTION (tour 1, statut) — retirée. Le risque de confusion « OBJECTIF » lu comme référence est levé par le renommage de clé du tech-lead — ma réserve portait sur l'accompagnement du libellé d'écran par tout choix de clé, condition remplie.

PROPOSITION — (1) clé React des lignes EditeurEffets = position dans le tableau rendu (index, brouillon inclus en dernière position) — jamais une clé dérivée du contenu ; sûr ici car RÉCOMPENSE n'a pas de réordonnancement manuel, comme ÉTAPES. (2) libellé d'écran aligné sur la clé retenue par le tech-lead au moment de ma note (« ÉNONCÉ DE LA QUÊTE »). (3) Ligne d'étape en cours d'ajout : structurellement identique à une ligne committée, aucun chrome distinct ; le placeholder vide est l'unique signal « non committé ». (4) EtapeQuete.etape : confirmé, valeur d'affichage dérivée de l'index à chaque rendu, jamais un champ de formulaire, jamais éditable.

VERDICT — recevable, condition tour 1 remplie.

---

## ANNEXE — précisions tour 2 (le reste de l'annexe tour 1 est inchangé)

Clé React des lignes `EditeurEffets` = `index` de la ligne dans le tableau rendu (brouillon local inclus, toujours en dernière position) — jamais dérivée du contenu (`${effet}:${cible}`), pour la même raison que `EtapeQuete` : aucune donnée du domaine ne porte cet index, c'est une valeur de rendu.

Ligne d'étape en cours d'ajout : structurellement identique à une ligne écrite — même `Field` label `LIBELLÉ`, même eyebrow `ÉTAPE {index+1}` dérivé de sa position. Aucune bordure/fond distinct ; le placeholder vide est le seul signal de brouillon (même rôle que le `Select` CIBLE vide d'`EditeurEffets`).

Le champ s'appelle désormais **ÉNONCÉ DE LA QUÊTE** (clé `enonce`, tranchée par le tech-lead au tour 2), `Field` multiline `rows={2}`, hint `interne — prose libre, jamais une référence` (inchangé), placeholder inchangé `Retrouver l'enclume volée avant la foire de printemps.`
