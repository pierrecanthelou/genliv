# Plan d'itération — `moteur-interprete` · itération 4

> Statut : `validé` (2026-09-30)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-30
> Composition : `5 rôles` — motif : l'itération touche le moteur (cadrage de contexte de R3) et le budget de contexte IA (KR-261) — cœur du domaine narratif-ia.
> Exécution : `séquentielle` (1 lot)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur voit la narration se raccourcir — jamais un refus complet — plutôt que d'attendre indéfiniment, une fois le budget de contexte par pas dépassé. » |
| **Tranche** | Entièrement `brain/` : `assemblerNarrateur` (`contexte/narrateur.ts`) descend une cascade de paliers avant de refuser. **Aucun fichier d'écran, aucun fichier `play-mode/` touché** (confirmé indépendamment par le tech-lead, l'UX et le PM). |
| **Lots** | 1 lot · `contrat`, seul |
| **Hors périmètre** | Affichage du plafond « mode auteur » (aucune surface d'écran) · budget client de R1/`interprete.ts` (dette réassignée, pas fermée cette itération) · fusion KR-261 en une formule partagée R1/R3 (sans objet, R1 n'entre pas) · scission de `controles.ts` |
| **Point d'arbitrage central** | Tour 1 : le tech-lead propose de borner `EN SA POSSESSION` (inventaire injecté au modèle) par troncature ; narratif-ia pose un veto absolu (l'état n'est jamais un levier de budget). Tour 2 : le tech-lead retire sa proposition ; **narratif-ia se retourne lui-même** et propose un palier dégénéré P4 (suffixe ajusté au budget, jamais vide, objet du pas courant toujours inclus) ; le PM durcit alors SON objection en veto absolu, sans avoir vu P4 (tours parallèles). **Arbitré RETENU pour P4** — voir § 8 désaccord #3, motif détaillé. |
| **Reporté** | Affichage « mode auteur » → `open_questions` (2 lignes distinctes) · budget de R1 → `open_questions`, propriétaire la prochaine itération qui touche R1 |

---

## 1 — But raffiné

À la fin de cette itération, l'assembleur du contexte du narrateur (R3) ne refuse plus sèchement `'trop-long'` dès que `BUDGET_CARACTERES_NARRATEUR` est dépassé : il descend une cascade de quatre paliers de dégradation SILENCIEUSE (P1 → P4), chacun retenant le premier qui tient, recalculée à chaque appel sans rien stocker (KR-013). Seule la mémoire NARRATIVE (résumé glissant, fenêtre récente, tranche à condenser) et, en tout dernier recours, l'inventaire injecté sont réduits — jamais l'état que le moteur tient pour vrai autrement que par un suffixe garanti non trompeur. Au-delà du dernier palier, le refus `trop-long` reste inchangé (rejeu-un-coup puis message fixe existant).

## 2 — Hors périmètre

- **Affichage du plafond « mode auteur »** (cité par le plan de cible §2.8 n°4) — aucune surface d'écran choisie, `design_contract` de la spec tranche déjà pour une dégradation SILENCIEUSE. Reporté à `open_questions`, propriétaire à assigner, déclencheur = prochain lot qui rouvre `dossier-controles`.
- **Budget client de R1 (`interprete.ts`)** — reste sans garde. La dette nommée dans `worker/index.ts:779` (« Fermeture nommée : la constante unique de KR-261, it4 ») promettait sa fermeture ici ; le comité (tech-lead, tour 2) la réassigne explicitement à une itération future qui touche réellement R1. Le commentaire est corrigé dans le lot (documentaire, aucun changement de comportement).
- **Fusion de KR-261 en une formule partagée entre R1 et R3** — sans objet cette itération puisque R1 n'entre dans aucune garde de budget ; à rouvrir le jour où une itération donne un budget à R1 (KR-235 : jamais une valeur brute partagée, toujours une formule dérivée par rôle).
- **Scission de `controles.ts`**, toute UI nouvelle, tout composant `play-mode/` — non touchés.
- **KR-274 « message fixe » proposé par la QA (tour 1)** — n'entre PAS au registre comme nouveau KR : le comportement (refus `trop-long` → même message fixe existant, rejeu-un-coup) est déjà couvert par KR-230/`design_contract` et devient un critère d'acceptation testé (§6 #2), pas un principe nouveau.

*(Écrit par le PM, arbitré par l'orchestrateur au tour 3 — voir § 8.)*

## 3 — Contrat de design

**Aucun.** Confirmé indépendamment par l'UX, le PM et le Tech Lead : cette itération est entièrement `brain/`, invisible pour le joueur. Le message fixe déjà existant (`Le récit n'a pas pu être généré.`) reste inchangé et devrait même apparaître MOINS souvent (la cascade évite le refus plutôt que de le précipiter). Aucun composant, aucun token, aucun texte d'interface neuf.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `brain/copilote/contexte/narrateur.ts` → `assemblerNarrateur` | service | émet (comportement interne étendu, signature INCHANGÉE) | `assemblerNarrateur(dossier: Dossier, cible: CibleNarrateur): ContexteNarrateur` — `ContexteNarrateur` reste `{ok:true, texte, ancres, condensation} \| {ok:false, motif}` ; `ok:false` avec `motif:'trop-long'` ne devient atteignable QUE si même le palier P4 minimal ne tient pas |
| `brain/copilote/contexte/narrateur.ts` (interne) | registre | émet (paliers, non exportés) | fonctions internes de calcul de palier, jamais exposées hors du module — aucun nouveau champ sur `EtatSession`, aucun champ `palier` sur `ContexteNarrateur` (KR-013, KR-268) |
| `CopiloteService.demander('narrateur', …)` | service | consomme (inchangé) | Le service ne voit aucune différence : il reçoit toujours `{ok:true,texte,…} \| {ok:false,motif}` de l'assembleur, jamais informé du palier retenu |
| `worker/index.ts` (commentaire `TAILLE_MAX_CORPS_IA`) | registre | émet (correction documentaire) | Aucun changement de VALEUR (le pire cas P0 reste le pire cas mesuré) ; correction du commentaire ligne ~779 qui promettait à tort la fermeture du budget R1 |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | **INCHANGÉ dans sa composition** — mêmes onze blocs, même ordre (§ narrateur.ts). Ce qui change : la TAILLE de trois blocs mémoire (`RECEMMENT`, `A CONDENSER`, `AUPARAVANT`) selon le palier retenu, et, en tout dernier recours (P4), la taille d'`EN SA POSSESSION`. `ICI`, `CE PAS`, `DEJA ACCOMPLI`, `saisie`, le canon et `ETABLI` restent identiques à tous les paliers. |
| Schéma de sortie | **INCHANGÉ.** `{narration, tentatives, constats, condense?}` (réseau) / `SortieNarrateur{recit, suggestions, faits_etablis, resume?}` (résolu) — zéro modification. `condense` n'est toléré que si `condenseDemande = (condensation !== null)`, où `condensation` reflète maintenant ce qui a RÉELLEMENT été envoyé (peut être `null` en P2+ même si `pasACondenser` serait non-null en P0). |
| Échec de validation | Inchangé : rejeu-un-coup sur le MÊME contexte dégradé (calculé une fois avant la boucle), puis message fixe `Le récit n'a pas pu être généré.`. `trop-long` reste un refus AVANT tout `fetch`, jamais une troncature du texte assemblé. |
| Ce que l'IA **ne** fait **pas** | Ne sait jamais qu'une dégradation a eu lieu (KR-273 : aucun mot de mécanique dans l'invite, aucun indicateur de palier envoyé) ; ne reçoit jamais un état partiellement dégradé présenté comme complet sans garantie (I9 : jamais un bloc `EN SA POSSESSION` vide si l'inventaire ne l'est pas). |

## 5 — Lots

### Lot 1 — `narrateur-budget-contrat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier — et unique lot de l'itération)
- **But** : remplacer le refus sec `'trop-long'` de `assemblerNarrateur` par une cascade de quatre paliers de dégradation, sans jamais toucher l'état hors dernier recours, et corriger le commentaire de dette de `worker/index.ts`.
- **Fichiers** :
  - `src/brain/copilote/contexte/narrateur.ts` (R) — cascade P1→P2→P3→P4, calcul en ligne, zéro stockage ; mise à jour du commentaire « risque porté à l'it4 » (lignes 177-180, maintenant résolu) ; docstring de tête de fichier amendée
  - `src/brain/copilote/contexte.test.ts` (R) — tests des invariants I1 à I12 (§7), mutants nommés
  - `worker/index.ts` (R, documentaire) — correction du commentaire ligne ~779 (« Fermeture nommée : la constante unique de KR-261, it4 » → réassignée, budget R1 non fermé cette itération) ; **aucun changement de `TAILLE_MAX_CORPS_IA`** (le pire cas P0 reste le pire cas mesuré, à vérifier par le lot avant de conclure qu'aucune remesure n'est nécessaire)
- **Expose** :
  ```ts
  // src/brain/copilote/contexte/narrateur.ts — signature INCHANGÉE
  function assemblerNarrateur(dossier: Dossier, cible: CibleNarrateur): ContexteNarrateur
  // ContexteNarrateur : { ok: true; texte: string; ancres: ReadonlyMap<RangInjecte,string>; condensation: {de,a} | null }
  //                    | { ok: false; motif: MotifRefusContexte }
  // Paliers internes (non exportés, noms indicatifs pour le lot) :
  //   P0 : contexte plein (comportement it3, inchangé si sous budget)
  //   P1 : RECEMMENT réduit à FENETRE_MIN-1 (4) lignes les plus récentes
  //   P2 : P1 + A CONDENSER retiré entièrement, condensation forcée à null
  //   P3 : P2 + AUPARAVANT retiré
  //   P4 : P3 + EN SA POSSESSION réduit au plus long suffixe qui tient dans le budget,
  //        JAMAIS vide si objets_possedes non vide, contient TOUJOURS l'objet obtenu ce pas
  //   au-delà de P4 (même le suffixe minimal ne tient pas) : { ok: false, motif: 'trop-long' }
  ```
- **Critères couverts** : #1 à #8 (tous — lot unique)

*(1 lot, exécution séquentielle : aucun lot feature, aucune signature de service changée, aucun fichier d'écran touché.)*

## 6 — Critères d'acceptation

1. **Étant donné** un pas narré où le texte assemblé par `assemblerNarrateur` dépasse `BUDGET_CARACTERES_NARRATEUR`, **quand** le contexte est recalculé, **alors** il descend au premier palier qui tient parmi P1 (RECEMMENT réduit à `FENETRE_MIN-1` pas les plus récents) → P2 (P1 + `A CONDENSER` retiré, `condensation:null`) → P3 (P2 + `AUPARAVANT` retiré) → P4 (P3 + `EN SA POSSESSION` réduit au plus long suffixe qui tient) — jamais un refus tant qu'un palier tient (I3, I4, I8). — *niveau : contrat* — *lot 1*
2. **Étant donné** tous les paliers épuisés (même le suffixe minimal de P4 ne tient pas), **quand** le contexte est assemblé, **alors** le refus `trop-long` est rendu AVANT tout fetch, avec le comportement de dégradation déjà existant (rejeu-un-coup, puis message fixe `Le récit n'a pas pu être généré.`) — jamais un texte neutre présenté comme de la fiction (§2.8 garde-fou 1, I9). — *niveau : contrat* — *lot 1*
3. **Étant donné** un palier P2 ou plus sévère, **quand** `condensation` est calculé, **alors** il reflète EXACTEMENT ce qui est réellement envoyé au modèle (`null` si `A CONDENSER` a été retiré par la cascade, même si `pasACondenser(session)` serait normalement non-null) — jamais un `condense` accepté sur la base d'une tranche que le modèle n'a pas reçue (I1, I2). — *niveau : unitaire* — *lot 1*
4. **Étant donné** n'importe quel palier P0 à P3, **quand** le contexte est assemblé, **alors** le suffixe d'état (`ICI A1`, `CE PAS`, `EN SA POSSESSION`, `DEJA ACCOMPLI`, `saisie`) et la table `ancres` restent identiques octet pour octet à ceux de P0 (I5). — *niveau : unitaire* — *lot 1*
5. **Étant donné** le palier P4, **quand** `EN SA POSSESSION` est réduit, **alors** le suffixe gardé contient TOUJOURS l'objet obtenu au pas courant (même rang dans `CE PAS` et `EN SA POSSESSION`, I10) et n'est JAMAIS vide si le joueur possède au moins un objet (I9) — sinon `trop-long` plutôt qu'un bloc absent qui laisserait croire à une absence totale. — *niveau : unitaire* — *lot 1*
6. **Étant donné** n'importe quel palier, **quand** le contexte est assemblé, **alors** AUCUN champ n'est écrit dans `EtatSession` et aucun indicateur de palier n'est ajouté à la sortie de l'assembleur — la cascade est recalculée à chaque appel depuis l'état courant (KR-013, I7, I12). — *niveau : unitaire* — *lot 1*
7. **Étant donné** le rôle `interprete` (R1), **quand** cette itération est livrée, **alors** AUCUNE garde de budget n'y est ajoutée — la dette nommée (`worker/index.ts:779`) reste ouverte, son commentaire corrigé pour ne plus promettre sa fermeture par it4. — *niveau : balayage de code* — *lot 1*
8. **Étant donné** `ETABLI` (faits établis) et `suggestions[]` (sortie de R3), **quand** une dégradation a lieu, **alors** ni l'un ni l'autre n'est un levier de la cascade — `ETABLI` reste toujours `faitsPertinents(session)` complet à tous les paliers, `suggestions[]` n'est modifié ni côté invite ni côté schéma de sortie (KR-268). — *niveau : unitaire* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `contexte.test.ts` → I1 | `condensation` rendu = tranche réellement envoyée ; mutant : rendre `pasACondenser(session)` en P2 → rouge (un `condense` sans sa tranche serait accepté) | unitaire | AC#3, KR-271 | 1 |
| `contexte.test.ts` → I2 | Scénario séparateur pas 25 (résumé jusqu'au pas 10, tranche 11-20 due, débordement 1-1213) : `A CONDENSER` présent ⇒ `AUPARAVANT` présent ; mutant « P3 avant P2 » → rouge | unitaire | AC#3 | 1 |
| `contexte.test.ts` → I3 | Scénario séparateur pas 34 (débordement ≤7209) : P1 passe avant P2 ; mutant « P2 d'abord » (rend `condensation:null` trop tôt) → rouge | unitaire | AC#1, KR-275 | 1 |
| `contexte.test.ts` → I4 | `RECEMMENT` garde au moins `min(taille naturelle, FENETRE_MIN-1)` lignes LES PLUS RÉCENTES ; mutant : garder les plus anciennes → rouge | unitaire | AC#1, KR-275 | 1 |
| `contexte.test.ts` → I5 | Le suffixe d'état (`ICI A1` → fin) et `ancres` identiques octet pour octet de P0 à P3 ; mutant : plafond appliqué dès P0 → rouge sur un scénario où P3 tient avec l'inventaire entier | unitaire | AC#4 | 1 |
| `contexte.test.ts` → I6 | Canari ±1 caractère par palier (P0/P1, P1/P2, P2/P3), saisie comme levier (précédent it2) | unitaire | AC#1 | 1 |
| `contexte.test.ts` → I7 | Session identique avant/après assemblage, aucun champ `palier` sur le retour | unitaire | AC#6, KR-013, KR-268 | 1 |
| `contexte.test.ts` → I8 | P4 garde les objets les plus récents ; mutant `slice(0,n)` (garde les plus anciens) → rouge (l'objet du pas courant, en fin de liste, disparaîtrait) | unitaire | AC#5 | 1 |
| `contexte.test.ts` → I9 | Jamais de bloc `EN SA POSSESSION` absent quand `objets_possedes` non vide → `trop-long` à la place ; mutant : accepter un suffixe vide → rouge | unitaire | AC#2, AC#5, KR-274 | 1 |
| `contexte.test.ts` → I10 | À P4, l'objet obtenu au pas courant garde le MÊME rang dans `CE PAS` et `EN SA POSSESSION` — extension du test existant `contexte.test.ts:3301` | unitaire | AC#5 | 1 |
| `contexte.test.ts` → I11 | Canari ±1 caractère aux frontières P3/P4 et P4/`trop-long` | unitaire | AC#1, AC#2 | 1 |
| `contexte.test.ts` → I12 | La session est identique avant/après assemblage (extension d'I7 à P4) | unitaire | AC#6, KR-013 | 1 |
| `contexte.test.ts` → suggestions/ETABLI inchangés | `faitsPertinents` complet à tous les paliers ; aucune mutation de `GABARIT_SORTIE`/invite worker liée aux suggestions | unitaire | AC#8, KR-268 | 1 |
| balayage manuel `worker/index.ts:779` | Le commentaire ne promet plus la fermeture du budget R1 par it4 | documentaire | AC#7 | 1 |

Cas limites couverts : budget tenu sans dégradation (P0) · dégradation qui s'arrête à P1/P2/P3 sans atteindre P4 · P4 avec un seul objet possédé (le pas courant) · P4 avec zéro objet possédé (bloc absent légitime, pas de `trop-long` forcé) · tous paliers épuisés → `trop-long` · pas joué en console pendant une dégradation en cours.

**Non vérifiable en l'état** — le risque résiduel narratif-ia (l'invite présente `EN SA POSSESSION` comme exhaustif ; à P4 le modèle pourrait écrire une phrase d'absence sur un objet non montré) n'est pas observable par jest : aujourd'hui aucune commande ne cible un objet (`aller`/`agir` seuls), donc aucun chemin de résolution du moteur ne peut contredire la narration. Noté en `open_questions`, déclencheur nommé : la première commande qui prend un objet en cible.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM / UX | Affichage du plafond « mode auteur » (cité par le plan de cible §2.8) | `REPORTÉ` | Hors périmètre it4 (aucune surface choisie, `design_contract` déjà silencieux) — deux lignes distinctes en `open_questions` (traçabilité de l'écart PM/UX + risque résiduel narratif-ia), mêmes propriétaire, déclencheurs différents (UX, tour 2). |
| 2 | PM / QA / Narratif-IA (tour 1-2) | Sens de « suggestions retirées d'abord » (AC original de la spec) | `REJETÉ, remplacé` | L'AC original mélangeait sortie (`suggestions[]`, produit par R3) et entrée (contexte mesuré). Narratif-ia (tour 1, objection 1, maintenue tour 2) : `tentatives` fait partie du bloc atomique KR-230, en dégrader la demande ferait refuser le récit entier — l'inverse de l'objectif. AC réécrit intégralement en cascade P1→P4 (§6), aucune mention de « suggestions » comme levier. |
| **3** | **Tech Lead → Narratif-IA → PM (arbitrage central)** | **Troncature de `EN SA POSSESSION`** | **`RETENU : palier P4 de narratif-ia`** | **Historique du désaccord** : tour 1, le tech-lead propose `objets_possedes.slice(-K)` (K non mesuré) ; narratif-ia pose veto absolu (« Dégrader l'état → JAMAIS », I5 : suffixe d'état figé). Tour 2 : le tech-lead RETIRE sa proposition et se range au veto, sans réserve. Narratif-ia, dans la MÊME note de tour 2 (parallèle, personne ne l'a vu venir), SE RETOURNE LUI-MÊME : concède que le refus permanent en fin de partie riche en objets est pire que l'omission, et propose un palier P4 dégénéré — suffixe ajusté AU BUDGET (pas de K arbitraire), JAMAIS vide, objet du pas courant TOUJOURS inclus (I8-I10), ne joue qu'après P1-P3 épuisés. Le PM, sans avoir vu ce P4 (tours parallèles), DURCIT alors son objection en veto absolu contre « aucune troncature, jamais ». **Arbitrage orchestrateur (tour 3)** : RETENU pour P4. Motif : le veto du PM (et le veto initial de narratif-ia) visait un risque précis — le narrateur affirmant FAUSSEMENT l'absence d'un objet que le moteur dit possédé. P4 ferme structurellement ce risque : (a) I9 garantit qu'aucun bloc vide n'est jamais envoyé quand le joueur possède quelque chose (jamais de « mains vides » mensonger), et (b) la contrainte d'ancrage existante (`schemaSortie.ts:1305`, un constat citant un rang non fourni est refusé) empêche structurellement le modèle de nommer spécifiquement un objet qu'il n'a pas vu. L'omission résultante n'est pas une nouvelle classe de risque : le code omet DÉJÀ silencieusement un objet sans `description_joueur` (précédent direct, `proseDObjet`/`pousser`, jamais objecté). Le risque résiduel réel (le modèle pourrait lire le sous-ensemble montré comme exhaustif si une commande future cible un objet précisément) est nommé, dormant aujourd'hui (aucune commande ne cible un objet), et devient un déclencheur explicite en `open_questions`. |
| 4 | Tech Lead (tour 1-2) | Fusion KR-261 en une formule partagée R1/R3 | `REPORTÉ` | Le plan P1-P4 (narratif-ia) ne touche pas R1 — R1 n'entre dans aucune garde de budget cette itération (aucun consommateur réel, KR-266/268 étendu). Reporté à la prochaine itération qui donne effectivement un budget à R1 ; le principe « formule, jamais une valeur brute partagée » (KR-235) reste acquis pour cette itération future. |
| 5 | Narratif-IA (tour 2) | Emplacement de la logique de palier (`narrateur.ts` vs `memoire.ts`) | `RETENU : narrateur.ts` | `memoire.ts` reste un module de PROJECTION pure (contrat gelé it3) ; y ajouter un budget en caractères d'un rôle particulier ferait dériver silencieusement `ETABLI`/`faitsPertinents`, que rien ne doit toucher. Aucune objection contraire au tour 2 (le tech-lead avait laissé la question « conditionnelle », narratif-ia tranche). |
| 6 | QA (tour 1) | Nommer un KR-274 « message fixe au-delà du dernier palier » | `REJETÉ` | Comportement déjà couvert par KR-230/`design_contract` existant (rejeu-un-coup puis message fixe) — devient un critère d'acceptation testé (§6 #2), pas un principe nouveau à numéroter. |
| 7 | — | Deux nouveaux KR à créer cette itération | `RETENU` | **KR-274** — extension de KR-013 à l'assemblage de contexte : l'état que le moteur tient pour vrai n'est jamais un levier de dégradation budgétaire brut ; toute réduction de ce que le narrateur en voit doit garantir l'absence de négation fausse (jamais un bloc vide qui suggère « rien », toujours l'élément le plus pertinent au pas courant conservé). **KR-275** — une dégradation de budget de contexte se fait en PALIERS CALCULÉS EN LIGNE à chaque appel (jamais stockés, KR-013), chacun retenu comme le premier qui tient ; le refus reste le dernier recours, jamais le premier réflexe. |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(supprimé — aucune proposition marquée `INNOVATION` par son auteur ; le palier P4 de narratif-ia est une extension mesurée de KR-013, pas une proposition hors-cadre.)*

## 10 — Définition de fini

- [x] Porte qualité verte : `npm run format` → `npx tsc --noEmit` → `npm run lint` → `npm test`
- [x] `npm run test:mutation` — NON DÉCLENCHÉ, confirmé : aucun des 4 fichiers de règles de jeu n'est touché
- [x] Tests du § 7 écrits et passants, invariants I1-I12 vérifiés ROUGES puis restaurés (14 mutants M1-M13)
- [x] Critères du § 6 cochés un par un (8/8)
- [x] Aucune régression sur les tests existants (`moteur-dossier`, `dossier-copilote`, it1/it2/it3 de `moteur-interprete`)
- [x] Aucun fichier touché hors de la liste du lot (vérifié par l'orchestrateur, `git status`)
- [x] `TAILLE_MAX_CORPS_IA` vérifié INCHANGÉ (83 968 o) par le lot ET par l'orchestrateur
- [x] `worker/index.ts:779` corrigé (budget R1 réassigné, pas fermé) ; `worker/frontiere.test.ts` corrigé hors lot par l'orchestrateur (même commentaire périmé)
- [x] `code-knowledge.json` mis à jour avec KR-274, KR-275 ; compacté (20 KR de dossier-format) pour rester sous son plafond
- [x] `open_questions` de la spec mises à jour : affichage « mode auteur » (2 lignes distinctes, UX), budget de R1 (reporté), risque résiduel P1-P3 et P4 (narratif-ia)
- [x] `plan.acceptance_criteria` de la spec (item « budget par pas dépassé ») réécrit pour refléter la cascade P1-P4, plus AUCUNE mention de « suggestions retirées »
- [x] Dossier de revue écrit : `.claude/raffinage/moteur-interprete-it4.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable, réserve levée en clôture | Veto sur la troncature d'inventaire ARBITRÉ par l'orchestrateur (§8 désaccord #3) — le code livré vérifié conforme au motif déclaré du veto (I9 + règle de l'invite narrateur ferment le risque de négation fausse ; la contrainte d'ancrage ne lie que les constats), voir `.revue.md` |
| Tech Lead | recevable sans réserve | Proposition de troncature retirée au tour 2, alignée sur P4 de narratif-ia |
| UX | recevable sans réserve | Aucun contrat de design requis, deux lignes `open_questions` distinctes actées |
| QA | recevable sans réserve (retiré « REFUS SANS RÉVISION » du tour 1) | Cascade explicite en paliers nombrés, invariants testables I1-I12 |
| Narratif & IA | recevable sous réserve | Palier P4 proposé et retenu par l'orchestrateur ; risque résiduel nommé (commande future ciblant un objet) |
