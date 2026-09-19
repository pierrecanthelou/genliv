import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Badge, Field, IconButton, HIT_TARGET_MIN } from '../../../brain'
import { BADGE_ACCEPTE, BADGE_REJETE, LABEL_ACCEPTER, LABEL_REJETER, LIEN_OUVRIR_FICHE } from '../textes'
import { actionsDetenteurStyle, conteneurRepliqueStyle, eyebrowStyle, lienDetenteurStyle } from './styles'

export interface LigneFichePersonnageProps {
	eyebrow: string
	/** DEUX éléments. Les `label` sont RÉSOLUS PAR LA CARTE depuis
	 *  `LIBELLE_DES_CHAMPS` — cette ligne ne porte JAMAIS un `chemin` : le
	 *  registre gagne cette itération des entrées de forme DIFFÉRENTE
	 *  (`canon.*` top-level contre `monde.personnages[].*` à trois niveaux),
	 *  et résoudre les `label` côté carte découple la ligne de cette
	 *  irrégularité (§ 3.3 du plan d'itération 4). */
	champs: ReadonlyArray<{ label: string; valeur: string }>
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void
	onRejeter: () => void
	onOuvrirFiche: () => void
}

/** Une INTENTION exposée au parent, même précédent que `LigneRelationHandle` :
 *  « mets le focus sur le bouton Accepter de CETTE ligne ». AUCUN
 *  `focusRejeter` : `monde.personnages[]` ne porte aucun plafond de document
 *  (§ 2, § 8 n° 6 du plan), donc le « + » n'est jamais désactivé. */
export interface LigneFichePersonnageHandle {
	focusAccepter: () => void
}

/**
 * La ligne d'une fiche de personnage proposée — SŒUR de `LigneDetenteur`, de
 * `LigneReplique` et de `LigneRelation`, et la PREMIÈRE à porter DEUX proses
 * (§ 3.3 du plan d'itération 4) : le brouillon est INDIVISIBLE, une seule
 * paire d'actions décide des deux champs à la fois — jamais deux `LigneReplique`
 * réutilisées (§ 8, désaccord n° 39, REJETÉ).
 *
 * ⚠ `TL3a-3` (« aucune ligne ne porte de `label=` ») est BORNÉ, PAS ABANDONNÉ
 * ici : ce corollaire visait une ligne rendant UNE seule prose anonyme — rien
 * à distinguer, donc aucun label. Ici il y en a DEUX, et rien ne les
 * distinguerait sans leur `label` (§ 3.3, § 8 n° 16).
 *
 * Rendu : `eyebrow` (calculé par la CARTE, `eyebrowPersonnagePropose(n)`,
 * rendu ICI) → un `Field` en lecture seule par champ (`onChange={() => {}}`,
 * doctrine de `LigneProposition`) → UNE SEULE paire d'actions sous
 * l'ensemble → après décision, `Badge` + `LIEN_OUVRIR_FICHE` sur acceptée
 * seule, qui ouvre le panneau Personnages (`onSelectSection('personnages')`),
 * JAMAIS un id ciblé (rouvrirait BUG-082) — même contrat que les trois sœurs.
 *
 * ⚠ GLYPHE `×`, JAMAIS `✕` (§ 3.3, vérifié faux par l'orchestrateur) : `✕`
 * sert ailleurs à fermer un conteneur, un geste différent.
 * ⚠ AUCUNE prop `accepterDesactive` : aucun plafond de document sur
 * `monde.personnages[]`, donc le « + » reste un `IconButton` simple.
 * ⚠ AUCUNE garde « porteur disparu » : il n'y a pas de porteur, l'entité
 * n'existe pas avant l'acceptation — le seul refus d'écriture possible est un
 * `statut:'refuse'` du SSOT, cas NOMINAL (KR-234), proposition maintenue à
 * l'écran par la carte.
 */
export const LigneFichePersonnage = forwardRef<LigneFichePersonnageHandle, LigneFichePersonnageProps>(
	function LigneFichePersonnage(
		{ eyebrow, champs, decision, onAccepter, onRejeter, onOuvrirFiche }: LigneFichePersonnageProps,
		ref,
	) {
		const accepterRef = useRef<HTMLButtonElement>(null)

		useImperativeHandle(ref, () => ({ focusAccepter: () => accepterRef.current?.focus() }), [])

		return (
			<div style={conteneurRepliqueStyle}>
				<span style={eyebrowStyle}>{eyebrow}</span>
				{champs.map((champ) => (
					<Field key={champ.label} label={champ.label} value={champ.valeur} multiline rows={3} onChange={() => {}} />
				))}
				{decision === undefined ? (
					<div style={actionsDetenteurStyle}>
						<IconButton
							ref={accepterRef}
							label={LABEL_ACCEPTER}
							tone="accent"
							size={HIT_TARGET_MIN}
							onClick={onAccepter}
						>
							+
						</IconButton>
						<IconButton label={LABEL_REJETER} tone="danger" size={HIT_TARGET_MIN} onClick={onRejeter}>
							×
						</IconButton>
					</div>
				) : (
					<div style={actionsDetenteurStyle}>
						<Badge tone={decision === 'acceptee' ? 'accent' : 'muted'}>
							{decision === 'acceptee' ? BADGE_ACCEPTE : BADGE_REJETE}
						</Badge>
						{decision === 'acceptee' && (
							<button type="button" onClick={onOuvrirFiche} style={lienDetenteurStyle}>
								{LIEN_OUVRIR_FICHE}
							</button>
						)}
					</div>
				)}
			</div>
		)
	},
)
