import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	validateDossier,
	type Brain,
	type Dossier,
	type Personnage,
	type Entite,
} from '../../../brain'
import { PanneauPersonnages } from '../components/PanneauPersonnages'

/**
 * LE RETRAIT D'UN PERSONNAGE (itération 7) — fichier NEUF, séparé de
 * `panneauPersonnages.test.tsx` (843 lignes, §5 du plan) : mêmes petits helpers
 * de montage/seed, DUPLIQUÉS ici à dessein, chaque fichier de test de cette
 * feature restant autonome.
 *
 * Ce que ces tests éprouvent, et que le précédent `PanneauLieux` ne pouvait pas
 * éprouver : le geste passe par une MODALE de confirmation (§ 8 désaccord 1), et
 * le refus au SSOT porte ici sur DEUX familles de références vers `pnj.*` — la
 * relation d'un autre personnage (`relations[].cible_id`) et un prédicat D1
 * (`pnj_a_revele`) imbriqué dans un `…_expr`.
 *
 * Le fil rouge est le VETO du plan (§ 8 désaccord 2) : AUCUN code de la feature
 * ne calcule qui référence le personnage. Le bouton est toujours actif, la modale
 * toujours muette sur les référents, et c'est `DossierService.update()` qui
 * tranche APRÈS la tentative. Le test discriminant de cette propriété est
 * l'auto-référence (KR-194) : un pré-vol côté feature y refuserait à tort.
 *
 * Passe TOUJOURS par la pile complète (`BrainProvider` + `createBrain`), jamais
 * par des props mockées : ce qui est en jeu est l'ÉCRITURE réelle et son refus.
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauPersonnages dossierId={dossierId} />
		</BrainProvider>,
	)
}

/** Sème un personnage de plus par le CHEMIN PUBLIC d'écriture (`dossiers.update()`). */
function semerPersonnage(brain: Brain, dossierId: string, personnage: Personnage): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, personnages: [...d.monde.personnages, personnage] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Sème un indice — la SECONDE cible de `pnj_a_revele`, qui est d'arité 2. */
function semerIndice(brain: Brain, dossierId: string, indice: Entite): Dossier {
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

/** La `ListRow` d'un personnage, retrouvée par son SOUS-TITRE (`personnage.id`). */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

/** Le bouton de retrait de la fiche affichée, par son libellé exact. */
function leBoutonRetirer(libelle: string): HTMLElement {
	return screen.getByRole('button', { name: libelle })
}

/** Le bouton « Retirer » DE LA MODALE — jamais celui de la fiche, dont le
 *  libellé porte en plus la désignation du personnage. */
function confirmerDansLaModale(): HTMLElement {
	return within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirer' })
}

/**
 * Le bandeau de REFUS, distingué du bandeau d'AVERTISSEMENT par son eyebrow :
 * les deux portent `role="status"` (règle RTL du dépôt — `getAllByRole` puis
 * filtrage, jamais `getByRole` sur un rôle qui peut se dédoubler).
 */
function chercherBandeauRefus(): HTMLElement | undefined {
	return screen.queryAllByRole('status').find((b) => b.textContent?.includes(EYEBROW_REFUS))
}

function bandeauRefus(): HTMLElement {
	const bandeau = chercherBandeauRefus()
	if (bandeau === undefined) throw new Error('Aucun bandeau de refus affiche')
	return bandeau
}

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_VIDE = 'Aucun personnage — cliquez « + Ajouter un personnage… » pour commencer.'

const ALDUR: Personnage = { id: 'pnj.aldur', nom: 'Aldûr le Sage', portee: 'premier', plan_actions: [], savoirs: [] }
const SELENE: Personnage = { id: 'pnj.selene', nom: 'Séléné', portee: 'premier', plan_actions: [], savoirs: [] }
const BREWAN: Personnage = { id: 'pnj.brewan', nom: 'Bréwan', portee: 'second', plan_actions: [], savoirs: [] }

const RETIRER_ALDUR = 'Retirer le personnage « Aldûr le Sage »'
const RETIRER_SELENE = 'Retirer le personnage « Séléné »'

/** Le corps EXACT de la modale (§3 du plan) — texte fixe, générique, et muet sur
 *  les référents : il n'énumère ni les blocs remplis, ni qui pointe ce personnage. */
const corpsModale = (designation: string) =>
	`Le personnage ${designation} sera retiré de l'aventure, avec tout contenu déjà renseigné parmi l'identité, les caractéristiques, le plan d'actions, les relations, la présence et les savoirs. Cette action est irréversible.`

describe('PanneauPersonnages - retrait', () => {
	beforeEach(() => window.localStorage.clear())

	it('retirer un personnage non reference le supprime, liste N vers N-1, aucun retrait optimiste', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, SELENE)
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		// Aldûr est la selection par defaut (premier du tableau).
		expect(laLigne('pnj.aldur')).toHaveAttribute('aria-current', 'true')
		await user.click(leBoutonRetirer(RETIRER_ALDUR))

		// LA MODALE S'OUVRE ET RIEN N'EST ECRIT : le retrait n'est pas optimiste,
		// et le clic sur le bouton de la fiche ne committe pas de lui-meme.
		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(2)

		await user.click(confirmerDansLaModale())

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(screen.queryByRole('dialog')).toBeNull()
		const restants = lire(brain, dossier.id).monde.personnages
		expect(restants).toHaveLength(1)
		expect(restants[0].id).toBe('pnj.selene')
		expect(screen.queryByText(/pnj\.aldur/)).toBeNull()
	})

	it('modale: titre, corps exact, et le repli sans nom sur un personnage jamais nomme', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.anonyme', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		// Le libelle du bouton suit les DEUX branches de `localiserEntite('pnj', …)`.
		await user.click(leBoutonRetirer('Retirer le personnage n°1 (sans nom)'))

		const modale = screen.getByRole('dialog')
		expect(within(modale).getByText('Retirer le personnage')).toBeInTheDocument()
		expect(within(modale).getByText(corpsModale('n°1 (sans nom)'))).toBeInTheDocument()
		expect(within(modale).getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
		expect(within(modale).getByRole('button', { name: 'Retirer' })).toBeInTheDocument()
	})

	/**
	 * REFUS AU SSOT, premiere famille — `relations[].cible_id` d'un TIERS
	 * (`REFERENCES_SIMPLES`, espace `pnj`, depuis it5). Miroir exact du test
	 * `charpente.depart.lieu_id` de `panneauLieux.test.tsx`.
	 *
	 * Le bandeau nomme le personnage REFERENCANT (`location`), jamais le retire :
	 * le OU d'une anomalie est l'entite qui porte le champ fautif.
	 */
	it('refus par relations[].cible_id d un tiers: liste inchangee, bandeau nomme le referencant', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, {
			...SELENE,
			relations: [{ cible_id: 'pnj.aldur', lien: 'son maître, dont elle a trahi la confiance', intensite: -2 }],
		})
		renderPanel(brain, dossier.id)

		// LE BOUTON RESTE ACTIF alors que le personnage est reference (veto §8
		// desaccord 2) : aucun pre-vol ne le desactive.
		const bouton = leBoutonRetirer(RETIRER_ALDUR)
		expect(bouton).toBeEnabled()
		await user.click(bouton)
		await user.click(confirmerDansLaModale())

		// Rien n'est persiste, la liste et la selection sont celles d'avant.
		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(2)
		expect(laLigne('pnj.aldur')).toHaveAttribute('aria-current', 'true')

		const bandeau = bandeauRefus()
		expect(bandeau).toHaveTextContent('Personnage « Séléné »')
		expect(bandeau).toHaveTextContent('pnj.aldur')
		expect(bandeau).toHaveTextContent('cible_id')
		// La consigne QUOI FAIRE corrigee a l'iteration 7 (BUG-075) : cette surface
		// n'est pas un import, et la ligne ne dit plus de reimporter le fichier.
		expect(bandeau).toHaveTextContent("↪ Corrigez « cible_id » ou rétablissez l'élément correspondant.")
		expect(bandeau).not.toHaveTextContent(/réimport/i)
	})

	/**
	 * REFUS AU SSOT, seconde famille — un predicat D1 `pnj_a_revele` IMBRIQUE.
	 * La profondeur est ce que ce test prouve et qu'un `…_expr` a un seul niveau
	 * ne prouverait pas : `collectRefs` (`expr.ts`) descend recursivement dans
	 * `et`/`ou`/`non` jusqu'a `PROFONDEUR_MAX_EXPR`. Ici le predicat est au
	 * TROISIEME niveau (et → non → predicat).
	 */
	it('refus par pnj_a_revele imbrique sous et/non a profondeur superieure a 2', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.sceau-brise', nom: 'Le sceau brisé' })
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, {
			...SELENE,
			plan_actions: [
				{
					etape: 1,
					action: 'Elle surveille la route du nord sans se montrer.',
					declencheur_expr: {
						op: 'et',
						enfants: [
							{
								op: 'non',
								enfant: { op: 'predicat', predicat: 'pnj_a_revele', cibles: ['pnj.aldur', 'indice.sceau-brise'] },
							},
							{ op: 'predicat', predicat: 'indice_connu', cibles: ['indice.sceau-brise'] },
						],
					},
				},
			],
		})
		renderPanel(brain, dossier.id)

		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		await user.click(confirmerDansLaModale())

		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(2)
		const bandeau = bandeauRefus()
		expect(bandeau).toHaveTextContent('Personnage « Séléné »')
		expect(bandeau).toHaveTextContent("le personnage a déjà révélé l'indice")
		expect(bandeau).toHaveTextContent('declencheur_expr')
		expect(bandeau).toHaveTextContent('pnj.aldur')
	})

	/**
	 * KR-194 — LE TEST DISCRIMINANT DU VETO. Un personnage dont la SEULE relation
	 * entrante est la sienne DOIT pouvoir se retirer : l'entite et sa propre
	 * relation partent dans le MEME commit, donc rien ne pend jamais. Un pre-vol
	 * cote feature (« quelqu'un pointe cet id ») refuserait ici a tort — c'est
	 * exactement ce que ce test rougirait de detecter.
	 */
	it('se retirer soi-meme supprime l entite et sa propre relation auto-referentielle, sans reference-pendante', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			...ALDUR,
			relations: [{ cible_id: 'pnj.aldur', lien: 'sa propre ombre, quil ne pardonne pas', intensite: -1 }],
		})
		semerPersonnage(brain, dossier.id, SELENE)
		renderPanel(brain, dossier.id)

		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		await user.click(confirmerDansLaModale())

		const apres = lire(brain, dossier.id)
		expect(apres.monde.personnages).toHaveLength(1)
		expect(apres.monde.personnages[0].id).toBe('pnj.selene')
		expect(chercherBandeauRefus()).toBeUndefined()
		expect(validateDossier(apres).errors).toEqual([])
	})

	/**
	 * Meme montage que le test precedent, lu au niveau CONTRAT : le document
	 * persiste apres retrait est integralement valide (aucune `error`), et le
	 * patch reste ETROIT — `canon` et `charpente` traversent intacts, les autres
	 * personnages aussi. La seule chose disparue est la relation orpheline
	 * attendue, celle que le personnage retire portait sur lui-meme.
	 */
	it('apres retrait: canon, charpente et autres personnages intacts, document sans erreur', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			...ALDUR,
			relations: [{ cible_id: 'pnj.aldur', lien: 'sa propre ombre', intensite: -1 }],
		})
		semerPersonnage(brain, dossier.id, SELENE)
		const avant = lire(brain, dossier.id)
		renderPanel(brain, dossier.id)

		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		await user.click(confirmerDansLaModale())

		const apres = lire(brain, dossier.id)
		expect(apres.canon).toEqual(avant.canon)
		expect(apres.charpente).toEqual(avant.charpente)
		expect(apres.monde.lieux).toEqual(avant.monde.lieux)
		expect(apres.monde.personnages).toEqual(avant.monde.personnages.filter((p) => p.id !== 'pnj.aldur'))
		expect(validateDossier(apres).errors).toEqual([])
	})

	/**
	 * KR-197, moitie AFFICHAGE (5e occurrence, replique de BUG-061 appliquee au
	 * chemin RETRAIT) : un refus provoque sur A ne doit jamais se montrer sous la
	 * fiche de B, y compris apres un simple changement de selection.
	 */
	it('un refus de retrait sur A ne s affiche pas sous B apres changement de selection', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, {
			...SELENE,
			relations: [{ cible_id: 'pnj.aldur', lien: 'son maître', intensite: 2 }],
		})
		renderPanel(brain, dossier.id)

		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		await user.click(confirmerDansLaModale())
		expect(bandeauRefus()).toBeInTheDocument()

		// Changer de selection ne committe rien : le refus reste indexe sur Aldûr.
		await user.click(laLigne('pnj.selene'))
		expect(chercherBandeauRefus()).toBeUndefined()

		// Revenir sur Aldûr le refait apparaitre : l'etat est conserve PAR
		// personnage, pas efface globalement au premier changement de selection.
		await user.click(laLigne('pnj.aldur'))
		expect(bandeauRefus()).toBeInTheDocument()
	})

	/**
	 * KR-197, moitie INVALIDATION, sur DEUX entites distinctes : une ecriture
	 * reussie sur B n'efface pas le refus non resolu de A ; une ecriture reussie
	 * sur A, elle, l'efface.
	 */
	it('une ecriture reussie sur B n efface pas le refus de A, une ecriture reussie sur A l efface', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, {
			...SELENE,
			relations: [{ cible_id: 'pnj.aldur', lien: 'son maître', intensite: 2 }],
		})
		renderPanel(brain, dossier.id)

		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		await user.click(confirmerDansLaModale())
		expect(bandeauRefus()).toBeInTheDocument()

		// Succes sur Séléné (B) — le bandeau de A est masque par le filtre
		// d'affichage pendant qu'on edite B, mais il ne doit pas etre RESOLU.
		await user.click(laLigne('pnj.selene'))
		const champNomB = screen.getByRole('textbox', { name: /nom du personnage/i })
		fireEvent.change(champNomB, { target: { value: 'Séléné la Pâle' } })
		fireEvent.blur(champNomB)
		expect(lire(brain, dossier.id).monde.personnages[1].nom).toBe('Séléné la Pâle')

		await user.click(laLigne('pnj.aldur'))
		expect(bandeauRefus()).toBeInTheDocument()

		// Succes sur Aldûr (A) — CELUI-LA resout le refus qui portait sur lui.
		const champNomA = screen.getByRole('textbox', { name: /nom du personnage/i })
		fireEvent.change(champNomA, { target: { value: 'Aldûr' } })
		fireEvent.blur(champNomA)
		expect(chercherBandeauRefus()).toBeUndefined()
	})

	it('retirer le dernier personnage bascule sur l etat vide, le focus retombe sur + Ajouter (pas document.body)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		renderPanel(brain, dossier.id)

		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		await user.click(confirmerDansLaModale())

		expect(lire(brain, dossier.id).monde.personnages).toEqual([])
		expect(screen.queryByRole('dialog')).toBeNull()
		expect(screen.getByText(TEXTE_VIDE)).toBeInTheDocument()
		// Aucun bouton « Retirer le personnage » n'existe plus dans l'etat vide : le
		// repli doit atterrir sur « + Ajouter un personnage… », jamais document.body
		// (regression de PR it7 -- panneauRef n'etait pas pose sur cette branche).
		expect(screen.getByRole('button', { name: '+ Ajouter un personnage…' })).toHaveFocus()
	})

	/**
	 * KR-199 — LE FOCUS SUIT LA FICHE RETOMBEE, avec sa SONDE DE DISCRIMINANCE.
	 *
	 * UN mutant doit le faire rougir, et le montage est choisi pour ca :
	 * `restants[0]` au lieu de `restants[Math.max(index - 1, 0)]` — on retire ici
	 * le DERNIER des trois (index 2), donc la retombee attendue est le PRECEDENT
	 * (Séléné, index 1) et non le premier de la liste (Aldûr).
	 *
	 * REVUE DE PR (post-livraison it8) : cette sonde en visait un SECOND —
	 * `PanneauPersonnages.tsx` cherchait le bouton de retrait dans le DOM par un
	 * `aria-label`, et un selecteur NON ANCRE (`button[aria-label^="Retirer"]`)
	 * aurait pu focaliser un des boutons « Retirer la relation… »/« Retirer la
	 * présence… » MASQUES (`display:none`) qui precedent le bon bouton dans
	 * l'ordre du DOM des blocs FERMES de l'accordeon. Ce mutant n'existe plus :
	 * `FichePersonnage` expose desormais `focusRetirer()` (`useImperativeHandle`,
	 * `FichePersonnageHandle`) que ce panneau APPELLE, sans jamais chercher le bon
	 * bouton parmi plusieurs candidats — il n'y a plus de selecteur a ancrer. Le
	 * montage a plusieurs boutons « Retirer… » ambigus reste toutefois une garde
	 * utile : il prouve que le focus suit la BONNE fiche meme quand le DOM porte
	 * plusieurs candidats plausibles.
	 */
	it('focus apres retrait reussi sur le bouton Retirer de la fiche retombee', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const lieuAmorce = lire(brain, dossier.id).monde.lieux[0]
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, {
			...SELENE,
			// Auto-reference (legale, KR-194) : elle donne a la fiche de Séléné ses
			// boutons « Retirer la relation… »/« Retirer la présence… » sans creer
			// de reference vers Bréwan, dont le retrait doit REUSSIR.
			relations: [{ cible_id: 'pnj.selene', lien: 'sa propre ombre', intensite: -1 }],
			presence: [{ lieu_id: lieuAmorce.id }],
		})
		semerPersonnage(brain, dossier.id, BREWAN)
		const { container } = renderPanel(brain, dossier.id)

		await user.click(laLigne('pnj.brewan'))
		await user.click(leBoutonRetirer('Retirer le personnage « Bréwan »'))
		await user.click(confirmerDansLaModale())

		// La selection retombe sur le personnage PRECEDENT (index 2 - 1 = 1), pas
		// sur le premier de la liste.
		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(2)
		expect(laLigne('pnj.selene')).toHaveAttribute('aria-current', 'true')
		expect(laLigne('pnj.aldur')).not.toHaveAttribute('aria-current', 'true')

		// SONDE : plusieurs boutons « Retirer … » dans le DOM, celui du personnage
		// n'est PAS le premier — et c'est pourtant lui qui recoit le focus.
		const tousLesRetirer = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-label^="Retirer"]'))
		expect(tousLesRetirer.length).toBeGreaterThan(1)
		expect(tousLesRetirer[0].getAttribute('aria-label')).not.toBe(RETIRER_SELENE)
		expect(leBoutonRetirer(RETIRER_SELENE)).toHaveFocus()
	})

	it('modale: Annuler ne committe rien, ni la selection ni le focus ne changent', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, SELENE)
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))

		expect(screen.queryByRole('dialog')).toBeNull()
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(2)
		expect(laLigne('pnj.aldur')).toHaveAttribute('aria-current', 'true')
		// `Modal` rend le focus a l'element qui l'a ouverte.
		expect(leBoutonRetirer(RETIRER_ALDUR)).toHaveFocus()
	})

	it('modale: Echap ne committe rien, ni la selection ni le focus ne changent', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, SELENE)
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		await user.keyboard('{Escape}')

		expect(screen.queryByRole('dialog')).toBeNull()
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(2)
		expect(laLigne('pnj.aldur')).toHaveAttribute('aria-current', 'true')
		expect(leBoutonRetirer(RETIRER_ALDUR)).toHaveFocus()
	})

	it('modale: le bouton Retirer de la modale est le seul qui committe', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, SELENE)
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		// Deux clics sur le bouton de la fiche pendant que la modale est ouverte :
		// la garde en ligne (`enConfirmation === personnageAffiche.id`) ne peut pas
		// dupliquer d'etat, et rien n'est ecrit tant que la modale n'a pas repondu.
		await user.click(leBoutonRetirer(RETIRER_ALDUR))
		expect(screen.getAllByRole('dialog')).toHaveLength(1)
		expect(updateSpy).not.toHaveBeenCalled()

		await user.click(confirmerDansLaModale())
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(1)
	})

	/**
	 * LE REFUS AVEC MODALE, mecanisme isole (§ 8 desaccord 6, resolu en deux
	 * invariants). Deux choses y sont eprouvees :
	 *
	 *  1. la modale se ferme quand meme — la fermeture et le retrait sont dans le
	 *     MEME gestionnaire synchrone, la fermeture n'est pas conditionnee au
	 *     succes ; le bandeau prend la main ;
	 *  2. `intentionFocus` n'est PAS pose au refus. La sonde : la modale est
	 *     ouverte par `fireEvent.click`, qui ne deplace PAS le focus — l'element
	 *     que `Modal` capture est donc `document.body`, et c'est a lui qu'elle le
	 *     rend. Si `handleConfirmerRetrait` posait `intentionFocus` au refus, le
	 *     bouton de la fiche recevrait le focus et cette assertion rougirait.
	 *
	 * La modale est aussi verifiee MUETTE sur les referents : elle ne nomme jamais
	 * Séléné, qui est pourtant la raison du refus a venir (veto §8 desaccord 2).
	 */
	it('refus avec modale: elle se ferme, le bandeau prend la main, selection et focus inchanges', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, ALDUR)
		semerPersonnage(brain, dossier.id, {
			...SELENE,
			relations: [{ cible_id: 'pnj.aldur', lien: 'son maître', intensite: 2 }],
		})
		renderPanel(brain, dossier.id)

		fireEvent.click(leBoutonRetirer(RETIRER_ALDUR))
		const modale = screen.getByRole('dialog')
		expect(within(modale).getByText(corpsModale('« Aldûr le Sage »'))).toBeInTheDocument()
		expect(modale).not.toHaveTextContent('Séléné')
		expect(modale).not.toHaveTextContent(/référenc/i)

		fireEvent.click(confirmerDansLaModale())

		expect(screen.queryByRole('dialog')).toBeNull()
		expect(bandeauRefus()).toBeInTheDocument()
		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(2)
		expect(laLigne('pnj.aldur')).toHaveAttribute('aria-current', 'true')
		// AUCUN `intentionFocus` au refus : le focus revient la ou il etait (le
		// corps du document), pas sur le bouton de retrait.
		expect(leBoutonRetirer(RETIRER_ALDUR)).not.toHaveFocus()
		expect(document.body).toHaveFocus()
	})
})
