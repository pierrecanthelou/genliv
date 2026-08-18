import { useState } from 'react'
import {
	Select,
	IconButton,
	HIT_TARGET_MIN,
	avecOrpheline,
	localiserEntite,
	DELTAS,
	type Delta,
	type DeltaId,
	type EspaceDeNoms,
	type Entite,
	type SelectOption,
} from '../../../brain'
import { eyebrowStyle, legendeStyle, listeLignesStyle, enTeteLigneStyle, boutonAjouterStyle } from './styles'

const TEXTE_AJOUTER_EFFET = '+ Ajouter un effet…'
const TEXTE_CHOISIR_CIBLE = '— Choisir une cible —'

/** Les identifiants de `DELTAS`, DANS L'ORDRE DU REGISTRE — jamais re-listés. */
const IDENTIFIANTS_DELTA = Object.keys(DELTAS) as DeltaId[]
const PREMIER_DELTA_ID = IDENTIFIANTS_DELTA[0]

const OPTIONS_EFFETS: SelectOption<DeltaId>[] = IDENTIFIANTS_DELTA.map((cle) => ({
	value: cle,
	label: DELTAS[cle].label,
}))

/** Un tableau de cibles vides, de la longueur exacte que cet effet exige. */
function ciblesVides(delta: DeltaId): string[] {
	return DELTAS[delta].refKinds.map(() => '')
}

export interface BrouillonEffet {
	delta: DeltaId
	cibles: string[]
}

export interface EditeurEffetsProps {
	/** Jamais codé en dur — condition de réutilisation sans fork par
	 *  l'itération 4 (§4 du plan : « RÉCOMPENSE » ici, une autre section pour
	 *  les résolutions d'événement). */
	titre: string
	legende: string
	/** Idem `titre` — `« Aucune récompense… »` est spécifique à la QUÊTE qui
	 *  possède cet effet, jamais un texte générique sur « un effet » : le
	 *  paramétrer est ce qui rend l'état vide correct pour le futur second
	 *  appelant (critère d'architecture §6-5 de la feature : le même composant
	 *  sert sans fork). */
	texteVide: string
	effets: Delta[]
	/** Les entités disponibles comme cible, PAR ESPACE DE NOMS — seuls les
	 *  espaces référencés par au moins un `DELTAS[...].refKinds` ont besoin
	 *  d'une entrée ; une absence se lit comme une liste vide. */
	entitesParEspace: Partial<Record<EspaceDeNoms, Entite[]>>
	onAjouterEffet: (effet: Delta) => void
	onChangerCible: (index: number, rang: number, valeur: string) => void
	onRetirerEffet: (index: number) => void
}

/**
 * L'éditeur d'effets de règle — né ici (Récompense, `Quete.recompense`),
 * réutilisé SANS FORK par l'itération 4 (`Evenement.resolutions[].consequence`).
 * GÉNÉRIQUE sur `DELTAS[clé].refKinds.length` (§3 règle 1 du plan) : une
 * `Select` CIBLE PAR ENTRÉE de `refKinds`, jamais fixée à l'arité 1 observée
 * aujourd'hui sur les quatre entrées du registre.
 *
 * AJOUT À DEUX TEMPS (§3 règle 2) : l'EFFET et les CIBLES en cours de saisie
 * vivent en `useState` LOCAL — aucune copie de la SSOT, rien n'est persisté
 * avant que la DERNIÈRE cible requise soit non vide. Précédent exact :
 * `handleAjouterLien` de `PanneauIndices.tsx:212` (rien n'est écrit tant que
 * le geste n'est pas complet).
 *
 * ON NE MUTE JAMAIS L'EFFET D'UNE LIGNE DÉJÀ ÉCRITE (§3 règle 3) : le `Select`
 * EFFET d'une ligne persistée montre les mêmes 4 entrées du registre — même
 * anatomie que la ligne d'ajout —, mais son `onChange` est un NO-OP
 * délibéré : le seul geste qui change l'effet d'une récompense est de la
 * retirer et d'en ajouter une autre.
 *
 * Clé React des lignes = L'INDEX DANS LE TABLEAU RENDU (brouillon compris,
 * toujours en dernière position), jamais une clé dérivée du contenu — deux
 * effets identiques dans `recompense[]` produisent deux lignes distinctes.
 */
export function EditeurEffets({
	titre,
	legende,
	texteVide,
	effets,
	entitesParEspace,
	onAjouterEffet,
	onChangerCible,
	onRetirerEffet,
}: EditeurEffetsProps): JSX.Element {
	const [brouillon, setBrouillon] = useState<BrouillonEffet | null>(null)

	function optionsPour(espace: EspaceDeNoms, cibleCourante: string): SelectOption<string>[] {
		const entites = entitesParEspace[espace] ?? []
		const options = entites.map((entite, index) => ({
			value: entite.id,
			label: localiserEntite(espace, entite, index),
		}))
		return avecOrpheline(options, cibleCourante, espace)
	}

	function handleAjouter(): void {
		if (brouillon !== null) return
		setBrouillon({ delta: PREMIER_DELTA_ID, cibles: ciblesVides(PREMIER_DELTA_ID) })
	}

	function handleChangeEffetBrouillon(delta: DeltaId): void {
		setBrouillon({ delta, cibles: ciblesVides(delta) })
	}

	/** Commit dès que TOUTES les cibles requises par l'effet choisi sont non
	 *  vides — précédent `handleAjouterLien` (§3 règle 2). */
	function handleChangeCibleBrouillon(rang: number, valeur: string): void {
		if (brouillon === null) return
		const cibles = brouillon.cibles.map((cible, i) => (i === rang ? valeur : cible))
		if (cibles.every((cible) => cible !== '')) {
			onAjouterEffet({ delta: brouillon.delta, cibles })
			setBrouillon(null)
			return
		}
		setBrouillon({ ...brouillon, cibles })
	}

	const listeVide = effets.length === 0 && brouillon === null

	return (
		<div>
			<span style={eyebrowStyle}>{titre}</span>
			<p style={legendeStyle}>{legende}</p>
			{listeVide ? (
				<p style={legendeStyle}>{texteVide}</p>
			) : (
				<div style={listeLignesStyle}>
					{effets.map((effet, index) => {
						const descripteur = DELTAS[effet.delta]
						return (
							<div key={index} style={enTeteLigneStyle}>
								{/* NO-OP délibéré (§3 règle 3) : on ne mute jamais l'effet d'une
								    ligne déjà écrite — retirer, puis ajouter à nouveau. */}
								<Select label="EFFET" options={OPTIONS_EFFETS} value={effet.delta} onChange={() => {}} />
								{descripteur.refKinds.map((espace, rang) => (
									<Select
										key={rang}
										label="CIBLE"
										options={optionsPour(espace, effet.cibles[rang] ?? '')}
										value={effet.cibles[rang] ?? ''}
										onChange={(valeur) => onChangerCible(index, rang, valeur)}
									/>
								))}
								<IconButton
									label="Retirer cet effet"
									tone="danger"
									size={HIT_TARGET_MIN}
									onClick={() => onRetirerEffet(index)}
								>
									✕
								</IconButton>
							</div>
						)
					})}
					{brouillon !== null && (
						<div key={effets.length} style={enTeteLigneStyle}>
							<Select
								label="EFFET"
								options={OPTIONS_EFFETS}
								value={brouillon.delta}
								onChange={handleChangeEffetBrouillon}
							/>
							{DELTAS[brouillon.delta].refKinds.map((espace, rang) => (
								<Select
									key={rang}
									label="CIBLE"
									options={[
										{ value: '', label: TEXTE_CHOISIR_CIBLE },
										...optionsPour(espace, brouillon.cibles[rang] ?? ''),
									]}
									value={brouillon.cibles[rang] ?? ''}
									onChange={(valeur) => handleChangeCibleBrouillon(rang, valeur)}
								/>
							))}
							<IconButton
								label="Retirer cet effet"
								tone="danger"
								size={HIT_TARGET_MIN}
								onClick={() => setBrouillon(null)}
							>
								✕
							</IconButton>
						</div>
					)}
				</div>
			)}
			<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
				{TEXTE_AJOUTER_EFFET}
			</button>
		</div>
	)
}
