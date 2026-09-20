# TOUR 1 — pm-produit — cadrage n°9 moteur-dossier

RISQUE — Le paragraphe roadmap de n°9 empile repoint moteur, demolition integrale
de l'arbre (KR-181), branchement CTA et console dans « 4 iterations » sans dire ou
passe chaque frontiere. Si la demolition atterrit dans le squelette, elle depasse
4 lots et melange « faire marcher » et « nettoyer » — deux signaux de coupe.

OBJECTION — Le goal de feature est correct, mais l'enumeration du roadmap ne
distingue pas un LOT interne (extinction de l'arbre, sans valeur auteur) d'une
TRANCHE demontrable. Risque de veto « valeur utilisateur nulle » sur l'iteration
de demolition.

PROPOSITION — N=4, frontieres redecoupees :
 it1 squelette lecture seule (CTA -> refus nomme ou session initiale affichee)
 it2 la console applique un delta, le journal l'enregistre
 it3 le monde progresse sans le joueur (horloge -> jalon ou etape de quete)
 it4 extinction de l'arbre, dernier lot, jalon d'ingenierie assume (precedent B2)

VERDICT — recevable sous reserve : le « 4 » n'est signable qu'avec ce redecoupage.

## Hors perimetre (feature entiere)
narration/IA -> n°10 · jets arbitres -> n°11 · dialogue PNJ/confiance -> n°12 ·
commentaire de combat -> n°13 · contre-mesures/transfert d'indice/Climat.effets_regles
-> n°14 · fins/mort/reprise/rejeu par graine/bouton lancer-le-test -> n°15 ·
joueur synthetique -> n°16 · repointage tree-canvas -> apres le Temps 2 ·
AUCUNE ecriture dans types.ts/destinations.ts/validate.ts (dossier en lecture seule
pendant la partie, decision n°7) — aucun lot contrat dossier attendu ·
depart.inventaire_initial non ajoute sans besoin nomme ·
NodeScreen/ChoiceList/DecorScreen/PnjScreen/TrapScreen -> n°10

## Points pour le tour 2
- Tech Lead : it1 tient-il en <=4 lots (CTA + init session + console + refus nomme) ?
- Narratif&IA : memoire.faits_etablis sans consommateur en n°9 = type pose sans
  comportement, ou 5e tranche cachee ?
- Ordre it3/it4 : la demolition peut-elle glisser plus tot ? PM penche pour dernier.
