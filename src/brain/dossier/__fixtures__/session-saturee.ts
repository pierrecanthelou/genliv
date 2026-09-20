import type { EtatSession } from '../session'

/**
 * UNE SESSION SATURÉE — la fixture du balayage d'audience, et SURTOUT PAS la
 * session d'ouverture.
 *
 * POURQUOI SATURÉE, ET C'EST UNE MESURE, PAS UN GOÛT : une LISTE VIDE EST UNE
 * FEUILLE. Sur une session d'ouverture, `feuillesDeLaFixture` rendrait
 * `monde.lieux_visites` (sans `[]`) au lieu de `monde.lieux_visites[]`, et les
 * onze lignes de feuille de `DESTINATION_DES_CHAMPS_DE_SESSION` seraient MORTES
 * le jour même où elles sont écrites. Précédent mesuré au dépôt :
 * `climat[].effets_regles`.
 *
 * ÉCRITE À LA MAIN, jamais produite par `ouvrirSession` : une fixture dérivée du
 * code qu'elle garde ne garde rien. C'est le même motif que
 * `__fixtures__/dossier-minimal.json` face à `construireAmorce`.
 *
 * DEUX ENTRÉES `pnj`, ET C'EST DÉLIBÉRÉ : le balayage efface les indices de
 * TABLEAU, pas les clés d'un `Record`. Avec une seule entrée, la normalisation
 * `<id>` du test serait indistinguable d'une absence de normalisation ; avec
 * deux, elle doit COLLAPSER deux chemins concrets en un chemin normalisé, et le
 * test le constate.
 *
 * DEUX ENTRÉES DE JOURNAL, une par membre de `RoleJournal` : une seule ne
 * prouverait pas que les trois feuilles de journal sont balayées pour chaque
 * ligne, et la couverture n'est acquise que si CHAQUE instance rougit.
 *
 * ELLE NE RÉFÉRENCE AUCUN DOSSIER RÉEL. Aucun validateur ne la lit, aucune de ses
 * références n'est résolue : sa seule fonction est de porter une valeur sous
 * CHAQUE chemin de feuille de la session. Les identifiants sont empruntés à
 * `dossier-minimal.json` pour rester lisibles, rien de plus.
 */
export const SESSION_SATUREE: EtatSession = {
	schema: 1,
	dossier_id: 'dossier-minimal',
	dossier_maj: '2026-09-20T10:00:00.000Z',
	graine_alea: 424242,
	horloge: { tour: 7 },
	monde: {
		lieu_courant: 'lieu.val-cendre',
		lieux_visites: ['lieu.val-cendre', 'lieu.le-fanal'],
		objets_possedes: ['objet.clef-de-basalte'],
		indices_connus: ['indice.cendres-tiedes', 'indice.sceau-brise'],
		jalons_atteints: ['jalon.premiere-nuit'],
		evenements_consommes: ['evenement.embuscade-du-fanal'],
		pnj: {
			'pnj.aldur-le-sage': { a_dit: ['indice.sceau-brise'] },
			'pnj.corvin-le-marchand': { a_dit: ['indice.cendres-tiedes'] },
		},
	},
	journal: [
		{ tour: 6, role: 'joueur', texte: 'aller lieu.le-fanal' },
		{ tour: 7, role: 'moteur', texte: 'La salle se tait quand la porte se referme.' },
	],
	memoire: null,
}
