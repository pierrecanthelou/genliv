import fs from 'node:fs'
import path from 'node:path'
import { construireAmorce, MARQUEUR_A_ECRIRE } from '../dossier/amorce'
import { collectIds, ESPACES_DE_NOMS } from '../dossier/identifiers'
import type { But, Dossier, Personnage } from '../dossier/types'
import {
	ANCRES_PAR_FAIT_MAX,
	CLE_CONDENSE,
	CLES_SORTIE,
	CLES_ENJEUX,
	CLES_SORTIE_ACTEUR,
	CLES_SORTIE_DETENTEURS,
	CLES_SORTIE_DISTRIBUTION,
	CLES_SORTIE_NARRATEUR,
	CLES_SORTIE_PLAN,
	CLES_SORTIE_RELATIONS,
	CLES_SORTIE_REPLIQUES,
	CLES_SORTIE_RESISTE,
	CONDENSE_CARACTERES_MAX,
	DELTAS_CONFIANCE_VALIDES,
	ENJEU_CARACTERES_MAX,
	FAIT_CARACTERES_MAX,
	FAITS_PAR_PAS_MAX,
	FICHES_PROPOSEES_MAX,
	GABARIT_SORTIE,
	NARRATION_CARACTERES_MAX,
	PRECISION_CARACTERES_MAX,
	PROPOSITIONS_MAX,
	RELATIONS_PROPOSEES_MAX,
	REPLIQUE_CARACTERES_MAX,
	REPLIQUES_PROPOSEES_MAX,
	REVELATIONS_PAR_REPLIQUE_MAX,
	TENTATIVE_CARACTERES_MAX,
	TENTATIVES_MAX,
	porteUnIdentifiant,
	porteUneAncre,
	porteUnRang,
	validerActeur,
	validerArbitre,
	validerCondense,
	validerDetenteurs,
	validerDistribution,
	validerEnjeux,
	validerIntention,
	validerInterprete,
	validerNarrateur,
	validerRelations,
	validerRepliques,
	validerSortie,
} from './schemaSortie'
import type {
	ConstatRendu,
	DistributionRendue,
	FaitEtabli,
	FicheBrouillon,
	FicheReseau,
	IntentionRendue,
	InterpretationRendue,
	LienResolu,
	NarrationRendue,
	PropositionDistribution,
	PropositionPlan,
	PropositionRelations,
	PropositionRepliques,
	RapportRendu,
	RapportsRendus,
	RepliquesRendues,
	ResumeMemoire,
	SortieInterprete,
	SortieNarrateur,
	TablesInterprete,
} from './types'

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

/** LA SOURCE DU MODULE, COMMENTAIRES RETIRÉS — et ce n'est pas un détail : les
 *  docstrings NOMMENT les portes que le code s'interdit, donc un balayage brut
 *  rougirait sur la phrase qui dit la règle. */
function codeSansCommentaires(): string {
	return fs
		.readFileSync(path.join(__dirname, 'schemaSortie.ts'), 'utf8')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^[ \t]*\/\/.*$/gm, '')
}

/**
 * LE CORPS D'UNE FONCTION NOMMÉE, BORNÉ À ELLE — du `export function <nom>(` jusqu'au
 * prochain `export` de premier niveau.
 *
 * ⚠ AMENDÉ À L'IT3c, ET C'EST UN CAS KR-226 ARRIVÉ À ÉCHÉANCE. Les deux balayages de
 * l'it3b découpaient `code.slice(code.indexOf('export function validerIntention('))`,
 * c'est-à-dire JUSQU'À LA FIN DU FICHIER : cela ne valait que parce que
 * `validerIntention` en était la DERNIÈRE fonction. La garde encodait donc une
 * COÏNCIDENCE — « ce qui suit » — plutôt que l'invariant qu'elle nomme — « le corps de
 * cette fonction-ci ». Le CINQUIÈME validateur, écrit après elle, l'a fait rougir SANS
 * AUCUN DÉFAUT : il emploie légitimement `Array.isArray` et une borne `.length >`.
 * Mesuré au moment de l'écrire : 2 tests rouges sur 65, tous deux sur ce découpage.
 */
function corpsDe(code: string, nom: string): string {
	const debut = code.indexOf(`export function ${nom}(`)
	const suite = code.indexOf('\nexport ', debut + 1)
	return suite === -1 ? code.slice(debut) : code.slice(debut, suite)
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
		// SANS qu'un test rougisse.
		//
		// ⚠ LE BALAYAGE PORTE SUR LA SEULE LIGNE DE DÉCLARATION, jamais sur le fichier
		// entier (n° 12 `moteur-acteurs`, it1, BORNE RESSERRÉE) : un scan de fichier
		// entier confondrait CETTE liste (qui construit un MOTIF D'IDENTIFIANT) avec
		// toute AUTRE comparaison légitime à un espace de noms littéral ailleurs dans le
		// fichier — `validerInterprete` compare désormais `refKinds[i] === 'pnj'` pour
		// router une résolution de rang, ce qui n'a RIEN à voir avec cette regex-ci, et
		// un balayage non ancré le confondrait (KR-235, faux positif mesuré).
		const source = fs.readFileSync(path.join(__dirname, 'schemaSortie.ts'), 'utf8')
		const DERIVATION = ['Object.keys(', 'ESPACES_DE_NOMS', ').join(', "'|'", ')'].join('')
		const ligneDeDeclaration = source.match(/^const FORME_LACHE_IDENTIFIANT = .*$/m)?.[0]

		expect(source).toContain(DERIVATION)
		expect(ligneDeDeclaration).toBeDefined()
		expect(Object.keys(ESPACES_DE_NOMS).filter((espace) => String(ligneDeDeclaration).includes(`'${espace}'`))).toEqual(
			[],
		)
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
		// LES COMMENTAIRES SONT RETIRÉS D'ABORD, et le corps est BORNÉ À SA FONCTION —
		// voir `corpsDe`, amendé à l'it3c parce que le découpage « jusqu'à la fin du
		// fichier » encodait une coïncidence (KR-226).
		const code = codeSansCommentaires()
		const corps = corpsDe(code, 'validerIntention')

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
		// … ET LE CORPS S'ARRÊTE BIEN À SA FONCTION : sans cette ligne, le découpage
		// pourrait de nouveau courir jusqu'à la fin du fichier sans que rien ne le dise.
		expect(corps).not.toContain('export function validerRelations(')
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
		const code = codeSansCommentaires()

		expect(code).not.toContain('ETAPES_PROPOSEES_MAX')
		expect(code).not.toContain('INTENTIONS_PROPOSEES_MAX')
		const corps = corpsDe(code, 'validerIntention')
		expect(corps).not.toContain('.length >')
		// … et le découpage s'arrête bien à cette fonction : `validerRelations`, écrite
		// après elle, porte LÉGITIMEMENT une borne de liste (KR-226).
		expect(corps).not.toContain('export function validerRelations(')
		expect(corpsDe(code, 'validerRelations')).toContain('.length >')
		// Discriminants : le balayage porte sur du code réel, et les DEUX autres bornes,
		// elles, y sont bien — sans eux, un fichier vidé rendrait tout vert (KR-235).
		expect(code).toContain('export const CLES_SORTIE_PLAN')
		expect(code).toContain('export const REPLIQUES_PROPOSEES_MAX = 3')
		expect(code).toContain('export const PROPOSITIONS_MAX = 3')
	})
})

// ══ LE CINQUIÈME RÔLE — `personnage-relations` ═══════════════════════════════

describe('types — zero cle commune reseau / resolu, cinquieme role, AUX DEUX NIVEAUX', () => {
	it('RapportsRendus et PropositionRelations n ont aucune cle en commun — niveau LISTE', () => {
		// KR-231, MOITIÉ 1, PREMIER NIVEAU — constatée en VALEUR sur deux témoins
		// minimaux ANNOTÉS : une `interface` n'existe plus au runtime.
		const rendus: RapportsRendus = { rapports: [{ envers: 'P1', nature: 'Il lui doit une dette.' }] }
		const resolue: PropositionRelations = {
			personnageId: 'pnj.un-personnage',
			ajouts: [{ cibleId: 'pnj.un-autre', lien: 'Il lui doit une dette.' }],
		}

		expect(Object.keys(rendus).filter((cle) => Object.keys(resolue).includes(cle))).toEqual([])
		// Discriminant : les deux portent BIEN des clés (KR-199).
		expect(Object.keys(rendus).length).toBeGreaterThan(0)
		expect(Object.keys(resolue).length).toBeGreaterThan(0)
	})

	it('RapportRendu et LienResolu n ont aucune cle en commun — niveau ELEMENT', () => {
		// KR-231 AU SECOND NIVEAU, et c'est NEUF : les quatre rôles précédents portaient
		// des listes de SCALAIRES, donc leur frontière n'avait qu'un étage. Un rôle mixte
		// en a DEUX, et le second est le plus facile à oublier.
		const rendu: RapportRendu = { envers: 'P1', nature: 'Il lui doit une dette.' }
		const resolu: LienResolu = { cibleId: 'pnj.un-autre', lien: 'Il lui doit une dette.' }

		expect(Object.keys(rendu).filter((cle) => Object.keys(resolu).includes(cle))).toEqual([])
		expect(Object.keys(rendu).length).toBeGreaterThan(0)
		expect(Object.keys(resolu).length).toBeGreaterThan(0)
		// ⚠ ET LA MÊME CHAÎNE PORTE DEUX NOMS, délibérément : `nature` enseigne au modèle,
		// `lien` nomme la destination dans le document. C'est ce que le service
		// re-résout, et ce que personne ne doit « harmoniser ».
		expect(resolu.lien).toBe(rendu.nature)
	})

	it('l affectation croisee ne compile pas, AUX DEUX NIVEAUX', () => {
		// KR-231, MOITIÉ 2, ET C'EST LE TEST RÉEL : « zéro clé commune » n'est une
		// GARANTIE que si le compilateur refuse de passer l'une pour l'autre.
		// @ts-expect-error — la forme RÉSEAU affectée à la forme RE-RÉSOLUE (liste).
		const versResolue: PropositionRelations = { rapports: [{ envers: 'P1', nature: 'Une nature.' }] }
		// @ts-expect-error — la forme RE-RÉSOLUE affectée à la forme RÉSEAU (liste).
		const versRendus: RapportsRendus = { personnageId: 'pnj.x', ajouts: [] }
		// @ts-expect-error — l'ÉLÉMENT réseau affecté à l'ÉLÉMENT re-résolu.
		const elementVersResolu: LienResolu = { envers: 'P1', nature: 'Une nature.' }
		// @ts-expect-error — l'ÉLÉMENT re-résolu affecté à l'ÉLÉMENT réseau.
		const elementVersRendu: RapportRendu = { cibleId: 'pnj.x', lien: 'Une nature.' }

		// Discriminant : les affectations BIEN APPARIÉES compilent, elles. Sans cette
		// moitié, les `@ts-expect-error` seraient satisfaits par n'importe quelle erreur
		// de type, y compris « ce type n'existe pas ».
		const bonsRendus: RapportsRendus = { rapports: [{ envers: 'P1', nature: 'Une nature.' }] }
		const bonneResolue: PropositionRelations = { personnageId: 'pnj.x', ajouts: [] }

		expect([versResolue, versRendus, elementVersResolu, elementVersRendu, bonsRendus, bonneResolue]).toHaveLength(6)
	})

	it('LienResolu ne porte NI intensite NI secret — la symetrie EST l arbitrage', () => {
		// § 2 du plan : `intensite` est ÉCRITE PARCE QUE REQUISE (le code la pose,
		// `INTENSITE_INITIALE`), `secret` est OMIS PARCE QU'OPTIONNEL (KR-221 — on ne sème
		// pas un optionnel que l'auteur n'a pas posé). Aucun des deux ne traverse ce
		// contrat, et pour DEUX raisons différentes.
		const resolu: LienResolu = { cibleId: 'pnj.x', lien: 'Une nature.' }

		expect(Object.keys(resolu).sort()).toEqual(['cibleId', 'lien'])
		expect(Object.values(resolu).filter((valeur) => typeof valeur !== 'string')).toEqual([])
		// @ts-expect-error — poser `intensite` sur la forme re-résolue NE COMPILE PAS.
		const avecIntensite: LienResolu = { cibleId: 'pnj.x', lien: 'Une nature.', intensite: 0 }
		// @ts-expect-error — poser `secret` non plus.
		const avecSecret: LienResolu = { cibleId: 'pnj.x', lien: 'Une nature.', secret: true }
		expect([avecIntensite.cibleId, avecSecret.cibleId]).toEqual(['pnj.x', 'pnj.x'])
	})
})

describe('validerRelations — les DOUZE predicats de forme du cinquieme role', () => {
	const dossier = dossierDeReference()
	const CLE_R = CLES_SORTIE_RELATIONS[0]
	/** La table des rangs telle que l'assembleur la rend, réduite à ses CLÉS : le
	 *  validateur ne connaît que l'appartenance, jamais les identifiants. */
	const RANGS: ReadonlySet<string> = new Set(['P1', 'P2', 'P3', 'P4'])
	/** Deux natures parfaitement saines : ni identifiant, ni marqueur, ni chiffre. */
	const SAINE = 'Il lui doit une dette ancienne, et il evite de croiser son regard depuis.'
	const SAINE_2 = 'Elle le tient pour un bavard, et ne lui confie jamais rien qui compte.'
	const rapport = (envers: string, nature: string): Record<string, unknown> => ({ envers, nature })
	const sortie = (rapports: unknown): Record<string, unknown> => ({ [CLE_R]: rapports })

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], [rapport('P1', SAINE)], 'P1', 42, true]) {
			expect({ brut, ...validerRelations(brut, RANGS, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — l ensemble des cles doit valoir exactement CLES_SORTIE_RELATIONS', () => {
		// Une clé MANQUANTE, une clé RENOMMÉE (la panne KR-236 vue du validateur), une
		// clé SURNUMÉRAIRE — un REFUS, jamais un champ ignoré.
		// ⚠ `liens` est PRÉCISÉMENT le nom que le veto a écarté du fil : s'il revenait,
		// il serait refusé ici.
		expect(validerRelations({}, RANGS, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerRelations({ liens: [rapport('P1', SAINE)] }, RANGS, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerRelations({ [CLE_R]: [rapport('P1', SAINE)], personnageId: 'pnj.x' }, RANGS, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Une clé HÉRITÉE ne compte pas : `Object.keys` ne voit que le propre (KR-175).
		expect(validerRelations(Object.create({ [CLE_R]: [rapport('P1', SAINE)] }), RANGS, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('3 — une valeur qui n est pas un tableau est refusee, motif schema', () => {
		for (const valeur of [SAINE, 42, null, rapport('P1', SAINE), true]) {
			expect({ valeur, ...validerRelations(sortie(valeur), RANGS, dossier) }).toEqual({
				valeur,
				ok: false,
				motif: 'schema',
			})
		}
	})

	it('4 — un element qui n est pas un objet a EXACTEMENT deux cles est refuse, motif schema', () => {
		// LE SECOND NIVEAU DE SCHÉMA, que les quatre rôles précédents n'avaient pas : un
		// élément nu, un élément à clé manquante, à clé renommée, ou à clé EN TROP.
		// ⚠ La clé en trop est un REFUS, jamais un champ ignoré : c'est ce qui interdit
		// qu'un `intensite` rendu par le modèle soit avalé en silence.
		const fautifs: unknown[] = [
			SAINE,
			42,
			null,
			['P1', SAINE],
			{ envers: 'P1' },
			{ nature: SAINE },
			{ vers: 'P1', nature: SAINE },
			{ envers: 'P1', lien: SAINE },
			{ envers: 'P1', nature: SAINE, intensite: 2 },
			{ envers: 'P1', nature: SAINE, secret: true },
		]
		for (const element of fautifs) {
			expect({ element, ...validerRelations(sortie([element]), RANGS, dossier) }).toEqual({
				element,
				ok: false,
				motif: 'schema',
			})
		}
		// Discriminant : le MÊME élément sans la clé surnuméraire est accepté — sans cette
		// ligne, le refus pourrait venir d'ailleurs (KR-199).
		expect(validerRelations(sortie([rapport('P1', SAINE)]), RANGS, dossier)).toEqual({
			ok: true,
			sortie: { rapports: [{ envers: 'P1', nature: SAINE }] },
		})
	})

	it('5 — une valeur d element non textuelle est refusee, et JAMAIS convertie', () => {
		// UN TABLEAU MEURT ICI, et JAMAIS `[0]`, JAMAIS `String(…)` : repêcher ou coercer
		// ferait ratifier à l'auteur une valeur que LE CODE aurait choisie (KR-230).
		const fautifs: Array<Record<string, unknown>> = [
			{ envers: 'P1', nature: 42 },
			{ envers: 'P1', nature: null },
			{ envers: 'P1', nature: [SAINE] },
			{ envers: 'P1', nature: { texte: SAINE } },
			{ envers: 1, nature: SAINE },
			{ envers: ['P1'], nature: SAINE },
			{ envers: null, nature: SAINE },
		]
		for (const element of fautifs) {
			expect({ element, ...validerRelations(sortie([element]), RANGS, dossier) }).toEqual({
				element,
				ok: false,
				motif: 'schema',
			})
		}
		// LES DEUX MUTANTS SONT ÉCRITS, ET VUS FAUX : ils fabriquent une valeur là où il
		// n'y en a pas.
		expect(String({ texte: SAINE })).toBe('[object Object]')
		expect([SAINE, SAINE_2][0]).toBe(SAINE)
		// … et le balayage de SOURCE ferme la porte pour de bon : le corps de ce
		// validateur n'emploie NI `String(`, NI un repêchage d'indice de valeur.
		const corps = corpsDe(codeSansCommentaires(), 'validerRelations')
		expect(corps).not.toContain('String(')
		expect(corps).not.toContain('rendus[0]')
		expect(corps).not.toContain('elements[0]')
		expect(corps).not.toContain('rapports[0]')
		// Discriminant : le balayage porte bien sur du code réel, et il s'arrête à cette
		// fonction (KR-226).
		expect(corps).toContain('export function validerRelations(')
		expect(corps).not.toContain('export function validerIntention(')
	})

	it('6 — quatre rapports refuses, trois acceptes : la borne par COMPORTEMENT', () => {
		// REFUS, JAMAIS TRONCATURE (KR-230) : la sortie ne ressort NI coupée à trois, NI
		// partiellement.
		const quatre = [
			rapport('P1', SAINE),
			rapport('P2', SAINE_2),
			rapport('P3', 'Il le croit mort depuis des annees.'),
			rapport('P4', 'Elle lui a promis le silence, et le regrette.'),
		]
		expect(quatre.length).toBeGreaterThan(RELATIONS_PROPOSEES_MAX)

		const refus = validerRelations(sortie(quatre), RANGS, dossier)

		expect(refus).toEqual({ ok: false, motif: 'schema' })
		expect(refus).not.toHaveProperty('sortie')
		// Et EXACTEMENT `RELATIONS_PROPOSEES_MAX` passe : sans ce bord, le prédicat
		// pourrait porter un `>=` pour un `>` sans qu'un test rougisse.
		const trois = quatre.slice(0, RELATIONS_PROPOSEES_MAX)
		expect(validerRelations(sortie(trois), RANGS, dossier).ok).toBe(true)
	})

	it('7 — la liste vide est un REFUS vide, JAMAIS un succes — la regle du cas MIXTE', () => {
		// CRITÈRE 4, PREMIÈRE ENTRÉE : `vide`, ET NON `schema`. C'est la RÈGLE DE
		// TRANCHAGE DU CAS MIXTE appliquée : l'acceptation d'un élément écrit au dossier
		// une PROSE RÉDIGÉE PAR LE MODÈLE (`Relation.lien`), donc RÉDACTION, donc la
		// non-réponse est un refus.
		// ⚠ LE CRITÈRE N'EST PAS L'AUDIENCE `'ia'` : `savoirs[].certitude` EST `'ia'` et
		// son rôle — détenteurs — est une DÉSIGNATION, où la liste vide reste un SUCCÈS.
		// Les DEUX moitiés sont ici, sinon « amendé » serait indistinguable de
		// « remplacé ».
		expect(validerRelations(sortie([]), RANGS, dossier)).toEqual({ ok: false, motif: 'vide' })
		expect(validerDetenteurs({ detenteurs: [] }, new Set(['P1']))).toEqual({ ok: true, detenteurs: [] })
	})

	it('8 — une nature blanche APRES une saine, motif vide, index >= 1', () => {
		// L'INDEX EST LE POINT : un scanner qui ne regarderait que `[0]` trouverait la
		// première nature parfaitement valide et accepterait le lot.
		const lot = [rapport('P1', SAINE), rapport('P2', '   ')]
		expect(lot.findIndex((element) => String(element.nature).trim() === '')).toBeGreaterThan(0)

		expect(validerRelations(sortie(lot), RANGS, dossier)).toEqual({ ok: false, motif: 'vide' })
		// Les trois formes de blanc, toutes en position non nulle.
		for (const blanc of ['', '   ', '\n\t ']) {
			expect({
				blanc,
				...validerRelations(sortie([rapport('P1', SAINE), rapport('P2', blanc)]), RANGS, dossier),
			}).toEqual({ blanc, ok: false, motif: 'vide' })
		}
	})

	it('7 et 8 sont DEUX predicats distincts, chacun rougissant seul', () => {
		// La preuve est une NEUTRALISATION : on écrit les deux mutants, et chacun laisse
		// passer EXACTEMENT UNE des deux entrées — donc aucun des deux n'est redondant.
		const listeVide: Array<Record<string, unknown>> = []
		const blancTardif = [rapport('P1', SAINE), rapport('P2', '   ')]

		// MUTANT A — le prédicat (7) retiré. La liste vide passe, le blanc tardif meurt.
		const sans7 = (rapports: Array<Record<string, unknown>>): 'passe' | 'vide' =>
			rapports.some((element) => String(element.nature).trim().length === 0) ? 'vide' : 'passe'
		expect(sans7(listeVide)).toBe('passe')
		expect(sans7(blancTardif)).toBe('vide')

		// MUTANT B — le prédicat (8) retiré. Le blanc tardif PASSE, la liste vide meurt.
		const sans8 = (rapports: Array<Record<string, unknown>>): 'passe' | 'vide' =>
			rapports.length === 0 ? 'vide' : 'passe'
		expect(sans8(blancTardif)).toBe('passe')
		expect(sans8(listeVide)).toBe('vide')

		// Et la VRAIE refuse les deux.
		expect(validerRelations(sortie(listeVide), RANGS, dossier)).toEqual({ ok: false, motif: 'vide' })
		expect(validerRelations(sortie(blancTardif), RANGS, dossier)).toEqual({ ok: false, motif: 'vide' })
	})

	it('9 — deux rapports vers le MEME envers sont refuses, motif schema', () => {
		// CRITÈRE 4, TROISIÈME ENTRÉE : deux fois le même rang écrirait DEUX relations
		// vers le même personnage. NON ADJACENT : un garde qui ne comparerait qu'aux
		// voisins passerait.
		expect(validerRelations(sortie([rapport('P1', SAINE), rapport('P1', SAINE_2)]), RANGS, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(
			validerRelations(
				sortie([rapport('P1', SAINE), rapport('P2', SAINE_2), rapport('P1', 'Une troisieme.')]),
				RANGS,
				dossier,
			),
		).toEqual({ ok: false, motif: 'schema' })
	})

	it('9 bis — DEUX FRERES PORTENT LEGITIMEMENT LE MEME LIEN : natures identiques ACCEPTEES', () => {
		// ⚠ LE SEUL PRÉDICAT D'UNICITÉ RECEVABLE PORTE SUR `envers`, JAMAIS SUR `nature`
		// (§ 8, n° 45). Écrit pour que personne ne « symétrise » avec les prédicats de
		// doublon des rôles détenteurs et répliques, qui portent sur la seule valeur
		// qu'un élément ait. Ici, deux frères sont deux relations DIFFÉRENTES.
		const memeNature = [rapport('P1', SAINE), rapport('P2', SAINE)]

		expect(validerRelations(sortie(memeNature), RANGS, dossier)).toEqual({
			ok: true,
			sortie: {
				rapports: [
					{ envers: 'P1', nature: SAINE },
					{ envers: 'P2', nature: SAINE },
				],
			},
		})
		// LE MUTANT « natures distinctes », ÉCRIT ET VU FAUX sur ce lot PARFAITEMENT
		// LÉGITIME : il refuserait une réponse juste.
		const mutantNaturesDistinctes = (rapports: Array<Record<string, unknown>>): boolean =>
			new Set(rapports.map((element) => element.nature)).size !== rapports.length
		expect(mutantNaturesDistinctes(memeNature)).toBe(true)
		// … et le balayage de SOURCE : le corps n'a qu'UNE garde d'unicité, et elle porte
		// sur les jetons.
		const corps = corpsDe(codeSansCommentaires(), 'validerRelations')
		expect(corps).toContain('new Set(designes)')
		expect(corps.match(/new Set\(/g) ?? []).toHaveLength(1)
	})

	it('10 — le marqueur a ecrire est refuse, constante IMPORTEE', () => {
		// KR-223 : la constante est IMPORTÉE, jamais recopiée — le test ne peut pas
		// écrire le glyphe lui-même.
		expect(validerRelations(sortie([rapport('P1', `${MARQUEUR_A_ECRIRE} a rediger`)]), RANGS, dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		// EN POSITION NON NULLE, et `includes` plutôt que `startsWith`.
		expect(
			validerRelations(
				sortie([rapport('P1', SAINE), rapport('P2', `Une phrase, puis ${MARQUEUR_A_ECRIRE} au milieu.`)]),
				RANGS,
				dossier,
			),
		).toEqual({ ok: false, motif: 'marqueur' })
	})

	it('11 — un identifiant en DERNIERE position : le lot ENTIER est refuse', () => {
		// L'identifiant est au DERNIER rang, et les précédentes sont saines : c'est ce qui
		// rend le mutant « ne scanner que `[0]` » observable.
		const neuf = dossierNeuf()
		const lot = [rapport('P1', SAINE), rapport('P2', SAINE_2), rapport('P3', CANARI_FUITE)]

		const refus = validerRelations(sortie(lot), RANGS, neuf)

		expect(refus).toEqual({ ok: false, motif: 'identifiant' })
		// RIEN de la sortie fautive ne survit : ni la liste, ni les éléments sains.
		expect(refus).not.toHaveProperty('sortie')
		expect(JSON.stringify(refus)).not.toContain(SAINE)
		// CANARI BÉNIN en position 1 : une prose française saine PASSE — sans lui, un
		// scanner de forme seule passerait pour un garde (KR-235).
		expect(validerRelations(sortie([rapport('P1', SAINE), rapport('P2', CANARI_BENIN)]), RANGS, neuf).ok).toBe(true)
	})

	it('11 bis — mutant « ne scanner que l element 0 », et mutant « join avant le scan »', () => {
		// LE POUVOIR SÉPARATEUR, ÉCRIT ET NON DÉDUIT (BUG-087). Les implémentations
		// FAUTIVES sont ici, à côté de la vraie, et chacune est prouvée fautive sur un lot
		// précis.
		const neuf = dossierNeuf()

		// MUTANT A — `[0]` : la fuite en dernière position s'échappe.
		const lot = [rapport('P1', SAINE), rapport('P2', SAINE_2), rapport('P3', CANARI_FUITE)]
		const mutantIndexZero = (rapports: Array<Record<string, unknown>>): boolean =>
			porteUnIdentifiant(String(rapports[0].nature), neuf)
		expect(mutantIndexZero(lot)).toBe(false)
		expect(validerRelations(sortie(lot), RANGS, neuf)).toEqual({ ok: false, motif: 'identifiant' })

		// MUTANT B — `join` avant le scan : un FAUX POSITIF FABRIQUÉ à la frontière. Deux
		// fragments logés dans deux `nature` DISTINCTES ne forment pas un identifiant —
		// ils deviendront deux relations SÉPARÉES.
		const avant = 'Rien ne bouge, pas meme le lieu.'
		const apres = 'amorce des ennuis, dit-il en partant.'
		const sain = [rapport('P1', avant), rapport('P2', apres)]
		expect(porteUnIdentifiant(avant, neuf)).toBe(false)
		expect(porteUnIdentifiant(apres, neuf)).toBe(false)
		const mutantJoin = (rapports: Array<Record<string, unknown>>): boolean =>
			porteUnIdentifiant(rapports.map((element) => String(element.nature)).join(''), neuf)
		expect(mutantJoin(sain)).toBe(true)
		// … et la vraie, qui scanne PAR ÉLÉMENT, accepte ce lot sain.
		expect(validerRelations(sortie(sain), RANGS, neuf).ok).toBe(true)
		// … et le balayage de SOURCE : aucun `join` dans ce corps.
		expect(corpsDe(codeSansCommentaires(), 'validerRelations')).not.toContain('.join(')
	})

	it('11 ter — `envers` n est JAMAIS passe au scanner d identifiants', () => {
		// ⚠ VETO DES DEUX POSTES À EFFORT ÉLEVÉ (§ 8, n° 21), écrit pour que personne ne
		// « symétrise ». Le jeton est L'UNE DE NOS PROPRES CHAÎNES, et son appartenance
		// est constatée par le prédicat (12) : l'y passer serait DU CODE MORT PRÉSENTÉ
		// COMME DE LA COUVERTURE (famille BUG-084, KR-235).
		const neuf = dossierNeuf()
		// Un rang qui SERAIT un identifiant du dossier n'existe pas — c'est nous qui
		// frappons les rangs —, donc la garde se constate à la SOURCE : le scanner n'est
		// appelé que sur `nature`.
		const corps = corpsDe(codeSansCommentaires(), 'validerRelations')
		const appels = corps.match(/porteUnIdentifiant\([^)]*\)/g) ?? []

		expect(appels).toHaveLength(1)
		expect(appels[0]).toContain('nature')
		expect(appels[0]).not.toContain('envers')
		// Le marqueur d'amorce non plus n'est cherché que dans la prose : c'est un
		// marqueur de PROSE, il n'a pas de sujet sur un jeton.
		const marqueurs = corps.match(/\.includes\(MARQUEUR_A_ECRIRE\)/g) ?? []
		expect(marqueurs).toHaveLength(1)
		// Discriminant : le scanner EXISTE bien et il MORD — sans cette ligne, « un seul
		// appel » serait vrai sur un corps qui n'en ferait aucun (KR-199).
		expect(porteUnIdentifiant(CANARI_FUITE, neuf)).toBe(true)
		expect(corps).toContain('porteUnIdentifiant(')
	})

	it('12 — un rang de forme legale hors table reelle : rang-inconnu, JAMAIS schema', () => {
		// CRITÈRE 4, DEUXIÈME ENTRÉE. `FICHE` est l'EN-TÊTE DU PORTEUR : le modèle qui le
		// désignerait aurait la forme mais pas l'appartenance — et c'est le motif qui doit
		// sortir, pas `schema`.
		expect(validerRelations(sortie([rapport('FICHE', SAINE)]), RANGS, dossier)).toEqual({
			ok: false,
			motif: 'rang-inconnu',
		})
		// P9 a la FORME d'un rang et n'est PAS dans la table : la garantie d'un rang est
		// son APPARTENANCE, jamais sa silhouette (KR-231/KR-235).
		expect(validerRelations(sortie([rapport('P9', SAINE)]), RANGS, dossier)).toEqual({
			ok: false,
			motif: 'rang-inconnu',
		})
		// LE LOT ENTIER tombe sur un seul jeton fautif — et le REPÊCHAGE PARTIEL, écrit
		// ici, rendrait le rapport sain : c'est ce que la vraie refuse.
		const lot = [rapport('P1', SAINE), rapport('P9', SAINE_2)]
		const mutantRepechage = (rapports: Array<Record<string, unknown>>): Array<Record<string, unknown>> =>
			rapports.filter((element) => RANGS.has(String(element.envers)))
		expect(mutantRepechage(lot)).toEqual([rapport('P1', SAINE)])
		const refus = validerRelations(sortie(lot), RANGS, dossier)
		expect(refus).toEqual({ ok: false, motif: 'rang-inconnu' })
		// ⚠ ACCEPTER `envers` EN JETANT `nature` — ou l'inverse — FERAIT RATIFIER UNE
		// RELATION À MOITIÉ INVENTÉE PAR LE CODE. Rien de la sortie fautive ne survit.
		expect(refus).not.toHaveProperty('sortie')
		expect(JSON.stringify(refus)).not.toContain(SAINE)
	})

	it('AUCUNE conversion numerique : P2 n est pas 2', () => {
		// `Number('P2')` vaut NaN. Un validateur qui convertirait refuserait TOUS les
		// jetons légitimes, et un validateur qui indexerait arithmétiquement rouvrirait la
		// classe entière des décalages base-0 / base-1.
		expect(Number('P2')).toBeNaN()
		expect(validerRelations(sortie([rapport('P2', SAINE)]), RANGS, dossier).ok).toBe(true)
		// Le balayage de SOURCE du fichier entier reste vert (`Number(` / `parseInt`), il
		// est porté par la suite du second rôle.
		expect(corpsDe(codeSansCommentaires(), 'validerRelations')).not.toContain('Number(')
	})

	it('les CINQ motifs sont ATTEIGNABLES et DISCRIMINES — la preuve d aucun predicat mort', () => {
		// ⚠ PREMIER VALIDATEUR DONT LE TYPE DE RETOUR NOMME `MotifIllisible` EN ENTIER, et
		// c'est une PREUVE, pas une affirmation : chacun des cinq est atteint par SA faute.
		const neuf = dossierNeuf()
		const motifs = [
			validerRelations(42, RANGS, dossier),
			validerRelations(sortie([]), RANGS, dossier),
			validerRelations(sortie([rapport('P1', `${MARQUEUR_A_ECRIRE} a rediger`)]), RANGS, dossier),
			validerRelations(sortie([rapport('P1', CANARI_FUITE)]), RANGS, neuf),
			validerRelations(sortie([rapport('P9', SAINE)]), RANGS, dossier),
		].map((issue) => (issue.ok ? 'ACCEPTÉ' : issue.motif))

		expect(motifs).toEqual(['schema', 'vide', 'marqueur', 'identifiant', 'rang-inconnu'])
		expect(new Set(motifs).size).toBe(5)
	})

	it('le nominal rend ok avec la sortie, et rien d autre', () => {
		const rapports = [rapport('P1', SAINE), rapport('P3', SAINE_2)]

		expect(validerRelations(sortie(rapports), RANGS, dossier)).toEqual({
			ok: true,
			sortie: {
				rapports: [
					{ envers: 'P1', nature: SAINE },
					{ envers: 'P3', nature: SAINE_2 },
				],
			},
		})
	})

	it('le gabarit du cinquieme role EST son schema, AUX DEUX NIVEAUX', () => {
		const rendu = JSON.parse(GABARIT_SORTIE['personnage-relations']) as Record<string, unknown>

		// NIVEAU 1 — la clé de premier niveau.
		expect(Object.keys(rendu)).toEqual([...CLES_SORTIE_RELATIONS])
		// NIVEAU 2 — la valeur est une LISTE d'OBJETS à deux clés, jamais de scalaires :
		// c'est ce qui distingue ce rôle des quatre autres, à la lecture de l'invite comme
		// du validateur.
		const elements = rendu[CLES_SORTIE_RELATIONS[0]] as Array<Record<string, unknown>>
		expect(Array.isArray(elements)).toBe(true)
		expect(elements.length).toBeGreaterThan(1)
		for (const element of elements) expect(Object.keys(element).sort()).toEqual(['envers', 'nature'])
		// ⚠ LE GABARIT MONTRE `P1` PUIS `P3` : les rangs sont des ADRESSES, jamais un
		// ordre à parcourir. Un gabarit `P1`,`P2` inviterait le modèle à répondre « les
		// premiers de la liste » plutôt que « ceux-là ».
		expect(elements.map((element) => element.envers)).toEqual(['P1', 'P3'])
		// Et ses clés sont DISJOINTES de celles des quatre autres schémas — on ne peut pas
		// passer une sortie pour une autre.
		for (const autres of [CLES_SORTIE, CLES_SORTIE_DETENTEURS, CLES_SORTIE_REPLIQUES, CLES_SORTIE_PLAN]) {
			expect(CLES_SORTIE_RELATIONS.filter((cle) => (autres as readonly string[]).includes(cle))).toEqual([])
		}
	})

	it('RELATIONS_PROPOSEES_MAX n est PARTAGEE avec aucune autre borne : balayage de source', () => {
		// § 8, n° 26 : même valeur que `PROPOSITIONS_MAX` et `REPLIQUES_PROPOSEES_MAX`
		// aujourd'hui, AUCUNE raison commune d'évoluer. Le corps de ce validateur ne lit
		// QUE la sienne — sans quoi une borne changée en déplacerait trois.
		const corps = corpsDe(codeSansCommentaires(), 'validerRelations')

		expect(corps).toContain('RELATIONS_PROPOSEES_MAX')
		expect(corps).not.toContain('PROPOSITIONS_MAX)')
		expect(corps).not.toContain('REPLIQUES_PROPOSEES_MAX')
		// … et les trois constantes existent bel et bien, SÉPARÉMENT.
		const code = codeSansCommentaires()
		expect(code).toContain('export const RELATIONS_PROPOSEES_MAX = 3')
		expect(code).toContain('export const REPLIQUES_PROPOSEES_MAX = 3')
		expect(code).toContain('export const PROPOSITIONS_MAX = 3')
	})
})

describe('types — zero cle commune reseau / resolu, sixieme role, AUX DEUX NIVEAUX', () => {
	it('DistributionRendue et PropositionDistribution n ont aucune cle en commun — niveau LISTE', () => {
		// KR-231 au niveau de la LISTE : `{distribution}` ∩ `{ajouts}` = ∅.
		const reseau: DistributionRendue = { distribution: [{ place: 'Une charge.', poursuite: 'Un vouloir.' }] }
		const resolue: PropositionDistribution = { ajouts: [{ fonction: 'Une charge.', but: { libelle: 'Un vouloir.' } }] }

		const communes = Object.keys(reseau).filter((cle) => Object.keys(resolue).includes(cle))

		expect(communes).toEqual([])
		expect(Object.keys(reseau)).toEqual(['distribution'])
		expect(Object.keys(resolue)).toEqual(['ajouts'])
		// ⚠ ET LA PROPOSITION NE PORTE AUCUN IDENTIFIANT DE CIBLE — première des six, et
		// ce n'est pas une omission : LA CIBLE EST LE DOSSIER. Ne pas ajouter de
		// `dossierId` « par symétrie » avec les cinq autres.
		expect(Object.keys(resolue)).not.toContain('dossierId')
		expect(Object.keys(resolue)).toHaveLength(1)
	})

	it('FicheReseau et FicheBrouillon n ont aucune cle en commun — niveau ELEMENT', () => {
		// KR-231 au niveau de l'ÉLÉMENT : `{place,poursuite}` ∩ `{fonction,but}` = ∅. Un
		// rôle à deux niveaux porte DEUX frontières, pas une.
		const reseau: FicheReseau = { place: 'Une charge.', poursuite: 'Un vouloir.' }
		const resolue: FicheBrouillon = { fonction: 'Une charge.', but: { libelle: 'Un vouloir.' } }

		const communes = Object.keys(reseau).filter((cle) => Object.keys(resolue).includes(cle))

		expect(communes).toEqual([])
		expect(Object.keys(reseau).sort()).toEqual(['place', 'poursuite'])
		expect(Object.keys(resolue).sort()).toEqual(['but', 'fonction'])
	})

	it('l affectation croisee ne compile pas, AUX DEUX NIVEAUX', () => {
		// LE TEST EST DE TYPE, PAS DE RUNTIME : `@ts-expect-error` échoue à la
		// COMPILATION si l'erreur attendue n'a PAS lieu.
		// @ts-expect-error — une forme RÉSEAU ne s'assigne pas à une forme RÉSOLUE (liste).
		const croiseA: PropositionDistribution = { distribution: [] }
		// @ts-expect-error — et réciproquement.
		const croiseB: DistributionRendue = { ajouts: [] }
		// @ts-expect-error — niveau ÉLÉMENT, dans un sens…
		const croiseC: FicheBrouillon = { place: 'x', poursuite: 'y' }
		// @ts-expect-error — … et dans l'autre.
		const croiseD: FicheReseau = { fonction: 'x', but: { libelle: 'y' } }

		expect([croiseA, croiseB, croiseC, croiseD]).toHaveLength(4)
	})

	it('FicheBrouillon N EST PAS assignable a Personnage — un INVARIANT DE COMPILATION', () => {
		// ⚠ LE TÉMOIN CENTRAL DE LA TRANCHE. « Le brouillon est SANS IDENTITÉ » cesse
		// d'être une convention de docstring : `Personnage` exige QUATRE champs (`id`,
		// `portee`, `plan_actions`, `savoirs`) qu'aucune fente de `FicheBrouillon` ne
		// porte, donc l'affectation NE COMPILE PAS.
		const brouillon: FicheBrouillon = { fonction: 'Une charge.', but: { libelle: 'Un vouloir.' } }
		// @ts-expect-error — les QUATRE requis manquent.
		const p: Personnage = brouillon

		// ⚠ ET LA MOITIÉ QUI DIT CE QUE CE TÉMOIN NE COUVRE PAS : `tsc` tient LA FORME,
		// JAMAIS LE MOMENT. Un précalcul des identifiants À CÔTÉ du brouillon compile
		// parfaitement — la preuve est ci-dessous, et c'est pour cela que le site d'appel
		// de `frapperIdentifiant` est tenu par un ESPION côté feature, jamais par ce type.
		const precalculLegalPourTsc: Array<{ brouillon: FicheBrouillon; idPrecalcule: string }> = [
			{ brouillon, idPrecalcule: 'pnj.precalcule' },
		]
		expect(precalculLegalPourTsc).toHaveLength(1)
		expect(p).toBe(brouillon)
		// Les QUATRE requis de `Personnage`, énumérés : c'est le prédicat du décompte,
		// jamais le nombre seul (KR-159).
		const complet: Personnage = { id: 'pnj.x', portee: 'premier', plan_actions: [], savoirs: [] }
		expect(Object.keys(complet).sort()).toEqual(['id', 'plan_actions', 'portee', 'savoirs'])
		expect(Object.keys(brouillon).filter((cle) => Object.keys(complet).includes(cle))).toEqual([])
	})

	it('FicheBrouillon ne porte AUCUN optionnel seme, et son but n est PAS un But', () => {
		// KR-221 : `nom`, `camp`, `objectif_id`, `apparence`, `description_joueur`,
		// `stats`, `but.pourquoi`, `but.echeance`, `contre_mesures`, `relations`,
		// `presence`, `caractere` sont ABSENTS — jamais semés.
		const brouillon: FicheBrouillon = { fonction: 'Une charge.', but: { libelle: 'Un vouloir.' } }
		const absents = [
			'nom',
			'camp',
			'objectif_id',
			'apparence',
			'description_joueur',
			'stats',
			'contre_mesures',
			'relations',
			'presence',
			'caractere',
			'portee',
			'id',
		]
		expect(absents.filter((cle) => Object.keys(brouillon).includes(cle))).toEqual([])
		expect(Object.keys(brouillon.but)).toEqual(['libelle'])
		expect(Object.keys(brouillon.but)).not.toContain('pourquoi')
		expect(Object.keys(brouillon.but)).not.toContain('echeance')
		// Discriminant : la liste balayée n'est pas vide et chaque clé SERAIT détectée si
		// elle y était (KR-199/235).
		expect(absents.length).toBeGreaterThan(0)
		expect(absents.filter((cle) => [...Object.keys(brouillon), cle].includes(cle))).toEqual(absents)

		// ⚠ `but: { libelle }` EST ASSIGNABLE À `But` SANS LUI ÊTRE ÉGALE, et c'est
		// exactement l'arbitrage : réutiliser `But` rouvrirait `pourquoi` et `echeance`,
		// deux champs que ce contrat ne valide pas.
		const versBut: But = brouillon.but
		expect(versBut.libelle).toBe('Un vouloir.')
		// @ts-expect-error — l'inverse est FAUX : un `But` complet ne s'assigne pas à la
		// fente fermée du brouillon.
		const versBrouillon: FicheBrouillon['but'] = { libelle: 'x', pourquoi: 'y' }
		expect(versBrouillon.libelle).toBe('x')
	})
})

describe('validerDistribution — les DOUZE predicats de forme du sixieme role', () => {
	const dossier = dossierDeReference()
	const CLE_D = CLES_SORTIE_DISTRIBUTION[0]
	/** Deux proses parfaitement saines : ni identifiant, ni marqueur, ni chiffre. */
	const PLACE = 'Marchande du quai bas, la seule qui accepte encore les billets du Nord.'
	const PLACE_2 = 'Capitaine de la garde de nuit, en poste depuis la dernière crue.'
	const POURSUITE = 'Racheter la dette de son frere avant que le prochain convoi ne parte.'
	const POURSUITE_2 = 'Faire rouvrir la porte basse, que le conseil a murée sans le consulter.'
	const fiche = (place: string, poursuite: string): Record<string, unknown> => ({ place, poursuite })
	const sortie = (fiches: unknown): Record<string, unknown> => ({ [CLE_D]: fiches })

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], [fiche(PLACE, POURSUITE)], PLACE, 42, true]) {
			expect({ brut, ...validerDistribution(brut, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — l ensemble des cles doit valoir exactement CLES_SORTIE_DISTRIBUTION', () => {
		// Une clé MANQUANTE, une clé RENOMMÉE (la panne KR-236 vue du validateur), une
		// clé SURNUMÉRAIRE — un REFUS, jamais un champ ignoré.
		// ⚠ `personnages` et `fiches` sont PRÉCISÉMENT les deux noms que le veto a
		// écartés du fil : s'ils revenaient, ils seraient refusés ici.
		expect(validerDistribution({}, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerDistribution({ personnages: [fiche(PLACE, POURSUITE)] }, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerDistribution({ fiches: [fiche(PLACE, POURSUITE)] }, dossier)).toEqual({ ok: false, motif: 'schema' })
		expect(validerDistribution({ [CLE_D]: [fiche(PLACE, POURSUITE)], dossierId: 'aventure' }, dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Une clé HÉRITÉE ne compte pas : `Object.keys` ne voit que le propre (KR-175).
		expect(validerDistribution(Object.create({ [CLE_D]: [fiche(PLACE, POURSUITE)] }), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('3 — une valeur qui n est pas un tableau est refusee, motif schema', () => {
		for (const valeur of [PLACE, 42, null, fiche(PLACE, POURSUITE), true]) {
			expect({ valeur, ...validerDistribution(sortie(valeur), dossier) }).toEqual({
				valeur,
				ok: false,
				motif: 'schema',
			})
		}
	})

	it('4 — un element qui n est pas un objet a deux cles est refuse, motif schema', () => {
		// Une chaîne nue, un `null`, un tableau, un objet à UNE clé — tous meurent ici.
		for (const element of [PLACE, null, 42, [], [PLACE, POURSUITE], { place: PLACE }, { poursuite: POURSUITE }]) {
			expect({ element, ...validerDistribution(sortie([element]), dossier) }).toEqual({
				element,
				ok: false,
				motif: 'schema',
			})
		}
		// EN POSITION NON NULLE : un garde qui ne regarderait que `[0]` accepterait le lot.
		expect(validerDistribution(sortie([fiche(PLACE, POURSUITE), PLACE_2]), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('12 — une cle EN TROP au SECOND niveau est un REFUS, jamais un champ ignore', () => {
		// ⚠ LE SIGNAL KR-236 AU SECOND NIVEAU, et c'est la moitié de `estFicheBrute` que
		// le prédicat (4) ne prouve pas : là-bas la clé MANQUE, ici elle est EN TROP.
		// Le jour où l'invite du worker demande autre chose que `GABARIT_SORTIE`, c'est
		// ICI que ça se voit.
		const enTrop = { place: PLACE, poursuite: POURSUITE, nom: 'Le Marchand' }
		expect(validerDistribution(sortie([enTrop]), dossier)).toEqual({ ok: false, motif: 'schema' })
		// `portee` est le cas le plus dangereux : une donnée de MOTEUR que le modèle
		// choisirait. Elle est refusée comme les autres.
		expect(validerDistribution(sortie([{ place: PLACE, poursuite: POURSUITE, portee: 'premier' }]), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// EN POSITION NON NULLE, et la fiche 0 parfaitement saine.
		expect(validerDistribution(sortie([fiche(PLACE, POURSUITE), enTrop]), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Discriminant : LA MÊME fiche sans la clé en trop PASSE — sans lui, ce refus
		// pourrait venir de n'importe quel autre prédicat (KR-199).
		expect(validerDistribution(sortie([fiche(PLACE, POURSUITE)]), dossier).ok).toBe(true)
	})

	it('5 — une valeur d element non textuelle est refusee, et JAMAIS convertie', () => {
		// UN TABLEAU MEURT ICI, sur CHACUNE des deux clés — et JAMAIS `[0]`, JAMAIS
		// `String(…)` : repêcher ou coercer ferait ratifier à l'auteur une valeur que LE
		// CODE aurait choisie.
		for (const valeur of [[PLACE], 42, null, true, { texte: PLACE }]) {
			expect({ valeur, ...validerDistribution(sortie([{ place: valeur, poursuite: POURSUITE }]), dossier) }).toEqual({
				valeur,
				ok: false,
				motif: 'schema',
			})
			expect({ valeur, ...validerDistribution(sortie([{ place: PLACE, poursuite: valeur }]), dossier) }).toEqual({
				valeur,
				ok: false,
				motif: 'schema',
			})
		}
		// LES DEUX MUTANTS, ÉCRITS À CÔTÉ DE LA VRAIE et prouvés fautifs sur ce lot.
		const fautive = { place: [PLACE, PLACE_2], poursuite: POURSUITE }
		const mutantIndexZero = (element: Record<string, unknown>): string => (element.place as string[])[0]
		expect(mutantIndexZero(fautive)).toBe(PLACE)
		const mutantString = (element: Record<string, unknown>): string => String(element.place)
		expect(mutantString(fautive)).toBe(`${PLACE},${PLACE_2}`)
		expect(mutantString({ place: { a: 1 }, poursuite: POURSUITE })).toBe('[object Object]')
		// … et la VRAIE refuse.
		expect(validerDistribution(sortie([fautive]), dossier)).toEqual({ ok: false, motif: 'schema' })
		// … et le balayage de SOURCE : ce corps ne repêche ni ne convertit. LES PORTES
		// SONT NOMMÉES UNE PAR UNE plutôt qu'un balayage vague — `[0]` NU serait un FAUX
		// POSITIF MESURÉ, `CLES_FICHE[0]` indexant la LISTE DE CLÉS, ce qui est légitime
		// et n'a rien à voir avec un repêchage de VALEUR (même constat qu'au 4ᵉ rôle).
		const corps = corpsDe(codeSansCommentaires(), 'validerDistribution')
		expect(corps).not.toContain('String(')
		expect(corps).not.toContain('place[')
		expect(corps).not.toContain('poursuite[')
		// Discriminants : le balayage porte bien sur du code réel, et il S'ARRÊTE à sa
		// fonction — sans quoi il pourrait courir jusqu'à la fin du fichier sans que rien
		// ne le dise (KR-226).
		expect(corps).toContain('export function validerDistribution(')
		expect(corps).not.toContain('export function validerRelations(')
	})

	it('6 — quatre fiches refusees, trois acceptees : la borne par COMPORTEMENT', () => {
		// UN REFUS, JAMAIS UNE TRONCATURE (KR-230) : repêcher les trois premières ferait
		// RATIFIER UNE DISTRIBUTION AMPUTÉE SANS QUE L'AUTEUR LE SACHE.
		const trois = [fiche(PLACE, POURSUITE), fiche(PLACE_2, POURSUITE_2), fiche('Une troisieme charge.', 'Un tiers.')]
		const quatre = [...trois, fiche('Une quatrieme charge.', 'Un quart.')]

		expect(validerDistribution(sortie(trois), dossier).ok).toBe(true)
		const refus = validerDistribution(sortie(quatre), dossier)
		expect(refus).toEqual({ ok: false, motif: 'schema' })
		// ⚠ RIEN de la sortie fautive ne survit : ni la liste, ni les trois fiches saines.
		expect(refus).not.toHaveProperty('sortie')
		expect(JSON.stringify(refus)).not.toContain(PLACE)
		// LE MUTANT DE TRONCATURE, écrit à côté de la vraie et prouvé fautif : il rendrait
		// une distribution de trois là où le modèle en a proposé quatre.
		const mutantTroncature = (fiches: Array<Record<string, unknown>>): Array<Record<string, unknown>> =>
			fiches.slice(0, FICHES_PROPOSEES_MAX)
		expect(mutantTroncature(quatre)).toHaveLength(FICHES_PROPOSEES_MAX)
		expect(mutantTroncature(quatre)).toEqual(trois)
		// La borne éprouvée est bien CELLE DE CE RÔLE : balayage de SOURCE (§ 8, n° 42).
		const corps = corpsDe(codeSansCommentaires(), 'validerDistribution')
		expect(corps).toContain('FICHES_PROPOSEES_MAX')
		expect(corps).not.toContain('PROPOSITIONS_MAX)')
		expect(corps).not.toContain('REPLIQUES_PROPOSEES_MAX')
		expect(corps).not.toContain('RELATIONS_PROPOSEES_MAX')
		expect(codeSansCommentaires()).toContain('export const FICHES_PROPOSEES_MAX = 3')
	})

	it('7 — la liste vide est un REFUS vide, JAMAIS un succes — la CREATION n a pas de troisieme cas', () => {
		// CRITÈRE 3, PREMIÈRE ENTRÉE. ⚠ `vide`, ET NON `schema`.
		// LE CRITÈRE UNIQUE : la liste vide porte-t-elle une information que le code n'a
		// pas ? En CRÉATION, IL N'EXISTE AUCUN ENSEMBLE DE CANDIDATS À ÉPUISER — c'est le
		// motif même pour lequel `'aucun-candidat'` est écarté de ce rôle —, donc la
		// vacuité NE PEUT RIEN SIGNIFIER ⇒ REFUS. Le troisième cas N'A PAS D'INSTANCE.
		expect(validerDistribution(sortie([]), dossier)).toEqual({ ok: false, motif: 'vide' })
		// LES DEUX AUTRES MOITIÉS, dans le MÊME test — sinon « la création est un cas à
		// part » serait indistinguable de « la création est la rédaction ».
		expect(validerDetenteurs({ detenteurs: [] }, new Set(['P1']))).toEqual({ ok: true, detenteurs: [] })
		expect(validerRepliques({ repliques: [] }, dossier)).toEqual({ ok: false, motif: 'vide' })
	})

	it('8 — une prose blanche APRES une saine, motif vide, index >= 1, SUR LES DEUX CHAMPS', () => {
		// L'INDEX EST LE POINT : un scanner qui ne regarderait que `[0]` trouverait la
		// première fiche parfaitement valide et accepterait le lot. LE CHAMP AUSSI : un
		// scanner qui ne regarderait que `place` laisserait passer une `poursuite` vide.
		for (const blanc of ['', '   ', '\n\t ']) {
			expect({
				blanc,
				champ: 'place',
				...validerDistribution(sortie([fiche(PLACE, POURSUITE), fiche(blanc, POURSUITE_2)]), dossier),
			}).toEqual({ blanc, champ: 'place', ok: false, motif: 'vide' })
			expect({
				blanc,
				champ: 'poursuite',
				...validerDistribution(sortie([fiche(PLACE, POURSUITE), fiche(PLACE_2, blanc)]), dossier),
			}).toEqual({ blanc, champ: 'poursuite', ok: false, motif: 'vide' })
		}
		// LE MUTANT « ne scanner que `place` », écrit à côté de la vraie et prouvé fautif.
		const lot = [fiche(PLACE, POURSUITE), fiche(PLACE_2, '   ')]
		const mutantPlaceSeule = (fiches: Array<Record<string, unknown>>): boolean =>
			fiches.some((element) => String(element.place).trim().length === 0)
		expect(mutantPlaceSeule(lot)).toBe(false)
		expect(validerDistribution(sortie(lot), dossier)).toEqual({ ok: false, motif: 'vide' })
	})

	it('7 et 8 sont DEUX predicats distincts, chacun rougissant seul', () => {
		// La preuve est une NEUTRALISATION : on écrit les deux mutants, et chacun laisse
		// passer EXACTEMENT UNE des deux entrées — donc aucun des deux n'est redondant.
		const listeVide: Array<Record<string, unknown>> = []
		const blancTardif = [fiche(PLACE, POURSUITE), fiche(PLACE_2, '   ')]

		// MUTANT A — le prédicat (7) retiré. La liste vide passe, le blanc tardif meurt.
		const sans7 = (fiches: Array<Record<string, unknown>>): 'passe' | 'vide' =>
			fiches.some((element) => String(element.poursuite).trim().length === 0) ? 'vide' : 'passe'
		expect(sans7(listeVide)).toBe('passe')
		expect(sans7(blancTardif)).toBe('vide')

		// MUTANT B — le prédicat (8) retiré. Le blanc tardif PASSE, la liste vide meurt.
		const sans8 = (fiches: Array<Record<string, unknown>>): 'passe' | 'vide' => (fiches.length === 0 ? 'vide' : 'passe')
		expect(sans8(blancTardif)).toBe('passe')
		expect(sans8(listeVide)).toBe('vide')

		// Et la VRAIE refuse les deux.
		expect(validerDistribution(sortie(listeVide), dossier)).toEqual({ ok: false, motif: 'vide' })
		expect(validerDistribution(sortie(blancTardif), dossier)).toEqual({ ok: false, motif: 'vide' })
	})

	it('9 — LE COUPLE identique est refuse, et LES DEUX demi-doublons sont ACCEPTES', () => {
		// ⚠ CRITÈRE 3, DEUXIÈME ENTRÉE, ET LE PRÉDICAT NEUF DE L'ITÉRATION. Il porte sur
		// LE COUPLE, jamais sur une seule clé, et ses TROIS TÉMOINS sont ici, dans le
		// MÊME test — sans les deux derniers, un prédicat sur une seule clé passerait
		// pour bon tout en REFUSANT UNE RÉPONSE JUSTE.

		// TÉMOIN 1 — couple identique ⇒ REJET. C'est du REMPLISSAGE : un menu de un
		// présenté comme un menu de deux.
		expect(validerDistribution(sortie([fiche(PLACE, POURSUITE), fiche(PLACE, POURSUITE)]), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// NON ADJACENT : un garde qui ne comparerait qu'aux voisins passerait.
		expect(
			validerDistribution(
				sortie([fiche(PLACE, POURSUITE), fiche(PLACE_2, POURSUITE_2), fiche(PLACE, POURSUITE)]),
				dossier,
			),
		).toEqual({ ok: false, motif: 'schema' })

		// TÉMOIN 2 — MÊME `place`, `poursuite` DIFFÉRENTE ⇒ ACCEPTÉ. DEUX GARDES
		// PARTAGENT LÉGITIMEMENT UNE PLACE : ce sont deux personnes, pas un doublon.
		expect(validerDistribution(sortie([fiche(PLACE, POURSUITE), fiche(PLACE, POURSUITE_2)]), dossier)).toEqual({
			ok: true,
			sortie: {
				distribution: [
					{ place: PLACE, poursuite: POURSUITE },
					{ place: PLACE, poursuite: POURSUITE_2 },
				],
			},
		})

		// TÉMOIN 3 — MÊME `poursuite`, `place` DIFFÉRENTE ⇒ ACCEPTÉ. Deux prétendants
		// veulent légitimement la même chose — c'est même ce qui fait une intrigue.
		expect(validerDistribution(sortie([fiche(PLACE, POURSUITE), fiche(PLACE_2, POURSUITE)]), dossier)).toEqual({
			ok: true,
			sortie: {
				distribution: [
					{ place: PLACE, poursuite: POURSUITE },
					{ place: PLACE_2, poursuite: POURSUITE },
				],
			},
		})
	})

	it('9 bis — LE MUTANT DU COUPLE : une unicite reduite a UNE SEULE CLE refuserait une reponse juste', () => {
		// ⚠ LE MUTANT QUE LE PLAN EXIGE DE VOIR ROUGE, écrit à côté de la vraie et prouvé
		// fautif SUR LES DEUX DEMI-DOUBLONS — c'est-à-dire sur des lots PARFAITEMENT
		// LÉGITIMES. Un prédicat sur une seule clé ne « durcit » pas le contrat : il
		// REFUSE UNE RÉPONSE JUSTE, et rien à l'écran ne dirait pourquoi.
		const memePlace = [fiche(PLACE, POURSUITE), fiche(PLACE, POURSUITE_2)]
		const memePoursuite = [fiche(PLACE, POURSUITE), fiche(PLACE_2, POURSUITE)]
		const coupleIdentique = [fiche(PLACE, POURSUITE), fiche(PLACE, POURSUITE)]

		const mutantPlaceSeule = (fiches: Array<Record<string, unknown>>): boolean =>
			new Set(fiches.map((element) => element.place)).size !== fiches.length
		const mutantPoursuiteSeule = (fiches: Array<Record<string, unknown>>): boolean =>
			new Set(fiches.map((element) => element.poursuite)).size !== fiches.length

		// LES DEUX MUTANTS REFUSENT un lot que la VRAIE accepte : le pouvoir séparateur
		// est ÉTABLI, pas supposé.
		expect(mutantPlaceSeule(memePlace)).toBe(true)
		expect(validerDistribution(sortie(memePlace), dossier).ok).toBe(true)
		expect(mutantPoursuiteSeule(memePoursuite)).toBe(true)
		expect(validerDistribution(sortie(memePoursuite), dossier).ok).toBe(true)
		// … et sur le couple identique, les trois sont d'accord — ce qui montre que les
		// mutants ne sont pas simplement inertes.
		expect(mutantPlaceSeule(coupleIdentique)).toBe(true)
		expect(mutantPoursuiteSeule(coupleIdentique)).toBe(true)
		expect(validerDistribution(sortie(coupleIdentique), dossier).ok).toBe(false)

		// … et le balayage de SOURCE : le corps n'a qu'UNE garde d'unicité, et elle porte
		// sur le COUPLE, jamais sur une projection d'une seule clé.
		const corps = corpsDe(codeSansCommentaires(), 'validerDistribution')
		expect(corps).toContain('new Set(couples)')
		expect(corps.match(/new Set\(/g) ?? []).toHaveLength(1)
	})

	it('10 — le marqueur a ecrire est refuse SUR LES DEUX PROSES, constante IMPORTEE', () => {
		// KR-223 : la constante est IMPORTÉE, jamais recopiée — le test ne peut pas
		// écrire le glyphe lui-même.
		expect(validerDistribution(sortie([fiche(`${MARQUEUR_A_ECRIRE} a rediger`, POURSUITE)]), dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		expect(validerDistribution(sortie([fiche(PLACE, `${MARQUEUR_A_ECRIRE} a rediger`)]), dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		// EN POSITION NON NULLE, et `includes` plutôt que `startsWith`.
		expect(
			validerDistribution(
				sortie([fiche(PLACE, POURSUITE), fiche(PLACE_2, `Une phrase, puis ${MARQUEUR_A_ECRIRE} au milieu.`)]),
				dossier,
			),
		).toEqual({ ok: false, motif: 'marqueur' })
	})

	it('11 — un identifiant en DERNIERE position et sur le SECOND champ : le lot ENTIER est refuse', () => {
		// L'identifiant est au DERNIER rang ET sur la seconde prose : c'est ce qui rend
		// observables À LA FOIS le mutant « ne scanner que `[0]` » et le mutant « ne
		// scanner que `place` ».
		const neuf = dossierNeuf()
		const lot = [fiche(PLACE, POURSUITE), fiche(PLACE_2, POURSUITE_2), fiche('Une charge saine.', CANARI_FUITE)]

		const refus = validerDistribution(sortie(lot), neuf)

		expect(refus).toEqual({ ok: false, motif: 'identifiant' })
		// RIEN de la sortie fautive ne survit : ni la liste, ni les fiches saines.
		expect(refus).not.toHaveProperty('sortie')
		expect(JSON.stringify(refus)).not.toContain(PLACE)
		// … et la même fuite sur `place` est refusée elle aussi.
		expect(validerDistribution(sortie([fiche(CANARI_FUITE, POURSUITE)]), neuf)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
		// CANARI BÉNIN sur les DEUX champs : une prose française saine PASSE — sans lui,
		// un scanner de forme seule passerait pour un garde (KR-235).
		expect(validerDistribution(sortie([fiche(CANARI_BENIN, CANARI_BENIN)]), neuf).ok).toBe(true)
	})

	it('11 bis — mutants « element 0 seul », « place seule » et « join avant le scan »', () => {
		// LE POUVOIR SÉPARATEUR, ÉCRIT ET NON DÉDUIT (BUG-087). Les implémentations
		// FAUTIVES sont ici, à côté de la vraie, et chacune est prouvée fautive sur un lot
		// précis.
		const neuf = dossierNeuf()

		// MUTANT A — `[0]` : la fuite en dernière position s'échappe.
		const lot = [fiche(PLACE, POURSUITE), fiche(PLACE_2, POURSUITE_2), fiche('Une charge saine.', CANARI_FUITE)]
		const mutantIndexZero = (fiches: Array<Record<string, unknown>>): boolean =>
			porteUnIdentifiant(String(fiches[0].place), neuf) || porteUnIdentifiant(String(fiches[0].poursuite), neuf)
		expect(mutantIndexZero(lot)).toBe(false)
		expect(validerDistribution(sortie(lot), neuf)).toEqual({ ok: false, motif: 'identifiant' })

		// MUTANT B — `place` SEULE : la fuite logée dans `poursuite` s'échappe. Propre à
		// ce rôle, dont chaque élément porte DEUX proses scannables.
		const mutantPlaceSeule = (fiches: Array<Record<string, unknown>>): boolean =>
			fiches.some((element) => porteUnIdentifiant(String(element.place), neuf))
		expect(mutantPlaceSeule(lot)).toBe(false)

		// MUTANT C — `join` avant le scan : un FAUX POSITIF FABRIQUÉ à la frontière. Deux
		// fragments logés dans deux champs DISTINCTS ne forment pas un identifiant — ils
		// deviendront deux proses de deux fiches SÉPARÉES.
		const avant = 'Gardienne du seuil, elle ne quitte jamais le lieu.'
		const apres = 'amorce des ennuis, dit-on au village, et elle le sait.'
		const sain = [fiche(avant, apres)]
		expect(porteUnIdentifiant(avant, neuf)).toBe(false)
		expect(porteUnIdentifiant(apres, neuf)).toBe(false)
		const mutantJoin = (fiches: Array<Record<string, unknown>>): boolean =>
			porteUnIdentifiant(fiches.flatMap((element) => [String(element.place), String(element.poursuite)]).join(''), neuf)
		expect(mutantJoin(sain)).toBe(true)
		// … et la vraie, qui scanne PAR ÉLÉMENT ET PAR CHAMP, accepte ce lot sain.
		expect(validerDistribution(sortie(sain), neuf).ok).toBe(true)
		// … et le balayage de SOURCE : aucun `join` dans ce corps.
		expect(corpsDe(codeSansCommentaires(), 'validerDistribution')).not.toContain('.join(')
	})

	it('11 ter — le scanner est appele SUR LES DEUX PROSES, et sur rien d autre', () => {
		const neuf = dossierNeuf()
		const corps = corpsDe(codeSansCommentaires(), 'validerDistribution')
		const appels = corps.match(/porteUnIdentifiant\([^)]*\)/g) ?? []

		// DEUX appels, un par prose — et aucun sur autre chose : ce rôle n'a aucun jeton.
		expect(appels).toHaveLength(2)
		expect(appels.filter((appel) => appel.includes('fiche.place'))).toHaveLength(1)
		expect(appels.filter((appel) => appel.includes('fiche.poursuite'))).toHaveLength(1)
		// Le marqueur d'amorce est cherché dans les deux proses lui aussi.
		expect(corps.match(/\.includes\(MARQUEUR_A_ECRIRE\)/g) ?? []).toHaveLength(2)
		// Discriminant : le scanner EXISTE bien et il MORD — sans cette ligne, « deux
		// appels » serait vrai sur un corps qui n'en ferait aucun (KR-199).
		expect(porteUnIdentifiant(CANARI_FUITE, neuf)).toBe(true)
		expect(corps).toContain('porteUnIdentifiant(')
	})

	it('QUATRE motifs ATTEIGNABLES, et rang-inconnu est SANS OBJET — jamais rejoue par symetrie', () => {
		// ⚠ CRITÈRE 3, TROISIÈME ENTRÉE. Le type de retour ne nomme que ce qui peut
		// sortir, et chacun des quatre est atteint par SA faute.
		const neuf = dossierNeuf()
		const motifs = [
			validerDistribution(42, dossier),
			validerDistribution(sortie([]), dossier),
			validerDistribution(sortie([fiche(PLACE, `${MARQUEUR_A_ECRIRE} a rediger`)]), dossier),
			validerDistribution(sortie([fiche(PLACE, CANARI_FUITE)]), neuf),
		].map((issue) => (issue.ok ? 'ACCEPTÉ' : issue.motif))

		expect(motifs).toEqual(['schema', 'vide', 'marqueur', 'identifiant'])
		expect(new Set(motifs).size).toBe(4)

		// ⚠ `'rang-inconnu'` EST SANS OBJET ICI, ET C'EST ASSERTÉ PLUTÔT QUE TU : aucun
		// jeton, aucune table d'appartenance. L'écrire « par symétrie » avec le
		// cinquième rôle serait du code mort présenté comme de la couverture (BUG-084).
		const corps = corpsDe(codeSansCommentaires(), 'validerDistribution')
		expect(corps).not.toContain('rang-inconnu')
		expect(corps).not.toContain('rangsConnus')
		// Discriminants : le motif EXISTE bel et bien dans `MotifIllisible`, et le
		// cinquième validateur le produit — sans eux, l'absence serait vraie pour rien.
		expect(corpsDe(codeSansCommentaires(), 'validerRelations')).toContain('rang-inconnu')
		expect(codeSansCommentaires()).toContain("'identifiant' | 'rang-inconnu'")
		// ⚠ ET LE SIXIÈME NE NOMME PAS `MotifIllisible` EN ENTIER, là où le cinquième est
		// le seul à le faire : la différence est une MESURE, pas une irrégularité.
		expect(corps).not.toContain('MotifIllisible')
		expect(corpsDe(codeSansCommentaires(), 'validerRelations')).toContain('MotifIllisible')
	})

	it('le nominal rend ok avec la sortie, et rien d autre', () => {
		const fiches = [fiche(PLACE, POURSUITE), fiche(PLACE_2, POURSUITE_2)]

		expect(validerDistribution(sortie(fiches), dossier)).toEqual({
			ok: true,
			sortie: {
				distribution: [
					{ place: PLACE, poursuite: POURSUITE },
					{ place: PLACE_2, poursuite: POURSUITE_2 },
				],
			},
		})
	})

	it('le gabarit du sixieme role EST son schema, AUX DEUX NIVEAUX', () => {
		const rendu = JSON.parse(GABARIT_SORTIE['monde-distribution']) as Record<string, unknown>

		// NIVEAU 1 — la clé de premier niveau.
		expect(Object.keys(rendu)).toEqual([...CLES_SORTIE_DISTRIBUTION])
		// NIVEAU 2 — la valeur est une LISTE d'OBJETS à deux clés, jamais de scalaires.
		const elements = rendu[CLES_SORTIE_DISTRIBUTION[0]] as Array<Record<string, unknown>>
		expect(Array.isArray(elements)).toBe(true)
		expect(elements.length).toBeGreaterThan(1)
		for (const element of elements) expect(Object.keys(element).sort()).toEqual(['place', 'poursuite'])
		// ⚠ LE GABARIT NE PORTE AUCUN RANG, à la différence de celui du cinquième rôle :
		// ce rôle n'a AUCUNE FENTE DE DÉSIGNATION, et c'est ce qui borne PAR LA FORME la
		// référence croisée (KR-229).
		expect(GABARIT_SORTIE['monde-distribution']).not.toMatch(/P\d/)
		// Et ses clés sont DISJOINTES de celles des cinq autres schémas — on ne peut pas
		// passer une sortie pour une autre.
		for (const autres of [
			CLES_SORTIE,
			CLES_SORTIE_DETENTEURS,
			CLES_SORTIE_REPLIQUES,
			CLES_SORTIE_PLAN,
			CLES_SORTIE_RELATIONS,
		]) {
			expect(CLES_SORTIE_DISTRIBUTION.filter((cle) => (autres as readonly string[]).includes(cle))).toEqual([])
		}
	})
})

// ══ LE SEPTIÈME RÔLE — `interprete` (n° 10, `moteur-interprete`) ═════════════
//
// TROIS FORMES DISJOINTES au premier niveau (`geste`, `precision`,
// `sans_commande`), PAS un schéma unique à clés optionnelles : une clé mêlée
// d'une forme à l'autre est un refus `schema`, comme pour les six rôles
// précédents une clé en trop.
describe('validerInterprete — trois formes disjointes, arite SEUL decideur (KR-013)', () => {
	const dossier = dossierDeReference()

	/** DEUX lieux rangés, AUCUN personnage — la table de référence des tests
	 *  « nominaux » et des témoins d'échec qui n'éprouvent PAS la garde `< 2`. */
	const TABLES: TablesInterprete = {
		lieux: new Map([
			['P1', 'lieu.foyer-du-guet'],
			['P2', 'lieu.tour-effondree'],
		]),
		personnages: new Map(),
		gestes: new Map([['G1', 'aller']]),
	}

	/** UN SEUL lieu rangé, AUCUN personnage — la table qui rend une clarification
	 *  structurellement impossible (motif 6, § 8 désaccord 11 du plan d'itération,
	 *  étendu désaccord #1 du plan it1 de la n° 12). */
	const TABLE_UN_SEUL_LIEU: TablesInterprete = {
		lieux: new Map([['P1', 'lieu.foyer-du-guet']]),
		personnages: new Map(),
		gestes: new Map([['G1', 'aller']]),
	}

	/** AUCUN lieu, DEUX personnages rangés — l'ÉTAT SÉPARATEUR de l'extension n° 12 :
	 *  une clarification admise alors que `lieux.size < 2`, SEULEMENT parce que
	 *  `personnages.size >= 2`. */
	const TABLE_DEUX_PERSONNAGES: TablesInterprete = {
		lieux: new Map(),
		personnages: new Map([
			['I1', 'pnj.harek-le-forgeron'],
			['I2', 'pnj.corvin-le-marchand'],
		]),
		gestes: new Map([['G1', 'parler']]),
	}

	it('le nominal — {geste, designe} de bonne arite rend ok, MEME FORME', () => {
		expect(validerInterprete({ geste: 'G1', designe: ['P1'] }, TABLES, dossier)).toEqual({
			ok: true,
			sortie: { geste: 'G1', designe: ['P1'] },
		})
	})

	it('le nominal — precision valide (>= 2 lieux ranges) rend ok', () => {
		const precision = 'Lequel des deux lieux voulez-vous rejoindre ?'
		expect(validerInterprete({ precision }, TABLES, dossier)).toEqual({ ok: true, sortie: { precision } })
	})

	it('le nominal — sans_commande:true rend ok', () => {
		expect(validerInterprete({ sans_commande: true }, TABLES, dossier)).toEqual({
			ok: true,
			sortie: { sans_commande: true },
		})
	})

	/**
	 * RÉSOLUTION PAR POSITION (n° 12 `moteur-acteurs`, it1) — `parler` a
	 * `refKinds:['pnj']`, donc `designe[0]` doit appartenir à `tables.personnages`,
	 * JAMAIS `tables.lieux` — même quand un rang de même FORME (`I1`) existerait
	 * dans l'une ou l'autre table. Prouvé dans les deux sens (§ 6 critère 3 du plan).
	 */
	describe('resolution par position — pnj contre lieu (n 12, it1)', () => {
		const TABLES_PARLER: TablesInterprete = {
			lieux: new Map([['P1', 'lieu.foyer-du-guet']]),
			personnages: new Map([['I1', 'pnj.harek-le-forgeron']]),
			gestes: new Map([['G1', 'parler']]),
		}

		it('un geste parler designe un rang I de tables.personnages : accepte', () => {
			expect(validerInterprete({ geste: 'G1', designe: ['I1'] }, TABLES_PARLER, dossier)).toEqual({
				ok: true,
				sortie: { geste: 'G1', designe: ['I1'] },
			})
		})

		it('{parler, [P1]} est refuse rang-inconnu : P1 n appartient pas a tables.personnages', () => {
			expect(validerInterprete({ geste: 'G1', designe: ['P1'] }, TABLES_PARLER, dossier)).toEqual({
				ok: false,
				motif: 'rang-inconnu',
			})
		})

		it('{aller, [I1]} est refuse rang-inconnu : I1 n appartient pas a tables.lieux', () => {
			const tablesAller: TablesInterprete = {
				lieux: new Map([['P1', 'lieu.foyer-du-guet']]),
				personnages: new Map([['I1', 'pnj.harek-le-forgeron']]),
				gestes: new Map([['G1', 'aller']]),
			}
			expect(validerInterprete({ geste: 'G1', designe: ['I1'] }, tablesAller, dossier)).toEqual({
				ok: false,
				motif: 'rang-inconnu',
			})
		})
	})

	/**
	 * PRÉDICAT (12) ÉTENDU (n° 12, it1) — une clarification est admise dès qu'UNE
	 * des deux familles compte au moins deux candidats, même si l'autre n'en
	 * compte aucun.
	 */
	it('precision admise sur 0 lieu / 2 personnages (predicat 12 etendu, n 12)', () => {
		const precision = 'Vous parlez au forgeron ou au marchand ?'
		expect(validerInterprete({ precision }, TABLE_DEUX_PERSONNAGES, dossier)).toEqual({
			ok: true,
			sortie: { precision },
		})
	})

	it('ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], 'G1', 42, true]) {
			expect({ brut, ...validerInterprete(brut, TABLES, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	describe('les six temoins d echec, chacun un motif exact (annexe E du plan d iteration)', () => {
		it('1 — designe de longueur != arite (2 rangs pour un geste d arite 1)', () => {
			expect(validerInterprete({ geste: 'G1', designe: ['P1', 'P2'] }, TABLES, dossier)).toEqual({
				ok: false,
				motif: 'schema',
			})
		})

		it('2 — cles melees : geste ET precision au meme niveau', () => {
			expect(validerInterprete({ geste: 'G1', designe: ['P1'], precision: 'Un ajout ?' }, TABLES, dossier)).toEqual({
				ok: false,
				motif: 'schema',
			})
		})

		it('3 — sans_commande:false est refuse, jamais repeche en true', () => {
			expect(validerInterprete({ sans_commande: false }, TABLES, dossier)).toEqual({ ok: false, motif: 'schema' })
		})

		it('4 — g1 (non normalise en casse) est refuse : AUCUNE normalisation de casse', () => {
			expect(validerInterprete({ geste: 'g1', designe: ['P1'] }, TABLES, dossier)).toEqual({
				ok: false,
				motif: 'schema',
			})
		})

		it('5 — une precision contenant un rang (P2) est refusee, motif identifiant', () => {
			expect(validerInterprete({ precision: 'Vous parlez du lieu P2, exactement ?' }, TABLES, dossier)).toEqual({
				ok: false,
				motif: 'identifiant',
			})
		})

		it('6 — une precision avec une table de moins de 2 lieux est refusee, motif schema', () => {
			const precision = 'Voulez-vous vraiment vous y rendre ?'
			expect(validerInterprete({ precision }, TABLE_UN_SEUL_LIEU, dossier)).toEqual({ ok: false, motif: 'schema' })
			// Discriminant : LA MEME precision, sur la table a DEUX lieux, passe.
			expect(validerInterprete({ precision }, TABLES, dossier)).toEqual({ ok: true, sortie: { precision } })
		})
	})

	describe('predicats de la branche precision, un par un', () => {
		it('vide apres trim : motif vide', () => {
			expect(validerInterprete({ precision: '   ' }, TABLES, dossier)).toEqual({ ok: false, motif: 'vide' })
		})

		it('plus de 120 caracteres : motif schema', () => {
			const trop = `${'x'.repeat(PRECISION_CARACTERES_MAX)}?`
			expect(trop.length).toBeGreaterThan(PRECISION_CARACTERES_MAX)
			expect(validerInterprete({ precision: trop }, TABLES, dossier)).toEqual({ ok: false, motif: 'schema' })
			// Et EXACTEMENT la borne passe (sans le rester `?` en trop).
			const juste = `${'x'.repeat(PRECISION_CARACTERES_MAX - 1)}?`
			expect(juste).toHaveLength(PRECISION_CARACTERES_MAX)
			expect(validerInterprete({ precision: juste }, TABLES, dossier)).toEqual({
				ok: true,
				sortie: { precision: juste },
			})
		})

		it('ne finit pas par un point d interrogation : motif schema', () => {
			expect(validerInterprete({ precision: 'Le grand marche' }, TABLES, dossier)).toEqual({
				ok: false,
				motif: 'schema',
			})
		})

		it('porte le marqueur d amorce : motif marqueur', () => {
			expect(validerInterprete({ precision: `${MARQUEUR_A_ECRIRE} ?` }, TABLES, dossier)).toEqual({
				ok: false,
				motif: 'marqueur',
			})
		})

		it('porte un identifiant du dossier : motif identifiant', () => {
			const neuf = construireAmorce('canari-interprete', 'Un dossier canari', '2026-09-25T00:00:00.000Z')
			const tablesNeuf: TablesInterprete = {
				lieux: new Map([
					['P1', 'x'],
					['P2', 'y'],
				]),
				personnages: new Map(),
				gestes: new Map([['G1', 'aller']]),
			}
			expect(validerInterprete({ precision: 'Le sceau de lieu.amorce tient-il encore ?' }, tablesNeuf, neuf)).toEqual({
				ok: false,
				motif: 'identifiant',
			})
		})
	})

	describe('porteUnRang — le scanner propre a ce role', () => {
		it('detecte un rang de lieu OU de geste, jamais un mot francais courant', () => {
			expect(porteUnRang('Vous visez le lieu P2 ?', TABLES)).toBe(true)
			expect(porteUnRang('Le geste G1 est-il celui-ci ?', TABLES)).toBe(true)
			expect(porteUnRang('Une phrase parfaitement saine, sans aucun rang.', TABLES)).toBe(false)
		})

		it('un rang qui a la FORME mais n appartient a AUCUNE des TROIS tables ne compte pas', () => {
			expect(porteUnRang('Le lieu P9 existe-t-il ?', TABLES)).toBe(false)
			expect(porteUnRang('Le geste G9 existe-t-il ?', TABLES)).toBe(false)
			expect(porteUnRang('La personne I9 existe-t-elle ?', TABLES)).toBe(false)
		})

		it('detecte un rang de personnage I<n> (n 12, it1), appartenant a tables.personnages', () => {
			expect(porteUnRang('Vous parlez de la personne I1 ?', TABLE_DEUX_PERSONNAGES)).toBe(true)
		})
	})

	/**
	 * LES TROIS MUTANTS OBLIGATOIRES du plan d'itération (§ 4 ter), ÉCRITS et non
	 * déduits, EXACTEMENT comme ceux du scanner anti-identifiant plus haut dans ce
	 * fichier : une implémentation FAUTIVE, à côté de la vraie, prouvée fautive sur
	 * un témoin précis.
	 */
	describe('les trois mutants obligatoires', () => {
		it('mutant 1 — arite retiree : designe de longueur 2 serait accepte', () => {
			const mutantSansArite = (rendu: { geste: string; designe: readonly string[] }): boolean => {
				const commandeId = TABLES.gestes.get(rendu.geste)
				if (commandeId === undefined) return false
				// L'ARITÉ N'EST PLUS VÉRIFIÉE ICI — c'est le mutant.
				return rendu.designe.every((rang) => TABLES.lieux.has(rang))
			}

			expect(mutantSansArite({ geste: 'G1', designe: ['P1', 'P2'] })).toBe(true)
			// … et la vraie, elle, refuse : l'arité est le SEUL décideur de ce chemin.
			expect(validerInterprete({ geste: 'G1', designe: ['P1', 'P2'] }, TABLES, dossier)).toEqual({
				ok: false,
				motif: 'schema',
			})
		})

		it('mutant 2 — garde < 2 retiree : une clarification passerait sur un seul lieu range', () => {
			const precision = 'Voulez-vous vraiment vous y rendre ?'
			const mutantSansGarde = (): boolean =>
				precision.trim().length > 0 &&
				precision.length <= PRECISION_CARACTERES_MAX &&
				precision.trimEnd().endsWith('?') &&
				!precision.includes(MARQUEUR_A_ECRIRE) &&
				!porteUnIdentifiant(precision, dossier) &&
				!porteUnRang(precision, TABLE_UN_SEUL_LIEU)
			// LA GARDE `rangsLieux.size < 2` N'EST PLUS APPLIQUÉE — c'est le mutant.

			expect(mutantSansGarde()).toBe(true)
			// … et la vraie, elle, refuse : une clarification n'a de sens que si elle
			// départage au moins deux lieux réels.
			expect(validerInterprete({ precision }, TABLE_UN_SEUL_LIEU, dossier)).toEqual({ ok: false, motif: 'schema' })
		})

		it('mutant 3 — scanner de rangs retire : une precision citant P2 serait acceptee', () => {
			const precision = 'Vous parlez du lieu P2, exactement ?'
			const mutantSansScanner = (): boolean =>
				precision.trim().length > 0 &&
				precision.length <= PRECISION_CARACTERES_MAX &&
				precision.trimEnd().endsWith('?') &&
				!precision.includes(MARQUEUR_A_ECRIRE) &&
				!porteUnIdentifiant(precision, dossier) &&
				TABLES.lieux.size >= 2
			// `porteUnRang` N'EST PLUS APPELÉ — c'est le mutant.

			expect(mutantSansScanner()).toBe(true)
			// … et la vraie, elle, refuse : un rang recopié dans une clarification
			// serait exécuté en silence, sans qu'aucun auteur ne l'ait relu.
			expect(validerInterprete({ precision }, TABLES, dossier)).toEqual({ ok: false, motif: 'identifiant' })
		})
	})
})

// ══ LE HUITIÈME RÔLE — `narrateur` (n° 10 `moteur-interprete`, it2 puis it3) ═════

/** LA TABLE D'ANCRES d'un appel — ce que `assemblerNarrateur` rendrait sur le dossier de
 *  référence au foyer, les deux objets rédigés possédés. Les identifiants sont RÉELS : un
 *  fait re-résolu désigne une entité qui existe. */
const ANCRES: ReadonlyMap<string, string> = new Map([
	['A1', 'lieu.foyer-du-guet'],
	['A2', 'objet.sceau-de-cendre'],
	['A3', 'objet.lanterne-de-corvin'],
])
const SANS_CONDENSE = { ancres: ANCRES, condenseDemande: false }
const AVEC_CONDENSE = { ancres: ANCRES, condenseDemande: true }

describe('types — zero cle commune reseau / resolu, huitieme role, et avec les voisins de jeu', () => {
	const CONSTAT: ConstatRendu = { phrase: 'Le sceau est fendu.', ancres: ['A2'] }
	const RESEAU: NarrationRendue = {
		narration: 'Vous avancez.',
		tentatives: ['Fouiller la cendre'],
		constats: [CONSTAT],
		condense: 'Vous avez marché.',
	}
	const FAIT: FaitEtabli = { fait: 'Le sceau est fendu.', sur: ['objet.sceau-de-cendre'] }
	const RESUME: ResumeMemoire = { texte: 'Vous avez marché.', jusqu_au_pas: 10 }
	const RESOLUE: SortieNarrateur = {
		recit: 'Vous avancez.',
		suggestions: ['Fouiller la cendre'],
		faits_etablis: [FAIT],
		resume: RESUME,
	}

	it('NarrationRendue et SortieNarrateur n ont aucune cle en commun — au niveau de la LISTE et de l ELEMENT', () => {
		// KR-231, NIVEAU LISTE : `{narration,tentatives,constats,condense}` ∩
		// `{recit,suggestions,faits_etablis,resume}` = ∅. Les témoins portent TOUTES les clés,
		// les optionnelles comprises — un témoin sans `condense` rendrait l'intersection vide
		// par absence.
		expect(Object.keys(RESEAU).filter((cle) => Object.keys(RESOLUE).includes(cle))).toEqual([])
		expect(Object.keys(RESEAU).sort()).toEqual(['condense', 'constats', 'narration', 'tentatives'])
		expect(Object.keys(RESOLUE).sort()).toEqual(['faits_etablis', 'recit', 'resume', 'suggestions'])
		// KR-231, NIVEAU ÉLÉMENT : `{phrase,ancres}` ∩ `{fait,sur}` = ∅ — et ni l'un ni l'autre
		// ne reprend une clé du résumé stocké.
		const element = [...Object.keys(CONSTAT), ...Object.keys(FAIT), ...Object.keys(RESUME)]
		expect(new Set(element).size).toBe(element.length)
		expect(element.sort()).toEqual(['ancres', 'fait', 'jusqu_au_pas', 'phrase', 'sur', 'texte'])
		// Et le validateur est PILOTÉ par la même liste que la forme réseau, `condense` à part.
		expect([...CLES_SORTIE_NARRATEUR, CLE_CONDENSE].sort()).toEqual(Object.keys(RESEAU).sort())
	})

	it('aucune cle du huitieme role n est prise par l interpreteur, le role plan, le journal ou l attente', () => {
		// LES DEUX RÔLES DE JEU PASSENT PAR LA MÊME ROUTE ET LE MÊME ÉCRAN : une clé
		// commune ferait passer une forme pour l'autre sans que `tsc` ne dise rien. Les
		// TROIS formes réseau de l'interprète, et les TROIS formes résolues, balayées — plus
		// les clés d'une ENTRÉE DE JOURNAL et d'une ATTENTE, où la mémoire vit à côté.
		const interpretationsRendues: InterpretationRendue[] = [
			{ geste: 'G1', designe: ['P1'] },
			{ precision: 'Lequel ?' },
			{ sans_commande: true },
		]
		const sortiesInterprete: SortieInterprete[] = [
			{ lecture: 'commande', commande: { commande: 'agir', cibles: [] } },
			{ lecture: 'clarification', question: 'Lequel ?' },
			{ lecture: 'sans_commande', gestes_possibles: ['agir'] },
		]
		const voisines = new Set([
			...interpretationsRendues.flatMap((forme) => Object.keys(forme)),
			...sortiesInterprete.flatMap((forme) => Object.keys(forme)),
			...CLES_SORTIE_PLAN,
			'tour',
			'role',
			'origine',
			'deltas',
			'type',
			'saisie',
		])
		const narrateur = [...Object.keys(RESEAU), ...Object.keys(RESOLUE), ...Object.keys(CONSTAT), ...Object.keys(FAIT)]

		expect(narrateur.filter((cle) => voisines.has(cle))).toEqual([])
		// Discriminant : l'ensemble balayé n'est pas vide, et il couvre bien les HUIT clés
		// de l'interprète plus celle du rôle plan (KR-199).
		expect(
			[...voisines].filter((cle) => !['tour', 'role', 'origine', 'deltas', 'type', 'saisie'].includes(cle)).sort(),
		).toEqual(
			[
				'commande',
				'designe',
				'geste',
				'gestes_possibles',
				'intention',
				'lecture',
				'precision',
				'question',
				'sans_commande',
			].sort(),
		)
	})

	it('l affectation croisee ne compile pas, et les noms du reseau ne sont pas ceux du stockage', () => {
		// @ts-expect-error — une forme RÉSEAU ne s'assigne pas à une forme RÉSOLUE…
		const croiseA: SortieNarrateur = { narration: 'x', tentatives: [], constats: [] }
		// @ts-expect-error — … ni l'inverse.
		const croiseB: NarrationRendue = { recit: 'x', suggestions: [], faits_etablis: [] }
		// @ts-expect-error — un élément RÉSEAU n'est pas un fait STOCKÉ (KR-236)…
		const faitReseau: FaitEtabli = { phrase: 'x', ancres: ['A1'] }
		// @ts-expect-error — … ni l'inverse.
		const constatStocke: ConstatRendu = { fait: 'x', sur: ['lieu.a'] }
		// @ts-expect-error — `faits_etablis` est REQUIS sur la forme résolue : la liste vide
		// est la réponse honnête, jamais une clé absente.
		const sansFaits: SortieNarrateur = { recit: 'x', suggestions: [] }
		// Discriminant : les formes LÉGALES compilent, elles — `resume` et `condense` absents
		// compris.
		const legales: [NarrationRendue, SortieNarrateur, NarrationRendue, SortieNarrateur] = [
			RESEAU,
			RESOLUE,
			{ narration: 'x', tentatives: [], constats: [] },
			{ recit: 'x', suggestions: [], faits_etablis: [] },
		]

		expect([croiseA, croiseB, faitReseau, constatStocke, sansFaits, ...legales]).toHaveLength(9)
	})
})

describe('validerNarrateur — les treize predicats de forme d it2, inchanges, sur le nouveau schema', () => {
	const dossier = dossierDeReference()
	const NARRATION = 'Vous gravissez le chemin de la tour ; la cendre crisse sous vos pas et le vent retombe.'
	const TENTATIVES = ['Fouiller la cendre', 'Monter vers la vigie', 'Rebrousser chemin']
	/** Un identifiant RÉEL du dossier de référence — c'est l'appartenance qui compte. */
	const IDENTIFIANT = 'objet.sceau-de-cendre'
	/** La sortie d'un appel SANS condensé : la réponse brute + la liste de constats. */
	const valider = (brut: Record<string, unknown>): ReturnType<typeof validerNarrateur> =>
		validerNarrateur({ constats: [], ...brut }, dossier, SANS_CONDENSE)
	const accepte = (narration: string, tentatives: readonly string[]) => ({
		ok: true,
		sortie: { narration, tentatives, constats: [], condense: null },
	})

	it('le nominal rend ok et la MEME forme, sans rien reparer — condense null quand il n est pas demande', () => {
		expect(valider({ narration: NARRATION, tentatives: TENTATIVES })).toEqual(accepte(NARRATION, TENTATIVES))
		// AUCUNE RÉPARATION : les blancs de bord d'une narration et d'une tentative
		// valides traversent tels quels — ni `trim`, ni coupe (KR-230).
		const avecBlancs = { narration: `  ${NARRATION}  `, tentatives: [' Fouiller la cendre '] }
		expect(valider(avecBlancs)).toEqual(accepte(avecBlancs.narration, avecBlancs.tentatives))
	})

	it('la liste VIDE de tentatives est un SUCCES — le recit, lui, est la redaction requise', () => {
		expect(valider({ narration: NARRATION, tentatives: [] })).toEqual(accepte(NARRATION, []))
	})

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], [NARRATION], NARRATION, 42, true]) {
			expect({ brut, ...validerNarrateur(brut, dossier, SANS_CONDENSE) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — les cles valent EXACTEMENT {narration, tentatives, constats} : manquante, en trop ou renommee', () => {
		const cas: Array<Record<string, unknown>> = [
			{ narration: NARRATION, constats: [] },
			{ tentatives: TENTATIVES, constats: [] },
			// `constats` MANQUANTE — l'enveloppe d'it2 n'est plus recevable (KR-236).
			{ narration: NARRATION, tentatives: TENTATIVES },
			{ narration: NARRATION, tentatives: TENTATIVES, constats: [], etablis: [] },
			{ recit: NARRATION, suggestions: TENTATIVES, faits_etablis: [] },
			{ narration: NARRATION, tentatives: TENTATIVES, faits_etablis: [] },
			{},
		]
		for (const brut of cas) {
			expect({ brut, ...validerNarrateur(brut, dossier, SANS_CONDENSE) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('3 — une narration qui n est pas une chaine est refusee, jamais repechee', () => {
		for (const narration of [[NARRATION], 42, null, { texte: NARRATION }]) {
			expect(valider({ narration, tentatives: [] })).toEqual({ ok: false, motif: 'schema' })
		}
	})

	it('4 — une narration vide apres trim est une non-reponse, motif vide', () => {
		for (const narration of ['', '   ', '\n\t ']) {
			expect(valider({ narration, tentatives: [] })).toEqual({ ok: false, motif: 'vide' })
		}
	})

	it('5 — la borne de la narration, a la limite et a la limite plus un (KR-165)', () => {
		const juste = 'x'.repeat(NARRATION_CARACTERES_MAX)
		const trop = 'x'.repeat(NARRATION_CARACTERES_MAX + 1)
		expect(NARRATION_CARACTERES_MAX).toBe(800)
		expect(valider({ narration: juste, tentatives: [] })).toEqual(accepte(juste, []))
		expect(valider({ narration: trop, tentatives: [] })).toEqual({ ok: false, motif: 'schema' })
	})

	it('6 — une narration qui FINIT par une question est refusee ; une question AU MILIEU passe', () => {
		expect(valider({ narration: 'Que faites-vous maintenant ?', tentatives: [] })).toEqual({
			ok: false,
			motif: 'schema',
		})
		// `trimEnd` : un blanc de fin ne déguise pas la question.
		expect(valider({ narration: 'Que faites-vous ?  \n', tentatives: [] })).toEqual({ ok: false, motif: 'schema' })
		// Discriminant : une question qui n'est PAS finale est de la prose légitime.
		const auMilieu = 'Qui a allumé ce feu ? Personne ne le dit, et le beffroi brûle toujours.'
		expect(valider({ narration: auMilieu, tentatives: [] })).toEqual(accepte(auMilieu, []))
	})

	it('7 — les tentatives sont un TABLEAU de CHAINES, sinon schema', () => {
		for (const tentatives of ['Fouiller', null, { a: 'Fouiller' }, ['Fouiller', 3], [['Fouiller']]]) {
			expect({ tentatives, ...valider({ narration: NARRATION, tentatives }) }).toEqual({
				tentatives,
				ok: false,
				motif: 'schema',
			})
		}
	})

	it('8 — trois tentatives passent, une QUATRIEME est un refus du lot, jamais une coupe', () => {
		expect(TENTATIVES_MAX).toBe(3)
		expect(TENTATIVES).toHaveLength(TENTATIVES_MAX)
		expect(valider({ narration: NARRATION, tentatives: TENTATIVES }).ok).toBe(true)
		expect(valider({ narration: NARRATION, tentatives: [...TENTATIVES, 'Attendre'] })).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('9 — une tentative vide apres trim est un remplissage, motif vide, OU QU ELLE SOIT', () => {
		for (const rang of [0, 2]) {
			const tentatives = [...TENTATIVES]
			tentatives[rang] = '   '
			expect(`${rang} → ${JSON.stringify(valider({ narration: NARRATION, tentatives }))}`).toBe(
				`${rang} → ${JSON.stringify({ ok: false, motif: 'vide' })}`,
			)
		}
	})

	it('10 — la borne d une tentative, a la limite et a la limite plus un (KR-165)', () => {
		expect(TENTATIVE_CARACTERES_MAX).toBe(60)
		const juste = 'y'.repeat(TENTATIVE_CARACTERES_MAX)
		expect(valider({ narration: NARRATION, tentatives: [juste] }).ok).toBe(true)
		expect(valider({ narration: NARRATION, tentatives: [`${juste}y`] })).toEqual({ ok: false, motif: 'schema' })
	})

	it('11 — deux tentatives identiques apres trim sont refusees', () => {
		expect(valider({ narration: NARRATION, tentatives: ['Fouiller la cendre', ' Fouiller la cendre '] })).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('12 — le marqueur d amorce, dans la narration OU dans une tentative, motif marqueur', () => {
		expect(valider({ narration: `${MARQUEUR_A_ECRIRE} reste a ecrire.`, tentatives: [] })).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		expect(valider({ narration: NARRATION, tentatives: ['Attendre', `Lire ${MARQUEUR_A_ECRIRE}`] })).toEqual({
			ok: false,
			motif: 'marqueur',
		})
	})

	it('13 — un identifiant du dossier, dans la narration OU dans la DERNIERE tentative, motif identifiant', () => {
		expect(collectIds(dossier).some((collecte) => collecte.id === IDENTIFIANT)).toBe(true)
		expect(valider({ narration: `Le sceau ${IDENTIFIANT} pese dans votre main.`, tentatives: [] })).toEqual({
			ok: false,
			motif: 'identifiant',
		})
		expect(valider({ narration: NARRATION, tentatives: ['Attendre', `Poser ${IDENTIFIANT}`] })).toEqual({
			ok: false,
			motif: 'identifiant',
		})
	})

	it('13 bis — le scan est ELEMENT PAR ELEMENT : deux fragments dans deux cases ne forment pas un identifiant', () => {
		const fragments = ['Examiner cet objet.', 'sceau-de-cendre en tete']
		expect(porteUnIdentifiant(fragments.join(''), dossier)).toBe(true)
		expect(valider({ narration: NARRATION, tentatives: fragments })).toEqual(accepte(NARRATION, fragments))
	})

	it('la forme de mot d un identifiant qui n APPARTIENT pas au dossier passe — l appartenance decide', () => {
		const benin = 'Vous rangez votre objet.favori dans la besace.'
		expect(valider({ narration: benin, tentatives: [] })).toEqual(accepte(benin, []))
	})
})

describe('validerNarrateur — les constats (it3), dans le BLOC ATOMIQUE : tout defaut refuse le lot entier', () => {
	const dossier = dossierDeReference()
	const NARRATION = 'Vous posez le sceau sur la pierre ; une fêlure court sur sa face.'
	const valider = (constats: unknown): ReturnType<typeof validerNarrateur> =>
		validerNarrateur({ narration: NARRATION, tentatives: [], constats }, dossier, SANS_CONDENSE)
	const constat = (phrase: string, ...ancres: string[]): ConstatRendu => ({ phrase, ancres })

	it('le nominal : deux constats a une et deux ancres passent tels quels, et la liste VIDE est un succes', () => {
		const constats = [constat('Le sceau porte une fêlure.', 'A2'), constat('La lanterne éclaire le foyer.', 'A3', 'A1')]
		expect(FAITS_PAR_PAS_MAX).toBe(2)
		expect(valider(constats)).toEqual({
			ok: true,
			sortie: { narration: NARRATION, tentatives: [], constats, condense: null },
		})
		expect(valider([])).toEqual({
			ok: true,
			sortie: { narration: NARRATION, tentatives: [], constats: [], condense: null },
		})
	})

	it('14 — constats qui n est pas un tableau : schema', () => {
		for (const constats of ['Le sceau.', null, { phrase: 'x', ancres: ['A1'] }, 3]) {
			expect({ constats, ...valider(constats) }).toEqual({ constats, ok: false, motif: 'schema' })
		}
	})

	it('15 — deux constats passent, un TROISIEME est un refus du lot, jamais une coupe', () => {
		const deux = [constat('Un.', 'A1'), constat('Deux.', 'A2')]
		expect(valider(deux).ok).toBe(true)
		expect(valider([...deux, constat('Trois.', 'A3')])).toEqual({ ok: false, motif: 'schema' })
	})

	it('16 — un element aux cles autres que EXACTEMENT {phrase, ancres} : schema', () => {
		const cas: unknown[] = [
			[{ phrase: 'x' }],
			[{ ancres: ['A1'] }],
			[{ phrase: 'x', ancres: ['A1'], sur: ['lieu.foyer-du-guet'] }],
			[{ fait: 'x', sur: ['A1'] }],
			['Le sceau.'],
			[null],
		]
		for (const constats of cas) {
			expect({ constats, ...valider(constats) }).toEqual({ constats, ok: false, motif: 'schema' })
		}
	})

	it('17 — une phrase qui n est pas une chaine est schema ; vide apres trim, elle est vide', () => {
		expect(valider([{ phrase: 42, ancres: ['A1'] }])).toEqual({ ok: false, motif: 'schema' })
		expect(valider([{ phrase: ['x'], ancres: ['A1'] }])).toEqual({ ok: false, motif: 'schema' })
		expect(valider([constat('   ', 'A1')])).toEqual({ ok: false, motif: 'vide' })
	})

	it('18 — la borne d une phrase, a la limite et a la limite plus un ; une question finale est refusee', () => {
		expect(FAIT_CARACTERES_MAX).toBe(160)
		const juste = 'z'.repeat(FAIT_CARACTERES_MAX)
		expect(valider([constat(juste, 'A1')]).ok).toBe(true)
		expect(valider([constat(`${juste}z`, 'A1')])).toEqual({ ok: false, motif: 'schema' })
		expect(valider([constat('Le foyer est-il tiède ?', 'A1')])).toEqual({ ok: false, motif: 'schema' })
	})

	it('19 — ancres : [] est REFUSE, et c est le mutant AC#7 n 1 — un fait sans ancre est une creation d entite', () => {
		// MUTANT OBLIGATOIRE M1 (plan § 7) : `ancres: []` accepté. Vérifié ROUGE en
		// relâchant la borne basse, puis rétabli.
		expect(valider([constat('Un fait qui ne porte sur rien.')])).toEqual({ ok: false, motif: 'schema' })
		// Et les autres formes fautives de la liste : pas un tableau, un élément non chaîne,
		// trois ancres, un doublon.
		expect(ANCRES_PAR_FAIT_MAX).toBe(2)
		for (const ancres of ['A1', null, ['A1', 1], ['A1', 'A2', 'A3'], ['A1', 'A1']]) {
			expect({ ancres, ...valider([{ phrase: 'Un fait.', ancres }]) }).toEqual({ ancres, ok: false, motif: 'schema' })
		}
		// Discriminant : UNE et DEUX ancres distinctes passent.
		expect(valider([constat('Un fait.', 'A1')]).ok).toBe(true)
		expect(valider([constat('Un fait.', 'A1', 'A2')]).ok).toBe(true)
	})

	it('20 — un rang HORS TABLE refuse TOUT le lot, motif rang-inconnu : le mutant AC#7 n 2', () => {
		// MUTANT OBLIGATOIRE M2 (plan § 7) : un rang hors table accepté. Vérifié ROUGE en
		// retirant l'appartenance, puis rétabli. `a1` (casse), `P1` (l'espace de rangs de
		// l'interprète) et `A9` (la bonne forme, mais rien ne le porte) tombent tous trois.
		for (const hors of ['A9', 'a1', 'P1', 'G1', 'A0']) {
			expect(`${hors} → ${JSON.stringify(valider([constat('Un fait.', hors)]))}`).toBe(
				`${hors} → ${JSON.stringify({ ok: false, motif: 'rang-inconnu' })}`,
			)
		}
		// Et UN seul rang fautif sur deux suffit : le lot entier tombe, jamais « les bons ».
		expect(valider([constat('Un fait.', 'A1', 'A9')])).toEqual({ ok: false, motif: 'rang-inconnu' })
		expect(valider([constat('Bon.', 'A1'), constat('Mauvais.', 'A9')])).toEqual({ ok: false, motif: 'rang-inconnu' })
	})

	it('21 — deux phrases identiques apres trim sont un remplissage : schema', () => {
		expect(valider([constat('Le sceau est fendu.', 'A2'), constat(' Le sceau est fendu. ', 'A1')])).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('22 — le marqueur, puis un identifiant du dossier, PHRASE PAR PHRASE', () => {
		expect(valider([constat(`${MARQUEUR_A_ECRIRE} a retenir.`, 'A1')])).toEqual({ ok: false, motif: 'marqueur' })
		expect(valider([constat('Bon.', 'A1'), constat('Le objet.sceau-de-cendre est fendu.', 'A2')])).toEqual({
			ok: false,
			motif: 'identifiant',
		})
	})

	it('23 — un REPERE qui fuit dans la prose refuse le lot : narration, tentative OU phrase — le mutant AC#7 n 3', () => {
		// MUTANT OBLIGATOIRE M3 (plan § 7) : « A1 » dans la narration accepté. Les TROIS
		// sites sont éprouvés séparément : un scanner qui n'en couvrirait qu'un resterait
		// vert sur un témoin unique. Vérifié ROUGE site par site, puis rétabli.
		const dansNarration = validerNarrateur(
			{ narration: 'Vous voyez A1 au loin.', tentatives: [], constats: [] },
			dossier,
			SANS_CONDENSE,
		)
		const dansTentative = validerNarrateur(
			{ narration: NARRATION, tentatives: ['Attendre', 'Prendre A2'], constats: [] },
			dossier,
			SANS_CONDENSE,
		)
		const dansPhrase = valider([constat('A3 éclaire le foyer.', 'A3')])
		expect([dansNarration, dansTentative, dansPhrase]).toEqual([
			{ ok: false, motif: 'identifiant' },
			{ ok: false, motif: 'identifiant' },
			{ ok: false, motif: 'identifiant' },
		])
		// L'APPARTENANCE DÉCIDE : « A7 » n'est le repère de RIEN dans cette table, et une prose
		// qui le porte passe — le scanner n'est pas une silhouette (KR-235).
		expect(porteUneAncre('Au poste A7, rien.', ANCRES)).toBe(false)
		expect(porteUneAncre('Au poste A1, rien.', ANCRES)).toBe(true)
		expect(porteUneAncre('La salle AA1 et le mot A1b.', ANCRES)).toBe(false)
		expect(
			validerNarrateur(
				{ narration: 'Au poste A7, rien ne bouge.', tentatives: [], constats: [] },
				dossier,
				SANS_CONDENSE,
			).ok,
		).toBe(true)
	})

	it('M9 — un constat INVALIDE avec un recit VALIDE : le recit n est PAS garde, le lot entier tombe', () => {
		// MUTANT OBLIGATOIRE M9 (plan § 7) : découpler les constats comme le condensé — le
		// joueur lirait un récit dont les faits durables ne sont pas retenus, et une ancre
		// inventée n'invaliderait plus son récit. Vérifié ROUGE, puis rétabli.
		const issue = valider([constat('Un fait sans repère valide.', 'A9')])
		expect(issue).toEqual({ ok: false, motif: 'rang-inconnu' })
		expect('sortie' in issue).toBe(false)
		// Discriminant : le MÊME récit, avec un constat valide, passe.
		expect(valider([constat('Un fait.', 'A1')]).ok).toBe(true)
	})
})

describe('validerNarrateur — la garde a DEUX niveaux : condense est decouple du lot (KR-271)', () => {
	const dossier = dossierDeReference()
	const NARRATION = 'Vous reprenez la route ; derrière vous, le foyer n’est plus qu’une lueur.'
	const CONDENSE = 'Vous avez veillé au foyer, puis vous avez gravi la tour et vu le feu du guet.'
	const base = {
		narration: NARRATION,
		tentatives: ['Attendre'],
		constats: [{ phrase: 'Le foyer fume.', ancres: ['A1'] }],
	}

	it('condense demande et valide : le lot passe, et son issue est ok avec le texte TEL QUEL', () => {
		expect(validerNarrateur({ ...base, condense: CONDENSE }, dossier, AVEC_CONDENSE)).toEqual({
			ok: true,
			sortie: { ...base, condense: { ok: true, texte: CONDENSE } },
		})
	})

	it('M4 — condense demande mais ABSENT : le lot passe, le recit est la, seule l issue du condense echoue', () => {
		// MUTANT OBLIGATOIRE M4 (plan § 7) : un condensé absent ou invalide qui refuse le LOT.
		// Vérifié ROUGE — le récit disparaîtrait —, puis rétabli.
		const issue = validerNarrateur(base, dossier, AVEC_CONDENSE)
		expect(issue).toEqual({ ok: true, sortie: { ...base, condense: { ok: false, motif: 'schema' } } })
	})

	it('M4 — CHAQUE condense invalide laisse le lot passer, et nomme son motif SANS le remonter', () => {
		const juste = 'w'.repeat(CONDENSE_CARACTERES_MAX)
		expect(CONDENSE_CARACTERES_MAX).toBe(1200)
		const cas: Array<[unknown, string]> = [
			[42, 'schema'],
			[['x'], 'schema'],
			[null, 'schema'],
			['   ', 'vide'],
			[`${juste}w`, 'schema'],
			['Que vous reste-t-il ?', 'schema'],
			[`${MARQUEUR_A_ECRIRE} a condenser.`, 'marqueur'],
			['Vous avez pris objet.sceau-de-cendre.', 'identifiant'],
			['Vous avez quitté A1 au matin.', 'identifiant'],
		]
		for (const [condense, motif] of cas) {
			const issue = validerNarrateur({ ...base, condense }, dossier, AVEC_CONDENSE)
			expect(`${JSON.stringify(condense).slice(0, 30)} → ${JSON.stringify(issue)}`).toBe(
				`${JSON.stringify(condense).slice(0, 30)} → ${JSON.stringify({ ok: true, sortie: { ...base, condense: { ok: false, motif } } })}`,
			)
		}
		// Discriminant de la borne : EXACTEMENT `CONDENSE_CARACTERES_MAX` passe.
		expect(validerNarrateur({ ...base, condense: juste }, dossier, AVEC_CONDENSE)).toEqual({
			ok: true,
			sortie: { ...base, condense: { ok: true, texte: juste } },
		})
	})

	it('M7 — condense present alors qu il n etait PAS demande : refus du LOT, signal de derive KR-236', () => {
		// MUTANT OBLIGATOIRE M7 (plan § 7) : un condensé non demandé accepté. Vérifié ROUGE,
		// puis rétabli. VALIDE OU NON, sa seule présence est la dérive d'une invite.
		expect(validerNarrateur({ ...base, condense: CONDENSE }, dossier, SANS_CONDENSE)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Discriminant : sans la clé, le même lot passe.
		expect(validerNarrateur(base, dossier, SANS_CONDENSE).ok).toBe(true)
	})

	it('condense demande : une AUTRE cle en trop reste un refus du lot — la tolerance ne vaut que pour condense', () => {
		expect(validerNarrateur({ ...base, condense: CONDENSE, resume: CONDENSE }, dossier, AVEC_CONDENSE)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerNarrateur({ ...base, resume: CONDENSE }, dossier, AVEC_CONDENSE)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('l ORDRE : le bloc atomique d abord — un condense VALIDE ne rachete jamais un recit ou un constat fautif', () => {
		// Le condensé n'est évalué QU'APRÈS le bloc atomique : un récit vide rend `vide`, un
		// rang hors table rend `rang-inconnu`, quel que soit le condensé.
		expect(validerNarrateur({ ...base, narration: '  ', condense: CONDENSE }, dossier, AVEC_CONDENSE)).toEqual({
			ok: false,
			motif: 'vide',
		})
		expect(
			validerNarrateur(
				{ ...base, constats: [{ phrase: 'Un fait.', ancres: ['A9'] }], condense: CONDENSE },
				dossier,
				AVEC_CONDENSE,
			),
		).toEqual({ ok: false, motif: 'rang-inconnu' })
		// Et un condensé fautif ne change pas le motif du lot fautif : c'est le BLOC qui parle.
		expect(validerNarrateur({ ...base, narration: '  ', condense: 42 }, dossier, AVEC_CONDENSE)).toEqual({
			ok: false,
			motif: 'vide',
		})
	})
})

describe('validerCondense — les sept predicats du condense, chacun seul', () => {
	const dossier = dossierDeReference()
	const CONDENSE = 'Vous avez veillé au foyer, puis vous avez gravi la tour et vu le feu du guet.'

	it('le nominal rend le texte TEL QUEL, blancs de bord compris — aucune reparation', () => {
		expect(validerCondense(CONDENSE, dossier, ANCRES)).toEqual({ ok: true, texte: CONDENSE })
		expect(validerCondense(`  ${CONDENSE} `, dossier, ANCRES)).toEqual({ ok: true, texte: `  ${CONDENSE} ` })
	})

	it('C1 a C7, dans l ordre, chacun avec son motif', () => {
		const juste = 'v'.repeat(CONDENSE_CARACTERES_MAX)
		expect(validerCondense(undefined, dossier, ANCRES)).toEqual({ ok: false, motif: 'schema' })
		expect(validerCondense({ texte: CONDENSE }, dossier, ANCRES)).toEqual({ ok: false, motif: 'schema' })
		expect(validerCondense('\n \t', dossier, ANCRES)).toEqual({ ok: false, motif: 'vide' })
		expect(validerCondense(juste, dossier, ANCRES)).toEqual({ ok: true, texte: juste })
		expect(validerCondense(`${juste}v`, dossier, ANCRES)).toEqual({ ok: false, motif: 'schema' })
		expect(validerCondense('Et ensuite ?  ', dossier, ANCRES)).toEqual({ ok: false, motif: 'schema' })
		expect(validerCondense(`Vous avez lu ${MARQUEUR_A_ECRIRE}.`, dossier, ANCRES)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		expect(validerCondense('Vous avez pris objet.lanterne-de-corvin.', dossier, ANCRES)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
		expect(validerCondense('Vous avez posé A2 sur la table.', dossier, ANCRES)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
		// Discriminants : une question AU MILIEU passe, et un repère hors table aussi.
		expect(validerCondense('Qui veillait ? Personne, et vous êtes parti.', dossier, ANCRES).ok).toBe(true)
		expect(validerCondense('Vous avez longé le poste A7.', dossier, ANCRES).ok).toBe(true)
	})
})

describe('validerArbitre — le neuvieme role, deux formes disjointes (n 11 moteur-arbitre, it2, § 4 bis du plan)', () => {
	const dossier = dossierDeReference()
	/** Un identifiant RÉEL du dossier de référence — c'est l'appartenance qui compte. */
	const IDENTIFIANT = 'objet.sceau-de-cendre'
	const ENJEU_REUSSITE = 'forcer la porte sans bruit'
	const ENJEU_ECHEC = 'alerter ce qui veille derriere'
	const epreuve = (carac: unknown, tc: unknown, reussite: unknown, echec: unknown): Record<string, unknown> => ({
		epreuve: { carac, tc, enjeu_reussite: reussite, enjeu_echec: echec },
	})
	const CONFORME = epreuve('FO', 'TC2', ENJEU_REUSSITE, ENJEU_ECHEC)
	const PROPOSITION_CONFORME = {
		ok: true,
		sortie: { epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC } },
	}

	it('le nominal epreuve rend ok et la forme RESOLUE, carac/tc narrowed au type ferme', () => {
		expect(validerArbitre(CONFORME, dossier)).toEqual(PROPOSITION_CONFORME)
	})

	it('le nominal sans_epreuve est ACCEPTE SANS REJEU — la liste vide d epreuve n existe pas pour ce role', () => {
		expect(validerArbitre({ sans_epreuve: true }, dossier)).toEqual({ ok: true, sortie: { sans_epreuve: true } })
	})

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], [CONFORME], 'epreuve', 42, true]) {
			expect({ brut, ...validerArbitre(brut, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — exactement une clé, sans_epreuve OU epreuve : manquante, en trop, ou renommee (jet/sans_jet du cadrage)', () => {
		const cas: Array<Record<string, unknown>> = [
			{},
			{ ...CONFORME, pourquoi: 'un echo interdit' },
			// ⚠ LE WRAPPER DU CADRAGE (`jet`/`sans_jet`) EST REFUSÉ : homonyme
			// d'`EntreeJournal.jet`, fermé au § 8 #3 du plan it2.
			{ jet: CONFORME.epreuve },
			{ sans_jet: true },
			{ sans_epreuve: true, epreuve: CONFORME.epreuve },
		]
		for (const brut of cas) {
			expect({ brut, ...validerArbitre(brut, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('sans_epreuve doit valoir EXACTEMENT true, jamais repeche', () => {
		for (const valeur of [false, 'true', 1, null]) {
			expect(validerArbitre({ sans_epreuve: valeur }, dossier)).toEqual({ ok: false, motif: 'schema' })
		}
	})

	it('3 — epreuve porte EXACTEMENT ses QUATRE cles : manquante ou en trop', () => {
		const cas: Array<Record<string, unknown>> = [
			{ epreuve: { tc: 'TC2', enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC } },
			{ epreuve: { carac: 'FO', enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC } },
			{ epreuve: { carac: 'FO', tc: 'TC2', enjeu_echec: ENJEU_ECHEC } },
			{ epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: ENJEU_REUSSITE } },
			{ epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC, pourquoi: 'x' } },
			{ epreuve: [] },
			{ epreuve: null },
		]
		for (const brut of cas) {
			expect({ brut, ...validerArbitre(brut, dossier) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('4 et 5 — carac/tc sont CONSTATES par appartenance aux deux registres fermes, jamais repeches', () => {
		expect(validerArbitre(epreuve('ZZ', 'TC2', ENJEU_REUSSITE, ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerArbitre(epreuve('fo', 'TC2', ENJEU_REUSSITE, ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerArbitre(epreuve('FO', 'TC5', ENJEU_REUSSITE, ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerArbitre(epreuve(1, 'TC2', ENJEU_REUSSITE, ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Discriminant : les HUIT caractéristiques et les QUATRE tiers passent tous.
		for (const carac of ['FO', 'AG', 'DX', 'EN', 'IN', 'IG', 'SE', 'CA']) {
			expect(validerArbitre(epreuve(carac, 'TC1', ENJEU_REUSSITE, ENJEU_ECHEC), dossier).ok).toBe(true)
		}
		for (const tc of ['TC1', 'TC2', 'TC3', 'TC4']) {
			expect(validerArbitre(epreuve('FO', tc, ENJEU_REUSSITE, ENJEU_ECHEC), dossier).ok).toBe(true)
		}
	})

	it('6 — enjeu_reussite/enjeu_echec doivent etre des CHAINES, jamais repechees', () => {
		for (const prose of [[ENJEU_REUSSITE], 42, null, { texte: ENJEU_REUSSITE }]) {
			expect(validerArbitre(epreuve('FO', 'TC2', prose, ENJEU_ECHEC), dossier)).toEqual({ ok: false, motif: 'schema' })
			expect(validerArbitre(epreuve('FO', 'TC2', ENJEU_REUSSITE, prose), dossier)).toEqual({
				ok: false,
				motif: 'schema',
			})
		}
	})

	it('7 — chaque prose non vide apres trim, motif vide', () => {
		for (const vide of ['', '   ', '\n\t ']) {
			expect(validerArbitre(epreuve('FO', 'TC2', vide, ENJEU_ECHEC), dossier)).toEqual({ ok: false, motif: 'vide' })
			expect(validerArbitre(epreuve('FO', 'TC2', ENJEU_REUSSITE, vide), dossier)).toEqual({
				ok: false,
				motif: 'vide',
			})
		}
	})

	it('8 — chaque prose SANS saut de ligne, SOUS ENJEU_CARACTERES_MAX', () => {
		expect(ENJEU_CARACTERES_MAX).toBe(80)
		const juste = 'v'.repeat(ENJEU_CARACTERES_MAX)
		expect(validerArbitre(epreuve('FO', 'TC2', juste, ENJEU_ECHEC), dossier).ok).toBe(true)
		expect(validerArbitre(epreuve('FO', 'TC2', `${juste}v`, ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerArbitre(epreuve('FO', 'TC2', 'une ligne\nqui casse le bloc', ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('9 — enjeu_reussite et enjeu_echec DOIVENT DIFFERER apres trim : un jet aux deux issues egales ne decide rien', () => {
		expect(validerArbitre(epreuve('FO', 'TC2', 'repérer le passage', 'repérer le passage'), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerArbitre(epreuve('FO', 'TC2', '  repérer le passage  ', 'repérer le passage'), dossier)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('10 — aucun MARQUEUR_A_ECRIRE, sur les DEUX proses', () => {
		expect(validerArbitre(epreuve('FO', 'TC2', `${MARQUEUR_A_ECRIRE}`, ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
		expect(validerArbitre(epreuve('FO', 'TC2', ENJEU_REUSSITE, `${MARQUEUR_A_ECRIRE}`), dossier)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
	})

	it('11 — aucun identifiant du dossier, sur les DEUX proses', () => {
		expect(validerArbitre(epreuve('FO', 'TC2', `prendre ${IDENTIFIANT}`, ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
		expect(validerArbitre(epreuve('FO', 'TC2', ENJEU_REUSSITE, `perdre ${IDENTIFIANT}`), dossier)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
	})

	it('11 bis — aucun chiffre, sous quelque forme, sur les DEUX proses — REGLES §2 reserve le seuil au moteur', () => {
		expect(validerArbitre(epreuve('FO', 'TC2', 'tenir 7 secondes', ENJEU_ECHEC), dossier)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
		expect(validerArbitre(epreuve('FO', 'TC2', ENJEU_REUSSITE, 'perdre 2 points'), dossier)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
	})

	it('REFUS DU LOT ENTIER : une seule prose fautive refuse les DEUX, jamais un repechage partiel (KR-230)', () => {
		// `enjeu_reussite` est SAINE, `enjeu_echec` seule porte le défaut — la sortie
		// entière est refusée, jamais amputée d'une seule moitié.
		const resultat = validerArbitre(epreuve('FO', 'TC2', ENJEU_REUSSITE, `${MARQUEUR_A_ECRIRE}`), dossier)
		expect(resultat.ok).toBe(false)
		expect('sortie' in resultat).toBe(false)
	})

	it('GABARIT_SORTIE (RoleCopilote) ne porte PAS arbitre — ce role n est pas de la famille auteur', () => {
		// `arbitre` est un rôle de JEU, hors `RoleCopilote` — précédent `interprete`/
		// `narrateur` : son gabarit vit SEULEMENT dans `worker/index.ts`, jamais ici.
		expect(Object.prototype.hasOwnProperty.call(GABARIT_SORTIE, 'arbitre')).toBe(false)
	})
})

// ══ LE DIXIÈME RÔLE — `acteur` (n° 12 `moteur-acteurs`, it1 puis it2, lot `contrat`) ══

/**
 * `validerActeur` — TREIZE prédicats depuis l'it3 (§ 4 bis du plan it3). `replique`
 * (1-8) est INCHANGÉE depuis l'it1 — un scalaire sans re-résolution. `indices_reveles`
 * (9-12) est le patron « catalogue borné » (KR-287) depuis l'it2, rendu par
 * `SortieActeurBrute` (rangs BRUTS), jamais `ReponseActeur` (identifiants) — cette
 * re-résolution-là vit dans `CopiloteService.demanderActeur`, hors de ce fichier.
 * `delta_confiance` (13) est NEUF (it3, `docs/REGLES-DU-JEU.md` § 6).
 */
describe('validerActeur — le dixieme role, treize predicats (§ 4 bis du plan it3)', () => {
	const dossier = dossierDeReference()
	const REPLIQUE = "L'enclume ne chôme jamais, même quand le ciel s'assombrit."
	const RANG = 'S1'
	const rangsOuverts = new Set([RANG])
	const vide = (champs: Record<string, unknown> = {}): Record<string, unknown> => ({
		replique: REPLIQUE,
		indices_reveles: [],
		delta_confiance: 0,
		...champs,
	})

	it('le nominal (liste vide) rend ok et la forme RESOLUE est SortieActeurBrute, zero re-resolution', () => {
		expect(validerActeur(vide(), dossier, rangsOuverts)).toEqual({
			ok: true,
			sortie: { replique: REPLIQUE, indices_reveles: [], delta_confiance: 0 },
		})
	})

	it('le nominal (un rang OUVERT) rend ok, le rang BRUT est rendu TEL QUEL', () => {
		expect(validerActeur(vide({ indices_reveles: [RANG] }), dossier, rangsOuverts)).toEqual({
			ok: true,
			sortie: { replique: REPLIQUE, indices_reveles: [RANG], delta_confiance: 0 },
		})
	})

	it('1 — ce qui n est pas un objet JSON est refuse, motif schema', () => {
		for (const brut of [null, undefined, [], [{ replique: REPLIQUE }], REPLIQUE, 42, true]) {
			expect({ brut, ...validerActeur(brut, dossier, rangsOuverts) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('2 — les cles valent EXACTEMENT CLES_SORTIE_ACTEUR : indices_reveles et delta_confiance TOUJOURS dues', () => {
		expect(CLES_SORTIE_ACTEUR).toEqual(['replique', 'indices_reveles', 'delta_confiance'])
		const cas: Array<Record<string, unknown>> = [
			{},
			{ replique: REPLIQUE }, // indices_reveles et delta_confiance ABSENTES
			{ indices_reveles: [] }, // replique et delta_confiance ABSENTES
			{ replique: REPLIQUE, indices_reveles: [] }, // delta_confiance ABSENTE — refus, jamais 0 implicite
			{ replique: REPLIQUE, indices_reveles: [], delta_confiance: 0, ton: 'x' }, // clé EN TROP
			{ texte: REPLIQUE, indices_reveles: [], delta_confiance: 0 },
		]
		for (const brut of cas) {
			expect({ brut, ...validerActeur(brut, dossier, rangsOuverts) }).toEqual({ brut, ok: false, motif: 'schema' })
		}
	})

	it('3 — replique porte une CHAINE, jamais repechee', () => {
		for (const brut of [
			vide({ replique: 42 }),
			vide({ replique: null }),
			vide({ replique: [REPLIQUE] }),
			vide({ replique: { texte: REPLIQUE } }),
		]) {
			expect(validerActeur(brut, dossier, rangsOuverts)).toEqual({ ok: false, motif: 'schema' })
		}
	})

	it('4 — non vide apres trim, motif vide', () => {
		for (const blanc of ['', '   ', '\n\t ']) {
			expect(validerActeur(vide({ replique: blanc }), dossier, rangsOuverts)).toEqual({ ok: false, motif: 'vide' })
		}
	})

	it('5 — la BORNE DE SORTIE, REPLIQUE_CARACTERES_MAX : un refus, jamais une coupe (KR-230)', () => {
		expect(REPLIQUE_CARACTERES_MAX).toBe(400)
		const juste = 'v'.repeat(REPLIQUE_CARACTERES_MAX)
		expect(validerActeur(vide({ replique: juste }), dossier, rangsOuverts)).toEqual({
			ok: true,
			sortie: { replique: juste, indices_reveles: [], delta_confiance: 0 },
		})
		expect(validerActeur(vide({ replique: `${juste}v` }), dossier, rangsOuverts)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('6 — aucun MARQUEUR_A_ECRIRE', () => {
		expect(validerActeur(vide({ replique: `${MARQUEUR_A_ECRIRE} vraiment ?` }), dossier, rangsOuverts)).toEqual({
			ok: false,
			motif: 'marqueur',
		})
	})

	it('7 — aucun identifiant du dossier', () => {
		expect(validerActeur(vide({ replique: 'Prenez le objet.sceau-de-cendre, vite.' }), dossier, rangsOuverts)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
	})

	it('8 — aucun chiffre, sous quelque forme — une replique ne profere jamais de mecanique', () => {
		expect(validerActeur(vide({ replique: 'Revenez dans 7 jours.' }), dossier, rangsOuverts)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
		expect(validerActeur(vide({ replique: 'Tentez un TC2, si vous l osez.' }), dossier, rangsOuverts)).toEqual({
			ok: false,
			motif: 'identifiant',
		})
	})

	it('9 — indices_reveles est un TABLEAU, jamais une chaine ou un objet', () => {
		for (const brut of [vide({ indices_reveles: RANG }), vide({ indices_reveles: { 0: RANG } })]) {
			expect(validerActeur(brut, dossier, rangsOuverts)).toEqual({ ok: false, motif: 'schema' })
		}
	})

	it('10 — chaque element est une CHAINE, un NOMBRE meurt ici, jamais String(…)', () => {
		expect(validerActeur(vide({ indices_reveles: [1] }), dossier, rangsOuverts)).toEqual({ ok: false, motif: 'schema' })
	})

	it('11 — longueur <= REVELATIONS_PAR_REPLIQUE_MAX (=1) : un REFUS, jamais une troncature (KR-230)', () => {
		expect(REVELATIONS_PAR_REPLIQUE_MAX).toBe(1)
		expect(validerActeur(vide({ indices_reveles: [RANG, RANG] }), dossier, new Set([RANG]))).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('12 — chaque element DOIT appartenir a rangsOuverts, sinon rang-inconnu, REFUS ATOMIQUE (replique comprise)', () => {
		expect(validerActeur(vide({ indices_reveles: ['S9'] }), dossier, rangsOuverts)).toEqual({
			ok: false,
			motif: 'rang-inconnu',
		})
		// Discriminant : le MEME rang, dans un ensemble QUI LE CONTIENT, passe.
		expect(validerActeur(vide({ indices_reveles: [RANG] }), dossier, new Set([RANG, 'S2']))).toEqual({
			ok: true,
			sortie: { replique: REPLIQUE, indices_reveles: [RANG], delta_confiance: 0 },
		})
		// Un ensemble OUVERT VIDE refuse TOUT rang non-vide.
		expect(validerActeur(vide({ indices_reveles: [RANG] }), dossier, new Set())).toEqual({
			ok: false,
			motif: 'rang-inconnu',
		})
	})

	it('13 — delta_confiance appartient a DELTAS_CONFIANCE_VALIDES ; toute autre valeur/type refuse TOUTE la sortie (replique comprise)', () => {
		expect(DELTAS_CONFIANCE_VALIDES).toEqual([-1, 0, 1])
		for (const fautif of [2, -2, 0.5, '1', true, null]) {
			expect(validerActeur(vide({ delta_confiance: fautif }), dossier, rangsOuverts)).toEqual({
				ok: false,
				motif: 'schema',
			})
		}
		// Absente : deja un refus par le predicat (2) — EXACTEMENT les trois cles.
		const sansDelta: Record<string, unknown> = { replique: REPLIQUE, indices_reveles: [] }
		expect(validerActeur(sansDelta, dossier, rangsOuverts)).toEqual({ ok: false, motif: 'schema' })
	})

	it('13 — les TROIS valeurs legales passent et sont rendues TELLES QUELLES, aucun ecretement', () => {
		for (const legal of [-1, 0, 1] as const) {
			expect(validerActeur(vide({ delta_confiance: legal }), dossier, rangsOuverts)).toEqual({
				ok: true,
				sortie: { replique: REPLIQUE, indices_reveles: [], delta_confiance: legal },
			})
		}
	})

	it('GABARIT_SORTIE (RoleCopilote) ne porte PAS acteur — ce role n est pas de la famille auteur', () => {
		expect(Object.prototype.hasOwnProperty.call(GABARIT_SORTIE, 'acteur')).toBe(false)
	})
})

/**
 * `validerActeur` — LA FORME B `resiste` ET LE RANG DÛ (n° 12 `moteur-acteurs`, it4,
 * lot `contrat` — `docs/REGLES-DU-JEU.md` § 6, « La porte `jet` »). Les TREIZE prédicats de
 * la forme A sont INCHANGÉS (le describe précédent les épingle un à un, sans option) ;
 * ce describe prouve ce que l'it4 AJOUTE : la forme B, disjointe, légale sous
 * `resistePermise` seulement, dont les enjeux passent par `validerEnjeux` (partagée avec
 * `validerArbitre`, KR-013) ; et le quatorzième prédicat, le rang dû.
 */
describe('validerActeur — la forme B resiste et le rang du (it4, KR-287/KR-283)', () => {
	const dossier = dossierDeReference()
	const IDENTIFIANT = 'objet.sceau-de-cendre'
	const ENJEU_REUSSITE = 'baisser enfin la garde'
	const ENJEU_ECHEC = 'se refermer davantage'
	const PERMIS = { resistePermise: true } as const
	const resiste = (reussite: unknown = ENJEU_REUSSITE, echec: unknown = ENJEU_ECHEC): Record<string, unknown> => ({
		resiste: { enjeu_reussite: reussite, enjeu_echec: echec },
	})
	const repliqueA = (champs: Record<string, unknown> = {}): Record<string, unknown> => ({
		replique: "L'enclume ne chôme jamais, même quand le ciel s'assombrit.",
		indices_reveles: [],
		delta_confiance: 0,
		...champs,
	})
	const rangsOuverts = new Set(['S1', 'S2'])

	it('les cles de la forme B sont DISJOINTES de celles de la forme A, et epinglees : resiste, puis enjeu_reussite/enjeu_echec', () => {
		expect(CLES_SORTIE_RESISTE).toEqual(['resiste'])
		expect(CLES_ENJEUX).toEqual(['enjeu_reussite', 'enjeu_echec'])
		expect(CLES_SORTIE_ACTEUR.filter((cle) => (CLES_SORTIE_RESISTE as readonly string[]).includes(cle))).toEqual([])
	})

	it('7 — accepte resiste quand resistePermise est true, et rend les DEUX enjeux TELS QUELS (KR-287)', () => {
		expect(validerActeur(resiste(), dossier, new Set(), PERMIS)).toEqual({
			ok: true,
			sortie: { resiste: { enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC } },
		})
		// Aucune re-ecriture : ni trim, ni majuscule — le texte du modele est le texte de la carte.
		const brut = resiste('  baisser la garde  ', 'se fermer.')
		expect(validerActeur(brut, dossier, new Set(), PERMIS)).toEqual({
			ok: true,
			sortie: { resiste: { enjeu_reussite: '  baisser la garde  ', enjeu_echec: 'se fermer.' } },
		})
	})

	it('8 — rejette resiste quand resistePermise est false, absent, ou que les options manquent : opt-in, jamais par defaut', () => {
		const attendu = { ok: false, motif: 'schema' }
		expect(validerActeur(resiste(), dossier, new Set(), { resistePermise: false })).toEqual(attendu)
		expect(validerActeur(resiste(), dossier, new Set(), {})).toEqual(attendu)
		expect(validerActeur(resiste(), dossier, new Set())).toEqual(attendu)
		expect(validerActeur(resiste(), dossier, new Set(), { resistePermise: undefined })).toEqual(attendu)
		// Discriminant : le MEME littéral, une fois la permission donnée, passe.
		expect(validerActeur(resiste(), dossier, new Set(), PERMIS).ok).toBe(true)
	})

	it('AC#6 — apres un jet (rangDu pose, resistePermise absent), resiste est refuse schema : la chaine R4 → jet → R4 → jet est fermee', () => {
		expect(validerActeur(resiste(), dossier, rangsOuverts, { rangDu: 'S1' })).toEqual({ ok: false, motif: 'schema' })
	})

	it('resiste est une forme DISJOINTE : melee a une cle de la forme A, ou accompagnee de quoi que ce soit, elle est refusee', () => {
		const cas: Array<Record<string, unknown>> = [
			{ ...resiste(), replique: 'Entrez.' },
			{ ...resiste(), indices_reveles: [] },
			{ ...resiste(), delta_confiance: 0 },
			{ ...resiste(), ton: 'froid' },
			{ ...repliqueA(), ...resiste() },
		]
		for (const brut of cas) {
			expect({ brut, ...validerActeur(brut, dossier, rangsOuverts, PERMIS) }).toEqual({
				brut,
				ok: false,
				motif: 'schema',
			})
		}
	})

	it('le contenu de resiste est un objet portant EXACTEMENT enjeu_reussite et enjeu_echec : jamais carac, tc, ni un savoir designe', () => {
		const cas: Array<Record<string, unknown>> = [
			{ resiste: null },
			{ resiste: [] },
			{ resiste: [ENJEU_REUSSITE, ENJEU_ECHEC] },
			{ resiste: 'baisser la garde' },
			{ resiste: {} },
			{ resiste: { enjeu_reussite: ENJEU_REUSSITE } },
			{ resiste: { enjeu_echec: ENJEU_ECHEC } },
			{ resiste: { enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC, carac: 'CA' } },
			{ resiste: { enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC, tc: 'TC1' } },
			{ resiste: { enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC, rang: 'S1' } },
			{ resiste: { enjeu: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC } },
		]
		for (const brut of cas) {
			expect({ brut, ...validerActeur(brut, dossier, rangsOuverts, PERMIS) }).toEqual({
				brut,
				ok: false,
				motif: 'schema',
			})
		}
	})

	it('9 — chaque enjeu : chaine, non vide, sans saut de ligne, <= ENJEU_CARACTERES_MAX, et JAMAIS repeche', () => {
		expect(ENJEU_CARACTERES_MAX).toBe(80)
		const juste = 'v'.repeat(ENJEU_CARACTERES_MAX)
		// LIMITE ET LIMITE + 1, sur CHACUN des deux enjeux.
		expect(validerActeur(resiste(juste, ENJEU_ECHEC), dossier, new Set(), PERMIS).ok).toBe(true)
		expect(validerActeur(resiste(ENJEU_REUSSITE, juste), dossier, new Set(), PERMIS).ok).toBe(true)
		expect(validerActeur(resiste(`${juste}v`, ENJEU_ECHEC), dossier, new Set(), PERMIS)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerActeur(resiste(ENJEU_REUSSITE, `${juste}v`), dossier, new Set(), PERMIS)).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Un saut de ligne, un tableau, un nombre, null.
		for (const fautif of ['une ligne\nqui casse', [ENJEU_REUSSITE], 42, null]) {
			expect(validerActeur(resiste(fautif, ENJEU_ECHEC), dossier, new Set(), PERMIS)).toEqual({
				ok: false,
				motif: 'schema',
			})
			expect(validerActeur(resiste(ENJEU_REUSSITE, fautif), dossier, new Set(), PERMIS)).toEqual({
				ok: false,
				motif: 'schema',
			})
		}
		// Vides apres trim : motif `vide`, jamais `schema`.
		for (const vide of ['', '   ', '\n\t ']) {
			expect(validerActeur(resiste(vide, ENJEU_ECHEC), dossier, new Set(), PERMIS)).toEqual({
				ok: false,
				motif: 'vide',
			})
			expect(validerActeur(resiste(ENJEU_REUSSITE, vide), dossier, new Set(), PERMIS)).toEqual({
				ok: false,
				motif: 'vide',
			})
		}
	})

	it('9 — les deux enjeux doivent DIFFERER apres trim : une carte aux deux issues egales ne decide rien', () => {
		expect(validerActeur(resiste('tenir bon', 'tenir bon'), dossier, new Set(), PERMIS)).toEqual({
			ok: false,
			motif: 'schema',
		})
		expect(validerActeur(resiste('  tenir bon  ', 'tenir bon'), dossier, new Set(), PERMIS)).toEqual({
			ok: false,
			motif: 'schema',
		})
	})

	it('9 — aucun marqueur d amorce, aucun identifiant du dossier, aucun chiffre : sur les DEUX enjeux, REFUS DU LOT ENTIER', () => {
		for (const [reussite, echec, motif] of [
			[MARQUEUR_A_ECRIRE, ENJEU_ECHEC, 'marqueur'],
			[ENJEU_REUSSITE, `${MARQUEUR_A_ECRIRE} a ecrire`, 'marqueur'],
			[`prendre ${IDENTIFIANT}`, ENJEU_ECHEC, 'identifiant'],
			[ENJEU_REUSSITE, `perdre ${IDENTIFIANT}`, 'identifiant'],
			['tenir 7 secondes', ENJEU_ECHEC, 'identifiant'],
			[ENJEU_REUSSITE, 'perdre 2 points', 'identifiant'],
			['viser un TC2', ENJEU_ECHEC, 'identifiant'],
		] as const) {
			const resultat = validerActeur(resiste(reussite, echec), dossier, new Set(), PERMIS)
			expect({ reussite, echec, ...resultat }).toEqual({ reussite, echec, ok: false, motif })
			expect('sortie' in resultat).toBe(false)
		}
	})

	it('14 (KR-013) — validerEnjeux est PARTAGEE : validerArbitre et validerActeur rendent le MEME motif pour les memes enjeux', () => {
		const juste = 'v'.repeat(ENJEU_CARACTERES_MAX)
		const cas: ReadonlyArray<readonly [unknown, unknown]> = [
			[ENJEU_REUSSITE, ENJEU_ECHEC], // conforme
			[juste, ENJEU_ECHEC], // a la limite
			[`${juste}v`, ENJEU_ECHEC], // limite + 1
			['', ENJEU_ECHEC], // vide
			[ENJEU_REUSSITE, '   '],
			['tenir bon', 'tenir bon'], // identiques
			['une\nligne', ENJEU_ECHEC], // saut de ligne
			[42, ENJEU_ECHEC], // pas une chaine
			[ENJEU_REUSSITE, [ENJEU_ECHEC]],
			[MARQUEUR_A_ECRIRE, ENJEU_ECHEC], // marqueur
			[`prendre ${IDENTIFIANT}`, ENJEU_ECHEC], // identifiant
			[ENJEU_REUSSITE, 'perdre 2 points'], // chiffre
		]
		for (const [reussite, echec] of cas) {
			const direct = validerEnjeux(reussite, echec, dossier)
			const parArbitre = validerArbitre(
				{ epreuve: { carac: 'CA', tc: 'TC1', enjeu_reussite: reussite, enjeu_echec: echec } },
				dossier,
			)
			const parActeur = validerActeur(resiste(reussite, echec), dossier, new Set(), PERMIS)

			// Meme verdict, meme motif — de BOUT EN BOUT.
			expect({ reussite, echec, ok: parArbitre.ok }).toEqual({ reussite, echec, ok: direct.ok })
			expect({ reussite, echec, ok: parActeur.ok }).toEqual({ reussite, echec, ok: direct.ok })
			if (!direct.ok) {
				expect({ reussite, echec, ...parArbitre }).toEqual({ reussite, echec, ok: false, motif: direct.motif })
				expect({ reussite, echec, ...parActeur }).toEqual({ reussite, echec, ok: false, motif: direct.motif })
			} else {
				expect(direct).toEqual({ ok: true, enjeu_reussite: reussite, enjeu_echec: echec })
			}
		}
	})

	it('14 (KR-013) — la garde des enjeux n a QU UN domicile : ni validerArbitre ni validerActeur ne recopient une borne', () => {
		const code = codeSansCommentaires()
		const enjeux = corpsDe(code, 'validerEnjeux')
		// Le domicile unique porte les six predicats...
		for (const trace of [
			'ENJEU_CARACTERES_MAX',
			'PORTE_UN_CHIFFRE',
			'MARQUEUR_A_ECRIRE',
			'porteUnIdentifiant(',
			"includes('\\n')",
		]) {
			expect(`${trace} → ${enjeux.includes(trace)}`).toBe(`${trace} → true`)
		}
		// ... ses DEUX appelants l'appellent, et n'en recopient aucun. ⚠ `PORTE_UN_CHIFFRE` n'est
		// interdite qu'a `validerArbitre` : `validerActeur` l'emploie LEGITIMEMENT sur sa
		// REPLIQUE (predicat 8), jamais sur un enjeu — le test garde la portee reellement tenue.
		const traces: Record<string, readonly string[]> = {
			validerArbitre: ['ENJEU_CARACTERES_MAX', 'PORTE_UN_CHIFFRE', "includes('\\n')", 'reussiteBrut', 'echecBrut'],
			validerActeur: ['ENJEU_CARACTERES_MAX', "includes('\\n')", 'reussiteBrut', 'echecBrut'],
		}
		for (const [nom, interdites] of Object.entries(traces)) {
			const corps = corpsDe(code, nom)
			expect(`${nom} appelle validerEnjeux( → ${corps.includes('validerEnjeux(')}`).toBe(
				`${nom} appelle validerEnjeux( → true`,
			)
			for (const trace of interdites) {
				expect(`${nom} recopie ${trace} → ${corps.includes(trace)}`).toBe(`${nom} recopie ${trace} → false`)
			}
		}
		// Discriminant : `validerActeur` garde bien SON chiffre de replique, donc l'asymetrie est reelle.
		expect(corpsDe(code, 'validerActeur')).toContain('PORTE_UN_CHIFFRE')
	})

	it('10 (KR-283) — rangDu pose : indices_reveles DOIT porter ce rang, sinon rang-inconnu, REFUS ATOMIQUE de la replique', () => {
		const options = { rangDu: 'S1' } as const
		// Vide : la franchise n'est plus un succes quand le savoir est du.
		expect(validerActeur(repliqueA({ indices_reveles: [] }), dossier, rangsOuverts, options)).toEqual({
			ok: false,
			motif: 'rang-inconnu',
		})
		// Un AUTRE rang offert, mais pas le rang du : refuse.
		expect(validerActeur(repliqueA({ indices_reveles: ['S2'] }), dossier, rangsOuverts, options)).toEqual({
			ok: false,
			motif: 'rang-inconnu',
		})
		// Le rang du : passe, rendu TEL QUEL.
		expect(validerActeur(repliqueA({ indices_reveles: ['S1'] }), dossier, rangsOuverts, options)).toEqual({
			ok: true,
			sortie: {
				replique: "L'enclume ne chôme jamais, même quand le ciel s'assombrit.",
				indices_reveles: ['S1'],
				delta_confiance: 0,
			},
		})
	})

	it('10 — SANS rangDu, aucune exigence : indices_reveles vide reste un succes (franchise honnete, inchange)', () => {
		expect(validerActeur(repliqueA({ indices_reveles: [] }), dossier, rangsOuverts, {})).toEqual({
			ok: true,
			sortie: {
				replique: "L'enclume ne chôme jamais, même quand le ciel s'assombrit.",
				indices_reveles: [],
				delta_confiance: 0,
			},
		})
		expect(validerActeur(repliqueA({ indices_reveles: [] }), dossier, rangsOuverts, { rangDu: undefined }).ok).toBe(
			true,
		)
		expect(validerActeur(repliqueA({ indices_reveles: [] }), dossier, rangsOuverts).ok).toBe(true)
	})

	it('le rang du ne dispense d AUCUN des treize predicats : une replique a delta invalide, ou a un rang hors catalogue, reste refusee', () => {
		const options = { rangDu: 'S1' } as const
		expect(
			validerActeur(repliqueA({ indices_reveles: ['S1'], delta_confiance: 2 }), dossier, rangsOuverts, options),
		).toEqual({
			ok: false,
			motif: 'schema',
		})
		// Un rang du ABSENT du catalogue ne peut jamais valider : le rang est cherche DANS les rangs ouverts.
		expect(validerActeur(repliqueA({ indices_reveles: ['S1'] }), dossier, new Set(), options)).toEqual({
			ok: false,
			motif: 'rang-inconnu',
		})
	})

	it('resistePermise et rangDu sont INDEPENDANTS : la forme A ne depend pas de resistePermise, la forme B pas de rangDu', () => {
		expect(validerActeur(repliqueA(), dossier, rangsOuverts, PERMIS).ok).toBe(true)
		expect(
			validerActeur(repliqueA({ indices_reveles: ['S1'] }), dossier, rangsOuverts, { ...PERMIS, rangDu: 'S1' }).ok,
		).toBe(true)
		expect(validerActeur(resiste(), dossier, rangsOuverts, { ...PERMIS, rangDu: 'S1' }).ok).toBe(true)
	})
})
