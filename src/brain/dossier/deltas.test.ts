import fs from 'node:fs'
import path from 'node:path'
import { DELTAS, collectDeltaRefs, validateDelta, type SiteDelta } from './deltas'
import { COLLECTIONS_IDENTIFIEES } from './identifiers'
import { PREDICATES } from './predicates'
import type { DossierIssue, DossierIssueCode } from './issues'

/**
 * LA FORME D'UN EFFET DE RÈGLE, éprouvée hors de tout document. `validateDelta`
 * est la frontière de confiance des quatre emplacements de deltas (KR-116) : ce
 * fichier tient les propriétés que sa docstring affirme, une par une (KR-169) —
 * totalité, appartenance propre au registre, et confinement de sa sortie du baril
 * `brain/index.ts` à une ALLOW-LIST NOMMÉE (KR-215, itération 3 de la n° 6 : le
 * registre en sort désormais, mais pour des porteurs qu'on écrit).
 */

const MODULE_DOSSIER = __dirname
const RACINE_SRC = path.join(MODULE_DOSSIER, '..', '..')

/** Le champ porteur, écrit une fois : aucune anomalie ne descend jamais plus bas. */
const SITE: SiteDelta = { path: 'charpente.jalons[0].effet[0]', location: 'Jalon « La première nuit à Val-Cendre »' }

/** Les sous-chaînes qui trahissent une erreur runtime sérialisée (KR-164). */
const FUITES_TECHNIQUES = ['expected', 'undefined', 'is not a function']

function codes(issues: readonly DossierIssue[]): DossierIssueCode[] {
	return issues.map((issue) => issue.code)
}

/** Un effet valide, réutilisé partout où seule la forme du porteur importe. */
const EFFET = { delta: 'donner_objet', cibles: ['objet.clef-de-basalte'] }

function fichiersTypeScript(racine: string): string[] {
	return fs
		.readdirSync(racine, { withFileTypes: true })
		.flatMap((entree) =>
			entree.isDirectory()
				? fichiersTypeScript(path.join(racine, entree.name))
				: /\.tsx?$/.test(entree.name)
					? [path.join(racine, entree.name)]
					: [],
		)
}

function source(nom: string): string {
	return fs.readFileSync(path.join(MODULE_DOSSIER, nom), 'utf8')
}

/**
 * La source PRIVÉE DE SES COMMENTAIRES. Sans elle, les deux test-greps ci-dessous
 * seraient rouges sur de la PROSE : la docstring de `deltas.ts` nomme
 * `'toString' in DELTAS` pour dire pourquoi c'est interdit, et le baril
 * `brain/index.ts` nomme `DELTAS` en commentaire pour dire À QUI il le laisse
 * sortir. Une règle qui interdirait d'écrire un nom interdirait aussi d'expliquer
 * pourquoi — même patron que le test-grep de `parseExpr` dans `expr.test.ts`.
 *
 * ⚠ CONSÉQUENCE À CONNAÎTRE DEPUIS L'ALLOW-LIST : un fichier qui ne NOMMERAIT le
 * registre qu'en commentaire n'est pas un porteur. C'est exactement ce qu'on veut
 * — le garde compte les CONSOMMATEURS, pas les mentions.
 */
function enPositionDeCode(texte: string): string {
	return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

describe('DELTAS, les proprietes que le registre achete', () => {
	it('DELTAS compte quatre entrees', () => {
		expect(Object.keys(DELTAS).sort()).toEqual(['atteindre_jalon', 'donner_objet', 'retirer_objet', 'reveler_indice'])
	})

	it('tout refKinds a une ligne dans COLLECTIONS_IDENTIFIEES, et bestiaire n y figure jamais', () => {
		// Clause (b) de la règle d'admission : tous les opérandes sont des identifiants
		// STABLES, donc chaque espace doit être porté par une collection du dossier.
		const portes = new Set(COLLECTIONS_IDENTIFIEES.map((collection) => collection.espace))

		expect(portes.has('bestiaire')).toBe(false)
		for (const [id, descripteur] of Object.entries(DELTAS)) {
			expect(descripteur.refKinds.length).toBeGreaterThan(0)
			for (const espace of descripteur.refKinds) {
				expect(`${id} → ${espace} porté par une collection : ${portes.has(espace)}`).toBe(
					`${id} → ${espace} porté par une collection : true`,
				)
			}
		}
	})

	it('tout refKinds de DELTAS est inclus dans l union des refKinds de PREDICATES', () => {
		// Clause (c) de la règle d'admission, et c'est elle qui rend le veto « aucun
		// effet ne peut nommer un monstre » MÉCANIQUE plutôt que conventionnel :
		// `bestiaire` n'étant dans le `refKinds` d'AUCUN prédicat, aucun delta ne peut
		// l'atteindre — et donc aucun effet ne peut ouvrir un combat, qui est un jet.
		const lus = new Set(Object.values(PREDICATES).flatMap((descripteur) => [...descripteur.refKinds]))

		expect(lus.has('bestiaire')).toBe(false)
		for (const [id, descripteur] of Object.entries(DELTAS)) {
			for (const espace of descripteur.refKinds) {
				expect(`${id} → ${espace} lu par un prédicat : ${lus.has(espace)}`).toBe(
					`${id} → ${espace} lu par un prédicat : true`,
				)
			}
		}
	})

	it('chaque descripteur porte un libelle francais, jamais une syntaxe', () => {
		for (const [id, descripteur] of Object.entries(DELTAS)) {
			expect(descripteur.label.trim().length).toBeGreaterThan(0)
			// Un `label` est ce que l'auteur LIT dans un `Select` : ni l'identifiant, ni
			// un fragment de syntaxe.
			expect(descripteur.label).not.toContain('_')
			expect(descripteur.label).not.toBe(id)
			for (const marqueur of ['(', '&&', '||', 'delta:']) {
				expect(descripteur.label).not.toContain(marqueur)
			}
		}
	})

	it('DELTAS toString et constructor ne resolvent aucune entree', () => {
		// KR-175 / RÉGRESSION BUG-053, appliqué EN AMONT pour la première fois : tout
		// littéral d'objet hérite d'`Object.prototype`, donc `'toString' in DELTAS`
		// vaut `true` et le descripteur qu'on en tire est une FONCTION — sur laquelle
		// le code d'après lit `.refKinds.length`. Un validateur qui se promet TOTAL
		// lèverait alors, sur une valeur venue tout droit du fichier de l'auteur.
		for (const heritee of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf']) {
			const effet = { delta: heritee, cibles: ['objet.clef-de-basalte'] }

			expect(() => validateDelta(effet, SITE)).not.toThrow()
			expect(codes(validateDelta(effet, SITE))).toEqual(['delta-inconnu'])
			// Et le collecteur non plus ne résout rien : il rendrait sinon une référence
			// portée par un descripteur qui est une fonction.
			expect(() => collectDeltaRefs(effet)).not.toThrow()
			expect(collectDeltaRefs(effet)).toEqual([])
		}

		// Discriminant : une entrée RÉELLE du registre, elle, résout.
		expect(validateDelta(EFFET, SITE)).toEqual([])
		expect(collectDeltaRefs(EFFET)).toHaveLength(1)
	})

	it('aucun acces a DELTAS hors estCleDe', () => {
		// La propriété se lit dans la SOURCE : aucune signature ne la porte (KR-169).
		const deltas = enPositionDeCode(source('deltas.ts'))

		// Ni `in`, ni un test d'index — les deux remontent la chaîne de prototypes.
		expect(deltas).not.toMatch(/\bin\s+DELTAS\b/)
		expect(deltas).not.toMatch(/DELTAS\[[^\]]*\]\s*(?:!==|===|!=|==)\s*undefined/)
		expect(deltas).toMatch(/estCleDe\(DELTAS,/)

		// Toute indexation du registre par une valeur venue du document passe par le
		// garde de TYPE `estDeltaId`, et n'affirme donc rien par un `as` — c'est
		// exactement là que le compilateur cesserait de protéger (KR-175, corollaire 1).
		const indexations = deltas.match(/DELTAS\[[^\]]*\]/g) ?? []
		expect(indexations.length).toBeGreaterThan(0)
		expect([...new Set(indexations)]).toEqual(['DELTAS[delta]'])

		// Hors de `deltas.ts`, une seule indexation dans tout le module, et par une
		// valeur DÉJÀ typée `DeltaId` — produite par un collecteur qui, lui, a gardé.
		const ailleurs = fs
			.readdirSync(MODULE_DOSSIER)
			.filter((nom) => nom.endsWith('.ts') && nom !== 'deltas.ts' && !nom.endsWith('.test.ts'))
			.flatMap((nom) =>
				(enPositionDeCode(source(nom)).match(/DELTAS\[[^\]]*\]/g) ?? []).map((acces) => `${nom} → ${acces}`),
			)

		expect(ailleurs).toEqual(['validate.ts → DELTAS[ref.delta]'])
	})

	it('DELTAS n est reference hors brain/dossier/ que par un porteur de l allow-list nommee', () => {
		// C'était l'instrument de la clause d'ESCALADE sous sa forme la plus dure — le
		// registre ne sortait PAS du baril `brain/index.ts`, seuls les TYPES `Delta` /
		// `DeltaId` en sortaient — et l'itération 3 de la n° 6 vient de payer cette
		// escalade plutôt que de la contourner (KR-215).
		//
		// CE QUI A CHANGÉ, ET CE QUI N'A PAS CHANGÉ. Le registre sort désormais du
		// baril, pour un consommateur NOMMÉ : `EditeurEffets.tsx` rend un `Select` dont
		// les options sont les entrées de `DELTAS` dans SON ordre, avec leur `label`
		// VERBATIM, et un `Select` de cible PAR ENTRÉE de `refKinds`. Le contournement
		// disponible — une projection dérivée re-listant les quatre libellés côté
		// feature — a été explicitement veto au raffinage : elle divergerait EN SILENCE
		// le jour où un cinquième effet est admis (KR-117). Ce qui n'a pas changé, c'est
		// que la décision reste EXPLICITE : toute autre feature qui voudra consommer le
		// registre devra ajouter SA ligne ici, c'est-à-dire prendre la décision au lieu
		// de la subir.
		//
		// ⚠ LES ENTRÉES SONT CONSTRUITES PAR `path.join`, JAMAIS ÉCRITES À LA BARRE
		// OBLIQUE : `path.relative` rend des séparateurs NATIFS de la plateforme, et ce
		// dépôt tourne aussi sous Windows — un littéral `'brain/index.ts'` ferait rougir
		// ce test là-bas et nulle part ailleurs.
		//
		// L'ALLOW-LIST EST UN SUR-ENSEMBLE, et c'est délibéré : le lot contrat livre le
		// premier porteur, le lot écran le second. L'assertion porte donc sur
		// l'INCLUSION (« aucun porteur hors liste »), jamais sur l'égalité — qui aurait
		// fait rougir un lot vert.
		const AUTORISES = [
			path.join('brain', 'index.ts'),
			path.join('features', 'dossier-registres', 'components', 'EditeurEffets.tsx'),
		]

		// `\b` en tête : `CHEMINS_DE_DELTAS` n'est pas une occurrence (`_` est un
		// caractère de mot), et c'est voulu — cette table-là est publique dans le module.
		const registre = /\bDELTAS\b/

		const porteurs = fichiersTypeScript(RACINE_SRC)
			.filter((fichier) => !fichier.startsWith(MODULE_DOSSIER))
			.filter((fichier) => registre.test(enPositionDeCode(fs.readFileSync(fichier, 'utf8'))))
			.map((fichier) => path.relative(RACINE_SRC, fichier))

		expect(porteurs.filter((fichier) => !AUTORISES.includes(fichier))).toEqual([])

		// SONDE DE DISCRIMINANCE (KR-199) — sans elle, l'assertion ci-dessus resterait
		// verte si le balayage ne trouvait RIEN : elle dirait « aucun porteur hors
		// liste » en ne prouvant que « aucun porteur ». Le baril EXPORTE réellement le
		// registre, et le balayage le voit — vrai après ce lot seul comme après le lot
		// écran, puisque cet export ne repart pas.
		expect(porteurs).toContain(path.join('brain', 'index.ts'))

		// Discriminant du motif : sans ces deux lignes, l'assertion serait vraie parce
		// que la regex ne matche rien plutôt que parce que le registre est confiné.
		expect(registre.test('import { DELTAS } from ./dossier/deltas')).toBe(true)
		expect(registre.test('import { CHEMINS_DE_DELTAS } from ./tables')).toBe(false)
	})

	it('aucun fichier de src/player ne ecrit jalons_atteints, indices_connus ni evenements_consommes', () => {
		// RÉSERVATION (désaccord C12, reporté n° 9). Fait établi et non supposé :
		// `SessionState` n'a AUCUN de ces champs aujourd'hui — la règle d'admission
		// d'it3 (« un champ nommé de l'état de session y répond ») décrivait une
		// intention, pas un relevé. Ce n'est pas un défaut du contrat livré : les
		// registres décrivent le moteur qui arrive en n° 9.
		//
		// Ce test transforme le constat en DÉCISION TRACÉE : le jour où la n° 9 écrit
		// l'un de ces champs, elle supprime ce test, et elle constate au passage que
		// `reveler_indice` et `atteindre_jalon` attendaient là leur destinataire.
		const RESERVES = ['jalons_atteints', 'indices_connus', 'evenements_consommes']
		const PLAYER = path.join(RACINE_SRC, 'player')

		const ecrivains = fichiersTypeScript(PLAYER)
			.filter((fichier) => RESERVES.some((champ) => fs.readFileSync(fichier, 'utf8').includes(champ)))
			.map((fichier) => path.relative(RACINE_SRC, fichier))

		expect(ecrivains).toEqual([])
	})
})

describe('validateDelta, la forme', () => {
	it('accepte les quatre effets du registre et reste muette', () => {
		const effets = [
			{ delta: 'donner_objet', cibles: ['objet.clef-de-basalte'] },
			{ delta: 'retirer_objet', cibles: ['objet.clef-de-basalte'] },
			{ delta: 'reveler_indice', cibles: ['indice.sceau-brise'] },
			{ delta: 'atteindre_jalon', cibles: ['jalon.premiere-nuit'] },
		]

		for (const effet of effets) expect(validateDelta(effet, SITE)).toEqual([])
		// Discriminant : les quatre entrées du registre sont bien celles éprouvées ici.
		expect(effets.map((effet) => effet.delta).sort()).toEqual(Object.keys(DELTAS).sort())
	})

	it('refuse une cle inconnue sur un effet', () => {
		// CONTREPARTIE INDISSOCIABLE de l'arrêt du balayage de couverture : un effet
		// est une feuille OPAQUE pour `couverture.test.ts`, donc sans cette règle il
		// deviendrait une CACHETTE — un champ de prose y vivrait, échapperait au
		// balayage des destinations et serait injecté par la n° 10 sans qu'un test
		// rougisse.
		const issues = validateDelta({ ...EFFET, commentaire: 'une note libre' }, SITE)

		expect(codes(issues)).toEqual(['delta-malforme'])
		// VERBATIM, comme les quatre QUOI arbitrés au § 3.3 du plan. Celui-ci ne l'était
		// pas — il a été repris du patron d'`expr.ts` à l'implémentation, faute d'une
		// phrase au plan pour ce cas. Une phrase livrée sans être épinglée dérive à la
		// première reformulation, qu'elle ait été arbitrée ou non.
		expect(issues[0].message).toBe(
			'Le champ « effet » contient une clé « commentaire » que les effets ne reconnaissent pas.',
		)
		expect(issues[0].path).toBe(SITE.path)
		expect(issues[0].location).toBe(SITE.location)
	})

	it('refuse un effet sans cle delta, distinctement d un effet inconnu', () => {
		const sansCle = validateDelta({ cibles: ['objet.clef-de-basalte'] }, SITE)

		expect(codes(sansCle)).toEqual(['delta-malforme'])
		expect(sansCle[0].message).toContain('« delta »')

		// L'auteur qui a écrit un mauvais MOT n'a pas le même défaut que celui qui n'en
		// a écrit aucun : deux causes, deux codes, deux consignes.
		const inconnu = validateDelta({ delta: 'gagner_xp', cibles: ['objet.clef-de-basalte'] }, SITE)

		expect(codes(inconnu)).toEqual(['delta-inconnu'])
		expect(inconnu[0].message).toContain('« gagner_xp »')
	})

	it('refuse une arite differente aux bornes n-1 / n / n+1', () => {
		// L'arité est DÉRIVÉE de `refKinds.length`, jamais stockée (KR-165) : sans ce
		// contrôle, `collectDeltaRefs` sauterait en silence une cible manquante et la
		// résolution ne verrait jamais la référence que l'auteur n'a pas écrite.
		const cas: ReadonlyArray<readonly [string[], boolean]> = [
			[[], false],
			[['objet.clef-de-basalte'], true],
			[['objet.clef-de-basalte', 'objet.clef-de-basalte'], false],
		]

		for (const [cibles, accepte] of cas) {
			const issues = validateDelta({ delta: 'donner_objet', cibles }, SITE)

			if (accepte) {
				expect(issues).toEqual([])
				continue
			}
			expect(codes(issues)).toEqual(['arite-invalide'])
			expect(issues[0].message).toContain(DELTAS.donner_objet.label)
			expect(issues[0].message).toContain(String(DELTAS.donner_objet.refKinds.length))
			// SIXIEME phrase francaise de ce lot, et la derniere a n etre tenue que par
			// des sous-chaines. Ses cinq voisines sont verbatim ; une phrase livree sans
			// etre epinglee derive a la premiere reformulation.
			if (cibles.length === 2) {
				expect(issues[0].message).toBe(
					"Le champ « effet » fournit 2 cible(s) à l'effet « donne l'objet », qui en attend 1.",
				)
			}
		}
	})

	it('refuse une cible dont l espace differe de refKinds', () => {
		// Mal formée ET de mauvais espace tombent sous le MÊME code : c'est le même
		// défaut qu'un identifiant d'entité mal formé, pas un code de plus.
		const mauvaisEspace = validateDelta({ delta: 'donner_objet', cibles: ['lieu.val-cendre'] }, SITE)

		expect(codes(mauvaisEspace)).toEqual(['identifiant-invalide'])
		expect(mauvaisEspace[0].message).toContain('« lieu.val-cendre »')
		expect(mauvaisEspace[0].message).toContain(DELTAS.donner_objet.label)
		expect(mauvaisEspace[0].entityId).toBe('lieu.val-cendre')

		const malFormee = validateDelta({ delta: 'donner_objet', cibles: ['OBJET.Clef'] }, SITE)

		expect(codes(malFormee)).toEqual(['identifiant-invalide'])
	})

	it('ne RESOUT aucune reference — la propriete que sa docstring affirme', () => {
		// KR-169, et même frontière que `validateExpr` : `validateDelta` connaît
		// `DELTAS`, donc la FORME d'une cible ; elle ne connaît pas `collectIds`, donc
		// l'EXISTENCE de l'entité. Sans cette séparation, `deltas.ts` importerait le
		// document entier pour valider un effet, et deux modules sauraient résoudre.
		expect(validateDelta({ delta: 'donner_objet', cibles: ['objet.ceci-n-existe-nulle-part'] }, SITE)).toEqual([])

		// Et elle n'importe ni n'appelle le résolveur — propriété structurelle qu'aucune
		// assertion de comportement ne montrerait.
		const enPositionDeCode = /\bcollectIds\s*\(|import[^}]*\bcollectIds\b/
		expect(enPositionDeCode.test(source('deltas.ts'))).toBe(false)
		expect(enPositionDeCode.test("import { collectIds } from './identifiers'")).toBe(true)
	})

	it('deltas.ts n importe ni expr.ts ni predicates.ts ni types.ts', () => {
		// Deux registres FRÈRES ne se dépendent pas : `SiteDelta` est recopié de
		// `SiteExpr`, extraction au troisième. Et l'ordre des modules reste acyclique —
		// c'est `types.ts` qui importe `Delta`, jamais l'inverse.
		const deltas = source('deltas.ts')

		expect(deltas).not.toMatch(/from\s+['"]\.\/expr['"]/)
		expect(deltas).not.toMatch(/from\s+['"]\.\/predicates['"]/)
		expect(deltas).not.toMatch(/from\s+['"]\.\/types['"]/)
		// Discriminant : l'arête inverse, elle, existe bien.
		expect(source('types.ts')).toMatch(/from\s+['"]\.\/deltas['"]/)
	})

	it('validateDelta est totale : du bruit ne leve jamais et rend des anomalies redigees', () => {
		const bruit: unknown[] = [
			undefined,
			null,
			42,
			'du texte',
			'',
			[],
			[EFFET],
			true,
			{},
			{ delta: 42, cibles: [] },
			{ delta: 'donner_objet' },
			{ delta: 'donner_objet', cibles: 'objet.clef-de-basalte' },
			{ delta: 'donner_objet', cibles: [42] },
			{ delta: 'donner_objet', cibles: [null] },
			{ delta: '', cibles: [] },
			{ op: 'predicat', predicat: 'possede_objet', cibles: ['objet.clef-de-basalte'] },
			// LES CLÉS DE LA CHAÎNE DE PROTOTYPES (BUG-053). La question à se poser en
			// remplissant une liste de bruit n'est pas « cette valeur est-elle absurde ? »
			// mais « par quelle porte le registre peut-il répondre oui à une clé que
			// personne n'y a mise ? ».
			{ delta: 'toString', cibles: [] },
			{ delta: 'constructor', cibles: ['objet.clef-de-basalte'] },
			{ delta: '__proto__', cibles: ['objet.clef-de-basalte'] },
			{ delta: 'hasOwnProperty', cibles: 'du texte' },
		]

		for (const valeur of bruit) {
			expect(() => validateDelta(valeur, SITE)).not.toThrow()

			const issues = validateDelta(valeur, SITE)

			expect(issues.length).toBeGreaterThan(0)
			for (const issue of issues) {
				expect(issue.severity).toBe('error')
				expect(issue.message.length).toBeGreaterThan(0)
				expect(issue.path).toBe(SITE.path)
				expect(issue.location).toBe(SITE.location)
				for (const fuite of FUITES_TECHNIQUES) {
					expect(issue.message.toLowerCase()).not.toContain(fuite)
				}
			}
		}
	})
})

describe('collectDeltaRefs', () => {
	it('collecte chaque cible avec son espace ATTENDU et son effet porteur', () => {
		expect(collectDeltaRefs({ delta: 'reveler_indice', cibles: ['indice.sceau-brise'] })).toEqual([
			{ id: 'indice.sceau-brise', espace: 'indice', delta: 'reveler_indice' },
		])

		// Le champ `delta` est requis par le message de `reference-pendante`, qui nomme
		// l'effet par son `label` : sans lui, `validate.ts` relirait l'effet pour le
		// retrouver — une seconde lecture, donc une seconde vérité.
		const refs = collectDeltaRefs({ delta: 'atteindre_jalon', cibles: ['jalon.premiere-nuit'] })

		expect(refs).toHaveLength(1)
		expect(DELTAS[refs[0].delta].label).toBe('marque le jalon atteint')
	})

	it('rend une liste vide sur du bruit et n est appelee que si validateDelta est vide', () => {
		const bruit: unknown[] = [
			undefined,
			null,
			42,
			'du texte',
			[],
			{},
			{ delta: 'gagner_xp' },
			{ delta: 'donner_objet' },
		]

		for (const valeur of bruit) {
			expect(() => collectDeltaRefs(valeur)).not.toThrow()
			expect(collectDeltaRefs(valeur)).toEqual([])
		}

		// La SECONDE moitié de la propriété — « appelée seulement si `validateDelta`
		// n'a rien produit » — est une règle du seul appelant, donc elle se lit dans sa
		// source, comme celle de `collectRefs`.
		const validate = source('validate.ts')
		const garde = validate.indexOf('if (malForme.length > 0) {')
		const appel = validate.indexOf('collectDeltaRefs(effet)')

		expect(garde).toBeGreaterThan(-1)
		expect(appel).toBeGreaterThan(garde)
	})
})
