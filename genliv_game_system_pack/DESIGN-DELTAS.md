# Deltas d'éditeur (UI) — adaptation aux règles genliv

Ce que ces règles changent **dans l'éditeur** (mode création), au-delà des modules `brain/`. Chaque delta reste fidèle au design system bas-niveau (`styles.css` + `components/`), thème clair, cibles ≥ 44px, et réutilise les primitives existantes — **aucune nouvelle couleur**, l'accent bleu et les tons réussite/échec suffisent.

## 1. Picker de caractéristique (jets) — 3 → 7 options
Partout où un `SkillRoll.trait` se choisit (action-trap, et le « jet requis » d'action-decor « prendre »), le `forms/Select` se peuple désormais des **7 caractéristiques** (`CHARACTERISTICS`, KR-117). Afficher le label complet + le code `FO`/`AG`… en JetBrains Mono. Aucune refonte de layout : le registre repeuple le Select.

## 2. Difficulté → Tier de Challenge (TC1–4)
Le champ « difficulté » d'un jet passe d'un **nombre libre** à un **`SegmentedControl`** (ou `Select` si trop large) à 4 options `TC1 Simple · TC2 Dur · TC3 Très dur · TC4 Impossible`, avec la notation de dés en méta (`1D6`, `2D5`…). Branché sur `CHALLENGE_TIERS`. Cf. § 2.

## 3. Bloc de stats de monstre (action-monster) — pv/attack/defense → bloc § 4
L'éditeur inline de monstre remplace les 3 `Stepper` (PV/Attaque/Défense) par le **bloc complet** :
- une rangée de `Stepper` pour les **5 caracs** `FO AG DX EN IG` (denses, label Mono) ;
- `Stepper` **MC**, **PV**, **Armure** ;
- un `Select` **arme naturelle** (multiplicateur, 0.3–2) — réutilise `WEAPONS` ;
- un champ **Tier** (`SegmentedControl` 1–4) + un `Field` **capacité** (texte libre, interprété en play mode).

Le **picker de librairie** (`MonsterLibraryPicker`) liste désormais le **bestiaire pré-chargé** (`BESTIARY`, 23 monstres) groupé par Tier — copie-à-l'usage (KR-101). Garder l'empty-state « Choisir ou créer un monstre ».

## 4. Effet d'équipement sur un objet (ObjectEditor partagé)
L'`ObjectEditor` (partagé décor/pnj/monstre) gagne une section **optionnelle** « Effet d'équipement » : un `SegmentedControl` `Aucun · Arme · Protection`, puis un `Select` contextuel (`WEAPONS` ou `PROTECTIONS`). Reste optionnel — un objet d'intrigue n'a pas d'équipement. Connecte les dégâts/protection du § 3 aux objets que l'auteur distribue (loot, don de PNJ, objet à prendre).

## 5. Hors-périmètre éditeur (mode play, différé)
PV/PE, postures de combat, résolution d'assaut, matrice d'XP et boutique de progression **ne sont pas** des écrans d'éditeur — ce sont des **fonctions pures** (`combat.ts`, `xp.ts`, `characteristics.ts`) câblées quand le mode play arrivera. L'éditeur n'expose que le **schéma** (qui/quoi/où), jamais la résolution. À surfacer toutefois : l'export `book-export` (`genliv-play` v1) doit **embarquer** le bloc de stats complet du monstre et l'effet d'équipement des objets pour que le runtime play soit autonome.

## Référence de design
Wireframe `Editeur Livre-Jeu - Wireframes.dc.html` § 02 (config monstre) + § 05 (combat renforcé / jets). Ces deltas **étendent** ces sections ; ils ne changent pas l'anatomie ni les tokens. Une passe de maquette dédiée (mockup des 4 deltas) peut être produite à la demande.
