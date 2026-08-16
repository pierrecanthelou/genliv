import { useEffect, useRef, useState } from 'react'
import {
	useBrain,
	useOpenDossier,
	frapperIdentifiant,
	localiserEntite,
	ListRow,
	IconButton,
	HIT_TARGET_MIN,
	type Objet,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'
import { FicheObjet, designationDe, type BrouillonObjet, type FicheObjetHandle } from './FicheObjet'
import { RetirerObjetDialog } from './RetirerObjetDialog'
import {
	pageStyle,
	colonneListeStyle,
	colonneFicheStyle,
	eyebrowStyle,
	listeStyle,
	ligneStyle,
	ligneListRowStyle,
	boutonAjouterStyle,
	emptyStateStyle,
	emptyGlyphStyle,
	emptyTextStyle,
} from './styles'

export interface PanneauObjetsProps {
	dossierId: string
}

function brouillonDe(objet: Objet): BrouillonObjet {
	return {
		nom: objet.nom ?? '',
		description_joueur: objet.description_joueur ?? '',
	}
}

/**
 * Le refus en cours, indexé par l'objet dont l'écriture l'a produit — sans cet
 * index, changer de sélection après un refus laisse le bandeau affiché sous
 * la fiche d'un AUTRE objet, qui n'a rien vu refuser (même famille que
 * KR-197, précédent `PanneauLieux.tsx`). `FicheObjet` ne connaît que
 * `{ statut, issues }` : le filtrage par id reste ici, seul endroit qui
 * connaît la sélection courante.
 */
interface RefusEnCours {
	objetId: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

const EYEBROW_SECTION = 'OBJETS'
const TEXTE_VIDE = 'Aucun objet — cliquez « + Ajouter un objet… » pour commencer.'

/** Le libellé du bouton Monter — le titre entre guillemets, ou le repli numéroté. */
function libelleMonter(objet: Objet, index: number): string {
	const nom = objet.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Monter l'objet « ${nom.trim()} »`
	return `Monter l'objet n°${index + 1} (sans nom)`
}

/** Le libellé du bouton Descendre — symétrique de `libelleMonter`. */
function libelleDescendre(objet: Objet, index: number): string {
	const nom = objet.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Descendre l'objet « ${nom.trim()} »`
	return `Descendre l'objet n°${index + 1} (sans nom)`
}

/**
 * Le panneau Objets — la liste du registre d'objets du monde (`monde.objets[]`),
 * écrite par le même `DossierService.update()` que Canon/Départ/Personnages/Lieux,
 * avec un patch ÉTROIT : `canon`/`charpente` traversent intacts. Précédent direct
 * `PanneauLieux.tsx` (dossier-canon) : layout à deux colonnes, sélection par
 * défaut (le premier objet) calculée EN LIGNE (`objets.find(...) ?? objets[0]`),
 * jamais un `useEffect` de resynchronisation (KR-013/113).
 *
 * RÉORDONNANCEMENT — composé ENTIÈREMENT par cette feature (§3 du plan
 * d'itération 1, désaccord 3) : deux `IconButton` Monter/Descendre en FRÈRES de
 * `ListRow` dans le `<li>` qui les entoure, jamais une prop ajoutée à
 * `ListRow.tsx` (inchangé, seul son docstring est corrigé). `deplacer(id, sens)`
 * permute `monde.objets` PAR IDENTIFIANT, jamais par position, et appelle le
 * même `commit()` que les autres champs — la sélection reste indexée par id,
 * donc la fiche affichée reste celle du MÊME objet après une permutation. Aux
 * bornes de la liste, le bouton correspondant est OMIS, jamais rendu `disabled`.
 *
 * RETRAIT (itération 2) — possédé ici, en trois pièces : l'état d'ouverture de
 * la modale (`enConfirmation`, un identifiant, jamais un booléen — une
 * demande de retrait laissée ouverte sur un objet qui n'est plus l'affiché se
 * referme d'elle-même au rendu suivant, garde EN LIGNE), la CONFIRMATION
 * (`handleConfirmerRetrait`) et le déplacement de focus qui suit un retrait
 * réussi (`intentionFocus`, usage légitime de `useEffect`, KR-013). Le SSOT
 * seul décide du refus, APRÈS la tentative — aucun pré-vol côté feature, cette
 * feature n'a connaissance d'aucun autre registre du dossier.
 *
 * CIBLE DU FOCUS : ce panneau ne cherche JAMAIS le bouton de retrait dans le
 * DOM — c'est un détail d'implémentation de `FicheObjet`, pas le sien. Il
 * DEMANDE (`ficheRef.current?.focusRetirer()`, `FicheObjetHandle`), même motif
 * que `designationDe` : la fiche EXPOSE la capacité, ce panneau l'APPELLE. Pour
 * son PROPRE bouton « + Ajouter un objet… » (rendu dans les DEUX branches
 * ci-dessous), un `ref` direct suffit.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauObjets({ dossierId }: PanneauObjetsProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const objets = dossier?.monde.objets ?? []
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonObjet>>(() =>
		Object.fromEntries(objets.map((objet) => [objet.id, brouillonDe(objet)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)
	/** L'identifiant de l'objet dont le retrait attend confirmation, jamais un
	 *  booléen : la modale se garde EN LIGNE contre l'objet affiché
	 *  (`enConfirmation === objetAffiche?.id`). */
	const [enConfirmation, setEnConfirmation] = useState<string | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'nom' | 'retirer' | null>(null)
	const nomInputRef = useRef<HTMLInputElement>(null)
	const ficheRef = useRef<FicheObjetHandle>(null)
	const boutonAjouterRef = useRef<HTMLButtonElement>(null)

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante, retombe sur le premier objet tant qu'aucune sélection
	// explicite n'a été posée — `undefined` seulement quand la liste est vide.
	// HISSÉ au-dessus du retour anticipé « dossier absent » : l'effet de focus
	// ci-dessous a besoin de le lire, et les règles des hooks interdisent un
	// retour anticipé entre deux hooks.
	const objetAffiche = objets.find((objet) => objet.id === selection) ?? objets[0]

	useEffect(() => {
		if (intentionFocus === 'nom') {
			nomInputRef.current?.focus()
		} else if (intentionFocus === 'retirer') {
			// `objetAffiche` reflète déjà la RETOMBÉE post-retrait à ce point : présent
			// → la fiche retombée se focalise elle-même ; absent → retirer le dernier
			// objet a basculé sur l'état vide, le focus revient sur « + Ajouter… ».
			if (objetAffiche !== undefined) {
				ficheRef.current?.focusRetirer()
			} else {
				boutonAjouterRef.current?.focus()
			}
		}
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus, objetAffiche])

	if (dossier === null) return null

	/**
	 * L'idiome d'écriture : TROIS racines nommées, jamais un spread de
	 * `dossier` — seul `monde.objets` change, `canon`/`charpente` traversent
	 * intacts (même patron que `PanneauLieux.tsx`).
	 *
	 * `resout` (même discipline que `PanneauLieux.tsx:136-153`) : `objetId`
	 * porte DEUX RÔLES distincts — l'AFFICHAGE (sous quelle fiche le refus se
	 * montre, TOUJOURS actif) et l'INVALIDATION (quel succès l'efface, actif
	 * SEULEMENT si `resout`). Un AJOUT n'efface JAMAIS un refus, même quand il
	 * réussit et que l'entité affichée coïncide avec l'entité déjà en cause.
	 */
	function commit(
		objetsSuivants: Objet[],
		objetId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, objets: objetsSuivants },
			charpente: d.charpente,
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { objetId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { objetId, statut: 'absent', issues: [] }
			if (!resout) return refusPrecedent
			return refusPrecedent !== null && refusPrecedent.objetId !== objetId ? refusPrecedent : null
		})
		return resultat
	}

	function handleAjouter(): void {
		const id = frapperIdentifiant('objet')
		const nouveau: Objet = { id }
		// Indexé sur l'objet AFFICHÉ (`objetAffiche?.id`), jamais sur `id` — celui-ci
		// n'entre dans le document QUE si l'écriture réussit. `resout: false` : un
		// ajout, réussi ou non, ne résout JAMAIS un refus (voir `commit`).
		const resultat = commit([...objets, nouveau], objetAffiche?.id ?? id, { resout: false })
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
		setSelection(id)
		setIntentionFocus('nom')
	}

	// Garde d'absence en LECTURE et en MUTATION (patron `PanneauLieux.tsx`) : un
	// brouillon peut manquer pour un objet arrivé hors de `handleAjouter` (ex.
	// réconciliation cloud pendant que le panneau est monté).
	function handleChangeChamp(id: string, champ: keyof BrouillonObjet, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const objet = objets.find((o) => o.id === id)
			if (objet === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(objet), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: keyof BrouillonObjet, valeur: string): void {
		commit(
			objets.map((objet) => (objet.id === id ? { ...objet, [champ]: valeur } : objet)),
			id,
		)
	}

	/**
	 * Permute deux objets ADJACENTS par IDENTIFIANT, jamais par position — la
	 * sélection (indexée par id) n'a donc rien à recalculer après l'écriture :
	 * la fiche affichée reste celle du même objet.
	 */
	function deplacer(id: string, sens: -1 | 1): void {
		const index = objets.findIndex((objet) => objet.id === id)
		const cible = index + sens
		if (index === -1 || cible < 0 || cible >= objets.length) return
		const permutes = [...objets]
		;[permutes[index], permutes[cible]] = [permutes[cible], permutes[index]]
		commit(permutes, id)
	}

	function handleRetirer(id: string): void {
		const index = objets.findIndex((objet) => objet.id === id)
		if (index === -1) return
		const resultat = commit(
			objets.filter((objet) => objet.id !== id),
			id,
		)
		// Refusé (référencé ailleurs dans le dossier) : rien n'est persisté, la
		// liste et la sélection restent celles d'avant — aucun retrait optimiste.
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
		const restants = resultat.dossier.monde.objets
		// Le PRÉCÉDENT de l'objet retiré, ou le premier restant si l'élément retiré
		// était en tête — `restants[Math.max(index - 1, 0)]` réalise les DEUX cas
		// d'un coup (même formule que `PanneauLieux.tsx`).
		setSelection(restants.length === 0 ? null : restants[Math.max(index - 1, 0)].id)
		setIntentionFocus('retirer')
	}

	// Équivalent exact de `dossier.monde.objets.length === 0` (voir le calcul de
	// `objetAffiche` plus haut), mais brancher sur LA MÊME valeur donne à
	// TypeScript le rétrécissement `Objet` (non `| undefined`) pour la suite,
	// sans assertion `!`. `monde.objets` DÉMARRE VIDE à la création d'un dossier
	// (`construireAmorce`) : cette branche est donc l'état RÉEL d'un dossier
	// neuf, pas un cas défensif — le bouton « + Ajouter un objet… » doit y
	// rester accessible (précédent `PanneauPersonnages.tsx`).
	if (objetAffiche === undefined) {
		return (
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<button ref={boutonAjouterRef} type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
						+ Ajouter un objet…
					</button>
				</div>
				<div style={colonneFicheStyle}>
					<div style={emptyStateStyle}>
						<span style={emptyGlyphStyle} aria-hidden="true">
							❏
						</span>
						<p style={emptyTextStyle}>{TEXTE_VIDE}</p>
					</div>
				</div>
			</div>
		)
	}

	const brouillon = brouillons[objetAffiche.id] ?? brouillonDe(objetAffiche)
	const indexAffiche = objets.findIndex((objet) => objet.id === objetAffiche.id)
	// Le refus ne se rend QUE sous la fiche de l'objet qui l'a produit — changer
	// de sélection ne doit jamais laisser le bandeau attaché au mauvais objet.
	const refusAffiche =
		refus !== null && refus.objetId === objetAffiche.id ? { statut: refus.statut, issues: refus.issues } : null

	/**
	 * L'ORDRE DES DEUX GESTES EST UN INVARIANT, pas une préférence de style
	 * (même motif que `PanneauPersonnages.tsx`) : la fermeture de la modale et
	 * le retrait vivent dans le MÊME gestionnaire synchrone, donc dans le même
	 * commit React.
	 */
	function handleConfirmerRetrait(): void {
		setEnConfirmation(null)
		handleRetirer(objetAffiche.id)
	}

	return (
		<div style={pageStyle}>
			<div style={colonneListeStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<ul style={listeStyle}>
					{objets.map((objet, index) => (
						<li key={objet.id} style={ligneStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={localiserEntite('objet', objet, index)}
									subtitle={objet.id}
									selected={objet.id === objetAffiche.id}
									onSelect={() => setSelection(objet.id)}
								/>
							</div>
							{index > 0 && (
								<IconButton
									label={libelleMonter(objet, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(objet.id, -1)}
								>
									▲
								</IconButton>
							)}
							{index < objets.length - 1 && (
								<IconButton
									label={libelleDescendre(objet, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(objet.id, 1)}
								>
									▼
								</IconButton>
							)}
						</li>
					))}
				</ul>
				<button ref={boutonAjouterRef} type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
					+ Ajouter un objet…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FicheObjet
					ref={ficheRef}
					objet={objetAffiche}
					index={indexAffiche}
					brouillon={brouillon}
					refus={refusAffiche}
					nomInputRef={nomInputRef}
					onChangeChamp={(champ, valeur) => handleChangeChamp(objetAffiche.id, champ, valeur)}
					onBlurChamp={(champ, valeur) => handleBlurChamp(objetAffiche.id, champ, valeur)}
					onDemanderRetrait={() => setEnConfirmation(objetAffiche.id)}
				/>
			</div>

			{/* GARDE EN LIGNE, jamais un effet miroir (KR-013/113) : une demande de
			    retrait laissée ouverte sur un objet qui n'est plus l'affiché se
			    referme d'elle-même au rendu suivant. */}
			{enConfirmation === objetAffiche.id && (
				<RetirerObjetDialog
					nomAffiche={designationDe(objetAffiche, indexAffiche)}
					onConfirm={handleConfirmerRetrait}
					onCancel={() => setEnConfirmation(null)}
				/>
			)}
		</div>
	)
}
