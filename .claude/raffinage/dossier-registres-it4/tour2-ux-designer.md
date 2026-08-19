RÉPONSE     — Je réponds conjointement au tech-lead (risque n°1, nature = seconde source de vérité) et au PM (aucun consommateur nommé pour scene/obstacle) : je retire mon bloc #4 conditionnel (SegmentedControl NATURE, 3 segments). Ce n'était qu'un pari sur une décision non tranchée, pas un besoin propre à mon contrat — le libellé « monstre » se dérive au rendu de `monstre_ref`, zéro champ NATURE dans FicheEvenement.
Sur le point (2) du tech-lead — ENUMERES_FERMES, absent = libre, l'onglet écrit la valeur explicitement à la création — ça correspond exactement à ma proposition (1) de tour 1 (« événement créé sous LIBRES naît `lie_a_histoire:false` explicite, sous LIÉS naît `true` »). Confirmé sans correction : même contrat, en langage de schéma côté tech-lead, en comportement d'écran côté moi.

MES OBJECTIONS DU TOUR 1 —
- Objection 1 (silence D1 sur `declencheur_texte`) : maintenue — confirmée par `tables.ts` (`alerteSansExpr:false`), aucune note ne la conteste ce tour.
- Objection 2 (pas d'`avecOrpheline` sur `monstre_ref`/BESTIARY) : maintenue — confirmée, converge avec le `PREFIXE_BESTIAIRE` du tech-lead qui traite l'affichage, pas l'orphelinat.
- Risque (perte de fiche au changement de filtre) : retiré en tant que risque isolé — absorbé par ma proposition (1)/(2), désormais un contrat unique partagé avec le point (2) du tech-lead.

VERDICT      — recevable sous réserve : nature retirée (accord unanime), enum fermé `lie_a_histoire` aligné, silence D1 confirmé.

---

ANNEXE — Contrat corrigé

**PanneauEvenements**
- `SegmentedControl` (2 segments, inchangé) : « LIÉS » | « LIBRES » — filtre `lie_a_histoire` sur la même collection `evenements[]`. Compteur par segment = taille du sous-ensemble filtré (ex. « LIÉS (4) »).
- Changement de segment : si la fiche ouverte sort du sous-ensemble, sélection → première `ListRow` du sous-ensemble filtré ; sous-ensemble vide → panneau droit affiche l'état vide, bordure pointillée `--accent`, texte « + Ajouter un événement… ».
- Création via « + Ajouter… » : `lie_a_histoire` posé explicitement (`false` sous LIBRES, `true` sous LIÉS) — jamais absent à la création.

**FicheEvenement**
- Bloc #4 (NATURE, SegmentedControl 3 segments) supprimé. Aucun champ `nature` dans le formulaire, aucune ligne de schéma.
- À côté du titre de fiche : texte dérivé, non éditable, non composant séparé — « Monstre : {nom} » si `monstre_ref` renseigné, rien sinon.
- `Select` MONSTRE : options = `BESTIARY` telles quelles (registre constant), sans `avecOrpheline`. Placeholder quand vide : « — Aucun monstre — » (option explicite, jamais une valeur nulle silencieuse).
- Zone `declencheur_texte` : aucune région D1 (« Détecté par l'IA », Badge/Chip) — silence par construction, conforme à `alerteSansExpr:false`.
