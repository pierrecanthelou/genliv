# Manuel du jeu & règles système — genliv

> **Source de vérité** pour le système de jeu de « livre dont vous êtes le héros ».
> Double public : les **joueurs** (lisibilité) et l'**IA de développement** (formules sans ambiguïté).
>
> Deux corrections de cohérence ont été intégrées (cf. note de conception d'origine) :
> 1. **Malus d'Endurance inversés** — la jauge franchit le tiers (EN/3) *avant* le cinquième (EN/5) ; la fatigue s'aggrave donc dans le bon ordre.
> 2. **Dés de Challenge harmonisés** sur la matrice d'XP (Tiers 1 à 4).
>
> **Périmètre vs éditeur genliv.** L'éditeur (genliv) est en **mode création uniquement**. Ce manuel décrit le moteur complet ; il se répartit en deux couches :
> - **Schéma de création (à câbler maintenant)** — ce que l'auteur configure : les 8 caractéristiques, le Tier de Challenge d'un jet, le bloc de stats d'un monstre, l'équipement. Ces éléments redéfinissent le placeholder bas-niveau actuel de l'éditeur.
> - **Runtime de jeu (différé — mode play)** — PV/PE, résolution de combat, XP. Encodé ici en **fonctions pures** pour que le schéma de création soit dimensionné correctement dès aujourd'hui, et branché quand le mode play arrivera.

---

## 1. Le Personnage (variables d'état)

Le héros est défini par **8 caractéristiques principales**, plafonnées à **12**.

| Clé | Nom | Description |
|-----|-----|-------------|
| `FO` | Force | Puissance physique |
| `AG` | Agilité | Souplesse et vitesse |
| `DX` | Dextérité | Précision manuelle |
| `EN` | Endurance | Résistance physique et souffle |
| `IN` | Intelligence | Connaissances et mémoire |
| `IG` | Ingéniosité | Débrouillardise et improvisation |
| `SE` | Sens | Perception, vigilance et instinct (jets de détection : pièges cachés, embuscades, indices) |
| `CA` | Caractère | Volonté et résilience mentale |

### Création & état de santé
- **Génération** : l'ordinateur lance **2D4** pour chaque caractéristique. Le joueur répartit ensuite un bonus de **1D4** (points **librement répartis** entre les caractéristiques, **plafond 10 par caractéristique** à la création).
- **Points de Vie (PV)** : `PV = FO + AG + EN`.
- **Seuils critiques** :
  - `PV ≤ 0` → **inconscient**.
  - `PV ≤ -CA` → **mort** (Game Over → écran `mort`).

### Endurance (PE)
Jauge dynamique (Points d'Endurance courants — PE) adossée à `EN`. Chaque action physique y puise.
- **Coûts** : un round de combat = **-1 PE** ; désamorcer/subir un piège = **-1 PE**.
- **Récupération** : changer d'écran/zone = **+5 PE** ; repos total = requiert une **potion**.
- **Malus d'épuisement** (sur la jauge courante PE, du plus grave au moins grave) :
  - `PE ≤ 0` → **-3** à l'Attaque et aux Dégâts (**épuisé**).
  - `PE < EN/5` → **-2** à l'Attaque et aux Dégâts.
  - `PE < EN/3` → **-1** à l'Attaque et aux Dégâts.
  - sinon → **0**.

---

## 2. Les Challenges (hors combat)

Réussite = obtenir un résultat de dés **inférieur ou égal** à la caractéristique testée. Quatre **Tiers de Challenge (TC)** :

| TC | Difficulté | Dés | XP de base |
|----|-----------|-----|-----------|
| **TC1** | Simple | `1D6` | 1 |
| **TC2** | Dur | `2D5` | 2 |
| **TC3** | Très dur | `3D4` | 3 |
| **TC4** | Impossible | `4D4` | 4 |

- **Marge de réussite** = `caractéristique − résultat des dés` (sert au bonus d'XP, § 5).
- L'« XP de base » d'un challenge = la **valeur de son Tier** (1 à 4).

---

## 3. Le Combat

**Maîtrise des Coups (MC)** = moyenne inférieure d'Agilité, Dextérité et Ingéniosité :
`MC = floor( (AG + DX + IG) / 3 )`.

### Résolution d'un assaut
À chaque round, les deux combattants choisissent **secrètement** une **posture** et calculent leur valeur d'**Attaque (AT)**. On compare les deux AT : le score le plus élevé **remporte l'assaut** (inflige des dégâts, ou réussit sa parade).

| Posture | Calcul de l'AT | Effet sur les dégâts |
|---------|----------------|----------------------|
| **Normale** | `AT = MC − Rand(0,6)` | Dégâts normaux |
| **Précise** | `AT = MC − Rand(4,10)` | Dégâts **×2** |
| **Défensive** | `AT = MC + 1D4` | Aucun dégât (**parade**) |

> `Rand(a,b)` = entier aléatoire uniforme dans `[a, b]` inclus. Un **bouclier** ajoute `+1D4` à l'AT en posture **Défensive** (§ 3 — Équipement).
>
> **Garde aiguisée** : après **3 parades consécutives** d'un combattant (Défensive remportée), son **adversaire gagne +2 à la MC** pour le reste du combat (le compteur de parades est remis à zéro). Décourage la tortue défensive.

### Calcul des dégâts (Puissance de Frappe — PF)
Le système conserve les **décimales** jusqu'au calcul final (pas d'arrondi prématuré). Base :

`PF_base = ( FO + MC/2 ) × Multiplicateur_arme`

Puis multipliée selon l'**Écart** entre les deux scores d'attaque (`AT_vainqueur − AT_perdant`) :

| Écart | Qualité | Multiplicateur | Effet bonus |
|-------|---------|----------------|-------------|
| 1 | Coup éraflé | ×0.5 | — |
| 2–3 | Coup franc | ×1 | — |
| 4–5 | Coup magistral | ×1.5 | — |
| ≥6 | Coup critique | ×2 | **dégrade l'armure cible de 1 point** |

Dégâts finaux subis = `PF − Réduction_protection` (cf. ci-dessous). On arrondit **au calcul final uniquement**.

### Équipement & armement

**Armes** — multiplicateur pour le calcul de PF :

| Arme | Mult. |
|------|-------|
| Mains nues | 0.3 |
| Couteau | 0.6 |
| Arme perçante (lance) | 0.8 |
| Arme contondante 1 main (masse) | 0.8 |
| Arme contondante 2 mains | 1 |
| Arme tranchante 1 main (épée) | 1 |
| Arme tranchante 2 mains | 1.3 |
| Distance (arc / arbalète) | 1 — **règle spéciale** : dans la formule de PF, on remplace `FO` par le résultat d'un jet de **`4D2`**. |

**Protections** — réduction directe des dégâts **finaux** subis :

| Protection | Réduction |
|------------|-----------|
| Cuir | 1 |
| Cotte de mailles | 3 |
| Plaque | 5 |
| Bouclier | ajoute `1D4` à l'AT en posture **Défensive** (pas une réduction) |

---

## 4. Bestiaire & Tiers de monstres

Les monstres n'ont que **5 caractéristiques** (`FO, AG, DX, EN, IG`) et des armes naturelles (multiplicateur 0.3 à 2, moyenne 1). `PV` est noté `base ± variance`. La **valeur du Tier** d'un monstre (1 à 4) sert au calcul d'XP.

### 🟢 Tier 1 — Chair à canon & nuisibles
| Monstre | FO | AG | DX | EN | IG | MC | PV | Armure | Arme | Capacité |
|---------|----|----|----|----|----|----|----|--------|------|----------|
| Rat géant | 1 | 4 | 2 | 2 | 1 | 2 | 7±1 | — | 0.3 | **Maladie** (-1 EN max) si vaincu avec Écart > 4 |
| Gobelin | 2 | 3 | 2 | 2 | 2 | 2 | 7±1 | — | 1 | **Vol** d'un objet mineur s'il gagne le 1er round |
| Squelette | 3 | 3 | 3 | 3 | 1 | 2 | 9±1 | 1 | 0.8 | **Pas d'endurance** (immunisé à l'épuisement) |
| Zombie | 4 | 1 | 1 | 6 | 1 | 1 | 11±1 | — | 0.8 | À 0 PV, **se relève** avec 1 PV sur 1D6 (5–6) |

### 🟡 Tier 2 — Menaces standards
| Monstre | FO | AG | DX | EN | IG | MC | PV | Armure | Arme | Capacité |
|---------|----|----|----|----|----|----|----|--------|------|----------|
| Harpie | 2 | 6 | 4 | 3 | 2 | 4 | 11±2 | — | 0.5 | **Chant stressant** : -1 PE supplémentaire / round |
| Orque | 5 | 3 | 4 | 5 | 2 | 3 | 13±2 | 2 | 1.2 | **Fureur** : 1 attaque désespérée gratuite avant de mourir |
| Hobgobelin | 4 | 4 | 4 | 4 | 4 | 4 | 12±2 | 2 | 1 | **Tacticien** : MC = 5 si en groupe |
| Araignée géante | 3 | 6 | 4 | 3 | 2 | 4 | 12±2 | 1 | 0.3 | **Poison** : 1 dmg/round pdt 1D4 rounds sur critique |
| Loup géant | 5 | 5 | 4 | 5 | 3 | 4 | 15±2 | 1 | 1.2 | **Renversement** : -2 AT au prochain tour si Écart > 3 |
| Ours | 7 | 3 | 3 | 6 | 3 | 3 | 16±2 | 2 | 1.5 | **Étreinte** : après 2 victoires consécutives, 3e assaut ×2 garanti |

### 🟠 Tier 3 — Boss / standards pour légendes
| Monstre | FO | AG | DX | EN | IG | MC | PV | Armure | Arme | Capacité |
|---------|----|----|----|----|----|----|----|--------|------|----------|
| Serpent géant | 5 | 7 | 5 | 5 | 3 | 5 | 17±2 | 2 | 1 | **Venin** : 2 dmg/round pdt 3 rounds sur critique |
| Sorcière | 2 | 4 | 6 | 4 | 8 | 6 | 10±2 | 1 | 0.5 | **Malédiction** : round 1, lâche son arme sur 1D6 (1–3) et passe son tour |
| Méduse | 3 | 6 | 8 | 5 | 7 | 7 | 14±2 | 1 | 0.8 | Combat **à l'aveugle** (-3 AT) OU **pétrification** (mort instant.) sur critique |
| Spectre | 2 | 8 | 6 | 6 | 7 | 7 | 16±4 | — | 0.8 | **Intangible** : 1 dmg max par coup d'arme non-magique |
| Ogre | 9 | 3 | 4 | 8 | 2 | 3 | 20±2 | 2 | 1.8 | **Force écrasante** : détruit 1 armure/bouclier même sur parade réussie |
| Momie | 9 | 2 | 4 | 10 | 3 | 3 | 21±2 | 4 | 1.5 | **Insensible** aux attaques précises ; **putréfaction** (soins bloqués) sur critique |
| Manticore | 8 | 6 | 5 | 8 | 4 | 5 | 22±2 | 3 | 1.5 | Tire **1D3 piques** (AT fixe 5, dmg 3) avant le corps-à-corps |
| Troll | 10 | 4 | 4 | 10 | 2 | 3 | 24±4 | 2 | 1.5 | **Régénération** 3 PV/round, stoppée par feu/acide |
| Loup-Garou | 7 | 8 | 7 | 8 | 6 | 7 | 23±2 | 2 | 1.5 | **Régénération** 2 PV/round ; armure ignorée par l'argent |

### 🔴 Tier 4 — Dangers épiques
| Monstre | FO | AG | DX | EN | IG | MC | PV | Armure | Arme | Capacité |
|---------|----|----|----|----|----|----|----|--------|------|----------|
| Géant | 12 | 5 | 6 | 12 | 6 | 6 | 29±2 | 2 | 2 | **Séisme** : chaque coup encaissé force un jet d'AG « Très dur » pour ne pas tomber |
| Liche | 1 | 4 | 8 | 10 | 12 | 8 | 15±2 | 2 | 0.5 | **Magie** (ignore l'armure) ; draine 1D4 PV max sur critique |
| Tyrannœil | 3 | 4 | 8 | 8 | 12 | 8 | 15±2 | 4 | 1.5 | **Rayon** 1D4/round — 1=Feu (+2 dmg), 2=Lenteur (-2 AT), 3=Saignement (-2 EN), 4=Mort si Écart > 5 |
| Vampire | 10 | 10 | 10 | 12 | 10 | 10 | 30±4 | 3 | 1.2 | **Vol de vie** : se soigne de 50 % des dégâts infligés |

---

## 5. Expérience (XP) & progression

**Tiers de personnage** (calculés sur une caractéristique ou la MC) :
T1 = valeur 1–3 · T2 = 4–6 · T3 = 7–9 · T4 = 10–12.

### Gagner de l'XP — formule du Delta (ΔT)
`ΔT = Tier_challenge_ou_monstre − Tier_personnage`

| ΔT | Type | Gain XP — hors combat | Gain XP — combat |
|----|------|-----------------------|------------------|
| ≤ -2 | Insignifiant | 0 | 0 |
| -1 | Facile / routine | 1 (si réussite) | 1 |
| 0 | Équilibré | XP de base du challenge (**+1 si marge ≥ 3**) | valeur du Tier du monstre (**+1 magistral, +2 critique, +1 parfait\***) |
| ≥ +1 | Dépassement | XP de base du challenge **×2** | valeur du Tier du monstre **+ 2** (bonus de style **doublés**) |

> \* **Combat parfait** = gagner sans perdre un seul PV.
> « Bonus de style doublés » (ΔT ≥ +1) = les bonus magistral/critique/parfait du combat sont multipliés par 2.

### Dépenser son XP (boutique de progression)
Limites strictes : **caractéristiques ≤ 12** ; **MC plafonnée à +5** (nécessite `IN ≥ 6`).

**Coût d'évolution d'une caractéristique** (par palier atteint) :

| Vers niveau | Coût |
|-------------|------|
| 3 ou 4 | 1 XP |
| 5 ou 6 | 3 XP |
| 7 ou 8 | 7 XP |
| 9 ou 10 | 15 XP |
| 11 ou 12 | 30 XP |

**Coût d'évolution de la Maîtrise des Coups (MC)** :

| Bonus | Coût |
|-------|------|
| +1 | 5 XP |
| +2 | 10 XP |
| +3 | 15 XP |
| +4 | 20 XP |
| +5 | 25 XP |

---

*Tous les nombres ci-dessus sont encodés sans ambiguïté dans `brain-sketches/` (registres + fonctions pures). Toute divergence entre ce manuel et le code doit être résolue en faveur de ce manuel, puis le code corrigé.*
