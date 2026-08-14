# Revue d'itération — `dossier-fiches` it6/8 : Savoirs

**En une ligne** : l'auteur peut désormais donner un savoir à son personnage — un indice qu'il connaît, comment il le révèle, et sous quelles conditions (confiance, jet, contrepartie, indice préalable), chacune des 4 portes s'ouvrant et se refermant indépendamment.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Ajout d'un savoir (Select-comme-geste) | VÉRIFIÉ | `savoirs.test.tsx:243-265` |
| 2 | Les 4 portes s'ouvrent/se retirent indépendamment, prouvé séparément, garde structurelle (pas une liste recopiée) | VÉRIFIÉ | `savoirs.test.tsx:276-354` — la liste des 4 chemins `revele_si.*` est dérivée par filtrage de préfixe sur `tables.ts`/`destinations.ts`, comparée à `PORTES_UI` dérivé du composant. Le veto conditionnel du QA (raffinage § 8 désaccord 8) est réellement tenu, pas seulement nommé |
| 3 | Savoirs déjà écrits restent visibles/éditables quand `monde.indices` est vide (précédent M1) | VÉRIFIÉ, libellé du critère à corriger — voir « Écarts assumés » |
| 4 | États vides scopés par porte (objets/indices) | VÉRIFIÉ | `savoirs.test.tsx:438-492` |
| 5 | Avertissement `revelation-sans-porte` : allume/éteint/rallume | VÉRIFIÉ | `savoirs.test.tsx:501-526` |
| 6 | Lecture au montage sans interaction, valeurs non fabricables, 2 personnages | VÉRIFIÉ | `savoirs.test.tsx:539-615` |
| 7 | Non-régression dossier de référence | VÉRIFIÉ | `savoirs.test.tsx:688-722` |
| 8 | Lint/tsc propres, diff `destinations.ts` commentaires seuls | VÉRIFIÉ | gate + diff inspecté ligne à ligne par le QA |

## Diff par lot

Lot unique `savoirs` (`contrat`, `dev-contrat` seul) :
- **Créés** : `components/{BlocSituation,BlocIdentite,BlocSavoirs}.tsx`, `hooks/useEcritureSavoirs.ts`, `tests/savoirs.test.tsx`.
- **Modifiés** : `brain/dossier/{types,destinations}.ts`, `brain/index.ts`, `hooks/{useSocleEcriturePersonnages,useEcriturePersonnages}.ts`, `components/{FichePersonnage,PanneauPersonnages}.tsx`, `tests/panneauPersonnages.test.tsx`, `docs/ROADMAP-BASCULE-IA.md`.
- **Conforme à la liste du plan (§ 5)**, vérifié indépendamment par l'intégrateur puis par le QA. `tests/fichePersonnage.test.tsx` (conditionnel) non retargeté, non modifié — la décharge de blocs 1-2 n'a cassé aucune assertion existante.
- `tables.ts`, `validate.ts`, les deux fixtures, `useEcritureIdentite.ts`, `useEcriturePlan.ts`, `BlocCaracteristiques.tsx`, `BlocPlanActions.tsx`, `BlocRelations.tsx`, `BlocPresence.tsx`, `components/styles.ts` : intouchés, confirmé par deux lectures indépendantes (intégrateur + QA).

## Ce qui a été refusé (registre du raffinage, § 8 du plan)

- Un bouton pointillé implicite pour ouvrir les portes Contrepartie/Indice préalable (écrirait une référence non choisie) — REJETÉ, remplacé par un Select obligatoire.
- Graine `confiance_min` à `CONFIANCE_MIN` (-3) — REJETÉE, silencieuse et trompeuse (éteindrait l'avertissement sans rien exiger) ; `CONFIANCE_INITIALE_PORTE = 1` retenue.
- Un lot contrat séparé pour la correction des 3 commentaires de `destinations.ts` — REJETÉ (règle « deux lots ne nomment jamais le même fichier », `types.ts` déjà touché par la graine de certitude) ; absorbé dans le temps 0 du lot unique.

## Ce qui a été reporté

- `indices[].verite` (contenu joué d'un savoir, distinct de sa condition) — propriétaire n° 6 `dossier-registres`, sans quoi l'assembleur n° 12 ne pourrait qu'inventer ce qu'un personnage révèle.
- Le contrat de sortie IA « R4 · acteur » qui consommera ces savoirs — propriétaire n° 12 `moteur-acteurs`, esquissé en annexe du plan comme note de comité.
- `BUG-074` (`BlocPresence.tsx`, forme non corrigée du bug M1 d'it5) — hors liste de fichiers de ce lot, correctif au prochain lot qui l'ouvre (it7 ou micro-commit indépendant).

## Écarts assumés

- **Libellé du critère #3 imprécis, comportement correct.** Le § 6 du plan disait « seule l'affordance d'AJOUT est remplacée par `TEXTE_AUCUN_INDICE_CANON` » quand des savoirs existent déjà et que `monde.indices` est vide. Ce n'est pas ce qui est implémenté : le Select d'ajout reste rendu (simplement sans options), et le message `TEXTE_AUCUN_INDICE_CANON` n'apparaît QUE sous la conjonction `savoirs.length === 0 && indices.length === 0` — forme strictement identique à `BlocRelations.tsx` post-M1, comme l'exigeait le § 3 (contrat de design, « forme exacte »). Le code et les tests sont cohérents entre eux et avec l'esprit du must-fix M1 (aucune donnée déjà écrite n'est jamais masquée) ; seule la phrase du critère #3 était mal formulée par l'orchestrateur. Imprécision du plan, pas défaut de code — précédent : it3, § 7 mal attribué à `validate.test.ts` au lieu de `couverture.test.ts`.
- **`types.ts` a reçu une 4ᵉ correction de commentaire** (en-tête du fichier, même correction n° 5 → n° 6 sur `indices` que celle du roadmap) pour éviter une auto-contradiction dans `brain/dossier/`, hors de la liste littérale du § 5 mais dans l'esprit du désaccord 4/10 déjà tranché — zéro risque, zéro changement de valeur.
- **`BlocSavoirs.tsx` = 487 lignes** (post-revue de PR : +10 lignes, corrections m1/m2), au-dessus du signal KR-112 (400), sous le bloqueur (800). Le § 5 du plan n'allouait qu'un fichier à ce bloc ; `dev-contrat` n'a pas scindé unilatéralement une liste de fichiers votée par le comité. Dette datée, même classe que `FichePersonnage.tsx`/`useEcriturePlan.ts` avant lui — à surveiller au prochain lot qui touche ce fichier (extraction possible : `LigneSavoir.tsx`).
- **`components/styles.ts` porte un commentaire périmé** (attribue encore `LIBELLES_CAMP`/`LIBELLES_PORTEE` à `FichePersonnage.tsx`, déplacés dans `BlocSituation.tsx` par la décharge). Fichier hors liste, à corriger au prochain lot qui l'ouvre — coût nul, non bloquant.
- Trois références (`indice_id`, `contrepartie.objet_id`, `apres_indice_id`) sont bloquantes au SSOT — un savoir orphelin n'est atteignable qu'en import/dossier corrompu, jamais via l'UI normale. Le test qui prouve l'affichage d'une option orpheline monte donc `BlocSavoirs` seul (composant de rendu pur), pas via la pile d'écriture complète — motif documenté dans le fichier de test.

## Blocage non résolu

Aucun.

## Revue de PR (tech-lead)

Un tour, `REQUEST CHANGES` → tout corrigé → re-gate vert.

**Must-fix (1)** — relevé du budget de contexte non fait (absent de cette revue au premier passage, alors qu'il figure aux quatre itérations précédentes) sur les deux fichiers les plus serrés de la feature. Fait ce tour (voir § Porte qualité ci-dessous) : les deux restent sous leur plafond, avec une marge confortable — la compaction faite au moment de la validation du plan (avant essaim) avait déjà anticipé la croissance de ce lot.

**Minor (3, tous corrigés)** :
- **m1** — `BlocSavoirs.tsx`, garde de focus par sous-chaîne (`signaturePortes.includes(...)`) plutôt que par appartenance exacte : `10:jet:true` contient `0:jet:true`, ce qui aurait pu focaliser le mauvais rang au-delà du 10ᵉ savoir. Corrigé (`signaturePortes.split('|').includes(...)`), coût nul.
- **m2** — Self-exclusion unidirectionnelle de la porte « indice préalable » : changer `INDICE` (champ de base) vers la valeur déjà choisie comme `apres_indice_id` fait disparaître cette dernière de la liste filtrée par self-exclusion, et l'écran affichait alors « Indice introuvable — `<id>` » pour un indice qui existe réellement au canon — `validateDossier` ne voit rien (la référence résout), donc c'était un mensonge d'affichage pur, pas une corruption de données. Corrigé : la valeur courante se résout contre la liste COMPLÈTE des indices dans ce cas précis, avant de retomber sur le repli orphelin.
- **m3** — `panneauPersonnages.test.tsx`, le test dont le nom promettait « titres exacts dans l'ordre » ne vérifiait que la présence (`forEach` + `toBeInTheDocument`), jamais l'ordre — exactement la classe KR-199 que la spec nomme « concerne directement it6 ». Corrigé : assertion sur la liste ordonnée des boutons d'en-tête d'accordéon (`aria-expanded`), comparée à `titresExacts` par `toEqual`.

Nit non bloquant, corrigé au passage : `CHANGELOG.md` disait que l'affordance d'ajout « devient indisponible » quand `monde.indices` est vide alors qu'elle reste rendue et active, simplement sans option — reformulé.

## Porte qualité

- Prettier, `tsc --noEmit`, ESLint : verts (dev-contrat, intégrateur, QA, tech-lead — quatre passages indépendants).
- Jest : **70 suites / 1009 tests**, tous verts (993 avant ce lot → 1009 après, +16 tests neufs pour `savoirs.test.tsx` et l'ajustement de `panneauPersonnages.test.tsx`).
- Score de mutation `src/brain/` : non applicable, confirmé indépendamment par l'intégrateur et le QA (aucun des 4 fichiers mutés dans le diff).
- Contrôle de propriété de fichiers : conforme, deux lectures indépendantes (intégrateur, QA).
- Budget de contexte, mesuré (`wc -c`, fichiers tels que normalisés CRLF sur disque) après ce lot : `specification.json` **64 636 o** (plafond 66 560, marge **1 924 o**) ; `bug_history.json` **9 931 o** (plafond 10 240, marge **309 o**). Les deux sous leur plafond — la compaction faite au moment de la validation du plan (avant essaim : 10 entrées `resolved_decisions` d'it1-it3 réduites à leur pointeur, `iterations_log[2]`/`[3]` réduits à leurs faits) avait anticipé la croissance de ce lot (goal it6 réécrit, `iterations_log[6]`, 4 `resolved_decisions`, 1 `open_question`, l'entrée `BUG-074`).

## RETOUR-COMITÉ

- **Le patron « 1 lot marqué contrat, dev-contrat seul » fonctionne pour une itération sans second lot à protéger.** Précédent posé ici pour la première fois dans cette feature (it1-it5 avaient toutes 2 lots séquentiels contrat+feature) : quand il n'y a qu'un seul lot au total, le séparer artificiellement en deux invocations d'agent n'achète rien — la règle « brain/ ⇒ marqué contrat, ordonné en premier » reste respectée par construction (premier ET seul), et `dev-contrat` (effort élevé) est le bon ouvrier pour la densité du lot (9 champs, 4 portes, décharge KR-112) même sans second lot à figer devant.
- **Un critère d'acceptation écrit à l'orchestration peut diverger du contrat de design écrit par l'UX dans le même plan** (ici § 6 vs § 3, sur la forme exacte de l'état vide). Le contrat de design (§ 3, écrit par le rôle porteur du sujet) doit faire foi en cas de divergence, pas la paraphrase du critère — à vérifier en porte 1 mécanique dans les itérations futures : relire le § 6 CONTRE le § 3, pas seulement chacun pour soi.
- **KR-112 : 4ᵉ itération consécutive (it3→it6) où un fichier de cette feature franchit le signal de scission dès sa création ou son extension**, jamais le bloqueur. La dette ne se résorbe pas, elle se déplace d'un fichier à l'autre à chaque itération (`FichePersonnage.tsx`, `useEcriturePlan.ts`, maintenant `BlocSavoirs.tsx`). Aucune action requise dans l'immédiat (sous le bloqueur), mais un signal répété 4 fois mérite d'être nommé au cadrage d'it7/it8 plutôt que redécouvert à chaque fois.
