# Prompt IA — Génération de scénario Genliv

Tu vas créer un scénario complet pour un **livre dont vous êtes le héros** (gamebook), au format JSON importable dans **Genliv**.

---

## 1. Système de jeu

### Caractéristiques du héros (8)

| Code | Nom | Rôle |
|------|-----|------|
| FO | Force | Puissance physique, dégâts |
| AG | Agilité | Souplesse et vitesse |
| DX | Dextérité | Précision manuelle |
| EN | Endurance | Résistance physique et souffle |
| IN | Intelligence | Connaissances et mémoire |
| IG | Ingéniosité | Débrouillardise et improvisation |
| SE | Sens | Perception, vigilance, instinct |
| CA | Caractère | Volonté et résilience mentale |

Valeurs typiques au départ : 3–6. Maximum : 12.

Le héros possède également :
- **PV** (Points de Vie) ≈ EN × 3 + FO
- **PE** (Points d'Endurance, jauge courte) ≈ EN — récupère entre les combats
- **MC** (Maîtrise des Coups) : compétence de combat, valeur 1–10
- **Armure** : réduction fixe des dégâts par coup (0–4)

### Types d'écrans (nœuds)

| Kind | Rôle |
|------|------|
| `sommaire` | Page de titre / intro — racine unique, non dupliquable |
| `choix` | Écran ordinaire avec des boutons de choix sortants |
| `pnj` | Rencontre avec un personnage non-joueur (dialogue + cadeau) |
| `decor` | Interaction avec l'environnement : prendre / écouter / fouiller |
| `piege` | Jet de compétence — réussite ou échec |
| `monstre` | Combat contre un monstre |
| `fin` | Fin victoire ou fin échec |
| `mort` | Mort du personnage — unique, atteinte automatiquement en combat perdu |

> Chaque livre DOIT avoir exactement un nœud `sommaire` (racine) et un nœud `mort` (avec `"locked": true`). Ne crée jamais d'arête `choice` ou `relink` pointant vers `mort` — ce lien est établi automatiquement par le moteur.

### Jets de compétence (pièges, décors)

Le héros teste une caractéristique contre un **Tier de Challenge** :

| Tier | Niveau |
|------|--------|
| `TC1` | Facile |
| `TC2` | Moyen |
| `TC3` | Difficile |
| `TC4` | Très difficile |

Les seuls résultats possibles sont **réussite** et **échec**.

### Combat (nœuds monstre)

Chaque round : héros et monstre lancent 2D6 + MC → score AT. L'écart détermine la qualité du coup et les dégâts infligés. Le monstre peut fuir (si PE bas) ou mourir. Défaite du héros → mort automatique.

### Objets

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant stable unique dans le livre |
| `name` | string | Nom interne (auteur) |
| `description` | string | Texte lu par le joueur |
| `equipment` | optionnel | Arme ou protection équipée |
| `scenario` | `true` (optionnel) | Objet de scénario — ne peut pas être volé par un piège sauf ciblage explicite |
| `reinforcementBonus.rollBonus` | number (optionnel) | Bonus de jet (1–5) utilisable avant un piège ou une action décor |

**Armes disponibles :** `mains-nues` · `couteau` · `lance` · `masse-1m` · `contondante-2m` · `epee-1m` · `tranchante-2m` · `distance`

**Protections disponibles :** `cuir` · `cotte` · `plaque` · `bouclier`

---

## 2. Bestiaire (22 monstres)

Référence chaque monstre par son `templateId`. Copie les statistiques ci-dessous **à l'identique** — le moteur les utilise pour le calcul du combat.

### Tier 1 — Faibles

| templateId | Nom | FO | AG | DX | EN | IG | MC | PV±var | Armure | Capacité |
|---|---|---|---|---|---|---|---|---|---|---|
| `rat-geant` | Rat géant | 1 | 4 | 2 | 2 | 1 | 2 | 7±1 | 0 | `maladie` |
| `gobelin` | Gobelin | 2 | 3 | 2 | 2 | 2 | 2 | 7±1 | 0 | `vol` |
| `squelette` | Squelette | 3 | 3 | 3 | 3 | 1 | 2 | 9±1 | 1 | `pas-endurance` |
| `zombie` | Zombie | 4 | 1 | 1 | 6 | 1 | 1 | 11±1 | 0 | `se-releve` |

### Tier 2 — Modérés

| templateId | Nom | FO | AG | DX | EN | IG | MC | PV±var | Armure | Capacité |
|---|---|---|---|---|---|---|---|---|---|---|
| `harpie` | Harpie | 2 | 6 | 4 | 3 | 2 | 4 | 11±2 | 0 | `chant-stressant` |
| `orque` | Orque | 5 | 3 | 4 | 5 | 2 | 3 | 13±2 | 2 | `fureur` |
| `hobgobelin` | Hobgobelin | 4 | 4 | 4 | 4 | 4 | 4 | 12±2 | 2 | `tacticien` |
| `araignee-geante` | Araignée géante | 3 | 6 | 4 | 3 | 2 | 4 | 12±2 | 1 | `poison` |
| `loup-geant` | Loup géant | 5 | 5 | 4 | 5 | 3 | 4 | 15±2 | 1 | `renversement` |
| `ours` | Ours | 7 | 3 | 3 | 6 | 3 | 3 | 16±2 | 2 | `etreinte` |

### Tier 3 — Redoutables

| templateId | Nom | FO | AG | DX | EN | IG | MC | PV±var | Armure | Capacité |
|---|---|---|---|---|---|---|---|---|---|---|
| `serpent-geant` | Serpent géant | 5 | 7 | 5 | 5 | 3 | 5 | 17±2 | 2 | `venin` |
| `sorciere` | Sorcière | 2 | 4 | 6 | 4 | 8 | 6 | 10±2 | 1 | `malediction` |
| `spectre` | Spectre | 2 | 8 | 6 | 6 | 7 | 7 | 16±4 | 0 | `intangible` |
| `ogre` | Ogre | 9 | 3 | 4 | 8 | 2 | 3 | 20±2 | 2 | `force-ecrasante` |
| `momie` | Momie | 9 | 2 | 4 | 10 | 3 | 3 | 21±2 | 4 | `insensible` |
| `manticore` | Manticore | 8 | 6 | 5 | 8 | 4 | 5 | 22±2 | 3 | `piques` |
| `troll` | Troll | 10 | 4 | 4 | 10 | 2 | 3 | 24±4 | 2 | `regeneration` |
| `loup-garou` | Loup-Garou | 7 | 8 | 7 | 8 | 6 | 7 | 23±2 | 2 | `regeneration-argentee` |

### Tier 4 — Légendaires

| templateId | Nom | FO | AG | DX | EN | IG | MC | PV±var | Armure | Capacité |
|---|---|---|---|---|---|---|---|---|---|---|
| `geant` | Géant | 12 | 5 | 6 | 12 | 6 | 6 | 29±2 | 2 | `seisme` |
| `liche` | Liche | 1 | 4 | 8 | 10 | 12 | 8 | 15±2 | 2 | `magie` |
| `tyrannoeil` | Tyrannœil | 3 | 4 | 8 | 8 | 12 | 8 | 15±2 | 4 | `rayon` |
| `vampire` | Vampire | 10 | 10 | 10 | 12 | 10 | 10 | 30±4 | 3 | `vol-de-vie` |

### Référence des capacités spéciales

| id | Effet en jeu |
|----|--------------|
| `maladie` | −1 EN max si vaincu avec Écart > 4 |
| `vol` | Vole un objet mineur s'il remporte le 1er round |
| `pas-endurance` | Immunisé à l'épuisement (pas de jauge PE) |
| `se-releve` | À 0 PV, se relève avec 1 PV sur un jet D6 (5–6) |
| `chant-stressant` | −1 PE supplémentaire par round |
| `fureur` | 1 attaque gratuite avant de mourir |
| `tacticien` | MC = 5 si en groupe |
| `poison` | 1 dégât/round pendant 1D4 rounds sur Coup critique |
| `renversement` | −2 AT au prochain tour si Écart > 3 |
| `etreinte` | Après 2 victoires consécutives, le 3e assaut fait ×2 garanti |
| `venin` | 2 dégâts/round pendant 3 rounds sur Coup critique |
| `malediction` | Round 1 : joueur lâche son arme sur 1–3 (D6) |
| `regard-petrifiant` | Combat à l'aveugle (−3 AT) OU mort instantanée sur Coup critique |
| `intangible` | 1 dégât max par coup d'arme non-magique |
| `force-ecrasante` | Détruit 1 pt d'Armure/Bouclier même sur parade |
| `insensible` | Insensible aux attaques précises ; soins bloqués sur Coup critique |
| `piques` | Tire 1D3 piques (AT fixe 5, dégâts 3) avant corps-à-corps |
| `regeneration` | +3 PV/round, stoppé par feu/acide |
| `regeneration-argentee` | +2 PV/round ; armure ignorée par les armes en argent |
| `seisme` | Chaque coup force un jet AG TC4 pour ne pas tomber |
| `magie` | Lance un sort 1D4/round ; draine −1D4 PV max (niveaux 3–4) |
| `rayon` | Attaque à distance (20 m) ignorant l'armure |
| `vol-de-vie` | Récupère autant de PV qu'il inflige de dégâts |

---

## 3. Format JSON de sortie

Retourne un objet JSON valide au format `ScenarioExport` de Genliv.

### Structure globale

```json
{
  "format": "genliv-scenario",
  "version": 1,
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "book": {
    "id": "livre-generé",
    "title": "Titre du scénario",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "nodes": [ ... ],
    "edges": [ ... ]
  }
}
```

> L'id du livre sera remplacé par un nouvel identifiant à l'import. Tu peux utiliser n'importe quelle valeur pour `"id"`.

### Nœud (BookNode)

```json
{
  "id": "node-intro",
  "kind": "choix",
  "text": "Texte affiché au joueur sur cet écran.",
  "position": { "x": 0, "y": 0 },
  "actionType": "aucune"
}
```

**Champs requis :** `id`, `kind`, `text`
**`kind` autorisés :** `sommaire` · `choix` · `pnj` · `decor` · `piege` · `monstre` · `fin` · `mort`
**`actionType` autorisés :** `aucune` · `pnj` · `decor` · `piege` · `monstre`

Champs optionnels : `endVictory: true` (fin victoire), `endFailure: true` (fin échec), `locked: true` (réservé à `mort`).

### Arête (Edge)

```json
{
  "id": "edge-001",
  "from": "node-intro",
  "to": "node-foret",
  "kind": "choice",
  "label": "Entrer dans la forêt"
}
```

**`kind` autorisés :** `choice` (bouton de choix) · `relink` (redirection silencieuse) · `flee` (fuite de combat)

### Config décor (`actionType: "decor"`)

```json
{
  "interaction": "prendre",
  "xp": 1,
  "objects": [
    {
      "object": {
        "id": "obj-epee",
        "name": "Épée rouillée",
        "description": "Une vieille épée dont la lame est mangée par la rouille.",
        "equipment": { "kind": "arme", "weapon": "epee-1m" }
      },
      "kind": "utile"
    }
  ]
}
```

### Config PNJ (`actionType: "pnj"`)

```json
{
  "name": "Vieille herboriste",
  "role": "Marchande",
  "dialogue": "« Ces herbes vous guériront, voyageur. »",
  "xp": 1,
  "gift": {
    "object": {
      "id": "obj-herbes",
      "name": "Herbes médicinales",
      "description": "Un bouquet aux propriétés curatives."
    },
    "effect": "pv",
    "value": 3
  }
}
```

**`effect` autorisés :** `pv` · `attaque` · `defense` · `scenario`

### Config piège (`actionType: "piege"`)

```json
{
  "description": "Une dalle suspecte masque un mécanisme.",
  "roll": { "trait": "DX", "tier": "TC2" },
  "outcomes": {
    "reussite": "Vous évitez de justesse la trappe.",
    "echec": "Vous tombez dans la fosse et perdez 3 PV."
  },
  "fatal": false,
  "inventoryLoss": { "kind": "aucune" }
}
```

**`inventoryLoss.kind` autorisés :** `aucune` · `petits` (objets non-équipement) · `petits-et-armes` (tout sauf scénario) · `specifique` (un objet précis, ajouter `"objectId": "obj-xxx"`)

### Config monstre (`actionType: "monstre"`)

```json
{
  "name": "Gobelin",
  "templateId": "gobelin",
  "pv": 7,
  "pvVariance": 1,
  "stats": { "FO": 2, "AG": 3, "DX": 2, "EN": 2, "IG": 2 },
  "mc": 2,
  "armour": 0,
  "weaponMultiplier": 1,
  "tier": 1,
  "capacity": "vol",
  "creatureType": "humanoide",
  "outcomes": {
    "reussite": "Le gobelin s'effondre, vaincu.",
    "echec": "Le gobelin profite de votre faiblesse."
  },
  "victoryTarget": "node-apres-combat"
}
```

**`creatureType` autorisés :** `humanoide` · `mort-vivant` · `animal` · `animal-geant` · `creature-magique`

> Ne pas inclure `"fleeTarget"` si le monstre ne peut pas fuir. Le lien vers `mort` en cas de défaite est automatique — ne pas créer d'arête manuelle.

---

## 4. Instructions de rédaction

### Contraintes structurelles
- **Exactement un `sommaire`** (racine, pas d'arête entrante) et un `mort` (`"locked": true`, pas d'arête sortante).
- **Pas d'écrans isolés** : chaque nœud non-racine a au moins une arête entrante.
- **Arêtes nommées** : le `label` d'un `choice` edge est le texte du bouton visible par le joueur.
- **Ids uniques** : chaque `id` (nœuds, arêtes, objets) doit être unique dans le fichier. Utilise un format lisible : `node-foret-sombre`, `edge-vers-village`, `obj-cle-bronze`.

### Taille recommandée
- Courte aventure : 8–15 nœuds
- Aventure standard : 20–35 nœuds
- Saga : 40+ nœuds

### Bonnes pratiques narratives
- Alterne les types d'écrans : plusieurs `choix` purs entre chaque combat/piège.
- Donne un nom au PNJ **et** un rôle narratif précis (pas juste « Marchand »).
- Les textes des nœuds sont au présent, écrits à la 2e personne (« Vous entrez dans… »).
- Les `outcomes.reussite` / `outcomes.echec` sont courts (1–2 phrases) et décrivent l'effet immédiat.
- Un piège `fatal: true` mène automatiquement à la mort — réserve-le aux dangers extrêmes.
- Prévois toujours un chemin vers la victoire depuis chaque branche principale.

### Exemple minimal (4 nœuds)

```json
{
  "format": "genliv-scenario",
  "version": 1,
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "book": {
    "id": "exemple",
    "title": "La Tour Maudite",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "nodes": [
      { "id": "n-sommaire", "kind": "sommaire", "text": "La Tour Maudite\n\nVous vous tenez devant une tour en ruines.", "position": { "x": 0, "y": 0 } },
      { "id": "n-porte", "kind": "choix", "text": "La porte grinçante s'ouvre sur un couloir sombre. Un rat géant jaillit de l'ombre.", "position": { "x": 200, "y": 150 }, "actionType": "monstre", "monster": { "name": "Rat géant", "templateId": "rat-geant", "pv": 7, "pvVariance": 1, "stats": { "FO": 1, "AG": 4, "DX": 2, "EN": 2, "IG": 1 }, "mc": 2, "armour": 0, "weaponMultiplier": 0.3, "tier": 1, "capacity": "maladie", "creatureType": "animal-geant", "outcomes": { "reussite": "Le rat fuit en couinant.", "echec": "Le rat vous mord profondément." }, "victoryTarget": "n-victoire" } },
      { "id": "n-victoire", "kind": "fin", "text": "Vous avez traversé la tour et découvert le trésor caché. Victoire !", "position": { "x": 400, "y": 0 }, "endVictory": true },
      { "id": "n-mort", "kind": "mort", "text": "Vos blessures sont fatales. Votre aventure s'achève ici.", "position": { "x": 200, "y": 320 }, "locked": true }
    ],
    "edges": [
      { "id": "e-entrer", "from": "n-sommaire", "to": "n-porte", "kind": "choice", "label": "Pousser la porte" }
    ]
  }
}
```
