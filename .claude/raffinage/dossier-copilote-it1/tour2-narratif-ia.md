# Tour 2 — Narratif & IA — `dossier-copilote` it1

```
CONTRE-LECTURE

C1 · SCHÉMA DE SORTIE — Tech Lead, `CLES_PROPOSITION = ['champ','texte']`.
Ton MÉCANISME est juste et je l'adopte : les clés doivent exister EN VALEUR à
l'exécution, un `interface` ne survit pas à `tsc`. Mais la cardinalité est
indépendante du mécanisme : `CLES_PROPOSITION = ['valeur'] as const` sert le
garde KR-236 exactement pareil — le garde itère un tableau, il ne compte pas
ses entrées. Donc ton motif ne porte pas `champ`, il porte « un tableau `as
const` ». Trois raisons de ne pas y mettre `champ` :
(i) `{champ:'apparence', texte:…}` quand l'auteur a désigné `fonction` est
    conforme à TON schéma et écrit dans le MAUVAIS champ. Ta note ne dit pas
    ce qui arbitre. Les deux issues sont mauvaises : croire le modèle, c'est
    lui laisser choisir la cible ; croire l'écran, c'est valider un champ dont
    la fonction est d'être ignoré.
(ii) C'est TON KR-231, appliqué à la lettre : « `entiteId` vient de l'état
    d'écran, jamais de la sortie du modèle ». La cible est le COUPLE
    `{entiteId, champ}`. Tu le coupes en deux et tu donnes la moitié au modèle.
(iii) `champ: ChampProse` est un type, pas un garde : il faut re-vérifier
    l'appartenance à l'exécution, soit un TROISIÈME site où les trois noms de
    champ sont énumérés.
Et un constat qui coûte à mon camp autant qu'au tien : `'champ'` et `'texte'`
sont des mots français ORDINAIRES d'une invite (« propose un texte pour le
champ … »). Ton assertion « l'invite contient chaque clé » peut donc être VERTE
sur une invite qui n'énonce aucun schéma — faux positif de la famille BUG-084.
`'valeur'` n'y échappe pas non plus. Le correctif n'est pas la clé, c'est la
CHARGE de l'assertion : elle porte sur `GABARIT_SORTIE` (le squelette JSON
littéral), `CLES_PROPOSITION` n'étant que ce qui PILOTE le validateur.
N-R7 MAINTENUE. Contrat de fil unique en annexe A. NON MESURÉ : aucun test
n'existe, je n'affirme la couleur d'aucun.

C2 · CONTEXTE ET PARTIES REQUISES — Tech Lead, TL-14.
Ton motif tombe, et il tombe sur une MESURE, pas sur un argument.
`amorce.ts` l. 57 : `ton: ⟨à écrire⟩ Le registre de langue…`. l. 105 :
`construireAmorce` écrit cette valeur dans `canon.ton`. Donc sur un dossier
neuf, `canon.ton` PORTE le marqueur, le filtre le retire, et
`PARTIES_REQUISES = ['canon.ton']` — SEUL — se vide.
=> Le refus `a-ecrire` est atteignable sur le cas NOMINAL du dossier neuf,
sans `synopsis_mj`. Ce que tu voulais rendre atteignable l'est déjà.
Ajouter `synopsis_mj` n'achète donc aucune atteignabilité et coûte un refus
sur un état normal : l'auteur qui a posé son ton et pas encore son synopsis
est exactement l'auteur qui a besoin du copilote. N-R12 MAINTENUE.
(Précision de méthode : la VALEUR est mesurée — deux lignes de source lues ;
la COULEUR du test, elle, est NON MESURÉE.)
Et je te donne raison sur un point que tu n'as pas soulevé : ma disjonction
R2 « 1 sur 5 » est mauvaise, et pas pour sa complexité de code (six lignes).
Elle ne RENTRE PAS dans l'union que tu as figée : ta branche
`refuse{motif, chemin: CheminLibelle}` porte UN chemin ; une disjonction n'en
a pas. Il faudrait un cinquième texte d'écran pour dire « une partie ». Et sur
le fond, « assez de matière pour écrire » est un jugement ÉDITORIAL déguisé en
garde de forme — je refuse ça dans une invite, je ne vais pas le livrer en
code. Une proposition n'est pas du canon tant que l'auteur ne l'a pas
acceptée : inventer à partir de rien est refusable à coût nul, et le goal
nomme la page blanche comme le problème à résoudre. R2 RETIRÉE.
En revanche je MAINTIENS les 12 chemins contre tes 7, et le défaut est dans
ta propre forme : tes 7 chemins ne contiennent, pour le personnage, que les
trois proses — dont la CIBLE, que ta règle (4) exclut à juste titre. Sur le
cas d'usage de l'it1 (cible vide), un personnage décrit par son `but` et son
`caractere` produit un contexte où il n'y a RIEN sur lui. Le modèle invente
alors sans matière, et tu n'as aucun garde en face.

C3 · VARIANTE REMPLACEMENT — PM, report en it1-bis.
Je RETIRE mon motif, il était faux, et je le dis avant qu'on me le prouve :
le bloc AVANT/APRÈS montre l'ANCIENNE CIBLE contre la NOUVELLE. Il n'attrape
PAS la paraphrase du CONTEXTE (`but.libelle` recyclé en `fonction`), qui est
la forme de complaisance que j'avais nommée. Il n'attrape que l'auto-paraphrase
d'une cible déjà rédigée. Écrire « SEUL garde anti-complaisance de l'itération »
était une surestimation de couverture — la seule direction dangereuse.
Et une mesure achève la question, en ta faveur : le contexte n'injecte JAMAIS
la cible (règle (4) du Tech Lead, que j'endosse — la lui montrer INVITE la
paraphrase). Donc REMPLACEMENT et REMPLISSAGE produisent un CORPS DE REQUÊTE
IDENTIQUE. Ton report ne coûte rien de mon côté de la frontière : ni contexte,
ni schéma, ni validation, ni mémoire. Il coûte un bloc d'affichage.
Ce que ta coupe laisse réellement démontrable — et c'est moins que « vide ou
marqué » : MESURÉ, `MARQUEUR_A_ECRIRE` n'est écrit en production que dans
`amorce.ts` et `controles.ts`. Aucune feature ne sème un champ de personnage
avec le marqueur, et `dossier-registres` a ÉCARTÉ ce semis au raffinage
(spec l. 167 / 259 : il allumerait une alerte D1 sur une entité neuve).
MESURÉ aussi : `fonction?`, `apparence?`, `description_joueur?` sont
OPTIONNELS (`types.ts` l. 824/833/846) et n'ont de ligne dans AUCUNE table
(`CHAMPS_REQUIS`, `BUDGETS_DE_MOTS`) — leur seule occurrence hors types est
`destinations.ts` l. 175-177.
=> L'espace d'états d'une cible à l'it1 est EXACTEMENT DEUX : absente/vide,
ou rédigée par l'auteur. Jamais marquée. Ta coupe se lit donc « cible VIDE »,
point. La branche « marquée » de REMPLISSAGE est morte, et pas seulement
inerte : par décision de projet déjà prise.
Je ne bloque pas le report — c'est ton périmètre. Je maintiens UNE exigence,
reformulée : l'it1 ne doit jamais écrire par-dessus une prose rédigée sans
montrer ce qu'elle remplace. Deux remèdes, tu choisis :
  (A) garder REMPLACEMENT (mon tour 1) ;
  (B) ta coupe + une cible rédigée N'EST PAS SÉLECTIONNABLE, `title` nommant
      la raison (précédent `EditorTopBar.previewDisabledReason`).
Je recommande (B). Ce qui est irrecevable, c'est la coupe SANS l'un des deux :
l'acceptation détruirait alors du canon rédigé, en silence.

C6 · IMPORT `worker/` → `src/brain/` — Tech Lead, TL-8.
CONFIRMÉ, je me range. Ton motif est meilleur que ma pièce 1 : traîner du
code client dans le paquet wrangler est un coût permanent pour une liaison
que le test tient mieux. Mon repli (B) devient la forme retenue. Deux
resserrages, tirés des précédents du dépôt : le balayage nomme une
ALLOW-LIST de DEUX porteurs exacts (`src/brain/copilote/schemaSortie.ts`,
`worker/index.ts`), construite avec `path.join` pour tenir sous Windows
(précédent `deltas.test.ts` / KR-215) ; et il porte son CAS NÉGATIF — un
littéral modifié d'un caractère doit le faire rougir (précédent
`amorce.test.ts`). Sans le cas négatif, c'est un balayage qui ne sait pas
échouer. NON MESURÉ.

C7 · NOM DU RÔLE — `'personnage-prose'`, pas `'fiche-prose'`.
Le rôle est la CLÉ de `CHAMPS_INJECTES` : il doit donc encoder le TYPE
D'ENTITÉ, puisqu'un lieu et un personnage ne partagent aucun chemin injecté.
`fiche-prose` promet une généralité que `ChampProse` ne tient pas, et il
faudrait le renommer le jour où un lieu en reçoit un — or ce nom est un
SEGMENT D'URL (`/ia/:role`) et une clé de la table `INVITES`. Renommer coûte
une route, une invite et un test ; nommer juste coûte huit caractères.

C11 · `PLAFOND_PROSE` — RETIRÉ. Prédicat 5 supprimé, six prédicats, pas sept.
MESURÉ : `BUDGETS_DE_MOTS` (`tables.ts` l. 666-681) a QUATRE entrées —
`canon.mj`, `canon.partage`, `charpente.jalons[].enonce_texte`,
`monde.conditions.climat[].manifestation`. Aucune des trois cibles.
Et `types.ts` l. 1472-1475 écrit la doctrine : « AUCUNE BORNE DE LONGUEUR —
même décision que `Objet.description_joueur` et les deux proses d'un `Indice`
(KR-203) … Le jour où une borne se pose, elle vaut pour la FAMILLE ENTIÈRE,
jamais pour un seul de ces champs. »
Un `PLAFOND_PROSE` dans `brain/copilote` serait donc : une borne sur trois
champs que le schéma laisse délibérément non bornés, posée pour UN
consommateur contre la doctrine de famille, vivant à un SECOND endroit que
la table qui gouverne les bornes de prose — mon propre veto « une règle ne
vit qu'à un seul endroit » — et un nombre non mesuré (KR-235, le garde à
seuil que j'ai moi-même refusé au N-R5). Quatre raisons, une seule suffisait.
Si quelqu'un veut une borne, elle a deux domiciles légitimes et aucun n'est
ici : le `max_tokens` du fournisseur, à côté de l'invite dans le worker, ou
une ligne dans `BUDGETS_DE_MOTS` pour la famille entière, propriété de
`dossier-format`.

C10 · « deux clics rapprochés ⇒ exactement 1 appel » — N'ENTRE PAS dans les 8.
Je ne réclame pas de créneau. La propriété ne doit pas disparaître pour
autant : elle descend d'un cran, en DEUX gestes qui ne coûtent aucun critère —
(i) une ligne CONTRAIGNANTE du contrat de design : « Lancer est désactivé tant
qu'un appel est en vol » ; (ii) une assertion de PLUS dans le critère composant
qui rend déjà l'état de chargement : deux clics, `fetch` appelé 1 fois.
Si l'orchestrateur refuse même l'assertion, alors la revue d'itération écrit
que « dernier arrivé gagne » n'a été vérifié par PERSONNE — jamais qu'il est
couvert parce que jest est vert. C'est l'état illégal représentable qui a
coûté BUG-082.

QA · SCANNER ANTI-IDENTIFIANT — j'accepte, et j'ajoute.
Ta demande — épingler les deux chaînes LITTÉRALEMENT et les REJOUER avant
signature — acceptée sans réserve. Ton canari bénin est juste : `fin` et
`objet` sont bien deux des ONZE espaces de noms (`ESPACES_DE_NOMS`,
`identifiers.ts` l. 41-64).
Ce que j'ajoute relève de mon poste et rend ton canari MESURABLE au lieu de
discutable : un identifiant n'est pas une FORME, c'est une APPARTENANCE au
dossier qu'on écrit. Le prédicat devient FORME ∧ APPARTENANCE, et l'ensemble
est déjà là, gratuit et total : `collectIds(dossier: unknown)` est exporté par
`identifiers.ts` (l. 253), et `dossier` est déjà un paramètre de `demander`.
 · ton canari bénin devient vert PAR CONSTRUCTION, et le test le PROUVE en
   assertant que l'ensemble des ids ne contient ni `fin.tout` ni `objet.favori` ;
 · canari positif qui ne peut pas dériver : `lieu.amorce` (`amorce.ts` l. 79,
   semé dans `monde.lieux[0].id` l. 111 de TOUT dossier créé), inséré au milieu
   d'une phrase. Meilleur que `pnj.aldur-2`, qui doit être planté dans une
   fixture et peut en disparaître.
Ce que ça RÉTRÉCIT, et je le nomme : un identifiant HALLUCINÉ (bien formé,
absent du dossier) ne serait plus refusé. À l'it1 c'est sans conséquence —
sous garde d'audience stricte le modèle ne voit AUCUN identifiant, donc le
seul cas nuisible est la fuite d'un id RÉEL. NON MESURÉ : je n'ai rejoué
aucun regex.

UX + Tech Lead · LE 4ᵉ TEXTE — je tranche pour TL.
« Vide-mais-réussi » n'est pas un cinquième texte trop coûteux : c'est un
texte SANS BRANCHE. L'union à quatre branches n'a pas de `statut:'vide'` —
l'état n'est pas représentable, et asserter l'unicité d'une constante morte
n'est pas une preuve de discriminance, c'est un instrument inerte (KR-235).
Le refus de BUDGET, lui, a un producteur réel. Et il n'ajoute AUCUN état :
`trop-long` et `a-ecrire` sont deux valeurs de `motif` de la MÊME branche
`refuse`. Quatre textes, quatre états atteignables.

MES OBJECTIONS — statuées

O1 · Les critères 2 et 10 se contredisent (rejeu d'un déterminisme) — MAINTENUE,
     et non contestée : la table du Tech Lead (§ c) range 405/413/502 en
     `indisponible`, sans rejeu. N-R6 tient, corroboré par deux rôles.
O2 · KR-236 est le seul risque sans témoin — RETIRÉE. Le Tech Lead livre
     `worker/frontiere.test.ts` dans le lot 1, avec la rencontre invite ×
     validateur dans le même processus. Réserve nommée, pas une objection : la
     charge de l'assertion doit être `GABARIT_SORTIE`, pas les clés nues (C1),
     et le cas négatif est obligatoire. **Mon veto conditionnel est DÉSAMORCÉ.**
O3 · « Si ce retrait vide une partie requise » sans parties définies — RETIRÉE,
     résolue : `PARTIES_REQUISES['personnage-prose'] = ['canon.ton']`.
P1 · 12 chemins injectés — MAINTENUE contre les 7 (C2).
P2 · `PARTIES_REQUISES` = R1 + R2 — R1 MAINTENUE, R2 RETIRÉE (C2).
P3 · `DEROGATIONS_AUDIENCE = []` assertée vide — MAINTENUE, convergente.
P4 · Allow-list de sortie : 29 exclusions nommées + 3 cardinalités — RETIRÉE
     pour l'it1. Motif, et c'est une CONSÉQUENCE de C1, pas une concession
     séparée : sous le schéma `{valeur}` le modèle ne nomme plus aucun champ,
     donc l'instrument n'a plus rien à discriminer avant l'it2 — le PM a raison
     et son motif devient exact. Je garde la moitié POSITIVE, nécessaire :
     `CHAMPS_PROPOSABLES['personnage-prose']` = 3 chemins, en valeur, et
     `PropositionResolue.champ` en est vérifié membre AVANT `update` — sinon le
     nom de champ qui atteint `DossierService.update` est de l'état d'écran non
     contrôlé. Un tableau, un `includes`.
P5 · `CLE_SORTIE`/`GABARIT_SORTIE` dans un seul fichier + import worker —
     DURCIE sur la source unique, ASSOUPLIE sur le moyen : duplication +
     balayage de source à allow-list de deux porteurs, avec cas négatif (C6).
P6 · Garde worker en OCTETS (`TextEncoder`) — MAINTENUE, convergente (TL-9).
N-R1 à N-R5, N-R8 à N-R11 — MAINTENUS, inchangés.
N-R7 (écho du champ) — MAINTENU (C1).
N-R12 (`synopsis_mj` requis) — MAINTENU (C2, sur mesure).
N-R13 (neuf) — `PLAFOND_PROSE` comme prédicat de validation (C11).
N-R14 (neuf) — un scanner de FORME seule, sans appartenance (QA).
N-R15 (neuf) — le rôle nommé `fiche-prose` (C7).
N-R16 (neuf) — une coupe REMPLISSAGE-seul qui laisserait une cible rédigée
     sélectionnable : écriture destructrice sans bloc AVANT (C3).

AUCUN VETO. Mon veto conditionnel du tour 1 est levé : le témoin KR-236 est
au plan, dans la porte de commit.

VERDICT — recevable sous réserve

  R-a · `CLES_PROPOSITION = ['valeur']` et `PropositionRendue = { valeur:
        string }` — UNE forme, écrite au § 8, pas deux qui cohabitent.
  R-b · `PARTIES_REQUISES['personnage-prose'] = ['canon.ton']` — une entrée,
        pas deux ; l'atteignabilité du refus est mesurée, pas supposée.
  R-c · Si REMPLACEMENT est reporté, alors une cible rédigée n'est pas
        sélectionnable, raison nommée dans le `title`. La coupe sans ce
        prédicat n'est pas recevable.
```

---

# ANNEXE — formes littérales révisées

## A. Le contrat de fil, en UNE forme (C1)

```jsonc
// corps de REQUÊTE (client → worker) — inchangé, trois clés
{ "role": "personnage-prose", "champ": "monde.personnages[].fonction", "contexte": "…" }

// corps de RÉPONSE attendu du modèle — UNE clé
{ "valeur": "Forgeron du bourg, seul à savoir retremper une lame d'acier noir." }
```

```ts
// --- src/brain/copilote/schemaSortie.ts --- (autorité unique)

/** La (les) clé(s) du schéma de sortie, EN VALEUR : le garde KR-236 les énumère
 *  à l'exécution, et le validateur est PILOTÉ par cette liste. Une seule entrée
 *  à l'it1 — la cardinalité n'est pas ce qui rend la liste nécessaire. */
export const CLES_PROPOSITION = ['valeur'] as const

/** Le squelette littéral que l'invite du worker incruste, et la CHARGE de
 *  l'assertion KR-236 — jamais les clés nues, qui sont des mots français
 *  ordinaires d'une invite et rendraient le garde vert sur une invite muette. */
export const GABARIT_SORTIE = '{"valeur": "…"}'
```

```ts
// --- src/brain/copilote/types.ts ---

export type RoleCopilote = 'personnage-prose'
export type ChampProse = 'fonction' | 'apparence' | 'description_joueur'

/** CE QUE LE MODÈLE REND. Aucune désignation d'entité, AUCUNE désignation de
 *  champ : la cible est le couple {entiteId, champ}, elle est indivisible et
 *  elle reste côté client (KR-231). Schéma FERMÉ. */
export interface PropositionRendue { valeur: string }

/** CE QUE LE CODE RE-RÉSOUT. Zéro clé commune avec la forme réseau — on ne peut
 *  pas passer l'une pour l'autre par mégarde. */
export interface PropositionResolue { entiteId: string; champ: ChampProse; texte: string }
```

Les DEUX types du Tech Lead restent, et sa défense (KR-231, deux périmètres de confiance) est **mieux servie** : ils ne partagent plus aucune clé. Sa ligne « le validateur refuse `{champ, texte, entiteId}` comme clé surnuméraire » devient « refuse `{valeur, champ}` », plus simple.

### Les SIX prédicats de forme (KR-229) — le cinquième retiré

1. la charge est un **objet** JSON (ni tableau, ni `null`) ;
2. l'ensemble de ses clés est **exactement** `new Set(CLES_PROPOSITION)` — une clé en trop est un **refus** (N-R8) ;
3. `typeof valeur === 'string'` ;
4. `valeur.trim().length > 0` ;
5. `!valeur.includes(MARQUEUR_A_ECRIRE)` — constante **importée** de `brain/dossier/amorce.ts` (KR-223) ;
6. scanner anti-identifiant **forme ∧ appartenance** (§ D), avec ses deux canaris dans le même test.

**Comportement en cas d'échec**, inchangé : violation d'un des six ⇒ **rejeu exactement une fois** ; second échec ⇒ `{statut:'illisible', motif}`, état **terminal**, `DossierService.update` non appelé, `PersistenceService.set` non appelé, bus muet, `fetch` appelé **exactement 2** fois, aucune rétention des deux sorties fautives. Réseau / 5xx / 413 / abort ⇒ `indisponible{raison}`, **aucun rejeu** (N-R6).

## B. `CHAMPS_INJECTES` — 12 chemins (C2)

```ts
export const CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]> = {
	'personnage-prose': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.mj.synopsis_mj',
		'canon.partage.accroche_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].apparence',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
		'monde.personnages[].but.pourquoi',
		'monde.personnages[].caractere.parler[]',
		'monde.personnages[].caractere.jamais',
		'monde.personnages[].plan_actions[].action',
	],
}
export const DEROGATIONS_AUDIENCE: readonly string[] = []   // assertée vide
export const CHAMPS_PROPOSABLES: Record<RoleCopilote, readonly ChampProse[]> = {
	'personnage-prose': ['fonction', 'apparence', 'description_joueur'],
}
```

Entrées 5-12 **restreintes au personnage désigné**. La **cible n'est jamais injectée dans sa propre demande** (règle (4) du Tech Lead, endossée). Les cinq chemins que le Tech Lead omet sont exactement le substitut que `destinations.ts` nomme pour `camp`/`portee`/curseurs — sans eux, un personnage décrit par son `but` produit un contexte vide de lui.

## C. `PARTIES_REQUISES` — une entrée (C2)

```ts
export const PARTIES_REQUISES: Record<RoleCopilote, readonly string[]> = {
	'personnage-prose': ['canon.ton'],
}
```

Atteignabilité **mesurée par lecture de source** : `amorce.ts` l. 57 compose `AMORCE.ton` à partir de `MARQUEUR_A_ECRIRE` ; l. 105 `construireAmorce` l'écrit dans `canon.ton`. Dossier neuf ⇒ retrait ⇒ partie requise vide ⇒ `{ok:false, motif:'a-ecrire', chemin:'canon.ton'}`, **zéro appel réseau**. *(La couleur du test : NON MESURÉE.)*

Asymétrie à écrire au plan : le `ton` gouverne la **forme** (l'auteur ne peut pas la rattraper en éditant), le `synopsis_mj` le **fond** (il le juge dans le diff). Facultatifs, retirés en silence : les onze autres chemins. Le retrait est un **retrait**, jamais une substitution par `""`.

## D. Scanner anti-identifiant — forme ∧ appartenance (QA)

```
hit  ⇔  (sous-chaîne de forme <espace>.<slug>, motif NON ancré dérivé de
         ESPACES_DE_NOMS — jamais re-listé)
     ∧  (cette sous-chaîne ∈ { id | collectIds(dossier) })
```

`collectIds` est déjà `export function` et **total sur `unknown`** (`identifiers.ts` l. 253) ; `dossier` est déjà paramètre de `demander`. Coût : un `Set`.

Trois assertions dans le même test :
- **bénin** — `'Il dit: « Enfin.tout est pret. » Elle range son objet.favori.'` (mot pour mot, QA) ⇒ **accepté**, ET le test asserte que l'ensemble d'ids du dossier ne contient ni `fin.tout` ni `objet.favori` — le canari dit pourquoi il est vert ;
- **fuite** — une prose contenant `lieu.amorce` en milieu de phrase ⇒ **refus du lot entier**. `lieu.amorce` est garanti par `construireAmorce` (l. 79 / l. 111) : il ne peut pas disparaître d'une fixture. `pnj.aldur-2` peut s'y ajouter ;
- **pouvoir séparateur, écrit et non déduit** : un scanner de forme SEULE doit faire **rougir** le canari bénin ; un scanner d'appartenance SEULE doit rester vert sur la fuite si on vide le `Set`. À écrire réellement à l'essaim (KR-235 / BUG-087). **NON MESURÉ** à ce jour.

## E. Ce que le modèle ne voit pas — inchangé, coûts nommés

Nom (`auteur`), camp/portée (`moteur`), les 6 curseurs et les 8 caractéristiques (`moteur`), les autres fiches, le lieu. La parade n'est pas d'élargir la table, c'est le diff.

## F. La voix — inchangée, et c'est le point qu'un ouvrier écrasera par réflexe

**Aucune consigne « deuxième personne, présent, immersive » dans l'invite de `personnage-prose`** (N-R10). `description_joueur` est du **contexte injecté au narrateur**, jamais émis verbatim (`destinations.ts` l. 168-174). L'invite demande une **fiche**, pas une scène. À écrire **noir sur blanc dans le lot qui pose l'invite** : le texte fautif sera joli, donc personne ne le verra en revue.
Bouton **« Lancer »**, identique au premier essai et aux suivants. Aucun adjectif évaluatif dans les quatre textes ni les libellés d'action — **seule forme d'anti-complaisance qui survit à la coupe**, et elle est testable.

## G. Rejets mis à jour — à recopier au § 8 du plan (BUG-082)

| # | Rejet | Statut | Motif en une phrase |
|---|---|---|---|
| N-R1 | `caractere.cede_si` au contexte de l'it1 | maintenu | `ia` **sous condition de rôle** ; décision d'audience, à prendre au lot contrat de l'it3. |
| N-R2 | `relations[].lien` au contexte de l'it1 | maintenu | Même prédicat de rôle, **et** il arrive non ancré : « son frère » sans savoir de qui. |
| N-R3 | `plan_actions[].si_bloque`, `savoirs[].revele_comment` | maintenu | `ia` **sous condition d'état** constatée par le **moteur** : jamais satisfiable en rédaction. |
| N-R4 | `savoirs[].indice_id` / `.certitude` | maintenu | Ne sont `ia` que via la recomposition par **rang** ; l'it1 interdit les rangs. |
| N-R5 | Garde anti-paraphrase à **seuil de similarité** | maintenu | Seuil numérique sans sémantique choisie (KR-235). |
| N-R6 | Rejouer un 5xx, un 413 ou un abort | maintenu | Sans mémoire, le second corps est **identique** : rejouer un déterminisme met deux critères en contradiction. |
| N-R7 | Un **écho du `champ`** dans la sortie du modèle | **maintenu (C1)** | Une sortie conforme au schéma peut nommer le MAUVAIS champ ; la cible est un couple indivisible qui ne franchit jamais le réseau (KR-231). |
| N-R8 | Tolérer une clé en trop | maintenu | Une clé en trop **est** le signal KR-236 : l'avaler rend la panne muette. |
| N-R9 | Allow-list de sortie hébergée dans le worker | maintenu | Règle dupliquée code/prompt ; KR-116 valide où la donnée entre dans le dossier. |
| N-R10 | « Deuxième personne, présent » dans l'invite | maintenu | `description_joueur` est du contexte injecté : une prose en voix de scène devient fausse à la n° 10. |
| N-R11 | Recopier `body.length > …` de `worker/index.ts:84` | maintenu | Compte de **caractères** UTF-16 : les deux plafonds mesureraient la même grandeur. |
| N-R12 | Rendre `canon.mj.synopsis_mj` **requis** | **maintenu (C2, sur mesure)** | Le refus est **déjà atteignable** par `canon.ton` seul sur un dossier neuf. |
| **N-R13** | `PLAFOND_PROSE` comme prédicat de validation | **neuf** | Bornerait trois champs que le schéma laisse délibérément non bornés (KR-203, doctrine de famille), depuis un second site, sur un nombre non mesuré. |
| **N-R14** | Scanner de **forme seule**, sans appartenance | **neuf** | Un identifiant est une appartenance au dossier, pas une silhouette ; la forme seule refuse de la prose française saine. |
| **N-R15** | Rôle nommé `'fiche-prose'` | **neuf** | Le rôle clé `CHAMPS_INJECTES` et il est un segment d'URL : il doit encoder le type d'entité. |
| **N-R16** | Coupe REMPLISSAGE-seul **sans** rendre une cible rédigée non sélectionnable | **neuf** | L'acceptation écraserait du canon rédigé sans montrer ce qu'elle remplace. |
| **N-R17** | Ma propre affirmation « le bloc AVANT est le SEUL garde anti-complaisance » | **RETIRÉ PAR MOI** | Faux : le diff attrape l'auto-paraphrase de la cible, pas la paraphrase du contexte. Surestimation de couverture. |
| **N-R18** | Ma propre disjonction R2 « 1 sur 5 » | **RETIRÉ PAR MOI** | N'entre pas dans la branche `refuse{chemin}` sans un cinquième texte, et livre un jugement éditorial en garde de forme. |

## H. Fichiers lus à ce tour (lecture seule)

Les cinq notes de tour 1 + `cadrage.md`, SKILL.md, `src/brain/dossier/amorce.ts`, `identifiers.ts`, `tables.ts` (l. 630-690), `types.ts` (l. 1462-1480 + grep optionnalité), `couverture.test.ts` (l. 1085-1102), `specification.json` (l. 1-40). Greps : `MARQUEUR_A_ECRIRE|AMORCE\.` sur `src/` hors tests ; les trois chemins de prose sur `src/brain/dossier` hors tests ; `BUDGETS_DE_MOTS|compterMots`. **Aucune commande de test exécutée — toute affirmation de couleur de test est marquée NON MESURÉ.**
