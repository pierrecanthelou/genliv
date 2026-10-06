import type { EtatSession } from '../session'

/**
 * UNE SESSION SATURÉE — la fixture du balayage d'audience, et SURTOUT PAS la
 * session d'ouverture.
 *
 * POURQUOI SATURÉE, ET C'EST UNE MESURE, PAS UN GOÛT : une LISTE VIDE EST UNE
 * FEUILLE. Sur une session d'ouverture, `feuillesDeLaFixture` rendrait
 * `monde.lieux_visites` (sans `[]`) au lieu de `monde.lieux_visites[]`, et les
 * douze lignes de feuille de `DESTINATION_DES_CHAMPS_DE_SESSION` seraient MORTES
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
 * TROIS ENTRÉES DE JOURNAL — les DEUX membres de `RoleJournal` sont représentés,
 * et la troisième est celle qui porte des `deltas` (itération 3). LES TROIS
 * PORTENT `tour: 17`, UN SEUL PAS : une demande, son effet, et la conséquence de
 * règle qu'il a déclenchée — une conséquence enchaînée n'ajoute jamais un pas
 * (`docs/REGLES-PLAY.md` § J1). Une seule entrée ne prouverait pas que les
 * feuilles de journal sont balayées pour chaque ligne, et la couverture n'est
 * acquise que si CHAQUE instance rougit. Seule celle qui porte le DÉPLACEMENT
 * porte `origine` : l'invariant est
 * `journal.every(e => e.origine === undefined || e.role === 'moteur')`, et une
 * fixture qui le violerait enseignerait la faute. La troisième n'en porte pas —
 * un jalon franchi n'est pas une commande qu'un joueur a tapée.
 *
 * LES DEUX VALEURS D'`effet` SONT INSTANCIÉES, et ce n'est pas du zèle : une
 * fixture qui ne montrerait que `'applique'` laisserait `'sans_effet'` sans un
 * seul exemplaire au dépôt, c'est-à-dire sans modèle à copier — et c'est
 * précisément la valeur dont KR-247 dit qu'elle se confond avec « pas demandé ».
 *
 * LES DEUX `texte` SONT DES RELEVÉS D'ÉTAT. Cette fixture est le SEUL exemplaire
 * de ligne de journal du dépôt : elle est donc LE MODÈLE, et ce qu'elle montre
 * sera recopié. Vocabulaire admis, liste fermée : les verbes du registre clos en
 * MAJUSCULES, les noms de champs d'`EtatMonde` en bas de casse, des identifiants
 * `espace.slug` venus du dossier, et les séparateurs `>`, `:`, `→`. Rien d'autre —
 * ni une phrase, ni un mot que l'auteur a tapé, ni un caractère que le joueur a
 * tapé.
 *
 * ELLE NE RÉFÉRENCE AUCUN DOSSIER RÉEL. Aucun validateur ne la lit, aucune de ses
 * références n'est résolue : sa seule fonction est de porter une valeur sous
 * CHAQUE chemin de feuille de la session. Les identifiants sont empruntés à
 * `dossier-minimal.json` pour rester lisibles, rien de plus.
 *
 * `attente` INSTANCIÉE depuis le lot `contrat` de la n° 10 (`moteur-interprete`) :
 * quatrième racine porteuse de la table d'audience, et ses deux feuilles
 * (`question`/`saisie`) sont les DEUX PREMIÈRES lignes `'ia'` de ce fichier —
 * sans instance ici, les quatre chemins (`attente`, `.type`, `.question`,
 * `.saisie`) seraient des lignes MORTES le jour même où ils sont écrits, même
 * précédent que `journal[].deltas[].*` à l'itération 3. `question` finit par
 * un point d'interrogation et tient sous 120 caractères (borne réelle du
 * validateur, `PRECISION_CARACTERES_MAX`) ; `saisie` est la forme NORMALISÉE
 * (espaces collapsés) qu'`assemblerInterprete` aurait injectée — même doctrine
 * que le reste du fichier : une valeur PLAUSIBLE, jamais un dossier réel.
 *
 * `recit` INSTANCIÉ depuis le lot `contrat` de la n° 10 it2, sur l'entrée qui porte
 * `origine` — et sur elle SEULE : l'invariant est
 * `journal.every(e => e.recit === undefined || e.origine !== undefined)`, et une
 * fixture qui le violerait enseignerait la faute. C'EST LA SEULE PROSE DU FICHIER,
 * et l'exception au vocabulaire clos ci-dessus est nommée plutôt que tue : `texte`
 * reste un relevé d'état, `recit` est la phrase que le NARRATEUR a rendue pour ce
 * pas — registre joueur, vouvoiement, présent, aucun identifiant, aucune question.
 * Sans instance, la ligne `journal[].recit` de la table serait morte.
 *
 * `jet` INSTANCIÉ depuis le lot `contrat` de la n° 11 (`moteur-arbitre`, it2), SUR LA
 * MÊME ENTRÉE que `recit` — même invariant : `journal.every(e => e.jet === undefined ||
 * e.origine !== undefined)`. SANS `lieu_id` (§8 #4 du plan d'it2, KR-013) : seuls
 * `carac`/`tc` y entrent, les rangs que R2 a choisis, jamais un chemin dérivable de
 * `monde.lieu_courant`. Sans instance, les deux lignes `journal[].jet.carac`/`.tc` de la
 * table seraient mortes le jour même où elles sont écrites.
 *
 * `interlocuteur` INSTANCIÉ depuis le lot `contrat` de la n° 12 (`moteur-acteurs`, it1),
 * SUR LA MÊME ENTRÉE que `recit`/`jet` — ce balayage d'audience ne juge pas la
 * VRAISEMBLANCE d'un pas (un `aller` qui porterait aussi un `interlocuteur` est une
 * COMBINAISON ARTIFICIELLE, même précédent que `jet` déjà empilé sur la même entrée
 * `origine: 'aller'`, qu'aucune partie réelle ne produirait) : sa seule fonction est de
 * porter une valeur sous CHAQUE chemin de feuille de la session. Sans instance, la ligne
 * `journal[].interlocuteur` de la table serait morte le jour même où elle est écrite.
 *
 * `memoire` INSTANCIÉE NON NULLE depuis le lot `contrat` de la n° 10 it3 — sans elle, ses
 * quatre lignes de feuille (`…fait`, `…sur[]`, `…texte`, `…jusqu_au_pas`) seraient MORTES
 * le jour même. Elle ENSEIGNE LES INVARIANTS qu'elle illustre, et c'est pourquoi l'horloge
 * est passée de 7 à 17 : un résumé qui couvre jusqu'au pas 10 n'est LÉGAL qu'à partir du
 * pas 15 (I2 : `jusqu_au_pas ≤ borneDeFenetre(horloge.tour)`). DEUX faits, dont l'un à
 * DEUX ancres (arité maximale) et l'autre ancré sur un objet POSSÉDÉ — des `lieu.*` et
 * des `objet.*` seulement (I5) ; des phrases au registre joueur, sans identifiant.
 *
 * `confiance` INSTANCIÉE depuis le lot `contrat` de la n° 12 (`moteur-acteurs`,
 * it3), SUR `pnj.aldur-le-sage` SEULEMENT — l'autre entrée, `pnj.corvin-le-marchand`,
 * reste SANS ce champ : un champ optionnel à vie doit rester absent QUELQUE PART
 * dans cette fixture, sinon « absent ≠ vide » n'y serait jamais démontré. VALEUR
 * NON DÉFAUT (`2`, jamais `CONFIANCE_DEPART` = `0`) — même doctrine que `heros`
 * ci-dessous : une sentinelle au défaut serait indistinguable d'un champ jamais
 * lu. Sans instance, la ligne `monde.pnj.<id>.confiance` de la table serait
 * MORTE le jour même où elle est écrite.
 *
 * `etape_plan` INSTANCIÉE depuis le lot `contrat` de la n° 14 (`moteur-horloge`, it1), SUR
 * `pnj.aldur-le-sage` AUSSI, et `pnj.corvin-le-marchand` reste SANS : « absent ≠ présent »
 * y est démontré sur deux entrées, comme pour `confiance`. VALEUR NON DÉFAUT (`rang: 1`,
 * jamais `0`) : ABSENT ≡ `rang: 0` (`docs/REGLES-PLAY.md` § J2), donc une sentinelle à
 * `0` serait indistinguable d'un champ jamais écrit — même doctrine que `confiance: 2`.
 * Sans instance, la ligne `monde.pnj.<id>.etape_plan.rang` de la table serait MORTE le
 * jour même où elle est écrite.
 *
 * `depuis` INSTANCIÉ depuis le lot `contrat` de la n° 14 (`moteur-horloge`, it2), DANS LE
 * MÊME OBJET `etape_plan` que `rang` — c'est l'écriture d'UN avancement, les deux clés
 * ensemble (`docs/REGLES-PLAY.md` § J2, règle 6). VALEUR NON DÉFAUT (`12`, jamais `0`) ET
 * DISTINCTE DE `horloge.tour` (`17`) : le pas où le personnage est entré dans son étape
 * courante est un pas PASSÉ (`depuis ≤ horloge.tour` est la seule relation que le produit
 * puisse écrire), et une sentinelle égale au pas courant ferait passer pour « avancé à ce
 * pas » un personnage que la partie a laissé en place depuis cinq pas. `pnj.corvin-le-marchand`
 * reste SANS `etape_plan` : « sans `depuis` » y est démontré par ABSENCE de l'objet, et
 * « `rang` sans `depuis` » (la forme de 0.7.21) l'est par le TYPE, dans
 * `sessionCouverture.test.ts`. Sans instance, la ligne
 * `monde.pnj.<id>.etape_plan.depuis` de la table serait MORTE le jour même où elle est écrite.
 *
 * `climat_actif` INSTANCIÉ depuis le lot `contrat` de la n° 14 (`moteur-horloge`, it4), DANS
 * `horloge` — ses deux feuilles (`id`, `depuis`) sont les deux lignes `'moteur'` neuves de la
 * table : sans instance ici, elles seraient MORTES le jour même où elles sont écrites.
 * L'identifiant est EMPRUNTÉ à `dossier-minimal.json` (`climat.pluie-de-cendres`, durée 3),
 * et `depuis` est un pas PASSÉ — `15 < 17 = horloge.tour`, jamais `0` ni le pas courant :
 * `tour − depuis = 2 < 3`, donc l'état que la fixture montre est celui d'un climat ENCORE
 * actif, la seule relation que le moteur puisse écrire sous cette durée. Sans cela, une
 * fixture à `depuis = 17` serait indistinguable d'un climat qui vient de s'allumer, et à
 * `depuis = 0` d'un champ jamais écrit.
 *
 * `heros` INSTANCIÉ depuis le lot `contrat` de la n° 11 (`moteur-arbitre`, it1) —
 * SENTINELLE délibérément NON DÉFAUT sur les trois axes que l'invariance de
 * `copilote/contexte.test.ts` vérifie : `name` n'est pas une chaîne vide, aucune
 * `caracs` n'est à 4 (la valeur de départ de `charCreation.ts`), `pv` ≠ `pvMax` et
 * `pe` ≠ `peMax` (un héros frais serait indistinguable d'un champ jamais lu). Sans
 * instance ici, les neuf lignes `heros.*` de la table seraient MORTES le jour même
 * où elles sont écrites — même précédent que `journal[].deltas[].*` à l'itération 3.
 *
 * `combat` INSTANCIÉ depuis le lot `contrat` de la n° 13 (`moteur-combat`, it1) — sixième
 * racine porteuse, et ses deux feuilles (`monstre_ref`, `postures[]`) sont les deux lignes
 * `'moteur'` neuves de la table : sans instance ici, elles seraient MORTES le jour même où
 * elles sont écrites. LES TROIS POSTURES SONT JOUÉES, DANS UN ORDRE QUI N'EST NI CELUI DU
 * REGISTRE NI SA REVERSE : `postures[]` est le seul tableau de la fixture dont l'ORDRE
 * est l'information (le rejeu le consomme round après round, KR-292), et une fixture qui
 * le triait enseignerait qu'il est sans importance. `monstre_ref` est emprunté, comme les
 * autres identifiants, à `dossier-minimal.json` ; l'événement correspondant est DÉJÀ
 * consommé plus haut (`evenements_consommes`), ce qui est exactement l'état d'un combat
 * ouvert — l'événement se consomme à l'OUVERTURE, jamais à la clôture.
 *
 * `fuite` INSTANCIÉE depuis le lot `contrat` de la n° 13 `moteur-combat` it2 (KR-297) —
 * troisième feuille de `combat`, sans instance ici la ligne `combat.fuite` de la table
 * serait MORTE le jour même où elle est écrite. Elle est posée APRÈS les trois postures :
 * c'est le seul ordre que le produit puisse écrire, `jouerPosture` refusant toute posture
 * une fois `fuite` posée, et c'est celui que le rejeu consomme. Son type est le littéral
 * `true`, jamais `false` : un champ optionnel à vie est ABSENT ou vrai.
 */
export const SESSION_SATUREE: EtatSession = {
	schema: 1,
	dossier_id: 'dossier-minimal',
	dossier_maj: '2026-09-20T10:00:00.000Z',
	graine_alea: 424242,
	horloge: { tour: 17, climat_actif: { id: 'climat.pluie-de-cendres', depuis: 15 } },
	monde: {
		lieu_courant: 'lieu.val-cendre',
		lieux_visites: ['lieu.val-cendre', 'lieu.le-fanal'],
		objets_possedes: ['objet.clef-de-basalte'],
		indices_connus: ['indice.cendres-tiedes', 'indice.sceau-brise'],
		jalons_atteints: ['jalon.premiere-nuit'],
		evenements_consommes: ['evenement.embuscade-du-fanal'],
		pnj: {
			'pnj.aldur-le-sage': { a_dit: ['indice.sceau-brise'], confiance: 2, etape_plan: { rang: 1, depuis: 12 } },
			'pnj.corvin-le-marchand': { a_dit: ['indice.cendres-tiedes'] },
		},
	},
	journal: [
		{ tour: 17, role: 'joueur', texte: '> ALLER lieu.val-cendre' },
		{
			tour: 17,
			role: 'moteur',
			texte: 'lieu_courant : lieu.le-fanal → lieu.val-cendre',
			origine: 'aller',
			recit: 'Vous descendez dans le val ; la cendre crisse sous vos pas et le vent retombe.',
			jet: { carac: 'AG', tc: 'TC2' },
			interlocuteur: 'pnj.aldur-le-sage',
		},
		{
			tour: 17,
			role: 'moteur',
			texte: 'jalons_atteints : jalon.premiere-nuit',
			deltas: [
				{ delta: 'atteindre_jalon', cibles: ['jalon.premiere-nuit'], effet: 'applique' },
				{ delta: 'reveler_indice', cibles: ['indice.sceau-brise'], effet: 'sans_effet' },
			],
		},
	],
	memoire: {
		faits_etablis: [
			{ fait: 'Le val garde la chaleur de la cendre longtemps après la nuit.', sur: ['lieu.val-cendre'] },
			{
				fait: 'La clef de basalte est tiède quand on approche du fanal.',
				sur: ['objet.clef-de-basalte', 'lieu.le-fanal'],
			},
		],
		resume: {
			texte: 'Vous avez quitté le fanal au crépuscule et suivi la route des cendres jusqu’au val.',
			jusqu_au_pas: 10,
		},
	},
	attente: {
		type: 'clarification',
		question: 'Voulez-vous rejoindre le marché des cendres ou la tour effondrée ?',
		saisie: 'je vais au marche',
	},
	heros: {
		name: 'Aldric le Téméraire',
		caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: 9, IG: 4, SE: 10, CA: 3 },
		pvMax: 21,
		pv: 14,
		peMax: 8,
		pe: 3,
		mcBonus: 0,
		xp: 12,
	},
	combat: {
		monstre_ref: 'bestiaire.gobelin',
		postures: ['precise', 'normale', 'defensive'],
		fuite: true,
	},
}
