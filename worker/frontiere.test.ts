/**
 * @jest-environment node
 */
/**
 * LA FRONTIÈRE CODE / MODÈLE — les liaisons qu'aucune porte ne voit seule.
 *
 * La panne qu'il attrape, écrite pour qu'on la reconnaisse : quelqu'un modifie
 * l'invite du worker pour demander une autre forme que celle que le client
 * valide. Tout appel échoue la validation, est rejoué une fois, échoue encore ;
 * l'auteur lit « Le copilote n'a pas produit de proposition exploitable » — LE BON
 * TEXTE, POUR LA MAUVAISE RAISON, à chaque essai, pour toujours. `tsc` vert,
 * `jest` vert, et la revue de PR ne lit pas deux fichiers à la fois (KR-236).
 *
 * DEPUIS L'ITÉRATION 2, LA PANNE A UNE SECONDE FORME, et c'est la seule NEUVE
 * qu'une table à deux entrées rende possible : les deux gabarits sont là, tous les
 * deux corrects, MAIS APPARIÉS AU MAUVAIS RÔLE. Un canari qui RETIRE un gabarit ne
 * la distingue pas d'un gabarit absent ; il faut un canari CROISÉ, qui INTERVERTIT.
 *
 * QUATRE CONTRAINTES tenues par ce fichier :
 *  (a) il ne contient AUCUN des littéraux — il les EXTRAIT des deux fichiers par la
 *      MÊME expression ancrée et les compare entre eux. Les écrire ici en ferait un
 *      troisième porteur, c'est-à-dire le défaut qu'il surveille ;
 *  (b) la CARDINALITÉ fait partie du prédicat — deux tables vides sont trivialement
 *      égales, et un littéral disparu rendrait la comparaison vraie pour rien ;
 *  (c) l'ensemble des rôles est DÉRIVÉ d'`INVITES`, jamais écrit : un rôle sans
 *      gabarit, ou un gabarit sans invite, doit rougir ;
 *  (d) tous ses chemins passent par `path.join`, pour tenir sous Windows (KR-215).
 *
 * Il importe DES DEUX CÔTÉS de la frontière — c'est sa raison d'être, et c'est
 * pourquoi worker et brain ne pouvaient pas être deux lots. Ce n'est PAS un import
 * de production : `testMatch` gouverne la découverte, pas ce qu'un test lit, et
 * rien de ceci n'entre dans le paquet wrangler.
 */
import fs from 'node:fs'
import path from 'node:path'
import worker, { INVITES, TAILLE_MAX_CORPS_IA } from './index'
import {
	assemblerDetenteurs,
	assemblerDistribution,
	assemblerRelations,
	BUDGET_CARACTERES_CONTEXTE,
	BUDGET_CARACTERES_NARRATEUR,
} from '../src/brain/copilote/contexte'
import {
	CLES_SORTIE_NARRATEUR,
	FICHES_PROPOSEES_MAX,
	RELATIONS_PROPOSEES_MAX,
	REPLIQUES_PROPOSEES_MAX,
	TENTATIVES_MAX,
	validerDistribution,
	validerNarrateur,
	validerRelations,
	validerRepliques,
	validerSortie,
} from '../src/brain/copilote/schemaSortie'
import { createCopiloteService } from '../src/brain/CopiloteService'
import type { CloudSettingsService } from '../src/brain/CloudSettingsService'
import { analyserSaisie, executerCommande } from '../src/brain/dossier/commandes'
import { CURSEURS } from '../src/brain/dossier/curseurs'
import { ouvrirSession } from '../src/brain/dossier/session'
import type { Dossier, Personnage } from '../src/brain/dossier/types'

const ROLE_PROSE = 'personnage-prose'
const ROLE_DETENTEURS = 'indice-detenteurs'
const ROLE_REPLIQUES = 'personnage-repliques'
const ROLE_RELATIONS = 'personnage-relations'
const ROLE_DISTRIBUTION = 'monde-distribution'

/**
 * LA BORNE DE SORTIE EN TOUTES LETTRES — le seul pont possible entre l'invite
 * (worker) et le validateur (client), puisqu'aucun import `worker/` → `src/` n'est
 * permis en production. Cette table ne vit QUE dans ce test : c'est lui, et lui seul,
 * qui importe des deux côtés de la frontière.
 */
const BORNE_EN_TOUTES_LETTRES: Record<number, string> = { 2: 'deux au plus', 3: 'trois au plus' }

/** L'invite ANNONCE-T-ELLE la borne du validateur ? Isolé pour que son cas négatif
 *  porte sur la COMPARAISON RÉELLE, et non sur la fabrication de son témoin. */
function inviteDitLaBorne(systeme: string, borne: number): boolean {
	const mot = BORNE_EN_TOUTES_LETTRES[borne]
	return mot !== undefined && systeme.includes(mot)
}
const RACINE = path.join(__dirname, '..')
const PORTEUR_WORKER = path.join(__dirname, 'index.ts')
const PORTEUR_BRAIN = path.join(RACINE, 'src', 'brain', 'copilote', 'schemaSortie.ts')

/** L'ensemble de TOUS les rôles que la route `POST /ia/:role` sert, DÉRIVÉ du
 *  registre qui fait foi côté worker — jamais un littéral (KR-117). */
const ROLES = Object.keys(INVITES)

/**
 * ⚠ DEUX FAMILLES DE RÔLES DERRIÈRE LA MÊME ROUTE, ET CE FICHIER NE GARDE QUE
 * LA PREMIÈRE — décision d'architecture confirmée au lot `contrat` de la n° 10
 * (`moteur-interprete`) : `RoleCopilote` (`copilote/types.ts`, mode AUTEUR —
 * `personnage-prose`, `indice-detenteurs`, `personnage-repliques`,
 * `personnage-plan`, `personnage-relations`, `monde-distribution`) porte
 * l'appareil GÉNÉRIQUE de contexte (`CHAMPS_INJECTES`/`PARTIES_REQUISES`/
 * `BUDGET_CARACTERES_CONTEXTE` de `contexte/registres.ts`), que ce fichier
 * compare pièce par pièce entre le client et le worker. `interprete` (mode
 * JEU, n° 10 ; `narrateur` l'a rejointe en it2) EST STRUCTURELLEMENT HORS DE
 * CETTE FAMILLE : son contexte est un assemblage BESPOKE par rangs
 * (`copilote/contexte/interprete.ts`), il n'a NI `CHAMPS_INJECTES`, NI
 * `PARTIES_REQUISES`, NI budget dans `Record<RoleCopilote, …>` — l'y faire
 * entrer romprait la totalité des TROIS registres de `contexte/registres.ts`
 * pour un système que ce rôle n'utilise pas.
 *
 * `ROLES_AUTEUR` EST DONC LE SEUL ENSEMBLE QUE LES VÉRIFICATIONS DE PARITÉ
 * CROISÉE DE CE FICHIER (`GABARIT_SORTIE` client ↔ worker, `BUDGET_CARACTERES_
 * CONTEXTE` ↔ plafond HTTP) DOIVENT PARCOURIR — DÉRIVÉ de `BUDGET_CARACTERES_
 * CONTEXTE`, PAS d'un littéral recopié : ce registre EST `Record<RoleCopilote,
 * number>`, donc ses clés SONT exactement les rôles de la famille auteur.
 * Un rôle de la famille JEU vérifie sa PROPRE parité rôle→gabarit dans SES
 * PROPRES tests, déjà écrits (`schemaSortie.test.ts`, `CopiloteService.test.ts`,
 * `worker/index.test.ts`) — voir le describe dédié en fin de fichier.
 */
const ROLES_AUTEUR = ROLES.filter((role) => Object.prototype.hasOwnProperty.call(BUDGET_CARACTERES_CONTEXTE, role))

/** Le budget vu comme une table à clés libres : le `Record<RoleCopilote, number>`
 *  du contrat s'y assigne, et le test peut l'indexer par un rôle venu d'`INVITES`
 *  sans un seul `as` — l'appariement des deux ensembles de clés est précisément ce
 *  que le premier `describe` prouve. */
const BUDGETS: Record<string, number> = BUDGET_CARACTERES_CONTEXTE

/**
 * LES RÔLES QUE LE PLAFOND HTTP DOIT COUVRIR — la famille AUTEUR, PLUS `narrateur`
 * (n° 10 it2). HORS PARITÉ AUTEUR, il a pourtant un BUDGET CLIENT — sa propre borne,
 * `BUDGET_CARACTERES_NARRATEUR` (`copilote/contexte/narrateur.ts`), qui refuse
 * `trop-long` avant l'aller-retour —, donc le lien « budget client ⊂ plafond worker »
 * s'applique à lui comme aux six autres. Sans lui ici, plus rien ne prouverait que
 * `TAILLE_MAX_CORPS_IA` couvre le narrateur le jour où il deviendrait le plus large.
 *
 * ⚠ `interprete` N'Y EST PAS, et c'est un CONSTAT : il n'a AUCUN budget client (seule
 * sa SAISIE est bornée), donc aucun pire cas à convertir. Fermeture nommée : la
 * constante unique de KR-261, it4 (docstring de `TAILLE_MAX_CORPS_IA`).
 */
const ROLES_PLAFONNES: readonly string[] = [...ROLES_AUTEUR, 'narrateur']
const BUDGETS_PLAFONNES: Record<string, number> = { ...BUDGETS, narrateur: BUDGET_CARACTERES_NARRATEUR }

/**
 * L'EXPRESSION ANCRÉE, unique et partagée, ANCRÉE SUR L'ENTRÉE et non sur la
 * déclaration : c'est ce qui permet aux deux porteurs d'être des tables plutôt que
 * des scalaires, et c'est ce qui rend le canari croisé écrivable. Elle reconnaît
 * une entrée écrite dans la FORME IMPOSÉE des deux côtés — une tabulation, une clé
 * en minuscules entre apostrophes, un littéral entre apostrophes, virgule finale —
 * et rien d'autre : une mention du nom dans une docstring ne la satisfait pas.
 *
 * Le drapeau `g` est INDISPENSABLE à `matchAll` — et sans danger ici bien que la
 * regex soit de portée module : `matchAll` CLONE l'expression et ne réécrit jamais
 * son `lastIndex`. Ce serait faux le jour où quelqu'un remplacerait `matchAll` par
 * `test`/`exec`, qui, eux, avancent `lastIndex` d'un appel à l'autre et feraient
 * alterner vrai/faux sur la MÊME entrée.
 */
const ENTREE_GABARIT = /^\t'([a-z-]+)': '(.+)',$/gm

function extraire(fichier: string): Map<string, string> {
	const source = fs.readFileSync(fichier, 'utf8')
	return new Map([...source.matchAll(ENTREE_GABARIT)].map((trouve) => [trouve[1], trouve[2]]))
}

/** Le gabarit LOCAL au worker d'un rôle de JEU (hors `RoleCopilote`), par SOURCE — sa clé
 *  est NON QUOTÉE (Prettier retire les guillemets d'une clé sans tiret), d'où une
 *  extraction dédiée plutôt que `ENTREE_GABARIT`, qui la ferait passer pour ABSENTE. Même
 *  motif que l'extraction propre à `interprete`, plus bas, généralisée au rôle nommé. */
function extraireGabaritDeJeu(role: string): string | undefined {
	const source = fs.readFileSync(PORTEUR_WORKER, 'utf8')
	return source.match(new RegExp(`^\\t${role}: '(.+)',$`, 'm'))?.[1]
}

/**
 * LE PRÉDICAT DE LIAISON LUI-MÊME — isolé pour que ses cas négatifs portent sur la
 * COMPARAISON RÉELLE et non sur la construction de leur propre témoin. Un
 * `expect(altere).not.toEqual(reference)` où `altere` est fabriqué depuis
 * `reference` est vrai PAR CONSTRUCTION : il n'exécute rien du garde, et c'est
 * exactement le faux positif que KR-235 nomme.
 *
 * Il porte AUSSI la protection contre la vacuité (contrainte (b)) et la TOTALITÉ
 * (contrainte (c)) : les deux tables doivent couvrir EXACTEMENT les rôles attendus,
 * donc la cardinalité fait partie du prédicat, pas d'une assertion voisine qu'on
 * pourrait retirer sans que la liaison rougisse.
 */
function memesGabarits(a: Map<string, string>, b: Map<string, string>, roles: readonly string[]): boolean {
	if (a.size !== roles.length || b.size !== roles.length) return false
	return roles.every((role) => a.get(role) !== undefined && a.get(role) === b.get(role))
}

/** LE PRÉDICAT D'APPARIEMENT — l'invite d'un rôle contient LE GABARIT DE CE
 *  RÔLE-LÀ. Il porte sur le GABARIT, jamais sur la clé nue : `valeur` est un mot
 *  français courant, et une invite disant « la valeur du personnage » satisferait
 *  un `includes` de la clé sans rien demander au modèle. */
function inviteNommeSonGabarit(role: string, gabarits: Map<string, string>): boolean {
	const gabarit = gabarits.get(role)
	return gabarit !== undefined && INVITES[role].systeme.includes(gabarit)
}

/** Les gabarits DÉCALÉS D'UN CRAN — en mémoire, aucun fichier n'est touché.
 *
 *  ⚠ MESURÉ INDÉPENDAMMENT PAR DEUX POSTES À L'ITÉRATION 3a : `croiser` est une
 *  ROTATION de 1, c'est-à-dire un DÉRANGEMENT pour tout n ≥ 2 — elle reste donc verte
 *  à trois rôles SANS PLUS RIEN PROUVER DE NEUF. À deux rôles, « tout est décalé » et
 *  « deux sont intervertis » sont le MÊME événement ; à trois ils divergent, et le
 *  défaut réaliste — deux lignes interverties en éditant — CESSE d'être l'objet de ce
 *  canari. Elle est CONSERVÉE comme canari de DÉRANGEMENT TOTAL, et le balayage
 *  exhaustif ci-dessous prend la charge du mal-apparié. */
function croiser(gabarits: Map<string, string>, roles: readonly string[]): Map<string, string> {
	const valeurs = roles.map((role) => gabarits.get(role) ?? '')
	return new Map(roles.map((role, rang) => [role, valeurs[(rang + 1) % roles.length]]))
}

/** Les gabarits de DEUX rôles échangés, les autres intacts — LA TRANSPOSITION, qui
 *  est le défaut réaliste d'une table à trois entrées qu'on édite à la main. */
function transposer(gabarits: Map<string, string>, a: string, b: string): Map<string, string> {
	const echange = new Map(gabarits)
	echange.set(a, String(gabarits.get(b)))
	echange.set(b, String(gabarits.get(a)))
	return echange
}

/** LES TROIS PAIRES de rôles, DÉRIVÉES — jamais trois littéraux (KR-117/199). */
function paires(roles: readonly string[]): Array<[string, string]> {
	return roles.flatMap((a, rang) => roles.slice(rang + 1).map((b): [string, string] => [a, b]))
}

/**
 * LA PRÉCONDITION DU BALAYAGE, et elle s'écrit AVANT lui : AUCUN gabarit n'est
 * sous-chaîne d'un autre. Sans elle, le filtre ci-dessous rougirait SANS DÉFAUT — une
 * invite contenant légitimement son propre gabarit contiendrait mécaniquement celui
 * d'un autre rôle dont le littéral serait un préfixe du sien.
 * Elle rend LA LISTE des couples fautifs : l'échec nomme les deux rôles.
 */
function gabaritsSousChaines(gabarits: Map<string, string>, roles: readonly string[]): string[] {
	return roles.flatMap((role) =>
		roles
			.filter((autre) => autre !== role && String(gabarits.get(role)).includes(String(gabarits.get(autre))))
			.map((autre) => `${autre} ⊂ ${role}`),
	)
}

/**
 * LE BALAYAGE EXHAUSTIF — l'invite d'un rôle ne contient LE GABARIT D'AUCUN AUTRE
 * rôle. Il est GÉNÉRIQUE À N, et c'est ce qui le rend supérieur aux transpositions :
 * il ne dépend ni du nombre de rôles, ni de la forme du mauvais appariement.
 * Il rend LA LISTE des fuites : l'échec nomme le rôle dont l'invite déborde.
 */
function invitesQuiNommentUnAutreGabarit(gabarits: Map<string, string>, roles: readonly string[]): string[] {
	return roles.flatMap((role) =>
		roles
			.filter((autre) => autre !== role && INVITES[role].systeme.includes(String(gabarits.get(autre))))
			.map((autre) => `invite ${role} → gabarit ${autre}`),
	)
}

/** Tous les fichiers TypeScript de `src/` et de `worker/`, chemins joints. */
function fichiersTypeScript(racine: string): string[] {
	const trouves: string[] = []
	for (const entree of fs.readdirSync(racine, { withFileTypes: true })) {
		const complet = path.join(racine, entree.name)
		if (entree.isDirectory()) trouves.push(...fichiersTypeScript(complet))
		else if (entree.name.endsWith('.ts') || entree.name.endsWith('.tsx')) trouves.push(complet)
	}
	return trouves
}

describe('un gabarit par role, deux porteurs', () => {
	it('totalite des gabarits par role', () => {
		const cotWorker = extraire(PORTEUR_WORKER)
		const cotBrain = extraire(PORTEUR_BRAIN)

		// LES TROIS ENSEMBLES DE CLÉS SONT LE MÊME : un rôle sans gabarit, ou un gabarit
		// sans invite, rougit ici et nulle part ailleurs.
		expect([...cotBrain.keys()].sort()).toEqual([...ROLES_AUTEUR].sort())
		expect([...cotWorker.keys()].sort()).toEqual([...ROLES_AUTEUR].sort())
		// Et la cardinalité est DANS le prédicat, pas seulement au-dessus de lui.
		expect(memesGabarits(cotWorker, cotBrain, ROLES_AUTEUR)).toBe(true)
		// Deux rôles, pas un : sans cette ligne, tout ce fichier resterait vert sur la
		// table à une entrée de l'itération 1, où le mal-apparié n'existe pas.
		expect(ROLES_AUTEUR.length).toBeGreaterThan(1)
	})

	it('canari croise', () => {
		// LE CANARI CROISÉ, ET C'EST LE SEUL QUI VOIT LA PANNE NEUVE. Les deux gabarits
		// sont présents, corrects, de la bonne cardinalité — mais APPARIÉS AU MAUVAIS
		// RÔLE. Un canari qui en retire un ne distingue pas « absent » de « mal
		// apparié ».
		const cotBrain = extraire(PORTEUR_BRAIN)
		const croise = croiser(cotBrain, ROLES_AUTEUR)

		// Le croisement n'a rien perdu : même taille, mêmes valeurs, autre appariement.
		expect(croise.size).toBe(cotBrain.size)
		expect([...croise.values()].sort()).toEqual([...cotBrain.values()].sort())
		expect([...croise.entries()]).not.toEqual([...cotBrain.entries()])

		// (a) LE PRÉDICAT DE LIAISON rougit sur le croisement — dans les DEUX sens, un
		//     garde qui ne comparerait que dans un sens passerait sur une moitié muette.
		expect(memesGabarits(extraire(PORTEUR_WORKER), croise, ROLES_AUTEUR)).toBe(false)
		expect(memesGabarits(croise, extraire(PORTEUR_WORKER), ROLES_AUTEUR)).toBe(false)

		// (b) LE PRÉDICAT D'APPARIEMENT rougit lui aussi, pour CHAQUE rôle : c'est la
		//     forme sous laquelle la panne se manifesterait vraiment, une invite qui
		//     demande la forme de l'autre rôle.
		expect(ROLES_AUTEUR.filter((role) => inviteNommeSonGabarit(role, croise))).toEqual([])
		// Et il est VERT sur l'appariement réel : sans cette moitié, il pourrait être
		// rouge parce qu'il est inerte.
		expect(ROLES_AUTEUR.filter((role) => !inviteNommeSonGabarit(role, cotBrain))).toEqual([])
	})

	it('un litteral altere d un seul caractere fait rougir le predicat de liaison', () => {
		// CAS NÉGATIF OBLIGATOIRE : un instrument qui ne sait pas échouer ne mesure
		// rien. On altère l'exemplaire du brain EN MÉMOIRE — aucun fichier n'est
		// touché — puis on rejoue LE PRÉDICAT DU CAS NOMINAL contre le VRAI exemplaire
		// du worker, lu sur disque.
		const cotBrain = extraire(PORTEUR_BRAIN)
		const cible = ROLES_AUTEUR[0]
		const original = String(cotBrain.get(cible))
		const altere = new Map(cotBrain).set(cible, `${original.slice(0, -1)}!`)

		expect(memesGabarits(extraire(PORTEUR_WORKER), altere, ROLES_AUTEUR)).toBe(false)
		// Altération D'UN SEUL CARACTÈRE : ce n'est ni la cardinalité, ni la longueur
		// qui discrimine.
		expect(altere.size).toBe(cotBrain.size)
		expect(String(altere.get(cible))).toHaveLength(original.length)
	})

	it('un porteur vide fait rougir le predicat de liaison — la contrainte (b) est DANS le garde', () => {
		// Le mode de panne que (b) vise : un littéral disparu rend l'extraction vide,
		// et deux vides sont trivialement égaux. Le prédicat doit refuser AVANT de
		// comparer — sinon la liaison serait verte parce qu'elle ne mesure plus rien.
		expect(memesGabarits(extraire(PORTEUR_WORKER), new Map(), ROLES_AUTEUR)).toBe(false)
		expect(memesGabarits(new Map(), new Map(), ROLES_AUTEUR)).toBe(false)
	})

	it('aucun troisieme porteur d un gabarit dans src ni dans worker', () => {
		const attendus = [PORTEUR_BRAIN, PORTEUR_WORKER].sort()
		const fichiers = [...fichiersTypeScript(path.join(RACINE, 'src')), ...fichiersTypeScript(__dirname)]
		const sources = new Map(fichiers.map((fichier) => [fichier, fs.readFileSync(fichier, 'utf8')]))

		for (const [role, gabarit] of extraire(PORTEUR_BRAIN)) {
			const porteurs = fichiers.filter((fichier) => String(sources.get(fichier)).includes(gabarit))
			// ALLOW-LIST NOMMÉE, jamais une projection dérivée (KR-215) : l'échec nomme le
			// fichier fautif ET le rôle. Ce test-ci ne peut pas s'y trouver — il n'écrit
			// aucun littéral, il les extrait.
			expect(`${role} → ${porteurs.sort().join(', ')}`).toBe(`${role} → ${attendus.join(', ')}`)
		}
	})
})

describe('le balayage exhaustif — aucune invite ne nomme le gabarit d un AUTRE role', () => {
	it('precondition — aucun gabarit sous-chaine d un autre', () => {
		// ELLE S'ÉCRIT D'ABORD, ET C'EST L'ORDRE QUI COMPTE : si un gabarit était
		// sous-chaîne d'un autre, le balayage suivant rougirait SANS QU'AUCUN DÉFAUT
		// N'EXISTE — une invite contenant légitimement son propre gabarit contiendrait
		// mécaniquement celui de l'autre.
		expect(gabaritsSousChaines(extraire(PORTEUR_BRAIN), ROLES_AUTEUR)).toEqual([])
		// Discriminant : il y a bien plusieurs gabarits à comparer (KR-199).
		expect(ROLES_AUTEUR.length).toBeGreaterThan(1)
	})

	it('la precondition SAIT echouer — et sur une fabrication qui laisse le balayage VERT', () => {
		// PREMIÈRE DES DEUX FABRICATIONS DISTINCTES. Le pouvoir séparateur de la
		// précondition ne serait PAS établi si la MÊME fabrication faisait rougir la
		// précondition ET le filtre : on ne saurait pas lequel des deux a parlé.
		// Ces deux littéraux n'apparaissent dans AUCUNE invite, donc seul le rapport
		// gabarit ↔ gabarit est en cause.
		const long = 'ZZ-gabarit-fabrique-long'
		const court = 'ZZ-gabarit-fabrique'
		const fabriquee = new Map(extraire(PORTEUR_BRAIN)).set(ROLES_AUTEUR[0], long).set(ROLES_AUTEUR[1], court)

		expect(long.includes(court)).toBe(true)
		// (a) LA PRÉCONDITION ROUGIT, et elle nomme le couple.
		expect(gabaritsSousChaines(fabriquee, ROLES_AUTEUR)).toContain(`${ROLES_AUTEUR[1]} ⊂ ${ROLES_AUTEUR[0]}`)
		// (b) … et LE BALAYAGE, LUI, RESTE VERT sur cette même fabrication : les deux
		// instruments ne mesurent pas la même chose.
		expect(invitesQuiNommentUnAutreGabarit(fabriquee, ROLES_AUTEUR)).toEqual([])
	})

	it('aucune invite ne contient le gabarit d un autre role', () => {
		const reel = extraire(PORTEUR_BRAIN)

		expect(invitesQuiNommentUnAutreGabarit(reel, ROLES_AUTEUR)).toEqual([])
		// LE SECOND CÔTÉ, sans lequel l'assertion négative est INERTE : chaque invite
		// contient bien LE SIEN. Un balayage vert sur trois invites muettes ne prouverait
		// rien du tout.
		expect(ROLES_AUTEUR.filter((role) => !INVITES[role].systeme.includes(String(reel.get(role))))).toEqual([])
	})

	it('chacune des transpositions fait rougir le balayage', () => {
		// SECONDE DES DEUX FABRICATIONS DISTINCTES, et c'est le défaut RÉALISTE : deux
		// lignes interverties en éditant la table. Les paires sont DÉRIVÉES, jamais
		// écrites — « chacune » prouvé sur TOUTES, pas sur un échantillon (KR-199).
		const reel = extraire(PORTEUR_BRAIN)
		const toutes = paires(ROLES_AUTEUR)
		// FORME FERMÉE C(n,2), INDÉPENDANTE DE L'ALGORITHME DE `paires` : ce n'est donc
		// PAS un témoin fabriqué depuis son propre sujet, et il est GÉNÉRIQUE À N — plus
		// jamais à ré-éditer. Le littéral `3` qu'il remplace disait la même chose EN
		// SILENCE, et il aura fallu un quatrième rôle pour s'en apercevoir.
		expect(toutes).toHaveLength((ROLES_AUTEUR.length * (ROLES_AUTEUR.length - 1)) / 2)
		// … et les paires sont DEUX À DEUX DISTINCTES, ce que le littéral ne RENDAIT pas :
		// une `paires` qui rendrait n fois le même couple aurait le bon COMPTE.
		expect(new Set(toutes.map(([a, b]) => `${a}↔${b}`)).size).toBe(toutes.length)

		for (const [a, b] of toutes) {
			const echangee = transposer(reel, a, b)
			// Le balayage ROUGIT : l'invite de `a` nomme désormais le gabarit de `b`.
			expect(`${a}↔${b} → ${invitesQuiNommentUnAutreGabarit(echangee, ROLES_AUTEUR).length}`).not.toBe(`${a}↔${b} → 0`)
			// … et la PRÉCONDITION, elle, reste VERTE : une transposition ne fait que
			// permuter les mêmes valeurs. Les deux instruments restent distincts.
			expect(gabaritsSousChaines(echangee, ROLES_AUTEUR)).toEqual([])
		}
	})

	it('la rotation reste le canari du DERANGEMENT TOTAL', () => {
		// CONSERVÉE, et son rôle est NOMMÉ : à trois rôles elle ne prouve plus le
		// mal-apparié (une rotation de 1 est un dérangement pour tout n ≥ 2, donc elle
		// rougit trivialement). Elle garde le cas « toute la table a glissé d'un cran ».
		const reel = extraire(PORTEUR_BRAIN)
		const decalee = croiser(reel, ROLES_AUTEUR)

		// Le décalage n'a rien perdu : même taille, mêmes valeurs, autre appariement.
		expect([...decalee.values()].sort()).toEqual([...reel.values()].sort())
		expect([...decalee.entries()]).not.toEqual([...reel.entries()])
		// AUCUN rôle ne retrouve son gabarit : c'est ce que « dérangement total » veut
		// dire, et c'est ce que la rotation garde encore.
		expect(ROLES_AUTEUR.filter((role) => decalee.get(role) === reel.get(role))).toEqual([])
		expect(ROLES_AUTEUR.filter((role) => inviteNommeSonGabarit(role, decalee))).toEqual([])
	})

	it('la borne de l invite est celle du validateur', () => {
		// LA DUPLICATION « trois » (worker) / `REPLIQUES_PROPOSEES_MAX` (client) est
		// INÉVITABLE — aucun import `worker/` → `src/` — et elle n'était PAS gardée. Une
		// duplication qu'on ne peut pas supprimer se GARDE.
		// LIMITE DÉCLARÉE : ce garde épingle LE MOT, pas la sémantique.
		expect(REPLIQUES_PROPOSEES_MAX).toBe(3)
		expect(inviteDitLaBorne(INVITES[ROLE_REPLIQUES].systeme, REPLIQUES_PROPOSEES_MAX)).toBe(true)

		// CAS NÉGATIF FABRIQUÉ — un `toContain` est INERTE sans lui. (a) une invite qui
		// annonce une AUTRE borne ne satisfait pas le garde ;
		const bavarde = 'Tu en donnes deux au plus, et au moins une : le contexte est maigre.'
		expect(inviteDitLaBorne(bavarde, REPLIQUES_PROPOSEES_MAX)).toBe(false)
		// (b) et l'invite RÉELLE ne dit JAMAIS « deux au plus » — décision (3) du § 4 bis :
		// `PARLER_REPLIQUES` borne le DOCUMENT, jamais la réponse, et le nombre de
		// propositions acceptables VARIE d'un personnage à l'autre.
		expect(inviteDitLaBorne(INVITES[ROLE_REPLIQUES].systeme, 2)).toBe(false)
		// … et le mot de la borne 2 EXISTE bien dans la table : sans cette ligne, (b)
		// serait vrai par absence d'entrée plutôt que par absence dans l'invite.
		expect(BORNE_EN_TOUTES_LETTRES[2]).toBeDefined()
		expect(bavarde).toContain(String(BORNE_EN_TOUTES_LETTRES[2]))

		// ── LE QUATRIÈME RÔLE : LE COUPLE SYMÉTRIQUE ─────────────────────────────
		// Il n'a AUCUNE borne, et ce n'est pas un oubli : sa sortie est SCALAIRE, donc
		// « deux » n'est pas REPRÉSENTABLE — la meilleure garde est celle qui n'existe
		// pas. Le garde apparié est donc l'inverse du précédent : le gabarit porte une
		// CHAÎNE, et l'invite n'annonce AUCUNE des bornes en toutes lettres.
		const ROLE_PLAN = 'personnage-plan'
		const gabarits = extraire(PORTEUR_BRAIN)
		const valeurPlan = Object.values(JSON.parse(String(gabarits.get(ROLE_PLAN))) as Record<string, unknown>)[0]
		expect(Array.isArray(valeurPlan)).toBe(false)
		expect(typeof valeurPlan).toBe('string')
		const bornesAnnoncees = Object.keys(BORNE_EN_TOUTES_LETTRES).filter((borne) =>
			inviteDitLaBorne(INVITES[ROLE_PLAN].systeme, Number(borne)),
		)
		expect(bornesAnnoncees).toEqual([])

		// CAS NÉGATIF, LES DEUX MOITIÉS — sans elles les deux assertions ci-dessus sont
		// INERTES. (a) le prédicat de forme SAIT distinguer : le gabarit du rôle
		// répliques, lui, porte bien une LISTE ;
		const valeurListe = Object.values(JSON.parse(String(gabarits.get(ROLE_REPLIQUES))) as Record<string, unknown>)[0]
		expect(Array.isArray(valeurListe)).toBe(true)
		// (b) et le balayage des bornes SAIT rougir : une invite de plan qui en
		// annoncerait une serait attrapée.
		const planBavard = 'Tu en proposes trois au plus, et au moins une.'
		expect(
			Object.keys(BORNE_EN_TOUTES_LETTRES).filter((borne) => inviteDitLaBorne(planBavard, Number(borne))),
		).not.toEqual([])

		// ── LE CINQUIÈME RÔLE : LE GARDE S'APPLIQUE TEL QUEL ─────────────────────
		// Sa sortie est une LISTE BORNÉE, donc il retombe sous le couple du rôle
		// répliques et non sous le symétrique du rôle plan. `RELATIONS_PROPOSEES_MAX`
		// n'est PAS partagée avec `REPLIQUES_PROPOSEES_MAX` (§ 8, n° 26) : même valeur
		// aujourd'hui, aucune raison commune d'évoluer — et c'est bien la borne DE CE
		// RÔLE-LÀ que son invite annonce.
		expect(RELATIONS_PROPOSEES_MAX).toBe(3)
		expect(inviteDitLaBorne(INVITES[ROLE_RELATIONS].systeme, RELATIONS_PROPOSEES_MAX)).toBe(true)
		// … et AUCUNE AUTRE borne en toutes lettres ne s'y trouve : une invite qui
		// annoncerait « deux au plus » contredirait le validateur en silence.
		expect(inviteDitLaBorne(INVITES[ROLE_RELATIONS].systeme, 2)).toBe(false)
		// Discriminant : les DEUX bornes de la table sont éprouvées sur cette invite,
		// jamais une seule — et le mot de la borne 2 existe bel et bien.
		expect(
			Object.keys(BORNE_EN_TOUTES_LETTRES).filter((borne) =>
				inviteDitLaBorne(INVITES[ROLE_RELATIONS].systeme, Number(borne)),
			),
		).toEqual(['3'])

		// ── LE SIXIÈME RÔLE : LE GARDE S'ÉTEND SANS TOUCHER LA TABLE ─────────
		// ⚠ `'trois au plus'` EXISTAIT DÉJÀ dans `BORNE_EN_TOUTES_LETTRES` — la table ne
		// gagne AUCUNE entrée à l'itération 4. Mais un garde qui s'étend tout seul est un
		// garde que personne n'a ARMÉ : sans les lignes ci-dessous, le sixième rôle
		// n'aurait AUCUN témoin liant SON invite à SA borne, et rien ne rougirait.
		expect(FICHES_PROPOSEES_MAX).toBe(3)
		expect(inviteDitLaBorne(INVITES[ROLE_DISTRIBUTION].systeme, FICHES_PROPOSEES_MAX)).toBe(true)
		// … et AUCUNE AUTRE borne en toutes lettres ne s'y trouve : une invite qui
		// annoncerait << deux au plus >> contredirait le validateur EN SILENCE.
		expect(inviteDitLaBorne(INVITES[ROLE_DISTRIBUTION].systeme, 2)).toBe(false)
		expect(
			Object.keys(BORNE_EN_TOUTES_LETTRES).filter((borne) =>
				inviteDitLaBorne(INVITES[ROLE_DISTRIBUTION].systeme, Number(borne)),
			),
		).toEqual(['3'])
		// CAS NÉGATIF FABRIQUÉ, sans lequel les trois lignes ci-dessus sont INERTES : une
		// invite de distribution qui annoncerait l'AUTRE borne est attrapée.
		const distributionBavarde = 'Tu en donnes deux au plus, et au moins une : une histoire suppose quelqu un.'
		expect(inviteDitLaBorne(distributionBavarde, FICHES_PROPOSEES_MAX)).toBe(false)
		expect(inviteDitLaBorne(distributionBavarde, 2)).toBe(true)
		// … et la BORNE DE CE RÔLE-LÀ n'est partagée avec aucune autre (§ 8, n° 42) : même
		// valeur aujourd'hui, aucune raison commune d'évoluer. Les QUATRE constantes sont
		// lues séparément ici, jamais l'une pour l'autre.
		expect([REPLIQUES_PROPOSEES_MAX, RELATIONS_PROPOSEES_MAX, FICHES_PROPOSEES_MAX]).toEqual([3, 3, 3])
	})

	it('l invite du troisieme role ne recite AUCUN curseur — ni son nom, ni son libelle', () => {
		// LE VETO CURSEURS, gardé là où il peut l'être. La liste des six est DÉRIVÉE du
		// registre qui fait foi, jamais re-listée (KR-117) : un septième curseur entrerait
		// dans ce balayage sans qu'on touche ce test.
		//
		// ⚠ CE GARDE EST DÉLIBÉRÉMENT ÉTROIT, et le dire vaut mieux que de l'élargir :
		// un balayage sur `'parler'` ou `'seuil'` serait un FAUX POSITIF MESURÉ — l'invite
		// écrit légitimement « la façon de parler d'un personnage » et « jamais de seuil
		// ni de règle de jeu », qui est l'INTERDICTION elle-même. Un scanner non ancré a
		// des faux positifs (KR-235) ; le reste de la doctrine du § 4 bis n'est pas
		// constatable par un instrument (KR-229) et vit en commentaire dans `INVITES`.
		const systeme = INVITES[ROLE_REPLIQUES].systeme.toLowerCase()
		const interdits = [
			...Object.keys(CURSEURS),
			...Object.values(CURSEURS).map((descripteur) => descripteur.label.toLowerCase()),
			'curseur',
		]

		expect(interdits.filter((mot) => systeme.includes(mot))).toEqual([])
		// Discriminants : la liste balayée n'est pas vide, elle couvre bien les SIX
		// curseurs, et chaque mot SERAIT détecté s'il y était (KR-199/235).
		expect(Object.keys(CURSEURS)).toHaveLength(6)
		expect(interdits.filter((mot) => `${systeme} ${mot}`.includes(mot))).toEqual(interdits)
	})
})

describe('l invite nomme SON gabarit', () => {
	it.each(ROLES_AUTEUR)('l invite reellement composee du role %s contient son gabarit', (role) => {
		expect(inviteNommeSonGabarit(role, extraire(PORTEUR_BRAIN))).toBe(true)
	})

	it('une invite demandant une autre forme fait rougir le garde', () => {
		// CAS NÉGATIF OBLIGATOIRE — c'est EXACTEMENT la panne décrite en tête de
		// fichier : une invite qui demande une autre clé que celle que le client valide.
		const fabriquee = new Map(ROLES_AUTEUR.map((role) => [role, '{"texte": "…"}']))

		expect(ROLES_AUTEUR.filter((role) => inviteNommeSonGabarit(role, fabriquee))).toEqual([])
	})

	it('la cle nue ne suffirait pas a satisfaire le garde', () => {
		// Le discriminant du CHOIX du garde : une invite qui emploie le mot « valeur »
		// sans demander la forme passerait un garde posé sur la clé nue.
		const gabarits = extraire(PORTEUR_BRAIN)
		const cleNue = Object.keys(JSON.parse(String(gabarits.get(ROLE_PROSE))) as Record<string, unknown>)[0]
		const bavarde = new Map(gabarits).set(ROLE_PROSE, cleNue)

		expect(INVITES[ROLE_PROSE].systeme.includes(cleNue)).toBe(true)
		expect(inviteNommeSonGabarit(ROLE_PROSE, bavarde)).toBe(true)
		// … et pourtant une invite qui NE FAIT QUE nommer la clé ne satisfait pas le
		// garde réel, qui porte sur le gabarit entier.
		const inviteBavarde = `Tu décris la ${cleNue} de ce personnage pour l'auteur.`
		expect(inviteBavarde.includes(cleNue)).toBe(true)
		expect(inviteBavarde.includes(String(gabarits.get(ROLE_PROSE)))).toBe(false)
	})
})

describe('le temoin executable — du worker au validateur, dans le meme processus', () => {
	const URL_WORKER = 'https://worker.invalid'
	const URL_AMONT = 'https://amont.invalid/messages'

	const reglages: CloudSettingsService = {
		getWorkerUrl: () => URL_WORKER,
		setWorkerUrl: () => undefined,
		getSyncKey: () => 'une-cle-de-synchronisation',
		setSyncKey: () => undefined,
		isConfigured: () => true,
	}

	function dossierDeReference(): Dossier {
		const chemin = path.join(RACINE, 'src', 'brain', 'dossier', '__fixtures__', 'dossier-reference.json')
		return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
	}

	/** Le worker RÉEL au niveau 1, l'amont bouchonné au niveau 2 — et l'invite
	 *  RÉELLEMENT composée capturée au passage, jamais celle qu'on croit avoir
	 *  écrite. */
	async function traverser<T>(conforme: string, appel: () => Promise<T>): Promise<{ resultat: T; invite: string }> {
		let inviteSurLeFil: string | null = null
		const avant = globalThis.fetch
		globalThis.fetch = (async (cible: RequestInfo | URL, init?: RequestInit) => {
			const adresse = String(cible)
			if (adresse.startsWith(URL_WORKER)) {
				return worker.fetch(new Request(adresse, init), {
					GENLIV_KV: { get: async () => null, put: async () => undefined, delete: async () => undefined },
					IA_API_KEY: 'secret-de-test',
					IA_BASE_URL: URL_AMONT,
					IA_MODEL: 'un-modele',
				} as unknown as Parameters<typeof worker.fetch>[1])
			}
			inviteSurLeFil = (JSON.parse(String(init?.body)) as { system: string }).system
			return {
				ok: true,
				status: 200,
				json: async () => ({ content: [{ type: 'text', text: conforme }] }),
			} as unknown as Response
		}) as unknown as typeof fetch

		try {
			const resultat = await appel()
			expect(inviteSurLeFil).not.toBeNull()
			return { resultat, invite: String(inviteSurLeFil) }
		} finally {
			globalThis.fetch = avant
		}
	}

	it('role prose : une sortie conforme traverse le worker puis le validateur et rend propose', async () => {
		const gabarit = String(extraire(PORTEUR_BRAIN).get(ROLE_PROSE))
		// La sortie conforme est CONSTRUITE depuis le gabarit extrait — aucun littéral
		// de clé n'est retapé ici.
		const cle = Object.keys(JSON.parse(gabarit) as Record<string, unknown>)[0]
		const PROSE = 'Une note de fiche, tenue par ce canari, sans identifiant ni chiffre.'
		const conforme = JSON.stringify({ [cle]: PROSE })

		const dossier = dossierDeReference()
		const personnage = dossier.monde.personnages.find((p: Personnage) => p.fonction !== undefined)
		if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à cibler')

		const { resultat, invite } = await traverser(conforme, () =>
			createCopiloteService(reglages).demander(dossier, {
				role: ROLE_PROSE,
				entiteId: personnage.id,
				champ: 'monde.personnages[].fonction',
			}),
		)

		expect(invite).toContain(gabarit)
		expect(resultat).toEqual({
			statut: 'propose',
			proposition: { entiteId: personnage.id, champ: 'monde.personnages[].fonction', texte: PROSE },
		})
		// Et la même sortie passe le validateur seul : les deux moitiés du témoin sont
		// prouvées séparément, jamais l'une par l'autre (KR-197/199).
		expect(validerSortie(JSON.parse(conforme), dossier)).toEqual({ ok: true, valeur: PROSE })
	})

	it('temoin executable du second role', async () => {
		const gabarit = String(extraire(PORTEUR_BRAIN).get(ROLE_DETENTEURS))
		const cle = Object.keys(JSON.parse(gabarit) as Record<string, unknown>)[0]

		// LA CIBLE EST LUE DE LA FIXTURE INTACTE : l'un de ses indices porte une vérité
		// écrite, donc le chemin passant y est instanciable sans toucher au fichier.
		const dossier = dossierDeReference()
		const indice = dossier.monde.indices.find((candidat) => (candidat.verite ?? '').trim() !== '')
		if (indice === undefined) throw new Error('la fixture ne porte aucun indice à vérité écrite')

		// La table des rangs vient de l'ASSEMBLEUR, jamais re-dérivée (KR-231) : c'est
		// elle qui dit qui `P1` désigne, et c'est ce que le service doit re-résoudre.
		const contexte = assemblerDetenteurs(dossier, { role: ROLE_DETENTEURS, indiceId: indice.id })
		if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) : le témoin ne peut pas partir`)
		const premier = String(contexte.rangs.get('P1'))
		// Discriminants : `P1` désigne un personnage RÉEL du dossier, qui ne détient pas
		// déjà l'indice — sans eux, l'égalité finale serait vraie par construction.
		expect(dossier.monde.personnages.map((personnage) => personnage.id)).toContain(premier)
		expect(
			dossier.monde.personnages
				.find((personnage) => personnage.id === premier)
				?.savoirs.map((savoir) => savoir.indice_id),
		).not.toContain(indice.id)

		// La sortie conforme est CONSTRUITE depuis le gabarit extrait, et son unique
		// jeton est repris de la table des rangs — aucun littéral retapé.
		const conforme = JSON.stringify({ [cle]: ['P1'] })

		const { resultat, invite } = await traverser(conforme, () =>
			createCopiloteService(reglages).demander(dossier, { role: ROLE_DETENTEURS, indiceId: indice.id }),
		)

		expect(invite).toContain(gabarit)
		expect(resultat).toEqual({
			statut: 'propose',
			proposition: { indiceId: indice.id, personnageIds: [premier] },
		})
		// L'identifiant de l'indice ne franchit pas le réseau : ce qui part est le
		// contexte, ce qui revient est un jeton.
		expect(invite).not.toContain(indice.id)
	})

	it('temoin executable du troisieme role', async () => {
		const gabarit = String(extraire(PORTEUR_BRAIN).get(ROLE_REPLIQUES))
		// La sortie conforme est CONSTRUITE depuis le gabarit extrait — aucun littéral de
		// clé n'est retapé ici.
		const cle = Object.keys(JSON.parse(gabarit) as Record<string, unknown>)[0]
		const REPLIQUES = ['Pose ta bourse, puis pose ta question.', 'Je vends ce que j entends.']
		const conforme = JSON.stringify({ [cle]: REPLIQUES })

		const dossier = dossierDeReference()
		const personnage = dossier.monde.personnages.find((p: Personnage) => p.fonction !== undefined)
		if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à cibler')

		const { resultat, invite } = await traverser(conforme, () =>
			createCopiloteService(reglages).demander(dossier, { role: ROLE_REPLIQUES, personnageId: personnage.id }),
		)

		expect(invite).toContain(gabarit)
		expect(resultat).toEqual({
			statut: 'propose',
			proposition: { personnageId: personnage.id, ajouts: REPLIQUES },
		})
		// Et la même sortie passe le validateur SEUL : les deux moitiés du témoin sont
		// prouvées séparément, jamais l'une par l'autre (KR-197/199).
		expect(validerRepliques(JSON.parse(conforme), dossier)).toEqual({ ok: true, repliques: REPLIQUES })
		// L'identifiant du personnage ne franchit pas le réseau : ce qui part est le
		// contexte, ce qui revient est de la prose.
		expect(invite).not.toContain(personnage.id)
	})

	it('temoin executable du cinquieme role — le SEUL role MIXTE', async () => {
		// CE QUE CE TÉMOIN COUVRE ET QU'AUCUN AUTRE NE COUVRE : un élément qui porte À LA
		// FOIS un JETON re-résolu par `Map.get` et de la PROSE rendue telle quelle,
		// traversant le worker RÉEL puis le validateur, dans le MÊME processus.
		const gabarit = String(extraire(PORTEUR_BRAIN).get(ROLE_RELATIONS))
		const cle = Object.keys(JSON.parse(gabarit) as Record<string, unknown>)[0]

		const dossier = dossierDeReference()
		const personnage = dossier.monde.personnages.find((p: Personnage) => p.fonction !== undefined)
		if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à cibler')

		// La table des rangs vient de l'ASSEMBLEUR, jamais re-dérivée (KR-231) : c'est
		// elle qui dit qui `P1` désigne, et c'est ce que le service doit re-résoudre.
		const contexte = assemblerRelations(dossier, { role: ROLE_RELATIONS, personnageId: personnage.id })
		if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) : le témoin ne peut pas partir`)
		const premier = String(contexte.rangs.get('P1'))
		// Discriminants : `P1` désigne un personnage RÉEL, qui n'est NI le porteur NI une
		// cible déjà liée — sans eux, l'égalité finale serait vraie par construction.
		expect(dossier.monde.personnages.map((p: Personnage) => p.id)).toContain(premier)
		expect(premier).not.toBe(personnage.id)
		expect((personnage.relations ?? []).map((relation) => relation.cible_id)).not.toContain(premier)

		const NATURE = 'Il lui doit une dette ancienne, et il evite de croiser son regard depuis.'
		const conforme = JSON.stringify({ [cle]: [{ envers: 'P1', nature: NATURE }] })

		const { resultat, invite } = await traverser(conforme, () =>
			createCopiloteService(reglages).demander(dossier, { role: ROLE_RELATIONS, personnageId: personnage.id }),
		)

		expect(invite).toContain(gabarit)
		expect(resultat).toEqual({
			statut: 'propose',
			proposition: { personnageId: personnage.id, ajouts: [{ cibleId: premier, lien: NATURE }] },
		})
		// Et la même sortie passe le validateur SEUL : les deux moitiés du témoin sont
		// prouvées séparément, jamais l'une par l'autre (KR-197/199).
		expect(validerRelations(JSON.parse(conforme), new Set(contexte.rangs.keys()), dossier)).toEqual({
			ok: true,
			sortie: { rapports: [{ envers: 'P1', nature: NATURE }] },
		})
		// Ni l'identifiant du porteur ni celui de la cible ne franchissent le réseau : ce
		// qui part est le contexte, ce qui revient est un JETON et de la PROSE.
		expect(invite).not.toContain(personnage.id)
		expect(invite).not.toContain(premier)
	})

	it('temoin executable du sixieme role — le SEUL role de CREATION', async () => {
		// CE QUE CE TÉMOIN COUVRE ET QU'AUCUN AUTRE NE COUVRE : une sortie dont
		// l'acceptation fera NAÎTRE une entité, traversant le worker RÉEL puis le
		// validateur, dans le MÊME processus — et une proposition qui, à l'arrivée, ne
		// porte AUCUN identifiant.
		const gabarit = String(extraire(PORTEUR_BRAIN).get(ROLE_DISTRIBUTION))
		const cle = Object.keys(JSON.parse(gabarit) as Record<string, unknown>)[0]

		const dossier = dossierDeReference()
		// ⚠ AUCUNE CIBLE À RÉSOUDRE : la charge est VIDE, et c'est la différence avec les
		// cinq témoins précédents, qui devaient tous désigner une entité de la fixture.
		const contexte = assemblerDistribution(dossier, { role: ROLE_DISTRIBUTION })
		if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) : le témoin ne peut pas partir`)

		const PLACE = 'Passeur du gue bas, le seul a connaitre le fond par tous les temps.'
		const POURSUITE = 'Racheter la barque que son pere avait mise en gage, avant les pluies.'
		const conforme = JSON.stringify({ [cle]: [{ place: PLACE, poursuite: POURSUITE }] })

		const { resultat, invite } = await traverser(conforme, () =>
			createCopiloteService(reglages).demander(dossier, { role: ROLE_DISTRIBUTION }),
		)

		expect(invite).toContain(gabarit)
		// ⚠ LE RENOMMAGE DE DESTINATION EST LA SEULE RE-RÉSOLUTION : `place` → `fonction`,
		// `poursuite` → `but.libelle`. Et la proposition NE PORTE AUCUN IDENTIFIANT DE
		// CIBLE — la cible est le dossier.
		expect(resultat).toEqual({
			statut: 'propose',
			proposition: { ajouts: [{ fonction: PLACE, but: { libelle: POURSUITE } }] },
		})
		// Et la même sortie passe le validateur SEUL : les deux moitiés du témoin sont
		// prouvées séparément, jamais l'une par l'autre (KR-197/199).
		expect(validerDistribution(JSON.parse(conforme), dossier)).toEqual({
			ok: true,
			sortie: { distribution: [{ place: PLACE, poursuite: POURSUITE }] },
		})
		// ⚠ AUCUN IDENTIFIANT NE FRANCHIT LE RÉSEAU, dans AUCUN SENS : ni dans l'invite
		// composée, ni dans ce qui revient. Le code frappera l'identifiant à
		// l'ACCEPTATION, côté écran, et jamais avant.
		const identifiants = dossier.monde.personnages.map((p: Personnage) => p.id)
		expect(identifiants.length).toBeGreaterThan(0)
		expect(identifiants.filter((id) => invite.includes(id))).toEqual([])
		expect(JSON.stringify(resultat)).not.toContain('"id"')
	})

	it('temoin executable du huitieme role — le narrateur, du worker reel au validateur', async () => {
		// CE QUE CE TÉMOIN COUVRE ET QU'AUCUN AUTRE NE COUVRE : le gabarit du narrateur
		// n'a PAS de second porteur côté client (le rôle est hors `RoleCopilote`) ; la
		// SEULE liaison entre ce que l'invite du worker DEMANDE et ce que le client
		// VALIDE est donc CE traversé, plus l'égalité de clés du describe dédié en fin de
		// fichier. Une invite qui demanderait `{"recit": …}` rougirait ici.
		const gabarit = String(extraireGabaritDeJeu('narrateur'))
		const vide = JSON.parse(gabarit) as Record<string, unknown>
		const NARRATION = 'Vous fouillez la cendre froide ; rien ne bouge, et le beffroi reste muet.'
		const TENTATIVES = ['Monter vers la tour']
		// La sortie conforme est CONSTRUITE depuis les clés du gabarit extrait — aucune
		// clé retapée : la première porte la prose, la seconde la liste.
		const [cleProse, cleListe] = Object.keys(vide)
		const conforme = JSON.stringify({ [cleProse]: NARRATION, [cleListe]: TENTATIVES })

		const dossier = dossierDeReference()
		const ouverture = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!ouverture.ok) throw new Error(`ouverture refusée : ${ouverture.refus}`)
		const analyse = analyserSaisie('AGIR')
		if (!analyse.ok) throw new Error('AGIR refusé')
		const joue = executerCommande(dossier, ouverture.session, analyse.commande)
		if (!joue.ok) throw new Error('AGIR refusé')

		const { resultat, invite } = await traverser(conforme, () =>
			createCopiloteService(reglages).demander(dossier, {
				role: 'narrateur',
				saisie: 'je fouille la cendre',
				session: joue.session,
			}),
		)

		expect(invite).toContain(gabarit)
		expect(resultat).toEqual({ statut: 'propose', proposition: { recit: NARRATION, suggestions: TENTATIVES } })
		// Et la même sortie passe le validateur SEUL : les deux moitiés du témoin sont
		// prouvées séparément, jamais l'une par l'autre (KR-197/199).
		expect(validerNarrateur(JSON.parse(conforme), dossier)).toEqual({
			ok: true,
			sortie: { narration: NARRATION, tentatives: TENTATIVES },
		})
	})
})

describe('les deux plafonds', () => {
	const octets = (texte: string): number => new TextEncoder().encode(texte).length

	/**
	 * L'enveloppe est CONSTRUITE depuis les constantes réellement exportées — jamais
	 * retapée : une enveloppe retapée casserait silencieusement le lien que ce test
	 * garantit. Le squelette porte `champ`, que SEUL le rôle prose envoie : pour le
	 * rôle détenteurs c'est donc un MAJORANT, et un majorant est le bon sens d'erreur
	 * pour une garde de plafond.
	 */
	function enveloppe(role: string): string {
		const squelette = JSON.stringify({ role, champ: 'monde.personnages[].description_joueur', contexte: '' })
		return squelette + INVITES[role].systeme
	}

	const pireCasDe = (role: string, budget: number): number => octets('€'.repeat(budget)) + octets(enveloppe(role))

	/**
	 * LE PIRE CAS DE CHAQUE RÔLE, EN OCTETS — la grandeur que `TAILLE_MAX_CORPS_IA`
	 * borne RÉELLEMENT, et c'est elle, depuis l'itération 3c, qui désigne « le plus
	 * large ».
	 *
	 * ⚠ AMENDÉ, ET SUR UNE MESURE : jusqu'ici « le plus large » se dérivait du seul
	 * BUDGET. `personnage-relations` a EXACTEMENT le même budget qu'`indice-detenteurs`
	 * (17 000, deux mesures indépendantes — M = 5357 contre 5361), si bien que le
	 * maximum du budget est atteint par DEUX rôles et ne désigne plus personne. Or ce
	 * n'est pas le budget qui sature le plafond : c'est `3 × budget + enveloppe`, et
	 * l'enveloppe du rôle neuf est LA PLUS LONGUE DES CINQ (invite de 1859 o contre
	 * 808). Sur le PIRE CAS, le maximum est de nouveau atteint par UN SEUL rôle — et
	 * c'est `personnage-relations`, celui qui porte désormais le plafond.
	 *
	 * CE QUE L'AMENDEMENT ÉVITE, et c'est le motif : un « plus large » choisi sur le
	 * budget aurait rendu `indice-detenteurs` (premier des deux ex æquo dans l'ordre du
	 * registre), dont le pire cas est 1054 octets SOUS celui du rôle neuf — les deux
	 * canaris de séparation auraient alors mesuré un rôle QUI NE SATURE PLUS RIEN, en
	 * restant verts. Même classe de défaut que celui réparé à 3a sur ce même bloc : une
	 * garde qui cesse de mesurer sans jamais rougir (KR-235).
	 */
	// ⚠ ÉTENDU À `narrateur` À LA n° 10 it2 (`ROLES_PLAFONNES`) : « le plus large » se
	// dérive sur TOUS les rôles à budget client, jamais sur la seule famille auteur — sans
	// quoi les deux canaris viseraient le mauvais rôle le jour où le narrateur deviendrait
	// le plus large, en restant verts (KR-235).
	const PIRES_CAS: Record<string, number> = Object.fromEntries(
		ROLES_PLAFONNES.map((role) => [role, pireCasDe(role, BUDGETS_PLAFONNES[role])]),
	)

	/** LE RÔLE LE PLUS LARGE — DÉRIVÉ, jamais écrit. Sur un rôle étroit, les deux
	 *  canaris ci-dessous resteraient verts en ne discriminant rien : ils ne valent
	 *  que pour celui qui sature le plafond. */
	const ROLE_LE_PLUS_LARGE = ROLES_PLAFONNES.reduce((large, role) =>
		PIRES_CAS[role] > PIRES_CAS[large] ? role : large,
	)

	/**
	 * LE PRÉDICAT DU MAXIMUM UNIQUE — isolé pour que ses cas négatifs portent sur LA
	 * COMPARAISON RÉELLE et non sur la construction de leur propre témoin (KR-235). Il
	 * rend LA LISTE des rôles qui atteignent le maximum : l'échec NOMME les ex æquo.
	 */
	function rolesAuMaximum(budgets: Record<string, number>, roles: readonly string[]): string[] {
		const large = roles.reduce((max, role) => (budgets[role] > budgets[max] ? role : max))
		return roles.filter((role) => budgets[role] === budgets[large])
	}

	it('le maximum est atteint par exactement un role', () => {
		expect(PIRES_CAS[ROLE_LE_PLUS_LARGE]).toBe(Math.max(...ROLES_PLAFONNES.map((role) => PIRES_CAS[role])))
		// CE QUE CETTE LIGNE REMPLACE, ET POURQUOI. Jusqu'à l'itération 3a elle disait
		// `expect(new Set(ROLES_AUTEUR.map(r => BUDGETS[r])).size).toBe(ROLES_AUTEUR.length)` — les
		// budgets DEUX À DEUX DISTINCTS. C'est une PROPRIÉTÉ QUE PERSONNE N'A VOULUE :
		// rien n'interdit à deux rôles d'avoir la même mesure, et la seule chose dont
		// les deux canaris ci-dessous ont besoin est que « le plus large » DÉSIGNE
		// QUELQU'UN. La ligne restait verte PAR ACCIDENT DE LONGUEUR DE FIXTURE — donc
		// personne ne l'aurait corrigée, et c'est la QUATRIÈME entrée qui aurait payé.
		// ⚠ AMENDÉE À L'IT3c, ET SUR LA MESURE QU'ELLE-MÊME AVAIT ANNONCÉE : elle portait
		// sur `BUDGETS`, et la CINQUIÈME entrée l'a fait rougir — `personnage-relations`
		// mesure 17 000 comme `indice-detenteurs`. « Rien n'interdit à deux rôles d'avoir
		// la même mesure » : c'était vrai, et c'est arrivé. Elle porte désormais sur le
		// PIRE CAS EN OCTETS, qui EST la grandeur bornée par le plafond — et sur laquelle
		// le maximum est de nouveau atteint par un seul rôle.
		expect(rolesAuMaximum(PIRES_CAS, ROLES_PLAFONNES)).toEqual([ROLE_LE_PLUS_LARGE])
		// … et LE BUDGET, LUI, EST BIEN EX ÆQUO : sans cette ligne, on ne saurait pas que
		// l'amendement ci-dessus mesure quelque chose de NEUF plutôt que la même chose
		// autrement (KR-235).
		expect(rolesAuMaximum(BUDGETS_PLAFONNES, ROLES_PLAFONNES).length).toBeGreaterThan(1)
		// Et les TROIS tables portent bien UNE ENTRÉE PAR RÔLE : un rôle sans budget ne
		// doit pas passer pour un rôle à budget nul. Le registre auteur reste à SIX
		// entrées — le narrateur n'y entre pas, il n'entre que dans la table plafonnée.
		expect([...Object.keys(BUDGETS)].sort()).toEqual([...ROLES_AUTEUR].sort())
		expect([...Object.keys(BUDGETS_PLAFONNES)].sort()).toEqual([...ROLES_PLAFONNES].sort())
		expect([...Object.keys(PIRES_CAS)].sort()).toEqual([...ROLES_PLAFONNES].sort())
		// Discriminant de l'extension : le narrateur EST dans la table plafonnée, et il
		// n'est PAS le plus large aujourd'hui (MESURE du 2026-09-29, docstring de
		// `TAILLE_MAX_CORPS_IA`) — le plafond n'a pas bougé pour lui.
		expect(ROLES_PLAFONNES).toContain('narrateur')
		expect(ROLES_AUTEUR).not.toContain('narrateur')
		expect(ROLE_LE_PLUS_LARGE).not.toBe('narrateur')
	})

	it('le predicat du maximum unique est SEPARATEUR, et il ne dit QUE ce qu on veut', () => {
		const etroits = ROLES_PLAFONNES.filter((role) => role !== ROLE_LE_PLUS_LARGE)
		expect(etroits.length).toBeGreaterThan(1)

		// CAS NÉGATIF 1 — DEUX RÔLES EX ÆQUO AU MAXIMUM : « le plus large » cesse de
		// désigner quelqu'un, et les deux canaris de plafond cesseraient de discriminer.
		// Le prédicat doit rougir, et il NOMME les deux fautifs.
		const exAequoAuSommet = { ...PIRES_CAS, [etroits[0]]: PIRES_CAS[ROLE_LE_PLUS_LARGE] }
		expect(rolesAuMaximum(exAequoAuSommet, ROLES_PLAFONNES).length).toBeGreaterThan(1)
		expect(rolesAuMaximum(exAequoAuSommet, ROLES_PLAFONNES)).toContain(etroits[0])

		// CAS NÉGATIF 2 — LA MINE ELLE-MÊME, exécutée : DEUX RÔLES ÉTROITS ÉGAUX. C'est
		// un état parfaitement légitime — deux rôles peuvent avoir la même mesure — et
		// la propriété réellement voulue, elle, TIENT.
		//
		// ⚠ RÉ-ARMÉE À L'IT3b, ET ELLE ÉTAIT DEVENUE INERTE. `personnage-plan` MESURE
		// 4000, comme `personnage-repliques` : l'égalité que cette fabrication devait
		// CRÉER existait donc DÉJÀ, et l'ancienne précondition
		// (`new Set(...).size !== ROLES_AUTEUR.length`) était vraie AVANT toute fabrication —
		// vérifié en RETIRANT la fabrication, le test restait VERT. Un garde qui cesse
		// de mesurer en restant vert est exactement ce que KR-235 nomme.
		// La réparation : on choisit le couple de rôles étroits dont les valeurs
		// DIFFÈRENT — DÉRIVÉ, jamais écrit —, et la précondition porte désormais sur ce
		// que la fabrication A FAIT, pas sur une propriété globale de la table.
		// ⚠ RE-VÉRIFIÉE À L'IT3c, PARCE QUE LE BUDGET NEUF RETOMBE SUR 17 000 : sur
		// `BUDGETS` la mine serait de nouveau menacée d'inertie (deux couples y sont déjà
		// égaux). Sur `PIRES_CAS` les cinq valeurs sont DEUX À DEUX DISTINCTES — les
		// enveloppes diffèrent toutes —, donc la fabrication CRÉE bien une égalité qui
		// n'existait pas. Le `throw` ci-dessous reste la garde explicite du jour où ce ne
		// serait plus vrai : le risque existe, il n'est pas silencieux.
		const couple = paires(etroits).find(([a, b]) => PIRES_CAS[a] !== PIRES_CAS[b])
		if (couple === undefined) throw new Error('tous les rôles étroits ont le même pire cas : la mine est infabricable')
		const [source, cible] = couple
		const deuxEtroitsEgaux = { ...PIRES_CAS, [cible]: PIRES_CAS[source] }
		// LA FABRICATION A BIEN EU LIEU — les deux étaient distincts, ils ne le sont plus.
		expect(PIRES_CAS[source]).not.toBe(PIRES_CAS[cible])
		expect(deuxEtroitsEgaux[source]).toBe(deuxEtroitsEgaux[cible])
		// … et la propriété voulue TIENT sous cette égalité fabriquée.
		expect(rolesAuMaximum(deuxEtroitsEgaux, ROLES_PLAFONNES)).toEqual([ROLE_LE_PLUS_LARGE])
	})

	describe.each(ROLES_PLAFONNES)('role %s', (role) => {
		it('le budget client converti au pire cas d octets tient sous le plafond worker', () => {
			// `'€'` (BMP) coûte TROIS octets pour UNE unité de code : c'est la BORNE HAUTE
			// réelle, mesurée. Un émoji coûte 4 octets pour DEUX unités, soit 2 par
			// unité — écrire 4 serait une marge inventée présentée comme une borne.
			expect(octets('€')).toBe(3)
			expect(octets('\u{1F600}')).toBe(4)
			expect('\u{1F600}'.length).toBe(2)
			// Et le budget de CE rôle existe : un rôle sans budget ne doit pas passer
			// pour un rôle à budget nul.
			expect(BUDGETS_PLAFONNES[role]).toBeGreaterThan(0)

			expect(pireCasDe(role, BUDGETS_PLAFONNES[role])).toBeLessThanOrEqual(TAILLE_MAX_CORPS_IA)
		})
	})

	it('le lien est separateur : un plafond ampute d un kilo-octet ne couvre plus', () => {
		expect(pireCasDe(ROLE_LE_PLUS_LARGE, BUDGETS_PLAFONNES[ROLE_LE_PLUS_LARGE])).toBeGreaterThan(
			TAILLE_MAX_CORPS_IA - 1024,
		)
	})

	it('le lien est separateur : un budget releve de 400 caracteres ne tient plus', () => {
		expect(pireCasDe(ROLE_LE_PLUS_LARGE, BUDGETS_PLAFONNES[ROLE_LE_PLUS_LARGE] + 400)).toBeGreaterThan(
			TAILLE_MAX_CORPS_IA,
		)
	})
})

/**
 * `interprete` (mode JEU, n° 10) — HORS DE `ROLES_AUTEUR`, voir sa docstring de
 * définition plus haut : ce describe-ci NE VÉRIFIE PAS la parité avec
 * `RoleCopilote`, il constate seulement que le SEPTIÈME rôle a bien SES DEUX
 * entrées locales au worker (`INVITES`, et le `GABARIT_SORTIE` privé de ce
 * fichier, jamais exporté — précédent : la duplication délibérée documentée en
 * tête de `worker/index.ts`). Le reste de sa doctrine (forme du gabarit,
 * interdits KR-236, `max_tokens`, protocole amont épinglé) est déjà couvert,
 * en détail, par `worker/index.test.ts`.
 */
describe('interprete (mode jeu) — hors parite RoleCopilote, verifiee dans ses propres tests', () => {
	/** Extraction PROPRE à cette seule entrée, jamais l'expression ANCRÉE
	 *  `ENTREE_GABARIT` : celle-ci exige une clé QUOTÉE (`'[a-z-]+'`), et
	 *  Prettier retire les guillemets d'une clé sans tiret comme `interprete`
	 *  (`quoteProps: "as-needed"`, `.prettierrc`). Utiliser l'expression
	 *  partagée ferait passer cette entrée pour ABSENTE plutôt que NON
	 *  QUOTÉE — un faux négatif que cette extraction dédiée évite. */
	function extraireGabaritInterpreteDuWorker(): string | undefined {
		const source = fs.readFileSync(PORTEUR_WORKER, 'utf8')
		return source.match(/^\tinterprete: '(.+)',$/m)?.[1]
	}

	it('INVITES et le GABARIT_SORTIE local du worker portent une entree interprete, coherente entre elles', () => {
		expect(Object.prototype.hasOwnProperty.call(INVITES, 'interprete')).toBe(true)

		const gabarit = extraireGabaritInterpreteDuWorker()
		expect(gabarit).toBeDefined()
		// L'invite INCRUSTE son propre gabarit par interpolation (précédent des
		// six rôles auteur, `inviteNommeSonGabarit`) : le constater ici prouve
		// que les DEUX entrées locales existent ET s'accordent, sans avoir besoin
		// d'un second porteur côté client (`interprete` n'a pas de contrepartie
		// dans `RoleCopilote`, voir la docstring de `ROLES_AUTEUR`).
		expect(INVITES['interprete'].systeme).toContain(String(gabarit))
	})

	it('ROLES_AUTEUR exclut interprete, et ROLES le contient toujours', () => {
		// Discriminant de l'exemption : sans cette ligne, un `ROLES_AUTEUR` qui
		// aurait tout englobé par accident laisserait les tests ci-dessus VERTS
		// pour la mauvaise raison.
		expect(ROLES).toContain('interprete')
		expect(ROLES_AUTEUR).not.toContain('interprete')
	})
})

/**
 * `narrateur` (mode JEU, n° 10 it2) — HORS DE `ROLES_AUTEUR` comme `interprete`, et pour
 * la même raison. MAIS UNE DIFFÉRENCE, ET ELLE EST TESTÉE ICI : le narrateur a un BUDGET
 * CLIENT (`BUDGET_CARACTERES_NARRATEUR`), donc il entre dans `ROLES_PLAFONNES` (bloc
 * « les deux plafonds » ci-dessus). Et comme son gabarit n'a AUCUN second porteur côté
 * client, la liaison worker ↔ validateur passe par les CLÉS : celles du gabarit local au
 * worker doivent être EXACTEMENT `CLES_SORTIE_NARRATEUR`, que `validerNarrateur` exige.
 */
describe('narrateur (mode jeu) — hors parite RoleCopilote, mais sous le plafond et lie par ses cles', () => {
	it('INVITES et le GABARIT_SORTIE local du worker portent une entree narrateur, coherente entre elles', () => {
		expect(Object.prototype.hasOwnProperty.call(INVITES, 'narrateur')).toBe(true)
		const gabarit = extraireGabaritDeJeu('narrateur')
		expect(gabarit).toBeDefined()
		expect(INVITES['narrateur'].systeme).toContain(String(gabarit))
		// Discriminant de l'extraction : elle retrouve AUSSI le gabarit de l'interprète,
		// qu'une extraction cassée rendrait `undefined` pour les deux.
		expect(extraireGabaritDeJeu('interprete')).toBeDefined()
		expect(extraireGabaritDeJeu('personnage-plan')).toBeUndefined()
	})

	it('les cles du gabarit du worker sont EXACTEMENT celles que le validateur exige — KR-236 pour ce role', () => {
		const cles = Object.keys(JSON.parse(String(extraireGabaritDeJeu('narrateur'))) as Record<string, unknown>)
		expect(cles).toEqual([...CLES_SORTIE_NARRATEUR])
		// CAS NÉGATIF FABRIQUÉ, sans lequel l'égalité est INERTE : un gabarit qui
		// demanderait la clé du CHAMP (`recit`) — la confusion que KR-231 ferme — produirait
		// une sortie que le validateur REFUSE, à chaque essai, pour toujours.
		const dossier = JSON.parse(
			fs.readFileSync(path.join(RACINE, 'src', 'brain', 'dossier', '__fixtures__', 'dossier-reference.json'), 'utf8'),
		) as Dossier
		expect(validerNarrateur({ recit: 'Vous avancez.', tentatives: [] }, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerNarrateur({ [cles[0]]: 'Vous avancez.', [cles[1]]: [] }, dossier).ok).toBe(true)
	})

	it('la borne de l invite est celle du validateur : trois au plus, et JAMAIS au moins une', () => {
		// LA DUPLICATION « trois » (worker) / `TENTATIVES_MAX` (client) est inévitable —
		// aucun import `worker/` → `src/` en production — donc elle se GARDE.
		expect(TENTATIVES_MAX).toBe(3)
		expect(inviteDitLaBorne(INVITES['narrateur'].systeme, TENTATIVES_MAX)).toBe(true)
		expect(
			Object.keys(BORNE_EN_TOUTES_LETTRES).filter((borne) =>
				inviteDitLaBorne(INVITES['narrateur'].systeme, Number(borne)),
			),
		).toEqual(['3'])
		// ⚠ LA MOITIÉ SYMÉTRIQUE DU VIDE : le validateur ACCEPTE la liste vide, donc
		// l'invite ne dit JAMAIS « au moins une » — sans quoi les deux se contrediraient.
		// Discriminant : les rôles de rédaction à liste le disent, eux.
		expect(INVITES['narrateur'].systeme).not.toContain('au moins une')
		expect(INVITES[ROLE_REPLIQUES].systeme).toContain('au moins une')
	})

	it('ROLES_AUTEUR exclut narrateur, ROLES le contient, et ROLES_PLAFONNES aussi', () => {
		expect(ROLES).toContain('narrateur')
		expect(ROLES_AUTEUR).not.toContain('narrateur')
		expect(ROLES_PLAFONNES).toContain('narrateur')
		// Et l'interprète, SANS budget client, reste hors des deux.
		expect(ROLES_PLAFONNES).not.toContain('interprete')
		expect(BUDGET_CARACTERES_NARRATEUR).toBeGreaterThan(0)
	})
})
