# Tour 2 — Narratif & IA (contre-lecture)

## 1. Réponse nommée — Tech Lead, Q2, motif n° 3

**Tu as raison, et je concède le fond.** `expr.test.ts:423-428` est un **comptage par fichier** (`fermetures >= aiguillages`), jamais un appariement — alors que le commentaire au-dessus revendique « UNE FERMETURE PAR AIGUILLAGE, et non une par FICHIER ». **L'écart est invisible aujourd'hui pour une seule raison : `atteignabilite.ts` porte exactement UN `switch` et UN `: never` (l. 634, mesuré).** Loger la seconde traversée là ferait passer le fichier à 2/2, et deux `: never` textuels quelconques satisferaient la garde pendant que le second `switch` dérive en silence. **Ma proposition affaiblissait la garde que je prétendais protéger** : « le durcissement complet pour un gain nul » était faux dans les deux termes.

Une nuance sans conséquence : « un `switch` par fichier rend l'appariement exact » est légèrement trop fort — un `: never` parasite masquerait encore un aiguillage non fermé. Un fichier à un aiguillage **plafonne** le jeu, il ne le supprime pas. Je ne demande **aucun durcissement supplémentaire** sur la dernière itération ; je le signale pour que la réécriture ne prétende pas plus que ce qu'elle fait.

**Et sur l'autre bout : oui, c'est le même argument.** Deux fonctions qui divergent sur l'opérateur central, dans un fichier dont l'en-tête refuse la seconde question en toutes lettres, ce n'est pas un module à deux fonctions : c'est **deux modules qui partagent un nom de fichier**. J'y suis arrivé par la sémantique, toi par la garde. **Q2 : je me range au module neuf.**

Bénéfice collatéral que ma note comptait en coût : avec le module neuf, la descente de la docstring « SATISFIABILITÉ, PAS ÉVALUATION » et la réécriture de l'en-tête **disparaissent**. Il ne reste que la correction de la mesure D, commentaire seul.

## 2. Réponses nommées — UX + PM (la remédiation), QA (le pouvoir séparateur)

**Ma contrepartie « une remédiation qui nomme les écrans producteurs » est RETIRÉE : elle est fausse.** `objectif-sans-chemin` demande « ce fait peut-il un jour être produit ? » — un producteur ajouté **change la réponse**, parce que la question a un avenir. Le tour zéro n'en a pas : à t=0 aucun delta n'a couru **par construction**. Une consigne « donnez un producteur » serait **fausse sur cette règle-là**, et je l'avais exigée.

**UX, ta direction est la bonne — et je te rapporte un geste RÉEL que ta note ne nomme pas.** Mesuré : `ObjectifsCanon.tsx:342` porte `label={`Retirer l'objectif n°${index + 1}`}` (`handleRetirer`, l. 237). **Il existe un geste prouvé sur l'écran où l'objectif vit** : le retirer.

**PM, ta condition est satisfaite dans les deux sens** — le geste nommé est prouvé, et il ne prétend pas réparer la condition. **Et il durcit ton Q1** : le seul remède honnête est « retirez-le, ou gardez-le si cet échec est voulu ». Une remédiation qui **autorise à garder** est incompatible avec `bloquant` — un dossier déclaré injouable dont la consigne dit « c'est peut-être voulu » est incohérent. **Q1 se déduit du texte : `alerte`.**

**QA — je te suis sur les deux points et j'ajoute un troisième mutant** (annexe E), issu de mon objection 1.

## 3. Statut de mes objections du tour 1

| # | objet | statut |
|---|---|---|
| **O1** | Mesure B est un témoin négatif sous hypothèse non écrite | **DURCIE EN VETO — sur une cellule et une seule** |
| **O2** | Q1 `bloquant` pose le blocage sur le seul canal de faux positif → `alerte` | **MAINTENUE**, renforcée |
| **Veto conditionnel « si bivaluée »** | — | **RETIRÉ : sa condition ne se réalise pas.** Ce qui le **réarmerait** : toute cellule `vrai`/`faux` qui ne nomme ni un champ du document, ni une clause datée de H6. |
| **Q4** (objectifs seuls) | — | **MAINTENUE**, le PM y converge |
| **§ B tour 1, « `possede_objet` à t=0 se lit par `objetsDonnesDe` »** | — | **RETIRÉE — elle était fausse.** À t=0 la cellule ne lit **rien** : elle constate un inventaire vide. Sa chute confirme le tech-lead : **il ne reste aucune machinerie partagée**. |

**Pourquoi O1 devient un veto ponctuel, et pourquoi il coûte zéro.** Mesuré : `dossier-minimal.json` `charpente.depart.lieu_id = 'lieu.val-cendre'` ; `evenement.embuscade-du-fanal.declencheur_expr = lieu_courant_est(['lieu.val-cendre'])` — **le déclencheur est certain-VRAI à t=0 sous la ligne `lieu_courant_est` de la table elle-même**. Écrire `evenement_consomme → 'faux'` affirme comme certain un fait dont le contre-exemple est écrit trente lignes plus haut dans la même fixture. Pire : le sous-arbre `non(evenement_consomme('evenement.embuscade-du-fanal'))` **existe déjà au dépôt**, dans le champ **voisin** du même objectif (`reussi_si_expr`). Déplacé d'un champ, il fait tirer la règle sur un dossier que la ligne de base appelle `jouable: true` — **faux positif, direction interdite.**

> **Une cellule `vrai`/`faux` dont le contre-exemple est déjà écrit dans `__fixtures__` n'est pas une hypothèse : c'est une erreur mesurée.**

Coût de la correction : **nul**. `ou('indecidable','faux')` = `indecidable` → silence sur `dossier-minimal.json`, exactement comme `ou('faux','faux')`. La ligne de base ne bouge pas ; seul le **motif** devient vrai. Famille BUG-080 traitée avant qu'elle ne morde.

**Argument de fiction pour O2, que personne n'a posé.** Un objectif dont la condition d'échec est vraie à l'ouverture peut être **délibéré** : `camp` admet les antagonistes, et « ce camp a déjà perdu ce qu'il devait garder avant que l'histoire commence » est un procédé narratif ordinaire. Une règle qui déclare injouable un dossier dont la fiction est intacte confisque à l'auteur une forme qu'il a le droit d'écrire. `alerte` dit « vérifiez que c'est voulu » ; `bloquant` dit « vous n'avez pas le droit ». Le document ne permet de trancher ni dans un sens ni dans l'autre — donc on ne tranche pas à sa place.

## 4. Nommage et domicile

**Nom du module : `tourzero.ts`.** `controles.ts` importe déjà `from './amorce'`, et le dossier porte `charpente.depart.texte_ouverture_joueur`. Un `ouverture.ts` posé à côté d'`amorce.ts` se lira comme « le texte qui ouvre la partie » — collision voisine de fichier. **« Tour zéro » reste un mot de CODE** : il ne franchit jamais la frontière vers la prose d'auteur.

**Domicile de H6 : dans `tourzero.ts`, et la décision d'it6 est RESPECTÉE, pas contournée.** Sa formulation exacte dit que les hypothèses « sont écrites ICI, **dans le fichier qui les utilise**, et nulle part ailleurs ». Le bloc s'intitule « HYPOTHÈSES DATÉES **D'ATTEIGNABILITÉ** ». H6 n'en est pas une, et son unique utilisateur est `tourzero.ts`. **Le domicile suit l'usage, pas le fichier le plus ancien.**

**Ce qui reste dans `atteignabilite.ts`** : H5 **ne bouge pas** et **ne se recopie pas** — une hypothèse restatée dans deux fichiers est une règle dupliquée, et c'est mon veto. H6 la **cite**. H5 gagne une phrase nommant le troisième dépendant. **KR-227 doit changer de VERBE, pas seulement de chiffre** : la troisième ligne **ne lit pas `objetsDonnes`**, elle dépend du même invariant d'inventaire. « Trois lignes, deux fichiers, un invariant » — sinon KR-227 devient faux d'une autre manière.

## VERDICT

**Recevable sous réserve** — module neuf `tourzero.ts`, trivalence Kleene, tir sur le certain-vrai seul, `alerte`, portée `canon.objectifs[].echoue_si_expr` seul.
**Veto ponctuel, sur une cellule** : `evenement_consomme` s'écrit `'indecidable'`, jamais `'faux'`. Contre-exemple mesuré au dépôt, direction d'erreur interdite, coût nul sur la ligne de base. **Levé par un changement de littéral.**

---

# ANNEXE

## A. H6 — forme définitive · **domicile : en-tête de `src/brain/dossier/tourzero.ts`**

```
/**
 * HYPOTHÈSE DATÉE DE L'ÉTAT D'OUVERTURE — 2026-09-17, itération 10 de la n° 7.
 *
 * DOMICILE : ICI, dans le seul fichier qui l'utilise — même règle que H1–H5
 * d'`atteignabilite.ts`, écrites « dans le fichier qui les utilise, et nulle part
 * ailleurs ». H6 n'est PAS une hypothèse d'atteignabilité : ce module répond à
 * l'AUTRE question, et les deux blocs se citent sans jamais se recopier.
 *
 * LES DEUX QUESTIONS, ET CE MODULE NE POSE QUE LA SECONDE.
 * `atteignabilite.ts` décide « ce fait peut-il un JOUR être établi ? ».
 * Ce module décide « ce fait est-il DÉJÀ établi AVANT la première action du
 * joueur ? ». La seconde a besoin d'un ÉTAT ; un document n'en porte pas. H6 dit
 * lequel — et surtout ce qu'elle REFUSE d'en dire.
 *
 * CE QUE LE DOCUMENT DÉTERMINE — UN SEUL FAIT. `monde.lieu_courant` vaut
 * `charpente.depart.lieu_id` : le seul champ de session qu'un champ du document
 * écrive, et `predicates.ts` le nomme — « une VALEUR, pas une liste ».
 * Conséquence, exactement l'inverse de ce qu'un évaluateur naïf dirait :
 * `lieu_courant_est(<départ>)` est VRAI au tour zéro, donc `non(...)` est FAUX.
 * ET SI LE DÉPART N'EST PAS POSÉ — `charpente.depart.lieu_id` vide ou ne résolvant
 * aucun `monde.lieux[].id` — la cellule rend `indecidable` : un départ non posé ne
 * détermine pas davantage OÙ le héros n'est PAS.
 *
 * CE QUE H6 SUPPOSE, ET QUE LE DOCUMENT N'ÉCRIT PAS — AUCUN DELTA N'EST APPLIQUÉ
 * AVANT LA PREMIÈRE ACTION DU JOUEUR. C'est cela, et cela seul, qui rend
 * `possede_objet`, `indice_connu` et `pnj_a_revele` certains-FAUX à l'ouverture.
 * DEUX canaux la mettraient en défaut, nommés pour être retrouvés le jour venu :
 * un `effet[]` de JALON — il part au déclenchement, sans scène jouée — et une
 * résolution d'ÉVÉNEMENT appliquée avant le premier tour. Pour l'inventaire, c'est
 * H5 d'`atteignabilite.ts` : NON RECOPIÉE ICI, CITÉE — trois lignes en dépendent
 * désormais, dans DEUX fichiers (KR-227).
 *
 * CE QUE H6 REFUSE DE DIRE. `lieu_visite`, `jalon_atteint` et `evenement_consomme`
 * restent `indecidable`, parce que deux décisions que la n° 9 n'a PAS prises les
 * gouvernent : (i) le moteur résout-il les `declencheur_expr` AVANT la première
 * action ? (ii) le lieu de départ compte-t-il comme VISITÉ ?
 * `evenement_consomme` est `indecidable` POUR UN CONTRE-EXEMPLE ÉCRIT, pas par
 * prudence : `dossier-minimal.json` déclenche `evenement.embuscade-du-fanal` sur
 * `lieu_courant_est('lieu.val-cendre')`, qui EST son lieu de départ — et le
 * sous-arbre `non(evenement_consomme(...))` est déjà écrit dans le champ VOISIN du
 * même objectif (`reussi_si_expr`). UNE CELLULE DONT LE CONTRE-EXEMPLE EST AU
 * DÉPÔT N'EST PAS UNE HYPOTHÈSE : C'EST UNE ERREUR.
 *
 * SENS D'ERREUR SI ELLE EST FAUSSE — la règle ne tire que sur le CERTAIN-VRAI et
 * `indecidable` ne tire pas : elle ne peut que SOUS-tirer — faux négatif —, SAUF
 * par le canal « aucun delta avant la première action », dont l'erreur va dans le
 * sens INTERDIT. Ce canal-là se corrige en UN endroit, la table
 * `VALEUR_AU_TOUR_ZERO` ci-dessous, et c'est contre LUI que le niveau du constat
 * se choisit.
 *
 * NE PAS CONFONDRE AVEC `ETABLISSEMENT` (`atteignabilite.ts`) : `lieu_courant_est`
 * y vaut `true` par IGNORANCE, ici `'vrai'` par DÉTERMINATION. Deux tables, deux
 * questions ; elles ne fusionnent pas.
 *
 * CE QU'ELLE N'EST PAS : H6 NE SPÉCIFIE AUCUN ÉTAT DE SESSION. La mémoire de
 * session appartient à la n° 9 ; ce module dit seulement ce que le DOCUMENT en
 * détermine. La discipline tient en une phrase : TOUTE CELLULE `vrai`/`faux` NOMME
 * soit le champ du document qui la détermine, soit la clause de H6 qui la suppose ;
 * sans l'un des deux, la cellule vaut `indecidable`.
 */
```

**Écritures corrélées, dans le même lot :**
1. `atteignabilite.ts`, ligne de titre : « itérations 6, 7 et 9 » → « itérations 6, 7, 9 et 10 ».
2. `atteignabilite.ts`, H5, **une phrase ajoutée** : « DEPUIS IT10, UNE TROISIÈME LIGNE EN DÉPEND, ET ELLE N'EST PAS DANS CE FICHIER : la cellule `possede_objet` de `VALEUR_AU_TOUR_ZERO` (`tourzero.ts`, H6). Elle ne LIT pas `objetsDonnes` — elle dépend du même invariant d'inventaire. Trois lignes, deux fichiers (KR-227). »
3. **KR-227** (spec + `code-knowledge.json`) : changer le **verbe** autant que le chiffre — « TROIS lignes dépendent de l'invariant d'inventaire, dans DEUX fichiers : `ETABLISSEMENT.possede_objet` (it7) et `porteOuverte` (it9), qui LISENT `objetsDonnes`, et `VALEUR_AU_TOUR_ZERO.possede_objet` (it10, `tourzero.ts`), qui ne lit rien et constate un inventaire vide. Réveil : un inventaire de départ au schéma, une acquisition jouée en scène, **ou un `effet[]` de jalon donnant un objet sous un déclencheur vrai à l'ouverture**. »
4. `atteignabilite.ts`, cas `non` (mesure D) — corriger **sans effacer**, commentaire seul :

```
// `non` → `null` SANS DESCENDRE, et c'est la ligne la plus importante des
// quatre. LE MOTIF ÉCRIT ICI A ÉTÉ FAUX, et il est CORRIGÉ, pas effacé : il
// disait « les sept prédicats lisent des champs de session qui partent VIDES,
// si bien que `non(P)` est vrai au tour zéro ». `predicates.ts` le contredisait
// déjà — `lieu_courant_est` répond `monde.lieu_courant`, une VALEUR et non une
// liste, qui vaut `charpente.depart.lieu_id` dès l'ouverture. LA CONCLUSION NE
// BOUGE PAS, et son VRAI motif est plus simple : la SATISFIABILITÉ d'une feuille
// ne se renverse pas. Descendre et inverser transformerait une improductibilité
// — constat solide — en une VÉRITÉ que le document ne porte pas, c'est-à-dire un
// faux positif sous une règle bloquante. LA VALEUR AU TOUR ZÉRO, ELLE, DESCEND
// DANS LE `non` : c'est une AUTRE question, et elle a son fichier —
// `tourzero.ts`, H6. Deux traversées, deux modules, aucun paramètre de mode.
```

5. **La docstring de `premiereFeuilleInaccomplissable` ne change pas.** Ma demande de tour 1 de la déplacer est **retirée**.

## B. La table `VALEUR_AU_TOUR_ZERO` — une seule ligne diffère de celle du tech-lead

| ligne | valeur | motif, et ce qu'elle NOMME |
|---|---|---|
| `lieu_courant_est` | `'vrai'` ssi `cibles[0] === charpente.depart.lieu_id` ; `'faux'` si le départ est posé et résolu ; **`'indecidable'` si `depart.lieu_id` est vide ou ne résout aucun lieu** | **CHAMP DU DOCUMENT** — la ligne qui interdit le faux positif. L'arête « départ non posé » est neuve : sans elle, `non(lieu_courant_est(X))` deviendrait certain-vrai sur un dossier sans départ. |
| `possede_objet` | `'faux'` | H6 (aucun delta avant la première action) + H5 citée. **Seul canal de faux positif de la règle.** |
| `indice_connu` | `'faux'` | H6, même clause. Aucun contre-exemple au dépôt. |
| `pnj_a_revele` | `'faux'` | H3 d'`atteignabilite.ts`, **citée** : l'unique producteur de `a_dit[]` est un savoir livré en dialogue — une scène jouée. |
| `evenement_consomme` | **`'indecidable'`** | **MA CELLULE — contre-exemple ÉCRIT** dans `dossier-minimal.json`. Pas de prudence, une mesure. |
| `jalon_atteint` | `'indecidable'` | deux écrivains, dont un `declencheur_expr` que le moteur pourrait résoudre au tour zéro. |
| `lieu_visite` | `'indecidable'` | le statut du lieu de départ n'est tranché nulle part (veto de terrain de la QA respecté : la table **ne le fixe pas**). |

**Effets sur les trois dossiers — déduits, NON MESURÉS :** référence **tire une fois** ; minimal **silence** (`ou('indecidable','faux')` = `'indecidable'`) ; dossier neuf **silence**. Ligne de base 11 → 12 sur la référence seule ; `jouable` inchangé partout sous `alerte`.

## C. Les deux chaînes — forme définitive, et la polarité

**Le témoin garde `nie`, et il a exactement un lecteur : le message.** La raison est écrite dans le fichier même : `REMEDIATION_OBJECTIF_SANS_CHEMIN` dit « UNE SEULE CONSIGNE, et elle est JUSTE **parce que le message nomme le fait** ». Sans `nie`, la phrase dirait « possède l'objet » là où le document dit le contraire.

**`message`** — un gabarit, un segment variable, apposition :

```ts
function messageObjectifPerduALOuverture(
	predicat: string,
	localisations: readonly string[],
	nie: boolean,
): string {
	return `Cette condition d'échec tient à « ${predicat} » — ${localisations.join(', ')} —, ${nie ? 'encore faux' : 'déjà vrai'} avant la première action du joueur.`
}
```

Rendu sur mesure A : « Cette condition d'échec tient à « possède l'objet » — l'objet « Le sceau de cendre » —, **encore faux** avant la première action du joueur. »

**Ce que cette phrase ne fait PAS, et c'est mesuré.** Elle **ne dit pas « le joueur perd cet objectif »**. `types.ts:1341-1362` déclare `echoue_si_expr` MOTEUR, jamais injecté — et **rien d'autre** : ni le moment où le moteur l'évalue, ni si un échec se **verrouille**. Une phrase qui annonce la perte affirme un comportement de moteur qu'**aucun document du dépôt n'écrit**. Concrètement : sur `non(possede_objet(X))`, si le joueur obtient X au tour 5, la condition redevient fausse ; « perdu » présuppose un verrou que personne n'a décidé. **UX : c'est la seule réserve que je pose sur ta chaîne**, et elle porte sur sa seconde moitié, pas sur ta direction, que je signe.

**`remediation`** :

> « Retirez cet objectif, ou gardez-le si cet échec est voulu dès la première scène (Canon → Objectifs des camps) : aucun écran ne permet aujourd'hui de changer sa condition d'échec. »

1. **Un geste PROUVÉ** — `ObjectifsCanon.tsx:342`, « Retirer l'objectif n°N ».
2. **Aucun écran producteur** — mesuré inapplicable. C'est ma contrepartie retirée, remplacée par son contraire.
3. **L'absence de geste, dite** — et non maquillée (direction d'UX, tenue).
4. **Aucune promesse d'effet moteur.**
5. **L'intention de l'auteur respectée** — « si cet échec est voulu ». C'est aussi ce qui rend cette consigne **incompatible avec `bloquant`**.

## D. Contrat de sortie IA — inchangé, une ligne retirée

| | |
|---|---|
| **Entrée injectée** | **aucune**. `echoue_si_expr` MOTEUR, `echoue_si_texte` AUTEUR ; `destinations.ts:141` les tient hors du contexte injecté. |
| **Schéma de sortie** | sans objet — un `ConstatControle` produit par du code pur. |
| **Échec de validation** | sans objet : valuation déterministe, **totale par compilation** sur un arbre déjà accepté par `validateExpr`. Sans dé, sans aléa, sans modèle. |
| **Budget de contexte** | **inchangé — zéro mot ajouté au canon.** |
| **Mémoire de session** | **toujours non spécifiée, et H6 s'interdit de la spécifier.** Trois cellules `indecidable` sont le refus explicite d'écrire à la place de la n° 9. |
| **Frontière dés / stats / inventaire / XP** | **intacte.** `jet` non évalué ; aucun prédicat ne peut désigner un monstre ; `possede_objet` à t=0 **ne lit rien**. |

**Retiré du tour 1** : « `possede_objet` à t=0 se lit par `objetsDonnesDe` ». Faux, et sa chute retire le dernier lien de machinerie apparent entre les deux modules.

## E. Trois mutants nommés et leurs témoins — disjoints

| mutant | témoin (feuille SEULE) | code juste | mutant | tué ailleurs ? |
|---|---|---|---|---|
| **M1** — `lieu_courant_est` toujours `'faux'` | `non(lieu_courant_est(<départ>))` | `non('vrai')` = `'faux'` → silence | `non('faux')` = `'vrai'` → tire | non par M2/M3 |
| **M2** — `non` certain-vrai dès que l'enfant n'est pas certain-vrai | `non(lieu_visite(<un lieu>))` | `non('?')` = `'?'` → silence | `'vrai'` → tire | non par M1 |
| **M3** *(neuf, issu de O1)* — cellule `evenement_consomme` écrite `'faux'` | `non(evenement_consomme(E))`, **E portant `declencheur_expr = lieu_courant_est(<départ>)`** | `non('?')` = `'?'` → silence | `non('faux')` = `'vrai'` → tire | M2 le tue aussi ; **M3 n'est tué par aucun autre** |

Le témoin de M3 se **recopie verbatim** depuis `dossier-minimal.json` `canon.objectifs[0].reussi_si_expr` déplacé dans `echoue_si_expr` — rien à inventer.

## F. Mes affirmations NON MESURÉES

1. Toute couleur de test — **déduites d'une lecture d'assertion**.
2. Le comportement des trois mutants — **déduit**.
3. Que le témoin de M1 soit absent des fixtures — repris de la QA, non recontrôlé.
