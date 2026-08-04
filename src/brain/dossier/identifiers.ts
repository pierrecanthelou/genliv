/**
 * Les IDENTIFIANTS du dossier — leur espace de noms, leur forme, leur unicité.
 *
 * Toute référence du dossier (personnage, lieu, objet, indice, quête, objectif,
 * jalon, fin, entrée du bestiaire) se fait par identifiant STABLE, jamais par
 * nom. L'identifiant porte son espace de noms en préfixe, ce qui rend une
 * référence lisible à l'œil (`lieu.val-cendre`) et vérifiable par le code sans
 * connaître le champ porteur.
 *
 * `ESPACES_DE_NOMS` est un `Record` FERMÉ (KR-117) : il est la source unique de
 * l'ensemble des espaces ET du libellé français qui nomme le type d'entité dans
 * le rapport d'anomalie. L'union `EspaceDeNoms` en est dérivée par `keyof typeof`,
 * donc il n'existe pas d'union parallèle à tenir en phase.
 */

/** Identity factory: pins each value to `V` while inferring the key union `K`. */
const defineEspaces =
	<V>() =>
	<K extends string>(map: Record<K, V>): Record<K, V> =>
		map

export interface EspaceDeNomsDescripteur {
	/**
	 * Le libellé français SINGULIER du type d'entité — le OÙ du rapport
	 * d'anomalie : « Personnage « Aldûr le Sage » », repli « Personnage n°4
	 * (sans nom) ».
	 */
	label: string
}

export const ESPACES_DE_NOMS = defineEspaces<EspaceDeNomsDescripteur>()({
	pnj: { label: 'Personnage' },
	lieu: { label: 'Lieu' },
	objet: { label: 'Objet' },
	indice: { label: 'Indice' },
	quete: { label: 'Quête' },
	objectif: { label: 'Objectif' },
	jalon: { label: 'Jalon' },
	fin: { label: 'Fin' },
	/**
	 * Second espace de noms, résolu contre le BESTIARY et non contre une
	 * collection du dossier : `evenements[].monstre_ref` pointe
	 * `bestiaire.<templateId>`. Déclaré ici dès l'itération 1 pour que la forme
	 * soit fermée ; sa résolution arrive avec `evenements` (itération 2/4).
	 */
	bestiaire: { label: 'Monstre' },
})

export type EspaceDeNoms = keyof typeof ESPACES_DE_NOMS

/** Les espaces de noms, dans l'ordre du registre — dérivés, jamais re-listés. */
const ESPACES = Object.keys(ESPACES_DE_NOMS) as EspaceDeNoms[]

/**
 * La forme d'un identifiant : un préfixe CONNU, un point, puis des minuscules,
 * des chiffres et des tirets. Ni majuscule, ni accent, ni espace — un
 * identifiant se tape, se compare et se cherche, il ne se lit pas.
 */
export const FORME_IDENTIFIANT = new RegExp(`^(${ESPACES.join('|')})\\.[a-z0-9-]+$`)

/**
 * Un identifiant est bien formé quand il respecte la forme générale ET qu'il
 * porte l'espace de noms ATTENDU à son emplacement : un `lieu.…` rangé dans
 * `monde.personnages` est aussi fautif qu'un préfixe inconnu.
 */
export function estIdentifiantBienForme(id: string, espace: EspaceDeNoms): boolean {
	return FORME_IDENTIFIANT.test(id) && id.startsWith(`${espace}.`)
}

/**
 * Une collection d'entités identifiées du dossier : où elle vit, et quel espace
 * de noms ses entrées doivent porter. Table DÉCLARATIVE — ajouter une collection
 * en itération 2 est une ligne, pas une branche de plus dans le validateur.
 *
 * `monde.evenements` et `monde.conditions` n'y figurent pas : leur forme n'est
 * pas arbitrée à l'itération 1 et aucun espace de noms ne leur correspond.
 */
export interface CollectionIdentifiee {
	/** Chemin JSON de la collection, depuis la racine du dossier. */
	path: string
	espace: EspaceDeNoms
}

export const COLLECTIONS_IDENTIFIEES: readonly CollectionIdentifiee[] = [
	{ path: 'canon.objectifs', espace: 'objectif' },
	{ path: 'monde.personnages', espace: 'pnj' },
	{ path: 'monde.lieux', espace: 'lieu' },
	{ path: 'monde.objets', espace: 'objet' },
	{ path: 'monde.indices', espace: 'indice' },
	{ path: 'monde.quetes', espace: 'quete' },
	{ path: 'charpente.jalons', espace: 'jalon' },
	{ path: 'charpente.fins', espace: 'fin' },
]

/** Une entité relevée dans le dossier, avec de quoi la NOMMER dans un rapport. */
export interface IdentifiantCollecte {
	/** L'identifiant écrit dans le fichier ; `null` s'il est absent, vide ou non textuel. */
	id: string | null
	espace: EspaceDeNoms
	/** Chemin JSON stable de l'identifiant, ex. `monde.lieux[2].id`. */
	path: string
	/** OÙ — « Personnage « Aldûr le Sage » » ou le repli « Personnage n°4 (sans nom) ». */
	location: string
}

/**
 * Les deux LECTEURS DÉFENSIFS du document non fiable, partagés avec le
 * validateur. Le document sort d'un `JSON.parse` : il est typé par personne tant
 * qu'il n'est pas validé, et toute lecture doit rester totale (KR-116).
 */
export function estObjet(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Descend un chemin pointé dans une valeur non fiable, sans jamais lever. */
export function resoudreChemin(racine: unknown, path: string): unknown {
	let courant: unknown = racine
	for (const segment of path.split('.')) {
		if (!estObjet(courant)) return undefined
		courant = courant[segment]
	}
	return courant
}

/**
 * Le OÙ d'une entité : son nom quand elle en porte un, sinon le repli indexé.
 * Le repli existe précisément parce que `nom` est optionnel — une entité en
 * cours de rédaction reste désignable.
 */
export function localiserEntite(espace: EspaceDeNoms, entite: unknown, index: number): string {
	const label = ESPACES_DE_NOMS[espace].label
	const nom = estObjet(entite) ? entite.nom : undefined
	if (typeof nom === 'string' && nom.trim() !== '') return `${label} « ${nom.trim()} »`
	return `${label} n°${index + 1} (sans nom)`
}

/**
 * Relève TOUTES les entités identifiées du dossier, une entrée par entité —
 * y compris celles dont l'identifiant manque ou n'est pas textuel, pour que le
 * validateur puisse les nommer plutôt que de les ignorer.
 *
 * Total et pur : l'entrée est `unknown` (frontière de confiance, KR-116), aucune
 * forme n'est supposée, rien ne lève.
 */
export function collectIds(dossier: unknown): IdentifiantCollecte[] {
	const collectes: IdentifiantCollecte[] = []
	for (const { path, espace } of COLLECTIONS_IDENTIFIEES) {
		const collection = resoudreChemin(dossier, path)
		if (!Array.isArray(collection)) continue
		collection.forEach((entite, index) => {
			const brut = estObjet(entite) ? entite.id : undefined
			const id = typeof brut === 'string' && brut.trim() !== '' ? brut : null
			collectes.push({
				id,
				espace,
				path: `${path}[${index}].id`,
				location: localiserEntite(espace, entite, index),
			})
		})
	}
	return collectes
}

/**
 * Les identifiants portés par PLUS D'UNE entité. Renvoyé comme un ensemble : le
 * validateur signale ensuite CHAQUE occurrence, de sorte que les deux entités en
 * conflit soient nommées — signaler la seconde seulement laisserait l'auteur
 * chercher la première.
 */
export function identifiantsDupliques(collectes: readonly IdentifiantCollecte[]): Set<string> {
	const vus = new Set<string>()
	const dupliques = new Set<string>()
	for (const { id } of collectes) {
		if (id === null) continue
		if (vus.has(id)) dupliques.add(id)
		else vus.add(id)
	}
	return dupliques
}
