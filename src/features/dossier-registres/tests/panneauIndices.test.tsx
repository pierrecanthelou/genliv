import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, localiserEntite, type Brain, type Dossier, type Indice } from '../../../brain'
import { PanneauIndices } from '../components/PanneauIndices'
import { FicheIndice, type BrouillonIndice } from '../components/FicheIndice'

/**
 * L'écran Indices — liste `ListRow` à gauche, fiche à droite (§3 du plan
 * d'itération 1 de `dossier-registres`). Précédent direct `PanneauObjets.tsx`
 * (dossier-objets) pour l'anatomie du panneau et le réordonnancement ; ce qui
 * lui est PROPRE et que ces tests éprouvent en plus : la section « MÈNE À »
 * (première liste de références du schéma), avec sa self-exclusion à l'ajout
 * et sa résolution d'auto-référence déjà persistée (KR-213), et l'ABSENCE de
 * tout retrait de fiche cette itération (§2 du plan).
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
			<PanneauIndices dossierId={dossierId} />
		</BrainProvider>,
	)
}

/**
 * Sème un indice de plus par le CHEMIN PUBLIC d'écriture (`dossiers.update()`,
 * précédent `panneauObjets.test.tsx`/`semerObjet`) — jamais un `persistence.set`
 * derrière le service : c'est le chemin que le validateur voit réellement.
 */
function semerIndice(brain: Brain, dossierId: string, indice: Indice): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, indices: [...d.monde.indices, indice] },
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

/**
 * La `ListRow` d'un indice, retrouvée par son SOUS-TITRE (`indice.id`, unique
 * et technique) — jamais par le titre, qui dépend du `nom` (optionnel).
 */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

/** Les lignes de la liste, jamais les boutons Monter/Descendre/+Ajouter. */
function lesLignes(): HTMLElement[] {
	return screen.getAllByRole('button').filter((bouton) => bouton.textContent?.startsWith('Indice'))
}

describe('PanneauIndices', () => {
	beforeEach(() => window.localStorage.clear())

	it('rendu initial: 4 indices de la reference dans la liste', () => {
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const { dossier } = inspection
		expect(dossier.monde.indices).toHaveLength(4)
		renderPanel(brain, dossier.id)

		// Scope a la LISTE (role "list") : le nom d'un indice peut aussi apparaitre
		// en option d'un Select de la section « MÈNE À » de la fiche affichee
		// (liste COMPLETE, self comprise, KR-213) — `getByText` non scope y
		// trouverait plusieurs occurrences.
		const liste = screen.getByRole('list')
		dossier.monde.indices.forEach((indice, index) => {
			expect(within(liste).getByText(localiserEntite('indice', indice, index))).toBeInTheDocument()
		})
		expect(lesLignes()).toHaveLength(4)
	})

	it('ajouter un indice: apparait dans la liste, focus sur Nom (critere #1)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// `monde.indices` DEMARRE VIDE (meme contrat que `monde.objets`) : l etat
		// reel d un dossier neuf, pas un cas defensif.
		expect(dossier.monde.indices).toHaveLength(0)
		renderPanel(brain, dossier.id)

		expect(screen.getByText('Aucun indice — cliquez « + Ajouter un indice… » pour commencer.')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: '+ Ajouter un indice…' }))

		const indices = lire(brain, dossier.id).monde.indices
		expect(indices).toHaveLength(1)
		const nouveau = indices[0]
		expect(nouveau.nom).toBeUndefined()

		expect(lesLignes()).toHaveLength(1)
		expect(screen.getByText('Indice n°1 (sans nom)')).toBeInTheDocument()

		const champNom = screen.getByRole('textbox', { name: /nom de l.indice/i })
		expect(champNom).toHaveValue('')
		expect(champNom).toHaveFocus()
	})

	it('lecture au montage, deux indices distincts, sans interaction (BUG-064, critere #2)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, {
			id: 'indice.pas-dans-la-cendre',
			nom: 'Des pas frais dans la cendre',
			verite: "Ce sont les pas d'Aubry.",
			formulation_joueur: 'Des empreintes nettes dans la cendre.',
		})
		semerIndice(brain, dossier.id, {
			id: 'indice.lettre-de-la-vigie',
			nom: 'Une lettre signee de la Vigie',
			verite: 'Selene a ecrit cette lettre sous la dictee.',
			formulation_joueur: "Une lettre scellee d'un cachet inconnu.",
		})
		renderPanel(brain, dossier.id)

		// Le PREMIER indice est affiche par defaut (aucune selection explicite) :
		// ses valeurs sont celles du document, SANS AUCUNE INTERACTION.
		expect(screen.getByRole('textbox', { name: /nom de l.indice/i })).toHaveValue('Des pas frais dans la cendre')
		expect(screen.getByRole('textbox', { name: /vérité/i })).toHaveValue("Ce sont les pas d'Aubry.")
		expect(screen.getByRole('textbox', { name: /formulation joueur/i })).toHaveValue(
			'Des empreintes nettes dans la cendre.',
		)

		// Selectionner le SECOND indice (clic sur sa ligne) SANS AUCUNE FRAPPE : ses
		// valeurs affichees doivent etre celles DU DOCUMENT pour CET indice.
		fireEvent.click(laLigne('indice.lettre-de-la-vigie'))
		expect(screen.getByRole('textbox', { name: /nom de l.indice/i })).toHaveValue('Une lettre signee de la Vigie')
		expect(screen.getByRole('textbox', { name: /vérité/i })).toHaveValue('Selene a ecrit cette lettre sous la dictee.')
		expect(screen.getByRole('textbox', { name: /formulation joueur/i })).toHaveValue(
			"Une lettre scellee d'un cachet inconnu.",
		)
	})

	it('editer nom, verite et formulation joueur au blur, persistees, et relues apres remontage', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.sceau' })
		const premier = renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const champNom = screen.getByRole('textbox', { name: /nom de l.indice/i })
		const champVerite = screen.getByRole('textbox', { name: /vérité/i })
		const champFormulation = screen.getByRole('textbox', { name: /formulation joueur/i })

		fireEvent.change(champNom, { target: { value: 'Le sceau brise' } })
		fireEvent.blur(champNom)
		fireEvent.change(champVerite, { target: { value: 'Le gardien lui-meme.' } })
		fireEvent.blur(champVerite)
		fireEvent.change(champFormulation, { target: { value: 'Une odeur de cendre froide.' } })
		fireEvent.blur(champFormulation)

		expect(updateSpy).toHaveBeenCalledTimes(3)
		const indice = lire(brain, dossier.id).monde.indices[0]
		expect(indice.nom).toBe('Le sceau brise')
		expect(indice.verite).toBe('Le gardien lui-meme.')
		expect(indice.formulation_joueur).toBe('Une odeur de cendre froide.')

		premier.unmount()
		renderPanel(brain, dossier.id)
		expect(screen.getByRole('textbox', { name: /nom de l.indice/i })).toHaveValue('Le sceau brise')
		expect(screen.getByRole('textbox', { name: /vérité/i })).toHaveValue('Le gardien lui-meme.')
		expect(screen.getByRole('textbox', { name: /formulation joueur/i })).toHaveValue('Une odeur de cendre froide.')
	})

	it('Entree dans le champ mono-ligne (Nom) blur-committe ; aucun effet dans un champ multiligne', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.alpha' })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const champNom = screen.getByRole('textbox', { name: /nom de l.indice/i })
		await user.click(champNom)
		expect(champNom).toHaveFocus()
		await user.type(champNom, 'Alpha')
		await user.keyboard('{Enter}')

		expect(champNom).not.toHaveFocus()
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.indices[0].nom).toBe('Alpha')

		const champVerite = screen.getByRole('textbox', { name: /vérité/i })
		await user.click(champVerite)
		await user.type(champVerite, 'Ligne 1{Enter}Ligne 2')

		// Multiline : Entree insere un saut de ligne, ne blur JAMAIS le champ.
		expect(champVerite).toHaveFocus()
		expect(champVerite).toHaveValue('Ligne 1\nLigne 2')
		expect(updateSpy).toHaveBeenCalledTimes(1)
	})

	it('Monter au clic: ordre permute, meme indice reste affiche (critere #3)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.alpha', nom: 'Alpha' })
		semerIndice(brain, dossier.id, { id: 'indice.beta', nom: 'Beta' })
		renderPanel(brain, dossier.id)

		await user.click(laLigne('indice.beta'))
		expect(laLigne('indice.beta')).toHaveAttribute('aria-current', 'true')
		expect(screen.getByRole('textbox', { name: /nom de l.indice/i })).toHaveValue('Beta')

		await user.click(screen.getByRole('button', { name: "Monter l'indice « Beta »" }))

		expect(lire(brain, dossier.id).monde.indices.map((i) => i.id)).toEqual(['indice.beta', 'indice.alpha'])
		expect(screen.getByRole('textbox', { name: /nom de l.indice/i })).toHaveValue('Beta')
		expect(laLigne('indice.beta')).toHaveAttribute('aria-current', 'true')
	})

	it('Monter au clavier: Tab jusqu au bouton puis Entree produit le meme effet (critere #3)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.alpha', nom: 'Alpha' })
		semerIndice(brain, dossier.id, { id: 'indice.beta', nom: 'Beta' })
		renderPanel(brain, dossier.id)

		await user.click(laLigne('indice.beta'))
		await user.tab()
		const boutonMonter = screen.getByRole('button', { name: "Monter l'indice « Beta »" })
		expect(boutonMonter).toHaveFocus()

		await user.keyboard('{Enter}')

		expect(lire(brain, dossier.id).monde.indices.map((i) => i.id)).toEqual(['indice.beta', 'indice.alpha'])
		expect(screen.getByRole('textbox', { name: /nom de l.indice/i })).toHaveValue('Beta')
	})

	it('bornes: Monter absent sur le premier indice, Descendre absent sur le dernier, jamais disabled (critere #3)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.alpha', nom: 'Alpha' })
		semerIndice(brain, dossier.id, { id: 'indice.beta', nom: 'Beta' })
		semerIndice(brain, dossier.id, { id: 'indice.gamma', nom: 'Gamma' })
		renderPanel(brain, dossier.id)

		expect(screen.queryByRole('button', { name: "Monter l'indice « Alpha »" })).toBeNull()
		expect(screen.getByRole('button', { name: "Descendre l'indice « Alpha »" })).toBeInTheDocument()

		expect(screen.getByRole('button', { name: "Monter l'indice « Beta »" })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: "Descendre l'indice « Beta »" })).toBeInTheDocument()

		expect(screen.getByRole('button', { name: "Monter l'indice « Gamma »" })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: "Descendre l'indice « Gamma »" })).toBeNull()

		screen.getAllByRole('button').forEach((bouton) => expect(bouton).not.toBeDisabled())
	})

	/**
	 * KR-013/113 — grep de contrat : la sélection et le brouillon sont calculés
	 * EN LIGNE (`indices.find(...) ?? indices[0]`), aucun `useEffect` ne recopie
	 * `dossier.monde.indices` dans un état local après le montage. UN SEUL
	 * `useEffect` existe dans ce fichier : le déplacement de focus impératif
	 * après un ajout (`intentionFocus`) — usage légitime (KR-013), qui ne lit
	 * ni ne recopie `dossier.monde.indices`, `brouillons`, ni `selection`.
	 */
	it('grep KR-013/113: aucun useEffect de resynchronisation du brouillon', () => {
		const source = fs.readFileSync(path.join(__dirname, '..', 'components', 'PanneauIndices.tsx'), 'utf8')
		const occurrences = source.match(/useEffect\(/g) ?? []
		expect(occurrences).toHaveLength(1)

		const corps = source.match(/useEffect\(\(\) => \{([\s\S]*?)\}, \[/)
		if (corps === null) throw new Error('useEffect introuvable')
		expect(corps[1]).toContain('intentionFocus')
		expect(corps[1]).not.toContain('setBrouillons')
		expect(corps[1]).not.toContain('setSelection')
		expect(corps[1]).not.toContain('dossier.monde.indices')
	})

	describe('MENE A', () => {
		it('self-exclusion a la ligne d ajout: l indice edite est absent de ses propres options (critere #4)', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			semerIndice(brain, dossier.id, { id: 'indice.alpha', nom: 'Alpha' })
			semerIndice(brain, dossier.id, { id: 'indice.beta', nom: 'Beta' })
			renderPanel(brain, dossier.id)

			// Alpha est affiche par defaut (premier indice, aucune selection explicite).
			const selectAjout = screen.getByRole('combobox', { name: 'Ajouter un lien vers un autre indice' })
			const optionsAjout = within(selectAjout).getAllByRole('option')
			expect(optionsAjout.map((o) => o.textContent)).toEqual([
				'+ Ajouter un indice vers lequel celui-ci mène…',
				'Indice « Beta »',
			])
			expect(optionsAjout.some((o) => o.textContent === 'Indice « Alpha »')).toBe(false)

			await user.selectOptions(selectAjout, 'indice.beta')

			// A affiche B en LISTE TEXTUELLE d'identifiants, jamais un canevas (KR-204).
			expect(lire(brain, dossier.id).monde.indices[0].mene_a).toEqual(['indice.beta'])
			expect(screen.getByRole('combobox', { name: 'Ajouter un lien vers un autre indice' })).toHaveValue('')
		})

		it('deux indices peuvent se referencer mutuellement (doublon, cas limite)', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			semerIndice(brain, dossier.id, { id: 'indice.alpha', nom: 'Alpha' })
			semerIndice(brain, dossier.id, { id: 'indice.beta', nom: 'Beta' })
			renderPanel(brain, dossier.id)

			await user.selectOptions(
				screen.getByRole('combobox', { name: 'Ajouter un lien vers un autre indice' }),
				'indice.beta',
			)

			await user.click(laLigne('indice.beta'))
			await user.selectOptions(
				screen.getByRole('combobox', { name: 'Ajouter un lien vers un autre indice' }),
				'indice.alpha',
			)

			const indices = lire(brain, dossier.id).monde.indices
			expect(indices.find((i) => i.id === 'indice.alpha')?.mene_a).toEqual(['indice.beta'])
			expect(indices.find((i) => i.id === 'indice.beta')?.mene_a).toEqual(['indice.alpha'])
		})

		it('changer la cible d un lien deja ecrit', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			// Beta et Gamma semes AVANT Alpha : au moment ou Alpha ecrit son mene_a,
			// la cible doit deja exister dans le document (REFERENCES_SIMPLES).
			semerIndice(brain, dossier.id, { id: 'indice.beta', nom: 'Beta' })
			semerIndice(brain, dossier.id, { id: 'indice.gamma', nom: 'Gamma' })
			semerIndice(brain, dossier.id, { id: 'indice.alpha', nom: 'Alpha', mene_a: ['indice.beta'] })
			renderPanel(brain, dossier.id)

			await user.click(laLigne('indice.alpha'))
			const selectExistant = screen.getByRole('combobox', { name: 'INDICE CIBLE' })
			expect(selectExistant).toHaveValue('indice.beta')
			await user.selectOptions(selectExistant, 'indice.gamma')

			expect(lire(brain, dossier.id).monde.indices.find((i) => i.id === 'indice.alpha')?.mene_a).toEqual([
				'indice.gamma',
			])
		})

		it('retirer un lien deja ecrit', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			// Beta seme AVANT Alpha : au moment ou Alpha ecrit son mene_a, la cible
			// doit deja exister dans le document (REFERENCES_SIMPLES).
			semerIndice(brain, dossier.id, { id: 'indice.beta', nom: 'Beta' })
			semerIndice(brain, dossier.id, { id: 'indice.alpha', nom: 'Alpha', mene_a: ['indice.beta'] })
			renderPanel(brain, dossier.id)

			await user.click(laLigne('indice.alpha'))
			await user.click(screen.getByRole('button', { name: 'Retirer le lien vers Indice « Beta »' }))

			expect(lire(brain, dossier.id).monde.indices.find((i) => i.id === 'indice.alpha')?.mene_a).toEqual([])
		})

		it('auto-reference deja persistee (import) se resout, meme absente des options d ajout (critere #6)', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			// Auto-reference LEGALE au SSOT (KR-213) : aucune garde de validation.
			semerIndice(brain, dossier.id, { id: 'indice.ouroboros', nom: 'Ouroboros', mene_a: ['indice.ouroboros'] })
			renderPanel(brain, dossier.id)

			// La ligne EXISTANTE affiche l indice comme sa propre cible, RESOLUE (pas
			// "introuvable") : la liste complete (self compris) alimente avecOrpheline().
			const selectExistant = screen.getByRole('combobox', { name: 'INDICE CIBLE' })
			expect(selectExistant).toHaveValue('indice.ouroboros')
			expect(within(selectExistant).getByText('Indice « Ouroboros »')).toBeInTheDocument()
			expect(within(selectExistant).queryByText(/introuvable/)).toBeNull()
			expect(screen.getByRole('button', { name: 'Retirer le lien vers Indice « Ouroboros »' })).toBeInTheDocument()

			// La ligne D AJOUT, elle, EXCLUT l indice edite de ses propres options : avec
			// un seul indice au registre, il ne reste que le placeholder (self-exclusion).
			const selectAjout = screen.getByRole('combobox', { name: 'Ajouter un lien vers un autre indice' })
			const optionsAjout = within(selectAjout).getAllByRole('option')
			expect(optionsAjout).toHaveLength(1)
			expect(optionsAjout[0].textContent).toBe('+ Ajouter un indice vers lequel celui-ci mène…')
		})

		it('etat vide de section: aucun autre indice a relier, sans lien ecrit', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			semerIndice(brain, dossier.id, { id: 'indice.seul', nom: 'Seul' })
			renderPanel(brain, dossier.id)

			expect(screen.getByText('Aucun autre indice à relier — créez-en un second dans ce registre.')).toBeInTheDocument()
			expect(screen.queryByRole('combobox', { name: 'Ajouter un lien vers un autre indice' })).toBeNull()
			expect(screen.queryByRole('combobox', { name: 'INDICE CIBLE' })).toBeNull()
		})
	})

	/**
	 * KR-187 — test-grep de non-régression : cette feature ne possède QUE la
	 * section Indices (index 5 de `SECTIONS`) ; les 9 AUTRES racines du dossier
	 * (canon, charpente.depart, personnages, lieux, objets, quetes, evenements,
	 * conditions, charpente.jalons/fins) doivent rester INTACTES après tout
	 * geste posé sur `monde.indices` — ajout, édition, réordonnancement,
	 * chaînage `mene_a`. Utilise le dossier de RÉFÉRENCE (pas un dossier neuf) :
	 * les 9 autres sections y sont réellement PEUPLÉES, ce qui rend la
	 * comparaison significative plutôt que vide-contre-vide.
	 */
	it('isolation des 9 autres sections: elles restent intactes apres ajout, edition, reorder et mene_a', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const avant = inspection.dossier
		renderPanel(brain, avant.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un indice…' }))
		const nouveauId = lire(brain, avant.id).monde.indices[lire(brain, avant.id).monde.indices.length - 1].id

		const champNom = screen.getByRole('textbox', { name: /nom de l.indice/i })
		fireEvent.change(champNom, { target: { value: 'Un nouvel indice' } })
		fireEvent.blur(champNom)

		await user.click(screen.getByRole('button', { name: "Monter l'indice « Un nouvel indice »" }))
		await user.selectOptions(
			screen.getByRole('combobox', { name: 'Ajouter un lien vers un autre indice' }),
			'indice.trace-du-guet',
		)

		const apres = lire(brain, avant.id)
		expect(apres.canon).toEqual(avant.canon)
		expect(apres.charpente.depart).toEqual(avant.charpente.depart)
		expect(apres.charpente.jalons).toEqual(avant.charpente.jalons)
		expect(apres.charpente.fins).toEqual(avant.charpente.fins)
		expect(apres.monde.personnages).toEqual(avant.monde.personnages)
		expect(apres.monde.lieux).toEqual(avant.monde.lieux)
		expect(apres.monde.objets).toEqual(avant.monde.objets)
		expect(apres.monde.quetes).toEqual(avant.monde.quetes)
		expect(apres.monde.evenements).toEqual(avant.monde.evenements)
		expect(apres.monde.conditions).toEqual(avant.monde.conditions)

		// La section Indices, elle, a bien change (sinon ce test ne prouverait rien).
		expect(apres.monde.indices).not.toEqual(avant.monde.indices)
		expect(apres.monde.indices.find((i) => i.id === nouveauId)?.mene_a).toEqual(['indice.trace-du-guet'])
	})
})

/**
 * `FicheIndice` — composant PUREMENT DE RENDU, éprouvé isolément pour la
 * discriminance orphelin/valide (critère #5) : un `mene_a` corrompu à un id
 * inexistant est REFUSÉ par `validateDossier` (`reference-pendante`, erreur
 * bloquante) — ce scénario n'est donc atteignable QUE par un rendu direct à
 * props construites, jamais via `DossierService.update()` réel. Précédent
 * exact : `savoirs.test.tsx` « savoirs et portes deja ecrits restent rendus
 * quand les registres sont vides, references orphelines exposees » (même
 * cause racine, même doctrine KR-021).
 */
describe('FicheIndice - section MENE A (rendu pur)', () => {
	const handlers = {
		onChangeChamp: jest.fn(),
		onBlurChamp: jest.fn(),
		onAjouterLien: jest.fn(),
		onChangerLien: jest.fn(),
		onRetirerLien: jest.fn(),
	}
	const brouillonVide: BrouillonIndice = { nom: '', verite: '', formulation_joueur: '' }

	beforeEach(() => {
		Object.values(handlers).forEach((fn) => fn.mockClear())
	})

	it('discriminance: B resolu, C orphelin, dans le meme test (KR-197/199/202)', () => {
		const indiceA: Indice = { id: 'indice.a', nom: 'A', mene_a: ['indice.b', 'indice.c-disparu'] }
		const indiceB: Indice = { id: 'indice.b', nom: 'B' }

		render(
			<FicheIndice
				indice={indiceA}
				indices={[indiceA, indiceB]}
				brouillon={{ ...brouillonVide, nom: 'A' }}
				refus={null}
				nomInputRef={{ current: null }}
				{...handlers}
			/>,
		)

		const selects = screen.getAllByRole('combobox', { name: 'INDICE CIBLE' })
		expect(selects).toHaveLength(2)

		expect(selects[0]).toHaveValue('indice.b')
		expect(within(selects[0]).getByText('Indice « B »')).toBeInTheDocument()
		expect(within(selects[0]).queryByText(/introuvable/)).toBeNull()

		expect(selects[1]).toHaveValue('indice.c-disparu')
		expect(within(selects[1]).getByText('Indice introuvable — indice.c-disparu')).toBeInTheDocument()

		expect(screen.getByRole('button', { name: 'Retirer le lien vers Indice « B »' })).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Retirer le lien vers Indice introuvable — indice.c-disparu' }),
		).toBeInTheDocument()
	})
})
