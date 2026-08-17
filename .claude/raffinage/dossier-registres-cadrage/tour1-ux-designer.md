RISQUE — Cette feature invente un premier « éditeur de `Delta[]` » (récompense de quête, résolution d'événement, effets de climat) : trois sites d'écriture dans une même feature, sans précédent réutilisable. `OutcomesEditor` (brain/components) est lié à `RollOutcome`/modèle d'arbre condamné, `TargetPicker` à `BookNode` — condamné aussi. Sans un motif posé dès la première itération, les trois écrans divergent en trois mini-composants ad hoc : c'est exactement l'anti-patron « composant maison » que mon veto couvre.

OBJECTION — Le périmètre remis n'est pas les « quatre sections » telles qu'énoncées. Deux trous : (1) `docs/ROADMAP-BASCULE-IA.md` § 5 ligne 234 assigne l'écran d'édition de `jalons`/`fins` à cette feature au motif qu'il dépend du registre `DELTAS` — jamais mentionné en ligne 150/170 ; (2) `Quete.lie_au_canon` existe au schéma cible (`PLAN-BASCULE-IA.dc.html` ligne 219) sans description au § par section (ligne 549), distinct du `lie_a_histoire` des Événements. Fixer 4 itérations avant d'avoir tranché ces deux points, c'est cadrer sur un périmètre encore mouvant.

PROPOSITION — Une itération par section, dans cet ordre : **1. Quêtes** (établit Select+`avecOrpheline`+`localiserEntite` pour `donneur_id`, et l'éditeur de `Delta[]` partagé, réutilisé ensuite) → **2. Événements** (réutilise l'éditeur de delta pour `resolutions[].consequence`, ajoute `SegmentedControl` pour `nature`, `Toggle` pour « lié à l'histoire », Select pour `monstre_ref` contre le bestiaire) → **3. Conditions/climat** (la plus mince, tout est réutilisé) → **4. Indices** (liste+fiche seule). Le **graphe reste hors périmètre** : `tree-canvas` est en sommeil, sa réanimation est un chantier séparé sans rapport avec un contrat de fiche.

VERDICT — recevable sous réserve : trancher `jalons`/`fins` et `lie_au_canon` avant de figer le nombre d'itérations à 4.

---

**Annexe — contrat de design (brouillon d'ouverture)**

Motif général (les 4 écrans) : liste-à-gauche `ListRow` (sélection + réordonnancement composé par deux `IconButton` Monter/Descendre, jamais une prop sur `ListRow.tsx` — précédent `dossier-objets`) + fiche-à-droite `Card` avec `Field`. Retrait : `Modal` + `IssueList`, jamais immédiat (précédent `RetirerObjetDialog`).

Références croisées (`donneur_id`, `mene_a[]`, `monstre_ref`) : `Select` + `avecOrpheline()` + `localiserEntite()` — précédent `BlocSavoirs.tsx`/`BlocRelations.tsx` (dossier-fiches). **Jamais `TargetPicker`** (lié à `BookNode`, modèle condamné).

`nature` (Événement, monstre|scène|obstacle) : `SegmentedControl`. « Lié à l'histoire » (Événements seulement) : `Toggle`.

Éditeur de `Delta[]` (récompense, résolutions, effets_regles) : composé dans `dossier-registres/components/` — pas promu `brain/` tant qu'un 2ᵉ appelant *extérieur* à la feature n'existe pas (KR-109) — motif dérivé de `BlocSavoirs` (Select dédié pour ajouter une ligne, ligne bordée, retrait par `IconButton ✕`).

Textes proposés (registre : nom/libellé = interne mono MAJ ; texte lu par le joueur = fiction 2ᵉ personne présent) :
- Quêtes — placeholder titre « La dette du forgeron » ; objectif « Retrouver la commande de fers volée avant la foire de printemps » ; échéance « Avant la pleine lune » ; vide « Aucune quête — cliquez « + Ajouter une quête… » pour commencer. »
- Indices — `verite` (interne) « Le sceau a été brisé par le gardien lui-même, vingt ans plus tôt. » ; `formulation_joueur` « Une odeur de cendre froide, là où elle ne devrait pas être. » ; vide « Aucun indice — cliquez « + Ajouter un indice… » pour commencer. »
- Événements — `declencheur_texte` « Le joueur revient à Val-Cendre après la tempête. » ; résolution « Une créature trapue surgit de l'ombre, gourdin clouté levé. » ; vide « Aucun événement — cliquez « + Ajouter un événement… » pour commencer. »
- Conditions/climat — libellé « Tempête de cendres » ; vide « Aucun climat — cliquez « + Ajouter un climat… » pour commencer. »