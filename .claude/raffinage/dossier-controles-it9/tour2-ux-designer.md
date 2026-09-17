# Tour 2 — `ux-designer` · `dossier-controles` it9

**RISQUE** — Si le comité fait finalement passer `contrepartie` dans CE lot **sous la même cause `porte-fermee`**, mon message resserré (« un autre indice ») devient **FAUX** le jour où `contrepartie` déclenche aussi cette cause — un texte qui nomme un mécanisme pour une cause qui en couvre deux. **C'est la faute BUG-088, une itération plus tôt.** Mon texte final n'est valable QUE si `apres_indice_id` est la SEULE porte évaluée sous `indice-sans-source` ce lot-ci.

**OBJECTION (nommée)** — Au `narratif-ia` (§ E) : sa phrase ajoutée à la remédiation (« Une condition de révélation qui attend un indice inaccessible ne s'ouvre pas davantage ») est **DESCRIPTIVE, pas actionnable** — elle explique le pourquoi, jamais le geste. Toutes les remédiations existantes du fichier sont **impératives** (« confiez », « révélez », « ancrez »). Une remédiation qui redevient descriptive sur son troisième cas est un défaut de registre. **Je retiens sa précision mécanique, pas sa forme.**

**PROPOSITION** — Je **retire ma remédiation distincte** (tour 1) et signe **UNE** remédiation étendue, actionnable sur les trois causes, revérifiée contre `BlocSavoirs.tsx`. Message resserré sur la porte d'indice, conditionné à ce que `contrepartie` reste hors de la cause `porte-fermee` — ce que **je recommande fortement, sans veto** (le périmètre n'est pas mon domaine).

**VERDICT** — Recevable sous réserve : (1) `apres_indice_id` seul sous `porte-fermee`, sinon le message repasse en variante générique ; (2) la remédiation unique ci-dessous remplace celle du tour 1.

---

## ANNEXE

### 1. Statut de mes positions du tour 1

| Position | Statut | Motif |
|---|---|---|
| Un troisième message est dû | **MAINTENUE, renforcée** | Convergence indépendante du `tech-lead` (l'équivalence cassée), du `narratif-ia` (le texte faux) et de la `qa` (le flip mesuré). Trois chemins, une conclusion. |
| « Porte », « contrepartie », « savoir » sont les mots de l'auteur | **MAINTENUE** | Le texte final ne nomme aucun terme interne. |
| Remédiation NOUVELLE et DISTINCTE | **RETIRÉE** | `tech-lead` (A3) et `narratif-ia` (§ E) confirment tous deux l'arbitrage it6 : **une seule** remédiation. Une distincte le romprait sans qu'aucun rôle ne le demande. |
| Zéro texte neuf pour `objectif-sans-chemin` | **MAINTENUE, durcie en recommandation** | L'option (b) du `narratif-ia` rouvrirait ce texte : **un texte neuf que rien dans les cinq notes n'a spécifié ni signé narrativement**. |
| REJETÉ 6 — pas de texte par type de porte | **MAINTENUE, sans objet pratique** | Sous l'option (a) la règle n'évalue qu'un type ; sous (b) la seconde porte va vers une règle séparée. Le rejet tient **à l'intérieur de cette règle** dans les deux cas. |
| Aucune pastille / niveau neuf (KR-217) | **MAINTENUE** | Incontesté. |
| Émission seulement si la fermeture est CERTAINE | **MAINTENUE** | Outillée par le point fixe entrelacé du `tech-lead`. |

### 2. Le message — tranché

**Ni l'un ni l'autre des textes du tour 1. Je fusionne.** Structure sujet-premier (« Cet indice… ») des DEUX messages voisins — que le texte du `narratif-ia` casse en passant le sujet à « les personnages », **rupture de parallélisme sur les trois messages du même seuil** — avec sa précision mécanique, plus honnête que mon « une porte » générique dès lors qu'**un seul** type de porte est évalué.

**Motif du choix de précision** : c'est la règle **DÉJÀ écrite dans le fichier** (commentaire l. 258-267) — nommer la famille quand elle est non ambiguë, rester vague seulement quand elle l'est réellement (cas de l'`alerte`, justifié explicitement). Ici la famille est déterministe : **la vague est donc moins honnête que le précis, pas plus prudente.**

**Texte FINAL signé** (périmètre `apres_indice_id` seul) :

> « Cet indice n'est confié qu'à des savoirs dont une porte attend un autre indice que rien ne permet d'obtenir d'abord : le joueur ne pourra jamais l'obtenir. »

« **une** porte » (indéfini) reste compatible avec le ET de plusieurs portes sur un même savoir ; « un autre indice » ne nomme aucun indice précis (contrainte du narratif respectée) ; sujet parallèle aux deux voisins.

**Texte de repli**, SEULEMENT si `contrepartie` entre sous la même cause — **non recommandé** :

> « Cet indice n'est confié qu'à des savoirs dont une porte ne s'ouvrira jamais : le joueur ne pourra jamais l'obtenir. »

### 3. La remédiation unique — signée mot pour mot

**Relue dans le code** : `BlocSavoirs.tsx` porte bien `LIBELLES_RETRAIT_PORTE.apres_indice_id = "Retirer la porte d'indice préalable"` et un `Select` de cible réassignable par porte ouverte — **le geste nommé EXISTE** (doctrine BUG-090).

Texte existant **conservé mot pour mot et étendu** :

> « Ancrez la chaîne : confiez cet indice — ou l'un de ceux qui y mènent — à un personnage (Personnages → Savoirs), ou révélez-le par un effet « révèle l'indice ». Un enchaînement depuis un indice lui-même inaccessible ne suffit pas ; et si un savoir le garde déjà derrière une porte, retirez cette porte ou changez sa cible pour un indice que le joueur peut réellement obtenir (Personnages → Savoirs). »

**Vérification des trois causes** : *rien* → phrases 1-2 actionnables, la clause finale conditionnelle ne s'applique pas mais **ne ment pas** · *sans-racine* → phrases 1 et 3 · *porte fermée* → la clause finale, seule à s'appliquer, **actionnable et non circulaire** (elle ne redemande pas « confiez à un personnage » à un savoir qui le détient déjà).

Sous le repli, remplacer « un indice » par « un indice ou un objet » — seule variation.

### 4. Le ET sur portes multiples (réponse au `pm-produit`)

Le texte ne change **pas** avec le nombre de portes : « une porte » (indéfini) couvre déjà « au moins une, parmi une ou plusieurs » — délibéré, pas un oubli. Le ET est une question d'algorithme, pas de texte. **Aucune variante textuelle à écrire.**

### 5. Tokens

Aucun token, aucune pastille, aucun composant neuf : **changement de texte pur** sous l'anatomie `IssueList` existante.

### 6. REJETÉ (à recopier au § 8)

- **REJETÉ** — la phrase ajoutée du `narratif-ia` telle quelle. Motif : **descriptive, non actionnable** ; rupture de registre sur un fichier dont toutes les remédiations sont impératives.
- **REJETÉ** — le sujet « Les personnages qui connaissent cet indice ». Motif : casse le parallélisme structurel des trois messages du même seuil, sans gain de précision que la formulation retenue n'offre déjà.
- **REJETÉ** — garder le message générique « une porte ne s'ouvrira jamais » **par défaut**. Motif : **moins honnête** que le précis dès lors qu'un seul type de porte est évalué — la règle de précision est déjà écrite dans le fichier.
- **REJETÉ** — une remédiation distincte de l'existante (**ma propre position de tour 1**). Motif : contredit l'arbitrage it6, confirmé par deux rôles.
- **REJETÉ** — un texte différent selon le nombre de portes. Motif : « une porte » couvre déjà tous les cas.

---

## Note de l'orchestrateur

**Deux retraits volontaires**, dont la remédiation distincte que ce rôle avait lui-même proposée au tour 1.

**L'objection de registre est fondée et non triviale** : une remédiation qui explique au lieu de commander est un défaut que seul ce poste pouvait voir, et la vérification (« toutes les remédiations du fichier sont impératives ») est constatable.

**Le motif du choix de précision est particulièrement solide** : il ne vient pas d'un goût mais d'une règle déjà écrite dans le module (l. 258-267), à savoir que le seuil `alerte` reste vague **parce que sa famille est réellement ambiguë**. Appliquée ici, elle impose le précis.

**Sa réserve conditionnelle est la bonne forme** : le texte signé n'est valable que sous le périmètre à une porte, et le rôle fournit son repli plutôt que de laisser l'ouvrier improviser. Il ne pose pas de veto sur un terrain qui n'est pas le sien.
