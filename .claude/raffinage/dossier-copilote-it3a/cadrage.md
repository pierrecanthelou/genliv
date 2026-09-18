# Cadrage — `dossier-copilote` · itération **3a**

**Feature** `dossier-copilote` (n° 8 de la bascule IA), **2/4 livrées** (`0.6.46`). Comité à **5 rôles** (`narratif-ia` convoqué : contrat de sortie IA, invite worker, audiences du dossier).

> ⚠ **L'itération 3 telle qu'écrite au cadrage a été DÉCOUPÉE avant raffinage**, sur mesure et non sur impression. Son `goal` couvrait **quatre familles** jointes par « ou », qui diffèrent sur l'axe de risque même de la feature. Découpage validé le 2026-09-18 : **3a** (listes de prose) → **3b** (sous-entités, `plan_actions[]`) → **3c** (sous-entités + référence, `relations[]`) → **3d** (les six curseurs, **conditionnelle**). Seule **3a** est raffinée ici.

**Phrase de démo** : « À la fin, l'auteur peut faire compléter la façon de parler d'un personnage. »

**Ce qui est NEUF dans cette tranche, et c'est tout** : une **LISTE de prose** — plusieurs valeurs proposées pour un MÊME champ, acceptées ou refusées **une par une**. Aucune sous-entité, aucun nombre, aucune référence, aucune création d'entité.

**Champs candidats** (à arbitrer par le comité, pas par moi) :
- `monde.personnages[].caractere.parler[]` — `ia`, **liste** de chaînes, « un ÉCHANTILLON DE VOIX, jamais une réplique à réciter »
- `monde.personnages[].caractere.jamais` — `ia`, chaîne unique, « la limite absolue »
- `monde.personnages[].caractere.cede_si` — `ia` **MAIS CONDITIONNÉ PAR RÔLE** : n'entre QUE dans le contexte de l'appel **acteur du personnage QUI LE PORTE**, jamais narrateur, jamais un autre personnage, jamais l'arbitre. Un rôle de RÉDACTION n'est aucun des trois. `narratif-ia` l'avait écarté à l'it2 pour cette raison ; **ici la question est PROPOSER, pas injecter** — ce n'est pas la même question, et elle n'est pas tranchée.

**LA DÉCISION QUE CETTE TRANCHE DOIT PRENDRE** (`open_questions` n° 1, qui la mandate « au lot contrat de l'itération 3, jamais par un ouvrier ») : **les six curseurs de caractère sont-ils PROPOSABLES ?** Faits mesurés le 2026-09-18 :
- `destinations.ts` les classe **`moteur`**, avec ce motif écrit : « MÊME ARBITRAGE que les huit caractéristiques et que **`relations[].intensite`** — un modèle qui lit `mefiance: 8` connaît l'exacte profondeur d'une méfiance que la scène n'a pas montrée » ;
- le **critère 8** de la spec exclut **nommément `intensite`** de ce que le modèle peut proposer ;
- le JSDoc interdit même la **paraphrase** (« très méfiant ») tant que la n° 10 n'a pas livré un libellé dérivé PAR LE CODE avec sa propre ligne d'audience ;
- le bloc est **optionnel en bloc, TOTAL quand présent** ; un bloc à 1-5 clés est une **anomalie BLOQUANTE** à l'import.
Cette décision **crée ou supprime la tranche 3d**. KR-232 distingue VOIR de PROPOSER : l'un n'entraîne pas mécaniquement l'autre, et c'est précisément ce qu'il faut arbitrer.

**Déjà livré, à réutiliser et non à réinventer** : `RoleCopilote` à **deux** membres · `GABARIT_SORTIE: Record<RoleCopilote, string>` (garde KR-236 à trois pièces : égalité des trois ensembles de clés, appariement par rôle, **canari croisé**) · `CHAMPS_INJECTES`/`PARTIES_REQUISES`/`BUDGET_CARACTERES_CONTEXTE` **par rôle** (prose 6000, détenteurs 17 000) · `demander` **surchargée sur le littéral de rôle** (aucun membre ajouté à `CopiloteService` — c'est ce qui laisse les bouchons de test compiler) · rejeu exactement une fois puis terminal · `CarteAssistant`, `CarteCompleterFiche`, `CarteTisserIndices`, `LigneProposition`, `LigneDetenteur`, `BarreLancer`, `styles.ts` · le **gel** au clic « Lancer » (§ 3.6 de l'it2) et le **focus post-décision** (§ 3.5).

**Fichiers probablement concernés** : `src/brain/copilote/{types,contexte,schemaSortie}.ts` (+ tests), `src/brain/CopiloteService.ts`, `worker/index.ts` (+ `frontiere.test.ts`, `index.test.ts`), `src/features/dossier-copilote/**`. **INTERDITS** : tout fichier de `dossier-canon`, `dossier-fiches`, `dossier-registres`.

⚠ **TROISIÈME OCCURRENCE D'UN PIÈGE DÉJÀ PAYÉ DEUX FOIS** : les libellés d'écran des champs visés vivent dans `dossier-fiches/components/BlocCaractere.tsx` (`label="RÉPLIQUE"` l. 169, `label="CE QU'IL NE FERA JAMAIS"` l. 206) — **fichier interdit**. `LIBELLE_DES_CHAMPS` est épinglé à **quatre** entrées par `libelles.test.ts`, qui balaie en plus toute prop `label="<libellé>"` dans `src/`. L'it1 avait obtenu une exception **bornée et non renouvelable** ; l'it2 a posé un **VETO** (TL-8) et nommé le champ **en prose française** dans `textes.ts`, via un motif de refus **sans charge**. Le précédent est disponible — ne pas le redécouvrir.

**KR applicables** : KR-229 à KR-236 + KR-004, 013/113, 021, 109, 112, 116, 117, 171, 184, 187, 193, 195, 197/199, 203, 215, 219, 223, 231.

**Dettes ouvertes qui touchent cette tranche** : `BUG-106` (retour de focus sur un « Lancer » désactivé — correction bloquée sur `brain/components/Select.tsx`, primitive partagée) · le **remontage du panneau à la navigation**, jamais mesuré · la **recette de relevé** du § Worker Route Parity, couplée aux noms de variables.

**Contrainte de sortie** : 1 à 4 lots à listes de fichiers **disjointes** (l'it2 a montré qu'une frontière par **préfixe de chemin** se vérifie d'un `grep`), lot `brain/` ou contrat de sortie IA marqué `contrat` et **en premier**, **8 critères au plus**, tous `Étant donné / Quand / Alors`.
