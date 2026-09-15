# Tour 2 — `qa` · `dossier-registres` it5

## 1. Réponse nommée (D1 + D2 — testabilité)

Les deux tests du tour 1 prouvent des choses **différentes**, aucun ne couvre l'autre — les garder tous les deux évite le KR-199 que je soulevais moi-même. Le test d'absence (RTL, `queryByText('+ Ajouter un effet…')` sur `FicheClimat` → `null`) prouve qu'aucune UI ne permet de **créer** un delta ; c'est le seul instrument **durable** — « la liste de fichiers du lot » (`narratif-ia`) n'est pas un test rejouable, c'est un fait de revue jamais vérifié à un futur refactor qui rajouterait `EditeurEffets` sans toucher `PanneauConditions.tsx`. Le test de non-corruption du tech-lead (éditer NOM puis DURÉE sur un climat dont `effets_regles` est déjà non vide **en mémoire**, `toEqual` sur le tableau inchangé après commit) prouve autre chose : que l'écriture partielle de `DossierService.update` ne réinitialise pas un champ que l'écran ne montre pas. Les deux sont nécessaires ; le critère 7 doit nommer les deux.

Sur D2, lecture directe faite (`validate.test.ts:1364-1399`, `couverture.test.ts:295-521`) : `CHAMPS_ENTIERS` est exercé par une boucle générique (`POSEURS_D_ENTIER`) qui refuse gratuitement borne basse / décimal / texte / booléen / null dès la ligne de table posée — zéro dispense, confirmé. La prose n'a qu'un instrument, `LIBRES`, dont la définition dit explicitement « aucune règle du schéma 1 n'arbitre sa forme quand elle est présente » : aucun test ne peut jamais observer un refus de `duree_texte` corrompu. Un critère bornant la prose serait irrecevable par construction ; celui bornant l'entier est gratuit. **D2 tranché : entier.**

D3 confirmé par lecture (`validate.ts:798-816`) : `BUDGETS_DE_MOTS` pousse dans `warnings`, jamais `errors`, `ok` reste `true` — strictement non bloquant. Le test qui distingue blocage/avertissement existe déjà en patron (`enonce_texte` de jalon, `validate.test.ts:2250-2270`).

## 2. Statut de mon objection tour 1

**Maintenue, resserrée.** Le choix (NON à `EditeurEffets`) est fait et je le rejoins — mais le critère 7 ne peut pas citer « la liste de fichiers du lot » comme preuve : ce n'est pas un instrument qui persiste après le merge. Sur D5 : la reformulation de `narratif-ia` est bonne pour son premier tiers (round-trip `[]`, niveau contrat, instrument existant) mais **mélange un niveau contrat et un niveau composant dans un seul « alors »**. À corriger : scinder en deux critères, et remplacer « prouvée par la liste de fichiers » par « prouvée par `panneauConditions.test.tsx`, absence de `'+ Ajouter un effet…'` ».

---

## ANNEXE

### 3. Tests nommés de l'itération

| Fichier | Test (libellé) | Assertion exacte | Niveau | KR | Lot |
|---|---|---|---|---|---|
| `validate.test.ts` | `les champs entiers ont tous leur poseur, aucun de plus` | `Object.keys(POSEURS_D_ENTIER)` == chemins de `CHAMPS_ENTIERS` | contrat | D2 | 1 |
| `validate.test.ts` | `champ entier climat[].duree : sous DUREE_MIN, non entier ou non numerique, refuse` | `[min-1, -3, 2.5, "min", true, null]` → anomalie bloquante | contrat | D2, KR-165 | 1 |
| `couverture.test.ts` | sweep existant étendu | `climat[].duree` couvert ; **aucune** entrée neuve dans `LIBRES` pour lui | contrat | D2 | 1 |
| `couverture.test.ts` | `audience de climat[].manifestation : ia, instance existe` | `` `${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}` `` == `` `${chemin} → ia` `` **dans le même test** que la présence en fixture | contrat | KR-174/BUG-051 | 1 |
| `validate.test.ts` | `climat[].manifestation au-dela de 20 mots avertit sans bloquer` | 20 mots : `warnings=[]`, `ok=true` ; 21 mots : `codes(warnings)=['texte-trop-long']`, `errors=[]`, `ok=true` | contrat | D3 | 1 |
| `roundtrip.test.ts` | **existant, non modifié** | `climat[0].effets_regles` `toEqual([])` inchangé ; l'attendu étant dérivé du fichier, `duree`/`manifestation` traversent | contrat | D1 (KR-208), KR-191 | — |
| `suffisance.test.ts` | **existant, non modifié** | `CIBLE_CLIMAT_EXCLUE` reste le seul chemin sans delta admissible | contrat | D1 (KR-208) | — |
| `panneauConditions.test.tsx` | `aucun EditeurEffets ne se rend sur FicheClimat` | `queryByText('+ Ajouter un effet…')` → `null`, climat sélectionné | composant | D1 | 2 |
| `panneauConditions.test.tsx` | `editer les trois champs d un climat porteur d un effets_regles non vide le laisse intact` | fixture pose `effets_regles=[delta]` hors UI ; édition NOM/DURÉE/MANIFESTATION ; document persisté `toEqual([delta])` | composant | D1, KR-013 | 2 |
| `panneauConditions.test.tsx` | `+ Ajouter un climat : commit immediat sans nom ni duree, focus sur NOM` | climat écrit avec `effets_regles: []` seul ; `document.activeElement` == champ NOM | composant | KR-214 | 2 |
| `panneauConditions.test.tsx` | `DUREE : aucun repli implicite au montage` | climat sans `duree` → affordance pointillée ; spy `DossierService.update` non appelé | composant | KR-013 | 2 |
| `panneauConditions.test.tsx` | `manifestation trop longue : l avertissement est rendu, distinct du bandeau de refus` | `getAllByRole('status')` — la région d'avertissement porte le texte, le bandeau de refus reste absent | composant | KR-183/KR-189 | 2 |
| `panneauConditions.test.tsx` | `isolation des 9 autres sections` | compte **relevé dans `sections.ts`**, jamais recopié | composant | KR-159/186/187 | 2 |

Le critère de porte (lint/tsc, isolation inter-features) est couvert par `npm run lint` + `lintIsolation.test.ts` existants, plus le relevé manuel de la liste de fichiers du lot — **à noter comme non-jest**.

### 4. Position sur les trois dettes ouvertes

Aucune des trois n'est fermable dans it5 sans sortir des bornes de lot : le lot 2 ne touche ni `EditeurEffets.tsx` ni `brain/components/Select.tsx`, et n'introduit aucun retrait de ligne (climat non retirable, même statut qu'it1-4).

- **(a) `Select` EFFET no-op non couvert** — hors périmètre (pas d'`EditeurEffets` sur Climat). **Reste ouverte**, propriétaire : la prochaine itération/lot qui touche `brain/components/Select.tsx`.
- **(b) retour de focus après retrait de ligne** — aucune ligne retirable n'est ajoutée par it5. **Reste ouverte**, propriétaire : une éventuelle 6ᵉ itération de durcissement de `dossier-registres` si le retrait est un jour mandaté — même porteur que (c), pas deux tickets.
- **(c) axe inter-fiche du jeton KR-216, symptôme jumeau `FicheQuete.tsx:253`** — it5 ne touche ni `EditeurEffets.tsx` ni `FicheQuete.tsx`. **Reste ouverte**, même propriétaire que (b).

La feature se clôt à it5 : ces trois dettes doivent rester listées dans `implementation.open_questions` avec leur propriétaire nommé — pas de report vers `dossier-controles` (n° 7), qui ne touche aucun de ces fichiers.
