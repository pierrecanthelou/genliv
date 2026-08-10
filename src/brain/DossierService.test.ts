import fs from 'node:fs'
import path from 'node:path'
import { createDossierService, type CorpsDossier } from './DossierService'
import { createCloudSyncService, type CloudTransport } from './CloudSyncService'
import { createEventBus } from './EventBus'
import { createLocalStoragePersistence } from './PersistenceService'
import { dossierKey, DOSSIER_KEY_PREFIX } from './persistenceKeys'
import { compterMots, validateDossier } from './dossier/validate'
import { BUDGET_MOTS_CANON, DOSSIER_SCHEMA, type Dossier } from './dossier/types'

const CHEMIN_FIXTURE = path.join(__dirname, 'dossier', '__fixtures__', 'dossier-minimal.json')

/** Le jumeau de la liste de `dossier/validate.test.ts` — trois mots, recopiés plutôt
 *  qu'extraits : un module partagé à deux appelants de test serait de la dette. */
const FUITES_TECHNIQUES = ['expected', 'undefined', 'is not a function']

/** Le TEXTE du fichier réel, lu du disque (KR-156) — jamais un littéral inline. */
function texteFixture(): string {
	return fs.readFileSync(CHEMIN_FIXTURE, 'utf8')
}

/**
 * Une VARIANTE du fichier réel — trois champs de racine réécrits sur le document
 * de la fixture, jamais un dossier littéral inline (KR-156) : lister exige
 * plusieurs dossiers, et un littéral dériverait du format que le validateur
 * accepte réellement dès le prochain resserrement de schéma.
 */
function texteVariante(id: string, titre: string, updatedAt: string): string {
	const document = JSON.parse(texteFixture()) as Record<string, unknown>
	document.id = id
	document.titre = titre
	document.updatedAt = updatedAt
	return JSON.stringify(document)
}

/**
 * Un document rangé sous une clé de dossier et que le validateur REFUSE — ce que
 * produit un resserrement de schéma 1 sans changement de numéro (BUG-048), et ce
 * qu'écrit l'adoption cloud derrière le service.
 */
function documentIllisible(id: string): Record<string, unknown> {
	return { schema: 2, id, titre: 'Version devenue illisible' }
}

/** Le prochain macrotask — la fenêtre de poussée à `debounceMs: 0` s'y résout. */
const attendreLaPoussee = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * Le VRAI magasin (comme `BookService.test.ts`) : il sérialise réellement, donc
 * il ne peut pas rendre par mégarde la même RÉFÉRENCE que celle qu'on a écrite —
 * ce qui prouverait le gel et le round-trip par identité au lieu du contenu.
 */
function setup() {
	const persistence = createLocalStoragePersistence()
	const events = createEventBus()
	const dossiers = createDossierService(persistence, events)
	return { persistence, events, dossiers }
}

describe('DossierService', () => {
	beforeEach(() => window.localStorage.clear())

	it('create seme un dossier que le validateur accepte sans erreur ni avertissement', () => {
		const { dossiers, persistence } = setup()

		const dossier = dossiers.create('La Caverne')

		// Le ROUND-TRIP complet plutôt qu'un test de la regex de l'identifiant : cette
		// égalité au tableau VIDE est strictement plus forte, et elle n'exige d'exporter
		// ni `FORME_ID_DOSSIER` ni la forme du seed. Un identifiant mal frappé
		// (le `_` de `createId`, KR-177) sortirait ici en `identifiant-invalide`.
		const validation = validateDossier(dossier)
		expect(validation.errors).toEqual([])
		// Les DEUX tableaux : un dossier neuf qui s'ouvre déjà sur un avertissement
		// demanderait à l'auteur de corriger ce que le logiciel vient d'écrire.
		expect(validation.warnings).toEqual([])
		expect(validation.ok).toBe(true)

		// Persisté sous SA clé, et relisible par le chemin normal — donc re-validé.
		expect(persistence.keys(DOSSIER_KEY_PREFIX)).toEqual([dossierKey(dossier.id)])
		expect(dossiers.get(dossier.id)?.titre).toBe('La Caverne')
	})

	it('create emet dossier:created seul, APRES la resolution de la persistance', () => {
		const { dossiers, events, persistence } = setup()
		const journal: string[] = []
		let vuDansLeMagasin: unknown = null
		events.on('dossier:created', ({ dossierId }) => {
			journal.push('created')
			// L'abonné lit le magasin AU MOMENT de la notification (KR-004) : c'est ce
			// qui permet à l'appelant d'enchaîner `open()` sans fenêtre de course.
			vuDansLeMagasin = persistence.get(dossierKey(dossierId))
		})
		events.on('dossier:opened', () => journal.push('opened'))

		const dossier = dossiers.create('Ordre')

		// `create` N'OUVRE PAS : l'enchaînement des deux événements appartient à
		// l'appelant, sans quoi on ne pourrait plus semer un dossier sans y aller.
		expect(journal).toEqual(['created'])
		expect((vuDansLeMagasin as { id: string } | null)?.id).toBe(dossier.id)
	})

	it('create trime le titre et ne laisse jamais passer un titre vide', () => {
		const { dossiers } = setup()

		expect(dossiers.create('  Mon dossier  ').titre).toBe('Mon dossier')

		const anonyme = dossiers.create('   ')

		// La VALEUR du repli n'est pas épinglée ici — le comité l'a nommée
		// (`TITRE_PAR_DEFAUT`) sans l'écrire, et c'est une constante privée du service.
		// Ce qui est un CONTRAT, c'est qu'un titre vide ne traverse pas : `titre` est
		// un champ requis, un dossier titré « » serait refusé à la relecture.
		expect(anonyme.titre.trim()).not.toBe('')
		expect(validateDossier(anonyme).errors).toEqual([])
		expect(dossiers.get(anonyme.id)).not.toBeNull()
	})

	it('cinquante create : des ids tous distincts, tous conformes, tous listes', () => {
		const { dossiers } = setup()

		const semes = Array.from({ length: 50 }, (_, rang) => dossiers.create(`Dossier ${rang}`))

		// Aucune collision : deux dossiers qui partageraient un identifiant
		// partageraient une CLÉ DE STOCKAGE, donc le second écraserait le premier.
		expect(new Set(semes.map((dossier) => dossier.id)).size).toBe(50)
		for (const dossier of semes) {
			expect(`${dossier.id} → ${JSON.stringify(validateDossier(dossier).errors)}`).toBe(`${dossier.id} → []`)
		}
		// Le constat par la bibliothèque : cinquante clés distinctes réellement écrites.
		expect(dossiers.list()).toHaveLength(50)
	})

	it('importDossier persiste un dossier conforme et le rend valide', () => {
		const { dossiers, persistence } = setup()

		const inspection = dossiers.importDossier(texteFixture())

		expect(inspection.statut).toBe('valid')
		expect(persistence.keys(DOSSIER_KEY_PREFIX)).toEqual([dossierKey('dossier-minimal')])
		expect(dossiers.get('dossier-minimal')?.titre).toBe('Le sceau du Gouffre')
	})

	it('get re-valide et ne rend jamais le brut', () => {
		const { dossiers, persistence } = setup()

		// Écrit DERRIÈRE le service — exactement ce que fait l'adoption cloud.
		persistence.set(dossierKey('corrompu'), { schema: 2, id: 'corrompu', titre: 'Venu du cloud' })

		expect(dossiers.get('corrompu')).toBeNull()
		expect(dossiers.exportDossier('corrompu')).toBeNull()
		// Discriminant : le document EST bien dans le magasin ; c'est la lecture qui
		// le refuse, pas son absence.
		expect(persistence.get(dossierKey('corrompu'))).not.toBeNull()
	})

	it('get rend un dossier gele en profondeur, quel que soit le chemin', () => {
		const { dossiers } = setup()
		dossiers.importDossier(texteFixture())

		const dossier = dossiers.get('dossier-minimal')

		expect(dossier).not.toBeNull()
		if (dossier === null) return
		expect(Object.isFrozen(dossier)).toBe(true)
		expect(Object.isFrozen(dossier.monde.lieux)).toBe(true)
		expect(Object.isFrozen(dossier.monde.lieux[0])).toBe(true)
	})

	it('get rend null sur un identifiant inconnu', () => {
		const { dossiers } = setup()
		expect(dossiers.get('jamais-vu')).toBeNull()
		expect(dossiers.exportDossier('jamais-vu')).toBeNull()
	})

	it('deux imports du meme contenu : le second est refuse', () => {
		const { dossiers, persistence, events } = setup()
		const crees: string[] = []
		events.on('dossier:created', ({ dossierId }) => crees.push(dossierId))

		dossiers.importDossier(texteFixture())
		const premier = JSON.stringify(persistence.get(dossierKey('dossier-minimal')))

		// Le second fichier porte le MÊME identifiant mais un titre différent : si
		// l'import écrasait, le titre changerait.
		const modifie = JSON.parse(texteFixture()) as Record<string, unknown>
		modifie.titre = 'Une seconde version'
		const seconde = dossiers.importDossier(JSON.stringify(modifie))

		expect(seconde.statut).toBe('invalid')
		if (seconde.statut !== 'invalid') return
		expect(seconde.errors.map((e) => e.code)).toEqual(['dossier-deja-importe'])
		expect(seconde.errors[0].message).toContain('Le sceau du Gouffre')
		// Le huitième code que `validate.test.ts` délègue ici : il est le seul produit
		// par le magasin et non par le validateur, donc le seul que le balayage du
		// critère #4 ne peut pas atteindre. Même exigence, même liste (KR-164).
		for (const fuite of FUITES_TECHNIQUES) {
			expect(seconde.errors[0].message.toLowerCase()).not.toContain(fuite)
		}
		expect(seconde.errors[0].location).not.toBe('')
		expect(seconde.errors[0].path).not.toBe('')
		// Aucun écrasement, et aucun second événement.
		expect(JSON.stringify(persistence.get(dossierKey('dossier-minimal')))).toBe(premier)
		expect(crees).toEqual(['dossier-minimal'])
	})

	it('un fichier illisible ne persiste rien et n emet rien', () => {
		const { dossiers, events, persistence } = setup()
		const emis: string[] = []
		events.on('dossier:created', ({ dossierId }) => emis.push(dossierId))

		expect(dossiers.importDossier('').statut).toBe('file-error')
		expect(dossiers.importDossier('{ tronqué').statut).toBe('file-error')

		expect(persistence.keys(DOSSIER_KEY_PREFIX)).toEqual([])
		expect(emis).toEqual([])
	})

	it('dossier:created est emis APRES la resolution de la persistance', () => {
		const { dossiers, events, persistence } = setup()
		let vuDansLeMagasin: unknown = null

		events.on('dossier:created', ({ dossierId }) => {
			// L'abonné lit le magasin AU MOMENT de la notification : il doit déjà y
			// trouver le dossier (KR-004).
			vuDansLeMagasin = persistence.get(dossierKey(dossierId))
		})

		dossiers.importDossier(texteFixture())

		expect(vuDansLeMagasin).not.toBeNull()
		expect((vuDansLeMagasin as { titre: string }).titre).toBe('Le sceau du Gouffre')
	})

	it('open emet dossier:opened une seule fois, dans l ordre', () => {
		const { dossiers, events } = setup()
		const journal: string[] = []
		events.on('dossier:created', () => journal.push('created'))
		events.on('dossier:opened', () => journal.push('opened'))

		dossiers.importDossier(texteFixture())
		dossiers.open('dossier-minimal')

		expect(journal).toEqual(['created', 'opened'])
	})

	it('open sur un dossier absent ou corrompu n emet rien', () => {
		const { dossiers, events, persistence } = setup()
		const ouverts: string[] = []
		events.on('dossier:opened', ({ dossierId }) => ouverts.push(dossierId))

		dossiers.open('jamais-vu')
		persistence.set(dossierKey('corrompu'), { schema: 2, id: 'corrompu' })
		dossiers.open('corrompu')

		// Un `dossier:opened` sur une clé sans dossier lisible enverrait la
		// réconciliation cloud chercher ce qui n'existe pas.
		expect(ouverts).toEqual([])
	})

	it('exportDossier rend le document re-validable', () => {
		const { dossiers } = setup()
		dossiers.importDossier(texteFixture())

		const exporte = dossiers.exportDossier('dossier-minimal')

		expect(exporte).not.toBeNull()
		expect(exporte?.schema).toBe(1)
		expect(Object.isFrozen(exporte)).toBe(true)
	})

	it('list liste par cle, illisibles en tete, et ignore les cles reservees', () => {
		const { dossiers, persistence } = setup()

		dossiers.importDossier(texteVariante('recent', 'Le plus récent', '2026-08-06T10:00:00.000Z'))
		dossiers.importDossier(texteVariante('ancien', 'Le plus ancien', '2026-01-02T10:00:00.000Z'))
		// Écrit DERRIÈRE le service, comme l'adoption cloud : présent, illisible.
		persistence.set(dossierKey('illisible'), documentIllisible('illisible'))
		// La FORME des clés de découpage à venir : `dossierContentKey` et
		// `dossierImageKey` n'existent pas encore (`persistenceKeys.ts` les annonce
		// pour la n° 3 / n° 4), donc on sème ce qui les distingue — le `:` réservé
		// après le préfixe. Sans le filtre, elles rendraient des cartes fantômes.
		persistence.set(`${dossierKey('recent')}:content`, { schema: 1, id: 'recent' })
		persistence.set(`${dossierKey('recent')}:img:illustration`, 'data:image/png;base64,xxx')

		// Le tableau ENTIER, pas un décompte : il épingle d'un coup l'exhaustivité
		// (aucune clé omise), l'ordre, et la FORME de chaque branche de l'union —
		// `toEqual` échoue sur une propriété en trop, donc un `titre` posé par
		// mégarde sur une branche `lisible: false` rougirait ici.
		expect(dossiers.list()).toEqual([
			{ id: 'illisible', lisible: false },
			{ id: 'recent', lisible: true, titre: 'Le plus récent', updatedAt: '2026-08-06T10:00:00.000Z' },
			{ id: 'ancien', lisible: true, titre: 'Le plus ancien', updatedAt: '2026-01-02T10:00:00.000Z' },
		])
	})

	it('list rend une liste vide quand rien n est importe', () => {
		const { dossiers } = setup()
		expect(dossiers.list()).toEqual([])
	})

	it('list departage une egalite de updatedAt par id', () => {
		const { dossiers } = setup()
		const memeInstant = '2026-08-06T10:00:00.000Z'

		// Semés dans l'ordre inverse de l'ordre attendu : sans départage, la liste
		// sortirait dans l'ordre des clés du magasin.
		dossiers.importDossier(texteVariante('beta', 'Bêta', memeInstant))
		dossiers.importDossier(texteVariante('alpha', 'Alpha', memeInstant))

		expect(dossiers.list().map((resume) => resume.id)).toEqual(['alpha', 'beta'])
	})

	it('un import sur une cle occupee par un document illisible est refuse', () => {
		const { dossiers, persistence, events } = setup()
		const crees: string[] = []
		events.on('dossier:created', ({ dossierId }) => crees.push(dossierId))
		const occupant = documentIllisible('dossier-minimal')
		persistence.set(dossierKey('dossier-minimal'), occupant)

		const refus = dossiers.importDossier(texteFixture())

		expect(refus.statut).toBe('invalid')
		if (refus.statut !== 'invalid') return
		expect(refus.errors.map((e) => e.code)).toEqual(['dossier-deja-importe'])
		// Le SECOND message du code — celui que la lisibilité de l'occupant décide.
		expect(refus.errors[0].message).toBe('Un dossier illisible occupe déjà cet identifiant.')
		for (const fuite of FUITES_TECHNIQUES) {
			expect(refus.errors[0].message.toLowerCase()).not.toContain(fuite)
		}
		// OÙ : l'occupant n'a pas de titre lisible, il est nommé par son identifiant.
		expect(refus.errors[0].location).toContain('dossier-minimal')
		expect(refus.errors[0].path).not.toBe('')
		// Le document EN PLACE n'est pas écrasé, et aucun événement ne part.
		expect(persistence.get(dossierKey('dossier-minimal'))).toEqual(occupant)
		expect(crees).toEqual([])
		// DISCRIMINANT de BUG-048 : tant que la présence se constatait par `get()`,
		// qui re-valide, cet occupant rendait `null` et l'import l'écrasait — le
		// dossier serait alors LISIBLE ici, et cette assertion rougirait.
		expect(dossiers.get('dossier-minimal')).toBeNull()
	})

	it('remove retire la cle AVANT d emettre dossier:deleted', () => {
		const { dossiers, events, persistence } = setup()
		dossiers.importDossier(texteFixture())
		let vuDansLeMagasin: unknown = 'sentinelle jamais lue'
		const supprimes: string[] = []
		events.on('dossier:deleted', ({ dossierId }) => {
			// L'abonné lit le magasin AU MOMENT de la notification : la clé doit déjà
			// en être partie (KR-004), sinon la bibliothèque re-lirait la carte qu'elle
			// vient de supprimer.
			vuDansLeMagasin = persistence.get(dossierKey(dossierId))
			supprimes.push(dossierId)
		})

		expect(dossiers.remove('dossier-minimal')).toBe(true)

		expect(vuDansLeMagasin).toBeNull()
		expect(supprimes).toEqual(['dossier-minimal'])
		expect(dossiers.list()).toEqual([])
	})

	it('remove fonctionne sur un dossier illisible', () => {
		const { dossiers, persistence, events } = setup()
		const supprimes: string[] = []
		events.on('dossier:deleted', ({ dossierId }) => supprimes.push(dossierId))
		persistence.set(dossierKey('illisible'), documentIllisible('illisible'))
		// Discriminant : il est bien PRÉSENT et bien ILLISIBLE avant le geste.
		expect(dossiers.get('illisible')).toBeNull()
		expect(dossiers.list()).toEqual([{ id: 'illisible', lisible: false }])

		// Un illisible non supprimable enfermerait l'auteur : son identifiant reste
		// occupé, donc l'import du fichier corrigé serait refusé à jamais.
		expect(dossiers.remove('illisible')).toBe(true)

		expect(persistence.get(dossierKey('illisible'))).toBeNull()
		expect(dossiers.list()).toEqual([])
		expect(supprimes).toEqual(['illisible'])
	})

	it('une cle au contenu non-JSON reste listee ET supprimable', () => {
		const { dossiers } = setup()
		// Écrit dans le magasin BRUT : `PersistenceService.get` rend `null` sur un
		// contenu que `JSON.parse` refuse. « Valeur absente » et « clé absente » ne
		// sont donc pas la même question — c'est la CLÉ qui fait foi, sans quoi
		// cette entrée serait listée sans jamais pouvoir être supprimée.
		window.localStorage.setItem(dossierKey('tronque'), '{ tronqué')

		expect(dossiers.list()).toEqual([{ id: 'tronque', lisible: false }])
		expect(dossiers.remove('tronque')).toBe(true)
		expect(dossiers.list()).toEqual([])
	})

	it('remove rend false sans rien emettre sur un identifiant absent ou deja supprime', () => {
		const { dossiers, events } = setup()
		const supprimes: string[] = []
		events.on('dossier:deleted', ({ dossierId }) => supprimes.push(dossierId))

		expect(dossiers.remove('jamais-vu')).toBe(false)

		dossiers.importDossier(texteFixture())
		expect(dossiers.remove('dossier-minimal')).toBe(true)
		// Double confirmation (double clic sur « Supprimer ») : le second passage ne
		// ré-émet rien, donc aucun abonné ne voit deux suppressions du même dossier.
		expect(dossiers.remove('dossier-minimal')).toBe(false)

		expect(supprimes).toEqual(['dossier-minimal'])
	})

	it('remove n efface pas la cle distante — epinglage du comportement ACTUEL (KR-182)', async () => {
		const events = createEventBus()
		const local = createLocalStoragePersistence()
		const pousses: string[] = []
		const transport: CloudTransport = {
			push: async (key) => {
				pousses.push(key)
			},
		}
		// `debounceMs: 0` → le lot part au macrotask suivant (`attendreLaPoussee`).
		const sync = createCloudSyncService(local, events, transport, { debounceMs: 0 })
		const dossiers = createDossierService(sync, events)

		dossiers.importDossier(texteFixture())
		expect(dossiers.remove('dossier-minimal')).toBe(true)

		// Le magasin local est bien nettoyé…
		expect(sync.get(dossierKey('dossier-minimal'))).toBeNull()
		// …mais la poussée reste EN FILE : `CloudSyncService.remove()` ne fait que
		// `local.remove(key)` — il ne retire rien de la file et n'efface aucune clé
		// distante.
		expect(sync.pendingKeys()).toContain(dossierKey('dossier-minimal'))

		await attendreLaPoussee()

		// ÉPINGLAGE, pas un souhait : le document SUPPRIMÉ vient d'être publié au
		// distant, et aucune suppression ne l'y suivra. Dette héritée, identique
		// pour `BookService.deleteBook` depuis toujours, hors périmètre de cette
		// itération (KR-182). Le jour où une suppression cloud existera, ce test
		// devra changer — c'est-à-dire que quelqu'un aura pris la décision, au lieu
		// de découvrir le silence.
		expect(pousses).toEqual([dossierKey('dossier-minimal')])
		expect(sync.pendingKeys()).toEqual([])
	})
})

/**
 * Un texte de `mots` mots exactement — la seule façon d'éprouver une borne de mots
 * à la BORNE et à BORNE+1 (KR-165) sans recopier six cents mots dans ce fichier.
 * Les mots sont numérotés, donc tous distincts : un compteur qui dédoublonnerait
 * par erreur ne pourrait pas se cacher derrière une répétition.
 */
function texteDe(mots: number): string {
	return Array.from({ length: mots }, (_, rang) => `mot${rang}`).join(' ')
}

/**
 * La recette IDIOMATIQUE : TROIS racines nommées, jamais un étalement du dossier.
 * C'est la forme que le formulaire de canon (n° 3) écrit, et l'écrire ici aussi
 * évite qu'un test prouve un contrat sur une forme que personne n'utilise.
 */
function corpsAvecCanon(dossier: Dossier, canon: Partial<Dossier['canon']>): CorpsDossier {
	return {
		canon: { ...dossier.canon, ...canon },
		monde: dossier.monde,
		charpente: dossier.charpente,
	}
}

/**
 * `DossierService.update` — le PREMIER chemin d'écriture du dossier, et le premier
 * endroit du projet où un patch d'auteur peut être REFUSÉ.
 *
 * Cinq propriétés portent tout le reste, et chacune a son test : la recette n'est
 * pas appelée sur un dossier absent ; un candidat invalide n'écrit ni n'émet rien ;
 * une écriture propre persiste PUIS émet (KR-004) ; un avertissement ne bloque
 * jamais (KR-165) ; l'enveloppe est recomposée par le service, pas par l'appelant.
 */
describe('DossierService.update', () => {
	beforeEach(() => window.localStorage.clear())
	// L'horloge du service est mockée dans UN seul test ; la rendre sans condition
	// évite qu'un échec d'assertion laisse les timers figés pour les suivants.
	afterEach(() => jest.useRealTimers())

	it('sur un dossier absent : statut absent, recette jamais appelee, rien persiste', () => {
		const { dossiers, persistence, events } = setup()
		const emis: string[] = []
		events.on('dossier:updated', ({ dossierId }) => emis.push(dossierId))
		const recette = jest.fn((dossier: Dossier) => corpsAvecCanon(dossier, { ton: 'grave' }))

		expect(dossiers.update('jamais-vu', recette)).toEqual({ statut: 'absent' })

		// La recette recevrait un dossier qui n'existe pas : elle n'est PAS appelée —
		// sans quoi un appelant pourrait recomposer un document neuf sous une clé
		// libre, et `update` créerait au lieu d'écrire.
		expect(recette).not.toHaveBeenCalled()
		expect(persistence.keys(DOSSIER_KEY_PREFIX)).toEqual([])
		expect(emis).toEqual([])

		// DISCRIMINANT : une clé OCCUPÉE par un document illisible est `absent` pour
		// `update` aussi — on ne peut pas patcher ce qu'on ne sait pas relire, et la
		// recette ne recevrait rien à cloner. Le document en place n'est pas écrasé.
		const occupant = documentIllisible('illisible')
		persistence.set(dossierKey('illisible'), occupant)

		expect(dossiers.update('illisible', recette)).toEqual({ statut: 'absent' })

		expect(recette).not.toHaveBeenCalled()
		expect(persistence.get(dossierKey('illisible'))).toEqual(occupant)
		expect(emis).toEqual([])
	})

	it('refuse un candidat invalide : rien persiste, aucun evenement', () => {
		const { dossiers, persistence, events } = setup()
		const dossier = dossiers.create('Le Sceau')
		const avant = JSON.stringify(persistence.get(dossierKey(dossier.id)))
		const emis: string[] = []
		events.on('dossier:updated', ({ dossierId }) => emis.push(dossierId))

		// La seule anomalie bloquante qu'un formulaire de canon puisse produire :
		// vider un champ obligatoire (`CHAMPS_REQUIS`, `dossier/tables.ts`).
		const refus = dossiers.update(dossier.id, (d) => corpsAvecCanon(d, { mj: { synopsis_mj: '' } }))

		expect(refus.statut).toBe('refuse')
		if (refus.statut !== 'refuse') return
		expect(refus.errors.map((anomalie) => anomalie.code)).toEqual(['champ-requis-vide'])
		// Le `path` est le contrat que la n° 7 consomme pour badger une section
		// (KR-164) : c'est lui qui dit à l'écran QUEL champ refuser.
		expect(refus.errors[0].path).toBe('canon.mj.synopsis_mj')
		expect(refus.warnings).toEqual([])
		// Le magasin est inchangé À L'OCTET : ni le champ vidé, ni un `updatedAt` neuf.
		expect(JSON.stringify(persistence.get(dossierKey(dossier.id)))).toBe(avant)
		expect(dossiers.get(dossier.id)?.canon.mj.synopsis_mj).toBe(dossier.canon.mj.synopsis_mj)
		expect(emis).toEqual([])
	})

	it('ecrit sans avertissement et emet dossier:updated APRES la persistance', () => {
		const { dossiers, persistence, events } = setup()
		const dossier = dossiers.create('Le Sceau')
		const TON = 'Grave, laconique, sans ironie.'
		const journal: string[] = []
		let vuDansLeMagasin: unknown = null
		events.on('dossier:updated', ({ dossierId }) => {
			journal.push('updated')
			// L'abonné lit le magasin AU MOMENT de la notification (KR-004) : il doit
			// déjà y trouver le NOUVEAU texte, sinon toute vue qui se relit sur cet
			// événement afficherait l'ancien.
			vuDansLeMagasin = persistence.get(dossierKey(dossierId))
		})

		const ecriture = dossiers.update(dossier.id, (d) => corpsAvecCanon(d, { ton: TON }))

		expect(ecriture.statut).toBe('ecrit')
		if (ecriture.statut !== 'ecrit') return
		// Les DEUX tableaux : une écriture propre n'ouvre pas sur un avertissement.
		expect(ecriture.warnings).toEqual([])
		expect(ecriture.dossier.canon.ton).toBe(TON)
		// Relu par le chemin normal, donc RE-VALIDÉ : ce qui a été écrit est relisible.
		expect(dossiers.get(dossier.id)?.canon.ton).toBe(TON)
		expect(journal).toEqual(['updated'])
		expect((vuDansLeMagasin as Dossier | null)?.canon.ton).toBe(TON)
	})

	it('ecrit quand meme un texte au-dela du budget de mots, avec son avertissement', () => {
		const { dossiers } = setup()
		const dossier = dossiers.create('Le Sceau')
		const tropLong = texteDe(BUDGET_MOTS_CANON + 1)

		const ecriture = dossiers.update(dossier.id, (d) => corpsAvecCanon(d, { mj: { synopsis_mj: tropLong } }))

		expect(ecriture.statut).toBe('ecrit')
		if (ecriture.statut !== 'ecrit') return
		expect(ecriture.warnings.map((avertissement) => avertissement.code)).toEqual(['texte-trop-long'])
		// NON BLOQUANT (KR-165) : le texte est bien dans le magasin, et il en ressort.
		// Un avertissement qui refuserait l'écriture serait une erreur déguisée.
		expect(dossiers.get(dossier.id)?.canon.mj.synopsis_mj).toBe(tropLong)
	})

	it('ignore titre, id, schema et createdAt rendus par la recette, et frappe updatedAt lui-meme', () => {
		const { dossiers } = setup()
		// Semé à l'horloge RÉELLE, puis l'horloge du service est déplacée : sans cet
		// écart, `updatedAt === createdAt` et l'assertion ne distinguerait pas « frappé
		// par le service » de « recopié du document stocké ».
		const dossier = dossiers.create('Le Sceau')
		const HORLOGE = '2027-03-04T05:06:07.000Z'
		jest.useFakeTimers().setSystemTime(new Date(HORLOGE))

		const ecriture = dossiers.update(
			dossier.id,
			(d) =>
				({
					...corpsAvecCanon(d, { ton: 'Grave.' }),
					// Tout ce que `CorpsDossier` interdit de nommer, nommé quand même par un
					// `as` — la seule façon pour un appelant de tenter l'enveloppe.
					schema: 2,
					id: 'pirate',
					titre: 'titre pirate',
					createdAt: '2000-01-01T00:00:00.000Z',
					updatedAt: '2000-01-01T00:00:00.000Z',
				}) as unknown as CorpsDossier,
		)

		expect(ecriture.statut).toBe('ecrit')
		if (ecriture.statut !== 'ecrit') return
		expect(ecriture.dossier.id).toBe(dossier.id)
		expect(ecriture.dossier.titre).toBe('Le Sceau')
		expect(ecriture.dossier.createdAt).toBe(dossier.createdAt)
		// `schema: 2` aurait été refusé par la garde de version : c'est bien celui du
		// document stocké qui traverse, pas celui de la recette.
		expect(ecriture.dossier.schema).toBe(DOSSIER_SCHEMA)
		// L'horloge du SERVICE, jamais la valeur antidatée de la recette : `updatedAt`
		// est le champ que la réconciliation cloud compare (dernier écrit gagne), et
		// une écriture antidatée se ferait écraser par une copie distante plus
		// ancienne sans qu'une seule anomalie soit levée.
		expect(ecriture.dossier.updatedAt).toBe(HORLOGE)
		expect(dossiers.get(dossier.id)?.updatedAt).toBe(HORLOGE)
		// Le contenu, lui, est bien celui de la recette.
		expect(ecriture.dossier.canon.ton).toBe('Grave.')
	})

	it('n introduit aucun second site de gel dans DossierService.ts', () => {
		const source = fs.readFileSync(path.join(__dirname, 'DossierService.ts'), 'utf8')

		// KR-166 : `deepFreeze` n'a QU'UN site d'appel, la sortie de `validateDossier`.
		// `dossier/roundtrip.test.ts` tient cette propriété pour le module `dossier/` —
		// et ce fichier-ci est HORS de ce module, donc hors de ce balayage : ce qui
		// écrit le magasin n'y était couvert par rien. Un objet gelé reconstruit ici
		// rendrait indécidable « ce document a-t-il été validé ? ».
		//
		// On cherche la forme APPELÉE (`nom(`) et l'IMPORT, comme le fait
		// `roundtrip.test.ts` : la prose des commentaires nomme légitimement `deepFreeze`
		// pour dire qu'on ne l'appelle pas, et un test qui refuserait jusqu'à son nom
		// interdirait d'expliquer la règle à l'endroit où elle s'applique.
		expect(source).not.toMatch(/deepFreeze\(/)
		expect(source).not.toMatch(/Object\.(freeze|seal)\(/)
		expect(source).not.toMatch(/from\s+['"]\.\/dossier\/freeze['"]/)
		// Discriminant du motif : sans cette ligne, les trois assertions passeraient
		// aussi sur un fichier vide ou mal lu.
		expect(source).toMatch(/validateDossier\(/)
	})

	it('rend un dossier gele en profondeur, et jamais l objet recompose', () => {
		const { dossiers } = setup()
		const dossier = dossiers.create('Le Sceau')
		let mondeRendu: unknown = null

		const ecriture = dossiers.update(dossier.id, (d) => {
			mondeRendu = d.monde
			return corpsAvecCanon(d, { interdits_ton: ['Pas d’anachronismes modernes.'] })
		})

		expect(ecriture.statut).toBe('ecrit')
		if (ecriture.statut !== 'ecrit') return
		expect(Object.isFrozen(ecriture.dossier)).toBe(true)
		expect(Object.isFrozen(ecriture.dossier.canon)).toBe(true)
		expect(Object.isFrozen(ecriture.dossier.canon.interdits_ton)).toBe(true)
		expect(Object.isFrozen(ecriture.dossier.monde.lieux[0])).toBe(true)
		// DISCRIMINANT : c'est bien le CLONE du validateur qui ressort et qui est
		// persisté, pas la structure que la recette a passée en l'état — sans quoi le
		// gel porterait sur un objet que l'appelant tient encore par référence.
		expect(mondeRendu).not.toBeNull()
		expect(ecriture.dossier.monde).not.toBe(mondeRendu)
	})
})

/**
 * `compterMots` — la fonction que l'avertissement du validateur et le compteur
 * affiché sous un champ de saisie (n° 3) partagent. Elle est éprouvée ICI plutôt
 * que dans `dossier/validate.test.ts` : le plan d'itération réserve ce fichier-là
 * à un autre lot, et l'ACCORD qu'on veut prouver — même compte des deux côtés —
 * passe de toute façon par `update`.
 */
describe('compterMots, le compteur partage', () => {
	beforeEach(() => window.localStorage.clear())

	it('rend 0 sur une chaine vide et s accorde avec le seuil d avertissement', () => {
		expect(compterMots('')).toBe(0)
		// Une suite d'espaces n'est pas un mot — sinon le compteur d'écran afficherait
		// « 1/600 » sur un champ que le validateur tient pour vide.
		expect(compterMots('   \n\t ')).toBe(0)
		expect(compterMots('un')).toBe(1)
		expect(compterMots('  deux   mots  ')).toBe(2)

		const aLaBorne = texteDe(BUDGET_MOTS_CANON)
		const unDeTrop = texteDe(BUDGET_MOTS_CANON + 1)
		expect(compterMots(aLaBorne)).toBe(BUDGET_MOTS_CANON)
		expect(compterMots(unDeTrop)).toBe(BUDGET_MOTS_CANON + 1)

		// L'ACCORD, éprouvé aux DEUX bornes (KR-165) : ce que le compteur affiche et
		// ce qui déclenche `texte-trop-long` sont le même décompte. Réimplémenté à
		// l'écran, le compteur dériverait en silence de la borne qui décide.
		const { dossiers } = setup()
		const dossier = dossiers.create('Le Sceau')

		const juste = dossiers.update(dossier.id, (d) => corpsAvecCanon(d, { mj: { synopsis_mj: aLaBorne } }))
		expect(juste.statut).toBe('ecrit')
		if (juste.statut !== 'ecrit') return
		expect(juste.warnings).toEqual([])

		const trop = dossiers.update(dossier.id, (d) => corpsAvecCanon(d, { mj: { synopsis_mj: unDeTrop } }))
		expect(trop.statut).toBe('ecrit')
		if (trop.statut !== 'ecrit') return
		expect(trop.warnings.map((avertissement) => avertissement.code)).toEqual(['texte-trop-long'])
	})
})
