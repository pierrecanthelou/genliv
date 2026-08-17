import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	validateDossier,
	type Brain,
	type Dossier,
	type Jalon,
	type Fin,
} from '../../../brain'
import { PanneauJalonsFins } from '../components/PanneauJalonsFins'

/**
 * L'écran Jalons & fins — `SegmentedControl` (bascule, pas un filtre) + liste
 * `ListRow` à gauche + fiche à droite, PAR onglet (§3 du plan d'itération 2).
 * Précédent direct `PanneauIndices.tsx`/`panneauIndices.test.tsx` (it1) pour
 * l'anatomie ; ce qui est PROPRE à cette itération et que ces tests éprouvent
 * en plus : le geste d'ajout à BROUILLON DIFFÉRÉ (KR-214 — `Jalon` exige DEUX
 * champs requis, `Fin` un seul), l'abandon silencieux d'un brouillon
 * incomplet, la région D1 scopée à `Fin` seule, et les DEUX collections
 * strictement indépendantes (sélection + compteur).
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
			<PanneauJalonsFins dossierId={dossierId} />
		</BrainProvider>,
	)
}

/** Sème un jalon par le CHEMIN PUBLIC d'écriture (`dossiers.update()`),
 *  précédent `panneauIndices.test.tsx`/`semerIndice`. */
function semerJalon(brain: Brain, dossierId: string, jalon: Jalon): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: d.monde,
		charpente: { ...d.charpente, jalons: [...d.charpente.jalons, jalon] },
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

function semerFin(brain: Brain, dossierId: string, fin: Fin): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: d.monde,
		charpente: { ...d.charpente, fins: [...d.charpente.fins, fin] },
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

/** La `ListRow` d'une entité, retrouvée par son SOUS-TITRE (l'id, unique et
 *  technique) — jamais par le titre, qui dépend du `nom` (optionnel). */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id.replace(/\./g, '\\.')) })
}

/** Les lignes de jalons, jamais les boutons Monter/Descendre/+Ajouter — le
 *  `textContent` concatène titre ET sous-titre (l'id), d'où `startsWith`. */
function lesLignesJalons(): HTMLElement[] {
	return screen
		.getAllByRole('button')
		.filter((bouton) => bouton.textContent?.startsWith('Jalon') || bouton.textContent?.startsWith('Nouveau jalon'))
}
/** Les lignes de fins, symétrique de `lesLignesJalons`. */
function lesLignesFins(): HTMLElement[] {
	return screen
		.getAllByRole('button')
		.filter((bouton) => bouton.textContent?.startsWith('Fin') || bouton.textContent?.startsWith('Nouvelle fin'))
}

async function allerSurOnglet(user: ReturnType<typeof userEvent.setup>, libelle: 'JALONS' | 'FINS'): Promise<void> {
	await user.click(screen.getByRole('radio', { name: libelle }))
}

describe('PanneauJalonsFins', () => {
	beforeEach(() => window.localStorage.clear())

	it('rendu initial: eyebrow, onglet JALONS par defaut, jalons et fins de la reference', () => {
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const { dossier } = inspection
		renderPanel(brain, dossier.id)

		expect(screen.getByText('JALONS & FINS')).toBeInTheDocument()
		expect(screen.getByRole('radio', { name: 'JALONS' })).toHaveAttribute('aria-checked', 'true')
		expect(screen.getByRole('radio', { name: 'FINS' })).toHaveAttribute('aria-checked', 'false')
		expect(lesLignesJalons()).toHaveLength(dossier.charpente.jalons.length)
	})

	it('ajout jalon differe: rien avant completion des deux champs requis, commit atomique ensuite (critere #4)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		expect(dossier.charpente.jalons).toHaveLength(0)
		renderPanel(brain, dossier.id)

		expect(screen.getByText('Aucun jalon — cliquez « + Ajouter un jalon… » pour commencer.')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: '+ Ajouter un jalon…' }))

		// Rien n'est ecrit : le brouillon est LOCAL, hors `charpente`.
		expect(lire(brain, dossier.id).charpente.jalons).toHaveLength(0)
		expect(screen.getByText('Nouveau jalon')).toBeInTheDocument()
		const champNom = screen.getByRole('textbox', { name: /nom du jalon/i })
		expect(champNom).toHaveValue('')
		expect(champNom).toHaveFocus()

		const champDeclencheur = screen.getByRole('textbox', { name: /déclencheur/i })
		fireEvent.change(champDeclencheur, { target: { value: "Le joueur porte le sceau devant l'Archiviste." } })
		fireEvent.blur(champDeclencheur)
		// Un seul des deux champs requis renseigne : TOUJOURS rien d'ecrit, et
		// aucun bandeau de refus (l'entite n'existe pas encore).
		expect(lire(brain, dossier.id).charpente.jalons).toHaveLength(0)
		expect(screen.queryAllByRole('status')).toHaveLength(0)

		const champEnonce = screen.getByRole('textbox', { name: /énoncé/i })
		fireEvent.change(champEnonce, { target: { value: "L'Archiviste sait que le sceau a ete brise." } })
		fireEvent.blur(champEnonce)

		const jalons = lire(brain, dossier.id).charpente.jalons
		expect(jalons).toHaveLength(1)
		expect(jalons[0].declencheur_texte).toBe("Le joueur porte le sceau devant l'Archiviste.")
		expect(jalons[0].enonce_texte).toBe("L'Archiviste sait que le sceau a ete brise.")
		expect(jalons[0].effet).toEqual([])
		expect(jalons[0].nom).toBeUndefined()

		const validation = validateDossier(lire(brain, dossier.id))
		expect(validation.errors.some((issue) => issue.code === 'champ-requis-vide')).toBe(false)
	})

	it('ajout fin differe: un seul champ requis suffit, texte reste editable et jamais gatant (critere #4)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		await allerSurOnglet(user, 'FINS')
		expect(screen.getByText('Aucune fin — cliquez « + Ajouter une fin… » pour commencer.')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: '+ Ajouter une fin…' }))
		expect(lire(brain, dossier.id).charpente.fins).toHaveLength(0)
		expect(screen.getByText('Nouvelle fin')).toBeInTheDocument()

		// TEXTE DE FIN rempli en premier : jamais gatant, n'arme rien tout seul.
		const champTexte = screen.getByRole('textbox', { name: /texte de fin/i })
		fireEvent.change(champTexte, { target: { value: 'Le sceau se referme derriere toi.' } })
		fireEvent.blur(champTexte)
		expect(lire(brain, dossier.id).charpente.fins).toHaveLength(0)

		const champCondition = screen.getByRole('textbox', { name: /condition/i })
		fireEvent.change(champCondition, { target: { value: 'Le heros a referme le sceau.' } })
		fireEvent.blur(champCondition)

		const fins = lire(brain, dossier.id).charpente.fins
		expect(fins).toHaveLength(1)
		expect(fins[0].condition_texte).toBe('Le heros a referme le sceau.')
		expect(fins[0].texte).toBe('Le sceau se referme derriere toi.')

		const validation = validateDossier(lire(brain, dossier.id))
		expect(validation.errors.some((issue) => issue.code === 'champ-requis-vide')).toBe(false)

		// `texte` reste editable APRES le commit, toujours pas gatant.
		fireEvent.change(champTexte, { target: { value: '' } })
		fireEvent.blur(champTexte)
		expect(lire(brain, dossier.id).charpente.fins[0].texte).toBe('')
		expect(lire(brain, dossier.id).charpente.fins).toHaveLength(1)
	})

	it('abandon silencieux: brouillon incomplet disparait au changement d onglet, de selection, ou au demontage (critere #5)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerJalon(brain, dossier.id, {
			id: 'jalon.existant',
			nom: 'Existant',
			declencheur_texte: 'x',
			enonce_texte: 'y',
			effet: [],
		})
		const { unmount } = renderPanel(brain, dossier.id)

		// 1) Changement d'onglet abandonne le brouillon incomplet.
		await user.click(screen.getByRole('button', { name: '+ Ajouter un jalon…' }))
		fireEvent.change(screen.getByRole('textbox', { name: /déclencheur/i }), {
			target: { value: 'Un declencheur seul' },
		})
		fireEvent.blur(screen.getByRole('textbox', { name: /déclencheur/i }))
		expect(lire(brain, dossier.id).charpente.jalons).toHaveLength(1)
		await allerSurOnglet(user, 'FINS')
		await allerSurOnglet(user, 'JALONS')
		expect(lesLignesJalons()).toHaveLength(1)
		expect(lire(brain, dossier.id).charpente.jalons).toHaveLength(1)
		// Aucun refus, aucune region D1 : rien n'a jamais ete refuse, il n'y a
		// jamais rien eu a refuser (l'entite incomplete n'a jamais atteint le SSOT).
		expect(screen.queryAllByRole('status')).toHaveLength(0)

		// 2) Selectionner une autre ligne abandonne le brouillon incomplet.
		await user.click(screen.getByRole('button', { name: '+ Ajouter un jalon…' }))
		fireEvent.change(screen.getByRole('textbox', { name: /déclencheur/i }), { target: { value: 'Encore un seul' } })
		fireEvent.blur(screen.getByRole('textbox', { name: /déclencheur/i }))
		await user.click(laLigne('jalon.existant'))
		expect(lesLignesJalons()).toHaveLength(1)
		expect(lire(brain, dossier.id).charpente.jalons).toHaveLength(1)
		expect(screen.queryAllByRole('status')).toHaveLength(0)

		// 3) Demonter le panneau : rien n'a jamais ete ecrit, donc le dossier
		// reste inchange (aucun dialogue de confirmation requis ni possible).
		await user.click(screen.getByRole('button', { name: '+ Ajouter un jalon…' }))
		fireEvent.change(screen.getByRole('textbox', { name: /déclencheur/i }), { target: { value: 'Toujours incomplet' } })
		fireEvent.blur(screen.getByRole('textbox', { name: /déclencheur/i }))
		expect(screen.queryAllByRole('status')).toHaveLength(0)
		unmount()
		expect(lire(brain, dossier.id).charpente.jalons).toHaveLength(1)
	})

	it('un second clic sur + Ajouter pendant un ajout en cours ne l ecrase pas', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un jalon…' }))
		const champDeclencheur = screen.getByRole('textbox', { name: /déclencheur/i })
		fireEvent.change(champDeclencheur, { target: { value: 'Ne pas perdre ce texte' } })

		await user.click(screen.getByRole('button', { name: '+ Ajouter un jalon…' }))

		expect(screen.getByRole('textbox', { name: /déclencheur/i })).toHaveValue('Ne pas perdre ce texte')
		expect(lesLignesJalons()).toHaveLength(1)
	})

	it('discriminance D1 a trois entites: fin non conforme = 1 region status, fin conforme = 0, jalon non conforme = 0 (critere #6, KR-197/199/202)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const dossier = inspection.dossier
		// Fin NON CONFORME : `condition_texte` renseigne, `condition_expr` absent.
		semerFin(brain, dossier.id, {
			id: 'fin.sans-expr',
			nom: 'Sans expr',
			condition_texte: 'Une condition en prose seule.',
		})
		renderPanel(brain, dossier.id)

		await allerSurOnglet(user, 'FINS')

		await user.click(laLigne('fin.sans-expr'))
		expect(screen.getByRole('textbox', { name: /nom de la fin/i })).toHaveValue('Sans expr')
		expect(screen.getAllByRole('status')).toHaveLength(1)

		// Fin CONFORME (`fin.vigie-sauvee`, `condition_expr` present dans la reference) : 0 region.
		await user.click(laLigne('fin.vigie-sauvee'))
		expect(screen.queryAllByRole('status')).toHaveLength(0)

		// Jalon NON CONFORME (`jalon.second-guet`, `declencheur_texte` sans `declencheur_expr`
		// dans la reference) : TOUJOURS 0 region — silencieux par design (alerteSansExpr:false).
		await allerSurOnglet(user, 'JALONS')
		await user.click(laLigne('jalon.second-guet'))
		expect(screen.getByRole('textbox', { name: /nom du jalon/i })).toHaveValue('Le second guet')
		expect(screen.queryAllByRole('status')).toHaveLength(0)
	})

	it('reorder clic + clavier: jalons et fins, la fiche affichee reste celle du meme id (critere #7)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerJalon(brain, dossier.id, {
			id: 'jalon.alpha',
			nom: 'Alpha',
			declencheur_texte: 'd1',
			enonce_texte: 'e1',
			effet: [],
		})
		semerJalon(brain, dossier.id, {
			id: 'jalon.beta',
			nom: 'Beta',
			declencheur_texte: 'd2',
			enonce_texte: 'e2',
			effet: [],
		})
		semerFin(brain, dossier.id, { id: 'fin.alpha', nom: 'Alpha', condition_texte: 'c1' })
		semerFin(brain, dossier.id, { id: 'fin.beta', nom: 'Beta', condition_texte: 'c2' })
		renderPanel(brain, dossier.id)

		// JALONS, au CLIC.
		await user.click(laLigne('jalon.beta'))
		expect(laLigne('jalon.beta')).toHaveAttribute('aria-current', 'true')
		expect(screen.getByRole('textbox', { name: /nom du jalon/i })).toHaveValue('Beta')

		await user.click(screen.getByRole('button', { name: 'Monter le jalon « Beta »' }))

		expect(lire(brain, dossier.id).charpente.jalons.map((jalon) => jalon.id)).toEqual(['jalon.beta', 'jalon.alpha'])
		expect(screen.getByRole('textbox', { name: /nom du jalon/i })).toHaveValue('Beta')
		expect(laLigne('jalon.beta')).toHaveAttribute('aria-current', 'true')

		// FINS, au CLAVIER (Tab jusqu'au bouton, puis Entree).
		await allerSurOnglet(user, 'FINS')
		await user.click(laLigne('fin.beta'))
		await user.tab()
		const boutonMonterFin = screen.getByRole('button', { name: 'Monter la fin « Beta »' })
		expect(boutonMonterFin).toHaveFocus()

		await user.keyboard('{Enter}')

		expect(lire(brain, dossier.id).charpente.fins.map((fin) => fin.id)).toEqual(['fin.beta', 'fin.alpha'])
		expect(screen.getByRole('textbox', { name: /nom de la fin/i })).toHaveValue('Beta')
	})

	it('bornes: Monter absent sur la premiere ligne, Descendre absent sur la derniere, jamais disabled', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerJalon(brain, dossier.id, {
			id: 'jalon.alpha',
			nom: 'Alpha',
			declencheur_texte: 'd',
			enonce_texte: 'e',
			effet: [],
		})
		semerJalon(brain, dossier.id, {
			id: 'jalon.beta',
			nom: 'Beta',
			declencheur_texte: 'd',
			enonce_texte: 'e',
			effet: [],
		})
		renderPanel(brain, dossier.id)

		expect(screen.queryByRole('button', { name: 'Monter le jalon « Alpha »' })).toBeNull()
		expect(screen.getByRole('button', { name: 'Descendre le jalon « Alpha »' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Monter le jalon « Beta »' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Descendre le jalon « Beta »' })).toBeNull()

		screen.getAllByRole('button').forEach((bouton) => expect(bouton).not.toBeDisabled())
	})

	it('selection independante par onglet: chaque onglet retrouve sa propre selection, compteurs jamais fusionnes (critere #8)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerJalon(brain, dossier.id, {
			id: 'jalon.alpha',
			nom: 'Alpha',
			declencheur_texte: 'd',
			enonce_texte: 'e',
			effet: [],
		})
		semerJalon(brain, dossier.id, {
			id: 'jalon.beta',
			nom: 'Beta',
			declencheur_texte: 'd',
			enonce_texte: 'e',
			effet: [],
		})
		semerFin(brain, dossier.id, { id: 'fin.alpha', nom: 'Alpha', condition_texte: 'c' })
		semerFin(brain, dossier.id, { id: 'fin.beta', nom: 'Beta', condition_texte: 'c' })
		renderPanel(brain, dossier.id)

		expect(lesLignesJalons()).toHaveLength(2)

		await user.click(laLigne('jalon.beta'))
		expect(screen.getByRole('textbox', { name: /nom du jalon/i })).toHaveValue('Beta')

		await allerSurOnglet(user, 'FINS')
		expect(lesLignesFins()).toHaveLength(2)
		// Aucune selection explicite encore sur FINS : repli sur la premiere fin.
		expect(screen.getByRole('textbox', { name: /nom de la fin/i })).toHaveValue('Alpha')
		await user.click(laLigne('fin.beta'))
		expect(screen.getByRole('textbox', { name: /nom de la fin/i })).toHaveValue('Beta')

		// Retour sur JALONS : la selection de jalon n'a jamais bouge.
		await allerSurOnglet(user, 'JALONS')
		expect(lesLignesJalons()).toHaveLength(2)
		expect(screen.getByRole('textbox', { name: /nom du jalon/i })).toHaveValue('Beta')

		// Retour sur FINS : idem, jamais fusionnee avec la selection de jalon.
		await allerSurOnglet(user, 'FINS')
		expect(lesLignesFins()).toHaveLength(2)
		expect(screen.getByRole('textbox', { name: /nom de la fin/i })).toHaveValue('Beta')
	})

	/**
	 * KR-187 — test-grep de non-régression : cette feature possède désormais
	 * DEUX sections (Indices, index 5 ; Jalons & fins, index 10). Les 9 AUTRES
	 * racines du dossier (canon, charpente.depart, personnages, lieux, objets,
	 * indices, quêtes, événements, conditions) doivent rester INTACTES après
	 * tout geste posé sur `charpente.jalons`/`charpente.fins` — ajout, édition,
	 * réordonnancement. Dossier de RÉFÉRENCE (pas un dossier neuf) : les
	 * autres sections y sont réellement peuplées.
	 */
	it('isolation des 9 autres sections: elles restent intactes apres ajout, edition et reorder sur jalons et fins', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const avant = inspection.dossier
		renderPanel(brain, avant.id)

		// JALONS : ajout complet, puis nom et reorder.
		await user.click(screen.getByRole('button', { name: '+ Ajouter un jalon…' }))
		fireEvent.change(screen.getByRole('textbox', { name: /déclencheur/i }), { target: { value: 'Un declencheur' } })
		fireEvent.blur(screen.getByRole('textbox', { name: /déclencheur/i }))
		fireEvent.change(screen.getByRole('textbox', { name: /énoncé/i }), { target: { value: 'Un enonce' } })
		fireEvent.blur(screen.getByRole('textbox', { name: /énoncé/i }))
		const champNomJalon = screen.getByRole('textbox', { name: /nom du jalon/i })
		fireEvent.change(champNomJalon, { target: { value: 'Un nouveau jalon' } })
		fireEvent.blur(champNomJalon)
		await user.click(screen.getByRole('button', { name: 'Monter le jalon « Un nouveau jalon »' }))

		// FINS : ajout complet.
		await allerSurOnglet(user, 'FINS')
		await user.click(screen.getByRole('button', { name: '+ Ajouter une fin…' }))
		fireEvent.change(screen.getByRole('textbox', { name: /condition/i }), { target: { value: 'Une condition' } })
		fireEvent.blur(screen.getByRole('textbox', { name: /condition/i }))

		const apres = lire(brain, avant.id)
		expect(apres.canon).toEqual(avant.canon)
		expect(apres.charpente.depart).toEqual(avant.charpente.depart)
		expect(apres.monde.personnages).toEqual(avant.monde.personnages)
		expect(apres.monde.lieux).toEqual(avant.monde.lieux)
		expect(apres.monde.objets).toEqual(avant.monde.objets)
		expect(apres.monde.indices).toEqual(avant.monde.indices)
		expect(apres.monde.quetes).toEqual(avant.monde.quetes)
		expect(apres.monde.evenements).toEqual(avant.monde.evenements)
		expect(apres.monde.conditions).toEqual(avant.monde.conditions)

		// Les sections touchees, elles, ont bien change (sinon ce test ne prouverait rien).
		expect(apres.charpente.jalons).not.toEqual(avant.charpente.jalons)
		expect(apres.charpente.fins).not.toEqual(avant.charpente.fins)
	})

	/**
	 * KR-013/113 — grep de contrat : la sélection et les brouillons sont
	 * calculés EN LIGNE, aucun `useEffect` ne recopie
	 * `dossier.charpente.jalons`/`fins` dans un état local après le montage.
	 * Le SEUL `useEffect` du panneau est le déplacement de focus impératif
	 * après un ajout (`intentionFocus`) — usage légitime (KR-013).
	 */
	it('grep KR-013/113: aucun useEffect de resynchronisation du brouillon', () => {
		const source = fs.readFileSync(path.join(__dirname, '..', 'components', 'PanneauJalonsFins.tsx'), 'utf8')
		const occurrences = source.match(/useEffect\(/g) ?? []
		expect(occurrences).toHaveLength(1)

		const corps = source.match(/useEffect\(\(\) => \{([\s\S]*?)\}, \[/)
		if (corps === null) throw new Error('useEffect introuvable')
		expect(corps[1]).toContain('intentionFocus')
		expect(corps[1]).not.toContain('setSelectionJalon')
		expect(corps[1]).not.toContain('setSelectionFin')
		expect(corps[1]).not.toContain('dossier.charpente')
	})
})

/**
 * `FicheJalon` — piège 3 (§5 du plan) éprouvé au niveau du composant PUR : la
 * prop `avertissements` existe et se rendrait si elle cessait d'être vide —
 * le silence côté Jalon est celui du VALIDATEUR (`alerteSansExpr:false`),
 * jamais une omission de ce composant.
 */
describe('FicheJalon (rendu pur)', () => {
	it('avertissements non vides: la region status se rend cote Jalon (preuve que le code existe)', async () => {
		const { FicheJalon } = await import('../components/FicheJalon')
		render(
			<FicheJalon
				brouillon={{ nom: 'Un jalon', declencheur_texte: 'd', enonce_texte: 'e' }}
				avertissements={[
					{
						code: 'condition-sans-expr',
						severity: 'warning',
						message: 'Message de test.',
						location: 'Jalon « Un jalon »',
						path: 'charpente.jalons[0].declencheur_texte',
					},
				]}
				refus={null}
				nomInputRef={{ current: null }}
				onChangeChamp={() => {}}
				onBlurChamp={() => {}}
			/>,
		)
		expect(screen.getAllByRole('status')).toHaveLength(1)
		expect(screen.getByText('ENREGISTRÉ, AVEC AVERTISSEMENT')).toBeInTheDocument()
	})
})
