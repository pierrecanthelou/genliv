# Plan d'itération — `dossier-controles` · itération `5`

**Composition du comité : CINQ rôles.** `narratif-ia` convoqué parce que l'itération touche le dossier d'aventure, les budgets de contexte injecté et la prose lue par l'auteur. Deux tours, aucun veto tenu au terme du tour 2.

**Statut : VALIDÉ par l'humain le 2026-09-15 (porte 2 franchie).**

---

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour l'ouvrier)*

**Phrase de démo**

> À la fin de cette itération, l'auteur qui laisse une fin, un blocage ou une révélation sans leur pendant structuré, ou un synopsis trop long, le voit dans son rapport sans ouvrir chaque fiche une par une.

> ⚠ **La queue de cette phrase est de moi, pas du PM.** Il défendait « sans **réimporter** ». J'ai mesuré après sa note (§ 17) que **les dix sites ont déjà une affordance sur leur propre écran** : quatre panneaux lisent déjà `validateDossier().warnings` en ligne, et le compteur du canon rougit déjà tout seul. « Sans réimporter » est donc **exact mais sous-vend** — l'auteur voyait déjà chaque manque, un écran à la fois. Le gain mesuré est la **portée** : sept des dix sites ne se montrent que pour l'entité affichée, si bien que savoir si l'un de douze personnages a une contre-mesure non armée demande aujourd'hui d'ouvrir douze fiches.

**La tranche, de l'écran à la persistance** — aucune écriture. `validateDossier(dossier).warnings` → `constatDAvertissement` (table déclarée de dix sites) → `ConstatControle` → `controlerDossier` → `RapportControles.controles` **et** `parSection` → les lignes de `ListeControles` et les pastilles de `SectionNav`, **sans une ligne de code de production de feature**.

**Les lots**

| id | titre | fichiers | `contrat` |
|---|---|---:|:--:|
| **L1** | `avertissements-au-rapport` | **4** | **oui** — touche `src/brain/` |

Un seul lot : exécution séquentielle, **sans worktree ni fusion**.

**Hors périmètre** — `validate.ts`, `types.ts`, `destinations.ts`, `tables.ts`, `sections.ts`, `brain/index.ts`, `pastilles.ts`, `ListeControles.tsx`, `PanneauControles.tsx`, `SectionNav`. Aucun composant, aucun jeton, aucun texte d'écran neuf. Aucune règle de **collection** (« aucune fin atteignable ») : c'est it6.

**Reportés** — quatre, au § 8 : « porte morte, producteur fantôme » (it6) · « deux lignes jumelles, aucune n'est désignable » (premier lot qui rouvrira `validate.ts`) · « le savoir se nomme par son identifiant » (idem) · le **groupement** des lignes prolifiques (itération à part, sur mesure).

**Innovation** — aucune proposée.

**Vetos** — quatre posés au tour 2, **tous satisfaits par ce plan**, aucun ne tient : R1 et R5 (tech-lead, architecture), la sonde de registre (UX, langue), la règle non dupliquée (narratif — requalifié en objection, § 8). Le veto du QA au tour 1 est **levé par son auteur**.

Plan écrit dans `.claude/raffinage/dossier-controles-it5.plan.md`. Valide, ou dis ce qui doit changer.

---

## 1 — But raffiné

Faire entrer dans le rapport de contrôle les **dix emplacements** où `validateDossier` produit déjà un avertissement, par **une** entrée de registre qui lit `warnings`, mappe chaque site par une **table déclarée ligne à ligne**, et n'écrit **aucun code de production de feature**.

**Bénéfice second, nommé ici et non dissimulé dans la phrase de démo** (exigence du PM, point 2) : `condition-sans-expr` devient le **signal pré-requis d'it6** — c'est lui qui distingue un objectif dont la condition reste en prose d'un objectif câblé, et la règle de collection qu'it6 doit écrire (« aucune fin atteignable ») s'appuiera dessus.

## 2 — Hors périmètre

- **Aucun lot contrat sur `validate.ts`, `types.ts`, `destinations.ts`, `tables.ts`, `sections.ts`.** La feature l'a juré au cadrage ; les gardes s'amendent, les tables ne bougent pas.
- **Aucune règle de collection.** « Toutes les fins sans `_expr` » est une cause distincte (KR-164) et un `bloquant` possible : it6.
- **Aucun groupement de lignes.** Si un site produit plus de ~10 lignes, c'est un changement d'anatomie de la liste, donc une itération à part — jamais un ajout en passant.
- **Aucune correction d'`entityId`** sur les avertissements : elle vit dans `validate.ts`.
- **Aucun cache, aucun `useMemo` sur le rapport** (KR-013/113) — la mesure a décidé contre (§ 11 des mesures).
- **Aucune couverture de test neuve dans la dette d'it4** : un renommage, rien d'autre.

## 3 — Contrat de design

**Anatomie : rigoureusement inchangée.** Un `Controle` mappé depuis un avertissement se rend **identiquement** à un `Controle` natif — `<li>` → `<button type="button">` pleine largeur → `Badge` + colonne à trois étages (`data-etage="ou|quoi|quoi-faire"`) + trailing `→ {titreSection}`. **Zéro nœud neuf, zéro jeton neuf, zéro fichier CSS.**

**Jetons** — tous déjà en place : `--border-divider`, `--text-label`, `--text-body`, `--text-muted`, `--text-faint`, `--fs-eyebrow`, `--fs-body`, `--fs-meta`, `--track-eyebrow`, `--space-*`, `--r-md`, `--font-ui`, `--font-mono` ; `--bad`, `--ink-2`, `--ink-4` pour `Badge`. `info` = `muted`. **Les trois niveaux ne se distinguent que par le mot** (`BLOQUANT`/`ALERTE`/`INFO`), jamais par une teinte neuve.

**Clavier, état vide, survol** — rien à écrire : bouton natif, Tab/Entrée gratuits ; l'état calme est déjà géré par `PanneauControles` et son texte ne change pas (« Aucun contrôle à signaler — le dossier passe tous les contrôles connus. » : le mot « connus » promet un **périmètre**, pas une source, et agréger l'élargit sans rendre la phrase fausse).

### LA TABLE DES DIX SITES — mot pour mot, elle passe telle quelle dans le code

`R` = **repris** de `DossierIssue` (le message porte une valeur lue dans le dossier) · `RÉ` = **écrit** pour le rapport (le message du validateur n'interpole aucune valeur du dossier).

| # | Chemin de table (clé) | Code | Niveau | Section | `message` | `remediation` — texte exact |
|---|---|---|---|---|:--:|---|
| 1 | `canon.mj` | `texte-trop-long` | alerte | `canon` | **R** | Resserrez le synopsis MJ (Canon → Synopsis MJ). |
| 2 | `canon.partage` | `texte-trop-long` | alerte | `canon` | **R** | Resserrez l'accroche joueur (Canon → Accroche joueur). |
| 3 | `charpente.jalons[].enonce_texte` | `texte-trop-long` | alerte | `jalons-fins` | **R** | Resserrez l'énoncé de ce jalon (Jalons & fins → Jalons). |
| 4 | `monde.conditions.climat[].manifestation` | `texte-trop-long` | **info** | `conditions` | **R** | Resserrez cette manifestation (Conditions). |
| 5 | `canon.objectifs[].reussi_si_texte` | `condition-sans-expr` | alerte | `canon` | **RÉ** — « Cette condition de réussite reste en prose : rien ne l'évaluera. » | Posez la condition structurée de réussite (Objectifs → Condition de réussite). |
| 6 | `canon.objectifs[].echoue_si_texte` | `condition-sans-expr` | alerte | `canon` | **RÉ** — « Cette condition d'échec reste en prose : rien ne l'évaluera. » | Posez la condition structurée d'échec (Objectifs → Condition d'échec). |
| 7 | `charpente.fins[].condition_texte` | `condition-sans-expr` | alerte | `jalons-fins` | **RÉ** — « Cette fin reste conditionnée par une prose : le moteur ne l'atteindra jamais tant qu'aucune condition structurée n'est posée. » | Posez la condition structurée de cette fin (Jalons & fins → Fins). |
| 8 | `monde.personnages[].contre_mesures[].declencheur_texte` | `condition-sans-expr` | alerte | `personnages` | **RÉ** — « Ce déclencheur reste en prose : rien n'arme cette contre-mesure. » | Posez le déclencheur structuré de cette contre-mesure (Personnages → Contre-mesures). |
| 9 | `monde.personnages[].savoirs[].revele_si` | `revelation-sans-porte` | **info** | `personnages` | **R** | Ajoutez au moins une porte de révélation, ou laissez tel quel si ce savoir ne doit jamais se révéler de lui-même (Personnages → Savoirs). |
| 10 | `monde.personnages[].plan_actions[].si_bloque` | `condition-sans-expr` | **info** | `personnages` | **RÉ** — « Cette étape ne porte aucune durée : rien ne sait combien de temps le joueur a avant qu'elle ne se déclenche. » | Posez une durée pour cette étape (Personnages → Plan d'actions). |

**7 `alerte` · 3 `info` · 0 `bloquant`.** Table ratifiée par les cinq rôles, contestée par personne.

**Motif du zéro-bloquant — à écrire, et surtout pas l'ancien** : *aucun de ces dix sites, **pris seul**, ne rend l'aventure injouable.* **Jamais** « parce que ce sont des `warning` » : ce serait la confusion d'axes que KR-217 existe pour interdire (`severity` dit si le **document** s'écrit, `niveau` si l'**aventure** se joue), et elle **interdirait à it6 d'écrire la règle de collection bloquante** qu'elle doit écrire.

**`location` : REPRIS tel quel aux dix sites, et c'est une décision mesurée.** `validate.ts` ne passe jamais le libellé de table : il passe `site.location`, résolu par **la même `localiserEntite`** que `controles.ts` importe déjà. Mesuré en sortie : `"Personnage « Sélène la Vigie »"`, `"Canon (MJ)"`, `"Canon (partagé)"`. **Déclarer les dix `location` remplacerait un nom d'entité résolu par un seau écrit à la main** — proposition rejetée au § 8 (RJ-12).

**Registre de langue, qui commande toute la table** : verbe nu à l'impératif, **aucun glyphe** (`↪` interdit), chemin d'écran entre parenthèses en casse phrase, **aucun terme interne** (`condition_texte`, `si_bloque`, `_expr`, `revele_si`), **aucune mention de canal** (`warning`, `error`, « ce n'est pas bloquant »), **aucun « réimportez »**. C'est le registre **mesuré** des cinq règles livrées (« Donnez… », « Ajoutez… », « Écrivez… », « Rédigez… »), étendu aux dix sites.

**Chemins d'écran vérifiés par lecture des composants réels** : `PanneauCanon.tsx` l. 204/220 · `FicheJalon.tsx` l. 111 + `PanneauJalonsFins.tsx` l. 63 · `FicheFin.tsx` l. 92 · `ObjectifsCanon.tsx` l. 311/326 · `BlocPlanActions.tsx` l. 282/316 (contre-mesures), l. 191/250 (plan d'actions) · `BlocSavoirs.tsx` l. 270. **Site 4 excepté** : aucun libellé de champ n'a pu être trouvé pour `manifestation` dans `PanneauConditions.tsx` — d'où le repli au niveau section seul, « (Conditions) », **jamais un sous-champ inventé**.

## 4 — Contrats `brain/` touchés

| Contrat | Mouvement |
|---|---|
| `CONTROLES` | **+1 entrée**, `avertissement-de-validation`, déclarée **en dernier** (l'ordre des clés est l'ordre de rendu ; l'amorce reste en tête, épinglée l. 172). |
| `ControleId` | **+1 membre** — `TEMOINS` et `NEUVES` (`Record<ControleId, Dossier>`, **totaux par compilation**) gagnent chacun une clé, sinon `tsc` refuse. |
| `ConstatControle`, `Controle`, `RapportControles`, `NiveauControle`, `ControleDescripteur` | **inchangés**. Aucun champ ajouté, aucun rendu optionnel. |
| `brain/index.ts` | **inchangé** — `controlerDossier`, `Controle`, `RapportControles` en sortent déjà. |
| `issues.ts` | **commentaire seul**, l. 76. Zéro ligne exécutable. |

**Vérification faite, non déduite** : `validate.ts` n'importe pas `controles.ts` (bloc d'import l. 1-34 : `types`, `issues`, `identifiers`, `tables`, `expr`, `deltas`, `predicates`, `freeze`, `../bestiary`). **Aucun cycle.**

## 5 — Lot

### L1 — `avertissements-au-rapport` — **`contrat`** (touche `src/brain/`), s'exécute **seul**

| Fichier | N/R | Contenu |
|---|:--:|---|
| `src/brain/dossier/controles.ts` | **R** | l'import, l'entrée de registre, `SITES_AVERTISSEMENT` (10 lignes), `cheminDeTable`, `constatDAvertissement`, les **deux** JSDoc renversées (l. 22-23 et l. 80) |
| `src/brain/dossier/controles.test.ts` | **R** | garde KR-217 rétrécie (l. 336-342), garde de `path` amendée (l. 287-309), **le tableau `rapports` l. 292-297 gagne `controlerDossier(cloneSansPorte())`**, garde de section **complétée** (l. 235-245), `TEMOINS`/`NEUVES` +1 clé, balayage de totalité, garde de registre, sondes neuves |
| `src/features/dossier-controles/tests/panneauControles.test.tsx` | **R** | la preuve **verticale** par clone muté d'un seul champ **+ la dette d'it4** (renommage seul) |
| `src/brain/dossier/issues.ts` | **R, commentaire seul** | la phrase l. 76 |

**Conditionnels** (aucun conflit possible : il n'existe qu'un lot) — `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (R) **seulement si** un compte de badge rougit : il ne devrait pas, zéro avertissement mesuré sur les trois dossiers. À **constater**, jamais à supposer.

**Explicitement NON touchés** : `validate.ts`, `types.ts`, `destinations.ts`, `tables.ts`, `sections.ts`, `brain/index.ts`, `pastilles.ts`, `ListeControles.tsx`, `PanneauControles.tsx`, `SectionNav`, `DossierEditorScreen.tsx`.

## 6 — Critères d'acceptation

**1 — Allumage et silence, dans le même test.**
*Étant donné* un clone de `dossier-minimal.json` muté d'**un seul** champ (`canon.mj.synopsis_mj` porté au-delà du budget), *quand* `controlerDossier` est appelé sur le clone **et** sur l'intact, *alors* le clone porte un constat que l'intact n'a pas, et la ligne rendue porte **le décompte mesuré** (601 pour 601 mots, 650 pour 650 — deux volumes dans le même test), ce qui **prouve la reprise** au lieu de l'affirmer. — *contrat (`brain`)*, `controles.test.ts`

**2 — Jamais bloquant.**
*Étant donné* les quatre mutations d'un seul champ (`synopsis_mj` au-delà du budget ; `revele_si: {}` ; `condition_expr` d'une fin retiré ; `duree` d'un `si_bloque` retirée), *quand* `controlerDossier` est appelé sur chaque clone, *alors* chaque constat porte `niveau ∈ {alerte, info}`, jamais `bloquant`, et `jouable` est inchangé — tenu **par le type** (`Exclude<NiveauControle, 'bloquant'>`) **et** vérifié à l'exécution. — *contrat*, `controles.test.ts`

**3 — Totalité tenue par balayage (KR-199).**
*Étant donné* chaque `path` de `BUDGETS_DE_MOTS` (4), chaque `texte` de `FAMILLES_DE_CONDITIONS` où `alerteSansExpr` est vrai (4), et les deux sites écrits à la main (`revele_si`, `si_bloque`), *quand* ils sont confrontés à `SITES_AVERTISSEMENT`, *alors* chacun y a une entrée, la table en compte **exactement 10** (aucune ligne morte), **et** la source de `validate.ts` contient exactement **4** occurrences de `warnings.push(` — un cinquième emplacement écrit à la main renvoie son auteur à la table. — *contrat*, `controles.test.ts`

**4 — La section est déclarée, et le module ne découpe jamais un chemin.**
*Étant donné* le rapport de chaque témoin, *quand* la section de chaque constat est confrontée à un `Record` **de valeurs attendues** couvrant les dix sites, *alors* chacune est celle de la table du § 3 ; **et** un balayage de source constate que `controles.ts` ne contient **aucun `split('.')`** ; **et** `path` satisfait la garde d'it1 **amendée** — clé de `DESTINATION_DES_CHAMPS`, **ou préfixe strict** (coupé sur le point) d'au moins une clé. La JSDoc l. 80 est renversée dans le même geste. — *contrat*, `controles.test.ts`

**5 — KR-217 rétrécie sur son propre motif.**
*Étant donné* la source de `controles.ts` après le lot, *quand* elle est balayée, *alors* elle **ne contient pas** `.errors` et **contient** `.warnings` (les deux moitiés : une garde d'absence seule passerait à vide) ; **et** un clone dont la **seule** anomalie est une `error`, **sans aucun `warning`**, ne produit aucun constat de la règle neuve. La JSDoc l. 22-23 est renversée dans le même geste, et **n'écrit jamais la sous-chaîne littérale `.errors`** en prose. — *contrat + source-scan*, `controles.test.ts`

**6 — Non-régression du calme.**
*Étant donné* `dossier-minimal.json`, `dossier-reference.json` intacts et un dossier neuf (`construireAmorce`), *quand* `controlerDossier` est appelé, *alors* le rapport est identique **ligne pour ligne** à l'état pré-lot. Une itération qui allume sans se taire ne prouve pas plus qu'une qui se tait sans allumer. — *contrat + composant*, `controles.test.ts` + `panneauControles.test.tsx`

**7 — Registre de langue, sur les SIX règles et les DEUX colonnes.**
*Étant donné* l'ensemble des constats produits — les témoins des **cinq règles livrées** et les **dix** témoins du pont —, *quand* `controle.message` et `controleRemediation(controle)` sont lus, *alors* aucune chaîne ne contient `↪`, ni une clé du schéma (`_texte`, `_expr`, `si_bloque`, `revele_si`), ni une mention de canal (`bloquant`, `non bloquant`, `warning`, `error`), ni « réimport », **et aucune n'est vide**. **Cas négatif obligatoire, exécuté avant adoption** (BUG-084) : brancher `issue.message` ou `dossierIssueRemediation` verbatim sur un site `condition-sans-expr` **doit** faire rougir cette sonde. — *contrat*, `controles.test.ts`

**8 — Preuve verticale au panneau.**
*Étant donné* une fixture **locale** clonée-mutée d'un seul champ (jamais `dossier-minimal`/`dossier-reference` directement), *quand* le panneau est rendu, *alors* la ligne importée suit l'anatomie à trois étages + pastille déjà en production, **sans nœud neuf**. Inclut la dette d'it4 : le test voisin est **renommé** `chaque ligne rend un bouton natif unique, sans role ni tabindex manuels` — **zéro ligne d'assertion touchée**. — *composant*, `panneauControles.test.tsx`

## 7 — Tests nommés

| KR / risque | Test qui le tient |
|---|---|
| **KR-217** (axes `severity` / `niveau`) | critère 5 + le balayage existant l. 275-283 (`Controle` ne porte jamais `severity`, `Record<ControleId, …>` **total par compilation** → la règle neuve y est couverte d'office) |
| **KR-219** (section déclarée, jamais dérivée) | critère 4 — valeurs attendues **et** `not.toContain("split('.')")` |
| **KR-199** (balayer, jamais N littéraux) | critère 3 — les trois boucles + `toHaveLength(10)` + l'épinglage à 4 |
| **KR-164** (un code par cause) | **une** entrée de registre ; la cause est déjà codée par `DossierIssueCode` |
| **KR-165** (aucun seuil retapé) | critère 1 — deux volumes différents dans le même test ; `controles.ts` n'importe aucun `BUDGET_MOTS_*` |
| **KR-222** (deux silences indiscernables) | critère 7 + l'amendement du texte de KR-222 (§ 10) |
| **KR-225** (un dossier persisté ne porte jamais `error`) | critère 5, sonde d'exécution |
| **KR-013/113** (état dérivé en ligne) | critère 6 — aucun cache, aucun `useMemo` ; mesuré inutile (§ 11) |
| **KR-197/202** (deux entités dans le même test) | critères 1 et 6 — muté **et** intact, toujours ensemble |
| **KR-109** (extraire au SECOND appelant réel) | **aucun test — tenu par la liste de fichiers du § 5**, et c'est le bon instrument : le lot ne crée ni module, ni primitive partagée, ni second appelant. Un contrôle de diff, pas une assertion `jest` — inventer un test ici serait un test sans sujet. |
| **BUG-084** (couleur de test déduite) | critère 7, cas négatif **exécuté** avant adoption |
| **BUG-082** (état illégal représentable) | RJ-5 — `section` jamais optionnelle |

## 8 — Registre des désaccords

**Tout rejet nommé au tour 1 ou 2 est ici. Un rejet qui meurt en annexe est la classe BUG-082.**

| # | Objet | Statut | Motif, en une phrase |
|---|---|:--:|---|
| RJ-1 | Deux sources fusionnées côté `PanneauControles` | **REJETÉ** *(veto tech-lead, en domaine)* | Obligerait la feature à recalculer `parSection` pour que les badges d'it2 voient les avertissements, et ferait passer la ligne d'it4 de `Controle[]` à une union. |
| RJ-2 | Résolveur générique `path → SectionId` | **REJETÉ** | C'est la dérivation que KR-219 interdit ; désormais **mécaniquement** vérifié (critère 4). |
| RJ-3 | Quatre entrées `CONTROLES`, une par code | **REJETÉ** | 8 validations par rendu ≈ **5,9 ms** mesurés sur 13 ko — plus du tiers d'une trame — pour recoder des causes déjà codées. |
| RJ-4 | Élargir `controler(dossier, contexte)` | **REJETÉ** | Abstraction à **zéro** appelant supplémentaire, qui toucherait les cinq entrées livrées (KR-109). |
| RJ-5 | `ConstatControle.section` optionnelle | **REJETÉ** *(veto tech-lead, en domaine)* | État illégal représentable — une flèche d'it4 qui ne pointe nulle part (classe BUG-082). |
| RJ-6 | Mémoïser ou cacher le rapport | **REJETÉ** | ~1,5 ms par rendu : rien à absorber. **Premier rejet de l'itération qui repose sur un nombre**, pas sur une doctrine. |
| RJ-7 | Reprendre les dix `message` tels quels | **REJETÉ sur 5 sites, RETENU sur 5** | Les cinq `condition-sans-expr` portent **une clé JSON dans la prose** (mesuré) ; les cinq autres portent une **valeur lue dans le dossier** qu'une copie perdrait. |
| RJ-8 | Réutiliser `dossierIssueRemediation` | **REJETÉ** | Registre de langue étranger (`↪`), mention de canal à côté d'une pastille qui utilise le même mot pour autre chose, **et consigne factuellement fausse** sur `si_bloque`. |
| RJ-9 | Ouvrir un lot sur `validate.ts` | **REJETÉ** | Périmètre juré au cadrage, et la mesure montre qu'il n'y a rien à y gagner. |
| RJ-10 | Résoudre le **nom** de l'indice pour réécrire `revelation-sans-porte` | **REJETÉ** | Exigerait un second moteur de traversée du schéma dans `controles.ts`. → reporté. |
| RJ-11 | Partager **un** rapport entre `DossierEditorScreen` et `PanneauControles` | **REJETÉ** | Optimisation que la mesure ne réclame pas, au prix d'un fichier d'une autre feature. |
| RJ-12 | **Déclarer les dix `location`** (proposition narratif, tour 2) | **REJETÉ — sur mesure** | `location` est produit par **la même `localiserEntite`** que le rapport importe déjà : mesuré, il rend `"Personnage « Sélène la Vigie »"`, pas `"Personnages"`. Déclarer remplacerait **un nom d'entité résolu par un seau écrit à la main**. |
| RJ-13 | **Relaxer la garde d'it3** (universel → existentiel par règle) | **REJETÉ — sur mesure** | Le témoin retenu (`cloneSansPorte()` sur `dossier-minimal`) produit **un** avertissement, racine `monde` ≠ section `personnages` : il **satisfait déjà le prédicat universel**. La relaxation coûte de la couverture sur cinq règles livrées pour n'acheter **rien** à it5. À la place : la garde de source du critère 4, **strictement supérieure**, plus la documentation ci-dessous. |
| RJ-14 | Ajouter `canon.mj` / `canon.partage` / `revele_si` à `DESTINATION_DES_CHAMPS` | **REJETÉ** | La garde s'amende, la table ne bouge pas (périmètre). |
| RJ-15 | Grouper les lignes prolifiques | **REPORTÉ** | Changement d'anatomie de la liste : itération à part, **sur mesure**, jamais un ajout en passant. |
| RJ-16 | Prouver le pont sur les trois fixtures dormantes seules | **REJETÉ** | Elles rendent zéro avertissement : un vert dessus passerait aussi sur un pont câblé à l'envers ou absent. |
| RJ-17 | Que `Controle` porte une valeur de `DossierIssueSeverity` | **REJETÉ** | Romprait l'axe ÉCRIT / JOUABLE que KR-217 pose à deux vocabulaires distincts. |
| RJ-18 | Re-dériver les avertissements dans `controles.ts` | **REJETÉ** | Deux moteurs pour le même seuil divergent au premier changement de borne. *(Posé en veto par le narratif ; **requalifié en objection** — le terrain est architectural, donc tech-lead. Sans effet pratique : personne ne le propose, et le tech-lead le rejette aussi.)* |

**EXIGENCE FERME du QA, non négociable, coût nul** — la limite `canon` de la garde d'it3 se **documente dans ce lot**, au-dessus du prédicat, plus une entrée de `known_risks` : *« Ce prédicat (`path.split('.')[0] !== section`) est structurellement insatisfiable pour la section `canon` — `sections.ts` : `canon` est la seule des dix `cle` sans point. Une future règle qui déclare correctement `section: 'canon'` sur un `path` en `canon.*` fera rougir ce test EN ÉTANT JUSTE. Ne pas ajouter un tel témoin ici ; réécrire l'invariant est la charge de qui touchera `canon.*` en premier. »*

**PHRASE À RECOPIER TELLE QUELLE** au point où le témoin de `NEUVES` est choisi :

> Le témoin de la **preuve verticale d'allumage** se choisit sur le **coût** — `canon.mj` via `texte-trop-long` est le moins cher, une seule affectation, aucun risque de fabriquer une `error`. Le témoin de la **garde anti-dérivation** `NEUVES` se choisit sur le **contraste** et exclut nommément tout site `canon.*`, dont la racine du `path` égale toujours la section. **Deux témoins, deux tests différents, jamais le même site pour les deux preuves.**

**REPORTÉS** — `open_questions` : « **porte morte, producteur fantôme** » (le croisement `revelation-sans-porte` × `indice-sans-source` ; `producteursParIndice` compte `savoirs[].indice_id` sans regarder `revele_si` → faux négatif d'une règle bloquante) → **it6** · « **deux lignes jumelles, aucune n'est désignable** » (plusieurs éléments d'une même collection sous une même entité : même OÙ, même QUOI, seul le `path` diffère et il n'est pas rendu) → **premier lot qui rouvrira `validate.ts`** · « **le savoir se nomme par son identifiant** » → idem · le **groupement** (RJ-15).

## 10 — Définition de fini

- [ ] Prettier → `tsc --noEmit` → ESLint → `jest` **verts**, porte de commit non contournée.
- [ ] Les **8 critères** vérifiés, chacun avec sa preuve.
- [ ] Le **cas négatif du critère 7 exécuté**, et son résultat écrit dans la revue — pas « à faire », **fait**.
- [ ] Les **deux JSDoc** de `controles.ts` renversées **et** `issues.ts` l. 76 amendé, dans ce lot.
- [ ] **KR-219 amendé** dans `specification.json` **et** `code-knowledge.json`, même texte des deux côtés : *« dérivée » vise un **calcul** ; une table écrite ligne à ligne par la règle productrice et **totale par balayage** n'en est pas un — `PROSES_AMORCE` en est le précédent dans le même fichier. Licite à deux conditions, chacune tenue par un test : totalité balayée depuis le registre qui fait foi, et un chemin absent de la table produit **zéro** constat, jamais une section de repli.*
- [ ] **KR-222 amendé** : le signal sépare « pas d'`_expr` **mais** une prose » de « `_expr` présent », **pas** « ni `_expr` ni prose » — ce troisième cas reste **silencieux**, et sa discrimination est due à it6. Le trou est **propre aux objectifs** : `charpente.fins[].condition_texte` est requis (`tables.ts` l. 137), l'avertissement y part toujours.
- [ ] La limite `canon` documentée (§ 8) + son entrée `known_risks`.
- [ ] **Relevé `volume_mesure`** dans la revue — un relevé **daté**, jamais une assertion committée : lignes produites, répartition par niveau, lignes du site le plus prolifique, **et nombre de lignes indistinguables entre elles**. Si le prolifique dépasse ~10, l'arbitrage à rouvrir est le **groupement**, pas le niveau.
- [ ] **Mesure de coût dans la revue, avec son PROTOCOLE** (fichier, taille en octets, machine, JIT chaud) — un nombre sans protocole ne se compare à rien.
- [ ] `specification.json` (log, statut, `resolved_decisions`, `open_questions`), `code-knowledge.json`, `CHANGELOG.md`, `features_history.json`, `README.md`, colonne `Statut` du roadmap.
- [ ] **Budget de contexte relevé** — `src/features/dossier-controles/specification.json` est à **65 915 o** pour un plafond de **66 560** : **645 o de marge**, compaction très probable **dans ce lot-ci**.

## 11 — Signatures

```ts
// AJOUTS D'IMPORT — dans `controles.ts`
import type { DossierIssue, DossierIssueCode } from './issues'
import { validateDossier } from './validate'

/** UN SITE d'avertissement du validateur, et ce que le linter en fait. */
interface SiteAvertissement {
	/** DÉCLARÉ et jamais lu : la sonde le compare au `code` réellement produit,
	 *  sinon la table dériverait sans bruit. */
	code: DossierIssueCode
	/** Jamais `bloquant` : aucun de ces dix sites, PRIS SEUL, ne rend l'aventure
	 *  injouable. JAMAIS « parce que ce sont des warning » — ce serait la confusion
	 *  d'axes que KR-217 interdit, et elle enfermerait it6. */
	niveau: Exclude<NiveauControle, 'bloquant'>
	/** La section DÉCLARÉE par la règle de mappage — jamais dérivée (KR-219). */
	section: SectionId
	/** Le QUOI. `null` = le message du validateur est REPRIS, parce qu'il interpole
	 *  une VALEUR LUE DANS LE DOSSIER (un décompte, la désignation d'une entité)
	 *  que cette table ne peut pas reconstituer sans déréférencer un chemin — ce
	 *  que ce module ne fait jamais. Une chaîne = le message du validateur
	 *  n'interpole aucune valeur du dossier, et celui-ci est ÉCRIT pour le rapport.
	 *  CINQ et CINQ, et la répartition se relit ligne à ligne dans `validate.ts`. */
	message: string | null
	remediation: string
}

/** DIX SITES, QUATRE SECTIONS. Clé = chemin de TABLE (indices effacés). PRIVÉE. */
const SITES_AVERTISSEMENT: Record<string, SiteAvertissement> = { /* les 10 lignes du § 3 */ }

/**
 * `monde.personnages[2].savoirs[0].revele_si` → `monde.personnages[].savoirs[].revele_si`.
 * Un EFFACEMENT d'indices, jamais un découpage : ce module ne lit aucun segment de
 * chemin, et un balayage de source le tient (critère 4).
 */
function cheminDeTable(path: string): string {
	return path.replace(/\[\d+\]/g, '[]')
}

/**
 * UN avertissement → ZÉRO ou UN constat. Zéro quand le site n'est pas dans la
 * table : silence tenu par un TEST de totalité, jamais par une levée —
 * `controlerDossier` se promet pure et totale.
 * `location` est REPRIS : `validate.ts` le produit avec la MÊME `localiserEntite`
 * que ce module importe déjà.
 */
function constatDAvertissement(avertissement: DossierIssue): ConstatControle[]
```

**Entrée de registre, déclarée EN DERNIER** dans `CONTROLES` :

```ts
'avertissement-de-validation': {
	libelle: 'Avertissement du validateur',
	niveaux: ['alerte', 'info'],
	controler: (dossier) => validateDossier(dossier).warnings.flatMap(constatDAvertissement),
	remediation: (constat) =>
		estCleDe(SITES_AVERTISSEMENT, constat.path) ? SITES_AVERTISSEMENT[constat.path].remediation : '',
}
```

**Garde de `path` amendée** (le point final n'est pas décoratif : sans lui, `canon.mj` matcherait `canon.mjolnir`) :

```ts
/** Clé de la table, OU préfixe STRICT d'au moins une clé, coupé sur le séparateur. */
function estCheminDeChamp(path: string): boolean {
	if (estCleDe(DESTINATION_DES_CHAMPS, path)) return true
	return Object.keys(DESTINATION_DES_CHAMPS).some((cle) => cle.startsWith(`${path}.`))
}
```

**Mesuré** : 7 des 10 sites sont déjà clés de `DESTINATION_DES_CHAMPS` (97 clés) ; les 3 autres — `canon.mj`, `canon.partage`, `…savoirs[].revele_si` — sont des **conteneurs**, préfixes stricts de 1, 1 et 6 clés. Aucun n'est orphelin.

**`entityId` est absent des constats mappés** : les quatre `warnings.push(` appellent `anomalie()` à **cinq** arguments, le sixième étant optionnel et non passé. Ce n'est pas un défaut à réparer ici — le faire ouvrirait `validate.ts` (RJ-9).
