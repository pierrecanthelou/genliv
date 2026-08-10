## Réponse nommée aux points soulevés

**1. Poignée ⠿ — j'accepte l'omission totale du Tech Lead, je retire ma proposition de prop `draggable`.**
Son argument reprend ma propre doctrine : une affordance qui ne fait rien ment, au même titre qu'un bouton « + Ajouter » désactivé — c'est exactement ce que je visais avec `draggable?: boolean` (défaut `false`), mais cette prop restait un prop mort sans appelant cette itération. Mon motif tour 1 (« éviter de changer la signature deux fois ») ne tient pas : une prop additive optionnelle n'est pas un changement cassant, l'ajouter en n°5 avec un vrai appelant ne coûte rien de plus que l'ajouter maintenant sans appelant. L'omission totale est strictement plus sûre (aucun risque qu'un consommateur passe `draggable=true` par erreur avant que le drag existe) et suit la discipline déjà posée par le Tech Lead sur `onSelect` requis (« aucune branche non testée »). J'adopte l'Annexe C telle quelle.

**2. `compte(dossier)` = « — » pour Canon et Départ — j'accepte, et mon texte d'état vide du panneau droit pour Départ ne change pas.**
Deux objets distincts : `compte()` est le texte du **badge de la ListRow dans la nav** ; mon texte est le **corps du panneau droit** à droite. Mon gabarit corrigé — « Départ — l'écran d'édition arrive avec la feature n°3. » — n'a jamais affirmé « configuré » ni « vide » : il ne fait aucune promesse sur l'état des données, seulement sur l'absence d'écran d'édition. Le fait nouveau du Tech Lead (Départ n'est structurellement **jamais** vide, pas seulement à la création — `lieu_id` est `CHAMPS_REQUIS`) renforce mon objection de tour 1 plutôt qu'il ne la contredit : il confirme que le gabarit littéral d'origine (« Aucun départ. ») aurait menti à *chaque* ouverture de dossier, pas seulement à la création. Texte inchangé.

## Statut de mon objection de tour 1

- **Poignée ⠿ : retirée** — remplacée par la version plus stricte du Tech Lead (aucune prop, pas seulement un défaut `false`).
- **Texte d'état vide qui ment (Canon/Départ/Lieux) : maintenue**, recevable sous réserve, pas de veto. Aucune des trois autres notes ne couvre le corps du panneau droit — le Tech Lead traite le badge nav (`compte()`), le PM et la QA traitent le périmètre EditorScreen/tests. Le tableau de correspondance de mon annexe tour 1 (10 lignes, glyphes ✎/❏/⊘, textes exacts par section) reste ma proposition, à intégrer telle quelle dans le plan.

Note QA (`ConflictDialog.test.tsx`) : hors de mon domaine, ne change rien à mon évaluation — dépendance de test sur le type `Route`, pas sur la nav/le panneau/la copie.

## VERDICT final

**Recevable sous réserve** :
(a) `ListRow` sans poignée ni prop `draggable` — contrat Tech Lead Annexe C adopté à l'identique ;
(b) les 10 textes d'état vide du panneau droit adoptent mon tableau de tour 1 (aucun gabarit « Aucun·e {section}. » pour Canon/Départ/Lieux — remplacé par « {Section} — l'écran d'édition arrive avec la feature n°{X}. ») ;
(c) `compte(dossier): string` rend « — » pour Canon et Départ, jamais « configuré » — cohérent avec (b), aucune correction croisée requise sur mes textes.
