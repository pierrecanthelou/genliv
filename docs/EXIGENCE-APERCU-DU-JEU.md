# Exigence — « Aperçu du jeu » (CTA éditeur → runtime autonome)

> Statut : **exigence éditeur** (générateur d'aventure). Le **bouton « Aperçu du jeu » existe déjà** dans la barre d'outils de l'éditeur ; il s'agit de le **brancher sur le runtime de jeu autonome** et d'en faire un aller-retour fluide.

## Contrainte architecturale fondamentale

> **Le runtime de jeu est un module autonome et extractible** — il n'importe rien de l'éditeur. La même unité de code alimente à la fois l'« Aperçu du jeu » de l'éditeur **et** les futures surfaces de distribution (autre webapp, application mobile). Les aventures lui sont **chargées** sous forme d'un `AdventureDocument` ; il ne lit jamais le `BookService` ni aucun service brain de l'éditeur directement.
>
> **Isolation :** `src/player/` n'importe que les fonctions pures `brain/` (characteristics.ts, combat.ts, xp.ts, challenge.ts, equipment.ts) — jamais les features ni les services. Ces fonctions pures font partie du bundle extractible.
>
> **`AdventureDocument`** (défini dans `src/player/types.ts`) = le format chargé par le runtime. Pour l'« Aperçu du jeu », l'éditeur le construit depuis le book en mémoire via `buildAdventureDocument(book)` (sans export sur disque). Pour la version publiée, `book-export` produit ce même format.

## Objectif
Permettre à l'auteur de **jouer immédiatement** l'aventure qu'il est en train d'écrire, sans quitter le générateur ni passer par une étape d'export. C'est l'outil de relecture #1 : vérifier qu'un écran s'enchaîne, qu'un combat est jouable, qu'un prérequis (objet/clé) débloque le bon choix.

## Comportement attendu

### 1. Déclenchement
- Réutiliser le **bouton de test déjà présent** dans la barre d'outils de l'éditeur (ne pas en ajouter un second).
- **Un clic** suffit : aucune sauvegarde ni export préalable requis.
- Deux entrées possibles :
  - **Tester depuis le début** → démarre au nœud `sommaire` (racine).
  - **Tester depuis cet écran** → démarre sur le nœud actuellement ouvert dans l'éditeur (utile pour itérer sur un combat/une salle précise).

### 2. Source de données = le brouillon en mémoire
- La session lit l'**état d'édition courant** : arbre de nœuds + arêtes (`choice`, `prereq`, `countdown`, `fallback`), blocs de stats monstre (§ 4), effet d'équipement des objets (§ 3), trait + tier de challenge (§ 2).
- **Pas** de lecture d'un livre sauvegardé/exporté : on teste exactement ce qui est à l'écran, modifications non enregistrées comprises.

### 3. Création du héros (rapide)
- Génération auto : **2D4 par caractéristique + 1D4 réparti** (les 8 caractéristiques, dont `SE` Sens), avec possibilité de **relancer** et de **répartir** le bonus (cap 10 à la création) — ou un bouton « héros par défaut » pour aller vite.
- PE = EN (jauge pleine), équipement de départ selon le livre (mains nues sinon).

### 4. Moteur = celui du jeu final (source unique)
- La session de test consomme la **même spécification play-mode** et les **mêmes fonctions pures** que le jeu publié :
  - `characteristics.ts` (caracs, PV, PE, MC),
  - `challenge.ts` (tiers TC1–4, résolution),
  - `combat.ts` (postures, AT, PF, écart, garde aiguisée),
  - `xp.ts` (matrice ΔT, boutique de progression).
- Conséquence : **« ce qui est testé = ce qui sera joué »**. Aucune logique de test parallèle.

### 5. Non destructif
- Le test s'ouvre en **surcouche** (modal ou panneau plein écran) au-dessus de l'éditeur.
- La partie de test **ne modifie jamais le brouillon** (état de session isolé : héros, inventaire, nœud courant, monstres vaincus, objets ramassés).
- Bouton **« Quitter le test »** → retour à l'éditeur exactement dans l'état laissé (sélection de nœud, zoom, position conservés).
- Idéalement : **« Relancer le test »** sans repasser par l'éditeur, et un **journal** (combat + jets) pour le débogage.

### 6. Autonomie et extractibilité du runtime
- Le runtime (`src/player/`) embarque le **bloc de stats complet** du monstre et l'**effet d'équipement** des objets via l'`AdventureDocument` — il ne dépend d'aucun export préalable ni d'aucun service éditeur.
- Il peut être **extrait et déployé indépendamment** (autre webapp, app mobile) : copier `src/player/` + les modules `brain/` purs (characteristics, combat, xp, challenge, equipment, monsterCapacities). `AdventureDocument` est l'unique point d'entrée.
- `book-export` produit le même `AdventureDocument` pour la version publiée : le format est unique, le runtime est unique.

## Maquette de référence
`Mode Jeu - Prototype.dc.html` (à la racine du projet) implémente déjà cette boucle jouable : création du héros → traversée du livre (sommaire, choix, piège, décor, PNJ, monstre, boss) → combat (postures, capacités, garde aiguisée) → XP/progression → fins (victoire / échec / mort), avec prérequis d'objet (ex. clé du Liche → coffre). Elle sert de **cible fonctionnelle** pour le branchement du bouton de test.

## Critères d'acceptation
- [ ] Depuis l'éditeur, **un clic sur « Aperçu du jeu »** lance une partie sur le brouillon courant (sommaire ou écran courant).
- [ ] La partie utilise les fonctions pures du mode play (pas de moteur ad hoc).
- [ ] Fermer le test laisse l'éditeur **inchangé**.
- [ ] Un monstre, un piège, un objet à prendre, un PNJ et un choix à prérequis se comportent **comme en jeu**.
- [ ] Aucune sauvegarde/export n'est nécessaire pour tester.
- [ ] Le runtime (`src/player/`) ne contient **aucun import** de `src/features/` ni de `src/brain/` services (BookService, PersistenceService…) — seulement les fonctions pures brain/.
- [ ] `buildAdventureDocument(book)` dans l'éditeur construit l'`AdventureDocument` depuis le BookService en mémoire et le passe au runtime sans aucun autre lien.
