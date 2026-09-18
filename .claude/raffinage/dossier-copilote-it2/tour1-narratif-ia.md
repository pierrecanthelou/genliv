# Tour 1 — `narratif-ia` · `dossier-copilote` it2

```
RISQUE      Mesuré sur `dossier-reference.json` : `verite` manque sur 1 indice/4,
            `formulation_joueur` sur 2/4, et `indice.trace-du-guet` n'a AUCUN des
            deux. Hypothèse (lue en source, `controlerDossier` NON exécuté) :
            c'est le SEUL indice que `indice-sans-source` signale — les trois
            autres ont 2 producteurs. L'assistant est donc convoqué exactement là
            où son contexte est VIDE. Seconde mesure : 4 personnages sur 6 n'ont
            qu'UNE phrase d'audience `ia` (une `plan_actions[].action`) ;
            `fonction` n'existe que sur 2/6, `caractere` sur 1/6. Le copilote
            désignerait des profils anonymes d'une ligne : il devinerait, et
            l'auteur ne verrait pas qu'il devine.

OBJECTION 1 « aucun entier ne sort d'un modèle dans cette tranche » est FAUX si le
            rang est un nombre : il en sort N. Soit la phrase du goal est fausse,
            soit le rang est une chaîne — nulle part écrit, donc un ouvrier
            tranchera seul, avec `parseInt` et une base 0-ou-1.
OBJECTION 2 Laisser le modèle choisir la `certitude`, c'est lui faire inventer un
            fait FAUX que l'auteur n'a pas écrit, ratifié par un clic de liste :
            forme exacte du `porte_suggeree` déjà REJETÉ (résolue n° 9).

PROPOSITION Rang = jeton fermé `P1…PN`, validé par APPARTENANCE à la table rendue
            par l'assembleur (KR-231), jamais converti. Sortie
            `{"detenteurs":["P1"]}` : zéro prose, ≤3 éléments, rangs distincts,
            liste VIDE légale. Détenteurs actuels exclus de la table PAR
            CONSTRUCTION. `verite` requise → refus nommé sinon. Profil candidat =
            4 chemins, `apparence` exclue. `CANDIDATS_MAX` et `max_tokens` (=100,
            dérivé) posés dans le même lot que le budget re-dérivé.

VERDICT     recevable sous réserve — 5 réserves, toutes en annexe.
```

> **NOTE DE L'ORCHESTRATEUR, ajoutée après réception : l'hypothèse du § 13 est CONFIRMÉE, et par une assertion VERTE déjà au dépôt.** `src/brain/dossier/controles.test.ts` l. 1143-1147 épingle littéralement `pourLaRegle(controlerDossier(cloneReference()), 'indice-sans-source')` → `['indice.trace-du-guet → alerte']`, **un seul constat**. Et `indice.trace-du-guet` porte `verite` vide ET `formulation_joueur` vide (mesuré sur la fixture). Le chemin nominal *passant* de l'it2 n'est donc **pas** instanciable sur la fixture telle quelle. Ce n'est plus une hypothèse à mesurer au lot contrat.

---

# ANNEXE

## 0. Les cinq réserves du verdict

| # | Réserve | Où elle se règle |
|---|---|---|
| R1 | La condition d'état de `monde.indices[].verite` est **ré-écrite** aux deux sites qui la portent, jamais contournée en silence | lot `contrat` |
| R2 | Le rang est un **jeton-chaîne** d'un ensemble fermé, validé par appartenance ; aucune conversion numérique nulle part | lot `contrat` |
| R3 | Le modèle **ne choisit pas la certitude** (ou, s'il la choisit, la garde anti-complaisance § 6 est livrée avec) | lot `contrat` |
| R4 | Le refus « cet indice n'est pas écrit » est **nommé, actionnable et démontré** sur `indice.trace-du-guet` | critère d'acceptation |
| R5 | `CANDIDATS_MAX` est la variable libre, le budget est **re-dérivé par sa formule** ; on baisse K, on ne monte jamais le budget | lot `contrat` |

## 1. `monde.indices[].verite` en RÉDACTION — la question qui décide de l'itération

**Réponse : la condition ne s'applique pas telle qu'elle est écrite, et elle ne se contourne pas non plus — elle se RÉ-ÉCRIT.**

Le prédicat écrit à `destinations.ts` (l. 412-425) et au JSDoc `Indice.verite` (`types.ts` l. 1048-1060) porte sur un **fait de session** : « QUE lorsque le moteur a constaté cet indice ACQUIS ». En rédaction il n'y a ni moteur ni session : le prédicat **n'a pas de sujet**. Deux lectures, et c'est l'ambiguïté qu'un ouvrier tranchera seul si le comité ne le fait pas :

- **lecture « jamais vrai »** → `verite` exclue. Conséquence **mesurée** : `indice.lettre-de-la-vigie` et `indice.trace-du-guet` tombent à **zéro champ injectable**, et `trace-du-guet` est justement l'unique indice signalé. Un assistant sans contexte qui rend quand même une liste est un tirage de noms. Cette lecture **tue l'itération** ;
- **lecture « sans objet »** → `verite` injectée. Le **motif** de la condition, écrit noir sur blanc aux deux sites, est de protéger le JOUEUR d'un narrateur qui connaîtrait la solution d'avance. En rédaction, le destinataire est **l'auteur qui a écrit cette vérité lui-même**, et la sortie est une liste de rangs relue dans un diff. Il n'y a personne à spoiler et aucun état à devancer.

**La formulation à écrire aux deux sites** (et nulle part ailleurs — même discipline que `Relation.secret` et `Caractere.cede_si`) :

> CONDITION D'ÉTAT — **en JEU** : le champ n'entre dans le contexte qu'après constat du moteur (carnet d'indices, n° 12). **En RÉDACTION** il n'existe aucune session : la condition n'a pas de sujet, elle ne devient pas « fausse ». Le champ entre alors **si et seulement si** (a) un rôle le nomme **explicitement** dans `CHAMPS_INJECTES`, et (b) le schéma de sortie de ce rôle **ne peut porter aucune prose** — sans quoi la vérité ressortirait paraphrasée dans le dossier, par le seul canal que l'it1 a nommé non couvert.

La clause (b) est **testable**, et elle doit l'être — un test qui asserte que le schéma de sortie du rôle ne porte aucune clé de prose libre. C'est ce qui empêche l'it3 ou l'it4 de réutiliser cette porte en y faisant passer un champ de texte.

**`DEROGATIONS_AUDIENCE` reste vide, et il faut le dire** : `verite` est d'audience `ia`. L'injecter n'est **pas** une dérogation d'audience — c'est la levée d'une **condition temporelle** posée sur un champ déjà `ia`. Confondre les deux ferait croire que la soupape assertée vide de l'it1 a bougé. Elle ne bouge pas.

## 2. `savoirs[].revele_comment` — même question, réponse plus courte

**Il n'est pas injecté en it2, et pas pour la raison d'état : par non-pertinence.** `revele_comment` décrit **comment un détenteur EXISTANT livre son savoir**. Or les détenteurs existants sont **exclus de la table de candidats par construction**. Le champ n'a donc aucun lecteur dans ce rôle. Bénéfice : **une seule condition d'état à arbitrer**, pas deux.

## 3. Le RANG — le profil minimal par candidat

**Est-ce suffisant ? Honnêtement : sur le dossier de référence, non — et ce n'est pas un défaut de l'assistant, c'est l'état du dossier de l'auteur.** Mesuré :

| Personnage | `fonction` | `apparence` | `description_joueur` | `but.libelle` | `plan_actions[].action` | `caractere` |
|---|---|---|---|---|---|---|
| `pnj.selene-la-vigie` | — | — | — | ✓ | ✓ (1) | — |
| `pnj.corvin-le-marchand` | ✓ | ✓ | ✓ | — | ✓ (1) | ✓ |
| `pnj.mira-la-guerisseuse` | — | — | — | — | ✓ (1) | — |
| `pnj.tobin-le-gamin` | — | — | — | — | ✓ (1) | — |
| `pnj.harek-le-forgeron` | ✓ | — | — | — | *(liste vide)* | — |
| `pnj.aubry-l-intendant` | — | — | — | — | ✓ (1) | — |

Quatre personnages sur six se réduisent à **une phrase**. La conséquence de conception n'est pas « enrichir le profil » — le lore que l'auteur n'a pas écrit n'existe pas — mais **rendre l'ignorance visible et peu coûteuse** : liste vide légale, et l'écran montre à l'auteur **le profil que le copilote a réellement eu**.

**Le PROFIL MINIMAL, par ordre de priorité décroissante, 4 chemins :**
1. `monde.personnages[].fonction` — le métier, plus fort pouvoir discriminant. Présent 2/6 ;
2. `monde.personnages[].plan_actions[].action` — **première étape SEULE** (troncature de LISTE, jamais de chaîne). Présent 5/6, donc c'est **lui** qui porte le rôle ;
3. `monde.personnages[].description_joueur` — la **circulation** de l'information. Présent 1/6 ;
4. `monde.personnages[].but.libelle`. Présent 1/6.

**Exclus, avec motif** : `apparence` (≈150 car./candidat, zéro pouvoir discriminant) ; `but.pourquoi` (redondant) ; `caractere.parler[]`, `caractere.jamais` (didascalies d'acteur) ; `caractere.cede_si` (**interdit** : conditionné par RÔLE) ; `plan_actions[].si_bloque` (condition d'état) ; `relations[].lien` (REJETÉ n° 3).

**Borne de contexte — `CANDIDATS_MAX` est la variable libre, le budget la dérivée** :
```
K = CANDIDATS_MAX (valeur d'entrée proposée : 8)
M = longueur du contexte assemblé, dossier de référence, K saturé, indice le mieux rempli
BUDGET = ceil(M × 3 / 1000) × 1000       ← même formule qu'à l'it1, facteur 3 inchangé
```
Et la règle qui empêche la dérive : **si la mesure déplaît, on baisse K, on ne monte pas le budget.**

**Sélection des candidats — déterministe, sans modèle** : (1) exclure les détenteurs actuels ; (2) `portee === 'premier'` d'abord, puis ordre du document ; (3) tronquer à K. `portee` est d'audience `moteur` — elle **sélectionne**, elle n'est **pas injectée**.

## 4. La certitude — REJETÉ, le modèle ne la choisit pas

1. **Un `croit` est une information FAUSSE** (`types.ts` l. 291-297). La choisir, c'est écrire du lore que l'auteur n'a pas écrit ;
2. **Mesuré en source** : `certitude` **ne décide de rien** dans `atteignabilite.ts` (son test l. 328 : « `certitude` est requise au schéma et ne décide de rien ici »). Donc un détenteur menteur **ÉTEINT l'alerte `indice-sans-source`** exactement comme un détenteur sincère — le copilote **fait disparaître son propre déclencheur** sans rendre l'indice plus obtenable ;
3. **Précédent exact** : `porte_suggeree` (résolue n° 9) — « un seuil du modèle **ratifié par le silence** ».

**Ce qu'on écrit à la place** : le code pose `CERTITUDE_INITIALE` (`'sait'`), comme l'éditeur quand l'auteur crée un savoir à la main. Effet : « aucun entier ne sort d'un modèle » devient **littéralement vrai**.

**Si le comité maintient la certitude au modèle** (objection, pas veto) : `certitude` **absente du contexte des candidats**, valeur validée par le registre importé (KR-117), et un critère qui mesure qu'une liste de 3 ne peut pas être 3 × `'croit'` sans que l'écran le **dise** en toutes lettres.

## 5. L'INVITE du nouveau rôle — mot pour mot

```ts
const GABARIT_SORTIE: Record<string, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'personnage-detenteurs': '{"detenteurs": ["P1", "P2"]}',
}

'personnage-detenteurs': {
	systeme: [
		"Tu assistes l'AUTEUR d'un livre-jeu qui répartit ce que ses personnages savent.",
		"La demande te donne UN fait, et une liste de personnages repérés P1, P2, … Tu désignes ceux d'entre eux qui pourraient plausiblement connaître ce fait, au vu de ce que la liste dit d'eux, et de rien d'autre.",
		'',
		`Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['personnage-detenteurs']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.`,
		'',
		"Chaque élément est un repère de la liste, recopié tel quel. Tu n'en inventes aucun, tu ne répètes aucun repère, et tu n'en donnes jamais plus de trois.",
		"Tu en donnes moins, ou aucun, quand la liste ne t'en dit pas assez pour choisir : une liste vide est une réponse juste.",
		"Tu ne rédiges rien d'autre : ni nom, ni phrase, ni justification.",
	].join('\n'),
	max_tokens: 100,
},
```

**Ce qu'elle N'A PAS le droit de réciter** (résolue n° 20) : le **seuil de `indice-sans-source`** (ni chiffre ni paraphrase — un modèle qui la connaît optimise **l'extinction de l'alerte**) ; le **message de contrôle** ; la **table d'audience** ; les **quatre portes de `Revelation`**, les caractéristiques, les seuils ; et « jamais plus de trois » est dans l'invite **en plus** du contrat, jamais **à la place**.

Note de **voix** : aucune consigne immersive — **la sortie ne contient aucune prose du tout**.

**Garde KR-236 — elle change de forme avec le deuxième rôle, et c'est le piège de cette itération.** `GABARIT_SORTIE` passe de **constante** à **table par rôle**, dans les deux exemplaires. Le balayage de `worker/frontiere.test.ts` doit alors :
1. **itérer sur `RoleCopilote`** et échouer si un rôle n'a **pas** d'entrée — sinon le garde couvre le premier rôle et ignore le second **en silence**, c'est-à-dire l'échec permanent que KR-236 nomme ;
2. asserter que le gabarit **de chaque rôle** apparaît dans l'invite **de ce rôle** ;
3. porter son **pouvoir séparateur** par un canari **croisé** : intervertir les deux gabarits entre les deux rôles doit faire **rougir**. Un canari qui retire un gabarit ne distingue pas « absent » de « mal apparié » — et le mal-apparié est le seul défaut qu'une table à deux entrées rende possible. (À écrire, pas à supposer.)
4. Rappel it1 : le témoin porte sur le **littéral de gabarit**, jamais sur la clé nue — `detenteurs` est un mot français ordinaire, comme `valeur`.

## 6. Le contrat de sortie IA

### Entrée injectée (ordre fixe, texte déterministe)

| Ordre | Chemin | Statut |
|---|---|---|
| 1 | `canon.ton` | **REQUIS** (refus `a-ecrire` sinon, aucun `fetch`) |
| 2 | `canon.interdits_ton[]` | optionnel |
| 3 | `canon.mj.synopsis_mj` | optionnel |
| 4 | `monde.indices[].verite` *(cible)* | **REQUIS** — § 1 ; `LIBELLE_DES_CHAMPS` gagne son entrée |
| 5 | `monde.indices[].formulation_joueur` *(cible)* | optionnel |
| 6..K | par candidat : `fonction`, `plan_actions[].action` (1re étape), `description_joueur`, `but.libelle` | optionnels |

**Non injecté, nommément** : `canon.partage.accroche_joueur`, `indices[].nom`, `personnages[].nom` (KR-195), `indices[].mene_a[]`, `id`, `portee`, `camp`, `stats`, `curseurs`, `relations[]`, le message du linter.

Forme du texte — prolongement de celle de l'it1, le **rang** servant d'en-tête de bloc :
```
canon.ton
⟨…⟩

monde.indices[].verite
⟨…⟩

P1
monde.personnages[].fonction
⟨…⟩
monde.personnages[].plan_actions[].action
⟨…⟩

P2
monde.personnages[].plan_actions[].action
⟨…⟩
```

Un candidat dont **les quatre** chemins sont vides ou marqués **n'est pas injecté du tout** — il n'occupe pas de rang. Un bloc de rang sans une seule ligne apprendrait au modèle « ce personnage n'a rien », ce qui est une **affirmation** ; le repli est le **silence**.

### Schéma de sortie

```jsonc
{"detenteurs": ["P1", "P4"]}
```
- **UNE** clé ; valeur = tableau de chaînes ;
- `0 ≤ longueur ≤ PROPOSITIONS_MAX` (**3**) — **zéro est légal** ;
- chaque élément ∈ **table des rangs rendue par l'assembleur** (KR-231) ;
- éléments **distincts** ;
- **aucune conversion numérique nulle part** : `Number(rang)`, `parseInt(rang)`, `rangs[i]` par arithmétique d'index sont interdits. La re-résolution est un `Map.get`. C'est ce qui supprime la classe entière des décalages base-0/base-1.

### Comportement en cas d'échec

Rejeu **exactement une fois**, puis état **terminal** `illisible` (KR-230). Ce qui change :

| Prédicat | Motif | Neuf ? |
|---|---|---|
| objet simple, clés = exactement `{detenteurs}`, tableau de chaînes, longueur ≤ 3, éléments distincts | `'schema'` | réemploi |
| un élément **hors table** | `'rang-inconnu'` | **neuf** — c'est une **invention**, pas un défaut de forme ; les deux causes doivent se distinguer |
| liste **vide** | *aucun* — **succès** | le prédicat `'vide'` de l'it1 **ne se transporte PAS** : à écrire explicitement, sinon un ouvrier le recopie et punit la seule réponse honnête |
| `'marqueur'`, `'identifiant'` | *sans objet* | **structurellement inatteignables** : un jeton qui passe l'appartenance est **l'une de nos propres chaînes**. Les écrire serait du code mort présenté comme de la couverture (famille BUG-084) |

**Deux points de contrat pour le Tech Lead** : `CibleCopilote` doit devenir une **union discriminée par le rôle**, le rôle cessant d'être un paramètre séparé de `demander` — en l'état `(role, cible)` peut être incohérent. Et `entitesInjectees` doit être **dérivé** de la table des rangs : deux listes à tenir en phase divergent (KR-117).

## 7. Anti-complaisance — ce que le CONTRAT arrête, pas l'invite

- **(a) proposer tout le monde** — arrêté par `longueur ≤ PROPOSITIONS_MAX` **au validateur** (une liste de 6 est un refus, pas une troncature) et par `CANDIDATS_MAX` ;
- **(b) proposer celui qui le détient déjà** — arrêté **par construction** : les détenteurs actuels ne sont pas dans la table des rangs, donc **inénonçables**. Ce n'est pas découragé, c'est **impossible** ;
- **(b') le doublon de rang** : refus `'schema'`. Sans cette clause, deux savoirs identiques atterriraient sur la même fiche ;
- **(c) la paraphrase du CONTEXTE** — le trou que l'it1 a inscrit comme **non couvert**. En it2 il est **fermé par la forme** : la sortie ne porte aucune prose. Le plan doit l'écrire, parce que l'it3 rouvrira ce canal.

**Hypothèse non mesurable ici** : le taux réel de complaisance. Aucun instrument ne constate une cohérence narrative (KR-229) — d'où le choix de tout faire porter par des **refus déterministes**.

## 8. Mémoire — la décision n° 8 tient, mais pas pour la raison qu'on croit

**Sur les détenteurs ACCEPTÉS : elle tient, et mieux que pour une proposition unique.** Un détenteur accepté est écrit dans le dossier → au lancer suivant il est un détenteur actuel → **exclu de la table des rangs**. L'état qui empêche la contradiction n'est pas une mémoire de session : **c'est le dossier persisté**.

**Sur les détenteurs REFUSÉS : elle ne tient pas toute seule.** `P3` refusé peut revenir au lancer suivant. Ce que l'auteur voit après avoir accepté 2 sur 4 puis relancé : les 2 acceptés ont **disparu de l'offre**, les 2 refusés **peuvent réapparaître**, et 1 à 3 nouveaux les accompagnent. Rien de faux ; simplement non promis aujourd'hui.

**Minimum pour l'it2** : l'écran **dit** qu'une relance repart de zéro (texte à l'UX ; l'exigence est à moi).

## 9. `max_tokens` — 100, dérivé et non estimé

```
Pire cas, PROPOSITIONS_MAX = 3, rangs à deux chiffres :
{"detenteurs": ["P10", "P11", "P12"]}   =  37 caractères   (compté à la main, ±1)
Marge de format :                          ~40 caractères retenus
Formule it1 : jetons = L / r ; × 3 ; arrondi à la centaine
  r = 3 (prose française)  →  13 × 3 =  40  →  100
  r = 2 (JSON/ASCII, pire) →  20 × 3 =  60  →  100
```
**`max_tokens = 100`**, robuste au choix du ratio. Recopier `200` serait une valeur **héritée**, non dérivée. `max_tokens` et `PROPOSITIONS_MAX` sont **deux moitiés d'une même borne** et se dérivent **dans le même lot**.

## 10. Le protocole du fournisseur amont (`open_questions` n° 4) — clôture

Vu de mon poste, **rien ne s'oppose à figer Anthropic Messages** : le second rôle n'ajoute **aucune** exigence de protocole. La seule chose que ce rôle éprouve et que l'it1 n'éprouvait pas, c'est que `max_tokens` **varie** d'un rôle à l'autre : vérifié, il est bien lu de `invite.max_tokens` (`worker/index.ts` l. 280). **Ce que je refuse d'y ajouter** : REJETÉ n° 6 (prefill).

## 11. Invariants de mon poste, pour cette itération

1. **Le modèle DÉSIGNE, le code ÉCRIT.** La seule chose qui franchit le réseau dans ce sens est un **jeton de rang** issu d'un ensemble que le code vient d'émettre.
2. **Aucune règle du dossier ni du jeu n'est récitée dans l'invite.**
3. **Le contexte est borné par construction** : ≤ `CANDIDATS_MAX` × ≤ 4 chemins, listes tronquées à leur premier élément, **aucune chaîne jamais coupée**, refus au-delà.
4. **Rien de ce qui entre ne peut ressortir** : sortie sans prose ⇒ paraphrase fermée par la **forme**.
5. **Les dés, les PV, l'inventaire, l'XP** : aucun contact. `revele_si.jet`, `confiance_min`, `contrepartie` restent `moteur` et hors contexte.

## 12. Les `REJETÉ` — formulés pour être recopiés tels quels au § 8

> **REJETÉ — « Le modèle choisit la `certitude` du savoir proposé. »** Un `croit` est une information FAUSSE (`types.ts` l. 291-297) : la faire choisir au modèle lui fait inventer un fait que l'auteur n'a pas écrit, ratifié par un clic — forme exacte de `porte_suggeree` (résolue n° 9). MESURÉ en source : `certitude` ne décide de rien dans `atteignabilite.ts` (test l. 328), donc un détenteur menteur ÉTEINT l'alerte `indice-sans-source` exactement comme un sincère — le copilote ferait disparaître son propre déclencheur sans rendre l'indice plus obtenable. Le code écrit `CERTITUDE_INITIALE` ; l'auteur change sur la fiche.

> **REJETÉ — « Le modèle rend un motif ou une justification par détenteur. »** C'est de la prose, donc invalidable (KR-229), et elle rouvre le seul canal que l'it1 a inscrit NON COUVERT : la paraphrase du CONTEXTE. Elle triplerait le corps de sortie et le `max_tokens`. La justification est affichée DEPUIS LE DOSSIER, côté client : vraie par construction, zéro jeton.

> **REJETÉ — « Injecter `relations[].lien` pour juger qui apprend quoi. »** Son prédicat d'injection est conditionné par RÔLE et un rôle de RÉDACTION n'est ni l'un ni l'autre. MESURÉ : les 2 relations sur 2 de `dossier-reference.json` portent `secret: true`, gain réel nul même en levant la garde. REPORTÉ avec condition d'ouverture : une extension NOMMÉE du prédicat écrite à `destinations.ts` et au JSDoc de `Relation.secret`, jamais par un ouvrier.

> **REJETÉ — « Injecter le message du contrôle `indice-sans-source` dans le contexte du modèle. »** C'est la RÈGLE, et elle vit dans `brain/dossier/controles.ts` : l'injecter la met dans le code ET dans le prompt (résolue n° 20) et apprend au modèle à faire disparaître l'alerte plutôt qu'à répondre. Le constat gouverne QUEL indice l'auteur peut confier — côté client, dans la sélection ; il n'entre jamais dans le contexte.

> **REJETÉ — « Injecter `apparence` dans le profil du candidat. »** ≈150 caractères par candidat (mesuré sur `pnj.corvin-le-marchand`) pour zéro pouvoir discriminant sur « qui pourrait savoir cela ».

> **REJETÉ — « Préremplir la réponse du modèle par `{` (prefill). »** Le worker devrait recoller l'accolade manquante, c'est-à-dire RÉPARER une sortie — ce que l'it1 lui interdit nommément. Le gain n'est pas mesurable dans ce dépôt ; la perte de doctrine l'est.

> **REJETÉ — « `{"detenteurs": []}` est une sortie illisible. »** Le prédicat de non-vacuité de l'it1 NE se transporte PAS sur une liste : punir la réponse honnête est une machine à complaisance — un modèle qui ne peut pas dire « personne » nommera quelqu'un. La liste vide est LÉGALE, rendue sur la branche `propose` avec zéro élément, et l'écran le dit.

> **REPORTÉ — « Exclure d'une relance les candidats que l'auteur vient de refuser. »** Améliore la séance, mais casse la propriété LIVRÉE « deux lancers ⇒ deux corps identiques ». Forme si repris, et jamais une autre : un ensemble d'identifiants EXCLUS, borné, passé dans la cible et appliqué À L'ASSEMBLAGE — jamais un historique de conversation dans l'invite.

## 13. Ce que personne n'a vérifié

- ~~Hypothèse : `indice.trace-du-guet` serait le seul indice signalé~~ → **CONFIRMÉ par l'orchestrateur** sur une assertion verte existante (`controles.test.ts` l. 1143-1147). Conséquence : le cas *passant* de recette ne peut pas venir de l'unique indice signalé de la fixture ; `indice.pas-dans-la-cendre` (`verite` ✓, `formulation_joueur` ✓) est le candidat naturel, mais il n'est **pas** signalé par le linter — le plan doit dire d'où vient le cas de recette.
- **Non mesuré** : la longueur du contexte assemblé à K candidats, donc `CANDIDATS_MAX` et le budget re-dérivé. Formule posée ; la mesure appartient au lot contrat.
- **Non mesurable dans ce dépôt** : tout taux de complaisance, toute qualité de désignation (KR-229).

**Fichiers lus** : cadrage, SKILL.md, `brain/dossier/{destinations,types,atteignabilite,controles}.ts`, `__fixtures__/dossier-reference.json`, `brain/copilote/{contexte,schemaSortie,types}.ts`, `brain/CopiloteService.ts`, `worker/index.ts`, `specification.json`. **Aucun fichier écrit.**
