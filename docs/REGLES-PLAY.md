# Règles du mode JEU — à compléter

> Le manuel (`REGLES-DU-JEU.md`) définit le **cœur quantitatif** (perso, jets, combat, XP, bestiaire). Pour un **moteur jouable** (charger un livre → créer un héros → jouer), il manque les règles d'**orchestration** ci-dessous. Chaque point propose un **défaut raisonnable** : tu n'as qu'à écrire **OK** pour l'adopter, ou ta variante. Une fois rempli, ce fichier devient la suite de `REGLES-DU-JEU.md` et permet de spécifier le moteur (feature `play-mode`, aujourd'hui différée).
>
> Convention : ✍️ = décision attendue. Les défauts sont des **propositions**, pas des règles officielles.

---

## A. Boucle de jeu (traversée du livre)

> ⚠ **Deux règles de cette section sans AUCUNE implémentation dans `src/` après `moteur-dossier`
> it4 (2026-09-25)** — mesuré : 0 site restant. **A4/E3** — le **+5 PE par changement de lieu**
> (cette section, A4 ; `docs/REGLES-DU-JEU.md:43`, § « Endurance (PE) », clause Récupération) — et
> **B3** — l'**équipement de départ** — étaient portés par `defaultSessionFields()`
> (`src/player/hooks/usePlaySession.ts`), supprimé avec le reste du runtime éteint par ce lot
> (KR-240) ; leurs 11 sites disparaissent avec lui. `docs/REGLES-DU-JEU.md` reste **inchangé**
> (KR-130 : la règle tient, seule son implémentation manque). **Propriétaire : la n° 11
> `moteur-arbitre`** — successeur désigné : `commande.aller` (le seul verbe qui traverse un
> changement de lieu, `brain/dossier/commandes.ts`, `moteur-dossier` it2), qui devra porter le +5 PE
> le jour où l'état de session portera un héros (KR-249 : `EtatSession.heros` n'existe pas avant la
> n° 11 — l'ouvrir ici violerait KR-249, A-22).

**A1. Point de départ.** Le jeu démarre sur le nœud `sommaire` (racine). ✍️ *Défaut : OK.*

**A2. Affichage d'un écran.** À chaque nœud : afficher `text`, puis résoudre l'`actionType` requis (décor / pnj / piège / monstre) **avant** de proposer les choix sortants. Le joueur doit pouvoir utiliser les objets à sa disposition (un objet, une utilisation) ✍️ *Défaut : OK — l'action requise se résout d'abord ; les choix n'apparaissent qu'ensuite.*

**A3. Choix.** Les arêtes `choice` deviennent des boutons. Un choix avec **prérequis caché** (`prereq`) n'apparaît que si le héros possède l'objet. Un choix sous **compte à rebours** (`countdown`) bascule vers le `fallback` après N s s'il reste visible. ✍️ *Défaut : OK.*

**A4. Changement d'écran = +5 PE** (récupération, § 1). ✍️ *Défaut : OK, appliqué à chaque transition de nœud.*

**A5. Fins.** `endVictory` / `endFailure` terminent la partie (écran de fin) ; `mort` = game over. ✍️ *Défaut : OK.*

---

## B. Création du personnage (au lancement)

**B1. Génération.** 2D4 par carac + un bonus de **1D4** dont les points sont **répartis librement** par le joueur entre les caractéristiques de son choix, **plafond 10 par caractéristique à la création** (§ 1). ✍️ *Décision : pool de 1D4, distribution libre (pas forcément 3 caracs), cap 10 par carac au lancement.*

**B1-bis. Action requise optionnelle.** Une action à jet de dés (objet à prendre, voire piège) peut être **optionnelle** : le joueur ne sait pas forcément si c'est dangereux, il doit pouvoir **tenter** ou **passer** sans tenter. ✍️ *Décision : flag `optional` par action ; si présent, proposer « Laisser / Passer » à côté du jet.*

**B2. Relance ?** Le joueur peut-il relancer la génération (re-roll) avant de valider, ou un seul jet ? ✍️ *Défaut proposé : 1 seule relance globale autorisée.*

**B3. Équipement de départ.** Le héros commence-t-il avec une arme/armure ? ✍️ *Défaut proposé : mains nues (×0.3), aucune protection, 0 objet — tout vient du livre. Le scénario peut prévoir dans le sommaire ou le premier écran d'ajouter des objets.*

**B4. PE de départ.** PE courant initial = ? ✍️ *Défaut proposé : PE = EN (jauge pleine).*

**B5. Nom / identité.** Le joueur saisit-il un nom ? ✍️ *Défaut : oui, purement cosmétique.*

---

## C. Inventaire & équipement

**C1. Capacité d'inventaire.** Limite du nombre d'objets ? ✍️ *Défaut proposé : illimité (simplicité).*

**C2. Arme active.** Le héros peut porter plusieurs armes mais **une seule active** à la fois ; il l'équipe depuis l'inventaire. ✍️ *Défaut : OK.*

**C3. Changer d'arme/posture en combat.** Changer d'arme active **coûte-t-il** un round (ou est instantané) ? ✍️ *Défaut proposé : coûte le round (on n'attaque pas ce round-là).*

**C4. Protections cumulables ?** Une seule armure active ; le **bouclier** se cumule avec l'armure. Arme à 2 mains + bouclier **incompatibles**. ✍️ *Défaut : OK.*

**C5. Munitions (arc/arbalète).** Y a-t-il un stock de flèches/carreaux, ou tir illimité ? ✍️ *Défaut proposé : illimité (pas de gestion de munitions).*

**C6. « Utiliser un objet » dans une interaction.** Le brief dit qu'un objet peut « accomplir ou renforcer » une interaction. Concrètement : un objet **requis** (prérequis caché) débloque le choix ; un objet **de renfort** (ex. combat renforcé) modifie l'issue. ✍️ *Défaut : OK — deux mécaniques, prérequis (déjà modélisé) + renfort (à modéliser comme bonus défini par l'auteur).*

---

## D. Combat — orchestration

> Les **maths** (AT, PF, écart, postures) sont définies. Manque l'**orchestration**.

**D1. Initiative.** Les postures sont simultanées : on calcule les deux AT **en même temps** chaque round, le plus haut gagne l'assaut. Pas d'ordre d'initiative. ✍️ *Défaut : OK (simultané).*

**D2. Égalité d'AT.** AT égales → assaut nul (aucun dégât), on rejoue un round. ✍️ *Défaut : OK.*

**D2-bis. Garde aiguisée (anti-tortue).** Après **3 parades consécutives** d'un même combattant (posture Défensive remportée, 0 dégât), son **adversaire gagne +2 à la MC** pour le reste du combat, et le compteur de parades repart à zéro. Récompense l'agressivité face à une posture trop défensive ; s'applique au héros comme au monstre. Un assaut nul (AT égales, D2) est transparent pour le compteur : il ne progresse ni ne réinitialise la série de parades consécutives. ✍️ *Décision : OK.*

**D3. IA du monstre (choix de posture).** Comment le monstre choisit sa posture chaque round ?
  ✍️ *Défaut proposé : pondéré — 60 % Normale, 25 % Précise, 15 % Défensive ; passe à 40 % Défensive si ses PV < 25 %.* (À ajuster, ou rendre dépendant de l'IG du monstre ou utiliser une IA.)

**D4. Coût d'endurance.** -1 PE par round pour le héros et le monstre (§ 1). Le monstre a-t-il une jauge PE : **OUI**. ✍️ *Le monstre gère aussi sa jauge PE (sauf capacité « pas d'endurance » du Squelette et autres morts-vivants/créatures sans endurance, qui deviennent sans objet).*

**D5. Fuite.** Le héros peut fuir au début d'un round, tant que le combat est en cours. Il subit **un assaut gratuit** du monstre (Normale vs sa propre Défensive), journalisé au round N+1. Si ses PV sont ≤ 0 après cet assaut, il meurt (E1, hors combat : inconscient = mort ; la fuite sort du combat). Sinon il sort du combat avec ses PV restants et **reste au lieu courant** : aucun déplacement, aucun `fleeTarget` lu. Ni XP, ni butin, ni variation de plafonds. L'événement reste consommé. La fuite est terminale : aucune posture ne se joue après. ✍️ *Décision (n° 13, it2).*

**D6. Victoire / défaite.** Monstre à 0 PV → `victoryTarget` (+ butin, + XP). Héros à PV ≤ 0 → voir E1 ; PV ≤ −CA → `mort`. ✍️ *Défaut : OK.*

**D6-bis. Butin de monstre (`loot`).** Un monstre peut porter un **objet de butin** (champ `loot`) automatiquement ajouté au sac à la victoire — y compris un **objet d'intrigue** (`scenario`, ex. une clé) servant ensuite de prérequis caché à un choix (cf. A3). ✍️ *Décision : OK — le butin tombe à la victoire et peut débloquer une salle ultérieure.*

**D7. Combat de groupe.** L'éditeur modélise **1 monstre par écran**. Gère-t-on plusieurs monstres dans un même combat (cf. capacité « en groupe » du Hobgobelin) ?
  ✍️ *Défaut proposé : NON pour la v1 — un seul monstre par combat ; la capacité « en groupe » est ignorée tant que les groupes ne sont pas modélisés dans l'éditeur. (Sinon : il faut une feature éditeur « plusieurs monstres ».)*

**D8. Dégradation d'armure (coup critique).** Un critique retire 1 pt d'armure **de la cible** pour le reste du livre (§ 3). S'applique au héros ET au monstre. ✍️ *Défaut : OK.*

---

## E. Santé, soins, repos

**E1. État « inconscient » (0 ≥ PV > −CA).** Que se passe-t-il ?
  ✍️ *Défaut proposé : en combat, inconscient = le monstre porte un dernier assaut ; si PV repasse ≤ −CA → mort, sinon le héros se réveille à 1 PV à la fin du combat. Hors combat, inconscient est traité comme mort (game over).*

**E2. Potion (repos total).** « Le repos total requiert une potion » (§ 1). Que restaure une potion ?
  ✍️ *Défaut proposé : une potion restaure **PV au max** ET **PE au max**. Les potions sont des objets du livre (l'auteur les place). Quantité = illimitée à l'usage tant qu'on en possède.*

**E3. Récupération PE hors potion.** Uniquement +5 par changement d'écran (§ 1), pas de régénération passive. ✍️ *Défaut : OK.*

**E4. Soins partiels.** Existe-t-il des objets « +X PV » (don de PNJ, effet `pv`) ? Oui — `PnjGift` effet `pv`/`attaque`/`defense` applique un bonus. Bonus **permanent** ou temporaire ?
  ✍️ *Défaut proposé : effet `pv` = soin immédiat (rendre X PV, plafonné au max) ; `attaque`/`defense` = bonus **permanent** à l'AT / à la réduction. `scenario` = objet d'intrigue sans effet chiffré.*

---

## F. Challenges & progression

**F1. Où ont lieu les jets TC ?** Aujourd'hui : pièges + « jet requis » d'un objet à prendre (décor). Veut-on aussi des **choix sous jet** (un choix qui exige un jet réussi) ?
  ✍️ *Défaut proposé : NON en v1 — les jets restent sur pièges + objets à prendre. (Sinon : feature éditeur « choix avec jet ».)*

**F2. Quand dépense-t-on l'XP ?** La boutique de progression est-elle accessible :
  - (a) à tout moment, (b) seulement au repos/potion, (c) sur des écrans « marchand/sanctuaire » dédiés ?
  ✍️ *Défaut proposé : (a) à tout moment **hors combat**, via un écran « Progression » — la boutique est **inaccessible pendant un combat** (pas d'achat en plein affrontement) ; simple et sans dépendance éditeur.*

**F3. XP — quand est-il attribué ?** Immédiatement après un challenge réussi / un combat gagné (§ 5). ✍️ *Défaut : OK.*

**F3-bis. Sources d'XP hors combat.** Les jets de **décor** (objet à prendre) et de **piège** sont des challenges : une **réussite** rapporte l'XP de challenge (§ 5, formule du Delta + bonus de marge). Un **don de PNJ** peut en plus accorder une **récompense d'XP** directe (champ `xp` sur le don). ✍️ *Décision : OK — décor, piège et PNJ peuvent donner de l'XP.*

**F4. Gain de PV après montée de carac.** Augmenter FO/AG/EN augmente le **PV max** (PV = FO+AG+EN). Le PV courant suit-il (soin gratuit) ?
  ✍️ *Défaut proposé : le PV max augmente ; le PV courant gagne la différence (donc soin partiel implicite).*

---

## G. Sauvegarde de partie (technique, mais à cadrer)

**G1. État sauvegardé.** Nœud courant + héros (caracs, PV/PE/XP, MC bonus) + inventaire + armure/arme actives + objets déjà ramassés + monstres déjà vaincus (anti-farm). ✍️ *Défaut : OK.*

**G2. Anti-farm.** Un monstre/objet déjà résolu sur un écran se **re-déclenche** s'il y revient, ou reste consommé ?
  ✍️ *Défaut proposé : consommé — un objet ramassé ne se reprend pas, un monstre vaincu ne se recombat pas (mémorisé par id de nœud). De toute façon on ne peut pas revenir en arrière.*

**G3. Une seule partie à la fois par livre, ou plusieurs sauvegardes ?** ✍️ *Défaut proposé : une sauvegarde auto par livre (reprise « continuer »).*

---

## H. Capacités des monstres — LE point le plus lourd

Les 23 capacités sont aujourd'hui du **texte**. Pour le moteur, chacune doit devenir une **règle codée** (un effet déclenché à un moment précis du combat). Ci-dessous, ma lecture + une proposition d'implémentation : **valide (OK) ou corrige** chaque ligne. Marque **« décor »** si tu préfères la laisser purement narrative (affichée, non simulée) en v1.

| Monstre | Déclencheur | Effet proposé (à valider) |
|---------|-------------|---------------------------|
| Rat géant | victoire du héros avec Écart > 4 | héros perd 1 EN **max** (permanent) ✍️ |
| Gobelin | gagne le 1er round | vole 1 objet aléatoire « mineur » (= sans effet d'équipement) de l'inventaire ✍️ |
| Squelette | passif | ignore le PE (n'a pas de jauge), dégâts contondant ×2, perçant et coupant ÷2 — n'impacte que lui ✍️ *décor possible* |
| Zombie | atteint 0 PV | ignore le PE (n'a pas de jauge), jet 1D6 : sur 5–6, repasse à 1 PV (une seule fois) ✍️ |
| Harpie | chaque round | héros perd **-1 PE supplémentaire** ✍️ |
| Orque | atteint 0 PV | 1 assaut « désespéré » gratuit (Normale) avant de mourir ✍️ |
| Hobgobelin | en groupe | MC = 5 — **ignoré en v1** (pas de groupes, cf. D7) ✍️ |
| Araignée géante | héros subit un critique | poison : -1 PV/round pendant 1D4 rounds ✍️ |
| Loup géant | gagne avec Écart > 3 | héros -2 AT au prochain round ✍️ |
| Ours | 2 victoires d'affilée | 3e assaut gagné = dégâts ×2 garantis ✍️ |
| Serpent géant | héros subit un critique | venin : -2 PV/round pendant 3 rounds ✍️ |
| Sorcière | round 1 | jet 1D6 (1–3) : héros lâche son arme (mains nues) et passe le round ✍️ |
| Méduse | — | enlever la méduse ✍️ |
| Spectre | passif | ignore le PE (n'a pas de jauge), n'encaisse **qu'1 dégât max** par coup d'arme non-magique ✍️ *(notion d'arme magique à définir)* |
| Ogre | gagne, même si héros pare | détruit 1 pt d'armure/bouclier du héros ✍️ |
| Momie | passif + critique | ignore le PE (n'a pas de jauge), immunise les postures **Précises** (×1 au lieu de ×2) ; critique = soins bloqués ✍️ |
| Manticore | début du combat | 1D3 piques avant le corps-à-corps (AT fixe 5, 3 dégâts chacune) ✍️ |
| Troll | chaque round | régénère 3 PV ; annulé si le héros inflige des dommages avec feu/acide ✍️ *(source feu/acide à définir)* |
| Loup-Garou | chaque round | régénère 2 PV ; armure du LG **ignorée** si arme = argent ✍️ *(arme « argent » à définir)* |
| Géant | héros encaisse un coup | jet d'AG « Très dur » (TC3) sinon le héros tombe (passe le round) ✍️ |
| Liche | passif + critique | ignore le PE (n'a pas de jauge), ignore l'armure du héros (magie) ; critique = draine 1D4 PV **max** ✍️ |
| Tyrannœil | chaque round | ignore le PE (n'a pas de jauge), rayon 1D4 : 1=+2 dégâts, 2=-2 AT héros, 3=-2 EN, 4=mort si Écart > 5 ✍️ |
| Vampire | inflige des dégâts | se soigne de 50 % des dégâts infligés ✍️ |

**H-bis. Notions transverses à définir** (apparaissent dans les capacités) :
- **Arme magique / arme en argent** : un objet a-t-il un attribut « magique » / « argent » (Spectre, Loup-Garou) ?  ✍️ *Défaut proposé : ajouter un flag optionnel sur l'`EquipmentEffect` (`magic +n`, `silver?`). +n à MC et PF.*
- **Source feu/acide** (Troll) : une arme/objet peut-il porter un type de dégât ? ✍️ *Pas en v1, mais on peut avoir une flasque d'huile enflammée/acide à lancer.*
- **« Objet mineur »** (Gobelin) : défini comme objet sans effet d'équipement ou qui ne sert pas le scénario. ✍️

---

## I. IA des monstres — comportement de fuite

> Précision sur la logique de fuite, par grande famille de créature. Le « tier » = niveau de difficulté du monstre comparé au tier du personnage.

- **Humanoïdes** : peuvent fuir à 25 % de PV — jet sous MC, niveau de tier de difficulté = `1 + différence de tier (personnage − humanoïde)`.
- **Morts-vivants** : attaquent tout le temps et **ne fuient pas**.
- **Animaux** : à 50 % de PV, **une chance sur deux** de vouloir fuir. **Animaux géants** : à 40 % de PV.
- **Créatures magiques** : peuvent fuir à 10 % de PV — jet sous MC, niveau de tier de difficulté = `différence de tier (personnage − créature)` ; si 0 alors **ne fuira pas**.

---

## J. Horloge de session (dossier d'aventure)

**J1. Unité du pas d'horloge.** `monde.personnages[].plan_actions[].duree` et `contre_mesures[].delai` comptent des **pas d'horloge de session** — des entiers ≥ `DUREE_MIN`, dont le contrat et les motifs vivent dans la docstring de `DUREE_MIN` (`src/brain/dossier/types.ts`).

**Tranché par la feature n° 9 `moteur-dossier`, itération 2 (2026-09-20) : un (1) pas d'horloge de session = une (1) commande de joueur ACCEPTÉE par le moteur.** Une commande refusée ne consomme aucun pas. Une commande acceptée dont l'état du monde ne bouge pas — déplacement auto-référent — en consomme un : c'est la DEMANDE qui compte, jamais l'effet. Une conséquence enchaînée par le moteur dans la même résolution (jalon franchi, événement consommé) n'ajoute **jamais** de pas, sans quoi `plan_actions[].duree` cesserait d'être prévisible pour l'auteur qui l'écrit. Le pas n'a **aucune durée de fiction** : il ne se convertit ni en heures ni en journées, et aucune date n'en est dérivée.

**Le mot « tour » reste réservé au round de combat par `REGLES-DU-JEU.md` ; le pas de session se dit « pas ».** Les champs `EtatSession.horloge.tour` et `journal[].tour` portent ce mot par **dette de nommage gelée à l'itération 1** — `schema: 1` n'ayant aucun chemin de migration (KR-160/191), ils ne seront pas renommés. Ce n'est **pas** une levée de la réserve : aucun champ neuf, aucun libellé d'écran, aucune prose ne reprennent le mot — l'écran de partie affiche le numéro nu (`#7`).

**J2. Passage d'étape d'un PNJ** *(n° 14 `moteur-horloge`, itération 1 — écrit AVANT le code, 2026-10-05 ; colonne itération 2 réécrite AVANT le code, 2026-10-06 ; colonne itération 3 et règle d'origine réécrites AVANT le code, 2026-10-06).* Après chaque commande ACCEPTÉE, une fois la passe des jalons faite, le moteur évalue le plan de chaque personnage de `monde.personnages[]` et le fait avancer d'UNE étape au plus. Ce que `tickHorloge` lit : `plan_actions[]`, et la condition `declencheur_expr` de l'étape visée (par `etapeDeclenchee`) — jamais `duree`, jamais `si_bloque`, jamais `depuis`. L'itération 2 a ajouté une ÉCRITURE : `etape_plan.depuis`, le pas de l'avancement. L'itération 3 ajoute une CONSTATATION : quand un personnage n'avance pas et que la durée de son étape COURANTE tombe à ce pas, le tick écrit UNE ligne de journal `etape_bloquee`, et rien d'autre. La décision elle-même — la formule d'échéance — n'est PAS dans le tick : elle vit dans un prédicat pur, `etapeBloqueeAuPas` (`src/brain/dossier/blocage.ts`), que le tick appelle.

**Vocabulaire.** `k` = rang courant ; `n = k + 1` = rang visé. Le **rang est un INDEX dans le tableau `plan_actions[]`** (0 = première étape), jamais le champ `etape` : tableau et `etape` se désynchronisent dès qu'une étape est retirée, et le moteur ne trie jamais sur `etape` (KR-198). **`EtatPnj.etape_plan` ABSENT ≡ `k = 0`** : c'est l'état de départ, il se calcule, et il n'est jamais stocké d'office (KR-013) — `etape_plan` n'est ÉCRIT qu'à un AVANCEMENT, à `{ rang: n }` à l'itération 1 et à `{ rang: n, depuis: <pas> }` depuis l'itération 2 (un `{ rang: 0 }` rencontré est légal et se lit comme l'absence). Le déclencheur de l'étape 0 n'est donc jamais lu : on ne « passe » pas à l'étape où l'on se trouve déjà.

**`depuis` (itération 2).** `EtatPnj.etape_plan.depuis` est la valeur de `EtatSession.horloge.tour` AU PAS de l'avancement : le pas où le personnage est entré dans son étape courante. Il est écrit **à chaque avancement, et jamais autrement** — un tick qui n'avance pas ne le crée pas et ne le modifie pas — par `tickHorloge` seul, et il vaut toujours le pas COURANT, jamais `+1` (J1). Une conséquence directe, qui est le premier lecteur de ce champ : un personnage a avancé **à ce pas** si et seulement si `etape_plan.depuis === horloge.tour`. Le champ est **OPTIONNEL à vie** (KR-251) : une session écrite avant l'itération 2 porte `etape_plan: { rang }` sans `depuis`, et elle se joue telle quelle — le moteur n'ÉCRIT jamais une origine inventée dans une entrée qu'il n'a pas datée, ni `0` ni le pas courant. **`depuis` absent ≡ pas d'entrée datée** : le personnage n'a pas avancé à ce pas.

**L'origine du décompte de la durée (itération 3).** L'origine d'une étape est le pas où le personnage y est entré. Elle se LIT, jamais ne se stocke (KR-013), selon trois cas exclusifs : (a) `etape_plan.depuis` est écrit → l'origine est `depuis`, quel que soit le rang ; (b) `depuis` n'est pas écrit et le rang vaut `0`, ou `etape_plan` est ABSENT → l'origine est `0` : l'étape de départ est occupée depuis l'ouverture de la partie, c'est le même fait que `etape_plan` absent ≡ rang 0 (KR-013), et c'est ce qui rend l'étape de départ d'un personnage — celle que presque tout plan porte seule — atteignable par la durée ; (c) `depuis` n'est pas écrit et le rang vaut `1` ou plus (une session de 0.7.21) → **il n'y a pas d'origine, et le personnage n'est JAMAIS en échéance** : le pas où il est entré dans une étape que le moteur n'a pas datée ne se devine pas, et le moteur n'invente ni `0` ni le pas courant. Le cas (b) n'est donc pas une exception à « le moteur n'invente jamais une origine » : `0` y est un fait de l'ouverture, pas une devinette.

Dans le tableau, `origine` est l'origine du décompte définie ci-dessus (cas a, b, c), et `tour` est `EtatSession.horloge.tour` AU PAS COURANT, celui du tick.

| # | Situation | itération 1 *(livrée)* | itération 2 *(minuterie abolie, `depuis` écrit)* | itération 3 *(blocage constaté au journal)* |
|---|---|---|---|---|
| 1 | `etape_plan` absent, `plan_actions[1]` porte un `declencheur_expr` VRAI | passe au rang 1 : `etape_plan: { rang: 1 }` est écrit — premier écrit de l'entrée | passe au rang 1 : `etape_plan: { rang: 1, depuis: <pas> }` est écrit — premier écrit de l'entrée | idem — et **aucun constat** à ce pas, même si l'échéance de l'étape 0 y tombe (ligne 9) |
| 2 | `etape_plan` absent, `plan_actions[1]` sans `declencheur_expr` | ne bouge pas | ne bouge pas — **la minuterie est abolie** : aucune durée ne fait jamais avancer un personnage | ne bouge pas, jamais ; si `tour − origine === plan_actions[0].duree` (origine 0, cas b), UNE ligne `etape_bloquee : <pnj.id> 1` est écrite, à ce pas seulement |
| 3 | `k ≥ 1` (`etape_plan` déjà écrit), `plan_actions[n]` porte un `declencheur_expr` VRAI | passe au rang n | passe au rang n ; `depuis` est RÉÉCRIT au pas courant, que l'entrée en porte déjà un ou non | idem — et **aucun constat** à ce pas (ligne 9) |
| 4 | `plan_actions[n]` porte un `declencheur_expr` FAUX | reste au rang k — même si `duree` est posée et échue | reste, et `depuis` n'est pas touché | reste, et `depuis` n'est pas touché ; si `tour − origine === plan_actions[k].duree`, l'étape COURANTE est **bloquée à ce pas** : UNE ligne `etape_bloquee : <pnj.id> <k+1>` est écrite au journal, et rien d'autre. Le blocage est un CONSTAT du pas, jamais un état stocké, et il n'avance jamais le personnage |
| 5 | `plan_actions[n]` sans `declencheur_expr`, `duree` posée | reste (minuterie reportée) | reste — la `duree` de l'étape VISÉE n n'est jamais lue : elle se lira quand le personnage y sera, comme étape courante | reste — la `duree` de l'étape VISÉE n n'est jamais lue ; celle de l'étape COURANTE k l'est, comme à la ligne 4 |
| 6 | `plan_actions[n]` sans `declencheur_expr` ni `duree` | plan arrêté : une étape sans condition structurée reste calme, le moteur ne la fait jamais avancer | idem | idem — l'étape courante k, si elle porte une `duree`, peut être bloquée comme à la ligne 4 ; sans `duree` sur k, jamais |
| 7 | `k` = dernier rang (`plan_actions[n]` n'existe pas) | ne bouge plus | ne bouge plus | ne bouge plus ; bloqué à ce pas si `tour − origine === plan_actions[k].duree` : le DERNIER rang est une étape comme une autre pour la durée |
| 8 | `rang ≥ plan_actions.length`, ou négatif, ou non entier (session persistée contre un dossier édité) | no-op : aucune écriture, aucune ligne, aucune exception | idem — `depuis` n'est pas écrit non plus | idem — aucune étape courante n'existe, donc aucun constat |
| 9 | `plan_actions[n]` porte un `declencheur_expr` VRAI **ET** `tour − origine === plan_actions[k].duree` au même pas | — | — | **le personnage AVANCE** (UNE seule ligne, `etape_plan : …`), et il n'y a **aucun constat** : l'avancement emporte le blocage, et les deux s'excluent — on ne constate pas le blocage d'une étape que l'on quitte à ce pas |

**Trois choses sont tranchées à l'itération 2, et ne se rouvrent pas :**
1. **La minuterie est abolie.** Une durée échue ne fait JAMAIS avancer un personnage : elle constate un BLOCAGE de l'étape où il se trouve, et un blocage n'est pas un passage d'étape. Seul un `declencheur_expr` VRAI sur l'étape visée fait avancer (lignes 1 et 3) ; sans lui, le plan s'arrête (lignes 2, 5, 6).
2. **`duree` se lit sur l'étape COURANTE `k`**, jamais sur la visée `n` : `plan_actions[].duree` est « le nombre de pas avant l'échéance DE CETTE ÉTAPE » (`types.ts`).
3. **`depuis` entre à l'itération 2, avant la formule de durée** — dérogation écrite à « jamais avant son lecteur » (KR-249), et non un oubli : son premier lecteur est la sélection de ce qu'un personnage a fait « à ce pas » (`depuis === horloge.tour`, voir plus haut), que lit l'assembleur du narrateur (R3). Un champ sans ce lecteur dans la même itération resterait refusé.

**Quatre choses sont tranchées à l'itération 3, et ne se rouvrent pas :**
1. **La formule d'échéance est une ÉGALITÉ, jamais une inégalité : `tour − origine === plan_actions[k].duree`.** Un blocage est un ÉVÉNEMENT du pas où l'échéance tombe, pas un niveau. Avec `>=`, le même constat serait réécrit à CHAQUE pas suivant : le journal de l'auteur se remplirait d'une ligne identique par commande, et le narrateur (R3) raconterait le même geste en boucle. Avec `===`, le constat tombe UNE fois, au pas exact ; un pas plus tôt (`durée − 1`) comme un pas plus tard (`durée + 1`), il n'y en a pas.
2. **L'origine d'un personnage jamais avancé est `0`** (cas b de l'origine du décompte). L'itération 2 avait posé le contraire — « un personnage jamais avancé n'a pas d'origine, donc n'est jamais en échéance » — en disant que l'itération 3 le relirait si l'auteur attendait le contraire : il l'attend. L'étape de départ est la seule que presque tout plan porte, et sans origine `0` la `duree` et le `si_bloque` qu'un auteur écrit sur elle (c'est le cas des deux personnages du dossier de référence) ne s'atteindraient jamais. Pour un rang `1` ou plus sans `depuis`, rien n'est inventé : jamais en échéance (cas c).
3. **L'avancement emporte le blocage** (ligne 9) : un seul des deux par personnage et par pas, par le flot de contrôle du tick — l'avancement d'abord, le constat seulement sinon.
4. **Le blocage a UN site de décision**, le prédicat pur `etapeBloqueeAuPas(personnage, entree, tour)` de `src/brain/dossier/blocage.ts` (KR-246). Le tick l'appelle pour écrire le constat au journal ; l'assembleur du narrateur l'appelle pour choisir la didascalie `si_bloque` à injecter — aucun des deux n'écrit la formule. Le prédicat est TOTAL : un rang négatif, non entier ou au-delà du plan, ou une étape sans `duree`, ou un rang `1` ou plus sans `depuis`, donnent « pas de blocage », jamais une levée.

**Règles transverses de J2.**
1. **Un cran au plus par PNJ et par pas**, même si plusieurs déclencheurs suivants sont déjà vrais : sans cela `duree` redevient imprévisible pour l'auteur (J1).
2. **Quand.** Le tick tourne APRÈS la passe des jalons, sur les faits qu'elle a rendus, et seulement sur une commande ACCEPTÉE : un refus n'avance rien, et tant qu'un combat est ouvert toute commande est refusée AVANT tout tick (KR-295 : un combat entier = un seul pas d'horloge).
3. **Ordre.** L'ordre de `monde.personnages[]` (le document), jamais l'ordre alphabétique ni celui d'insertion dans `monde.pnj`.
4. **Journal.** UNE ligne par avancement, `role: 'moteur'`, au `tour` du pas — jamais `+1` (J1) —, après les lignes de jalons. Le texte est un relevé d'état en **base 1**, jamais de la prose : `etape_plan : <pnj.id> <n+1>` au premier écrit (sans flèche, précédent `lieu_courant`), `etape_plan : <pnj.id> <k+1> → <n+1>` ensuite. Ni `origine`, ni `deltas`, ni `recit`, ni `jet`, ni `interlocuteur` : la ligne n'est la demande d'aucune commande, et jamais le texte de `action`. **Depuis l'itération 3, UNE ligne par blocage constaté**, même registre et même forme : `etape_bloquee : <pnj.id> <k+1>` — snake_case minuscule ASCII (les MAJUSCULES sont réservées au bandeau de l'itération 4), base 1, `role: 'moteur'`, au `tour` du pas, sans `origine`, `deltas`, `recit`, `jet` ni `interlocuteur`, jamais le texte de `si_bloque`. **La ligne s'écrit même quand l'auteur n'a pas rédigé de `si_bloque`** : l'auteur voit toujours le constat.
5. **`DUREE_MIN = 1`** (`types.ts`) : une durée est un entier ≥ 1, jamais 0 — c'est ce qui interdit une étape qui naîtrait bloquée : avec `===`, `tour − origine` vaut `0` au pas même où le personnage entre dans l'étape, et ne peut donc pas égaler une durée ≥ 1.
6. **Périmètre d'écriture.** *(Celui du tick des PERSONNAGES : depuis l'itération 4, `tickHorloge` appelle d'abord `tickClimat`, dont le périmètre est celui de J3.)* Le tick n'écrit que `monde.pnj[id].etape_plan` (`rang`, et `depuis` depuis l'itération 2 — les DEUX clés d'un MÊME avancement, jamais l'une sans l'autre) et le journal. **Un constat de blocage n'écrit QUE le journal** : aucune entrée `monde.pnj` créée ou touchée, `etape_plan` garde la MÊME RÉFÉRENCE — c'est ce qui garde la minuterie abolie. Aucun prédicat du registre `PREDICATES` ne lit `etape_plan`, et aucun effet de monde d'une étape n'est appliqué (n° 14, itérations suivantes ; `si_bloque` est une didascalie, jamais un delta). La ligne de journal d'un avancement est INCHANGÉE par `depuis` : le pas y est déjà le `tour` de la ligne.
7. **Audience.** `etape_plan.rang` et `etape_plan.depuis` sont `moteur` : un modèle qui lirait `rang` connaîtrait l'étape courante et jouerait une urgence que le moteur n'a pas constatée, et un modèle qui lirait `depuis` pourrait compter lui-même un blocage que le moteur n'a pas constaté. Ce que le modèle apprend d'un avancement passe par un contexte que le CODE compose (le bloc R3 `PENDANT CE TEMPS`, itération 2), jamais par ces feuilles ; ce qu'il apprend d'un blocage est la prose d'auteur `si_bloque`, au pas d'échéance seulement, jamais le mot « bloqué » ni un compte de pas (itération 3).
8. **`depuis` ne décide JAMAIS d'un avancement.** `tickHorloge` l'ÉCRIT à l'avancement et ne le lit pas (garde source de `horloge.test.ts`) : un tick qui lirait `depuis` pour décider d'un avancement rétablirait la minuterie que J2 abolit. Le seul usage de `depuis` pour décider est celui du prédicat de blocage `etapeBloqueeAuPas`, qui en tire une ORIGINE de décompte et n'en tire qu'un CONSTAT — jamais un avancement. Le champ a, en dehors du tick, deux lecteurs en production, mesurés dans `src/` hors tests : ce prédicat, et la sélection « avancé à ce pas » de R3 (`depuis === horloge.tour`, `src/brain/copilote/contexte/horloge.ts`), qui ne décide d'aucun plan.
9. **La durée n'a qu'UN lecteur de décision : le prédicat de blocage** (KR-246). `plan_actions[].duree` se lit dans `etapeBloqueeAuPas` (`src/brain/dossier/blocage.ts`) et dans aucun autre module du MOTEUR : ni `tickHorloge`, ni l'assembleur du narrateur, ni `src/player/`. Portée mesurée, jamais espérée (KR-258) : dans `src/brain/dossier/` hors tests, `validate.ts` lit aussi `duree` — pour l'avertissement sur un `si_bloque` orphelin, qui n'est pas une décision de jeu —, et les panneaux d'édition de `src/features/` la lisent pour la saisir.

**J3. Climat de session** *(n° 14 `moteur-horloge`, itération 4 — écrit AVANT le code, 2026-10-06).* Un climat est une condition ambiante que le moteur ALLUME à un instant daté par le dossier, applique, puis ÉTEINT quand sa durée est écoulée. `Climat` ne porte aucun déclencheur propre (`types.ts`) : l'instant daté est celui d'un ÉVÉNEMENT qui le désigne. Une seule fonction écrit l'état — `tickClimat` (`src/brain/dossier/climat.ts`), appelée en tête de `tickHorloge` — et le choix de l'événement a UN site de décision, `evenementDeClimat` (`src/brain/dossier/evaluate.ts`, le seul lecteur de `declencheur_expr`, KR-246).

**L'état.** `EtatSession.horloge.climat_actif?: { id, depuis }` — `id` est l'identifiant du climat (`monde.conditions.climat[].id`), `depuis` la valeur de `horloge.tour` AU PAS de l'activation (le pas courant, jamais `+1` : le tick n'ajoute pas de pas, J1). Le champ est **OPTIONNEL à vie** (KR-251) : **ABSENT ≡ aucun climat actif**, la clé est RETIRÉE et jamais posée à `undefined` ni à `null` — une session écrite avant l'itération 4 n'a pas la clé, état LÉGAL. Il n'y a qu'UNE clé, pas une liste : empiler les climats serait un choix irréversible en `schema: 1` (KR-160/251), et personne n'a arbitré ce que deux climats simultanés voudraient dire.

**Quel événement allume un climat.** `Evenement.climat_id?` — une RÉFÉRENCE vers `monde.conditions.climat[]` (`REFERENCES_SIMPLES` : une référence pendante est refusée au SSOT, jamais rompue en silence), de destination `moteur`. `evenementDeClimat` rend le PREMIER événement du dossier — l'ordre du document — qui tient les QUATRE conditions : il porte un `climat_id` non vide ; il ne porte PAS de `monstre_ref` ; il n'est pas déjà dans `monde.evenements_consommes` ; son `declencheur_expr` est VRAI contre `session.monde`. Un événement sans `declencheur_expr` n'est jamais déclenché automatiquement (même règle que les jalons et les rencontres). **Un événement qui porte `monstre_ref` ET `climat_id` est IGNORÉ par ce sélecteur : la rencontre prime** (`evenementARencontrer`), et la configuration ambiguë est ignorée sans alerte — elle ne consomme ni ne règle rien ici.

**L'activation**, dans CET ordre : (1) l'événement est AJOUTÉ à `monde.evenements_consommes` — il n'y figure jamais déjà, le sélecteur ne rendant que des événements non consommés — il est consommé à l'activation et jamais plus tard, comme la rencontre l'est à l'ouverture du combat ; (2) chaque delta de `effets_regles` du climat est appliqué DANS L'ORDRE par `appliquerDelta`, sur les faits que (1) vient d'écrire ; (3) `horloge.climat_actif = { id: <climat_id>, depuis: <tour> }`. Un climat dont un effet est sans objet — un objet déjà possédé — s'active quand même : l'effet est constaté `sans_effet` au journal (KR-247), jamais une erreur. **Un `climat_id` qui ne résout pas** — impossible sur un dossier accepté, `validateDossier` le refuse — s'active SANS effet et s'éteint au tick suivant par le cas (b) de l'extinction : la partie ne lève pas, et l'anomalie se lit au journal, jamais en silence (KR-021).

**L'extinction.** À chaque tick, si un climat est actif ET que (a) son `duree` est définie ET `tour − depuis >= duree`, OU (b) l'identifiant n'est plus un climat du dossier, `climat_actif` est RETIRÉ. Valeurs exactes pour `depuis = 2` et `duree = 3` : au pas 4, `4 − 2 = 2 < 3`, le climat reste ; au pas 5, `5 − 2 = 3 >= 3`, il s'éteint — un climat posé au pas `p` est donc présent dans l'état APRÈS les pas `p` à `p + duree − 1`, soit `duree` pas, et le pas `p + duree` est celui de sa disparition. **La garde est `>=`, et c'est la différence nommée avec J2 règle 1 (itération 3), qui tenait `===` :** le blocage CONSTATE — il n'écrit que le journal, ne retire rien, donc avec `>=` il se répéterait à chaque pas suivant ; l'extinction EFFACE l'état, donc elle ne peut pas se répéter, et `>=` couvre une session forgée ou persistée dont le pas a dépassé l'échéance (`tour − depuis > duree`) là où `===` laisserait un climat éternel. Deux mécanismes, deux gardes. **Un climat sans `duree` est PERMANENT** : l'absence de durée est un état calme (`Climat.duree` est optionnel), jamais une extinction immédiate ni un refus — seul le retrait du climat du dossier l'éteint, par (b). **Un `climat_actif.id` introuvable dans le dossier s'éteint** (session persistée contre un dossier édité, cas b) : le conserver créerait un état mort à vie, que ni la durée ni aucun événement ne lèverait.

**Un seul climat à la fois.** Tant que `climat_actif` existe APRÈS l'étape d'extinction, aucun événement de climat n'est consommé : le second attend, NON consommé, et s'active au premier pas où la place est libre — **y compris au pas même où le précédent s'éteint** (l'extinction d'abord, l'activation ensuite : un climat qui vient de s'allumer n'est jamais éteint dans le tick qui l'allume, puisque l'extinction ne lit que l'état d'ENTRÉE du tick).

**Quand.** `tickClimat` tourne EN TÊTE de `tickHorloge`, donc APRÈS la passe des jalons et avant les personnages de J2, et seulement sur une commande ACCEPTÉE (J2 règle 2 : un refus n'avance rien, et tant qu'un combat est ouvert toute commande est refusée avant tout tick, KR-295). **Latence d'un pas, documentée et jamais corrigée par une seconde passe :** un jalon dont la condition devient vraie PAR un effet de climat n'est résolu qu'à la commande SUIVANTE, la passe des jalons ayant déjà tourné. Les personnages de J2, eux, lisent les faits d'APRÈS le climat. Il n'y a pas d'activation à l'ouverture de la partie (pas de pas, pas de tick) : un climat ne s'allume que dans le tick d'une commande acceptée.

**Journal.** `role: 'moteur'`, au `tour` du pas COURANT (jamais `+1`), SANS `origine`, `recit`, `jet` ni `interlocuteur` — ni l'activation ni l'extinction ne sont la demande de personne —, texte en relevé d'état, snake_case minuscule ASCII, jamais de prose (ni `nom`, ni `manifestation`) : `climat_actif : <climat.id>` à l'activation, AVEC `deltas` (un élément par effet de règle, dans l'ordre, `effet` constaté ; la clé `deltas` est ABSENTE — jamais `[]` — quand le climat n'a aucun `effets_regles`, KR-247) ; `climat_eteint : <climat.id>` à l'extinction, SANS `deltas`. Dans un même tick : la ligne d'extinction, puis celle d'activation, puis les lignes des personnages (J2 règle 4). Un tick où rien ne change rend la MÊME RÉFÉRENCE de session.

**Périmètre d'écriture.** `tickClimat` n'écrit que `horloge.climat_actif`, `monde.evenements_consommes`, les feuilles de `monde` que les `effets_regles` écrivent par `DELTAS`, et le journal — ni `heros`, ni `combat`, ni `monde.pnj`. `horloge.tour` n'est jamais touché par lui. Les trois transitions de `commandes.ts` écrivent l'horloge en CONSERVANT ses autres clés (`{ ...session.horloge, tour }`) : sans cela, le premier `aller` effacerait `climat_actif` en silence.

**L'IA n'a aucune part dans le cycle de vie.** Elle ne demande jamais l'activation d'un climat, ne l'éteint pas, et aucune prose d'extinction n'est injectée : le CODE allume (condition de l'événement) et éteint (durée). `nom` est un libellé d'INTERFACE (le bandeau de l'écran de partie) et n'entre dans aucun contexte de modèle. `manifestation`, la seule prose `ia` d'un climat, est servie par l'assembleur du narrateur — hors de cette itération. **Audience :** `horloge.climat_actif.id` et `horloge.climat_actif.depuis` sont `moteur` — un modèle qui lirait `depuis` compterait lui-même l'extinction que le moteur n'a pas constatée.

**Lecteur de `Climat.duree`.** UN lecteur de décision, `tickClimat` (`climat.ts`) : dans `src/brain/` et `src/player/`, ni `tickHorloge`, ni l'assembleur du narrateur, ni le validateur (qui ne lit que `plan_actions[].duree`), ni le runtime joueur ne lisent ce champ — mesuré, jamais espéré (KR-258) ; les panneaux d'édition de `src/features/` le lisent pour le saisir, ce qui n'est pas une décision. Il est distinct de `plan_actions[].duree` (J2 règle 9, lu par `etapeBloqueeAuPas` seul) : deux champs de même nom, deux décisions, deux sites.

| # | Situation, au tick du pas `tour` | Résultat |
|---|---|---|
| 1 | aucun climat actif, aucun événement de climat dû | rien : MÊME RÉFÉRENCE de session |
| 2 | aucun climat actif, un événement de climat dû | activation : événement consommé, `effets_regles` appliqués, `climat_actif: { id, depuis: tour }`, ligne `climat_actif : <id>` avec `deltas` |
| 3 | climat actif de `duree` d, `tour − depuis < d` | inchangé — aucune ligne `climat_eteint` |
| 4 | `tour − depuis === d` | extinction : clé RETIRÉE, ligne `climat_eteint : <id>` sans `deltas` |
| 5 | `tour − depuis > d` (session forgée ou persistée) | extinction, comme la ligne 4 (`>=`) |
| 6 | climat actif sans `duree` | jamais éteint par la durée |
| 7 | `climat_actif.id` introuvable dans le dossier | extinction, comme la ligne 4 |
| 8 | climat actif, un second événement de climat dû | le second n'est PAS consommé : un seul climat à la fois |
| 9 | extinction ET second événement dû au même pas | extinction puis activation du second : deux lignes, dans cet ordre |
| 10 | événement dû qui porte `monstre_ref` ET `climat_id` | ignoré par le sélecteur de climat : la rencontre prime |
| 11 | climat sans `effets_regles` | activation sans clé `deltas` sur la ligne |
| 12 | effet déjà appliqué (objet déjà possédé) | activation ; `deltas` porte `effet: 'sans_effet'` |

---

## Priorité de cadrage
1. **H** (capacités) — sans ça, les monstres ne « font » rien de spécial.
2. **D3, D5, E1, E2** — IA monstre, fuite, inconscience, potions : indispensables au combat jouable.
3. **C, F2, G** — inventaire/équipement, boutique XP, sauvegarde.
4. **D7 / F1** — groupes & choix-sous-jet : peuvent rester hors v1.

> Une fois ce fichier rempli (ne serait-ce qu'avec les défauts validés), j'en tire une `specification.json` « play-mode » au format du repo + les modules `brain/` runtime (boucle de combat, application des capacités, état de session). Le plus simple : relis et écris **OK** partout où le défaut te convient, et corrige le reste.
