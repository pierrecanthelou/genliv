import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	INTENSITE_MIN,
	INTENSITE_MAX,
	type Brain,
	type Dossier,
	type Personnage,
	type Lieu,
} from '../../../brain'
import { PanneauPersonnages } from '../components/PanneauPersonnages'

/**
 * Les blocs 5 « Relations » et 6 « Présence » de l'accordéon (§3/§6/§7 du plan
 * d'itération 5 de `dossier-fiches`). Fichier NEUF, autonome (même choix que
 * les fichiers de test voisins de cette feature) : mêmes petits helpers de
 * montage/seed, dupliqués ici à dessein.
 *
 * Ce que ces tests éprouvent, distinct des blocs précédents : le geste d'ajout
 * PAR SELECT (jamais un bouton pointillé), les DEUX régimes de commit — relations
 * (ligne LOCALE tant que `lien` n'est pas blur non vide, `cible_id`/`lien` étant
 * TOUS DEUX requis) contre présence (commit IMMÉDIAT au choix du lieu, `lieu_id`
 * seul étant requis) —, l'auto-référence légale (KR-194) et la lecture au
 * montage sur deux personnages distincts (KR-199).
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauPersonnages dossierId={dossierId} />
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

/** Sème un lieu dans `monde.lieux` (précédent `panneauLieux.test.tsx`). */
function semerLieu(brain: Brain, dossierId: string, lieu: Lieu): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, lieux: [...d.monde.lieux, lieu] },
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

/** La `ListRow` d'un personnage, retrouvée par son SOUS-TITRE (`personnage.id`). */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

const NOM_DU_BLOC_5 = 'Relations'
const NOM_DU_BLOC_6 = 'Présence'
const TEXTE_AJOUTER_RELATION = '+ Ajouter une relation…'
const TEXTE_AJOUTER_PRESENCE = '+ Ajouter une présence…'
const TEXTE_AUCUN_AUTRE_PERSONNAGE =
	'Aucun autre personnage à qui rattacher une relation — créez-en un second dans cette section.'

/** La valeur affichée par le `Stepper` « INTENSITÉ », signée — `prefix="+"`
 *  n'affiche le signe que sur une valeur strictement positive (lot 1). */
function valeurIntensite(): string | null {
	const bouton = screen.getByRole('button', { name: 'Diminuer INTENSITÉ' })
	return within(bouton.parentElement as HTMLElement).getByText(/^[+-]?\d+$/).textContent
}

describe('FichePersonnage - blocs Relations et Presence', () => {
	beforeEach(() => window.localStorage.clear())

	it('etat vide relations: un seul personnage au total, message exact, aucun select d ajout', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_5 }))

		expect(screen.getByText(TEXTE_AUCUN_AUTRE_PERSONNAGE)).toBeInTheDocument()
		expect(screen.queryByRole('combobox', { name: 'Ajouter une relation' })).toBeNull()
	})

	// PAS de pendant « état vide présence » : un dossier neuf porte TOUJOURS
	// `lieu.amorce` (`construireAmorce`, feature n° 1) et `charpente.depart.lieu_id`
	// le référence dès la création — `monde.lieux.length === 0` n'est donc
	// atteignable par AUCUN chemin d'écriture public aujourd'hui (le retirer
	// romprait cette référence, refusé au SSOT). Le code de `BlocPresence.tsx`
	// reste défensif pour ce cas (contrat de design, § 3 du plan), mais ce test
	// ne peut pas l'exercer sans mocker `FichePersonnage` — interdit dans ce
	// fichier (pile complète, précédent `fichePersonnage.test.tsx`).

	/**
	 * KR-199 — lecture au montage, sans interaction, sur DEUX personnages
	 * distincts, relations ET présence. Valeurs choisies NON FABRICABLES par les
	 * widgets par défaut : `intensite` ≠ 0, `secret: true` pour l'un, absent pour
	 * l'autre, `quand` non vide, deux lieux distincts.
	 */
	it('lecture au montage sans interaction, sur deux personnages distincts, relations et presence', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, { id: 'lieu.tour-effondree', nom: 'La tour effondrée' })
		semerLieu(brain, dossier.id, { id: 'lieu.marche-des-cendres', nom: 'Le marché des cendres' })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			nom: 'Aldûr le Sage',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			relations: [{ cible_id: 'pnj.aldur', lien: 'Il se méfie de son propre reflet.', intensite: -2, secret: true }],
			presence: [{ lieu_id: 'lieu.tour-effondree', quand: 'La nuit, tant que le signal doit rester allumé.' }],
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			nom: 'Sélène la Vigie',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
			relations: [
				{ cible_id: 'pnj.selene', lien: 'Elle se parle a voix haute pour ne pas devenir folle.', intensite: 3 },
			],
			presence: [{ lieu_id: 'lieu.marche-des-cendres', quand: "Du lever du jour jusqu'a la fermeture du marche." }],
		})
		renderPanel(brain, dossier.id)

		// AU MONTAGE, sans aucun clic de selection : Aldur (premier seme) est affiche.
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_5 }))
		expect(screen.getByDisplayValue('Il se méfie de son propre reflet.')).toBeInTheDocument()
		expect(valeurIntensite()).toBe('-2')
		expect(screen.getByRole('switch', { name: 'SECRÈTE' })).toBeChecked()
		expect(screen.queryByDisplayValue('Elle se parle a voix haute pour ne pas devenir folle.')).toBeNull()

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_6 }))
		expect(screen.getByDisplayValue('La nuit, tant que le signal doit rester allumé.')).toBeInTheDocument()
		expect(screen.queryByDisplayValue("Du lever du jour jusqu'a la fermeture du marche.")).toBeNull()

		// APRES SELECTION de selene (l accordeon revient au bloc 1, il faut rouvrir).
		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_5 }))
		expect(screen.getByDisplayValue('Elle se parle a voix haute pour ne pas devenir folle.')).toBeInTheDocument()
		expect(valeurIntensite()).toBe('+3')
		expect(screen.getByRole('switch', { name: 'SECRÈTE' })).not.toBeChecked()
		expect(screen.queryByDisplayValue('Il se méfie de son propre reflet.')).toBeNull()

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_6 }))
		expect(screen.getByDisplayValue("Du lever du jour jusqu'a la fermeture du marche.")).toBeInTheDocument()
		expect(screen.queryByDisplayValue('La nuit, tant que le signal doit rester allumé.')).toBeNull()
	})

	/**
	 * KR-194 — `cible_id === personnage.id` (auto-référence) est LÉGALE : aucun
	 * refus ni avertissement, et aucun filtre au sélecteur (ni sur la ligne
	 * existante, ni sur le Select d'ajout).
	 */
	it('auto-reference toleree sans refus ni avertissement, aucun filtre au selecteur', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			nom: 'Aldûr le Sage',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			relations: [{ cible_id: 'pnj.aldur', lien: 'Il se méfie de son propre reflet.', intensite: -1 }],
		})
		semerPersonnage(brain, dossier.id, { id: 'pnj.selene', portee: 'second', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_5 }))

		expect(screen.queryByRole('status')).toBeNull()
		expect(screen.getByDisplayValue('Personnage « Aldûr le Sage »')).toBeInTheDocument()

		const selectAjout = screen.getByRole('combobox', { name: 'Ajouter une relation' })
		const labels = within(selectAjout)
			.getAllByRole('option')
			.map((option) => option.textContent)
		expect(labels).toContain('Personnage « Aldûr le Sage »')
	})

	/**
	 * Revue de PR (it5) — l'état vide « aucun autre personnage » ne doit masquer
	 * que l'ABSENCE de relations, jamais une relation DÉJÀ ÉCRITE : un dossier à
	 * UN SEUL personnage portant une relation auto-référentielle (KR-194, légale
	 * depuis ce lot) doit toujours afficher `lien`/`intensite`/`secret` au
	 * montage — précédent exact : __fixtures__/dossier-minimal.json en porte une.
	 */
	it('un seul personnage au total, relation auto-referentielle deja ecrite reste visible et editable', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			nom: 'Aldûr le Sage',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			relations: [{ cible_id: 'pnj.aldur', lien: 'Il se méfie de son propre reflet.', intensite: -2, secret: true }],
		})
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_5 }))

		// La legende normale s affiche, PAS le message d etat vide.
		expect(screen.queryByText(TEXTE_AUCUN_AUTRE_PERSONNAGE)).toBeNull()
		expect(screen.getByText('RELATION 1')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Il se méfie de son propre reflet.')).toBeInTheDocument()
		expect(valeurIntensite()).toBe('-2')
		expect(screen.getByRole('switch', { name: 'SECRÈTE' })).toBeChecked()

		// Editable : le retrait fonctionne toujours.
		await user.click(screen.getByRole('button', { name: 'Retirer la relation n°1' }))
		expect(lire(brain, dossier.id).monde.personnages[0].relations).toEqual([])
		// Une fois la seule relation retiree, l etat vide redevient legitime.
		expect(screen.getByText(TEXTE_AUCUN_AUTRE_PERSONNAGE)).toBeInTheDocument()
	})

	/**
	 * Critères #1/#2/#3 du plan — relations : le geste d'ajout POSE `cible_id`
	 * (et `intensite: 0`) SANS ÉCRIRE (aucune ligne locale à moitié écrite : la
	 * cible n'est JAMAIS vide), le premier commit réel arrive au blur d'un
	 * `lien` non vide, `intensite` se borne aux deux extrémités, et le retrait
	 * ne demande aucune confirmation.
	 */
	it('ajout d une relation pose la cible sans ecrire, edition et intensite bornee, retrait sans confirmation', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			nom: 'Sélène la Vigie',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
		})
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_5 }))
		const selectAjout = screen.getByRole('combobox', { name: 'Ajouter une relation' })
		await user.selectOptions(selectAjout, 'pnj.selene')

		// La ligne apparait, la cible deja posee — AUCUNE ecriture au document.
		expect(screen.getByText('RELATION 1')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Personnage « Sélène la Vigie »')).toBeInTheDocument()
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('relations')
		// Le select d ajout revient a son placeholder.
		expect(screen.getByRole('combobox', { name: 'Ajouter une relation' })).toHaveValue('')

		const champLien = screen.getByRole('textbox', { name: /^CE QUI LES LIE/ })
		fireEvent.blur(champLien)
		// Blur sans avoir rien tape : rien n ecrit, la ligne reste locale.
		expect(updateSpy).not.toHaveBeenCalled()

		fireEvent.change(champLien, { target: { value: 'Elle lui doit la vie depuis l incendie du beffroi.' } })
		fireEvent.blur(champLien)

		expect(updateSpy).toHaveBeenCalledTimes(1)
		let relations = lire(brain, dossier.id).monde.personnages[0].relations
		expect(relations).toEqual([
			{ cible_id: 'pnj.selene', lien: 'Elle lui doit la vie depuis l incendie du beffroi.', intensite: 0 },
		])

		const augmenter = screen.getByRole('button', { name: 'Augmenter INTENSITÉ' })
		for (let i = 0; i < 6; i += 1) await user.click(augmenter)
		expect(valeurIntensite()).toBe(`+${INTENSITE_MAX}`)
		relations = lire(brain, dossier.id).monde.personnages[0].relations
		expect(relations?.[0].intensite).toBe(INTENSITE_MAX)

		const diminuer = screen.getByRole('button', { name: 'Diminuer INTENSITÉ' })
		for (let i = 0; i < 10; i += 1) await user.click(diminuer)
		expect(valeurIntensite()).toBe(String(INTENSITE_MIN))
		relations = lire(brain, dossier.id).monde.personnages[0].relations
		expect(relations?.[0].intensite).toBe(INTENSITE_MIN)

		await user.click(screen.getByRole('switch', { name: 'SECRÈTE' }))
		expect(lire(brain, dossier.id).monde.personnages[0].relations?.[0].secret).toBe(true)

		await user.click(screen.getByRole('button', { name: 'Retirer la relation n°1' }))
		// Précédent `contre_mesures`/`plan_actions` : la liste reste `[]`, la clé
		// n'est pas retirée par un simple retrait de son dernier élément.
		expect(lire(brain, dossier.id).monde.personnages[0].relations).toEqual([])
		expect(screen.queryByText('RELATION 1')).toBeNull()
	})

	/**
	 * Critère #5 du plan — présence : `lieu_id` seul suffit, le geste d'ajout
	 * committe DIRECTEMENT (contraste avec les relations), `quand` suit le
	 * patron brouillon-par-champ (blur vide retire la clé), retrait sans
	 * confirmation.
	 */
	it('ajout d une presence committe immediatement, edition et effacement de quand, retrait sans confirmation', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, { id: 'lieu.marche-des-cendres', nom: 'Le marché des cendres' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_6 }))
		const selectAjout = screen.getByRole('combobox', { name: 'Ajouter une présence' })
		await user.selectOptions(selectAjout, 'lieu.marche-des-cendres')

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].presence).toEqual([{ lieu_id: 'lieu.marche-des-cendres' }])
		expect(screen.getByText('PRÉSENCE 1')).toBeInTheDocument()

		const champQuand = screen.getByRole('textbox', { name: /^QUAND/ })
		fireEvent.change(champQuand, { target: { value: 'Au crépuscule, avant que le marché ne ferme.' } })
		fireEvent.blur(champQuand)
		expect(updateSpy).toHaveBeenCalledTimes(2)
		expect(lire(brain, dossier.id).monde.personnages[0].presence?.[0].quand).toBe(
			'Au crépuscule, avant que le marché ne ferme.',
		)

		fireEvent.change(champQuand, { target: { value: '' } })
		fireEvent.blur(champQuand)
		expect(updateSpy).toHaveBeenCalledTimes(3)
		expect(lire(brain, dossier.id).monde.personnages[0].presence?.[0]).not.toHaveProperty('quand')

		await user.click(screen.getByRole('button', { name: 'Retirer la présence n°1' }))
		expect(lire(brain, dossier.id).monde.personnages[0].presence).toEqual([])
		expect(screen.queryByText('PRÉSENCE 1')).toBeNull()
	})

	/**
	 * KR-197 — sonde à deux personnages, RELATIONS : muter l'indexation d'un
	 * gestionnaire de `useEcritureRelationsPresence` (ex. `handleBlurLienRelation`)
	 * DOIT faire rougir CE test précis.
	 */
	it('ecriture sur DEUX personnages, aucune fuite d indexation — relations', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			nom: 'Aldûr le Sage',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			nom: 'Sélène la Vigie',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
		})
		renderPanel(brain, dossier.id)

		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_5 }))
		await user.selectOptions(screen.getByRole('combobox', { name: 'Ajouter une relation' }), 'pnj.selene')
		const champLien = screen.getByRole('textbox', { name: /^CE QUI LES LIE/ })
		fireEvent.change(champLien, { target: { value: 'Elle se parle a voix haute pour ne pas devenir folle.' } })
		fireEvent.blur(champLien)

		const personnages = lire(brain, dossier.id).monde.personnages
		const aldur = personnages.find((p) => p.id === 'pnj.aldur')
		const selene = personnages.find((p) => p.id === 'pnj.selene')
		if (aldur === undefined || selene === undefined) throw new Error('Personnage introuvable apres ecriture')

		expect(selene.relations).toEqual([
			{ cible_id: 'pnj.selene', lien: 'Elle se parle a voix haute pour ne pas devenir folle.', intensite: 0 },
		])
		expect(aldur).not.toHaveProperty('relations')
	})

	/**
	 * KR-197 — sonde à deux personnages, PRÉSENCE, DISTINCTE du test relations
	 * (le défaut se présente par site d'appel, jamais par fichier).
	 */
	it('ecriture sur DEUX personnages, aucune fuite d indexation — presence', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, { id: 'lieu.marche-des-cendres', nom: 'Le marché des cendres' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			nom: 'Sélène la Vigie',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
		})
		renderPanel(brain, dossier.id)

		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_6 }))
		await user.selectOptions(screen.getByRole('combobox', { name: 'Ajouter une présence' }), 'lieu.marche-des-cendres')

		const personnages = lire(brain, dossier.id).monde.personnages
		const aldur = personnages.find((p) => p.id === 'pnj.aldur')
		const selene = personnages.find((p) => p.id === 'pnj.selene')
		if (aldur === undefined || selene === undefined) throw new Error('Personnage introuvable apres ecriture')

		expect(selene.presence).toEqual([{ lieu_id: 'lieu.marche-des-cendres' }])
		expect(aldur).not.toHaveProperty('presence')
	})

	it('les libelles des selects d ajout sont bien ceux du contrat de design', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, { id: 'lieu.marche-des-cendres', nom: 'Le marché des cendres' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.selene', portee: 'second', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_5 }))
		expect(
			within(screen.getByRole('combobox', { name: 'Ajouter une relation' })).getByText(TEXTE_AJOUTER_RELATION),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_6 }))
		expect(
			within(screen.getByRole('combobox', { name: 'Ajouter une présence' })).getByText(TEXTE_AJOUTER_PRESENCE),
		).toBeInTheDocument()
	})
})
