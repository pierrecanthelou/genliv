import { AMORCE, MARQUEUR_A_ECRIRE } from './amorce'
import { defineRegistre, estCleDe } from './identifiers'
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
	/** OÙ — le repère que l'auteur cherche en premier, en capitales. */
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
 * LE REGISTRE DES RÈGLES — fermé, une entrée par CAUSE, jamais par emplacement
 * ni par niveau. Scinder « amorce non rédigée » en deux entrées parce qu'elle
 * émet deux niveaux obligerait à scinder aussi les règles à venir qui portent
 * une cause unique sur cinq sections : deux codes pour une cause, KR-164 en sens
 * inverse.
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
