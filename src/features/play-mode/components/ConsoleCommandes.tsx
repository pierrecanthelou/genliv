import { useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { Field } from '../../../brain'

/**
 * LA CONSOLE DE COMMANDES — le SEUL moyen du déplacement, pas un second livrable
 * (§ 1 du plan d'itération 2). Un `<form>` + UN unique champ (`Field` réutilisé,
 * jamais un composant de saisie maison) + un bouton. Zéro second widget — ni
 * `<select>`, ni `<datalist>` (O-1).
 *
 * LA CONSOLE NE VALIDE RIEN : elle soumet la chaîne BRUTE à `onSoumettre`. Une
 * console qui validerait ET un moteur qui résout font DEUX décideurs, qui
 * divergeront (T-14, KR-013) — une règle du jeu ne vit qu'à un seul endroit.
 * `analyserSaisie` / `executerCommande` restent dans le composant APPELANT : ce
 * fichier ne les importe jamais.
 *
 * `refus` est un message DÉJÀ COMPOSÉ PAR LE MOTEUR — ce composant le REND,
 * jamais ne le recompose (Déméter, T-8).
 *
 * OPÉRABILITÉ CLAVIER : `Entrée` soumet NATIVEMENT le formulaire (un seul
 * `<input>` dans un `<form>`) — aucun `onKeyDown` maison.
 *
 * VIDER LE CHAMP + REPRENDRE LE FOCUS APRÈS UNE COMMANDE ACCEPTÉE, ET GARDER LA
 * SAISIE + LE FOCUS APRÈS UN REFUS : l'appelant remonte ce composant en changeant
 * sa `key` sur `session.horloge.tour` — qui n'avance QUE sur une commande
 * ACCEPTÉE (une commande refusée ne consomme aucun pas, `docs/REGLES-PLAY.md`
 * § J1). Un remontage réinitialise `saisie` et déclenche `autoFocus` : c'est le
 * patron React canonique de remise à zéro d'un sous-arbre sur un déclencheur
 * externe, PRÉFÉRÉ À un `useEffect` qui mirerait `refus` dans un second `setState`
 * (KR-013/113 — zéro `useEffect` dans ce fichier). Sur un refus, `session.horloge.tour`
 * ne bouge pas : aucun remontage, donc la saisie fautive et le focus survivent
 * SANS code dédié — c'est la forme « ne rien faire » qui les préserve.
 */
export interface ConsoleCommandesProps {
	readonly onSoumettre: (saisie: string) => void
	readonly refus: string | null
	readonly destinations: readonly string[]
}

const LIBELLE_SECTION = 'Console'
const LIBELLE_CONSOLE = 'CONSOLE'
const PLACEHOLDER_CONSOLE = 'Tapez une commande…'
const LIBELLE_EXECUTER = 'EXÉCUTER'
const TEXTE_IMPASSE = "Aucun accès depuis ce lieu — la console n'a aucune commande à proposer."

export function ConsoleCommandes({ onSoumettre, refus, destinations }: ConsoleCommandesProps): JSX.Element {
	const [saisie, setSaisie] = useState('')

	function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setSaisie(e.target.value)
	}

	function handleSubmit(e: FormEvent<HTMLFormElement>): void {
		e.preventDefault()
		onSoumettre(saisie)
	}

	return (
		<section aria-label={LIBELLE_SECTION}>
			{destinations.length === 0 ? (
				<p style={texteImpasse}>{TEXTE_IMPASSE}</p>
			) : (
				<>
					<form onSubmit={handleSubmit}>
						<Field
							id="console-commande"
							label={LIBELLE_CONSOLE}
							mono
							placeholder={PLACEHOLDER_CONSOLE}
							value={saisie}
							onChange={handleChange}
							autoFocus
						/>
						<button type="submit" style={boutonExecuter}>
							{LIBELLE_EXECUTER}
						</button>
					</form>
					<p style={texteAccesDisponibles}>Accès disponibles : {destinations.join(', ')}.</p>
				</>
			)}
			{/* `role="status"` — PATRON MAISON du bandeau de refus, pas une garantie
			    d'accessibilité : 33 usages au dépôt, et deux tests le nomment « règle RTL
			    du dépôt » (`retraitPersonnage.test.tsx:91`, `panneauPersonnages.test.tsx:572`).
			    L'omettre ici aurait été KR-079 — une propriété de rendu présente sur les
			    frères et absente du nouveau venu. Ajouté en revue de PR, sur mesure. */}
			{refus !== null && (
				<p role="status" style={texteRefusConsole}>
					<span aria-hidden="true">⊘ </span>
					{refus}
				</p>
			)}
		</section>
	)
}

// Aucun texte n'utilise `--bad` : un refus de saisie n'est pas un échec de jet
// (les deux seules couleurs sémantiques sont réussite / échec).
const boutonExecuter: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-3) var(--space-5)',
	borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--accent)',
	background: 'var(--accent)',
	color: 'var(--text-on-accent)',
	fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
} // accent légitime : seule action interactive primaire de l'écran
const texteRefusConsole: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
const texteAccesDisponibles: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
	lineHeight: 'var(--lh-body)',
}
const texteImpasse: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
