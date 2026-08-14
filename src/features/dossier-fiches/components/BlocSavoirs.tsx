import { useEffect, useRef, type ChangeEvent, type FocusEvent } from 'react'
import {
	Field,
	Select,
	Stepper,
	Toggle,
	IconButton,
	HIT_TARGET_MIN,
	CERTITUDES,
	CONFIANCE_MIN,
	CONFIANCE_MAX,
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	CHALLENGE_TIERS,
	CHALLENGE_TIER_VALUES,
	ESPACES_DE_NOMS,
	localiserEntite,
	type Certitude,
	type Characteristic,
	type ChallengeTier,
	type Entite,
	type EspaceDeNoms,
	type Revelation,
} from '../../../brain'
import {
	boutonPointilleStyle,
	eyebrowStyle,
	legendeStyle,
	listeLignesStyle,
	ligneStyle,
	enTeteLigneStyle,
} from './styles'
import type { BrouillonSavoir } from '../hooks/useEcritureSavoirs'

/** Libellés français de la certitude — côté FEATURE, un seul consommateur réel
 *  (précédent `LIBELLES_CAMP`/`LIBELLES_PORTEE`). `Record` FERMÉ sur le registre
 *  `CERTITUDES` : une quatrième certitude ne compile pas sans sa ligne (KR-117). */
export const LIBELLES_CERTITUDE: Record<Certitude, string> = {
	sait: 'Sait',
	croit: 'Croit',
	soupconne: 'Soupçonne',
}

/**
 * LE DESCRIPTEUR DES QUATRE PORTES — un `Record<keyof Revelation, …>`, jamais un
 * tableau de littéraux : le typage rend l'exhaustivité VÉRIFIÉE PAR LE
 * COMPILATEUR (KR-117), et une cinquième porte ajoutée à `Revelation` ne
 * compilera pas tant que sa ligne n'est pas écrite ici.
 *
 * Ce que le compilateur NE voit PAS, et que `savoirs.test.tsx` garde : que ces
 * quatre clés sont exactement celles que les tables du schéma
 * (`ENUMERES_FERMES`, `REFERENCES_SIMPLES`, `DESTINATION_DES_CHAMPS`) déclarent
 * sous `monde.personnages[].savoirs[].revele_si.` — la table est indexée par des
 * CHAÎNES, rien ne la relie à `types.ts` (§ 8 désaccord 8, veto QA levé).
 */
export const LIBELLES_RETRAIT_PORTE: Record<keyof Revelation, string> = {
	confiance_min: 'Retirer la porte de confiance',
	jet: 'Retirer la porte de jet',
	contrepartie: 'Retirer la porte de contrepartie',
	apres_indice_id: "Retirer la porte d'indice préalable",
}

/** Les quatre portes, DÉRIVÉES du descripteur ci-dessus — c'est cette liste que
 *  la garde structurelle confronte aux chemins réels du schéma. */
export const PORTES_UI = Object.keys(LIBELLES_RETRAIT_PORTE) as (keyof Revelation)[]

const LEGENDE_SAVOIRS =
	"Ce que ce personnage sait d'un indice, et la manière dont il le révèle — la certitude et le texte sont joués par le modèle ; les quatre portes de révélation restent au moteur."
const LEGENDE_PORTES =
	"Chaque porte est optionnelle ; un savoir sans aucune porte ouverte ne se révèle jamais de lui-même : un avertissement le signale, sans bloquer l'enregistrement."

const HINT_REVELE_COMMENT =
	"La manière dont il le révèle — jamais la condition : n'écrivez pas « si vous la mettez en confiance » ou « contre la fiole », ces règles vivent dans les portes ci-dessous. Injecté au modèle uniquement quand une porte s'est ouverte."
const PLACEHOLDER_REVELE_COMMENT = "Elle sort la lettre d'une poche cousue dans sa cape, sans un mot."

const TEXTE_AJOUTER_SAVOIR = '+ Ajouter un savoir…'
const TEXTE_EXIGER_CONFIANCE = '+ Exiger un niveau de confiance…'
const TEXTE_EXIGER_JET = '+ Exiger un jet…'
const TEXTE_EXIGER_CONTREPARTIE = '+ Exiger une contrepartie…'
const TEXTE_EXIGER_APRES_INDICE = '+ Exiger un indice déjà connu…'

const TEXTE_AUCUN_INDICE_CANON =
	"Aucun indice défini dans le canon — ce personnage ne pourra rien révéler tant qu'aucun n'existe."
const TEXTE_AUCUN_OBJET_CANON =
	"Aucun objet défini dans le canon — cette porte restera indisponible tant qu'aucun n'existe."
const TEXTE_AUCUN_AUTRE_INDICE_CANON =
	"Aucun autre indice dans le canon — cette porte restera indisponible tant qu'un second n'existe."

const OPTIONS_CERTITUDE = CERTITUDES.map((certitude) => ({ value: certitude, label: LIBELLES_CERTITUDE[certitude] }))
const OPTIONS_CARACTERISTIQUE = CHARACTERISTIC_VALUES.map((carac) => ({
	value: carac,
	label: `${carac} · ${CHARACTERISTICS[carac].label}`,
}))
const OPTIONS_TC = CHALLENGE_TIER_VALUES.map((tc) => ({ value: tc, label: `${tc} · ${CHALLENGE_TIERS[tc].label}` }))

interface Option {
	value: string
	label: string
}

/**
 * Une référence qui NE RÉSOUT PAS reste SÉLECTIONNÉE et VISIBLE, sous une option
 * non résolue qui montre l'identifiant tel quel (KR-021) — jamais une réécriture
 * silencieuse vers la première option du registre, qui ferait dire au dossier
 * autre chose que ce que l'auteur y a mis. Le libellé du TYPE vient du registre
 * `ESPACES_DE_NOMS`, comme celui de `localiserEntite` : « Indice introuvable — … »,
 * « Objet introuvable — … ».
 */
function avecOrpheline(options: Option[], valeur: string, espace: EspaceDeNoms): Option[] {
	if (valeur === '' || options.some((option) => option.value === valeur)) return options
	return [...options, { value: valeur, label: `${ESPACES_DE_NOMS[espace].label} introuvable — ${valeur}` }]
}

/** La clé d'une porte d'une ligne, pour la table des conteneurs de focus. */
function clePorte(index: number, porte: keyof Revelation): string {
	return `${index}:${porte}`
}

export interface BlocSavoirsProps {
	savoirs: BrouillonSavoir[]
	/** `monde.indices[]` — le registre du canon, LU et jamais produit ici (n° 6). */
	indices: Entite[]
	/** `monde.objets[]` — même règle (n° 5). */
	objets: Entite[]
	onAjouterSavoir: (indiceId: string) => void
	onChangeIndiceSavoir: (index: number, indiceId: string) => void
	onChangeCertitudeSavoir: (index: number, certitude: Certitude) => void
	onChangeRevelComment: (index: number, valeur: string) => void
	onBlurRevelComment: (index: number, valeur: string) => void
	onRetirerSavoir: (index: number) => void
	onOuvrirPorteConfiance: (index: number) => void
	onChangeConfiance: (index: number, valeur: number) => void
	onFermerPorteConfiance: (index: number) => void
	onOuvrirPorteJet: (index: number) => void
	onChangeJetCarac: (index: number, carac: Characteristic) => void
	onChangeJetTc: (index: number, tc: ChallengeTier) => void
	onFermerPorteJet: (index: number) => void
	onOuvrirPorteContrepartie: (index: number, objetId: string) => void
	onChangeContrepartieObjet: (index: number, objetId: string) => void
	onChangeContrepartieConsomme: (index: number, consomme: boolean) => void
	onFermerPorteContrepartie: (index: number) => void
	onOuvrirPorteApresIndice: (index: number, indiceId: string) => void
	onChangeApresIndice: (index: number, indiceId: string) => void
	onFermerPorteApresIndice: (index: number) => void
}

/**
 * Le bloc 7 de l'accordéon (« Savoirs »), it6 — geste d'ajout par `Select`
 * dédié (jamais un bouton pointillé, `indice_id` étant requis), ligne bordée
 * (précédent `BlocRelations`). Tout committe immédiatement sauf
 * `revele_comment`, brouillon-par-champ commité au blur — voir
 * `useEcritureSavoirs.ts`.
 *
 * ÉTAT VIDE — gate sur les SAVOIRS, jamais sur `monde.indices` seul (§ 8
 * objection 1 du tech-lead, forme EXACTE de `BlocRelations.tsx` post-M1) : le
 * corps entier n'est remplacé que si le personnage n'a AUCUN savoir ET que le
 * canon n'a AUCUN indice. Un dossier importé qui porte des savoirs alors que
 * `monde.indices` est vide les garde donc rendus et éditables, chaque
 * `indice_id` orphelin sous son option non résolue (KR-021).
 *
 * LES DEUX ÉTATS VIDES DE PORTE (contrepartie, indice préalable) portent la MÊME
 * conjonction, et pour la même raison : ils ne se rendent que si la porte est
 * FERMÉE, sinon une porte déjà écrite disparaîtrait de l'écran le jour où son
 * registre se vide.
 *
 * FOCUS — ouvrir une porte par le bouton pointillé déplace le focus vers son
 * premier contrôle, la refermer le ramène sur l'affordance qui réapparaît
 * (précédent `BlocCaracteristiques`/`BlocPlanActions`). Les deux portes qui
 * s'ouvrent PAR UN SELECT n'ont rien à déplacer à l'ouverture : le Select est
 * déjà le premier contrôle et il garde le focus. La signature d'ouverture des
 * portes est la dépendance de l'effet — une CHAÎNE, donc stable tant qu'aucune
 * porte ne s'ouvre ou ne se ferme (KR-013/113 : usage impératif légitime).
 */
export function BlocSavoirs({
	savoirs,
	indices,
	objets,
	onAjouterSavoir,
	onChangeIndiceSavoir,
	onChangeCertitudeSavoir,
	onChangeRevelComment,
	onBlurRevelComment,
	onRetirerSavoir,
	onOuvrirPorteConfiance,
	onChangeConfiance,
	onFermerPorteConfiance,
	onOuvrirPorteJet,
	onChangeJetCarac,
	onChangeJetTc,
	onFermerPorteJet,
	onOuvrirPorteContrepartie,
	onChangeContrepartieObjet,
	onChangeContrepartieConsomme,
	onFermerPorteContrepartie,
	onOuvrirPorteApresIndice,
	onChangeApresIndice,
	onFermerPorteApresIndice,
}: BlocSavoirsProps): JSX.Element {
	const conteneursPorteRef = useRef<Record<string, HTMLDivElement | null>>({})
	const porteAFocaliserRef = useRef<{ cle: string; ouverte: boolean } | null>(null)

	const signaturePortes = savoirs
		.flatMap((savoir, index) => [
			`${clePorte(index, 'confiance_min')}:${savoir.confiance_min !== null}`,
			`${clePorte(index, 'jet')}:${savoir.jet !== null}`,
			`${clePorte(index, 'contrepartie')}:${savoir.contrepartie !== null}`,
			`${clePorte(index, 'apres_indice_id')}:${savoir.apres_indice_id !== null}`,
		])
		.join('|')

	useEffect(() => {
		const cible = porteAFocaliserRef.current
		// Appartenance EXACTE à la liste des entrées, jamais un `includes` de
		// sous-chaîne : `10:jet:true` contient `0:jet:true`, ce qui focaliserait
		// le mauvais rang au-delà du 10e savoir.
		if (cible === null || !signaturePortes.split('|').includes(`${cible.cle}:${cible.ouverte}`)) return
		porteAFocaliserRef.current = null
		conteneursPorteRef.current[cible.cle]?.querySelector<HTMLElement>('button, select')?.focus()
	}, [signaturePortes])

	function programmerFocus(index: number, porte: keyof Revelation, ouverte: boolean): void {
		porteAFocaliserRef.current = { cle: clePorte(index, porte), ouverte }
	}

	if (savoirs.length === 0 && indices.length === 0) {
		return <p style={legendeStyle}>{TEXTE_AUCUN_INDICE_CANON}</p>
	}

	// Libellés calculés sur la liste COMPLÈTE : le repli « Indice n°N (sans nom) »
	// doit désigner le même indice dans les deux Select, y compris après la
	// self-exclusion de la porte « indice préalable ».
	const optionsIndice: Option[] = indices.map((indice, index) => ({
		value: indice.id,
		label: localiserEntite('indice', indice, index),
	}))
	const optionsObjet: Option[] = objets.map((objet, index) => ({
		value: objet.id,
		label: localiserEntite('objet', objet, index),
	}))

	return (
		<>
			<p style={legendeStyle}>{LEGENDE_SAVOIRS}</p>
			<div style={listeLignesStyle}>
				{savoirs.map((savoir, index) => {
					// SELF-EXCLUSION : un savoir ne peut pas exiger d'avoir déjà obtenu
					// l'indice qu'il révèle — la condition ne serait jamais franchissable.
					const optionsApresIndice = optionsIndice.filter((option) => option.value !== savoir.indice_id)
					return (
						<div key={index} style={ligneStyle}>
							<div style={enTeteLigneStyle}>
								<span style={eyebrowStyle}>{`SAVOIR ${index + 1}`}</span>
								<IconButton
									label={`Retirer le savoir n°${index + 1}`}
									tone="danger"
									size={HIT_TARGET_MIN}
									onClick={() => onRetirerSavoir(index)}
								>
									✕
								</IconButton>
							</div>
							<Select
								label="INDICE"
								options={avecOrpheline(optionsIndice, savoir.indice_id, 'indice')}
								value={savoir.indice_id}
								onChange={(valeur) => onChangeIndiceSavoir(index, valeur)}
							/>
							<Select
								label="CERTITUDE"
								options={OPTIONS_CERTITUDE}
								value={savoir.certitude}
								onChange={(valeur) => onChangeCertitudeSavoir(index, valeur)}
							/>
							<Field
								label="COMMENT IL LE RÉVÈLE"
								hint={HINT_REVELE_COMMENT}
								multiline
								rows={2}
								placeholder={PLACEHOLDER_REVELE_COMMENT}
								value={savoir.revele_comment}
								onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onChangeRevelComment(index, e.target.value)
								}
								onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onBlurRevelComment(index, e.target.value)
								}
							/>
							<p style={legendeStyle}>{LEGENDE_PORTES}</p>

							{/* PORTE 1 — CONFIANCE */}
							<div
								ref={(element) => {
									conteneursPorteRef.current[clePorte(index, 'confiance_min')] = element
								}}
							>
								{savoir.confiance_min === null ? (
									<button
										type="button"
										style={boutonPointilleStyle}
										onClick={() => {
											programmerFocus(index, 'confiance_min', true)
											onOuvrirPorteConfiance(index)
										}}
									>
										{TEXTE_EXIGER_CONFIANCE}
									</button>
								) : (
									<div style={enTeteLigneStyle}>
										<Stepper
											label="CONFIANCE MINIMALE"
											value={savoir.confiance_min}
											min={CONFIANCE_MIN}
											max={CONFIANCE_MAX}
											prefix="+"
											onChange={(valeur) => onChangeConfiance(index, valeur)}
										/>
										<IconButton
											label={LIBELLES_RETRAIT_PORTE.confiance_min}
											tone="danger"
											size={HIT_TARGET_MIN}
											onClick={() => {
												programmerFocus(index, 'confiance_min', false)
												onFermerPorteConfiance(index)
											}}
										>
											✕
										</IconButton>
									</div>
								)}
							</div>

							{/* PORTE 2 — JET */}
							<div
								ref={(element) => {
									conteneursPorteRef.current[clePorte(index, 'jet')] = element
								}}
							>
								{savoir.jet === null ? (
									<button
										type="button"
										style={boutonPointilleStyle}
										onClick={() => {
											programmerFocus(index, 'jet', true)
											onOuvrirPorteJet(index)
										}}
									>
										{TEXTE_EXIGER_JET}
									</button>
								) : (
									<>
										<div style={enTeteLigneStyle}>
											<Select
												label="CARACTÉRISTIQUE"
												options={OPTIONS_CARACTERISTIQUE}
												value={savoir.jet.carac}
												onChange={(valeur) => onChangeJetCarac(index, valeur)}
											/>
											<IconButton
												label={LIBELLES_RETRAIT_PORTE.jet}
												tone="danger"
												size={HIT_TARGET_MIN}
												onClick={() => {
													programmerFocus(index, 'jet', false)
													onFermerPorteJet(index)
												}}
											>
												✕
											</IconButton>
										</div>
										<Select
											label="DIFFICULTÉ"
											options={OPTIONS_TC}
											value={savoir.jet.tc}
											onChange={(valeur) => onChangeJetTc(index, valeur)}
										/>
									</>
								)}
							</div>

							{/* PORTE 3 — CONTREPARTIE */}
							<div
								ref={(element) => {
									conteneursPorteRef.current[clePorte(index, 'contrepartie')] = element
								}}
							>
								{savoir.contrepartie === null && objets.length === 0 ? (
									<p style={legendeStyle}>{TEXTE_AUCUN_OBJET_CANON}</p>
								) : (
									<>
										<div style={enTeteLigneStyle}>
											<Select
												ariaLabel="Exiger une contrepartie"
												options={[
													{ value: '', label: TEXTE_EXIGER_CONTREPARTIE },
													...avecOrpheline(optionsObjet, savoir.contrepartie?.objet_id ?? '', 'objet'),
												]}
												value={savoir.contrepartie?.objet_id ?? ''}
												onChange={(valeur) =>
													savoir.contrepartie === null
														? onOuvrirPorteContrepartie(index, valeur)
														: onChangeContrepartieObjet(index, valeur)
												}
											/>
											{savoir.contrepartie !== null && (
												<IconButton
													label={LIBELLES_RETRAIT_PORTE.contrepartie}
													tone="danger"
													size={HIT_TARGET_MIN}
													onClick={() => {
														programmerFocus(index, 'contrepartie', false)
														onFermerPorteContrepartie(index)
													}}
												>
													✕
												</IconButton>
											)}
										</div>
										{savoir.contrepartie !== null && (
											<Toggle
												label="CONSOMMÉ À L'USAGE"
												checked={savoir.contrepartie.consomme}
												onChange={(consomme) => onChangeContrepartieConsomme(index, consomme)}
											/>
										)}
									</>
								)}
							</div>

							{/* PORTE 4 — INDICE PRÉALABLE */}
							<div
								ref={(element) => {
									conteneursPorteRef.current[clePorte(index, 'apres_indice_id')] = element
								}}
							>
								{savoir.apres_indice_id === null && optionsApresIndice.length === 0 ? (
									<p style={legendeStyle}>{TEXTE_AUCUN_AUTRE_INDICE_CANON}</p>
								) : (
									<div style={enTeteLigneStyle}>
										<Select
											ariaLabel="Exiger un indice déjà connu"
											options={[
												{ value: '', label: TEXTE_EXIGER_APRES_INDICE },
												// Si l'auteur a changé INDICE après coup et que apres_indice_id
												// est devenu l'indice propre au savoir, la self-exclusion le
												// retire de optionsApresIndice : résoudre alors contre la liste
												// COMPLÈTE plutôt que d'afficher « introuvable » pour un indice
												// qui existe réellement au canon (revue de PR it6).
												...(savoir.apres_indice_id !== null && savoir.apres_indice_id === savoir.indice_id
													? avecOrpheline(optionsIndice, savoir.apres_indice_id, 'indice')
													: avecOrpheline(optionsApresIndice, savoir.apres_indice_id ?? '', 'indice')),
											]}
											value={savoir.apres_indice_id ?? ''}
											onChange={(valeur) =>
												savoir.apres_indice_id === null
													? onOuvrirPorteApresIndice(index, valeur)
													: onChangeApresIndice(index, valeur)
											}
										/>
										{savoir.apres_indice_id !== null && (
											<IconButton
												label={LIBELLES_RETRAIT_PORTE.apres_indice_id}
												tone="danger"
												size={HIT_TARGET_MIN}
												onClick={() => {
													programmerFocus(index, 'apres_indice_id', false)
													onFermerPorteApresIndice(index)
												}}
											>
												✕
											</IconButton>
										)}
									</div>
								)}
							</div>
						</div>
					)
				})}
			</div>
			<Select
				ariaLabel="Ajouter un savoir"
				options={[{ value: '', label: TEXTE_AJOUTER_SAVOIR }, ...optionsIndice]}
				value=""
				onChange={onAjouterSavoir}
			/>
		</>
	)
}
