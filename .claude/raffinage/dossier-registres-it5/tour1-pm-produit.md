# Tour 1 — `pm-produit` · `dossier-registres` it5

```
RISQUE      — cette itération est la dernière de la feature : le réflexe naturel est d'y
              refermer aussi les portes restées ouvertes (Indice.portee, retrait, tree-canvas).
              Le vrai risque produit n'est pas là mais dans le nom du champ : `duree` existe
              DÉJÀ dans le schéma comme entier moteur (`plan_actions[].duree`,
              `contre_mesures[].delai`, borné par DUREE_MIN — « nombre de tours »). Un
              `Climat.duree?: string` en prose porterait le même mot pour deux sens opposés
              (entier moteur vs texte auteur) — exactement la collision que cette feature a
              elle-même écartée en it3 pour `enonce` (KR-198).

OBJECTION   — le goal tel qu'écrit nomme « une durée » sans trancher le nom de champ ni la
              Tension n°1 (EditeurEffets oui/non sur Climat). Le critère d'acceptation n°7 dit
              « effets_regles reste un Delta[] éditable via les opérations existantes » — cela
              se lit comme « la mécanique existante continue de fonctionner, inutilisée ici »,
              pas comme « il faut un écran EditeurEffets ». destinations.ts:513-518 tranche
              déjà ce point en langage de contrat ; le goal doit le refléter, pas le rouvrir en
              silence à l'essaim.

PROPOSITION — (1) renommer le champ prose, jamais `duree` : `duree_texte` (motif `_texte`/`_expr`
              déjà établi) ou un mot distinct (`persistance`) ; (2) écrire noir sur blanc dans le
              goal raffiné : « aucun EditeurEffets sur FicheClimat » ; (3) ne rien ajouter au
              périmètre — retrait, portee, tree-canvas restent des open_questions reportées, pas
              des sous-lots de cette itération.

VERDICT     — recevable sous réserve (nom de champ + verrouillage explicite Tension n°1). Sous
              ces deux réserves, cette tranche suffit à déclarer `dossier-registres` fini — les
              questions ouvertes restantes sont légitimement hors périmètre, déjà documentées
              comme telles.
```
