import { useEffect, useRef, useState } from 'react'
import {
	useBrain,
	useOpenDossier,
	frapperIdentifiant,
	localiserEntite,
	ListRow,
	IconButton,
	HIT_TARGET_MIN,
	type Quete,
	type Delta,
	type EspaceDeNoms,
	type Entite,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'
import { FicheQuete, type BrouillonQuete } from './FicheQuete'
import { useEcritureEtapes } from '../hooks/useEcritureEtapes'
import {
	pageStyle,
	colonneListeStyle,
	colonneFicheStyle,
	eyebrowStyle,
	listeStyle,
	ligneListeStyle,
	ligneListRowStyle,
	boutonAjouterStyle,
	emptyStateStyle,
	emptyGlyphStyle,
	emptyTextStyle,
} from './styles'

export interface PanneauQuetesProps {
	dossierId: string
}

function brouillonDe(quete: Quete): BrouillonQuete {
	return {
		nom: quete.nom ?? '',
		consigne: quete.consigne ?? '',
		echeance: quete.echeance ?? '',
	}
}

/**
 * Le refus en cours, indexé par la quête dont l'écriture l'a produit — même
 * garde que `PanneauIndices.tsx`/`PanneauJalonsFins.tsx` (KR-197) : changer de
 * sélection après un refus laisse le bandeau affiché sous la fiche d'une
 * AUTRE quête, qui n'a rien vu refuser.
 */
interface RefusEnCours {
	queteId: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

const EYEBROW_SECTION = 'QUÊTES'
const TEXTE_VIDE = 'Aucune quête — cliquez « + Ajouter une quête… » pour commencer.'

/** Le libellé du bouton Monter — le titre entre guillemets, ou le repli numéroté. */
function libelleMonter(quete: Quete, index: number): string {
	const nom = quete.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Monter la quête « ${nom.trim()} »`
	return `Monter la quête n°${index + 1} (sans nom)`
}

/** Le libellé du bouton Descendre — symétrique de `libelleMonter`. */
function libelleDescendre(quete: Quete, index: number): string {
	const nom = quete.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Descendre la quête « ${nom.trim()} »`
	return `Descendre la quête n°${index + 1} (sans nom)`
}

/**
 * Le panneau Quêtes — précédent direct `PanneauIndices.tsx` (it1) pour
 * l'anatomie à deux colonnes, la sélection par défaut calculée EN LIGNE et le
 * réordonnancement (composé entièrement par cette feature, deux `IconButton`
 * FRÈRES de `ListRow`, jamais une prop ajoutée à `ListRow.tsx`).
 *
 * UNE QUÊTE N'A AUCUN CHAMP `CHAMPS_REQUIS` — `handleAjouter` committe
 * IMMÉDIATEMENT `{id, recompense: []}`, exactement le geste d'it1 : aucun
 * brouillon différé au niveau de la quête elle-même.
 *
 * ÉTAPES — délégué à `useEcritureEtapes` (hook local, réimplémenté du motif
 * `useEcriturePlan.ts`, jamais importé d'une autre feature) : ce panneau lui
 * fournit `commit` (le MÊME que pour les autres champs, un seul bandeau de
 * refus) et lui lit `etapes`/les quatre gestes en retour.
 *
 * RÉCOMPENSE — `EditeurEffets` (via `FicheQuete`) committe des `Delta[]` par
 * les mêmes trois gestes (ajout à deux temps, changement de cible, retrait),
 * tous réductibles à `commit()`.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauQuetes({ dossierId }: PanneauQuetesProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const quetes = dossier?.monde.quetes ?? []
	const personnages = dossier?.monde.personnages ?? []
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonQuete>>(() =>
		Object.fromEntries(quetes.map((quete) => [quete.id, brouillonDe(quete)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'nom' | null>(null)
	const nomInputRef = useRef<HTMLInputElement>(null)

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante, retombe sur la première quête tant qu'aucune
	// sélection explicite n'a été posée — `undefined` seulement quand la liste
	// est vide.
	const queteAffichee = quetes.find((quete) => quete.id === selection) ?? quetes[0]

	/**
	 * L'idiome d'écriture : TROIS racines nommées, jamais un spread de
	 * `dossier` — seul `monde.quetes` change, `canon`/`charpente` traversent
	 * intacts (même patron que `PanneauIndices.tsx`).
	 */
	function commit(
		quetesSuivantes: Quete[],
		queteId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, quetes: quetesSuivantes },
			charpente: d.charpente,
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { queteId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { queteId, statut: 'absent', issues: [] }
			if (!resout) return refusPrecedent
			return refusPrecedent !== null && refusPrecedent.queteId !== queteId ? refusPrecedent : null
		})
		return resultat
	}

	const ecritureEtapes = useEcritureEtapes(dossier === null ? null : { quetes, queteAffichee, commit })

	useEffect(() => {
		if (intentionFocus === 'nom') nomInputRef.current?.focus()
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus])

	if (dossier === null) return null

	function handleAjouter(): void {
		const id = frapperIdentifiant('quete')
		const nouvelle: Quete = { id, recompense: [] }
		// Indexé sur la quête AFFICHÉE (`queteAffichee?.id`), jamais sur `id` —
		// celui-ci n'entre dans le document QUE si l'écriture réussit.
		// `resout: false` : un ajout, réussi ou non, ne résout JAMAIS un refus.
		const resultat = commit([...quetes, nouvelle], queteAffichee?.id ?? id, { resout: false })
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouvelle) }))
		setSelection(id)
		setIntentionFocus('nom')
	}

	// Garde d'absence en LECTURE et en MUTATION (patron `PanneauIndices.tsx`) :
	// un brouillon peut manquer pour une quête arrivée hors de `handleAjouter`
	// (ex. réconciliation cloud pendant que le panneau est monté).
	function handleChangeChamp(id: string, champ: keyof BrouillonQuete, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const quete = quetes.find((q) => q.id === id)
			if (quete === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(quete), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: keyof BrouillonQuete, valeur: string): void {
		commit(
			quetes.map((quete) => (quete.id === id ? { ...quete, [champ]: valeur } : quete)),
			id,
		)
	}

	/**
	 * Permute deux quêtes ADJACENTES par IDENTIFIANT, jamais par position — la
	 * sélection (indexée par id) n'a donc rien à recalculer après l'écriture.
	 */
	function deplacer(id: string, sens: -1 | 1): void {
		const index = quetes.findIndex((quete) => quete.id === id)
		const cible = index + sens
		if (index === -1 || cible < 0 || cible >= quetes.length) return
		const permutes = [...quetes]
		;[permutes[index], permutes[cible]] = [permutes[cible], permutes[index]]
		commit(permutes, id)
	}

	/** `donneurId === ''` = retrait, `donneur_id` remis à `undefined` (jamais
	 *  `null`) — précédent `objectif_id`, `useEcritureIdentite.ts`. */
	function handleChangeDonneur(id: string, donneurId: string): void {
		commit(
			quetes.map((quete): Quete => {
				if (quete.id !== id) return quete
				if (donneurId === '') {
					const sansDonneur = { ...quete }
					delete sansDonneur.donneur_id
					return sansDonneur
				}
				return { ...quete, donneur_id: donneurId }
			}),
			id,
		)
	}

	function handleAjouterEffet(id: string, effet: Delta): void {
		commit(
			quetes.map((quete) => (quete.id === id ? { ...quete, recompense: [...quete.recompense, effet] } : quete)),
			id,
		)
	}

	function handleChangerCibleEffet(id: string, index: number, rang: number, valeur: string): void {
		commit(
			quetes.map((quete): Quete => {
				if (quete.id !== id) return quete
				return {
					...quete,
					recompense: quete.recompense.map((effet, i) =>
						i === index ? { ...effet, cibles: effet.cibles.map((cible, r) => (r === rang ? valeur : cible)) } : effet,
					),
				}
			}),
			id,
		)
	}

	function handleRetirerEffet(id: string, index: number): void {
		commit(
			quetes.map((quete) =>
				quete.id === id ? { ...quete, recompense: quete.recompense.filter((_, i) => i !== index) } : quete,
			),
			id,
		)
	}

	// Équivalent exact de `dossier.monde.quetes.length === 0` (voir le calcul de
	// `queteAffichee` plus haut), mais brancher sur LA MÊME valeur donne à
	// TypeScript le rétrécissement `Quete` (non `| undefined`) pour la suite,
	// sans assertion `!`.
	if (queteAffichee === undefined) {
		return (
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
						+ Ajouter une quête…
					</button>
				</div>
				<div style={colonneFicheStyle}>
					<div style={emptyStateStyle}>
						<span style={emptyGlyphStyle} aria-hidden="true">
							❏
						</span>
						<p style={emptyTextStyle}>{TEXTE_VIDE}</p>
					</div>
				</div>
			</div>
		)
	}

	// Le refus ne se rend QUE sous la fiche de la quête qui l'a produit —
	// changer de sélection ne doit jamais laisser le bandeau attaché à la
	// mauvaise quête.
	const refusAffiche =
		refus !== null && refus.queteId === queteAffichee.id ? { statut: refus.statut, issues: refus.issues } : null

	// Les espaces de noms référencés par au moins un `DELTAS[...].refKinds`
	// aujourd'hui (`objet`, `indice`, `jalon`) — voir `EditeurEffets`.
	const entitesParEspace: Partial<Record<EspaceDeNoms, Entite[]>> = {
		objet: dossier.monde.objets,
		indice: dossier.monde.indices,
		jalon: dossier.charpente.jalons,
	}

	return (
		<div style={pageStyle}>
			<div style={colonneListeStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<ul style={listeStyle}>
					{quetes.map((quete, index) => (
						<li key={quete.id} style={ligneListeStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={localiserEntite('quete', quete, index)}
									subtitle={quete.id}
									selected={quete.id === queteAffichee.id}
									onSelect={() => setSelection(quete.id)}
								/>
							</div>
							{index > 0 && (
								<IconButton
									label={libelleMonter(quete, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(quete.id, -1)}
								>
									▲
								</IconButton>
							)}
							{index < quetes.length - 1 && (
								<IconButton
									label={libelleDescendre(quete, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(quete.id, 1)}
								>
									▼
								</IconButton>
							)}
						</li>
					))}
				</ul>
				<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
					+ Ajouter une quête…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FicheQuete
					quete={queteAffichee}
					personnages={personnages}
					brouillon={brouillons[queteAffichee.id] ?? brouillonDe(queteAffichee)}
					etapes={ecritureEtapes.etapes}
					entitesParEspace={entitesParEspace}
					refus={refusAffiche}
					nomInputRef={nomInputRef}
					onChangeChamp={(champ, valeur) => handleChangeChamp(queteAffichee.id, champ, valeur)}
					onBlurChamp={(champ, valeur) => handleBlurChamp(queteAffichee.id, champ, valeur)}
					onChangeDonneur={(donneurId) => handleChangeDonneur(queteAffichee.id, donneurId)}
					onChangeEtape={ecritureEtapes.handleChangeEtape}
					onBlurEtape={ecritureEtapes.handleBlurEtape}
					onAjouterEtape={ecritureEtapes.handleAjouterEtape}
					onRetirerEtape={ecritureEtapes.handleRetirerEtape}
					onAjouterEffet={(effet) => handleAjouterEffet(queteAffichee.id, effet)}
					onChangerCibleEffet={(index, rang, valeur) => handleChangerCibleEffet(queteAffichee.id, index, rang, valeur)}
					onRetirerEffet={(index) => handleRetirerEffet(queteAffichee.id, index)}
				/>
			</div>
		</div>
	)
}
