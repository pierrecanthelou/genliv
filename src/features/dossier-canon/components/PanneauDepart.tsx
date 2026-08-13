import { useState, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react'
import {
	useBrain,
	useOpenDossier,
	Card,
	Field,
	IssueList,
	Select,
	localiserEntite,
	type Depart,
	type DossierIssue,
} from '../../../brain'
import { EYEBROW_REFUS } from '../utils/refusMessages'

export interface PanneauDepartProps {
	dossierId: string
}

/**
 * Le refus en cours, indexé sur les champs du patch qui l'a produit — même forme
 * qu'au panneau Canon, et pour la même raison : depuis le patch ÉTROIT, un commit
 * RÉUSSI sur un champ ne dit rien d'un refus PENDANT sur un autre. Ici, cela porte
 * exactement le cas du §7 : l'auteur vide le texte d'ouverture (refus), puis change
 * de lieu (succès) — le bandeau doit RESTER, parce que le texte tapé n'est toujours
 * pas enregistré.
 *
 * `lieu_id` n'y entre JAMAIS : le `Select` n'offre que des `monde.lieux[].id`
 * existants, donc sa référence résout toujours et `update()` ne peut pas la
 * refuser. C'est structurel, pas défensif — d'où l'absence de tout état d'erreur
 * sur ce champ (§3 du plan d'itération 2).
 */
interface Refus {
	champs: (keyof Depart)[]
	issues: DossierIssue[]
}

/**
 * La légende du cas à UNE seule option — l'état normal d'un dossier tant que la
 * feature Lieux (n° 4) n'existe pas : `DossierService.create()` sème un unique
 * lieu, et rien dans l'éditeur ne permet encore d'en ajouter un second. Elle NOMME
 * l'attente au lieu de laisser un `Select` muet face à un choix unique ; le
 * contrôle, lui, reste pleinement opérable (jamais grisé, jamais en erreur). Elle
 * disparaît dès le deuxième lieu.
 */
const LEGENDE_LIEU_UNIQUE = "Seul lieu existant — Lieux (à venir) permettra d'en ajouter d'autres."

/**
 * Repris tel quel de `brain/dossier/__fixtures__/dossier-minimal.json`
 * (`charpente.depart.texte_ouverture_joueur`) : un exemple de la SCÈNE attendue,
 * jamais une consigne. Il n'est visible que si l'auteur vide le champ — un dossier
 * neuf porte déjà le texte d'amorce comme VALEUR réelle.
 */
const PLACEHOLDER_OUVERTURE = "Vous poussez la porte de l'auberge du Fanal ; la salle se tait."

/**
 * Le panneau Départ — le point d'entrée de l'aventure : où l'on commence, et le
 * texte que le moteur lira au joueur mot pour mot. Second formulaire à écrire
 * réellement le dossier, par le même `DossierService.update()` que le panneau
 * Canon, et premier consommateur réel du composant `Select` de `brain/`.
 *
 * DEUX RÉGIMES D'ÉDITION, délibérément différents (§3 et §8 désaccord 3 du plan
 * d'itération 2) :
 *
 *  · `texte_ouverture_joueur` — brouillon local SEEDÉ UNE FOIS (`useState(() => …)`,
 *    KR-013/113), jamais resynchronisé, committé au blur. Un brouillon d'édition,
 *    pas un miroir : sur un refus, la divergence écran/dossier devient explicite.
 *  · `lieu_id` — AUCUN brouillon. La valeur est lue en ligne depuis le dossier
 *    ouvert et le `change` committe immédiatement. Un `<select>` n'a pas de blur :
 *    un brouillon y serait une seconde source de vérité qu'aucun geste ne vient
 *    jamais réconcilier, et une adoption cloud retirant le lieu retenu produirait
 *    un `selectedIndex = -1` puis un écrasement silencieux au commit suivant.
 *
 * AUCUN AVERTISSEMENT ne se rend ici, et c'est une décision, pas un oubli (§8
 * désaccord 4) : ni `charpente.depart.lieu_id` ni `charpente.depart.texte_ouverture_joueur`
 * ne figurent dans `BUDGETS_DE_MOTS` (`brain/dossier/tables.ts`), donc aucun chemin
 * d'avertissement n'existe structurellement pour cette section — contrairement à
 * Canon, dont le compteur de mots bascule sur le seuil du validateur.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauDepart({ dossierId }: PanneauDepartProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [brouillonOuverture, setBrouillonOuverture] = useState<string | null>(() =>
		dossier === null ? null : dossier.charpente.depart.texte_ouverture_joueur,
	)
	const [refus, setRefus] = useState<Refus | null>(null)

	if (dossier === null || brouillonOuverture === null) return null

	/**
	 * L'idiome d'écriture prescrit (§5 du plan) : TROIS racines nommées, jamais un
	 * spread de `dossier` — seul `charpente.depart` change, `canon` et `monde`
	 * traversent intacts, et `charpente.jalons`/`charpente.fins` avec eux.
	 *
	 * PATCH ÉTROIT, jamais les deux champs à la fois : `d.charpente.depart` — le
	 * départ PERSISTÉ au moment de l'écriture, pas le brouillon semé au montage —
	 * porte le champ que ce commit ne touche pas. Committer les deux à chaque geste
	 * écraserait toute adoption survenue entre le montage et ce commit.
	 */
	function commit(patch: Partial<Depart>): void {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: d.monde,
			charpente: { ...d.charpente, depart: { ...d.charpente.depart, ...patch } },
		}))
		// Le brouillon n'est JAMAIS ramené en arrière sur un refus : le bandeau nomme
		// l'anomalie, l'auteur garde son texte. Un refus n'est levé que par un commit
		// réussi qui touche l'un des champs déjà en cause.
		const champs = Object.keys(patch) as (keyof Depart)[]
		setRefus((precedent) =>
			resultat.statut === 'refuse'
				? { champs, issues: resultat.errors }
				: precedent !== null && precedent.champs.some((champ) => champs.includes(champ))
					? null
					: precedent,
		)
	}

	function handleChangeLieu(lieuId: string): void {
		commit({ lieu_id: lieuId })
	}

	function handleChangeOuverture(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setBrouillonOuverture(e.target.value)
	}
	function handleBlurOuverture(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		commit({ texte_ouverture_joueur: e.target.value })
	}

	// Dans l'ordre du tableau, JAMAIS retrié : le repli de `localiserEntite()` est
	// indexé sur le RANG dans `monde.lieux`, et un tri d'affichage désynchroniserait
	// « Lieu n°3 (sans nom) » de la troisième fiche réelle.
	const options = dossier.monde.lieux.map((lieu, index) => ({
		value: lieu.id,
		label: localiserEntite('lieu', lieu, index),
	}))

	return (
		<div style={pageStyle}>
			<Card>
				<div style={champsStyle}>
					<div>
						<Select
							label="LIEU DE DÉPART"
							options={options}
							value={dossier.charpente.depart.lieu_id}
							onChange={handleChangeLieu}
						/>
						{options.length === 1 && <p style={legendeStyle}>{LEGENDE_LIEU_UNIQUE}</p>}
					</div>

					<Field
						label="TEXTE D'OUVERTURE"
						hint="lue par le joueur, mot pour mot"
						multiline
						rows={5}
						value={brouillonOuverture}
						placeholder={PLACEHOLDER_OUVERTURE}
						onChange={handleChangeOuverture}
						onBlur={handleBlurOuverture}
					/>

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

const legendeStyle: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
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
