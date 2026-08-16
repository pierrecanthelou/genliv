import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	CURSEUR_VALUES,
	CURSEUR_MIN,
	CURSEUR_MAX,
	CURSEURS,
	CURSEURS_INITIAUX,
	PARLER_REPLIQUES,
	type Brain,
	type Dossier,
	type Personnage,
} from '../../../brain'
import { PanneauPersonnages } from '../components/PanneauPersonnages'

/**
 * Le bloc 8 et DERNIER de l'accordéon (« Caractère exploitable »), it8 — trois
 * sous-sections (curseurs/parler/lignes rouges) et leur écriture (§3/§5/§6/§7
 * du plan d'itération 8 de `dossier-fiches`). Fichier NEUF, SÉPARÉ (précédent
 * `fichePersonnage.test.tsx`/`panneauPersonnages.test.tsx`, mêmes petits
 * helpers de montage/seed dupliqués à dessein).
 *
 * Passe TOUJOURS par la pile complète (`BrainProvider` + `createBrain`), jamais
 * des props mockées : mêmes motifs que les blocs précédents.
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

const NOM_DU_BLOC_8 = 'Caractère exploitable'
const TEXTE_REGLER = '+ Régler le caractère…'
const TEXTE_AJOUTER_REPLIQUE = '+ Ajouter une réplique…'
const LEGENDE_PLAFOND = 'Deux répliques, pas plus — de quoi calibrer une voix sans la scripter davantage.'

describe('FichePersonnage - bloc Caractere', () => {
	beforeEach(() => window.localStorage.clear())

	/** Critère #1 du plan — sonde posée AVANT le montage (KR-199/BUG-068a) : seul
	 *  un spy actif PENDANT le montage prouve qu'aucune écriture n'a lieu. */
	it('bloc absent : seule la CTA, aucune ecriture au montage', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))

		expect(screen.getAllByRole('button', { name: TEXTE_REGLER })).toHaveLength(1)
		expect(screen.queryByRole('button', { name: /^Diminuer /i })).toBeNull()
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('caractere')
		expect(updateSpy).not.toHaveBeenCalled()
	})

	/** Critère #1 du plan — le clic sème les SIX clés en UN commit, et
	 *  `parler`/`jamais`/`cede_si` restent absents. */
	it('le clic sur regler le caractere seme les six curseurs, seuls, en un commit', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))
		await user.click(screen.getByRole('button', { name: TEXTE_REGLER }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		const personnage = lire(brain, dossier.id).monde.personnages[0]
		expect(personnage.caractere?.curseurs).toEqual(CURSEURS_INITIAUX)
		expect(personnage.caractere).not.toHaveProperty('parler')
		expect(personnage.caractere).not.toHaveProperty('jamais')
		expect(personnage.caractere).not.toHaveProperty('cede_si')
		expect(personnage).not.toHaveProperty('stats')
		expect(personnage).not.toHaveProperty('but')

		// La grille remplace le CTA, balayee depuis CURSEUR_VALUES (jamais 6 litteraux).
		expect(screen.queryByRole('button', { name: TEXTE_REGLER })).toBeNull()
		const premierLabel = `${CURSEURS[CURSEUR_VALUES[0]].label.toUpperCase()} (${CURSEURS[CURSEUR_VALUES[0]].affinite})`
		const diminuerPremier = screen.getByRole('button', { name: `Diminuer ${premierLabel}` })
		expect(diminuerPremier).toBeInTheDocument()
		// Clavier (§3 du plan) : le focus se pose sur ce premier controle apres le clic.
		expect(diminuerPremier).toHaveFocus()
		CURSEUR_VALUES.forEach((curseur) => {
			const label = `${CURSEURS[curseur].label.toUpperCase()} (${CURSEURS[curseur].affinite})`
			expect(screen.getByRole('button', { name: `Diminuer ${label}` })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: `Augmenter ${label}` })).toBeInTheDocument()
		})
	})

	/** Critère #2 du plan — la valeur d'un curseur est persistee telle quelle,
	 *  sans prefix signe, clampee a CURSEUR_MIN/CURSEUR_MAX. */
	it('un curseur se regle sans prefix signe et se clampe aux deux bornes', async () => {
		// 2 * (CURSEUR_MAX + 5) clics user-event reels : le test lui-meme est
		// legitimement long (~30 clics), pas bogue -- sous charge parallele
		// complete il approchait 4s sur un budget de 5s (mesure du 2026-08-16,
		// flake reproductible bloquant le hook de pre-commit). Timeout releve,
		// aucune assertion touchee.
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			caractere: { curseurs: { ...CURSEURS_INITIAUX } },
		})
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))
		const label = `${CURSEURS.courage.label.toUpperCase()} (${CURSEURS.courage.affinite})`
		const augmenter = () => screen.getByRole('button', { name: `Augmenter ${label}` })
		const diminuer = () => screen.getByRole('button', { name: `Diminuer ${label}` })
		const controles = () => augmenter().parentElement as HTMLElement

		for (let i = 0; i < CURSEUR_MAX + 5; i += 1) {
			await user.click(augmenter())
		}
		expect(within(controles()).getByText(String(CURSEUR_MAX))).toBeInTheDocument()
		// Aucun signe « + » devant la valeur (contrairement a l'intensite d'une relation).
		expect(controles().textContent).not.toMatch(/\+\d/)
		expect(lire(brain, dossier.id).monde.personnages[0].caractere?.curseurs?.courage).toBe(CURSEUR_MAX)

		for (let i = 0; i < CURSEUR_MAX + 5; i += 1) {
			await user.click(diminuer())
		}
		expect(within(controles()).getByText(String(CURSEUR_MIN))).toBeInTheDocument()
		expect(lire(brain, dossier.id).monde.personnages[0].caractere?.curseurs?.courage).toBe(CURSEUR_MIN)
	}, 15000)

	/** Critère #3 du plan — length 1 : CTA d'ajout visible, focus sur le nouveau
	 *  champ ; blur vide ne committe rien, blur non vide persiste. */
	it('ajouter une replique deplace le focus, blur vide ne committe pas, blur non vide persiste', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))
		expect(screen.getByRole('button', { name: TEXTE_AJOUTER_REPLIQUE })).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: TEXTE_AJOUTER_REPLIQUE }))

		const champReplique = screen.getByRole('textbox', { name: /^RÉPLIQUE/ })
		expect(champReplique).toHaveFocus()

		fireEvent.blur(champReplique)
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('caractere')

		fireEvent.change(champReplique, { target: { value: 'Ne traînez pas dehors après la cloche.' } })
		fireEvent.blur(champReplique)

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].caractere?.parler).toEqual([
			'Ne traînez pas dehors après la cloche.',
		])
	})

	/** Critère #3 du plan — au plafond, la CTA est ABSENTE du DOM (jamais
	 *  `disabled`), remplacée par la légende. */
	it('au plafond PARLER_REPLIQUES la CTA d ajout est absente du DOM, legende affichee', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			caractere: { parler: ['Première réplique.', 'Seconde réplique.'] },
		})
		expect(PARLER_REPLIQUES).toBe(2)
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))

		expect(screen.getByDisplayValue('Première réplique.')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Seconde réplique.')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: TEXTE_AJOUTER_REPLIQUE })).toBeNull()
		expect(screen.getByText(LEGENDE_PLAFOND)).toBeInTheDocument()
	})

	/** §6/§7 du plan (KR-165, BUG-074) — un document IMPORTÉ portant
	 *  `PARLER_REPLIQUES + 1` répliques se rend intégralement, sans refus : la
	 *  borne est d'INTERFACE, jamais un chemin de refus SSOT. Seed via
	 *  `dossiers.update` (le SEUL chemin public d'écriture qu'exercent ces
	 *  tests), qui traverse le même `validateDossier` qu'un import fichier. */
	it('un document portant PARLER_REPLIQUES + 1 repliques rend les trois, sans refus', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			caractere: { parler: ['Première réplique.', 'Seconde réplique.', 'Troisième réplique, en trop.'] },
		})
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))

		expect(screen.getByDisplayValue('Première réplique.')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Seconde réplique.')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Troisième réplique, en trop.')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: TEXTE_AJOUTER_REPLIQUE })).toBeNull()
		expect(lire(brain, dossier.id).monde.personnages[0].caractere?.parler).toHaveLength(3)
	})

	/** Retrait d'une replique — sans confirmation (edition de contenu, pas une
	 *  entite referencee), et fait retomber la CTA sous le plafond. */
	it('retirer une replique la supprime du document et fait revenir la CTA sous le plafond', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			caractere: { parler: ['Première réplique.', 'Seconde réplique.'] },
		})
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))
		await user.click(screen.getByRole('button', { name: 'Retirer la réplique n°1' }))

		expect(lire(brain, dossier.id).monde.personnages[0].caractere?.parler).toEqual(['Seconde réplique.'])
		expect(screen.queryByDisplayValue('Première réplique.')).toBeNull()
		expect(screen.getByRole('button', { name: TEXTE_AJOUTER_REPLIQUE })).toBeInTheDocument()
	})

	/** Critère #4 du plan — jamais/cede_si : commit au blur, cle retiree si le
	 *  champ est vide. */
	it('jamais et cede_si persistent au blur, cle retiree si vide', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))
		const champJamais = screen.getByRole('textbox', { name: /^CE QU'IL NE FERA JAMAIS/ })
		const champCedeSi = screen.getByRole('textbox', { name: /^CE QUI LE FAIT CÉDER/ })

		fireEvent.change(champJamais, {
			target: { value: 'Il ne trahira jamais un secret confié sous serment.' },
		})
		fireEvent.blur(champJamais)
		fireEvent.change(champCedeSi, {
			target: { value: 'Devant une preuve écrite, il cède.' },
		})
		fireEvent.blur(champCedeSi)

		expect(updateSpy).toHaveBeenCalledTimes(2)
		let personnage = lire(brain, dossier.id).monde.personnages[0]
		expect(personnage.caractere?.jamais).toBe('Il ne trahira jamais un secret confié sous serment.')
		expect(personnage.caractere?.cede_si).toBe('Devant une preuve écrite, il cède.')

		// Vider jamais retire sa cle plutot que d y committer ''.
		fireEvent.change(champJamais, { target: { value: '' } })
		fireEvent.blur(champJamais)
		expect(updateSpy).toHaveBeenCalledTimes(3)
		personnage = lire(brain, dossier.id).monde.personnages[0]
		expect(personnage.caractere).not.toHaveProperty('jamais')
		expect(personnage.caractere?.cede_si).toBe('Devant une preuve écrite, il cède.')
	})

	/** Revue de PR (tech-lead) — un blur SANS saisie (simple passage de
	 *  tabulation) sur une fiche sans bloc `caractere` ne doit RIEN écrire :
	 *  un `caractere: {}` remplacerait un bloc ABSENT par un bloc VIDE, ce que
	 *  le reste de l'itération interdit partout ailleurs (« absent ≠ vide »).
	 *  Spy posé AVANT les deux blurs observés (KR-199). */
	it('un blur a vide sur jamais/cede_si sans bloc caractere n ecrit rien', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))
		const champJamais = screen.getByRole('textbox', { name: /^CE QU'IL NE FERA JAMAIS/ })
		const champCedeSi = screen.getByRole('textbox', { name: /^CE QUI LE FAIT CÉDER/ })
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		fireEvent.blur(champJamais)
		fireEvent.blur(champCedeSi)

		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('caractere')
	})

	/**
	 * BUG-064/KR-199 (critère #5 du plan) — lecture au montage, SANS
	 * interaction, sur DEUX personnages distincts (le second atteint par un
	 * clic de ligne). Valeurs qui ne coïncident avec aucun plancher fabricable
	 * par le composant.
	 */
	it('lecture au montage sur DEUX personnages distincts, sans interaction', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			caractere: {
				curseurs: { mefiance: 8, franchise: 3, courage: 5, cupidite: 1, loyaute: 9, verve: 2 },
				parler: ['Ne traînez pas dehors après la cloche.'],
				jamais: 'Il ne trahira jamais un secret confié sous serment.',
				cede_si: 'Devant une preuve écrite, il cède.',
			},
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
			caractere: {
				curseurs: { mefiance: 2, franchise: 9, courage: 7, cupidite: 6, loyaute: 4, verve: 10 },
				parler: ['Le beffroi ne dort jamais, moi non plus.', 'Approchez, que je voie votre visage.'],
				jamais: 'Elle ne quitte jamais son poste avant le relais.',
				cede_si: 'Devant la preuve que la tour est en danger, elle cède et redescend.',
			},
		})
		renderPanel(brain, dossier.id)

		// AU MONTAGE, sans aucun clic de selection : le PREMIER personnage (aldur).
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))
		const labelMefiance = `${CURSEURS.mefiance.label.toUpperCase()} (${CURSEURS.mefiance.affinite})`
		const valeurCurseur = (label: string): string | null => {
			const bouton = screen.getByRole('button', { name: `Diminuer ${label}` })
			return within(bouton.parentElement as HTMLElement).getByText(/^\d+$/).textContent
		}
		expect(valeurCurseur(labelMefiance)).toBe('8')
		expect(screen.getByDisplayValue('Ne traînez pas dehors après la cloche.')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Il ne trahira jamais un secret confié sous serment.')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Devant une preuve écrite, il cède.')).toBeInTheDocument()
		expect(screen.queryByDisplayValue('Elle ne quitte jamais son poste avant le relais.')).toBeNull()

		// APRES SELECTION de selene (l accordeon revient au bloc 1, il faut le rouvrir).
		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_8 }))
		expect(valeurCurseur(labelMefiance)).toBe('2')
		expect(screen.getByDisplayValue('Le beffroi ne dort jamais, moi non plus.')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Approchez, que je voie votre visage.')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Elle ne quitte jamais son poste avant le relais.')).toBeInTheDocument()
		expect(
			screen.getByDisplayValue('Devant la preuve que la tour est en danger, elle cède et redescend.'),
		).toBeInTheDocument()
		expect(screen.queryByDisplayValue('Ne traînez pas dehors après la cloche.')).toBeNull()
		expect(screen.queryByDisplayValue('Il ne trahira jamais un secret confié sous serment.')).toBeNull()
	})
})
