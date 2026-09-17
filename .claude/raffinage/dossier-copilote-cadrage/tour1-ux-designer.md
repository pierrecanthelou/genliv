# Tour 1 — UX designer (`/cadrer dossier-copilote`)

RISQUE — Le risque central n'est pas l'invocation mais le RENDU de la proposition : les trois assistants produisent trois formes (remplissage d'entités neuves, diff de champs sur une fiche existante, ajout de relations), et le registre de langue varie CHAMP PAR CHAMP dans une même proposition — `formulation_joueur` est de la fiction 2e personne, `verite`/`objectif` sont des notes d'auteur. Un panneau qui rend tout uniformément fera lire une note de MJ comme du texte joueur, ou l'inverse.

OBJECTION — La question posée (destination de nav XOR affordance par panneau) suppose une réponse unique pour les trois assistants. « Éclater le synopsis » et « Tisser les indices » balaient tout le dossier, comme Contrôles ; « Compléter une fiche » est intrinsèquement contextuel à une fiche déjà ouverte. Une réponse unique dégrade soit l'ergonomie, soit l'architecture.

PROPOSITION — Une seule destination « Copilote » (sibling `ListRow` de « Contrôles », render-prop `panneauCopilote`) héberge les 3 assistants et toute revue de proposition ; « Compléter une fiche » cible sa fiche via `Select` (jamais `TargetPicker`, condamné). Une anatomie de ligne unique (`LigneProposition`, locale, KR-109), deux variantes — remplissage / remplacement —, réutilisée par les 3 itérations. `Field` gagne un `readOnly` (extension, pas de composant maison).

VERDICT — **recevable sous réserve** (3 réserves nommées).

## Surfaces
- **Invocation** : une seule destination de nav « Copilote », `ListRow` sibling de « Contrôles » dans `navColumn` de `DossierEditorScreen.tsx` — prop sœur `panneauCopilote?: (onSelectSection) => ReactNode`, exactement le motif render-prop de `panneauControles`. **Aucun fichier de `dossier-canon`/`dossier-fiches`/`dossier-registres` n'est touché** — zéro violation de propriété exclusive.
- **Revue** : PAS une `Modal` — un panneau plein, gabarit de `PanneauControles.page`.
- **Acceptation** : `IconButton` par ligne/carte, jamais un second écran.

## Anatomie du panneau
État par défaut : 3 `Card`, une par assistant, texte verbatim du plan de cible. Bouton « Lancer » réutilisant littéralement les constantes du bouton confirm de `Modal.tsx` (seul précédent de bouton primaire du DS). « Compléter une fiche » porte un `Select` (personnages) ; bouton désactivé sans cible ; texte si aucun personnage.

État de chargement (**aucun précédent dans le dépôt**) : région `role="status"`, ⏱ + « Le copilote réfléchit… », bouton « Annuler ». Échap annule et **rend le focus au bouton « Lancer »**.

État d'échec (D2) : « Le copilote est indisponible — impossible de joindre le worker. Réessayez dans un instant. » + « Réessayer ». Pas de dialogue : rien n'est encore écrit.

Sortie non conforme après le rejouement unique : message calme unique, aucun rendu partiel.

`LigneProposition` (NEUF, local à la feature ; précédent `EditeurEffets` de `dossier-registres`, KR-109) :
- *REMPLISSAGE* (cible vide ou portant `MARQUEUR_A_ECRIRE`, importé depuis `brain/dossier/amorce.ts`, jamais recopié — KR-223) : un `Field`, label + hint **identiques à ceux du champ dans sa fiche d'origine**, Badge `neutral` « NOUVEAU ».
- *REMPLACEMENT* : deux `Field` empilés — « AVANT » `readOnly` (`--surface-inset`, `--text-muted`, `tabIndex:-1`) et « APRÈS » éditable —, Badge `neutral` « REMPLACE ».
- Actions : `IconButton` `+` tone accent « Accepter la proposition », `✕` tone danger « Rejeter la proposition ». **Aucun glyphe neuf.**
- Après décision : ligne compacte + Badge `accent` « Accepté » / `muted` « Rejeté » — jamais `good`/`bad`.
- Boutons de lot « + Tout accepter » / « ✕ Tout rejeter ».
- « Éclater le synopsis » rend 9 `Card` (grille 3×3) : l'unité est l'ENTITÉ, pas le champ.
- « Tisser les indices » : une `LigneProposition` par relation, registre auteur 3e personne.

États vides (calqués sur `PanneauControles.emptyState`) : trois textes rédigés, dont « Aucune proposition — tous les indices ont déjà au moins deux détenteurs ou sources. »

## Réserves du verdict
1. `Field` gagne `readOnly?: boolean` — extension, pas de composant maison.
2. Les `Badge` d'état n'utilisent jamais `good`/`bad` (réservés réussite/échec de jet).
3. Toute lecture de `MARQUEUR_A_ECRIRE` importe la constante (KR-223).

## Découpage vu de l'UX (ordre roadmap)
1. **Éclater le synopsis** — pose la destination, le chargement/échec, la variante `Card`-entité. Le plus simple : rien à diffuser contre une valeur existante.
2. **Compléter une fiche** — introduit `LigneProposition` et la variante REMPLACEMENT (le vrai diff champ par champ), le `Select` de ciblage.
3. **Tisser les indices** — réutilise tout, n'ajoute que la sémantique « relation ».

## REJETÉS
1. **`Modal` pour le panneau de diff** — largeur fixe 420, ombres réservées aux modales ; une revue de 9 entités est un contenu long, pas une confirmation transitoire.
2. **`TargetPicker` pour cibler la fiche** — lié au modèle `BookNode` condamné ; `Select` est le précédent établi.
3. **Glyphe `✓` neuf pour « accepter »** — absent du jeu canonique ; `+` porte déjà ce sens.
4. **Rendu en flux (streaming) de la proposition** — le SSE de narration est un chantier Temps 2 ; « sortie structurée obligatoire » = un objet complet validé, pas un rendu partiel.
5. **Éditer le texte « APRÈS » avant d'accepter** — PAS rejeté, DIFFÉRÉ au raffinage d'itération.
