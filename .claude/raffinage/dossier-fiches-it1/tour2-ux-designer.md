## Réponse UX — Tour 2

**1. QA (veto) — je maintiens ma position sur PanneauPersonnages, mais je rejoins Tech Lead sur ObjectifsCanon.tsx : ce sont deux surfaces différentes.**

Le veto de QA vise `PanneauPersonnages` (it1) : rien n'y est refusable. C'est exactement la situation déjà tranchée dans `ObjectifsCanon.tsx` v1 (« Construire un état Refus qui ne peut jamais s'allumer serait du code non testable »). Je ne construis pas de forme sans producteur — je maintiens.

Mais le risque de Tech Lead est différent et recevable : `ObjectifsCanon.tsx` a une écriture réellement refusable dès que `objectif_id` existe — exactement le précédent `RefusLieu` de `FicheLieu.tsx`. Je propose de réutiliser ce même patron : bandeau « CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ » + `IssueList`, déclenché sur tentative de retrait d'un objectif référencé — pas la forme `RefusEnCours` que QA proposait pour mon écran.

**2. PM — nom : je tranche pour it1, ni bloc 1 ni bloc 2.**

`nom` est déjà `Entite.nom`, optionnel, coût schéma nul. Je le sors des blocs : champ d'en-tête de fiche, au-dessus de l'accordéon, précédent direct `FicheLieu` (« NOM DU LIEU », premier champ, hors tout groupement). `Field label="NOM DU PERSONNAGE" hint="interne" placeholder="Aldûr le Sage"`, éditable dès it1. Le bloc qui s'ouvre au premier plan s'appelle « CAMP, PLAN & RATTACHEMENT », pas « Identité » — le nom vit hors accordéon. it2 n'a donc rien à ajouter sur nom ; sa ligne design_contract reste fonction/apparence/description_joueur, bloc « Identité » à ce moment-là.

**3. Narratif-IA — confirmé.**

`handleAjouter` écrit `{id, portee:'premier', plan_actions:[], savoirs:[]}`, rien d'autre. Le repli « Personnage n°N (sans nom) » vient de `localiserEntite()`, appelé au rendu — jamais persisté. Le bouton « + Ajouter un personnage… » reste un `boutonAjouterStyle` en pointillé `--accent`, zéro donnée de repli écrite.
