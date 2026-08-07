# Tour 2 — PM Produit · `dossier-format` it3

**Réponse nommée** — **UX Designer** (tour 1) demande de créer `contre_mesures[] extends Entite` + entrée `ESPACES_DE_NOMS` maintenant, pour sauver KR-164. **Je refuse.** Gonfler le périmètre d'it3 pour honorer une KR sur une famille que `tech-lead` ET `narratif-ia` proposent tous deux d'exclure n'est pas un besoin de l'auteur aujourd'hui — l'auteur n'a aucune contre-mesure à écrire tant que la n° 4 n'existe pas. Créer la forme maintenant sans feature éditrice, c'est la « forme sans producteur ni consommateur » que la décision A interdit : KR-164 s'honorera le jour où `contre_mesures` a un producteur, pas avant.

**Mes objections du tour 1**
- **A** (purger « Revelation à portes » du goal) — **MAINTENUE**. Personne ne l'a contestée (C13) ; à appliquer telle quelle à l'écriture du plan.
- **B** (`lieux.acces` hors comité) — **RETIRÉE en partie**. Le tech-lead a tranché le principe (arête orientée) à coût nul, sans créer le champ ni toucher un fichier du lot — mon motif tombe. Je maintiens seulement que **le champ reste propriété de la n° 5** : aucun fichier de la liste d'it3 ne doit créer `lieux[].acces`.

**C1 (5 ou 6 familles)** — je tranche pour **cinq**. La sixième (`contre_mesures`) sort du plan d'it3, **reportée nommément** — pas un critère fantôme mais une ligne d'`open_questions` explicite, ce que demande la QA. Sur *où* elle revient : je retiens `narratif-ia` (**n° 4**, `contre_mesures` vit sous `personnages`, même geste que `plan_actions[].action`) plutôt que le tech-lead (n° 6) — c'est la feature qui possède déjà la racine voisine, pas une future feature non encore cadrée. La phrase de démo se resserre en conséquence : « l'auteur peut voir refusée une condition qui référence un identifiant absent, sur les cinq familles posées par D1. »

**C6 (`lit: CheminDeSession[]`)** — **je rejette**. Table sans lecteur avant la n° 9, même motif que le retrait de `BUDGET_CONTEXTE` en it2 : une donnée sans consommateur dans *cette* itération est un pari, pas un besoin, et elle consomme le budget d'une seule innovation par itération pour rien. Si `narratif-ia` la juge indispensable au design du registre, elle revient documentée en n° 9, sur du code qui la lit réellement.

**C10 (`lieux.acces`)** — cf. objection B : tranché à coût nul, hors lot, champ toujours propriété de la n° 5.

**VERDICT** — recevable sous réserve : goal purgé de la mention it2, `contre_mesures` reportée nommément à la n° 4 (cinq familles seulement en it3), champ `lit` retiré du descripteur de prédicat.
