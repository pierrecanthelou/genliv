# Tour 1 — QA — `dossier-objets` it1

Confirmé : nulle part dans le cadrage — pas même dans `resolved_decisions` — le mécanisme d'interaction du reorder n'est fixé (glisser souris vs clavier), ni son niveau de test.

```
RISQUE — Le reorder est la seule capacité de cette itération sans aucun précédent dans le dépôt (le cadrage le dit lui-même) et sans mécanisme d'interaction fixé nulle part (ni acceptance_criteria, ni resolved_decisions, ni docstring ListRow.tsx qui ne nomme qu'« une poignée de glisser »). Si l'implémentation choisit un vrai drag HTML5 (dragstart/dragover/drop), jest+jsdom ne le reproduit pas fidèlement — c'est exactement l'instrument aveugle que la skill interdit de présupposer.

OBJECTION — Critère #3 tel qu'écrit n'est pas observable : il ne nomme ni le mécanisme (clavier vs souris), ni le niveau de test (composant avec user-event vs appel direct à onReorder qui court-circuiterait l'UI). Second point : critère #2 cite BUG-064/lecture-au-montage mais omet la garde que sa propre mitigation impose (KR-199) — un test à une seule entité ne distingue pas une fiche correctement liée d'une fiche figée sur le premier objet ; sans exiger deux objets aux valeurs opposées + clic sur le second, le nom du test peut à nouveau promettre plus que ses assertions.

PROPOSITION — Reformuler #3 : « …quand l'auteur active Monter/Descendre (boutons ≥44px, opérables clavier) sur la ligne d'un objet, alors monde.objets change d'ordre en un DossierService.update() » — niveau composant, user-event.click/keyboard, sans drag natif. Reformuler #2 pour exiger deux objets aux champs distincts, montage sans clic, lecture du premier, clic sur le second, relecture — même patron que panneauPersonnages.test.tsx (BUG-064).

VERDICT — veto sur le critère #3 (mécanisme/niveau de test absents) ; recevable sous réserve pour le reste une fois #2 durci.
```

Fichiers consultés : `src/features/dossier-objets/specification.json`, `src/brain/components/ListRow.tsx`, `bug_history.dossier-fiches.json` (BUG-064), `code-knowledge.json` (KR-197/KR-199/KR-187/KR-156), `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx`, `src/brain/dossier/__fixtures__/dossier-reference.json`.
