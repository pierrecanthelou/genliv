import type { Delta } from './deltas'
import type { ExprNode } from './expr'
import { PREDICATES, type PredicatId } from './predicates'
import type { Dossier, Revelation } from './types'

/**
 * HYPOTHÈSES DATÉES D'ATTEIGNABILITÉ — 2026-09-17, itérations 6, 7 et 9 de la
 * n° 7.
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
 * H2 — UNE RACINE QUE CE MODULE N'ÉVALUE PAS EST RÉPUTÉE AMORÇABLE. DEUX des
 * quatre portes de `Revelation` sont ÉVALUÉES depuis it9 — `contrepartie` et
 * `apres_indice_id` —, et la partition vient de H4, pas d'un arbitrage porte par
 * porte. Ce qui RESTE non évalué, liste exhaustive au 2026-09-17 :
 *  · `revele_si.confiance_min` — le schéma ne nomme AUCUN écrivain : aucun delta
 *    du registre ne modifie une confiance. DÉFINITIVEMENT non évaluable, et non
 *    « pas encore » : sans ce mot, cette liste rétrécirait de zéro à chaque
 *    itération sans que personne ne le dise ;
 *  · `revele_si.jet` — l'écrivain est le DÉ, qu'aucun document n'écrit. Son
 *    verdict serait de surcroît CONSTANT (il existe pour chaque tier un héros qui
 *    réussit), et l'évaluer importerait la couche des RÈGLES dans le linter du
 *    dossier — KR-193 / KR-130, interdiction que la suite de ce module constate
 *    en source plutôt que de la promettre ;
 *  · `monde.conditions.climat[].effets_regles` — aucun moteur ne sait APPLIQUER
 *    un effet de climat (motif écrit à `controles.ts`, non recopié) ;
 *  · l'atteignabilité du PORTEUR d'un effet — récompense d'une quête jamais
 *    donnée, conséquence d'une résolution jamais atteinte ;
 *  · l'atteignabilité d'un JALON ou d'un ÉVÉNEMENT — le résidu VRAI de la ligne
 *    fausse ci-dessous. Ce n'est pas l'ABSENCE de `declencheur_expr` qui
 *    condamne un jalon ; c'est qu'aucun `atteindre_jalon` ne le coche ET
 *    qu'aucune condition accomplissable ne le déclenche. DEUX écrivains, donc H4
 *    ne tranche pas d'elle-même, et c'est la ligne `jalon_atteint` de la table
 *    d'établissement qui attend ce jour-là.
 *
 * ET UNE LIGNE QUI N'AVAIT JAMAIS EU SA PLACE DANS CETTE LISTE — corrigée ici,
 * pas effacée, parce que c'est l'ERREUR qui doit rester lisible : cette liste a
 * porté « `charpente.jalons[].declencheur_expr` ABSENT — le jalon ne se déclenche
 * jamais et son `effet` est un producteur fantôme ». C'est FAUX. `types.ts`
 * déclare cette absence LÉGITIME — « un jalon peut rester coché à la main par le
 * moteur d'un événement. Absent, la condition n'est jamais vérifiée
 * automatiquement, et c'est calme » — et `deltas.ts` porte `atteindre_jalon`,
 * l'écrivain qui le coche. LA CORRECTION EST ÉCRITE POUR QUE L'ERREUR NE SE
 * REFASSE PAS SUR `Evenement.declencheur_expr`, optionnel POUR LE MÊME MOTIF et
 * dans les mêmes termes : « un événement peut rester déclenché par la seule main
 * du narrateur, sans condition formalisée : c'est calme, jamais une alerte ». Un
 * optionnel dont le schéma nomme l'AUTRE écrivain n'est pas une porte morte ;
 * c'est H4 qui tranche, et elle tranche aussi ce cas-là.
 *
 * Les omissions qui restent SUR-COMPTENT les producteurs, donc SOUS-GRADUENT le
 * constat : sur une règle bloquante, l'erreur permise est le faux négatif, jamais
 * le faux positif. FERMER une porte fait l'inverse — elle RETIRE une racine —, et
 * c'est pourquoi les deux portes évaluées le sont sous H4 et sous elle seule.
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
 * C'EST L'UNE DES DEUX HYPOTHÈSES DE CE FICHIER DONT L'ERREUR IRAIT DANS LE
 * SENS INTERDIT — l'autre est H5, et cette phrase a dit « LA SEULE » jusqu'ici :
 * elle était fausse depuis it7, où `possede_objet` est entré. H1 et H2 ne
 * peuvent que SUR-COMPTER les producteurs, donc sous-graduer le constat ;
 * celle-ci, si la n° 11 la contredit, ferait déclarer sans chemin une condition
 * que le moteur accomplirait — un FAUX POSITIF sous une règle BLOQUANTE. Elle se
 * corrige en UN endroit, la ligne `pnj_a_revele` de la table d'établissement, et
 * nulle part ailleurs.
 * COROLLAIRE DE RÉDACTION, sans lequel l'hypothèse ne dit rien : la paire
 * s'évalue JOINTEMENT. Deux feuilles indépendantes — « ce personnage existe »
 * et « cet indice a un producteur » — seraient vraies ensemble sans qu'aucun
 * savoir ne les relie, et le prédicat serait déclaré productible à tort.
 * ET DEPUIS IT9, LA PAIRE PASSE PAR LA MÊME `porteOuverte` QUE LE COMPTE, avec
 * l'ensemble FINAL : un savoir gardé derrière une porte qui ne s'ouvrira jamais
 * ne fait pas parler son porteur. Sans ce resserrement, `pnj_a_revele` serait
 * resté le seul endroit du module où un savoir compte sans que sa porte soit
 * regardée — deux lectures du même fait, divergentes.
 *
 * H4 — CE QUI DÉCIDE QU'UNE PORTE EST ÉVALUABLE : UN ÉCRIVAIN UNIQUE AU SCHÉMA.
 * Un fait dont le schéma nomme un écrivain UNIQUE, et dont AUCUNE instance de cet
 * écrivain n'existe au dossier, est INACCOMPLISSABLE. Un fait dont le schéma ne
 * nomme AUCUN écrivain n'est pas décidable, et le linter s'y tait. La partition
 * des quatre portes de `Revelation` en découle, elle n'est pas arbitrée :
 *  · `contrepartie.objet_id` — écrivain unique `donner_objet`. `Depart` ne porte
 *    aucun inventaire, et `retirer_objet` partage le même espace de noms en
 *    écrivant à l'ENVERS : le dériver de `refKinds` compterait une SOUSTRACTION
 *    comme un don. ÉVALUÉE ;
 *  · `apres_indice_id` — écrivains : les savoirs, `reveler_indice` et `mene_a`,
 *    c'est-à-dire l'index que cette fonction construit, SUR-COMPTÉ par H1 et H2.
 *    ÉVALUÉE, et c'est la SECONDE arête indice → indice du schéma ;
 *  · `confiance_min`, `jet` — aucun écrivain nommable. NON ÉVALUÉES (H2).
 * CE QU'ELLE N'EST PAS, et la nuance a été écrite puis retirée par son auteur :
 * ce n'est PAS « l'ensemble des écrivains est sur-compté ». Cette version-là
 * condamnerait rétroactivement `possede_objet`, dont l'ensemble est EXACT et non
 * sur-compté — voir H5.
 *
 * H5 — `objetsDonnes` EST EXACT AU SCHÉMA, ET DEUX LIGNES EN DÉPENDENT SOUS UNE
 * RÈGLE BLOQUANTE : `ETABLISSEMENT.possede_objet` (it7) et `porteOuverte` (it9).
 * Trois faits, et ils tiennent ENSEMBLE : `donner_objet` est le seul écrivain
 * d'inventaire du registre, `Depart` n'en porte aucun, et LE NARRATEUR NE TOUCHE
 * JAMAIS L'INVENTAIRE. C'est cet invariant, et lui seul, qui rend les deux
 * lectures correctes plutôt que sous-comptées. Le jour où une feature accorde un
 * inventaire de départ ou une acquisition jouée en scène, CES DEUX LIGNES-LÀ, et
 * elles seules, sont à reprendre (KR-227).
 * CE QU'IL NE FAUT PAS EN CONCLURE : que le schéma « ne sait pas exprimer un
 * inventaire de départ » excuserait l'auteur. C'est l'inverse — il écrit un prix
 * que le moteur ne pourra pas honorer, et la seule chose qui pourrait l'honorer,
 * le narrateur, a interdiction de le faire.
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
 * CE QUE L'INDEX REND POUR UN INDICE — le COMPTE, et la seule CONFIGURATION du
 * zéro que le compte ne sait pas dire.
 *
 * `retenues` EST LE COMPTE DES TROIS SEUILS, inchangés (`0 → bloquant`,
 * `1 → alerte`, `≥ 2 → silence`) : la liste ne grandit ni ne rétrécit d'un cran
 * parce qu'un champ l'accompagne désormais.
 *
 * `savoirSousPorteMorte` EST CLASSÉ ICI, JAMAIS RECONSTRUIT PAR L'APPELANT, et
 * c'est la raison d'être de cette interface : l'appelant devrait sinon relire les
 * savoirs, réévaluer leurs portes et donc REFAIRE le point fixe pour savoir si
 * `apres_indice_id` tenait — un second calcul de la même chose, qui dériverait du
 * premier au premier chemin ajouté. Il vaut `true` quand AU MOINS UN savoir cite
 * cet indice et que sa porte est fermée ; le `false` ne dit rien d'autre que
 * « aucun savoir fermé », jamais « aucun savoir ».
 *
 * UN BOOLÉEN ET NON UNE UNION DE MOTIFS : la seule chose que l'appelant en fait
 * est CHOISIR UNE PHRASE, et une union à deux valeurs dont une seule serait lue
 * est une abstraction posée avant son besoin.
 */
export interface ProducteursIndice {
	/** LE COMPTE des trois seuils — sources retenues APRÈS portes et saturation. */
	readonly retenues: readonly SourceIndice[]
	/** Au moins un savoir cite cet indice, et sa porte ne s'ouvrira jamais. */
	readonly savoirSousPorteMorte: boolean
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
 * UNE SEULE DÉFINITION DE TRAVERSÉE POUR DEUX FILTRES — `reveler_indice` pour les indices
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
 * LES OBJETS QUE LE DOSSIER DONNE — une SEULE définition, DEUX consommateurs : la
 * porte `contrepartie` d'un savoir et le prédicat `possede_objet`. Deux relevés
 * du même fait dériveraient l'un de l'autre, et ils le feraient en SILENCE : le
 * second à diverger continuerait de rendre un ensemble, simplement faux.
 *
 * LE VERBE EST NOMMÉ — `donner_objet`, et lui seul. `retirer_objet` partage
 * `refKinds: ['objet']` et écrit en NÉGATIF : dériver le producteur de l'espace
 * de noms compterait une SOUSTRACTION comme un don. Le trou n'est pas
 * hypothétique — les deux verbes sont au registre aujourd'hui, et un témoin les
 * sépare.
 *
 * AUCUNE MÉMOÏSATION (KR-013/113) : elle se recalcule à chaque appel, comme le
 * point fixe et comme le rapport qui les consomme.
 *
 * EXACTITUDE : voir H5. Cet ensemble n'est pas sous-compté « en attendant mieux »,
 * il est EXACT au schéma — et c'est une hypothèse datée, pas une propriété du
 * domaine.
 */
function objetsDonnesDe(dossier: Dossier): Set<string> {
	const objetsDonnes = new Set<string>()
	for (const effet of effetsDeRegle(dossier)) {
		if (effet.delta !== 'donner_objet') continue
		for (const cible of effet.cibles) objetsDonnes.add(cible)
	}
	return objetsDonnes
}

/**
 * UNE PORTE DE RÉVÉLATION EST-ELLE FRANCHISSABLE ? — le ET des portes ÉVALUÉES
 * (H4), écrit en SUITE DE GARDES À SORTIE `false` et jamais en `some`.
 *
 * LA FORME PORTE LE SENS. Un `some` sur une liste de portes dirait « au moins une
 * s'ouvre » ; ce qu'il faut est « aucune ne ferme ». Les deux se ressemblent tant
 * qu'une seule porte est posée et se contredisent dès la seconde — et le schéma en
 * autorise quatre sur le même savoir. La suite de gardes porte le ET PAR
 * CONSTRUCTION : chaque ligne ne peut que fermer, jamais ouvrir.
 *
 * LES DEUX PORTES NON ÉVALUÉES N'ONT PAS DE GARDE, et leur absence est le fait,
 * pas un oubli : `confiance_min` et `jet` sont PRÉSENTES au schéma et
 * indécidables ici (H2/H4). Une garde qui les lirait sans les décider serait une
 * ligne morte ; une garde qui les fermerait serait un faux positif sous une règle
 * bloquante.
 *
 * LA PORTE VAUT `undefined`, JAMAIS `null`, et c'est MESURÉ dans le produit :
 * `retirerPorte` SUPPRIME la clé au lieu d'y poser `null`, et le `null` qu'on
 * trouve dans `BlocSavoirs.tsx` est un modèle de VUE, jamais une valeur écrite au
 * document. Une garde double `x === undefined || x === null` couvrirait un état
 * que le schéma n'admet pas, et suggérerait au lecteur suivant qu'il existe.
 *
 * `indicesProduits` EST L'ENSEMBLE EN COURS DE CONSTRUCTION quand le point fixe
 * l'appelle : c'est ce qui entrelace `apres_indice_id` avec `mene_a` au lieu d'en
 * faire une passe à part. Il est FINAL quand `pnj_a_revele` l'appelle.
 */
function porteOuverte(
	revele_si: Revelation | undefined,
	indicesProduits: ReadonlySet<string>,
	objetsDonnes: ReadonlySet<string>,
): boolean {
	// AUCUNE PORTE POSÉE — rien ne ferme. « Une porte absente n'est pas une porte
	// fermée : c'est une porte non posée » (`types.ts`).
	if (revele_si === undefined) return true

	// LA CONTREPARTIE — un prix que personne ne donne ne se paie jamais.
	if (revele_si.contrepartie !== undefined && !objetsDonnes.has(revele_si.contrepartie.objet_id)) return false

	// L'INDICE PRÉALABLE — un savoir qui attend un indice hors d'atteinte est hors
	// d'atteinte. SECONDE arête indice → indice du schéma.
	if (revele_si.apres_indice_id !== undefined && !indicesProduits.has(revele_si.apres_indice_id)) return false

	return true
}

/**
 * L'INDEX DES PRODUCTEURS — pour chaque identifiant d'indice CITÉ quelque part
 * dans le dossier, les sources qui le produisent, ARÊTES SATURÉES ET PORTES
 * ÉVALUÉES.
 *
 * TROIS ÉTATS ET NON DEUX SUR LE DOMAINE DES CLÉS, et c'est ce qui donne DEUX
 * messages à l'appelant sans qu'un seul champ soit ajouté nulle part :
 *  · clé ABSENTE — aucune source brute ne cite cet indice : le zéro NU ;
 *  · clé PRÉSENTE, `retenues` VIDE — des sources brutes le citent, et AUCUNE n'a
 *    survécu aux portes et à la saturation ;
 *  · clé présente, `retenues` non vide — le compte, tel que les trois seuils de
 *    « indice sans source » le lisent (`0 → bloquant`, `1 → alerte`, `≥ 2 →
 *    silence`).
 * LE DOMAINE DES CLÉS EST INCHANGÉ PAR IT9 : une porte fermée retire une SOURCE,
 * jamais une CLÉ — le savoir CITE toujours l'indice. C'est ce qui permet au champ
 * `savoirSousPorteMorte` de séparer le deuxième état en deux sans en créer un
 * quatrième.
 *
 * LE SECOND ÉTAT SE PARTAGE DÉSORMAIS EN DEUX, ET LA PRIORITÉ EST CE QUI TIENT
 * LES DEUX PHRASES VRAIES — écrit ici parce que le calcul et le texte se relisent
 * ENSEMBLE ou dérivent :
 *  · `savoirSousPorteMorte` VRAI — au moins un savoir tient cet indice derrière
 *    une porte qui ne s'ouvrira jamais ;
 *  · `savoirSousPorteMorte` FAUX — alors AUCUN savoir ne cite cet indice (un
 *    savoir à porte ouverte aurait forcé `retenues` à au moins un), aucun delta
 *    non plus, donc toutes les sources brutes sont des arêtes `mene_a` et aucune
 *    ne survit. C'EST EXACTEMENT L'ÉQUIVALENCE dont vit le message « aucun ne
 *    remonte à une racine », et elle n'est vraie QUE parce que la porte morte est
 *    lue EN PREMIER. Inverser les deux tests rendrait ce message faux sur un
 *    indice servi par des savoirs fermés — sans qu'aucun compte ne bouge.
 *
 * LE TROISIÈME ÉTAT N'EST PAS « BOUCLE », ET LA NUANCE A DÉJÀ COÛTÉ UNE PHRASE
 * FAUSSE : en remontant les amonts d'un indice non produit dans un graphe FINI,
 * on tombe sur un cycle OU sur une chaîne simplement non racinée. La seconde
 * configuration est la plus probable en pratique — un auteur qui chaîne
 * `A → B → C` et oublie de raciner `A` —, et `[{ id: 'a', mene_a: ['b'] },
 * { id: 'b' }]` la produit sans le moindre cycle. Le cycle n'est qu'un
 * EXEMPLAIRE de « aucun amont atteignable », jamais sa définition.
 *
 * Pure, totale, et elle ne ferme sur RIEN — en particulier pas sur `CONTROLES`.
 * AUCUNE MÉMOÏSATION (KR-013/113) : point fixe et ensemble d'objets donnés sont
 * recalculés à chaque appel.
 *
 * LES SIX CHEMINS DE L'INDEX BRUT, en UNION et jamais en branches disjointes —
 * deux branches disjointes laissent entre elles un indice à zéro savoir et un
 * seul effet, donc un silence sur le cas même que la règle existe pour attraper :
 *  · `monde.personnages[].savoirs[].indice_id` ;
 *  · les QUATRE sites de `CHEMINS_DE_DELTAS` filtrés sur `reveler_indice` —
 *    récompense de quête, conséquence de résolution, effet de climat, effet de
 *    jalon. Leur TRAVERSÉE vit dans `effetsDeRegle`, et le motif du lecteur typé
 *    y est écrit UNE fois ;
 *  · `monde.indices[].mene_a[]`.
 *
 * LE CLIMAT EST COMPTÉ bien qu'aucun moteur ne sache aujourd'hui APPLIQUER un
 * effet de climat : sur une règle bloquante, l'erreur permise est le faux
 * négatif, jamais le faux positif.
 *
 * UN POINT FIXE UNIQUE, ENTRELACÉ, CROISSANT DEPUIS ∅ — le PLUS PETIT point fixe,
 * et les trois mots sont chacun une interdiction :
 *  · UNIQUE — `apres_indice_id` entre dans LA MÊME relaxation que `mene_a`. Une
 *    passe séparée, ou une couche posée AU-DESSUS de cette fonction, ne verrait
 *    pas qu'une porte s'ouvre parce qu'une arête vient de livrer son indice ;
 *  · ENTRELACÉ — et la forme « point fixe d'it6 PUIS soustraction des savoirs à
 *    porte fermée » est INTERDITE : elle évalue les portes contre l'ensemble
 *    FINAL sans ré-itérer, si bien qu'un savoir gardé sur un indice que SEUL un
 *    autre savoir fermé produisait reste compté. Deux savoirs gardés en cascade
 *    suffisent à l'exhiber, et c'est le témoin de profondeur DEUX de la suite.
 *    MESURÉ : le témoin de l'entrelacement (une porte qui s'ouvre grâce à une
 *    arête) laisse CETTE forme-là VERTE — il faut les deux témoins, et le plan
 *    d'it9 les nomme séparément pour cette raison ;
 *  · CROISSANT DEPUIS ∅ — jamais le plus GRAND point fixe. Un point fixe
 *    décroissant, parti de « tout est produit », rend sur un cycle mutuel
 *    d'`apres_indice_id` deux membres qui se justifient l'un l'autre : un FAUX
 *    NÉGATIF sous une règle bloquante, exactement ce que ce module refuse.
 *
 * `contrepartie` N'INTRODUIT AUCUNE RÉCURSION : `objetsDonnesDe` ne dépend que du
 * document, jamais de l'ensemble en construction. C'est pourquoi il est calculé
 * UNE fois, avant la boucle, et passé tel quel.
 *
 * L'ALGORITHME, EN QUATRE TEMPS — et LE PORTEUR DE L'ARÊTE N'Y EST JAMAIS
 * STOCKÉ :
 *  (a) l'index BRUT, par les six chemins ci-dessus ;
 *  (b) les OBJETS DONNÉS et les ARÊTES, relus une fois — les deux entrées
 *      statiques du point fixe ;
 *  (c) LE POINT FIXE : on répète les TROIS règles — un `reveler_indice` produit
 *      sa cible ; un savoir à porte ouverte produit son indice ; une arête dont
 *      l'amont est produit produit sa cible — jusqu'à ce qu'un tour n'ajoute
 *      plus rien. Chaque tour qui progresse ajoute au moins un identifiant à un
 *      ensemble fini : la boucle est bornée sans compteur de garde ;
 *  (d) la RECONSTRUCTION — un `{ famille: 'savoir' }` par savoir à porte
 *      OUVERTE, les `delta` reconduits TELS QUELS, PLUS un `{ famille: 'mene_a' }`
 *      par OCCURRENCE d'arête survivante. PAR OCCURRENCE et non par cible
 *      distincte : un `mene_a` qui cite deux fois la même cible comptait deux
 *      fois à plat, et l'iso-comportement l'exige quand tout est atteignable.
 *
 * IL FAUT QUATRE MAILLONS POUR TENIR LA PROMESSE DU POINT FIXE SUR `mene_a`, et
 * le chiffre est MESURÉ, pas choisi : sur une chaîne à trois, un mutant qui GÈLE
 * la borne de la boucle de relaxation à une seule itération reste VERT. Le
 * maillon intermédiaire entre bien dans le `Set` à la première itération sans
 * jamais être dépilé, et l'étape (d) ne teste que l'appartenance FINALE de
 * l'amont — elle ne sait pas combien d'itérations l'y ont mis. Le quatrième
 * maillon est le premier qu'une SECONDE itération est seule à atteindre.
 * `atteignabilite.test.ts` le tient donc sur quatre, et la version à trois de ce
 * commentaire avait traversé deux tours de comité en affirmant une couleur de
 * test que personne n'avait exécutée. LA PROFONDEUR DES PORTES EST AUTRE CHOSE ET
 * VAUT DEUX : une chaîne de PORTES n'est pas une chaîne de RELAXATIONS, et le
 * chiffre est MESURÉ lui aussi — un seul maillon gardé est indiscernable.
 *
 * ET LE SENS DE L'ARÊTE SE PROUVE À PART : qu'un indice pointe VERS un indice
 * produit ne le produit pas. Aucune chaîne, même longue, ne l'exige — dans une
 * chaîne rompue le maillon orphelin est ISOLÉ, donc une relaxation non orientée
 * n'a rien à lui propager et reste verte. Il y faut un nœud RELIÉ, et c'est le
 * second témoin de la suite.
 */
export function producteursParIndice(dossier: Dossier): Map<string, ProducteursIndice> {
	const producteurs = new Map<string, SourceIndice[]>()

	const ajouter = (indiceId: string, famille: FamilleDeSource): void => {
		const sources = producteurs.get(indiceId)
		if (sources === undefined) producteurs.set(indiceId, [{ famille }])
		else sources.push({ famille })
	}

	// LES SAVOIRS, APLATIS UNE FOIS : le point fixe les relit à chaque tour, et
	// deux traversées de `monde.personnages` divergeraient sur l'ordre le jour où
	// l'une des deux se mettrait à filtrer.
	const savoirs = dossier.monde.personnages.flatMap((personnage) => personnage.savoirs)
	for (const savoir of savoirs) ajouter(savoir.indice_id, 'savoir')

	// Le filtre sur `reveler_indice` est écrit UNE FOIS, et un balayage de source
	// tient cette unicité : quatre copies dériveraient le jour où un cinquième
	// emplacement entrerait.
	const effets = effetsDeRegle(dossier)
	for (const effet of effets) {
		if (effet.delta !== 'reveler_indice') continue
		for (const cible of effet.cibles) ajouter(cible, 'delta')
	}

	for (const indice of dossier.monde.indices) {
		for (const vise of indice.mene_a ?? []) ajouter(vise, 'mene_a')
	}

	// (b) LES DEUX ENTRÉES STATIQUES DU POINT FIXE.
	//
	// LES OBJETS DONNÉS ne dépendent pas de l'ensemble en construction : la porte
	// `contrepartie` n'introduit aucune récursion, et c'est pourquoi la seule arête
	// récursive NEUVE d'it9 est `apres_indice_id`.
	const objetsDonnes = objetsDonnesDe(dossier)

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

	// (c) LE POINT FIXE — UNIQUE, ENTRELACÉ, CROISSANT DEPUIS ∅. Les trois règles
	// sont relues dans LE MÊME tour : un savoir dont la porte s'ouvre parce qu'une
	// arête vient de livrer son indice préalable entre au tour SUIVANT, et les
	// arêtes qu'il racine avec lui.
	const atteignables = new Set<string>()
	let progresse = true
	while (progresse) {
		progresse = false

		// RÈGLE 1 — un `reveler_indice` produit sa cible. Sans porte, sans condition :
		// ce sont les seules racines INCONDITIONNELLES du dossier.
		for (const effet of effets) {
			if (effet.delta !== 'reveler_indice') continue
			for (const cible of effet.cibles) {
				if (atteignables.has(cible)) continue
				atteignables.add(cible)
				progresse = true
			}
		}

		// RÈGLE 2 — un savoir à porte OUVERTE produit son indice. La porte est relue
		// contre l'ensemble EN COURS, jamais contre un état figé avant la boucle :
		// c'est cette ligne-ci, et elle seule, qui entrelace `apres_indice_id`.
		for (const savoir of savoirs) {
			if (atteignables.has(savoir.indice_id)) continue
			if (!porteOuverte(savoir.revele_si, atteignables, objetsDonnes)) continue
			atteignables.add(savoir.indice_id)
			progresse = true
		}

		// RÈGLE 3 — une arête dont l'AMONT est produit produit sa cible. Orientée :
		// qu'un indice pointe VERS un indice produit ne le produit pas.
		for (const [amont, cibles] of aretes) {
			if (!atteignables.has(amont)) continue
			for (const vise of cibles) {
				if (atteignables.has(vise)) continue
				atteignables.add(vise)
				progresse = true
			}
		}
	}

	// LES SAVOIRS, TRIÉS PAR L'ÉTAT FINAL DE LEUR PORTE — et les deux moitiés se
	// lisent d'un seul parcours : celles qui comptent, et celles qui donnent au
	// zéro sa configuration.
	const savoirsOuverts = new Map<string, number>()
	const sousPorteMorte = new Set<string>()
	for (const savoir of savoirs) {
		if (porteOuverte(savoir.revele_si, atteignables, objetsDonnes)) {
			savoirsOuverts.set(savoir.indice_id, (savoirsOuverts.get(savoir.indice_id) ?? 0) + 1)
			continue
		}
		sousPorteMorte.add(savoir.indice_id)
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
	// porte les messages. L'ORDRE DES FAMILLES est celui de l'index brut —
	// savoirs, deltas, arêtes —, que la reconstruction ne réordonne pas.
	const satures = new Map<string, ProducteursIndice>()
	for (const [indiceId, sources] of producteurs) {
		const retenues: SourceIndice[] = []
		for (let rang = 0; rang < (savoirsOuverts.get(indiceId) ?? 0); rang += 1) retenues.push({ famille: 'savoir' })
		for (const source of sources) {
			if (source.famille === 'delta') retenues.push(source)
		}
		for (let rang = 0; rang < (survivantes.get(indiceId) ?? 0); rang += 1) retenues.push({ famille: 'mene_a' })
		satures.set(indiceId, { retenues, savoirSousPorteMorte: sousPorteMorte.has(indiceId) })
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
 * moins un producteur APRÈS portes et saturation »), et l'exporter en ferait un
 * second index à tenir en phase avec le premier.
 *
 * LES DEUX ENSEMBLES SONT FINAUX ICI, et c'est ce qui autorise `pnj_a_revele` à
 * appeler la MÊME `porteOuverte` que le point fixe : là-bas l'ensemble grandit
 * encore, ici il ne bouge plus.
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
 * TROIS LIGNES MORDENT, QUATRE SONT « NON ÉVALUÉES À IT9 » — et c'est le mot
 * juste, jamais « toujours vraie » : un commentaire plus large que le fait est
 * exactement KR-199. Les deux prédicats de LIEU relèvent de KR-224 — le schéma
 * n'a aucun graphe de praticabilité, donc « ce lieu est atteint » n'est pas
 * décidable ici. `jalon_atteint` et `evenement_consomme`, eux, ont DEUX écrivains
 * chacun — un delta ou la main du narrateur, plus un `declencheur_expr`
 * OPTIONNEL —, si bien que H4 ne les tranche pas et que H2 les garde en liste.
 * LA VERSION PRÉCÉDENTE DE CE PARAGRAPHE LES DISAIT « la charge de la tranche
 * porte morte » : cette tranche est LIVRÉE, et elle ne les prend pas — voir la
 * correction écrite à H2. Rendre `true` là où l'on ne sait pas est la seule
 * direction permise sous une règle bloquante.
 *
 * `possede_objet` LIT UN VERBE NOMMÉ, jamais `refKinds.includes('objet')` :
 * `retirer_objet` porte le même espace de noms et est un producteur NÉGATIF —
 * le dériver compterait une SOUSTRACTION comme un don. Le trou n'est pas
 * hypothétique : les deux verbes sont au registre aujourd'hui, et un témoin les
 * sépare. Son ensemble est celui de `objetsDonnesDe`, et H5 dit ce qui le rend
 * EXACT — une hypothèse datée, jamais une propriété du domaine.
 *
 * `pnj_a_revele` s'évalue JOINTEMENT (H3) : la PAIRE, jamais deux feuilles
 * indépendantes — ET SOUS LA MÊME PORTE QUE LE COMPTE depuis it9. Un savoir
 * gardé derrière une porte qui ne s'ouvrira jamais ne fait pas parler son
 * porteur : sans ce resserrement, le même savoir aurait compté zéro producteur
 * d'un côté et établi la paire de l'autre.
 */
const ETABLISSEMENT: Record<PredicatId, (etat: EtatDuDossier, cibles: readonly string[]) => boolean> = {
	possede_objet: (etat, cibles) => etat.objetsDonnes.has(cibles[0]),
	indice_connu: (etat, cibles) => etat.indicesProduits.has(cibles[0]),
	pnj_a_revele: (etat, cibles) =>
		etat.dossier.monde.personnages.some(
			(personnage) =>
				personnage.id === cibles[0] &&
				personnage.savoirs.some(
					(savoir) =>
						savoir.indice_id === cibles[1] && porteOuverte(savoir.revele_si, etat.indicesProduits, etat.objetsDonnes),
				),
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
	// Les portes y sont déjà évaluées : c'est la MÊME carte que celle des trois
	// seuils, jamais une lecture plus généreuse.
	const indicesProduits = new Set<string>()
	for (const [indiceId, entree] of producteursParIndice(dossier)) {
		if (entree.retenues.length > 0) indicesProduits.add(indiceId)
	}

	// LES OBJETS DONNÉS, par la SEULE définition du module — second consommateur
	// de `objetsDonnesDe`, le premier étant la porte `contrepartie` d'un savoir.
	const objetsDonnes = objetsDonnesDe(dossier)

	return feuilleSansEtablissement({ dossier, indicesProduits, objetsDonnes }, condition)
}
