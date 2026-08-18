import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	frapperIdentifiant,
	PORTEE_INITIALE,
	type Brain,
	type Dossier,
	type Quete,
	type Delta,
	type Entite,
	type Personnage,
} from '../../../brain'
import { PanneauQuetes } from '../components/PanneauQuetes'
import { FicheQuete, type BrouillonQuete } from '../components/FicheQuete'
import { EditeurEffets } from '../components/EditeurEffets'

/**
 * L'écran Quêtes — liste `ListRow` à gauche, fiche à droite (§3 du plan
 * d'itération 3 de `dossier-registres`). Précédent direct `PanneauIndices.tsx`
 * (it1) pour l'anatomie ; ce qui lui est PROPRE et que ces tests éprouvent en
 * plus : le DONNEUR (idiome « porte »), les ÉTAPES à brouillon différé
 * (`useEcritureEtapes.ts`, étiquette dérivée de la position, jamais stockée)
 * et l'éditeur de RÉCOMPENSE (`EditeurEffets`, ajout à deux temps, deux effets
 * identiques rendus en deux lignes distinctes).
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
			<PanneauQuetes dossierId={dossierId} />
		</BrainProvider>,
	)
}

/** Sème une quête ENTIÈRE par le CHEMIN PUBLIC d'écriture (`dossiers.update()`,
 *  précédent `panneauIndices.test.tsx`/`semerIndice`) — jamais un
 *  `persistence.set` derrière le service. */
function semerQuete(brain: Brain, dossierId: string, quete: Quete): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, quetes: [...d.monde.quetes, quete] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Sème un objet — nécessaire comme cible d'un effet `donner_objet`/`retirer_objet`. */
function semerObjet(brain: Brain, dossierId: string, objet: Entite): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, objets: [...d.monde.objets, objet] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Sème un personnage minimal — nécessaire comme DONNEUR (`espace pnj`). */
function semerPersonnage(brain: Brain, dossierId: string, personnage: Personnage): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, personnages: [...d.monde.personnages, personnage] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

function personnageMinimal(id: string, nom: string): Personnage {
	return { id, nom, portee: PORTEE_INITIALE, plan_actions: [], savoirs: [] }
}

/** Le dossier persisté, ou une erreur explicite — jamais un `?.` qui masque un null. */
function lire(brain: Brain, dossierId: string): Dossier {
	const dossier = brain.dossiers.get(dossierId)
	if (dossier === null) throw new Error(`Dossier introuvable : ${dossierId}`)
	return dossier
}

/** Les lignes de quêtes, jamais les boutons Monter/Descendre/+Ajouter. */
function lesLignesQuetes(): HTMLElement[] {
	return screen.getAllByRole('button').filter((bouton) => bouton.textContent?.startsWith('Quête'))
}

describe('PanneauQuetes', () => {
	beforeEach(() => window.localStorage.clear())

	it('ajout immediat: commit sans champ requis, apparait dans la liste (critere #4)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		expect(dossier.monde.quetes).toHaveLength(0)
		renderPanel(brain, dossier.id)

		expect(screen.getByText('Aucune quête — cliquez « + Ajouter une quête… » pour commencer.')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: '+ Ajouter une quête…' }))

		const quetes = lire(brain, dossier.id).monde.quetes
		expect(quetes).toHaveLength(1)
		expect(quetes[0].recompense).toEqual([])
		expect(quetes[0].nom).toBeUndefined()
		expect(quetes[0].donneur_id).toBeUndefined()
		expect(quetes[0].etapes).toBeUndefined()

		expect(lesLignesQuetes()).toHaveLength(1)
		expect(screen.getByText('Quête n°1 (sans nom)')).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /nom de la quête/i })).toHaveFocus()
	})

	it('donneur, choix et retrait: persiste, resout, puis remet undefined (critere #5)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		let dossier = brain.dossiers.create('Un dossier')
		dossier = semerPersonnage(brain, dossier.id, personnageMinimal('pnj.mira', 'Mira la Guérisseuse'))
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter une quête…' }))

		const comboboxAbsent = screen.getByRole('combobox', { name: 'DONNEUR' })
		expect(comboboxAbsent).toHaveValue('')
		expect(screen.queryByRole('button', { name: 'Retirer le donneur' })).toBeNull()

		await user.selectOptions(comboboxAbsent, 'pnj.mira')

		expect(lire(brain, dossier.id).monde.quetes[0].donneur_id).toBe('pnj.mira')
		const comboboxResolu = screen.getByRole('combobox', { name: 'DONNEUR' })
		expect(comboboxResolu).toHaveValue('pnj.mira')

		await user.click(screen.getByRole('button', { name: 'Retirer le donneur' }))

		expect(lire(brain, dossier.id).monde.quetes[0].donneur_id).toBeUndefined()
		expect(screen.getByRole('combobox', { name: 'DONNEUR' })).toHaveValue('')
		expect(screen.queryByRole('button', { name: 'Retirer le donneur' })).toBeNull()
	})

	it('ajout etape differe: rien avant blur non vide, commit ensuite (critere #6)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)
		await user.click(screen.getByRole('button', { name: '+ Ajouter une quête…' }))

		await user.click(screen.getByRole('button', { name: '+ Ajouter une étape…' }))

		expect(lire(brain, dossier.id).monde.quetes[0].etapes ?? []).toHaveLength(0)
		expect(screen.getByText('ÉTAPE 1')).toBeInTheDocument()
		const champLibelle = screen.getByRole('textbox', { name: /^LIBELLÉ/ })
		expect(champLibelle).toHaveValue('')

		fireEvent.blur(champLibelle)
		expect(lire(brain, dossier.id).monde.quetes[0].etapes ?? []).toHaveLength(0)

		fireEvent.change(champLibelle, { target: { value: 'Convaincre le passeur.' } })
		fireEvent.blur(champLibelle)

		const etapes = lire(brain, dossier.id).monde.quetes[0].etapes
		expect(etapes).toEqual([{ libelle: 'Convaincre le passeur.' }])
	})

	it('etiquette ETAPE derivee de la position: sequentielle apres retrait du milieu (critere #6)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const { dossier } = inspection
		const etapesAvant = dossier.monde.quetes[0].etapes ?? []
		expect(etapesAvant).toHaveLength(3)
		renderPanel(brain, dossier.id)

		expect(screen.getByText('ÉTAPE 1')).toBeInTheDocument()
		expect(screen.getByText('ÉTAPE 2')).toBeInTheDocument()
		expect(screen.getByText('ÉTAPE 3')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: "Retirer l'étape n°2" }))

		const etapesApres = lire(brain, dossier.id).monde.quetes[0].etapes
		expect(etapesApres).toEqual([etapesAvant[0], etapesAvant[2]])
		expect(screen.getByText('ÉTAPE 1')).toBeInTheDocument()
		expect(screen.getByText('ÉTAPE 2')).toBeInTheDocument()
		expect(screen.queryByText('ÉTAPE 3')).toBeNull()
		const libelles = screen.getAllByRole('textbox', { name: /^LIBELLÉ/ })
		expect(libelles[0]).toHaveValue(etapesAvant[0].libelle)
		expect(libelles[1]).toHaveValue(etapesAvant[2].libelle)
	})

	it('ajout effet a deux temps: EFFET seul ne committe rien, CIBLE choisie committe (critere #7)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		let dossier = brain.dossiers.create('Un dossier')
		dossier = semerObjet(brain, dossier.id, { id: 'objet.epee', nom: 'Une épée' })
		renderPanel(brain, dossier.id)
		await user.click(screen.getByRole('button', { name: '+ Ajouter une quête…' }))

		await user.click(screen.getByRole('button', { name: '+ Ajouter un effet…' }))

		const comboboxEffet = screen.getByRole('combobox', { name: 'EFFET' })
		expect(comboboxEffet).toHaveValue('donner_objet')
		const comboboxCible = screen.getByRole('combobox', { name: 'CIBLE' })
		expect(comboboxCible).toHaveValue('')
		expect(lire(brain, dossier.id).monde.quetes[0].recompense).toEqual([])

		await user.selectOptions(comboboxCible, 'objet.epee')

		expect(lire(brain, dossier.id).monde.quetes[0].recompense).toEqual([
			{ delta: 'donner_objet', cibles: ['objet.epee'] },
		])
	})

	it('deux effets identiques rendus en deux lignes distinctes, cle React = index (critere #7)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		let dossier = brain.dossiers.create('Un dossier')
		dossier = semerObjet(brain, dossier.id, { id: 'objet.epee', nom: 'Une épée' })
		const identique: Delta = { delta: 'donner_objet', cibles: ['objet.epee'] }
		dossier = semerQuete(brain, dossier.id, {
			id: frapperIdentifiant('quete'),
			recompense: [identique, identique],
		})
		renderPanel(brain, dossier.id)

		const boutonsRetrait = screen.getAllByRole('button', { name: 'Retirer cet effet' })
		expect(boutonsRetrait).toHaveLength(2)
		const combosEffet = screen.getAllByRole('combobox', { name: 'EFFET' })
		expect(combosEffet).toHaveLength(2)
		expect(combosEffet[0]).toHaveValue('donner_objet')
		expect(combosEffet[1]).toHaveValue('donner_objet')

		await user.click(boutonsRetrait[0])

		expect(lire(brain, dossier.id).monde.quetes[0].recompense).toEqual([identique])
	})

	it('etat vide de RECOMPENSE: texte dedie sur une quete sans effet (critere #8)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)
		await user.click(screen.getByRole('button', { name: '+ Ajouter une quête…' }))

		expect(screen.getByText('Aucune récompense — cliquez « + Ajouter un effet… » pour commencer.')).toBeInTheDocument()
	})

	/**
	 * KR-187 — test-grep de non-régression : cette feature possède désormais
	 * TROIS sections (Indices, index 6 ; Quêtes, index 7 ; Jalons & fins, index
	 * 10). Les 9 AUTRES sections du dossier (canon, charpente.depart,
	 * personnages, lieux, objets, indices, evenements, conditions,
	 * charpente.jalons/fins) doivent rester INTACTES après tout geste posé sur
	 * `monde.quetes` — ajout, édition, réordonnancement, donneur, étape, effet.
	 * Utilise le dossier de RÉFÉRENCE (pas un dossier neuf) : les 9 autres
	 * sections y sont réellement PEUPLÉES, ce qui rend la comparaison
	 * significative plutôt que vide-contre-vide.
	 */
	it('isolation des 9 autres sections: elles restent intactes apres ajout, edition, reorder, donneur, etape et effet', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const avant = inspection.dossier
		renderPanel(brain, avant.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter une quête…' }))
		const champNom = screen.getByRole('textbox', { name: /nom de la quête/i })
		fireEvent.change(champNom, { target: { value: 'Une nouvelle quête' } })
		fireEvent.blur(champNom)

		await user.click(screen.getByRole('button', { name: 'Monter la quête « Une nouvelle quête »' }))

		// Selectionne la quete de la reference pour y exercer donneur/etape/effet.
		await user.click(screen.getByRole('button', { name: new RegExp('quete\\.retrouver-la-vigie') }))
		await user.selectOptions(screen.getByRole('combobox', { name: 'DONNEUR' }), 'pnj.corvin-le-marchand')
		await user.click(screen.getByRole('button', { name: '+ Ajouter une étape…' }))
		// La quête de référence porte déjà 3 étapes : le brouillon d'ajout est le
		// DERNIER champ LIBELLÉ rendu (toujours en dernière position).
		const champsLibelle = screen.getAllByRole('textbox', { name: /^LIBELLÉ/ })
		const champLibelle = champsLibelle[champsLibelle.length - 1]
		fireEvent.change(champLibelle, { target: { value: 'Une etape de plus.' } })
		fireEvent.blur(champLibelle)
		await user.click(screen.getByRole('button', { name: '+ Ajouter un effet…' }))
		// La quête de référence porte déjà 2 récompenses (donc 2 `Select` CIBLE) :
		// le brouillon d'ajout est le DERNIER, toujours en dernière position.
		const combosCible = screen.getAllByRole('combobox', { name: 'CIBLE' })
		await user.selectOptions(combosCible[combosCible.length - 1], 'objet.sceau-de-cendre')

		const apres = lire(brain, avant.id)
		expect(apres.canon).toEqual(avant.canon)
		expect(apres.charpente.depart).toEqual(avant.charpente.depart)
		expect(apres.charpente.jalons).toEqual(avant.charpente.jalons)
		expect(apres.charpente.fins).toEqual(avant.charpente.fins)
		expect(apres.monde.personnages).toEqual(avant.monde.personnages)
		expect(apres.monde.lieux).toEqual(avant.monde.lieux)
		expect(apres.monde.objets).toEqual(avant.monde.objets)
		expect(apres.monde.indices).toEqual(avant.monde.indices)
		expect(apres.monde.evenements).toEqual(avant.monde.evenements)
		expect(apres.monde.conditions).toEqual(avant.monde.conditions)

		// La section Quêtes, elle, a bien change (sinon ce test ne prouverait rien).
		expect(apres.monde.quetes).not.toEqual(avant.monde.quetes)
		const queteEditee = apres.monde.quetes.find((q) => q.id === 'quete.retrouver-la-vigie')
		expect(queteEditee?.donneur_id).toBe('pnj.corvin-le-marchand')
		expect(queteEditee?.etapes).toHaveLength(4)
		expect(queteEditee?.recompense).toHaveLength(3)
	})
})

/**
 * `FicheQuete`/`EditeurEffets` — composants PUREMENT DE RENDU, éprouvés
 * isolément pour la discriminance orphelin/valide (critère #5/#7) : un
 * `donneur_id`/une cible d'effet corrompus à un id inexistant sont REFUSÉS par
 * `validateDossier` (`reference-pendante`, erreur bloquante) — ce scénario
 * n'est donc atteignable QUE par un rendu direct à props construites, jamais
 * via `DossierService.update()` réel. Précédent exact : « FicheIndice -
 * section MENE A (rendu pur) », `panneauIndices.test.tsx`.
 */
describe('FicheQuete - DONNEUR (rendu pur)', () => {
	const handlers = {
		onChangeChamp: jest.fn(),
		onBlurChamp: jest.fn(),
		onChangeDonneur: jest.fn(),
		onChangeEtape: jest.fn(),
		onBlurEtape: jest.fn(),
		onAjouterEtape: jest.fn(),
		onRetirerEtape: jest.fn(),
		onAjouterEffet: jest.fn(),
		onChangerCibleEffet: jest.fn(),
		onRetirerEffet: jest.fn(),
	}
	const brouillonVide: BrouillonQuete = { nom: '', consigne: '', echeance: '' }

	beforeEach(() => {
		Object.values(handlers).forEach((fn) => fn.mockClear())
	})

	it('donneur orphelin affiche, jamais retire silencieusement (critere #5)', () => {
		const quete: Quete = { id: 'quete.a', nom: 'A', donneur_id: 'pnj.disparu', recompense: [] }

		render(
			<FicheQuete
				quete={quete}
				personnages={[]}
				brouillon={{ ...brouillonVide, nom: 'A' }}
				etapes={[]}
				entitesParEspace={{}}
				refus={null}
				nomInputRef={{ current: null }}
				{...handlers}
			/>,
		)

		const combobox = screen.getByRole('combobox', { name: 'DONNEUR' })
		expect(combobox).toHaveValue('pnj.disparu')
		expect(screen.getByText('Personnage introuvable — pnj.disparu')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Retirer le donneur' })).toBeInTheDocument()
	})
})

describe('EditeurEffets - cible orpheline (rendu pur)', () => {
	it('cible d effet orpheline affichee, jamais retiree silencieusement (critere #7)', () => {
		render(
			<EditeurEffets
				titre="RÉCOMPENSE"
				legende="Ce que la quête donne au joueur une fois résolue."
				texteVide="Aucune récompense — cliquez « + Ajouter un effet… » pour commencer."
				effets={[{ delta: 'donner_objet', cibles: ['objet.disparu'] }]}
				entitesParEspace={{ objet: [] }}
				onAjouterEffet={jest.fn()}
				onChangerCible={jest.fn()}
				onRetirerEffet={jest.fn()}
			/>,
		)

		const comboboxCible = screen.getByRole('combobox', { name: 'CIBLE' })
		expect(comboboxCible).toHaveValue('objet.disparu')
		expect(screen.getByText('Objet introuvable — objet.disparu')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Retirer cet effet' })).toBeInTheDocument()
	})
})
