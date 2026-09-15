# Revue d'itération — `dossier-controles` · itération 5

**En une ligne** — l'auteur qui laisse une fin, un blocage ou une révélation sans leur pendant structuré, ou un synopsis trop long, le voit dans son rapport **sans ouvrir chaque fiche une par une**.

Comité à **5 rôles**, **2 tours**, **aucun veto tenu**. Un lot unique marqué `contrat`, exécuté seul, sans worktree ni fusion.

---

## 1 — Ce que la mesure a corrigé avant, pendant et après le comité

Cette itération a produit **dix-sept mesures** (`.claude/raffinage/dossier-controles-it5/mesure-orchestrateur.md`). Cinq ont changé une décision, et **trois ont réfuté une affirmation d'un rôle** :

| # | Affirmation | Ce que la mesure a montré |
|---|---|---|
| R7 (tech-lead) | « `DossierIssue.message` est **déjà une phrase rédigée**, une copie serait une seconde vérité » | **Faux sur 5 sites** : `condition-sans-expr` rend littéralement « Le champ « `condition_texte` » … » et « Le champ « `si_bloque` » … » — une **clé JSON dans la prose de l'auteur**, ce que la docstring de `controles.ts` interdit à elle-même. R7 **restreint** aux 5 sites où sa prémisse tient. |
| R8 (tech-lead) | « le registre impératif est épinglé par `controles.test.ts:676` » | **Juste sur le fond, faux sur son instrument** : cette garde ne couvre que la règle d'amorce. **Aucun test n'empêchait un `↪` d'entrer dans le rapport.** Garde de remplacement écrite, sur les six règles et les deux colonnes. |
| « location » (narratif) | « `location` vaut « Personnages » ; deux personnages produisent **deux lignes identiques dans leurs trois étages** » | **Faux.** `validate.ts` ne passe jamais le libellé de table : il passe `site.location`, résolu par **la même `localiserEntite`** que `controles.ts` importe déjà. Mesuré en sortie : `"Personnage « Sélène la Vigie »"`. Le narratif avait lu la table, pas la sortie — **classe BUG-084, qu'il cite lui-même deux fois dans sa note**. |

**Ce qui reste vrai de la troisième, et qui est parti aux reports** : le cas jumelles existe, mais son périmètre est « **N éléments d'une même collection sous une même entité** », pas « 7 sites sur 10 ». Sur le dossier de référence, il a fallu **dupliquer** une étape pour le produire.

**Deux corrections de l'orchestrateur sur lui-même**, à ne pas taire :
- **Motif de cadrage faux** — j'avais écrit « aucun ne peut être `bloquant` par construction, **ce sont des `warning`** ». C'est la confusion d'axes que KR-217 existe pour interdire. Verdict bon, motif faux — et l'ancien **aurait interdit à it6 d'écrire sa règle de collection bloquante**.
- **Taille de fixture fausse** — j'ai étiqueté `dossier-reference.json` « 13 033 o », qui est la longueur d'un `JSON.stringify` **compact**. Le fichier pèse **15 832 o**. Relevé par le lot contrat. Les timings restaient valides ; seule l'étiquette était fausse.

## 2 — Les 8 critères

Chacun a été vérifié **deux fois** : par le lot, puis par un QA en **mode B** à contexte neuf, qui a **rougi deux gardes lui-même** plutôt que de croire les commentaires du test.

| # | Critère | État | Preuve |
|---|---|:--:|---|
| 1 | Allumage, silence, décompte | **VÉRIFIÉ** | Clone intact → `[]` ; borne exacte (600 mots) → `[]` ; 601 et 650 → **deux messages différents**, chacun portant son décompte. C'est ce qui **prouve la reprise** au lieu de l'affirmer. |
| 2 | Jamais bloquant | **VÉRIFIÉ** | Les 4 mutations d'un seul champ → `niveau ∈ {alerte, info}`, `jouable` inchangé. Tenu **aussi par le type** (`Exclude<NiveauControle, 'bloquant'>`). |
| 3 | Totalité par balayage (KR-199) | **VÉRIFIÉ** | 4 `BUDGETS_DE_MOTS` + 4 `FAMILLES_DE_CONDITIONS.alerteSansExpr` + 2 sites isolés = **10**, jamais dix littéraux nus ; plus l'épinglage à **4** des `warnings.push(` de `validate.ts`. **4 sites de CODE pour 10 sites de DONNÉES** — les deux gardes sont complémentaires, aucune n'est redondante. |
| 4 | Section déclarée, aucun découpage | **VÉRIFIÉ, garde rougie en direct** | Le QA a injecté un `split('.')` factice dans `controles.ts` : la garde **rougit**, puis revert vérifié. `estCheminDeChamp('canon.m') === false` éprouve le point final du prédicat. |
| 5 | KR-217 rétrécie | **VÉRIFIÉ** | **Les deux moitiés** (`not.toContain('.errors')` **et** `toContain('.warnings')`) — une garde d'absence seule passerait à vide. Sonde d'exécution : un clone dont la **seule** anomalie est une `error`, sans aucun `warning`, ne produit rien. |
| 6 | Non-régression du calme | **VÉRIFIÉ** | Les trois dossiers épinglés **ligne pour ligne** sur des valeurs mesurées **pré-lot**, plus `warnings.length === 0` — sans cette dernière ligne, **un pont débranché passerait les trois épingles**. |
| 7 | Registre de langue, 6 règles × 2 colonnes | **VÉRIFIÉ, cas négatif exécuté deux fois** | Ni `↪`, ni clé de schéma, ni mention de canal, ni « réimport », **et jamais vide**. Le lot **et** le QA ont chacun branché le message brut et constaté le rouge, puis restauré. |
| 8 | Preuve verticale au panneau | **VÉRIFIÉ** | Fixture **locale** mutée d'un seul champ : 1 `<li>`, 1 bouton natif, 3 étages non vides, `ALERTE`, OÙ = `Canon (MJ)`, décompte réel, `→ Canon`. Zéro nœud neuf, zéro jeton. |

## 3 — Diff par lot

**L1 `avertissements-au-rapport`** (`contrat`), **exactement les 4 fichiers du plan** :

| Fichier | Diff |
|---|---|
| `src/brain/dossier/controles.ts` | +236 / −4 |
| `src/brain/dossier/controles.test.ts` | +516 |
| `src/features/dossier-controles/tests/panneauControles.test.tsx` | +92 |
| `src/brain/dossier/issues.ts` | +7 / −1 (commentaire seul) |

**Intacts, vérifiés nommément par le QA** : `validate.ts`, `types.ts`, `destinations.ts`, `tables.ts`, `sections.ts`, `brain/index.ts`, `pastilles.ts`, `ListeControles.tsx`, `PanneauControles.tsx`, `SectionNav.tsx`, tout `bascule-editeur/`. **Aucune ligne de code de production de feature n'a été écrite.**

`dossierEditorScreen.test.tsx` (conditionnel du plan) : **non touché — constaté, pas supposé.**

## 4 — Ce qui a été refusé, et pourquoi (un relecteur ne peut pas le deviner du diff)

| # | Refusé | Motif |
|---|---|---|
| RJ-1 | Fusionner deux sources dans `PanneauControles` | Obligerait la feature à recalculer `parSection` pour que les badges d'it2 voient les avertissements, et ferait passer la ligne d'it4 de `Controle[]` à une union. |
| RJ-3 | Une entrée de registre par code | **Six validations par rendu au moins**, contre deux. L'intuition du tour 1 est devenue une mesure. *(Le comité disait « quatre entrées, une par code » : **il n'y a que TROIS codes** pour quatre sites d'écriture — mon erreur de mesure, relevée par la revue de PR. Le rejet tient, son chiffre était faux.)* |
| RJ-5 | `ConstatControle.section` optionnelle | État illégal représentable — une flèche d'it4 qui ne pointe nulle part (classe BUG-082). |
| RJ-6 | Mémoïser le rapport | **~1 à 2 ms par rendu : rien à absorber.** Le dépôt avait écrit que « c'est cette mesure-là qui décidera » ; elle décide **contre** le cache. Premier rejet de l'itération qui repose sur un nombre. |
| RJ-8 | Réutiliser `dossierIssueRemediation` | Glyphe étranger, mention de canal à côté d'une pastille qui emploie le même mot pour autre chose, **et consigne factuellement fausse** sur `si_bloque`. |
| **RJ-12** | **Déclarer les dix `location`** | **Rejeté sur mesure** : `location` nomme déjà l'entité. Déclarer aurait remplacé un nom résolu à l'exécution par un **seau écrit à la main** — une dégradation déguisée en durcissement. |
| **RJ-13** | **Relâcher la garde d'it3** (universel → existentiel) | **Rejeté sur mesure** : le témoin retenu **satisfait déjà** le prédicat universel (racine `monde` ≠ section `personnages`). Relâcher coûtait de la couverture sur cinq règles livrées pour n'acheter **rien**. À la place, la garde de source (`aucun découpage de chemin`), **strictement supérieure** — elle couvre `canon`, que le prédicat ne peut pas couvrir. |
| RJ-18 | Re-dériver les avertissements dans `controles.ts` | Deux moteurs pour le même seuil divergent au premier changement de borne. *(Posé en veto par le narratif, **requalifié en objection** : le terrain est architectural. Sans effet — personne ne le proposait.)* |

## 5 — Ce qui a été reporté, et où

- **« porte morte, producteur fantôme »** → **it6**. `producteursParIndice` compte `savoirs[].indice_id` **sans regarder `revele_si`** : un indice dont l'unique producteur est un savoir sans porte est compté comme produit. **Faux négatif d'une règle bloquante**, cause distincte (KR-164) — pas un relèvement de niveau de `revelation-sans-porte`, qui reste `info`.
- **« deux lignes jumelles, aucune n'est désignable »** → premier lot qui rouvrira `validate.ts`. **Périmètre corrigé par la mesure** (voir § 1).
- **« le savoir se nomme par son identifiant »** → idem.
- **Le groupement des lignes prolifiques** → itération à part, **sur mesure**. Le relevé d'it5 le laisse fermé : site le plus prolifique **4 lignes**, sous le seuil de ~10.

## 6 — Relevé `volume_mesure` (daté, jamais une assertion committée)

Clone de `dossier-reference.json` muté sur **les dix sites, partout où ils peuvent l'être** — le pire cas d'un auteur, pas un échantillon :

- **18 lignes produites par le pont** ; rapport entier : 28 lignes.
- **Pont : 11 `alerte`, 7 `info`, 0 `bloquant`.** Rapport entier : 1 `bloquant`, 15 `alerte`, 12 `info`.
- Site le plus prolifique : `…savoirs[].revele_si` → **4 lignes**. Par section : `personnages` 7 · `canon` 6 · `jalons-fins` 4 · `conditions` 1.
- **Lignes indistinguables entre elles : 0** — clé de comparaison = tout ce qui est **rendu**, le `path` exclu puisqu'il ne l'est pas.

## 7 — Écarts assumés

1. **Trois ajouts au-delà du plan, aucun retrait** : une sonde vérifiant que le `code` **déclaré** par chaque site est celui que `validateDossier` produit vraiment (le § 11 le promettait, aucun critère ne le tenait) ; **dix** témoins au lieu de quatre ; la totalité de la table privée prouvée par balayage de sa **source**, puisqu'elle n'est pas exportée.
2. **La phrase du § 8 sur le choix des deux témoins a été paraphrasée** au lieu d'être recopiée mot pour mot, alors que le plan disait « à recopier telle quelle ». Sens préservé. Relevé par le QA — écart de procédé, pas de fond.
3. **Fins de ligne** : les 4 fichiers du lot sont passés en LF (Prettier). Les deux balayages de source **normalisent `\r\n` → `\n`** — j'ai vérifié en forçant les sources en CRLF et en rejouant : **33/33 verts**. Les gardes survivent à un `git checkout`.

4. **Écart au plan, déclaré** — le plan exigeait KR-219 et KR-222 amendés « même texte des deux côtés ». `code-knowledge.json` en porte une **condensation**, ce fichier étant lui-même au-dessus de son plafond. Sens identique, aucune clause perdue, vérifié entrée par entrée. Relevé par la revue de PR — **un écart non déclaré est ce que cette feature a déjà corrigé deux fois.**

**Aucun `BLOCAGE`.**

## 8 — Porte qualité

| | |
|---|---|
| `tsc --noEmit` | **vert** |
| ESLint | **0 erreur** (1 warning préexistant dans `src/player/`, fichier non touché) |
| `jest` | **85 suites / 1226 tests** — base 1218, **+8**, exactement le nombre de `it(` ajoutés |
| Score de mutation | **non dû** : le périmètre muté est `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`, aucun n'est touché |
| Table dorée | **hors sujet** : `SITES_AVERTISSEMENT` est une table de mappage d'interface, pas un registre de règles du jeu |

## 9 — Budget de contexte, et ce que la compaction a coûté

Deux plafonds franchis **par cette itération**, compactés **dans ce lot-ci** :

| Fichier | Avant | Après | Plafond |
|---|---:|---:|---:|
| `src/features/dossier-controles/specification.json` | 77 666 | **66 245** | 66 560 |
| `code-knowledge.json` | 78 129 | **76 039** | 76 800 |

**Ce que la compaction a déplacé** : les décisions et questions des itérations **1 à 4** se réduisent à leur verdict et son objet, plus un renvoi **vivant** vers leur revue — la revue est le dossier, la spec en est l'index. Les décisions d'it5 sont intactes.

**Trois défauts réels corrigés au passage** :
- **6 renvois morts** vers `.claude/raffinage/dossier-controles-cadrage.plan.md`, fichier qui n'existe pas. Un renvoi vers rien est pire que pas de renvoi — retirés.
- **67 séquences de mojibake** dans `code-knowledge.json` (`â€"` pour `—`), réparées de façon **ciblée**, jamais par un re-décodage global qui aurait cassé les accents légitimes.
- **11 « pierres tombales »** portaient la **même phrase de 154 o** répétée à l'identique. Réduites par **égalité de chaîne entière** — une entrée qui déviait d'un seul mot portait un détail que le roadmap ne redonne pas, et n'a pas été touchée.

> **Aveu de procédé, parce qu'il vaut mieux que la leçon.** Ma première passe de compaction des pierres tombales coupait « à la première phrase » par expression régulière. Or `Edge.countdown` contient un point : la coupe a frappé **23 entrées au lieu de 11** et détruit du contenu réel dans dix d'entre elles, dont **KR-062**, qui portait une règle de domaine de `CLAUDE.md`. Détecté en comparant chaque entrée à `HEAD`, réparé en **repartant de `HEAD`** plutôt qu'en rattrapant le dégât. **Une compaction se vérifie entrée par entrée contre la version d'origine, jamais au total d'octets** — le total était juste, et le fichier était abîmé.

**Dette d'it4 soldée** : la convention de mesure est écrite dans `docs/WORKFLOW.md` — on mesure **les octets en LF**, ceux que quelqu'un a tapés. Le couple toujours-chargé pesait ~480 o de CRLF que personne n'a écrits, assez pour simuler un dépassement. Le couple étant à saturation, la clause en a **remplacé** d'autres : 46 065 o en LF pour un plafond de 46 080.

## 10 — `RETOUR-COMITÉ`

1. **Une garde se relit comme du code : son prédicat peut déborder son commentaire.** Deux fois dans le même fichier. La garde KR-217 interdisait le module entier au nom d'un motif qui ne portait que sur `errors` ; la garde de section écrivait « racine ≠ section », vrai par **coïncidence** sur neuf sections et insatisfiable sur la dixième. **Quand un test est un proxy commode d'un invariant sémantique, écrire l'invariant dans le commentaire ne suffit pas — il faut vérifier que le prédicat le couvre.**
2. **Un rôle qui lit une table n'a pas lu la sortie.** Les trois affirmations réfutées cette itération l'ont toutes été de la même façon : quelqu'un a exécuté et regardé la chaîne. **Le comité raisonne bien et mesure mal** — c'est constant depuis it3, et c'est pourquoi l'orchestrateur mesure désormais **avant** le cadrage.
3. **Une relaxation de garde ne s'achète pas par anticipation.** Trois rôles sur cinq voulaient réécrire la garde d'it3 « puisqu'elle cassera un jour ». La mesure a montré qu'elle ne cassait **pas aujourd'hui**, et qu'il existait une garde **strictement supérieure** à poser à côté. La bonne question n'était pas « faut-il la corriger ? » mais « **qu'est-ce que la corriger achète maintenant ?** ».
4. **Une décision se compacte en relisant son verdict, jamais en coupant une chaîne.** Ma coupe automatique « à la première phrase » a échoué **trois fois, pour trois raisons sans rapport** : un point dans un identifiant (`Edge.countdown`), un point dans une abréviation (`par ex.`), et une entrée où **la première phrase était l'erreur et la seconde la correction** — elle a gardé une accusation contre un agent et jeté la rétractation que l'humain avait lui-même dictée, sous une étiquette `CORRIGE`. Aucune règle mécanique ne distingue ces trois cas.
5. **Un contrôle d'intégrité qui compte ne voit pas une entrée mutilée.** Elle est présente, comptée, et porte un renvoi vivant : elle passe tous les compteurs, et le total d'octets est juste pendant que le fichier est abîmé. La seule question qui l'attrape est **par entrée et sémantique** — « la phrase qui reste porte-t-elle encore la décision et son objet ? ». La sonde écrite pour la poser (parenthèses déséquilibrées, corps coupé, étiquette sans verdict) a été passée sur **toutes** les features et a trouvé, en prime, une dette déjà soldée qui traînait encore dans les questions ouvertes.
6. **La valeur annoncée d'une itération se mesure aussi.** Le cadrage, le PM et moi défendions « sans réimporter ». Les dix sites avaient déjà une affordance ; le vrai gain était la **portée**. Une phrase de démo non mesurée survit jusqu'à la revue, où elle devient le titre du CHANGELOG.
