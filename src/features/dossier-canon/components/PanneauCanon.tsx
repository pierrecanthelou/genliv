import { useState, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react'
import {
	useBrain,
	useOpenDossier,
	Card,
	Field,
	IconButton,
	LIBELLE_DES_CHAMPS,
	IssueList,
	compterMots,
	BUDGET_MOTS_CANON,
	HIT_TARGET_MIN,
	type Canon,
	type DossierIssue,
} from '../../../brain'
import { ObjectifsCanon } from './ObjectifsCanon'
import { EYEBROW_REFUS } from '../utils/refusMessages'

/**
 * Le libellé du champ TON et son qualificatif viennent du REGISTRE
 * `brain/dossier/libelles.ts` depuis l'itération 1 de la n° 8 : le panneau
 * Copilote NOMME « TON » dans son refus « il manque … pour proposer ce texte »
 * sans être la fiche d'origine du champ, donc deux features les lisent (KR-109).
 * L'extraction est PURE — aucune chaîne n'a bougé, et la preuve en est que la
 * suite de `dossier-canon` est restée verte sans une seule retouche.
 *
 * `SYNOPSIS MJ` et `ACCROCHE JOUEUR` restent INLINE juste au-dessus : un seul
 * lecteur chacun, et `canon.mj.synopsis_mj` n'est jamais requis par le copilote,
 * donc aucune branche ne peut le nommer. Les promouvoir serait une ligne de
 * registre sans producteur (KR-235).
 */
const TON = LIBELLE_DES_CHAMPS['canon.ton']

export interface PanneauCanonProps {
	dossierId: string
}

/**
 * Le brouillon local des quatre champs du canon — SEEDÉ UNE FOIS depuis
 * `dossier.canon` à l'ouverture (`useState(() => …)`, KR-013/113), jamais
 * resynchronisé, y compris après un refus ou un `dossier:updated` du même
 * dossier (§3 du plan d'itération 1). Ce n'est pas un état DÉRIVÉ recopié en
 * silence : c'est un brouillon d'édition, semé une fois, jamais miroir — sur un
 * refus, la divergence écran/dossier devient explicite (le bandeau la montre)
 * plutôt que silencieuse.
 */
interface Brouillon {
	synopsis_mj: string
	accroche_joueur: string
	ton: string
	interdits_ton: string[]
}

/**
 * Le refus en cours, indexé sur les champs du patch qui l'a produit — pas
 * seulement les `DossierIssue[]` (correctif revue de PR tech-lead, tour 2) :
 * sans `champs`, un commit réussi sur N'IMPORTE QUEL champ effacerait un
 * refus qui portait sur un AUTRE champ toujours non enregistré.
 */
interface Refus {
	champs: (keyof Brouillon)[]
	issues: DossierIssue[]
}

function brouillonDe(canon: Canon): Brouillon {
	return {
		synopsis_mj: canon.mj.synopsis_mj,
		accroche_joueur: canon.partage.accroche_joueur,
		ton: canon.ton,
		interdits_ton: canon.interdits_ton,
	}
}

type EtatCompteur = 'normal' | 'avertissement'

/**
 * `data-etat` bascule sur le MÊME seuil que le validateur (`texte-trop-long`,
 * `BUDGETS_DE_MOTS` dans `tables.ts` : `mots > budget`) — jamais un seuil de
 * pré-alerte à 90 % : le § 3 « comportement final arbitré » du plan d'itération
 * (l.100-102) fixe explicitement l'unique signal d'avertissement sur
 * `warnings` non vide, et `DossierService.test.ts` épingle déjà cet accord à
 * la borne (600 mots : `warnings: []` ; 601 : `texte-trop-long`). Un seuil à
 * 90 % afficherait un signal d'alerte sur un texte que le service persiste
 * pourtant sans la moindre anomalie — une couleur qui mentirait sur l'état réel.
 */
function etatDe(mots: number): EtatCompteur {
	return mots > BUDGET_MOTS_CANON ? 'avertissement' : 'normal'
}

/**
 * Le panneau Canon — le premier formulaire qui écrit réellement le dossier, via
 * `DossierService.update()`. Lit le dossier ouvert lui-même via `useOpenDossier`
 * (zéro prop `dossier` remontée depuis `DossierEditorScreen`, §3 du plan) et
 * rend `null` si le dossier est absent — l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauCanon({ dossierId }: PanneauCanonProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [brouillon, setBrouillon] = useState<Brouillon | null>(() =>
		dossier === null ? null : brouillonDe(dossier.canon),
	)
	const [refus, setRefus] = useState<Refus | null>(null)

	if (dossier === null || brouillon === null) return null
	// Une CONST typée `Brouillon` (jamais `Brouillon | null`) : TypeScript ne
	// propage pas le rétrécissement de `if (… || brouillon === null) return null`
	// à l'intérieur des déclarations de fonction imbriquées ci-dessous (portée
	// distincte) — capter la valeur non nulle une fois ici évite un `as` ou un
	// second garde répété dans chaque gestionnaire.
	const brouillonActuel: Brouillon = brouillon

	/**
	 * L'idiome d'écriture prescrit (§3 du plan) : TROIS racines nommées, jamais un
	 * spread de `dossier` — seul `canon` change, `monde`/`charpente` traversent
	 * intacts. `...d.canon` préserve `objectifs` (hors périmètre de cette
	 * itération) sans que ce panneau ait besoin d'en connaître la forme.
	 *
	 * PATCH ÉTROIT, jamais le brouillon complet (correctif revue de PR tech-lead,
	 * MAJEUR 1) : `d.canon` — le canon PERSISTÉ au moment de l'écriture, pas le
	 * brouillon semé au montage — porte les champs non touchés par ce commit.
	 * Committer le brouillon complet à chaque blur écrasait silencieusement tout
	 * champ adopté entre le montage du panneau et ce blur (ex. réconciliation
	 * cloud armée par `dossier:opened`, qui n'a pas de garde d'identifiant côté
	 * `useOpenDossier`) — y compris sur un blur qui ne touchait pas ce champ.
	 * Résidu assumé, pas corrigé ici : si LE CHAMP ÉDITÉ lui-même a changé à
	 * distance pendant la frappe, ce commit écrase encore l'adoption sur CE
	 * champ — dernier-écrit-gagne, le comportement attendu d'une édition.
	 */
	function commit(patch: Partial<Brouillon>): void {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: {
				...d.canon,
				...(patch.synopsis_mj !== undefined ? { mj: { synopsis_mj: patch.synopsis_mj } } : {}),
				...(patch.accroche_joueur !== undefined ? { partage: { accroche_joueur: patch.accroche_joueur } } : {}),
				...(patch.ton !== undefined ? { ton: patch.ton } : {}),
				...(patch.interdits_ton !== undefined ? { interdits_ton: patch.interdits_ton } : {}),
			},
			monde: d.monde,
			charpente: d.charpente,
		}))
		// Refus : le bandeau nomme l'anomalie, le brouillon n'est JAMAIS ramené en
		// arrière (§3, désaccord 1 du plan). INDEXÉ SUR LES CHAMPS DU PATCH (correctif
		// revue de PR tech-lead, tour 2) : depuis le patch étroit, un commit RÉUSSI sur
		// `ton` ne dit rien d'un refus PENDANT sur `synopsis_mj` — l'effacer sans
		// condition re-silencierait la divergence que le patch étroit rend possible.
		// Un refus n'est levé que par un commit réussi qui touche l'un des champs déjà
		// en cause.
		const champs = Object.keys(patch) as (keyof Brouillon)[]
		setRefus((precedent) =>
			resultat.statut === 'refuse'
				? { champs, issues: resultat.errors }
				: precedent !== null && precedent.champs.some((champ) => champs.includes(champ))
					? null
					: precedent,
		)
	}

	function handleChangeSynopsis(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		const valeur = e.target.value
		setBrouillon((prev) => (prev === null ? prev : { ...prev, synopsis_mj: valeur }))
	}
	function handleBlurSynopsis(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		commit({ synopsis_mj: e.target.value })
	}

	function handleChangeAccroche(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		const valeur = e.target.value
		setBrouillon((prev) => (prev === null ? prev : { ...prev, accroche_joueur: valeur }))
	}
	function handleBlurAccroche(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		commit({ accroche_joueur: e.target.value })
	}

	function handleChangeTon(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		const valeur = e.target.value
		setBrouillon((prev) => (prev === null ? prev : { ...prev, ton: valeur }))
	}
	function handleBlurTon(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		commit({ ton: e.target.value })
	}

	function handleChangeInterdit(index: number, valeur: string): void {
		setBrouillon((prev) =>
			prev === null
				? prev
				: { ...prev, interdits_ton: prev.interdits_ton.map((entree, i) => (i === index ? valeur : entree)) },
		)
	}
	function handleBlurInterdit(index: number, valeur: string): void {
		commit({ interdits_ton: brouillonActuel.interdits_ton.map((entree, i) => (i === index ? valeur : entree)) })
	}
	// Ajout/retrait : committent IMMÉDIATEMENT (§3 du plan), sans attendre un
	// blur — la ligne apparaît ou disparaît déjà persistée.
	function handleAjouterInterdit(): void {
		const prochain: Brouillon = { ...brouillonActuel, interdits_ton: [...brouillonActuel.interdits_ton, ''] }
		setBrouillon(prochain)
		commit({ interdits_ton: prochain.interdits_ton })
	}
	function handleSupprimerInterdit(index: number): void {
		const prochain: Brouillon = {
			...brouillonActuel,
			interdits_ton: brouillonActuel.interdits_ton.filter((_, i) => i !== index),
		}
		setBrouillon(prochain)
		commit({ interdits_ton: prochain.interdits_ton })
	}

	const motsSynopsis = compterMots(brouillon.synopsis_mj)
	const motsAccroche = compterMots(brouillon.accroche_joueur)
	const etatSynopsis = etatDe(motsSynopsis)
	const etatAccroche = etatDe(motsAccroche)

	return (
		<div style={pageStyle}>
			<Card>
				<div style={champsStyle}>
					<div>
						<Field
							label="SYNOPSIS MJ"
							hint="interne — la vérité complète"
							multiline
							rows={6}
							value={brouillon.synopsis_mj}
							placeholder="Rédigez ici la vérité complète de l'histoire, y compris ce que le joueur ignore encore : qui est le Gardien du Gouffre, et pourquoi il a scellé la Clé d'Aldûr."
							onChange={handleChangeSynopsis}
							onBlur={handleBlurSynopsis}
						/>
						<p data-etat={etatSynopsis} style={compteurStyle(etatSynopsis)}>
							{motsSynopsis}/{BUDGET_MOTS_CANON} mots
						</p>
					</div>

					<div>
						<Field
							label="ACCROCHE JOUEUR"
							hint="lue par le joueur"
							multiline
							rows={4}
							value={brouillon.accroche_joueur}
							placeholder="Une brume froide s'accroche aux ruines de Val-Cendre. On raconte qu'un sceau y retient quelque chose que personne n'a jamais vu revenir."
							onChange={handleChangeAccroche}
							onBlur={handleBlurAccroche}
						/>
						<p data-etat={etatAccroche} style={compteurStyle(etatAccroche)}>
							{motsAccroche}/{BUDGET_MOTS_CANON} mots
						</p>
					</div>

					<Field
						label={TON.libelle}
						hint={TON.hint}
						multiline
						rows={2}
						value={brouillon.ton}
						placeholder="Grave, laconique, sans ironie."
						onChange={handleChangeTon}
						onBlur={handleBlurTon}
					/>

					<div>
						<span style={titreInterditsStyle}>
							INTERDITS DE TON
							<span style={{ color: 'var(--ink-6)' }}> — interne, consignes injectées au modèle</span>
						</span>
						<div style={listeInterditsStyle}>
							{brouillon.interdits_ton.map((entree, index) => (
								<div key={index} style={ligneInterditStyle}>
									<div style={champInterditStyle}>
										<Field
											ariaLabel={`Interdit de ton n°${index + 1}`}
											placeholder="Pas d'anachronismes modernes."
											value={entree}
											onChange={(e) => handleChangeInterdit(index, e.target.value)}
											onBlur={(e) => handleBlurInterdit(index, e.target.value)}
										/>
									</div>
									<IconButton
										label={`Retirer l'interdit n°${index + 1}`}
										tone="danger"
										size={HIT_TARGET_MIN}
										onClick={() => handleSupprimerInterdit(index)}
									>
										✕
									</IconButton>
								</div>
							))}
							<button type="button" onClick={handleAjouterInterdit} style={boutonAjouterStyle}>
								+ Ajouter un interdit…
							</button>
						</div>
					</div>

					<ObjectifsCanon dossierId={dossierId} />

					{refus !== null && (
						<div role="status" style={bandeauStyle}>
							<p style={eyebrowRefusStyle}>{EYEBROW_REFUS}</p>
							<IssueList issues={refus.issues} />
						</div>
					)}
				</div>
			</Card>
		</div>
	)
}

const pageStyle: CSSProperties = {
	flex: 1,
	minHeight: 0,
	boxSizing: 'border-box',
	overflowY: 'auto',
	padding: 'var(--space-8)',
}

const champsStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}

const compteurBaseStyle: CSSProperties = {
	margin: 0,
	textAlign: 'right',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	marginTop: 'var(--space-2)',
}

/**
 * Caveat (tech-lead, tour 2 du plan) : `BUDGETS_DE_MOTS` (`tables.ts`) porte sur
 * les CONTENEURS `canon.mj`/`canon.partage` et somme toutes leurs chaînes ; ce
 * compteur ne compte QUE le brouillon du champ affiché. Les deux coïncident
 * aujourd'hui parce que chacun de ces objets ne contient qu'une seule chaîne —
 * par accident, pas par construction. Le premier champ ajouté à `canon.mj` ou
 * `canon.partage` ferait diverger ce compteur de l'avertissement réel : à
 * surveiller, pas à corriger maintenant.
 */
function compteurStyle(etat: EtatCompteur): CSSProperties {
	return { ...compteurBaseStyle, color: etat === 'avertissement' ? 'var(--bad)' : 'var(--text-faint)' }
}

const titreInterditsStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 'var(--space-2)',
}

const listeInterditsStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const ligneInterditStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-3)',
}

const champInterditStyle: CSSProperties = {
	flex: '1 1 auto',
	minWidth: 0,
}

const boutonAjouterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	boxSizing: 'border-box',
	minHeight: 'var(--hit-target)',
	padding: '7px 10px',
	border: '1.5px dashed var(--accent)',
	borderRadius: 'var(--r-md)',
	background: 'var(--accent-bg)',
	color: 'var(--accent)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
}

const bandeauStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const eyebrowRefusStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--bad)',
	letterSpacing: 'var(--track-eyebrow)',
}
