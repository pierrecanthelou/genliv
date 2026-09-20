# Tour 2 — qa — `dossier-canon` it5 (tranche B1)

**Baseline mesurée par exécution** avant tout raisonnement : `npx jest src/brain/dossier` → **17 suites, 489 tests, tous verts** (dont `couverture.test.ts` 245/245).

## 1. Coût de test mesuré — la testabilité ne discrimine PAS les deux formes

`REFERENCES_SIMPLES` (`tables.ts:571-611`) compte **9 entrées**. Classées par leur feuille : **8/9** pointent un **champ nommé dans un objet** (`savoirs[].indice_id`, `relations[].cible_id`, `presence[].lieu_id`, `donneur_id`, `depart.lieu_id`…) ; **1/9 seulement** (`monde.indices[].mene_a[]`) a pour feuille l'**élément de liste** — la table le dit : « LA HUITIÈME, ET LA PREMIÈRE DONT LA FEUILLE EST UN ÉLÉMENT DE LISTE » (`tables.ts:590`).

`Relation` (`cible_id` moteur + `lien` ia) et `Presence` (`lieu_id` moteur + `quand?` auteur optionnel) sont un précédent **exact** de `{vers_lieu_id, description?}`. Ce n'est donc pas une famille non éprouvée.

| | `acces?: string[]` | `{vers_lieu_id, description?}[]` |
|---|---|---|
| Lignes de table | 3 | 5 |
| Tests génériques **gratuits** | 4 | 6 (dont BUG-070 « élément non-objet » gratuit) |
| Tests dédiés à écrire | 5-6 | 3 |
| `couverture.test.ts` / `LIBRES` | **0 ligne** (chemin `REFERENCES_SIMPLES`, corruption déjà gardée — comme `mene_a[]`, aucune dispense, `:348`) | **1 ligne obligatoire** (`description` = prose libre, statut `presence[].quand` `:313`) |

**Verdict chiffré** : la forme objet coûte 1 fichier de plus mais 2 tests manuscrits de moins. **Aucune des deux n'est moins testable.** L'argument « 7e famille non éprouvée » ne tient pas à la mesure : c'est `mene_a[]`, seul de son espèce et avec 3 bugs à son historique, qui est le cas non générique — pas l'objet.

## 2. Confirmation par EXÉCUTION — la prémisse de tour 1 de `narratif-ia` était fausse

`'monde.indices[].mene_a[]': 'moteur'` (`destinations.ts:448`) est déjà une ligne `moteur`-seule sur un chemin `string[]` à feuille-élément — exactement ce que la note de tour 1 disait « morte le jour où elle est écrite ». Elle est épinglée par `CHAMPS_D_INDICE` (`couverture.test.ts:952-975`) avec ses deux assertions. Run direct de `npx jest src/brain/dossier/couverture.test.ts` : **PASS, 245/245**. Vivante, vérifiée par exécution, pas par lecture.

## 3. « `jest src/brain` vert sans qu'aucun autre fichier de test ne change » — tenable pour UNE forme

- **`acces?: string[]`** : **tenable tel qu'écrit**. Rien à dispenser dans `LIBRES`, le sweep « ligne morte » passe dès la fixture enrichie. **Les 5 fichiers du lot 1 suffisent.**
- **forme objet** : **pas tenable** — `description` exige sa dispense `LIBRES`, donc un 6e fichier. À écrire en dur dans le lot plutôt qu'à laisser en « découverte à remonter ».

## 4. Statut des objections de tour 1

- **Ambiguïté de « relier » (KR-013)** — **maintenue, convertie en critère nommé**, pas retirée par la légende UX seule. Motif : le texte de `ux-designer` répare la lecture de l'**écran**, mais rien n'empêche un ouvrier de coder correctement l'écran **et** une écriture symétrique dans `handleAjouterAcces`. Le risque vit dans le code d'écriture, pas dans la copie.
- **Rider `validate.ts`** — **RETIRÉE**. `acces`, sous quelque forme, ne demande aucune ligne de `validate.ts`. Hors périmètre, ré-armé sur le fichier.

## 5. Critères d'acceptation recommandés

1. **[contrat]** Étant donné les lieux A et B, quand l'auteur ajoute B aux accès de A, alors A expose B comme cible **et** B ne porte aucune entrée ajoutée automatiquement — `acces ne crée jamais l'inverse (KR-013)`, assertion sur les deux lieux.
2. **[contrat]** Étant donné un `acces` ciblant un identifiant absent, quand `validateDossier` s'exécute, alors `reference-pendante` au chemin exact — **gratuit** (boucle `REFERENCES_SIMPLES`, `validate.test.ts:3157`).
3. **[contrat]** Étant donné un `acces` citant son propre identifiant, alors **aucune anomalie** (KR-194).
4. **[contrat]** Étant donné un `acces` contenant une chaîne vide, alors refusée — dédié, exerce `validate.ts:422`.
5. **[contrat]** Étant donné la référence enrichie de 3 entrées (aller simple + paire réciproque), alors `ok:true` sans régression.
6. **[composant]** Étant donné ≥ 2 lieux, quand la section s'ouvre, alors `EYEBROW_ACCES`/`LEGENDE_ACCES` mot pour mot et le lieu courant **exclu** des options d'ajout.
7. **[composant]** Étant donné un accès dont la cible a été retirée ailleurs, alors `avecOrpheline()` (« Lieu introuvable — id »), jamais filtré en silence (KR-021).
8. **[composant]** Étant donné ≥ 1 accès écrit, quand l'auteur navigue au clavier, alors l'ordre de tabulation suit DANGERS → lignes d'accès (Select puis ✕) → Select d'ajout → Retirer le lieu, sans `tabIndex` manuel.

**Pas d'ESCALADE.** Le désaccord de forme reste un arbitrage produit/architecture — mais sa prémisse de **coût de test** ne résiste pas à la mesure. Trancher sur le besoin narratif, pas sur la testabilité.
