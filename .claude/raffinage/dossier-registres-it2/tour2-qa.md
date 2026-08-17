RISQUE — confirmé, KR-211 annonce toujours deux tests dont un seul est neuf en it2 (Delta[] jalons/fins déjà acquis depuis dossier-format) ; MAINTENUE.

OBJECTION — KR-211(b) imprécis : DURCIE, pas seulement maintenue. Vérifié tables.ts:656 + validate.ts:751 : `charpente.jalons[].declencheur` porte `alerteSansExpr:false`, donc un jalon sans `declencheur_expr` n'émet jamais `condition-sans-expr`. Fixture `jalon.second-guet` VÉRIFIÉE EXISTANTE (dossier-reference.json, charpente.jalons[1], `effet:[]`, sans `declencheur_expr`) — ma réserve tour 1 est levée, la fixture prouve elle-même l'absence d'alerte, utilisable telle quelle.

OBJECTION 2 — nouvelle, portée par le trou tech-lead (CHAMPS_REQUIS) : aucun test ne couvre aujourd'hui qu'une entité jalon/fin fraîchement créée passe `validateDossier` sans `champ-requis-vide` — le geste it1 nu (`{id}`) y rougirait. À AJOUTER nommément, quelle que soit l'option retenue. Si MARQUEUR_A_ECRIRE : ajouter en plus qu'une Fin ne portant que le marqueur (`condition_expr` absent) déclenche BIEN `condition-sans-expr` dès la création (`alerteSansExpr:true` sur Fins) — comportement voulu, mais à nommer explicitement sinon indistinguable d'une régression future.

PROPOSITION — trois tests nommés au lot : (1) non-régression Delta[] seule, retirée du goal it2 ; (2) création jalon/fin acceptée sans `champ-requis-vide` ; (3) Fin marqueur-seul → bandeau D1 visible, Jalon marqueur-seul (`second-guet`) → aucune région status.

RÉPONSE TECH-LEAD — son objection (CHAMPS_REQUIS) n'a ni résolu ni contredit KR-211(a)/(b) : orthogonale, elle ajoute une cellule (identité document) absente de ma reformulation tour 1. Trou restant : aucun, sous réserve du test (2).

VERDICT — recevable sous réserve.
