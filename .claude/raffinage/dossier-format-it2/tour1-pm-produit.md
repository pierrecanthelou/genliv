# Tour 1 — `pm-produit` · `dossier-format` it2

**RISQUE** — Décision A pose un principe (« aucune forme hors de la feature qui édite ») que la liste des six points contredit elle-même : les points 1 (`portee`/`plan_actions`), 2 (`Revelation`) et 5 (`ProjectionCharpente`) ne sont pas typables sans ajouter des fragments de champs (savoirs, `declencheur_texte`, `condition_texte`) sur des racines dont la forme complète est censée arriver en n° 4 / n° 6. Risque concret : des types orphelins sans câblage ni test avant des mois — exactement l'anti-pattern que `resolved_decisions` invoque déjà pour rejeter `Delta[]` prématuré (KR-169).

**OBJECTION** — Ta phrase de démo est un décalque de celle d'it1 (rejeter un dossier malformé), sans rien de nouveau observable. Sur les six points, cinq sont de la plomberie de type invisible à l'auteur ; un seul produit une erreur bloquante réellement neuve : le point 4 (`monstre_ref` résolu contre `BESTIARY`), seul à ne réclamer qu'un champ isolé, sans forme du reste d'`evenements`.

**PROPOSITION** — Démo : « **L'auteur peut voir refusé un dossier dont un événement référence un monstre absent du bestiaire.** » Sortir d'it2 les points 2 et 3 tant qu'aucun champ réel ne les porte (`savoirs` n'existe pas avant n° 4, `Delta` n'existe pas avant it4) — les documenter en `resolved_decisions` comme « type nommé, câblage différé », pas codés à vide. Garder 1 (coût nul, plan de cible ambigu), 4, 5 (déjà bloquant au PR d'it1) et 6 (vraie question ouverte, pas une réouverture — `auteur`/`public`/`duree_visee` restent sans domicile).

**VERDICT** — **recevable sous réserve** : la phrase de démo doit changer, et 2/3 doivent sortir ou être requalifiés en déclarations non câblées avant raffinage détaillé.
