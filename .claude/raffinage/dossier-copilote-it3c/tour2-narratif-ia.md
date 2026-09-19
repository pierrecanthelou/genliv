# Tour 2 — `narratif-ia` · `dossier-copilote` it3c

**À `tech-lead`, sur le vide.** **Ton ermite est vrai comme FAIT DU MONDE, faux comme CONTRAT.** Le test 3a se lit sur **ce que l'acceptation ÉCRIT**, pas sur ce que la liste énumère. Vérifié sur les **quatre** rôles livrés : détenteurs écrit `{indice_id, certitude}` — un handle + une valeur **posée par le code**, **zéro prose du modèle** ⇒ désignation ⇒ vide = succès. `Relation` écrit `lien` — **seul champ `ia`**. Un `{"envers":"P3"}` sans `nature` **n'écrit RIEN**. **La prose n'est pas la justification d'un choix, ELLE EST LA RELATION.** ⇒ **liste vide = REFUS `vide`, lot entier. Aucune doctrine neuve à ratifier.**

**ET MA SCALAIRE TOMBE.** J'ai moi-même jugé `relations[]` **interchangeable** (§ 2 tour 1) : **ordonné ⇒ une par lancer (3b), interchangeable ⇒ liste acceptée une par une (3a)**. Ta liste, `MAX = 3`. **Conséquence que tu n'as pas tirée** : le garde « **la borne de l'invite est celle du validateur** » (`frontiere.test.ts:354`) **s'applique** — l'invite doit porter littéralement `trois au plus`. `max_tokens` re-dérivé : **700**.

**Porteur hors rangs — VETO, et ton motif ne suffit pas** : le doublon laisse `entitesInjectees === [cible, ...rangs.values()]` **VRAI** (`contexte.test.ts:543`) — **aucun instrument ne rougirait**. Ce qui décide : **`nom` n'est jamais injecté (KR-195)** — **rien ne dit au modèle que les deux blocs sont la même personne**.

**Deux ensembles — VETO sur la liste plate.** MESURÉ : `detenteurs.ts:84` vs `:111` séparent cible et candidats **par le préfixe** ; ici les deux sont `PREFIXE_PERSONNAGE`.

**VERDICT — ACCEPTÉ SOUS CONDITIONS.**

---

# ANNEXE (hors quota)

## 0. Statut de mes objections
| # | Objection | Statut |
|---|---|---|
| 1 | Sortie **scalaire**, aucune constante | **RETIRÉE** — *contredite par ma propre qualification « interchangeable » ; **3a gouverne, pas 3b***. |
| 2 | `relations[]` ne s'injecte pas | **MAINTENUE** (convergence) |
| 3 | `secret` : amender **la phrase**, jamais le prédicat | **MAINTENUE** (convergence) |
| 4 | `intensite` hors proposition | **MAINTENUE SUR LE FOND, RÉÉCRITE** — *ma phrase était fausse* (§ 3) |
| 5 | Porteur exclu des rangs | **DURCIE EN VETO** (§ 2) |
| 6 | Union étiquetée | **MAINTENUE** |
| A1 | **Deux ensembles** porteur ⊃ candidats | **DURCIE EN VETO**, forme décidable (§ 4) |
| A2 | En-tête `FICHE`, rejet de `PERSONNAGE` | **MAINTENUE**, non contestée |
| A3 | Aucun scanner de noms propres | **MAINTENUE**, argument **retourné** + substitut testable (§ 8) |
| A4 | « Aucune constante ; le garde de l'invite ne s'applique pas » | **RETIRÉE** — *conséquence de la liste : il s'applique* |
| A5 | `max_tokens: 300` | **RETIRÉE** — re-dérivé **700** |

## 1. La règle de tranchage — écrite pour être recopiable

> **DÉSIGNATION vs RÉDACTION, cas MIXTE.** Un rôle qui rend **à la fois** un jeton et de la prose se range selon **ce que l'acceptation d'un élément ÉCRIT AU DOSSIER** :
> — l'élément porte une **prose RÉDIGÉE PAR LE MODÈLE** ⇒ **RÉDACTION** ⇒ liste vide = **REFUS `vide`** ;
> — l'élément ne porte que des **handles re-résolus** et des **valeurs posées par le code** ⇒ **DÉSIGNATION** ⇒ liste vide = **SUCCÈS**.

⚠ **Le critère porte sur « rédigée par le modèle », PAS sur l'audience `'ia'`** — et c'est **le seul endroit où il peut être mal appliqué** : `savoirs[].certitude` **EST `'ia'`** alors que le rôle détenteurs, qui l'écrit, est une **désignation** (le code la pose, le modèle ne la rend jamais). **Un critère écrit « champ `ia` » classerait détenteurs en rédaction et CONTREDIRAIT UN RÔLE LIVRÉ.**

**Vérification sur les quatre rôles livrés, zéro exception** : prose ⇒ rédaction ✔ · **détenteurs ⇒ désignation ✔** · répliques ⇒ rédaction ✔ · plan ⇒ rédaction ✔ · **relations ⇒ RÉDACTION** (`lien` est du modèle).

**Asymétrie du regret** : « vide = succès » risque un **no-op silencieux** indistinguable d'un modèle paresseux **et exige un texte d'écran que personne n'a écrit** (*précédent 3a : `TEXTE_AUCUNE_REPLIQUE_PROPOSEE` a été retiré faute de producteur*). « Vide = refus » risque un `illisible` inutile sur un vrai ermite — **visible, motivé, un seul motif**.

**Ce qui reste vrai de ma phrase de tour 1, et ce qui ne l'est pas** : `aucun-candidat` répond à « y a-t-il quelqu'un d'autre **dans le dossier** », **pas** à « parmi ces huit, aucun ». **Ma phrase était trop large.**

## 2. Porteur hors des rangs — VETO, et les deux motifs ne pèsent pas pareil
- **Son motif (technique)** : vrai, **mais MESURÉ : ça ne casse rien** — l'invariant `entitesInjectees === [cible.id, ...rangs.values()]` (`contexte.test.ts:543`) est **encore satisfait** avec le doublon. **Aucun instrument ne rougirait.**
- **Mon motif (fiction)** : les deux blocs **ne portent aucun nom** (`nom` est `auteur`, KR-195). Le modèle produit `{"envers":"P3","nature":"il se méfie de lui"}` où **`P3` EST le porteur** : **une fiction fausse**, invisible au validateur (`P3 ∈ rangs` ⇒ vert) **comme à l'écran**.

**Conséquence sur son option E-4** : « lui donner son rang et le dire dans l'invite » **suppose de pouvoir le désigner**, donc son nom — **propriété de la n° 10**. **L'option n'est pas refusée par goût, elle n'est pas ouvrable en 3c.**

⚠ **CORRECTION DUE À LA QA (son scénario n° 3)** : tel qu'écrit, il **teste l'inverse de la décision**. Le scénario correct :
> **Alors** `rangs.size === N−1`, **aucun** rang ne résout `porteur.id`, **et** `entitesInjectees[0] === porteur.id`.
> *Il sépare « exclu des rangs » de « absent du contexte » — une implémentation qui oublierait le porteur entièrement satisfait la première moitié et rougit sur la seconde.*

## 3. `intensite` — ma phrase était fausse, et le lot du tech-lead est INCOMPLET
**MESURÉ** : l. **44** `seedRelation` · l. **137** `handleAjouterRelation` ← **SECOND site littéral, que son lot ne nomme pas** · l. **189-190**, seul site qui **écrit au document** : `{ cible_id, lien, intensite }` puis `if (fusion.secret) nouvelle.secret = true`.
1. **Il a raison sur le document** : persisté = `{cible_id, lien, intensite: 0}`, **`secret` ABSENT**. Sa symétrie « requis ⇒ écrit / optionnel ⇒ omis » est **confirmée par le code**.
2. **Son lot doit être étendu à la l. 137.**
3. ⚠ **Ma phrase « le copilote emprunte le MÊME chemin d'écriture » est FAUSSE, et je la retire** : `useEcritureRelationsPresence` est un hook de **`dossier-fiches`**, que `dossier-copilote` **ne peut pas importer** (isolation câblée en ESLint). **Ce qui se partage** : la **CONSTANTE** et la **FORME ÉCRITE**. ⇒ **Les deux lectures sont compatibles : son lot est juste, ma phrase ne l'était pas.**

**Scénario séparateur** : `expect('secret' in relation).toBe(false)` **et** `expect(relation.intensite).toBe(0)`. *Un `{...ajout, secret: false}` reste VERT sur `toMatchObject` et rougit ici.*

## 4. Deux ensembles — VETO sur la forme plate
**Le veto, sous forme décidable** : *une seule liste plate parcourue avec le **même** filtre de préfixe pour le porteur et les candidats.*
**MESURÉ** : `detenteurs.ts:84` filtre la cible sur `PREFIXE_INDICE`, `:111` les candidats sur `PREFIXE_PERSONNAGE` — **séparés gratuitement par le préfixe**. Ici les deux sont `monde.personnages[]`.

**UNION (8 chemins)** : `canon.ton` · `interdits_ton[]` · `accroche_joueur` · `fonction` · `description_joueur` · `but.libelle` · `but.pourquoi` · `plan_actions[].action`.
**`CHEMINS_CANDIDAT` (4)** : `fonction`, `description_joueur`, `but.libelle`, `plan_actions[].action` — **jamais re-listé**, test d'**inclusion** + **canari** d'absence de `but.pourquoi`.
**Troncature** : `plan_actions[].action` au **premier** élément **chez les candidats seulement**. **Aucune chaîne jamais coupée.**
**Mise en page** : `FICHE` / `P1`…`PN`. ⚠ **JAMAIS `PERSONNAGE`** (collision avec l'alphabet des rangs).
**Sélection déterministe** : exclure le porteur · exclure les cibles déjà liées (`detientDeja` **recopié**, pas un `some` maison) · `portee === 'premier'` d'abord (*`portee` **sélectionne**, jamais injectée*) · `CANDIDATS_MAX` · **pas une ligne, pas de rang** (*un bloc vide **enseignerait** « celui-là n'a rien » — une **affirmation** ; le repli est le silence*) · `Map.get`, **aucune conversion**.
**Refus, ordre figé, tous AVANT le `fetch`** : `a-ecrire` → `cible-a-ecrire` (**disjonction** sur les 4 chemins du porteur) → `aucun-candidat` → `trop-long`. **Premier rôle à utiliser les QUATRE motifs.**

## 6. Forme de sortie — et **une clé que je change au tech-lead**
```ts
export const CLES_SORTIE_RELATIONS = ['rapports'] as const
export const RELATIONS_PROPOSEES_MAX = 3
GABARIT_SORTIE['personnage-relations'] = '{"rapports": [{"envers": "P1", "nature": "…"}, {"envers": "P3", "nature": "…"}]}'
export interface RapportRendu { envers: RangInjecte; nature: string }
export interface RapportsRendus { rapports: readonly RapportRendu[] }
export interface LienResolu { cibleId: string; lien: string }
export interface PropositionRelations { personnageId: string; ajouts: readonly LienResolu[] }
```
1. ⚠ **`rapports`, PAS `liens`** : `liens` est **le pluriel exact du champ `lien`** — c'est **nommer le champ** (veto 3b) et la confusion **à une lettre** que KR-231 a fermée. **Les quatre clés livrées diffèrent toutes de leur champ.** Un **quasi-synonyme** est légitime ; **le mot du champ, non.**
2. **`envers`, pas `vers`** : le mot que l'UX rend **déjà** à l'écran — **un mot, une notion, des deux côtés de la frontière**. Et `envers` est la **préposition du sentiment dirigé**, là où `vers` est directionnel.
3. **Le gabarit montre `P1` puis `P3`** — *les rangs sont des **adresses**, pas un ordre à parcourir.*

## 7. `validerRelations` — DOUZE prédicats
(1) objet simple · (2) clés exactes · (3) `Array.isArray` · (4) **chaque élément objet, clés exactement `['envers','nature']`** · (5) les deux **chaînes** (*jamais `[0]`, jamais `String(…)`*) · (6) ≤ MAX, **refus jamais troncature** · **(7) longueur ≥ 1 ⇒ `vide`** ← *le prédicat que la liste réintroduit* · (8) `nature` non vide `vide` · (9) **`envers` distincts** (*jamais `nature` : deux frères portent légitimement le même lien*) `schema` · (10) marqueur **importé** · (11) identifiant **par élément, jamais un `join`** · (12) `rangsConnus.has` `rang-inconnu`.
⚠ **`envers` JAMAIS passé au scanner** — *code mort présenté comme de la couverture*. **Accord total avec le veto du tech-lead.**
**Trois scénarios séparateurs** : `{"rapports": []}` ⇒ **`vide`, non `schema`** · `{"envers":"FICHE"}` ⇒ **`rang-inconnu`, non `schema`** · deux fois `P1` ⇒ refus (*doublon **intra-lot**, que la sélection ne peut pas voir*).

## 8. Le nom propre inventé — **argument RETOURNÉ**
⚠ **Un scanner sur les `nom` du dossier n'est pas faible, IL EST INVERSÉ.** `nom` n'est injecté nulle part. Donc : si `nature` dit « son frère **Corvin** » et que Corvin **EST** le nom écrit ⇒ **le scanner rougit sur une prose JUSTE** ; s'il dit « Corvin » alors que l'auteur a écrit « Aldur » ⇒ **le scanner reste VERT, et c'est exactement le bug**. **L'instrument attrape le bon cas et manque le mauvais.** **REJET MAINTENU.**
**Substitut testable livré à la place** : un **garde de source sur l'invite** (patron `frontiere.test.ts`) — la ligne « Tu ne donnes de nom à personne » **présente**, **plus un cas négatif fabriqué**. ⚠ **LIMITE DÉCLARÉE DANS LE TEST : il épingle LA PRÉSENCE DE LA CONSIGNE, jamais son obéissance.**

## 9. L'invite — sept décisions
⚠ **LE PIÈGE DE RECOPIE : `indice-detenteurs:188`** (« ni nom, ni phrase, ni justification ») **TUE LE SEUL CHAMP `ia`** ⇒ **un rôle qui ne peut JAMAIS réussir, et rien ne rougirait au dépôt**. **Runner-up** : « une INTENTION » (3b) ⇒ *une action datable gelée dans un champ que le moteur traite en fait permanent*. **Même famille ≠ même chose : une intention se FAIT, un lien s'ÉPROUVE.** La queue « ni une chose qu'il entreprend » ferme **les deux** recopies **sans prononcer le mot « intention »**.
⚠ **« trois au plus » — RENVERSEMENT par rapport à mon tour 1** : le garde `frontiere.test.ts:354` **s'applique désormais**, et `BORNE_EN_TOUTES_LETTRES[3]` doit se trouver **littéralement** dans l'invite.
⚠ **« ne renvoie à aucune des autres que tu proposes » — ligne NEUVE, et C'EST LA CONTREPARTIE QUE J'EXIGE DE MA CONCESSION** : trois liens d'un seul jet forment une **constellation** ; l'auteur en accepte deux, en refuse un ⇒ **une prose qui renvoie à une relation qui n'existe pas**. **Moitié validateur DÉLIBÉRÉMENT ABSENTE** (KR-229) ⇒ **l'écran ne doit rien promettre de tel.**
Plus : « jamais ce que l'autre éprouve en retour » · **la ligne du degré interdit le CHIFFRE et l'ÉCHELLE, pas la charge émotionnelle** (*« reste neutre » viderait le champ de ce pour quoi il existe*).

## 10. `max_tokens: 700`
**P = 109** ⚠ *(mon tour 1 disait 110 : **re-compté, c'est 109**)*, deux sources. Enveloppe **107** (pire rang `P10`). **L = 434.** `r=3 ⇒ 500` ; **`r=2` (PIRE) ⇒ 651 ⇒ 700**. ⚠ **Dépend du ratio : on prend le pire ET ON LE DIT.**
⚠ **700 ne coïncide avec AUCUNE valeur livrée** (200·100·400·200) — **son entrée doit dire « aucune coïncidence »**, ce qu'aucun des quatre précédents n'a eu à écrire.

## 11. Échec — et **une asymétrie à écrire**
Rejeu **une fois** puis terminal ; **la sortie fautive jamais affichée**. Cible disparue ⇒ `validateDossier` **expose** (KR-021). **Mémoire : AUCUNE** — une relation acceptée devient **non re-proposable** *non par mémoire, mais parce que **la sélection l'exclut** au lancer suivant*. ⚠ **C'est le patron de l'IT2 (un détenteur accepté devient inénonçable), PAS celui de 3a (une réplique acceptée reste re-proposable).**

## 12. Réponse à l'UX
⚠ **L'écran ne dit RIEN de l'auto-référence, et ce n'est pas un oubli** : `CARD6_CORPS` porte déjà « un **autre** personnage ». L'écrire en plus ouvrirait **une liste non bornée de ce qui n'est pas proposé** et **apprendrait à l'auteur à lire les mentions comme du bruit**. **Une mention d'honnêteté, pas deux.** Son suffixe ` (envers lui-même)` **n'a aucun producteur côté copilote** — à garder **seulement** s'il en a un côté fiche (KR-109).
**Son motif de nommage l'emporte** sur l'axe qui me regarde. **Sa réserve BUG-109 s'active** : `CANDIDATS_MAX` borne bien l'entrée.

## 14. Ce que je n'ai PAS mesuré
**Aucun test exécuté** — les scénarios des § 2, 3 et 7 sont **proposés, pas observés** · **`M` et le budget : NON MESURÉS** (*si la mesure déplaît, on baisse `CANDIDATS_MAX`, jamais le budget*) · ⚠ **`TAILLE_MAX_CORPS_IA` NON MESURÉ** — *s'il bouge, il se re-dérive sur les CINQ rôles, **ce n'est pas un cliquet*** · le canari de 3b **à re-vérifier non inerte** · **le gabarit n'a pas été confronté** à `ENTREE_GABARIT` — *à vérifier avant d'écrire l'invite* · **`noyau.ts` non lu** · la l. **137** manque au lot 1 du tech-lead.
