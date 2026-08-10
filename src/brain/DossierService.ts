import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import { dossierKey, DOSSIER_KEY_PREFIX } from './persistenceKeys'
import type { Dossier } from './dossier/types'
import type { DossierIssue } from './dossier/issues'
import { inspectDossierFile, type DossierInspection } from './dossier/read'
import { validateDossier } from './dossier/validate'
import { construireAmorce } from './dossier/amorce'
import { randomToken } from './utils/id'

/**
 * Le RÉSUMÉ de bibliothèque d'un dossier — ce que l'accueil affiche par carte,
 * et RIEN de plus. Union DISCRIMINÉE sur `lisible` : la branche illisible ne
 * porte PAS de `titre`, de sorte qu'une carte ne puisse pas en lire un qui
 * n'existe pas — c'est le typage qui l'interdit, pas une convention de rendu.
 *
 * AUCUN champ dérivé du CONTENU (nombre de personnages, de lieux, d'objectifs) :
 * compter imposerait un `get` par carte, donc une re-validation complète de
 * chaque dossier à chaque rendu de l'accueil. Les compteurs sont ceux des
 * SECTIONS, lus dans l'écran d'édition (n° 2, itération 3).
 */
export type DossierResume =
	| { id: string; lisible: true; titre: string; updatedAt: string }
	| { id: string; lisible: false }

/**
 * Le CORPS d'un dossier — les TROIS racines de contenu, et rien d'autre. C'est ce
 * qu'une recette d'écriture rend à `update()`.
 *
 * Son étroitesse EST le contrat : `schema`, `id`, `createdAt` et `titre` n'en font
 * pas partie, donc une recette ne peut pas prétendre les changer, et `updatedAt`
 * non plus — il est frappé par le service. Une recette qui les renverrait quand
 * même (par un `as`) les verrait ignorés : l'enveloppe est recomposée CHAMP PAR
 * CHAMP depuis le document stocké, jamais par un étalement de la recette.
 */
export type CorpsDossier = Pick<Dossier, 'canon' | 'monde' | 'charpente'>

/**
 * L'ISSUE d'une écriture — union DISCRIMINÉE sur `statut`, de sorte qu'aucun
 * appelant ne puisse lire un dossier qui n'a pas été écrit ni des `errors` sur une
 * écriture réussie : c'est le typage qui l'interdit, pas une convention de rendu.
 *
 * TROIS branches, et pas une de plus :
 *  · `absent` — rien de LISIBLE sous cet identifiant. Ce n'est pas une anomalie de
 *    CONTENU : le registre `DossierIssue` est fermé par CAUSE (KR-164) et « ce
 *    dossier n'existe pas » est une cause de MAGASIN, que le validateur ne peut pas
 *    produire. La recette n'est alors JAMAIS appelée.
 *  · `refuse` — le candidat porte des `errors` : rien n'est persisté, rien n'est
 *    émis. Les `warnings` accompagnent quand même le refus — sinon l'auteur
 *    corrigerait son erreur pour découvrir l'avertissement au coup d'après.
 *  · `ecrit` — le dossier persisté (le clone GELÉ rendu par le validateur) et ses
 *    `warnings`, qui ne bloquent JAMAIS (KR-165) mais que l'appelant doit RENDRE :
 *    un avertissement que personne n'affiche est la même panne qu'un no-op muet,
 *    juste plus tardive.
 */
export type EcritureDossier =
	| { statut: 'absent' }
	| { statut: 'refuse'; errors: DossierIssue[]; warnings: DossierIssue[] }
	| { statut: 'ecrit'; dossier: Dossier; warnings: DossierIssue[] }

/**
 * DossierService — le seul point d'entrée du dossier d'aventure dans
 * l'application. HUIT méthodes : les quatre de la n° 1, `list` et `remove` que la
 * bibliothèque repointée câble (n° 2, itération 1), `create` que la création
 * repointée appelle (n° 2, itération 2), et `update` — le premier chemin
 * d'ÉCRITURE du dossier — que le formulaire de canon appelle (n° 3, itération 1).
 * `rename` et `duplicate` restent dehors tant que personne ne les appelle — un
 * service dont la moitié des méthodes n'est exercée par personne est de la dette,
 * pas un contrat.
 *
 * Il est ADDITIF : il vit sous ses propres clés (`genliv:dossier:`), ne lit ni
 * n'écrit aucun `Book`, et AUCUNE de ses fonctions ne convertit un `Book` en
 * `Dossier` ni l'inverse (KR-167).
 *
 * Trois invariants portent le reste :
 *  · `get` RE-VALIDE toujours et ne rend JAMAIS le brut du magasin. L'adoption
 *    cloud écrit derrière le service ; sans re-validation à la lecture, un
 *    document ni gelé ni validé entrerait dans l'application sans qu'un seul
 *    test rougisse.
 *  · La PRÉSENCE d'un dossier se constate par la CLÉ, jamais par `get` (BUG-048 /
 *    KR-179) — « présent » et « lisible » sont deux questions disjointes, et les
 *    confondre laisse un import écraser un document qu'un resserrement de schéma
 *    vient de rendre illisible.
 *  · Les événements partent APRÈS résolution de la persistance, dans l'ordre
 *    (KR-004) : un abonné à `dossier:created` trouve toujours le dossier déjà
 *    dans le magasin, un abonné à `dossier:deleted` ne l'y trouve déjà plus.
 */
export interface DossierService {
	/**
	 * Sème un dossier VALIDE au sens de `validateDossier` — jamais un document que
	 * le validateur refuserait lui-même à la relecture (KR-178) : sa forme vient de
	 * `construireAmorce` (`dossier/amorce.ts`), dérivée des tables du validateur.
	 *
	 * Le titre est `trim()`é ; vide, il retombe sur `TITRE_PAR_DEFAUT` — le service
	 * ne dépend pas de la garde du dialogue de création, qui vit dans une feature
	 * et pourrait disparaître avec elle.
	 *
	 * Persiste PUIS émet `dossier:created` (KR-004). N'OUVRE PAS et NE NAVIGUE PAS :
	 * `dossier:opened` appartient à `open()`, et c'est l'appelant qui enchaîne les
	 * deux, dans l'ordre — un `create` qui ouvrirait empêcherait de semer un dossier
	 * sans y aller.
	 */
	create(titre: string): Dossier
	/** Le dossier persisté, RE-VALIDÉ et gelé — `null` si absent ou non conforme. */
	get(id: string): Dossier | null
	/**
	 * Le PREMIER chemin d'écriture du dossier. CINQ temps, dans cet ordre, et
	 * l'ordre EST le contrat :
	 *
	 *  1. `get(id)` — le document RE-VALIDÉ et gelé, jamais le brut du magasin
	 *     (KR-116). Rien de lisible sous cet identifiant ⇒ `{statut:'absent'}`, et
	 *     la `recette` n'est PAS appelée : elle recevrait un dossier qui n'existe
	 *     pas.
	 *  2. `recette(dossier)` — l'appelant rend les trois racines de contenu, à
	 *     partir du dossier GELÉ qu'il reçoit : il clone, il ne mute pas (KR-166).
	 *  3. la recomposition de l'ENVELOPPE, champ par champ : `schema`, `id`,
	 *     `createdAt` et `titre` viennent du document STOCKÉ, `updatedAt` est frappé
	 *     ici. Jamais un étalement de la recette — c'est ce qui rend impossible
	 *     qu'un appelant réécrive l'identité du dossier, ou antidate `updatedAt`,
	 *     qui est le champ de comparaison de la réconciliation cloud (dernier écrit
	 *     gagne) : une écriture antidatée se ferait écraser par une copie distante
	 *     plus ancienne, sans qu'une seule anomalie soit levée.
	 *  4. `validateDossier(candidat)` AVANT toute écriture. `errors` non vide ⇒
	 *     `{statut:'refuse'}` : RIEN n'est persisté, RIEN n'est émis.
	 *  5. persiste le CLONE GELÉ rendu par le validateur — jamais l'objet recomposé
	 *     ici — PUIS émet `dossier:updated` (KR-004).
	 *
	 * Ce que l'auteur voit à l'écran n'est PAS ramené à la valeur persistée en cas
	 * de refus : le service ne rend aucune consigne de revert, il rend les
	 * anomalies. La divergence écran/dossier est alors explicite (l'appelant la
	 * montre) plutôt que silencieuse.
	 */
	update(id: string, recette: (dossier: Dossier) => CorpsDossier): EcritureDossier
	/**
	 * Tous les dossiers persistés, énumérés par CLÉ et jamais par validité : un
	 * document devenu illisible reste LISTÉ (`lisible: false`), pour que l'auteur
	 * le voie et puisse le supprimer, plutôt que de disparaître en silence.
	 * Trié illisibles d'abord, puis `updatedAt` décroissant (égalité par `id`).
	 */
	list(): DossierResume[]
	/** Signale l'ouverture d'un dossier : arme la réconciliation cloud (KR-163). */
	open(id: string): void
	/** Lit un fichier, le valide, et l'importe s'il est conforme et pas déjà présent. */
	importDossier(fileText: string): DossierInspection
	/** Le document à écrire dans un fichier — re-validé, jamais le brut du magasin. */
	exportDossier(id: string): Dossier | null
	/**
	 * Supprime définitivement un dossier — y compris un dossier ILLISIBLE, dont
	 * l'identifiant resterait sinon occupé pour toujours. Retire la clé PUIS émet
	 * `dossier:deleted` (KR-004). Rend `true` si une clé a été retirée.
	 *
	 * ⚠ DETTE ÉPINGLÉE, PAS CORRIGÉE (KR-182) : la suppression ne va pas plus loin
	 * que le magasin LOCAL. `CloudSyncService.remove()` n'efface aucune clé
	 * distante et ne retire rien de la file de poussée — une écriture déjà en file
	 * REPUBLIE le document supprimé. Dette héritée, identique pour
	 * `BookService.deleteBook` depuis toujours ; un test de `DossierService.test.ts`
	 * en épingle le comportement actuel, pour qu'une suppression cloud soit un jour
	 * une décision et non une découverte.
	 */
	remove(id: string): boolean
}

/**
 * Le titre d'un dossier semé sans titre. Il ne peut pas être vide : `titre` est un
 * CHAMP_REQUIS (`dossier/tables.ts`), donc un dossier titré `''` serait refusé par
 * le validateur à la première relecture.
 *
 * ⚠ VALEUR NON ARBITRÉE par le comité de raffinage : le plan d'itération NOMME
 * cette constante (§ 4) mais n'en écrit jamais le texte — le contrat de design (§ 3)
 * ne couvre que la copie du dialogue de création. Elle est INATTEIGNABLE depuis
 * l'interface de cette itération (« Créer » reste désactivé tant que le titre trimé
 * est vide) : c'est une garde de TOTALITÉ du service, pas une copie d'écran. Elle
 * est écrite ici, privée et à un seul appelant, pour qu'une décision d'UX se réduise
 * à changer cette ligne.
 */
const TITRE_PAR_DEFAUT = 'Dossier sans titre'

/**
 * L'anomalie de MAGASIN — la seule que le validateur ne peut pas produire, parce
 * qu'il est pur et ignorant de la bibliothèque. Elle vit donc ici, au seul
 * endroit qui voit à la fois le fichier et ce qui est déjà importé.
 *
 * UN code, DEUX messages. La CAUSE est « cet identifiant est déjà occupé » ; la
 * lisibilité de l'occupant est une propriété de l'occupant, pas une seconde
 * cause — et la doctrine du registre est un code par CAUSE (`issues.ts`). Un
 * neuvième code coûterait l'union, le libellé, les décomptes de `validate.test.ts`,
 * pour un gain nul : la remédiation, elle, est désormais la MÊME dans les deux
 * cas (supprimer l'occupant depuis la bibliothèque, ou changer le champ `id`).
 */
function anomalieDejaImporte(id: string, occupant: Dossier | null): DossierIssue {
	return {
		code: 'dossier-deja-importe',
		severity: 'error',
		message:
			occupant === null
				? 'Un dossier illisible occupe déjà cet identifiant.'
				: `Un dossier portant cet identifiant est déjà dans votre bibliothèque : « ${occupant.titre} ».`,
		// OÙ : l'occupant résolu par son nom quand il en a un ; sinon par le seul
		// repère qu'il porte encore, son identifiant — celui-là même que la carte
		// « Dossier illisible » affiche à l'auteur.
		location: occupant === null ? `Dossier « ${id} »` : `Dossier « ${occupant.titre} »`,
		entityId: id,
		path: 'id',
	}
}

/**
 * L'ordre de la bibliothèque. Les ILLISIBLES D'ABORD : ce sont les seules cartes
 * qui demandent un geste, et une anomalie enterrée en bas de liste est une
 * anomalie qu'on n'a pas signalée. Puis `updatedAt` DÉCROISSANT — le dernier
 * travail de l'auteur en tête. Égalité départagée par `id`, ce qui donne aussi
 * son ordre à la tête de liste : deux illisibles n'ont pas de date à comparer,
 * et deux rendus successifs doivent montrer la même liste.
 */
/**
 * Le FRAPPEUR d'identifiant de dossier — privé, jamais exporté, un seul appelant
 * (`create`). Exporté, il inviterait un second site de frappe, et deux frappeurs
 * pour un même espace de clés finissent toujours par diverger.
 *
 * `randomToken()` et jamais `createId()` : le préfixe et son séparateur `_` du
 * second sont refusés par `FORME_ID_DOSSIER` (`dossier/validate.ts`) — un
 * identifiant de dossier n'est pas un identifiant d'entité, il devient TEL QUEL
 * une clé de stockage via `dossierKey()`, d'où sa forme plus stricte (minuscules,
 * chiffres, tirets).
 */
function createDossierId(): string {
	return randomToken()
}

function comparerResumes(a: DossierResume, b: DossierResume): number {
	if (a.lisible !== b.lisible) return a.lisible ? 1 : -1
	if (a.lisible && b.lisible) {
		const parDate = b.updatedAt.localeCompare(a.updatedAt)
		if (parDate !== 0) return parDate
	}
	return a.id.localeCompare(b.id)
}

export function createDossierService(persistence: PersistenceService, events: EventBus): DossierService {
	function get(id: string): Dossier | null {
		const brut = persistence.get<unknown>(dossierKey(id))
		if (brut === null) return null
		// Le magasin est une frontière de confiance (KR-116) : un document corrompu,
		// ou écrit derrière le service par l'adoption cloud, ne ressort jamais tel quel.
		return validateDossier(brut).dossier
	}

	/**
	 * L'identifiant est-il OCCUPÉ ? Question de PRÉSENCE, jamais de lisibilité
	 * (BUG-048 / KR-179). Elle se pose à la CLÉ elle-même — pas à `get`, qui
	 * re-valide, ni à `persistence.get`, qui rend déjà `null` sur un contenu que
	 * `JSON.parse` refuse. Les trois divergent exactement là où ça compte : sur un
	 * document rangé sous cette clé et devenu illisible. Une clé occupée par un
	 * illisible reste occupée — l'import ne l'écrase pas, `remove` la libère.
	 *
	 * `list` NE L'APPELLE PAS — elle ré-énumère `persistence.keys` avec son propre
	 * filtre `:` (les clés de contenu/image, n° 3-4, ne sont pas des dossiers).
	 * L'invariant qui compte reste vrai sans prédicat partagé : un `id` de dossier
	 * ne contient jamais `:` (forme validée), donc tout ce que `list` rend est
	 * supprimable par `remove`, qui lui passe bien par `cleOccupee`.
	 */
	function cleOccupee(id: string): boolean {
		return persistence.keys(DOSSIER_KEY_PREFIX).includes(dossierKey(id))
	}

	/** Le résumé d'une clé : la PRÉSENCE vient de la clé, la LISIBILITÉ de `get`. */
	function resume(id: string): DossierResume {
		const dossier = get(id)
		if (dossier === null) return { id, lisible: false }
		return { id, lisible: true, titre: dossier.titre, updatedAt: dossier.updatedAt }
	}

	return {
		create(titre: string): Dossier {
			const now = new Date().toISOString()
			const propre = titre.trim()
			// Le titre vide ne peut PAS traverser : `titre` est un CHAMP_REQUIS, un
			// dossier semé sans titre serait refusé par le validateur à la relecture.
			const dossier = construireAmorce(createDossierId(), propre === '' ? TITRE_PAR_DEFAUT : propre, now)
			// La persistance d'abord, l'événement ensuite (KR-004) : un abonné à
			// `dossier:created` trouve le dossier DÉJÀ dans le magasin — c'est ce qui
			// permet à l'appelant d'enchaîner `open()` sans fenêtre de course.
			persistence.set(dossierKey(dossier.id), dossier)
			events.emit('dossier:created', { dossierId: dossier.id })
			// Le document tel que semé, non gelé : le gel en profondeur n'a qu'un seul
			// site d'appel légitime, la sortie de `validateDossier` (KR-166), et c'est
			// par là que passe la relecture (`get`).
			return dossier
		},

		get,

		update(id: string, recette: (dossier: Dossier) => CorpsDossier): EcritureDossier {
			const actuel = get(id)
			// Rien de lisible : la recette n'est même pas appelée. Elle recevrait un
			// dossier qui n'existe pas, et l'appelant recomposerait un document neuf
			// sous une clé libre — un `update` ne CRÉE jamais (c'est `create`).
			if (actuel === null) return { statut: 'absent' }

			const corps = recette(actuel)

			// L'ENVELOPPE, champ par champ. JAMAIS `{ ...corps }` ni `{ ...actuel, ...corps }` :
			// le premier laisserait une recette réécrire l'identité du dossier, le second
			// laisserait passer TOUTE clé surnuméraire qu'elle rendrait. Ici, ce que la
			// recette ne peut pas nommer n'entre pas, et ce qu'elle nomme quand même
			// (par un `as`) n'est simplement pas lu.
			const candidat: Dossier = {
				schema: actuel.schema,
				id: actuel.id,
				titre: actuel.titre,
				createdAt: actuel.createdAt,
				// Frappé par le SERVICE, jamais par l'appelant : c'est le champ que la
				// réconciliation cloud compare (dernier écrit gagne).
				updatedAt: new Date().toISOString(),
				canon: corps.canon,
				monde: corps.monde,
				charpente: corps.charpente,
			}

			const validation = validateDossier(candidat)
			// `dossier` est non nul SI ET SEULEMENT SI `errors` est vide (contrat de
			// `DossierValidation`) : le tester LUI dit la même chose que tester la
			// longueur du tableau, et le dit aussi au compilateur — aucun `as` ne vient
			// affirmer ce que le garde était censé vérifier (KR-175).
			if (validation.dossier === null) {
				return { statut: 'refuse', errors: validation.errors, warnings: validation.warnings }
			}

			// On persiste le CLONE GELÉ du validateur, jamais `candidat` : `deepFreeze`
			// garde son site d'appel unique (KR-166), et « ce document a-t-il été
			// validé ? » reste décidable — un objet gelé ailleurs rendrait la question
			// indécidable. La persistance d'abord, l'événement ensuite (KR-004) : un
			// abonné à `dossier:updated` relit un magasin DÉJÀ à jour.
			persistence.set(dossierKey(id), validation.dossier)
			events.emit('dossier:updated', { dossierId: id })
			return { statut: 'ecrit', dossier: validation.dossier, warnings: validation.warnings }
		},

		list(): DossierResume[] {
			return (
				persistence
					.keys(DOSSIER_KEY_PREFIX)
					// `:` est RÉSERVÉ dans cet espace de clés (`persistenceKeys.ts`) au
					// découpage à venir — `dossierContentKey` / `dossierImageKey`, n° 3 et
					// n° 4. Une clé de contenu ou d'image n'est pas un dossier de plus dans
					// la bibliothèque : sans ce filtre, le premier porteur d'illustration
					// ferait apparaître des cartes fantômes « illisibles ».
					.filter((cle) => !cle.slice(DOSSIER_KEY_PREFIX.length).includes(':'))
					.map((cle) => resume(cle.slice(DOSSIER_KEY_PREFIX.length)))
					// `keys` rend un tableau neuf : ce tri ne mute aucun instantané partagé.
					.sort(comparerResumes)
			)
		},

		open(id: string): void {
			// Rien à ouvrir, rien à annoncer : un événement émis sur un dossier absent
			// enverrait la réconciliation cloud chercher une clé qui n'existe pas.
			if (get(id) === null) return
			events.emit('dossier:opened', { dossierId: id })
		},

		importDossier(fileText: string): DossierInspection {
			const inspection = inspectDossierFile(fileText)
			if (inspection.statut !== 'valid') return inspection

			const id = inspection.dossier.id
			if (cleOccupee(id)) {
				// Un import ne se substitue JAMAIS à un dossier déjà présent — lisible ou
				// non. C'est la correction de BUG-048 (KR-179) : la présence était
				// constatée par `get()`, qui RE-VALIDE, si bien qu'un document rangé sous
				// cette clé mais devenu illisible (it2 a durci le schéma 1 sans changer son
				// numéro, et chaque resserrement des n° 3 à n° 6 réarme le même piège)
				// rendait `null` et se faisait écraser en silence, avec le travail de
				// l'auteur. La lisibilité de l'occupant ne décide plus que du MESSAGE.
				return {
					statut: 'invalid',
					errors: [anomalieDejaImporte(id, get(id))],
					warnings: inspection.warnings,
				}
			}

			// La persistance d'abord, l'événement ensuite (KR-004).
			persistence.set(dossierKey(id), inspection.dossier)
			events.emit('dossier:created', { dossierId: id })
			return inspection
		},

		exportDossier(id: string): Dossier | null {
			// Même lecture re-validée que `get` : on n'écrit jamais dans un fichier un
			// document qu'on refuserait de relire.
			return get(id)
		},

		remove(id: string): boolean {
			// Constat par la CLÉ, jamais par `get` : un dossier devenu illisible doit
			// rester supprimable, sinon son identifiant reste occupé pour toujours et
			// l'auteur ne peut même plus réimporter le fichier corrigé. Même leçon que
			// « a corrupt book must still be deletable » côté `BookService.deleteBook`.
			if (!cleOccupee(id)) return false
			// La persistance d'abord, l'événement ensuite (KR-004) : un abonné à
			// `dossier:deleted` lit un magasin d'où la clé est DÉJÀ partie.
			persistence.remove(dossierKey(id))
			events.emit('dossier:deleted', { dossierId: id })
			return true
		},
	}
}
