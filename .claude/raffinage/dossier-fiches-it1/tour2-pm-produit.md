## PM — Tour 2, itération 1 de `dossier-fiches`

**1. Le sort de « nom » — objection MAINTENUE, mais résolue, pas durcie en veto.**

UX a mappé les 8 blocs de l'accordéon sans jamais nommer `nom` — et il a raison de ne pas l'y mettre : la spec elle-même dit « nom reste Entite.nom, inchangé » (design_contract, `champs_a_plat`), donc ce n'est pas un champ nouveau à ranger dans une tranche de schéma. Mon erreur au tour 1 était de chercher `nom` dans un bloc de l'accordéon. Le précédent tranche pour moi : `FicheLieu.tsx` porte « NOM DU LIEU » comme premier `Field`, au-dessus de toute structure interne, pas dans une section. `Personnage` a un accordéon, `Lieu` non, mais le principe transpose : `nom` est un champ d'en-tête de fiche, hors des 8 emplacements, visible et éditable dès qu'un personnage est sélectionné — pas gagné à it2, pas gagné plus tard.

Coût marginal nul : `Entite.nom` existe, `Field` est déjà dans la liste de composants réutilisés, et le critère d'acceptation n°1 mentionne déjà le repli « Personnage n°N (sans nom) » — il faut juste écrire explicitement le `Field` qui alimente cette valeur. J'amende le critère n°1 : « … apparaît dans la liste (repli si vide) et son accordéon s'ouvre sur Camp, plan & rattachement ; un champ NOM éditable, hors accordéon, en tête de fiche, alimente ce libellé. » Aucun changement au goal d'it2 (déjà correct : fonction/apparence/description_joueur seulement).

**2. Retrait d'un personnage — hors périmètre d'it1. Tranché.**

La phrase de démo d'it1 est « l'auteur crée un personnage, lui donne un camp, confirme un plan ». Retirer n'en fait pas partie et ne bloque pas la démo. Contrairement à Lieu/Objectif, un personnage nu ici est un objet jetable sans coût de nettoyage réel. Je retire volontairement ce que j'aurais pu ajouter par réflexe : pas de bouton retirer, pas de dialog de confirmation, pas de test associé en it1. Signalé pour it2+ — pas engagé maintenant.

**3. Veto QA sur `RefusEnCours{personnageId, issues}` — non retenu, mais pas ignoré.**

Prématuré : à l'intérieur du formulaire de dossier-fiches, aucun champ d'it1 ne choisit un `objectif_id` invalide — le Select ne propose que des ids existants, donc aucune écriture locale n'est refusable. Le vrai risque que Tech Lead a identifié est ailleurs : retirer un objectif *depuis `ObjectifsCanon.tsx`* pendant qu'un personnage le référence encore. C'est un bandeau de refus sur le retrait d'`ObjectifsCanon`, pas une architecture nouvelle dans `dossier-fiches`. Je conditionne l'approbation à ce que ce bandeau (lot dédié) porte un test nommé couvrant précisément ce cas.

**Verdict PM** : favorable sous 2 réserves — (a) `nom` en `Field` d'en-tête hors accordéon, critère n°1 amendé ; (b) retrait de personnage explicitement noté hors périmètre d'it1 dans la revue.
