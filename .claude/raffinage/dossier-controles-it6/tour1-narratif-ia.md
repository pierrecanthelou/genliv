# Tour 1 — narratif-ia — dossier-controles it6 (tranche « saturation mene_a »)

    RISQUE      — La saturation est MONOTONE : elle ne retire que des producteurs, jamais n'en
                  ajoute. Elle ne peut donc produire QUE des constats plus sévères — et chacun
                  doit être vrai. Conséquence : le recensement des RACINES (savoir + 4 sites de
                  deltas) devient CONTAGIEUX. À plat, une racine manquée coûtait un faux bloquant
                  sur UN indice ; au point fixe, elle en coûte un sur toute sa fermeture aval. J'ai
                  vérifié que le recensement est exact AUJOURD'HUI (annexe A) ; c'est une hypothèse
                  datée, pas une propriété du domaine.

    OBJECTION 1 — La saturation rend les DEUX remédiations fausses, pas seulement la prose du
                  cycle. Les deux offrent « faites-y mener un autre indice » (controles.ts:265 et
                  :270) : après point fixe, ce geste n'éteint plus rien si l'amont est lui-même
                  hors d'atteinte. L'isomorphisme « trois familles comptées, trois familles
                  offertes », déclaré MESURÉ en it3 (controles.ts:249-258), ne tient plus — la
                  troisième famille devient CONDITIONNELLE. It5 a décidé que les remédiations sont
                  écrites pour le rapport ; celle-ci enverrait l'auteur faire un geste inopérant.

    OBJECTION 2 — Que `mene_a` SOIT un producteur repose sur une seule phrase de docstring
                  (types.ts:1069, « les indices que celui-ci DÉBLOQUE une fois obtenu »), qu'aucune
                  spécification de moteur ne confirme. À plat, elle valait un +1 au compteur ; au
                  point fixe, elle décide d'un bloquant. Elle doit être écrite comme une hypothèse
                  assumée, à UN endroit, pas héritée d'un commentaire de type.

    PROPOSITION — (a) Deux clauses datées en tête de `atteignabilite.ts`, forme KR-224, nommées :
                  « H1 — le moteur inscrit au carnet les cibles de `mene_a[]` à l'acquisition de
                  leur amont » ; « H2 — une RACINE est réputée amorçable ; les portes
                  (`revele_si`, `apres_indice_id`, `declencheur_expr`) ne sont pas évaluées —
                  charge n° 8 ». (b) UNE prose bloquante vraie dans les deux cas + une remédiation
                  qui éteint réellement le voyant (texte exact en annexe C).

    VERDICT     — recevable sous réserve (les deux réserves = OBJECTION 1 et PROPOSITION a).

---

## ANNEXE (hors quota)

### Préalable — le contrat de sortie IA demandé par mon format

**Il n'y en a aucun dans cette tranche, et c'est un constat, pas une omission** : it6 est du calcul déterministe sur un document statique. Aucun appel au modèle, aucune sortie à valider, aucune mémoire de session, aucune borne de contexte touchée. **Aucun motif de veto dans mon domaine n'existe ici.** Ce que cette itération fige, en revanche, est consommé au runtime — d'où l'annexe D.

### A. Point dur 1 — la saturation produit-elle un FAUX POSITIF ?

**Réponse : non aujourd'hui, et la démonstration est une énumération DATABLE, pas une intuition.**

La saturation est monotone : elle ne fait que retirer des arêtes du décompte. Un indice ne peut donc jamais passer de `bloquant` à `silence` ; il ne peut que descendre. Il suffit donc de vérifier que **chaque racine comptée correspond à un geste que le moteur sait réellement faire**, et qu'**aucune racine n'est oubliée**.

**Racines oubliées — vérifié, il n'y en a pas :**

- `Delta[]` n'apparaît que **quatre fois** dans tout le schéma (`types.ts:1097`, `1210`, `1280`, `1424`), et ces quatre sites sont exactement `CHEMINS_DE_DELTAS` (`tables.ts:636-641`). Les quatre sont lus.
- `Depart` **n'accorde aucun indice initial** : `{ lieu_id, texte_ouverture_joueur }`, rien d'autre (`types.ts:1401-1405`). Il n'y a pas de carnet de départ.
- Les deux mécanismes de session déjà planifiés au roadmap ne créent **aucune racine neuve** : le « carnet d'indices » de la n° 12 (roadmap:197) est un **état**, pas une source ; le « transfert d'indice entre PNJ co-localisés » de la n° 14 (roadmap:201) **propage un savoir existant** — l'indice transféré avait donc déjà une racine `savoir`.

**Racines trop généreuses — il y en a trois, toutes du BON côté** : le climat (`controles.ts:363-365`), le savoir sous porte `revele_si` jamais ouvrable, le jalon sans `declencheur_expr`. Les trois **sur-comptent**, donc **sous-graduent**, donc restent conformes à « sur une règle bloquante, l'erreur permise est le faux négatif ». **La saturation ne touche pas à ce sens-là** : elle ne sature que les ARÊTES, pas les racines. C'est précisément ce qui rend le découpage it6/n° 8 juste.

**Le seul faux positif atteignable est donc structurel** : le jour où une **septième source** entre au schéma (un objet qui révèle en étant ramassé, une `contre_mesure` à effets, une étape de `plan_actions` à effets), un indice dont c'est l'unique racine devient `bloquant` — **et toute sa descendance `mene_a` avec lui**. Le rayon de souffle passe de 1 à N. Le garde-fou existe déjà et doit être **transporté tel quel** dans `atteignabilite.test.ts` : `expect(CHEMINS_DE_DELTAS).toHaveLength(4)` + la construction des clés DEPUIS la table (`controles.test.ts:687-727`), plus le balayage de source à porteur unique du littéral `'reveler_indice'` (`controles.test.ts:729-745`, qui **attend aujourd'hui `['controles.ts']` et devra attendre `['atteignabilite.ts']`**).

**Sur le climat, nommément — `REJETÉ`** : *ne pas* profiter de cette itération pour retirer le climat des racines au motif qu'aucun instant d'application n'existe. Ce serait le **premier faux positif réel** de la règle, et il naîtrait dans la même itération que la saturation — on ne bascule pas un sens d'erreur dans les deux directions à la fois.

### B. Point dur 2 — la sémantique narrative exacte de `mene_a`

La définition qui fait foi, `types.ts:1069-1071` :

> `MOTEUR — LES INDICES QUE CELUI-CI DÉBLOQUE une fois obtenu, dans l'ordre où le moteur les lira.`

Elle est **ambiguë entre les deux lectures du cadrage** : « DÉBLOQUE » penche vers « connaître A rend B obtenable » (lecture 1, qui justifie la saturation), mais « dans l'ordre où le moteur **les lira** » penche vers une **liste de pistes servie au narrateur** (lecture 2, qui en ferait un abus).

**La bonne nouvelle : la saturation est valide sous LES DEUX lectures**, et c'est l'argument qui doit être écrit dans le fichier. Sous lecture 1, « A produit » est une condition **nécessaire et suffisante** de l'arête ; sous lecture 2, elle reste **nécessaire** (on ne suit pas une piste depuis un indice qu'on n'a pas). Le point fixe n'utilise que la nécessité. Ce qui diverge est le compte : sous lecture 2, une arête satisfaite ne vaut pas vraiment un producteur, donc le `>= 2 → silence` (`controles.ts:667`) reste **trop généreux** — encore du bon côté, et c'est la nuance que n° 8 raffinera.

Deux points que la définition **autorise** et que le point fixe doit honorer sans garde supplémentaire : l'**auto-référence est légale** (`types.ts:1082-1086`, KR-194) — donc `A.mene_a=['A']` ne doit pas lever, et le plus petit point fixe le rend naturellement non produit ; et la **liste vide est un état calme** (`types.ts:1088-1089`).

**Ce que la définition N'autorise PAS, et qui doit être écrit en H1** : rien dans `types.ts` ne dit que le moteur accorde **automatiquement** la cible. C'est une hypothèse. Elle ne doit **pas** être recopiée dans `types.ts` : `atteignabilite.ts` la pose, et KR-224 a déjà désigné ce fichier comme le domicile des hypothèses d'atteignabilité datées.

**`REJETÉ`** — saturer aussi `savoirs[].revele_si.apres_indice_id` (`types.ts:530-531`) dans cette tranche. **Motif** : c'est une **porte sur un savoir**, pas une arête de production ; elle relève de l'amorçabilité d'une racine, charge explicite de n° 8. Mais elle doit être **NOMMÉE dans H2**, sans quoi n° 8 devra re-découvrir que le schéma porte **deux** arêtes indice→indice et que it6 n'en a saturé qu'une.

**`REJETÉ`** — exporter le point fixe par `brain/index.ts` « pour le moteur n° 9 ». **Motif** : aucun appelant, et surtout **les deux graphes ne coïncident pas** — n° 9 raisonnera sur un ÉTAT DE SESSION, pas sur la clôture statique du dossier.

### C. Point dur 3 — la prose du bloquant

**Le constat est pire que celui du cadrage** — le défaut de la remédiation touche **les deux seuils** :

- bloquant, `controles.ts:263` : « Aucun personnage, aucun effet **et aucun enchaînement** ne donne cet indice » — **faux** sur un cycle, où l'arête existe et se voit à l'écran dans « Mène à ».
- bloquant, `controles.ts:265` : « …ou **faites-y mener un autre indice** (Indices → Mène à) » — après saturation, **ce geste n'éteint plus le voyant** sauf si l'indice amont choisi est lui-même produit.
- alerte, `controles.ts:270` : « …ou **un enchaînement depuis un autre indice** » — **même défaut, même cause**, passé inaperçu dans le cadrage parce que le cadrage ne regardait que le cycle.

**Est-ce une CAUSE distincte au sens de KR-164 ? Non — même code.** La cause est un prédicat unique : *après saturation, zéro producteur*. Le cycle n'est pas une cause, c'est une **configuration** qui la réalise — donc, au sens exact de KR-164, un **emplacement**.

**`REJETÉ`** — créer un second code de contrôle pour la boucle. **Motif** : même cause ; un code par cause, jamais par configuration (KR-164).

**Ce qu'il faut à la place : une prose VRAIE des deux côtés.** Elle ne demande **aucun champ discriminant** sur `ConstatControle` — la table reste `Record<SeuilIndice, ProseControle>` et le sélecteur de remédiation continue de ne lire que `constat.niveau`.

Textes proposés, mot pour mot :

- **bloquant · message** : « Aucun chemin praticable ne donne cet indice : le joueur ne pourra jamais l'obtenir. »
- **bloquant · remédiation** : « Ancrez la chaîne : confiez cet indice — ou l'un de ceux qui y mènent — à un personnage (Personnages → Savoirs), ou révélez-le par un effet « révèle l'indice ». Un enchaînement depuis un indice lui-même inaccessible ne suffit pas. »
- **alerte · remédiation** (dernier membre seulement) : « …ou un enchaînement **depuis un indice que le joueur peut lui-même obtenir** (Indices → Mène à). »

**Et la contrainte propositionnelle d'it3 (`controles.ts:249-258`) doit être RÉÉCRITE dans le même lot** : elle affirme un isomorphisme « trois familles comptées, trois familles offertes » qui **cesse d'être vrai**. Elle devient : « trois familles comptées, deux offertes sans condition et une **sous condition explicitée dans la phrase** ».

### D. Ce que cette itération FIGE pour le runtime — un renvoi, jamais une recopie

- **entrée injectée au modèle** : `verite` **seulement après** acquisition constatée (`types.ts:1048-1054`) ; `formulation_joueur` injectée jamais émise verbatim (`types.ts:1061-1068`) ; `revele_comment` seulement portes constatées ouvertes (`types.ts:546-551`). Identifiants = **handles**, résolus par le code (`types.ts:1069-1073`).
- **sortie du modèle** : **aucune**. Le modèle **ne peut pas accorder un indice**. C'est ce qui donne un sens à toute l'analyse d'atteignabilité.
- `atteignabilite.ts` doit porter **une ligne** disant que le point fixe suppose cet invariant et **où il est écrit** — pas le ré-énoncer.

### E. Sur le report vers n° 8

**Le report de « porte morte, producteur fantôme » vers n° 8 me convient**, et il est meilleur que ce que j'avais proposé à it5. Motif à porter au plan : les deux saturations n'ont **pas le même sens d'erreur**. Saturer les **arêtes** (it6) est monotone et sûr. Saturer les **racines** (n° 8) est l'endroit où les **faux positifs** vivent réellement. La seule contrepartie demandée est **H2**.

### Les quatre REJETÉ à recopier au § 8 du plan

1. Retirer le climat des racines — *premier faux positif réel ; on ne bascule pas le sens d'erreur dans les deux directions dans la même itération.*
2. Saturer `savoirs[].revele_si.apres_indice_id` ici — *porte de racine, charge n° 8 ; nommée en H2.*
3. Exporter le point fixe par `brain/index.ts` — *aucun appelant, et le graphe de session n'est pas la clôture statique.*
4. Créer un second code `indice-en-boucle` — *même cause ; un code par cause, jamais par configuration (KR-164).*
