# Tour 2 — narratif-ia — dossier-controles it6

**C1 — l'UX a raison sur le MESSAGE, elle ne peut pas l'avoir sur la REMÉDIATION, et le code tranche.** Mesuré : `controles.ts:669-676` **grave le message dans le constat à l'émission** — deux messages ne coûtent donc rien : ni champ, ni code, ni type. Mais `controles.ts:681-682` résout la remédiation **plus tard**, depuis `constat.niveau` SEUL (`remediation` ne reçoit ni dossier ni compte brut) ; et `controles.test.ts:860-896` épingle ce dispatch. Deux remédiations sous `bloquant` exigent donc un discriminant sur `ConstatControle` — un état illégal représentable pour une règle, famille BUG-082. Je **retire** donc ma prose unique au premier étage et **maintiens** l'unicité au second : **DEUX messages, UNE remédiation vraie des deux côtés**. Réponse nommée au rejet UX (b) : ma remédiation n'est pas une clause conditionnelle « devinez votre cas » — le cas est déjà dit par le message au-dessus ; la dernière phrase ne fait qu'interdire un geste inopérant.

**C1 bis — j'accepte, sans contorsion.** Le message du cas « 0 producteur brut » reste **littéralement inchangé**, donc le fragment `/aucun enchaînement/` survit intact : `panneauControles.test.tsx:93-154` monte un indice que **ni savoir, ni effet, ni enchaînement** ne produit — cas 0 brut, avant comme après saturation. Prédiction dérivée, **à mesurer** par l'ouvrier au T2, pas à croire.

**Statuts.** OBJECTION 1 **maintenue** (remédiations fausses aux deux seuils) — co-signée PM/UX. OBJECTION 2 **maintenue** (H1/H2 écrits, un seul domicile). REJETÉ 1 (climat), 2 (`apres_indice_id`), 3 (baril `brain/index.ts`), 4 (second code) : **tous maintenus** ; le 4 ne vise pas la demande UX, qui est deux textes sous un code.

**C6 — mon garde-fou était PARTIEL, je le dis au plan.** `toHaveLength(4)` couvre 4 des 6 chemins lus ; trois gardes dérivées le remplacent (annexe B).

**Trois REJETÉ neufs** : champ discriminant sur `ConstatControle` ; deux remédiations sous un même niveau ; remédiation dérivée du texte du message.

`VERDICT — recevable sous réserve`

---

## ANNEXE A — Rédaction FINALE de H1 et H2, mot pour mot, en tête de `atteignabilite.ts`

    /**
     * HYPOTHÈSES DATÉES D'ATTEIGNABILITÉ — 2026-09-16, itération 6 de la n° 6.
     *
     * Ce module conclut « le joueur peut obtenir cet indice » sur un document
     * STATIQUE, alors qu'obtenir est un geste de SESSION. L'écart est comblé par des
     * hypothèses, pas par une preuve : elles sont écrites ICI, dans le fichier qui
     * les utilise, et nulle part ailleurs — un raccourci assumé qu'aucun lecteur ne
     * retrouve est indiscernable d'un défaut. Même forme et même domicile que KR-224
     * (« monde ouvert »), dont la clause rejoindra cette liste le jour où
     * l'atteignabilité des LIEUX entrera ici ; ne pas l'écrire aujourd'hui, aucun
     * code ne la porte encore.
     *
     * H1 — LE MOTEUR INSCRIT AU CARNET LES CIBLES DE `mene_a[]` À L'ACQUISITION DE
     * LEUR AMONT. C'est ce qui fait d'une arête `mene_a` un PRODUCTEUR, donc ce qui
     * autorise la saturation. Rien ne l'établit : `types.ts` dit que l'amont
     * « débloque » ses cibles — l'acquisition de l'amont est NÉCESSAIRE, sans qu'il
     * soit dit qu'elle suffise —, et aucun moteur n'existe encore pour trancher. Le
     * point fixe n'utilise QUE la nécessité : un indice dont l'amont est hors
     * d'atteinte est hors d'atteinte sous les deux lectures. H1 ne peut donc, ici,
     * que sous-compter. Le jour où la n° 9 retient l'autre lecture (une liste de
     * pistes servie au narrateur, sans octroi automatique), c'est le SEUIL
     * `>= 2 → silence` qui devient trop généreux, jamais le point fixe : la
     * correction se fait sur le compte, ici, en UN endroit.
     * Sous les deux lectures, l'octroi reste un geste du CODE. Le modèle ne peut pas
     * accorder un indice ; il raconte celui que le moteur a inscrit. Cet invariant
     * n'est pas redit ici : il est écrit à `types.ts` (`verite`,
     * `formulation_joueur`, `revele_comment`) et c'est lui qui donne son sens à toute
     * cette analyse.
     *
     * H2 — UNE RACINE EST RÉPUTÉE AMORÇABLE. Ce module sature les ARÊTES ; il
     * n'évalue AUCUNE des portes qui commandent une racine, et les compte donc toutes
     * ouvertes. Ne sont PAS évaluées — liste exhaustive au 2026-09-16, et c'est elle
     * que la tranche « porte morte, producteur fantôme » (n° 8) hérite EN ENTIER :
     *  · les QUATRE portes de `Revelation` sur un savoir (`types.ts`) —
     *    `confiance_min`, `jet`, `contrepartie`, `apres_indice_id` ; `jet` nommément,
     *    parce qu'un dé n'est pas une certitude et que ce module ne lance rien ;
     *  · `savoirs[].revele_si.apres_indice_id`, qui est la SECONDE arête
     *    indice → indice du schéma. La première, `monde.indices[].mene_a[]`, est la
     *    seule que ce module sature. Un lecteur qui croirait le graphe des indices
     *    entièrement saturé se tromperait, et c'est pour lui que cette ligne existe ;
     *  · `charpente.jalons[].declencheur_expr` ABSENT — le jalon ne se déclenche
     *    jamais et son `effet` est un producteur fantôme ;
     *  · `monde.conditions.climat[].effets_regles` — aucun moteur ne sait APPLIQUER
     *    un effet de climat (motif écrit à `controles.ts`, non recopié) ;
     *  · l'atteignabilité du PORTEUR d'un effet — récompense d'une quête jamais
     *    donnée, conséquence d'une résolution jamais atteinte.
     * Toutes ces omissions SUR-COMPTENT les producteurs, donc SOUS-GRADUENT le
     * constat : sur une règle bloquante, l'erreur permise est le faux négatif, jamais
     * le faux positif. C'est ce qui rend la saturation des arêtes livrable SEULE.
     * Le sens d'erreur de la n° 8 est l'INVERSE : fermer une porte RETIRE une racine.
     * Les faux positifs vivent là-bas, jamais ici — et c'est la raison du découpage.
     */

## ANNEXE B — C6, réponse argumentée et garde-fou retenu

**La question est juste et ma réponse de tour 1 était incomplète.** `expect(CHEMINS_DE_DELTAS).toHaveLength(4)` ne dit pas qu'une source a été oubliée : il dit qu'une **cinquième ligne est entrée dans une table**. Il couvre **4 des 6 chemins lus**, et provablement pas les deux autres (`savoirs[].indice_id`, `mene_a[]`), qui ne sont pas des deltas.

Mes trois sources hypothétiques, relues sur le schéma réel :

| source | arriverait par | vue par `toHaveLength(4)` ? |
|---|---|---|
| `contre_mesures[]` à effets | un `Delta[]` de plus → ligne obligatoire dans `CHEMINS_DE_DELTAS` (`validate.ts:623` itère la table ; `couverture.test.ts` exige une destination par feuille) | **oui** |
| `plan_actions[]` à effets | idem | **oui** |
| un OBJET qui révèle au ramassage | **pas nécessairement un delta.** `Objet` ne porte aujourd'hui que `description_joueur` (`types.ts:969-981`). L'autre forme du schéma pour produire un indice est la **référence simple** (`savoirs[].indice_id`, `REFERENCES_SIMPLES` avec `espace: 'indice'`) : `Objet.revele_indice_id?: string` est au moins aussi probable que `Objet.effets?: Delta[]` | **NON** |

Et un **quatrième trou**, que je n'avais pas vu : un **VERBE** de delta neuf nommant un indice (`DELTAS` gagne une entrée à `refKinds: ['indice']`). Les quatre sites restent quatre, le balayage du littéral `'reveler_indice'` reste vert, la source n'est jamais lue. Pire cas : `oublier_indice`, producteur **négatif** lu comme rien.

**Garde-fou retenu — trois assertions dérivées, dans `atteignabilite.test.ts`, chacune nommant son registre :**

1. **G1 (sites)** — `expect(CHEMINS_DE_DELTAS).toHaveLength(4)` + la construction des clés DEPUIS la table, transportés tels quels de `controles.test.ts:687-727`.
2. **G2 (verbes)** — `expect(Object.entries(DELTAS).filter(([, d]) => d.refKinds.includes('indice')).map(([id]) => id)).toEqual(['reveler_indice'])`. Une ligne, zéro fixture. **Vérifié** : le balayage de porteurs de `deltas.test.ts:192-206` **exclut `MODULE_DOSSIER`**, donc importer `DELTAS` dans ce fichier ne fait rougir personne.
3. **G3 (références)** — `expect(REFERENCES_SIMPLES.filter((r) => r.espace === 'indice').map((r) => r.path)).toEqual([…])` sur les **trois** chemins d'aujourd'hui (`tables.ts:574`, `576`, `607`), chacun annoté en commentaire **PRODUCTEUR** ou **PORTE**. C'est la même ligne qui rend **mécanique** la phrase « seconde arête indice → indice » de H2, au lieu de la laisser documentaire.

**Ce que les trois ne couvrent pas** (nommé, discipline KR-173) : un producteur qui n'entre par aucun des trois registres — un mécanisme de session sans champ de schéma. Les deux planifiés (carnet n° 12, transfert entre PNJ co-localisés n° 14) ne créent aucune racine neuve, vérifié en annexe A du tour 1 ; le jour où un troisième arrive, c'est une charge de n° 9, pas d'un test.

**Coût total : ~12 lignes, aucune fixture, aucun import hors `brain/dossier/`.**

## ANNEXE C — La prose finale (synthèse C1), et ce qu'elle coûte

**Discrimination, à l'émission, sans champ neuf** : `brut = producteurs.get(id)?.length ?? 0`, `compte = saturé`. `brut >= 1 && compte === 0` **équivaut** à « toutes les sources brutes sont des arêtes `mene_a` et aucune ne survit » — car une source primaire (`savoir`/`delta`) force `PRIMAIRE >= 1`, donc `compte >= 1`. Le second message est donc **vrai par construction**, et cette équivalence doit être écrite dans la docstring : c'est elle qui empêche la phrase de dériver.

- **message, `brut === 0`** — INCHANGÉ, mot pour mot : « Aucun personnage, aucun effet et aucun enchaînement ne donne cet indice : le joueur ne pourra jamais l'obtenir. »
- **message, `brut >= 1 && compte === 0`** — NOUVEAU, constante nommée `MESSAGE_INDICE_EN_BOUCLE`, texte de l'UX repris **sans retouche** : « Cet indice n'est relié qu'à des enchaînements qui bouclent sans jamais atteindre un personnage ou un effet : le joueur ne pourra jamais l'obtenir. »
- **remédiation, `bloquant` (unique, vraie des deux côtés)** : « Ancrez la chaîne : confiez cet indice — ou l'un de ceux qui y mènent — à un personnage (Personnages → Savoirs), ou révélez-le par un effet « révèle l'indice ». Un enchaînement depuis un indice lui-même inaccessible ne suffit pas. »
- **remédiation, `alerte` (dernier membre seulement)** : « …ou un enchaînement **depuis un indice que le joueur peut lui-même obtenir** (Indices → Mène à). »
- **docstring `controles.ts:249-258`, réécrite dans le même lot** : « trois familles comptées, deux offertes sans condition et une sous condition explicitée dans la phrase ».

**Ce que cette forme préserve, et qu'aucune autre ne préserve** (à mesurer au T2, dérivé ici) : `panneauControles.test.tsx:145` (`/aucun enchaînement/`, 1 occurrence — ma remédiation dit « Un enchaînement », qui ne matche pas), `:146` (`/Personnages → Savoirs/`), `:151-153` (trois étages non vides), `controles.test.ts:860-896` (dispatch sur `niveau`, repli `''` sur `info`, deux consignes distinctes), `estSeuilIndice` et le type `Record<SeuilIndice, ProseControle>` **inchangés**.

**Test à exiger** (KR-199, deux entités dans le MÊME test) : dans le témoin du cycle, le constat de `indice.anneau-de-cuivre` **ne contient pas** « aucun enchaînement » ; dans le témoin de l'indice orphelin, il le contient. Sans cette moitié, les deux messages seraient indistinguables d'un seul.

## ANNEXE D — Les REJETÉ à recopier au § 8 (les 4 maintenus + les 3 neufs)

*Maintenus, tour 1 :*

1. Retirer le climat des racines — *premier faux positif réel ; on ne bascule pas le sens d'erreur dans les deux directions dans la même itération.*
2. Saturer `savoirs[].revele_si.apres_indice_id` ici — *porte de racine, charge n° 8 ; nommée en H2 et rendue mécanique par G3.*
3. Exporter le point fixe par `brain/index.ts` — *aucun appelant, et le graphe de session n'est pas la clôture statique* (converge avec le REJETÉ identique du tech-lead, motif distinct : les deux se gardent).
4. Créer un second code `indice-en-boucle` — *même cause ; un code par cause, jamais par configuration (KR-164). Ne vise pas la demande UX, qui est deux textes sous un code.*

*Neufs, tour 2 :*

5. **REJETÉ — porter un champ discriminant (`cas`, `brut`, `enBoucle`…) sur `ConstatControle`.** *Un état illégal devient représentable (niveau et cas en désaccord) pour une seule règle, et `controles.test.ts:860-896` doit être réécrit ; le message porte la distinction gratuitement.*
6. **REJETÉ — deux remédiations sous le même `niveau`.** *`remediation(constat)` ne reçoit ni le dossier ni le compte brut : deux consignes exigent le discriminant du n° 5.*
7. **REJETÉ — choisir la remédiation en LISANT le message du constat** (`message.includes('bouclent')`). *Texte dérivé lu à distance, § Encapsulation de la skill : la prose se reformule, la garde se tait.*

## ANNEXE E — Contrat de sortie IA (format imposé)

**Aucun dans cette tranche, et c'est un constat reconduit** : it6 est du calcul déterministe sur un document statique. Aucun appel au modèle, aucune sortie à valider, aucune mémoire de session, aucune borne de contexte touchée — **aucun motif de veto de mon domaine**. Ce que la tranche FIGE pour le runtime est en annexe D du tour 1 ; `atteignabilite.ts` y RENVOIE en une ligne (H1), il ne le recopie pas.
