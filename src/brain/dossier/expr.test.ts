import fs from 'node:fs'
import path from 'node:path'
import { PROFONDEUR_MAX_EXPR, collectRefs, validateExpr, type SiteExpr } from './expr'
import { PREDICATES, type PredicatId } from './predicates'
import { COLLECTIONS_IDENTIFIEES } from './identifiers'
import type { DossierIssue, DossierIssueCode } from './issues'

/**
 * LA FORME D'UNE CONDITION, éprouvée hors de tout document. `validateExpr` est la
 * frontière de confiance des `…_expr` (KR-116) : ce fichier tient les propriétés
 * que sa docstring affirme, une par une — totalité, unicité du site
 * d'interprétation, absence de parseur (KR-169 : une propriété affirmée sans test
 * est une intention, pas un contrat).
 */

const MODULE_DOSSIER = __dirname

/** Le champ porteur, écrit une fois : aucune anomilie ne descend jamais plus bas. */
const SITE: SiteExpr = { path: 'charpente.fins[0].condition_expr', location: 'Fin « Le sceau refermé »' }

/** Les sous-chaînes qui trahissent une erreur runtime sérialisée (KR-164). */
const FUITES_TECHNIQUES = ['expected', 'undefined', 'is not a function']

function codes(issues: readonly DossierIssue[]): DossierIssueCode[] {
	return issues.map((issue) => issue.code)
}

/** Un prédicat valide, réutilisé comme feuille partout où la forme importe seule. */
const FEUILLE = { op: 'predicat', predicat: 'possede_objet', cibles: ['objet.clef-de-basalte'] }

/** Une chaîne de `non` de PROFONDEUR niveaux au total, feuille comprise. */
function chaine(profondeur: number): unknown {
	let noeud: unknown = FEUILLE
	for (let rang = 1; rang < profondeur; rang += 1) noeud = { op: 'non', enfant: noeud }
	return noeud
}

describe('validateExpr, la forme', () => {
	it('accepte les quatre operateurs et reste muette sur un arbre bien forme', () => {
		const arbre = {
			op: 'et',
			enfants: [
				{ op: 'ou', enfants: [FEUILLE, { op: 'non', enfant: FEUILLE }] },
				{ op: 'predicat', predicat: 'pnj_a_revele', cibles: ['pnj.aldur-le-sage', 'indice.sceau-brise'] },
			],
		}

		expect(validateExpr(arbre, SITE)).toEqual([])
	})

	it('refuse un op hors et/ou/non/predicat', () => {
		const issues = validateExpr({ op: 'xor', enfants: [FEUILLE, FEUILLE] }, SITE)

		expect(codes(issues)).toEqual(['expr-malformee'])
		expect(issues[0].message).toContain('« xor »')
		expect(issues[0].message).toContain('et, ou, non ou predicat')
		// Le `path` est celui du champ PORTEUR : il ne descend jamais dans l'arbre.
		expect(issues[0].path).toBe(SITE.path)
		expect(issues[0].location).toBe(SITE.location)
	})

	it('refuse une cle inconnue sur un noeud', () => {
		// Contrepartie de l'opacité de l'arbre pour le balayage des destinations :
		// sans cette règle, un champ de prose vivrait ici et serait injecté par la
		// n° 10 sans qu'un test rougisse.
		const issues = validateExpr({ op: 'non', enfant: FEUILLE, commentaire: 'une note libre' }, SITE)

		expect(codes(issues)).toEqual(['expr-malformee'])
		expect(issues[0].message).toContain('« commentaire »')
	})

	it('refuse une cle inconnue sur CHACUN des quatre operateurs', () => {
		const noeuds: unknown[] = [
			{ op: 'et', enfants: [FEUILLE, FEUILLE], couleur: 'rouge' },
			{ op: 'ou', enfants: [FEUILLE, FEUILLE], couleur: 'rouge' },
			{ op: 'non', enfant: FEUILLE, couleur: 'rouge' },
			{ op: 'predicat', predicat: 'possede_objet', cibles: ['objet.clef-de-basalte'], couleur: 'rouge' },
		]

		for (const noeud of noeuds) {
			expect(codes(validateExpr(noeud, SITE))).toContain('expr-malformee')
		}
	})

	it('refuse un predicat absent du registre', () => {
		const issues = validateExpr({ op: 'predicat', predicat: 'jet_reussi', cibles: ['objet.clef-de-basalte'] }, SITE)

		expect(codes(issues)).toEqual(['predicat-inconnu'])
		expect(issues[0].message).toContain('« jet_reussi »')
	})

	it('refuse une arite differente aux bornes n-1 / n / n+1', () => {
		// L'arité est DÉRIVÉE de `refKinds.length`, jamais stockée : on l'éprouve donc
		// sur le prédicat d'arité 1 ET sur celui d'arité 2, aux trois bornes.
		const cas: ReadonlyArray<readonly [PredicatId, string[], boolean]> = [
			['possede_objet', [], false],
			['possede_objet', ['objet.clef-de-basalte'], true],
			['possede_objet', ['objet.clef-de-basalte', 'objet.clef-de-basalte'], false],
			['pnj_a_revele', ['pnj.aldur-le-sage'], false],
			['pnj_a_revele', ['pnj.aldur-le-sage', 'indice.sceau-brise'], true],
			['pnj_a_revele', ['pnj.aldur-le-sage', 'indice.sceau-brise', 'indice.cendres-tiedes'], false],
		]

		for (const [predicat, cibles, accepte] of cas) {
			const issues = validateExpr({ op: 'predicat', predicat, cibles }, SITE)

			if (accepte) {
				expect(issues).toEqual([])
				continue
			}
			expect(codes(issues)).toEqual(['arite-invalide'])
			expect(issues[0].message).toContain(PREDICATES[predicat].label)
			expect(issues[0].message).toContain(String(PREDICATES[predicat].refKinds.length))
		}
	})

	it('refuse et ou ou a 0 et a 1 enfant', () => {
		for (const op of ['et', 'ou']) {
			for (const enfants of [[], [FEUILLE]]) {
				const issues = validateExpr({ op, enfants }, SITE)

				expect(codes(issues)).toEqual(['arite-invalide'])
				expect(issues[0].message).toContain(`« ${op} »`)
				expect(issues[0].message).toContain(String(enfants.length))
			}
			// Discriminant : à DEUX enfants, le même opérateur est muet.
			expect(validateExpr({ op, enfants: [FEUILLE, FEUILLE] }, SITE)).toEqual([])
		}
	})

	it('refuse un non sans enfant, et un non portant la cle enfants', () => {
		const sansEnfant = validateExpr({ op: 'non' }, SITE)

		expect(codes(sansEnfant)).toEqual(['arite-invalide'])
		expect(sansEnfant[0].message).toContain('sans condition à nier')

		// « Un `non` à deux enfants » n'est PAS exprimable : le type porte `enfant` au
		// singulier. C'est une clé inconnue PLUS un enfant manquant — deux causes,
		// deux codes, et c'est pour ça qu'on ne fait pas de `enfant` un tuple.
		const deuxEnfants = validateExpr({ op: 'non', enfants: [FEUILLE, FEUILLE] }, SITE)

		expect(codes(deuxEnfants).sort()).toEqual(['arite-invalide', 'expr-malformee'])
		expect(deuxEnfants.find((issue) => issue.code === 'expr-malformee')?.message).toContain('« enfants »')
	})

	it('accepte a la profondeur PROFONDEUR_MAX_EXPR, refuse a +1', () => {
		// La VALEUR est épinglée, pas seulement la comparaison : sans cette ligne, les
		// deux assertions suivantes sont écrites RELATIVEMENT à la constante et
		// resteraient vertes si la borne passait à 9 — elles épinglent le `>` du garde,
		// jamais le nombre arbitré.
		expect(PROFONDEUR_MAX_EXPR).toBe(8)

		expect(validateExpr(chaine(PROFONDEUR_MAX_EXPR), SITE)).toEqual([])

		const trop = validateExpr(chaine(PROFONDEUR_MAX_EXPR + 1), SITE)

		expect(codes(trop)).toEqual(['expr-malformee'])
		expect(trop[0].message).toContain(String(PROFONDEUR_MAX_EXPR))
		// La borne est une constante NOMMÉE, et son NOM ne fuit jamais (KR-165).
		expect(trop[0].message).not.toContain('PROFONDEUR')
	})

	it('refuse une cible dont l espace differe de refKinds', () => {
		// Mal formée ET de mauvais espace tombent sous le MÊME code : c'est le même
		// défaut qu'un identifiant d'entité mal formé, pas un code de plus.
		const mauvaisEspace = validateExpr({ op: 'predicat', predicat: 'possede_objet', cibles: ['lieu.val-cendre'] }, SITE)

		expect(codes(mauvaisEspace)).toEqual(['identifiant-invalide'])
		expect(mauvaisEspace[0].message).toContain('« lieu.val-cendre »')
		expect(mauvaisEspace[0].message).toContain('« Objet »')
		expect(mauvaisEspace[0].entityId).toBe('lieu.val-cendre')

		const malFormee = validateExpr({ op: 'predicat', predicat: 'possede_objet', cibles: ['OBJET.Clef'] }, SITE)

		expect(codes(malFormee)).toEqual(['identifiant-invalide'])

		// Position par position : le SECOND slot du prédicat d'arité 2 est contrôlé.
		const secondSlot = validateExpr(
			{ op: 'predicat', predicat: 'pnj_a_revele', cibles: ['pnj.aldur-le-sage', 'lieu.val-cendre'] },
			SITE,
		)

		expect(codes(secondSlot)).toEqual(['identifiant-invalide'])
		expect(secondSlot[0].message).toContain('« Indice »')
	})

	it('validateExpr est totale : du bruit ne leve jamais et rend des anomalies redigees', () => {
		const bruit: unknown[] = [
			undefined,
			null,
			42,
			'du texte',
			[],
			[FEUILLE],
			true,
			{},
			{ op: 42 },
			{ op: 'et', enfants: 'deux conditions' },
			{ op: 'et', enfants: [FEUILLE, 'du texte'] },
			{ op: 'non', enfant: 42 },
			{ op: 'predicat' },
			{ op: 'predicat', predicat: 'possede_objet' },
			{ op: 'predicat', predicat: 'possede_objet', cibles: [42] },
			{ op: 'predicat', predicat: 42, cibles: [] },
			// LES CLES DE LA CHAINE DE PROTOTYPES (BUG-053). C'est ICI que le defaut est
			// passe : la liste de bruit n'en contenait aucune, et `'toString' in PREDICATES`
			// vaut `true`. Toute entree ajoutee a ce test doit se demander non pas « cette
			// valeur est-elle absurde ? » mais « par quelle porte le registre peut-il
			// repondre oui a une cle que personne n'y a mise ? »
			{ op: 'toString' },
			{ op: 'constructor' },
			{ op: '__proto__' },
			{ op: 'hasOwnProperty' },
			{ op: 'predicat', predicat: 'toString', cibles: [] },
			{ op: 'predicat', predicat: 'valueOf', cibles: 'du texte' },
			{ op: 'predicat', predicat: 'hasOwnProperty', cibles: ['objet.clef-de-basalte'] },
		]

		for (const valeur of bruit) {
			expect(() => validateExpr(valeur, SITE)).not.toThrow()

			const issues = validateExpr(valeur, SITE)

			expect(issues.length).toBeGreaterThan(0)
			for (const issue of issues) {
				expect(issue.severity).toBe('error')
				expect(issue.message.length).toBeGreaterThan(0)
				expect(issue.path).toBe(SITE.path)
			}
		}
	})

	it('aucun message d anomalie d expression ne contient expected, undefined ou is not a function', () => {
		const bruit: unknown[] = [
			undefined,
			{ op: undefined },
			{ op: 'et' },
			{ op: 'non' },
			{ op: 'predicat', predicat: undefined, cibles: [] },
			{ op: 'predicat', predicat: 'possede_objet', cibles: [undefined] },
			// Meme famille : le message ne doit pas non plus fuir sur une cle heritee.
			{ op: 'toString' },
			{ op: 'predicat', predicat: 'toString', cibles: [] },
		]

		for (const valeur of bruit) {
			for (const issue of validateExpr(valeur, SITE)) {
				for (const fuite of FUITES_TECHNIQUES) {
					expect(issue.message.toLowerCase()).not.toContain(fuite)
				}
			}
		}
	})
})

describe('collectRefs', () => {
	it('collecte toutes les references sur au moins 3 niveaux imbriques', () => {
		const arbre = {
			op: 'et',
			enfants: [
				{ op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-nuit'] },
				{
					op: 'non',
					enfant: {
						op: 'ou',
						enfants: [
							{ op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.val-cendre'] },
							{ op: 'predicat', predicat: 'pnj_a_revele', cibles: ['pnj.aldur-le-sage', 'indice.sceau-brise'] },
						],
					},
				},
			],
		}

		expect(collectRefs(arbre)).toEqual([
			{ id: 'jalon.premiere-nuit', espace: 'jalon', predicat: 'jalon_atteint' },
			{ id: 'lieu.val-cendre', espace: 'lieu', predicat: 'lieu_visite' },
			{ id: 'pnj.aldur-le-sage', espace: 'pnj', predicat: 'pnj_a_revele' },
			{ id: 'indice.sceau-brise', espace: 'indice', predicat: 'pnj_a_revele' },
		])
	})

	it('porte le PREDICAT de chaque reference, sans quoi le message le re-parcourrait', () => {
		// Le message de `reference-pendante` nomme le prédicat par son `label` : sans
		// ce champ, `validate.ts` devrait re-traverser l'arbre — une seconde vérité.
		const refs = collectRefs({ op: 'predicat', predicat: 'lieu_courant_est', cibles: ['lieu.val-cendre'] })

		expect(refs).toHaveLength(1)
		expect(PREDICATES[refs[0].predicat].label).toBe('se trouve dans le lieu')
	})

	it('rend une liste vide sur du bruit et n est appelee que si validateExpr est vide', () => {
		const bruit: unknown[] = [undefined, null, 42, 'du texte', [], {}, { op: 'xor' }, { op: 'et', enfants: 'deux' }]

		for (const valeur of bruit) {
			expect(() => collectRefs(valeur)).not.toThrow()
			expect(collectRefs(valeur)).toEqual([])
		}

		// La SECONDE moitié de la propriété — « appelée seulement si `validateExpr`
		// n'a rien produit » — est une règle du seul appelant, donc elle se lit dans
		// sa source : `collectRefs` y est sous le `continue` de la garde de forme.
		const source = fs.readFileSync(path.join(MODULE_DOSSIER, 'validate.ts'), 'utf8')
		const garde = source.indexOf('if (malFormee.length > 0) {')
		const appel = source.indexOf('collectRefs(site.valeur)')

		expect(garde).toBeGreaterThan(-1)
		expect(appel).toBeGreaterThan(garde)
	})
})

describe('PREDICATES, la propriete que le registre achete', () => {
	it('tout refKinds a une ligne dans COLLECTIONS_IDENTIFIEES, et bestiaire n y figure jamais', () => {
		// MÉCANIQUE, pas conventionnelle : aucun prédicat ne peut désigner un monstre,
		// donc aucun ne peut ouvrir un combat — c'est un jet, et un jet n'évalue pas.
		const portes = new Set(COLLECTIONS_IDENTIFIEES.map((collection) => collection.espace))

		expect(portes.has('bestiaire')).toBe(false)
		for (const [id, descripteur] of Object.entries(PREDICATES)) {
			expect(descripteur.refKinds.length).toBeGreaterThan(0)
			for (const espace of descripteur.refKinds) {
				expect(`${id} → ${espace} porté par une collection : ${portes.has(espace)}`).toBe(
					`${id} → ${espace} porté par une collection : true`,
				)
			}
		}
	})

	it('chaque descripteur porte un libelle francais, jamais une syntaxe', () => {
		for (const [id, descripteur] of Object.entries(PREDICATES)) {
			expect(descripteur.label.trim().length).toBeGreaterThan(0)
			// Un `label` est ce que l'auteur LIT dans un `Select` : ni l'identifiant, ni
			// un fragment d'expression.
			expect(descripteur.label).not.toContain('_')
			expect(descripteur.label).not.toBe(id)
			for (const marqueur of ['(', '&&', '||', 'op:']) {
				expect(descripteur.label).not.toContain(marqueur)
			}
		}
	})
})

/**
 * LES DEUX PROPRIÉTÉS QUI NE SE PORTENT PAS PAR LE TYPAGE (KR-169) : elles se
 * lisent dans la SOURCE, sinon elles restent des commentaires qu'aucune porte ne
 * relit.
 */
describe('le module dossier, proprietes statiques', () => {
	function fichiersDuModule(): string[] {
		return fs
			.readdirSync(MODULE_DOSSIER)
			.filter((nom) => nom.endsWith('.ts'))
			.filter((nom) => !nom.endsWith('.test.ts'))
	}

	/** Le SECOND lecteur d'arbre du module — celui qui n'est pas la grammaire. */
	const ATTEIGNABILITE = 'atteignabilite.ts'

	function source(nom: string): string {
		return fs.readFileSync(path.join(MODULE_DOSSIER, nom), 'utf8')
	}

	/**
	 * LE SITE DE LA GRAMMAIRE — le seul module qui décide ce QU'EST un nœud, à
	 * partir d'une valeur que personne n'a encore typée.
	 */
	const SITE_DE_LA_GRAMMAIRE = 'expr.ts'

	it('un lecteur d arbre est soit le SEUL site de la grammaire, soit exhaustif au compilateur', () => {
		// L'INVARIANT, RÉÉCRIT À SON ÉCHÉANCE — ET IL DURCIT, IL NE SE DESSERRE PAS.
		//
		// CE QU'IL PROTÉGEAIT VRAIMENT : aucun module ne RE-DÉRIVE la grammaire d'un
		// arbre NON TYPÉ. `validateExpr` et `collectRefs` reçoivent de l'`unknown` et
		// décident eux-mêmes ce qui est un nœud ; deux lecteurs de cette espèce
		// divergeraient en silence, et c'est cela — cela seul — qui exige un site
		// UNIQUE.
		//
		// CE QU'IL DISAIT DE TROP : « un seul lecteur ». Un lecteur d'un arbre DÉJÀ
		// ACCEPTÉ par `validateExpr` n'invente aucune forme : il reçoit un `ExprNode`
		// et n'énonce qu'une sémantique. Il est donc admis, à UNE CONDITION vérifiée
		// plus bas — être EXHAUSTIF AU COMPILATEUR.
		//
		// POURQUOI CETTE CONDITION ET PAS UNE AUTRE, mesuré et non supposé : la
		// cascade de `if (noeud.op === …)` qu'`atteignabilite.ts` portait d'abord
		// laissait `tsc` ENTIÈREMENT MUET quand un cinquième opérateur entrait dans
		// l'union — le nœud inconnu y tombait dans la branche de repli et s'y faisait
		// traiter comme un `ou`. C'est exactement le mode de panne — dériver en
		// silence — que cette garde existe pour empêcher, et il survit à la frontière
		// du typage. Le `default` qui échoue sur un paramètre `never` le ferme : le
		// même cinquième opérateur casse alors `tsc` à CET appel, et nulle part
		// ailleurs.
		//
		// LES DEUX FORMES, EN EXPRESSION RÉGULIÈRE ET NON EN LITTÉRAL — troisième
		// resserrement, et il ferme un trou de l'espèce même que cette garde surveille :
		// un marqueur textuel est lié au NOM DU PARAMÈTRE, si bien qu'un troisième
		// lecteur écrivant `switch (n.op)` n'aurait pas été RELEVÉ, donc jamais soumis
		// à la condition. L'aiguillage couvre aussi la forme à variable nue.
		const CASCADE = /\.?\bop\s*===\s*'/g
		const AIGUILLAGE = /\bswitch\s*\(\s*[\w.]*\bop\s*\)/g
		const lecteurs = fichiersDuModule().filter((nom) =>
			[CASCADE, AIGUILLAGE].some((motif) => source(nom).match(motif) !== null),
		)

		expect(lecteurs).toEqual([ATTEIGNABILITE, SITE_DE_LA_GRAMMAIRE])

		// L'EXEMPTION SE DÉRIVE DE LA FRONTIÈRE DE TYPAGE, JAMAIS D'UN NOM DE FICHIER :
		// est dispensé de la condition celui qui lit un arbre `unknown`, parce
		// qu'aucune exhaustivité n'y est EXPRIMABLE — et c'est exactement pour cela
		// qu'il doit rester unique. Exempter `expr.ts` par son nom aurait été un
		// privilège ; le dériver en fait une propriété que le prochain module devra
		// mériter de la même façon.
		const semantiques = lecteurs.filter((nom) => !source(nom).includes('noeud: unknown'))

		// Discriminance (KR-199) : la boucle ci-dessous porte sur UN fichier, et on le
		// dit — une liste vide la rendrait vraie sans rien prouver.
		expect(semantiques).toEqual([ATTEIGNABILITE])

		// UNE FERMETURE PAR AIGUILLAGE, et non une par FICHIER : un second `switch`
		// ajouté demain dans le même module, sans `default` fermé, passerait un
		// `includes` global — le fichier porterait toujours la marque de son PREMIER
		// aiguillage, et le second dériverait en silence. C'est le compte qui répond,
		// et il répond par fichier relevé.
		const FERMETURE = /:\s*never\b/g
		for (const nom of semantiques) {
			const aiguillages = (source(nom).match(AIGUILLAGE) ?? []).length
			const fermetures = (source(nom).match(FERMETURE) ?? []).length
			const repere = `${nom} → ${aiguillages} aiguillage(s), ${fermetures} fermeture(s)`
			expect(`${repere} → ${aiguillages > 0 && fermetures >= aiguillages}`).toBe(`${repere} → true`)
		}

		// LES DEUX SIGNATURES, LUES DANS LA SOURCE : c'est la frontière de typage qui
		// sépare les deux régimes, et elle se constate. Sans la seconde, un module
		// « sémantique » pourrait recevoir de l'`unknown` par un autre nom de
		// paramètre et se dispenser de tout.
		expect(source(SITE_DE_LA_GRAMMAIRE)).toContain('noeud: unknown')
		expect(source(ATTEIGNABILITE)).toContain('noeud: ExprNode')
	})

	it('aucune fonction de parsing d expression dans brain/dossier/', () => {
		// KR-168 : un parseur réintroduirait une grammaire à spécifier, versionner et
		// tester, plus la question de la syntaxe montrée à l'auteur. Construit par
		// morceaux pour que CE fichier ne soit pas lui-même une occurrence.
		//
		// On cherche une DÉCLARATION ou un APPEL, pas une mention : la docstring de
		// `expr.ts` nomme `parseExpr` pour dire qu'il est interdit, et une règle qui
		// interdirait d'écrire le nom interdirait aussi d'expliquer pourquoi.
		const noms = [
			['parse', 'Expr'].join(''),
			['parse', 'Condition'].join(''),
			['compile', 'Expr'].join(''),
			['lex', 'Expr'].join(''),
		]
		const enPositionDeCode = (nom: string) => new RegExp(`(function|const|let|var)\\s+${nom}\\b|\\b${nom}\\s*\\(`)

		const coupables = fs
			.readdirSync(MODULE_DOSSIER)
			.filter((nom) => nom.endsWith('.ts'))
			.filter((fichier) => noms.some((interdit) => enPositionDeCode(interdit).test(source(fichier))))

		expect(coupables).toEqual([])

		// Discriminant : le motif attrape réellement une déclaration et un appel — sans
		// cela, l'assertion ci-dessus serait vraie parce que le motif ne matche rien.
		const interdit = enPositionDeCode(noms[0])
		expect(interdit.test(`function ${noms[0]}(source: string) {}`)).toBe(true)
		expect(interdit.test(`const arbre = ${noms[0]}(texte)`)).toBe(true)
		expect(interdit.test(`aucun \`${noms[0]}\`, sous quelque nom que ce soit`)).toBe(false)
	})

	it('validateExpr ne RESOUT aucune reference — la propriete que sa docstring affirme', () => {
		// KR-169 : une propriété affirmée dans une docstring sans test est une intention.
		// Celle-ci était démontrée PAR ACCIDENT (un arbre bien formé aux cibles inventées
		// ne déclenchait rien), jamais revendiquée — BUG-052.
		//
		// Ce qu'elle achète : la frontière forme / résolution. `validateExpr` connaît
		// `PREDICATES`, donc la FORME d'une cible ; elle ne connaît pas `collectIds`,
		// donc l'EXISTENCE de l'entité. Sans cette séparation, `expr.ts` importerait le
		// document entier pour valider un nœud, et deux modules sauraient résoudre.
		const cibleBienFormeeQuiNeResoutVersRien = {
			op: 'predicat',
			predicat: 'possede_objet',
			cibles: ['objet.cet-objet-n-existe-dans-aucun-dossier'],
		}

		expect(validateExpr(cibleBienFormeeQuiNeResoutVersRien, SITE)).toEqual([])

		// Discriminant : ce n'est pas que `validateExpr` laisse tout passer — la MÊME
		// cible, mal formée, est refusée. Seule la résolution lui échappe.
		expect(validateExpr({ ...cibleBienFormeeQuiNeResoutVersRien, cibles: ['pnj.aldur-le-sage'] }, SITE)).not.toEqual([])

		// Et elle n'importe ni n'appelle le résolveur, ce qu'aucune assertion de
		// comportement ne pourrait montrer : la propriété est structurelle autant que
		// fonctionnelle. On cherche `collectIds` EN POSITION DE CODE — la docstring, elle,
		// a le droit de le nommer, et le nomme (c'est là qu'elle explique la frontière).
		const enPositionDeCode = /\bcollectIds\s*\(|import[^}]*\bcollectIds\b/
		expect(enPositionDeCode.test(source('expr.ts'))).toBe(false)

		// Discriminant du motif lui-même : sans ces deux lignes, l'assertion ci-dessus
		// serait vraie parce que le motif ne matche rien, et non parce que le code est sain.
		expect(enPositionDeCode.test("import { collectIds } from './identifiers'")).toBe(true)
		expect(enPositionDeCode.test('seule `validate.ts` connaît `collectIds`')).toBe(false)
	})

	it('expr.ts n importe JAMAIS types.ts — l ordre des modules reste acyclique', () => {
		// `types.ts` importe `ExprNode` ; l'inverse nouerait la forme du document et la
		// forme des conditions, et il n'y aurait plus d'ordre de démolition.
		expect(source('expr.ts')).not.toMatch(/from\s+['"]\.\/types['"]/)
		expect(source('types.ts')).toMatch(/from\s+['"]\.\/expr['"]/)
	})
})
