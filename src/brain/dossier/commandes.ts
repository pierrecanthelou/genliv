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
import { resoudreJalons } from './evaluate'
import { defineRegistre, type EspaceDeNoms } from './identifiers'
import type { EtatSession } from './session'
import type { Dossier } from './types'

/**
 * Ce qu'on sait d'une commande — sa donnée ET son comportement, le comportement
 * vivant dans `TRANSITIONS` sous la même clé (KR-117).
 */
export interface CommandeDescripteur {
	/** Libellé français de l'action, jamais une syntaxe montrée à l'auteur. */
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
 * LE REGISTRE CLOS — UN SEUL VERBE en itération 2, et c'est une décision : le
 * déplacement est la démonstration, la console n'en est que le moyen.
 *
 * Il est ce qu'un JOUEUR peut TAPER. Une cause moteur (jalon franchi, événement
 * consommé) n'y entre jamais : l'itération qui voudra l'attribuer ajoutera SON
 * propre champ optionnel avec SA propre ligne d'audience.
 */
export const COMMANDES = defineRegistre<CommandeDescripteur>()({
	aller: { label: 'va au lieu', verbe: 'ALLER', refKinds: ['lieu'] },
})

export type CommandeId = keyof typeof COMMANDES

/** Une commande ANALYSÉE : une clé de registre et des HANDLES, jamais de la prose. */
export interface Commande {
	readonly commande: CommandeId
	readonly cibles: readonly string[]
}

/**
 * Registre CLOS des refus. Les deux premiers sortent de l'ANALYSE (la saisie
 * seule), les deux derniers de la RÉSOLUTION (le dossier et l'état).
 */
export type RefusCommande = 'verbe_inconnu' | 'arite_invalide' | 'cible_inconnue' | 'acces_absent'

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
 * LE GABARIT UNIQUE DES DEUX REFUS D'ANALYSE — une arité fautive est une
 * commande qu'on ne reconnaît pas, elle ne mérite pas une seconde phrase.
 */
function messageDeSaisieRefusee(saisie: string): string {
	return `Commande inconnue : « ${saisie} ». Commandes disponibles : ${verbesDisponibles()}.`
}

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
	 * (append SI ABSENT — sémantique d'ensemble), `horloge.tour` (+1) et deux
	 * entrées de journal de MÊME `tour`. C'est la DEMANDE qui consomme le pas,
	 * jamais l'effet : un déplacement auto-référent, dont le monde ne bouge pas, en
	 * consomme un quand même (`docs/REGLES-PLAY.md` § J1).
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

		return {
			ok: true,
			session: {
				...session,
				horloge: { tour },
				monde: { ...session.monde, lieu_courant: lieuCible.id, lieux_visites: visites },
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
	const resultat = TRANSITIONS[commande.commande](dossier, session, commande)
	if (!resultat.ok) return resultat
	return { ok: true, session: avecJalonsResolus(dossier, resultat.session) }
}
