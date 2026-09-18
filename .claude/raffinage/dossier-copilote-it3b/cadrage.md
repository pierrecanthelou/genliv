# Cadrage — `dossier-copilote` itération `3b`

> Envoyé **identique** aux cinq rôles. Lecture bornée : ce cadrage + les 3 à 6 fichiers que vous jugez nécessaires. Le comité travaille sur les specs, pas sur le dépôt entier.

**Démo visée** : « à la fin de cette itération, l'auteur peut **faire compléter le plan d'actions d'un personnage**. » Une phrase, sans « et ».

**`goal` brut (spec)** : *Le plan d'actions : l'auteur demande au copilote de compléter `monde.personnages[].plan_actions[]` — des **SOUS-ENTITÉS STRUCTURÉES**, chacune portant plusieurs champs, là où 3a ne rendait que de la prose nue. Deuxième des trois tranches de l'ancienne itération 3, dans l'ordre rangs → listes → sous-entités.*

⚠ **Une clause du `goal` est PÉRIMÉE** : il prévient que 3b « paiera le 4ᵉ rôle sans marge si la ligne 384 de `frontiere.test.ts` n'a pas été réparée à 3a ». **Elle l'a été**, avec son cas négatif vu rouge. Cette dette est éteinte — le `goal` est à corriger au raffinage.

**État de la feature** : **3/6 livrées** (it1 prose d'une fiche · it2 détenteurs par rang · it3a répliques, première LISTE de prose). 3b pose le **4ᵉ rôle** du copilote.

## Le fait structurant de cette tranche — mesuré, pas supposé

`PlanAction` (`src/brain/dossier/types.ts:359`) porte **six champs à TROIS audiences** (`src/brain/dossier/destinations.ts:201-224`) :

| champ | requis | type | audience |
|---|---|---|---|
| `etape` | **oui** | `number` | **`moteur`** |
| `action` | **oui** | `string` | **`ia`** |
| `declencheur_texte` | non | `string` | **`auteur`** |
| `declencheur_expr` | non | `ExprNode` | **`moteur`** |
| `duree` | non | `number` | **`moteur`** |
| `si_bloque` | non | `string` | **`ia`** |

**Deux champs seulement sont `'ia'`.** Et `etape` est **requis** et **entier**, alors que la doctrine livrée à l'it2 dit que le modèle **ne rend jamais un entier** — le code pose la valeur que le modèle ne choisit pas (précédent `CERTITUDE_INITIALE`). C'est la question centrale à trancher : **que rend le modèle, et qui écrit le reste ?**

## Précédents qui s'appliquent (`resolved_decisions`, déjà tranchés — ne les rejouez pas)

- **DÉSIGNATION vs RÉDACTION** (3a) : liste vide = succès pour un rôle qui choisit dans un ensemble fourni ; = refus pour un rôle qui écrit ce que rien ne fournit.
- **Le modèle ne rend que des JETONS, jamais un entier** (it2) — aucune conversion numérique nulle part.
- **Deux bornes de nature différente ne s'alignent jamais** (3a) : la borne du **document** et celle de la **réponse** sont distinctes ; le validateur n'importe pas la borne document.
- **Le contexte d'un rôle est strictement borné et mesuré** : `BUDGET_CARACTERES_CONTEXTE` par rôle, `ceil(M×3/1000)×1000` après assertion que les chemins résolvent non vides. Jamais recopié d'un autre rôle.
- **L'acceptation écrit le champ cible et RIEN D'AUTRE** (KR-221) — aucune valeur semée.
- **Zéro clé commune** entre la forme réseau et la forme re-résolue (KR-231).
- **Ce qu'un modèle VOIT et ce qu'on lui DONNE sont deux listes** (KR-232).

## KR connus à garder

KR-229 (la frontière testable est la **forme**, jamais la qualité) · KR-230 (refus, jamais troncature) · KR-231 · KR-232 · KR-233 (route IA : plafond en **octets**, 413/405/404/503, tout en JSON) · KR-235 (un instrument non mesuré n'est pas un instrument) · KR-236 (garde invite↔schéma) · KR-221 · KR-109 (pas de primitive `brain/` à un seul appelant) · KR-004 (persistance **puis** événement) · KR-013/113 (état dérivé en ligne) · KR-112 (400 lignes).

## Fichiers probablement concernés

`src/brain/copilote/{types,schemaSortie,contexte}.ts` (+ tests) · `src/brain/CopiloteService.ts` (+ test) · `src/brain/index.ts` · `worker/{index,index.test,frontiere.test}.ts` · `src/features/dossier-copilote/{components/,textes.ts,tests/}`.

## Deux dettes arrivées à échéance, à cadrer ICI — pas à subir en cours de lot

1. **`src/brain/copilote/contexte.ts` est à 564 lignes** pour trois rôles (~65 l. de registre + ~45 l. d'assembleur par rôle). Un 4ᵉ le porte vers ~700, un 5ᵉ **au-dessus du bloqueur KR-112 à 800**. La revue de PR de 3a recommande la scission **dans le lot contrat de 3b, AVANT** le 4ᵉ rôle. `CopiloteService.ts` est à 416 l. et `worker/index.ts` à 487 l.
2. **Budget de contexte, mesuré le 2026-09-18** : `src/features/dossier-copilote/specification.json` à **66 168 / 66 560 o** (marge **392**, après DEUX compactions dans le lot 3a) ; `code-knowledge.json` à **76 728 / 76 800 o** (marge **72**, et aucune itération ne l'a encore écrit). Tout report de 3b franchira au moins un plafond.

## Ce qu'on attend de vous

`RISQUE / OBJECTION / PROPOSITION / VERDICT`, 250 mots max. **Au moins une objection** — une note sans objection signifie que le rôle n'a pas lu, et elle est renvoyée. Annexe autorisée pour `tech-lead`, `ux-designer`, `narratif-ia`.

⚠ **Toute affirmation sur la couleur d'un test se MESURE.** Si vous écrivez « ce test resterait vert » ou « cet instrument attrape ça », vous l'avez rejoué — sinon vous écrivez que vous ne l'avez pas vérifié. Un motif faux traverse deux tours, la porte mécanique et la revue de PR sans que rien ne l'arrête : aucune de ces portes n'exécute une phrase.
