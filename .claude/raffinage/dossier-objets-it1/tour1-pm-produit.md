# Tour 1 — PM — `dossier-objets` it1

RISQUE — Le réordonnancement n'a aucun précédent dans tout le dépôt : `ListRow` n'a aujourd'hui ni poignée ni `onReorder` (son propre docstring le confirme), et le glyphe ⠿ de la source de design n'a aucun équivalent clavier documenté nulle part. En le câblant dans it1 (le squelette), on risque de transformer la tranche « tenir un registre » en chantier de mécanique UI neuve — au prix du temps qui devrait aller au comportement démontrable de base.

OBJECTION — La phrase de démo d'it1 porte un « et » qui relie deux valeurs distinctes : « … le voit apparaître dans la liste **et** peut réordonner ses objets ». Nom+description sont un seul objet de domaine (CLAUDE.md, déjà justifié — pas un fractionnement à faire). Réordonner est une capacité de gestion de liste orthogonale à la création/l'édition. Contrairement aux précédents cités (`PanneauLieux`/`FicheLieu`, `PanneauPersonnages`), aucune fiche livrée à ce jour n'a jamais embarqué de reorder : c'est une première occurrence, pas une reconduite de patron connu — donc pas gratuite dans un it1.

PROPOSITION — Je ne rouvre pas n=2 (verrouillé par le roadmap § 2, hors de mon mandat de tour 1). Mais j'exige que le mécanisme livré soit le plus mince possible : boutons « monter/descendre » par ligne plutôt que glisser-déposer — focusables nativement, sans geste souris à inventer ni ARIA de drag à documenter. Le glisser-déposer, s'il est voulu un jour, est du polish (règle « squelette d'abord ») pour une itération ultérieure, pas un dû d'it1. Ce que je retire en échange : rien à retirer du périmètre d'it1 (déjà mince, 7 critères sur 8 le concernent) — je retire seulement l'ambition du *mécanisme* de reorder, pas la capacité elle-même.

VERDICT — recevable sous réserve (mécanisme de reorder = boutons monter/descendre, pas drag-and-drop, pour tenir le principe squelette-d'abord sans rouvrir n=2).

---

Fichiers consultés (lecture seule) : `src/features/dossier-objets/specification.json`, `src/brain/components/ListRow.tsx`, `docs/ROADMAP-BASCULE-IA.md` (lignes 93, 149, 168).
