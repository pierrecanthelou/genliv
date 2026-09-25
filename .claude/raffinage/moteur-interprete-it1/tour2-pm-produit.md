# Tour 2 — PM Produit (contre-lecture)

## Contrat de sortie de R1 (QA obj.1, position tech-lead/narratif-ia)

Nécessaire, et pas coûteux pour mon walking skeleton. Narratif-ia a déjà livré, au tour 1 (Annexe B), exactement ce que QA réclamait en PROPOSITION 2 — types réseau/résolus disjoints, prédicats de `validerInterprete` dans l'ordre, gabarit d'invite, table d'échec — dans le MÊME tour, sans ouvrir de nouveau lot ni décaler l'essaim. Le lot `contrat` que Décision A impose de toute façon (toute tranche touchant le schéma) absorbe ce travail par construction : ce n'est pas une itération 1bis, c'est le contenu du lot 1 déjà prévu par tech-lead. Mon squelette n'est pas cassé : il gagne un contrat écrit avant le code au lieu d'un contrat inventé en codant — strictement moins de reprise, pas plus. Le vrai coût aurait été de NE PAS geler : deux prompts divergents, tests qui dépassent le code en silence, précédent que le comité refuse déjà pour les 3 rôles existants (`schemaSortie.ts`/`GABARIT_SORTIE`). Geler avant code : **nécessaire**.

QA obj.2 (verrou de tour, PROPOSITION 3) : j'accepte le scénario de test comme clarification du critère 10 déjà dans le périmètre it1, pas comme un critère neuf — ne gonfle pas l'itération, rend testable ce qui était déjà promis.

## Lieu sans `description` → inatteignable en saisie libre (charge proposée au PM par narratif-ia)

Je rejette la charge pour it1, je ne rejette pas le constat. C'est un trou de contenu auteur, pas un bug de moteur — et un contrôle côté auteur touche une surface d'écriture du dossier (panneau `monde`/Lieu), une feature que it1 n'a pas le droit de toucher : it1 est `brain/dossier` + `play-mode` uniquement. L'ouvrir sur un panneau d'auteur ferait de cette itération une tranche horizontale à deux features — exactement ce que mon poste vetoterait si quelqu'un le proposait comme périmètre. Je **reporte** : entrée `open_questions`, sans propriétaire assigné (candidat naturel : la feature qui porte la validation structurelle de `Lieu`, ou une future itération de n°10 si personne d'autre ne l'adopte). Non bloquant pour it1 — précédent déjà accepté par le comité pour KR-261 (avertissement non bloquant, 3/11 chemins couverts).

## `canon.ton` non requis → dégradation silencieuse (narratif-ia)

Acceptable pour it1, sans signal supplémentaire. Doctrine « squelette d'abord » (CLAUDE.md point 6) : it1 refuse le polish et les cas limites. Un dossier sans ton qui reçoit un message fixe plutôt qu'une clarification est une dégradation gracieuse, même patron que celle déjà actée pour R3/budget en it4 (§2.8 garde-fou 4) — pas un état corrompu, pas de fiction improvisée. Je regroupe ce point avec le précédent (lieu sans description) : deux trous de contenu auteur, même traitement — un futur avertissement d'auteur, jamais un blocage de it1.

## Ma propre objection (tour 1) — mélange des 4 itérations dans `acceptance_criteria`

**MAINTENUE**, ni retirée ni durcie en veto. Elle est corroborée, pas contestée : l'annexe de QA reproduit exactement mon découpage (1,2,3,4,10,11 dans it1 ; 5,6,7,8,9 hors périmètre), le lot 1/lot 2 de tech-lead couvre le même sous-ensemble fichier par fichier, narratif-ia ne parle que de ce même périmètre. Personne ne défend le tableau `acceptance_criteria` tel qu'écrit dans `specification.json` — pourtant le texte du fichier n'a pas bougé depuis le tour 1, il reste un tableau plat de 12 critères sans balise d'itération. Je ne durcis pas en veto parce que la convergence des 4 rôles rend le risque théorique pour ce cycle-ci ; mais je pose une condition d'écriture, pas une préférence : à l'étape Docs (Build Steps §4), le sous-ensemble it1 (critères 1,2,3,4-volet-R1,10,11 ; critère 12 réduit à l'invariant de forme « journal ne stocke que des `Commande` ») et une section « hors périmètre it1 » explicite (5,6,7,8,9, le reste de 12) doivent être gravés dans `specification.json` — pas seulement dans des notes de raffinage — avant que l'essaim ne lise le fichier. Non fait avant le lot contrat → je durcis en veto au tour suivant.

## Décisions prises en autonomie (PM, tour 2)

- La charge « contrôle auteur / lieu sans description » n'avait pas de propriétaire → je l'ai déclarée hors périmètre it1, reportée en `open_questions` sans feature assignée → si le comité veut la trancher maintenant, le coût est de rouvrir une deuxième feature (panneau d'auteur) dans une itération censée rester une tranche verticale unique `brain/`+`play-mode`, cassant la règle « une seule tranche verticale ».
- J'ai regroupé les deux trous de contenu (ton absent, lieu sans description) sous un même traitement « avertissement futur, non bloquant » → si le comité les traite différemment (l'un bloquant, l'autre non), le coût est de justifier pourquoi un trou de contenu bloque quand l'autre non, sans dossier de fiction de référence pour trancher entre les deux.

## Verdict global

Recevable, aucun veto nouveau de mon poste. Seule condition posée : graver le sous-ensemble it1 + la section hors-périmètre dans `specification.json` avant l'essaim (procédural, pas un blocage de fond).

Fichiers lus : `.claude/raffinage/moteur-interprete-it1/tour1-{pm-produit,tech-lead,ux-designer,qa,narratif-ia}.md`, `src/features/moteur-interprete/specification.json`.
