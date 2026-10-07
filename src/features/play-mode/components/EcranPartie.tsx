import { useState } from 'react'
import { useBrain, controlerDossier } from '../../../brain'
import { EcranRefus } from './EcranRefus'
import { AiguillagePartie } from './AiguillagePartie'

/**
 * LE SHELL DE PARTIE — la route `partie`, montée par la racine de composition.
 *
 * GARDES 1-3 UNIQUEMENT :
 *  1. le dossier est GELÉ à l'ouverture ;
 *  2. absent → refus `dossier_introuvable` ;
 *  3. non jouable → refus `dossier_non_jouable` (KR-239).
 *
 * GARDES 4-5 ET CONTENU JOUABLE : voir `PartieEnCours.tsx` (extraction n° 15 it1).
 *
 * LA SEULE ENTROPIE DE LA FEATURE, et elle est NOMMÉE : un `Math.random()`
 * anonyme en ligne serait intirable par un test (§ 8, D-16 — précédent du `rng`
 * non semé de `combat.ts:107`). `ouvrirSession` n'en tire aucune : sa graine est
 * REQUISE et INJECTÉE, faute de quoi la promesse de rejeu de la n° 11 ne
 * tiendrait pour aucune session née ici.
 */
const GRAINE_MAX = 2 ** 32
export function tirerGraine(): number {
	return Math.floor(Math.random() * GRAINE_MAX)
}

export interface EcranPartieProps {
	readonly dossierId: string
}

export function EcranPartie({ dossierId }: EcranPartieProps): JSX.Element {
	const { dossiers } = useBrain()

	// GARDE 1 — LE DOSSIER EST GELÉ À L'OUVERTURE (arbitrage n° 7). Surtout PAS
	// `useOpenDossier`, qui s'abonne à `dossier:updated` : le voisin
	// `DossierEditorScreen` fait l'inverse, et il a raison de le faire, mais une
	// partie qui adopterait une édition en cours de route rouvrirait la porte
	// KR-239 après l'avoir passée (§ 8, D-20).
	const [dossier] = useState(() => dossiers.get(dossierId))

	// GARDE 2 — `DossierService.get` rend `null` (jamais `undefined`) pour un
	// dossier absent ou devenu illisible.
	if (dossier === null) {
		return <EcranRefus code="dossier_introuvable" titre={null} dossierId={dossierId} />
	}

	// GARDE 3 — EN LIGNE, à chaque rendu, jamais un `useMemo` ni un miroir
	// (KR-013/113). LA PORTE EST ICI, pas seulement au CTA : la route `partie` est
	// un chemin d'accès DIRECT, et tout chemin qui ouvre une session sans repasser
	// par `jouable` rouvre le faux positif que l'évaluateur d'it3 hériterait
	// (KR-239). C'est la FEATURE qui lit `controlerDossier` — jamais `src/player/`,
	// jamais `brain/dossier/` : le linter de l'éditeur n'entre pas dans le bundle
	// extractible (§ 8, D-21).
	const { jouable } = controlerDossier(dossier)
	if (!jouable) {
		return <EcranRefus code="dossier_non_jouable" titre={dossier.titre} dossierId={dossierId} />
	}

	return <AiguillagePartie dossier={dossier} dossierId={dossierId} tirerGraine={tirerGraine} />
}
