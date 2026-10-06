# PM — moteur-horloge it2 — TOUR 1

**RISQUE** — L'itération cadrée n'est pas une tranche. Sa phrase de démo ne couvre que le bloc R3, mais les décisions closes y empilent bandeau PAS #n, durée, `depuis`, bloqué et `si_bloque`. Cela fait environ 10 critères, 5 lots et 3 zones (`brain/dossier`, `brain/copilote`, play-mode). Et `parler` (R4, `useTourDeJeu.ts:276`) et la console n'appellent pas R3 : le changement s'y perd sans trace.

**OBJECTION**
1. Trois comportements sont fusionnés : raconter un avancement, un PNJ bloqué qui change d'approche, un compteur de pas. Veto de coupe.
2. « Sous le récit » : rien n'existe sous le récit. Le bloc est une entrée du modèle, et l'auteur lit de la prose générée. Je réécris « dans le récit » ; le critère testable est le contexte R3.
3. `changementsDe(avant, après)` : `CibleNarrateur` ne porte que `session` (`copilote/types.ts:520-536` interdit la projection à côté). `avant` impose donc un lot contrat plus le hook, absents de la liste des fichiers. `narrateur.ts:73-79` exclut « toute donnée de personnage » : l'ouvrir est un renversement de doctrine.
4. J2 colonne it2, lignes 2 et 5 (minuterie), contredit `types.ts:433-446` : une durée échue = bloqué, pas avancement.
5. PAS #n en it2 : valeur nulle, le journal affiche déjà `#n`.

**PROPOSITION** — 4 itérations pour n° 14, it2 d'abord :
- **it2** : « l'auteur lit, dans le récit, ce qu'un PNJ présent a fait » (4 lots, 7 critères). Perceptible = `presence[]` ∋ `lieu_courant`.
- **it3** : « …lit qu'un PNJ coincé change d'approche ». `depuis` + durée + `si_bloque`, injecté à la transition, avec PAS #n.
- **it4** : climat + extraction `sessionCombat.ts`.

Je retire de it2 le bandeau, la durée, `depuis`, bloqué et la minuterie (hors n° 14).

**VERDICT** — veto sur le périmètre cadré ; levé par cette coupe, alors recevable.

## Hors périmètre (it2)
Bandeau PAS #n ; durée, `depuis`, bloqué, minuterie, `si_bloque` ; climat ; label ÉTAPE BLOQUÉE ; ligne de journal « bloqué » ; narration des pas `parler`/console ; pointeur de narration en session ; transferts et contre-mesures ; enrichissement R4 ; modificateurs numériques.

## Décisions prises en autonomie
- « Sous le récit » → « dans le récit » (entrée modèle)
- Minuterie hors n° 14, durée = bloqué seulement
- Origine du décompte : `depuis` absent ≡ 0
- Bandeau PAS #n déplacé en it3
- Perceptible = `presence[].lieu_id` ∋ `lieu_courant`
- Fenêtre = pas courant seul
- 4 itérations, la spec en compte 3
