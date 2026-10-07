import { useState } from 'react'
import { useBrain, type Dossier, type LectureSession } from '../../../brain'
import { finAtteinte } from '../../../player/engine/fin'
import { CadrePartie } from './CadrePartie'
import { EcranReprise } from './EcranReprise'
import { PartieDemarree, PartieEnCours } from './PartieEnCours'

export interface AiguillagePartieProps {
	readonly dossier: Dossier
	readonly dossierId: string
	readonly tirerGraine: () => number
}

/**
 * AIGUILLAGE REPRISE — lecture de la session sauvegardée et routage par statut.
 *
 * Cinq cas :
 *  · `absente` → nouvelle partie (graine tirée, session créée)
 *  · `reprenable` + finAtteinte → nouvelle partie (la précédente est terminée, décision #20)
 *  · `reprenable` + pas de fin → reprise (PartieEnCours reçoit la session)
 *  · `perimee` → écran de refus « Le dossier a changé » (dans CadrePartie)
 *  · `illisible` → écran de refus « La sauvegarde est endommagée » (dans CadrePartie)
 *
 * CONTRAT KR-305 : `sessions.lire` est appelée UNE SEULE FOIS dans l'initialiseur
 * `useState`, jamais dans un effet. Conséquence : si une session est périmée
 * ou illisible, `sessions.ecrire` ne sera JAMAIS appelé (PartieEnCours ne monte
 * pas, donc useSessionPersistee ne monte pas).
 *
 * AIGUILLAGE CALCULÉ EN LIGNE (KR-013/113) : deux états (`lecture` et
 * `generation`), quatre branches, aucun miroir. `generation` pilote la relance :
 *  · generation === 0 && reprenable && finAtteinte → PartieDemarree(key="post-fin")
 *  · generation === 0 && reprenable && !finAtteinte → PartieEnCours(session, key="reprise")
 *  · generation === 0 && (perimee || illisible) → CadrePartie > EcranReprise
 *  · sinon → PartieDemarree (nouvelle graine, key={generation})
 *
 * LIMITE ASSUMÉE : un tour en vol (`carteJet`, état React non persisté) se perd
 * à la reprise — c'est un effet de conception : la graine seule suffit à rejouer
 * un pas, mais le tour interactif (« quel dé lancez-vous ? ») n'est pas persisté
 * (docstring du codebase, KR-242 : « intra-process seul »).
 */
export function AiguillagePartie({ dossier, dossierId, tirerGraine }: AiguillagePartieProps): JSX.Element {
	const { sessions } = useBrain()

	// Lire la session sauvegardée — UNE SEULE FOIS, dans l'initialiseur (KR-305)
	const [lecture] = useState<LectureSession>(() => sessions.lire(dossier))

	// Compteur de relance — 0 = première ouverture, >0 = nouvelle partie
	const [generation, setGeneration] = useState(0)

	const handleNouvellePartie = () => {
		setGeneration((g) => g + 1)
	}

	// AIGUILLAGE EN LIGNE (KR-013/113)
	// Cas 1 : première ouverture ET reprenable ET partie non terminée
	if (generation === 0 && lecture.statut === 'reprenable') {
		if (finAtteinte(dossier, lecture.session)) {
			// Partie terminée — pas de reprise, nouvelle partie directe (décision #20)
			return (
				<PartieDemarree
					key="post-fin"
					dossier={dossier}
					dossierId={dossierId}
					tirerGraine={tirerGraine}
					onNouvellePartie={handleNouvellePartie}
				/>
			)
		}
		return (
			<PartieEnCours
				key="reprise"
				dossier={dossier}
				dossierId={dossierId}
				session={lecture.session}
				onNouvellePartie={handleNouvellePartie}
			/>
		)
	}

	// Cas 2 : première ouverture ET refus de session (perimee ou illisible)
	if (generation === 0 && (lecture.statut === 'perimee' || lecture.statut === 'illisible')) {
		return (
			<CadrePartie titre={null} sortie={{ name: 'dossier', dossierId }}>
				<EcranReprise statut={lecture.statut} onNouvellePartie={handleNouvellePartie} />
			</CadrePartie>
		)
	}

	// Cas 3 : relance (generation > 0) OU première ouverture sans session (absente)
	return (
		<PartieDemarree
			key={generation}
			dossier={dossier}
			dossierId={dossierId}
			tirerGraine={tirerGraine}
			onNouvellePartie={handleNouvellePartie}
		/>
	)
}
