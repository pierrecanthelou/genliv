import fs from 'node:fs'
import path from 'node:path'
import { createBrain } from './BrainContext'
import type { CloudTransport } from './CloudSyncService'
import { createLocalStoragePersistence, type PersistenceService } from './PersistenceService'
import { createMagasinDeSession } from './MagasinDeSession'
import { analyserSaisie, executerCommande } from './dossier/commandes'
import { ouvrirSession, type EtatSession } from './dossier/session'
import type { Dossier } from './dossier/types'
import { CLOUDSYNC_QUEUE_KEY, dossierKey, dossierSessionKey } from './persistenceKeys'

/**
 * LE PORT DE STOCKAGE DE SESSION, ET LA FRONTIÈRE QU'IL EXISTE POUR TENIR.
 *
 * CE QUI SE PROUVE ICI n'est pas « le port range une session » — ce serait épingler
 * un appel de `set` — mais la SUBSTITUTION qui justifie son existence : la session
 * passe par le magasin BRUT et ne part JAMAIS dans la file de synchronisation
 * (KR-022, la doctrine des trois autres familles d'état par appareil).
 *
 * LA CONTRE-ÉPREUVE EST DANS LE MÊME TEST, ET ELLE N'EST PAS DÉCORATIVE : sans
 * elle, « la file est à zéro » est VRAI PAR CONSTRUCTION — `queuePush` sort tôt
 * quand aucun transport n'est branché (`CloudSyncService.ts`), donc l'instrument ne
 * mesurerait rien (BUG-084). Le transport dont le `push` ne résout JAMAIS est ce
 * qui fait qu'une écriture qui fuirait resterait visiblement en attente, au lieu de
 * se vider avant l'assertion.
 *
 * ET UN CRITÈRE DE RELECTURE N'AURAIT RIEN SÉPARÉ NON PLUS : `CloudSyncService.get`
 * délègue à `local.get`, donc une session est relisible dans les DEUX câblages
 * (BUG-113). La relecture est ici pour dire que l'écriture a bien eu lieu — jamais
 * pour dire par quel magasin elle est passée.
 */

const CHEMIN_REFERENCE = path.join(__dirname, 'dossier', '__fixtures__', 'dossier-reference.json')

/** Le clone de la fixture de référence, LU DU DISQUE à chaque appel (KR-156). */
function dossierDeReference(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

/**
 * LA SESSION DU CRITÈRE 6 — celle d'APRÈS une commande acceptée, jamais une
 * session d'ouverture : c'est une session qui porte un journal, donc un
 * `origine`, qu'on veut voir traverser la sérialisation.
 */
function sessionApresUnDeplacement(): EtatSession {
	const dossier = dossierDeReference()
	const ouverture = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!ouverture.ok) throw new Error(`ouverture refusée : ${ouverture.refus}`)

	const analyse = analyserSaisie('ALLER lieu.tour-effondree')
	if (!analyse.ok) throw new Error(`saisie refusée : ${analyse.refus}`)

	const resultat = executerCommande(dossier, ouverture.session, analyse.commande)
	if (!resultat.ok) throw new Error(`commande refusée : ${resultat.refus}`)
	return resultat.session
}

/** Ce que le magasin BRUT porte réellement sous la clé — jamais une lecture décorée. */
function sessionRangee(dossierId: string): unknown {
	const brut = window.localStorage.getItem(dossierSessionKey(dossierId))
	return brut === null ? null : JSON.parse(brut)
}

describe('createMagasinDeSession, le rangement', () => {
	beforeEach(() => window.localStorage.clear())

	it('range la session sous la cle du dossier joue, et la rend relisible telle quelle', () => {
		const session = sessionApresUnDeplacement()
		createMagasinDeSession(createLocalStoragePersistence()).ecrire('dossier-reference', session)

		// Le `origine` de l'entrée `moteur` traverse la sérialisation : un champ
		// OPTIONNEL (KR-251) reste un champ, il ne disparaît pas au rangement.
		expect(sessionRangee('dossier-reference')).toEqual(session)
		expect((sessionRangee('dossier-reference') as EtatSession).journal[1].origine).toBe('aller')
	})

	it('deux dossiers, deux cles — une partie n ecrase jamais celle d un autre dossier', () => {
		const magasin = createMagasinDeSession(createLocalStoragePersistence())
		const session = sessionApresUnDeplacement()

		magasin.ecrire('dossier-reference', session)
		magasin.ecrire('dossier-minimal', session)

		// Discriminance : sans deux identifiants distincts, une implémentation qui
		// ignorerait `dossierId` et écrirait sous une clé fixe serait verte.
		expect(sessionRangee('dossier-reference')).not.toBeNull()
		expect(sessionRangee('dossier-minimal')).not.toBeNull()
		expect(dossierSessionKey('dossier-reference')).not.toBe(dossierSessionKey('dossier-minimal'))
	})
})

describe('MagasinDeSession, la session n entre pas dans la file de synchronisation', () => {
	beforeEach(() => window.localStorage.clear())

	it('file a ZERO apres une session, a UN apres un dossier — dans le meme test (KR-022)', () => {
		// Un transport dont la poussée ne résout JAMAIS : toute écriture qui fuirait
		// vers le décorateur resterait en attente, donc visible.
		const transport: CloudTransport = { push: () => new Promise<void>(() => {}) }
		const brain = createBrain({ transport })

		brain.sessions.ecrire('dossier-reference', sessionApresUnDeplacement())

		// La session est bien écrite — elle est lisible sous sa clé…
		expect(sessionRangee('dossier-reference')).not.toBeNull()
		// … et elle n'est passée par AUCUNE file.
		expect(brain.sync.pendingCount()).toBe(0)
		expect(window.localStorage.getItem(CLOUDSYNC_QUEUE_KEY)).toBeNull()

		// LA CONTRE-ÉPREUVE (BUG-084) : le même `Brain`, le même transport, une
		// écriture de DOSSIER — qui, elle, DOIT partir. Sans cette moitié, les deux
		// lignes ci-dessus seraient vraies sur un décorateur qui ne pousse rien du
		// tout, et l'instrument ne mesurerait pas ce qu'il prétend mesurer.
		brain.persistence.set(dossierKey('dossier-reference'), { id: 'dossier-reference' })

		expect(brain.sync.pendingCount()).toBe(1)
		expect(brain.sync.pendingKeys()).toEqual([dossierKey('dossier-reference')])
	})

	it('le port expose ecrire ET lire, et RIEN d autre — effacer n a aucun appelant', () => {
		// KR-109 : une méthode sans appelant serait de la dette publiée. `lire` est entrée
		// avec la reprise (n° 15 `moteur-fins`, it2) ; `effacer` a été REJETÉ (« Nouvelle
		// partie » écrase par `ecrire`). Le jour où une troisième méthode entre, c'est cette
		// ligne qui tombe, et elle se lit en diff.
		expect(Object.keys(createMagasinDeSession(createLocalStoragePersistence())).sort()).toEqual(['ecrire', 'lire'])
	})
})

/**
 * `MagasinDeSession.lire` — LES QUATRE VERDICTS, UN TEST CHACUN (KR-199) : un test unique
 * à quatre branches rate le cas limite qu'aucune branche ne nomme, et un nom de test qui
 * couvre une portée plus large que ses assertions est vert sous ce qu'il devait attraper.
 *
 * LES VERDICTS SE PROUVENT PAR OPPOSITION, DANS LE MÊME TEST (KR-197/202/244) : un `lire`
 * qui rendrait toujours `illisible` passerait chaque test d'un seul cas. Le stockage est
 * factice (`get` rend ce qu'on lui dit) pour les verdicts — ce qui se prouve est la
 * décision, pas `localStorage` — et RÉEL pour l'aller-retour, où c'est la sérialisation
 * qui est l'objet.
 *
 * LES SONDES `set`/`remove` SONT POSÉES AVANT L'APPEL qu'elles observent : une sonde posée
 * après est syntaxiquement présente et sémantiquement morte (KR-199).
 */

/** Un magasin BRUT factice : `get` rend `contenu`, `set`/`remove` sont des sondes. */
function magasinBrutFactice(contenu: unknown): {
	readonly brut: PersistenceService
	readonly get: jest.Mock
	readonly set: jest.Mock
	readonly remove: jest.Mock
} {
	const get = jest.fn((_cle: string): unknown => contenu)
	const set = jest.fn()
	const remove = jest.fn()
	const brut: PersistenceService = {
		get: get as PersistenceService['get'],
		set,
		remove,
		keys: jest.fn((_prefixe: string) => [] as string[]),
	}
	return { brut, get, set, remove }
}

/** Le même dossier, ré-estampillé — ce que l'auteur fait en l'éditant, ou la réconciliation cloud en l'adoptant. */
function reestampille(dossier: Dossier): Dossier {
	return { ...dossier, updatedAt: '2026-10-01T00:00:00.000Z' }
}

describe('MagasinDeSession.lire, les quatre verdicts', () => {
	beforeEach(() => window.localStorage.clear())

	it('absente - lire rend absente quand get rend null, et lit la cle de CE dossier', () => {
		const { brut, get } = magasinBrutFactice(null)
		const dossier = dossierDeReference()

		expect(createMagasinDeSession(brut).lire(dossier)).toEqual({ statut: 'absente' })
		expect(get).toHaveBeenCalledTimes(1)
		expect(get).toHaveBeenCalledWith(dossierSessionKey('dossier-reference'))

		// Discriminant : la clé suit `dossier.id`, jamais une clé fixe ni `session.dossier_id`.
		const autre = magasinBrutFactice(null)
		createMagasinDeSession(autre.brut).lire({ ...dossier, id: 'dossier-autre' })
		expect(autre.get).toHaveBeenCalledWith(dossierSessionKey('dossier-autre'))
	})

	it('reprenable - lire rend reprenable quand dossier_maj correspond, et la MEME session (toBe)', () => {
		const session = sessionApresUnDeplacement()
		const { brut } = magasinBrutFactice(session)

		const lecture = createMagasinDeSession(brut).lire(dossierDeReference())

		if (lecture.statut !== 'reprenable') throw new Error(`reprenable attendu, reçu ${lecture.statut}`)
		// IDENTITÉ, pas égalité : une copie reconstruite perdrait toute clé optionnelle
		// qu'on lui oublie (KR-251) — c'est ce que `toBe` interdit et `toEqual` laisserait passer.
		expect(lecture.session).toBe(session)
	})

	it('perimee - lire rend perimee quand dossier_maj differe, sans session a jouer', () => {
		const session = sessionApresUnDeplacement()
		const magasin = createMagasinDeSession(magasinBrutFactice(session).brut)
		const dossier = dossierDeReference()

		// Même session, deux estampilles : l'OPPOSITION dans le même test.
		expect(magasin.lire(dossier).statut).toBe('reprenable')
		expect(magasin.lire(reestampille(dossier))).toEqual({ statut: 'perimee' })
	})

	it('illisible - lire rend illisible quand une cle racine manque', () => {
		const sansJournal = Object.fromEntries(
			Object.entries(sessionApresUnDeplacement()).filter(([cle]) => cle !== 'journal'),
		)
		const dossier = dossierDeReference()

		expect(createMagasinDeSession(magasinBrutFactice(sansJournal).brut).lire(dossier)).toEqual({ statut: 'illisible' })
		// Discriminant : la session COMPLÈTE, elle, est lue.
		expect(createMagasinDeSession(magasinBrutFactice(sessionApresUnDeplacement()).brut).lire(dossier).statut).toBe(
			'reprenable',
		)
	})

	it('illisible - memoire corrompue rend illisible, et memoire null reste lisible', () => {
		const dossier = dossierDeReference()
		const avecMemoire = (memoire: unknown): unknown => ({ ...sessionApresUnDeplacement(), memoire })
		const lire = (contenu: unknown) => createMagasinDeSession(magasinBrutFactice(contenu).brut).lire(dossier)

		expect(lire(avecMemoire({ faits_etablis: 'pas un tableau' }))).toEqual({ statut: 'illisible' })
		// Discriminants : `null` est l'état « rien retenu » (KR-249), et un tableau vide est une forme valide.
		expect(lire(avecMemoire(null)).statut).toBe('reprenable')
		expect(lire(avecMemoire({ faits_etablis: [] })).statut).toBe('reprenable')
	})

	it('JSON non parsable - le contenu qui n est pas du JSON se lit absente, et reste en place (decision n 21)', () => {
		// LA LIMITE ASSUMÉE, ÉPINGLÉE : `PersistenceService.get` avale l'erreur de parse et
		// rend `null`, comme pour une clé inexistante. Une sauvegarde tronquée n'ouvre donc PAS
		// « cette partie ne peut pas être lue » : une nouvelle partie démarre. Si la décision
		// change, c'est CE test qui rougit, et le diff dit pourquoi.
		const cle = dossierSessionKey('dossier-reference')
		window.localStorage.setItem(cle, '{"schema":1,"dossier_id":"dossier-ref')

		const lecture = createMagasinDeSession(createLocalStoragePersistence()).lire(dossierDeReference())

		expect(lecture).toEqual({ statut: 'absente' })
		// `lire` n'EFFACE pas : le contenu corrompu attend que l'appelant écrive une session neuve.
		expect(window.localStorage.getItem(cle)).toBe('{"schema":1,"dossier_id":"dossier-ref')
	})

	it('aller-retour JSON - une session ecrite par les vraies portes se relit reprenable, puis perimee si le dossier bouge', () => {
		const magasin = createMagasinDeSession(createLocalStoragePersistence())
		const dossier = dossierDeReference()
		const session = sessionApresUnDeplacement()

		magasin.ecrire(dossier.id, session)
		const lecture = magasin.lire(dossier)

		if (lecture.statut !== 'reprenable') throw new Error(`reprenable attendu, reçu ${lecture.statut}`)
		expect(lecture.session).toEqual(session)
		// Elle a TRAVERSÉ la sérialisation : une identité préservée ne prouverait rien du rangement.
		expect(lecture.session).not.toBe(session)
		// Le champ optionnel de l'entrée `moteur` a survécu à l'aller-retour (KR-251).
		expect(lecture.session.journal[1].origine).toBe('aller')

		// CONTRE-ÉPREUVE : la MÊME session rangée, relue contre un dossier qui a bougé.
		expect(magasin.lire(reestampille(dossier))).toEqual({ statut: 'perimee' })
	})
})

describe('MagasinDeSession.lire, ne touche jamais au stockage (critere 7, KR-305)', () => {
	const cas: ReadonlyArray<{ readonly nom: string; readonly contenu: () => unknown; readonly statut: string }> = [
		{ nom: 'absente', contenu: () => null, statut: 'absente' },
		{
			nom: 'perimee',
			contenu: () => ({ ...sessionApresUnDeplacement(), dossier_maj: 'autrefois' }),
			statut: 'perimee',
		},
		{ nom: 'illisible', contenu: () => ({ ...sessionApresUnDeplacement(), monde: 'cassé' }), statut: 'illisible' },
		{ nom: 'reprenable', contenu: () => sessionApresUnDeplacement(), statut: 'reprenable' },
	]

	it.each(cas)('$nom - lire n appelle ni set ni remove', ({ contenu, statut }) => {
		const { brut, get, set, remove } = magasinBrutFactice(contenu())

		const lecture = createMagasinDeSession(brut).lire(dossierDeReference())

		// Le verdict est bien celui du cas — sinon la ligne suivante prouverait la lecture
		// d'une autre branche que celle qu'elle nomme.
		expect(lecture.statut).toBe(statut)
		expect(get).toHaveBeenCalledTimes(1)
		// Périmée ou illisible : la session rangée reste EXACTEMENT où elle était. Seul
		// l'appelant décide d'en écrire une neuve (jamais de réparation en place).
		expect(set).not.toHaveBeenCalled()
		expect(remove).not.toHaveBeenCalled()
	})

	it('discriminant - ecrire, lui, appelle set une fois, sous la cle du dossier : la sonde est branchee', () => {
		const { brut, set, remove } = magasinBrutFactice(null)
		const session = sessionApresUnDeplacement()

		createMagasinDeSession(brut).ecrire('dossier-reference', session)

		expect(set).toHaveBeenCalledTimes(1)
		expect(set).toHaveBeenCalledWith(dossierSessionKey('dossier-reference'), session)
		expect(remove).not.toHaveBeenCalled()
	})
})
