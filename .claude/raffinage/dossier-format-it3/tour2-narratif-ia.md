# Tour 2 — Narratif & IA · `dossier-format` it3

**RÉPONSE NOMMÉE — Tech Lead, « `…_expr` sans `…_texte` = bloquant, c'est la moitié manquante de l'alerte D1 ».** Le motif est **faux** : « une règle que le moteur applique et dont l'IA n'a aucune phrase ». Les six `…_texte` sont `auteur`, **jamais injectés** (décision B ; `destinations.ts:145` et `:150`). L'IA n'a la phrase dans **aucun** cas, appariée ou non. Ce qui reste est un trou de documentation d'auteur, lisible par le linter n° 7 — **non bloquant, et hors it3**. Économie : un code d'anomalie, un test, une contrainte de fixture.

**RÉPONSE NOMMÉE — UX, `PREDICATES[jet_reussi]`, arité 0.** **VETO, durci.** Un prédicat sans argument disant « un jet a réussi » ne nomme pas *quel* jet : l'évaluateur le lance, ou lit un dé sans provenance. C'est le motif exact qui a sorti `savoirs[].revele_si` de D1 (roadmap l. 46). Un `…_expr` ne contient jamais `carac` ni `tc`.

**MES OBJECTIONS DU TOUR 1**
- **Obj. 1** (§ D1 « `…_texte` | l'IA | injectée telle quelle ») — **DURCIE EN VETO**, conditionnel et bon marché : it3 crée **quatre `…_texte` neufs** sous un document contraignant qui ordonne de les injecter. Deux lignes de `.md` dans le lot le ferment.
- **Obj. 2** (`contre_mesures`) — **MAINTENUE**, avec correction de fait : ce n'est pas une racine, elle vit **sous `personnages[]`** (plan de cible l. 213, l. 570). Donc **n° 4**, pas n° 6.
- **Prop. (a) `lit: CheminDeSession[]`** — **RETIRÉE**. Table sans lecteur ; j'ai retiré `BUDGET_CONTEXTE` pour ce motif en it2. La preuve part en JSDoc, une phrase par entrée. **Zéro `INNOVATION` de mon siège.**
- **Prop. (b) slots hétérogènes** — **RETIRÉE** : je retire les trois prédicats à seuil, les slots redeviennent homogènes. J'échange contre un invariant plus fort — **toute feuille de toute condition est un identifiant stable**.
- **Prop. (c) borne** et **(d) `acces`** — maintenues.

**CONFLITS**

| # | Tranche |
|---|---|
| C1 | **5 familles / 6 couples.** 6ᵉ en **n° 4**. À l'UX : `contre_mesures` n'a besoin d'aucun espace de noms — le OÙ est le **Personnage**, comme `savoirs[]`. KR-164 est honorable sans rien créer. |
| C2 | **`…_expr` / `…_texte` partout**, D1 tenue. Le jumeau prose est un **confinement** : sans lui, l'intention d'auteur atterrit dans `resolutions[].resultat`, qui est `ia`. |
| C3 | **`cibles: string[]`** — français (UX), homogène (tech-lead). `enfants` pour `et`/`ou`. |
| C4 | **7**, plafond du tech-lead. Ses `quete_achevee` (aucun état de session) et `objectif_atteint` (circulaire) **sortent**. |
| C5 | **Dérivée** de `refKinds.length`. Mon argument tombe avec les entiers. |
| C6 | Retirée. |
| C7 | Pas mon domaine. |
| C8 | Retirée pour motif faux → `open_questions` n° 7. |
| C9 | Walker **opaque sur `…_expr`**, arrêt piloté par `FAMILLES_DE_CONDITIONS`. **Contrepartie exigée** : `validateExpr` refuse **toute clé inconnue** sur un nœud — sinon l'opacité devient une **cachette**. |
| C10 | Décision du tech-lead **enregistrée** (arête orientée) ; **champ en n° 5**. Aucun des 7 prédicats n'en dépend. |
| C11 | **VETO** ci-dessus. |
| C12 | it4, accepté — mais un `et`/`ou` dont un enfant n'est pas un objet est **refusé dès it3**. |
| C13 · C14 | Acceptés. |

**VERDICT — RECEVABLE SOUS RÉSERVE** (veto C11 fermé dans le lot).

---

## ANNEXE — inventaire définitif de `PREDICATES` (7)

**Règle d'admission, resserrée par l'asymétrie de coût** : ajouter un prédicat plus tard est **additif** (une ligne + une instance de fixture + une branche d'évaluateur en n° 9) ; en retirer un est **cassant** (un dossier écrit le référence). Donc : peu, et seulement ceux dont un champ nommé de l'état de session § 2.4 est la réponse.

**Forme** : arité **dérivée** de `refKinds.length`, jamais stockée. Tout slot est un espace ayant une ligne dans `COLLECTIONS_IDENTIFIEES` ; `bestiaire` en est exclu **par construction**, donc **aucun prédicat ne peut pointer un monstre**, donc aucun ne peut ouvrir un combat.

| id | label | refKinds | preuve : ce qui y répond |
|---|---|---|---|
| `possede_objet` | « possède l'objet » | `['objet']` | § 2.4 `heros.inventaire[].objet_id` — **déjà implémenté** : `sessionEngine.filterChoicesByPrereq` → `inventory.includes(objectId)` |
| `indice_connu` | « connaît l'indice » | `['indice']` | § 2.4 `monde.indices_connus[].indice_id` ; seul alimentateur = la sortie R4 `indices_reveles` |
| `jalon_atteint` | « le jalon est atteint » | `['jalon']` | § 2.4 `monde.jalons_atteints[]` |
| `lieu_visite` | « le lieu a été visité » | `['lieu']` | § 2.4 `monde.lieux_visites[]` |
| `lieu_courant_est` | « se trouve dans le lieu » | `['lieu']` | § 2.4 `monde.lieu_courant` — formalisation du `evenements[].declencheur.lieu_id` du § 2.2 ; **sans lui la famille `evenements` n'a aucune instance plausible** |
| `evenement_consomme` | « l'événement a déjà eu lieu » | `['evenement']` | § 2.4 `monde.evenements_consommes[]` |
| `pnj_a_revele` | « le personnage a déjà révélé l'indice » | `['pnj','indice']` | § 2.4 `monde.pnj.<id>.a_dit[]` |

**Le seul prédicat d'arité 2 est délibéré** : il est ce qui prouve que le descripteur pilote une validation **positionnelle** (`refKinds[0]='pnj'`, `refKinds[1]='indice'`) plutôt qu'un contrôle à espace unique. Sans lui, la dérivation `refKinds.length` et le `TargetPicker` par position restent des théories. Narrativement, c'est le garde anti-répétition.

**Écartés — motif à lever avant réouverture**

| candidat | motif |
|---|---|
| `jet_reussi`, `carac_au_moins` | **VETO.** Un jet n'évalue pas, il ÉMET une demande qui change le tour. Un évaluateur qui en contient lance le dé. |
| `quete_achevee`, `quete_etape_au_moins` | `quetes[].etapes` non spécifié et § 2.4 ne porte **aucun** état de quête. *(Contre la proposition du tech-lead.)* |
| `objectif_atteint` | **Circulaire** : un objectif EST défini par `reussi_si_expr`. *(Contre la proposition du tech-lead.)* |
| `confiance_au_moins` | **Reporté n° 12**, pas refusé. `types.ts:68` écrit que la mécanique de l'échelle reste à définir ; l'admettre rendrait un jalon dépendant de `delta_confiance`, une sortie de modèle, avant que la règle de bornage soit écrite. |
| `tour_au_moins`, `etape_plan_au_moins` | Slots entiers — retirés. Leur retour rouvre `refKinds: readonly (EspaceDeNoms \| 'entier')[]`, **additif**. |
| `pnj_vivant`, `pnj_present`, `climat_actif` | Répondus par § 2.4, mais aucune famille d'it3 n'en a besoin pour son instance de fixture, et le plafond est à 7. Ordre de reprise : `pnj_vivant` d'abord. |
| `etat_heros(…)` | `heros.etats[]` n'est pas un registre fermé ; l'argument redeviendrait un **nom libre**. |
| `atteignable(lieu)` | Calcul de **linter** (n° 7) sur `acces`, pas un prédicat de session. |

**Ce que la liste garantit, et qu'aucune docstring n'aurait garanti** : un `…_expr` ne peut mentionner ni PV, ni XP, ni inventaire en écriture, ni caractéristique, ni seuil de difficulté, ni graine — non par convention, mais parce que **les slots ne savent pas les nommer**. C'est la frontière code/IA rendue mécanique (KR-169).

## ANNEXE — destinations définitives (arbitrage C2)

Convention tenue : `<famille>_expr` + `<famille>_texte`, sans exception. **Net injecté ajouté par it3 : zéro.**

| clé | N/R | destination | motif |
|---|---|---|---|
| `canon.objectifs[].reussi_si_texte` | N | **auteur** | = l'expr en français ; injecté, il apprend au modèle à faire réussir l'objectif |
| `canon.objectifs[].reussi_si_expr` | N | **moteur** | seule autorité sur ce qui se déclenche (D1) |
| `canon.objectifs[].echoue_si_texte` | N | **auteur** | pire : conduire à l'échec |
| `canon.objectifs[].echoue_si_expr` | N | **moteur** | |
| `charpente.fins[].condition_texte` | existe | **auteur** | déjà classé, inchangé |
| `charpente.fins[].condition_expr` | N | **moteur** | |
| `charpente.jalons[].declencheur_texte` | existe | **auteur** | déjà classé, inchangé |
| `charpente.jalons[].declencheur_expr` | N | **moteur** | |
| `monde.evenements[].declencheur_texte` | N | **auteur** | injecté, le narrateur **provoque** l'embuscade |
| `monde.evenements[].declencheur_expr` | N | **moteur** | |
| `monde.personnages[].plan_actions[].declencheur_texte` | N | **auteur** | à ne pas confondre avec `plan_actions[].action`, qui reste `ia` |
| `monde.personnages[].plan_actions[].declencheur_expr` | N | **moteur** | l'avancement d'étape est n° 14, du code |

**Dix lignes neuves, toutes `moteur` ou `auteur`, aucune `ia`.** Assertion à ajouter à `couverture.test.ts` : *tout chemin normalisé finissant par `_expr` a une destination, et elle vaut `moteur`* — échoue par nom de champ.

**Règle de balayage (C9), forme définitive** : `feuillesDeLaFixture` **cesse de descendre** quand le chemin normalisé courant figure dans `FAMILLES_DE_CONDITIONS[].expr`. Un `…_expr` est donc **une feuille**, corrompue en bloc (objet → chaîne) et refusée par `validateExpr`. **Contrepartie non négociable, sans laquelle l'opacité devient une cachette** : `validateExpr` refuse **toute clé inconnue** sur un nœud. Sans elle, un champ de prose pourrait vivre à l'intérieur d'un `…_expr`, échapper au balayage des destinations, et être injecté par la n° 10 sans qu'aucun test rougisse.

**Réservé n° 4 `dossier-fiches`**, écrit ici pour que personne ne le re-dérive : `personnages[].contre_mesures[].action` → **ia** · `…declencheur_expr` → **moteur** · `…declencheur_texte` → **auteur** · `…delai` → **moteur** · `…portee` → **moteur**. Aucun espace de noms, aucune ligne dans `COLLECTIONS_IDENTIFIEES` : le OÙ est le Personnage porteur, exactement comme `savoirs[]` et `plan_actions[]` aujourd'hui.

## ANNEXE — contrat de sortie IA

**it3 ne produit aucun appel modèle.** Ce qu'il déplace est le côté **entrée** : dix champs ajoutés à l'ensemble **jamais injecté**, zéro à l'ensemble injecté. Aucun bloc de contexte ne grossit.

Un seul contrat aval reste contraint, et **moins** qu'au tour 1 puisque `confiance_au_moins` est reporté : sortie R4 `{ replique, indices_reveles, delta_confiance }` ; `indices_reveles` n'accepte que des identifiants `indice.*` résolus contre `collectIds(dossier)`, jamais un nom libre ; `delta_confiance` doit satisfaire `confiance + delta ∈ [CONFIANCE_MIN, CONFIANCE_MAX]` — **rejeté, jamais clampé**.

**Mémoire de session** : inchangée par it3. Aucun `…_texte` n'y entre — c'est précisément parce qu'ils sont `auteur` qu'ils ne peuvent pas devenir des « faits établis » et contredire la fiction au tour 40.
