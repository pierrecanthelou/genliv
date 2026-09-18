# Tour 2 — `narratif-ia` · `dossier-copilote` it2

```
RISQUE      MESURÉ, et il déplace l'itération : `PARTIES_REQUISES` est typé
            `readonly CheminLibelle[]` (contexte.ts l. 61). Exiger `verite` par
            ce canal FORCE une 5e entrée de `LIBELLE_DES_CHAMPS` — que
            `libelles.test.ts` interdit DEUX fois : `toHaveLength(4)` (l. 43) et
            « aucun fichier de src ne retape un libellé en prop label » (l. 131),
            or `label="VÉRITÉ"` vit déjà à `FicheIndice.tsx:131`, fichier
            interdit. Le TL-8 du tech-lead a donc raison, et pour une raison plus
            large que celle qu'il donne. Et comme le refus est l'écran nominal de
            la fixture, un refus mal câblé n'est pas un cas limite : c'est la
            démo.

OBJECTION   Au tech-lead, nommément, sur le prédicat (4) `'vide'` de
            `validerDetenteurs` : il contredit un texte que l'ux-designer a DÉJÀ
            écrit — son § E range « vide-mais-réussi » en SUCCÈS
            (`TEXTE_AUCUN_DETENTEUR_TROUVE`), sans le préfixe `⊘` des refus.
            Punir « personne » est une machine à complaisance : 4 personnages sur
            6 n'ont qu'une phrase, un modèle qui ne peut pas se taire nommera
            quelqu'un. `'vide'` gardait une CHAÎNE vide à l'it1 ; une LISTE vide
            est une réponse, pas une absence de réponse.

PROPOSITION Sortie = `{"detenteurs": ["P1"]}`, tableau de CHAÎNES, sans
            `certitude` : deux prédicats et un registre de moins chez le tech
            lead, et le badge de l'UX survit intact. Refus `'verite-a-ecrire'`
            SANS charge, texte dans `textes.ts`, registre inchangé à 4.

VERDICT     recevable sous réserve. Un seul VETO, étroit : si le comité maintient
            la certitude au modèle, l'invite n'a pas le droit de définir
            `sait`/`croit`/`soupconne` — ce sens-là vit dans `types.ts`, et
            l'écrire dans l'invite est une règle dupliquée code/prompt.
```

---

# ANNEXE

## 0. Réponses nommées aux conflits ouverts

### C1 — la certitude · **MAINTENUE comme objection, NON durcie en veto** (+ une sous-clause qui, elle, est un veto)

Je ne durcis pas en veto, et je le dis explicitement parce qu'un refus juste sur un motif faux cède au premier contradicteur (famille BUG-080). `certitude` n'est ni un dé, ni une stat, ni l'inventaire, ni l'XP ; la sortie a un schéma. Le veto serait hors domaine. Mon refus tient sur deux motifs :

1. **Mesuré** : `certitude` ne décide de rien dans `atteignabilite.ts` (test l. 328). Un détenteur `croit` éteint `indice-sans-source` exactement comme un `sait` — le copilote ferait disparaître son propre déclencheur sans rendre l'indice plus obtenable.
2. Un `croit` est une **information fausse** (`types.ts` l. 291-297) : la faire choisir au modèle, c'est du lore que l'auteur n'a pas écrit, ratifié par un clic.

**Ce qui EST un veto, et il est étroit** : si le comité maintient la certitude au modèle, l'invite **ne peut pas** expliquer ce que valent `sait`, `croit`, `soupconne`. Ce sens est écrit au JSDoc de `Certitude` ; le recopier met la même règle dans le code ET dans le prompt (résolue n° 20).

**Ce que mon refus COÛTE aux deux autres — rien** :
- **tech-lead** : `DetenteurRendu` disparaît, `DetenteursRendus` devient `{ detenteurs: string[] }`, `CLES_DETENTEUR` et les prédicats (5)/(6) disparaissent. Sa note d'invariant « `certitude` est commune aux deux formes » redevient sans objet : **zéro clé commune**, l'invariant de l'it1 tient à la lettre. `DetenteurResolu { personnageId, certitude }` reste, la `certitude` y étant posée par le code.
- **ux-designer** : je propose sans l'imposer (c'est sa surface) **pas de badge de certitude en it2** — la certitude n'est ni proposée ni choisie, l'afficher suggère qu'elle l'est. L'objection bloquante de l'UX perd alors son objet, `dossier-fiches` reste intouché, et la promotion revient à l'it3 avec son second consommateur réel.

### C2 — liste vide · **MAINTENUE** (voir OBJECTION)

Complément : `{"detenteurs": []}` est la **seule** forme qui produit une liste vide ; tout le reste échoue au schéma. Le vide est donc une réponse délibérée et bien formée, pas un résidu.

### C3 — nom du rôle · **JE CONCÈDE : `'indice-detenteurs'`**

Le tech-lead a raison et la doctrine de l'it1 le dit mieux que moi : le nom encode **l'entité CIBLE**. Ici la cible est un indice (`CibleIndice { indiceId }`), même si la majorité des chemins injectés sont des chemins de personnage. `'personnage-detenteurs'` est retiré. Segment de route : `/ia/indice-detenteurs`.

### C5 — R1 et le découpage · **(a) NÉCESSAIRE, et moins chère que je ne le croyais**

**Fait que je n'avais pas vu au tour 1** : l'instrument existe **déjà, trois fois**, dans `src/brain/dossier/couverture.test.ts` — « le prédicat est présent aux DEUX sites, mot pour mot » : `cede_si` (l. 1309-1348), `Relation.secret` (l. 1350-1386), `Climat.manifestation` (l. 1388-1424+). Il lit le JSDoc de `types.ts`, l'aplatit (`sansPrefixe`), et cherche la **même** chaîne dans `destinations.ts`.

Or `Indice.verite` est aujourd'hui le seul champ « sous condition d'état » **sans** cet instrument : ses deux sites disent la même chose dans des mots différents. Après cette itération, **ces deux phrases seront fausses** : `verite` entrera dans le contexte d'un appel au modèle sans moteur et sans constat. Et le lecteur qui les trouvera fausses est l'ouvrier de la **n° 10** — celui qui code la protection du **joueur**. Une doc fausse à cet endroit ne se répare pas plus tard.

Donc non, il ne suffit pas que `CHAMPS_INJECTES` nomme `verite` avec un commentaire local : ce serait un **troisième** domicile, exactement ce que ces trois tests interdisent.

Coût réel : **deux insertions de commentaire** (zéro effet `tsc`, zéro effet runtime) + **un `it` de plus** calqué sur trois existants. Fichiers à ajouter au **lot 1** : `src/brain/dossier/destinations.ts`, `src/brain/dossier/types.ts`, `src/brain/dossier/couverture.test.ts`. Aucun n'est nommé par le lot 2 ; aucun n'appartient à `dossier-canon`/`dossier-fiches`/`dossier-registres`.

### C7 — **JE CONCÈDE LE TL-8, et je RETIRE « `LIBELLE_DES_CHAMPS` gagne son entrée »**

Mesuré, et le motif est plus large que celui du tech-lead : `label="VÉRITÉ"` est à **`FicheIndice.tsx:131`** et `label="FORMULATION JOUEUR"` à **:142** — les **deux** champs d'un indice sont déjà des `label` d'un fichier interdit. Ajouter l'un ou l'autre ferait rougir **deux** tests de `libelles.test.ts`, fichier hors de tout lot, et le correctif évident est interdit. **Le registre reste à quatre.**

**Par quel chemin le refus nomme le champ :**
1. `PARTIES_REQUISES['indice-detenteurs'] = []` — ce rôle n'a aucune exigence exprimable par un libellé d'écran. Le type reste `readonly CheminLibelle[]`.
2. Un motif **neuf et SANS charge**, `{ motif: 'verite-a-ecrire' }`, frère de `'trop-long'` et d'`'aucun-candidat'`.
3. Le champ est nommé **en prose française ordinaire**, dans `textes.ts`, comme `TEXTE_REFUS_TROP_LONG` nomme « la fiche de ce personnage » sans passer par le registre. Le balayage de `libelles.test.ts` porte sur la forme `label="VÉRITÉ"` (une PROP), pas sur le mot.

### C11 — **la sélection côté client est la SEULE garde ; je maintiens mon REJETÉ n° 4**

Le copilote **n'a pas** à refuser un indice non signalé, et `brain/copilote/` **ne doit pas** apprendre l'existence de `controlerDossier`. Faire entrer le linter dans l'assembleur crée **une seconde autorité** et rapproche le seuil de la règle du contexte du modèle.

**Conséquence : le cas passant EST constructible, à deux niveaux, sans toucher la fixture.**

| Niveau | Cas passant | Cas refusé |
|---|---|---|
| `brain/` | `demanderDetenteurs(cloneReference(), {indiceId: 'indice.pas-dans-la-cendre'})` — `verite` ✓ et `formulation_joueur` ✓. Le linter n'a rien à voir ici : la légalité d'une demande est une propriété du dossier, pas du rapport. | `indice.trace-du-guet` ⇒ `'verite-a-ecrire'` |
| feature (RTL) | dossier **composé dans le test** (précédent it1). Protocole : partir de `cloneReference()` et retirer **un** des deux producteurs de `indice.pas-dans-la-cendre` ⇒ 1 producteur ⇒ **alerte**, et l'indice garde `verite` + `formulation_joueur`. | le dossier de référence **intact** : `Select` à une seule option, refus. |

**À MESURER au lot, pas à croire** : que le retrait d'un producteur fasse bien passer `pas-dans-la-cendre` de silence à `alerte`.

### C13 — **réponse au `pm-produit`, je maintiens la liste bornée à 3**

1. **Le silence devient exprimable en un geste.** Avec un candidat par appel, « personne » et « un » sont la même réponse vue de l'auteur.
2. **La répétition sans mémoire fabrique une fausse corroboration.** Trois appels indépendants peuvent rendre **trois fois le même nom**, et l'auteur lira une insistance là où il n'y a qu'un déterminisme. Avec une liste, la distinction est un **prédicat du validateur** (rangs distincts).
3. **Trois noms côte à côte se lisent comme un choix ; un nom seul se lit comme un verdict.** Le second invite la ratification par le silence — la panne exacte de `porte_suggeree`.
4. **Coût** : un assemblage au lieu de trois, et trois fois moins d'occasions d'échouer à la validation.

Je **concède** au PM que son risque est réel, mais il est traité ailleurs : l'anatomie est écrite (UX), son fichier est donné (TL), et la borne à 3 garantit un écran d'au plus trois lignes.

### C10 — **JE CORRIGE ma proposition, et je vais plus loin que le ⊆ du tech-lead**

Dériver strictement `entitesInjectees` des rangs perdrait l'indice cible. Le `⊆` du tech-lead est correct mais ne dit pas ce qui manque.

**Décision qui rend l'égalité possible : les détenteurs actuels ne sont PAS injectés du tout** — ni rang, ni bloc. Le tech-lead écrivait « ils peuvent rester dans le CONTEXTE » : je tranche l'inverse. Motifs : ils coûtent un profil complet chacun dans `M` ; ils enseignent au modèle un fait sur lequel il ne peut pas agir ; et ils sont une tentation de les nommer, donc une source de refus évitables.

```
entitesInjectees === [cible.indiceId, ...rangs.values()]    // égalité, ordre compris
```

Produit par **le même parcours** que le texte. Assertable par `toEqual`, pas par un `⊆` — un `⊆` reste vert sur une entité injectée qu'on aurait oublié d'auditer.

### Canari croisé KR-236 · **réponse à la `qa`, avec une correction de ma propre formulation**

**Confirmé** : c'est bien le canari **croisé** qui distingue « gabarit absent » de « gabarit mal apparié ». L'itération sur `RoleCopilote` attrape l'absence, le balayage de cardinalité attrape le gabarit orphelin, et **les deux restent verts sur un échange**.

**Je corrige mon tour 1** : j'ai écrit « le mal-apparié est le **seul** défaut qu'une table à deux entrées rende possible ». C'est surdit. Avec deux entrées, trois défauts existent — (1) rôle sans gabarit, (2) gabarits **échangés**, (3) gabarit sans invite porteuse — et **seul (2) est un défaut NEUF**. Les trois mutants sont à **écrire et à faire rougir** (BUG-087).

**Et je concède au tech-lead sa forme (a)** : deux constantes nommées plutôt que le `Record` que je proposais. Motif : le balayage de source est **ancré ligne à ligne**, et un `Record` casserait l'ancrage — l'instrument compte plus que l'élégance de la table.

### Deux points annexes aux autres rôles

- **`qa`, scanner anti-identifiant — tranché, écris-le noir sur blanc** : `porteUnIdentifiant` **n'entre pas** dans `validerDetenteurs`. Un jeton qui passe l'appartenance **est l'une de nos propres chaînes**. L'importer serait un instrument vert par construction (famille BUG-084). Le scanner reste **intact** sur `validerSortie`.
- **`tech-lead`, ton G.6** — écris-le, et ajoute la ligne qui relève de mon veto : **le copilote n'écrit JAMAIS de `revele_si`**. `Savoir` porte quatre clés ; le copilote en écrit **exactement deux** : `{indice_id, certitude}`. Testable en une ligne — `expect(Object.keys(savoirEcrit).sort()).toEqual(['certitude','indice_id'])`.

## 1. Statut de mes deux objections

| # | Objection | Statut |
|---|---|---|
| O1 | « aucun entier ne sort d'un modèle » est FAUX si le rang est un nombre | **MAINTENUE — résolue par convergence.** Le plan doit écrire le **littéral** : `'P1'…'PN'`, et non `'1'…'N'`. Motif : un `"1"` invite le modèle à émettre `1` **nombre**, autre type JSON, refus `'schema'` évitable ; le préfixe `P` rend le jeton non convertible à vue. |
| O2 | Le modèle ne choisit pas la `certitude` | **MAINTENUE** (voir C1). Non durcie en veto — hors domaine. **Sous-clause DURCIE EN VETO** : si la certitude reste au modèle, l'invite ne définit pas les trois valeurs. |

## 2. Statut de mes cinq réserves

| # | Réserve | Statut |
|---|---|---|
| R1 | Condition d'état de `verite` ré-écrite à ses deux sites | **MAINTENUE et RENFORCÉE.** Instrument déjà présent trois fois. Coût : 2 commentaires + 1 `it`. Trois fichiers entrent au lot 1. |
| R2 | Rang = jeton-chaîne validé par appartenance | **MAINTENUE**, littéral tranché `'P1'…'PN'`. |
| R3 | Le modèle ne choisit pas la certitude | **MAINTENUE** (= O2). |
| R4 | Le refus « cet indice n'est pas écrit » nommé, actionnable, démontré | **MAINTENUE et PROMUE** : ce n'est plus un cas limite, c'est l'écran nominal de la fixture. Chemin **corrigé** (motif sans charge + prose dans `textes.ts`, registre intouché). |
| R5 | `CANDIDATS_MAX` variable libre, budget re-dérivé | **MAINTENUE.** Converge avec TL-9 : je le soutiens explicitement. |

## 3. Statut de mes huit `REJETÉ`/`REPORTÉ` — tous MAINTENUS, formulés pour le § 8

> **REJETÉ — « Le modèle choisit la `certitude` du savoir proposé. »** Un `croit` est une information FAUSSE (`types.ts` l. 291-297) : la faire choisir au modèle lui fait inventer un fait que l'auteur n'a pas écrit, ratifié par un clic — forme exacte de `porte_suggeree` (résolue n° 9). MESURÉ en source : `certitude` ne décide de rien dans `atteignabilite.ts` (test l. 328), donc un détenteur menteur ÉTEINT l'alerte exactement comme un sincère — le copilote ferait disparaître son propre déclencheur sans rendre l'indice plus obtenable. Le code écrit `CERTITUDE_INITIALE` ; l'auteur change sur la fiche. **Si le comité passe outre : l'invite n'a pas le droit de définir `sait`/`croit`/`soupconne` — ce sens vit dans `types.ts`, et le recopier met la même règle dans le code ET dans le prompt (résolue n° 20).**

> **REJETÉ — « Le modèle rend un motif ou une justification par détenteur. »** C'est de la prose, donc invalidable (KR-229), et elle rouvre le seul canal que l'it1 a inscrit NON COUVERT : la paraphrase du CONTEXTE. Elle triplerait le corps de sortie et le `max_tokens`. La justification est affichée DEPUIS LE DOSSIER, côté client : vraie par construction, zéro jeton.

> **REJETÉ — « Injecter `relations[].lien` pour juger qui apprend quoi. »** Prédicat d'injection conditionné par RÔLE ; un rôle de RÉDACTION n'est ni narrateur ni arbitre. MESURÉ : les 2 relations sur 2 de la fixture portent `secret: true`, gain nul même en levant la garde. REPORTÉ, condition d'ouverture : une extension NOMMÉE du prédicat écrite à `destinations.ts` et au JSDoc de `Relation.secret`, épinglée par le test « présent aux DEUX sites » (`couverture.test.ts` l. 1350) — jamais par un ouvrier.

> **REJETÉ — « Injecter le message du contrôle `indice-sans-source` dans le contexte du modèle. »** C'est la RÈGLE, et elle vit dans `controles.ts` : l'injecter la met dans le code ET dans le prompt (résolue n° 20) et apprend au modèle à faire disparaître l'alerte plutôt qu'à répondre. **Corollaire de même statut : `brain/copilote/` n'importe pas `controlerDossier`.** Le constat gouverne QUEL indice l'auteur peut confier — côté client, dans le `Select` ; il n'entre jamais dans le contexte, ni dans la légalité d'une demande.

> **REJETÉ — « Injecter `apparence` dans le profil du candidat. »** ≈150 caractères par candidat pour zéro pouvoir discriminant. À `CANDIDATS_MAX = 8`, ~1200 caractères de budget pour rien.

> **REJETÉ — « Préremplir la réponse du modèle par `{` (prefill). »** Le worker devrait recoller l'accolade, c'est-à-dire RÉPARER une sortie — ce que l'it1 lui interdit nommément. Le gain n'est pas mesurable dans ce dépôt ; la perte de doctrine l'est.

> **REJETÉ — « `{"detenteurs": []}` est une sortie illisible. »** Le prédicat de non-vacuité de l'it1 gardait une CHAÎNE vide (« le modèle n'a rien écrit ») ; il NE se transporte PAS sur une LISTE, où le vide est une réponse (« personne »). Punir la réponse honnête est une machine à complaisance — un modèle qui ne peut pas dire « personne » nommera quelqu'un, et 4 personnages sur 6 n'ont qu'une phrase pour le départager. La liste vide est LÉGALE, branche `propose` à zéro élément, sans le préfixe `⊘`.

> **REJETÉ — « Élargir `PARTIES_REQUISES` à `readonly string[]` pour y faire entrer `monde.indices[].verite`. »** *(neuf au tour 2)* Il détruirait la garantie de compilation « tout champ requis a un libellé d'écran » (`contexte.ts` l. 55-59), qui est ce qui rend `texteRefusAEcrire` sans branche de repli. Et le libellé qu'il appellerait ne peut pas exister : registre épinglé à quatre, `label="VÉRITÉ"` à `FicheIndice.tsx:131`, fichier interdit. Le rôle reçoit `[]` et un motif de refus SANS charge.

> **REPORTÉ — « Exclure d'une relance les candidats que l'auteur vient de refuser. »** Casse la propriété LIVRÉE « deux lancers ⇒ deux corps identiques ». Forme si repris : un ensemble d'identifiants EXCLUS, borné, passé dans la cible et appliqué À L'ASSEMBLAGE — jamais un historique dans l'invite.

**Divergence mineure à trancher par l'orchestrateur** : le tech-lead nomme `'rang'` le motif d'échec ; je propose `'rang-inconnu'`, et je sépare le **doublon** (forme → `'schema'`) de l'**inconnu** (invention → `'rang-inconnu'`). Motif : les deux causes ne se corrigent pas de la même façon et la QA doit pouvoir les viser séparément.

---

## 4. LE CONTRAT DE SORTIE IA — FINAL, à recopier au § 4 bis du plan

### 4.1 Identité du rôle
- `RoleCopilote` gagne **`'indice-detenteurs'`** (segment de route `/ia/indice-detenteurs`, clé de `INVITES`).
- Cible : `CibleIndice { indiceId: string }`. Le rôle est fixé par la méthode, jamais passé en paramètre.
- **Aucune mémoire de session.** Deux lancers sur un dossier inchangé ⇒ **deux corps de requête identiques par égalité stricte**. Ce qui est « retenu » est le **dossier persisté** : un détenteur accepté n'est plus numéroté au lancer suivant ; un détenteur **refusé** peut réapparaître — l'écran le dit.

### 4.2 Entrée injectée

| Ordre | Chemin | Statut | Portée |
|---|---|---|---|
| 1 | `canon.ton` | **REQUIS** → `'a-ecrire'` (charge `'canon.ton'`) | dossier |
| 2 | `canon.interdits_ton[]` | optionnel | dossier |
| 3 | `canon.mj.synopsis_mj` | optionnel | dossier |
| 4 | `monde.indices[].verite` | **REQUIS** → `'verite-a-ecrire'` (sans charge) | indice CIBLE seul |
| 5 | `monde.indices[].formulation_joueur` | optionnel | indice CIBLE seul |
| 6 | `monde.personnages[].fonction` | optionnel | chaque CANDIDAT |
| 7 | `monde.personnages[].plan_actions[].action` | optionnel, **première étape SEULE** | chaque CANDIDAT |
| 8 | `monde.personnages[].description_joueur` | optionnel | chaque CANDIDAT |
| 9 | `monde.personnages[].but.libelle` | optionnel | chaque CANDIDAT |

- **Troncature de LISTE, jamais de CHAÎNE.** Dépassement de budget ⇒ **refus**, jamais coupure (KR-230).
- Les **9 chemins sont tous d'audience `ia`**, prouvé par le test de confinement. `DEROGATIONS_AUDIENCE` **reste vide et assertée vide** : injecter `verite` n'est **pas** une dérogation d'audience, c'est la levée d'une **condition temporelle**.

**NON injecté, nommément** : `monde.indices[].nom`, `monde.personnages[].nom` (KR-195), `indices[].id`, `mene_a[]`, `portee`, `canon.partage.accroche_joueur`, `apparence`, `but.pourquoi`, `caractere.*`, `plan_actions[].si_bloque`, `relations[]`, `savoirs[].revele_comment`, `savoirs[].revele_si`, `stats`, `curseurs`, `camp`, `presence`, **le message du contrôle**, et **les détenteurs actuels de l'indice** (ni bloc, ni rang).

**Sélection et numérotation des candidats — déterministe, sans modèle** :
1. écarter tout personnage dont un `savoirs[].indice_id` vaut `cible.indiceId` ;
2. ordre : `portee === 'premier'` d'abord, puis l'ordre du document (`portee` est `moteur` : elle **sélectionne**, elle n'est **jamais injectée**) ;
3. tronquer à `CANDIDATS_MAX` ;
4. un candidat dont **les quatre** chemins sont vides ou marqués **n'est pas injecté** et **ne consomme pas de rang** — un bloc vide apprendrait au modèle « ce personnage n'a rien », ce qui est une AFFIRMATION ; le repli est le **silence** ;
5. numéroter `P1`, `P2`, … dans cet ordre. `rangs: ReadonlyMap<string, string>` peuplée **dans le même parcours** que le texte.

**Audit de confinement** : `entitesInjectees === [cible.indiceId, ...rangs.values()]`, ordre compris, `toEqual`.

**Bornes** :
```
K   = CANDIDATS_MAX                              (entrée proposée : 8, variable LIBRE)
M   = longueur en caractères du contexte assemblé, K SATURÉ, sur un dossier
      COMPOSÉ PAR LE TEST — même protocole qu'à l'it1
BUDGET_CARACTERES_CONTEXTE['indice-detenteurs'] = ceil(M × 3 / 1000) × 1000
TAILLE_MAX_CORPS_IA = max sur les rôles de ceil((3 × budget_role + E_role) / 1024) × 1024
```
`'personnage-prose'` garde **6000**, non re-mesuré. **Si la mesure déplaît, on baisse K — on ne monte jamais le budget.**

### 4.3 Forme littérale du texte assemblé

```
canon.ton
⟨valeur⟩

canon.interdits_ton[]
⟨valeur 1⟩
⟨valeur 2⟩

canon.mj.synopsis_mj
⟨valeur⟩

monde.indices[].verite
⟨valeur⟩

monde.indices[].formulation_joueur
⟨valeur⟩

P1
monde.personnages[].fonction
⟨valeur⟩
monde.personnages[].plan_actions[].action
⟨première étape⟩

P2
monde.personnages[].plan_actions[].action
⟨première étape⟩
monde.personnages[].but.libelle
⟨valeur⟩
```
Déterministe : ni date, ni identifiant, ni aléa, ni nom.

### 4.4 L'invite — MOT POUR MOT

```ts
/** Second gabarit, CONSTANTE NOMMÉE et non entrée de table : le balayage de
 *  source de `worker/frontiere.test.ts` est ancré ligne à ligne, et un
 *  `Record` casserait l'ancrage. Dupliqué dans `brain/copilote/schemaSortie.ts`,
 *  liaison prouvée par balayage, jamais par import (KR-236). */
const GABARIT_SORTIE_DETENTEURS = '{"detenteurs": ["P1", "P2"]}'

'indice-detenteurs': {
	systeme: [
		"Tu assistes l'AUTEUR d'un livre-jeu qui répartit ce que ses personnages savent.",
		"La demande te donne UN fait, puis une liste de personnages repérés P1, P2, … Tu désignes ceux qui pourraient plausiblement connaître ce fait, au vu de ce que la liste dit d'eux, et de rien d'autre.",
		'',
		`Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE_DETENTEURS} : aucune autre clé, aucun commentaire, aucun texte avant ou après.`,
		'',
		"Chaque élément est un repère de la liste, recopié tel quel, entre guillemets. Tu n'en inventes aucun, tu ne répètes aucun repère, et tu n'en donnes jamais plus de trois.",
		"Tu en donnes moins, ou aucun, quand la liste ne t'en dit pas assez pour choisir : une liste vide est une réponse juste.",
		"Tu ne rédiges rien d'autre : ni nom, ni phrase, ni justification.",
	].join('\n'),
	max_tokens: 100,
},
```

**Ce que cette invite n'a PAS le droit de réciter** : le **seuil de `indice-sans-source`**, ni chiffre ni paraphrase ; le **message du contrôle** ; la **table d'audience** ; le sens des trois **certitudes** ; les **quatre portes** de `Revelation` ; les caractéristiques, les seuils, les tiers.

**« jamais plus de trois » est dans l'invite EN PLUS du contrat, jamais À LA PLACE.** Ce n'est pas une règle dupliquée : `PROPOSITIONS_MAX` n'est ni une règle du jeu ni une règle du dossier, c'est la **forme de la réponse attendue** — même statut que `max_tokens`.

**Voix** : aucune consigne immersive, et pas par oubli — **la sortie ne contient aucune prose**.

### 4.5 Schéma de sortie

```ts
export const CLES_SORTIE_DETENTEURS = ['detenteurs'] as const
export const PROPOSITIONS_MAX = 3
export const GABARIT_SORTIE_DETENTEURS = '{"detenteurs": ["P1", "P2"]}'

export function validerDetenteurs(
	brut: unknown,
	rangsConnus: ReadonlySet<string>,
): ({ ok: true } & DetenteursRendus) | { ok: false; motif: MotifIllisible }
```

`DetenteursRendus = { detenteurs: string[] }` — **zéro clé commune** avec `PropositionDetenteurs { indiceId, detenteurs: readonly DetenteurResolu[] }`.

**Prédicats, dans l'ordre, chacun prouvé seul :**
1. objet simple → `'schema'`
2. clés = **exactement** `CLES_SORTIE_DETENTEURS` → `'schema'`
3. `Array.isArray(brut.detenteurs)` → `'schema'`
4. chaque élément est une **chaîne** → `'schema'`
5. `longueur ≤ PROPOSITIONS_MAX` (**3**) → `'schema'`. **`0` est LÉGAL**
6. éléments **distincts** → `'schema'`
7. chaque élément ∈ `rangsConnus` → `'rang-inconnu'`

**Interdit** : `Number(rang)`, `parseInt(rang)`, `rangs[i]`, toute arithmétique d'index. La re-résolution est un `Map.get`. Il n'existe ni base 0, ni base 1, ni borne haute à comparer.

**Prédicats délibérément ABSENTS, avec motif** (ne pas les rejouer par symétrie — famille BUG-084 / KR-235) : `'vide'`, `'marqueur'`, `'identifiant'` — aucune prose dans cette sortie ; un jeton qui passe l'appartenance **est l'une de nos propres chaînes**, donc `porteUnIdentifiant` n'a **aucune cible**.

**Clause testable de la condition d'état de `verite`** : un test asserte que `CLES_SORTIE_DETENTEURS` ne contient **aucune clé de prose libre**. C'est lui qui empêche l'it3/it4 de réutiliser la porte ouverte sur `verite`.

### 4.6 Table des motifs d'échec

**A. Refus AVANT tout `fetch`** — ordre d'évaluation **figé** :

| Ordre | Prédicat | Motif | Charge | Neuf ? |
|---|---|---|---|---|
| 1 | `canon.ton` absent ou marqué | `'a-ecrire'` | `chemin: 'canon.ton'` | réemploi |
| 2 | `verite` de l'indice cible absente, vide ou marquée | `'verite-a-ecrire'` | **aucune** | **neuf** |
| 3 | zéro candidat numérotable | `'aucun-candidat'` | **aucune** | **neuf** (tech-lead) |
| 4 | `texte.length > BUDGET['indice-detenteurs']` | `'trop-long'` | aucune | réemploi |

**B. Échec de la sortie du modèle** : **rejeu exactement UNE fois, puis terminal** (KR-230). Aucun repêchage partiel : un seul élément fautif refuse **le lot entier**.

| Cause | Motif |
|---|---|
| forme (objet, clés, tableau, éléments non-chaînes, longueur > 3, doublon) | `'schema'` |
| élément **hors** table des rangs — une **invention** | `'rang-inconnu'` |
| `{"detenteurs": []}` | **aucun — SUCCÈS** |

**C. Textes d'écran** — *(la formulation exacte appartient à l'`ux-designer` ; ce qui est normatif ici est qu'il existe UN texte par motif, discriminant)* :
- `TEXTE_REFUS_VERITE_A_ECRIRE` **nomme le champ en prose française**, en minuscules, hors de toute prop `label` : aucun second domicile du libellé `VÉRITÉ`, aucun test de `libelles.test.ts` ne rougit. **Registre à quatre.**
- `TEXTE_REFUS_TROP_LONG` de l'it1 est **spécifique au rôle prose** : la carte 2 ne le réutilise pas.
- `TEXTE_AUCUN_DETENTEUR_TROUVE` est un **succès** : pas de préfixe `⊘`.

### 4.7 La condition d'état de `verite` — texte EXACT, aux DEUX sites

**À recopier à l'identique**, la seule différence autorisée étant le préfixe de commentaire (` * ` en JSDoc, `// ` dans la table) — ce que `sansPrefixe` efface.

```
CONDITION D'ÉTAT, ET SA PORTÉE EXACTE. **En JEU**, `verite` n'entre dans le
contexte d'un appel au modèle qu'après constat du moteur, et cette promesse tient
sans réserve : c'est la charge de l'assembleur de la n° 10. **En RÉDACTION**, il
n'existe ni session ni moteur, donc la condition n'a pas de sujet — elle ne devient
pas fausse pour autant, elle est sans objet. Le champ n'entre alors **que si** un
rôle du copilote le nomme **explicitement** dans `CHAMPS_INJECTES`, **et que** le
schéma de sortie de ce rôle ne porte **aucune prose** — sans quoi la vérité
ressortirait paraphrasée dans le dossier, par le seul canal que l'itération 1 a
inscrit non couvert. Ce n'est **jamais** une dérogation d'audience : `verite` est
`ia` aux deux temps.
```

| Fichier | Point d'insertion |
|---|---|
| `src/brain/dossier/types.ts` | JSDoc de `Indice.verite`, **après** « …la charge de l'assembleur n° 10. » (l. 1054) et **avant** « À NE PAS CONFONDRE AVEC `formulation_joueur` » |
| `src/brain/dossier/destinations.ts` | bloc de `'monde.indices[].verite'`, **après** « trouvera la promesse écrite ici et au JSDoc du champ. » (l. 420) et **avant** la ligne vide précédant « `ia` ET NON `auteur` » |

**Le 4e `it` de `couverture.test.ts`**, calqué sur les trois existants :
```
debut = "CONDITION D'ÉTAT, ET SA PORTÉE EXACTE."
fin   = "`verite` est `ia` aux deux temps."
expect(predicat).toContain('**En JEU**')
expect(predicat).toContain('**En RÉDACTION**')
expect(predicat).toContain('aucune prose')
expect(predicat).toContain("dérogation d'audience")
expect(sansPrefixe(destinations)).toContain(predicat)
```
**Pouvoir séparateur à ÉCRIRE** : modifier **un mot** d'un seul des deux exemplaires doit faire rougir. À mesurer au lot 1 avant signature.

Fichiers entrant au **lot 1** : `src/brain/dossier/destinations.ts`, `src/brain/dossier/types.ts`, `src/brain/dossier/couverture.test.ts`.

### 4.8 `max_tokens` — 100, dérivé

Correction au tech-lead : `N_max = floor(budget / coût d'un bloc candidat)` **borne l'ENTRÉE, pas la SORTIE**. La sortie est bornée par `PROPOSITIONS_MAX = 3`. Dimensionner `max_tokens` sur `N_max` financerait une liste que le contrat refuse.

**Les deux moitiés d'une même borne** : `CANDIDATS_MAX` borne l'entrée (dérivé du budget), `PROPOSITIONS_MAX` borne la sortie (dérive `max_tokens`). Posées **dans le même lot**.

```
Pire cas, PROPOSITIONS_MAX = 3, rangs à DEUX chiffres :
{"detenteurs": ["P10", "P11", "P12"]}   =  37 caractères   (±1)
Marge de format retenue :                  ~40 caractères
  r = 3 (prose française)      →  13 × 3 = 40  →  100
  r = 2 (JSON/ASCII, pire cas) →  20 × 3 = 60  →  100
```
**`max_tokens = 100`**, robuste au choix du ratio. Recopier `200` serait une valeur héritée.

### 4.9 Anti-complaisance
- **(a) proposer tout le monde** — `longueur ≤ 3` au validateur (une liste de 6 est un **refus**, jamais une troncature) + `CANDIDATS_MAX` en amont ;
- **(b) proposer celui qui détient déjà** — **par construction** : ni bloc ni rang, donc **inénonçable**. Corollaire (TL-7, soutenu) : **ne pas re-filtrer à l'acceptation** ;
- **(b′) doublon de rang** — refus `'schema'` ;
- **(c) paraphrase du CONTEXTE** — **fermée par la forme**. À écrire au plan, **parce que l'it3 rouvrira ce canal** ;
- **(d) le silence** — liste vide légale, affichée comme un résultat.

**Non mesurable dans ce dépôt** : tout taux de complaisance, toute qualité de désignation (KR-229).

### 4.10 Invariants de mon poste — testables, à porter en critères
1. **Le modèle DÉSIGNE, le code ÉCRIT.** Seul un **jeton de rang** franchit le réseau dans ce sens.
2. **Aucune règle récitée dans l'invite**, et `brain/copilote/` n'importe pas `controlerDossier`.
3. **Contexte borné par construction** ; **aucune chaîne jamais coupée** ; refus au-delà du budget.
4. **Rien de ce qui entre ne peut ressortir** : sortie sans prose.
5. **Aucun contact avec les dés/PV/inventaire/XP — y compris au site d'ÉCRITURE.** Le copilote écrit un `Savoir` à **exactement deux clés** : `expect(Object.keys(savoirEcrit).sort()).toEqual(['certitude', 'indice_id'])`.
6. **`certitude` posée par le code** à `CERTITUDE_INITIALE`. C'est ce qui rend la phrase du `goal` littéralement vraie.

### 4.11 Ce que personne n'a vérifié
1. **Aucun test n'a été rejoué par moi.** Mes affirmations sur `libelles.test.ts`, `FicheIndice.tsx`, `couverture.test.ts`, `controles.test.ts`, `contexte.ts` sont des **lectures de source littérale** — à rejouer au lot 1 avant signature.
2. **`M` du rôle** : non mesuré. Donc `CANDIDATS_MAX`, le budget, `E` et `TAILLE_MAX_CORPS_IA` restent des **formules**.
3. **Le passage de `indice.pas-dans-la-cendre` à `alerte`** après retrait d'un producteur : protocole posé, **non exécuté**.
4. **Que le paragraphe du § 4.7 survive au `sansPrefixe` des deux côtés** : non mesuré, objet du 4e `it`.
5. **Non mesurable** : tout taux de complaisance (KR-229).

**Fichiers lus** : les cinq notes du tour 1, cadrage, SKILL.md, `brain/copilote/{contexte,schemaSortie,types}.ts`, `brain/dossier/{libelles,libelles.test,destinations,types,controles,couverture.test}.ts`, `__fixtures__/dossier-reference.json`, `dossier-registres/components/FicheIndice.tsx`, `dossier-copilote/textes.ts`, `worker/index.ts`. **Aucun fichier écrit.**
