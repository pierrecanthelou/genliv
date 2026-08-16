import fs from 'fs'
import path from 'path'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	validateDossier,
	type Brain,
	type Dossier,
	type Objet,
	type Personnage,
	type Entite,
} from '../../../brain'
import { PanneauObjets } from '../components/PanneauObjets'

/**
 * LE RETRAIT D'UN OBJET (itération 2) — fichier NEUF, séparé de
 * `panneauObjets.test.tsx` (§5 du plan) : mêmes petits helpers de
 * montage/seed, DUPLIQUÉS ici à dessein, chaque fichier de test de cette
 * feature restant autonome (précédent `retraitPersonnage.test.tsx`).
 *
 * Le fil rouge est le même veto que dossier-fiches it7 : AUCUN code de la
 * feature ne calcule ce qui référence l'objet. Le bouton est toujours actif,
 * la modale toujours muette sur les référents, et c'est `DossierService.update()`
 * qui tranche APRÈS la tentative.
 *
 * Le test de DISCRIMINANCE (KR-202) sème sa PROPRE fixture EN MÉMOIRE — jamais
 * `dossier-reference.json` (§ 8 désaccord 3 du plan) — sauf la toute dernière
 * assertion de ce fichier, séparée et hors discriminance, qui lit le fichier
 * réel (KR-156).
 *
 * Passe TOUJOURS par la pile complète (`BrainProvider` + `createBrain`), jamais
 * par des props mockées : ce qui est en jeu est l'ÉCRITURE réelle et son refus.
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauObjets dossierId={dossierId} />
		</BrainProvider>,
	)
}

/** Sème un objet de plus par le CHEMIN PUBLIC d'écriture (`dossiers.update()`). */
function semerObjet(brain: Brain, dossierId: string, objet: Objet): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, objets: [...d.monde.objets, objet] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Sème un indice — requis par `savoirs[].indice_id`, arité 1 non optionnelle. */
function semerIndice(brain: Brain, dossierId: string, indice: Entite): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, indices: [...d.monde.indices, indice] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Sème un personnage de plus — porteur, dans ce fichier, du savoir qui
 *  référence l'objet en discrimination. */
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

/** La `ListRow` d'un objet, retrouvée par son SOUS-TITRE (`objet.id`). */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

/** Le bouton de retrait de la fiche affichée, par son libellé exact. */
function leBoutonRetirer(libelle: string): HTMLElement {
	return screen.getByRole('button', { name: libelle })
}

/** Le bouton « Retirer » DE LA MODALE — jamais celui de la fiche, dont le
 *  libellé porte en plus la désignation de l'objet. */
function confirmerDansLaModale(): HTMLElement {
	return within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirer' })
}

/**
 * Le bandeau de REFUS — `role="status"`, règle RTL du dépôt (`getAllByRole`
 * puis filtrage, jamais `getByRole` nu sur un rôle qui peut se dédoubler).
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
const TEXTE_VIDE = 'Aucun objet — cliquez « + Ajouter un objet… » pour commencer.'

/** Le corps EXACT de la modale (§3 du plan) — texte fixe, générique, et muet sur
 *  les référents. */
const corpsModale = (designation: string) =>
	`L'objet ${designation} sera retiré du registre, avec tout contenu déjà renseigné parmi le nom et la description. Cette action est irréversible.`

const ALPHA: Objet = { id: 'objet.alpha', nom: 'Alpha' }
const BETA: Objet = { id: 'objet.beta', nom: 'Beta' }
const RETIRER_ALPHA = "Retirer l'objet « Alpha »"
const RETIRER_BETA = "Retirer l'objet « Beta »"

describe('PanneauObjets - retrait', () => {
	beforeEach(() => window.localStorage.clear())

	it('retrait sans reference: reussi, focus sur l objet suivant', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, ALPHA)
		semerObjet(brain, dossier.id, BETA)
		renderPanel(brain, dossier.id)

		expect(laLigne('objet.alpha')).toHaveAttribute('aria-current', 'true')
		await user.click(leBoutonRetirer(RETIRER_ALPHA))

		// LA MODALE S'OUVRE ET RIEN N'EST ECRIT : le retrait n'est pas optimiste.
		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(lire(brain, dossier.id).monde.objets).toHaveLength(2)

		await user.click(confirmerDansLaModale())

		expect(screen.queryByRole('dialog')).toBeNull()
		const restants = lire(brain, dossier.id).monde.objets
		expect(restants).toHaveLength(1)
		expect(restants[0].id).toBe('objet.beta')

		// La fiche retombee est celle de Beta, et SON bouton de retrait a le focus
		// (via `FicheObjetHandle`, jamais une recherche DOM distante).
		expect(screen.getByRole('textbox', { name: /nom de l.objet/i })).toHaveValue('Beta')
		expect(leBoutonRetirer(RETIRER_BETA)).toHaveFocus()
	})

	it('retrait du dernier objet: liste vide, focus sur + Ajouter', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, ALPHA)
		renderPanel(brain, dossier.id)

		await user.click(leBoutonRetirer(RETIRER_ALPHA))
		await user.click(confirmerDansLaModale())

		expect(lire(brain, dossier.id).monde.objets).toEqual([])
		expect(screen.queryByRole('dialog')).toBeNull()
		expect(screen.getByText(TEXTE_VIDE)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '+ Ajouter un objet…' })).toHaveFocus()
	})

	/**
	 * DISCRIMINANCE (KR-202) — DEUX objets distincts dans le MÊME test : un
	 * personnage local porte, dans son SEUL savoir, une contrepartie qui pointe
	 * le premier objet ; le second objet n'est référencé nulle part. Fixture
	 * ENTIÈREMENT semée EN MÉMOIRE (§ 8 désaccord 3 du plan) — jamais
	 * `dossier-reference.json`.
	 */
	it('discriminance: un objet referme par contrepartie refuse, un objet libre reussit, MEME TEST', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.pas-de-cendre', nom: 'Des pas dans la cendre' })
		const OBJET_REFERME: Objet = { id: 'objet.referme', nom: 'Objet référencé' }
		const OBJET_LIBRE: Objet = { id: 'objet.libre', nom: 'Objet libre' }
		semerObjet(brain, dossier.id, OBJET_REFERME)
		semerObjet(brain, dossier.id, OBJET_LIBRE)
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.gardien',
			nom: 'Le Gardien',
			portee: 'premier',
			plan_actions: [],
			savoirs: [
				{
					indice_id: 'indice.pas-de-cendre',
					certitude: 'sait',
					revele_si: { contrepartie: { objet_id: 'objet.referme', consomme: true } },
				},
			],
		})
		renderPanel(brain, dossier.id)

		// PREMIER : referme par la contrepartie du savoir -> REFUSE.
		await user.click(leBoutonRetirer("Retirer l'objet « Objet référencé »"))
		await user.click(confirmerDansLaModale())

		expect(lire(brain, dossier.id).monde.objets).toHaveLength(2)
		const bandeau = bandeauRefus()
		expect(bandeau).toHaveTextContent('Personnage « Le Gardien »')
		expect(bandeau).toHaveTextContent('objet.referme')
		expect(bandeau).toHaveTextContent('objet_id')

		// SECOND, dans le MEME test : libre -> REUSSIT.
		await user.click(laLigne('objet.libre'))
		await user.click(leBoutonRetirer("Retirer l'objet « Objet libre »"))
		await user.click(confirmerDansLaModale())

		const apres = lire(brain, dossier.id)
		expect(apres.monde.objets).toHaveLength(1)
		expect(apres.monde.objets[0].id).toBe('objet.referme')
		expect(validateDossier(apres).errors).toEqual([])
	})

	it('modale: Annuler ne committe rien, le focus revient au bouton Retirer', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, ALPHA)
		semerObjet(brain, dossier.id, BETA)
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(leBoutonRetirer(RETIRER_ALPHA))
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))

		expect(screen.queryByRole('dialog')).toBeNull()
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.objets).toHaveLength(2)
		expect(leBoutonRetirer(RETIRER_ALPHA)).toHaveFocus()
	})

	it('modale: Echap ne committe rien, le focus revient au bouton Retirer', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, ALPHA)
		semerObjet(brain, dossier.id, BETA)
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(leBoutonRetirer(RETIRER_ALPHA))
		await user.keyboard('{Escape}')

		expect(screen.queryByRole('dialog')).toBeNull()
		expect(updateSpy).not.toHaveBeenCalled()
		expect(lire(brain, dossier.id).monde.objets).toHaveLength(2)
		expect(leBoutonRetirer(RETIRER_ALPHA)).toHaveFocus()
	})

	it('modale: corps exact et repli sans nom sur un objet jamais nomme', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, { id: 'objet.anonyme' })
		renderPanel(brain, dossier.id)

		await user.click(leBoutonRetirer("Retirer l'objet n°1 (sans nom)"))

		const modale = screen.getByRole('dialog')
		expect(within(modale).getByText("Retirer l'objet")).toBeInTheDocument()
		expect(within(modale).getByText(corpsModale('n°1 (sans nom)'))).toBeInTheDocument()
		expect(within(modale).getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
		expect(within(modale).getByRole('button', { name: 'Retirer' })).toBeInTheDocument()
		expect(modale).not.toHaveTextContent('référenc')
	})

	/**
	 * AUCUN PRÉ-VOL : le bouton reste actif quelle que soit la référence en
	 * cours, et la tentative part réellement vers le SSOT — la feature ne
	 * devine jamais le refus à l'avance.
	 */
	it('aucun pre-vol: bouton toujours actif, tentative refusee au SSOT', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: 'indice.pas-de-cendre', nom: 'Des pas dans la cendre' })
		semerObjet(brain, dossier.id, { id: 'objet.referme', nom: 'Objet référencé' })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.gardien',
			nom: 'Le Gardien',
			portee: 'premier',
			plan_actions: [],
			savoirs: [
				{
					indice_id: 'indice.pas-de-cendre',
					certitude: 'sait',
					revele_si: { contrepartie: { objet_id: 'objet.referme', consomme: true } },
				},
			],
		})
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const bouton = leBoutonRetirer("Retirer l'objet « Objet référencé »")
		expect(bouton).not.toBeDisabled()
		await user.click(bouton)
		await user.click(confirmerDansLaModale())

		// La feature A TENTÉ le retrait : la recette envoyée au SSOT ne porte plus
		// l'objet, même si l'écriture globale a été refusée.
		expect(updateSpy).toHaveBeenCalledTimes(1)
		const recette = updateSpy.mock.calls[0][1]
		const avant = lire(brain, dossier.id)
		expect(recette(avant).monde.objets.map((o) => o.id)).not.toContain('objet.referme')

		// Le document réel n'a rien perdu (refus).
		expect(lire(brain, dossier.id).monde.objets).toHaveLength(1)

		// Le message affiché est le message du SSOT, verbatim.
		const bandeau = bandeauRefus()
		expect(bandeau).toHaveTextContent(
			"Le champ « objet_id » pointe « objet.referme », qui n'existe pas dans ce dossier.",
		)
	})

	/**
	 * § Encapsulation — aucun pré-vol : ni `PanneauObjets.tsx` ni `FicheObjet.tsx`
	 * ne connaissent le nom d'un autre registre du dossier.
	 */
	it('grep anti-pre-vol: aucune connaissance d un autre registre cote feature', () => {
		const composants = ['PanneauObjets.tsx', 'FicheObjet.tsx']
		for (const fichier of composants) {
			const source = fs.readFileSync(path.join(__dirname, '..', 'components', fichier), 'utf8')
			expect(source).not.toContain('personnages')
			expect(source).not.toContain('savoirs')
		}
	})

	/**
	 * § Encapsulation — anti-BUG-078 : le panneau ne va JAMAIS chercher le
	 * bouton de retrait dans le DOM de la fiche, il le DEMANDE via
	 * `FicheObjetHandle`.
	 */
	it('grep encapsulation: aucun querySelector du panneau vers la fiche', () => {
		const source = fs.readFileSync(path.join(__dirname, '..', 'components', 'PanneauObjets.tsx'), 'utf8')
		expect(source).not.toContain('querySelector')
		expect(source).not.toContain('getElementById')
	})

	/**
	 * KR-199 — SONDE À CANDIDATS MULTIPLES : au moins deux boutons « Retirer… »
	 * restent dans le DOM après le retrait, et c'est pourtant le bon qui reçoit
	 * le focus — un `toHaveFocus()` seul, sur un unique objet restant, ne
	 * distinguerait pas un focus correctement ciblé d'un focus arrivé au même
	 * endroit par accident d'ordre DOM.
	 */
	it('focus post-retrait: sonde a candidats multiples, pas un simple toHaveFocus', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const GAMMA: Objet = { id: 'objet.gamma', nom: 'Gamma' }
		semerObjet(brain, dossier.id, ALPHA)
		semerObjet(brain, dossier.id, BETA)
		semerObjet(brain, dossier.id, GAMMA)
		renderPanel(brain, dossier.id)

		// Retirer le DERNIER (Gamma, index 2) : la retombee attendue est le
		// PRECEDENT (Beta, index 1), pas le premier de la liste (Alpha) -- un
		// mutant qui remplacerait `Math.max(index - 1, 0)` par `0` ciblerait Alpha.
		await user.click(laLigne('objet.gamma'))
		await user.click(leBoutonRetirer("Retirer l'objet « Gamma »"))
		await user.click(confirmerDansLaModale())

		// AU MOINS DEUX objets restent : la discriminance n'est pas triviale sur
		// une liste a un seul element restant (KR-199).
		expect(lire(brain, dossier.id).monde.objets).toHaveLength(2)
		expect(laLigne('objet.beta')).toHaveAttribute('aria-current', 'true')
		expect(laLigne('objet.alpha')).not.toHaveAttribute('aria-current', 'true')

		// SONDE DE DISCRIMINANCE (KR-199) -- `FicheObjet.tsx` n'a qu'UN SEUL bouton
		// de retrait (contrairement a `FichePersonnage.tsx`, dont l'accordeon porte
		// des sous-blocs repetes qui laissent plusieurs boutons "Retirer..." dans
		// le DOM) : un `toHaveFocus()` isole sur Beta ne suffirait pas a exclure un
		// mutant d'index qui aurait affiche ET focalise Alpha a la place. Cette
		// ligne exclut explicitement ce candidat plausible : le bouton d'Alpha, que
		// viserait un mutant `restants[0]`, n'existe PAS dans le DOM a cet instant.
		expect(screen.queryByRole('button', { name: RETIRER_ALPHA })).toBeNull()
		expect(leBoutonRetirer(RETIRER_BETA)).toHaveFocus()
	})

	/**
	 * KR-156, HORS DISCRIMINANCE — non-régression sur la référence RÉELLE du
	 * dossier de référence : `objet.lanterne-de-corvin` est déjà référencé par
	 * `pnj.tobin-le-gamin.savoirs[0]`. Une seule assertion, lue depuis le
	 * FICHIER réel — ne prouve PAS la discriminance (§ 8 désaccord 4 du plan),
	 * seulement que ce fait déjà vrai reste vrai.
	 */
	it('objet.lanterne-de-corvin (reference reelle du dossier de reference) refuse', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const cheminReference = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'brain',
			'dossier',
			'__fixtures__',
			'dossier-reference.json',
		)
		const inspection = brain.dossiers.importDossier(fs.readFileSync(cheminReference, 'utf8'))
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const { dossier } = inspection
		const objet = dossier.monde.objets.find((o) => o.id === 'objet.lanterne-de-corvin')
		if (objet === undefined) throw new Error('objet.lanterne-de-corvin absent de la reference')
		renderPanel(brain, dossier.id)

		await user.click(laLigne('objet.lanterne-de-corvin'))
		await user.click(leBoutonRetirer(`Retirer l'objet « ${objet.nom} »`))
		await user.click(confirmerDansLaModale())

		expect(lire(brain, dossier.id).monde.objets.map((o) => o.id)).toContain('objet.lanterne-de-corvin')
		expect(bandeauRefus()).toBeInTheDocument()
		// Non-régression : les 3 objets de la référence restent inchangés.
		expect(lire(brain, dossier.id).monde.objets).toHaveLength(3)
	})
})
