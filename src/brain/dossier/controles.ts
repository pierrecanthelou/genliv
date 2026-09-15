import { AMORCE, MARQUEUR_A_ECRIRE } from './amorce'
import type { Delta } from './deltas'
import { defineRegistre, estCleDe, localiserEntite } from './identifiers'
import { SECTIONS, type SectionId } from './sections'
import type { Dossier } from './types'

/**
 * LE LINTER DU DOSSIER — ce qui empêche une aventure d'être JOUÉE, par
 * opposition à ce qui empêche un document d'être ÉCRIT.
 *
 * DEUX AXES DISTINCTS, et c'est ce qui rend ce type FRÈRE de `DossierIssue`
 * lisible plutôt qu'arbitraire :
 *  · `DossierIssueSeverity` (`issues.ts`) répond « ce document peut-il être
 *    ÉCRIT ? ». DEUX valeurs, parce qu'elle a deux effets sur
 *    `DossierService.update` : `error` refuse l'écriture, `warning` jamais.
 *  · `NiveauControle` répond « cette aventure peut-elle être JOUÉE ? ». TROIS
 *    mots, et AUCUN effet sur l'écriture.
 *
 * Un dossier parfaitement écrivable peut être totalement injouable — c'est
 * l'état de tout dossier neuf, dont les quatre proses sont semées MARQUÉES et
 * que le validateur accepte pourtant sans une seule anomalie ni un seul
 * avertissement. Le rapport ne passe donc jamais par le canal `errors` /
 * `warnings`, et ce module n'importe pas le validateur : il n'a rien à y lire.
 *
 * CE QUI SORT PAR `brain/index.ts` : le rapport, ses types, et la consigne QUOI
 * FAIRE. CE QUI RESTE ICI : le registre `CONTROLES`, son descripteur,
 * `ConstatControle`, et la table des proses ci-dessous — aucun consommateur hors
 * de `brain/dossier/`, même règle que `PREDICATES` et `DELTAS`.
 *
 * ET LA MARQUE, SURTOUT : `MARQUEUR_A_ECRIRE` est IMPORTÉE de `./amorce`,
 * jamais recopiée. Sa valeur n'est écrite qu'à UN endroit dans `src/` et son
 * module ne sort pas du baril — deux balayages de source tiennent ces deux
 * propriétés. Un littéral recopié ici en ferait un second porteur, qui
 * dériverait en silence de celui qui fait foi ; une prose qui la nommerait dans
 * le baril ferait rougir la seconde garde. Le motif du non-export s'écrit donc
 * ici, et nulle part ailleurs.
 */

/**
 * Le NIVEAU d'un contrôle — le MOT, jamais une couleur : le produit n'a que deux
 * couleurs sémantiques (`--good`, `--bad`) et elles sont réservées au jet.
 *
 * SON RENDU — le libellé français et la teinte — vivait côté feature tant qu'il
 * n'avait qu'UN appelant. L'itération 2 lui en donne un SECOND, dans une AUTRE
 * feature (le badge des lignes de navigation), donc il est descendu dans
 * `dossier/pastilles.ts` (KR-109) plutôt que d'être recopié. CE MODULE-CI, lui,
 * ne connaît toujours ni mot français ni teinte : il dit QUELS constats, jamais
 * comment on les montre.
 *
 * `info` n'a aucune règle qui le produise avant l'itération 3. Il entre
 * maintenant parce qu'un mapping exhaustif par compilation coûte une ligne
 * aujourd'hui et rouvrirait la vue demain.
 */
export type NiveauControle = 'bloquant' | 'alerte' | 'info'

/**
 * Le CONSTAT d'une règle — tout ce qu'un contrôle porte SAUF l'identifiant de la
 * règle qui l'a produit, que `controlerDossier` appose.
 *
 * `niveau` et `section` vivent ICI et non sur le descripteur : une même règle
 * produit des constats de niveaux et de sections DIFFÉRENTS (l'amorce est
 * bloquante sur le départ et alerte sur le canon), et « référence orpheline »
 * atteindra cinq sections pour une seule cause. Un couple par règle serait faux
 * dès la première.
 */
export interface ConstatControle {
	niveau: NiveauControle
	/** La section DÉCLARÉE par la règle — jamais dérivée de `path` (KR-219). */
	section: SectionId
	/** QUOI — phrase française rédigée, jamais une erreur technique sérialisée. */
	message: string
	/**
	 * OÙ — le repère que l'auteur cherche en premier. DEUX FORMES, selon que la
	 * règle vise un CHAMP ou une ENTITÉ : le champ semé se nomme en capitales
	 * (« DÉPART · TEXTE D'OUVERTURE — … »), l'entité fautive passe par
	 * `localiserEntite`, qui rend son nom ou le repli « {Type} n°{rang} (sans
	 * nom) ». Une entité en cours de rédaction reste ainsi désignable.
	 */
	location: string
	/** Chemin JSON stable du champ fautif — une clé de `DESTINATION_DES_CHAMPS`. */
	path: string
	/** L'identifiant stable de l'entité fautive, quand elle en porte un. */
	entityId?: string
}

/** Un constat, muni de l'identifiant de la règle qui l'a produit. */
export interface Controle extends ConstatControle {
	id: ControleId
}

/**
 * UNE RÈGLE du linter. `controler` rend des `ConstatControle` et non des
 * `Controle` : le type du registre dépendrait sinon de son propre initialiseur,
 * et `tsc` refuserait la circularité.
 */
export interface ControleDescripteur {
	/**
	 * Le nom de la règle, pour un rapport de développeur. Aucune surface ne le
	 * rend : ce que l'auteur lit, ce sont les trois lignes du constat.
	 */
	libelle: string
	/**
	 * L'ensemble FERMÉ des niveaux que cette règle peut émettre. Sans lui, « un
	 * code par cause » quitterait le registre pour la prose d'un `controler()` —
	 * et un test de balayage n'aurait plus d'ancre.
	 */
	niveaux: readonly NiveauControle[]
	controler(dossier: Dossier): ConstatControle[]
	remediation(constat: ConstatControle): string
}

/**
 * Une prose semée et ce que le linter en dit. Table PRIVÉE, et elle ne peut pas
 * vivre dans `amorce.ts` : `niveau` et `section` sont du vocabulaire de linter,
 * `amorce.ts` est un semeur.
 */
interface ProseAmorce {
	niveau: NiveauControle
	section: SectionId
	path: string
	location: string
	message: string
	remediation: string
	/** Le champ que la règle relit dans le dossier — jamais un chemin déréférencé. */
	lire(dossier: Dossier): string
}

/**
 * LES QUATRE PROSES SEMÉES, chacune avec sa conséquence par DESTINATION — c'est
 * elle, et non un adverbe d'intensité, qui sépare le bloquant des alertes :
 * `charpente.depart.texte_ouverture_joueur` est lu au joueur MOT POUR MOT par le
 * moteur, les trois autres partent dans le contexte du modèle. Aucune règle
 * bloquante ne prend pour critère un champ d'audience `ia` : exiger de nourrir
 * le modèle pour débloquer le moteur inverserait les audiences.
 *
 * Le `Record` TOTAL sur `keyof typeof AMORCE` est la garde anti-dérive, et elle
 * est portée PAR LA COMPILATION : une cinquième prose semée dans `amorce.ts`
 * casse `tsc` ici, sans qu'aucun test soit dû.
 *
 * ORDRE DES CLÉS = ORDRE DE RENDU : le bloquant d'abord, puis l'ordre du schéma
 * pour le canon. Aucune vue ne trie.
 *
 * AUCUNE de ces lignes ne recopie la consigne semée par `amorce.ts` : celle-ci
 * s'adresse à un auteur devant un champ, celles-ci à un auteur qui lit un
 * rapport. Même fait, deux registres, deux textes assumés.
 */
const PROSES_AMORCE: Record<keyof typeof AMORCE, ProseAmorce> = {
	texte_ouverture_joueur: {
		niveau: 'bloquant',
		section: 'depart',
		path: 'charpente.depart.texte_ouverture_joueur',
		location: "DÉPART · TEXTE D'OUVERTURE — lu par le joueur, mot pour mot",
		message: `Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le moteur le lira au joueur mot pour mot, marqueur compris.`,
		remediation: 'Rédigez le texte que le joueur doit lire en arrivant.',
		lire: (dossier) => dossier.charpente.depart.texte_ouverture_joueur,
	},
	synopsis_mj: {
		niveau: 'alerte',
		section: 'canon',
		path: 'canon.mj.synopsis_mj',
		location: 'CANON · SYNOPSIS — matériau du modèle, jamais lu tel quel',
		message: `Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le synopsis partira tel quel dans le contexte du modèle.`,
		remediation: "Rédigez le synopsis qui orientera le modèle sur l'intrigue.",
		lire: (dossier) => dossier.canon.mj.synopsis_mj,
	},
	accroche_joueur: {
		niveau: 'alerte',
		section: 'canon',
		path: 'canon.partage.accroche_joueur',
		location: 'CANON · ACCROCHE — matériau du modèle, jamais lu tel quel',
		message: `Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : l'accroche partira telle quelle dans le contexte du modèle.`,
		remediation: "Rédigez l'accroche qui donnera envie de commencer.",
		lire: (dossier) => dossier.canon.partage.accroche_joueur,
	},
	ton: {
		niveau: 'alerte',
		section: 'canon',
		path: 'canon.ton',
		location: 'CANON · TON — matériau du modèle, jamais lu tel quel',
		message: `Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le ton partira tel quel dans le contexte du modèle.`,
		remediation: 'Rédigez le ton qui doit guider le modèle — ambiance, registre, limites.',
		lire: (dossier) => dossier.canon.ton,
	},
}

/** Les quatre proses, dans l'ordre de rendu — dérivées, jamais re-listées. */
const PROSES: readonly ProseAmorce[] = Object.values(PROSES_AMORCE)

/**
 * La prose par CHEMIN, pour résoudre la consigne d'un constat déjà produit.
 * Indexée par une valeur que ce module ne contrôle plus (un `Controle` que son
 * appelant tient en main), donc lue par appartenance PROPRE — jamais `in`, qui
 * remonte la chaîne de prototypes (KR-175).
 */
const PROSE_PAR_CHEMIN: Record<string, ProseAmorce> = Object.fromEntries(PROSES.map((prose) => [prose.path, prose]))

/**
 * LA PROSE d'une règle — le QUOI et le QUOI FAIRE, écrits ENSEMBLE parce qu'ils
 * sont deux moitiés d'un même arbitrage et non deux textes voisins : le constat
 * est à l'indicatif présent impersonnel, sujet = le document ; la remédiation à
 * l'impératif, deuxième personne du pluriel, sujet = l'auteur. Jamais de
 * deuxième personne immersive ni de présent narratif — le linter n'est pas le
 * narrateur.
 *
 * Et aucun terme interne n'y entre : ni `Delta`, ni `refKinds`, ni
 * `savoirs[].indice_id`. L'auteur lit le geste qu'il doit faire, nommé par les
 * intitulés que ses écrans portent vraiment.
 */
interface ProseControle {
	message: string
	remediation: string
}

/**
 * LES DEUX SEUILS de « indice sans source » — et ce `Record` porte ces DEUX MOTS
 * SEULEMENT, jamais `Record<NiveauControle, …>` : le troisième exigerait une
 * ligne `info` que cette règle n'émet pas, et un texte que personne n'a écrit
 * finirait par être lu par quelqu'un.
 */
type SeuilIndice = 'bloquant' | 'alerte'

/**
 * LA PROSE PAR SEUIL. Elle dispatche sur le NIVEAU, là où `PROSES_AMORCE`
 * dispatche sur le CHEMIN — et ce n'est pas une variation de style : les deux
 * seuils de cette règle partagent le même champ fautif et ne se distinguent que
 * par leur gravité, quand les quatre proses semées portent quatre chemins
 * distincts.
 *
 * DEUX CONTRAINTES PROPOSITIONNELLES, mesurées et non décoratives :
 *  · « aucun personnage, aucun effet et aucun enchaînement » n'est affirmable
 *    QUE parce que `producteursParIndice` balaie les SIX chemins. Retirer un
 *    chemin de l'index rendrait cette phrase fausse avant de rendre le compte
 *    faux — le texte se relit donc avec l'index, jamais seul ;
 *  · l'énumération des remèdes est ISOMORPHE à l'ensemble des producteurs
 *    comptés : trois familles comptées, trois familles offertes. Le texte du
 *    seuil `alerte` ne nomme pour cette raison AUCUNE famille (« un seul
 *    chemin », jamais « un seul personnage ») — un indice à source unique peut
 *    n'être détenu par personne, et c'est le cas de la fixture des preuves.
 */
const PROSES_INDICE_SANS_SOURCE: Record<SeuilIndice, ProseControle> = {
	bloquant: {
		message:
			"Aucun personnage, aucun effet et aucun enchaînement ne donne cet indice : le joueur ne pourra jamais l'obtenir.",
		remediation:
			"Confiez-le à un personnage (Personnages → Savoirs), révélez-le par un effet « révèle l'indice », ou faites-y mener un autre indice (Indices → Mène à).",
	},
	alerte: {
		message: "Cet indice n'est accessible que par un seul chemin : si le joueur le manque, il devient inaccessible.",
		remediation:
			"Ouvrez-lui un second chemin — un autre personnage (Personnages → Savoirs), un effet « révèle l'indice », ou un enchaînement depuis un autre indice (Indices → Mène à).",
	},
}

/**
 * L'appartenance PROPRE au couple de seuils (KR-175), en GARDE DE TYPE : la
 * consigne se résout sans un seul `as` posé sur un `niveau` qu'un appelant tient
 * en main, et le repli reste la chaîne VIDE — jamais une levée, jamais une
 * consigne inventée.
 */
function estSeuilIndice(niveau: NiveauControle): niveau is SeuilIndice {
	return estCleDe(PROSES_INDICE_SANS_SOURCE, niveau)
}

/**
 * LA PRÉMISSE de « lieu de départ désert » entre MOT POUR MOT dans le message,
 * et pas seulement en note : le lieu de départ est le seul point du monde sans
 * itinéraire de contournement, puisqu'aucune partie n'atteint un deuxième tour
 * sans être passée par lui. C'est cette prémisse, et elle seule, qui sépare ce
 * BLOQUANT de l'ALERTE « personnage sans présence » — KR-224 (monde ouvert)
 * amortit l'absence d'un PNJ ISOLÉ, un autre chemin pouvant y mener plus tard ;
 * il ne dit rien du tour zéro. Un futur lecteur du code ne la retrouvera nulle
 * part ailleurs.
 */
const PROSE_DEPART_DESERT: ProseControle = {
	message:
		"Aucun personnage n'est présent au lieu de départ, le seul tour que l'auteur ne peut plus rattraper en jeu : la partie s'ouvre sans interlocuteur.",
	remediation:
		'Donnez une présence dans ce lieu à au moins un personnage (Personnages → Présence), ou changez le lieu de départ (Départ).',
}

const PROSE_PERSONNAGE_SANS_PRESENCE: ProseControle = {
	message: "Ce personnage n'a de présence dans aucun lieu : le joueur ne pourra jamais le rencontrer.",
	remediation:
		'Ajoutez au moins une présence à ce personnage — un lieu, et si besoin un moment (Personnages → Présence).',
}

/**
 * INFO, jamais alerte : ce qui manque ici n'empêche aucune partie de s'ouvrir ni
 * de se finir — le modèle inventera, simplement sans mémoire d'un tour à l'autre.
 * Et le voyant s'éteint en RÉDIGEANT de la prose d'audience `ia`, geste qui n'est
 * jamais bloquant.
 */
const PROSE_PERSONNAGE_SANS_VOIX: ProseControle = {
	message:
		"Ce personnage n'a aucune réplique type : le modèle inventera sa façon de parler, et elle changera d'un tour à l'autre.",
	remediation: "Écrivez une ou deux répliques telles qu'il les dirait (Caractère exploitable → Manière de parler).",
}

/**
 * LA FAMILLE d'un chemin producteur. Trois familles comptées, trois familles
 * offertes par la remédiation : l'isomorphisme est une contrainte de rédaction
 * mesurée, pas une coïncidence — une quatrième famille comptée sans quatrième
 * remède offert rendrait la consigne incomplète sans qu'aucun test rougisse.
 */
type FamilleDeSource = 'savoir' | 'delta' | 'mene_a'

/**
 * UNE SOURCE qui fait parvenir un indice au joueur. Un OBJET plutôt que le seul
 * mot de la famille, et c'est délibéré : la saturation transitive d'it6 aura
 * besoin du PORTEUR de l'arête, et un champ de plus posé ici ne touchera pas la
 * signature de `producteursParIndice`, qui est le contrat d'extraction.
 */
interface SourceIndice {
	famille: FamilleDeSource
}

/**
 * L'INDEX DES PRODUCTEURS — pour chaque identifiant d'indice CITÉ quelque part
 * dans le dossier, les sources qui le produisent. Un indice ABSENT de la carte
 * n'a aucun producteur : c'est le zéro, et son appelant le lit comme tel.
 *
 * Pure, totale, et elle ne ferme sur RIEN — en particulier pas sur `CONTROLES`.
 * C'est cette propriété-là, et non sa taille, qui la rend déplaçable telle
 * quelle.
 *
 * CONTRAT D'EXTRACTION D'IT6 : elle garde ce NOM en traversant vers
 * `atteignabilite.ts`, où elle sera DÉPLACÉE, jamais réécrite. Un déplacement se
 * relit en diff ; une réécriture sous un autre nom passe inaperçue.
 *
 * LES SIX CHEMINS, en UNION et jamais en branches disjointes — deux branches
 * disjointes laissent entre elles un indice à zéro savoir et un seul effet, donc
 * un silence sur le cas même que la règle existe pour attraper :
 *  · `monde.personnages[].savoirs[].indice_id` ;
 *  · les QUATRE sites de `CHEMINS_DE_DELTAS` filtrés sur `reveler_indice` —
 *    récompense de quête, conséquence de résolution, effet de climat, effet de
 *    jalon — lus en ACCÈS TYPÉS, jamais par un marcheur de chemins générique :
 *    `sitesDe` est PRIVÉE à `validate.ts` et son import est déjà interdit ici
 *    par un balayage de source ; en réécrire un créerait un SECOND moteur de
 *    traversée du schéma, non typé, qui dériverait en silence de la grammaire
 *    figée du premier ;
 *  · `monde.indices[].mene_a[]`.
 *
 * LE CLIMAT EST COMPTÉ bien qu'aucun moteur ne sache aujourd'hui APPLIQUER un
 * effet de climat : sur une règle bloquante, l'erreur permise est le faux
 * négatif, jamais le faux positif.
 *
 * `mene_a` EST LU À PLAT, JAMAIS SATURÉ : tout indice cité dans un `mene_a[]`
 * compte un producteur, sans qu'on vérifie que son amont soit lui-même produit.
 * CE QUE CETTE LECTURE NE COUVRE PAS : un CYCLE sans aucune source extérieure
 * (`A.mene_a = ['B']`, `B.mene_a = ['A']`) — chacun des deux s'y compte un
 * producteur et remonte ALERTE, là où la saturation par point fixe remonterait
 * BLOQUANT. Le sens d'erreur est délibéré : SOUS-GRADUÉ, JAMAIS ÉTEINT. La
 * saturation est la charge d'IT6, qu'elle traverse avec l'atteignabilité ; son
 * test séparateur est écrit et basculera ce jour-là de deux alertes à deux
 * bloquants.
 */
function producteursParIndice(dossier: Dossier): Map<string, SourceIndice[]> {
	const producteurs = new Map<string, SourceIndice[]>()

	const ajouter = (indiceId: string, famille: FamilleDeSource): void => {
		const sources = producteurs.get(indiceId)
		if (sources === undefined) producteurs.set(indiceId, [{ famille }])
		else sources.push({ famille })
	}

	// Un emplacement d'effets, quel que soit son porteur — le filtre sur
	// `reveler_indice` est écrit UNE FOIS, et un balayage de source tient cette
	// unicité : quatre copies dériveraient le jour où un cinquième site entrerait.
	const ajouterEffets = (effets: readonly Delta[]): void => {
		for (const effet of effets) {
			if (effet.delta !== 'reveler_indice') continue
			for (const cible of effet.cibles) ajouter(cible, 'delta')
		}
	}

	for (const personnage of dossier.monde.personnages) {
		for (const savoir of personnage.savoirs) ajouter(savoir.indice_id, 'savoir')
	}

	for (const quete of dossier.monde.quetes) ajouterEffets(quete.recompense)
	for (const evenement of dossier.monde.evenements) {
		for (const resolution of evenement.resolutions) ajouterEffets(resolution.consequence)
	}
	for (const climat of dossier.monde.conditions.climat) ajouterEffets(climat.effets_regles)
	for (const jalon of dossier.charpente.jalons) ajouterEffets(jalon.effet)

	for (const indice of dossier.monde.indices) {
		for (const vise of indice.mene_a ?? []) ajouter(vise, 'mene_a')
	}

	return producteurs
}

/**
 * LE REGISTRE DES RÈGLES — fermé, une entrée par CAUSE, jamais par emplacement
 * ni par niveau. Scinder « amorce non rédigée » en deux entrées parce qu'elle
 * émet deux niveaux obligerait à scinder aussi les règles à venir qui portent
 * une cause unique sur cinq sections : deux codes pour une cause, KR-164 en sens
 * inverse. « Indice sans source » porte la même arithmétique et la même réponse.
 *
 * L'ORDRE DES CLÉS EST L'ORDRE DE RENDU, ici comme dans `PROSES_AMORCE` : aucune
 * vue ne trie, donc si l'ordre ne vient pas d'ici il ne vient de nulle part. Les
 * quatre entrées de l'itération 3 sont déclarées APRÈS `amorce-non-redigee` pour
 * cette seule raison — l'amorce reste la première chose que l'auteur lit d'un
 * dossier neuf.
 */
export const CONTROLES = defineRegistre<ControleDescripteur>()({
	/**
	 * L'AMORCE ENCORE MARQUÉE — une prose que `DossierService.create()` a semée et
	 * que l'auteur n'a pas reprise.
	 *
	 * DÉTECTION PAR `includes`, JAMAIS PAR `startsWith`, et ce n'est pas une
	 * généralisation gratuite : `amorce.test.ts` teste le SEMEUR, qui maîtrise la
	 * tête de sa chaîne ; cette règle lit un texte ÉDITÉ PAR L'AUTEUR, qui ne la
	 * maîtrise pas. Une prose rédigée AUTOUR du marqueur — le cas le plus
	 * probable d'une reprise inachevée — éteindrait le voyant sous `startsWith`,
	 * alors que c'est exactement le cas que ce dispositif existe pour attraper.
	 */
	'amorce-non-redigee': {
		libelle: 'Amorce non rédigée',
		niveaux: ['bloquant', 'alerte'],
		controler: (dossier) =>
			PROSES.filter((prose) => prose.lire(dossier).includes(MARQUEUR_A_ECRIRE)).map((prose) => ({
				niveau: prose.niveau,
				section: prose.section,
				message: prose.message,
				location: prose.location,
				path: prose.path,
			})),
		/**
		 * La consigne du champ visé. Un `path` hors de la table est impossible sur
		 * un rapport réel — il n'en sort que des constats que cette règle a
		 * produits — mais un appelant peut tenir un `Controle` fabriqué : la
		 * fonction rend alors la chaîne VIDE plutôt que de lever (le panneau
		 * tomberait sur un défaut de programmation) ou d'inventer une consigne
		 * (un texte que personne n'a écrit).
		 */
		remediation: (constat) =>
			estCleDe(PROSE_PAR_CHEMIN, constat.path) ? PROSE_PAR_CHEMIN[constat.path].remediation : '',
	},

	/**
	 * UN INDICE QU'AUCUNE SOURCE NE PRODUIT — et le même compteur, un cran plus
	 * haut, dit qu'une seule source est un goulot. UNE cause, DEUX seuils, jamais
	 * deux entrées : `0 → bloquant`, `1 → alerte`, `≥ 2 → silence`.
	 *
	 * POURQUOI CETTE RÈGLE PEUT ÊTRE BLOQUANTE alors qu'elle lit une clé
	 * d'audience `ia` (`savoirs[].indice_id`) : le critère n'est pas l'audience de
	 * la clé lue, c'est la NATURE DU GESTE qui éteint le voyant. Un voyant qu'on
	 * éteint en RÉDIGEANT de la prose n'est jamais bloquant ; un voyant qu'on
	 * éteint en POSANT UNE RÉFÉRENCE entre deux entités qui existent déjà peut
	 * l'être. Discriminant relisible : cette règle ne lit jamais une valeur comme
	 * de la prose (`includes`, `trim`, longueur), seulement comme une IDENTITÉ.
	 *
	 * LE `?? 0` N'EST PAS UNE COQUETTERIE : un indice absent de la carte n'a pas
	 * de tableau, et `undefined.length` ferait LEVER `controlerDossier`, qui se
	 * promet pure et totale au contrat.
	 */
	'indice-sans-source': {
		libelle: 'Indice sans source',
		niveaux: ['bloquant', 'alerte'],
		controler: (dossier) => {
			const producteurs = producteursParIndice(dossier)
			const constats: ConstatControle[] = []

			for (const [index, indice] of dossier.monde.indices.entries()) {
				const nombre = producteurs.get(indice.id)?.length ?? 0
				if (nombre >= 2) continue
				const niveau: SeuilIndice = nombre === 0 ? 'bloquant' : 'alerte'
				constats.push({
					niveau,
					section: 'indices',
					message: PROSES_INDICE_SANS_SOURCE[niveau].message,
					location: localiserEntite('indice', indice, index),
					path: 'monde.indices[].id',
					entityId: indice.id,
				})
			}

			return constats
		},
		remediation: (constat) =>
			estSeuilIndice(constat.niveau) ? PROSES_INDICE_SANS_SOURCE[constat.niveau].remediation : '',
	},

	/**
	 * LE LIEU DE DÉPART DÉSERT — la seule des cinq règles qui porte sur une
	 * COLLECTION et non sur ses éléments, et c'est ce qui lui vaut trois gardes
	 * quand les quatre autres sont des filtres qui se taisent d'eux-mêmes.
	 *
	 * SECTION `depart`, jamais `lieux` : `sections.ts` donne à `depart` la clé
	 * `charpente.depart`, racine exacte du chemin fautif — et router ce bloquant
	 * vers `lieux` allumerait un rouge sur une section où AUCUN geste ne
	 * l'éteint, cul-de-sac de navigation. Le `location` désigne pourtant bien un
	 * LIEU : `section` et `location` sont deux champs distincts, et c'est la
	 * troisième démonstration de KR-219 dans ce fichier.
	 */
	'depart-desert': {
		libelle: 'Lieu de départ désert',
		niveaux: ['bloquant'],
		controler: (dossier) => {
			// GARDE 1 — LA VACUITÉ, et c'est une nécessité LOGIQUE, pas une hygiène :
			// « désert » est un prédicat UNIVERSEL, et un prédicat universel sur
			// l'ensemble vide est VRAI. Sans elle, la règle se déclencherait sur tout
			// dossier neuf — un monde sans casting ne manque pas quelqu'un ICI, il
			// manque quelqu'un PARTOUT, et ce n'est pas ce que ce constat dit.
			if (dossier.monde.personnages.length === 0) return []

			// GARDE 2 — LA RÉFÉRENCE PENDANTE. Un départ qui ne résout aucun lieu est
			// une anomalie `error` du validateur, que le canal des contrôles ne doit pas
			// DOUBLER (KR-217/KR-225) ; et sans cette garde, `localiserEntite` rendrait
			// « Lieu n°0 (sans nom) » en production, sur un rang qui n'existe pas.
			const rang = dossier.monde.lieux.findIndex((lieu) => lieu.id === dossier.charpente.depart.lieu_id)
			if (rang === -1) return []

			// GARDE 3 — la comparaison elle-même.
			const habite = dossier.monde.personnages.some((personnage) =>
				(personnage.presence ?? []).some((presence) => presence.lieu_id === dossier.charpente.depart.lieu_id),
			)
			if (habite) return []

			return [
				{
					niveau: 'bloquant',
					section: 'depart',
					message: PROSE_DEPART_DESERT.message,
					location: localiserEntite('lieu', dossier.monde.lieux[rang], rang),
					path: 'charpente.depart.lieu_id',
					entityId: dossier.charpente.depart.lieu_id,
				},
			]
		},
		remediation: () => PROSE_DEPART_DESERT.remediation,
	},

	/**
	 * UN PERSONNAGE QUE RIEN NE PLACE — ALERTE et non bloquant : KR-224 (monde
	 * ouvert) porte sur l'EXISTENCE d'un chemin, et un autre chemin peut mener à
	 * ce personnage plus tard dans la partie. Le tour zéro, lui, n'a pas cette
	 * échappatoire : c'est toute la différence avec « lieu de départ désert ».
	 *
	 * NON BORNÉE À `portee === 'premier'` : `Personnage.portee` est le PLANCHER DU
	 * SCHÉMA, posé à `'premier'` par l'éditeur à la création et jamais une
	 * intention d'auteur — la borne serait inerte sur le dossier de quelqu'un qui
	 * n'a jamais touché ce champ.
	 */
	'personnage-sans-presence': {
		libelle: 'Personnage sans présence',
		niveaux: ['alerte'],
		controler: (dossier) => {
			const constats: ConstatControle[] = []

			for (const [index, personnage] of dossier.monde.personnages.entries()) {
				if ((personnage.presence ?? []).length > 0) continue
				constats.push({
					niveau: 'alerte',
					section: 'personnages',
					message: PROSE_PERSONNAGE_SANS_PRESENCE.message,
					location: localiserEntite('pnj', personnage, index),
					path: 'monde.personnages[].presence[].lieu_id',
					entityId: personnage.id,
				})
			}

			return constats
		},
		remediation: () => PROSE_PERSONNAGE_SANS_PRESENCE.remediation,
	},

	/**
	 * UN PERSONNAGE SANS VOIX PROPRE — la première règle de niveau `info` du
	 * registre, et le mot était posé depuis l'itération 2 sans producteur.
	 *
	 * « ABSENT N'EST PAS VIDE » (KR-221) : le voyant se lit sur la PRÉSENCE de
	 * répliques, jamais sur la valeur d'un curseur. `CURSEURS_INITIAUX` pose les
	 * six curseurs au PLANCHER, si bien qu'un bloc `caractere` présent et tout en
	 * bas est INDISTINGUABLE d'un réglage délibéré — fonder un constat sur une de
	 * ces valeurs serait signaler comme non réglé ce qu'un auteur a réglé.
	 * `caractere` absent et `parler` vide se valent donc ici, et rien d'autre
	 * n'est lu.
	 */
	'personnage-sans-voix': {
		libelle: 'Personnage sans voix propre',
		niveaux: ['info'],
		controler: (dossier) => {
			const constats: ConstatControle[] = []

			for (const [index, personnage] of dossier.monde.personnages.entries()) {
				if ((personnage.caractere?.parler ?? []).length > 0) continue
				constats.push({
					niveau: 'info',
					section: 'personnages',
					message: PROSE_PERSONNAGE_SANS_VOIX.message,
					location: localiserEntite('pnj', personnage, index),
					path: 'monde.personnages[].caractere.parler[]',
					entityId: personnage.id,
				})
			}

			return constats
		},
		remediation: () => PROSE_PERSONNAGE_SANS_VOIX.remediation,
	},
})

/** L'union des identifiants de règle, DÉRIVÉE du registre — jamais re-listée (KR-117). */
export type ControleId = keyof typeof CONTROLES

export interface RapportControles {
	/** Les constats, dans l'ordre du registre puis de chaque règle. Aucune vue ne trie. */
	controles: readonly Controle[]
	/**
	 * L'aventure peut-elle être jouée ? Dérivé ICI ET NULLE PART AILLEURS : une
	 * vue qui recalculerait « pas de bloquant » en ferait une seconde règle de
	 * jouabilité (KR-013). Calculé à chaque rendu, jamais stocké.
	 */
	jouable: boolean
	/**
	 * Le niveau LE PLUS GRAVE par section, `null` quand la section est calme.
	 * `Record` TOTAL construit depuis `SECTIONS` : un `Partial` obligerait chaque
	 * appelant à écrire `?? null` — deux silences indistinguables — et une
	 * onzième section n'échouerait plus à la compilation.
	 */
	parSection: Record<SectionId, NiveauControle | null>
}

/**
 * La GRAVITÉ comparée des trois niveaux — `Record` total, donc exhaustif par
 * compilation : un quatrième mot dans `NiveauControle` ne compile pas tant qu'il
 * n'a pas son rang. Jamais un `if (niveau === …)` en cascade.
 */
const GRAVITE: Record<NiveauControle, number> = { bloquant: 0, alerte: 1, info: 2 }

/** Le plus grave des deux, la section calme (`null`) cédant devant tout constat. */
function plusGrave(actuel: NiveauControle | null, candidat: NiveauControle): NiveauControle {
	if (actuel === null) return candidat
	return GRAVITE[candidat] < GRAVITE[actuel] ? candidat : actuel
}

/**
 * LE RAPPORT de contrôles d'un dossier. Pure, totale et synchrone : aucune
 * lecture de persistance, aucun appel de modèle, aucun cache — elle se rappelle
 * à chaque rendu.
 */
export function controlerDossier(dossier: Dossier): RapportControles {
	const controles: Controle[] = []
	// Balayé depuis le registre, jamais N appels nommés : une règle de plus est
	// une entrée de plus, zéro modification ici.
	for (const id of Object.keys(CONTROLES) as ControleId[]) {
		for (const constat of CONTROLES[id].controler(dossier)) controles.push({ ...constat, id })
	}

	// Les dix sections, dans l'ordre du registre, toutes calmes au départ — c'est
	// `SECTIONS` qui décide de l'ensemble des clés, jamais une liste recopiée.
	const parSection = Object.fromEntries(SECTIONS.map((section) => [section.id, null])) as Record<
		SectionId,
		NiveauControle | null
	>
	for (const controle of controles) {
		parSection[controle.section] = plusGrave(parSection[controle.section], controle.niveau)
	}

	return { controles, jouable: controles.every((controle) => controle.niveau !== 'bloquant'), parSection }
}

/**
 * La ligne QUOI FAIRE d'un contrôle donné. Le consommateur appelle CETTE
 * fonction et n'a jamais à connaître le registre ni l'identifiant de la règle :
 * ajouter une règle demain ne touchera aucun site d'appel (Open/Closed, KR-117).
 * Même geste que `dossierIssueRemediation` pour les anomalies du validateur.
 */
export function controleRemediation(controle: Controle): string {
	return CONTROLES[controle.id].remediation(controle)
}
