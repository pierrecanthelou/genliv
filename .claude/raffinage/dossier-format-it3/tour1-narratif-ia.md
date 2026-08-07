# Tour 1 — Narratif & IA · `dossier-format` it3

**RISQUE** — `PREDICATES` est un **contrat de dette sur la n° 9** : chaque prédicat écrit ici devient une obligation d'évaluateur, et un `expr` dont le prédicat manque est un échec DUR au démarrage de session (déjà acté). Rien en it3 ne refuse un prédicat qu'aucun état de session ne sait répondre — un dossier écrit d'ici la n° 9 serait injouable sans qu'un test rougisse.

**OBJECTION 1** *(règle dupliquée code/prompt, mon domaine)* — `docs/ROADMAP-BASCULE-IA.md` § D1 écrit encore « `…_texte` | pour l'IA | phrase injectée telle quelle ». La **DÉCISION B l'a démentie pour deux familles sur six** ; it3 pose les quatre autres. Non généralisée, la n° 10 lira ce tableau et injectera `reussi_si_texte`, `echoue_si_texte` et les deux `declencheur_texte` neufs : la même règle dans le code ET dans le prompt, et un modèle qui apprend à provoquer l'événement. **Exigence** : les six `…_texte` sont `auteur`, et la ligne du § D1 tombe dans le même lot contrat.

**OBJECTION 2** — `contre_mesures` n'existe nulle part. La créer, c'est créer `action` — de la prose **INJECTÉE** — sur `personnages`, ce que la décision A donne à la n° 4. it3 livre **CINQ familles** ; la sixième arrive en n° 4 par une ligne de la table.

**PROPOSITION** — (a) 13 prédicats (annexe a), chacun portant `lit: CheminDeSession[]`, union fermée tirée du § 2.4 du plan de cible ; précédent `DESTINATION_DES_CHAMPS`, dont le seul lecteur est son test. (b) slots typés `EspaceDeNoms` sans `bestiaire`, ou `'entier'` : « **aucun prédicat ne lance de dé** » devient une propriété du compilateur, pas une docstring (KR-169) — un jet exige `carac` + `tc`, qui ne sont pas des slots. (c) `PROFONDEUR_MAX_EXPR = 8`, constante nommée (KR-165). (d) `lieux[].acces` : aucun des 13 n'en dépend ; l'orientation reste à la n° 5.

**VERDICT** — recevable sous réserve (objection 1 fermée dans le lot contrat).

---

## ANNEXE (a) — Inventaire des prédicats

**Règle d'admission appliquée** : un prédicat n'entre que si (1) un champ de l'état de session du plan de cible § 2.4 ou du runtime existant y répond, et (2) tous ses arguments sont des identifiants stables ou des entiers. **C'est un relevé, pas une conception.**

| id | libellé français | arité | slots | ce qui y répond |
|---|---|---|---|---|
| `possede_objet` | « Le héros possède {objet} » | 1 | `objet` | **existe déjà** : `sessionEngine.ts:23` `filterChoicesByPrereq` → `inventory.includes(objectId)` |
| `indice_connu` | « Le joueur connaît {indice} » | 1 | `indice` | `monde.indices_connus[]` ; sortie R4 `indices_reveles` |
| `jalon_atteint` | « Le jalon {jalon} est atteint » | 1 | `jalon` | `monde.jalons_atteints[]` |
| `lieu_visite` | « Le héros a visité {lieu} » | 1 | `lieu` | `monde.lieux_visites[]` ; runtime `session.visitedNodes` |
| `lieu_courant_est` | « Le héros se trouve à {lieu} » | 1 | `lieu` | `monde.lieu_courant` — le `declencheur.lieu_id` du § 1.4 |
| `pnj_present` | « {pnj} est dans le lieu courant » | 1 | `pnj` | `monde.pnj.<id>.lieu` |
| `pnj_vivant` | « {pnj} est vivant » | 1 | `pnj` | `monde.pnj.<id>.vivant` |
| `pnj_a_revele` | « {pnj} a déjà révélé {indice} » | 2 | `pnj`, `indice` | `monde.pnj.<id>.a_dit[]` |
| `confiance_au_moins` | « La confiance de {pnj} atteint {n} » | 2 | `pnj`, `entier` | `monde.pnj.<id>.confiance: -3..3`, borné par `CONFIANCE_MIN`/`CONFIANCE_MAX` — réutilisés, jamais redéclarés |
| `etape_plan_au_moins` | « {pnj} en est à l'étape {n} de son plan » | 2 | `pnj`, `entier` | `monde.pnj.<id>.etape_plan` ↔ `plan_actions[].etape` |
| `evenement_consomme` | « L'événement {evenement} a déjà eu lieu » | 1 | `evenement` | `monde.evenements_consommes[]` |
| `climat_actif` | « Le climat {climat} est actif » | 1 | `climat` | `horloge.climat_actif` ↔ `monde.conditions.climat[]` |
| `tour_au_moins` | « On est au moins au tour {n} » | 1 | `entier` | `horloge.tour` — le `declencheur.apres` du § 1.4 et le `delai` des contre-mesures |

**Écartés, avec motif — à ne pas rouvrir sans lever le motif :**

| candidat | motif du refus |
|---|---|
| `jet_reussi`, `carac_au_moins` | **VETO.** Un jet n'évalue pas, il ÉMET une demande qui change le tour — motif exact de la sortie de `revele_si` de D1. Un évaluateur qui en contient lance le dé. |
| `quete_achevee`, `quete_etape_au_moins` | `quetes[].etapes` est laissé en `[ … ]` (roadmap § 5) et la session § 2.4 ne porte **aucun** état de quête. |
| `objectif_reussi` | **Circulaire** : un objectif est DÉFINI par `reussi_si_expr`. |
| `etat_heros('blesse'…)` | `heros.etats[]` existe mais son vocabulaire n'est pas un registre fermé ; sans registre l'argument redevient un **nom libre**. |
| `pv_sous_seuil` | Aucun champ du dossier ne le demande aujourd'hui. |
| `atteignable(lieu)` | Calcul de **linter** (n° 7) sur `acces`, pas un prédicat de session. L'admettre forcerait à trancher l'orientation de `acces` maintenant. |

## ANNEXE (b) — Destinations des champs neufs

**Règle de balayage à poser avec ces lignes** : un `…_expr` est déclaré comme **UN champ terminal**, à sa racine ; le walker de `couverture.test.ts` **ne descend pas** dans l'arbre. Précédent en place : `'monde.quetes[].recompense[]'`, `'…consequence[]'`, `'…effets_regles[]'`, `'charpente.jalons[].effet[]'` sont tous déclarés au niveau du tableau. Sans cette règle, le balayage exigerait une ligne par nœud intérieur de chaque instance — des chemins qui varient avec la forme de l'arbre, donc une table jamais exhaustive. C'est ma réponse à la condition d'entrée (c) d'it2.

| clé | destination | motif |
|---|---|---|
| `canon.objectifs[].reussi_si_expr` | **moteur** | seule autorité sur ce qui se déclenche (D1) |
| `canon.objectifs[].reussi_si_texte` | **auteur** | = l'expr en français ; injecté, il apprend au modèle à faire réussir l'objectif |
| `canon.objectifs[].echoue_si_expr` | **moteur** | |
| `canon.objectifs[].echoue_si_texte` | **auteur** | pire encore : conduire à l'échec |
| `monde.evenements[].declencheur_expr` | **moteur** | |
| `monde.evenements[].declencheur_texte` | **auteur** | injecté, le narrateur provoque l'embuscade |
| `monde.personnages[].plan_actions[].declencheur_expr` | **moteur** | l'avancement d'étape est n° 14, du code |
| `monde.personnages[].plan_actions[].declencheur_texte` | **auteur** | à ne pas confondre avec `plan_actions[].action`, qui reste `ia` |
| `charpente.jalons[].declencheur_expr` | **moteur** | jumeau de `declencheur_texte`, déjà `auteur` |
| `charpente.fins[].condition_expr` | **moteur** | jumeau de `condition_texte`, déjà `auteur` |

**Réservé n° 4 `dossier-fiches`** (écrit maintenant pour que personne ne le re-dérive) : `contre_mesures[].action` → **ia** (la seule de la famille, même raison que `plan_actions[].action`) · `declencheur_expr` → moteur · `declencheur_texte` → auteur · `delai` → moteur · `portee` → moteur.

## ANNEXE (c) — Contrat de sortie IA concerné

**it3 ne produit aucun appel modèle** — réponse honnête, à écrire dans la revue plutôt qu'à déduire. Ce qu'it3 déplace est le côté **entrée** : il ajoute des champs à l'ensemble **jamais injecté** et **zéro** à l'ensemble injecté. Aucun bloc de contexte ne grossit ; le canon reste le seul bloc toujours chargé, sous `BUDGET_MOTS_CANON = 600`.

Seul contrat aval contraint, par `confiance_au_moins` : sortie R4 `{ replique, indices_reveles, delta_confiance }` ; `indices_reveles` n'accepte que des identifiants `indice.*` résolus contre `collectIds(dossier)`, jamais un nom libre ; `delta_confiance` tel que `confiance + delta ∈ [CONFIANCE_MIN, CONFIANCE_MAX]`. Une sortie hors bornes est **REJETÉE, jamais clampée**. Corollaire renforcé par it3 : `delta_confiance` cesse d'être décoratif dès qu'un `declencheur_expr` contient `confiance_au_moins` — une sortie clampée déclencherait un jalon que l'auteur n'a pas écrit, et la partie cesserait d'être rejouable par graine.
