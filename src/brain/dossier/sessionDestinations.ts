import type { Destination } from './destinations'
import type { EtatSession } from './session'

/**
 * QUI LIT QUOI — l'AUDIENCE de chaque champ de l'ÉTAT DE SESSION.
 *
 * POURQUOI UNE SECONDE TABLE. `destinations.ts` couvre le DOSSIER seul. La
 * session porte des champs qui iront un jour au modèle — `journal[].texte`,
 * `memoire.*`, `attente.payload` — et sans table, la n° 9 rouvrirait côté session
 * la cachette fermée côté dossier (KR-232/241).
 *
 * JAMAIS FUSIONNÉE DANS `destinations.ts` : la garde de celle-là balaie une
 * fixture de DOSSIER, et son assertion « aucune ligne morte » ferait rougir une
 * clé de session le jour même où on l'y écrirait. Deux tables, deux gardes, deux
 * fixtures — `sessionCouverture.test.ts` est la garde de celle-ci.
 *
 * STRICTEMENT PLUS FORTE QUE SA VOISINE, et sur un point que la docstring de
 * `destinations.ts` reconnaît elle-même : ses clés à elle sont des CHAÎNES, que
 * rien ne relie aux types. Les clés RACINES de celle-ci sont `keyof EtatSession`,
 * donc exhaustives PAR COMPILATION — une huitième racine ne compile pas tant que
 * personne n'a déclaré pour qui elle est écrite.
 *
 * ⚠ « ZÉRO LIGNE `'ia'` » ÉTAIT UNE DÉCISION, PAS UN ÉTAT DES LIEUX — ET ELLE EST
 * DÉSORMAIS FAUSSE, CORRIGÉE ICI EN COMMENTAIRE, JAMAIS EN VALEUR (KR-195/196) :
 * le lot `contrat` de la n° 10 (`moteur-interprete`) pose ses DEUX PREMIÈRES
 * lignes `'ia'` du fichier — `attente.question` et `attente.saisie`, EXACTEMENT
 * les deux, aucune autre. Sans elles injectées au tour suivant, le modèle
 * répondrait à l'aveugle à une saisie qui répond à une question qu'il ne peut
 * plus lire. Les deux autres champs `'ia'` *sous condition d'état* que
 * `destinations.ts` annonçait déjà (`savoirs[].revele_comment`,
 * `plan_actions[].si_bloque`) restent aux propriétaires n° 12 et n° 14.
 *
 * ⚠ ET L'IT3 DE LA N° 10 EN AJOUTE TROIS, EXACTEMENT TROIS — `journal[].recit` (basculé
 * EN VALEUR de `'moteur'` à `'ia'`, avec son lecteur : la fenêtre glissante),
 * `memoire.faits_etablis[].fait` et `memoire.resume.texte`. Les deux autres feuilles de
 * la mémoire (`…sur[]`, `…jusqu_au_pas`) sont `'moteur'` : des identifiants et un
 * compte, lus par le CODE pour choisir ce qui repart au modèle, jamais injectés.
 *
 * CE QU'ELLE DONNE À LA N° 10 : deux des quatre champs `'ia'` *sous condition
 * d'état* de `destinations.ts` reçoivent enfin le NOM DU FAIT DE SESSION qui les
 * ouvre — `monde.indices_connus[]` ouvre `monde.indices[].verite`,
 * `monde.jalons_atteints[]` ouvre `charpente.jalons[].enonce_texte`. Les deux
 * autres (`savoirs[].revele_comment`, `plan_actions[].si_bloque`) n'ont PAS leur
 * porte ici : propriétaires n° 12 et n° 14.
 *
 * MODULE PUR : il part avec `src/player/` le jour de l'extraction
 * (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */

/**
 * Les chemins de FEUILLE de la session, au format du balayage pleine profondeur
 * (`feuillesDeLaFixture`) : `[]` pour un élément de liste, `<id>` pour une clé de
 * `Record`. Cette seconde normalisation se fait CÔTÉ TEST — le balayage efface
 * les indices de tableau, jamais les clés d'un `Record`.
 *
 * Les quatre feuilles scalaires de premier niveau (`schema`, `dossier_id`,
 * `dossier_maj`, `graine_alea`) ne sont PAS ici : leur clé racine EST leur chemin de
 * feuille, et une seconde ligne serait morte. `memoire` en était la cinquième tant
 * qu'elle était typée `null` ; depuis l'it3 de la n° 10 elle est PORTEUSE quand elle
 * retient quelque chose, et ses quatre feuilles sont déclarées une à une ci-dessous.
 */
type CheminDeFeuilleDeSession =
	| 'attente.type'
	| 'attente.question'
	| 'attente.saisie'
	| 'memoire.faits_etablis[].fait'
	| 'memoire.faits_etablis[].sur[]'
	| 'memoire.resume.texte'
	| 'memoire.resume.jusqu_au_pas'
	| 'horloge.tour'
	| 'monde.lieu_courant'
	| 'monde.lieux_visites[]'
	| 'monde.objets_possedes[]'
	| 'monde.indices_connus[]'
	| 'monde.jalons_atteints[]'
	| 'monde.evenements_consommes[]'
	| 'monde.pnj.<id>.a_dit[]'
	| 'monde.pnj.<id>.confiance'
	| 'monde.pnj.<id>.etape_plan.rang'
	| 'journal[].tour'
	| 'journal[].role'
	| 'journal[].texte'
	| 'journal[].origine'
	| 'journal[].interlocuteur'
	| 'journal[].recit'
	| 'journal[].deltas[].delta'
	| 'journal[].deltas[].cibles[]'
	| 'journal[].deltas[].effet'
	| 'journal[].jet.carac'
	| 'journal[].jet.tc'
	| 'heros.name'
	| 'heros.caracs.<id>'
	| 'heros.pvMax'
	| 'heros.pv'
	| 'heros.peMax'
	| 'heros.pe'
	| 'heros.mcBonus'
	| 'heros.xp'
	| 'combat.monstre_ref'
	| 'combat.postures[]'
	| 'combat.fuite'

export const DESTINATION_DES_CHAMPS_DE_SESSION: Readonly<
	Record<keyof EtatSession | CheminDeFeuilleDeSession, Destination>
> = {
	// ── Les quatre racines qui sont toujours des feuilles, et `memoire` ────────
	/** Enveloppe de persistance : le code seul la lit. */
	schema: 'moteur',
	/** Handle du document joué. */
	dossier_id: 'moteur',
	// L'estampille du dossier à l'ouverture. `moteur` au même titre que `updatedAt`
	// du dossier : un horodatage est une donnée de fraîcheur, jamais de la fiction.
	dossier_maj: 'moteur',
	/**
	 * L'entropie de la partie. Un modèle qui la lirait connaîtrait l'issue d'un jet
	 * AVANT le moteur — c'est le même arbitrage que les caractéristiques d'un
	 * personnage dans `destinations.ts`, pour la même raison.
	 */
	graine_alea: 'moteur',
	/**
	 * LA RACINE DE LA MÉMOIRE (n° 10 it3) — DEUX RÔLES SELON SA VALEUR, et la ligne vaut
	 * pour les deux : à `null` (ouverture, rien retenu), elle EST une feuille, qui ne
	 * s'injecte pas ; non nulle, elle est PORTEUSE, et ses quatre feuilles ont chacune
	 * leur ligne ci-dessous. Elle reste `'moteur'` : une audience `'ia'` sur la racine
	 * serait une autorisation EN BLOC, que les feuilles `…sur[]`/`…jusqu_au_pas`
	 * démentiraient. `keyof EtatSession` l'exige ici par compilation ; la fixture saturée
	 * l'instancie non nulle, donc le balayage la traite en DISPENSE DÉCLARÉE.
	 */
	memoire: 'moteur',

	// ── Les racines PORTEUSES — lignes de clé, jamais de feuille ───────────────
	// `feuillesDeLaFixture` ne rend jamais un objet NON VIDE comme feuille : ces
	// lignes n'ont donc AUCUNE instance dans la fixture saturée SI ELLE NE LES
	// INSTANCIE PAS. Elles existent pour l'exhaustivité par compilation sur
	// `keyof EtatSession`, et le test les nomme comme des DISPENSES DÉCLARÉES —
	// jamais comme des lignes mortes. Précédent exact : `…stats` et `…caractere`
	// dans `destinations.ts`, absents pour la raison inverse (là-bas, une telle
	// ligne serait morte).
	//
	// `attente` EST LA QUATRIÈME, posée par le lot `contrat` de la n° 10 : une clé
	// racine RÉELLE de `EtatSession` (optionnelle, KR-251), donc exhaustive par
	// compilation ici comme les trois autres — jamais une feuille, puisqu'un
	// `AttenteClarification` est un objet non vide.
	// `heros` EST LA CINQUIÈME, posée par le lot `contrat` de la n° 11
	// (`moteur-arbitre`, it1) : une clé racine RÉELLE (optionnelle à vie, KR-251),
	// exhaustive par compilation ici comme les quatre autres — un `HeroState` est
	// un objet non vide, jamais une feuille.
	// `combat` EST LA SIXIÈME, posée par le lot `contrat` de la n° 13
	// (`moteur-combat`, it1) : une clé racine RÉELLE (optionnelle à vie, KR-251),
	// jamais une feuille — un `EtatCombat` est un objet non vide.
	horloge: 'moteur',
	monde: 'moteur',
	journal: 'moteur',
	attente: 'moteur',
	heros: 'moteur',
	combat: 'moteur',

	// ── L'attente de clarification (n° 10) ─────────────────────────────────────
	/** Le DISCRIMINANT — un handle de code, jamais de la fiction. */
	'attente.type': 'moteur',
	/**
	 * La QUESTION que R1 a posée, VERBATIM (l'un des deux seuls textes hors
	 * amorce/fin émis mot pour mot — non, PLUS PRÉCISÉMENT : injectée telle
	 * quelle au tour suivant, jamais récitée à l'écran comme une fiche). `'ia'` :
	 * sans cette ligne, le modèle ne verrait jamais sa propre question au tour
	 * où le joueur y répond.
	 */
	'attente.question': 'ia',
	/**
	 * La SAISIE qui a déclenché la question, normalisée. `'ia'` pour la même
	 * raison que sa voisine : c'est le COUPLE {question, saisie} qui donne au
	 * modèle de quoi comprendre une réponse elliptique (« le grand », « non »).
	 */
	'attente.saisie': 'ia',

	// ── L'horloge ─────────────────────────────────────────────────────────────
	/** Le COMPTE, pas sa paraphrase — précédents `plan_actions[].duree`, `climat[].duree`. */
	'horloge.tour': 'moteur',

	// ── Le monde : sept champs, sept handles ou listes de handles ─────────────
	/** Handle du lieu où se tient le héros. */
	'monde.lieu_courant': 'moteur',
	'monde.lieux_visites[]': 'moteur',
	/**
	 * Le modèle ne lit JAMAIS l'inventaire : il reçoit la `description_joueur` des
	 * objets que le CODE a résolus, et celle-là porte déjà sa propre ligne `'ia'`
	 * dans `destinations.ts`.
	 */
	'monde.objets_possedes[]': 'moteur',
	/** Handles — ET C'EST LA PORTE de `monde.indices[].verite`, `'ia'` sous condition d'état. */
	'monde.indices_connus[]': 'moteur',
	/**
	 * Handles — ET C'EST LA PORTE de `charpente.jalons[].enonce_texte`, `'ia'` pour
	 * un jalon ATTEINT seulement.
	 */
	'monde.jalons_atteints[]': 'moteur',
	'monde.evenements_consommes[]': 'moteur',
	/** Handles. `<id>` est normalisé côté test : le balayage n'efface que les indices de liste. */
	'monde.pnj.<id>.a_dit[]': 'moteur',
	/**
	 * LA CONFIANCE D'UN PNJ (n° 12 `moteur-acteurs`, it3, lot `contrat`) —
	 * `'moteur'`, SANS EXCEPTION : le modèle ne voit JAMAIS ce nombre ni le seuil
	 * d'une porte (`docs/REGLES-DU-JEU.md` § 6) — même arbitrage que
	 * `heros.caracs.<id>` ci-dessous, pour la même raison. Elle n'entre dans le
	 * contexte R4 QUE PAR SON EFFET : quand `confiance_min` est atteint, le savoir
	 * qu'elle ouvre apparaît dans le catalogue `CE QUE TU PEUX CONFIER`
	 * (`contexte/acteur.ts`), comme n'importe quel autre savoir ouvert — et c'est
	 * CETTE ligne-là, `monde.indices_connus[]`/le rang `S<n>`, qui porte
	 * l'audience, jamais celle-ci.
	 */
	'monde.pnj.<id>.confiance': 'moteur',
	/**
	 * L'ÉTAPE COURANTE DU PLAN D'UN PNJ (n° 14 `moteur-horloge`, it1, lot `contrat` —
	 * `docs/REGLES-PLAY.md` § J2) — `'moteur'`, SANS EXCEPTION : un modèle qui lirait
	 * `rang` connaîtrait l'étape que joue le personnage et jouerait une urgence que le
	 * moteur n'a pas constatée. L'index est lu par le CODE seul (`tickHorloge`,
	 * `horloge.ts`) ; ce que le modèle apprendra d'un changement d'étape — itérations
	 * suivantes — passera par un contexte que le code compose, jamais par cette feuille.
	 * UNE SEULE feuille : `depuis` n'existe pas encore (KR-249), et sa ligne entrera
	 * avec son lecteur. Instanciée dans `__fixtures__/session-saturee.ts`, sur un seul
	 * des deux PNJ — sans instance, cette ligne serait morte le jour même où elle est
	 * écrite.
	 */
	'monde.pnj.<id>.etape_plan.rang': 'moteur',

	// ── Le journal ────────────────────────────────────────────────────────────
	'journal[].tour': 'moteur',
	'journal[].role': 'moteur',
	/**
	 * `'moteur'`, ET LA PRÉVISION D'it1 EST RÉVOQUÉE — EN COMMENTAIRE, JAMAIS EN
	 * VALEUR (KR-195/196). L'itération 1 annonçait que la n° 10 basculerait cette
	 * ligne à `'ia'` ; l'itération 2 la corrige, parce que le journal qu'elle livre
	 * est un RELEVÉ D'ÉTAT et rien d'autre : ses `texte` ne portent que des verbes
	 * du registre clos, des noms de champs d'`EtatMonde`, des identifiants du
	 * dossier et quatre séparateurs. Pas un mot que l'auteur a tapé, pas un
	 * caractère que le joueur a tapé.
	 *
	 * ET LA BASCULE EN BLOC EST IMPOSSIBLE, pas seulement indésirable : cette table
	 * est indexée par CHEMIN, donc elle ne peut pas discriminer par valeur de
	 * `role` — basculer la ligne ouvrirait AUSSI les entrées `joueur`. La n° 10
	 * donnera à sa prose SON PROPRE CHEMIN, avec sa propre ligne.
	 */
	'journal[].texte': 'moteur',
	/**
	 * LA CAUSE d'une entrée — une clé du registre CLOS des commandes, donc un
	 * HANDLE, au même titre que `dossier_id` ou `monde.lieu_courant`. Optionnelle
	 * À VIE (KR-251) : une entrée écrite par it1 ne la porte pas, et c'est un état
	 * LÉGAL, pas un trou. Instanciée dans `__fixtures__/session-saturee.ts` — sans
	 * instance, cette ligne serait morte le jour même où elle est écrite.
	 */
	'journal[].origine': 'moteur',
	/**
	 * L'INTERLOCUTEUR DE CE PAS (n° 12 `moteur-acteurs`, it1) — l'identifiant du PNJ
	 * à qui `parler` s'adresse. `'moteur'` : un identifiant est un HANDLE, jamais de
	 * la fiction, même statut que `origine`. Optionnel À VIE (KR-251) : une entrée
	 * écrite avant ce lot ne le porte pas, état LÉGAL. Instancié dans
	 * `__fixtures__/session-saturee.ts` — sans instance, cette ligne serait morte le
	 * jour même où elle est écrite.
	 */
	'journal[].interlocuteur': 'moteur',
	/**
	 * LE RÉCIT DU PAS (n° 10 `moteur-interprete`, it2) — la PROSE que la n° 9 annonçait
	 * sous « son propre chemin, avec sa propre ligne » (voir `journal[].texte`
	 * ci-dessus).
	 *
	 * `'ia'` DEPUIS L'IT3, BASCULÉ EN VALEUR AVEC SON LECTEUR — exactement ce que l'it2
	 * avait daté : elle l'avait posé `'moteur'` parce que le narrateur était SANS ÉTAT, et
	 * qu'une ligne `'ia'` sans assembleur pour la lire aurait été une autorisation
	 * DORMANTE. L'it3 livre la POLITIQUE DE RÉTENTION (`memoire.ts`) : l'assembleur du
	 * narrateur réinjecte le récit des pas de la fenêtre `(borneDeFenetre(t), t−1]` et
	 * de la tranche `pasACondenser`, et d'AUCUN autre pas. Ce que la ligne autorise est
	 * donc borné par cette politique, jamais « tout le journal ».
	 *
	 * Optionnel À VIE (KR-251) — une entrée sans récit est LÉGALE. Instancié dans
	 * `__fixtures__/session-saturee.ts`, sur l'entrée qui porte `origine` : sans
	 * instance, cette ligne serait morte le jour même où elle est écrite.
	 */
	'journal[].recit': 'ia',

	// ── Les effets de règle portés par une entrée (itération 3) ────────────────
	// TROIS FEUILLES, TOUTES `'moteur'`, et aucune n'est un candidat à la bascule :
	// un identifiant d'effet est une clé de registre CLOS, ses cibles sont des
	// handles du dossier, et `effet` est un constat à deux valeurs. Rien de tout
	// cela n'est de la fiction — ce que le modèle lira d'un indice révélé est
	// `monde.indices[].verite`, qui porte déjà SA ligne `'ia'` dans `destinations.ts`.
	/** Clé du registre CLOS des effets — un HANDLE, au même titre que `journal[].origine`. */
	'journal[].deltas[].delta': 'moteur',
	/** Handles du dossier, DANS L'ORDRE de `refKinds` — jamais un nom libre. */
	'journal[].deltas[].cibles[]': 'moteur',
	/** Le CONSTAT d'application, deux valeurs closes (KR-247). */
	'journal[].deltas[].effet': 'moteur',

	// ── Le jet résolu (n° 11 `moteur-arbitre`, it2) ─────────────────────────────
	// DEUX FEUILLES, TOUTES `'moteur'` : {carac,tc} entre au REJEU (KR-248 étendu —
	// `consignerJet`, seule porte d'écriture), mais ni l'une ni l'autre n'est de la
	// fiction. `carac`/`tc` sont des RANGS des deux registres fermés, au même titre
	// que `heros.caracs.<id>` ci-dessous : un modèle qui les lirait apprendrait des
	// clés qu'il a lui-même proposées à R2 (it2), jamais une raison de les relire.
	// SANS `lieu_id` (§8 #4 du plan d'it2, KR-013) : dérivable de
	// `monde.lieu_courant` au moment du pas, jamais stocké une seconde fois.
	// Instanciées dans `__fixtures__/session-saturee.ts` — sans instance, ces deux
	// lignes seraient mortes le jour même où elles sont écrites.
	'journal[].jet.carac': 'moteur',
	'journal[].jet.tc': 'moteur',

	// ── Le héros du joueur (n° 11 `moteur-arbitre`, it1) ───────────────────────
	// TOUTES `'moteur'`, SANS EXCEPTION (KR-232/262 étendus, veto narratif-ia au
	// raffinage) : aucune caractéristique, aucune jauge, aucun XP n'entre JAMAIS
	// dans un contexte de modèle. R2 (arbitre, it2) choisit `{carac,tc}` à
	// l'aveugle des valeurs — c'est le CODE qui lit `heros.caracs[carac]` APRÈS,
	// jamais l'inverse. Garanti par invariance dans `copilote/contexte.test.ts`,
	// jamais par cette table seule (une intention, pas un comportement).
	/** Un identifiant choisi par le joueur à la création — jamais de la fiction canon. */
	'heros.name': 'moteur',
	/** Les huit caractéristiques — exactement ce que R2 ne voit jamais. */
	'heros.caracs.<id>': 'moteur',
	'heros.pvMax': 'moteur',
	'heros.pv': 'moteur',
	'heros.peMax': 'moteur',
	'heros.pe': 'moteur',
	'heros.mcBonus': 'moteur',
	'heros.xp': 'moteur',

	// ── Le combat en cours (n° 13 `moteur-combat`, it1 puis it2) ───────────────
	// TROIS FEUILLES, TOUTES `'moteur'`, SANS EXCEPTION : le renvoi de rejeu d'un
	// combat ne contient AUCUNE fiction, et aucune des trois n'entre dans un contexte
	// de modèle (KR-294 — le texte d'un round non plus : le narrateur de combat de
	// l'itération 3 recevra une PROJECTION structurée, calculée à part, jamais ces
	// feuilles). Un modèle qui lirait `postures[]` connaîtrait les choix du joueur
	// avant que le moteur n'ait résolu le round suivant.
	/** `bestiaire.<templateId>` — un HANDLE du bestiaire du jeu, jamais de la fiction. */
	'combat.monstre_ref': 'moteur',
	/**
	 * Les clés du registre fermé `POSTURES` choisies par le JOUEUR, une par round
	 * — des handles, au même titre que `journal[].origine`. La posture du monstre
	 * n'est PAS persistée : elle se redérive du rejeu (KR-292).
	 */
	'combat.postures[]': 'moteur',
	/**
	 * LE CHOIX DE FUIR (n° 13 `moteur-combat`, it2, KR-297) — un drapeau d'ENTRÉE du
	 * joueur, `true` ou absent (KR-251), consommé par le REJEU après les postures.
	 * `'moteur'`, pour la même raison que `postures[]` : un modèle qui le lirait
	 * connaîtrait la décision du joueur avant que le moteur ait résolu l'assaut gratuit,
	 * et le texte de cette fuite n'entre dans aucun contexte (KR-294). `hero-fled`,
	 * l'issue qui en découle, n'est PAS une feuille : elle se dérive du rejeu (KR-013).
	 */
	'combat.fuite': 'moteur',

	// ── La mémoire du narrateur (n° 10 it3) ─────────────────────────────────────
	/** La phrase d'un fait établi — PROSE que le narrateur a rendue, réinjectée par
	 *  `faitsPertinents` (au plus `FAITS_INJECTES_MAX`), repliée sur une ligne. */
	'memoire.faits_etablis[].fait': 'ia',
	/**
	 * Les ancres d'un fait — des IDENTIFIANTS du dossier (`lieu.*`, `objet.*`), lus par le
	 * CODE seul pour décider quel fait repart. Un modèle qui les lirait apprendrait des
	 * identifiants qu'il n'a jamais le droit d'écrire (KR-231).
	 */
	'memoire.faits_etablis[].sur[]': 'moteur',
	/** Le résumé glissant — PROSE condensée par le narrateur, réinjectée telle quelle,
	 *  repliée sur une ligne, en tête de la mémoire. */
	'memoire.resume.texte': 'ia',
	/**
	 * Le pointeur de condensation — un COMPTE de pas, posé par le code. Un nombre de pas
	 * n'entre dans aucun contexte de modèle : il inviterait à citer une mécanique, et la
	 * cadence ne vit que dans `memoire.ts` (KR-273).
	 */
	'memoire.resume.jusqu_au_pas': 'moteur',
}
