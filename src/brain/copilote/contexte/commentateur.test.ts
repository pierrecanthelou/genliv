import fs from 'node:fs'
import path from 'node:path'
import { BESTIARY } from '../../bestiary'
import { healthState } from '../../characteristics'
import type { HitQuality } from '../../combat'
import { MARQUEUR_A_ECRIRE } from '../../dossier/amorce'
import type { IssueCombat } from '../../dossier/session'
import type { Dossier } from '../../dossier/types'
import { PREFIXE_BESTIAIRE } from '../../dossier/validate'
import type { CibleCommentateur, ProjectionAssaut } from '../types'
import { assemblerCommentateur, BUDGET_CARACTERES_COMMENTATEUR, palierDeSante } from './commentateur'

/**
 * `assemblerCommentateur` — LE CONTEXTE INJECTÉ AU ONZIÈME RÔLE (R5, n° 13 `moteur-combat`, it3,
 * lot `contrat`, § 4 bis du plan).
 *
 * LES DOSSIERS SONT LUS DU DISQUE, jamais fabriqués pour les cas nominaux — précédent
 * `arbitre.test.ts`. Les cas limites (canon absent, canon surdimensionné) en dérivent.
 *
 * ⚠ LES MOTS DE LA TABLE (« en pleine forme », « un coup franc »…) SONT LE VOCABULAIRE QUE LE
 * MODÈLE LIT : ils sont épinglés valeur par valeur ci-dessous, parce qu'un mot changé change ce
 * que le modèle comprend sans qu'aucun type ne rougisse. Ce vocabulaire est de la PRÉSENTATION
 * — aucune section de `docs/REGLES-DU-JEU.md` ne le porte, et la table dorée ne le couvre pas.
 */

const CHEMIN_REFERENCE = path.join(__dirname, '..', '..', 'dossier', '__fixtures__', 'dossier-reference.json')
const CHEMIN_MINIMAL = path.join(__dirname, '..', '..', 'dossier', '__fixtures__', 'dossier-minimal.json')

function lire(chemin: string): Dossier {
	return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
}

function lireReference(): Dossier {
	return lire(CHEMIN_REFERENCE)
}

/** Le MÊME dossier sans le moindre mot de canon à injecter — ce qui reste du texte assemblé est
 *  alors le bloc `ASSAUT` SEUL. */
function sansCanon(dossier: Dossier): Dossier {
	return { ...dossier, canon: { ...dossier.canon, ton: '', interdits_ton: [] } }
}

const PROJECTION: ProjectionAssaut = {
	vainqueur: 'heros',
	qualite: 'franc',
	monstre: 'bestiaire.gobelin',
	heroPv: 17,
	heroPvMax: 20,
	monstrePv: 3,
	monstrePvMax: 7,
}

function cible(surcharges: Partial<ProjectionAssaut> = {}): CibleCommentateur {
	return { role: 'commentateur', projection: { ...PROJECTION, ...surcharges } }
}

/** Le texte assemblé, ou un échec LISIBLE — jamais un `!` sur une union. */
function texteDe(dossier: Dossier, c: CibleCommentateur): string {
	const contexte = assemblerCommentateur(dossier, c)
	if (!contexte.ok) throw new Error(`refusé (${contexte.motif})`)
	return contexte.texte
}

/** Les ENSEMBLES FERMÉS, dérivés par COMPILATION : un membre ajouté ou retiré fait échouer
 *  `tsc` ici, jamais un test oublié (KR-117/199). */
const QUALITES: Record<HitQuality, true> = { rate: true, erafle: true, franc: true, magistral: true, critique: true }
const ISSUES: Record<Exclude<IssueCombat, 'hero-fled'>, true> = {
	'hero-victory': true,
	'monster-fled': true,
	'hero-survived-unconscious': true,
	'hero-mort': true,
}
const VAINQUEURS: Record<ProjectionAssaut['vainqueur'], true> = { heros: true, monstre: true, nul: true }
const TOUTES_LES_QUALITES = Object.keys(QUALITES) as HitQuality[]
const TOUTES_LES_ISSUES = Object.keys(ISSUES) as Array<Exclude<IssueCombat, 'hero-fled'>>
const TOUS_LES_VAINQUEURS = Object.keys(VAINQUEURS) as Array<ProjectionAssaut['vainqueur']>

describe('palierDeSante — les trois seuils de presentation, aux DEUX bornes de chacun', () => {
	it('palier plein au-dessus de 50 pour cent : 51 sur 100 est plein', () => {
		expect(palierDeSante(51, 100, 'inconscient')).toBe('plein')
	})

	it('palier blesse a 50 pour cent : 50 sur 100 est blesse, jamais plein', () => {
		expect(palierDeSante(50, 100, 'inconscient')).toBe('blesse')
	})

	it('palier blesse a 25 pour cent : 25 sur 100 est blesse, jamais critique', () => {
		expect(palierDeSante(25, 100, 'inconscient')).toBe('blesse')
	})

	it('palier critique sous 25 pour cent : 24 sur 100 est critique', () => {
		expect(palierDeSante(24, 100, 'inconscient')).toBe('critique')
	})

	it('palier critique a 1 pv : 1 sur 100 est critique, jamais ecroule', () => {
		expect(palierDeSante(1, 100, 'inconscient')).toBe('critique')
	})

	it('palier inconscient a 0 : 0 sur 100 est la marche du heros, et en dessous aussi', () => {
		expect(palierDeSante(0, 100, 'inconscient')).toBe('inconscient')
		expect(palierDeSante(-1, 100, 'inconscient')).toBe('inconscient')
		expect(palierDeSante(-40, 100, 'inconscient')).toBe('inconscient')
	})

	it('palier vaincu : la MEME marche porte le mot de l adversaire, et le mot passe est rendu tel quel', () => {
		expect(palierDeSante(0, 7, 'vaincu')).toBe('vaincu')
		expect(palierDeSante(-3, 7, 'vaincu')).toBe('vaincu')
		// Le paramètre ne change QUE le mot de la dernière marche : au-dessus, jamais.
		expect(palierDeSante(1, 7, 'vaincu')).toBe('critique')
		expect(palierDeSante(1, 7, 'inconscient')).toBe('critique')
	})

	it('les seuils tiennent sur des maxima qui ne sont PAS 100 : aucun pourcentage figé en entier', () => {
		// [pv, pvMax, palier attendu] — chaque ligne est calculée à la main, sur un maximum
		// distinct, en `pv / pvMax` : 4/7 = 57 % plein, 3/7 = 43 % blesse, 2/7 = 29 % blesse,
		// 1/7 = 14 % critique ; 4/8 = 50 % blesse, 5/8 plein ; 2/8 = 25 % blesse, 1/8 critique ;
		// 15/30 = 50 % blesse, 16/30 plein ; 8/30 = 27 % blesse, 7/30 = 23 % critique ;
		// 10/21 = 48 % blesse, 11/21 = 52 % plein ; 6/21 = 29 % blesse, 5/21 = 24 % critique.
		const cas: Array<[number, number, string]> = [
			[4, 7, 'plein'],
			[3, 7, 'blesse'],
			[2, 7, 'blesse'],
			[1, 7, 'critique'],
			[4, 8, 'blesse'],
			[5, 8, 'plein'],
			[2, 8, 'blesse'],
			[1, 8, 'critique'],
			[15, 30, 'blesse'],
			[16, 30, 'plein'],
			[8, 30, 'blesse'],
			[7, 30, 'critique'],
			[10, 21, 'blesse'],
			[11, 21, 'plein'],
			[6, 21, 'blesse'],
			[5, 21, 'critique'],
		]
		for (const [pv, pvMax, attendu] of cas) {
			expect(`${pv}/${pvMax} → ${palierDeSante(pv, pvMax, 'inconscient')}`).toBe(`${pv}/${pvMax} → ${attendu}`)
		}
	})

	it('balayage exhaustif de 1 a 40 de maximum : l oracle independant DIVISE, l implementation ne divise pas', () => {
		// L'oracle compare `pv / pvMax` aux seuils 0,5 et 0,25 — exact en IEEE aux deux bornes
		// (une division par 2 ou 4 est sans arrondi). L'implémentation compare `pv × 2` et
		// `pv × 4` à `pvMax` : deux écritures, un seul résultat.
		let compte = 0
		for (let pvMax = 1; pvMax <= 40; pvMax += 1) {
			for (let pv = -3; pv <= pvMax; pv += 1) {
				const rapport = pv / pvMax
				const attendu = pv <= 0 ? 'ecroule' : rapport > 0.5 ? 'plein' : rapport >= 0.25 ? 'blesse' : 'critique'
				expect(`${pv}/${pvMax} → ${palierDeSante(pv, pvMax, 'ecroule')}`).toBe(`${pv}/${pvMax} → ${attendu}`)
				compte += 1
			}
		}
		// Discriminant : le balayage a bien parcouru des centaines de couples (KR-199).
		expect(compte).toBeGreaterThan(800)
	})

	it('cross-check avec healthState : inconscient ssi le moteur ne dit plus ok, pour toute caracteristique CA', () => {
		// « à terre » pour ce module (pv ≤ 0) VAUT « pas `ok` » pour le moteur (`healthState` rend
		// `inconscient` ou `mort`) — quelle que soit la volonté CA du héros (§ 1 de
		// `docs/REGLES-DU-JEU.md` : inconscient à PV ≤ 0, mort à PV ≤ −CA).
		let compte = 0
		for (let CA = 1; CA <= 12; CA += 1) {
			for (let pv = -15; pv <= 30; pv += 1) {
				const ecroule = palierDeSante(pv, 20, 'inconscient') === 'inconscient'
				const pasOk = healthState(pv, CA) !== 'ok'
				expect(`CA ${CA}, pv ${pv} → ${ecroule}`).toBe(`CA ${CA}, pv ${pv} → ${pasOk}`)
				compte += 1
			}
		}
		expect(compte).toBe(12 * 46)
		// Discriminants : les DEUX valeurs de vérité sont bien atteintes de chaque côté.
		expect(palierDeSante(0, 20, 'inconscient') === 'inconscient').toBe(true)
		expect(palierDeSante(1, 20, 'inconscient') === 'inconscient').toBe(false)
		expect(healthState(0, 3) !== 'ok').toBe(true)
		expect(healthState(1, 3) !== 'ok').toBe(false)
	})
})

describe('assemblerCommentateur — le contenu injecte, dans l ordre du plan it3 § 4 bis', () => {
	it('le texte entier, mot pour mot, sur la reference : canon puis ASSAUT, un seul separateur', () => {
		const texte = texteDe(lireReference(), cible())

		expect(texte).toBe(
			[
				'canon.ton\nsec et méfiant',
				'canon.interdits_ton[]\naucun anachronisme\naucune vulgarité',
				[
					'ASSAUT',
					'adversaire : Gobelin',
					'vainqueur : le héros',
					'coup : un coup franc',
					'état du héros : en pleine forme',
					"état de l'adversaire : blessé",
				].join('\n'),
			].join('\n\n'),
		)
	})

	it('le canon est ABSENT quand ni ton ni interdits_ton ne sont ecrits, et le texte commence par ASSAUT', () => {
		const texte = texteDe(sansCanon(lireReference()), cible())

		expect(texte).not.toContain('canon.ton')
		expect(texte).not.toContain('canon.interdits_ton')
		expect(texte.startsWith('ASSAUT\n')).toBe(true)
	})

	it('le canon entre QUAND il est ecrit, un bloc par chemin, chacun SEUL quand l autre est absent', () => {
		const reference = lireReference()
		const tonSeul = texteDe({ ...reference, canon: { ...reference.canon, interdits_ton: [] } }, cible())
		const interditsSeuls = texteDe({ ...reference, canon: { ...reference.canon, ton: '' } }, cible())

		expect(tonSeul.startsWith('canon.ton\nsec et méfiant\n\nASSAUT\n')).toBe(true)
		expect(tonSeul).not.toContain('canon.interdits_ton')
		expect(interditsSeuls.startsWith('canon.interdits_ton[]\naucun anachronisme\naucune vulgarité\n\nASSAUT\n')).toBe(
			true,
		)
		expect(interditsSeuls).not.toContain('canon.ton')
	})

	it('un ton MARQUE est retire, jamais injecte : le silence, pas une affirmation', () => {
		const reference = lireReference()
		const marque = {
			...reference,
			canon: { ...reference.canon, ton: `${MARQUEUR_A_ECRIRE} le ton`, interdits_ton: [] },
		}

		const texte = texteDe(marque, cible())

		expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
		expect(texte).not.toContain('canon.ton')
		expect(texte.startsWith('ASSAUT\n')).toBe(true)
	})

	it('le texte est DETERMINISTE : deux assemblages, un seul texte', () => {
		const dossier = lireReference()

		expect(texteDe(dossier, cible())).toBe(texteDe(dossier, cible()))
	})

	it.each(TOUS_LES_VAINQUEURS)('le vainqueur %s a son mot, et lui seul', (vainqueur) => {
		const mots: Record<ProjectionAssaut['vainqueur'], string> = {
			heros: 'vainqueur : le héros',
			monstre: "vainqueur : l'adversaire",
			nul: 'vainqueur : aucun des deux',
		}
		const texte = texteDe(
			sansCanon(lireReference()),
			cible({ vainqueur, qualite: vainqueur === 'nul' ? null : 'franc' }),
		)

		expect(texte).toContain(mots[vainqueur])
		for (const [autre, mot] of Object.entries(mots)) {
			if (autre !== vainqueur) expect(`${autre} → ${texte.includes(mot)}`).toBe(`${autre} → false`)
		}
	})

	it.each(TOUTES_LES_QUALITES)('la qualite %s a son mot sur la ligne coup', (qualite) => {
		const mots: Record<HitQuality, string> = {
			rate: 'coup : manqué',
			erafle: 'coup : une éraflure',
			franc: 'coup : un coup franc',
			magistral: 'coup : un coup magistral',
			critique: 'coup : un coup critique',
		}

		const texte = texteDe(sansCanon(lireReference()), cible({ qualite }))

		expect(texte).toContain(`\n${mots[qualite]}\n`)
		// Un SEUL mot de coup par texte — jamais deux lignes `coup`.
		expect(texte.match(/^coup : /gm) ?? []).toHaveLength(1)
	})

	it('a l egalite (qualite null) la ligne coup est ABSENTE, pas vide ni remplacee', () => {
		const texte = texteDe(sansCanon(lireReference()), cible({ vainqueur: 'nul', qualite: null }))

		expect(texte).not.toContain('coup')
		expect(texte).toContain('vainqueur : aucun des deux')
	})

	it('l etat du heros prend ses QUATRE mots selon sa sante, et celui de l adversaire les siens', () => {
		const dossier = sansCanon(lireReference())
		// [pv, mot attendu] sur un maximum de 20 : 11 plein, 10 blesse, 5 blesse, 4 critique, 0 à terre.
		const heros: Array<[number, string]> = [
			[11, 'état du héros : en pleine forme'],
			[10, 'état du héros : blessé'],
			[5, 'état du héros : blessé'],
			[4, 'état du héros : à bout de forces'],
			[0, 'état du héros : inconscient'],
		]
		const adversaire: Array<[number, string]> = [
			[11, "état de l'adversaire : en pleine forme"],
			[10, "état de l'adversaire : blessé"],
			[5, "état de l'adversaire : blessé"],
			[4, "état de l'adversaire : à bout de forces"],
			[0, "état de l'adversaire : vaincu"],
		]

		for (const [pv, mot] of heros) {
			expect(`héros ${pv} → ${texteDe(dossier, cible({ heroPv: pv, heroPvMax: 20 })).includes(mot)}`).toBe(
				`héros ${pv} → true`,
			)
		}
		for (const [pv, mot] of adversaire) {
			expect(`adversaire ${pv} → ${texteDe(dossier, cible({ monstrePv: pv, monstrePvMax: 20 })).includes(mot)}`).toBe(
				`adversaire ${pv} → true`,
			)
		}
		// Les deux camps sont INDÉPENDANTS : un héros à terre ne rend pas l'adversaire vaincu.
		const croise = texteDe(dossier, cible({ heroPv: 0, heroPvMax: 20, monstrePv: 20, monstrePvMax: 20 }))
		expect(croise).toContain('état du héros : inconscient')
		expect(croise).toContain("état de l'adversaire : en pleine forme")
		expect(croise).not.toContain('vaincu')
	})

	it('l issue est ABSENTE hors cloture, et porte son mot propre a chacune des quatre issues', () => {
		const dossier = sansCanon(lireReference())
		const mots: Record<Exclude<IssueCombat, 'hero-fled'>, string> = {
			'hero-victory': "issue : l'adversaire est terrassé",
			'monster-fled': "issue : l'adversaire prend la fuite",
			'hero-survived-unconscious': "issue : le héros sombre dans l'inconscience mais survit",
			'hero-mort': 'issue : le héros est mort',
		}

		expect(texteDe(dossier, cible())).not.toContain('issue')
		for (const issue of TOUTES_LES_ISSUES) {
			const texte = texteDe(dossier, cible({ issue }))
			expect(`${issue} → ${texte.endsWith(`\n${mots[issue]}`)}`).toBe(`${issue} → true`)
			expect(texte.match(/^issue : /gm) ?? []).toHaveLength(1)
		}
	})

	it('la fuite du heros n est PAS representable : hero-fled est refuse par le type, jamais commente', () => {
		// @ts-expect-error — `'hero-fled'` est exclu de `ProjectionAssaut.issue` (KR-297)
		const fuite: ProjectionAssaut = { ...PROJECTION, issue: 'hero-fled' }
		expect(fuite.issue).toBe('hero-fled')
	})

	it('le nom de CHAQUE monstre du bestiaire est resolu depuis sa reference, jamais envoye comme reference', () => {
		const dossier = sansCanon(lireReference())

		expect(BESTIARY.length).toBeGreaterThan(20)
		for (const monstre of BESTIARY) {
			const reference = `${PREFIXE_BESTIAIRE}${monstre.templateId}`
			const texte = texteDe(dossier, cible({ monstre: reference }))

			expect(`${reference} → ${texte.includes(`adversaire : ${monstre.name}\n`)}`).toBe(`${reference} → true`)
			// La RÉFÉRENCE elle-même et son identifiant ne sortent jamais.
			expect(texte).not.toContain(PREFIXE_BESTIAIRE)
			expect(texte).not.toContain(String(monstre.templateId))
		}
	})

	it('cible-a-ecrire : un NOM (celui que lot feature serait tente de passer) n est pas une reference', () => {
		const dossier = lireReference()
		const refuses = [
			'Gobelin',
			'gobelin',
			'bestiaire.',
			'bestiaire.inconnu',
			'bestiaire.toString',
			'',
			'Bestiaire.gobelin',
		]

		for (const monstre of refuses) {
			expect(`${monstre} → ${JSON.stringify(assemblerCommentateur(dossier, cible({ monstre })))}`).toBe(
				`${monstre} → ${JSON.stringify({ ok: false, motif: 'cible-a-ecrire' })}`,
			)
		}
		// Discriminant : la MÊME cible avec une référence valide n'est pas refusée.
		expect(assemblerCommentateur(dossier, cible({ monstre: 'bestiaire.gobelin' })).ok).toBe(true)
	})

	it('le texte ne porte AUCUNE donnee du dossier hors canon.ton et canon.interdits_ton[] — confinement', () => {
		const dossier = lireReference()
		const texte = texteDe(dossier, cible())

		// Toute chaîne du monde, de la charpente et du reste du canon, d'au moins huit
		// caractères : aucune ne doit se retrouver dans le texte.
		const feuilles: string[] = []
		const parcourir = (valeur: unknown): void => {
			if (typeof valeur === 'string') {
				if (valeur.length >= 8) feuilles.push(valeur)
			} else if (Array.isArray(valeur)) valeur.forEach(parcourir)
			else if (typeof valeur === 'object' && valeur !== null) Object.values(valeur).forEach(parcourir)
		}
		parcourir(dossier.monde)
		parcourir(dossier.charpente)
		parcourir(dossier.canon.mj)
		parcourir(dossier.canon.partage)
		parcourir(dossier.canon.objectifs)

		// Discriminant : le balayage a de quoi mordre (KR-199).
		expect(feuilles.length).toBeGreaterThan(100)
		expect(feuilles.filter((feuille) => texte.includes(feuille))).toEqual([])
		// … et il SAURAIT détecter une fuite : le ton, lui, est bien injecté.
		expect(texte.includes(dossier.canon.ton)).toBe(true)
		expect(`${texte} ${feuilles[0]}`.includes(feuilles[0])).toBe(true)
	})
})

describe('assemblerCommentateur — aucun chiffre dans le contexte (KR-294, critere de recevabilite du lot)', () => {
	// Quatre PV bruts sur un maximum de 20 — un par palier (à terre, critique, blessé, plein), tous
	// à un ou deux chiffres : ce sont les nombres que le fil ne doit JAMAIS porter.
	const ASSEZ_DE_PV: Array<[number, number]> = [
		[-8, 20],
		[1, 20],
		[5, 20],
		[17, 20],
	]

	it('aucun chiffre dans le contexte : le texte du cas nominal, avec des PV bruts a deux chiffres en entree', () => {
		const texte = texteDe(lireReference(), cible({ heroPv: 17, heroPvMax: 20, monstrePv: 3, monstrePvMax: 7 }))

		expect(/\d/.test(texte)).toBe(false)
		// Discriminant : les PV bruts SONT bien dans l'entrée, donc l'absence est un travail
		// de l'assembleur et non un hasard de la projection.
		expect(cible().projection.heroPv).toBe(17)
		expect(cible().projection.heroPvMax).toBe(20)
	})

	it('aucun chiffre sur TOUT l espace des entrees : chaque monstre, vainqueur, coup, couple de sante, issue, sur les deux fixtures', () => {
		let compte = 0
		const dossiers = [lireReference(), lire(CHEMIN_MINIMAL)]
		const issues: Array<Exclude<IssueCombat, 'hero-fled'> | undefined> = [undefined, ...TOUTES_LES_ISSUES]
		const qualites: Array<HitQuality | null> = [null, ...TOUTES_LES_QUALITES]
		for (const dossier of dossiers) {
			for (const monstre of BESTIARY) {
				const reference = `${PREFIXE_BESTIAIRE}${monstre.templateId}`
				for (const vainqueur of TOUS_LES_VAINQUEURS) {
					for (const qualite of qualites) {
						for (const [heroPv, heroPvMax] of ASSEZ_DE_PV) {
							for (const [monstrePv, monstrePvMax] of ASSEZ_DE_PV) {
								for (const issue of issues) {
									const projection: ProjectionAssaut = {
										vainqueur,
										qualite,
										monstre: reference,
										heroPv,
										heroPvMax,
										monstrePv,
										monstrePvMax,
										...(issue === undefined ? {} : { issue }),
									}
									const contexte = assemblerCommentateur(dossier, { role: 'commentateur', projection })
									if (!contexte.ok) throw new Error(`refusé (${contexte.motif}) pour ${reference}`)
									if (/\d/.test(contexte.texte)) throw new Error(`chiffre dans : ${contexte.texte}`)
									compte += 1
								}
							}
						}
					}
				}
			}
		}
		// Discriminant : 2 dossiers × tous les monstres × 3 vainqueurs × 6 coups (dont l'absence) ×
		// 4 × 4 santés × 5 issues (dont l'absence) ont été balayés (KR-199).
		expect(compte).toBe(2 * BESTIARY.length * 3 * 6 * ASSEZ_DE_PV.length * ASSEZ_DE_PV.length * 5)
	})

	it('le balayage SAIT voir un chiffre : un ton d auteur qui en porte un le laisse passer, et c est le SEUL chemin', () => {
		// L'invariant porte sur ce que l'ASSEMBLEUR ajoute (la projection) : la prose d'un auteur
		// qui écrit « années vingt » avec des chiffres est SA prose, injectée telle quelle. Ce
		// témoin prouve que la regex du balayage détecte bien un chiffre quand il y en a un.
		const reference = lireReference()
		const avecChiffre = { ...reference, canon: { ...reference.canon, ton: 'les années 20, sec et méfiant' } }

		expect(/\d/.test(texteDe(avecChiffre, cible()))).toBe(true)
		expect(/\d/.test(texteDe(sansCanon(avecChiffre), cible()))).toBe(false)
	})
})

describe('assemblerCommentateur — le budget, calcule : un terme dossier mesure et un terme projection exact', () => {
	/** La FIGURE DU PIRE CAS de la projection : toutes les valeurs de chaque table fermée, tous
	 *  les monstres du bestiaire, la ligne `coup` ET la ligne `issue` présentes. */
	function longueurMaximaleDeLaProjection(): number {
		const dossier = sansCanon(lireReference())
		const issues: Array<Exclude<IssueCombat, 'hero-fled'> | undefined> = [undefined, ...TOUTES_LES_ISSUES]
		const qualites: Array<HitQuality | null> = [null, ...TOUTES_LES_QUALITES]
		// Quatre PV sur un maximum de 20 qui atteignent chacun des quatre paliers.
		const pv = [0, 1, 5, 11]
		let max = 0
		for (const monstre of BESTIARY) {
			for (const vainqueur of TOUS_LES_VAINQUEURS) {
				for (const qualite of qualites) {
					for (const heroPv of pv) {
						for (const monstrePv of pv) {
							for (const issue of issues) {
								const projection: ProjectionAssaut = {
									vainqueur,
									qualite,
									monstre: `${PREFIXE_BESTIAIRE}${monstre.templateId}`,
									heroPv,
									heroPvMax: 20,
									monstrePv,
									monstrePvMax: 20,
									...(issue === undefined ? {} : { issue }),
								}
								max = Math.max(max, texteDe(dossier, { role: 'commentateur', projection }).length)
							}
						}
					}
				}
			}
		}
		return max
	}

	/** M — les blocs de canon (en-têtes et séparateur interne compris), RE-MESURÉS depuis la
	 *  fixture par l'assembleur lui-même : `avec canon` moins `sans canon` moins le séparateur. */
	function mesureDuCanon(dossier: Dossier): number {
		return texteDe(dossier, cible()).length - texteDe(sansCanon(dossier), cible()).length - '\n\n'.length
	}

	it('M est RE-MESURE depuis les deux fixtures : 83 sur la reference, 85 sur le minimal', () => {
		expect(mesureDuCanon(lireReference())).toBe(83)
		expect(mesureDuCanon(lire(CHEMIN_MINIMAL))).toBe(85)
	})

	it('BUDGET = terme dossier (ceil(3 M / 1000) x 1000) + separateur + pire projection, tous exacts', () => {
		const M = Math.max(mesureDuCanon(lireReference()), mesureDuCanon(lire(CHEMIN_MINIMAL)))
		const termeDossier = Math.ceil((3 * M) / 1000) * 1000
		const projectionMax = longueurMaximaleDeLaProjection()

		expect(termeDossier).toBe(1000)
		// LE PIRE CAS DE LA PROJECTION est calculé EXACTEMENT : 216 caractères, atteints.
		expect(projectionMax).toBe(216)
		expect(BUDGET_CARACTERES_COMMENTATEUR).toBe(termeDossier + '\n\n'.length + projectionMax)
		expect(BUDGET_CARACTERES_COMMENTATEUR).toBe(1218)
	})

	it('le nom le plus long du bestiaire porte la borne, et il vient du REGISTRE, jamais d un champ libre', () => {
		const plusLong = BESTIARY.reduce((long, monstre) => (monstre.name.length > long.name.length ? monstre : long))

		expect(plusLong.name).toBe('Araignée géante')
		expect(plusLong.name).toHaveLength(15)
		// Ce nom EST dans le pire cas : le texte le plus long le contient.
		const texte = texteDe(sansCanon(lireReference()), cible({ monstre: `${PREFIXE_BESTIAIRE}${plusLong.templateId}` }))
		expect(texte).toContain(`adversaire : ${plusLong.name}\n`)
	})

	it('trop-long : un canon surdimensionne fait refuser le contexte, AVANT tout fetch', () => {
		const reference = lireReference()
		const enorme = { ...reference, canon: { ...reference.canon, ton: 'x'.repeat(BUDGET_CARACTERES_COMMENTATEUR) } }

		expect(assemblerCommentateur(enorme, cible())).toEqual({ ok: false, motif: 'trop-long' })
	})

	it('trop-long a l unite : exactement BUDGET caracteres passe, un de plus est refuse', () => {
		const reference = lireReference()
		const assaut = texteDe(sansCanon(reference), cible()).length
		// `canon.ton\n` (10) + le ton + `\n\n` (2) + l'assaut.
		const tonExact = BUDGET_CARACTERES_COMMENTATEUR - 'canon.ton\n'.length - '\n\n'.length - assaut
		const dossier = (n: number): Dossier => ({
			...reference,
			canon: { ...reference.canon, ton: 'x'.repeat(n), interdits_ton: [] },
		})

		const juste = assemblerCommentateur(dossier(tonExact), cible())
		expect(juste.ok).toBe(true)
		if (juste.ok) expect(juste.texte.length).toBe(BUDGET_CARACTERES_COMMENTATEUR)
		expect(assemblerCommentateur(dossier(tonExact + 1), cible())).toEqual({ ok: false, motif: 'trop-long' })
	})

	it('le canon des fixtures ne coute presque rien : la pire projection avec le pire canon reste sous la borne', () => {
		const reference = lireReference()
		const pire = cible({
			monstre: `${PREFIXE_BESTIAIRE}araignee-geante`,
			vainqueur: 'nul',
			qualite: 'magistral',
			heroPv: 0,
			heroPvMax: 20,
			monstrePv: 5,
			monstrePvMax: 20,
			issue: 'hero-survived-unconscious',
		})
		const contexte = assemblerCommentateur(reference, pire)

		expect(contexte.ok).toBe(true)
		if (contexte.ok) expect(contexte.texte.length).toBeLessThan(BUDGET_CARACTERES_COMMENTATEUR)
	})

	it('l ordre des refus : une reference pendante est refusee AVANT la longueur, meme canon surdimensionne', () => {
		const reference = lireReference()
		const enorme = { ...reference, canon: { ...reference.canon, ton: 'x'.repeat(BUDGET_CARACTERES_COMMENTATEUR) } }

		expect(assemblerCommentateur(enorme, cible({ monstre: 'bestiaire.inconnu' }))).toEqual({
			ok: false,
			motif: 'cible-a-ecrire',
		})
	})

	it('seuls DEUX refus sont atteignables, jamais a-ecrire ni aucun-candidat : aucun champ requis, aucun ensemble a epuiser', () => {
		const reference = lireReference()
		const dossierVide = sansCanon({
			...reference,
			monde: { ...reference.monde, personnages: [], lieux: [], indices: [] },
		})

		// Même un monde VIDE n'en refuse aucun : le commentateur n'en lit rien.
		expect(assemblerCommentateur(dossierVide, cible()).ok).toBe(true)
	})
})

describe('contexte/commentateur.ts — ce que sa source interdit', () => {
	const SOURCE = fs
		.readFileSync(path.join(__dirname, 'commentateur.ts'), 'utf8')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^[ \t]*\/\/.*$/gm, '')

	it('aucun nom de champ du heros ni de journal : la projection est la SEULE entree, jamais .text ni .log', () => {
		// `.text` ET `.log` s'ancrent sur la FIN DU MOT : `.texte` n'est pas `.text`.
		const interdits = [/\.text\b/, /\.log\b/, /heros\./, /heroName/, /EtatSession/]
		for (const interdit of interdits) {
			expect(`${String(interdit)} → ${interdit.test(SOURCE)}`).toBe(`${String(interdit)} → false`)
		}
		// Discriminants : chaque motif SERAIT détecté s'il apparaissait.
		const intrus = 'x.text x.log heros.pv heroName EtatSession'
		for (const interdit of interdits) {
			expect(`${String(interdit)} → ${interdit.test(`${SOURCE} ${intrus}`)}`).toBe(`${String(interdit)} → true`)
		}
		// Discriminant : ce balayage lit bien du code (il voit la projection).
		expect(SOURCE).toContain('projection.heroPv')
	})

	it('aucun chiffre en dur dans une table de mots ni un en-tete : le balayage de la source porte sur les LITTERAUX', () => {
		const litteraux = [...SOURCE.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`\n]*)`/g)].map(
			(trouve) => trouve[1] ?? trouve[2] ?? trouve[3] ?? '',
		)

		expect(litteraux.length).toBeGreaterThan(30)
		// Les gabarits de ligne portent `${…}`, jamais un chiffre ; `'\n\n'` n'en porte pas non plus.
		expect(litteraux.filter((litteral) => /\d/.test(litteral))).toEqual([])
	})

	it('le palier ne divise jamais : aucune division dans le corps de palierDeSante', () => {
		const debut = SOURCE.indexOf('export function palierDeSante')
		const corps = SOURCE.slice(debut, SOURCE.indexOf('\n}\n', debut))

		expect(corps.length).toBeGreaterThan(50)
		expect(corps).not.toMatch(/\//)
	})
})
