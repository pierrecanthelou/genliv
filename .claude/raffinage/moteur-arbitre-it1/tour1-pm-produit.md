# Raffinage `moteur-arbitre` it1 — Tour 1 — PM Produit

## RISQUE
La règle A4 (+5 PE sur `commande.aller`) ajoute, dans la même itération, une seconde preuve de vie à « l'auteur voit son héros » (création, puis réaction au déplacement). Tant que la tension KR-013 sur `pvMax`/`peMax` n'est pas tranchée par écrit, le lot contrat (`EtatSession.heros?` + `alea.ts`) ne peut pas s'écrire sans arbitrage préalable — le flou traîne au-delà du cadrage.

## OBJECTION
Deux éléments déjà posés se contredisent sans que le cadrage le relève. « `HeroState` importé TEL QUEL, jamais une seconde forme » (resolved_decisions) vs KR-013 (« rien de dérivable stocké »). Si `pvMax`/`peMax` sont des champs stockés du type importé, les écrire littéralement viole KR-013 ; les calculer à la lecture sans les écrire respecte KR-013 mais laisse le type porter des champs jamais renseignés en session. Pas un veto (architecture, pas mon domaine), mais ça doit être tranché explicitement ce tour par le tech lead, écrit noir sur blanc, avant tout code sur le lot contrat.

## PROPOSITION
La phrase de démo tient sans « et » — « à l'ouverture d'une partie sans héros, l'auteur crée son héros puis le regarde vivre dans le bandeau en se déplaçant » : création et réaction au déplacement forment une seule observation continue, pas deux features empilées. Découpage confirmé à 2 lots (contrat `heros`+`alea` ; feature écran+bandeau+A4), rien à retrancher. Déclenchement de la création confirmé à l'ouverture de la partie (déjà écrit au critère d'acceptation n°1 — lu comme tranché, pas comme une question ouverte).

Hors périmètre, à écrire explicitement dans la spec it1 : le jet et toute IA (R2/R3), le calcul/gain d'XP (it3), la boutique de progression (déjà rejetée au cadrage), repos/potions/régénération de PE hors A4, renoncer au jet (it2+), suppression/édition du héros (un seul héros, aucun dialogue dangereux requis ici), combat (n°13).

## VERDICT
GO conditionnel. Pas de veto sur le découpage ni sur la phrase de démo. Si la tension KR-013 n'est pas tranchée en toutes lettres avant l'écriture du lot contrat, je durcis en veto au tour 2.

---

## Décisions prises en autonomie faute de spécification explicite
- Le moment de déclenchement de la création du héros n'était pas listé dans `open_questions` → lu le critère d'acceptation n°1 (« quand la partie s'ouvre pour la première fois ») comme déjà tranché par le cadrage plutôt que de le rouvrir → sinon, une fenêtre où une commande pourrait s'exécuter sans héros assigné, et A4 n'aurait pas de cible au premier déplacement.
- Aucune action de suppression/édition du héros n'étant demandée pour it1, pas de dialogue de confirmation prévu (pas d'action dangereuse à ce stade) → si un besoin de régénération/réédition apparaît plus tard sans que ce choix soit explicité, ça coûterait une dette d'action destructive non gardée.

## Fichier lu
`src/features/moteur-arbitre/specification.json`
