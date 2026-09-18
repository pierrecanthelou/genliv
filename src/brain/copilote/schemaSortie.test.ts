import fs from 'node:fs'
import path from 'node:path'
import { construireAmorce, MARQUEUR_A_ECRIRE } from '../dossier/amorce'
import { collectIds, ESPACES_DE_NOMS } from '../dossier/identifiers'
import type { Dossier } from '../dossier/types'
import {
	CLES_SORTIE,
	CLES_SORTIE_DETENTEURS,
	CLES_SORTIE_PLAN,
	CLES_SORTIE_REPLIQUES,
	GABARIT_SORTIE,
	PROPOSITIONS_MAX,
	REPLIQUES_PROPOSEES_MAX,
	porteUnIdentifiant,
	validerDetenteurs,
	validerIntention,
	validerRepliques,
	validerSortie,
} from './schemaSortie'
import type { IntentionRendue, PropositionPlan, PropositionRepliques, RepliquesRendues } from './types'

/** Un dossier NEUF — c'est `construireAmorce` qui garantit `lieu.amorce`, et
 *  c'est pour ça que le canari de fuite le prend pour terrain : cet identifiant
 *  ne peut pas disparaître d'une fixture, il est semé par le code. */
function dossierNeuf(): Dossier {
	return construireAmorce('canari-du-scanner', 'Un dossier canari', '2026-09-17T00:00:00.000Z')
}

function dossierDeReference(): Dossier {
	const chemin = path.join(__dirname, '..', 'dossier', '__fixtures__', 'dossier-reference.json')
	return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
}

/** LES DEUX CANARIS, épinglés LITTÉRALEMENT — ce sont eux qui ont levé le veto de
 *  la QA sur la forme du scanner, et ils sont rejoués ici contre l'implémentation
 *  réelle, jamais contre un raisonnement. */
const CANARI_BENIN = 'Il dit: « Enfin.tout est pret. » Elle range son objet.favori.'
const CANARI_FUITE = 'Le sceau de lieu.amorce tient encore, mais plus pour longtemps.'

describe('validerSortie — les six predicats de forme', () => {
	const dossier = dossierDeReference()

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], ['valeur'], 'une chaine', 42, true]) {
			expect({ brut, ...validerSortie(brut, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — l ensemble des cles doit valoir exactement CLES_SORTIE', () => {
		const cle = CLES_SORTIE[0]
		// Une clé MANQUANTE.
		expect(validerSortie({}, dossier)).toEqual({ ok: false, motif: 'schema' })
		// Une clé RENOMMÉE — la panne KR-236 vue depuis le validateur.
		expect(validerSortie({ texte: 'une prose' }, dossier)).toEqual({ ok: false, motif: 'schema' })
		// Une clé HÉRITÉE ne compte pas : `Object.keys` ne voit que le propre (KR-175).
		expect(validerSortie(Object.create({ [cle]: 'une prose' }), dossier)).toEqual({ ok: false, motif: 'schema' })
	})

	it('2 bis — la cle surnumeraire est un REFUS, jamais un champ ignore', () => {
		// C'EST LA PREUVE QUE LA FORME RÉSEAU NE PORTE AUCUNE RÉFÉRENCE (KR-231) : une
		// sortie qui nommerait elle-même le champ pourrait nommer le MAUVAIS, et rien
		// n'arbitrerait. L'avaler rendrait aussi la panne KR-236 muette.
		expect(validerSortie({ [CLES_SORTIE[0]]: 'une prose', champ: 'monde.personnages[].fonction' }, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('3 — une valeur non textuelle est refusee, motif schema', () => {
		for (const valeur of [42, null, [], { texte: 'x' }, true]) {
			expect(validerSortie({ [CLES_SORTIE[0]]: valeur }, dossier)).toEqual({ ok: false, motif: 'schema' })
		}
	})

	it('4 — une valeur vide une fois les blancs retires est refusee, motif vide', () => {
		for (const valeur of ['', '   ', '\n\t ']) {
			expect(validerSortie({ [CLES_SORTIE[0]]: valeur }, dossier)).toEqual({ ok: false, motif: 'vide' })
		}
	})

	it('5 — une valeur portant le marqueur d amorce est refusee, motif marqueur', () => {
		// `includes`, JAMAIS `startsWith` : l'auteur peut éditer autour du marqueur, et
		// les chevrons ne se tapent pas au clavier, donc pas de faux positif (KR-223).
		expect(validerSortie({ [CLES_SORTIE[0]]: `${MARQUEUR_A_ECRIRE} à rédiger` }, dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		expect(validerSortie({ [CLES_SORTIE[0]]: `Une prose, puis ${MARQUEUR_A_ECRIRE} au milieu.` }, dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
	})

	it('6 — une valeur portant un identifiant du dossier est refusee, motif identifiant', () => {
		const neuf = dossierNeuf()

		expect(validerSortie({ [CLES_SORTIE[0]]: CANARI_FUITE }, neuf)).toEqual({ ok: false, motif: 'identifiant' })
	})

	it('le nominal rend ok avec la valeur, et rien d autre', () => {
		const prose = 'Marchand de sel et de lanternes, il monnaie surtout ce qu il entend.'

		expect(validerSortie({ [CLES_SORTIE[0]]: prose }, dossier)).toEqual({ ok: true, valeur: prose })
	})

	it('le gabarit EST le schema', () => {
		// La seule chose qui relie le littéral incrusté dans l'invite à la liste que
		// le validateur applique. Sans cette ligne, les deux dériveraient en silence.
		expect(Object.keys(JSON.parse(GABARIT_SORTIE['personnage-prose']) as Record<string, unknown>)).toEqual([
			...CLES_SORTIE,
		])
	})
})

describe('le scanner anti-identifiant — les deux canaris et les trois mutants', () => {
	it('canari BENIN : une prose francaise saine n est pas refusee', () => {
		const neuf = dossierNeuf()

		// LE CANARI DIT POURQUOI IL EST VERT : ce ne sont pas des identifiants de CE
		// dossier. Sans cette moitié, il pourrait être vert parce que le scanner est
		// inerte.
		const identifiants = collectIds(neuf).map((collecte) => collecte.id)
		expect(identifiants).not.toContain('fin.tout')
		expect(identifiants).not.toContain('objet.favori')

		expect(porteUnIdentifiant(CANARI_BENIN, neuf)).toBe(false)
		expect(validerSortie({ [CLES_SORTIE[0]]: CANARI_BENIN }, neuf)).toEqual({ ok: true, valeur: CANARI_BENIN })
	})

	it('canari FUITE : un identifiant en milieu de phrase fait refuser le LOT ENTIER', () => {
		const neuf = dossierNeuf()

		// `lieu.amorce` est GARANTI par `construireAmorce` : il ne peut pas disparaître
		// d'une fixture, puisque c'est le code qui le sème.
		expect(collectIds(neuf).map((collecte) => collecte.id)).toContain('lieu.amorce')
		expect(CANARI_FUITE.indexOf('lieu.amorce')).toBeGreaterThan(0)

		expect(porteUnIdentifiant(CANARI_FUITE, neuf)).toBe(true)
		// Le lot ENTIER est refusé : aucune réparation partielle, aucune valeur
		// tronquée rendue. Réparer, c'est interpréter (KR-230).
		const refus = validerSortie({ [CLES_SORTIE[0]]: CANARI_FUITE }, neuf)
		expect(refus).toEqual({ ok: false, motif: 'identifiant' })
		expect(refus).not.toHaveProperty('valeur')
	})

	it('canari FUITE : un identifiant de la fixture de reference est refuse aussi', () => {
		// Second terrain, autre forme d'identifiant (celui-là porte un tiret) : le
		// scanner ne dépend pas de la façon dont l'identifiant a été frappé.
		const reference = dossierDeReference()
		const prose = 'Le marchand pnj.corvin-le-marchand ne dira rien sans etre paye.'

		expect(validerSortie({ [CLES_SORTIE[0]]: prose }, reference)).toEqual({ ok: false, motif: 'identifiant' })
	})

	/**
	 * LES TROIS MUTANTS, ÉCRITS et non déduits. « La valeur attendue n'est pas le
	 * pouvoir séparateur » : mesurer que le scanner rend le bon résultat sur le bon
	 * code ne dit RIEN de ce qu'il ferait sur un code fautif nommé (BUG-087).
	 *
	 * Chacun est une implémentation FAUTIVE écrite ici, à côté de la vraie, et
	 * chacun est prouvé fautif sur un canari précis.
	 */
	const FORME_LACHE = new RegExp(`\\b(${Object.keys(ESPACES_DE_NOMS).join('|')})\\.[a-z0-9-]+`, 'g')
	/** Mutant 3 — la forme RESSERRÉE que la QA proposait : exiger un chiffre ou un
	 *  tiret dans le suffixe, pour tuer le faux positif `objet.favori`. */
	const FORME_RESSERREE = new RegExp(`\\b(${Object.keys(ESPACES_DE_NOMS).join('|')})\\.[a-z0-9-]*[0-9-][a-z0-9-]*`, 'g')

	it('mutant 1 — forme SEULE (intersection retiree) : le canari benin rougit', () => {
		const neuf = dossierNeuf()
		const mutant = (texte: string): boolean => FORME_LACHE.test(texte)
		FORME_LACHE.lastIndex = 0

		// La forme seule matche `objet.favori` dans une prose saine : elle refuserait
		// une sortie parfaitement légitime. C'est ce faux positif MESURÉ qui rend
		// l'intersection avec `collectIds` indispensable.
		expect(mutant(CANARI_BENIN)).toBe(true)
		FORME_LACHE.lastIndex = 0
		expect(porteUnIdentifiant(CANARI_BENIN, neuf)).toBe(false)
	})

	it('mutant 2 — appartenance SEULE, ensemble vide : la fuite reste verte', () => {
		// Un dossier sans aucun identifiant collecté rend l'intersection vide : le
		// scanner ne voit plus rien. C'est le mutant qui prouve que l'appartenance
		// PORTE réellement la décision, et n'est pas une décoration.
		const sansIdentifiants = { ...dossierNeuf(), monde: { ...dossierNeuf().monde, lieux: [] } } as Dossier

		expect(collectIds(sansIdentifiants).filter((collecte) => collecte.id !== null)).toEqual([])
		expect(porteUnIdentifiant(CANARI_FUITE, sansIdentifiants)).toBe(false)
		// Et le vrai scanner, lui, la voit — sur le dossier qui porte l'identifiant.
		expect(porteUnIdentifiant(CANARI_FUITE, dossierNeuf())).toBe(true)
	})

	it('mutant 3 — forme RESSERREE (chiffre ou tiret exige) : lieu.amorce s echappe', () => {
		// LE MUTANT DÉCOUVERT À L'ARBITRAGE, et c'est lui qui justifie la forme lâche.
		// La prémisse « les identifiants contiennent toujours un tiret » est vraie de
		// `randomToken()` mais FAUSSE des identifiants SEMÉS : `lieu.amorce` n'a ni
		// chiffre ni tiret.
		FORME_RESSERREE.lastIndex = 0
		expect(FORME_RESSERREE.test(CANARI_FUITE)).toBe(false)
		FORME_RESSERREE.lastIndex = 0
		// Le resserrage tuait bien le faux positif visé — et c'est ce qui le rendait
		// convaincant.
		expect(FORME_RESSERREE.test(CANARI_BENIN)).toBe(false)
		FORME_RESSERREE.lastIndex = 0
		// Mais la vraie forme, elle, attrape la fuite.
		expect(porteUnIdentifiant(CANARI_FUITE, dossierNeuf())).toBe(true)
	})

	it('le motif est DERIVE de ESPACES_DE_NOMS, jamais re-liste', () => {
		// KR-117 : une seconde liste d'espaces de noms divergerait au premier espace
		// ajouté, et le scanner cesserait de voir une famille entière d'identifiants
		// SANS qu'un test rougisse. Le balayage porte sur la SOURCE.
		const source = fs.readFileSync(path.join(__dirname, 'schemaSortie.ts'), 'utf8')
		const DERIVATION = ['Object.keys(', 'ESPACES_DE_NOMS', ').join(', "'|'", ')'].join('')

		expect(source).toContain(DERIVATION)
		expect(Object.keys(ESPACES_DE_NOMS).filter((espace) => source.includes(`'${espace}'`))).toEqual([])
	})

	it('LIMITE CONNUE, non comblee : la casse', () => {
		// À recopier dans la revue : `Objet.favori-2` en début de phrase ne matche pas,
		// l'alternation étant en minuscules. Risque jugé faible — un modèle recopie un
		// chemin en minuscules — mais c'est une limite, pas un trou comblé, et un test
		// qui la NOMME vaut mieux qu'une phrase dans une note de tour.
		const neuf = dossierNeuf()
		const enCapitale = 'Lieu.amorce tient encore.'

		expect(porteUnIdentifiant(enCapitale, neuf)).toBe(false)
		expect(porteUnIdentifiant(enCapitale.toLowerCase(), neuf)).toBe(true)
	})
})

describe('validerDetenteurs — les sept predicats de forme du second role', () => {
	/** La table des rangs telle que l'assembleur la rend, réduite à ses CLÉS : le
	 *  validateur ne connaît que l'appartenance, jamais les identifiants. */
	const RANGS: ReadonlySet<string> = new Set(['P1', 'P2', 'P3'])
	const CLE = CLES_SORTIE_DETENTEURS[0]

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], ['P1'], 'P1', 42, true]) {
			expect({ brut, ...validerDetenteurs(brut, RANGS) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — l ensemble des cles doit valoir exactement CLES_SORTIE_DETENTEURS', () => {
		// Une clé MANQUANTE, une clé RENOMMÉE (la panne KR-236 vue du validateur), une
		// clé SURNUMÉRAIRE — un REFUS, jamais un champ ignoré : l'avaler rendrait la
		// panne KR-236 muette, et une sortie qui nommerait elle-même l'indice pourrait
		// nommer le MAUVAIS (KR-231).
		expect(validerDetenteurs({}, RANGS)).toEqual({ ok: false, motif: 'schema' })
		expect(validerDetenteurs({ rangs: ['P1'] }, RANGS)).toEqual({ ok: false, motif: 'schema' })
		expect(validerDetenteurs({ [CLE]: ['P1'], indice_id: 'indice.trace-du-guet' }, RANGS)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Une clé HÉRITÉE ne compte pas : `Object.keys` ne voit que le propre (KR-175).
		expect(validerDetenteurs(Object.create({ [CLE]: ['P1'] }), RANGS)).toEqual({ ok: false, motif: 'schema' })
	})

	it('3 — une valeur qui n est pas un tableau est refusee, motif schema', () => {
		for (const valeur of ['P1', 42, null, { P1: true }, true]) {
			expect({ valeur, ...validerDetenteurs({ [CLE]: valeur }, RANGS) }).toEqual({ valeur, ok: false, motif: 'schema' })
		}
	})

	it('4 — un element non textuel est refuse, motif schema', () => {
		// 1, 2.5, -1 : le modèle a émis un NOMBRE au lieu d'un jeton. C'est précisément
		// ce que le préfixe P décourage — et ce que ce prédicat arrête.
		for (const element of [1, 2.5, -1, null, ['P1'], { rang: 'P1' }]) {
			expect({ element, ...validerDetenteurs({ [CLE]: [element] }, RANGS) }).toEqual({
				element,
				ok: false,
				motif: 'schema',
			})
		}
	})

	it('5 — longueur 4 refusee, jamais tronquee', () => {
		// ANTI-COMPLAISANCE (a) : « proposer tout le monde ». Le refus porte sur le LOT
		// ENTIER — la sortie fautive ne ressort NI tronquée à trois, NI partiellement.
		const trop = ['P1', 'P2', 'P3', 'P1bis']
		expect(trop.length).toBeGreaterThan(PROPOSITIONS_MAX)

		const refus = validerDetenteurs({ [CLE]: trop }, new Set([...RANGS, 'P1bis']))

		expect(refus).toEqual({ ok: false, motif: 'schema' })
		expect(refus).not.toHaveProperty(CLE)
		// Et EXACTEMENT PROPOSITIONS_MAX passe : sans ce bord, le prédicat pourrait
		// porter un `>=` pour un `>` sans qu'un test rougisse.
		expect(validerDetenteurs({ [CLE]: ['P1', 'P2', 'P3'] }, RANGS)).toEqual({
			ok: true,
			detenteurs: ['P1', 'P2', 'P3'],
		})
	})

	it('6 — doublon non adjacent', () => {
		// Deux fois le même rang écrirait DEUX savoirs identiques sur le même
		// personnage. Non adjacent : un garde qui ne comparerait qu'aux voisins
		// passerait.
		expect(validerDetenteurs({ [CLE]: ['P1', 'P2', 'P1'] }, RANGS)).toEqual({ ok: false, motif: 'schema' })
	})

	it('7 — rang de forme legale hors table reelle', () => {
		// P5 a la FORME d'un rang et n'est PAS dans la table. C'est le discriminant du
		// choix de conception : la garantie d'un rang est son APPARTENANCE, jamais sa
		// silhouette (KR-231/KR-235).
		expect(validerDetenteurs({ [CLE]: ['P5'] }, RANGS)).toEqual({ ok: false, motif: 'rang-inconnu' })
	})

	it('la liste vide est un SUCCES', () => {
		// Le prédicat de non-vacuité de l'it1 NE SE TRANSPORTE PAS : il gardait une
		// prose SCALAIRE, où le vide est une non-réponse ; sur une LISTE le vide EST une
		// réponse. Punir la réponse honnête est une machine à complaisance.
		expect(validerDetenteurs({ [CLE]: [] }, RANGS)).toEqual({ ok: true, detenteurs: [] })
	})

	it('le nominal rend ok avec les jetons, et rien d autre', () => {
		expect(validerDetenteurs({ [CLE]: ['P2'] }, RANGS)).toEqual({ ok: true, detenteurs: ['P2'] })
	})

	it('item 1 seul casse rejette le lot ENTIER, jamais P1 tout seul', () => {
		// LE POUVOIR SÉPARATEUR, ÉCRIT ET NON DÉDUIT (BUG-087) : « la valeur attendue
		// n'est pas le pouvoir séparateur ». On écrit ICI l'implémentation FAUTIVE que
		// ce test existe pour attraper — le REPÊCHAGE PARTIEL (§ 8, TL-6) — et on
		// constate qu'elle rendrait ['P1'], ce que la vraie refuse.
		const lot = ['P1', 'P9']
		const mutantRepechage = (rendus: readonly string[]): string[] => rendus.filter((rang) => RANGS.has(rang))

		expect(mutantRepechage(lot)).toEqual(['P1'])

		const refus = validerDetenteurs({ [CLE]: lot }, RANGS)

		expect(refus).toEqual({ ok: false, motif: 'rang-inconnu' })
		// Rien de la sortie fautive ne survit : l'auteur ne peut pas ratifier une liste
		// tronquée sans savoir qu'elle l'est.
		expect(refus).not.toHaveProperty(CLE)
		expect(JSON.stringify(refus)).not.toContain('P1')
	})

	it('aucune conversion numerique nulle part', () => {
		// Number('P1') vaut NaN. Un validateur qui convertirait refuserait donc TOUS les
		// jetons légitimes — et un validateur qui indexerait arithmétiquement rouvrirait
		// la classe entière des décalages base-0 / base-1. Le mutant est ÉCRIT, vu faux,
		// puis laissé ici comme témoin.
		const mutantNumerique = (rang: string): boolean => Number.isInteger(Number(rang))

		expect(Number('P1')).toBeNaN()
		expect(mutantNumerique('P1')).toBe(false)
		// La vraie, elle, accepte — parce qu'elle fait un `Set.has` sur la chaîne telle
		// quelle.
		expect(validerDetenteurs({ [CLE]: ['P1'] }, RANGS)).toEqual({ ok: true, detenteurs: ['P1'] })

		// Et le balayage de SOURCE ferme la porte pour de bon : la propriété est
		// affirmée en docstring, donc elle a besoin d'un test (KR-169).
		// Les COMMENTAIRES sont retirés d'abord, et ce n'est pas un détail : la
		// docstring de `validerDetenteurs` NOMME les deux conversions qu'elle
		// s'interdit, donc un balayage brut rougirait sur la phrase qui dit la règle.
		const source = fs
			.readFileSync(path.join(__dirname, 'schemaSortie.ts'), 'utf8')
			.replace(/\/\*[\s\S]*?\*\//g, '')
			.replace(/^[ \t]*\/\/.*$/gm, '')
		expect(source).not.toContain('Number(')
		expect(source).not.toContain('parseInt')
		// Discriminant : le balayage porte bien sur du code réel — sans cette ligne, un
		// retrait de commentaires trop gourmand le rendrait vert sur du vide.
		expect(source).toContain('export function validerDetenteurs(')
	})

	it('le schema de sortie ne porte aucune cle de prose', () => {
		// CLAUSE (b) DE LA CONDITION D'ÉTAT ré-écrite sur `monde.indices[].verite`
		// (§ 4.7) : le champ n'entre en RÉDACTION que si le schéma de sortie du rôle NE
		// PEUT PORTER AUCUNE PROSE. Trois lignes, chacune ferme une porte.
		// (a) aucune clé commune avec le schéma de prose — on ne peut pas passer l'une
		//     pour l'autre ;
		expect(CLES_SORTIE_DETENTEURS.filter((cle) => (CLES_SORTIE as readonly string[]).includes(cle))).toEqual([])
		// (b) la valeur du gabarit est une LISTE de jetons, jamais une chaîne ;
		const rendu = JSON.parse(GABARIT_SORTIE['indice-detenteurs']) as Record<string, unknown>
		expect(Object.keys(rendu)).toEqual([...CLES_SORTIE_DETENTEURS])
		expect(Array.isArray(rendu[CLE])).toBe(true)
		// (c) et une prose glissée dans la liste est refusée : elle n'appartient à
		//     aucune table de rangs, et rien ne la repêche.
		expect(validerDetenteurs({ [CLE]: ['Le sceau a ete brise de l interieur.'] }, RANGS)).toEqual({
			ok: false,
			motif: 'rang-inconnu',
		})
	})

	it('le gabarit du second role EST son schema', () => {
		expect(Object.keys(JSON.parse(GABARIT_SORTIE['indice-detenteurs']) as Record<string, unknown>)).toEqual([
			...CLES_SORTIE_DETENTEURS,
		])
	})
})

// ══ LE TROISIÈME RÔLE — `personnage-repliques` ═══════════════════════════════

describe('types — zero cle commune reseau / resolu', () => {
	it('RepliquesRendues et PropositionRepliques n ont aucune cle en commun', () => {
		// KR-231, MOITIÉ 1 — L'INTERSECTION DES CLÉS EST VIDE, constatée en VALEUR sur
		// deux témoins minimaux. Une `interface` n'existe plus au runtime : ce sont ces
		// littéraux, ANNOTÉS, qui obligent le compilateur à les tenir à jour.
		const rendues: RepliquesRendues = { repliques: ['Je ne dis jamais deux fois la meme chose.'] }
		const resolue: PropositionRepliques = { personnageId: 'pnj.un-personnage', ajouts: ['Une replique.'] }

		expect(Object.keys(rendues).filter((cle) => Object.keys(resolue).includes(cle))).toEqual([])
		// Discriminant : les deux portent BIEN des clés — sans lui, deux objets vides
		// satisferaient l'intersection vide (KR-199).
		expect(Object.keys(rendues).length).toBeGreaterThan(0)
		expect(Object.keys(resolue).length).toBeGreaterThan(0)
	})

	it('l affectation croisee ne compile pas', () => {
		// KR-231, MOITIÉ 2, ET C'EST LE TEST RÉEL : « zéro clé commune » n'est une
		// GARANTIE que si le compilateur refuse de passer l'une pour l'autre.
		// `@ts-expect-error` ÉCHOUE À LA COMPILATION si l'erreur attendue n'a PAS lieu.
		// @ts-expect-error — la forme RÉSEAU affectée à la forme RE-RÉSOLUE.
		const versResolue: PropositionRepliques = { repliques: ['Une replique.'] }
		// @ts-expect-error — la forme RE-RÉSOLUE affectée à la forme RÉSEAU.
		const versRendues: RepliquesRendues = { personnageId: 'pnj.x', ajouts: ['Une replique.'] }

		// Discriminant : les deux affectations BIEN APPARIÉES compilent, elles. Sans
		// cette moitié, les deux `@ts-expect-error` seraient satisfaits par n'importe
		// quelle erreur de type, y compris « ce type n'existe pas ».
		const bonnesRendues: RepliquesRendues = { repliques: ['Une replique.'] }
		const bonneResolue: PropositionRepliques = { personnageId: 'pnj.x', ajouts: ['Une replique.'] }

		expect([versResolue, versRendues, bonnesRendues, bonneResolue]).toHaveLength(4)
	})
})

describe('validerRepliques — les dix predicats de forme du troisieme role', () => {
	const dossier = dossierDeReference()
	const CLE = CLES_SORTIE_REPLIQUES[0]
	/** Deux répliques parfaitement saines : ni identifiant, ni marqueur, ni chiffre. */
	const SAINE = 'Je vends ce que j entends, et j entends beaucoup.'
	const SAINE_2 = 'Pose ta bourse, puis pose ta question.'

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], ['une replique'], 'une replique', 42, true]) {
			expect({ brut, ...validerRepliques(brut, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — l ensemble des cles doit valoir exactement CLES_SORTIE_REPLIQUES', () => {
		// Une clé MANQUANTE, une clé RENOMMÉE (la panne KR-236 vue du validateur), une
		// clé SURNUMÉRAIRE — un REFUS, jamais un champ ignoré : l'avaler rendrait la
		// panne KR-236 muette, et une sortie qui nommerait elle-même le champ pourrait
		// nommer le MAUVAIS (KR-231).
		expect(validerRepliques({}, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerRepliques({ textes: [SAINE] }, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerRepliques({ [CLE]: [SAINE], champ: 'monde.personnages[].caractere.parler[]' }, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Une clé HÉRITÉE ne compte pas : `Object.keys` ne voit que le propre (KR-175).
		expect(validerRepliques(Object.create({ [CLE]: [SAINE] }), dossier)).toEqual({ ok: false, motif: 'schema' })
	})

	it('3 — une valeur qui n est pas un tableau est refusee, motif schema', () => {
		for (const valeur of [SAINE, 42, null, { 0: SAINE }, true]) {
			expect({ valeur, ...validerRepliques({ [CLE]: valeur }, dossier) }).toEqual({
				valeur,
				ok: false,
				motif: 'schema',
			})
		}
	})

	it('4 — un element non textuel est refuse, motif schema, et JAMAIS converti', () => {
		// Un `{texte: "…"}` EMBALLÉ meurt ici. La conversion `String(élément)` est
		// l'anti-patron exact : elle produirait `'[object Object]'` puis la présenterait
		// à l'auteur comme une réplique.
		for (const element of [42, null, [SAINE], { texte: SAINE }, true]) {
			expect({ element, ...validerRepliques({ [CLE]: [element] }, dossier) }).toEqual({
				element,
				ok: false,
				motif: 'schema',
			})
		}
		// Le mutant est ÉCRIT, et vu FAUX : il fabrique une chaîne là où il n'y en a pas.
		expect(String({ texte: SAINE })).toBe('[object Object]')
	})

	it('5 — 4 refusees, 3 acceptees : la borne par COMPORTEMENT', () => {
		// ANTI-COMPLAISANCE : un modèle qui « complète » pour faire nombre. Le refus
		// porte sur le LOT ENTIER — la sortie ne ressort NI tronquée à trois, NI
		// partiellement (KR-230).
		const quatre = [SAINE, SAINE_2, 'Compte tes pieces avant de compter sur moi.', 'Reviens demain, ou ne reviens pas.']
		expect(quatre.length).toBeGreaterThan(REPLIQUES_PROPOSEES_MAX)

		const refus = validerRepliques({ [CLE]: quatre }, dossier)

		expect(refus).toEqual({ ok: false, motif: 'schema' })
		expect(refus).not.toHaveProperty(CLE)
		// Et EXACTEMENT `REPLIQUES_PROPOSEES_MAX` passe : sans ce bord, le prédicat
		// pourrait porter un `>=` pour un `>` sans qu'un test rougisse.
		const trois = quatre.slice(0, REPLIQUES_PROPOSEES_MAX)
		expect(validerRepliques({ [CLE]: trois }, dossier)).toEqual({ ok: true, repliques: trois })
	})

	it('6 — liste vide refusee, motif vide', () => {
		// LE DISCRIMINANT DE L'IT3a, et il ne se transporte pas de l'it2 : un rôle de
		// RÉDACTION écrit un texte que RIEN ne fournit. « Comment parle-t-il ? » a
		// toujours une réponse dès qu'il existe quelqu'un pour parler — « je n'écris
		// rien » est une NON-RÉPONSE. Le cas « personne pour parler » est traité AVANT
		// l'appel, par `cible-a-ecrire`.
		expect(validerRepliques({ [CLE]: [] }, dossier)).toEqual({ ok: false, motif: 'vide' })
		// Et le rôle de DÉSIGNATION, lui, n'a PAS bougé : la liste vide y reste un
		// SUCCÈS. Les deux moitiés sont ici, sinon « amendé » serait indistinguable de
		// « remplacé ».
		expect(validerDetenteurs({ detenteurs: [] }, new Set(['P1']))).toEqual({ ok: true, detenteurs: [] })
	})

	it('7 — element blanc APRES un valide, motif vide, index >= 1', () => {
		// L'INDEX EST LE POINT : un scanner qui ne regarderait que `[0]` trouverait la
		// première réplique parfaitement valide et accepterait le lot.
		const lot = [SAINE, '   ']
		expect(lot.indexOf('   ')).toBeGreaterThan(0)

		expect(validerRepliques({ [CLE]: lot }, dossier)).toEqual({ ok: false, motif: 'vide' })
		// Les trois formes de blanc, toutes en position non nulle.
		for (const blanc of ['', '   ', '\n\t ']) {
			expect({ blanc, ...validerRepliques({ [CLE]: [SAINE, blanc] }, dossier) }).toEqual({
				blanc,
				ok: false,
				motif: 'vide',
			})
		}
	})

	it('6 et 7 sont DEUX predicats distincts, chacun rougissant seul', () => {
		// CRITÈRE 3 : les DEUX entrées rendent `vide`, mais elles ne meurent PAS du même
		// prédicat. La preuve est une NEUTRALISATION : on écrit les deux mutants, et
		// chacun laisse passer EXACTEMENT UNE des deux entrées — donc aucun des deux
		// prédicats n'est redondant.
		const listeVide: string[] = []
		const blancTardif = [SAINE, '   ']

		// MUTANT A — le prédicat (6) retiré. La liste vide passe, le blanc tardif meurt.
		const sans6 = (rendues: readonly string[]): 'passe' | 'vide' =>
			rendues.some((replique) => replique.trim().length === 0) ? 'vide' : 'passe'
		expect(sans6(listeVide)).toBe('passe')
		expect(sans6(blancTardif)).toBe('vide')

		// MUTANT B — le prédicat (7) retiré. Le blanc tardif PASSE, la liste vide meurt.
		const sans7 = (rendues: readonly string[]): 'passe' | 'vide' => (rendues.length === 0 ? 'vide' : 'passe')
		expect(sans7(blancTardif)).toBe('passe')
		expect(sans7(listeVide)).toBe('vide')

		// Et la VRAIE refuse les deux : c'est la moitié sans laquelle les mutants
		// ci-dessus ne prouveraient rien du code livré.
		expect(validerRepliques({ [CLE]: listeVide }, dossier)).toEqual({ ok: false, motif: 'vide' })
		expect(validerRepliques({ [CLE]: blancTardif }, dossier)).toEqual({ ok: false, motif: 'vide' })
	})

	it('8 — doublon apres trim refuse', () => {
		// MOTIVATION, et elle n'est pas recopiée de l'it2 : deux répliques identiques
		// sont un REMPLISSAGE — un menu de 2 présenté comme un menu de 3, produit par un
		// modèle qui « complète » pour atteindre la borne. Et `PARLER_REPLIQUES` vaut
		// DEUX : un doublon accepté consommerait l'un des deux seuls emplacements du
		// personnage POUR RIEN. C'est bien une conséquence d'écriture, pas une
		// coquetterie de forme. (`schemaSortie.ts` n'importe JAMAIS `PARLER_REPLIQUES` :
		// la borne du DOCUMENT motive ce prédicat, elle ne le paramètre pas.)
		expect(validerRepliques({ [CLE]: [SAINE, SAINE] }, dossier)).toEqual({ ok: false, motif: 'schema' })
		// APRÈS `trim()` : deux répliques qui ne diffèrent que par leurs blancs de bord
		// sont la MÊME réplique une fois écrite dans le document.
		expect(validerRepliques({ [CLE]: [SAINE, `  ${SAINE}  `] }, dossier)).toEqual({ ok: false, motif: 'schema' })
		// NON ADJACENT : un garde qui ne comparerait qu'aux voisins passerait.
		expect(validerRepliques({ [CLE]: [SAINE, SAINE_2, SAINE] }, dossier)).toEqual({ ok: false, motif: 'schema' })
		// Discriminant : deux répliques réellement différentes passent.
		expect(validerRepliques({ [CLE]: [SAINE, SAINE_2] }, dossier)).toEqual({ ok: true, repliques: [SAINE, SAINE_2] })
	})

	it('9 — marqueur a ecrire refuse, constante IMPORTEE', () => {
		// LE TEST IMPORTE `MARQUEUR_A_ECRIRE` (KR-223) : aucun fichier de feature ni
		// aucun test n'a le droit d'écrire le glyphe, et le retaper ici ferait de ce
		// fichier un second porteur de la valeur.
		expect(validerRepliques({ [CLE]: [`${MARQUEUR_A_ECRIRE} a rediger`] }, dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		// EN POSITION NON NULLE, et `includes` plutôt que `startsWith` : l'auteur peut
		// éditer autour du marqueur.
		expect(validerRepliques({ [CLE]: [SAINE, `Une phrase, puis ${MARQUEUR_A_ECRIRE} au milieu.`] }, dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
	})

	it('10 — identifiant en DERNIERE position : le lot ENTIER est refuse', () => {
		// CRITÈRE 4. L'identifiant est au DERNIER rang, et les précédentes sont saines :
		// c'est ce qui rend le mutant « ne scanner que `[0]` » observable.
		const neuf = dossierNeuf()
		const lot = [SAINE, SAINE_2, CANARI_FUITE]
		expect(lot.indexOf(CANARI_FUITE)).toBe(lot.length - 1)

		const refus = validerRepliques({ [CLE]: lot }, neuf)

		expect(refus).toEqual({ ok: false, motif: 'identifiant' })
		// RIEN de la sortie fautive ne survit : ni la liste, ni les éléments sains.
		expect(refus).not.toHaveProperty(CLE)
		expect(JSON.stringify(refus)).not.toContain(SAINE)
	})

	it('les deux canaris de l it1, rejoues sur un element NON-0', () => {
		// Les canaris de l'it1 gardaient un SCALAIRE : par construction, ils ne portaient
		// que sur la position 0. Rejoués ici en position ≥ 1, ils prouvent que le scanner
		// voit TOUTE la liste — et qu'il ne fabrique pas de faux positif pour autant.
		const neuf = dossierNeuf()

		// CANARI BÉNIN en position 1 : une prose française saine passe.
		expect(collectIds(neuf).map((collecte) => collecte.id)).not.toContain('objet.favori')
		expect(validerRepliques({ [CLE]: [SAINE, CANARI_BENIN] }, neuf)).toEqual({
			ok: true,
			repliques: [SAINE, CANARI_BENIN],
		})

		// CANARI FUITE en position 1 : un identifiant RÉELLEMENT du dossier refuse.
		expect(collectIds(neuf).map((collecte) => collecte.id)).toContain('lieu.amorce')
		expect(validerRepliques({ [CLE]: [SAINE, CANARI_FUITE] }, neuf)).toEqual({ ok: false, motif: 'identifiant' })
	})

	it('mutant — ne scanner que l element 0 : la fuite en derniere position s echappe', () => {
		// LE POUVOIR SÉPARATEUR, ÉCRIT ET NON DÉDUIT (BUG-087). L'implémentation FAUTIVE
		// est ici, à côté de la vraie, et elle est prouvée fautive sur un lot précis.
		const neuf = dossierNeuf()
		const lot = [SAINE, SAINE_2, CANARI_FUITE]
		const mutantIndexZero = (rendues: readonly string[]): boolean => porteUnIdentifiant(rendues[0], neuf)

		expect(mutantIndexZero(lot)).toBe(false)
		// … et la vraie, elle, refuse.
		expect(validerRepliques({ [CLE]: lot }, neuf)).toEqual({ ok: false, motif: 'identifiant' })
	})

	it('mutant — join avant le scan : un faux positif FABRIQUE a la frontiere', () => {
		// § 8, n° 22. Deux fragments logés dans DEUX CASES DISTINCTES ne forment pas un
		// identifiant : aucun lecteur ne les lira collés, ils deviendront deux entrées
		// SÉPARÉES de `parler[]`. Le lot ci-dessous est SAIN — aucun de ses deux éléments
		// ne porte d'identifiant — et pourtant le scan sur la concaténation en voit un.
		const neuf = dossierNeuf()
		const avant = 'Rien ne bouge, pas meme le lieu.'
		const apres = 'amorce des ennuis, dit-il en partant.'
		const lot = [avant, apres]

		// Chaque élément, SEUL, est bénin : c'est ce qui rend le faux positif imputable
		// au `join` et à rien d'autre.
		expect(porteUnIdentifiant(avant, neuf)).toBe(false)
		expect(porteUnIdentifiant(apres, neuf)).toBe(false)

		// LE MUTANT — la concaténation fabrique `lieu.amorce`, qui EST un identifiant de
		// ce dossier. (Le séparateur vide est celui sous lequel la fabrication se MESURE.
		// Ce que tout `join` détruit EN PLUS — la LOCALISATION de l'élément fautif — ne
		// s'observe pas depuis ce contrat, qui ne rend qu'un motif : on ne le revendique
		// donc pas ici, KR-199.)
		const mutantJoin = (rendues: readonly string[]): boolean => porteUnIdentifiant(rendues.join(''), neuf)
		expect(mutantJoin(lot)).toBe(true)

		// … et la vraie, qui scanne PAR ÉLÉMENT, accepte ce lot sain.
		expect(validerRepliques({ [CLE]: lot }, neuf)).toEqual({ ok: true, repliques: lot })
	})

	it('mutant — repechage partiel : la vraie refuse le lot, jamais les saines seules', () => {
		// § 8, TL3a-10, trouvé indépendamment par deux postes : écarter les fautifs en
		// gardant les autres est une RÉPARATION SILENCIEUSE — l'auteur ratifierait une
		// liste amputée sans savoir qu'elle l'est. Réparer, c'est interpréter (KR-230).
		const neuf = dossierNeuf()
		const lot = [SAINE, CANARI_FUITE]
		const mutantRepechage = (rendues: readonly string[]): string[] =>
			rendues.filter((replique) => !porteUnIdentifiant(replique, neuf))

		expect(mutantRepechage(lot)).toEqual([SAINE])

		const refus = validerRepliques({ [CLE]: lot }, neuf)

		expect(refus).toEqual({ ok: false, motif: 'identifiant' })
		expect(refus).not.toHaveProperty(CLE)
		expect(JSON.stringify(refus)).not.toContain(SAINE)
	})

	it('le nominal rend ok avec les repliques, et rien d autre', () => {
		expect(validerRepliques({ [CLE]: [SAINE] }, dossier)).toEqual({ ok: true, repliques: [SAINE] })
	})

	it('le gabarit du troisieme role EST son schema', () => {
		const rendu = JSON.parse(GABARIT_SORTIE['personnage-repliques']) as Record<string, unknown>

		expect(Object.keys(rendu)).toEqual([...CLES_SORTIE_REPLIQUES])
		// La valeur du gabarit est une LISTE de prose, jamais un scalaire : c'est ce qui
		// distingue ce rôle du rôle prose, à la lecture de l'invite comme du validateur.
		expect(Array.isArray(rendu[CLE])).toBe(true)
		// Et ses clés sont DISJOINTES de celles des deux autres schémas — on ne peut pas
		// passer une sortie pour une autre.
		expect(CLES_SORTIE_REPLIQUES.filter((cle) => (CLES_SORTIE as readonly string[]).includes(cle))).toEqual([])
		expect(CLES_SORTIE_REPLIQUES.filter((cle) => (CLES_SORTIE_DETENTEURS as readonly string[]).includes(cle))).toEqual(
			[],
		)
	})

	it('REPLIQUES_PROPOSEES_MAX ne s aligne JAMAIS sur la borne du document', () => {
		// § 8, TL3a-7 et n° 24, retirés par leurs auteurs : ce sont DEUX bornes de nature
		// différente. 3 borne la RÉPONSE du modèle, 2 borne le DOCUMENT. Le nombre de
		// propositions ACCEPTABLES vaut `PARLER_REPLIQUES − parler.length` et VARIE d'un
		// personnage à l'autre. La garde est un BALAYAGE DE SOURCE, seul instrument
		// possible : ce fichier ne doit JAMAIS importer la borne du document.
		const source = fs.readFileSync(path.join(__dirname, 'schemaSortie.ts'), 'utf8')

		expect(source).not.toContain("from '../dossier/curseurs'")
		// Les COMMENTAIRES sont retirés d'abord, et ce n'est pas un détail : la docstring
		// de `REPLIQUES_PROPOSEES_MAX` NOMME la borne qu'elle s'interdit, donc un
		// balayage brut rougirait sur la phrase qui dit la règle (précédent : le
		// balayage `Number(`/`parseInt` ci-dessus).
		const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
		expect(code).not.toContain('PARLER_REPLIQUES')
		expect(code).not.toContain('curseurs')
		// Discriminant : le balayage porte bien sur du code réel — sans cette ligne il
		// serait vert sur un fichier vidé de tout (KR-235).
		expect(code).toContain('export const REPLIQUES_PROPOSEES_MAX = 3')
	})
})

describe('types — zero cle commune reseau / resolu, quatrieme role', () => {
	it('IntentionRendue et PropositionPlan n ont aucune cle en commun', () => {
		// KR-231, MOITIÉ 1 — L'INTERSECTION DES CLÉS EST VIDE, constatée en VALEUR sur
		// deux témoins minimaux ANNOTÉS : une `interface` n'existe plus au runtime.
		const rendue: IntentionRendue = { intention: 'Remonter au beffroi avant la nuit.' }
		const resolue: PropositionPlan = { acteurId: 'pnj.un-personnage', action: 'Remonter au beffroi avant la nuit.' }

		expect(Object.keys(rendue).filter((cle) => Object.keys(resolue).includes(cle))).toEqual([])
		// Discriminant : les deux portent BIEN des clés (KR-199).
		expect(Object.keys(rendue).length).toBeGreaterThan(0)
		expect(Object.keys(resolue).length).toBeGreaterThan(0)
		// ⚠ ET LA MÊME CHAÎNE PORTE DEUX NOMS, délibérément : `intention` enseigne au
		// modèle, `action` nomme la destination dans le document. C'est ce que le
		// service re-résout, et ce que personne ne doit « harmoniser ».
		expect(resolue.action).toBe(rendue.intention)
	})

	it('l affectation croisee ne compile pas', () => {
		// KR-231, MOITIÉ 2, ET C'EST LE TEST RÉEL : « zéro clé commune » n'est une
		// GARANTIE que si le compilateur refuse de passer l'une pour l'autre.
		// @ts-expect-error — la forme RÉSEAU affectée à la forme RE-RÉSOLUE.
		const versResolue: PropositionPlan = { intention: 'Une intention.' }
		// @ts-expect-error — la forme RE-RÉSOLUE affectée à la forme RÉSEAU.
		const versRendue: IntentionRendue = { acteurId: 'pnj.x', action: 'Une intention.' }

		// Discriminant : les deux affectations BIEN APPARIÉES compilent, elles.
		const bonneRendue: IntentionRendue = { intention: 'Une intention.' }
		const bonneResolue: PropositionPlan = { acteurId: 'pnj.x', action: 'Une intention.' }

		expect([versResolue, versRendue, bonneRendue, bonneResolue]).toHaveLength(4)
	})

	it('PropositionPlan ne porte AUCUN entier — etape est pose par le CODE', () => {
		// LE TRAIT NEUF DE LA TRANCHE, épinglé au contrat : le modèle ne rend jamais un
		// entier, et la proposition n'en porte pas non plus. `etape` est posé à
		// l'écriture, sur la liste VIVE — entre la demande et l'acceptation LE PLAN
		// BOUGE, donc un numéro calculé à la proposition serait périmé EN SILENCE.
		const resolue: PropositionPlan = { acteurId: 'pnj.x', action: 'Une intention.' }

		expect(Object.keys(resolue).sort()).toEqual(['acteurId', 'action'])
		expect(Object.values(resolue).filter((valeur) => typeof valeur !== 'string')).toEqual([])
		// @ts-expect-error — poser `etape` sur la proposition NE COMPILE PAS.
		const avecEntier: PropositionPlan = { acteurId: 'pnj.x', action: 'Une intention.', etape: 1 }
		expect(avecEntier.acteurId).toBe('pnj.x')
	})
})

describe('validerIntention — les six predicats de forme du quatrieme role', () => {
	const dossier = dossierDeReference()
	const CLE_P = CLES_SORTIE_PLAN[0]
	const SAINE = 'Remonter au beffroi avant la nuit et y attendre le passage du guetteur.'

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], ['intention'], 'une chaine', 42, true]) {
			expect({ brut, ...validerIntention(brut, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — l ensemble des cles doit valoir exactement CLES_SORTIE_PLAN', () => {
		// Une clé MANQUANTE.
		expect(validerIntention({}, dossier)).toEqual({ ok: false, motif: 'schema' })
		// Une clé RENOMMÉE — la panne KR-236 vue depuis le validateur. `action` est
		// précisément le nom que le VETO a écarté du fil : s'il revenait, il serait
		// refusé ici.
		expect(validerIntention({ action: SAINE }, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerIntention({ intentions: [SAINE] }, dossier)).toEqual({ ok: false, motif: 'schema' })
		// Une clé HÉRITÉE ne compte pas : `Object.keys` ne voit que le propre (KR-175).
		expect(validerIntention(Object.create({ [CLE_P]: SAINE }), dossier)).toEqual({ ok: false, motif: 'schema' })
	})

	it('2 bis — une cle en trop est un REFUS, jamais un champ ignore', () => {
		// C'EST LE SIGNAL KR-236 LUI-MÊME : le jour où l'invite du worker demande autre
		// chose que `GABARIT_SORTIE`, c'est ici que ça se voit. Et c'est aussi ce qui
		// interdit qu'un `etape` rendu par le modèle soit avalé en silence.
		expect(validerIntention({ [CLE_P]: SAINE, etape: 4 }, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerIntention({ [CLE_P]: SAINE, duree: 3 }, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerIntention({ [CLE_P]: SAINE, si_bloque: 'Il renonce.' }, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Discriminant : la MÊME sortie SANS la clé surnuméraire est acceptée — sans
		// cette ligne, le refus pourrait venir de la prose (KR-199).
		expect(validerIntention({ [CLE_P]: SAINE }, dossier)).toEqual({ ok: true, intention: SAINE })
	})

	it('3 — un TABLEAU est refuse schema, jamais repeche', () => {
		// LA GARDE DE KR-230, ET C'EST LA PLUS COÛTEUSE À PERDRE. Un `[0]` silencieux
		// ferait ratifier à l'auteur, d'un clic, une intention que LE CODE a choisie
		// parmi deux. Réparer, c'est interpréter.
		expect(validerIntention({ [CLE_P]: ['a', 'b'] }, dossier)).toEqual({ ok: false, motif: 'schema' })
		// Un tableau d'UN élément meurt ici aussi : ce n'est pas la LONGUEUR qui est
		// refusée, c'est le TYPE. Sans cette ligne, une borne de liste passerait pour la
		// garde alors qu'il n'y en a aucune.
		expect(validerIntention({ [CLE_P]: [SAINE] }, dossier)).toEqual({ ok: false, motif: 'schema' })
		// Et AUCUNE conversion : ni `String(…)`, qui fabriquerait `'a,b'` ou
		// `'[object Object]'`, ni un nombre coercé.
		expect(validerIntention({ [CLE_P]: { texte: SAINE } }, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerIntention({ [CLE_P]: 42 }, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerIntention({ [CLE_P]: null }, dossier)).toEqual({ ok: false, motif: 'schema' })
	})

	it('3 bis — le code ne repeche ni ne convertit : balayage de source', () => {
		// LE MUTANT QUE LE PLAN EXIGE DE VOIR ROUGE est écrit en dur dans le corps :
		// `Array.isArray(x) ? x[0] : x`. Le balayage ci-dessous est la garde STATIQUE
		// qui l'accompagne — les deux mesurent des choses différentes, l'une le
		// COMPORTEMENT, l'autre l'ABSENCE DE LA PORTE.
		const source = fs.readFileSync(path.join(__dirname, 'schemaSortie.ts'), 'utf8')
		// LES COMMENTAIRES SONT RETIRÉS D'ABORD, et ce n'est pas un détail : le corps
		// NOMME les portes qu'il s'interdit, donc un balayage brut rougirait sur la
		// phrase qui dit la règle. Précédent mesuré dans ce même fichier, sur le
		// balayage de `PARLER_REPLIQUES`.
		const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
		const corps = code.slice(code.indexOf('export function validerIntention('))

		// LES TROIS PORTES, nommées une par une plutôt qu'un balayage vague. `[0]` NU
		// serait un faux positif MESURÉ : `CLES_SORTIE_PLAN[0]` indexe la LISTE DE CLÉS,
		// ce qui est légitime et n'a rien à voir avec un repêchage de VALEUR.
		expect(corps).not.toContain('Array.isArray')
		expect(corps).not.toContain('String(')
		expect(corps).not.toContain('intention[')
		// Discriminants : le balayage porte bien sur du code réel, et `Array.isArray`
		// EXISTE ailleurs dans le fichier — les validateurs de LISTE l'emploient
		// légitimement —, donc une découpe fautive ne rendrait pas l'assertion vraie
		// pour rien (KR-235).
		expect(corps).toContain('export function validerIntention(')
		expect(code.slice(0, code.indexOf('export function validerIntention('))).toContain('Array.isArray')
	})

	it('4 — une chaine vide apres trim est refusee, motif vide', () => {
		// PRÉDICAT DISTINCT DU (3), ET IL ROUGIT SEUL : la valeur est bien une CHAÎNE.
		for (const brut of ['', '   ', '\n\t ']) {
			expect({ brut, ...validerIntention({ [CLE_P]: brut }, dossier) }).toEqual({ brut, ok: false, motif: 'vide' })
		}
		// LA NON-RÉPONSE EST UN REFUS, et c'est le test de rattachement de 3a : ce rôle
		// rend DE LA PROSE QUE RIEN NE FOURNIT ⇒ RÉDACTION. Le cas « rien à prolonger »
		// est traité AVANT l'appel, par `cible-a-ecrire`.
		expect(validerIntention({ [CLE_P]: SAINE }, dossier)).toEqual({ ok: true, intention: SAINE })
	})

	it('5 — le marqueur a ecrire est refuse, constante IMPORTEE', () => {
		// KR-223 : la constante est IMPORTÉE, jamais recopiée — le test ne peut pas
		// écrire le glyphe lui-même.
		expect(validerIntention({ [CLE_P]: `${MARQUEUR_A_ECRIRE} la suite` }, dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		// `includes` et non `startsWith` : l'auteur peut éditer autour du marqueur.
		expect(validerIntention({ [CLE_P]: `Remonter, puis ${MARQUEUR_A_ECRIRE}` }, dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		// Discriminant : la même phrase SANS le marqueur passe.
		expect(validerIntention({ [CLE_P]: 'Remonter, puis la suite' }, dossier).ok).toBe(true)
	})

	it('6 — un identifiant du dossier est refuse, porteUnIdentifiant reutilisee', () => {
		// KR-117 : le scanner n'est pas ré-écrit, il est RÉUTILISÉ. Les deux canaris de
		// l'it1 sont rejoués ici contre l'implémentation réelle.
		const neuf = dossierNeuf()

		expect(porteUnIdentifiant(CANARI_FUITE, neuf)).toBe(true)
		expect(validerIntention({ [CLE_P]: CANARI_FUITE }, neuf)).toEqual({ ok: false, motif: 'identifiant' })
		// CANARI BÉNIN : une prose française saine à mots courants suivis d'un point
		// n'est PAS refusée — sans lui, un scanner de forme seule passerait pour un
		// garde (KR-235).
		expect(porteUnIdentifiant(CANARI_BENIN, neuf)).toBe(false)
		expect(validerIntention({ [CLE_P]: CANARI_BENIN }, neuf)).toEqual({ ok: true, intention: CANARI_BENIN })
	})

	it('les six motifs sont DISCRIMINES : chaque predicat rend le SIEN', () => {
		// KR-197/199 : une liste d'assertions voisines ne prouve pas la discriminance.
		// Quatre motifs ATTEIGNABLES sur ce rôle, chacun atteint par SA faute.
		const motifs = [
			validerIntention(42, dossier),
			validerIntention({ [CLE_P]: SAINE, etape: 1 }, dossier),
			validerIntention({ [CLE_P]: ['a'] }, dossier),
			validerIntention({ [CLE_P]: '  ' }, dossier),
			validerIntention({ [CLE_P]: MARQUEUR_A_ECRIRE }, dossier),
			validerIntention({ [CLE_P]: CANARI_FUITE }, dossierNeuf()),
		].map((issue) => (issue.ok ? 'ACCEPTÉ' : issue.motif))

		expect(motifs).toEqual(['schema', 'schema', 'schema', 'vide', 'marqueur', 'identifiant'])
		expect(new Set(motifs).size).toBe(4)
	})

	it('le nominal rend ok avec l intention, et rien d autre', () => {
		expect(validerIntention({ [CLE_P]: SAINE }, dossier)).toEqual({ ok: true, intention: SAINE })
	})

	it('le gabarit du quatrieme role EST son schema, et il est SCALAIRE', () => {
		const rendu = JSON.parse(GABARIT_SORTIE['personnage-plan']) as Record<string, unknown>

		expect(Object.keys(rendu)).toEqual([...CLES_SORTIE_PLAN])
		// LA VALEUR DU GABARIT EST UN SCALAIRE, jamais une liste : c'est ce qui rend
		// « deux » NON REPRÉSENTABLE, donc ce qui dispense d'une constante de borne.
		expect(typeof rendu[CLE_P]).toBe('string')
		expect(Array.isArray(rendu[CLE_P])).toBe(false)
		// Et ses clés sont DISJOINTES de celles des trois autres schémas — on ne peut
		// pas passer une sortie pour une autre.
		for (const autres of [CLES_SORTIE, CLES_SORTIE_DETENTEURS, CLES_SORTIE_REPLIQUES]) {
			expect(CLES_SORTIE_PLAN.filter((cle) => (autres as readonly string[]).includes(cle))).toEqual([])
		}
	})

	it('AUCUNE constante de borne pour ce role : balayage de source', () => {
		// LA GARDE DE « LA MEILLEURE GARDE EST CELLE QUI N EXISTE PAS ». Un ouvrier qui
		// ajouterait `ETAPES_PROPOSEES_MAX` « par symétrie » avec les deux autres rôles
		// rendrait « deux » représentable, puis l'interdirait par une constante — c'est
		// le choix que le comité a écarté, et rien d'autre ne le constaterait.
		const source = fs.readFileSync(path.join(__dirname, 'schemaSortie.ts'), 'utf8')
		const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

		expect(code).not.toContain('ETAPES_PROPOSEES_MAX')
		expect(code).not.toContain('INTENTIONS_PROPOSEES_MAX')
		const corps = code.slice(code.indexOf('export function validerIntention('))
		expect(corps).not.toContain('.length >')
		// Discriminants : le balayage porte sur du code réel, et les DEUX autres bornes,
		// elles, y sont bien — sans eux, un fichier vidé rendrait tout vert (KR-235).
		expect(code).toContain('export const CLES_SORTIE_PLAN')
		expect(code).toContain('export const REPLIQUES_PROPOSEES_MAX = 3')
		expect(code).toContain('export const PROPOSITIONS_MAX = 3')
	})
})
