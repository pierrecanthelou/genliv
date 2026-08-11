# Tour 1 — QA

RISQUE
Le motif refus/brouillon indexé par entité (BUG-056→058→061, deux angles : affichage ET invalidation) n'apparaît nulle part dans `acceptance_criteria` ni dans KR-190..196 de cette itération, alors que le `design_contract` nomme explicitement `PanneauLieux/FicheLieu` comme précédent direct. Les deux champs d'it1 (camp = SegmentedControl fermé, plan = select déjà existant) sont peu exposés au refus partiel, mais la FORME `RefusEnCours{personnageId, issues}` doit être posée dans ce lot — pas retrofittée en it2 quand `fonction/apparence/description_joueur` (texte libre) l'exigeront. C'est exactement le défaut de BUG-058 : une garde posée d'un seul côté de l'état.

OBJECTION (veto conditionnel)
Sans un critère qui nomme la forme `{personnageId, issues}` et un test « le refus/brouillon d'un personnage ne suit pas un autre personnage après changement de sélection », le lot est acceptable pour livrer mais l'architecture n'est pas verrouillée — je bloque tant que ce critère n'est pas ajouté, même s'il n'a aucun champ à exercer aujourd'hui.

Cas limite objectif_id — déjà structurellement couvert : `REFERENCES_SIMPLES` force un test générique par référence (`couverture.test.ts` + boucle `validate.test.ts`) dès que l'entrée est ajoutée. Exiger que l'entrée `objectif_id` soit visible dans ce lot et nommée dans un critère — pas supposée « couverte par la boucle ».

Critère « 7 placeholders » : texte exact « Pas encore renseigné » déjà nommé au critère 1 — bon. Exiger en plus une assertion de COMPTE (exactement 7, pas 6 ni 8) pour attraper un off-by-one d'accordéon.

PROPOSITION
Ajouter un critère GWT + KR-197 nommant `RefusEnCours{personnageId, issues}` avant code, plus un critère nommant l'entrée `objectif_id` dans `REFERENCES_SIMPLES`.

VERDICT
Raffinage non conforme en l'état — veto sur l'absence du critère refus-indexé-par-personnageId ; le reste (non-régression 6 personnages, 7 placeholders, lint) est recevable.
