import fs from 'node:fs'
import path from 'node:path'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	validateDossier,
	CERTITUDE_INITIALE,
	CONFIANCE_INITIALE_PORTE,
	DEFAULT_CHARACTERISTIC,
	DEFAULT_CHALLENGE_TIER,
	type Brain,
	type Dossier,
	type Entite,
	type Personnage,
	type Revelation,
} from '../../../brain'
// IMPORT PROFOND ASSUMÉ, et il n'en existe pas d'autre : les tables du
// validateur ne sont PAS ré-exportées par `brain/index.ts` (« aucun consommateur
// hors de `brain/dossier/` avant la n° 10 »), or la garde structurelle ci-dessous
// doit lire LES CHEMINS RÉELS DU SCHÉMA — une seconde liste recopiée à la main ne
// verrait jamais une cinquième porte oubliée des deux côtés (§ 8 désaccord 8).
// Précédent d'import profond depuis un test de feature : `brain/persistenceKeys`.
import { ENUMERES_FERMES, REFERENCES_SIMPLES } from '../../../brain/dossier/tables'
import { DESTINATION_DES_CHAMPS } from '../../../brain/dossier/destinations'
import { PanneauPersonnages } from '../components/PanneauPersonnages'
import { BlocSavoirs, PORTES_UI } from '../components/BlocSavoirs'
import type { BrouillonSavoir } from '../hooks/useEcritureSavoirs'

/**
 * Le bloc 7 « Savoirs » de l'accordéon (§3/§6/§7 du plan d'itération 6 de
 * `dossier-fiches`). Fichier NEUF, autonome (même choix que les fichiers de test
 * voisins de cette feature) : mêmes petits helpers de montage/seed, dupliqués
 * ici à dessein.
 *
 * Ce que ces tests éprouvent, distinct des blocs précédents : les QUATRE PORTES
 * de révélation — leur indépendance deux à deux, le fait qu'ouvrir committe
 * TOUTES les clés de la porte en un geste et que fermer retire la clé RACINE
 * (jamais un objet vide) —, la garde STRUCTURELLE qui relie le descripteur de
 * l'écran aux chemins réels du schéma, les trois états vides (bloc, contrepartie,
 * indice préalable avec self-exclusion), l'avertissement `revelation-sans-porte`
 * dans ses trois temps, et la lecture au montage sur deux personnages (KR-199).
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

function semerIndice(brain: Brain, dossierId: string, indice: Entite): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, indices: [...d.monde.indices, indice] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

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

/** Le premier savoir du premier personnage — l'accès le plus répété du fichier. */
function premierSavoir(brain: Brain, dossierId: string) {
	return lire(brain, dossierId).monde.personnages[0].savoirs[0]
}

/** La `ListRow` d'un personnage, retrouvée par son SOUS-TITRE (`personnage.id`). */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

/** La valeur affichée par un `Stepper`, signée — `prefix="+"` n'affiche le signe
 *  que sur une valeur strictement positive. */
function valeurStepper(label: string): string | null {
	const bouton = screen.getByRole('button', { name: `Diminuer ${label}` })
	return within(bouton.parentElement as HTMLElement).getByText(/^[+-]?\d+$/).textContent
}

const NOM_DU_BLOC_7 = 'Savoirs'

const TEXTE_AJOUTER_SAVOIR = '+ Ajouter un savoir…'
const TEXTE_EXIGER_CONFIANCE = '+ Exiger un niveau de confiance…'
const TEXTE_EXIGER_JET = '+ Exiger un jet…'
const TEXTE_AUCUN_INDICE_CANON =
	"Aucun indice défini dans le canon — ce personnage ne pourra rien révéler tant qu'aucun n'existe."
const TEXTE_AUCUN_OBJET_CANON =
	"Aucun objet défini dans le canon — cette porte restera indisponible tant qu'aucun n'existe."
const TEXTE_AUCUN_AUTRE_INDICE_CANON =
	"Aucun autre indice dans le canon — cette porte restera indisponible tant qu'un second n'existe."
const EYEBROW_AVERTISSEMENT = 'ENREGISTRÉ, AVEC AVERTISSEMENT'

const INDICE_PROPRE = 'indice.pas-dans-la-cendre'
const INDICE_AUTRE = 'indice.lettre-de-la-vigie'
const OBJET = 'objet.lanterne-de-corvin'

/** Un dossier prêt à porter des savoirs : deux indices, un objet, un personnage. */
function dossierArme(brain: Brain, personnage?: Partial<Personnage>): Dossier {
	const dossier = brain.dossiers.create('Un dossier')
	semerIndice(brain, dossier.id, { id: INDICE_PROPRE, nom: 'Des pas dans la cendre' })
	semerIndice(brain, dossier.id, { id: INDICE_AUTRE, nom: 'La lettre de la Vigie' })
	semerObjet(brain, dossier.id, { id: OBJET, nom: 'La lanterne de Corvin' })
	return semerPersonnage(brain, dossier.id, {
		id: 'pnj.aldur',
		nom: 'Aldûr le Sage',
		portee: 'premier',
		plan_actions: [],
		savoirs: [],
		...personnage,
	})
}

/** Les vingt gestionnaires de `BlocSavoirs`, muets — pour les DEUX seuls tests
 *  qui rendent le composant SEUL (voir leur motif). Une fabrique, jamais un
 *  objet partagé : des `jest.fn()` réutilisés d'un test à l'autre porteraient
 *  les appels du précédent. */
function handlersSavoirs() {
	return {
		onAjouterSavoir: jest.fn(),
		onChangeIndiceSavoir: jest.fn(),
		onChangeCertitudeSavoir: jest.fn(),
		onChangeRevelComment: jest.fn(),
		onBlurRevelComment: jest.fn(),
		onRetirerSavoir: jest.fn(),
		onOuvrirPorteConfiance: jest.fn(),
		onChangeConfiance: jest.fn(),
		onFermerPorteConfiance: jest.fn(),
		onOuvrirPorteJet: jest.fn(),
		onChangeJetCarac: jest.fn(),
		onChangeJetTc: jest.fn(),
		onFermerPorteJet: jest.fn(),
		onOuvrirPorteContrepartie: jest.fn(),
		onChangeContrepartieObjet: jest.fn(),
		onChangeContrepartieConsomme: jest.fn(),
		onFermerPorteContrepartie: jest.fn(),
		onOuvrirPorteApresIndice: jest.fn(),
		onChangeApresIndice: jest.fn(),
		onFermerPorteApresIndice: jest.fn(),
	}
}

/**
 * LE DESCRIPTEUR DE TEST DES QUATRE PORTES — une entrée par clé de `Revelation`,
 * `Record` FERMÉ pour que le compilateur refuse une cinquième porte non décrite
 * ici (KR-117), exactement comme `LIBELLES_RETRAIT_PORTE` côté écran.
 *
 * `semee` est la valeur qu'on écrit AU DOCUMENT pour les TROIS autres portes
 * pendant qu'on éprouve la quatrième ; `attendue` est ce que l'OUVERTURE par
 * l'écran doit produire. Les deux diffèrent partout où elles peuvent : une
 * égalité accidentelle laisserait passer une porte qui écrase ses voisines.
 */
interface PorteEprouvee {
	semee: NonNullable<Revelation[keyof Revelation]>
	attendue: NonNullable<Revelation[keyof Revelation]>
	ouvrir: () => Promise<void>
	retrait: string
}

const PORTES_EPROUVEES: Record<keyof Revelation, PorteEprouvee> = {
	confiance_min: {
		semee: 3,
		attendue: CONFIANCE_INITIALE_PORTE,
		ouvrir: async () => {
			await userEvent.setup().click(screen.getByRole('button', { name: TEXTE_EXIGER_CONFIANCE }))
		},
		retrait: 'Retirer la porte de confiance',
	},
	jet: {
		semee: { carac: 'SE', tc: 'TC3' },
		attendue: { carac: DEFAULT_CHARACTERISTIC, tc: DEFAULT_CHALLENGE_TIER },
		ouvrir: async () => {
			await userEvent.setup().click(screen.getByRole('button', { name: TEXTE_EXIGER_JET }))
		},
		retrait: 'Retirer la porte de jet',
	},
	contrepartie: {
		semee: { objet_id: OBJET, consomme: true },
		attendue: { objet_id: OBJET, consomme: false },
		ouvrir: async () => {
			await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Exiger une contrepartie' }), OBJET)
		},
		retrait: 'Retirer la porte de contrepartie',
	},
	apres_indice_id: {
		semee: INDICE_AUTRE,
		attendue: INDICE_AUTRE,
		ouvrir: async () => {
			await userEvent
				.setup()
				.selectOptions(screen.getByRole('combobox', { name: 'Exiger un indice déjà connu' }), INDICE_AUTRE)
		},
		retrait: "Retirer la porte d'indice préalable",
	},
}

describe('FichePersonnage - bloc Savoirs', () => {
	beforeEach(() => window.localStorage.clear())

	/**
	 * Critère #1 — le geste d'ajout n'écrit RIEN avant le choix (la sonde est
	 * posée AVANT le rendu, KR-199), puis committe les DEUX champs requis en un
	 * seul appel, et le Select revient à son placeholder.
	 */
	it('ajout d un savoir pose indice_id et certitude sans ecrire avant, le Select revient au placeholder', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = dossierArme(brain)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))
		expect(updateSpy).not.toHaveBeenCalled()
		expect(screen.queryByText('SAVOIR 1')).toBeNull()

		const selectAjout = screen.getByRole('combobox', { name: 'Ajouter un savoir' })
		expect(within(selectAjout).getByText(TEXTE_AJOUTER_SAVOIR)).toBeInTheDocument()
		await user.selectOptions(selectAjout, INDICE_PROPRE)

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].savoirs).toEqual([
			{ indice_id: INDICE_PROPRE, certitude: CERTITUDE_INITIALE },
		])
		expect(screen.getByText('SAVOIR 1')).toBeInTheDocument()
		// Le select d ajout revient a son placeholder.
		expect(screen.getByRole('combobox', { name: 'Ajouter un savoir' })).toHaveValue('')
	})

	/**
	 * Critère #2 / KR-199 — PROUVÉ SÉPARÉMENT PAR PORTE (`it.each` sur le
	 * descripteur, jamais une scène unique) : le savoir part avec les TROIS autres
	 * portes déjà écrites, on ouvre la quatrième puis on la referme.
	 *
	 * Deux propriétés distinctes, et il faut les deux : l'INDÉPENDANCE (les trois
	 * voisines traversent l'ouverture ET la fermeture sans bouger d'un octet) et
	 * la FORME DU RETRAIT (la clé racine disparaît, elle ne devient pas `{}`).
	 */
	it.each(PORTES_UI)('la porte %s s ouvre et se retire independamment des 3 autres', async (porte) => {
		const brain = createBrain()
		const eprouvee = PORTES_EPROUVEES[porte]
		const voisines = PORTES_UI.filter((autre) => autre !== porte)
		const revelSemee: Revelation = Object.fromEntries(
			voisines.map((autre) => [autre, PORTES_EPROUVEES[autre].semee]),
		) as Revelation
		const dossier = dossierArme(brain, {
			savoirs: [{ indice_id: INDICE_PROPRE, certitude: 'sait', revele_si: revelSemee }],
		})
		renderPanel(brain, dossier.id)
		await userEvent.setup().click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))

		await eprouvee.ouvrir()

		const apresOuverture = premierSavoir(brain, dossier.id).revele_si
		expect(Object.keys(apresOuverture ?? {}).sort()).toEqual([...PORTES_UI].sort())
		expect(apresOuverture?.[porte]).toEqual(eprouvee.attendue)
		// Les TROIS voisines n'ont pas bougé.
		voisines.forEach((autre) => {
			expect(apresOuverture?.[autre]).toEqual(PORTES_EPROUVEES[autre].semee)
		})

		await userEvent.setup().click(screen.getByRole('button', { name: eprouvee.retrait }))

		const apresRetrait = premierSavoir(brain, dossier.id).revele_si
		expect(apresRetrait).not.toHaveProperty(porte)
		expect(Object.keys(apresRetrait ?? {}).sort()).toEqual([...voisines].sort())
		voisines.forEach((autre) => {
			expect(apresRetrait?.[autre]).toEqual(PORTES_EPROUVEES[autre].semee)
		})
	})

	/**
	 * Critère #2, seconde moitié — la DERNIÈRE porte refermée fait disparaître
	 * `revele_si` ENTIER, jamais un `{ }` laissé derrière (« absent ≠ vide »). Ce
	 * cas ne peut pas être couvert par le balayage ci-dessus, qui garde toujours
	 * trois voisines en place.
	 */
	it('refermer la derniere porte retire revele_si entier, jamais un objet vide', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = dossierArme(brain, {
			savoirs: [{ indice_id: INDICE_PROPRE, certitude: 'sait', revele_si: { confiance_min: 2 } }],
		})
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))
		await user.click(screen.getByRole('button', { name: 'Retirer la porte de confiance' }))

		expect(premierSavoir(brain, dossier.id)).not.toHaveProperty('revele_si')
	})

	/**
	 * § 8 désaccord 8 (veto QA levé) — GARDE STRUCTURELLE. La liste des portes est
	 * DÉRIVÉE des chemins réels du schéma par un prédicat de PRÉFIXE, jamais
	 * recopiée à la main : une cinquième porte oubliée de l'écran ET d'une seconde
	 * liste de test resterait invisible pour toujours. Les trois tables sont lues
	 * ensemble parce qu'aucune ne porte les quatre portes à elle seule —
	 * `ENUMERES_FERMES` en connaît trois, `REFERENCES_SIMPLES` deux.
	 */
	it('garde structurelle : les 4 portes du descripteur UI correspondent aux chemins revele_si des tables du schema', () => {
		const PREFIXE = 'monde.personnages[].savoirs[].revele_si.'
		const cheminsDuSchema = [
			...ENUMERES_FERMES.map((ligne) => ligne.path),
			...REFERENCES_SIMPLES.map((ligne) => ligne.path),
			...Object.keys(DESTINATION_DES_CHAMPS),
		]
		const portesDuSchema = [
			...new Set(
				cheminsDuSchema
					.filter((chemin) => chemin.startsWith(PREFIXE))
					.map((chemin) => chemin.slice(PREFIXE.length).split('.')[0]),
			),
		].sort()

		expect(portesDuSchema).toHaveLength(4)
		expect(portesDuSchema).toEqual([...PORTES_UI].sort())
	})

	/**
	 * Critère #3 / KR-021 / KR-194 — précédent must-fix M1 d'it5 : l'état vide du
	 * bloc ne masque que l'ABSENCE de savoirs, JAMAIS des savoirs déjà écrits, et
	 * la MÊME conjonction protège les deux états vides de PORTE (contrepartie,
	 * indice préalable) : une porte DÉJÀ OUVERTE ne disparaît pas parce que son
	 * registre s'est vidé.
	 *
	 * RENDU DIRECT DU COMPOSANT, et c'est motivé plutôt que commode : les TROIS
	 * références d'un savoir (`indice_id`, `contrepartie.objet_id`,
	 * `apres_indice_id`) sont BLOQUANTES au SSOT quand elles ne résolvent pas
	 * (`REFERENCES_SIMPLES`), donc l'état « un savoir écrit, un registre vide »
	 * n'est atteignable par AUCUN chemin d'écriture public aujourd'hui —
	 * `dossiers.update` le refuse, `importDossier` aussi, et `get()` re-valide.
	 * Le rendu passe par la pile complète dans TOUS les autres tests de ce
	 * fichier ; ici, il n'y a rien à faire traverser à la pile — la propriété
	 * éprouvée est une règle de RENDU pure, et le composant est un composant de
	 * rendu pur. Même raisonnement que la note d'it5 sur l'état vide de
	 * `BlocPresence`, poussé d'un cran : là on renonçait au test, ici on le
	 * garde en le posant au bon niveau. (Le jour où la n° 6 livre le retrait d'un
	 * indice du canon, ce chemin devient atteignable — et il devra RENDRE le
	 * refus, KR-183.)
	 */
	it('savoirs et portes deja ecrits restent rendus quand les registres sont vides, references orphelines exposees', async () => {
		const user = userEvent.setup()
		const handlers = handlersSavoirs()
		const savoir: BrouillonSavoir = {
			indice_id: INDICE_PROPRE,
			certitude: 'croit',
			revele_comment: 'Il pointe les cendres, très sûr de lui, sans doute à tort.',
			confiance_min: null,
			jet: null,
			contrepartie: { objet_id: 'objet.disparu', consomme: true },
			apres_indice_id: 'indice.disparu',
		}
		render(<BlocSavoirs savoirs={[savoir]} indices={[]} objets={[]} {...handlers} />)

		// Le corps du bloc n'est PAS remplace : le savoir est la, entier.
		expect(screen.queryByText(TEXTE_AUCUN_INDICE_CANON)).toBeNull()
		expect(screen.getByText('SAVOIR 1')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Il pointe les cendres, très sûr de lui, sans doute à tort.')).toBeInTheDocument()

		// Les TROIS references orphelines sont EXPOSEES, jamais reecrites en silence
		// vers la premiere option d'un registre (KR-021).
		const selectIndice = screen.getByRole('combobox', { name: 'INDICE' })
		expect(selectIndice).toHaveValue(INDICE_PROPRE)
		expect(within(selectIndice).getByText(`Indice introuvable — ${INDICE_PROPRE}`)).toBeInTheDocument()

		const selectContrepartie = screen.getByRole('combobox', { name: 'Exiger une contrepartie' })
		expect(selectContrepartie).toHaveValue('objet.disparu')
		expect(within(selectContrepartie).getByText('Objet introuvable — objet.disparu')).toBeInTheDocument()
		expect(screen.queryByText(TEXTE_AUCUN_OBJET_CANON)).toBeNull()
		expect(screen.getByRole('switch', { name: "CONSOMMÉ À L'USAGE" })).toBeChecked()

		const selectApres = screen.getByRole('combobox', { name: 'Exiger un indice déjà connu' })
		expect(selectApres).toHaveValue('indice.disparu')
		expect(within(selectApres).getByText('Indice introuvable — indice.disparu')).toBeInTheDocument()
		expect(screen.queryByText(TEXTE_AUCUN_AUTRE_INDICE_CANON)).toBeNull()

		// EDITABLE : le geste part bien vers le hook, sur le bon rang.
		await user.selectOptions(screen.getByRole('combobox', { name: 'CERTITUDE' }), 'soupconne')
		expect(handlers.onChangeCertitudeSavoir).toHaveBeenCalledWith(0, 'soupconne')
	})

	/** Critère #3, l'autre moitié — la conjonction : AUCUN savoir ET AUCUN indice. */
	it('etat vide monde.indices ET aucun savoir : tout le corps du bloc est remplace, aucun select d ajout', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))

		expect(screen.getByText(TEXTE_AUCUN_INDICE_CANON)).toBeInTheDocument()
		expect(screen.queryByRole('combobox', { name: 'Ajouter un savoir' })).toBeNull()
	})

	/**
	 * Critère #4 — un état vide de PORTE est scopé à SA porte : le reste du bloc
	 * reste actif. La sonde de discriminance est l'assertion négative sur les
	 * trois autres portes, pas la seule présence du message.
	 */
	it('etat vide monde.objets : seule la porte contrepartie est indisponible', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: INDICE_PROPRE, nom: 'Des pas dans la cendre' })
		semerIndice(brain, dossier.id, { id: INDICE_AUTRE, nom: 'La lettre de la Vigie' })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [{ indice_id: INDICE_PROPRE, certitude: 'sait' }],
		})
		expect(lire(brain, dossier.id).monde.objets).toEqual([])
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))

		expect(screen.getByText(TEXTE_AUCUN_OBJET_CANON)).toBeInTheDocument()
		expect(screen.queryByRole('combobox', { name: 'Exiger une contrepartie' })).toBeNull()
		// Les TROIS autres portes restent offertes.
		expect(screen.getByRole('button', { name: TEXTE_EXIGER_CONFIANCE })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: TEXTE_EXIGER_JET })).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Exiger un indice déjà connu' })).toBeInTheDocument()
	})

	/**
	 * Critère #4, second cas / KR-021 — SELF-EXCLUSION : un savoir ne peut pas
	 * exiger d'avoir déjà obtenu l'indice qu'il révèle. Le registre n'est PAS vide
	 * (`monde.indices.length === 1`) et la porte est pourtant indisponible : c'est
	 * la self-exclusion, pas l'état vide du registre, qu'on éprouve ici.
	 */
	it('porte indice prealable exclut l indice propre au savoir (self-exclusion)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: INDICE_PROPRE, nom: 'Des pas dans la cendre' })
		semerObjet(brain, dossier.id, { id: OBJET, nom: 'La lanterne de Corvin' })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [{ indice_id: INDICE_PROPRE, certitude: 'sait' }],
		})
		expect(lire(brain, dossier.id).monde.indices).toHaveLength(1)
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))

		expect(screen.getByText(TEXTE_AUCUN_AUTRE_INDICE_CANON)).toBeInTheDocument()
		expect(screen.queryByRole('combobox', { name: 'Exiger un indice déjà connu' })).toBeNull()
		// Le reste du bloc, lui, est intact — y compris la porte contrepartie.
		expect(screen.getByRole('combobox', { name: 'Exiger une contrepartie' })).toBeInTheDocument()
		// L'indice propre reste bien offert par le Select de la LIGNE, lui.
		expect(screen.getByRole('combobox', { name: 'INDICE' })).toHaveValue(INDICE_PROPRE)
	})

	/**
	 * Critère #5 — les TROIS temps de l'avertissement dans le MÊME test : un
	 * savoir sans porte l'allume, ouvrir une porte l'éteint, la refermer le
	 * rallume. Le bandeau est celui qui existe déjà (`avertissementsAffiches`,
	 * hors accordéon) — c'est la preuve que `revelation-sans-porte` y remonte,
	 * alors qu'il n'appartient pas à la famille D1 qui l'a fait naître.
	 */
	it('avertissement revelation-sans-porte : allume, eteint, rallume', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = dossierArme(brain)
		renderPanel(brain, dossier.id)

		// Aucun savoir : aucun avertissement.
		expect(screen.queryByText(EYEBROW_AVERTISSEMENT)).toBeNull()

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))
		await user.selectOptions(screen.getByRole('combobox', { name: 'Ajouter un savoir' }), INDICE_PROPRE)

		// ALLUME — le savoir vient d'entrer sans aucune porte.
		expect(screen.getByText(EYEBROW_AVERTISSEMENT)).toBeInTheDocument()
		expect(screen.getByText(/aucune condition de révélation/)).toBeInTheDocument()

		// ETEINT — une porte ouverte suffit.
		await user.click(screen.getByRole('button', { name: TEXTE_EXIGER_CONFIANCE }))
		expect(premierSavoir(brain, dossier.id).revele_si?.confiance_min).toBe(CONFIANCE_INITIALE_PORTE)
		expect(screen.queryByText(/aucune condition de révélation/)).toBeNull()

		// RALLUME — la refermer rend le savoir muet a nouveau.
		await user.click(screen.getByRole('button', { name: 'Retirer la porte de confiance' }))
		expect(screen.getByText(EYEBROW_AVERTISSEMENT)).toBeInTheDocument()
		expect(screen.getByText(/aucune condition de révélation/)).toBeInTheDocument()
	})

	/**
	 * Critère #6 / BUG-064 / KR-199 — LECTURE AU MONTAGE, sans interaction, sur
	 * DEUX personnages distincts, les QUATRE portes renseignées.
	 *
	 * Aucune valeur semée n'est fabricable par un widget par défaut :
	 * `confiance_min` ≠ `CONFIANCE_INITIALE_PORTE`, `carac`/`tc` ne sont ni le
	 * premier de leur registre ni le défaut posé à l'ouverture, `consomme: true`
	 * est l'inverse de ce que l'ouverture écrit, et `apres_indice_id` désigne le
	 * SECOND indice. Les deux personnages portent des valeurs deux à deux
	 * différentes : une lecture figée sur `personnages[0]` rougirait.
	 */
	it('lecture au montage sans interaction, 4 portes non fabricables, deux personnages distincts', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerIndice(brain, dossier.id, { id: INDICE_PROPRE, nom: 'Des pas dans la cendre' })
		semerIndice(brain, dossier.id, { id: INDICE_AUTRE, nom: 'La lettre de la Vigie' })
		semerObjet(brain, dossier.id, { id: OBJET, nom: 'La lanterne de Corvin' })
		semerObjet(brain, dossier.id, { id: 'objet.amulette-scellee', nom: "L'amulette scellée" })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			nom: 'Aldûr le Sage',
			portee: 'premier',
			plan_actions: [],
			savoirs: [
				{
					indice_id: INDICE_PROPRE,
					certitude: 'croit',
					revele_comment: "Il pointe l'enclume, comme si la réponse allait de soi.",
					revele_si: {
						confiance_min: 3,
						jet: { carac: 'SE', tc: 'TC3' },
						contrepartie: { objet_id: OBJET, consomme: true },
						apres_indice_id: INDICE_AUTRE,
					},
				},
			],
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			nom: 'Sélène la Vigie',
			portee: 'second',
			plan_actions: [],
			savoirs: [
				{
					indice_id: INDICE_AUTRE,
					certitude: 'soupconne',
					revele_comment: "Elle sort la lettre d'une poche cousue dans sa cape, sans un mot.",
					revele_si: {
						confiance_min: -2,
						jet: { carac: 'IG', tc: 'TC4' },
						contrepartie: { objet_id: 'objet.amulette-scellee', consomme: false },
						apres_indice_id: INDICE_PROPRE,
					},
				},
			],
		})
		renderPanel(brain, dossier.id)

		// AU MONTAGE, sans aucun clic de selection : Aldur (premier seme) est affiche.
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))
		expect(screen.getByRole('combobox', { name: 'INDICE' })).toHaveValue(INDICE_PROPRE)
		expect(screen.getByRole('combobox', { name: 'CERTITUDE' })).toHaveValue('croit')
		expect(screen.getByDisplayValue("Il pointe l'enclume, comme si la réponse allait de soi.")).toBeInTheDocument()
		expect(valeurStepper('CONFIANCE MINIMALE')).toBe('+3')
		expect(screen.getByRole('combobox', { name: 'CARACTÉRISTIQUE' })).toHaveValue('SE')
		expect(screen.getByRole('combobox', { name: 'DIFFICULTÉ' })).toHaveValue('TC3')
		expect(screen.getByRole('combobox', { name: 'Exiger une contrepartie' })).toHaveValue(OBJET)
		expect(screen.getByRole('switch', { name: "CONSOMMÉ À L'USAGE" })).toBeChecked()
		expect(screen.getByRole('combobox', { name: 'Exiger un indice déjà connu' })).toHaveValue(INDICE_AUTRE)
		expect(screen.queryByDisplayValue("Elle sort la lettre d'une poche cousue dans sa cape, sans un mot.")).toBeNull()

		// APRES SELECTION de selene (l accordeon revient au bloc 1, il faut rouvrir).
		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))
		expect(screen.getByRole('combobox', { name: 'INDICE' })).toHaveValue(INDICE_AUTRE)
		expect(screen.getByRole('combobox', { name: 'CERTITUDE' })).toHaveValue('soupconne')
		expect(
			screen.getByDisplayValue("Elle sort la lettre d'une poche cousue dans sa cape, sans un mot."),
		).toBeInTheDocument()
		expect(valeurStepper('CONFIANCE MINIMALE')).toBe('-2')
		expect(screen.getByRole('combobox', { name: 'CARACTÉRISTIQUE' })).toHaveValue('IG')
		expect(screen.getByRole('combobox', { name: 'DIFFICULTÉ' })).toHaveValue('TC4')
		expect(screen.getByRole('combobox', { name: 'Exiger une contrepartie' })).toHaveValue('objet.amulette-scellee')
		expect(screen.getByRole('switch', { name: "CONSOMMÉ À L'USAGE" })).not.toBeChecked()
		expect(screen.getByRole('combobox', { name: 'Exiger un indice déjà connu' })).toHaveValue(INDICE_PROPRE)
		expect(screen.queryByDisplayValue("Il pointe l'enclume, comme si la réponse allait de soi.")).toBeNull()
	})

	/**
	 * KR-197 — sonde à deux personnages : muter l'indexation de `commitSavoir`
	 * (`personnageAffiche.id` → `personnages[0].id`) DOIT faire rougir CE test
	 * précis. Un test mono-personnage ne distingue pas un correctif d'une
	 * régression.
	 */
	it('ecriture sur DEUX personnages, aucune fuite d indexation — savoirs', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = dossierArme(brain)
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			nom: 'Sélène la Vigie',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
		})
		renderPanel(brain, dossier.id)

		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))
		await user.selectOptions(screen.getByRole('combobox', { name: 'Ajouter un savoir' }), INDICE_AUTRE)
		await user.click(screen.getByRole('button', { name: TEXTE_EXIGER_JET }))

		const personnages = lire(brain, dossier.id).monde.personnages
		const aldur = personnages.find((p) => p.id === 'pnj.aldur')
		const selene = personnages.find((p) => p.id === 'pnj.selene')
		if (aldur === undefined || selene === undefined) throw new Error('Personnage introuvable apres ecriture')

		expect(selene.savoirs).toEqual([
			{
				indice_id: INDICE_AUTRE,
				certitude: CERTITUDE_INITIALE,
				revele_si: { jet: { carac: DEFAULT_CHARACTERISTIC, tc: DEFAULT_CHALLENGE_TIER } },
			},
		])
		expect(aldur.savoirs).toEqual([])
	})

	/** `revele_comment` est OPTIONNEL : brouillon-par-champ, commit au blur,
	 *  blur vide retire la clé plutôt que d'y écrire `''`. */
	it('revele_comment est un brouillon commite au blur, et se vide en retirant sa cle', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = dossierArme(brain, { savoirs: [{ indice_id: INDICE_PROPRE, certitude: 'sait' }] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))
		const champ = screen.getByRole('textbox', { name: /^COMMENT IL LE RÉVÈLE/ })
		fireEvent.change(champ, { target: { value: 'Elle hésite, puis chuchote, jetant un regard vers la porte.' } })
		expect(updateSpy).not.toHaveBeenCalled()

		fireEvent.blur(champ)
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(premierSavoir(brain, dossier.id).revele_comment).toBe(
			'Elle hésite, puis chuchote, jetant un regard vers la porte.',
		)

		fireEvent.change(champ, { target: { value: '' } })
		fireEvent.blur(champ)
		expect(updateSpy).toHaveBeenCalledTimes(2)
		expect(premierSavoir(brain, dossier.id)).not.toHaveProperty('revele_comment')
	})

	/**
	 * Critère #7 — NON-RÉGRESSION sur le dossier de référence (6 personnages,
	 * dont quatre portent un savoir couvrant les quatre portes). Il traverse le
	 * validateur sans une erreur AVANT comme APRÈS une édition de savoir faite par
	 * l'écran, et AUCUNE racine hors `monde.personnages` ne bouge.
	 */
	it('non-regression : dossier de reference accepte, aucun champ hors savoirs modifie', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const texte = fs.readFileSync(CHEMIN_REFERENCE, 'utf8')
		const inspection = brain.dossiers.importDossier(texte)
		if (inspection.statut !== 'valid') throw new Error(`La fixture de reference n est pas importable`)
		const dossierId = (JSON.parse(texte) as { id: string }).id

		const avant = lire(brain, dossierId)
		expect(validateDossier(avant).errors).toEqual([])
		renderPanel(brain, dossierId)

		// Le premier personnage seme porte deja un savoir : on en change la certitude.
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_7 }))
		await user.selectOptions(screen.getByRole('combobox', { name: 'CERTITUDE' }), 'croit')

		const apres = lire(brain, dossierId)
		expect(validateDossier(apres).errors).toEqual([])
		expect(apres.canon).toEqual(avant.canon)
		expect(apres.charpente).toEqual(avant.charpente)
		expect(apres.monde.lieux).toEqual(avant.monde.lieux)
		expect(apres.monde.objets).toEqual(avant.monde.objets)
		expect(apres.monde.indices).toEqual(avant.monde.indices)
		expect(apres.monde.quetes).toEqual(avant.monde.quetes)
		expect(apres.monde.evenements).toEqual(avant.monde.evenements)
		expect(apres.monde.conditions).toEqual(avant.monde.conditions)
		// Seul `savoirs[0].certitude` du personnage AFFICHÉ a changé.
		expect(apres.monde.personnages[0].savoirs[0].certitude).toBe('croit')
		expect(apres.monde.personnages.map((p) => ({ ...p, savoirs: [] }))).toEqual(
			avant.monde.personnages.map((p) => ({ ...p, savoirs: [] })),
		)
		expect(apres.monde.personnages.slice(1).map((p) => p.savoirs)).toEqual(
			avant.monde.personnages.slice(1).map((p) => p.savoirs),
		)
	})
})
