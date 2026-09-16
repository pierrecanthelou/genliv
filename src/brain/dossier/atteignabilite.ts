import type { Delta } from './deltas'
import type { Dossier } from './types'

/**
 * HYPOTHÈSES DATÉES D'ATTEIGNABILITÉ — 2026-09-16, itération 6 de la n° 6.
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
 *    jalon — lus en ACCÈS TYPÉS, jamais par un marcheur de chemins générique :
 *    `sitesDe` est PRIVÉE à `validate.ts` et son import est déjà interdit ici
 *    par un balayage de source ; en réécrire un créerait un SECOND moteur de
 *    traversée du schéma, non typé, qui dériverait en silence de la grammaire
 *    figée du premier ;
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

	// Un emplacement d'effets, quel que soit son porteur — le filtre sur
	// `reveler_indice` est écrit UNE FOIS, et un balayage de source tient cette
	// unicité : quatre copies dériveraient le jour où un cinquième site entrerait.
	const ajouterEffets = (effets: readonly Delta[]): void => {
		for (const effet of effets) {
			if (effet.delta !== 'reveler_indice') continue
			for (const cible of effet.cibles) ajouter(cible, 'delta')
		}
	}

	for (const personnage of dossier.monde.personnages) {
		for (const savoir of personnage.savoirs) ajouter(savoir.indice_id, 'savoir')
	}

	for (const quete of dossier.monde.quetes) ajouterEffets(quete.recompense)
	for (const evenement of dossier.monde.evenements) {
		for (const resolution of evenement.resolutions) ajouterEffets(resolution.consequence)
	}
	for (const climat of dossier.monde.conditions.climat) ajouterEffets(climat.effets_regles)
	for (const jalon of dossier.charpente.jalons) ajouterEffets(jalon.effet)

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
