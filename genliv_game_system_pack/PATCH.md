# PATCH — système de jeu genliv

Patch prêt à appliquer par Claude Code sur `pierrecanthelou/genliv@main`. Il branche les **règles du jeu** (`../REGLES-DU-JEU.md`) sur l'architecture brain existante. Approche **non-cassante** : les champs hérités (`SkillRoll.difficulty`, `MonsterConfig.attack/defense`) sont marqués `@deprecated` et **migrés à la lecture** (KR-021/116) plutôt que supprimés, pour que `tsc`/`jest` restent verts et que les livres déjà persistés se chargent.

## Comment l'appliquer
Les fichiers sous `patch/src/` **reflètent l'arborescence du repo**. Pour chaque fichier : copier le contenu de `patch/src/<chemin>` vers `src/<chemin>` (écraser). Le tableau ci-dessous indique nouveau (N) ou remplacement (R).

| # | Fichier (`src/…`) | N/R | Rôle |
|---|-------------------|-----|------|
| 1 | `brain/challenge.ts` | N | Registre TC1–4 (§ 2) + `rollTier()` (migration) + dés/résolution purs |
| 2 | `brain/equipment.ts` | N | Registres `WEAPONS` / `PROTECTIONS` (§ 3) |
| 3 | `brain/combat.ts` | N | MC, postures, AT, PF, écart (pur, play mode — § 3) |
| 4 | `brain/xp.ts` | N | Matrice ΔT + boutique de progression (pur — § 5) |
| 5 | `brain/bestiary.ts` | N | 23 monstres → `MonsterConfig[]` pour le seed (§ 4) |
| 6 | `brain/gameSystem.test.ts` | N | Tests unitaires des fonctions pures (RNG injecté) |
| 7 | `brain/characteristics.ts` | R | 3 → **7 caractéristiques** (cap 12) + PV/PE purs (§ 1) |
| 8 | `brain/types.ts` | R | `SkillRoll` (tier), `GameObject` (equipment), `MonsterConfig` (bloc § 4) — champs hérités `@deprecated` |
| 9 | `brain/persistenceKeys.ts` | R | + `MONSTER_LIBRARY_SEEDED_KEY` (seed unique) |
| 10 | `brain/MonsterLibraryService.ts` | R | + `seedDefaults()` (idempotent, anti-réinjection) |
| 11 | `brain/BrainContext.tsx` | R | `monsterLibrary.seedDefaults(BESTIARY)` au `createBrain` |
| 12 | `brain/index.ts` | R | Exports des nouveaux modules + types |
| 13 | `brain/components/ObjectEditor.tsx` | R | + section « Effet d'équipement » (arme/protection) |
| 14 | `features/action-trap/components/TrapEditor.tsx` | R | Difficulté → **SegmentedControl TC1–4** ; trait = 7 caracs |
| 15 | `features/action-decor/components/ObjectEditModal.tsx` | R | « Jet requis » : trait 7 caracs + tier TC1–4 |
| 16 | `features/action-monster/components/MonsterEditor.tsx` | R | **Bloc de stats § 4** (5 caracs, MC, PV±, armure, arme, tier, capacité) |

## Ordre d'application
1. Déposer les **6 fichiers brain nouveaux** (1–6).
2. Remplacer les **6 fichiers brain** (7–12) — l'ordre n'importe pas, mais `tsc` ne sera vert qu'une fois tous posés (dépendances croisées : `types.ts` ↔ `challenge`/`equipment`/`characteristics`).
3. Remplacer `ObjectEditor.tsx` (13).
4. Remplacer les **3 éditeurs de features** (14–16).
5. Mettre à jour les tests impactés (ci-dessous), puis lancer le **gate qualité** (Prettier → `tsc` → ESLint → `jest`) et le reste de la boucle du repo (CHANGELOG / specs / code-knowledge / tech-lead review).

## Effets de bord à traiter (tests & specs)
Le patch ne casse pas les types, mais **change l'UI et le comportement de seed** — ces tests doivent être mis à jour (c'est attendu dans la boucle par-feature du repo) :

- **`features/action-monster/tests/monster.test.tsx`** — les steppers « Attaque » / « Défense » n'existent plus ; ils sont remplacés par les 5 caracs + MC + PV + Armure + arme + Tier. Adapter les assertions UI. (Le type `MonsterConfig` accepte toujours `attack/defense`, donc les fixtures qui les passent compilent.)
- **`features/action-trap/tests/trap.test.tsx`** — le stepper « Difficulté » devient un `SegmentedControl` de Tiers ; un `roll.difficulty` numérique persisté migre via `rollTier` vers un Tier. Adapter les assertions.
- **`features/action-decor/tests/decor.test.tsx`** — le « jet requis » utilise désormais des `SegmentedControl` (trait + tier) au lieu de `Field` libres.
- **`brain/MonsterLibraryService.test.ts`** — inchangé pour `save/remove/list` (le service créé directement **ne seed pas**). Ajouter un test pour `seedDefaults()` (idempotence + anti-réinjection après suppression).
- **Tout test basé sur `createBrain` / un Brain complet** qui supposait une **librairie vide** verra désormais **23 monstres seedés**. Soit l'assertion est ajustée, soit le test passe une persistence où `MONSTER_LIBRARY_SEEDED_KEY` est déjà `true` pour neutraliser le seed.
- **`brain/gameSystem.test.ts`** (nouveau) couvre les fonctions pures § 1–5.

## Notes de conception (à respecter)
- **`REGLES-DU-JEU.md` prime.** Les 2 corrections de cohérence (ordre des malus d'endurance EN/3 → EN/5 ; dés de challenge harmonisés) sont **encodées** — ne pas les « re-corriger » (KR-130).
- **Création vs play (KR-131).** Les éditeurs ne stockent que le **schéma** (trait, tier, bloc monstre, équipement). PV/PE, combat, XP restent des **fonctions pures** différées — aucun écran d'éditeur ne les résout. `book-export` devra embarquer le bloc complet du monstre + l'`equipment` des objets (le type le porte déjà ; vérifier que `playExport` les conserve — il copie les nœuds verbatim, donc OK).
- **Registres KR-117** : tout ensemble fermé (caracs, tiers, postures, armes, protections) est un registre à descripteurs ; aucun `if/switch` au point d'appel.
- **Copie-à-l'usage KR-101** : le bestiaire est un gabarit ; l'insérer crée une copie indépendante par livre (déjà le cas via `MonsterLibraryPicker` → `instantiateFromLibrary`).
- **`<select>` natifs** (arme/protection dans `ObjectEditor`, multiplicateur d'arme dans `MonsterEditor`) : il n'existe pas de primitive `Select` dans le design system ; ces `<select>` sont stylés via tokens. Si une primitive `Select` est créée plus tard, les y porter (passe de reskin).

## Améliorations optionnelles (hors patch)
- `MonsterLibraryPicker` : grouper la liste par **Tier** (le bestiaire seedé porte `config.tier`).
- Une primitive `forms/Select` partagée pour remplacer les `<select>` natifs.
- Génération des stats du héros (2D4 + 1D4×3) et l'écran **boutique de progression** : à la future fiche perso / mode play.
