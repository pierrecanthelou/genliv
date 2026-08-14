# TOUR 2 — dossier-fiches it5 (relations + présence)

**OBJECTION DU TOUR 1 (3 emplacements fusionnés) — RETIRÉE.** Le risque visait la fusion en un Bloc 5 unique côté *rendu*, cassant l'invariant « 8 emplacements, −1 par bloc livré » testé depuis it1. Le découpage de tech-lead (§ B, lot 2) livre `BlocRelations.tsx` et `BlocPresence.tsx`, deux composants distincts câblés sur les deux emplacements `relations`/`presence` déjà présents dans `BLOCS_VIDES` — l'invariant reste vérifiable bloc par bloc. Que `useEcritureRelationsPresence.ts` groupe les deux familles dans un seul hook est une question d'implémentation (répartition de handlers), hors du périmètre que mon objection protégeait. Rien à ajouter, rien à bloquer.

**CORRECTIF STEPPER — précisé, pas seulement confirmé.** `{value >= 0 ? prefix : ''}{value}` est insuffisant : à `value === 0` il affiche encore le préfixe (« +0 »), faux pour `intensite` où 0 est neutre — ni hostilité ni attachement, pas « légèrement positif ». Le bon seuil est `value > 0` : le négatif porte son propre signe natif, zéro et négatif ne prennent jamais le préfixe. `{value > 0 ? prefix : ''}{value}` : −3→« −3 », 0→« 0 », +3→« +3 ». Effet de bord assumé et voulu : `ObjectEditor` (BONUS DE JET, min=0, prefix="+") passe de « +0 » à « 0 » — même règle appliquée à un cas non signé, plus juste (pas de bonus ≠ petit bonus). Composant partagé, un seul correctif pour tous les appelants, même lot que `intensite`.

**ÉTATS VIDES — recadrés au périmètre.** `TEXTE_AUCUN_AUTRE_PERSONNAGE` (Relations) et `TEXTE_AUCUN_LIEU_CANON` (Présence) restent, texte inchangé. `TEXTE_AUCUN_INDICE_CANON`/`TEXTE_AUCUN_OBJET_CANON` sortent de ce tour — seul Savoirs les consomme, archivés dans ma note tour 1 pour it6.

---

## ANNEXE — textes finalisés pour ce tour

**`Stepper` INTENSITÉ** (`BlocRelations.tsx`) : `label="INTENSITÉ"`, `min={INTENSITE_MIN}` `max={INTENSITE_MAX}` `prefix="+"`, comportement corrigé du composant partagé ci-dessus. Légende sous le stepper inchangée : *« − hostilité, + attachement »*.

**`presence[].quand`** — destination `auteur` tranchée ce tour (tech-lead + narratif-ia) : hint **réutilisé mot pour mot**, précédent exact `HINT_BUT_ECHEANCE` de `BlocPlanActions.tsx` — *« interne — note d'auteur, jamais lue par le modèle »*. Placeholder inchangé : *« Au crépuscule, avant que le marché ne ferme. »*

**Relations, légende et champs** : inchangés du tour 1 (`Field` « CE QUI LES LIE », hint *« interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur »* ; `Toggle` « SECRÈTE — n'entre jamais dans ce que le modèle voit d'un rôle qui ne doit pas la connaître »). `intensite` en `ENUMERES_FERMES` côté SSOT (tech-lead) ne change pas le widget : un `Stepper` borné produit déjà un ensemble fermé de valeurs, aucune contradiction avec un `Select`.
