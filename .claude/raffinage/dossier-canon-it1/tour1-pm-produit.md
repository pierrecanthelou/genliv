# Tour 1 — PM — `dossier-canon` it1

RISQUE — `PANNEAU_PAR_SECTION` marque `canon`, `depart` ET `lieux` tous trois `featureNum: 3` : un exécutant pressé peut lire « même feature, autant livrer les trois panneaux d'un coup » alors que le cadrage de la feature a explicitement échelonné Canon (it1) → Départ (it2) → Lieux (it4). C'est le risque concret de cette itération : l'override ne doit se brancher **que sur `sectionId === 'canon'`** ; `depart` et `lieux` gardent EXACTEMENT leur texte d'état vide actuel (« … l'écran d'édition arrive avec la feature n°3 »), qui reste vrai tant qu'eux-mêmes n'ont pas leur propre lot.

OBJECTION — aucune sur le fond du cadrage : le goal est bien borné (4 champs, 0 schéma, 1er appelant d'`update()`), KR-183/184/185/187 couvrent les points que j'aurais soulevés (warnings rendus, isolation, pas de TargetPicker ici — aucun champ Canon n'est une référence).

PROPOSITION — Goal confirmé tel quel, avec une clause de garde explicite au plan : « le panneau `depart` et le panneau `lieux` restent inchangés dans ce lot ». 2 lots suffisent (contrat `DossierService.update` / feature `dossier-canon` + repointage `DossierEditorScreen`) — je ne vois pas de 3e lot nécessaire. Point d'attention transmis au tech-lead, pas un veto : si le rendu des `warnings` (KR-183) devient un composant partagé, ce n'est PAS une abstraction prématurée — les 3 itérations suivantes (Départ, Objectifs, Lieux) appellent toutes `update()` et devront toutes afficher les mêmes `warnings`, précédent identique à `ListRow`.

Hors périmètre explicite : Objectifs des camps (même si futur voisin du même panneau `canon`), Départ, Lieux, tout `…_expr`, compteur `BUDGET_MOTS_CANON` (polish différé), toute validation au-delà de refusé/écrit.

VERDICT — recevable.
