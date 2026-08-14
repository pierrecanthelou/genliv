RISQUE — Deux risques intriqués, pas un. (1) Le retrait doit rejouer le mécanisme de refus KR-197 (deux indexations : affichage sous la bonne fiche, invalidation par la bonne entité) — établi pour l'édition de champ depuis it2, jamais encore exercé pour un retrait. Un ouvrier qui indexe le refus de retrait autrement que par personnageId reproduirait BUG-056/061/063/066 sous une 5e forme. (2) KR-194 (auto-référence) n'a jamais été exercé côté ÉCRITURE : se retirer soi-même doit filtrer l'entité ET sa propre relation dans le MÊME commit, sans passer par 'reference-pendante' — personne ne l'a prouvé.

OBJECTION — Le goal d'it7 tel qu'écrit n'est pas reformulé en critères Given/When/Then observables : aucun acceptance_criteria propre à it7 n'existe encore, et la tension modale reste ouverte SANS date de tranchage dans le texte. Une définition de fini ne peut pas s'écrire tant qu'on ne sait pas si le DOM contient un dialog ou non — les deux mènent à des suites de tests structurellement différentes.

PROPOSITION — Trancher la modale AU RAFFINAGE, pas au codage, avec un critère qui NOMME le choix et le distingue du précédent Lieu par le VOLUME de contenu perdu (7 blocs vs 3 champs), pas seulement par l'existence d'un refus SSOT. Quel que soit le choix, écrire les tests nommés de l'annexe AVANT le lot feature.

VERDICT — recevable sous réserve : la tension modale doit être tranchée et les tests KR-194/KR-197 nommés avant le lot feature ; rien ici n'est un veto sur le périmètre produit.

---

## Annexe — tests nommés

| Test | Niveau | Ce qu'il prouve |
|---|---|---|
| `retirer un personnage non référencé le supprime immédiatement, liste N→N-1` | composant (RTL, transposé de panneauLieux.test.tsx) | Écriture réelle via dossiers.update() (filter), pas de retrait optimiste |
| `retirer un personnage référencé par relations[].cible_id d'un AUTRE personnage est refusé : liste inchangée, bandeau visible` | composant | Mirroir du test charpente.depart.lieu_id de Lieu, sur relations[].cible_id |
| `un refus de retrait sur A ne s'affiche pas sous B après changement de sélection` | composant (KR-197, moitié affichage) | Réplique BUG-061 appliqué au chemin retrait |
| `une écriture réussie sur A (édition OU retrait) efface le refus de retrait sur A ; une écriture réussie sur B ne l'efface pas` | composant (KR-197, moitié invalidation, DEUX entités) | Sans ce test, l'un des deux bugs de la classe KR-197 peut réapparaître silencieusement |
| `se retirer soi-même supprime l'entité et sa propre relation auto-référentielle dans le même commit, sans reference-pendante` | composant + assertion document | KR-194 côté écriture — jamais exercé |
| `retirer le personnage n'affecte pas canon/charpente/les autres personnages (hors la relation orpheline attendue)` | composant | Non-régression générale |
| `dialog absent après un retrait immédiat` OU `dialog s'ouvre, Annuler ne modifie rien, Confirmer commite` | composant | Selon l'arbitrage modale — l'un DOIT exister nommément |
| `focus après retrait suit sur l'élément nommé par le plan de la fiche retombée` | composant | Parité avec le précédent Lieu (toHaveFocus()) |
| `le dossier de référence (6 personnages) reste accepté par validateDossier après retrait, hors le personnage retiré` | contrat (brain) | Critère racine #8 de la spec, décliné pour it7 |
