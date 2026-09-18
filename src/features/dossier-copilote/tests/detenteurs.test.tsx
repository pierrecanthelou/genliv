import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
	createBrain,
	controlerDossier,
	BrainProvider,
	CERTITUDE_INITIALE,
	type Brain,
	type Dossier,
	type Indice,
	type Personnage,
	type ReponseDetenteurs,
} from '../../../brain'
import { PanneauCopilote } from '../components/PanneauCopilote'
import { CARD2_TITRE, TEXTE_REFUS_TROP_LONG } from '../textes'

/**
 * LA CARTE 2 « Tisser les indices » — activée à l'itération 2. Couvre : le
 * `Select` construit depuis `controlerDossier`, jamais depuis
 * `dossier.monde.indices` (§ 3.2 point 3) ; les sept textes d'état
 * discriminés ; l'acceptation détenteur-par-détenteur (`Savoir` à deux clés,
 * ordre persistance-puis-événement, référence orpheline « en course »,
 * KR-234) ; le GEL (§ 3.6) ; le focus post-décision (§ 3.5) ; Annuler et le
 * double-clic.
 *
 * Fichier SÉPARÉ de `panneauCopilote.test.tsx` et `acceptation.test.tsx`
 * (§ 5 du plan) — mêmes petits helpers, DUPLIQUÉS ici à dessein.
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauCopilote dossierId={dossierId} onSelectSection={() => {}} />
		</BrainProvider>,
	)
}

function semerPersonnage(brain: Brain, dossierId: string, personnage: Personnage): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, personnages: [...d.monde.personnages, personnage] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

function semerIndice(brain: Brain, dossierId: string, indice: Indice): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, indices: [...d.monde.indices, indice] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

function retirerIndice(brain: Brain, dossierId: string, indiceId: string): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, indices: d.monde.indices.filter((i) => i.id !== indiceId) },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Retrait refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

function bouchonnerCopilote(brain: Brain, demander: jest.Mock): void {
	brain.copilote = { estDisponible: () => true, demander }
}

function regionCarte2() {
	return screen.getByRole('region', { name: CARD2_TITRE })
}

function reponsePropose(indiceId: string, personnageIds: readonly string[]): ReponseDetenteurs {
	return { statut: 'propose', proposition: { indiceId, personnageIds } }
}

beforeEach(() => window.localStorage.clear())

describe('detenteurs - le Select liste les constats, jamais les indices', () => {
	it('une seule option, celle du constat indice-sans-source — le second indice (silence) n apparait pas', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// A — SIGNALE (zero producteur) : doit apparaitre.
		semerIndice(brain, dossier.id, { id: 'indice.a', nom: 'Sceau brise' })
		// B — SILENCIEUX (deux producteurs ouverts) : ne doit PAS apparaitre, alors
		// qu'il existe bien dans `dossier.monde.indices`.
		semerIndice(brain, dossier.id, { id: 'indice.b', nom: 'Clef rouillee' })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.p1',
			portee: 'premier',
			plan_actions: [],
			savoirs: [{ indice_id: 'indice.b', certitude: CERTITUDE_INITIALE }],
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.p2',
			portee: 'premier',
			plan_actions: [],
			savoirs: [{ indice_id: 'indice.b', certitude: CERTITUDE_INITIALE }],
		})
		bouchonnerCopilote(brain, jest.fn())
		renderPanel(brain, dossier.id)

		const options = within(regionCarte2()).getAllByRole('option')
		expect(options).toHaveLength(1)
		expect(options[0]).toHaveTextContent('Indice « Sceau brise »')
		expect(screen.queryByText(/Clef rouillee/)).toBeNull()
	})
})

describe('detenteurs - sept textes d etat, deux a deux distincts', () => {
	function preparer(demander: jest.Mock): Brain {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.a', nom: 'Sceau brise' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)
		return brain
	}

	const CAS: Array<{ reponse: ReponseDetenteurs; texteAttendu: string; prefixe: boolean }> = [
		{
			reponse: { statut: 'indisponible', raison: 'injoignable' },
			texteAttendu: 'Le copilote est indisponible… Réessayez dans un instant.',
			prefixe: true,
		},
		{
			reponse: { statut: 'illisible', motif: 'schema' },
			texteAttendu: "Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer.",
			prefixe: true,
		},
		{
			reponse: { statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' },
			texteAttendu: "Il manque « TON » pour proposer ce texte — complétez d'abord ce champ.",
			prefixe: true,
		},
		{
			reponse: { statut: 'refuse', motif: 'cible-a-ecrire' },
			texteAttendu: "Cet indice n'a pas encore de vérité écrite — complétez d'abord sa fiche, dans Indices.",
			prefixe: true,
		},
		{
			reponse: { statut: 'refuse', motif: 'aucun-candidat' },
			texteAttendu: "Tous les personnages de ce dossier connaissent déjà cet indice — personne d'autre à désigner.",
			prefixe: true,
		},
		{
			reponse: { statut: 'refuse', motif: 'trop-long' },
			texteAttendu:
				'Le contexte est trop long pour désigner des détenteurs — ce dossier a trop de personnages, ou leurs fiches sont trop longues. Raccourcissez-les, dans Personnages.',
			prefixe: true,
		},
		{
			reponse: reponsePropose('indice.a', []),
			texteAttendu: "Le copilote n'a trouvé personne d'autre pour cet indice.",
			prefixe: false,
		},
	]

	it('chaque cas rend le texte EXACT qui lui correspond, et les sept sont deux a deux differents', async () => {
		const textesRendus: string[] = []
		for (const cas of CAS) {
			const demander = jest.fn().mockResolvedValue(cas.reponse)
			preparer(demander)
			const carte2 = within(regionCarte2())
			fireEvent.click(carte2.getByRole('button', { name: 'Lancer' }))

			const texteComplet = cas.prefixe ? `⊘ ${cas.texteAttendu}` : cas.texteAttendu
			const noeud = await carte2.findByText(texteComplet)
			expect(noeud.textContent).toBe(texteComplet)
			textesRendus.push(noeud.textContent ?? '')

			// screen interroge tout document.body — un panneau laissé monté ferait
			// interferer son propre texte avec la recherche du cas suivant.
			document.body.innerHTML = ''
		}

		expect(new Set(textesRendus).size).toBe(7)
	})

	it('le texte trop-long de la carte 2 est distinct de celui de la carte 1', async () => {
		const demander = jest.fn().mockResolvedValue({ statut: 'refuse', motif: 'trop-long' } as ReponseDetenteurs)
		preparer(demander)
		fireEvent.click(within(regionCarte2()).getByRole('button', { name: 'Lancer' }))

		await within(regionCarte2()).findByText(/Le contexte est trop long pour désigner des détenteurs/)
		expect(within(regionCarte2()).queryByText(`⊘ ${TEXTE_REFUS_TROP_LONG}`)).toBeNull()
	})
})

describe('detenteurs - acceptation', () => {
	function preparer(demander: jest.Mock): { brain: Brain; dossier: Dossier } {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.a', nom: 'Sceau brise' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)
		return { brain, dossier }
	}

	it('accepter pose un Savoir a EXACTEMENT deux cles, certitude = CERTITUDE_INITIALE', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('indice.a', ['pnj.b']))
		const { brain, dossier } = preparer(demander)
		fireEvent.click(within(regionCarte2()).getByRole('button', { name: 'Lancer' }))
		await within(regionCarte2()).findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(within(regionCarte2()).getByRole('button', { name: 'Accepter la proposition' }))

		const savoirs = brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.b')?.savoirs
		expect(savoirs).toHaveLength(1)
		expect(Object.keys(savoirs?.[0] ?? {}).sort()).toEqual(['certitude', 'indice_id'])
		expect(savoirs?.[0]?.certitude).toBe(CERTITUDE_INITIALE)
		expect(savoirs?.[0]?.indice_id).toBe('indice.a')
	})

	it('accepter ecrit via DossierService.update, ordre persistance puis evenement, un seul appel', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('indice.a', ['pnj.b']))
		const { brain, dossier } = preparer(demander)
		fireEvent.click(within(regionCarte2()).getByRole('button', { name: 'Lancer' }))
		await within(regionCarte2()).findByRole('button', { name: 'Accepter la proposition' })

		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(within(regionCarte2()).getByRole('button', { name: 'Accepter la proposition' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(setSpy).toHaveBeenCalled()
		expect(emitSpy).toHaveBeenCalledWith('dossier:updated', { dossierId: dossier.id })
		expect(setSpy.mock.invocationCallOrder[0]).toBeLessThan(emitSpy.mock.invocationCallOrder[0])
		expect(await within(regionCarte2()).findByText('Accepté')).toBeInTheDocument()
	})

	it('reference orpheline par course : indice supprime avant l acceptation, rien persiste, anomalies rendues', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('indice.a', ['pnj.b']))
		const { brain, dossier } = preparer(demander)
		fireEvent.click(within(regionCarte2()).getByRole('button', { name: 'Lancer' }))
		await within(regionCarte2()).findByRole('button', { name: 'Accepter la proposition' })

		// LA COURSE : l'indice cible disparait du dossier ENTRE la proposition et
		// l'acceptation (simule un autre agent/onglet qui l'aurait retire).
		// `act` est OBLIGATOIRE : le retrait emet `dossier:updated`, donc reveille
		// l'abonnement du panneau et pose un `setState` HORS rendu. Sans lui React
		// avertit, et surtout le rendu n'est pas vide au moment ou le test observe.
		act(() => {
			retirerIndice(brain, dossier.id, 'indice.a')
		})

		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(within(regionCarte2()).getByRole('button', { name: 'Accepter la proposition' }))

		expect(setSpy).not.toHaveBeenCalled()
		expect(emitSpy).not.toHaveBeenCalled()
		expect(brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.b')?.savoirs).toHaveLength(0)
		expect(within(regionCarte2()).getByText(/n'existe pas dans ce dossier/)).toBeInTheDocument()
		// Cas NOMINAL (KR-234) : la ligne reste NON DECIDEE, l'auteur peut reessayer.
		expect(within(regionCarte2()).getByRole('button', { name: 'Accepter la proposition' })).toBeInTheDocument()
	})
})

describe('detenteurs - le gel (§ 3.6)', () => {
	it('accepter un premier detenteur fait quitter l indice des constats signales SANS que la carte ne change de cible', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// UN producteur deja present (savoir ouvert) : niveau ALERTE (1 producteur).
		semerIndice(brain, dossier.id, { id: 'indice.gele', nom: 'Indice fige' })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.deja',
			portee: 'premier',
			plan_actions: [],
			savoirs: [{ indice_id: 'indice.gele', certitude: CERTITUDE_INITIALE }],
		})
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.c', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('indice.gele', ['pnj.b', 'pnj.c']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte2 = within(regionCarte2())
		expect(carte2.getByText('ALERTE')).toBeInTheDocument()
		fireEvent.click(carte2.getByRole('button', { name: 'Lancer' }))
		await carte2.findAllByRole('button', { name: 'Accepter la proposition' })

		// L'ACCEPTATION du premier detenteur pousse retenues a 2 : l'indice quitte
		// REELLEMENT `controlerDossier(dossier).controles` (verifie ci-dessous).
		const [premierAccepter] = carte2.getAllByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(premierAccepter)
		await waitFor(() => expect(carte2.getAllByText('Accepté')).toHaveLength(1))

		expect(
			brain.dossiers
				.get(dossier.id)
				?.monde.personnages.filter((p) => p.savoirs.some((s) => s.indice_id === 'indice.gele')).length,
		).toBe(2)
		// LA CARTE NE CHANGE PAS DE CIBLE : le contexte gele reste affiche (le
		// Select ne retombe PAS sur "Aucun indice signale", et le niveau ALERTE
		// gele reste visible), et la ligne restante (pnj.c) reste operable.
		expect(carte2.queryByText('Aucun indice signalé')).toBeNull()
		expect(carte2.getByText('ALERTE')).toBeInTheDocument()
		expect(
			carte2.getByText(
				"Cet indice n'est accessible que par un seul chemin : si le joueur le manque, il devient inaccessible.",
			),
		).toBeInTheDocument()

		fireEvent.click(carte2.getByRole('button', { name: 'Accepter la proposition' }))
		const savoirC = brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.c')?.savoirs[0]
		expect(savoirC?.indice_id).toBe('indice.gele')
	})

	/**
	 * AJOUTÉ À LA REVUE DE PR (finding n° 1). Le témoin ci-dessus ne SÉPARE PAS :
	 * mesuré, il reste VERT quand on retire la priorité du gel sur `constatId`.
	 * Motif, mesuré lui aussi : à UN SEUL constat, retirer le gel met `constatId`
	 * à `''` ; React ne marque alors AUCUNE `<option>` `selected`, et un `<select>`
	 * de taille 1 sans option sélectionnée retombe par SPEC sur la PREMIÈRE — qui
	 * est l'option gelée. L'écran reste donc juste par accident.
	 *
	 * Le défaut n'est atteignable qu'à DEUX constats : l'indice gelé quitte la
	 * liste vive, `constatsLive[0]` devient l'AUTRE constat, et le `Select` nomme
	 * une cible que la carte ne sert pas. Rien ne corrompt — `handleAccepter` lit
	 * `contexteGele.indiceId` — mais l'écran ment pendant que l'auteur ratifie.
	 */
	it('a DEUX constats, le Select reste sur la cible gelee et ne bascule pas sur l autre', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// A — la cible : UN producteur deja present, donc ALERTE. Deux detenteurs
		// proposes ; en accepter UN le fait passer a 2 producteurs, donc SILENCE.
		semerIndice(brain, dossier.id, { id: 'indice.a', nom: 'Sceau brise' })
		// B — un SECOND constat, zero producteur, qui ne bouge pas de la seance.
		// C'est lui que `constatsLive[0]` offrirait si le gel ne primait pas.
		semerIndice(brain, dossier.id, { id: 'indice.b', nom: 'Clef rouillee' })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.deja',
			portee: 'premier',
			plan_actions: [],
			savoirs: [{ indice_id: 'indice.a', certitude: CERTITUDE_INITIALE }],
		})
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.c', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('indice.a', ['pnj.b', 'pnj.c']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte2 = within(regionCarte2())
		const sel = (): HTMLSelectElement => carte2.getByRole('combobox') as HTMLSelectElement
		// L'ordre du registre donne `indice.a` en premier : c'est la cible par defaut.
		expect(sel().value).toBe('indice.a')
		fireEvent.click(carte2.getByRole('button', { name: 'Lancer' }))
		await carte2.findAllByRole('button', { name: 'Accepter la proposition' })

		const [premierAccepter] = carte2.getAllByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(premierAccepter)
		await waitFor(() => expect(carte2.getAllByText('Accepté')).toHaveLength(1))

		// LA PREMISSE, lue sur la donnee et jamais promise en prose : `indice.a` a
		// REELLEMENT quitte les constats, et `indice.b` est REELLEMENT ce que la
		// derivation vive offrirait a sa place.
		const constats = controlerDossier(brain.dossiers.get(dossier.id)!).controles.filter(
			(c) => c.id === 'indice-sans-source',
		)
		expect(constats.map((c) => c.entityId)).toEqual(['indice.b'])

		// LE TEMOIN : la cible gelee prime. Sans la priorite du gel, `constatId`
		// vaudrait `indice.b` et cette ligne rougit.
		expect(sel().value).toBe('indice.a')
		// Et « Lancer » ne peut plus etre declenche sur une cible qui a quitte la
		// liste : sans quoi il ferait un `find` infructueux et rendrait la main
		// SANS AUCUN RETOUR D'ECRAN (finding n° 2).
		expect(carte2.getByRole('button', { name: 'Lancer' })).toBeDisabled()

		// LA CONTREPARTIE DU GEL, sans laquelle le correctif ci-dessus produit un
		// defaut PIRE que celui qu'il ferme : si `handleChangerConstat` ne degelait
		// pas, la cible gelee primerait POUR TOUJOURS et le Select serait
		// definitivement bloque -- un ecran mort. Retirer `setContexteGele(null)`
		// laisse tout le reste de la suite VERT ; seules ces trois lignes le voient.
		fireEvent.change(sel(), { target: { value: 'indice.b' } })
		expect(sel().value).toBe('indice.b')
		// La proposition en cours est abandonnee : elle appartenait a l'autre indice.
		expect(carte2.queryByRole('button', { name: 'Accepter la proposition' })).toBeNull()
		// Et « Lancer » redevient actif, la nouvelle cible etant, elle, signalee.
		expect(carte2.getByRole('button', { name: 'Lancer' })).toBeEnabled()
	})
})

describe('detenteurs - focus apres decision (§ 3.5)', () => {
	it('le focus se pose sur le + de la prochaine ligne non decidee, puis revient sur Lancer', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.a', nom: 'Sceau brise' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.c', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.d', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('indice.a', ['pnj.b', 'pnj.c', 'pnj.d']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte2 = within(regionCarte2())
		fireEvent.click(carte2.getByRole('button', { name: 'Lancer' }))
		await carte2.findAllByRole('button', { name: 'Accepter la proposition' })

		const [accepterB, accepterC, accepterD] = carte2.getAllByRole('button', { name: 'Accepter la proposition' })
		const [, rejeterC, rejeterD] = carte2.getAllByRole('button', { name: 'Rejeter la proposition' })

		fireEvent.click(accepterB)
		await waitFor(() => expect(accepterC).toHaveFocus())

		fireEvent.click(rejeterC)
		await waitFor(() => expect(accepterD).toHaveFocus())

		// LA DERNIERE DECISION EST UN REJET, ET C'EST DELIBERE. Un rejet n'ecrit
		// rien : `indice.a` garde UN producteur (pnj.b accepte plus haut), reste
		// donc signale en ALERTE, et « Lancer » reste ACTIF -- le retour du focus
		// sur lui est alors un contrat qu'un vrai navigateur tient.
		// AVEC UNE ACCEPTATION ICI, il ne le tiendrait PAS : deux producteurs
		// eteignent le constat, `constatVivant` devient faux, et `focusLancer()`
		// vise un bouton que React desactive dans le meme rendu. jsdom laisse le
		// focus s'y poser, un navigateur le renvoie a `body`. Le temoin serait
		// vert PAR L'ENVIRONNEMENT et non par le mecanisme -- meme mode de panne
		// que le premier temoin du gel (BUG-101). Dette nommee : BUG-106.
		fireEvent.click(rejeterD)
		await waitFor(() => expect(carte2.getByRole('button', { name: 'Lancer' })).toHaveFocus())
		expect(carte2.getByRole('button', { name: 'Lancer' })).toBeEnabled()
	})
})

describe('detenteurs - Annuler pendant l appel', () => {
	it('Annuler ferme la region status sans ecrire de decision', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.a', nom: 'Sceau brise' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn(() => new Promise<ReponseDetenteurs>(() => {}))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte2 = within(regionCarte2())
		fireEvent.click(carte2.getByRole('button', { name: 'Lancer' }))
		expect(carte2.getByRole('status')).toBeInTheDocument()

		fireEvent.click(carte2.getByRole('button', { name: 'Annuler' }))

		expect(carte2.queryByRole('status')).toBeNull()
		expect(carte2.queryByRole('button', { name: 'Accepter la proposition' })).toBeNull()
		expect(carte2.getByRole('button', { name: 'Lancer' })).not.toBeDisabled()
	})
})

describe('detenteurs - double clic Lancer', () => {
	it('deux clics synchrones ne produisent qu un seul appel a demander', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.a', nom: 'Sceau brise' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn(() => new Promise<ReponseDetenteurs>(() => {}))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const lancer = within(regionCarte2()).getByRole('button', { name: 'Lancer' })

		// Les DEUX clics dans le MEME act() : React 18 les traite comme un seul lot,
		// donc le second frappe le DOM AVANT que `disabled` n'ait ete re-rendu — le
		// seul garde encore actif a cet instant est `enVolRef` (meme mutant
		// obligatoire que la carte 1, `panneauCopilote.test.tsx`).
		act(() => {
			fireEvent.click(lancer)
			fireEvent.click(lancer)
		})

		expect(demander).toHaveBeenCalledTimes(1)
	})
})
