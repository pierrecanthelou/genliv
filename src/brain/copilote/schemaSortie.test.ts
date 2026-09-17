import fs from 'node:fs'
import path from 'node:path'
import { construireAmorce, MARQUEUR_A_ECRIRE } from '../dossier/amorce'
import { collectIds, ESPACES_DE_NOMS } from '../dossier/identifiers'
import type { Dossier } from '../dossier/types'
import { CLES_SORTIE, GABARIT_SORTIE, porteUnIdentifiant, validerSortie } from './schemaSortie'

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
		expect(Object.keys(JSON.parse(GABARIT_SORTIE) as Record<string, unknown>)).toEqual([...CLES_SORTIE])
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
