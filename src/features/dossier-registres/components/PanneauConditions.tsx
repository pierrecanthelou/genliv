import { useEffect, useRef, useState } from 'react'
import {
	useBrain,
	useOpenDossier,
	validateDossier,
	frapperIdentifiant,
	localiserEntite,
	ListRow,
	IconButton,
	HIT_TARGET_MIN,
	type Climat,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'
import { FicheClimat, type BrouillonClimat } from './FicheClimat'
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

export interface PanneauConditionsProps {
	dossierId: string
}

function brouillonDe(climat: Climat): BrouillonClimat {
	return {
		nom: climat.nom ?? '',
		manifestation: climat.manifestation ?? '',
	}
}

/**
 * Le refus en cours, indexé par le climat dont l'écriture l'a produit — même
 * garde que `PanneauQuetes.tsx` (KR-197) : changer de sélection après un
 * refus laisse le bandeau affiché sous la fiche d'un AUTRE climat, qui n'a
 * rien vu refuser.
 */
interface RefusEnCours {
	climatId: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

const EYEBROW_SECTION = 'CONDITIONS'
const TEXTE_VIDE = 'Aucun climat — cliquez « + Ajouter un climat… » pour commencer.'

/** Le libellé du bouton Monter — le titre entre guillemets, ou le repli numéroté. */
function libelleMonter(climat: Climat, index: number): string {
	const nom = climat.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Monter le climat « ${nom.trim()} »`
	return `Monter le climat n°${index + 1} (sans nom)`
}

/** Le libellé du bouton Descendre — symétrique de `libelleMonter`. */
function libelleDescendre(climat: Climat, index: number): string {
	const nom = climat.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Descendre le climat « ${nom.trim()} »`
	return `Descendre le climat n°${index + 1} (sans nom)`
}

/**
 * Le panneau Conditions — le 10ᵉ et dernier panneau de la feature, refermant
 * la dernière racine du dossier (`monde.conditions.climat[]`). Précédent
 * direct `PanneauQuetes.tsx` pour l'anatomie à deux colonnes, la sélection
 * par défaut calculée EN LIGNE et le réordonnancement.
 *
 * UN CLIMAT N'A AUCUN CHAMP `CHAMPS_REQUIS` — `handleAjouter` committe
 * IMMÉDIATEMENT `{id, effets_regles: []}`, exactement le geste d'it1/it3 :
 * aucun brouillon différé au niveau du climat lui-même, ni `duree` ni
 * `manifestation` semés (contrainte dure n°1 du plan d'itération 5).
 *
 * DURÉE — `handleChangeDuree` committe IMMÉDIATEMENT (le `Stepper`/
 * l'affordance « + Poser une durée… » ne passent jamais par un brouillon).
 *
 * AVERTISSEMENT DE BUDGET (`manifestation`, `BUDGETS_DE_MOTS`) — calculé EN
 * LIGNE depuis `validateDossier(dossier).warnings`, filtré au préfixe du
 * climat affiché, jamais un état semé une fois (KR-013/113/189).
 *
 * AUCUN `EditeurEffets` sur cette fiche (§8-1 du plan d'itération 5) :
 * `effets_regles` traverse le document intact, jamais lu ni écrit par ce
 * panneau ou par `FicheClimat`.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauConditions({ dossierId }: PanneauConditionsProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const climats = dossier?.monde.conditions.climat ?? []
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonClimat>>(() =>
		Object.fromEntries(climats.map((climat) => [climat.id, brouillonDe(climat)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'nom' | null>(null)
	const nomInputRef = useRef<HTMLInputElement>(null)

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante, retombe sur le premier climat tant qu'aucune
	// sélection explicite n'a été posée — `undefined` seulement quand la liste
	// est vide.
	const climatAffiche = climats.find((climat) => climat.id === selection) ?? climats[0]

	/**
	 * L'idiome d'écriture : TROIS racines nommées, jamais un spread de
	 * `dossier` — seul `monde.conditions.climat` change, `canon`/`charpente`
	 * traversent intacts (même patron que `PanneauQuetes.tsx`).
	 */
	function commit(
		climatsSuivants: Climat[],
		climatId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, conditions: { ...d.monde.conditions, climat: climatsSuivants } },
			charpente: d.charpente,
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { climatId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { climatId, statut: 'absent', issues: [] }
			if (!resout) return refusPrecedent
			return refusPrecedent !== null && refusPrecedent.climatId !== climatId ? refusPrecedent : null
		})
		return resultat
	}

	useEffect(() => {
		if (intentionFocus === 'nom') nomInputRef.current?.focus()
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus])

	if (dossier === null) return null

	function handleAjouter(): void {
		const id = frapperIdentifiant('climat')
		// `effets_regles: []` SEUL — ni `duree` ni `manifestation` semés
		// (contrainte dure n°1, plan d'itération 5).
		const nouveau: Climat = { id, effets_regles: [] }
		// Indexé sur le climat AFFICHÉ (`climatAffiche?.id`), jamais sur `id` —
		// celui-ci n'entre dans le document QUE si l'écriture réussit.
		// `resout: false` : un ajout, réussi ou non, ne résout JAMAIS un refus.
		const resultat = commit([...climats, nouveau], climatAffiche?.id ?? id, { resout: false })
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
		setSelection(id)
		setIntentionFocus('nom')
	}

	// Garde d'absence en LECTURE et en MUTATION (patron `PanneauQuetes.tsx`) :
	// un brouillon peut manquer pour un climat arrivé hors de `handleAjouter`
	// (ex. réconciliation cloud pendant que le panneau est monté).
	function handleChangeChamp(id: string, champ: keyof BrouillonClimat, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const climat = climats.find((c) => c.id === id)
			if (climat === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(climat), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: keyof BrouillonClimat, valeur: string): void {
		commit(
			climats.map((climat) => (climat.id === id ? { ...climat, [champ]: valeur } : climat)),
			id,
		)
	}

	/** DURÉE — committe IMMÉDIATEMENT, jamais un brouillon (précédent
	 *  `plan_actions[].duree`, `useEcriturePlan.ts`). */
	function handleChangeDuree(id: string, valeur: number): void {
		commit(
			climats.map((climat) => (climat.id === id ? { ...climat, duree: valeur } : climat)),
			id,
		)
	}

	/**
	 * Permute deux climats ADJACENTS par IDENTIFIANT, jamais par position — la
	 * sélection (indexée par id) n'a donc rien à recalculer après l'écriture :
	 * la fiche affichée reste celle du même climat.
	 */
	function deplacer(id: string, sens: -1 | 1): void {
		const index = climats.findIndex((climat) => climat.id === id)
		const cible = index + sens
		if (index === -1 || cible < 0 || cible >= climats.length) return
		const permutes = [...climats]
		;[permutes[index], permutes[cible]] = [permutes[cible], permutes[index]]
		commit(permutes, id)
	}

	// Équivalent exact de `dossier.monde.conditions.climat.length === 0` (voir
	// le calcul de `climatAffiche` plus haut), mais brancher sur LA MÊME valeur
	// donne à TypeScript le rétrécissement `Climat` (non `| undefined`) pour la
	// suite, sans assertion `!`.
	if (climatAffiche === undefined) {
		return (
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
						+ Ajouter un climat…
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

	// Le refus ne se rend QUE sous la fiche du climat qui l'a produit —
	// changer de sélection ne doit jamais laisser le bandeau attaché au
	// mauvais climat.
	const refusAffiche =
		refus !== null && refus.climatId === climatAffiche.id ? { statut: refus.statut, issues: refus.issues } : null

	// L'avertissement de budget (`manifestation`, `BUDGETS_DE_MOTS`) — calculé
	// EN LIGNE, jamais un état semé une fois (KR-013/113/189) : filtré au
	// préfixe du champ climat AFFICHÉ, résolu par son INDEX dans le tableau
	// persisté (l'index se dérive au rendu, jamais stocké).
	const indexClimatAffiche = climats.findIndex((climat) => climat.id === climatAffiche.id)
	const avertissements = validateDossier(dossier).warnings.filter((issue) =>
		issue.path.startsWith(`monde.conditions.climat[${indexClimatAffiche}].`),
	)

	return (
		<div style={pageStyle}>
			<div style={colonneListeStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<ul style={listeStyle}>
					{climats.map((climat, index) => (
						<li key={climat.id} style={ligneListeStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={localiserEntite('climat', climat, index)}
									subtitle={climat.id}
									selected={climat.id === climatAffiche.id}
									onSelect={() => setSelection(climat.id)}
								/>
							</div>
							{index > 0 && (
								<IconButton
									label={libelleMonter(climat, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(climat.id, -1)}
								>
									▲
								</IconButton>
							)}
							{index < climats.length - 1 && (
								<IconButton
									label={libelleDescendre(climat, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(climat.id, 1)}
								>
									▼
								</IconButton>
							)}
						</li>
					))}
				</ul>
				<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
					+ Ajouter un climat…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FicheClimat
					climat={climatAffiche}
					brouillon={brouillons[climatAffiche.id] ?? brouillonDe(climatAffiche)}
					avertissements={avertissements}
					refus={refusAffiche}
					nomInputRef={nomInputRef}
					onChangeChamp={(champ, valeur) => handleChangeChamp(climatAffiche.id, champ, valeur)}
					onBlurChamp={(champ, valeur) => handleBlurChamp(climatAffiche.id, champ, valeur)}
					onChangeDuree={(valeur) => handleChangeDuree(climatAffiche.id, valeur)}
				/>
			</div>
		</div>
	)
}
