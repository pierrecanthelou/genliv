import fs from 'node:fs'
import path from 'node:path'
import { createBrain } from './BrainContext'
import type { CloudTransport } from './CloudSyncService'
import { createLocalStoragePersistence } from './PersistenceService'
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

	it('le port n expose QUE ecrire — lire et effacer entrent avec la reprise', () => {
		// KR-109 : deux méthodes sans appelant seraient de la dette publiée. Le jour
		// où la reprise les livre, c'est cette ligne qui tombe, et elle se lit en diff.
		expect(Object.keys(createMagasinDeSession(createLocalStoragePersistence()))).toEqual(['ecrire'])
	})
})
