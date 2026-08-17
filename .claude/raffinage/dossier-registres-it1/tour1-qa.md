RISQUE — Le critère #2 du plan de cadrage (acceptance_criteria de la feature) fait tenir dans un seul Étant-donné/Alors deux relations de nature différente : mene_a[] est un champ AUTHORED indice→indice, alors que le « Étant donné » du critère est ancré sur savoirs[].indice_id / apres_indice_id, une référence personnage→indice de sens opposé. Aucun test unique ne peut prouver cette phrase telle qu'écrite.

OBJECTION — le design_contract cite avecOrpheline()/localiserEntite() pour « toute référence croisée » mais aucun critère n'exige de test d'orphelin sur mene_a[] lui-même : un identifiant inexistant dans mene_a[] doit se signaler, jamais casser silencieusement. Sans ce critère, KR-197/199/202 (discriminance à deux entités) ne trouve pas de test nommé sur ce nouveau champ.

PROPOSITION — Scinder le critère #2 en deux, et ajouter un test de discriminance orphelin/valide sur mene_a (voir annexe #3). Nommer explicitement le cas d'auto-référence (indice pointant sur lui-même dans mene_a[]) comme toléré sans garde neuve, précédent KR-194 (relations[].cible_id) — à écrire, pas à découvrir en revue.

VERDICT — recevable sous réserve : reformuler le critère #2 avant l'ouverture du lot contrat ; les autres critères du plan sont bien formés et testables tels quels.

---

## Annexe — critères candidats it1

1. Étant donné un indice sélectionné dans le registre, quand l'auteur renseigne verite, formulation_joueur et portee, alors DossierService.update() persiste les trois champs et FicheIndice les affiche au montage SANS AUCUNE INTERACTION (non-régression lecture-au-montage, précédent BUG-064) — test composant.

2. Étant donné deux indices A et B existants, quand l'auteur ajoute B à mene_a[] de A via le Select de références croisées, alors A affiche B en LISTE TEXTUELLE d'identifiants (jamais un canevas, KR-204) — test composant.

3. Étant donné un indice A dont mene_a[] contient l'id d'un indice B existant et l'id d'un indice C inexistant, quand le registre se rend, alors B s'affiche sans marque et C s'affiche marqué orphelin — LES DEUX PROUVÉS DANS LE MÊME TEST (discriminance KR-197/199/202) — test composant.

4. Étant donné __fixtures__/dossier-reference.json (indices existants, savoirs les référençant via indice_id/apres_indice_id), quand it1 est livrée, alors validateDossier accepte toujours ces indices sans régression de leurs champs id/nom, et les références restent résolues (non-orpheline) — test lu depuis le fichier réel (précédent dossier-objets critère 6) — test contrat/brain.

NOTE ORCHESTRATEUR : le critère #1 ci-dessus inclut `portee`, en tension avec la proposition PM/Tech Lead (tour 1) de reporter `portee` hors de la fiche d'it1 faute de consommateur. À trancher au tour 2/arbitrage.