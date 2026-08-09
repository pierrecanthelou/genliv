# Tour 1 — PM Produit — bascule-editeur it2

RISQUE — Un dossier créé puis quitté (fermeture d'onglet, retour accueil) redevient
inaccessible : DossierCard.tsx est aujourd'hui totalement inerte, avec le
commentaire explicite « nothing to open yet, no editor route before itération 2 »
(LibraryScreen.tsx:28). Or NI it2 (goal : créer → atterrir) NI it3 (goal :
naviguer DANS un dossier déjà ouvert) ne réclament, tels qu'écrits, la
responsabilité du clic « rouvrir un dossier listé ». C'est un trou de
périmètre non assigné, pas un report choisi — exactement le genre de silence
que la skill interdit (« hors périmètre non vide, explicite »).

OBJECTION — Le critère #6 de la spec (« id généré … testé explicitement à la
création ET à la duplication ») contredit resolved_decisions/open_questions,
qui placent rename/duplicate hors périmètre de TOUTE la feature, sans
appelant prévu. Un critère qui teste un chemin non câblé est infalsifiable :
il doit être réécrit pour it2 en « testé à la création uniquement ».

PROPOSITION — Trancher la question ouverte : le clic carte→éditeur REJOINT
it2, pas it3, parce qu'il ne coûte rien de neuf — il réutilise le seul
Router.dossier + l'écran minimal qu'it2 construit déjà pour la création,
sans nouveau contrat brain (DossierCard.tsx ajouté à la liste des fichiers,
onClick → router.navigate). En échange (biais à surveiller) : je retire la
clause duplication d'AC#6 ci-dessus, qui ne testait rien de réel. Net : zéro
lot supplémentaire sur le budget de 4.

VERDICT — recevable sous réserve : la demande écrite (créer un dossier valide
→ atterrir sur l'écran d'édition) est une tranche verticale claire,
démontrable en une phrase, dans l'ordre du build (elle ne présuppose aucune
feature n°3+). Réserve à lever avant tout lot : AC#6 corrigé, et le clic
carte→éditeur explicitement retenu en it2 (pas un silence porté à it3).

## Points structurants pour l'orchestrateur (tour 2/3)

- **Trancher la question ouverte** : je propose de rattacher le clic « rouvrir une carte de dossier existante → éditeur » à l'itération 2, pas à l'itération 3, car il consomme exactement le `Router` (`{name:'dossier', dossierId}`) et l'écran minimal que cette itération construit déjà pour le flux de création — aucun nouveau contrat `brain/`, un seul fichier ajouté (`src/features/book-library/components/DossierCard.tsx`). Le laisser dehors crée un dossier orphelin dès la première session, et ni it2 ni it3 (tels qu'écrits) n'en réclament la charge.
- **Incohérence de spec repérée** : `plan.acceptance_criteria[5]` (« testé … à la création ET à la duplication ») contredit `resolved_decisions`/`open_questions` qui placent `duplicate()` hors périmètre de toute la feature — à corriger avant raffinage des lots.
- Contrepartie nommée à mon ajout (règle du biais PM) : retrait de la clause duplication d'AC#6, pour tenir le budget de lots à 4.

Fichiers lus : `src/features/bascule-editeur/specification.json`, `src/App.tsx`, `src/features/book-library/components/LibraryScreen.tsx`.
