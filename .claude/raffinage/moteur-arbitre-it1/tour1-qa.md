# Raffinage `moteur-arbitre` it1 — Tour 1 — QA

## RISQUE
1. Critères d'acceptation mélangés par itération — les numéros 4–7 de la spec FEATURE décrivent R2 (arbitre), résolution de jets, R3, rejeu — propriétés d'it2+, inexistantes en it1. Aucun jet, aucun appel d'IA en it1 : c'est une tranche d'affichage seul. Clôturer it1 en disant « tous les critères [de la feature] vérifiés » est impossible.
2. KR-013 non tranché avant raffinage — `HeroState` (`player/types.ts`) stocke `pvMax` et `peMax`, dérivables de `maxPV(FO,AG,EN)`. Réutiliser ce type réintroduit le défaut interdit par KR-013 (champ dérivé stocké). La spec dit « à vérifier » mais ne dit pas résoudre si problème.
3. Aléa keyé : pas de test discriminant écrit — il faut que `heroGen.rollHero()` reçoive `rng` de `alea()`, jamais `Math.random` par défaut. Testable (mock alea, vérifier indice, rejeu rouge sans rng) — mais aucun test nommé en spec.

## OBJECTION
Les critères de la spec FEATURE ne sont pas itération-isolés par construction (c'est un index couvrant les 3 itérations, pas le plan d'it1). Mais le PLAN de cette itération, lui, doit scoper ses propres critères à ce qu'it1 délivre réellement — pas recopier la liste feature telle quelle.

## PROPOSITION
1. Le plan d'it1 limite ses propres critères d'acceptation à : création du héros, bandeau, +5 PE (A4), balayage `moteurSansIA.test.ts` — jamais les critères R2/R3/rejeu qui appartiennent à it2.
2. Avant raffinage : trancher KR-013 — importer `HeroState` tel quel (justifier le double-stockage) OU dériver `pvMax`/`peMax` à la lecture, jamais stockés.
3. Écrire deux tests discriminants nommés au plan : aléa keyé (même tirage si même graine+domaine+indice), `rollHero` reçoit bien un `rng` dérivé (mock, vérifier l'indice consommé, mutant qui retire le `rng` → rouge).

## VERDICT
Recevable sous réserve stricte : le plan d'it1 doit scoper ses propres critères (pas ceux de la feature entière), trancher KR-013 explicitement, et nommer les deux tests d'aléa ci-dessus.
