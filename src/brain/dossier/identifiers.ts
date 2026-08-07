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

/**
 * Factory d'IDENTITÉ — elle épingle chaque valeur à `V` tout en INFÉRANT l'union
 * des clés `K`, de sorte que l'union dérivée par `keyof typeof` n'est jamais une
 * seconde liste à tenir en phase (KR-117).
 *
 * TROISIÈME APPELANT (`ESPACES_DE_NOMS`, `PREDICATES`, `DELTAS`) : elle était
 * recopiée dans `predicates.ts`, dont la docstring avait elle-même écrit
 * « Extraction au troisième ». C'est maintenant. Elle vit ICI, dans le module
 * bas, parce que c'est le seul que les trois registres importent déjà.
 */
export const defineRegistre =
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

export const ESPACES_DE_NOMS = defineRegistre<EspaceDeNomsDescripteur>()({
	pnj: { label: 'Personnage' },
	lieu: { label: 'Lieu' },
	objet: { label: 'Objet' },
	indice: { label: 'Indice' },
	quete: { label: 'Quête' },
	objectif: { label: 'Objectif' },
	jalon: { label: 'Jalon' },
	fin: { label: 'Fin' },
	/**
	 * Le OÙ d'une anomalie portée par `monde.evenements[].monstre_ref` : l'entité
	 * résolue est l'ÉVÉNEMENT, jamais le monstre — celui-ci n'existe pas dans le
	 * dossier, il vit dans le bestiaire du jeu.
	 */
	evenement: { label: 'Événement' },
	climat: { label: 'Climat' },
	/**
	 * Second espace de noms, résolu contre le BESTIARY et non contre une
	 * collection du dossier : `evenements[].monstre_ref` pointe
	 * `bestiaire.<templateId>`. Il n'a donc PAS de ligne dans
	 * `COLLECTIONS_IDENTIFIEES` — rien ne le porte dans le document.
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
 * Elle sert DEUX lectures : le relevé des identifiants (`collectIds`) et, dans le
 * validateur, la résolution du OÙ de toute anomalie portée par un champ vivant
 * SOUS l'une de ces collections — un `savoirs[].indice_id` vide est signalé sur
 * « Personnage « Aldûr le Sage » », parce que `monde.personnages` est ici.
 *
 * `bestiaire` n'y figure pas : c'est un espace de noms de RÉFÉRENCE, résolu
 * contre le bestiaire du jeu, et aucune collection du dossier ne le porte.
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
	{ path: 'monde.evenements', espace: 'evenement' },
	{ path: 'monde.conditions.climat', espace: 'climat' },
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

/**
 * L'appartenance PROPRE à un registre — jamais l'opérateur `in`, qui remonte la
 * CHAÎNE DE PROTOTYPES.
 *
 * Le défaut que cette fonction existe pour interdire (BUG-053) : tout registre
 * écrit comme un littéral d'objet ou construit par `Object.fromEntries` hérite
 * d'`Object.prototype`, donc `'toString' in PREDICATES` vaut `true` et le
 * descripteur qu'on en tire est une FONCTION. Le garde laissait passer, puis le
 * code d'après lisait `.refKinds` ou appelait `.includes` sur elle — et un
 * validateur qui se promet TOTAL levait une exception, sur une valeur venue tout
 * droit du fichier de l'auteur.
 *
 * Elle vit ici, avec `estObjet`, parce que c'est la même famille : un lecteur
 * défensif d'un document que personne n'a encore validé (KR-116). Tout registre
 * indexé par une valeur non fiable doit passer par elle.
 */
export function estCleDe(registre: object, cle: string): boolean {
	return Object.prototype.hasOwnProperty.call(registre, cle)
}

/**
 * Une valeur non fiable, rendue LISIBLE dans une phrase française. Jamais
 * `String(valeur)` nu : sur un champ absent il écrirait « undefined » dans le
 * message, ce que KR-164 interdit.
 *
 * TROISIÈME APPELANT (`validate.ts`, `expr.ts`, `deltas.ts`) — même seuil, même
 * geste que `defineRegistre` : elle était recopiée dans `expr.ts`, avec un motif
 * qui tenait tant qu'il n'y avait que deux copies (`validate.ts` est EN AVAL,
 * l'importer serait un cycle). Le troisième registre annule ce motif : l'arête
 * vers `identifiers.ts` existe déjà partout.
 */
export function decrireValeur(valeur: unknown): string {
	if (typeof valeur === 'string') return valeur.trim() === '' ? 'vide' : valeur
	if (typeof valeur === 'number' || typeof valeur === 'boolean') return String(valeur)
	if (Array.isArray(valeur)) return 'une liste'
	if (estObjet(valeur)) return 'un objet'
	return 'vide'
}

/**
 * La FEUILLE d'un chemin pointé — ce que le message d'anomalie appelle « le
 * champ », et ce que `{champ}` résout dans la ligne QUOI FAIRE.
 *
 * L'indice de tableau est retiré : `monde.evenements[3].monstre_ref` donne
 * `monstre_ref`, `charpente.jalons[0]` donne `jalons`. Sans cela, la consigne
 * « Corrigez « {champ} » » nommerait un rang plutôt qu'un champ.
 *
 * Elle vit ICI, dans le module bas, et non dans le validateur : `issues.ts` en a
 * besoin, et `validate.ts` importe déjà `issues.ts` — l'y laisser serait un cycle.
 */
export function feuilleDe(path: string): string {
	const dernier = path.lastIndexOf('.')
	const feuille = dernier === -1 ? path : path.slice(dernier + 1)
	return feuille.replace(/\[\d+\]$/, '')
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
