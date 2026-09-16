# Tour 2 — pm-produit — dossier-controles it7

**RÉPONSE NOMMÉE** — au renvoi du tech-lead (C1) et à l'objection QA sur AC1 : les deux se referment ensemble par le report.

**MON OBJECTION TOUR 1 : RETIRÉE.** Elle posait un choix binaire — (a) silence contredisant AC10, ou (b) assumer noir sur blanc qu'AC1 passe à 5 lignes. **Le report dissout la question** : AC1 reste vrai sans une ligne modifiée, rien à trancher cette itération. Motif additionnel, jamais levé par personne au tour 1 : le silence du linter sur les collections vides (`personnages`, `indices`) est une **DOCTRINE écrite** du `design_contract` (« absent ≠ vide »), pas un oubli — et aucune note ne dit pourquoi `objectifs` y ferait exception. Trancher cette exception sous la pression d'une échéance de test serait moins soigné que la trancher en tête d'it8, à froid.

**C1 — TRANCHÉ : je reporte `canon-sans-objectif` à it8.** Trois motifs cumulatifs, aucun seul ne suffirait :

1. la phrase de démo déjà écrite au plan (« l'auteur voit qu'un objectif qu'il a posé n'a aucun chemin qui puisse l'accomplir ») ne parle que d'`objectif-sans-chemin` — `canon-sans-objectif` est un ajout **au-delà** de cette phrase, pas son contenu ;
2. elle est la **SEULE** cause des deux fichiers `bascule-editeur` touchés — deuxième feature, signal de coupe non négociable de mon poste ;
3. elle rouvre **sans le dire** la doctrine « silence sur collection vide », sans qu'aucun rôle n'ait justifié pourquoi `objectifs` diffère de `personnages` / `indices`.

**Ce qu'on perd** : rien de neuf — aujourd'hui aucun contrôle ne couvre `objectifs` vide, statu quo un tour de plus. **Ce qu'on gagne** : AC1 intact, une seule feature touchée, zéro réécriture de `CHAMPS_SEMES`, la phrase de démo tenue mot pour mot, et la question doctrinale posée proprement plutôt qu'escamotée.

Je note l'argument UX (le rejet d'it1 visait le bandeau global, pas une ligne) — **recevable sur la lettre**, mais il ne répond pas aux motifs (1) et (2), suffisants seuls.

**C2** : AC1 gagne, intact, un tour de plus — sans arbitrage nécessaire puisque son concurrent sort du lot.

**C3** : hors mon domaine de veto — mon avis de valeur : **lecture (a)**. La fixture de référence décrit une aventure réellement injouable ; corriger la fixture est la valeur du produit qui s'exprime dès le jour un. Rouvrir `possede_objet` pour l'accommoder reviendrait à affaiblir une garantie de domaine (références par id, prérequis explicites) pour un confort de fixture.

**VERDICT — recevable sous réserve** : report de `canon-sans-objectif` à it8 (goal d'it7 et AC10 réécrits en conséquence), reste du lot (`objectif-sans-chemin` seule) inchangé.
