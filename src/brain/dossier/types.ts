/**
 * Le DOSSIER D'AVENTURE — le format que l'éditeur produit au Temps 1 et que le
 * moteur joue au Temps 2. C'est le contrat entre les deux temps : les quinze
 * features suivantes le consomment.
 *
 * TREIZE RACINES groupées en TROIS : `canon` (ce qui est vrai de l'histoire),
 * `monde` (les acteurs et le décor), `charpente` (ce que le moteur lit).
 *
 * `canon.mj` est séparé de `canon.partage` : le synopsis MJ porte la vérité, y
 * compris ce que le joueur ignore. Les deux fondus, le PNJ serait omniscient par
 * construction. C'est la seule scission NON MIGRABLE du schéma — on ne coupe pas
 * de la prose déjà rédigée par script.
 *
 * CASSE DES CLÉS : `snake_case` pour toute clé du document persistant.
 * `createdAt` / `updatedAt` sont l'UNIQUE exception, motivée — des horodatages
 * ISO jamais tapés à la main. L'auteur écrit ce JSON à la main jusqu'à la n° 3,
 * d'où les exemples portés par les JSDoc des champs de prose.
 *
 * PÉRIMÈTRE — décision A du 2026-08-04 : la forme COMPLÈTE des treize racines
 * n'appartient plus à cette feature. Chaque racine reçoit la sienne dans la
 * feature qui l'ÉDITE (`canon` en n° 3, `personnages` en n° 4, `lieux`/`objets`/
 * `indices` en n° 5, `quetes`/`evenements`/`conditions` en n° 6) — à une exception
 * DATÉE : la section 07 lieux est passée à la n° 3 au cadrage du 2026-08-10
 * (`docs/ROADMAP-BASCULE-IA.md` § 3), qui y pose la PROSE de `Lieu` ; `acces` et
 * les références croisées de `Lieu` restent aux n° 4/5/6. L'itération 2
 * ne pose ici que les corrections IRRÉVERSIBLES — celles qu'aucune migration ne
 * rattrape : la collision de clé `plan`, les portes de révélation fermées, les
 * quatre emplacements de deltas TYPÉS, `monstre_ref`, et `jalons[].enonce_texte`.
 * L'itération 3 y ajoute les DIX champs des cinq familles de conditions (D1) —
 * six `…_expr` moteur, quatre `…_texte` auteur, tous optionnels. L'itération 4
 * ferme le VOCABULAIRE des quatre emplacements d'effets : `DeltaBrut`
 * (`Record<string, unknown>`, la seule FORME que l'it2 pouvait figer) laisse la
 * place à `Delta`, dont la clé `delta` est un identifiant du registre `DELTAS`.
 * La n° 4 `dossier-fiches` ouvre ensuite la fiche de personnage, une TRANCHE DE
 * SCHÉMA par itération (KR-190) : l'itération 1 y pose `camp` et `objectif_id`,
 * tous deux OPTIONNELS — le schéma reste 1, et rien de ce qui est déjà persisté ne
 * devient invalide (KR-191). L'itération 2 y ajoute les TROIS proses d'identité —
 * `fonction`, `apparence`, `description_joueur` —, optionnelles elles aussi et
 * toutes trois d'audience `ia`. L'itération 3 y ajoute `stats` — les HUIT
 * caractéristiques, optionnelles EN BLOC et TOTALES quand le bloc est là.
 * L'itération 4 y pose le PLAN D'ACTION COMPLET : `but` (optionnel en bloc,
 * `libelle` requis dedans — même contrat que `stats`), deux champs de plus sur
 * `PlanAction` (`duree` moteur, `si_bloque` ia) et `contre_mesures[]`, SIXIÈME
 * famille de conditions D1 et première liste OPTIONNELLE dont les éléments sont
 * contrôlés (fermeture du trou résiduel de BUG-050). L'itération 5 SITUE le
 * personnage dans le monde : `relations[]` (qui il connaît) et `presence[]` (où on
 * le trouve), deux listes optionnelles structurées de plus — et avec elles la
 * PREMIÈRE référence auto-référentielle du schéma, LÉGALE et sans garde (KR-194),
 * ainsi que le PREMIER champ dont l'injection dépend du RÔLE qui demande
 * (`Relation.secret`, dont le prédicat est écrit à DEUX sites et nulle part
 * ailleurs).
 *
 * QUI LIT QUOI : ce fichier dit la FORME, il ne dit pas l'AUDIENCE. L'audience
 * de chaque champ terminal vit dans `destinations.ts`, sous le balayage de
 * `couverture.test.ts` — trois questions disjointes, trois sources, un seul
 * garde.
 *
 * AUCUNE fonction ne convertit un `Book` en `Dossier` ni l'inverse, dans aucun
 * sens (KR-167) : un chemin de compatibilité serait une seconde source de vérité
 * que personne n'oserait couper en n° 9.
 */
import { CHARACTERISTIC_VALUES, type Characteristic } from '../characteristics'
import type { ChallengeTier } from '../challenge'
import type { ExprNode } from './expr'
import type { Delta } from './deltas'

/**
 * La version du schéma. Comparée au NOMBRE 1, strictement : ni `'1'`, ni `0`, ni
 * `2`, ni absent, et jamais coercée (KR-160). Il n'existe pas de `migrateDossier`
 * et il ne doit pas en exister tant qu'aucun schéma 2 n'existe — sans v2, une
 * fonction de migration n'a ni test ni appelant.
 */
export const DOSSIER_SCHEMA = 1

/**
 * Le budget de mots CONSEILLÉ pour un bloc de canon (`canon.mj`, `canon.partage`).
 * Constante NOMMÉE, jamais un nombre en dur au site de validation (KR-165) : c'est
 * le budget de contexte du modèle qui en dépend. Le dépassement produit un
 * AVERTISSEMENT non bloquant, jamais une erreur.
 */
export const BUDGET_MOTS_CANON = 600

/**
 * Le budget de mots d'un `jalons[].enonce_texte`. Beaucoup plus serré que celui
 * du canon, et pour une raison mécanique : les énoncés des jalons atteints sont
 * injectés TOUS ENSEMBLE, et leur liste croît monotonement avec la durée de la
 * partie. Dépassement = avertissement, jamais un refus (KR-165).
 */
export const BUDGET_MOTS_JALON = 20

/**
 * Les bornes FERMÉES de l'échelle de confiance d'une porte de révélation. Le
 * schéma de session du plan de cible écrit déjà `confiance: -3..3` ; les poser
 * ici évite qu'un dossier importé demande une confiance que la session ne peut
 * pas atteindre. La mécanique de l'échelle elle-même reste à définir (n° 12).
 */
export const CONFIANCE_MIN = -3
export const CONFIANCE_MAX = 3

/**
 * Les bornes FERMÉES de l'échelle d'INTENSITÉ d'une relation : de l'hostilité
 * (`INTENSITE_MIN`) à l'attachement (`INTENSITE_MAX`), `0` étant le point NEUTRE —
 * ni l'un ni l'autre, et pas davantage une valeur manquante.
 *
 * DEUX CONSTANTES DISTINCTES DE `CONFIANCE_MIN`/`CONFIANCE_MAX` JUSTE AU-DESSUS,
 * bien que les quatre valeurs coïncident aujourd'hui, et c'est un arbitrage plutôt
 * qu'une redite : celles-là mesurent ce que le HÉROS a gagné d'un PNJ EN SESSION
 * (une valeur qui bouge de tour en tour, n° 12), celles-ci ce qu'un personnage
 * ÉPROUVE envers un autre — une donnée d'AUTEUR, écrite une fois dans le dossier.
 * Une seule paire pour les deux échelles, et elles dériveraient ensemble au premier
 * changement de l'une. Mêmes précédents que `CAMPS_PERSONNAGE` face à `CAMPS` et
 * que `PORTEES_CONTRE_MESURE` face à `PORTEES`.
 *
 * Hors borne = BLOQUANT à l'import, même motif que les caractéristiques : une
 * échelle ouverte rendrait indéfini le libellé dérivé que la n° 10 posera un jour
 * (« très hostile » pour un `-3`) autant que le seuil que le moteur y lira.
 *
 * AUCUNE SECTION DE `docs/REGLES-DU-JEU.md` NE LES PORTE, et c'est délibéré : ce
 * n'est pas encore une mécanique de jeu, aucun code ne lit ce nombre. Le jour où la
 * n° 12 écrit le seuil du plan de cible (« deux PNJ dans un même lieu et
 * `intensite >= 1` → le moteur transfère l'indice hors caméra »), la doc des règles
 * passe EN PREMIER (KR-130), puis la table dorée, puis le code — jamais l'inverse.
 */
export const INTENSITE_MIN = -3
export const INTENSITE_MAX = 3

/**
 * Le PLANCHER d'une caractéristique — l'autre borne de l'échelle, dont le plafond
 * est `CHARACTERISTIC_MAX` (`characteristics.ts`). Constante NOMMÉE, jamais un `1`
 * en dur au site de validation ni au site de saisie (KR-165).
 *
 * La règle vient de `docs/REGLES-DU-JEU.md` § 1, paragraphe « Échelle » (KR-130),
 * qui la pose pour cette itération : une caractéristique vaut un entier de 1 à 12,
 * et `1` n'est pas une valeur théorique — le bestiaire l'utilise (§ 4 : Rat géant
 * `FO 1`, Zombie `AG 1`). La génération du héros (2D4 + 1D4, plafond 10) est une
 * procédure de DÉPART, pas la borne de l'échelle.
 *
 * POURQUOI ICI, à côté de `CONFIANCE_MIN`, et non dans `characteristics.ts` auprès
 * de son plafond : ce fichier-là est sous score de mutation, et y toucher
 * déclencherait le run ET le cliquet `break` 80 → 85 (`docs/WORKFLOW.md`) qu'aucune
 * mesure ne paie aujourd'hui. LIMITE ASSUMÉE ET DATÉE : l'échelle vit donc à deux
 * endroits, et le MIN remonte auprès du MAX au prochain travail qui touche
 * légitimement `characteristics.ts` (n° 9).
 */
export const CARACTERISTIQUE_MIN = 1

/**
 * Le bloc de caractéristiques SEMÉ À L'ÉCRITURE quand l'auteur règle les
 * caractéristiques d'un personnage pour la première fois : les huit clés au
 * plancher, DÉRIVÉES du registre (KR-117) — jamais huit littéraux, qui
 * divergeraient du registre le jour où une neuvième caractéristique existerait.
 *
 * ⚠ VALEUR D'ÉCRITURE, JAMAIS UN REPLI DE LECTURE. `stats ?? STATS_INITIALES` est
 * INTERDIT partout : exporté depuis `brain/`, ce bloc est à un import du moteur du
 * Temps 2, où un repli de lecture ferait résoudre un jet contre une fiche
 * FABRIQUÉE — un personnage que l'auteur n'a jamais chiffré passerait pour un
 * personnage tout à 1, et le narrateur raconterait un échec que personne n'a écrit.
 * Un `stats` absent se LIT comme absent : c'est un état calme, et l'écran rend son
 * affordance de réglage plutôt qu'une grille inventée.
 */
export const STATS_INITIALES: Record<Characteristic, number> = Object.fromEntries(
	CHARACTERISTIC_VALUES.map((carac) => [carac, CARACTERISTIQUE_MIN]),
) as Record<Characteristic, number>

/**
 * Le PLANCHER d'une DURÉE du plan d'actions — la borne basse commune à
 * `plan_actions[].duree` et à `contre_mesures[].delai`, les deux seuls champs
 * ENTIERS du schéma 1 hors caractéristiques (`CHAMPS_ENTIERS`, `tables.ts`).
 * Constante NOMMÉE, jamais un `1` en dur au site de validation ni au `min` du
 * widget de saisie (KR-165).
 *
 * L'UNITÉ N'EST PAS DÉCIDÉE ICI, ET C'EST DÉLIBÉRÉ. Ce nombre compte des PAS
 * D'HORLOGE DE SESSION, dont la longueur appartient à la n° 9 `moteur-dossier`
 * (renvoi dans `docs/REGLES-PLAY.md`, § J). Le mot « tour » est RÉSERVÉ au round
 * de combat par `docs/REGLES-DU-JEU.md` et ne doit pas servir à nommer ce pas —
 * c'est pourquoi le libellé de saisie dit « DURÉE » nu.
 *
 * POURQUOI UNE BORNE BASSE ET AUCUNE BORNE HAUTE : `0` voudrait dire « échéance
 * déjà écoulée à l'instant où l'étape s'ouvre », c'est-à-dire une étape qui naît
 * bloquée — un état qu'aucun auteur n'écrit volontairement, et que le moteur
 * devrait arbitrer sans rien pour le faire. Une borne HAUTE, elle, trancherait la
 * durée d'une aventure : aucune règle ne le fait, et ce n'est pas au schéma de
 * commencer.
 */
export const DUREE_MIN = 1

/**
 * Toute entité nommée et référencée du dossier. `id` porte son espace de noms
 * (`pnj.aldur-le-sage`) et il est la SEULE façon de la référencer — jamais le nom.
 *
 * `nom` est OPTIONNEL : une entité en cours de rédaction peut ne pas encore en
 * porter, et c'est exactement ce que le repli « {Type} n°{index} (sans nom) » du
 * rapport d'anomalie rend lisible. Absent n'est pas vide : un `nom` omis est un
 * état informationnel calme, jamais une alerte.
 */
export interface Entite {
	id: string
	nom?: string
}

/**
 * La PORTÉE d'un personnage : premier plan (simulé en détail) ou second plan.
 * Le tableau est la source unique — l'union en est dérivée, et le validateur lit
 * le tableau plutôt que de re-lister les littéraux (KR-117).
 *
 * Ce champ tranche la collision de clé relevée en § 5 de la roadmap : `plan`
 * désignait à la fois cet énuméré et la liste d'étapes, qui est `plan_actions`.
 */
export const PORTEES = ['premier', 'second'] as const
export type Portee = (typeof PORTEES)[number]

/**
 * La portée POSÉE À LA CRÉATION d'un personnage par l'éditeur — le PLANCHER DU
 * SCHÉMA, jamais une intention d'auteur.
 *
 * `monde.personnages[].portee` est structurellement REQUISE (`LISTES_REQUISES` /
 * `ENUMERES_FERMES` depuis la n° 1) : un personnage créé nu, à la manière d'un
 * `Lieu`, serait refusé par le validateur à l'instant même de sa création. Il faut
 * donc écrire une valeur, et `'premier'` est celle qu'on écrit.
 *
 * CE QU'ELLE NE DIT PAS : que l'auteur a CHOISI le premier plan. Une portée encore
 * à `PORTEE_INITIALE` est un champ que personne n'a tranché — la n° 12
 * `moteur-acteurs` ne doit pas la lire comme une décision narrative délibérée de
 * simuler ce personnage en détail.
 *
 * Constante NOMMÉE, jamais `PORTEES[0]` : l'ordre du registre est un ordre
 * d'affichage, et le jour où il change, le plancher ne doit pas changer avec lui.
 */
export const PORTEE_INITIALE: Portee = 'premier'

/**
 * Le degré de CERTITUDE d'un savoir. OBLIGATOIRE, sans défaut implicite : un
 * `croit` est une information fausse ou incertaine, et sans ce champ une rumeur
 * entrerait au carnet d'indices comme un fait établi — le garde-fou « faits
 * établis » se mettrait alors à défendre une contradiction.
 */
export const CERTITUDES = ['sait', 'croit', 'soupconne'] as const
export type Certitude = (typeof CERTITUDES)[number]

/**
 * Le CAMP d'un objectif : À QUI cette victoire appartient. Le tableau est la
 * source unique — l'union en est dérivée, et le validateur lit le tableau plutôt
 * que de re-lister les littéraux (KR-117).
 *
 * OBLIGATOIRE, sans défaut implicite, pour la même raison que `certitude` : un
 * objectif sans camp n'appartient à personne, et le moteur qui conclut une partie
 * ne saurait pas de QUEL côté elle s'est jouée. « Un objectif par camp » reste
 * DESCRIPTIF : aucune règle n'exige de couvrir les trois, ni n'en interdit deux du
 * même camp.
 */
export const CAMPS = ['protagonistes', 'antagonistes', 'joueur'] as const
export type Camp = (typeof CAMPS)[number]

/**
 * Le CAMP d'un PERSONNAGE : de quel côté cet acteur joue.
 *
 * REGISTRE DISTINCT de `CAMPS` / `Camp` ci-dessus, qui est le camp d'un OBJECTIF,
 * et les deux ne fusionnent JAMAIS. Deux raisons, aucune cosmétique :
 *  · `CAMPS` porte `'joueur'`, qui n'est pas un camp de personnage — le joueur
 *    n'est pas une entrée de `monde.personnages[]`. Fondre les deux tables
 *    obligerait à offrir « joueur » dans le sélecteur d'une fiche de PNJ ;
 *  · `CAMPS` est au PLURIEL (« à qui appartient cette victoire »), celui-ci au
 *    SINGULIER (« ce personnage est un protagoniste »). Une table commune devrait
 *    coercer l'un des deux vocabulaires, donc en abîmer un.
 * Aucune valeur n'est commune aux deux listes, et c'est ce qui rend une fusion
 * accidentelle visible plutôt que silencieuse.
 *
 * OPTIONNEL sur `Personnage`, contrairement à `Objectif.camp` qui est requis
 * (KR-191) : `monde.personnages[]` existe depuis la n° 1 sans ce champ et
 * `schema: 1` n'a aucun chemin de migration (KR-160) — le rendre obligatoire
 * invaliderait RÉTROACTIVEMENT tout dossier déjà persisté ou déjà exporté. Un camp
 * absent est un état informationnel calme, jamais une alerte.
 */
export const CAMPS_PERSONNAGE = ['protagoniste', 'antagoniste'] as const
export type CampPersonnage = (typeof CAMPS_PERSONNAGE)[number]

/** Une étape du plan d'actions d'un personnage. */
export interface PlanAction {
	/** L'ordre de l'étape dans le plan. */
	etape: number
	/** L'intention du personnage à cette étape — ce que le rôle acteur joue. */
	action: string
	/** AUTEUR — ce qui fait passer le personnage à cette étape, en français. À ne
	 *  pas confondre avec `action`, qui est la seule clé IA de la famille.
	 *  Exemple : declencheur_texte: 'Le joueur mentionne le sceau brisé devant lui.' */
	declencheur_texte?: string
	/** MOTEUR — l'avancement d'étape est du code (n° 14), jamais une intention.
	 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'indice_connu', cibles: ['indice.sceau-brise'] } */
	declencheur_expr?: ExprNode
	/** MOTEUR — le nombre de PAS D'HORLOGE DE SESSION avant l'échéance de cette
	 *  étape. Un ENTIER ≥ `DUREE_MIN`, jamais de la prose : un moteur ne compte pas
	 *  sur du texte libre, et `delai` était déjà promis `moteur` par KR-196.
	 *
	 *  L'UNITÉ DU PAS N'EST PAS DÉCIDÉE ICI — elle appartient à la n° 9
	 *  `moteur-dossier` (voir `DUREE_MIN` et `docs/REGLES-PLAY.md` § J). Le mot
	 *  « tour » reste RÉSERVÉ au round de combat par `docs/REGLES-DU-JEU.md`.
	 *
	 *  C'est le SEUL champ qui rend `si_bloque` atteignable : sans lui, rien ne
	 *  permet au moteur de CONSTATER qu'une étape est bloquée — d'où l'avertissement
	 *  non bloquant que `validateDossier` émet sur un `si_bloque` orphelin. */
	duree?: number
	/** IA — la DIDASCALIE de sortie : ce que le personnage joue quand le moteur a
	 *  déclaré l'étape bloquée (durée écoulée sans que le déclencheur suivant soit
	 *  survenu). Injectée SEULEMENT dans ce cas, jamais avec le reste de l'étape :
	 *  livrée d'avance, elle apprendrait au narrateur la porte de sortie avant que le
	 *  joueur n'ait rien bloqué.
	 *
	 *  PAS DE JUMEAU `…_expr` ET AUCUNE LIGNE DANS `FAMILLES_DE_CONDITIONS` : ce
	 *  n'est pas une condition mais une réplique de repli — même statut que
	 *  `caractere.cede_si`. L'IA ne compte pas les pas d'horloge et ne décide pas
	 *  qu'une étape est bloquée : le moteur constate, l'IA joue.
	 *  Exemple : « Il change d'approche : au lieu du sanctuaire, il tente sa chance
	 *  auprès du forgeron. » */
	si_bloque?: string
}

/**
 * Le BUT PROPRE d'un personnage — ce qu'il veut, pourquoi, et pour quand.
 *
 * LA CLÉ EST `but`, JAMAIS `objectif` (KR-198), et la divergence entre le concept
 * français (« objectif ») et la clé de schéma est DÉLIBÉRÉE, pas une faute à
 * réparer : `Personnage.objectif_id` est une RÉFÉRENCE vers `canon.objectifs[]`,
 * destination `moteur` ; ceci est la PROSE du personnage, destination `ia`. Deux
 * clés `objectif*` voisines sur le même objet auraient rejoué la collision
 * `plan` / `plan_actions` que l'en-tête de ce fichier compte parmi ses corrections
 * IRRÉVERSIBLES — et le piège serait de COMPRÉHENSION, pas de mécanique : rien ne
 * rougirait, et la n° 10 enverrait un jour un champ moteur dans un contexte de
 * modèle parce qu'un lecteur aurait supposé que les deux `objectif*` vont ensemble.
 *
 * OPTIONNEL EN BLOC, `libelle` REQUIS QUAND LE BLOC EST LÀ — même contrat que
 * `stats`, et par le même mécanisme : `sitesDe` ne produit aucun site sous un bloc
 * absent, donc un personnage sans `but` est un état calme (« absent ≠ vide »,
 * KR-191), tandis qu'un `but: {}` ou un `but: { pourquoi }` sans `libelle` est une
 * anomalie bloquante. Un but qui ne dit pas ce qu'il veut n'est pas un but.
 */
export interface But {
	/** IA — ce que le personnage veut, en prose de jeu d'acteur. Jamais lu tel quel
	 *  par le joueur : c'est une consigne d'incarnation, pas une réplique.
	 *  Exemple : « Retrouver le sceau brisé et le remettre en place avant que la
	 *  brume ne revienne. » */
	libelle: string
	/** IA — la motivation, quand elle mérite d'être dite. À ne pas confondre avec
	 *  `libelle` : celui-ci dit CE QU'IL VEUT, celle-là POURQUOI il le veut.
	 *  Exemple : « Il porte la faute d'avoir laissé le sceau se briser, cinquante
	 *  ans plus tôt. » */
	pourquoi?: string
	/** AUTEUR — pour quand, en français. `auteur` et NON `ia`, contre la cohérence
	 *  de voisinage avec ses deux sœurs : une échéance en prose reste une DONNÉE
	 *  D'HORLOGE, et le précédent direct du dépôt est celui des `…_texte`
	 *  (`evenements[].declencheur_texte`, `jalons[].declencheur_texte`, tous deux
	 *  `auteur`) — le narrateur ne doit pas provoquer ni improviser ce que le moteur
	 *  n'a pas constaté. Se desserre vers `ia` sans coût le jour où la n° 10 livre un
	 *  libellé d'écoulement DÉRIVÉ PAR LE CODE, et sa propre ligne d'audience.
	 *  Exemple : « Avant la pleine lune prochaine. » */
	echeance?: string
}

/**
 * CE QU'UNE CONTRE-MESURE ATTEINT — un personnage, un groupe, ou un lieu.
 *
 * REGISTRE DISTINCT de `PORTEES` / `Portee` ci-dessus, qui est la profondeur de
 * SIMULATION d'un personnage (premier / second plan), et les deux ne fusionnent
 * jamais : aucune valeur ne leur est commune, et une table partagée devrait
 * coercer l'un des deux vocabulaires. Seule la CLÉ de schéma est homonyme
 * (`contre_mesures[].portee`), et elle ne change pas — c'est un désaccord de TYPE,
 * pas de destination (KR-196, non redébattue). Même précédent que
 * `CAMPS_PERSONNAGE` / `CampPersonnage` face à `CAMPS` / `Camp`.
 *
 * ⚠ VALEURS POSÉES PAR LE LOT CONTRAT D'IT4, PAS PAR UN RÔLE DU COMITÉ — angle
 * mort assumé du raffinage, tracé en `open_questions`. Le champ est `moteur`, il
 * n'est rendu à l'auteur par AUCUN écran de cette itération, et il n'a aucun
 * consommateur avant le Temps 2 : rien n'est irréversible ici, et cette liste se
 * révise sans coût le jour où la n° 12 dira ce qu'elle sait armer. Aucune section
 * de `docs/REGLES-PLAY.md` ne la fixe (§ D7 nomme les GROUPES, § A les LIEUX,
 * rien ne nomme la portée d'une riposte) — les trois valeurs reprennent donc le
 * vocabulaire du dossier lui-même.
 *
 * Elle dit CE QUE la contre-mesure atteint, jamais LEQUEL : une cible désignée
 * serait une RÉFÉRENCE, donc un champ `…_id` résolu par `REFERENCES_SIMPLES`, pas
 * un énuméré.
 */
export const PORTEES_CONTRE_MESURE = ['personnage', 'groupe', 'lieu'] as const
export type PorteeContreMesure = (typeof PORTEES_CONTRE_MESURE)[number]

/**
 * Une CONTRE-MESURE : ce qu'un personnage a d'armé en réaction à ce que le joueur
 * déclenche. SIXIÈME famille de conditions D1 (septième couple), et la seule que
 * le schéma 1 n'avait pas — elle vit SOUS `personnages[]`, donc elle arrive avec
 * la fiche de personnage plutôt qu'avec le format.
 *
 * ELLE N'EST PAS RÉSERVÉE AUX ANTAGONISTES PAR LE SCHÉMA : le `camp` ne garde que
 * l'ÉDITEUR (la section ne se rend que pour un antagoniste, KR-196), le validateur
 * n'en sait rien et n'a pas à en savoir. Rendre la liste dépendante de `camp`
 * ferait d'un changement de camp une invalidation rétroactive de document, ce que
 * `schema: 1` sans chemin de migration interdit (KR-160/KR-191).
 *
 * SON `declencheur_texte` AVERTIT SANS SON JUMEAU `…_expr`, là où celui d'une
 * étape de plan reste CALME (`alerteSansExpr`, `FAMILLES_DE_CONDITIONS`) : une
 * étape peut légitimement rester avancée à la main par le narrateur, une riposte
 * armée que rien ne déclenche ne se déclenchera jamais.
 */
export interface ContreMesure {
	/** IA — l'intention jouée quand la contre-mesure est armée. SEULE clé `ia` de
	 *  la famille, même raison que `plan_actions[].action`. Jamais lue telle quelle
	 *  par le joueur. */
	action: string
	/** AUTEUR — la condition qui arme cette contre-mesure, en français. Injectée,
	 *  elle apprendrait au narrateur à PROVOQUER la riposte au lieu de la laisser
	 *  survenir : exactement la frontière que D1 trace.
	 *  Exemple : declencheur_texte: 'Le joueur a parlé du sceau à quelqu'un d'autre.' */
	declencheur_texte?: string
	/** MOTEUR — jumeau structuré du précédent, seule autorité sur l'armement.
	 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'indice_connu', cibles: ['indice.sceau-brise'] } */
	declencheur_expr?: ExprNode
	/** MOTEUR — le nombre de PAS D'HORLOGE entre l'armement et la riposte. Même
	 *  contrat que `plan_actions[].duree` : un ENTIER ≥ `DUREE_MIN`, jamais de la
	 *  prose, et l'unité du pas appartient à la n° 9. */
	delai?: number
	/** MOTEUR — ce que la riposte atteint. Voir `PORTEES_CONTRE_MESURE` : valeurs
	 *  posées par le lot contrat, révisables tant qu'aucun consommateur n'existe. */
	portee?: PorteeContreMesure
}

/**
 * La condition de révélation d'un savoir — QUATRE portes fermées, jamais un
 * prédicat booléen. Un jet n'ÉVALUE pas, il ÉMET une demande qui change le tour :
 * aplati en prédicat, il forcerait l'évaluateur à lancer le dé et le moteur
 * perdrait le routage vers le protocole à deux appels de la n° 11.
 *
 * Une porte absente n'est pas une porte fermée : c'est une porte non posée. Un
 * savoir sans AUCUNE des quatre portes ne se révèle jamais de lui-même — le
 * validateur en avertit sans bloquer.
 */
export interface Revelation {
	/** Confiance minimale exigée, dans `[CONFIANCE_MIN, CONFIANCE_MAX]`. */
	confiance_min?: number
	/**
	 * Un challenge ORDINAIRE (`resolveChallenge`), pas un sous-système social : le
	 * `carac` est celui du HÉROS. Le modèle ne voit jamais `carac`/`tc` bruts — il
	 * reçoit un libellé dérivé des registres.
	 */
	jet?: { carac: Characteristic; tc: ChallengeTier }
	/**
	 * Un prix STRUCTURÉ, jamais de la prose : le moteur ne peut pas constater qu'un
	 * serment a été tenu. Une contrepartie en prose libre n'est pas une porte mais
	 * une intention — elle va dans `revele_comment`.
	 */
	contrepartie?: { objet_id: string; consomme: boolean }
	/** L'indice qui doit avoir été obtenu avant que ce savoir puisse se révéler. */
	apres_indice_id?: string
}

/** Ce qu'un personnage sait d'un indice, et à quelle condition il le dit. */
export interface Savoir {
	/** Référence vers `monde.indices[].id`. */
	indice_id: string
	certitude: Certitude
	/** La MANIÈRE dont le savoir se révèle — didascalie pour l'IA, injectée
	 *  UNIQUEMENT quand la porte est ouverte. Jamais un dialogue verbatim.
	 *  Exemple : « Elle hésite, puis chuchote, jetant un regard vers la porte. » */
	revele_comment?: string
	revele_si?: Revelation
}

/**
 * CE QU'UN PERSONNAGE ÉPROUVE ENVERS UN AUTRE — un fait du PORTEUR, jamais de la
 * PAIRE, et c'est la décision qui commande tout le reste de ce type. Si l'auteur
 * veut que la cible connaisse le lien, il écrit la relation symétrique sur la fiche
 * de la cible : dériver la réciproque ferait inventer par le code un fait que
 * personne n'a écrit, et rendrait l'audience d'une ligne dépendante d'un GRAPHE
 * plutôt que de son porteur.
 *
 * DEUX CHAMPS INJECTABLES SUR QUATRE, et le partage n'est pas cosmétique : `lien`
 * est la prose que le rôle acteur JOUE (`ia`), `cible_id` un handle que le code
 * résout, `intensite` et `secret` des données de moteur pur. C'est ce qui réduit le
 * gating de `secret` à UNE paire injectable — donc à un point de contrôle unique le
 * jour où l'assembleur n° 10 existera.
 */
export interface Relation {
	/**
	 * Référence vers `monde.personnages[].id`. MOTEUR : un identifiant est un
	 * HANDLE, résolu par le code, jamais injecté tel quel — même règle que
	 * `objectif_id` et `charpente.depart.lieu_id`. Une référence orpheline est
	 * EXPOSÉE par `validateDossier`, jamais filtrée au rendu (KR-021).
	 *
	 * CE QU'IL RÉSOUT N'EST PAS ENCORE INJECTABLE, et c'est écrit ici pour que la
	 * n° 10 trouve les deux moitiés du problème au même endroit : le `nom` de la
	 * cible est destination `auteur` (KR-195, question transverse aux collections
	 * nommées, NON rouverte par cette feature). Une ligne de relation injectée
	 * aujourd'hui donnerait donc « son créancier » SANS DIRE DE QUI — la moitié
	 * de l'information. La moitié manquante est l'`open_question` « appellation
	 * re-projetée par le CODE à l'assemblage, jamais une seconde clé au schéma »
	 * (`specification.json`, n° 10 propriétaire) : la réponse est une projection
	 * de l'assembleur, PAS une bascule de `nom` vers `ia`, PAS un champ
	 * `appellation` de plus sur ce type.
	 *
	 * L'AUTO-RÉFÉRENCE EST LÉGALE (KR-194) : `cible_id === personnage.id` ne porte
	 * ni garde ni filtre — c'est une didascalie de conflit intérieur, jouable
	 * telle quelle. La n° 10 la rendra « envers lui-même » plutôt qu'en répétant
	 * le nom ; ce n'est pas une question de schéma.
	 */
	cible_id: string
	/**
	 * IA — la NATURE du lien, en français (« son frère », « son créancier »), en
	 * prose de jeu d'acteur : c'est ce que le rôle acteur JOUE, même famille que
	 * `plan_actions[].action`, et jamais une réplique lue telle quelle par le
	 * joueur. C'est aussi ce qui REMPLACE le chiffre côté prose, et la raison pour
	 * laquelle `intensite` peut rester `moteur` sans appauvrir la scène.
	 * Exemple : « Elle lui doit la vie depuis l'incendie du beffroi, et ne l'a
	 * jamais dit à personne. »
	 */
	lien: string
	/**
	 * MOTEUR — l'INTENSITÉ du lien, entier signé de `INTENSITE_MIN` (hostilité) à
	 * `INTENSITE_MAX` (attachement), `0` étant neutre. Même arbitrage que les huit
	 * caractéristiques et que les six curseurs à venir (KR-193, `open_question`
	 * « libellés dérivés ») : un NOMBRE qui code un fait de jeu, et dont le seul
	 * consommateur écrit en fera un SEUIL. Un modèle qui lit `-2` connaît l'exacte
	 * profondeur d'une inimitié que la scène n'a pas montrée — il la jouerait au
	 * premier tour, avant que le joueur ait rien observé.
	 *
	 * AUCUNE PARAPHRASE non plus (« très hostile ») tant que la n° 10 n'a pas livré
	 * un libellé dérivé PAR LE CODE et sa propre ligne d'audience.
	 */
	intensite: number
	/**
	 * MOTEUR — le DRAPEAU DE SECRET. Il ne se contente pas de rester hors contexte :
	 * il COMMANDE l'injection de SA PROPRE LIGNE, et c'est le premier champ du
	 * schéma dont l'injection dépend de QUI DEMANDE (`plan_actions[].si_bloque` se
	 * conditionnait à un fait de SESSION ; celui-ci à l'identité du RÔLE).
	 *
	 * LE PRÉDICAT, écrit ICI et au commentaire de sa ligne de `destinations.ts`,
	 * nulle part ailleurs :
	 *
	 * Une ligne de `relations[]` n'entre **que** dans le contexte de l'appel **acteur du
	 * personnage QUI LA PORTE**. Si `secret !== true`, elle entre **en plus** dans le
	 * contexte du **narrateur**, pour une scène où le porteur est présent. Elle n'entre
	 * **jamais** dans le contexte d'un **autre** personnage, ni dans celui de la
	 * **cible**, ni dans celui de l'arbitre.
	 *
	 * Ce que cela règle et qu'une tautologie (« une relation secrète n'entre pas
	 * dans le contexte d'un rôle qui ne doit pas la connaître ») ne réglait pas :
	 * la ligne exclue est la ligne ENTIÈRE (`lien` + l'appellation dérivée de
	 * `cible_id`) ; le NARRATEUR est exclu au même titre qu'un autre PNJ, motif déjà
	 * écrit pour `camp` ; `secret: false` n'est PAS « public », il élargit d'UN rôle
	 * et d'un seul ; et un champ absent se traite comme `false`.
	 *
	 * La table dit l'AUDIENCE, le MOMENT est la charge de l'assembleur n° 10 — même
	 * dispositif que `si_bloque`, et ZÉRO mécanisme de code en itération 5 : aucun
	 * assembleur n'existe encore à exercer.
	 */
	secret?: boolean
}

/**
 * OÙ L'ON TROUVE CE PERSONNAGE, et à quel moment.
 *
 * Une liste plutôt qu'un champ : un PNJ tient boutique le jour et rentre chez lui
 * la nuit, et deux lieux ne se hiérarchisent pas. Le MOMENT COURANT vient de la
 * SESSION, jamais de la fiche — c'est ce qui sépare les deux champs de ce type par
 * leur audience, `lieu_id` étant le seul que le moteur puisse constater.
 */
export interface Presence {
	/** Référence vers `monde.lieux[].id`. MOTEUR : un identifiant est un HANDLE,
	 *  résolu par le code, jamais injecté tel quel — même règle que
	 *  `charpente.depart.lieu_id`. Une référence orpheline est EXPOSÉE par
	 *  `validateDossier`, jamais filtrée au rendu (KR-021). */
	lieu_id: string
	/** AUTEUR — quand on l'y trouve, en français. `auteur` et NON `ia`, MÊME
	 *  ARBITRAGE que `but.echeance` et A FORTIORI : une échéance anticipée fait
	 *  tomber une horloge en avance ; une DISPONIBILITÉ lue par le narrateur le fait
	 *  CONTREDIRE la scène que le moteur vient d'assembler — « il n'est là que la
	 *  nuit » narré alors que le moteur a placé le PNJ ici à midi, c'est le modèle
	 *  qui décide d'une présence, donc d'un état. `lieu_id` et l'état de session
	 *  décident déjà des PNJ présents, et la couleur du moment est déjà `ia`
	 *  ailleurs (`monde.lieux[].ambiance`) : rien n'est perdu.
	 *  Exemple : « Au crépuscule, avant que le marché ne ferme. » */
	quand?: string
}

/**
 * Un acteur du monde : sa portée, son plan, ce qu'il sait — et, depuis
 * l'itération 1 de la n° 4, où il se situe dans l'histoire (son camp et
 * l'objectif auquel il se rattache), depuis l'itération 2 QUI IL EST (ses trois
 * proses d'identité).
 *
 * Les deux champs de situation sont OPTIONNELS et posés À PLAT, au même niveau
 * que `portee` : aucun sous-objet `rattachement`, et aucune union discriminée
 * `objectif_id | quete_id` — `monde.quetes[]` n'a pas de forme complète avant la
 * n° 6, et une référence CONDITIONNELLE serait une première dans le schéma. Les
 * trois proses d'identité suivent la même règle : À PLAT, aucun sous-objet
 * `fiche{}` — un porteur intermédiaire ferait de chaque champ un chemin de
 * destination à deux étages sans qu'aucune règle ne s'y attache.
 *
 * LES TROIS PROSES SE DISCRIMINENT L'UNE L'AUTRE, et c'est écrit sur chacune :
 * deux proses `ia` sans discriminant sont deux vérités concurrentes dans le même
 * contexte de modèle. `fonction` dit ce que le personnage EST, `apparence` ce que
 * le narrateur DÉCRIT quand il entre en scène, `description_joueur` ce que le
 * joueur en SAIT déjà sans avoir enquêté.
 */
export interface Personnage extends Entite {
	portee: Portee
	plan_actions: PlanAction[]
	savoirs: Savoir[]
	/** MOTEUR — de quel côté ce personnage joue. Injecté, il apprendrait au
	 *  narrateur que ce PNJ lui est hostile : c'est un spoiler, pas du décor.
	 *  OPTIONNEL par contrat (KR-191) — absent ≠ vide. */
	camp?: CampPersonnage
	/** Référence vers `canon.objectifs[].id` — l'objectif auquel ce personnage se
	 *  rattache. MOTEUR : un identifiant est un HANDLE, jamais injecté tel quel.
	 *  Une référence orpheline est EXPOSÉE, jamais silencieuse (KR-021).
	 *
	 *  CE N'EST PAS l'identifiant du but propre du personnage (KR-198) : ce
	 *  dernier arrive à l'itération 4 sous la clé `but`, PAS `objectif`, et il est
	 *  destination `ia` là où celui-ci est `moteur`. Deux clés `objectif*`
	 *  voisines auraient rejoué la collision `plan` / `plan_actions` que
	 *  l'en-tête de ce fichier compte parmi ses corrections irréversibles. */
	objectif_id?: string
	/** IA — ce que le personnage EST dans le monde : son métier, son rang, la
	 *  charge qu'il occupe. C'est le champ de l'ÉTAT SOCIAL, jamais du physique :
	 *  ce qu'on voit de lui va dans `apparence`, ce qui se dit de lui dans
	 *  `description_joueur`. OPTIONNEL — absent ≠ vide : une fiche en cours de
	 *  rédaction est un état calme, jamais une alerte.
	 *  Exemple : « Ermite retiré du monde, gardien de la mémoire de Val-Cendre. » */
	fonction?: string
	/** IA — ce que le narrateur décrit quand le personnage ENTRE EN SCÈNE :
	 *  physique, voix, signes distinctifs. Elle DÉCRIT, elle ne chiffre pas — la
	 *  force ou l'agilité d'un personnage se règlent aux caractéristiques, jamais
	 *  dans cette prose. À ne pas confondre avec `description_joueur` : celle-ci
	 *  est ce que le joueur SAIT avant de le rencontrer, celle-là ce qu'il
	 *  DÉCOUVRE en le voyant. OPTIONNEL — absent ≠ vide.
	 *  Exemple : « Un vieil homme voûté à la barbe blanche tressée de perles
	 *  d'os, les mains tachées d'encre et de cendre. » */
	apparence?: string
	/** IA — ce que le joueur peut savoir du personnage SANS ENQUÊTE : sa
	 *  réputation publique, ce qui se dit de lui. Ce n'est ni sa charge
	 *  (`fonction`), ni ce qu'on voit de lui (`apparence`).
	 *
	 *  Le suffixe `_joueur` nomme son AUDIENCE, jamais son RÉGIME : elle est
	 *  INJECTÉE au modèle comme les deux autres, jamais émise mot pour mot. La
	 *  seule prose du dossier émise verbatim reste
	 *  `charpente.depart.texte_ouverture_joueur`, et c'est pour cela qu'elle est
	 *  `moteur` là où celle-ci est `ia`. OPTIONNEL — absent ≠ vide.
	 *  Exemple : « On le dit sage, et un peu fou ; tout le bourg sait où il vit,
	 *  personne ne sait ce qu'il garde. » */
	description_joueur?: string
	/** MOTEUR — les HUIT caractéristiques du personnage, chacune un entier de
	 *  `CARACTERISTIQUE_MIN` à `CHARACTERISTIC_MAX` (`docs/REGLES-DU-JEU.md` § 1,
	 *  paragraphe « Échelle », KR-130).
	 *
	 *  OPTIONNEL EN BLOC, TOTAL QUAND PRÉSENT — et c'est le point de contrat, pas un
	 *  détail de typage. `Partial` aurait créé un état où le moteur ne peut PAS
	 *  résoudre un jet (refuser ? prendre un défaut ? laisser le modèle improviser ?)
	 *  et il aurait fallu une garde à CHAQUE site moteur ; le bloc total rend l'état
	 *  binaire et vérifiable en UN point — ici, et dans `ENUMERES_FERMES`, où les
	 *  huit lignes sont `requis: true`. Un bloc à 1-7 clés est une anomalie
	 *  BLOQUANTE à l'import. L'asymétrie du regret confirme le sens : sur un
	 *  `schema: 1` sans migration (KR-160), desserrer TOTAL → Partial est gratuit,
	 *  resserrer Partial → TOTAL est impossible.
	 *
	 *  Le bloc ABSENT reste un état calme (« absent ≠ vide ») : il n'invalide aucun
	 *  dossier déjà persisté, exactement comme `camp` (KR-191). Il ne se remplace
	 *  JAMAIS par `STATS_INITIALES` à la lecture — voir la docstring de cette
	 *  constante.
	 *
	 *  NI `pv` NI `tier` ici (KR-192) : le PV est DÉRIVÉ à l'affichage par
	 *  `maxPV({ FO, AG, EN })`, jamais stocké — le stocker dupliquerait une règle de
	 *  jeu en deux endroits, et la copie se périmerait au premier réglage. `tier`
	 *  n'a aucun consommateur avant la n° 13.
	 *
	 *  MOTEUR ET NON `ia`, et la question s'est réellement posée : le chiffre est un
	 *  SEUIL (§ 2 : réussite = dés ≤ carac). Un modèle qui lit `FO: 9` connaît la
	 *  marge avant que `challenge.ts` n'ait résolu — il narrerait « tu forces la
	 *  porte sans effort » pendant que le moteur tire un échec. Ce qui remplace le
	 *  chiffre côté prose existe déjà et est écrit par l'auteur : `apparence` et
	 *  `fonction`, dont le JSDoc dit qu'elles DÉCRIVENT sans chiffrer. */
	stats?: Record<Characteristic, number>
	/** Le BUT PROPRE du personnage — voir `But`. OPTIONNEL EN BLOC, `libelle`
	 *  requis quand le bloc est là. Clé `but`, JAMAIS `objectif` (KR-198) : la
	 *  clé voisine `objectif_id` est une RÉFÉRENCE `moteur` vers le canon, celle-ci
	 *  est la prose `ia` du personnage. */
	but?: But
	/** Ce que ce personnage a d'ARMÉ en réaction au joueur — voir `ContreMesure`.
	 *  OPTIONNEL, et jamais gardée par `camp` AU SCHÉMA : le camp ne garde que
	 *  l'éditeur (KR-196). Liste STRUCTURÉE, contrôlée élément par élément
	 *  (`LISTES_OPTIONNELLES_STRUCTUREES`) — une chaîne rangée là serait un acteur
	 *  qui perd sa riposte en silence, c'est le trou résiduel de BUG-050. */
	contre_mesures?: ContreMesure[]
	/** QUI CE PERSONNAGE CONNAÎT — voir `Relation`. OPTIONNELLE, sur une collection
	 *  qui existe depuis la n° 1 : un dossier déjà persisté n'en porte aucune, et
	 *  cela doit rester silencieux (KR-160/KR-191). Liste STRUCTURÉE, contrôlée
	 *  élément par élément (`LISTES_OPTIONNELLES_STRUCTUREES`), comme
	 *  `contre_mesures`. */
	relations?: Relation[]
	/** OÙ ON LE TROUVE — voir `Presence`. Mêmes contrat et motifs que `relations`
	 *  ci-dessus : optionnelle, structurée, contrôlée élément par élément. */
	presence?: Presence[]
}

/**
 * Un LIEU du monde — le décor où la partie se joue.
 *
 * Les TROIS champs sont OPTIONNELS et de la prose LIBRE : un lieu en cours de
 * rédaction (celui que tout dossier neuf porte, `lieu.amorce`) n'en porte aucun,
 * et leur absence est un état calme, jamais une alerte — même doctrine
 * « absent ≠ vide » que le `nom` d'`Entite`.
 *
 * Leur audience est `ia` (`destinations.ts`), et c'est ce qui les sépare du
 * `nom`, qui est `auteur` : un piège tendu près d'un autel ou l'odeur d'une
 * grotte sont de la DONNÉE DE JEU que le narrateur du Temps 2 devra lire pour
 * raconter le lieu, pas des notes de rédaction. Injectés, jamais émis verbatim :
 * le joueur ne lit aucun des trois tel quel — c'est `texte_ouverture_joueur` qui
 * porte la seule prose émise mot pour mot.
 *
 * `acces` et toute référence croisée (personnages, objets, indices, événements
 * présents) appartiennent aux features qui possèdent ces collections (n° 4/5/6)
 * — décision A du 2026-08-04, aucune forme anticipée ici.
 */
export interface Lieu extends Entite {
	/** IA — ce qu'est le lieu, ce qu'on y voit, où il se situe.
	 *  Exemple : « Une grotte basse aux parois calcaires, à une heure de marche au
	 *  nord de Val-Cendre ; l'entrée est dissimulée par un rideau de lierre. » */
	description?: string
	/** IA — le registre sensoriel du lieu : ce qui s'y entend, s'y sent, s'y pressent.
	 *  Exemple : « Air humide, écho des gouttes, une odeur de cendre froide. » */
	ambiance?: string
	/** IA — ce qui y menace le héros. De la PROSE, jamais une règle : un piège
	 *  formalisé est un `evenement` avec son `declencheur_expr`, et un monstre se
	 *  résout par `monstre_ref`. Ce champ dit ce que le narrateur doit savoir du
	 *  risque, il ne le déclenche pas.
	 *  Exemple : « Un piège à lanière tendu près de l'autel ; les échos attirent
	 *  parfois un loup des cendres. » */
	dangers?: string
}

/** Une issue possible d'un événement, et ce qu'elle change. */
export interface Resolution {
	/** L'issue, en français — ce que le narrateur joue quand elle survient. */
	resultat: string
	consequence: Delta[]
}

/** Un événement du monde, éventuellement adossé à une créature du bestiaire. */
export interface Evenement extends Entite {
	/**
	 * `bestiaire.<templateId>` — SECOND espace de noms, résolu contre `BESTIARY`
	 * et non contre une collection du dossier. Une référence pendante est
	 * BLOQUANTE à l'import : sinon un combat s'ouvre sans monstre.
	 */
	monstre_ref?: string
	/** DEUX optionnels, PAIRÉS — un événement peut rester déclenché par la seule main
	 *  du narrateur, sans condition formalisée : c'est calme, jamais une alerte.
	 *  Exemple : declencheur_texte: 'Le joueur revient à Val-Cendre après la tempête.' */
	declencheur_texte?: string
	/** MOTEUR — jamais injecté : un narrateur qui connaît le déclencheur PROVOQUE
	 *  l'embuscade au lieu de la laisser survenir.
	 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.val-cendre'] } */
	declencheur_expr?: ExprNode
	resolutions: Resolution[]
}

/** Une quête, et ce qu'elle rapporte. */
export interface Quete extends Entite {
	recompense: Delta[]
}

/** Un climat : une condition ambiante qui modifie les règles. */
export interface Climat extends Entite {
	effets_regles: Delta[]
}

/**
 * § 09 climat & conditions. `climat` est la première — et pour l'instant la
 * seule — famille de conditions.
 *
 * Le validateur n'en EXIGE pas la présence : imposer à tout dossier de déclarer
 * une liste de climats serait une décision de produit que personne n'a prise, et
 * la forme complète de `conditions` appartient à la n° 6 (décision A), qui
 * tranchera. Ses entrées, elles, sont contrôlées dès qu'il y en a une.
 */
export interface Conditions {
	climat: Climat[]
}

/**
 * Un objectif de l'aventure. `reussi_si_expr` / `echoue_si_expr` sont MOTEUR —
 * jamais injectés. `reussi_si_texte` / `echoue_si_texte` sont AUTEUR : la même
 * règle en français, pour que l'auteur qui relit le JSON sache ce qu'il déclenche.
 *
 * Les quatre sont OPTIONNELS et il n'existe AUCUNE règle de symétrie
 * `…_expr` ⇒ `…_texte` : un `…_texte` sans son `…_expr` avertit (D1), l'inverse
 * est un trou de documentation d'auteur, affaire du linter n° 7.
 *
 * `camp`, lui, est REQUIS — la seule clé non optionnelle de la fiche après `id`.
 *
 * Exemple : reussi_si_expr: { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-nuit'] }
 * Exemple : reussi_si_texte: 'Le héros a atteint le fond du Gouffre scellé.'
 */
export interface Objectif extends Entite {
	/** À qui appartient cette victoire. MOTEUR : jamais injecté au modèle — un
	 *  narrateur qui sait quel camp doit l'emporter y conduit. */
	camp: Camp
	reussi_si_texte?: string
	reussi_si_expr?: ExprNode
	echoue_si_texte?: string
	echoue_si_expr?: ExprNode
}

/** Ce qui est vrai de l'histoire, et les consignes de registre injectées au modèle. */
export interface Canon {
	mj: CanonMj
	partage: CanonPartage
	/** Le registre de langue de l'aventure — module le ton, jamais la personne ni le temps. */
	ton: string
	/**
	 * Les interdits de TON (contenu, anachronismes, registre) — une consigne
	 * INJECTÉE au modèle. À ne pas confondre avec le garde-fou « aucune création
	 * d'entité », qui est une VALIDATION par résolution d'identifiant (n° 10).
	 */
	interdits_ton: string[]
	objectifs: Objectif[]
}

/** Le bloc du canon réservé au MJ — la vérité, y compris ce que le joueur ignore. */
export interface CanonMj {
	synopsis_mj: string
}

/** Le bloc du canon partagé — ce que le joueur peut lire ou entendre. */
export interface CanonPartage {
	accroche_joueur: string
}

/** Les acteurs et le décor — la couche que le modèle lit pour raconter. */
export interface Monde {
	personnages: Personnage[]
	lieux: Lieu[]
	objets: Entite[]
	indices: Entite[]
	quetes: Quete[]
	evenements: Evenement[]
	conditions: Conditions
}

/** Le point d'entrée de l'aventure : où l'on commence, et le texte qui ouvre la partie. */
export interface Depart {
	/** Référence vers `monde.lieux[].id`. Une référence pendante est BLOQUANTE. */
	lieu_id: string
	texte_ouverture_joueur: string
}

/** Un jalon : un fait de l'histoire que le moteur coche quand il est accompli. */
export interface Jalon extends Entite {
	/** IA — énoncé à l'ACCOMPLI du fait établi, ≤ BUDGET_MOTS_JALON, injecté
	 *  seulement si le jalon est atteint. Jamais la même phrase que
	 *  declencheur_texte : celui-ci décrit la CONDITION, celui-là le FAIT.
	 *  Exemple : « Le sceau est brisé ; l'Archiviste le sait. » */
	enonce_texte: string
	/** AUTEUR — ce qui déclenche ce jalon. Jamais injectée au modèle (dupliquerait
	 *  declencheur_expr en prose). La n° 7 la lit pour son linter.
	 *  Exemple : « Le joueur porte le sceau brisé devant l'Archiviste. » */
	declencheur_texte: string
	/** MOTEUR — jumeau structuré de `declencheur_texte`, OPTIONNEL là où celui-ci
	 *  est requis : un jalon peut rester coché à la main par le moteur d'un
	 *  événement. Absent, la condition n'est jamais vérifiée automatiquement, et
	 *  c'est calme — un jalon n'est pas une fin.
	 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.val-cendre'] } */
	declencheur_expr?: ExprNode
	effet: Delta[]
}

/** Une fin possible de l'aventure. */
export interface Fin extends Entite {
	/** AUTEUR — condition de fin en langage naturel. Jamais injectée (un narrateur
	 *  qui la connaît y conduit).
	 *  Exemple : « Le héros a vaincu le Gardien ET porte la Clé d'Aldûr. » */
	condition_texte: string
	/** MOTEUR — jumeau structuré de `condition_texte`. Jamais injecté : un narrateur
	 *  qui connaît la condition de fin y conduit.
	 *  Exemple : condition_expr: { op: 'et', enfants: [
	 *    { op: 'predicat', predicat: 'possede_objet', cibles: ['objet.clef-de-basalte'] },
	 *    { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-nuit'] } ] } */
	condition_expr?: ExprNode
}

/**
 * Ce que le MOTEUR lit. `charpente` n'est pas « jamais vue » mais « jamais vue
 * ENTIÈRE » : la seule charge utile qui en sorte vers le modèle est l'ÉNONCÉ des
 * jalons DÉJÀ ATTEINTS (`jalons[].enonce_texte`). Les déclencheurs et les
 * conditions de fin restent au dossier, destination auteur, jamais injectés —
 * `declencheur_texte` est `declencheur_expr` en français, et l'injecter met la
 * même règle dans le code et dans le prompt.
 *
 * La PROJECTION qui bâtit cette charge utile dépend de `session.jalons_atteints` :
 * ce n'est donc pas une projection du dossier, et elle vit en n° 9, à côté de son
 * assembleur, pas ici.
 */
export interface Charpente {
	depart: Depart
	jalons: Jalon[]
	fins: Fin[]
}

export interface Dossier {
	/** Toujours le nombre `DOSSIER_SCHEMA`. Toute autre valeur est refusée (KR-160). */
	schema: typeof DOSSIER_SCHEMA
	/** Identifiant stable du dossier — la clé de persistance, jamais le titre (KR-003). */
	id: string
	titre: string
	createdAt: string
	/** Horodatage ISO — le champ de comparaison de la réconciliation cloud (dernier écrit gagne). */
	updatedAt: string
	canon: Canon
	monde: Monde
	charpente: Charpente
}
