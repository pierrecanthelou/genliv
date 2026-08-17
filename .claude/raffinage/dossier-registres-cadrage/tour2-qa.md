RÉPONSE AUX OBJECTIONS

RISQUE — si jalons/fins rejoint le découpage sans que je révise mon plancher tour 1 (≥4 tranches), la spec livre une itération neuve sans critère écrit et sans garde D1 nommée — exactement le trou que KR-199 sanctionne (un test vert dont le nom promet plus que ses assertions).

OBJECTION — nommément à Tech Lead et UX : j'accepte jalons/fins, mais KR-189 (code-knowledge.json) le nomme déjà porteur du motif D1 (« dossier-registres n6 : jalons/fins/evenements ») — donc deux tests manquent au découpage actuel, pas un. (1) `couverture.test.ts` doit étendre sa table aux Delta[] de jalons/fins, au même rang que récompense/effets déjà couverts pour quêtes/événements. (2) Garde D1 : région `role="status"` distincte du bandeau de refus, assertion via `getAllByRole('status')` (jamais `getByRole` nu), discriminance sur deux entités distinctes — un jalon conforme, un non conforme (motif KR-197/199/202). Sur le graphe : rejet total, je rejoins Tech Lead — aucun instrument du dépôt (jest+jsdom+Testing Library) ne voit un canevas, pan/zoom/dagre. Seule la liste textuelle `indices[].mene_a` reste observable — ici ou jamais dans cette feature ; le sujet visuel se rouvre avec sa propre feature canevas, pas comme itération différée de dossier-registres.

PROPOSITION — jalons/fins = 5e itération, placée après Quêtes (établit l'éditeur Delta[]) et avant Climat (reste dernier, la plus chère — KR-190 : un seul lot contrat par itération). Plancher révisé ≥4 → ≥5. Nouveaux KR à partir de KR-204 : au moins deux, un par test nommé ci-dessus.

VERDICT — recevable sous réserve : jalons/fins n'entre au découpage que si ces deux tests sont écrits dans la spec avant tout code.

Annexe — statut tour 1 : RISQUE (critère canevas inobservable) DURCI EN VETO — tout critère pan/zoom/glisser/dagre sur `indices` est irrecevable pour dossier-registres. OBJECTION (quatre tranches cachées) MAINTENUE, étendue à cinq si jalons/fins rejoint. PROPOSITION (≥4 itérations, graphe=liste texte, non-régression dossier-reference.json, KR dès KR-204) MAINTENUE, plancher relevé à ≥5.

NOTE ORCHESTRATEUR : position d'ordre pour jalons/fins ("après Quêtes, avant Climat" — donc position 3 ou 4) diverge de tech-lead tour 2 (position 2, juste après Indices) et de UX tour 2 (position 5, dernier). Voir arbitrage.