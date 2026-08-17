import { useEffect, useRef, useState } from 'react'
import {
	useBrain,
	useOpenDossier,
	validateDossier,
	localiserEntite,
	ListRow,
	IconButton,
	SegmentedControl,
	HIT_TARGET_MIN,
	type Jalon,
	type Fin,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'
import { FicheJalon } from './FicheJalon'
import { FicheFin } from './FicheFin'
import { useEcritureJalons } from '../hooks/useEcritureJalons'
import { useEcritureFins } from '../hooks/useEcritureFins'
import {
	panneauRacineStyle,
	enTetePanneauStyle,
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

export interface PanneauJalonsFinsProps {
	dossierId: string
}

type OngletJalonsFins = 'jalons' | 'fins'

/**
 * Le refus en cours, indexé par L'ESPACE ET l'identifiant dont l'écriture l'a
 * produit — même garde que `RefusEnCours` de `PanneauIndices.tsx` (KR-197),
 * étendue à DEUX collections indépendantes : un refus sur un jalon ne doit
 * jamais s'afficher sous une fin, ni l'inverse. UN SEUL bandeau à la fois
 * (précédent `useSocleEcriturePersonnages.ts`) : `commit`/`refus` restent ICI,
 * les deux hooks d'écriture (`useEcritureJalons`/`useEcritureFins`, extraction
 * KR-112) ne connaissent que leur collection propre.
 */
interface RefusEnCours {
	espace: 'jalon' | 'fin'
	id: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

const EYEBROW_SECTION = 'JALONS & FINS'
const TEXTE_VIDE_JALONS = 'Aucun jalon — cliquez « + Ajouter un jalon… » pour commencer.'
const TEXTE_VIDE_FINS = 'Aucune fin — cliquez « + Ajouter une fin… » pour commencer.'

const OPTIONS_ONGLETS: { value: OngletJalonsFins; label: string }[] = [
	{ value: 'jalons', label: 'JALONS' },
	{ value: 'fins', label: 'FINS' },
]

function libelleMonterJalon(jalon: Jalon, index: number): string {
	const nom = jalon.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Monter le jalon « ${nom.trim()} »`
	return `Monter le jalon n°${index + 1} (sans nom)`
}
function libelleDescendreJalon(jalon: Jalon, index: number): string {
	const nom = jalon.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Descendre le jalon « ${nom.trim()} »`
	return `Descendre le jalon n°${index + 1} (sans nom)`
}
function libelleMonterFin(fin: Fin, index: number): string {
	const nom = fin.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Monter la fin « ${nom.trim()} »`
	return `Monter la fin n°${index + 1} (sans nom)`
}
function libelleDescendreFin(fin: Fin, index: number): string {
	const nom = fin.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Descendre la fin « ${nom.trim()} »`
	return `Descendre la fin n°${index + 1} (sans nom)`
}

/**
 * Le libellé de la ligne D'AJOUT, tant que `nom` est vide (§3 du plan) —
 * « Nouveau jalon »/« Nouvelle fin », JAMAIS le repli « {Type} n°N (sans nom) »
 * de `localiserEntite` (celui-là désigne une entité déjà persistée). Dès que
 * l'auteur tape un nom, la ligne bascule sur le MÊME rendu que les entités
 * persistées — `localiserEntite` reprend la main.
 */
function libelleLigneAjoutJalon(nom: string, index: number): string {
	return nom.trim() === '' ? 'Nouveau jalon' : localiserEntite('jalon', { nom }, index)
}
function libelleLigneAjoutFin(nom: string, index: number): string {
	return nom.trim() === '' ? 'Nouvelle fin' : localiserEntite('fin', { nom }, index)
}

/**
 * Le panneau Jalons & fins — remplace l'état vide de la section « jalons-fins »
 * (index 10 de `sections.ts`). Précédent direct `PanneauIndices.tsx` (it1) pour
 * l'anatomie à deux colonnes et le réordonnancement ; ce qui lui est PROPRE :
 *
 *  · DEUX COLLECTIONS INDÉPENDANTES sous un `SegmentedControl` (bascule, pas un
 *    filtre) — deux sélections (`selectionJalon`/`selectionFin`), deux
 *    ensembles de brouillons (un hook d'écriture par collection), jamais
 *    réinitialisées au changement d'onglet (critère #8).
 *  · UN GESTE D'AJOUT À BROUILLON DIFFÉRÉ (KR-214, §3/§8 désaccord 1 du plan
 *    d'itération 2) : `Jalon.enonce_texte`/`declencheur_texte` et
 *    `Fin.condition_texte` sont des `CHAMPS_REQUIS` — le geste nu d'it1
 *    (committer `{id}`) serait refusé. `useEcritureJalons`/`useEcritureFins`
 *    portent l'identifiant d'une entité LOCALE, hors `charpente`, tant que ses
 *    champs requis ne sont pas tous non vides ; le commit est ATOMIQUE au
 *    premier blur qui les complète. Abandon SILENCIEUX (changement d'onglet,
 *    autre sélection, démontage) : rien n'a jamais été écrit, donc rien à
 *    confirmer — hors du champ des « actions dangereuses ».
 *  · LA RÉGION D1 (`avertissements`) est calculée en ligne depuis
 *    `validateDossier(dossier).warnings`, filtrée à L'INDEX de l'entité
 *    affichée (piège 2 : l'index se DÉRIVE de l'id au rendu, jamais stocké) —
 *    `FicheJalon` et `FicheFin` reçoivent la MÊME prop, seule la donnée diffère
 *    (`alerteSansExpr:false` sur Jalon la laisse toujours vide, piège 3).
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauJalonsFins({ dossierId }: PanneauJalonsFinsProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const jalons = dossier?.charpente.jalons ?? []
	const fins = dossier?.charpente.fins ?? []

	const [activeTab, setActiveTab] = useState<OngletJalonsFins>('jalons')
	const [selectionJalon, setSelectionJalon] = useState<string | null>(null)
	const [selectionFin, setSelectionFin] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'nom' | null>(null)
	const nomInputRef = useRef<HTMLInputElement>(null)

	/**
	 * TROIS racines nommées, jamais un spread de `dossier` (précédent
	 * `PanneauIndices.tsx`) : seul `charpente.jalons` change ici,
	 * `canon`/`monde`/`charpente.depart`/`charpente.fins` traversent intacts.
	 */
	function commitJalons(
		jalonsSuivants: Jalon[],
		jalonId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: d.monde,
			charpente: { ...d.charpente, jalons: jalonsSuivants },
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse')
				return { espace: 'jalon', id: jalonId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { espace: 'jalon', id: jalonId, statut: 'absent', issues: [] }
			if (!resout) return refusPrecedent
			return refusPrecedent !== null && !(refusPrecedent.espace === 'jalon' && refusPrecedent.id === jalonId)
				? refusPrecedent
				: null
		})
		return resultat
	}

	function commitFins(
		finsSuivantes: Fin[],
		finId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: d.monde,
			charpente: { ...d.charpente, fins: finsSuivantes },
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { espace: 'fin', id: finId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { espace: 'fin', id: finId, statut: 'absent', issues: [] }
			if (!resout) return refusPrecedent
			return refusPrecedent !== null && !(refusPrecedent.espace === 'fin' && refusPrecedent.id === finId)
				? refusPrecedent
				: null
		})
		return resultat
	}

	const ecritureJalons = useEcritureJalons(dossier === null ? null : { jalons, commit: commitJalons })
	const ecritureFins = useEcritureFins(dossier === null ? null : { fins, commit: commitFins })

	// Calculés EN LIGNE (KR-013/113) : la sélection retombe sur le premier élément
	// persisté, ou sur l'ajout en cours s'il n'y en a pas encore — `undefined`
	// seulement quand la collection est vide ET qu'aucun ajout n'est en cours.
	const jalonAfficheId =
		selectionJalon !== null &&
		(jalons.some((jalon) => jalon.id === selectionJalon) || selectionJalon === ecritureJalons.ajoutId)
			? selectionJalon
			: (jalons[0]?.id ?? ecritureJalons.ajoutId ?? undefined)
	const finAfficheId =
		selectionFin !== null && (fins.some((fin) => fin.id === selectionFin) || selectionFin === ecritureFins.ajoutId)
			? selectionFin
			: (fins[0]?.id ?? ecritureFins.ajoutId ?? undefined)

	const warnings = dossier === null ? [] : validateDossier(dossier).warnings
	const indexJalonAffiche = jalonAfficheId === undefined ? -1 : jalons.findIndex((jalon) => jalon.id === jalonAfficheId)
	const avertissementsJalon =
		indexJalonAffiche === -1
			? []
			: warnings.filter((issue) => issue.path.startsWith(`charpente.jalons[${indexJalonAffiche}].`))
	const indexFinAffiche = finAfficheId === undefined ? -1 : fins.findIndex((fin) => fin.id === finAfficheId)
	const avertissementsFin =
		indexFinAffiche === -1
			? []
			: warnings.filter((issue) => issue.path.startsWith(`charpente.fins[${indexFinAffiche}].`))

	useEffect(() => {
		if (intentionFocus === 'nom') nomInputRef.current?.focus()
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus])

	if (dossier === null) return null

	function handleChangeTab(tab: OngletJalonsFins): void {
		// Changer d'onglet abandonne tout ajout incomplet (§3 du plan) — au plus
		// UN des deux peut être en cours à la fois (démarrer un ajout sur l'autre
		// collection suppose d'avoir déjà changé d'onglet, ce qui abandonne
		// celui-ci en premier).
		ecritureJalons.abandonnerAjout()
		ecritureFins.abandonnerAjout()
		setActiveTab(tab)
	}

	function handleSelectJalon(id: string): void {
		if (ecritureJalons.ajoutId !== null && ecritureJalons.ajoutId !== id) ecritureJalons.abandonnerAjout()
		setSelectionJalon(id)
	}
	function handleSelectFin(id: string): void {
		if (ecritureFins.ajoutId !== null && ecritureFins.ajoutId !== id) ecritureFins.abandonnerAjout()
		setSelectionFin(id)
	}

	function handleAjouterJalon(): void {
		ecritureJalons.handleAjouter((id) => {
			setSelectionJalon(id)
			setIntentionFocus('nom')
		})
	}
	function handleAjouterFin(): void {
		ecritureFins.handleAjouter((id) => {
			setSelectionFin(id)
			setIntentionFocus('nom')
		})
	}

	const refusJalonAffiche =
		refus !== null && refus.espace === 'jalon' && refus.id === jalonAfficheId
			? { statut: refus.statut, issues: refus.issues }
			: null
	const refusFinAffiche =
		refus !== null && refus.espace === 'fin' && refus.id === finAfficheId
			? { statut: refus.statut, issues: refus.issues }
			: null

	// Bindings LOCAUX `const` (jamais un accès répété à `ecritureJalons.ajoutId`
	// dans le JSX) : le rétrécissement `!== null` de TypeScript survit dans une
	// fermeture pour un `const`, jamais pour un accès de propriété — évite un
	// cast `as string` à chaque callback `onSelect` de la ligne d'ajout.
	const ajoutJalonId = ecritureJalons.ajoutId
	const ajoutFinId = ecritureFins.ajoutId

	const corpsJalons = (
		<>
			<div style={colonneListeStyle}>
				<ul style={listeStyle}>
					{jalons.map((jalon, index) => (
						<li key={jalon.id} style={ligneListeStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={localiserEntite('jalon', jalon, index)}
									subtitle={jalon.id}
									selected={jalon.id === jalonAfficheId}
									onSelect={() => handleSelectJalon(jalon.id)}
								/>
							</div>
							{index > 0 && (
								<IconButton
									label={libelleMonterJalon(jalon, index)}
									size={HIT_TARGET_MIN}
									onClick={() => ecritureJalons.deplacer(jalon.id, -1)}
								>
									▲
								</IconButton>
							)}
							{index < jalons.length - 1 && (
								<IconButton
									label={libelleDescendreJalon(jalon, index)}
									size={HIT_TARGET_MIN}
									onClick={() => ecritureJalons.deplacer(jalon.id, 1)}
								>
									▼
								</IconButton>
							)}
						</li>
					))}
					{ajoutJalonId !== null && (
						<li key={ajoutJalonId} style={ligneListeStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={libelleLigneAjoutJalon(ecritureJalons.brouillons[ajoutJalonId]?.nom ?? '', jalons.length)}
									subtitle={ajoutJalonId}
									selected={ajoutJalonId === jalonAfficheId}
									onSelect={() => handleSelectJalon(ajoutJalonId)}
								/>
							</div>
						</li>
					)}
				</ul>
				<button type="button" onClick={handleAjouterJalon} style={boutonAjouterStyle}>
					+ Ajouter un jalon…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				{jalonAfficheId === undefined ? (
					<div style={emptyStateStyle}>
						<span style={emptyGlyphStyle} aria-hidden="true">
							❏
						</span>
						<p style={emptyTextStyle}>{TEXTE_VIDE_JALONS}</p>
					</div>
				) : (
					<FicheJalon
						brouillon={ecritureJalons.brouillonPour(jalonAfficheId)}
						avertissements={avertissementsJalon}
						refus={refusJalonAffiche}
						nomInputRef={nomInputRef}
						onChangeChamp={(champ, valeur) => ecritureJalons.handleChangeChamp(jalonAfficheId, champ, valeur)}
						onBlurChamp={(champ, valeur) => ecritureJalons.handleBlurChamp(jalonAfficheId, champ, valeur)}
					/>
				)}
			</div>
		</>
	)

	const corpsFins = (
		<>
			<div style={colonneListeStyle}>
				<ul style={listeStyle}>
					{fins.map((fin, index) => (
						<li key={fin.id} style={ligneListeStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={localiserEntite('fin', fin, index)}
									subtitle={fin.id}
									selected={fin.id === finAfficheId}
									onSelect={() => handleSelectFin(fin.id)}
								/>
							</div>
							{index > 0 && (
								<IconButton
									label={libelleMonterFin(fin, index)}
									size={HIT_TARGET_MIN}
									onClick={() => ecritureFins.deplacer(fin.id, -1)}
								>
									▲
								</IconButton>
							)}
							{index < fins.length - 1 && (
								<IconButton
									label={libelleDescendreFin(fin, index)}
									size={HIT_TARGET_MIN}
									onClick={() => ecritureFins.deplacer(fin.id, 1)}
								>
									▼
								</IconButton>
							)}
						</li>
					))}
					{ajoutFinId !== null && (
						<li key={ajoutFinId} style={ligneListeStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={libelleLigneAjoutFin(ecritureFins.brouillons[ajoutFinId]?.nom ?? '', fins.length)}
									subtitle={ajoutFinId}
									selected={ajoutFinId === finAfficheId}
									onSelect={() => handleSelectFin(ajoutFinId)}
								/>
							</div>
						</li>
					)}
				</ul>
				<button type="button" onClick={handleAjouterFin} style={boutonAjouterStyle}>
					+ Ajouter une fin…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				{finAfficheId === undefined ? (
					<div style={emptyStateStyle}>
						<span style={emptyGlyphStyle} aria-hidden="true">
							❏
						</span>
						<p style={emptyTextStyle}>{TEXTE_VIDE_FINS}</p>
					</div>
				) : (
					<FicheFin
						brouillon={ecritureFins.brouillonPour(finAfficheId)}
						avertissements={avertissementsFin}
						refus={refusFinAffiche}
						nomInputRef={nomInputRef}
						onChangeChamp={(champ, valeur) => ecritureFins.handleChangeChamp(finAfficheId, champ, valeur)}
						onBlurChamp={(champ, valeur) => ecritureFins.handleBlurChamp(finAfficheId, champ, valeur)}
					/>
				)}
			</div>
		</>
	)

	return (
		<div style={panneauRacineStyle}>
			<div style={enTetePanneauStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<SegmentedControl<OngletJalonsFins>
					options={OPTIONS_ONGLETS}
					value={activeTab}
					onChange={handleChangeTab}
					ariaLabel="Registre affiché — jalons ou fins"
				/>
			</div>
			<div style={pageStyle}>{activeTab === 'jalons' ? corpsJalons : corpsFins}</div>
		</div>
	)
}
