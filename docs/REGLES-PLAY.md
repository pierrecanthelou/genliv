# Règles du mode JEU — à compléter

> Le manuel (`REGLES-DU-JEU.md`) définit le **cœur quantitatif** (perso, jets, combat, XP, bestiaire). Pour un **moteur jouable** (charger un livre → créer un héros → jouer), il manque les règles d'**orchestration** ci-dessous. Chaque point propose un **défaut raisonnable** : tu n'as qu'à écrire **OK** pour l'adopter, ou ta variante. Une fois rempli, ce fichier devient la suite de `REGLES-DU-JEU.md` et permet de spécifier le moteur (feature `play-mode`, aujourd'hui différée).
>
> Convention : ✍️ = décision attendue. Les défauts sont des **propositions**, pas des règles officielles.

---

## A. Boucle de jeu (traversée du livre)

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

**D2-bis. Garde aiguisée (anti-tortue).** Après **3 parades consécutives** d'un même combattant (posture Défensive remportée, 0 dégât), son **adversaire gagne +2 à la MC** pour le reste du combat, et le compteur de parades repart à zéro. Récompense l'agressivité face à une posture trop défensive ; s'applique au héros comme au monstre. ✍️ *Décision : OK.*

**D3. IA du monstre (choix de posture).** Comment le monstre choisit sa posture chaque round ?
  ✍️ *Défaut proposé : pondéré — 60 % Normale, 25 % Précise, 15 % Défensive ; passe à 40 % Défensive si ses PV < 25 %.* (À ajuster, ou rendre dépendant de l'IG du monstre ou utiliser une IA.)

**D4. Coût d'endurance.** -1 PE par round pour le héros et le monstre (§ 1). Le monstre a-t-il une jauge PE : **OUI**. ✍️ *Le monstre gère aussi sa jauge PE (sauf capacité « pas d'endurance » du Squelette et autres morts-vivants/créatures sans endurance, qui deviennent sans objet).*

**D5. Fuite.** Quand le héros peut-il fuir, et à quel prix ?
  ✍️ *Défaut proposé : le héros peut tenter de fuir au début d'un round ; il subit **un assaut gratuit** du monstre (posture Normale du monstre vs sa propre Défensive), puis part vers le `fleeTarget` du monstre. Pas de fuite si `fleeTarget` est absent.*

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

**J1. Unité du pas d'horloge.** `monde.personnages[].plan_actions[].duree` et `contre_mesures[].delai` comptent des **pas d'horloge de session** — des entiers ≥ `DUREE_MIN`, dont le contrat et les motifs vivent dans la docstring de `DUREE_MIN` (`src/brain/dossier/types.ts`). ✍️ *Ce que vaut UN pas n'est pas tranché ici : propriété de la feature n° 9 `moteur-dossier` (n° 14 pour son avancement). Le mot « tour » reste réservé au round de combat par `REGLES-DU-JEU.md`.*

---

## Priorité de cadrage
1. **H** (capacités) — sans ça, les monstres ne « font » rien de spécial.
2. **D3, D5, E1, E2** — IA monstre, fuite, inconscience, potions : indispensables au combat jouable.
3. **C, F2, G** — inventaire/équipement, boutique XP, sauvegarde.
4. **D7 / F1** — groupes & choix-sous-jet : peuvent rester hors v1.

> Une fois ce fichier rempli (ne serait-ce qu'avec les défauts validés), j'en tire une `specification.json` « play-mode » au format du repo + les modules `brain/` runtime (boucle de combat, application des capacités, état de session). Le plus simple : relis et écris **OK** partout où le défaut te convient, et corrige le reste.
