import type { CSSProperties } from 'react'
import { useBrain, type Route } from '../../../brain'
import { MARQUEUR_A_ECRIRE } from '../../../brain/dossier/amorce'
import { CadrePartie } from './CadrePartie'
import { boutonPrimaire } from './boutonPrimaire'

/**
 * LES TROIS REFUS DE L'ÉCRAN DE PARTIE — EXTRAIT d'`EcranPartie.tsx` (KR-112) par
 * l'itération 2. Registre piloté par la donnée (KR-117) plutôt que trois
 * branches : chaque code y porte son texte, son action et sa destination, et un
 * quatrième code ne compilerait pas sans sa ligne.
 *
 * `dossier_non_jouable` et `ouverture_a_ecrire` partagent la même sortie : ce
 * sont deux façons de dire « retournez le corriger dans l'éditeur ».
 */
type CodeRefus = 'dossier_introuvable' | 'dossier_non_jouable' | 'ouverture_a_ecrire'

interface DescripteurRefus {
	readonly texte: string
	readonly libelleAction: string
	readonly destination: (dossierId: string) => Route
}

const REFUS: Record<CodeRefus, DescripteurRefus> = {
	/** Texte repris TEL QUEL de `DossierEditorScreen.tsx` : le même fait, deux écrans, un seul texte. */
	dossier_introuvable: {
		texte: 'Dossier introuvable.',
		libelleAction: '← Mes dossiers',
		destination: () => ({ name: 'home' }),
	},
	dossier_non_jouable: {
		texte: "Ce dossier porte encore un contrôle bloquant. Ouvrez « Contrôles » dans l'éditeur pour voir lequel.",
		libelleAction: "← Revenir à l'éditeur",
		destination: (dossierId) => ({ name: 'dossier', dossierId }),
	},
	/**
	 * INATTEIGNABLE PAR L'INTERFACE EN IT1, et c'est MESURÉ : `controles.ts` classe
	 * ce champ `bloquant`, donc la garde 3 a déjà refusé. La branche reste parce que
	 * `ResultatOuverture` est une union discriminée que ce shell doit rétrécir
	 * TOTALEMENT — un bras sans texte rendrait un écran blanc — et parce que des
	 * chemins futurs (reprise, lien direct) la rouvrent (KR-239, § 8 D-7).
	 *
	 * Le marqueur se COMPOSE, il ne se recopie jamais : le tapé en dur serait une
	 * seconde source de vérité (KR-223).
	 */
	ouverture_a_ecrire: {
		texte: `Le texte d'ouverture porte encore le marqueur ${MARQUEUR_A_ECRIRE} — le moteur le lirait au joueur mot pour mot. Rédigez-le dans DÉPART · TEXTE D'OUVERTURE.`,
		libelleAction: "← Revenir à l'éditeur",
		destination: (dossierId) => ({ name: 'dossier', dossierId }),
	},
}

const TITRE_REFUS = "La partie ne peut pas s'ouvrir"

export interface EcranRefusProps {
	readonly code: CodeRefus
	readonly titre: string | null
	readonly dossierId: string
}

/** Rendu À LA PLACE de la colonne de lecture : le header reste, l'auteur doit toujours pouvoir sortir. */
export function EcranRefus({ code, titre, dossierId }: EcranRefusProps): JSX.Element {
	const { router } = useBrain()
	const { texte, libelleAction, destination } = REFUS[code]
	const sortie = destination(dossierId)

	return (
		<CadrePartie titre={titre} sortie={sortie}>
			<section style={blocRefus}>
				<span style={glypheRefus} aria-hidden="true">
					⊘
				</span>
				<h2 style={titreRefus}>{TITRE_REFUS}</h2>
				<p style={texteRefus}>{texte}</p>
				<button type="button" style={boutonPrimaire} onClick={() => router.navigate(sortie)}>
					{libelleAction}
				</button>
			</section>
		</CadrePartie>
	)
}

const blocRefus: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
	maxWidth: 480,
	margin: '0 auto',
}

const glypheRefus: CSSProperties = { fontSize: 'var(--fs-h1)', color: 'var(--text-faint)', lineHeight: 1 }

const titreRefus: CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	letterSpacing: 'var(--track-tight)',
	color: 'var(--text-strong)',
}

const texteRefus: CSSProperties = { margin: 0, color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }
