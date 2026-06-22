# genliv — pack d'adaptation « système de jeu »

Pack à déposer dans le repo **genliv** pour lancer une session Claude Code qui implémente les règles du jeu (personnage, challenges, combat, bestiaire, XP) dans l'architecture existante.

## Pourquoi ce pack
Le repo genliv embarque aujourd'hui un système de jeu **volontairement placeholder** — `brain/characteristics.ts` le dit lui-même : 3 traits (« habileté/endurance/chance ») et « an author-defined caractéristique set is a later feature ». De même `SkillRoll.difficulty` est un simple nombre et `MonsterConfig` se limite à `pv/attack/defense`. **Ces règles sont ce système définitif.** Le pack mappe les règles sur l'architecture brain (registres KR-117, play-mode différé, copie-à-l'usage KR-101) sans rien casser.

## Contenu
```
genliv_game_system_pack/
├── README.md                         ← ce fichier
├── REGLES-DU-JEU.md                  ← MANUEL CANONIQUE (source de vérité, FR)
├── REGLES-PLAY-A-COMPLETER.md        ← À REMPLIR : règles du mode JEU manquantes (questionnaire)
├── PATCH.md                          ← MANIFESTE DU PATCH : quoi copier où, ordre, tests impactés
├── DESIGN-DELTAS.md                  ← les 4 changements d'UI éditeur (le « pourquoi » design)
├── features/
│   └── game-system/specification.json ← spec au format du repo (plan + iterations + KR)
└── patch/src/                        ← FICHIERS PRÊTS À APPLIQUER (reflètent l'arbo du repo)
    ├── brain/  (challenge, equipment, combat, xp, bestiary, gameSystem.test = nouveaux ;
    │            characteristics, types, persistenceKeys, MonsterLibraryService,
    │            BrainContext, index = remplacements)
    ├── brain/components/ObjectEditor.tsx        (+ effet d'équipement)
    └── features/  (TrapEditor, ObjectEditModal, MonsterEditor = remplacements)
```

## Comment l'utiliser (session Claude Code)
1. **Appliquer le patch** : suivre `PATCH.md` — pour chaque fichier, copier `patch/src/<chemin>` → `src/<chemin>`. Le manifeste indique nouveau vs remplacement, l'ordre, et les tests à mettre à jour.
2. **Mettre à jour les tests impactés** (listés dans `PATCH.md`) puis lancer le gate du repo : Prettier → `tsc` → ESLint → `jest`, + CHANGELOG / specs / tech-lead review.
3. `features/game-system/specification.json` consigne le plan au format du repo (4 itérations, brain-contracts, KR) si vous préférez dérouler la boucle breadth-first plutôt que poser le patch d'un bloc.
4. `REGLES-DU-JEU.md` + `DESIGN-DELTAS.md` documentent le « pourquoi » (source de vérité + intentions UI).

## Garde-fous
- **`REGLES-DU-JEU.md` prime** sur tout le reste. Deux corrections de cohérence y sont intégrées (ordre des malus d'endurance ; dés de challenge harmonisés) — ne pas les « re-corriger ».
- **Création vs play** : l'éditeur ne stocke que le *schéma* (quel trait, quel tier, quel bloc monstre, quel équipement). PV/PE, combat, XP restent des **fonctions pures** différées au mode play — jamais un écran d'éditeur (KR-131).
- **Registres KR-117** : tout ensemble fermé est un registre à descripteurs ; aucun `if/switch` au point d'appel.
- **Copie-à-l'usage KR-101** : le bestiaire est un gabarit ; l'insérer en fait une copie indépendante par livre.

> Besoin d'une maquette des 4 deltas d'UI (picker 7 caracs, sélecteur TC1–4, bloc de stats monstre, effet d'équipement) sur le wireframe § 02/§ 05 ? Je peux la produire à la demande.
