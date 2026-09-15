# Mesure de l'orchestrateur — itération 5

Faite **avant** le cadrage, puis complétée pendant le tour 1. Fait foi sur les chiffres.

## 1 — Zéro avertissement sur tout dossier que le dépôt possède

`validateDossier` exécuté (sonde jetable, créée puis supprimée, arbre vérifié propre) :

| Dossier | `ok` | `errors` | `warnings` |
|---|---|---:|---:|
| `dossier-minimal.json` | `true` | 0 | **0** |
| `dossier-reference.json` | `true` | 0 | **0** |
| `construireAmorce()` — dossier neuf | `true` | 0 | **0** |

**La démo ne se montre sur aucun dossier du dépôt.** C'est le fait majeur de l'itération, et il a été porté au cadrage comme question de **valeur**, sur le terrain de veto du PM.

## 2 — Les quatre codes sont TOUS atteignables, chacun par une mutation d'UN SEUL champ

| Code | Mutation qui le déclenche | Vérifié |
|---|---|---|
| `texte-trop-long` | `canon.mj.synopsis_mj` au-delà du budget | ✅ |
| `revelation-sans-porte` | `savoirs[0].revele_si = {}` | ✅ |
| `condition-sans-expr` (famille D1) | une **fin** : `condition_texte` rempli, `condition_expr` retiré | ✅ |
| `condition-sans-expr` (`si_bloque`) | `si_bloque` rempli, `duree` retirée | ✅ |

## 3 — DIX sites d'avertissement, QUATRE sections, aucun ambigu

`canon.mj` · `canon.partage` → **canon** · `charpente.jalons[].enonce_texte` → **jalons-fins** · `monde.conditions.climat[].manifestation` → **conditions** · `canon.objectifs[].reussi_si_texte` · `…echoue_si_texte` → **canon** · `charpente.fins[].condition_texte` → **jalons-fins** · `monde.personnages[].contre_mesures[].declencheur_texte` · `savoirs[].revele_si` · `plan_actions[].si_bloque` → **personnages**.

## 4 — ⚠ LE POINT DUR : deux phrases du dépôt en tension frontale

- `issues.ts` documente `DossierIssue.path` : « Chemin JSON stable — **le contrat que n° 7 consomme pour badger une section** ».
- **KR-219** : « la section d'un contrôle est **DÉCLARÉE** par la règle qui le produit, **jamais dérivée de son path** » — motif : une table `path → SectionId` serait « une **SECONDE vérité** à tenir en phase avec `SECTIONS` ».

Or un `DossierIssue` **ne porte aucune section** — seulement `code`, `severity`, `message`, `location`, `path`, `entityId?`. **L'une des deux phrases devra être amendée**, et c'est au tech-lead de dire laquelle.

## 5 — LA RÉSERVE DU PM, MESURÉE : ces états sont l'ÉTAT PAR DÉFAUT du formulaire

Le PM a posé la bonne question au tour 1 — *ces états sont-ils atteignables par le FORMULAIRE réel, pas seulement par une mutation JSON de test ?* Relevé :

**Les cinq champs porteurs sont tous édités par des panneaux livrés** : `si_bloque`/`duree` → `BlocPlanActions.tsx` · `condition_texte`/`condition_expr` → `FicheFin.tsx` · `revele_si` → `BlocSavoirs.tsx` · `reussi_si_texte` → `ObjectifsCanon.tsx` · `synopsis_mj` → `PanneauCanon.tsx`.

**Et les composants répondent eux-mêmes, dans leur propre JSDoc :**

- `FicheFin.tsx` l. 15 : « **`condition_texte` est le SEUL champ `CHAMPS_REQUIS`** (KR-214) » — et l. 40 décrit nommément l'état « `condition_texte` renseigné **sans** `condition_expr` ».
- `BlocPlanActions.tsx` l. 87 : « **`duree === undefined` rend l'affordance pointillée** » — un état de premier rang, avec son rendu dédié.

> **Conclusion, et elle inverse la lecture du § 1** : les deux états qui déclenchent `condition-sans-expr` ne sont pas seulement atteignables au formulaire, **ils en sont l'ÉTAT PAR DÉFAUT**. Un auteur qui écrit une fin ou une étape bloquée à l'écran produit cet avertissement **jusqu'à ce qu'il revienne câbler le jumeau structuré**. L'avertissement n'est donc pas rare : c'est **l'état intermédiaire normal de l'écriture**.
>
> Ce que le § 1 mesure vraiment, ce n'est pas que la règle soit morte — c'est que **les deux fixtures du dépôt sont finies**, ce qu'un dossier d'auteur en cours n'est jamais.

## 6 — Les quatre affirmations du narratif (tour 1), TOUTES vérifiées

**(a) Les `path` des avertissements portent des indices RÉELS.** `validate.ts` l. 199 : `path: \`${path}[${index}]\``. Donc `charpente.jalons[0].enonce_texte`, là où `DESTINATION_DES_CHAMPS` efface les indices (`charpente.jalons[].enonce_texte`). **Grammaires différentes.**

**(b) Trois des dix sites ne sont clés de RIEN.** `canon.mj`, `canon.partage`, `monde.personnages[].savoirs[].revele_si` : **zéro occurrence** dans `DESTINATION_DES_CHAMPS` — ce sont des **conteneurs**, la table n'indexe que des feuilles.

→ **Conséquence, et c'est le narratif qui la porte parce que c'est SA garde** : le test d'it1 « les path sont des clés de `DESTINATION_DES_CHAMPS` » **rougirait sur 8 sites sur 10** si l'on mappait `DossierIssue.path` verbatim. La garde **s'amende** (clé, ou préfixe strict normalisé sur séparateur), elle **ne se retire pas** — et `DESTINATION_DES_CHAMPS` **ne bouge pas**, la feature ayant juré de n'ouvrir aucun lot contrat dessus.

**(c) Le trou de KR-222 est réel, et PROPRE AUX OBJECTIFS.** `condition-sans-expr` ne tire **que si le jumeau prose est non vide**. Or `canon.objectifs[].reussi_si_texte` est `TEXTE_OPTIONNEL_LIBRE` (`couverture.test.ts` l. 318) tandis que `charpente.fins[].condition_texte` est **requis** (`tables.ts` l. 137). Donc :
- objectif **sans `_expr` mais avec prose** → l'avertissement part ✅ (le cas que KR-222 décrit) ;
- objectif **sans `_expr` ET sans prose** → **silence total**, indistinguable de « `_expr` présent et atteignable ».

**KR-222 est vrai pour les objectifs que l'auteur a commencé à rédiger, et faux pour les autres** — et c'est justement sur un objectif à peine posé que le trou s'ouvre. Le texte de KR-222 devra être **amendé**, pas seulement cité.

**(d) La remédiation contredirait la pastille.** `issues.ts` l. 122 : `'texte-trop-long': "↪ Resserrez le texte si possible ; ce n'est pas bloquant."` — cette demi-phrase parle du **canal `warning`** et se retrouverait **à côté d'une pastille ALERTE**. Défaut mesurable, pas une nuance de style.

## 7 — ⚠ QUATRIÈME faiblesse de mon cadrage, relevée par le narratif

Mon § 8 écrivait : « **aucun ne peut être `bloquant` par construction — ce sont des `warning`** ». C'est **la confusion d'axes que KR-217 existe précisément pour interdire** : `severity` dit si le *document* s'écrit, `niveau` si l'*aventure* se joue. Un `warning` promu `bloquant` serait parfaitement cohérent.

**Le verdict est bon (zéro `bloquant` à it5), le motif est faux.** Motif juste, à substituer : *aucun de ces dix sites, **pris seul**, ne rend l'aventure injouable* — les règles de **collection** qui le feraient (toutes les fins sans `_expr`) sont la charge d'it6.

> **Laisser l'ancien motif interdirait à it6 d'écrire la règle bloquante qu'elle doit écrire.** Un motif faux ne se contente pas de céder devant un contradicteur : il contraint les itérations suivantes.

## 8 — ⚠ LA GARDE D'IT3 ENCODE UNE COÏNCIDENCE, PAS SON INVARIANT

Le tech-lead avertit (tour 1) que le témoin `NEUVES` ne doit pas être un site `canon.*`. **La mesure dit plus que ça, et le « plus » change ce que le plan doit écrire.**

`controles.test.ts` l. 241 boucle sur **chaque** constat du témoin :

```ts
expect(`${id} · ${constat.path} → ${constat.path.split('.')[0] !== constat.section}`).toBe(`${id} · ${constat.path} → true`)
```

Appliqué aux dix sites du § 3 :

| Sites | Racine du `path` | Section | Prédicat |
|---|---|---|---|
| `canon.mj`, `canon.partage`, `canon.objectifs[].reussi_si_texte`, `…echoue_si_texte` | `canon` | `canon` | **ÉCHOUE — 4 sites sur 10** |
| les six autres | `charpente` / `monde` | `jalons-fins` / `conditions` / `personnages` | ok |

**Et la cause n'est pas un choix malheureux de témoin — elle est dans `sections.ts` :**

| Section | `cle` |
|---|---|
| **`canon`** | **`canon`** ← **aucun point** |
| les neuf autres | `charpente.depart`, `monde.personnages`, `monde.lieux`, `monde.objets`, `monde.indices`, `monde.quetes`, `monde.evenements`, `monde.conditions`, `charpente.jalons · charpente.fins` |

> **`canon` est la SEULE des dix sections dont la `cle` n'a pas de point** — la seule où l'identifiant de section et la clé de premier niveau du dossier sont la même chaîne. Pour elle, « racine du `path` ≠ section » est **structurellement insatisfiable**, pas difficile.

**Conséquence.** L'invariant que la garde veut tenir est *« la section est déclarée, jamais dérivée »*. Le prédicat qu'elle écrit est *« la racine du `path` diffère de la section »* — un **proxy** valide seulement là où les deux **peuvent** différer. Il a tenu à it3 parce qu'aucune des cinq règles ne produit de constat enraciné dans `canon` ; il ne tient pas parce qu'il est vrai.

**Ce que le plan doit donc trancher, et que « choisis un autre témoin » ne tranche pas** : une itération qui déclarera un jour `section: 'canon'` sur un `path` en `canon.*` — le geste le plus naturel qui soit — fera rougir cette garde **en étant correcte**. Contourner par le choix du témoin masque la question d'un cran ; c'est exactement le report qu'une garde mal écrite rend gratuit.

*(Trois des quatre codes offrent un témoin valide : `revelation-sans-porte` → `monde.…savoirs[].revele_si`, `condition-sans-expr` → `charpente.fins[].condition_texte` ou `monde.…plan_actions[].si_bloque`. **Le seul qui échoue est `texte-trop-long` via `canon.mj.synopsis_mj`** — c'est-à-dire la mutation d'un seul champ la plus simple du § 2. Le piège est sur le chemin le plus court.)*

## 9 — LES CHAÎNES RÉELLES, produites et lues (sonde jetable, supprimée, arbre + `tsc` vérifiés)

Le tour 1 s'est **contredit frontalement** sur le `message`, et aucune des deux notes ne l'avait produit. Je l'ai produit.

| Mutation d'un seul champ | `code` · `path` | `message` **réellement rendu** |
|---|---|---|
| `canon.mj.synopsis_mj` ×601 mots | `texte-trop-long` · `canon.mj` | « Le canon compte **601** mots ; le budget conseillé est de 600. » |
| `savoirs[0].revele_si = {}` | `revelation-sans-porte` · `monde.personnages[0].savoirs[0].revele_si` | « Le savoir « indice.lettre-de-la-vigie » n'a aucune condition de révélation (ni confiance, ni jet, ni contrepartie, ni indice préalable) : il ne sera jamais dévoilé automatiquement. » |
| `fins[0]` perd `condition_expr` | `condition-sans-expr` · `charpente.fins[0].condition_texte` | « Le champ « **condition_texte** » décrit une condition en prose, mais aucune condition structurée correspondante n'est posée… » |
| `plan_actions[0]` : `si_bloque` posé, `duree` retirée | `condition-sans-expr` · `monde.personnages[0].plan_actions[0].si_bloque` | « Le champ « **si_bloque** » dit ce que joue le personnage si l'étape est bloquée, mais **aucune durée n'est posée**… » |

### 9.1 — R7 du tech-lead est faux sur 5 sites sur 10

R7 rejette la réécriture des messages au motif que « `DossierIssue.message` est **déjà une phrase française rédigée** ». **Vrai pour deux codes, faux pour `condition-sans-expr` :** ses messages portent une **clé JSON dans la prose lue par l'auteur** — « Le champ « `condition_texte` » », « Le champ « `si_bloque` » ». `controles.ts` l'interdit dans sa propre docstring (« aucun terme interne n'y entre »). **Le narratif avait raison, et il l'avait lu dans la source ; R7 a été écrit sans la chaîne sous les yeux.**

### 9.2 — Fait que NI l'un NI l'autre n'a vu : les deux messages `condition-sans-expr` DIVERGENT DÉJÀ

Même `code`, deux phrases différentes : la fin parle de « condition structurée », `si_bloque` parle d'« aucune **durée** ». **`validate.ts` écrit donc déjà un message par SITE, pas par code.** La table à dix lignes ne crée pas cette granularité — elle la **rattrape**.

### 9.3 — La remédiation partagée est FAUSSE à l'un des deux sites mesurés

Les deux sites reçoivent la **même** consigne : *« ↪ Ajoutez la condition structurée correspondante si le moteur doit la vérifier… »*. Sur `si_bloque`, ce qui manque n'est **pas** une condition structurée : c'est une **`duree`**, le message le dit lui-même deux lignes plus haut. **La consigne contredit son propre message.**

> **Conséquence sur l'arbitrage UX.** La note UX conclut « **reprendre tels quels**, vérifié mot pour mot », après avoir vérifié que ces textes ne disent pas « réimportez-le » — ce qui est exact. Mais la question n'était pas seulement celle-là : sur les deux sites mesurés d'un même code, **une** consigne est **inexacte**. L'UX n'a pas eu tort de vérifier ; elle a vérifié **un** défaut possible sur trois.

### 9.4 — Le registre des cinq règles livrées, mesuré (et la garde citée est plus étroite qu'annoncée)

Consignes réellement rendues sur `dossier-reference.json` :

- « **Donnez** une présence dans ce lieu à au moins un personnage (Personnages → Présence), ou changez le lieu de départ (Départ). »
- « **Ajoutez** au moins une présence à ce personnage — un lieu, et si besoin un moment (Personnages → Présence). »
- « **Écrivez** une ou deux répliques telles qu'il les dirait (Caractère exploitable → Manière de parler). »
- (amorce) « **Rédigez** … »

**Verbe nu à l'impératif, zéro `↪`, et le chemin d'écran entre parenthèses.** Le registre que le tech-lead invoque en R8 **existe** et est uniforme.

**Correction à sa citation, en revanche** : `controles.test.ts` l. 676 n'épingle `startsWith('Rédigez')` que sur la fixture `seme()` / `CHAMPS_SEMES`, c'est-à-dire **la seule règle d'amorce**. Les quatre autres ne sont épinglées par aucune garde de registre. **R8 est juste sur le fond et faux sur son instrument** — et il n'existe donc, aujourd'hui, aucun test qui empêcherait un `↪` d'entrer dans le rapport.

## 10 — LA GARDE KR-217 INTERDIT PLUS QUE CE QUE SON PROPRE COMMENTAIRE MOTIVE

Le QA rapporte exactement, vérifié mot pour mot (`controles.test.ts` l. 336-342) :

```ts
it('le rapport ne passe jamais par le canal errors ou warnings du validateur', () => {
	// Un dossier PERSISTÉ ne porte jamais d'anomalie `error` (KR-225) : brancher
	// ce rapport sur ce canal allumerait un voyant qui ne peut pas s'allumer, et
	// ferait rougir les suites qui épinglent déjà ce canal (KR-217).
	expect(SOURCE_CONTROLES).not.toContain('validateDossier')
	expect(SOURCE_CONTROLES).not.toContain("from './validate'")
})
```

**Le motif écrit et l'assertion écrite n'ont pas la même portée.**

- Le **commentaire** motive par le canal **`error`** : un voyant qui ne peut pas s'allumer, parce que KR-225 refuse la persistance d'un dossier porteur d'`errors`. **Ce motif est juste, et il ne vaut que pour `errors`.**
- L'**assertion** interdit **le module entier** — donc aussi `warnings`. Or `warnings` est précisément le canal que KR-225 **autorise explicitement** à survivre à la persistance (le PM le relève au tour 1, et mon § 5 le mesure : ces états sont l'état par défaut du formulaire).

> **La garde interdit donc de lire le seul canal dont tout l'intérêt est qu'il survit à la persistance** — au nom d'un argument qui ne porte que sur l'autre.

**C'est la DEUXIÈME garde de ce fichier dont le prédicat écrit déborde l'invariant de son commentaire** (la première est au § 8 : « racine du `path` ≠ section », vraie par coïncidence). Ce n'est pas un hasard de rédaction : les deux gardes sont des **balayages de source ou de forme**, écrits comme des proxys commodes d'un invariant sémantique. Un proxy ne se relit pas tout seul.

**Conséquence, et elle donne au remplacement sa forme exacte** : la garde ne se supprime pas et ne se conserve pas — elle **rétrécit sur son propre motif**. Interdire `.errors`, autoriser `.warnings`. C'est ce que le QA propose en critère 4, et c'est ce que le commentaire disait déjà.

## 11 — LE COÛT, CHIFFRÉ (le tech-lead le posait « déduit de la lecture, non exécuté »)

Sonde jetable, supprimée, arbre vérifié. Node/jest à JIT chaud — **pas** des chiffres de navigateur ; l'ordre de grandeur et le **rapport** sont ce qui se lit, pas la décimale.

| Appel | `dossier-reference.json` (**15 832 o**) | `dossier-minimal.json` |
|---|---:|---:|
| `controlerDossier` seul (aujourd'hui) | **0,018 ms** | 0,004 ms |
| `validateDossier` seul | **0,743 ms** | 0,369 ms |
| les deux (coût après it5) | **0,768 ms** | — |

**Le clone et le gel que le tech-lead déduisait existent** : `validate.ts` l. 837, `deepFreeze(JSON.parse(JSON.stringify(input)))`, sur le dossier entier — et seulement si `ok`.

### Ce que le chiffre dit, et ce qu'il ne dit pas

> **`validateDossier` coûte 41 fois `controlerDossier`.** Le rapport passe de 0,018 à 0,768 ms : **×43**.
>
> **En absolu, ce n'est rien** : 2 appels par rendu d'écran ⇒ ~1,5 ms, soit moins d'un dixième d'une trame à 60 Hz. **Le RISQUE du tech-lead est réel en facteur et négligeable en millisecondes** — les deux à la fois, et il faut écrire les deux.

**Ce que ça change à deux rejets :**

- **R3 (quatre entrées de registre) se durcit, et passe de l'argument de principe au chiffre.** Quatre entrées ⇒ 8 validations par rendu ⇒ **8 × 0,743 ≈ 5,9 ms**, plus du tiers d'une trame, pour un dossier de 13 ko. Le « dirimant à soi seul » du tech-lead **était une intuition ; c'en est maintenant une mesure**.
- **R6 (mémoïser) tient — et pour le bon motif.** À ~1,5 ms par rendu, il n'y a rien à absorber. Le dépôt avait écrit que « c'est cette mesure-là qui décidera » : **elle a décidé, et elle décide contre le cache.** C'est le premier rejet de cette itération qui repose sur un nombre plutôt que sur une doctrine.

**Réserve honnête, à ne pas escamoter** : le coût de `validateDossier` est dominé par un balayage de schéma **plus un clone JSON intégral plus un gel profond**, donc il croît avec la **taille du dossier**. 13 ko est une fixture ; une aventure écrite à la main n'a jamais été mesurée (c'est aussi le trou que le narratif signale sur le volume de lignes). **Ce que la mesure établit vaut pour la taille mesurée, et le dit.**

## 12 — LA DÉCOMPOSITION DES DIX SITES, VÉRIFIÉE AU SITE PRÈS

Le tech-lead (§ 5.1) et le narratif (PROPOSITION) ont proposé **la même** garde de totalité **sans s'être vus**. Elle mesure juste :

| Source | Sites | Lesquels |
|---|---:|---|
| `BUDGETS_DE_MOTS` (`tables.ts` l. 666) | **4** | `canon.mj` · `canon.partage` · `charpente.jalons[].enonce_texte` · `monde.conditions.climat[].manifestation` |
| `FAMILLES_DE_CONDITIONS.filter(alerteSansExpr)` | **4** | `canon.objectifs[].reussi_si_texte` · `…echoue_si_texte` · `charpente.fins[].condition_texte` · `monde.personnages[].contre_mesures[].declencheur_texte` |
| **écrits à la main dans `validate.ts`, aucune table ne les porte** | **2** | `monde.personnages[].savoirs[].revele_si` · `monde.personnages[].plan_actions[].si_bloque` |
| | **10** | ✅ |

**Le tech-lead a raison sur les deux sites isolés** : `si_bloque` n'est **pas** dans `FAMILLES_DE_CONDITIONS` — la table n'en porte que six familles, dont la sixième (`contre_mesures[].declencheur_texte`) est le **contraste documenté** de `plan_actions[].declencheur_texte`, à `alerteSansExpr: false`.

**Et l'épinglage à 4 est juste, sur un axe qu'il faut nommer** : `grep -c 'warnings.push(' validate.ts` → **4**. Ce sont **4 sites de CODE** produisant **10 sites de DONNÉES** (deux boucles sur table + deux écritures à la main). L'épinglage attrape donc exactement ce qu'il vise : **un cinquième emplacement écrit à la main**, que les deux balayages de registre ne verraient jamais. Il n'attrape pas une cinquième ligne de table — c'est le balayage qui s'en charge. **Les deux gardes sont complémentaires et aucune n'est redondante.**

## 13 — DEUX CHIFFRES POUR L'ÉTAPE DOC (pas pour l'arbitrage)

- **`src/features/dossier-controles/specification.json` = 65 915 o, plafond 66 560 : il reste 645 o.** Ce fichier a franchi son plafond **deux fois dans un seul lot** à it4. La compaction est à prévoir **dans le lot de doc d'it5**, pas au suivant.
- **Le couple `CLAUDE.md` + `docs/WORKFLOW.md` = 46 454 o pour un plafond de 46 080** — au-dessus. Mais l'écart est un **artefact de fin de ligne**, et il vient d'**un seul des deux fichiers** : `CLAUDE.md` est déjà en LF (écart 0), `docs/WORKFLOW.md` est en CRLF et pèse **480 o** de plus que son contenu. Le couple mesure **45 974 o en LF**, soit **sous** le plafond, avec 106 o de marge. ~480 octets que personne n'a tapés. **Dette portée depuis it4** : écrire la convention de mesure (LF, les octets réellement tapés) dans `docs/WORKFLOW.md` — en **remplaçant** du texte, jamais en en ajoutant, puisque ce couple est à saturation délibérée.

## 14 — LES « LIGNES JUMELLES » : le fait central du narratif au tour 2 est FAUX ; sa version étroite est VRAIE

Le narratif fonde son RISQUE et son OBJECTION du tour 2 sur ceci : *« `location` vaut « Personnages » (×3), « Objectifs » (×2)… deux personnages dont l'étape manque sa `duree` produisent **deux lignes identiques dans leurs trois étages** »*, d'où sa proposition de **déclarer les dix `location`**. Il invite à le réfuter. **Je le réfute — sonde exécutée, supprimée, arbre vérifié.**

### 14.1 — `location` NOMME L'ENTITÉ. Ce n'est pas un seau.

Trois personnages, même manque, mêmes trois étages attendus :

```
location="Personnage « Sélène la Vigie »"       path=monde.personnages[0].plan_actions[0].si_bloque
location="Personnage « Corvin le Marchand »"    path=monde.personnages[1].plan_actions[0].si_bloque
location="Personnage « Mira la Guérisseuse »"   path=monde.personnages[2].plan_actions[0].si_bloque
```

**Les trois lignes sont parfaitement distinguables, et c'est `location` qui les distingue.**

**D'où vient l'erreur** : `FAMILLES_DE_CONDITIONS[].location` vaut bien `'Personnages'` dans `tables.ts` — mais `validate.ts` ne passe **jamais** ce champ-là à `anomalie` : il passe **`site.location`**, résolu par entité. Le narratif a lu la table, pas la sortie. **C'est exactement la classe BUG-084 qu'il cite lui-même deux fois dans sa note.**

Et les deux canons, qu'il donne pour identiques :

```
location="Canon (MJ)"        msg="Le canon compte 700 mots ; le budget conseillé est de 600."
location="Canon (partagé)"   msg="Le canon compte 700 mots ; le budget conseillé est de 600."
```

**Les messages sont bien identiques — il a raison là-dessus — et `location` les sépare.** C'est précisément l'étage OÙ qui fait le travail.

> **Conséquence : sa PROPOSITION (« dix `location` DÉCLARÉES ») est à REJETER, et pas seulement comme inutile.** Déclarer `location` **remplacerait un nom d'entité résolu à l'exécution par un seau écrit à la main**. Elle dégraderait l'étage OÙ au lieu de le réparer, et rouvrirait la panne que `localiserEntite` existe pour fermer. **`location` se reprend tel quel — c'est déjà le registre que `controles.ts` documente**, « le repère que l'auteur cherche en premier ».

### 14.2 — Ce qui RESTE vrai, mesuré, et bien plus étroit

Deux étapes **du MÊME personnage**, toutes deux sans `duree` :

```
location="Personnage « Sélène la Vigie »"   path=monde.personnages[0].plan_actions[0].si_bloque
location="Personnage « Sélène la Vigie »"   path=monde.personnages[0].plan_actions[1].si_bloque
```

**Là, les deux lignes sont indistinguables** : même OÙ, même QUOI (message constant), même pastille, même destination. Seul le `path` diffère, et **le `path` n'est pas rendu**.

**Le périmètre exact n'est donc pas « 7 sites sur 10 » : c'est « N éléments d'une même collection sous une même entité parente ».** Deux étapes du même personnage, deux objectifs, deux fins, deux jalons. Sur le dossier de référence, **aucun personnage ne porte deux étapes** — j'ai dû en dupliquer une pour produire le cas.

Et `entityId` est bien **absent partout** (les quatre `push` passent cinq arguments, jamais six) : le narratif a raison sur ce point, mais **ce n'est pas `entityId` qui manquait à la distinction — c'est le rang dans la collection**, que ni `entityId` ni `location` ne portent.

### 14.3 — Ce que j'en fais

- **REJETÉ** : « déclarer les dix `location` » — mesuré contre-productif (14.1).
- **RETENU comme limite nommée**, à écrire aux `open_questions` sous le nom du narratif (**« deux lignes jumelles, aucune n'est désignable »**) avec le **périmètre corrigé** : plusieurs éléments d'une même collection sous une même entité. Propriétaire : le premier lot qui ouvrira `validate.ts`.
- **RETENU** : son point (d) du relevé `volume_mesure` — compter les **lignes indistinguables entre elles** — est bon, et le reste même une fois le périmètre rétréci.

**Ce que la mesure ne dit pas** : je n'ai pas mesuré les sites `jalons`, `climat`, `objectifs`, `fins` ni `contre_mesures`. Je n'affirme donc rien sur la forme exacte de leur `location` — seulement que le mécanisme (`site.location`, résolu par entité) est le même pour les dix.

## 15 — LA GARDE D'IT1 : 7 sites passent tels quels, 3 sont des PRÉFIXES STRICTS (jamais des orphelins)

`DESTINATION_DES_CHAMPS` porte **97 clés**. Les dix sites, **après normalisation par `cheminDeTable`** :

| Site (chemin de table) | clé ? | préfixe strict de |
|---|:--:|---|
| `charpente.jalons[].enonce_texte` | ✅ | — |
| `monde.conditions.climat[].manifestation` | ✅ | — |
| `canon.objectifs[].reussi_si_texte` | ✅ | — |
| `canon.objectifs[].echoue_si_texte` | ✅ | — |
| `charpente.fins[].condition_texte` | ✅ | — |
| `monde.personnages[].contre_mesures[].declencheur_texte` | ✅ | — |
| `monde.personnages[].plan_actions[].si_bloque` | ✅ | — |
| `canon.mj` | ❌ | **1** clé (`canon.mj.synopsis_mj`) |
| `canon.partage` | ❌ | **1** clé (`canon.partage.accroche_joueur`) |
| `monde.personnages[].savoirs[].revele_si` | ❌ | **6** clés (`…revele_si.confiance_min`, `…revele_si.jet.carac`, …) |

**Sept sur dix passent la garde d'it1 sans amendement ; les trois autres sont des conteneurs, et aucun n'est orphelin** — chacun a au moins une feuille dans la table. Le prédicat amendé du tech-lead (garde ⑥) les couvre **tous les trois**, et son point final n'est pas décoratif.

**Réconciliation de deux chiffres qui paraissaient se contredire** : le narratif écrivait « la garde rougit sur **8 sites sur 10** », le tech-lead « **trois** ne sont pas des clés ». **Les deux sont vrais dans leur cadre** — 8/10 sur les `path` **bruts** (qui portent les indices réels : `charpente.jalons[0].enonce_texte` n'est clé de rien), 3/10 une fois **normalisés** par `cheminDeTable`. C'est la normalisation qui fait passer 8 à 3, et c'est exactement ce qu'elle est là pour faire.

**Vérifié aussi** : `controles.ts` ne contient **aucun** `split(` aujourd'hui — la garde universelle du tech-lead (`not.toContain("split('.')")`) est posable telle quelle, et `cheminDeTable` (un `replace`) ne l'enfreint pas.

## 16 — LA RELAXATION DE LA GARDE D'IT3 N'ACHÈTE RIEN À IT5 (mesuré)

Désaccord du tour 2 : **tech-lead + narratif** veulent réécrire la garde ici (universelle → existentielle par règle) ; **QA** veut la documenter sans toucher la couverture des cinq règles livrées.

**Le témoin proposé, exécuté sur `dossier-minimal.json` :**

```
cloneSansPorte()  →  ok=true  errors=0  warnings=1
  code=revelation-sans-porte   path=monde.personnages[0].savoirs[0].revele_si
  chemin de table=monde.personnages[].savoirs[].revele_si   racine=monde   section=personnages
```

> **Un seul avertissement, et sa racine (`monde`) diffère de sa section (`personnages`).** Le témoin de la règle neuve **satisfait le prédicat UNIVERSEL tel qu'il est écrit aujourd'hui.**

**Donc la relaxation « chaque constat » → « au moins un constat » ne fait rien passer qui ne passerait déjà.** Elle est purement anticipatoire — elle prépare une itération future qui déclarerait `section: 'canon'`. Et elle a un coût réel, que le QA nomme justement : aujourd'hui, **tous** les constats des cinq règles livrées satisfont le prédicat ; après, **un seul par règle** devrait le faire.

**Arbitrage, et il ne départage pas des opinions — il suit la mesure :**

| Proposition | Statut | Motif |
|---|---|---|
| Relaxer universel → existentiel dans it5 | **REJETÉ** | Coûte de la couverture sur cinq règles livrées pour n'acheter **rien de mesuré** à it5. |
| Ajouter la garde de source `not.toContain("split('.')")` | **RETENU** | C'est l'invariant lui-même, pas son proxy ; elle couvre **`canon` compris**, coûte zéro couverture, et `controles.ts` ne contient aucun `split(` aujourd'hui (vérifié). Elle est **strictement supérieure** au prédicat qu'on proposait de relâcher pour l'obtenir. |
| Documenter la limite `canon` au-dessus de la garde + entrée `known_risks` | **RETENU** | Exigence ferme du QA, coût nul, fichier déjà ouvert. Sans elle, la garde punira la bonne réponse et sera lue comme un défaut du code. |

**Ce que cet arbitrage préserve du narratif** : sa crainte — « livrer une table et, dans le même diff, une garde qui en réfute le quart » — est réelle mais **mal située**. La garde ne réfute aucune ligne de la table : elle contraint le choix du **témoin**, qui est un dossier, pas une ligne. Les quatre lignes `canon.*` sont déclarées, testées par la totalité (critère 3) et rendues comme les six autres.

**Ce que la mesure ne dit pas** : elle ne dit pas que la relaxation sera inutile à it6. Elle dit qu'elle est inutile **maintenant**, et qu'une garde ne se relâche pas par anticipation.

## 17 — LES DIX SITES ONT DÉJÀ UNE AFFORDANCE EN PLACE. La valeur d'it5 est l'AGRÉGATION, pas la révélation

L'UX signale au tour 2 que `PanneauConditions` lit déjà `validateDossier().warnings`. **C'est vrai, et c'est plus large que ça : quatre sites de feature le font**, plus un cinquième qui atteint le même seuil autrement. Relevé complet :

| Sites | Surface qui les montre déjà | Portée | Source |
|---|---|---|---|
| **1, 2** `canon.mj` · `canon.partage` | `PanneauCanon.tsx` — compteur de mots qui passe en `var(--bad)` au-delà de `BUDGET_MOTS_CANON` | le champ édité | **pas** `validateDossier` : `compterMots(...) > BUDGET_MOTS_CANON`, et sa JSDoc l. 64-66 dit que l'accord à la borne est **épinglé par un test** (600 → `warnings: []`, 601 → `texte-trop-long`) |
| **3** `jalons[].enonce_texte` | `PanneauJalonsFins.tsx` l. 212 | **le jalon affiché seulement** | `validateDossier().warnings`, filtré à l'index |
| **4** `climat[].manifestation` | `PanneauConditions.tsx` l. 237 | **le climat affiché seulement** | idem |
| **5, 6** `objectifs[].reussi_si_texte` · `…echoue_si_texte` | `ObjectifsCanon.tsx` l. 154 | **tous les objectifs** (préfixe `canon.objectifs`, sans index) | idem |
| **7** `fins[].condition_texte` | `PanneauJalonsFins.tsx` l. 216 | **la fin affichée seulement** | idem |
| **8, 9, 10** `contre_mesures[]` · `savoirs[].revele_si` · `plan_actions[].si_bloque` | `useSocleEcriturePersonnages.ts` l. 100 | **le personnage affiché seulement** | idem |

### 17.1 — Ce que ça change à la doctrine (C5 devient presque sans objet)

> **Lire `validateDossier().warnings` en ligne au rendu est déjà la pratique établie du dépôt, à QUATRE endroits de features**, chacun avec une JSDoc qui l'assume au nom de KR-013/113/189 (« dérivés, jamais un état semé une fois »).

La garde d'it3 qui interdit l'import dans `controles.ts` n'était donc pas la règle du dépôt — c'en était **l'exception**, et son commentaire le disait déjà (§ 10 : le motif ne porte que sur `errors`). **C5 n'introduit rien de neuf ; il aligne `controles.ts` sur ce que quatre features font déjà.**

### 17.2 — Ce que ça change à l'argument de VALEUR (et c'est le point important)

Le cadrage et le PM défendaient l'itération sur « l'auteur le voit sans réimporter ». **C'est vrai mais ce n'est pas le gain principal, et la mesure le montre : l'auteur voyait déjà les dix, chacun sur son écran.**

**Le gain réel, mesuré, est l'AGRÉGATION et la PORTÉE** : sept des dix sites ne se montrent que pour **l'entité affichée**. Pour savoir si un seul de ses douze personnages a une contre-mesure non armée, l'auteur doit **ouvrir les douze fiches une par une**. Le rapport est la première surface qui répond sans parcourir.

**Corollaire pour la phrase de démo** : « le voit dans son rapport sans réimporter » est **exact mais sous-vend**. La formulation juste est *sans ouvrir chaque fiche*. Je le porte à l'arbitrage — c'est une correction de fond, pas de style, et elle vient d'une mesure que le PM n'avait pas.

### 17.3 — Contrôle de cohérence sur la table des niveaux : elle ne se dérive PAS de ça

Si « a déjà une affordance en place » était le discriminant, les sites 5, 6, 7, 8 seraient `info` — ils sont `alerte`. **Le discriminant du narratif (conséquence de jeu) est donc bien indépendant de la couverture de surface**, et la table n'est pas une dérivation déguisée. La corrélation ne tient qu'aux extrêmes, et l'argument de l'UX sur le site 4 reste valide comme *renfort*, jamais comme motif.

### 17.4 — Ce que ça ne change pas

- **R1 tient.** Ces quatre lectures servent une affordance **locale**, filtrée à l'entité éditée ; aucune ne construit un second rapport ni ne recalcule `parSection`.
- **Le veto du narratif (rejet 3) tient.** `PanneauCanon` est bien un second calcul du même seuil — mais c'est un **compteur d'affichage épinglé par un test**, pas une règle de linter, et il est hors du périmètre d'it5.
- **M7 se nuance sans se retourner** : selon le panneau affiché, il y a **déjà** un `validateDossier` par rendu. it5 fait donc passer de ~1 à ~3, pas de 0 à 2. L'ordre de grandeur (~2 ms) ne change pas.

## 11 bis — CORRECTION de ma mesure de taille (relevée par le lot contrat)

J'écrivais « 13 033 o » pour `dossier-reference.json`. **C'est faux comme taille de fichier** : j'avais mesuré `len(JSON.stringify(dossier))`, c'est-à-dire la re-sérialisation **compacte**, pas les octets sur disque.

| Ce qu'on mesure | Valeur |
|---|---:|
| **octets du fichier** (`wc -c`) | **15 832** |
| re-sérialisation compacte — *ce que j'avais écrit* | 13 033 |
| re-sérialisation avec espaces, sans indentation | 13 635 |

**Tout comparatif futur repart de 15 832 o.** Les timings du § 11 ne sont pas touchés — ils portaient bien sur ce fichier-là ; seule son étiquette était fausse.

**Sur le FACTEUR, en revanche, je maintiens ma mesure et je nuance la sienne.** Le lot annonce ×91 contre mes ×41, l'écart venant entièrement de la base pré-lot (0,0054 ms chez lui, 0,018 chez moi) : j'ai chronométré le `controlerDossier` **réel** avant le lot, il a **reproduit** les cinq règles après coup, ce qui n'est pas le même objet. Les deux mesures s'accordent sur ce qui décide : le surcoût vaut **un `validateDossier`**, et il est négligeable. **Le facteur est un énoncé de marge, jamais de risque** — c'est la formulation à retenir, et elle est de lui.
