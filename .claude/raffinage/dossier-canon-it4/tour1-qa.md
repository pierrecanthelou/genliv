# Tour 1 — QA — dossier-canon it4

RISQUE — Le goal brut ne nomme ni la suppression d'un lieu ni le cas où ce lieu est déjà référencé par charpente.depart.lieu_id (it2). Domain rule (CLAUDE.md) : « surface dangling references, never silently break them ». Supprimer un lieu choisi comme départ crée une référence orpheline. Sans critère nommé, ce trou passe inaperçu jusqu'à n°5/6.

OBJECTION — Le goal ne cite ni pattern brouillon/commit (Record<id,Brouillon>, garde lecture+mutation post-BUG-058), ni réécriture testée de l'index 3 dossierEditorScreen.test.tsx (KR-187), ni le repli « Lieu n°{index} (sans nom) » dans la liste elle-même (pas seulement le Select Départ), ni la non-régression du compteur SECTIONS[3].compte() (déjà câblé sur monde.lieux.length, sections.ts:92) sur ajout/suppression.

PROPOSITION — Exiger dans le plan, avec nom de test : (1) panneauLieux.test.tsx — création (liste passe de 1 fiche [lieu.amorce, KR-178] à 2), édition des 4 champs + blur + relecture après réouverture (DossierService.update), suppression, très long texte ; (2) test dédié suppression d'un lieu = charpente.depart.lieu_id courant → assertion explicite (orphelin surfacé ou suppression bloquée, à trancher au raffinage, pas silencieux) ; (3) dossierEditorScreen.test.tsx index 3 réécrit + grep non-régression indices 0,1,2,4-9 ; (4) panneauDepart.test.tsx non-régression Lieu[]⊇Entite[] ; (5) garde lecture+mutation sur le Record indexé, nommée dès l'écriture.

VERDICT — recevable sous réserve : la réserve porte sur le cas suppression/référence orpheline, absent du goal et non couvert par aucun instrument existant si non nommé — pas un veto, le patron est déjà éprouvé (it1-3).
