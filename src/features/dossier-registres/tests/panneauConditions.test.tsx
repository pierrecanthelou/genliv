import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	frapperIdentifiant,
	type Brain,
	type Dossier,
	type Climat,
	type Delta,
	type Entite,
} from '../../../brain'
import { PanneauConditions } from '../components/PanneauConditions'
import { FicheClimat, type BrouillonClimat } from '../components/FicheClimat'

/**
 * L'écran Conditions — le 10ᵉ et dernier panneau de la feature (§3 du plan
 * d'itération 5 de `dossier-registres`). Précédent direct `PanneauQuetes.tsx`
 * (it3) pour l'anatomie liste/fiche et le réordonnancement ; ce qui lui est
 * PROPRE et que ces tests éprouvent en plus : la DURÉE (bloc à deux états,
 * moteur, aucun repli implicite au montage), la MANIFESTATION (prose `ia`
 * bornée, avertissement de budget RENDU) et l'ABSENCE TOTALE de tout
 * `EditeurEffets` — `effets_regles` traverse intact, jamais lu ni écrit par
 * cet écran.
 */

const CHEMIN_REFERENCE = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'brain',
	'dossier',
	'__fixtures__',
	'dossier-reference.json',
)

function texteReference(): string {
	return fs.readFileSync(CHEMIN_REFERENCE, 'utf8')
}

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauConditions dossierId={dossierId} />
		</BrainProvider>,
	)
}

/** Sème un climat ENTIER par le CHEMIN PUBLIC d'écriture (`dossiers.update()`,
 *  précédent `panneauQuetes.test.tsx`/`semerQuete`) — jamais un
 *  `persistence.set` derrière le service. */
function semerClimat(brain: Brain, dossierId: string, climat: Climat): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, conditions: { ...d.monde.conditions, climat: [...d.monde.conditions.climat, climat] } },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Sème un objet — nécessaire comme cible d'un effet `donner_objet` posé sur
 *  `effets_regles` (critère #6, non-corruption). */
function semerObjet(brain: Brain, dossierId: string, objet: Entite): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, objets: [...d.monde.objets, objet] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Le dossier persisté, ou une erreur explicite — jamais un `?.` qui masque un null. */
function lire(brain: Brain, dossierId: string): Dossier {
	const dossier = brain.dossiers.get(dossierId)
	if (dossier === null) throw new Error(`Dossier introuvable : ${dossierId}`)
	return dossier
}

/** Les lignes de climats, jamais les boutons Monter/Descendre/+Ajouter. */
function lesLignesClimats(): HTMLElement[] {
	return screen.getAllByRole('button').filter((bouton) => bouton.textContent?.startsWith('Climat'))
}

/** Une manifestation de N mots EXACTS — construite plutôt que comptée à l'œil. */
function manifestationDe(nombreDeMots: number): string {
	return Array.from({ length: nombreDeMots }, (_, i) => `mot${i + 1}`).join(' ')
}

describe('PanneauConditions', () => {
	beforeEach(() => window.localStorage.clear())

	it('etat vide: aucun climat affiche le placeholder invitant a ajouter (cas limite registre vide)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		expect(dossier.monde.conditions.climat).toHaveLength(0)
		renderPanel(brain, dossier.id)

		expect(screen.getByText('CONDITIONS')).toBeInTheDocument()
		expect(screen.getByText('Aucun climat — cliquez « + Ajouter un climat… » pour commencer.')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '+ Ajouter un climat…' })).toBeInTheDocument()
	})

	it('+ Ajouter un climat: commit immediat, effets_regles seul, focus sur NOM (critere #7)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un climat…' }))

		const climats = lire(brain, dossier.id).monde.conditions.climat
		expect(climats).toHaveLength(1)
		expect(climats[0].effets_regles).toEqual([])
		expect(climats[0].nom).toBeUndefined()
		expect(climats[0].duree).toBeUndefined()
		expect(climats[0].manifestation).toBeUndefined()

		expect(lesLignesClimats()).toHaveLength(1)
		expect(screen.getByText('Climat n°1 (sans nom)')).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /nom du climat/i })).toHaveFocus()
	})

	it('DUREE: aucun repli implicite au montage (critere #7)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const seme = semerClimat(brain, dossier.id, { id: frapperIdentifiant('climat'), effets_regles: [] })
		expect(seme.monde.conditions.climat[0].duree).toBeUndefined()

		// Le spy est posé APRES le seed (qui, lui, committe legitimement) : seul le
		// MONTAGE du panneau/de la fiche est sous surveillance.
		const spy = jest.spyOn(brain.dossiers, 'update')
		renderPanel(brain, dossier.id)

		expect(screen.getByRole('button', { name: '+ Poser une durée…' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /diminuer DURÉE/i })).toBeNull()
		expect(spy).not.toHaveBeenCalled()

		expect(lire(brain, dossier.id).monde.conditions.climat[0].duree).toBeUndefined()
	})

	it('un climat sans duree ni manifestation ne rend AUCUNE region status (cas limite, etat calme)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const seme = semerClimat(brain, dossier.id, { id: frapperIdentifiant('climat'), effets_regles: [] })
		expect(seme.monde.conditions.climat[0].duree).toBeUndefined()
		expect(seme.monde.conditions.climat[0].manifestation).toBeUndefined()

		renderPanel(brain, dossier.id)

		// Ni le bandeau d'avertissement de budget, ni le bandeau de refus : les DEUX
		// portent role="status" et peuvent coexister, donc l'absence se prouve sur la
		// LISTE COMPLETE, jamais par un getByRole nu (KR-189). C'est la contre-epreuve
		// du critere #8 : sans elle, un bandeau semé au montage passerait inaperçu.
		expect(screen.queryAllByRole('status')).toHaveLength(0)
	})

	it('poser une duree: committe DUREE_MIN au clic puis edite via le Stepper, min seul (critere #7)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerClimat(brain, dossier.id, { id: frapperIdentifiant('climat'), effets_regles: [] })
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Poser une durée…' }))

		expect(lire(brain, dossier.id).monde.conditions.climat[0].duree).toBe(1)
		expect(screen.queryByRole('button', { name: '+ Poser une durée…' })).toBeNull()
		const augmenter = screen.getByRole('button', { name: /augmenter DURÉE/i })

		await user.click(augmenter)

		expect(lire(brain, dossier.id).monde.conditions.climat[0].duree).toBe(2)
	})

	it('reorder a deux climats: monter et descendre par identifiant, libelle sans nom en repli (cas limite)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerClimat(brain, dossier.id, { id: 'climat.premier', nom: 'Tempête de cendres', effets_regles: [] })
		semerClimat(brain, dossier.id, { id: 'climat.second', effets_regles: [] })
		renderPanel(brain, dossier.id)

		expect(screen.getByRole('button', { name: 'Descendre le climat « Tempête de cendres »' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Monter le climat n°2 (sans nom)' })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Descendre le climat « Tempête de cendres »' }))

		const climats = lire(brain, dossier.id).monde.conditions.climat
		expect(climats.map((c) => c.id)).toEqual(['climat.second', 'climat.premier'])
	})

	it('manifestation trop longue: l avertissement est rendu, distinct du bandeau de refus (critere #8)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerClimat(brain, dossier.id, {
			id: 'climat.brume',
			nom: 'Brume tenace',
			manifestation: manifestationDe(21),
			effets_regles: [],
		})
		renderPanel(brain, dossier.id)

		const regions = screen.getAllByRole('status')
		expect(regions).toHaveLength(1)
		expect(screen.getByText('ENREGISTRÉ, AVEC AVERTISSEMENT')).toBeInTheDocument()
		expect(screen.getByText(/La manifestation de ce climat compte 21 mots/)).toBeInTheDocument()
		expect(screen.queryByText("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")).toBeNull()
	})

	it('manifestation au budget (20 mots): aucun avertissement (cas limite, borne exacte)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerClimat(brain, dossier.id, {
			id: 'climat.calme',
			nom: 'Ciel calme',
			manifestation: manifestationDe(20),
			effets_regles: [],
		})
		renderPanel(brain, dossier.id)

		expect(screen.queryAllByRole('status')).toHaveLength(0)
	})

	it('aucun EditeurEffets ne se rend sur FicheClimat (critere #5)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerClimat(brain, dossier.id, { id: 'climat.seul', nom: 'Un climat', effets_regles: [] })
		renderPanel(brain, dossier.id)

		expect(screen.getByRole('button', { name: new RegExp('climat\\.seul') })).toBeInTheDocument()
		expect(screen.queryByText('+ Ajouter un effet…')).toBeNull()
		expect(screen.queryByText(/EFFETS DE RÈGLE/i)).toBeNull()
		expect(screen.queryByRole('combobox', { name: 'EFFET' })).toBeNull()
	})

	it('editer les trois champs d un climat porteur d un effets_regles non vide le laisse intact (critere #6)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		let dossier = brain.dossiers.create('Un dossier')
		dossier = semerObjet(brain, dossier.id, { id: 'objet.lanterne', nom: 'Une lanterne' })
		const effet: Delta = { delta: 'donner_objet', cibles: ['objet.lanterne'] }
		dossier = semerClimat(brain, dossier.id, {
			id: 'climat.charge',
			nom: 'Avant',
			effets_regles: [effet],
		})
		expect(dossier.monde.conditions.climat[0].effets_regles).toEqual([effet])
		renderPanel(brain, dossier.id)

		const champNom = screen.getByRole('textbox', { name: /nom du climat/i })
		fireEvent.change(champNom, { target: { value: 'Après' } })
		fireEvent.blur(champNom)

		await user.click(screen.getByRole('button', { name: '+ Poser une durée…' }))
		await user.click(screen.getByRole('button', { name: /augmenter DURÉE/i }))

		const champManifestation = screen.getByRole('textbox', { name: /manifestation/i })
		fireEvent.change(champManifestation, { target: { value: 'La brume avale les toits du village endormi.' } })
		fireEvent.blur(champManifestation)

		const apres = lire(brain, dossier.id).monde.conditions.climat[0]
		expect(apres.nom).toBe('Après')
		expect(apres.duree).toBe(2)
		expect(apres.manifestation).toBe('La brume avale les toits du village endormi.')
		expect(apres.effets_regles).toEqual([effet])
	})

	/**
	 * KR-187/KR-159 — test-grep de non-régression, chiffre REMESURÉ dans
	 * `sections.ts` (10 sections au total, 9 hors Conditions) : canon,
	 * charpente.depart, personnages, lieux, objets, indices, quêtes,
	 * événements, charpente.jalons/fins. Utilise le dossier de RÉFÉRENCE (pas
	 * un dossier neuf) : les 9 autres sections y sont réellement PEUPLÉES.
	 */
	it('isolation des 9 autres sections: elles restent intactes apres ajout, edition, reorder et duree', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const avant = inspection.dossier
		renderPanel(brain, avant.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un climat…' }))
		const champNom = screen.getByRole('textbox', { name: /nom du climat/i })
		fireEvent.change(champNom, { target: { value: 'Un nouveau climat' } })
		fireEvent.blur(champNom)

		await user.click(screen.getByRole('button', { name: 'Monter le climat « Un nouveau climat »' }))

		// Selectionne le climat de la reference pour y exercer duree/manifestation.
		await user.click(screen.getByRole('button', { name: new RegExp('climat\\.cendres-tenaces') }))
		await user.click(screen.getByRole('button', { name: /augmenter DURÉE/i }))
		const champManifestation = screen.getByRole('textbox', { name: /manifestation/i })
		fireEvent.change(champManifestation, { target: { value: 'Une manifestation modifiee par le test.' } })
		fireEvent.blur(champManifestation)

		const apres = lire(brain, avant.id)
		expect(apres.canon).toEqual(avant.canon)
		expect(apres.charpente.depart).toEqual(avant.charpente.depart)
		expect(apres.charpente.jalons).toEqual(avant.charpente.jalons)
		expect(apres.charpente.fins).toEqual(avant.charpente.fins)
		expect(apres.monde.personnages).toEqual(avant.monde.personnages)
		expect(apres.monde.lieux).toEqual(avant.monde.lieux)
		expect(apres.monde.objets).toEqual(avant.monde.objets)
		expect(apres.monde.indices).toEqual(avant.monde.indices)
		expect(apres.monde.quetes).toEqual(avant.monde.quetes)
		expect(apres.monde.evenements).toEqual(avant.monde.evenements)

		// La section Conditions, elle, a bien change (sinon ce test ne prouverait rien).
		expect(apres.monde.conditions).not.toEqual(avant.monde.conditions)
		const climatEdite = apres.monde.conditions.climat.find((c) => c.id === 'climat.cendres-tenaces')
		expect(climatEdite?.duree).toBe((avant.monde.conditions.climat[0].duree ?? 0) + 1)
		expect(climatEdite?.manifestation).toBe('Une manifestation modifiee par le test.')
		expect(climatEdite?.effets_regles).toEqual(avant.monde.conditions.climat[0].effets_regles)
	})
})

/**
 * `FicheClimat` — composant PUREMENT DE RENDU, éprouvé isolément pour la
 * garde de refus/avertissement sans dépendre de `DossierService`. Précédent
 * exact : « FicheJalon » (`panneauJalonsFins.test.tsx`, rendu pur).
 */
describe('FicheClimat (rendu pur)', () => {
	const handlers = {
		onChangeChamp: jest.fn(),
		onBlurChamp: jest.fn(),
		onChangeDuree: jest.fn(),
	}
	const brouillonVide: BrouillonClimat = { nom: '', manifestation: '' }

	beforeEach(() => {
		Object.values(handlers).forEach((fn) => fn.mockClear())
	})

	it('bandeau de refus rendu, distinct de toute region avertissement absente', () => {
		const climat: Climat = { id: 'climat.a', nom: 'A', effets_regles: [] }
		render(
			<FicheClimat
				climat={climat}
				brouillon={{ ...brouillonVide, nom: 'A' }}
				avertissements={[]}
				refus={{ statut: 'refuse', issues: [] }}
				nomInputRef={{ current: null }}
				{...handlers}
			/>,
		)

		expect(screen.getAllByRole('status')).toHaveLength(1)
		expect(screen.getByText("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")).toBeInTheDocument()
	})

	it('dossier absent: le texte de remediation dedie est affiche', () => {
		const climat: Climat = { id: 'climat.a', nom: 'A', effets_regles: [] }
		render(
			<FicheClimat
				climat={climat}
				brouillon={{ ...brouillonVide, nom: 'A' }}
				avertissements={[]}
				refus={{ statut: 'absent', issues: [] }}
				nomInputRef={{ current: null }}
				{...handlers}
			/>,
		)

		expect(
			screen.getByText("Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."),
		).toBeInTheDocument()
	})
})
