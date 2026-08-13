import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier, type Personnage } from '../../../brain'
import { PanneauPersonnages } from '../components/PanneauPersonnages'

/**
 * Le bloc 3 de l'accordéon (« Caractéristiques »), it3 — deux états exclusifs
 * et son écriture (§3/§5/§6 critères #1-#5 du plan d'itération 3 de
 * `dossier-fiches`). Fichier NEUF, SÉPARÉ de `panneauPersonnages.test.tsx`
 * (§5 du plan) : mêmes petits helpers de montage/seed, DUPLIQUÉS ici à
 * dessein — chaque fichier de test de cette feature reste autonome (même
 * choix que `panneauLieux.test.tsx`/`objectifsCanon.test.tsx`, deux fichiers
 * distincts sans import croisé entre suites de tests).
 *
 * Passe TOUJOURS par la pile complète (`BrainProvider` + `createBrain`),
 * jamais par des props mockées sur `FichePersonnage` : les critères eux-mêmes
 * portent sur l'ÉCRITURE (« un seul update() ») et sur le PV AFFICHÉ après ce
 * commit, deux choses qu'un rendu isolé de `FichePersonnage` avec des
 * callbacks `jest.fn()` ne peut pas prouver — il faudrait alors que le test
 * mette lui-même à jour la prop `personnage`, ce qui ne prouverait plus rien
 * du panneau réel.
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

const NOM_DU_BLOC_3 = 'Caractéristiques'
const TEXTE_REGLER = '+ Régler les caractéristiques…'

describe('FichePersonnage - bloc Caracteristiques', () => {
	beforeEach(() => window.localStorage.clear())

	it('bloc stats absent : seule la CTA, aucune ecriture au montage', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		// Pose AVANT le rendu (revue QA mode B) : seul un spy actif PENDANT le
		// montage peut observer une ecriture survenue AU montage — pose apres
		// coup, il ne temoignerait que du silence des interactions qui suivent.
		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		renderPanel(brain, dossier.id)

		// Le bloc 3 ne s ouvre pas automatiquement : il faut le deplier pour lire
		// son contenu par role (le contenu ferme est `display:none`).
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_3 }))

		expect(screen.getAllByRole('button', { name: TEXTE_REGLER })).toHaveLength(1)
		expect(screen.queryByRole('button', { name: /^Diminuer /i })).toBeNull()
		expect(screen.queryByRole('button', { name: /^Augmenter /i })).toBeNull()
		expect(screen.queryByText('PV')).toBeNull()
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('stats')
		expect(updateSpy).not.toHaveBeenCalled()
	})

	it('le clic sur regler ecrit les 8 cles en un seul commit', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_3 }))
		await user.click(screen.getByRole('button', { name: TEXTE_REGLER }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].stats).toEqual({
			FO: 1,
			AG: 1,
			DX: 1,
			EN: 1,
			IN: 1,
			IG: 1,
			SE: 1,
			CA: 1,
		})
		// La grille remplace le CTA (§ tableau des rendus du plan).
		expect(screen.queryByRole('button', { name: TEXTE_REGLER })).toBeNull()
		const diminuerForce = screen.getByRole('button', { name: 'Diminuer FORCE (FO)' })
		expect(diminuerForce).toBeInTheDocument()
		// Clavier (§3 du plan) : apres le clic, le focus se pose sur ce premier
		// controle du bloc qui vient d apparaitre.
		expect(diminuerForce).toHaveFocus()
		expect(screen.getByText('3')).toBeInTheDocument()
	})

	it('PV derive exactement de FO+AG+EN, jamais stocke', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			stats: { FO: 7, AG: 9, DX: 3, EN: 6, IN: 2, IG: 4, SE: 5, CA: 8 },
		})
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_3 }))

		expect(screen.getByText('22')).toBeInTheDocument()
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('pv')
	})
})

/**
 * Le bloc 4 de l'accordéon (« Objectif & plan d'actions »), it4 — but, plan
 * d'actions (étapes + ajout brouillon-jusqu'au-blur), contre-mesures (section
 * interne gated `camp === 'antagoniste'`) et l'avertissement D1 (§3/§6
 * critères #1-#7 du plan d'itération 4 de `dossier-fiches`). Mêmes helpers
 * de montage/seed que le bloc Caractéristiques ci-dessus, dupliqués à dessein
 * (fichier autonome).
 */
const NOM_DU_BLOC_1 = 'Camp, plan & rattachement'
const NOM_DU_BLOC_4 = "Objectif & plan d'actions"
const TEXTE_AJOUTER_ETAPE = '+ Ajouter une étape…'
const TEXTE_AJOUTER_CONTRE_MESURE = '+ Ajouter une contre-mesure…'
const EYEBROW_AVERTISSEMENT = 'ENREGISTRÉ, AVEC AVERTISSEMENT'

/** La `ListRow` d'un personnage, retrouvée par son SOUS-TITRE (`personnage.id`). */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

describe('FichePersonnage - bloc Objectif et plan d actions', () => {
	beforeEach(() => window.localStorage.clear())

	/**
	 * BUG-064/KR-199 (11e critère de la feature) — lecture au montage, sans
	 * interaction, sur DEUX personnages distincts. Valeurs choisies pour
	 * qu'aucune ne coïncide avec un plancher fabriquable par le composant
	 * (ni `DUREE_MIN`, ni une chaîne vide) : Aldur porte `duree: 4`, Sélène
	 * `duree: 2` — la seconde n'est jamais visible pendant qu'Aldur est affiché,
	 * et réciproquement.
	 */
	it('le bloc Objectif et plan d actions affiche but/etapes au montage, sans interaction, sur deux personnages distincts', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			savoirs: [],
			but: {
				libelle: 'Retrouver le sceau brisé et le remettre en place avant que la brume ne revienne.',
				pourquoi: "Il porte la faute d'avoir laissé le sceau se briser, cinquante ans plus tôt.",
				echeance: 'Avant la pleine lune prochaine.',
			},
			plan_actions: [
				{
					etape: 1,
					action: 'Retourne au sanctuaire à la nuit tombée pour consulter les archives.',
					declencheur_texte: 'Le joueur mentionne le sceau brisé devant lui.',
					duree: 4,
					si_bloque: "Il change d'approche : au lieu du sanctuaire, il tente sa chance auprès du forgeron.",
				},
			],
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			portee: 'second',
			savoirs: [],
			but: {
				libelle: "Tenir le signal allumé jusqu'à ce que quelqu'un du village accepte de reprendre le guet.",
				pourquoi: "Elle est la dernière des guetteurs, et personne ne sait qu'elle veille encore.",
				echeance: 'Avant que la crypte ne se rouvre.',
			},
			plan_actions: [
				{
					etape: 1,
					action: 'Entretenir le mécanisme du beffroi sans être vue.',
					declencheur_texte: "Aucun visiteur n'est encore monté à la tour effondrée.",
					duree: 2,
					si_bloque: "Elle laisse le feu s'éteindre une nuit entière et se tient à distance.",
				},
			],
		})
		renderPanel(brain, dossier.id)

		// AU MONTAGE, sans aucun clic de selection : c est le PREMIER personnage
		// (aldur) qui est affiche. Ouvrir le bloc est un geste de LECTURE, pas
		// une interaction qui pourrait fabriquer une valeur.
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		expect(
			screen.getByDisplayValue('Retrouver le sceau brisé et le remettre en place avant que la brume ne revienne.'),
		).toBeInTheDocument()
		expect(
			screen.getByDisplayValue("Il porte la faute d'avoir laissé le sceau se briser, cinquante ans plus tôt."),
		).toBeInTheDocument()
		expect(screen.getByDisplayValue('Avant la pleine lune prochaine.')).toBeInTheDocument()
		expect(
			screen.getByDisplayValue('Retourne au sanctuaire à la nuit tombée pour consulter les archives.'),
		).toBeInTheDocument()
		expect(screen.getByDisplayValue('Le joueur mentionne le sceau brisé devant lui.')).toBeInTheDocument()
		expect(screen.getByText('4')).toBeInTheDocument()
		expect(screen.queryByText('2')).toBeNull()
		expect(screen.queryByDisplayValue('Entretenir le mécanisme du beffroi sans être vue.')).toBeNull()

		// APRES SELECTION de selene (l accordeon revient au bloc 1, il faut rouvrir le bloc 4).
		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		expect(
			screen.getByDisplayValue(
				"Tenir le signal allumé jusqu'à ce que quelqu'un du village accepte de reprendre le guet.",
			),
		).toBeInTheDocument()
		expect(screen.getByDisplayValue('Entretenir le mécanisme du beffroi sans être vue.')).toBeInTheDocument()
		expect(screen.getByText('2')).toBeInTheDocument()
		expect(screen.queryByText('4')).toBeNull()
		expect(
			screen.queryByDisplayValue('Retourne au sanctuaire à la nuit tombée pour consulter les archives.'),
		).toBeNull()
	})

	/**
	 * KR-196 — sonde de discriminance sur l'ABSENCE TOTALE (ni eyebrow, ni
	 * bouton), pas un état vide. Camp changé via le bloc 1 (SegmentedControl) :
	 * la section apparaît/disparaît SANS remontage de sélection — lecture
	 * dérivée, jamais un `useEffect` (aucun timer, aucun délai à attendre).
	 */
	it('la section Contre-mesures apparait pour un antagoniste et est absente du DOM pour un protagoniste', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		expect(screen.queryByText('CONTRE-MESURES')).toBeNull()
		expect(screen.queryByRole('button', { name: TEXTE_AJOUTER_CONTRE_MESURE })).toBeNull()

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_1 }))
		const groupeCamp = screen.getByRole('radiogroup', { name: 'Camp du personnage' })
		await user.click(within(groupeCamp).getByRole('radio', { name: 'Antagoniste' }))

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		expect(screen.getByText('CONTRE-MESURES')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: TEXTE_AJOUTER_CONTRE_MESURE })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_1 }))
		await user.click(within(groupeCamp).getByRole('radio', { name: 'Protagoniste' }))

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		expect(screen.queryByText('CONTRE-MESURES')).toBeNull()
		expect(screen.queryByRole('button', { name: TEXTE_AJOUTER_CONTRE_MESURE })).toBeNull()
	})

	/**
	 * Critère #2 du plan — brouillon-jusqu'au-blur : `action` vide n'entre
	 * jamais au document (refus SSOT existant sur `CHAMPS_REQUIS`), l'étape ne
	 * se committe qu'au premier blur non vide.
	 */
	it('ajouter une etape refuse une action vide au SSOT, puis persiste au blur non vide', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		await user.click(screen.getByRole('button', { name: TEXTE_AJOUTER_ETAPE }))

		// Focus deplace vers INTENTION (idiome ref-par-identite, pas un booleen).
		const champIntention = screen.getByRole('textbox', { name: /^INTENTION/ })
		expect(champIntention).toHaveFocus()

		// Blur sans avoir rien tape : rien n'est ecrit, l'etape reste locale.
		fireEvent.blur(champIntention)
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.personnages[0].plan_actions).toEqual([])

		// Intention non vide puis blur : commit au document.
		fireEvent.change(champIntention, {
			target: { value: 'Retourne au sanctuaire à la nuit tombée pour consulter les archives.' },
		})
		fireEvent.blur(champIntention)

		expect(updateSpy).toHaveBeenCalledTimes(1)
		const etapes = lire(brain, dossier.id).monde.personnages[0].plan_actions
		expect(etapes).toHaveLength(1)
		expect(etapes[0].action).toBe('Retourne au sanctuaire à la nuit tombée pour consulter les archives.')
		expect(etapes[0].etape).toBe(1)
	})

	/**
	 * KR-189/KR-199 — sonde de discriminance : `contre_mesures[].declencheur_texte`
	 * sans jumeau `_expr` AVERTIT (7e ligne, `alerteSansExpr: true`),
	 * `plan_actions[].declencheur_texte` sans jumeau reste CALME (arbitrage
	 * d'it1). Un test qui ne montrerait que la famille qui avertit laisserait
	 * l'autre sans garde (KR-199) : un seul avertissement doit apparaître, pas
	 * deux, sur un personnage qui porte les deux familles sans expr.
	 */
	it('avertissement D1 visible pour contre_mesures sans expr, absent pour plan_actions sans expr', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.mira',
			portee: 'premier',
			camp: 'antagoniste',
			savoirs: [],
			plan_actions: [
				{
					etape: 1,
					action: 'Détourner la conversation dès que le sceau de cendre est mentionné.',
					declencheur_texte: 'Le joueur prononce le nom du sceau devant elle.',
				},
			],
			contre_mesures: [
				{
					action: "Colporter au marché que le feu de la tour est l'œuvre du héros.",
					declencheur_texte: 'Le joueur a lu la lettre de la Vigie sans lui en avoir rien dit.',
				},
			],
		})
		renderPanel(brain, dossier.id)

		expect(screen.getByText(EYEBROW_AVERTISSEMENT)).toBeInTheDocument()
		const avertissements = screen.getAllByText(/décrit une condition en prose/)
		expect(avertissements).toHaveLength(1)
	})

	/** Critère #1 du plan — commit au blur, brouillon par champ (idiome du bloc
	 *  Identité, it2), sans re-render fantôme. */
	it('but.libelle persiste au blur sur un personnage sans but, sans re-render fantome', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		const champLibelle = screen.getByRole('textbox', { name: /^CE QU'IL VEUT/ })
		expect(champLibelle).toHaveValue('')

		fireEvent.change(champLibelle, {
			target: { value: 'Retrouver le sceau brisé et le remettre en place avant que la brume ne revienne.' },
		})
		expect(updateSpy).not.toHaveBeenCalled()
		fireEvent.blur(champLibelle)

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].but).toEqual({
			libelle: 'Retrouver le sceau brisé et le remettre en place avant que la brume ne revienne.',
		})
		// Pas de re-render fantome : la valeur affichee reste celle tapee/persistee.
		expect(screen.getByRole('textbox', { name: /^CE QU'IL VEUT/ })).toHaveValue(
			'Retrouver le sceau brisé et le remettre en place avant que la brume ne revienne.',
		)
	})

	/** Critère #3 du plan — suppression sans confirmation (édition de contenu,
	 *  pas d'entité référencée). */
	it('retirer une etape supprime la ligne de plan_actions sans confirmation', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			savoirs: [],
			plan_actions: [{ etape: 1, action: 'Retourne au sanctuaire à la nuit tombée pour consulter les archives.' }],
		})
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		expect(screen.getByText('ÉTAPE 1')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: "Retirer l'étape n°1" }))

		expect(lire(brain, dossier.id).monde.personnages[0].plan_actions).toEqual([])
		expect(screen.queryByText('ÉTAPE 1')).toBeNull()
	})

	/** Critère #5 du plan — un antagoniste ajoute PUIS édite une contre-mesure
	 *  déjà persistée (intention, déclencheur), les deux écritures persistent. */
	it('un antagoniste ajoute et edite une contre-mesure, persistee', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.mira',
			portee: 'premier',
			camp: 'antagoniste',
			plan_actions: [],
			savoirs: [],
		})
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		await user.click(screen.getByRole('button', { name: TEXTE_AJOUTER_CONTRE_MESURE }))

		const champIntention = screen.getByRole('textbox', { name: /^INTENTION/ })
		expect(champIntention).toHaveFocus()
		fireEvent.change(champIntention, {
			target: { value: "Colporter au marché que le feu de la tour est l'œuvre du héros." },
		})
		fireEvent.blur(champIntention)

		expect(updateSpy).toHaveBeenCalledTimes(1)
		let contreMesures = lire(brain, dossier.id).monde.personnages[0].contre_mesures
		expect(contreMesures).toHaveLength(1)
		expect(contreMesures?.[0].action).toBe("Colporter au marché que le feu de la tour est l'œuvre du héros.")

		// EDITE ensuite le declencheur de cette meme contre-mesure, deja persistee.
		const champDeclencheur = screen.getByRole('textbox', { name: /^DÉCLENCHEUR/ })
		fireEvent.change(champDeclencheur, {
			target: { value: 'Le joueur a lu la lettre de la Vigie sans lui en avoir rien dit.' },
		})
		fireEvent.blur(champDeclencheur)

		expect(updateSpy).toHaveBeenCalledTimes(2)
		contreMesures = lire(brain, dossier.id).monde.personnages[0].contre_mesures
		expect(contreMesures?.[0].declencheur_texte).toBe(
			'Le joueur a lu la lettre de la Vigie sans lui en avoir rien dit.',
		)
	})

	/** Revue de PR tech-lead (it4) — le clic sur « + Ajouter une étape… » pointait
	 *  toujours `personnage.plan_actions.length` sans vérifier qu'un brouillon
	 *  existe déjà à cet index, et l'écrasait.
	 *
	 *  `fireEvent.click`, PAS `userEvent.click`, à dessein : un VRAI clic sur un
	 *  AUTRE bouton déplace le focus et déclenche d'abord le blur du champ actif
	 *  — `handleBlurEtape` commet alors le brouillon non vide AVANT que le
	 *  second clic ne s'exécute, ce qui masque le bug (vérifié : avec
	 *  `userEvent.click`, ce scénario produit ÉTAPE 1 commitée + ÉTAPE 2 vide,
	 *  jamais une perte). `fireEvent.click` isole le clic du choréographie de
	 *  focus du navigateur et exerce directement la garde. */
	it('un second clic (sans blur intercalaire) sur ajouter une etape n ecrase pas le brouillon en cours', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		fireEvent.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))
		fireEvent.click(screen.getByRole('button', { name: TEXTE_AJOUTER_ETAPE }))
		const champIntention = screen.getByRole('textbox', { name: /^INTENTION/ })
		fireEvent.change(champIntention, { target: { value: 'Un debut de phrase pas encore blur.' } })

		fireEvent.click(screen.getByRole('button', { name: TEXTE_AJOUTER_ETAPE }))

		expect(screen.getAllByRole('textbox', { name: /^INTENTION/ })).toHaveLength(1)
		expect(screen.getByRole('textbox', { name: /^INTENTION/ })).toHaveValue('Un debut de phrase pas encore blur.')
	})

	/** Revue de PR tech-lead (it4) — `duree` est un champ `moteur` : aucun repli
	 *  de LECTURE ne doit fabriquer une valeur que l'auteur n'a jamais posée
	 *  (même doctrine que le repli STATS_INITIALES, réservé à l'écriture). Sonde
	 *  posée AVANT le rendu (KR-199) : seul un spy actif PENDANT le montage
	 *  prouve qu'aucune écriture n'a lieu au montage. */
	it('une etape sans duree n affiche aucun nombre fabrique, et n ecrit rien au montage', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			savoirs: [],
			plan_actions: [
				{
					etape: 1,
					action: 'Retourne au sanctuaire à la nuit tombée pour consulter les archives.',
				},
			],
		})
		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_4 }))

		expect(screen.getByRole('button', { name: '+ Poser une durée…' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Diminuer DURÉE' })).toBeNull()
		expect(screen.queryByRole('button', { name: 'Augmenter DURÉE' })).toBeNull()
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.personnages[0].plan_actions[0]).not.toHaveProperty('duree')
	})

	/** Critère #7 du plan — `si_bloque` sans `duree` produit un avertissement
	 *  D1 NON BLOQUANT (le seed réussit, ce n'est pas une erreur), prouvé sur
	 *  deux personnages distincts. */
	it('si_bloque sans duree produit un avertissement non bloquant, sur deux personnages distincts', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			savoirs: [],
			plan_actions: [
				{
					etape: 1,
					action: 'Retourne au sanctuaire à la nuit tombée pour consulter les archives.',
					si_bloque: "Il change d'approche : au lieu du sanctuaire, il tente sa chance auprès du forgeron.",
				},
			],
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			portee: 'second',
			savoirs: [],
			plan_actions: [
				{
					etape: 1,
					action: 'Entretenir le mécanisme du beffroi sans être vue.',
					si_bloque: "Elle laisse le feu s'éteindre une nuit entière.",
				},
			],
		})
		renderPanel(brain, dossier.id)

		// Aldur (affiche par defaut).
		expect(screen.getByText(EYEBROW_AVERTISSEMENT)).toBeInTheDocument()
		expect(screen.getByText(/aucune durée n'est posée/)).toBeInTheDocument()

		// Selene porte le meme avertissement, independamment (pas de bloc a rouvrir : le bandeau est hors accordeon).
		fireEvent.click(laLigne('pnj.selene'))
		expect(screen.getByText(EYEBROW_AVERTISSEMENT)).toBeInTheDocument()
		expect(screen.getByText(/aucune durée n'est posée/)).toBeInTheDocument()
	})
})
