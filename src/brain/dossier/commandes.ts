/**
 * LES COMMANDES QUE LE JOUEUR PEUT TAPER — leur registre CLOS, leur analyse, et
 * la TRANSITION que chacune applique à l'état de session.
 *
 * TROIS RESPONSABILITÉS, ET UNE SEULE FRONTIÈRE ENTRE ELLES :
 *  · `analyserSaisie` lit une CHAÎNE et rend une `Commande` (clé de registre +
 *    handles) ou un refus. Elle ne consulte PAS le dossier ;
 *  · `destinationsPossibles` lit le dossier et l'état, et rend les accès du lieu
 *    courant TELS QUELS ;
 *  · `executerCommande` résout la cible et rend une session NEUVE, ou un refus.
 *
 * LA CONSOLE NE VALIDE RIEN, et c'est la raison d'être de ce module : une console
 * qui validerait ET un moteur qui résout font DEUX décideurs, qui divergeront
 * (KR-013). Une règle du jeu ne vit qu'à un seul endroit.
 *
 * CE N'EST PAS UNE GRAMMAIRE (KR-168, borne explicite) : un `trim` puis un
 * découpage sur l'espace, une arité DÉRIVÉE de `refKinds.length`, aucun état,
 * aucune récursion, aucune précédence, et AUCUNE sortie persistée hors la
 * `Commande` elle-même. La forme persistée d'une condition reste un arbre, et
 * rien ici ne s'en approche.
 *
 * LE TEXTE DU JOURNAL EST RECONSTRUIT, JAMAIS UN ÉCHO. Le verbe vient de
 * `COMMANDES[id].verbe`, la cible de l'identifiant RÉSOLU dans `monde.lieux` :
 * pas un caractère de la saisie n'entre dans une `EntreeJournal`, casse comprise.
 * La saisie ne peut être interpolée QUE dans le `message` d'un résultat
 * `{ ok: false }` — sans quoi le journal devient un canal de texte libre vers le
 * champ même que la n° 10 injectera (KR-247/248).
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */
import { finAtteinte, resoudreJalons } from './evaluate'
import { tickHorloge } from './horloge'
import { defineRegistre, type EspaceDeNoms } from './identifiers'
import type { EtatSession } from './session'
import type { Dossier } from './types'

/**
 * Ce qu'on sait d'une commande — sa donnée ET son comportement, le comportement
 * vivant dans `TRANSITIONS` sous la même clé (KR-117).
 */
export interface CommandeDescripteur {
	/**
	 * Libellé français de l'action, jamais une syntaxe montrée à l'auteur.
	 *
	 * ⚠ C'EST UN CONTRAT NARRATIF, PAS UNE ÉTIQUETTE D'ÉCRAN (KR-269) : un modèle le
	 * LIT à deux endroits — la ligne de geste du contexte de l'interprète, et le bloc
	 * du pas courant dans celui du narrateur (`copilote/contexte/`). C'est sa SEULE
	 * source pour comprendre la portée du verbe, les invites n'en nommant aucun
	 * (KR-270). D'où trois contraintes, pour tout verbe présent et à venir :
	 * troisième personne au présent, la PORTÉE dite en prose neutre, et aucun mot de
	 * mécanique (ni jet, ni réussite, ni échec).
	 */
	label: string
	/** LE MOT-CLÉ SAISI, en MAJUSCULES. La comparaison à la saisie est insensible à la casse. */
	verbe: string
	/**
	 * L'espace de noms attendu à CHAQUE position de `cibles`. L'ARITÉ est
	 * `refKinds.length`, DÉRIVÉE, jamais stockée (KR-165) — même forme que
	 * `PREDICATES` et `DELTAS`, qui sont ses deux registres frères.
	 */
	refKinds: readonly EspaceDeNoms[]
}

/**
 * LE REGISTRE CLOS — DEUX VERBES depuis la n° 10 (`moteur-interprete`, it2). Le
 * premier (`aller`) a été seul de la n° 9 à l'it1 de la n° 10, et c'était une
 * décision : le déplacement était la démonstration.
 *
 * Il est ce qu'un JOUEUR peut TAPER. Une cause moteur (jalon franchi, événement
 * consommé) n'y entre jamais : l'itération qui voudra l'attribuer ajoutera SON
 * propre champ optionnel avec SA propre ligne d'audience.
 *
 * UN VERBE N'ENTRE QU'AVEC SON CONSOMMATEUR NARRATIF (KR-263) : `agir` ne change
 * rien au monde, et un pas consommé sans rien de perceptible n'aurait été justifié
 * par rien — il entre dans le même lot que le narrateur qui le raconte. `parler`
 * (n° 12 `moteur-acteurs`, it1) entre avec SON consommateur à lui : le rôle
 * `acteur` (dixième rôle IA), jamais R3.
 *
 * L'ORDRE DES CLÉS EST L'ORDRE D'AFFICHAGE du message de refus
 * (`verbesDisponibles`) et l'ordre des rangs `G1…` de l'interprète : `aller`
 * d'abord, `agir` ensuite, `parler` en troisième. Un ajout se fait à la FIN,
 * jamais au milieu.
 */
export const COMMANDES = defineRegistre<CommandeDescripteur>()({
	aller: { label: 'va au lieu', verbe: 'ALLER', refKinds: ['lieu'] },
	/**
	 * ARITÉ 0 — `refKinds` VIDE, donc toujours satisfiable : un geste qui ne
	 * désigne rien ne dépend d'aucun candidat. Son `label` est FIGÉ par le plan
	 * d'itération (§ 3, KR-269) : troisième personne, présent, portée « sur place »
	 * — sans quitter le lieu —, aucun mot de mécanique. Sans cette portée écrite, il
	 * deviendrait l'aimant de toute saisie ambiguë et `sans_commande` mourrait en
	 * pratique.
	 */
	agir: { label: 'agit sur place', verbe: 'AGIR', refKinds: [] },
	/**
	 * ARITÉ 1, `refKinds: ['pnj']` — espace de noms VÉRIFIÉ dans `identifiers.ts`
	 * (`ESPACES_DE_NOMS.pnj`), PAS `'personnage'` (désaccord #1 du raffinage it1,
	 * Tech Lead concède). Son `label` est FIGÉ par le plan d'itération (§ 4, signature
	 * frozen) : troisième personne, présent, portée « sur place », aucun mot de
	 * mécanique — c'est sa SEULE source pour R1 et pour le bloc `CE PAS` du
	 * narrateur (KR-269), et R3 n'étant jamais appelé sur ce verbe, seul R1 le lit
	 * réellement en it1.
	 */
	parler: { label: "s'adresse à quelqu'un sur place", verbe: 'PARLER', refKinds: ['pnj'] },
})

export type CommandeId = keyof typeof COMMANDES

/** Une commande ANALYSÉE : une clé de registre et des HANDLES, jamais de la prose. */
export interface Commande {
	readonly commande: CommandeId
	readonly cibles: readonly string[]
}

/**
 * Registre CLOS des refus. Les deux premiers sortent de l'ANALYSE (la saisie
 * seule), les quatre derniers de la RÉSOLUTION (le dossier et l'état).
 *
 * `cible_indisponible` (n° 12 `moteur-acteurs`, it1, SEUL membre neuf du lot) —
 * la cible RÉSOUT dans `monde.personnages[]` mais n'est pas candidate à `parler` :
 * absente du lieu courant, ou sans aucune prose d'identité (`fonction`/`apparence`
 * toutes deux vides). `cible_inconnue` (existant, précédent `aller`) reste pour
 * l'identifiant qui ne résout dans AUCUN `monde.personnages[]` — DEUX refus
 * distincts (désaccord #9 du raffinage, Tech Lead tranche), même texte d'interface
 * pour les deux (§ 3 du plan : « {cible} n'est pas ici. »).
 *
 * `combat_en_cours` (n° 13 `moteur-combat`, it1, SEUL membre neuf du lot) — un
 * combat est ouvert (`session.combat`), donc AUCUNE commande n'est acceptée :
 * ni `aller`, ni `agir`, ni `parler`. Il sort de `executerCommande`, avant toute
 * résolution, et le test qui l'épingle balaie `COMMANDES` — un verbe de plus est
 * refusé sans qu'on y pense.
 *
 * `partie_terminee` (n° 15 `moteur-fins`, it1, SEUL membre neuf du lot) — une FIN est
 * atteinte (`finAtteinte`), donc AUCUNE commande n'est acceptée non plus. Même forme, même
 * balayage de `COMMANDES`, mais ELLE NE COUVRE PAS LA MORT : un héros mort laisse `combat` en
 * place (`cloreCombat` sur `hero-mort` rend la session à l'identique), et c'est
 * `combat_en_cours` qui refuse — les deux refus sont EXCLUSIFS PAR CONSTRUCTION (KR-303).
 */
export type RefusCommande =
	| 'verbe_inconnu'
	| 'arite_invalide'
	| 'cible_inconnue'
	| 'acces_absent'
	| 'cible_indisponible'
	| 'combat_en_cours'
	| 'partie_terminee'

/** Union DISCRIMINÉE — un appelant qui la rétrécit totalement n'a aucun bras muet. */
export type ResultatSaisie =
	| { readonly ok: true; readonly commande: Commande }
	| { readonly ok: false; readonly refus: 'verbe_inconnu' | 'arite_invalide'; readonly message: string }

/** Idem, côté résolution. Sur un refus, la session rendue est L'ARGUMENT lui-même. */
export type ResultatCommande =
	| { readonly ok: true; readonly session: EtatSession }
	| { readonly ok: false; readonly refus: RefusCommande; readonly message: string }

/**
 * LA LISTE DES VERBES, DÉRIVÉE À CHAQUE APPEL — jamais une constante de module,
 * et encore moins un littéral au site du message (T-8) : écrite en dur, elle
 * mentirait dès qu'un second verbe entrera, et la console re-listerait ce que
 * `COMMANDES` décide (Déméter).
 */
function verbesDisponibles(): string {
	return Object.values(COMMANDES)
		.map((descripteur) => descripteur.verbe)
		.join(', ')
}

/**
 * Le verbe d'une commande, pour un affichage hors de ce module (ex. le carnet
 * d'indices, n°12 it2) — frontière instrumentée par commandes.test.ts : seul
 * `useTourDeJeu.ts` importe `COMMANDES` directement (KR-260), tout autre
 * lecteur passe par cette fonction plutôt que de recomposer le registre.
 */
export function verbeDeCommande(id: CommandeId): string {
	return COMMANDES[id].verbe
}

/**
 * LE GABARIT UNIQUE DES DEUX REFUS D'ANALYSE — une arité fautive est une
 * commande qu'on ne reconnaît pas, elle ne mérite pas une seconde phrase.
 */
function messageDeSaisieRefusee(saisie: string): string {
	return `Commande inconnue : « ${saisie} ». Commandes disponibles : ${verbesDisponibles()}.`
}

/**
 * LE GABARIT UNIQUE DES DEUX REFUS DE `parler` (n° 12, it1) — `cible_inconnue`
 * et `cible_indisponible` produisent la MÊME expérience observable (§ 3 du
 * plan), donc le MÊME texte, posé une seule fois pour qu'un futur refus
 * distinct ne les fasse pas diverger en silence.
 */
function messageCibleIndisponible(cible: string): string {
	return `${cible} n'est pas ici.`
}

/**
 * LE TEXTE DU REFUS `combat_en_cours` — UN SEUL GABARIT, constant : il ne cite NI
 * le verbe tapé NI la cible (le refus tombe avant toute résolution, et la saisie
 * n'entre jamais dans un message que par le bras d'un refus d'analyse). En jeu,
 * l'écran de combat remplace la console tant que `session.combat` existe : ce texte
 * n'est lu que par un appelant qui contournerait l'écran.
 */
const MESSAGE_COMBAT_EN_COURS = "Un combat est en cours : aucune commande n'est acceptée avant son issue."

/**
 * LE TEXTE DU REFUS `partie_terminee` — UN SEUL GABARIT, constant, et même doctrine que
 * `MESSAGE_COMBAT_EN_COURS` : il ne cite NI le verbe tapé NI la cible, et SURTOUT NI l'identifiant
 * de la fin NI son `nom` NI son `texte` — la prose d'une fin n'est émise que par l'écran de fin
 * (verbatim), jamais par un message de refus. En jeu, l'écran de fin remplace la console dès que
 * `finAtteinte` rend un résultat : ce texte n'est lu que par un appelant qui contournerait l'écran.
 */
const MESSAGE_PARTIE_TERMINEE = "La partie est terminée : aucune commande n'est acceptée."

/**
 * ANALYSER UNE SAISIE — PURE, totale, synchrone, et elle NE CONSULTE PAS LE
 * DOSSIER : `ALLER <ordure>` rend `{ ok: true, cibles: ['<ordure>'] }`, la
 * résolution appartenant à `executerCommande`.
 *
 * ARITÉ STRICTE, `===` ET JAMAIS `>=` : exactement `1 + refKinds.length` jetons.
 * Avaler une queue de jetons est la façon dont un canal de texte libre s'ouvre —
 * le jeton en trop est précisément ce que personne ne relit.
 *
 * La comparaison du verbe est INSENSIBLE À LA CASSE (le testeur tape vite), mais
 * la cible est reprise TELLE QUELLE : un identifiant est un handle, on ne le
 * normalise pas. Sa résolution — ou son refus nommé — est l'affaire d'après.
 */
export function analyserSaisie(saisie: string): ResultatSaisie {
	const propre = saisie.trim()
	const jetons = propre.split(/\s+/).filter((jeton) => jeton !== '')
	const verbe = (jetons[0] ?? '').toUpperCase()

	const trouve = (Object.keys(COMMANDES) as CommandeId[]).find((id) => COMMANDES[id].verbe === verbe)
	if (trouve === undefined) {
		return { ok: false, refus: 'verbe_inconnu', message: messageDeSaisieRefusee(propre) }
	}

	if (jetons.length !== 1 + COMMANDES[trouve].refKinds.length) {
		return { ok: false, refus: 'arite_invalide', message: messageDeSaisieRefusee(propre) }
	}

	return { ok: true, commande: { commande: trouve, cibles: jetons.slice(1) } }
}

/**
 * LES ACCÈS DU LIEU COURANT, RENDUS TELS QUELS — ni dédoublonnés, ni filtrés des
 * références pendantes.
 *
 * Le dédoublonnage appartient à l'injection (n° 10) ; le filtrage n'appartient à
 * personne : une référence orpheline doit être EXPOSÉE (KR-021) et NOMMÉE par un
 * refus, jamais masquée — invisible à l'auteur, elle ne se corrige jamais.
 *
 * `acces` ABSENT ou VIDE est un état CALME, jamais une anomalie : un lieu d'où
 * l'on ne part vers nulle part est une impasse jouable (`types.ts`, docstring de
 * `Lieu.acces`).
 */
export function destinationsPossibles(dossier: Dossier, session: EtatSession): readonly string[] {
	const courant = dossier.monde.lieux.find((lieu) => lieu.id === session.monde.lieu_courant)
	return courant?.acces ?? []
}

/**
 * LES PERSONNAGES PRÉSENTS AU LIEU COURANT, RENDUS TELS QUELS — même doctrine que
 * `destinationsPossibles` (n° 12 `moteur-acteurs`, it1) : ni dédoublonnés (un
 * personnage n'apparaît qu'une fois dans `monde.personnages[]`, donc aucun
 * doublon n'est possible par construction), ni filtrés sur l'identité — le
 * filtrage sur `fonction`/`apparence` appartient aux CONSOMMATEURS
 * (`TRANSITIONS.parler`, `assemblerInterprete`), chacun avec sa propre garde
 * (l'une STRUCTURELLE, l'autre consciente du marqueur d'amorce) — jamais à cette
 * fonction, qui reste une PROJECTION pure de `Presence.lieu_id`.
 *
 * `presence` ABSENTE ou VIDE est un état CALME : un personnage qu'aucune fiche ne
 * situe n'est simplement candidat nulle part (même doctrine que `Lieu.acces` vide).
 */
export function personnagesPresents(dossier: Dossier, session: EtatSession): readonly string[] {
	return dossier.monde.personnages
		.filter((personnage) => (personnage.presence ?? []).some((p) => p.lieu_id === session.monde.lieu_courant))
		.map((personnage) => personnage.id)
}

/**
 * Ce que fait UNE commande. Vit comme CHAMP DU REGISTRE `TRANSITIONS`, indexé par
 * `CommandeId` — jamais un aiguillage au site d'appel (KR-117, T-7) : un verbe de
 * plus ne compile pas tant que sa ligne manque.
 */
type Transition = (dossier: Dossier, session: EtatSession, commande: Commande) => ResultatCommande

/**
 * LES TRANSITIONS — `Record<CommandeId, Transition>`, donc EXHAUSTIF PAR
 * COMPILATION. Interne et NON exporté : ce que la feature appelle est
 * `executerCommande`, qui est la seule porte.
 */
const TRANSITIONS: Record<CommandeId, Transition> = {
	/**
	 * ALLER — le déplacement le long d'un accès ORIENTÉ.
	 *
	 * ORDRE DES REFUS, ET IL COMPTE : `acces_absent` d'abord (la cible n'est pas
	 * dans `destinationsPossibles`), `cible_inconnue` ensuite (elle y est, mais ne
	 * résout dans aucun `monde.lieux[]`). Le second nomme la référence pendante ;
	 * il NE LÈVE PAS — KR-238 vise l'évaluateur d'arbre de condition, et lever sur
	 * un chemin utilisateur donne un écran blanc.
	 *
	 * CE QU'IL ÉCRIT, ET RIEN D'AUTRE : `monde.lieu_courant`, `monde.lieux_visites`
	 * (append SI ABSENT — sémantique d'ensemble), `horloge.tour` (+1), deux
	 * entrées de journal de MÊME `tour`, et — depuis le lot `contrat` de la n° 11
	 * (`moteur-arbitre`, it1) — `heros.pe`. `horloge` s'écrit en CONSERVANT ses autres clés
	 * (`{ ...session.horloge, tour }`, ici comme dans `agir` et `parler`) : sans cela, le
	 * premier pas effacerait `climat_actif` en silence (n° 14 it4, `docs/REGLES-PLAY.md`
	 * § J3). C'est la DEMANDE qui consomme le pas,
	 * jamais l'effet : un déplacement auto-référent, dont le monde ne bouge pas, en
	 * consomme un quand même (`docs/REGLES-PLAY.md` § J1).
	 *
	 * RÈGLE A4 (`docs/REGLES-DU-JEU.md:43`, `docs/REGLES-PLAY.md:104` E3) :
	 * `heros.pe` gagne +5, PLAFONNÉ à `heros.peMax`, mais UNIQUEMENT quand DEUX
	 * conditions tiennent TOUTES LES DEUX — `lieuCible.id !== depuis` (un
	 * changement RÉEL de lieu, jamais un auto-référent, `CHEMIN_MINIMAL`,
	 * `commandes.test.ts`) ET un héros existe (`session.heros !== undefined`).
	 * SINON, `pe` reste INCHANGÉ, et SI la clé `heros` était ABSENTE elle le
	 * RESTE — jamais `heros: undefined` (KR-251, spread conditionnel, précédent
	 * `commandes.test.ts:117-119`). Arbitré au raffinage (§ 8 #5) contre une
	 * version inconditionnelle, qui ouvrait une potion infinie sur tout lieu
	 * auto-référent. JAMAIS sur `agir` : cette feuille vit UNIQUEMENT dans
	 * `TRANSITIONS.aller`.
	 */
	aller: (dossier, session, commande) => {
		const cible = commande.cibles[0]
		const accessibles = destinationsPossibles(dossier, session)

		if (!accessibles.includes(cible)) {
			return {
				ok: false,
				refus: 'acces_absent',
				message: `Destination inconnue depuis ce lieu : « ${cible} ». Accès disponibles : ${accessibles.join(', ')}.`,
			}
		}

		const lieuCible = dossier.monde.lieux.find((lieu) => lieu.id === cible)
		if (lieuCible === undefined) {
			return {
				ok: false,
				refus: 'cible_inconnue',
				message: `Destination introuvable dans le dossier : « ${cible} » — l'accès existe, le lieu non.`,
			}
		}

		const tour = session.horloge.tour + 1
		const depuis = session.monde.lieu_courant
		const visites = session.monde.lieux_visites.includes(lieuCible.id)
			? session.monde.lieux_visites
			: [...session.monde.lieux_visites, lieuCible.id]

		// A4 — voir la docstring ci-dessus. `heros` ne vaut QUE quand les deux
		// conditions tiennent ; sinon `undefined`, pour que le spread qui suit ne
		// pose RIEN et laisse `...session` seule décider de la clé `heros`.
		const changeDeLieu = lieuCible.id !== depuis
		const heros =
			changeDeLieu && session.heros !== undefined
				? { ...session.heros, pe: Math.min(session.heros.pe + 5, session.heros.peMax) }
				: undefined

		return {
			ok: true,
			session: {
				...session,
				horloge: { ...session.horloge, tour },
				monde: { ...session.monde, lieu_courant: lieuCible.id, lieux_visites: visites },
				...(heros !== undefined ? { heros } : {}),
				journal: [
					...session.journal,
					{ tour, role: 'joueur', texte: `> ${COMMANDES[commande.commande].verbe} ${lieuCible.id}` },
					{
						tour,
						role: 'moteur',
						texte: `lieu_courant : ${depuis} → ${lieuCible.id}`,
						origine: commande.commande,
					},
				],
			},
		}
	},

	/**
	 * AGIR — une action SUR PLACE, sans quitter le lieu. AUCUN REFUS : un geste
	 * d'arité 0 ne désigne rien, il n'a donc rien à résoudre ni rien à ne pas
	 * trouver. L'ARITÉ N'EST PAS REVÉRIFIÉE ICI, exactement comme `aller` ne
	 * revérifie pas la sienne : ses deux décideurs sont en AMONT — `analyserSaisie`
	 * pour la console, `validerInterprete` pour la saisie libre — et un troisième
	 * divergerait (KR-013). Une `cibles` non vide passée par un appel direct n'entre
	 * nulle part : le texte du journal est reconstruit du SEUL verbe.
	 *
	 * NO-OP MÉCANIQUE STRICT, et c'est ce qui le définit : `monde` N'EST PAS TOUCHÉ —
	 * la session rendue porte LA MÊME RÉFÉRENCE `monde` que l'argument, jamais une
	 * copie, et la passe des jalons qui suit n'a donc rien pu rendre vrai. Il n'écrit
	 * que `horloge.tour` (+1) et DEUX entrées de journal de MÊME `tour` : c'est la
	 * DEMANDE qui consomme le pas, jamais l'effet (`docs/REGLES-PLAY.md` § J1, déjà
	 * verbe-agnostique). Aucun jet : les dés entrent avec la n° 11.
	 *
	 * LE TEXTE EST UN RELEVÉ D'ÉTAT, vocabulaire clos (`__fixtures__/session-saturee.ts`) :
	 * `> AGIR` côté joueur — le verbe du registre, jamais la saisie —, et côté moteur
	 * le nom du champ `lieu_courant` suivi de son identifiant, SANS `→` : la flèche
	 * reste réservée à une transition scalaire, et rien n'a transité. L'entrée moteur
	 * porte `origine`, comme celle d'`aller` — c'est elle qui recevra le récit du pas.
	 */
	agir: (_dossier, session, commande) => {
		const tour = session.horloge.tour + 1

		return {
			ok: true,
			session: {
				...session,
				horloge: { ...session.horloge, tour },
				journal: [
					...session.journal,
					{ tour, role: 'joueur', texte: `> ${COMMANDES[commande.commande].verbe}` },
					{
						tour,
						role: 'moteur',
						texte: `lieu_courant : ${session.monde.lieu_courant}`,
						origine: commande.commande,
					},
				],
			},
		}
	},

	/**
	 * PARLER — n° 12 `moteur-acteurs`, it1, lot `contrat`. UNE GARDE STRUCTURELLE,
	 * jamais une lecture de prose (même doctrine que `aller`/`agir`) : elle résout
	 * l'identifiant, constate la présence au lieu courant ET une prose d'identité
	 * non vide — `fonction` OU `apparence` — mais ne lit NI l'une ni l'autre pour
	 * en juger le CONTENU (le marqueur d'amorce est laissé à `contexte/acteur.ts`,
	 * qui seul a le droit d'importer `copilote/contexte/noyau` — `dossier/` reste
	 * import-free de `copilote/`).
	 *
	 * DEUX REFUS, DANS CET ORDRE (désaccord #9 du raffinage, Tech Lead) :
	 * `cible_inconnue` quand l'identifiant ne résout dans AUCUN
	 * `monde.personnages[]` (précédent `aller` : « existe mais n'y résout pas » et
	 * « ne résout pas du tout » sont DEUX refus distincts) ; `cible_indisponible`
	 * (SEUL membre neuf) quand il résout mais que le personnage est absent du lieu
	 * courant OU SANS aucune prose d'identité. MÊME TEXTE D'INTERFACE pour les
	 * deux : « {cible} n'est pas ici. » (§ 3 du plan).
	 *
	 * `monde` N'EST JAMAIS TOUCHÉ en it1 (design_contract) : la session rendue
	 * porte la MÊME RÉFÉRENCE `monde` que l'argument — comme `agir`, ce verbe ne
	 * change rien au monde, il ouvre seulement un tour de dialogue.
	 *
	 * L'ENTRÉE MOTEUR PORTE `interlocuteur` (n° 12, `session.ts`) EN PLUS
	 * D'`origine` — SEULE PORTE D'ÉCRITURE de ce champ dans toute la feature,
	 * condition d'admission KR-249 : sans elle, `contexte/acteur.ts` ne pourrait
	 * pas filtrer « les répliques passées DE CE PNJ » (K=4, KR-282 étendu). Son
	 * `texte` cite le nom du CHAMP qu'elle pose, exactement comme `lieu_courant`
	 * pour `aller`/`agir` — seul champ réellement neuf que ce pas écrit, `monde`
	 * restant inchangé.
	 */
	parler: (dossier, session, commande) => {
		const cible = commande.cibles[0]
		const personnage = dossier.monde.personnages.find((candidat) => candidat.id === cible)
		if (personnage === undefined) {
			return { ok: false, refus: 'cible_inconnue', message: messageCibleIndisponible(cible) }
		}

		const presentIci = (personnage.presence ?? []).some((p) => p.lieu_id === session.monde.lieu_courant)
		const identiteNonVide = (personnage.fonction ?? '').trim() !== '' || (personnage.apparence ?? '').trim() !== ''
		if (!presentIci || !identiteNonVide) {
			return { ok: false, refus: 'cible_indisponible', message: messageCibleIndisponible(cible) }
		}

		const tour = session.horloge.tour + 1

		return {
			ok: true,
			session: {
				...session,
				horloge: { ...session.horloge, tour },
				journal: [
					...session.journal,
					{ tour, role: 'joueur', texte: `> ${COMMANDES[commande.commande].verbe} ${personnage.id}` },
					{
						tour,
						role: 'moteur',
						texte: `interlocuteur : ${personnage.id}`,
						origine: commande.commande,
						interlocuteur: personnage.id,
					},
				],
			},
		}
	},
}

/**
 * LA CONSÉQUENCE DE RÈGLE D'UNE COMMANDE ACCEPTÉE — les jalons devenus vrais, et
 * la ligne de journal qui les raconte.
 *
 * UNE ENTRÉE PAR JALON ATTEINT, et jamais deux : le `texte` nomme le champ
 * d'`EtatMonde` et l'identifiant, les `deltas` portent les effets EN DONNÉE. Une
 * seconde entrée qui les redirait en prose les ferait vivre DEUX fois, et un
 * consommateur qui lirait les deux compterait chaque révélation deux fois.
 *
 * MÊME `tour` QUE LA COMMANDE : une conséquence enchaînée n'ajoute jamais un pas
 * (`docs/REGLES-PLAY.md` § J1). C'est la DEMANDE du joueur qui consomme le pas.
 *
 * PAS D'`origine` : le registre des commandes est ce qu'un JOUEUR peut TAPER, et
 * un jalon franchi n'en est pas. L'itération qui voudra attribuer une cause moteur
 * ajoutera SON propre champ optionnel avec SA propre ligne d'audience.
 *
 * LE TEXTE EST RECONSTRUIT : nom de champ d'`EtatMonde` + `:` + identifiant.
 * JAMAIS `enonce_texte` (audience `ia` — ce serait une troisième prose émise
 * verbatim), JAMAIS `jalons[].nom` (audience `auteur` — un mot que l'auteur a
 * tapé). Le `→` reste réservé à une transition scalaire : une appartenance
 * d'ensemble n'en porte pas.
 */
function avecJalonsResolus(dossier: Dossier, session: EtatSession): EtatSession {
	const resolution = resoudreJalons(dossier, session.monde)
	if (resolution.atteints.length === 0) return session

	return {
		...session,
		monde: resolution.faits,
		journal: [
			...session.journal,
			...resolution.atteints.map((atteint) => ({
				tour: session.horloge.tour,
				role: 'moteur' as const,
				texte: `jalons_atteints : ${atteint.jalon_id}`,
				deltas: atteint.deltas,
			})),
		],
	}
}

/**
 * EXÉCUTER UNE COMMANDE ANALYSÉE — PURE, synchrone, et TOTALE **sur un dossier
 * accepté par `validateDossier`**.
 *
 * ⚠ LA TOTALITÉ EST DÉSORMAIS CONDITIONNELLE, et c'est écrit plutôt que découvert :
 * la passe des jalons appelle `evaluerExpr`, qui LÈVE sur une entrée non reconnue
 * (KR-238). Aucun `catch` ici — il rouvrirait le faux positif que ce choix ferme,
 * et lever sur un chemin utilisateur donne un écran blanc : la parade est la porte
 * `jouable` des contrôles, vérifiée AU MONTAGE du shell (KR-239), jamais un repli.
 *
 * LA PASSE NE TOURNE QUE SUR UNE COMMANDE ACCEPTÉE — un refus n'a rien changé au
 * monde, donc aucune condition n'a pu devenir vraie : la rejouer serait du travail
 * pour rien ET une occasion de lever sur un chemin qui n'écrit rien.
 *
 * L'HORLOGE DES PNJ SUIT LES JALONS (n° 14 `moteur-horloge`, it1) : `tickHorloge`
 * (`horloge.ts`) tourne sur la session que la passe des jalons vient de rendre, donc sur
 * les faits d'APRÈS jalons, et ELLE AUSSI seulement sur une commande acceptée — le refus
 * `combat_en_cours` tombe avant tout, un combat étant un seul pas d'horloge (KR-295).
 * Elle évalue `plan_actions[].declencheur_expr` par `evaluerExpr` : la totalité de cette
 * fonction est donc conditionnelle aux déclencheurs de plan, exactement comme aux
 * déclencheurs de jalon — la porte `jouable` des contrôles, vérifiée au montage du shell
 * (KR-239), en est la parade, jamais un `catch`. Elle n'ajoute AUCUN pas : ses lignes de
 * journal portent le `tour` de la commande (`docs/REGLES-PLAY.md` § J1/J2). `tickHorloge`
 * COMMENCE par le climat de session (n° 14 it4, `climat.ts`, § J3) : un climat s'allume et
 * s'éteint APRÈS la passe des jalons — un jalon que l'effet d'un climat rend vrai n'est donc
 * résolu qu'à la commande suivante — et la totalité de cette fonction est de même
 * conditionnelle aux `declencheur_expr` des événements qui désignent un climat.
 *
 * TANT QU'UN COMBAT EST OUVERT (`session.combat !== undefined`), TOUTE COMMANDE EST
 * REFUSÉE (`combat_en_cours`) — et c'est le PREMIER refus, avant la résolution de
 * la cible : un `aller` vers un lieu inconnu pendant un combat dit `combat_en_cours`,
 * jamais `acces_absent`. Une seule garde AVANT `TRANSITIONS`, jamais une par verbe :
 * un verbe de plus est refusé sans qu'on y pense (KR-117). La session d'entrée est
 * intacte — ni pas d'horloge, ni ligne de journal, ni passe des jalons.
 *
 * UNE FIN ATTEINTE REFUSE TOUTE COMMANDE DE LA MÊME FAÇON (`partie_terminee`, n° 15
 * `moteur-fins`, it1) : SECONDE garde, juste APRÈS `combat_en_cours` et AVANT `TRANSITIONS`,
 * jamais une par verbe (KR-117) — et par construction elle n'est jamais atteinte sous un combat
 * (`finAtteinte` rend `undefined` tant que `session.combat` existe, KR-303). Elle lit la session
 * D'ENTRÉE, donc la fin qu'une commande vient de rendre vraie est refusée à la commande SUIVANTE,
 * jamais à celle qui l'a produite : la commande qui amène la fin est acceptée et tick comme
 * toute autre. Mêmes garanties que `combat_en_cours` : session d'entrée intacte, pas
 * d'horloge, pas de journal, pas de passe des jalons.
 *
 * ⚠ ELLE LÈVE SI UNE `condition_expr` DE FIN EST NON RECONNUE (KR-238), à CHAQUE commande —
 * y compris une commande qui aurait été refusée plus bas. Même parade que la passe des jalons :
 * la porte `jouable` des contrôles, au montage du shell (KR-239), jamais un `catch`.
 *
 * UN REFUS NE CONSOMME AUCUN PAS : il ne touche aucun champ, n'écrit aucune ligne
 * de journal, et NE REND AUCUNE SESSION — l'appelant garde la sienne, qui est la
 * MÊME RÉFÉRENCE puisque rien ne l'a remplacée. Une faute de frappe n'est pas un
 * événement du monde (KR-248).
 *
 * ⚠ LE BRAS `{ ok: false }` NE PORTE PAS DE CHAMP `session`, et c'est la
 * signature figée au § 4 du plan d'itération qui le dit. Le § 5 du même plan
 * illustrait la propriété par `expect(resultat.session).toBe(session)`, qui n'est
 * PAS satisfiable sous ce type : la propriété se prouve sur l'ARGUMENT — la
 * session d'entrée est intacte, champ par champ — et c'est ce que
 * `commandes.test.ts` épingle. Ne pas « réparer » le type pour faire tenir la
 * phrase : c'est la phrase qui était un raccourci.
 */
export function executerCommande(dossier: Dossier, session: EtatSession, commande: Commande): ResultatCommande {
	if (session.combat !== undefined) {
		return { ok: false, refus: 'combat_en_cours', message: MESSAGE_COMBAT_EN_COURS }
	}
	if (finAtteinte(dossier, session) !== undefined) {
		return { ok: false, refus: 'partie_terminee', message: MESSAGE_PARTIE_TERMINEE }
	}
	const resultat = TRANSITIONS[commande.commande](dossier, session, commande)
	if (!resultat.ok) return resultat
	return { ok: true, session: tickHorloge(dossier, avecJalonsResolus(dossier, resultat.session)) }
}
