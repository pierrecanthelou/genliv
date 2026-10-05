import type { Posture } from '../../../brain/combat'
import type { Dossier } from '../../../brain/dossier/types'
import type { EtatSession } from '../../../brain/dossier/session'
import type { CombatState } from '../../../player/engine/combatTypes'
import { EcranCombat } from './EcranCombat'
import { useCommentaireCombat } from '../hooks/useCommentaireCombat'
import { rejouerCombat } from '../../../player/engine/rencontre'

export interface CombatEnCoursProps {
	readonly dossier: Dossier
	readonly session: EtatSession
	readonly etat: CombatState
	readonly onJouer: (posture: Posture) => EtatSession
	readonly onFuir: () => void
	readonly onClore?: () => void
}

export function CombatEnCours({ dossier, session, etat, onJouer, onFuir, onClore }: CombatEnCoursProps): JSX.Element {
	const { commentaires, commenter } = useCommentaireCombat(dossier)

	const handleJouer = (posture: Posture): void => {
		const nextSession = onJouer(posture)
		if (nextSession === session) return
		const rejeu = rejouerCombat(nextSession)
		if (rejeu.ok && rejeu.etat.dernierAssaut && nextSession.heros && nextSession.combat) {
			commenter(rejeu.etat, nextSession.heros.pvMax, nextSession.combat.monstre_ref)
		}
	}

	return <EcranCombat etat={etat} onJouer={handleJouer} onFuir={onFuir} onClore={onClore} commentaires={commentaires} />
}
