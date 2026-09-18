# Tour 1 — `narratif-ia` · `dossier-copilote` it3a

**RISQUE** — 3a rend au modèle un canal de **prose**, donc rouvre le canal que l'it2 avait fermé par la forme. Une réplique qui paraphrase `canon.mj.synopsis_mj` met du savoir MJ dans la bouche d'un PNJ, ratifié d'un clic, puis injecté au rôle **acteur** en Temps 2 et **parlé**. Le diff n'attrape que l'auto-paraphrase de la CIBLE, jamais celle du CONTEXTE — surestimation déjà retirée à l'it1. Second risque, plus sournois : accepter une réplique sur un personnage **sans bloc `caractere`** crée ce bloc ; un ouvrier qui le « complète » avec `CURSEURS_INITIAUX` écrit six chiffres que l'auteur n'a jamais vus et éteint en silence le constat de `dossier-controles` (KR-221).

**OBJECTION** — (1) « Champs candidats : `parler`, `jamais`, `cede_si` » : les deux derniers sont des **scalaires**, ils n'ont rien à faire dans un rôle dont le neuf est la LISTE, et un gabarit apparié au rôle ne porte pas deux formes. (2) La **liste vide** : l'it2 a écrit « le vide est un succès » ; recopié ici, c'est un panneau vide sans motif. (3) Budget et `max_tokens` du rôle neuf ne sont annoncés nulle part : recopier 6000/200 desserrerait la garde d'un rôle par la mesure d'un autre (KR-235).

**PROPOSITION** — Rôle neuf `personnage-repliques`, cible unique `caractere.parler[]`. Contexte = les 12 chemins de `personnage-prose` **moins `canon.mj.synopsis_mj`** **moins la cible**, exclue par **absence de la liste blanche** et non par saut à l'exécution. Liste vide ⇒ `'vide'`. Ce que le modèle ne voit pas, **l'auteur le voit** : les répliques déjà écrites s'affichent, gelées au lancement.

**VERDICT** — **recevable sous réserve**. Un seul **VETO** : **les six curseurs ne sont pas proposables** — 3d supprimée, remplacée par un REPORTÉ à condition d'ouverture écrite.

---

# ANNEXE

## A. LA DÉCISION : les curseurs ne sont **PAS** proposables — `open_question` n° 1 **CLOSE**, **3d SUPPRIMÉE**

### A1. Ce qui ne tranche pas
Le motif de `destinations.ts` (« un modèle qui lit `mefiance: 8` connaît l'exacte profondeur… ») est un motif d'**INJECTION**. Il ne dit rien du PROPOSER, et KR-232 interdit d'en déduire l'autre. **L'argument « c'est `moteur`, donc non » est irrecevable** — il ferait de KR-232 une distinction décorative.

### A2. Ce qui tranche — trois motifs
**(i) Proposer un chiffre exige de faire franchir le réseau un registre de CODE que la table d'audience ne gouverne pas.** Pour rendre `mefiance: 8`, le modèle doit connaître les six noms, l'échelle `CURSEUR_MIN..MAX` et le sens de chaque extrémité. Rien n'est dans le document : `CURSEURS[].label`/`.describe` sont des chaînes de `curseurs.ts`, et `destinations.ts` dit de leur voisin `affinite` « donnée de code, sans clé de schéma, donc **sans ligne dans cette table** ». Ces chaînes partiraient soit dans l'**invite** (second domicile d'un registre — douze chaînes tenues par un balayage, contre deux aujourd'hui), soit dans le **corps de requête** (le client décidant *ce qu'on demande*, contre la résolue n° 6). **Les deux issues sont mon veto.**
**(ii) `relations[].intensite` est nommément exclu par le critère 8, au MÊME arbitrage.** Deux champs au même arbitrage ne peuvent recevoir deux traitements sans **discriminant écrit**. Le seul candidat — « les curseurs ont trois proses voisines qui les paraphrasent » — joue **contre** : ces proses sont précisément ce que 3a livre.
**(iii) La valeur d'un curseur est l'ENTRÉE du libellé dérivé que la n° 10 doit livrer par le code.** Faire écrire l'entrée par le modèle avant que la sémantique existe, c'est « inventer un trait de caractère côté prompt » — les mots exacts du JSDoc.

### A3. La règle qui empêche VOIR/PROPOSER de devenir une passoire
> **Un champ `moteur` est PROPOSABLE si et seulement si sa valeur est décidable à partir de ce que le contexte porte déjà sous audience `ia`, sans faire franchir au modèle une sémantique que le DOCUMENT ne porte pas.** Ce qui a le droit de franchir en plus : la **forme de la réponse attendue** (`GABARIT_SORTIE`, un compte de sortie, `max_tokens`). Jamais un **registre de code** portant du sens de domaine.

Appliquée : `curseurs` non, `intensite` non, `stats` non, `portee` non, `confiance_min` non, `duree`/`delai` non, tout `…_expr` non.

### A4. « Proposer un chiffre est-il plus ou moins grave que le paraphraser ? »
Deux pannes de sens contraire. **Paraphraser en contexte** = risque de LECTURE, payé au runtime, **invisible**. **Proposer un chiffre** = risque d'ÉCRITURE, payé à la ratification, **visible dans le diff**. Strictement sur la visibilité, proposer est **moins grave** — ce n'est pas ce qui le tue. Ce qui le tue est (i) : **la gravité n'est pas dans la sortie du modèle, elle est dans l'entrée qu'il a fallu ouvrir pour l'obtenir.**

### A5. La forme si la question revient — **et jamais une autre**
> Le modèle ne rend **jamais l'entier**. La n° 10 livre un **libellé dérivé PAR LE CODE** avec sa ligne d'audience ; le code fournit la **liste fermée de ces libellés**, et le modèle rend **un libellé par curseur**, re-résolu par `Map.get` — mécanisme **identique au rang `P1..PN`**, interdiction de conversion numérique comprise. Sortie à **six clés exactement**, dérivées de `CURSEUR_VALUES` ; un lot à 1-5 clés est **refusé en entier**, jamais complété.
> **Condition d'ouverture** : la n° 10 a livré le libellé dérivé et sa ligne d'audience. Propriétaire : n° 10. **Tant qu'elle n'a pas livré, aucun rôle ne propose de curseur, et aucune invite ne nomme un curseur.**

### A6. Ce que la décision emporte
**3d supprimée** (la feature reste 3a/3b/3c) · **la variante `GROUPE` de `LigneProposition` perd son unique instance** — non construite (KR-109), à inscrire sinon un ouvrier la livrera parce qu'elle est écrite · **`open_question` n° 1 part**.

## B. LE CONTEXTE DU RÔLE 3a

### B1. Rôle
`'personnage-repliques'`. `RoleCopilote` passe à **trois** membres : les quatre `Record<RoleCopilote, …>` **ne compilent plus** tant qu'ils ne sont pas remplis — la garde travaille. Côté worker, `INVITES` et la copie de `GABARIT_SORTIE` sont des `Record<string, …>` : **le compilateur ne voit rien**, c'est le balayage qui doit passer à 3, et **le canari croisé couvre désormais 6 mésappariements, pas 1**. Une **troisième surcharge** de `demander` n'ajoute **aucun membre** — les bouchons restent complets.

### B2. `CHAMPS_INJECTES['personnage-repliques']` — **10 chemins**

| # | chemin | statut |
|---|---|---|
| 1 | `canon.ton` | **REQUIS** |
| 2 | `canon.interdits_ton[]` | optionnel |
| 3 | `canon.partage.accroche_joueur` | optionnel |
| 4-6 | `…fonction`, `…apparence`, `…description_joueur` | optionnels |
| 7-8 | `…but.libelle`, `…but.pourquoi` | optionnels |
| 9 | `…caractere.jamais` | optionnel — **la limite**, elle borne ce qu'il peut dire |
| 10 | `…plan_actions[].action` | optionnel |

Les dix ont déjà la destination `'ia'` — **aucune ligne neuve, aucune dérogation**.

**`canon.mj.synopsis_mj` est RETIRÉ, et c'est la décision de contexte de cette tranche.** Ce qu'il apporte à l'écriture d'une voix : presque rien. Ce qu'il risque : une réplique qui le paraphrase met du savoir MJ dans une phrase que le Temps 2 donnera au rôle **acteur**. **Asymétrie du regret.** Le rôle est ainsi **strictement plus étroit** que `personnage-prose`.

**`cede_si` reste hors du contexte** : un rôle de rédaction n'est ni narrateur, ni acteur du porteur, ni arbitre — le prédicat n'a pas de sujet, il est **inapplicable**, et l'inapplicable ne s'injecte pas. **`caractere.curseurs.*` : jamais** (A).

### B3. La cible n'entre pas dans sa propre demande — **par ABSENCE, pas par saut**
`caractere.parler[]` **n'est pas listé**. Motifs : un chemin listé puis systématiquement sauté serait une **ligne morte** (KR-235) ; l'absence ne peut pas être ré-ouverte par un bogue de cible, le saut si.

**Le dilemme du cadrage se dissout : on ne les cache pas, on les montre à l'AUTEUR.** Les répliques déjà écrites s'affichent, **gelées au lancement** (mécanisme `valeurAvantGelee`, BUG-097). Le modèle ne voit rien ; l'auteur voit tout ; le doublon se refuse d'un clic.

### B4. Les refus, ordre figé, **tous avant le moindre `fetch`**
1. `a-ecrire` (charge `'canon.ton'`) — inchangé.
2. **`cible-a-ecrire`** (sans charge, motif **réutilisé**) — **aucun** chemin de préfixe `monde.personnages[].` ne résout non vide. **C'est le prédicat de vacuité que l'`open_question` n° 6 exigeait d'écrire AVANT le garde** : déjà calculé (`retenus`), aucun mécanisme neuf, **aucun seuil numérique**.
   **Discriminant à écrire sinon il sera « harmonisé »** : on peut inventer une **FONCTION** à partir de rien — c'est la page blanche que le goal nomme ; on ne peut pas inventer une **VOIX** à partir de rien. **Le garde vaut pour le rôle neuf, et pour lui seul.**
3. `trop-long` — refus, **jamais** de coupe.

### B5. Budget — **NON MESURÉ PAR MOI**
Se re-dérive au lot contrat : composer l'entité de mesure → **asserter d'abord** que les 10 chemins résolvent non vides (sans quoi le nombre est un **plancher**) → `budget = ceil(M × 3 / 1000) × 1000`. Repère : l'it1 a mesuré M = 1783 sur 12 chemins ⇒ 6000 ; le rôle 3a en a **deux de moins** ⇒ **on attend ≤ 6000**, on ne l'écrit pas sans mesure. Si la mesure déplaît, **on retire un chemin — on ne monte jamais le budget.** `TAILLE_MAX_CORPS_IA` par `max` sur trois rôles : **à constater, pas à supposer**.

## C. LE CONTRAT DE SORTIE

```ts
export interface RepliquesRendues { repliques: readonly string[] }        // FRANCHIT
export interface PropositionRepliques { entiteId: string; textes: readonly string[] }  // JAMAIS
export const CLES_SORTIE_REPLIQUES = ['repliques'] as const
export const REPLIQUES_PROPOSEES_MAX = 3
GABARIT_SORTIE['personnage-repliques'] = '{"repliques": ["…", "…"]}'
```
**Zéro clé commune.** Aucun écho du champ : le rôle **est** le champ, le corps ne porte pas de `champ`. `REPLIQUES_PROPOSEES_MAX` (3) **n'est pas** `PARLER_REPLIQUES` (2) et ne s'y aligne jamais — l'un est la forme de la réponse attendue, l'autre la borne d'interface du document. `PROPOSITIONS_MAX` **n'est pas réutilisée**.

### C3. `validerRepliques` — prédicats, chacun prouvable seul
(1) objet simple → `schema` · (2) clés = exactement `CLES_SORTIE_REPLIQUES` → `schema` · (3) tableau → `schema` · (4) chaque élément une chaîne → `schema` · (5) longueur ≤ `REPLIQUES_PROPOSEES_MAX`, **refus jamais troncature** → `schema` · (6) **longueur ≥ 1** → **`vide`** · (7) chaque élément non vide après `trim()` → `vide` · (8) éléments **distincts** après `trim()` → `schema` · (9) aucun `MARQUEUR_A_ECRIRE` (constante **importée**) → `marqueur` · (10) aucun identifiant du dossier — **`porteUnIdentifiant` réutilisée telle quelle** → `identifiant`.

**Aucun motif neuf**, `MotifIllisible` inchangée. **Aucune borne de longueur par réplique** (KR-203). **Refus du LOT ENTIER** sur un seul élément fautif, puis rejeu une fois, puis terminal.

### C4. Le discriminant du **vide** — la ligne à ne pas recopier de l'it2
> **Le vide est une RÉPONSE quand la question porte sur un FAIT DU MONDE** (« qui d'autre pourrait savoir ? » → « personne » est vrai ; punir cette réponse est une machine à complaisance).
> **Le vide est une NON-RÉPONSE quand la question porte sur une RÉDACTION** (« comment parle-t-il ? » a toujours une réponse dès qu'il existe quelqu'un pour parler — et s'il n'y a personne, c'est le refus B4-2 qui l'a dit **avant** l'appel).

### C5. À L'ACCEPTATION — deux invariants **de code**
1. **`PARLER_REPLIQUES` est un plafond d'écriture.** Une ligne cesse d'être acceptable dès que `parler.length` l'atteint, avec une raison nommée. Le copilote n'écrit **jamais** un état que l'éditeur de fiche ne peut pas produire. Constante **importée**, jamais retapée.
2. **Créer le bloc `caractere` ne sème AUCUN curseur.** Écrire `caractere: { parler: [texte] }` — **jamais `CURSEURS_INITIAUX`**. Deux dégâts sinon : six valeurs ratifiées sans avoir été vues, et un bloc tout au plancher **indistinguable d'un réglage délibéré** (KR-221) — le voyant s'éteint sans que personne n'ait réglé quoi que ce soit.

## D. L'INVITE, MOT POUR MOT

```
Tu assistes l'AUTEUR d'un livre-jeu qui règle la façon de parler d'un personnage.
À partir du contexte fourni, tu proposes des répliques types : de courtes phrases que CE personnage-là pourrait dire, telles qu'il les dirait.

Tu réponds par un objet JSON et rien d'autre, de la forme {"repliques": ["…", "…"]} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

Chaque réplique est un ÉCHANTILLON DE VOIX : elle servira plus tard à faire parler ce personnage dans des scènes que tu ne connais pas, elle ne sera jamais lue telle quelle à un joueur.
Tu en donnes trois au plus, toutes différentes, chacune tenant en une ou deux phrases.
Chaque réplique ne dit que ce que CE personnage sait et dirait lui-même : ni ce que l'auteur sait, ni ce qui va se passer, ni ce qu'un autre personnage tait.
Tu respectes le ton de l'aventure et ses interdits de ton.
Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.
```

`max_tokens: 400` — **dérivé** : plus longue réplique attestée 74 caractères (JSDoc), celle de la fixture 64. Pire cas 3 × 74 + enveloppe ≈ 27 ⇒ L ≈ 249 ; `r = 2` (pire ratio) ⇒ 374 ⇒ **400**. ⚠ **Comptages faits à la main — aucune commande exécutée**, à refaire au lot contrat.

**« ÉCHANTILLON DE VOIX » doit être dit** — on énonce la **DESTINATION** (« elle servira à faire parler… », « jamais lue telle quelle »), **jamais** le champ ni sa doctrine. Aucun validateur ne peut constater cette propriété (KR-229) : l'invite est le seul endroit qui reste.
**« Trois au plus »** est la forme de la réponse attendue, **EN PLUS du contrat, jamais À LA PLACE**. ⚠ **L'invite ne dit JAMAIS « deux au plus »** : `PARLER_REPLIQUES` est une borne du **document**, l'y recopier serait la règle dupliquée code/prompt.
**Le piège de recopie sur LA VOIX** : l'it1 écrit « Tu écris une NOTE DE FICHE » parce que ses proses sont des **descriptions**. Une réplique est une **phrase prononcée**. Recopier la ligne de l'it1 produirait des descriptions de voix au lieu de voix.

## F. LE CANAL DE LA PARAPHRASE — **ROUVERT, je le dis**

| Mode d'échec | Arrêté par | Instrumenté ? |
|---|---|---|
| **Fuite MJ** | le CONTEXTE : `synopsis_mj` retiré | **oui**, le test de confinement le constate |
| Identifiant recopié | prédicat 10 | **oui** (+ deux canaris) |
| Liste vide | prédicat 6 | **oui** |
| Nombre gonflé | prédicat 5 | **oui** |
| Répliques identiques | prédicat 8 | **oui** |
| Réplique **générique** | le CONTEXTE : refus `cible-a-ecrire` | partiellement — le refus se teste, la généricité non |
| **Pastiche du contexte** | **rien** | **NON COUVERT — déclaré** |
| **Redite de ce qui est écrit** | **rien** ; l'auteur voit l'AVANT gelé | **NON COUVERT — déclaré** |

**Mémoire : aucune.** Conséquence **asymétrique par rapport à l'it2, à écrire** : un détenteur accepté devenait inénonçable ; une réplique acceptée **n'est pas injectée**, elle **peut** être re-proposée. Borné par `PARLER_REPLIQUES` et par les yeux de l'auteur. La mention de relance **ne doit pas recopier** celle de la carte 2 (« un détenteur accepté jamais »), **fausse ici**.

## G. CE QUE LES FAITS MESURÉS APPORTENT

**`dossier-controles` porte déjà un constat dont le producteur EST la cible de 3a** : règle **`personnage-sans-voix`** (`info`), prédicat `(caractere?.parler ?? []).length > 0`.
1. **Le ciblage peut PARTIR DU LINTER**, comme la carte 2. Mesuré : **5 personnages sur 6 signalés** (tous sauf `pnj.corvin-le-marchand`). **Contraste avec l'it2** : ici le chemin **passant** est instanciable sur la fixture intacte, et le refus `cible-a-ecrire` a **zéro instance** — c'est le **refus** qu'il faut composer en mémoire, l'inverse de l'it2. Limite : corvin (1 réplique, plafond 2) devient **inatteignable** par ce ciblage.
2. **L'acceptation éteint `personnage-sans-voix` — et l'extinction est VRAIE** (contraire du cas `certitude` de l'it2). Le rappel de l'it2 s'applique : l'écran le dit **avant** le geste, en mention permanente.
3. **Le piège des libellés est désamorcé sans toucher un fichier interdit** : la prose qui nomme le champ **existe déjà dans `brain/`** — `PROSE_PERSONNAGE_SANS_VOIX.remediation`.
4. **La valeur de la tranche est déjà écrite dans `brain/`** : le JSDoc dit « le modèle inventera, simplement **sans mémoire d'un tour à l'autre** ». 3a supprime cette dérive.

## I. `REJETÉ` — à recopier tels quels au § 8

- **Les six curseurs PROPOSABLES** *(veto)* : proposer un chiffre oblige à faire franchir le registre `CURSEURS`, donnée de **code** sans ligne d'audience — par l'invite c'est une règle dupliquée, par le corps de requête c'est le client qui décide *ce qu'on demande*. **3d supprimée** ; forme et condition d'ouverture : A5.
- **La variante `GROUPE` de `LigneProposition`** : unique instance disparue, zéro appelant (KR-109).
- **`jamais` et `cede_si` dans 3a** : **scalaires** ; un gabarit apparié au rôle ne porte pas deux formes. **REPORTÉ** vers `personnage-prose`, au prix du passage de `CHAMPS_PROPOSABLES` à des clés **imbriquées** — l'arbitrage réel, non gratuit.
- **`cede_si` PROPOSABLE en 3a** : pas sur le fond, sur la forme (scalaire). Condition d'ouverture et **prédicat amendé à écrire AUX DEUX SITES** avec la 5ᵉ instance de l'instrument « présent aux deux sites » : « *EN RÉDACTION il n'existe ni session ni rôle de jeu : le prédicat n'a pas de sujet. Le champ ne peut JAMAIS être INJECTÉ par un rôle de rédaction. Il peut être PROPOSÉ : proposer, c'est écrire un champ que l'auteur ratifie, jamais le lire. Condition TESTABLE : un rôle qui le nomme dans l'allow-list des PROPOSABLES ne le nomme PAS dans `CHAMPS_INJECTES`.* » Sans cette écriture, un ouvrier « réparera » l'asymétrie en l'injectant.
- **Injecter les répliques déjà écrites** : canal de paraphrase que la règle 5 ferme, pour un bénéfice qui se paie d'un quasi-doublon ratifié d'un clic.
- **Un prédicat de similarité** entre réplique proposée et document : la frontière testable est la **forme** (KR-229), et un prédicat d'égalité exacte n'a **aucun producteur mesuré** (KR-235).
- **Réutiliser `PROPOSITIONS_MAX`** : même valeur, aucune raison commune d'évoluer.
- **Aligner « trois au plus » sur `PARLER_REPLIQUES`** : borne du document recopiée dans l'invite = règle dupliquée.
- **Recopier `BUDGET…['personnage-prose'] = 6000`** : desserrer la garde d'un rôle par la mesure d'un autre (KR-235).
- **Étendre le garde de vacuité à `personnage-prose`** : inventer une fonction à partir de rien **est** la page blanche du goal ; inventer une voix ne l'est pas.
- **« La liste vide est un succès » transporté de l'it2** : le vide est une réponse sur un **fait du monde**, une non-réponse sur une **rédaction**.
- **Semer `CURSEURS_INITIAUX` en créant le bloc `caractere`** : six valeurs ratifiées sans avoir été vues, bloc au plancher indistinguable d'un réglage délibéré (KR-221).

## J. MESURES

**Exécutées (lecture)** : `CHAMPS_INJECTES['personnage-prose']` contient **déjà** `caractere.parler[]` et `caractere.jamais`, **pas** `cede_si` · `dossier-reference.json` : **1 personnage sur 6** porte un bloc `caractere` (corvin, total) · les 6 portent **au moins une** ligne injectable ⇒ le refus `cible-a-ecrire` a **zéro instance** sur la fixture · `controles.ts` : `personnage-sans-voix`, `info`, **5 signalés sur 6** · longueurs comptées **à la main** : 64 et 74 caractères.

**NON MESURÉ — déclaré** : `M` et le budget du rôle · `E` et la re-dérivation de `TAILLE_MAX_CORPS_IA` sur **trois** rôles · les deux comptages (pas d'accès shell) · **le canari croisé à 3 entrées** doit être **écrit puis vu rouge**, pas supposé (BUG-087) · le remontage du panneau à la navigation, toujours ouvert.
