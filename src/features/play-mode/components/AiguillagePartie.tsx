import { useState } from 'react'
import { useBrain, type Dossier, type LectureSession } from '../../../brain'
import { finAtteinte } from '../../../player/engine/fin'
import { rejouerCombat } from '../../../player/engine/rencontre'
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
 * Six cas :
 *  · `absente` → nouvelle partie (graine tirée, session créée)
 *  · `reprenable` + finAtteinte → nouvelle partie (la précédente est terminée, décision #20)
 *  · `reprenable` + hero-mort → nouvelle partie (mort du héros, it3)
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
 * `relance`), cinq branches, aucun miroir. `relance.generation` pilote la relance :
 *  · generation === 0 && reprenable && finAtteinte → PartieDemarree(key="post-fin")
 *  · generation === 0 && reprenable && hero-mort → PartieDemarree(key="post-mort")
 *  · generation === 0 && reprenable && !finAtteinte → PartieEnCours(session, key="reprise")
 *  · generation === 0 && (perimee || illisible) → CadrePartie > EcranReprise
 *  · sinon → PartieDemarree (nouvelle graine ou graine imposée, key={generation})
 *
 * LIMITE ASSUMÉE (it4, KR-242) : Rejouer n'existe que sur l'écran terminal vivant.
 * Après rechargement, `session.graine_alea` est bien persistée, mais l'état `relance`
 * (qui porte l'intention de Rejouer) est un état React non persisté. Une partie
 * terminée rouverte (generation === 0) fait toujours une nouvelle partie.
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

	// État de relance — un seul état pour génération + graine imposée (it4, KR-304)
	const [relance, setRelance] = useState<{ readonly generation: number; readonly graine?: number }>({
		generation: 0,
	})

	const handleNouvellePartie = () => {
		setRelance((r) => ({ generation: r.generation + 1, graine: undefined }))
	}

	const handleRejouer = (graine: number) => {
		setRelance((r) => ({ generation: r.generation + 1, graine }))
	}

	// AIGUILLAGE EN LIGNE (KR-013/113)
	// Cas 1 : première ouverture ET reprenable ET partie non terminée
	if (relance.generation === 0 && lecture.statut === 'reprenable') {
		if (finAtteinte(dossier, lecture.session)) {
			// Partie terminée — pas de reprise, nouvelle partie directe (décision #20)
			return (
				<PartieDemarree
					key="post-fin"
					dossier={dossier}
					dossierId={dossierId}
					tirerGraine={tirerGraine}
					onNouvellePartie={handleNouvellePartie}
					onRejouer={handleRejouer}
				/>
			)
		}
		// Vérifier si le combat est hero-mort (mort du héros)
		if (lecture.session.combat) {
			const rejeu = rejouerCombat(lecture.session)
			if (rejeu.ok && rejeu.etat.outcome === 'hero-mort') {
				// Partie terminée par mort du héros — nouvelle partie directe
				return (
					<PartieDemarree
						key="post-mort"
						dossier={dossier}
						dossierId={dossierId}
						tirerGraine={tirerGraine}
						onNouvellePartie={handleNouvellePartie}
						onRejouer={handleRejouer}
					/>
				)
			}
		}
		return (
			<PartieEnCours
				key="reprise"
				dossier={dossier}
				dossierId={dossierId}
				session={lecture.session}
				onNouvellePartie={handleNouvellePartie}
				onRejouer={handleRejouer}
			/>
		)
	}

	// Cas 2 : première ouverture ET refus de session (perimee ou illisible)
	if (relance.generation === 0 && (lecture.statut === 'perimee' || lecture.statut === 'illisible')) {
		return (
			<CadrePartie titre={null} sortie={{ name: 'dossier', dossierId }}>
				<EcranReprise statut={lecture.statut} onNouvellePartie={handleNouvellePartie} />
			</CadrePartie>
		)
	}

	// Cas 3 : relance (generation > 0) OU première ouverture sans session (absente)
	return (
		<PartieDemarree
			key={relance.generation}
			dossier={dossier}
			dossierId={dossierId}
			graineImposee={relance.graine}
			tirerGraine={tirerGraine}
			onNouvellePartie={handleNouvellePartie}
			onRejouer={handleRejouer}
		/>
	)
}
