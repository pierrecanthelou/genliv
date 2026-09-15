import type { BadgeTone } from '../components/Badge'
import type { NiveauControle } from './controles'
import { SANS_COMPTE } from './sections'

/**
 * LE RENDU D'UN NIVEAU DE CONTRÔLE — le MOT et la TEINTE, décidés ici et nulle
 * part ailleurs.
 *
 * POURQUOI CE MODULE EXISTE. Le couple mot/teinte vivait côté feature
 * (`dossier-controles/components/ListeControles.tsx`) tant qu'il n'avait qu'UN
 * appelant. L'itération 2 lui en donne un SECOND, dans une AUTRE feature
 * (`bascule-editeur`, le badge de chaque ligne de navigation) : une table
 * recopiée serait INVISIBLE au lint — c'est une copie, pas un import —, les deux
 * suites resteraient vertes, et les deux surfaces divergeraient au premier
 * renommage. D'où la descente dans `brain/` (KR-109).
 *
 * DEUX FONCTIONS PURES, AUCUN COMPOSANT. Les deux surfaces partagent la
 * DÉCISION (quel mot, quelle teinte), jamais le BALISAGE : le panneau rend un
 * `<li>` à trois étages, la navigation un `trailing` de `ListRow`. Un composant
 * commun aurait exigé une prop `compte` que la première surface n'a pas.
 *
 * POURQUOI `{ texte, tone }` EN UN SEUL APPEL plutôt que deux fonctions. La
 * teinte n'est PAS observable au rendu dans ce dépôt : `cssstyle`, le CSSOM de
 * jsdom, rejette silencieusement un jeton `var(--x)` sur `color`, si bien que
 * `toHaveStyle({ color: 'var(--bad)' })` PASSE sur un `Badge tone="muted"` —
 * mesuré et reproduit. Le `tone` ne peut donc être épinglé qu'AU CONTRAT, et un
 * retour unique permet à `pastilles.test.ts` de pincer les deux moitiés
 * ENSEMBLE, ce qui supprime toute divergence possible au site d'appel.
 *
 * POURQUOI UN FICHIER NEUF, ET PAS `controles.ts`. La docstring de ce dernier
 * affirme qu'il ne connaît ni mot français ni teinte — c'est ce qui sépare le
 * LINTER (quels constats) de son RENDU (comment on les montre). Garder cette
 * phrase vraie vaut un fichier.
 */

/**
 * LE PORTEUR UNIQUE des trois mots et des trois tons. PRIVÉE, jamais exportée :
 * un consommateur qui la lirait en ferait un second site de décision, et les
 * deux surfaces re-divergeraient par l'endroit même qu'on vient de fermer. Un
 * test de balayage tient cette propriété — après cette itération, ce fichier est
 * le SEUL de `src/` (hors tests, commentaires retirés) à écrire le mot.
 *
 * `Record` TOTAL sur `NiveauControle` : exhaustif PAR COMPILATION, `info`
 * compris bien qu'aucune règle ne le produise avant l'itération 3 — sinon
 * celle-ci rouvrirait ce fichier. Les trois mots et les trois tons sont ceux de
 * l'itération 1, DÉPLACÉS et jamais redécidés.
 *
 * Les tons se lisent dans `Badge.tsx` : `bad` → `--bad`, `neutral` → `--ink-2`,
 * `muted` → `--ink-4`. Aucun jeton neuf. `info` est `muted`, c'est-à-dire
 * IDENTIQUE EN TON à une section saine : les trois niveaux se distinguent par le
 * MOT, jamais par la seule couleur — le produit n'a que deux couleurs
 * sémantiques (`--good`, `--bad`) et elles sont réservées au jet.
 */
const PASTILLES: Record<NiveauControle, { texte: string; tone: BadgeTone }> = {
	bloquant: { texte: 'BLOQUANT', tone: 'bad' },
	alerte: { texte: 'ALERTE', tone: 'neutral' },
	info: { texte: 'INFO', tone: 'muted' },
}

/**
 * Le MOT SEUL et son ton — ce que rend le panneau Contrôles, dont chaque ligne
 * porte déjà son OÙ / QUOI / QUOI FAIRE dans la colonne sœur de la pastille.
 *
 * Rend un objet NEUF plutôt que l'entrée du registre : un appelant qui tiendrait
 * la ligne de la table privée pourrait la muter, et le porteur unique cesserait
 * de l'être sans qu'aucun balayage de source ne le voie.
 */
export function pastilleNiveau(niveau: NiveauControle): { texte: string; tone: BadgeTone } {
	const pastille = PASTILLES[niveau]
	return { texte: pastille.texte, tone: pastille.tone }
}

/**
 * LE BADGE D'UNE LIGNE DE NAVIGATION — le compte de la section et son niveau,
 * fondus en UN SEUL badge (KR-218), jamais deux nœuds côte à côte.
 *
 * LA RÈGLE D'ÉLISION, et c'est le cœur de l'itération : LE MOT REMPLACE LE
 * TIRET, IL NE S'Y AJOUTE JAMAIS. Mesure qui l'impose — les deux seules sections
 * que les règles vivantes allument (`depart`, `canon`) sont EXACTEMENT les deux
 * dont `compte()` vaut `SANS_COMPTE`. Une concaténation mécanique afficherait
 * « — · BLOQUANT », un badge dont la moitié gauche ne dit rien, et ce serait le
 * PREMIER rendu de production, pas un cas limite.
 *
 *   niveau === null        → texte = compte,               ton = 'muted'
 *   compte === SANS_COMPTE → texte = MOT,                  ton = ton du niveau
 *   sinon                  → texte = `${compte} · ${MOT}`, ton = ton du niveau
 *
 * Une section CALME garde son badge INCHANGÉ, en texte comme en ton : jamais de
 * coche verte, jamais de « 0 anomalie » — un voyant tautologiquement vert est
 * sans information (même motif que `SANS_COMPTE` lui-même).
 *
 * Le niveau reçu est LE PIRE de la section, et il arrive déjà seul :
 * `RapportControles.parSection` ne porte que lui. Ce badge ne rend donc jamais
 * une liste de mots, et n'a aucune gravité à comparer — cette règle-là vit dans
 * `controles.ts`, et nulle part ailleurs (KR-013).
 *
 * Le `·` est une PONCTUATION dans la chaîne composée, pas un jeton de design —
 * même convention que le compte de la section « Jalons & fins » (`sections.ts`),
 * qui sépare ses deux collections par le même caractère.
 */
export function badgeSection(compte: string, niveau: NiveauControle | null): { texte: string; tone: BadgeTone } {
	if (niveau === null) return { texte: compte, tone: 'muted' }

	const pastille = PASTILLES[niveau]
	if (compte === SANS_COMPTE) return { texte: pastille.texte, tone: pastille.tone }

	return { texte: `${compte} · ${pastille.texte}`, tone: pastille.tone }
}
