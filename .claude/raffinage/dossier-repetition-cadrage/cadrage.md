# Cadrage n°16 `dossier-repetition` — Arbitrage (tour 3)

Comité à 5 rôles : PM, Tech Lead, UX, QA, Narratif & IA.

## Décision fondatrice

**Fourche A (rôle IA) / B (code déterministe) → RETENU B.** Unanimité. Un joueur synthétique en code pur seedé : `repeter(dossier, graine) → ResultatRepetition`, zéro appel modèle, rapport rejouable à graine égale, jamais stocké (KR-013). La variante (A) est un point d'extension nommé dans le code (fonctions `choisirCommande` / `acteurCooperatif`), pas une abstraction livrée (décision n°3).

## Registre des désaccords

### 1. Nombre d'itérations

| Rôle | Position T1 | Position T2 |
|---|---|---|
| PM | 3 | 2 (veto it4 calibrage) |
| TL | 4 | 3 (cède it4, héros dès it1) |
| UX | 3 | 3 |
| QA | 3 | 4 (veto spec sans iterations) |
| NIA | 3 implicite | 3 implicite |

**→ RETENU : 3 itérations.** Le PM a raison que la règle de contrôle sort de n°16 (veto dans son domaine : touche deux features). Le TL a révisé à 3. Le QA veut que la spec liste les itérations — c'est ce que le cadrage produit. Le PM à 2 perd la tranche « combat » qui fait la valeur propre du roadmap (héros réel = difficulté calculable).

### 2. Combat dès it1 ou en it2

| Rôle | Position |
|---|---|
| PM T1 | aller seul en it1, combat en it2 |
| TL T1 | combat dès it1 (sinon faux blocages) |
| TL T2 | **cède** — aller seul, héros posé, arrêt `combat_ouvert` |
| QA T2 | TL a raison (combat dès it1) |

**→ RETENU : aller seul en it1, combat en it2.** Le TL a trouvé la solution : le héros est posé dès it1 (sans héros, `resoudreRencontre` rend la session inchangée — faux chemin silencieux). L'arrêt `combat_ouvert` est reconnu et **non compté comme blocage** : le rapport dit « le joueur s'est arrêté sur un combat », pas « le dossier est cassé ». La résolution de la boucle de combat (posture, rounds, mort) attend it2.

### 3. « Difficulté non calibrée »

| Rôle | Position |
|---|---|
| PM T2 | **veto** — sort de n°16 (touche dossier-controles) |
| TL T2 | étalon dans la feature (utils/etalon.ts), pas brain/ |
| NIA T1 | REGLES-DU-JEU → table dorée → code (KR-130) |

**→ RETENU : héros étalon dans la feature en it2, règle de contrôle = dette à déclencheur hors n°16.** Le PM veto porte sur « touche dossier-controles » — satisfait. L'étalon vit dans `features/dossier-repetition/utils/etalon.ts`, sa section de `REGLES-DU-JEU.md` est écrite d'abord (KR-130), sa table dorée est dans la feature (pas `brain/rules.golden.test.ts`). La RÈGLE « Difficulté non calibrée » reste une dette à déclencheur « étalon livré » dans `dossier-controles`, sans calendrier.

### 4. Extraction de `avancerPas` commun

| Rôle | Position |
|---|---|
| NIA T1 | extraire la chaîne dans player/engine/ |
| TL T1+T2 | rien à extraire, le pur est déjà factorisé |
| NIA T2 | **retirée** |

**→ REJETÉ.** Le pur est déjà factorisé (executerCommande, ouvrirRencontreSiDue, finAtteinte sont des imports distincts). La divergence se garde par les mêmes imports + mutants rouges (retirer ouvrirRencontreSiDue, inverser rencontre/fin). Un `avancerPas` n'aurait que deux appelants, car le hook ne pourrait pas l'utiliser sans contourner `apresInterpretation`.

### 5. Domicile de l'exécuteur

| Rôle | Position |
|---|---|
| TL | `features/dossier-repetition/utils/repeter.ts` |
| NIA T1 | `player/engine/` |
| PM/UX T1 | `brain/` |
| NIA T2 | **accepte features/** |

**→ RETENU : `features/dossier-repetition/utils/repeter.ts`.** Pas `brain/` (première arête de valeur brain→player). Pas `player/engine/` (gonfle le runtime extractible avec un outil d'auteur, `docs/EXIGENCE-APERCU-DU-JEU.md`).

### 6. Indices

**→ REJETÉ du périmètre.** Unanimité PM+NIA. Sans IA, `consignerReponseActeur` exige un `recit` (texte modèle) et des `indicesReveles` (choisis par R4). Le code seul n'en obtient pas. Le statique (`atteignabilite.ts`) couvre ce terrain.

### 7. `parler` / `agir`

**→ REPORTÉ à it3.** PM les exclut. NIA les veut pour la couverture PNJ. it3 décidera si la couverture PNJ utilise `parler` (avec abandon à 3 jets) ou seulement la co-présence au même lieu.

### 8. Libellé du rapport

**→ RETENU : `NON ATTEINT EN 20 PAS`.** UX T2 tranche avec consensus.

### 9. Carte du plan amendée

**→ RETENU.** La carte promet 4 assistants copilote dont « Répétition à blanc ». La n°16 livre la répétition mais amendée : pas d'indices (domaine statique), pas d'appel modèle.

### 10. Dépendances corrigées

**→ RETENU.** `10 · 7` → `9 · 13 · 14 · 15` (moteur-dossier, moteur-combat, moteur-horloge, moteur-fins). Tous livrés.

### 11. PNJ fermé absorbe 20 pas (NIA)

**→ REPORTÉ à it3.** NIA maintient la borne (3 jets max, abandon). Ne s'applique que si `parler` entre en it3.

### 12. It2 sacrifiable

**→ RETENU.** Repli si it2 sacrifiée : `combat_ouvert` reste un arrêt reconnu. L'auteur le lit comme tel, sans résolution de combat.

## Hors périmètre de la feature entière

- Tout appel modèle (variante A = point d'extension nommé, pas codé)
- Indices (propriété du statique, atteignabilite.ts)
- Jets de savoir / épreuves de révélation
- Objets, inventaire
- Plusieurs graines en parallèle, statistiques agrégées
- Saisie manuelle de graine ou de nombre de pas
- Historique des rapports
- Saut au champ fautif depuis le rapport
- Règle de contrôle « Difficulté non calibrée » (dette dossier-controles)
- Branchement du CTA « Aperçu du jeu »
