# Tour 2 — qa — dossier-controles it7

## ANNEXE MESURÉE

### M1 — le silence des deux fixtures, sous la sémantique retenue

**Résultat brut** : le SEUL `donner_objet` de `dossier-reference.json` cible `objet.amulette-scellee` (l.319). `objet.sceau-de-cendre` (l.273) n'apparaît QUE dans les trois `possede_objet` de `canon.objectifs[1]` et `charpente.fins[0]` — **aucun `donner_objet` ne le cible**.

**Calcul, objectif par objectif** (3 objectifs sur les 2 fixtures) :

- `minimal` / `refermer-le-sceau` = `ET(jalon_atteint(premiere-nuit), NON(evenement_consomme(...)))`. `jalon_atteint` = constante vraie. `NON(...)` = `true` **sans descendre**. → **SILENCE.**
- `reference` / `reveler-la-vigie` = `ET(lieu_visite, jalon_atteint)`, deux constantes vraies → **SILENCE.**
- `reference` / `proteger-le-sceau` = `possede_objet(objet.sceau-de-cendre)` seul, aucun producteur → **`objectif-sans-chemin` BLOQUANT.**

**CONFIRMÉ, pas infirmé.** Et le `NON` de la minimale est un **vrai discriminant de mutant** : une implémentation de `non` qui descendrait et inverserait ferait basculer ce nœud à `false` et allumerait `objectif-sans-chemin` **À TORT** sur cette fixture.

**Localisation exacte de l'assertion qui casse**, non faite au tour 1 à ce niveau : le test « le calme des deux fixtures et du dossier neuf ne bouge pas » pin `reference.controles` à **10 lignes exactement** (`:1236-1245`), **PAS zéro** — le « calme » testé est l'absence du pont `avertissement-de-validation`, pas l'absence de tout constat. Sans correction, ce tableau doit gagner une 11ᵉ ligne.

### M2 — le coût exact de corriger la fixture

**13 suites** lisent le fichier. Vérifiées une par une :

- `couverture.test.ts` — documente sa propre doctrine (l.35) : « il échoue par NOM de champ, jamais par un compte ». **Immunisé par construction.**
- `suffisance.test.ts` — vérifie qu'**au moins un** delta existe par site, jamais un compte exact ; `:238-245` compare des **clés JSON**. **Immunisé.**
- `validate.test.ts` — les quatre tests de non-régression comparent un document corrompu à un document intact ; un delta bien formé de plus ne produit ni erreur ni avertissement. **Immunisé.**
- `panneauObjets`, `retraitObjet` — comptent `monde.objets` (3), pas les deltas qui les ciblent. **Immunisés.**
- `panneauPersonnages`, `savoirs`, `panneauConditions`, `panneauIndices`, `panneauJalonsFins` — vérifiés un par un, aucune épingle sensible. **Immunisés.**
- `panneauEvenements.test.tsx:332` — le test ajoute LUI-MÊME une résolution et pin `resolutions.toHaveLength(3)` — un compte au niveau **RÉSOLUTIONS**, pas au niveau `consequence[]` d'une résolution existante. **Aucun test du dépôt ne pin la longueur de ce sous-tableau.** → site **gratuit**.
- **`panneauQuetes.test.tsx:301-304` et `:323` — SEUL point de coût réel.** Commentaire en dur « La quête de référence porte déjà **2** récompenses » + `toHaveLength(3)`. Si le correctif vise `quete.retrouver-la-vigie.recompense`, ce commentaire devient faux et l'assertion doit passer à 4.

**Conclusion** : le coût **dépend du SITE**. Une seule suite sur 13 est sensible, et seulement pour le site « quête ».

### M3 — l'hypothèse « sans `canon-sans-objectif` »

Distinction opérée : ce qui dépend de `canon-sans-objectif` (tire sur `seme()`, dossier neuf à `objectifs:[]`) vs `objectif-sans-chemin` (tire **PAR OBJECTIF** — donc **jamais** sur une collection vide, `predicat` n'ayant rien à évaluer).

| assertion | sort |
|---|---|
| `:504`, `:520-522`, `:567`, `:1222-1228` | **NE BOUGENT PAS** — `seme()` a zéro objectif, zéro constat produit |
| `panneauControles.test.tsx:86-90` | **NE BOUGE PAS, fichier ENTIER hors du lot** |
| `dossierEditorScreen.test.tsx:137`, `:384` | **NE BOUGE PAS, fichier ENTIER hors du lot** |
| `:488` (discriminance par comptage) | **BOUGE** — mais **6→7**, pas 6→8 |
| KR-226 (`NEUVES` / `TEMOINS` + garde) | **BOUGE** — **+1**, pas +2 ; la collision `split('.')[0] === 'canon' === section` se produit **avec une seule règle déjà** |
| `:1236-1245` (tableau `reference`) | **BOUGE, causé par `objectif-sans-chemin` seule** — 11ᵉ ligne, sauf correction de fixture |

**Conclusion** : la coupe est validée et **quantifiée**. Elle retire du lot, exactement et sans aucune modification : `:504`, `:520-522`, `:567`, `:1222-1228` et **les deux fichiers de test de features en entier**.

## Réponse nommée à l'objection PM

M3 montre que la tension AC1 **disparaît entièrement** sous la coupe : `objectif-sans-chemin` seule ne touche jamais une collection vide. Ce n'est pas un compromis bancal — c'est la conjonction exacte qui satisfait à la fois le veto PM et mon propre veto.

## Statut sur mon veto du tour 1

**Retiré, sous trois conditions inscrites en critères** : (1) le comité adopte le report ; (2) le mesurage M1 est **rejoué en test réel** dès que la fonction existe, pas cru sur ma trace manuelle ; (3) la fixture est corrigée dans CE lot, au site gratuit.

**Si le comité maintient les DEUX règles malgré M3, mon veto se durcit** : deux features touchées ET une réécriture d'AC1 non actée.

## C4 — et je conteste la forme de la confrontation

En relisant les trois notes mot à mot, **je ne trouve pas le clivage à trois** que la consigne présuppose. Le narratif écrit littéralement « nommant la première feuille en défaut ». La phrase du tech-lead « n'énumère aucun fait » se lit, dans son propre contexte, comme une règle de **cardinalité** — un seul constat, jamais une liste de N faits — pas comme une interdiction de nommer LE fait unique retenu.

**Verdict testabilité** : un message qui NOMME la feuille est le seul des deux qui puisse être asserté **VERBATIM par scénario** (patron déjà en place à `validate.test.ts:2599`). Un message générique ne peut être vérifié que par « non vide + registre de langue » — un test qui passe **DÉJÀ** sur toute règle existante, et qui ne peut donc PAS distinguer « la bonne feuille a été désignée » de « la mauvaise ». C'est précisément le patron qu'une couleur mesurée doit fuir.

## Critères finaux (hypothèse recommandée) — 8

1. `dossier-minimal.json` → `conditionAccomplissable` rend `true` ; **un mutant où `non` descend et inverse est démontré rouge sur ce MÊME dossier**.
2. `dossier-reference.json` tel quel → `objectif-sans-chemin` BLOQUANT sur `proteger-le-sceau`, et la fixture corrigée **dans ce lot** — jamais l'assertion neutralisée.
3. Le `donner_objet` correctif vise **`evenement.embuscade-a-la-tour.resolutions[].consequence`**, pas `quete.retrouver-la-vigie.recompense` (le premier coûte zéro fichier, le second en coûte un).
4. Les 7 clés de `PREDICATES` représentées, **totale par compilation**.
5. `NEUVES` / `TEMOINS` gagnent **exactement une** entrée ; la garde `split('.')` remplacée par une table épinglée, **avec le mutant `section: path.split('.')[0]` démontré rouge**.
6. `:488` reste vrai à **7**.
7. `validate`, `couverture`, `suffisance`, `amorce`, `roundtrip`, `panneauControles`, `dossierEditorScreen` : les **sept** verts **SANS AUCUNE MODIFICATION**.
8. Le message **nomme la feuille fautive**, asserté **VERBATIM par scénario**.

VERDICT — recevable sous réserve, à la condition que l'arbitrage retienne le report **et** le site de correction n° 3.
