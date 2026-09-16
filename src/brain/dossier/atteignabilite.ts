import type { Delta } from './deltas'
import type { ExprNode } from './expr'
import { PREDICATES, type PredicatId } from './predicates'
import type { Dossier } from './types'

/**
 * HYPOTHÈSES DATÉES D'ATTEIGNABILITÉ — 2026-09-16, itérations 6 et 7 de la n° 6.
 *
 * Ce module conclut « le joueur peut obtenir cet indice » sur un document
 * STATIQUE, alors qu'obtenir est un geste de SESSION. L'écart est comblé par des
 * hypothèses, pas par une preuve : elles sont écrites ICI, dans le fichier qui
 * les utilise, et nulle part ailleurs — un raccourci assumé qu'aucun lecteur ne
 * retrouve est indiscernable d'un défaut. Même forme et même domicile que KR-224
 * (« monde ouvert »), dont la clause rejoindra cette liste le jour où
 * l'atteignabilité des LIEUX entrera ici ; ne pas l'écrire aujourd'hui, aucun
 * code ne la porte encore.
 *
 * H1 — LE MOTEUR INSCRIT AU CARNET LES CIBLES DE `mene_a[]` À L'ACQUISITION DE
 * LEUR AMONT. C'est ce qui fait d'une arête `mene_a` un PRODUCTEUR, donc ce qui
 * autorise la saturation. Rien ne l'établit : `types.ts` dit que l'amont
 * « débloque » ses cibles — l'acquisition de l'amont est NÉCESSAIRE, sans qu'il
 * soit dit qu'elle suffise —, et aucun moteur n'existe encore pour trancher. Le
 * point fixe n'utilise QUE la nécessité : un indice dont l'amont est hors
 * d'atteinte est hors d'atteinte sous les deux lectures. H1 ne peut donc, ici,
 * que sous-compter. Le jour où la n° 9 retient l'autre lecture (une liste de
 * pistes servie au narrateur, sans octroi automatique), c'est le SEUIL
 * `>= 2 → silence` qui devient trop généreux, jamais le point fixe : la
 * correction se fait sur le compte, ici, en UN endroit.
 * Sous les deux lectures, l'octroi reste un geste du CODE. Le modèle ne peut pas
 * accorder un indice ; il raconte celui que le moteur a inscrit. Cet invariant
 * n'est pas redit ici : il est écrit à `types.ts` (`verite`,
 * `formulation_joueur`, `revele_comment`) et c'est lui qui donne son sens à toute
 * cette analyse.
 *
 * H2 — UNE RACINE EST RÉPUTÉE AMORÇABLE. Ce module sature les ARÊTES ; il
 * n'évalue AUCUNE des portes qui commandent une racine, et les compte donc toutes
 * ouvertes. Ne sont PAS évaluées — liste exhaustive au 2026-09-16, et c'est elle
 * que la tranche « porte morte, producteur fantôme » (n° 8) hérite EN ENTIER :
 *  · les QUATRE portes de `Revelation` sur un savoir (`types.ts`) —
 *    `confiance_min`, `jet`, `contrepartie`, `apres_indice_id` ; `jet` nommément,
 *    parce qu'un dé n'est pas une certitude et que ce module ne lance rien ;
 *  · `savoirs[].revele_si.apres_indice_id`, qui est la SECONDE arête
 *    indice → indice du schéma. La première, `monde.indices[].mene_a[]`, est la
 *    seule que ce module sature. Un lecteur qui croirait le graphe des indices
 *    entièrement saturé se tromperait, et c'est pour lui que cette ligne existe ;
 *  · `charpente.jalons[].declencheur_expr` ABSENT — le jalon ne se déclenche
 *    jamais et son `effet` est un producteur fantôme ;
 *  · `monde.conditions.climat[].effets_regles` — aucun moteur ne sait APPLIQUER
 *    un effet de climat (motif écrit à `controles.ts`, non recopié) ;
 *  · l'atteignabilité du PORTEUR d'un effet — récompense d'une quête jamais
 *    donnée, conséquence d'une résolution jamais atteinte.
 * Toutes ces omissions SUR-COMPTENT les producteurs, donc SOUS-GRADUENT le
 * constat : sur une règle bloquante, l'erreur permise est le faux négatif, jamais
 * le faux positif. C'est ce qui rend la saturation des arêtes livrable SEULE.
 * Le sens d'erreur de la n° 8 est l'INVERSE : fermer une porte RETIRE une racine.
 * Les faux positifs vivent là-bas, jamais ici — et c'est la raison du découpage.
 *
 * H3 — LE SEUL PRODUCTEUR DE `monde.pnj.<id>.a_dit[]` EST UN `savoirs[]` DU
 * PERSONNAGE PORTEUR. C'est ce qui rend `pnj_a_revele(p, i)` décidable sur un
 * document : la PAIRE (p, i) est productible si et seulement si `p` porte un
 * savoir dont l'`indice_id` vaut `i`. Aucun effet de règle n'y supplée —
 * `reveler_indice` écrit la liste des indices CONNUS, jamais le carnet d'un
 * personnage, et il ne le pourrait pas : son arité est 1, il n'a aucun
 * opérande `pnj` par lequel nommer QUI a parlé. Rien d'autre ne l'établit que
 * le commentaire de `predicates.ts` qui nomme le champ ; aucun moteur n'existe
 * encore pour trancher, et la n° 11 pourrait décider que le moteur inscrit
 * aussi `a_dit[]` lorsqu'un indice est révélé À TRAVERS un personnage par un
 * autre chemin — une résolution d'événement jouée en scène, par exemple.
 * C'EST LA SEULE HYPOTHÈSE DE CE FICHIER DONT L'ERREUR IRAIT DANS LE SENS
 * INTERDIT. H1 et H2 ne peuvent que SUR-COMPTER les producteurs, donc
 * sous-graduer le constat ; celle-ci, si la n° 11 la contredit, ferait
 * déclarer sans chemin une condition que le moteur accomplirait — un FAUX
 * POSITIF sous une règle BLOQUANTE. Elle se corrige en UN endroit, la ligne
 * `pnj_a_revele` de la table d'établissement, et nulle part ailleurs.
 * COROLLAIRE DE RÉDACTION, sans lequel l'hypothèse ne dit rien : la paire
 * s'évalue JOINTEMENT. Deux feuilles indépendantes — « ce personnage existe »
 * et « cet indice a un producteur » — seraient vraies ensemble sans qu'aucun
 * savoir ne les relie, et le prédicat serait déclaré productible à tort.
 */

/**
 * LA FAMILLE d'un chemin producteur. Trois familles comptées, trois familles
 * offertes par la remédiation — mais DEUX sans condition et la TROISIÈME sous
 * condition depuis la saturation d'it6 : une arête ne vaut un remède que si son
 * amont est lui-même produit, et la phrase de l'auteur explicite cette réserve.
 * L'isomorphisme reste une contrainte de rédaction mesurée, pas une coïncidence
 * — une quatrième famille comptée sans quatrième remède offert rendrait la
 * consigne incomplète sans qu'aucun test rougisse. Le TEXTE, lui, vit à
 * `controles.ts` : ce module compte, il ne raconte pas.
 */
export type FamilleDeSource = 'savoir' | 'delta' | 'mene_a'

/**
 * UNE SOURCE qui fait parvenir un indice au joueur. Un OBJET plutôt que le seul
 * mot de la famille, et c'est ce qui laisse la forme ouverte sans la rouvrir.
 *
 * LE PORTEUR DE L'ARÊTE N'Y EST PAS, et il n'y entre pas « pour plus tard » : le
 * point fixe RECOMPTE les arêtes depuis `dossier.monde.indices` à l'étape (d),
 * si bien qu'un champ posé ici n'aurait aucun lecteur — un champ exporté à zéro
 * lecteur est une dette, jamais une préparation (arbitrage d'it6).
 */
export interface SourceIndice {
	famille: FamilleDeSource
}

/**
 * LES QUATRE EMPLACEMENTS D'EFFETS DE RÈGLE du dossier, APLATIS dans l'ordre de
 * `CHEMINS_DE_DELTAS` — récompense de quête, conséquence de résolution, effet de
 * climat, effet de jalon. Lus en ACCÈS TYPÉS, jamais par un marcheur de chemins
 * générique : `sitesDe` est PRIVÉE à `validate.ts` et son import est déjà
 * interdit ici par un balayage de source ; en réécrire un créerait un SECOND
 * moteur de traversée du schéma, non typé, qui dériverait en silence de la
 * grammaire figée du premier.
 *
 * UNE SEULE TRAVERSÉE POUR DEUX FILTRES — `reveler_indice` pour les indices
 * produits, `donner_objet` pour les objets donnés. Deux copies de ces quatre
 * accès dériveraient le jour où un cinquième emplacement entrerait, exactement
 * comme dériveraient deux copies du filtre.
 */
function effetsDeRegle(dossier: Dossier): readonly Delta[] {
	return [
		...dossier.monde.quetes.flatMap((quete) => quete.recompense),
		...dossier.monde.evenements.flatMap((evenement) =>
			evenement.resolutions.flatMap((resolution) => resolution.consequence),
		),
		...dossier.monde.conditions.climat.flatMap((climat) => climat.effets_regles),
		...dossier.charpente.jalons.flatMap((jalon) => jalon.effet),
	]
}

/**
 * L'INDEX DES PRODUCTEURS — pour chaque identifiant d'indice CITÉ quelque part
 * dans le dossier, les sources qui le produisent, ARÊTES SATURÉES.
 *
 * TROIS ÉTATS ET NON DEUX, et c'est ce qui donne DEUX messages à l'appelant sans
 * qu'un seul champ soit ajouté nulle part :
 *  · clé ABSENTE — aucune source brute ne cite cet indice : le zéro NU ;
 *  · clé PRÉSENTE, tableau VIDE — des sources brutes le citent, et AUCUNE n'a
 *    survécu à la saturation : le zéro SANS RACINE ;
 *  · clé présente, tableau non vide — le compte, tel que les trois seuils de
 *    « indice sans source » le lisent (`0 → bloquant`, `1 → alerte`, `≥ 2 →
 *    silence`).
 *
 * LE TROISIÈME ÉTAT N'EST PAS « BOUCLE », ET LA NUANCE A DÉJÀ COÛTÉ UNE PHRASE
 * FAUSSE : en remontant les amonts d'un indice non produit dans un graphe FINI,
 * on tombe sur un cycle OU sur une chaîne simplement non racinée. La seconde
 * configuration est la plus probable en pratique — un auteur qui chaîne
 * `A → B → C` et oublie de raciner `A` —, et `[{ id: 'a', mene_a: ['b'] },
 * { id: 'b' }]` la produit sans le moindre cycle. Le cycle n'est qu'un
 * EXEMPLAIRE de « aucun amont atteignable », jamais sa définition.
 *
 * L'ÉQUIVALENCE QUI REND LE SECOND MESSAGE VRAI PAR CONSTRUCTION, écrite ici
 * parce que c'est elle, et non la relecture de la phrase, qui l'empêche de
 * dériver : « tableau VIDE » ÉQUIVAUT à « toutes les sources brutes sont des
 * arêtes `mene_a`, et aucune ne survit ». Une source de famille `savoir` ou
 * `delta` est en effet reconduite TELLE QUELLE par l'étape (d) — elle force donc
 * un compte d'au moins un, et un tableau vide exclut sa présence.
 *
 * Pure, totale, et elle ne ferme sur RIEN — en particulier pas sur `CONTROLES`.
 * C'est cette propriété-là, et non sa taille, qui l'a rendue déplaçable telle
 * quelle.
 *
 * CONTRAT D'EXTRACTION D'IT6, TENU : elle a gardé ce NOM en traversant vers ce
 * module, où elle a été DÉPLACÉE puis saturée en DEUX TEMPS SÉPARÉS, la porte
 * passée aux deux. Un déplacement se relit en diff ; une réécriture sous un
 * autre nom passe inaperçue.
 *
 * LES SIX CHEMINS, en UNION et jamais en branches disjointes — deux branches
 * disjointes laissent entre elles un indice à zéro savoir et un seul effet, donc
 * un silence sur le cas même que la règle existe pour attraper :
 *  · `monde.personnages[].savoirs[].indice_id` ;
 *  · les QUATRE sites de `CHEMINS_DE_DELTAS` filtrés sur `reveler_indice` —
 *    récompense de quête, conséquence de résolution, effet de climat, effet de
 *    jalon. Leur TRAVERSÉE vit dans `effetsDeRegle`, juste au-dessus, et le
 *    motif du lecteur typé y est écrit UNE fois ;
 *  · `monde.indices[].mene_a[]`.
 *
 * LE CLIMAT EST COMPTÉ bien qu'aucun moteur ne sache aujourd'hui APPLIQUER un
 * effet de climat : sur une règle bloquante, l'erreur permise est le faux
 * négatif, jamais le faux positif.
 *
 * `mene_a` EST SATURÉ PAR POINT FIXE, JAMAIS PLUS LU À PLAT : une arête ne
 * compte un producteur QUE si son amont est lui-même produit. CE QUE LA LECTURE
 * À PLAT D'IT3 NE COUVRAIT PAS, et que celle-ci couvre : un CYCLE sans aucune
 * source extérieure (`A.mene_a = ['B']`, `B.mene_a = ['A']`) — chacun des deux
 * s'y comptait un producteur et remontait ALERTE, quand il est en vérité hors
 * d'atteinte. Deux assertions livrées basculent donc d'ALERTE à BLOQUANT, et
 * c'est le paiement d'une dette assumée par it3, pas une régression.
 *
 * L'ALGORITHME, EN QUATRE TEMPS — et LE PORTEUR DE L'ARÊTE N'Y EST JAMAIS
 * STOCKÉ :
 *  (a) l'index BRUT, par les six chemins ci-dessus ;
 *  (b) `P`, le NOYAU — les indices dont l'index brut porte au moins une source
 *      de famille AUTRE que `mene_a`, c'est-à-dire ceux qu'aucune arête n'a
 *      amenés ;
 *  (c) la RELAXATION par liste de travail, sur les arêtes RELUES dans
 *      `dossier.monde.indices`, jusqu'au POINT FIXE : `x` dans `P` et `y` dans
 *      `x.mene_a` implique `y` dans `P`. Chaque indice entre au plus une fois
 *      dans la liste de travail, ce qui borne la boucle sans compteur de garde ;
 *  (d) la RECONSTRUCTION — les sources non-`mene_a` reconduites telles quelles,
 *      PLUS une entrée `{ famille: 'mene_a' }` par OCCURRENCE d'arête
 *      survivante. PAR OCCURRENCE et non par cible distincte : un `mene_a` qui
 *      cite deux fois la même cible comptait deux fois à plat, et
 *      l'iso-comportement l'exige quand tout est atteignable.
 *
 * UNE PASSE NE SUFFIT PAS, et c'est la seule raison du point fixe : sur une
 * chaîne dont `monde.indices` est ordonné à rebours, une passe unique en ordre
 * de document verrait un maillon avant que son amont soit entré dans `P`. Un
 * filtre « racine seulement » se tromperait symétriquement, en ne saturant qu'un
 * maillon.
 *
 * IL FAUT QUATRE MAILLONS POUR TENIR CETTE PROMESSE, et le chiffre est MESURÉ,
 * pas choisi : sur une chaîne à trois, un mutant qui GÈLE la borne de la boucle
 * de relaxation à une seule itération reste VERT. Le maillon intermédiaire entre
 * bien dans le `Set` à la première itération sans jamais être dépilé, et l'étape
 * (d) ne teste que l'appartenance FINALE de l'amont — elle ne sait pas combien
 * d'itérations l'y ont mis. Le quatrième maillon est le premier qu'une SECONDE
 * itération est seule à atteindre. `atteignabilite.test.ts` le tient donc sur
 * quatre, et la version à trois de ce commentaire avait traversé deux tours de
 * comité en affirmant une couleur de test que personne n'avait exécutée.
 *
 * ET LE SENS DE L'ARÊTE SE PROUVE À PART : qu'un indice pointe VERS un indice
 * produit ne le produit pas. Aucune chaîne, même longue, ne l'exige — dans une
 * chaîne rompue le maillon orphelin est ISOLÉ, donc une relaxation non orientée
 * n'a rien à lui propager et reste verte. Il y faut un nœud RELIÉ, et c'est le
 * second témoin de la suite.
 */
export function producteursParIndice(dossier: Dossier): Map<string, SourceIndice[]> {
	const producteurs = new Map<string, SourceIndice[]>()

	const ajouter = (indiceId: string, famille: FamilleDeSource): void => {
		const sources = producteurs.get(indiceId)
		if (sources === undefined) producteurs.set(indiceId, [{ famille }])
		else sources.push({ famille })
	}

	for (const personnage of dossier.monde.personnages) {
		for (const savoir of personnage.savoirs) ajouter(savoir.indice_id, 'savoir')
	}

	// Le filtre sur `reveler_indice` est écrit UNE FOIS, et un balayage de source
	// tient cette unicité : quatre copies dériveraient le jour où un cinquième
	// emplacement entrerait.
	for (const effet of effetsDeRegle(dossier)) {
		if (effet.delta !== 'reveler_indice') continue
		for (const cible of effet.cibles) ajouter(cible, 'delta')
	}

	for (const indice of dossier.monde.indices) {
		for (const vise of indice.mene_a ?? []) ajouter(vise, 'mene_a')
	}

	// (b) LE NOYAU `P` — tout indice qu'au moins une source NON-`mene_a` produit.
	// C'est le seul endroit où la FAMILLE est lue, et elle l'est comme un test, pas
	// comme une donnée que l'on conserve.
	const atteignables = new Set<string>()
	for (const [indiceId, sources] of producteurs) {
		if (sources.some((source) => source.famille !== 'mene_a')) atteignables.add(indiceId)
	}

	// LES ARÊTES, RELUES depuis la collection plutôt que stockées à l'index : deux
	// entrées de même identifiant sont CONCATÉNÉES, jamais écrasées, sinon (d)
	// compterait moins d'occurrences que la lecture à plat sur un dossier que le
	// validateur refuserait mais que cette fonction, elle, se promet de traverser.
	// PROMESSE TENUE PAR UN TÉMOIN et non par ces quatre lignes — `atteignabilite.
	// test.ts`, « deux entrees de meme identifiant voient leurs aretes concatenees » :
	// remplacer ce couple par un `set` laissait la suite entièrement verte.
	const aretes = new Map<string, string[]>()
	for (const indice of dossier.monde.indices) {
		const sortantes = aretes.get(indice.id)
		if (sortantes === undefined) aretes.set(indice.id, [...(indice.mene_a ?? [])])
		else sortantes.push(...(indice.mene_a ?? []))
	}

	// (c) LA RELAXATION — liste de travail, curseur qui avance sur un tableau qui
	// grandit. Le `Set` garantit qu'un indice n'y entre qu'UNE fois : la boucle est
	// bornée par le nombre d'indices, et le point fixe est atteint quand le curseur
	// rejoint la fin.
	const aVisiter = [...atteignables]
	for (let rang = 0; rang < aVisiter.length; rang += 1) {
		for (const vise of aretes.get(aVisiter[rang]) ?? []) {
			if (atteignables.has(vise)) continue
			atteignables.add(vise)
			aVisiter.push(vise)
		}
	}

	// LES OCCURRENCES D'ARÊTES SURVIVANTES, par cible — une arête ne survit que si
	// son AMONT est atteignable.
	const survivantes = new Map<string, number>()
	for (const [amont, cibles] of aretes) {
		if (!atteignables.has(amont)) continue
		for (const vise of cibles) survivantes.set(vise, (survivantes.get(vise) ?? 0) + 1)
	}

	// (d) LA RECONSTRUCTION, sur le MÊME ensemble de clés que l'index brut : une
	// clé qui disparaîtrait ici rendrait « servi, mais par aucune racine »
	// indistinguable de « rien ne le cite », et c'est cette distinction-là qui
	// porte les deux messages.
	const satures = new Map<string, SourceIndice[]>()
	for (const [indiceId, sources] of producteurs) {
		const retenues = sources.filter((source) => source.famille !== 'mene_a')
		for (let rang = 0; rang < (survivantes.get(indiceId) ?? 0); rang += 1) retenues.push({ famille: 'mene_a' })
		satures.set(indiceId, retenues)
	}

	return satures
}

/**
 * UNE FEUILLE DE CONDITION QUE RIEN DU DOSSIER NE PEUT ÉTABLIR.
 *
 * Le module COMPTE, il ne raconte pas : il rend le LIBELLÉ français du prédicat
 * et les identifiants visés. La phrase, le retour vers le champ fautif et le
 * classement du constat appartiennent à son appelant.
 */
export interface FeuilleInaccomplissable {
	/** Libellé FRANÇAIS du prédicat — `PREDICATES[id].label`, résolu ICI. Jamais la clé. */
	readonly predicat: string
	/** Les identifiants visés, DANS L'ORDRE de `refKinds`. Arité 1 ou 2. */
	readonly cibles: readonly string[]
}

/**
 * L'ÉTAT DU DOSSIER réduit à ce que les trois prédicats qui MORDENT ont besoin
 * de lire, calculé UNE fois par condition. Privé, et il le reste :
 * `indicesProduits` n'est qu'une projection de `producteursParIndice` (« au
 * moins un producteur APRÈS saturation »), et l'exporter en ferait un second
 * index à tenir en phase avec le premier.
 */
interface EtatDuDossier {
	dossier: Dossier
	indicesProduits: ReadonlySet<string>
	objetsDonnes: ReadonlySet<string>
}

/**
 * CE QU'IL FAUT AU DOSSIER POUR ÉTABLIR CHAQUE PRÉDICAT — une ligne par
 * identifiant de `PREDICATES`, `Record` TOTAL donc exhaustif PAR COMPILATION
 * (KR-117) : un huitième prédicat ne compile pas tant que personne n'a décidé ce
 * que le linter en fait.
 *
 * TROIS LIGNES MORDENT, QUATRE SONT « NON ÉVALUÉES À IT7 » — et c'est le mot
 * juste, jamais « toujours vraie » : un commentaire plus large que le fait est
 * exactement KR-199. Les deux portes de RACINE (`declencheur_expr` d'un jalon,
 * d'un événement) sont la charge de la tranche « porte morte, producteur
 * fantôme », et les deux prédicats de LIEU relèvent de KR-224 — le schéma n'a
 * aucun graphe de praticabilité, donc « ce lieu est atteint » n'est pas
 * décidable ici. Rendre `true` là où l'on ne sait pas est la seule direction
 * permise sous une règle bloquante.
 *
 * `possede_objet` LIT UN VERBE NOMMÉ, jamais `refKinds.includes('objet')` :
 * `retirer_objet` porte le même espace de noms et est un producteur NÉGATIF —
 * le dériver compterait une SOUSTRACTION comme un don. Le trou n'est pas
 * hypothétique : les deux verbes sont au registre aujourd'hui, et un témoin les
 * sépare.
 *
 * `pnj_a_revele` s'évalue JOINTEMENT (H3) : la PAIRE, jamais deux feuilles
 * indépendantes.
 */
const ETABLISSEMENT: Record<PredicatId, (etat: EtatDuDossier, cibles: readonly string[]) => boolean> = {
	possede_objet: (etat, cibles) => etat.objetsDonnes.has(cibles[0]),
	indice_connu: (etat, cibles) => etat.indicesProduits.has(cibles[0]),
	pnj_a_revele: (etat, cibles) =>
		etat.dossier.monde.personnages.some(
			(personnage) =>
				personnage.id === cibles[0] && personnage.savoirs.some((savoir) => savoir.indice_id === cibles[1]),
		),
	jalon_atteint: () => true,
	evenement_consomme: () => true,
	lieu_visite: () => true,
	lieu_courant_est: () => true,
}

/**
 * L'EXHAUSTIVITÉ DU PARCOURS, PORTÉE PAR LE COMPILATEUR ET NON PAR UNE
 * RELECTURE — et c'est la CONDITION à laquelle ce module est admis comme second
 * lecteur d'`ExprNode`.
 *
 * Le `switch` ci-dessous décide des QUATRE opérateurs ; son `default` passe le
 * nœud ici, où le type `never` du paramètre EXIGE que la branche soit
 * inatteignable. Un cinquième opérateur ajouté à l'union casse donc `tsc` à CET
 * APPEL. Sans cette marque, il tomberait en SILENCE dans le `default` — le seul
 * mode de panne qu'un lecteur d'arbre puisse avoir quand il ne re-dérive pas la
 * grammaire, et exactement ce que la garde de couture d'`expr.test.ts` existe
 * pour empêcher. Une cascade de `if (noeud.op === …)` ne l'aurait PAS porté :
 * TypeScript n'en vérifie pas l'exhaustivité.
 *
 * ELLE REND `null`, jamais le nœud : si un document forçait un jour cette
 * branche à l'exécution malgré le type, `null` va dans le sens d'erreur permis —
 * le FAUX NÉGATIF —, là où rendre le nœud ferait lire `cibles` à un appelant qui
 * n'en trouverait aucune.
 */
function aucunVerdict(_operateur: never): null {
	return null
}

/**
 * LA TRAVERSÉE — UN CAS PAR OPÉRATEUR, et pas un de plus : les quatre opérateurs
 * d'`ExprNode` sont une union CLOSE, et le `default` la tient FERMÉE au
 * compilateur.
 */
function feuilleSansEtablissement(etat: EtatDuDossier, noeud: ExprNode): FeuilleInaccomplissable | null {
	switch (noeud.op) {
		// `non` → `null` SANS DESCENDRE, et c'est la ligne la plus importante des
		// quatre. Sous une négation, la productibilité de la feuille ne dit RIEN : les
		// sept prédicats lisent des champs de session qui partent VIDES, si bien que
		// `non(P)` est vrai au tour zéro. Descendre et inverser allumerait un faux
		// positif sous une règle BLOQUANTE — la seule direction que tout ce module
		// s'interdit.
		case 'non':
			return null

		// `predicat` → la table d'établissement, et rien d'autre.
		case 'predicat':
			if (ETABLISSEMENT[noeud.predicat](etat, noeud.cibles)) return null
			return { predicat: PREDICATES[noeud.predicat].label, cibles: noeud.cibles }

		// `et` → la feuille du PREMIER enfant en défaut, ORDRE DU DOCUMENT. Un rapport
		// de linter se rejoue comme une session : le témoin désigné ne dépend jamais de
		// l'ordre dans lequel on a parcouru l'arbre.
		case 'et': {
			for (const enfant of noeud.enfants) {
				const feuille = feuilleSansEtablissement(etat, enfant)
				if (feuille !== null) return feuille
			}
			return null
		}

		// `ou` → `null` dès qu'UN enfant est accomplissable. Un `ou` est écrit
		// exactement pour offrir un second chemin : exiger toutes ses branches est le
		// faux positif le plus probable de cette fonction. Quand aucune ne tient, le
		// témoin est la feuille du PREMIER enfant, même règle d'ordre que `et`.
		case 'ou': {
			let premiere: FeuilleInaccomplissable | null = null
			for (const enfant of noeud.enfants) {
				const feuille = feuilleSansEtablissement(etat, enfant)
				if (feuille === null) return null
				if (premiere === null) premiere = feuille
			}
			return premiere
		}

		// L'UNION EST CLOSE, et c'est le compilateur qui le dit.
		default:
			return aucunVerdict(noeud)
	}
}

/**
 * LA PREMIÈRE FEUILLE INACCOMPLISSABLE d'une condition — `null` quand la
 * condition est accomplissable.
 *
 * SATISFIABILITÉ, PAS ÉVALUATION — aucun état de session lu ; l'évaluation en
 * session appartient à la n° 9 `moteur-dossier`, et ce module ne la paraphrase
 * pas. SENS D'ERREUR : le FAUX NÉGATIF — dans le doute on rend `null`, seule
 * direction permise sous une règle bloquante. Totale sur un arbre accepté par
 * `validateExpr` ; AUCUNE borne de récursion propre — c'est `PROFONDEUR_MAX_EXPR`
 * chez le validateur qui la lui garantit.
 *
 * ELLE NE RÉUTILISE PAS `collectRefs`, ET C'EST MESURÉ PLUTÔT QUE SUPPOSÉ :
 * celle-là APLATIT le `ou` et DESCEND dans le `non` — juste pour résoudre des
 * références, faux pour la satisfiabilité. Un relevé plat de feuilles, filtré
 * ensuite, allumerait un bloquant sur une condition qui offre un second chemin.
 *
 * ELLE NE RÉSOUT AUCUNE RÉFÉRENCE : une cible qui ne désigne aucune entité du
 * dossier n'est pas son affaire — c'est une anomalie du validateur, et son
 * appelant s'en tait. La frontière est la même que celle de `validateDelta`,
 * qui connaît la FORME d'une cible et jamais son EXISTENCE.
 *
 * AUCUNE MÉMOÏSATION : elle se rappelle à chaque rendu, comme le rapport qui la
 * consomme.
 */
export function premiereFeuilleInaccomplissable(dossier: Dossier, condition: ExprNode): FeuilleInaccomplissable | null {
	// LE COMPTE SATURÉ, RÉUTILISÉ TEL QUEL — jamais un second parcours des
	// producteurs d'indices, qui dériverait du premier au premier chemin ajouté.
	const indicesProduits = new Set<string>()
	for (const [indiceId, sources] of producteursParIndice(dossier)) {
		if (sources.length > 0) indicesProduits.add(indiceId)
	}

	// LE VERBE EST NOMMÉ. `retirer_objet` partage `refKinds: ['objet']` et retire
	// ce que celui-ci donne : dériver le producteur de l'espace de noms compterait
	// les deux.
	const objetsDonnes = new Set<string>()
	for (const effet of effetsDeRegle(dossier)) {
		if (effet.delta !== 'donner_objet') continue
		for (const cible of effet.cibles) objetsDonnes.add(cible)
	}

	return feuilleSansEtablissement({ dossier, indicesProduits, objetsDonnes }, condition)
}
