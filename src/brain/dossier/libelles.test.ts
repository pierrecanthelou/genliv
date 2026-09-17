import fs from 'node:fs'
import path from 'node:path'
import { CHAMPS_PROPOSABLES, type ChampProseChemin } from '../copilote/types'
import { DESTINATION_DES_CHAMPS } from './destinations'
import { LIBELLE_DES_CHAMPS, type CheminLibelle } from './libelles'

const RACINE_SRC = path.join(__dirname, '..', '..')
const BLOC_IDENTITE = path.join(RACINE_SRC, 'features', 'dossier-fiches', 'components', 'BlocIdentite.tsx')
const PANNEAU_CANON = path.join(RACINE_SRC, 'features', 'dossier-canon', 'components', 'PanneauCanon.tsx')
const REGISTRE = path.join(__dirname, 'libelles.ts')

const CHEMINS = Object.keys(LIBELLE_DES_CHAMPS) as CheminLibelle[]

/** Tous les fichiers TypeScript de `src/`, SAUF les tests — un test a le droit de
 *  nommer une chaîne d'écran pour l'interroger, c'est même son métier (précédent
 *  `amorce.test.ts`). `path.join` partout, pour tenir sous Windows (KR-215). */
function fichiersDeSource(racine: string): string[] {
	const trouves: string[] = []
	for (const entree of fs.readdirSync(racine, { withFileTypes: true })) {
		const complet = path.join(racine, entree.name)
		if (entree.isDirectory()) {
			if (entree.name !== 'tests' && entree.name !== '__fixtures__') trouves.push(...fichiersDeSource(complet))
			continue
		}
		if (!entree.name.endsWith('.ts') && !entree.name.endsWith('.tsx')) continue
		if (entree.name.endsWith('.test.ts') || entree.name.endsWith('.test.tsx')) continue
		trouves.push(complet)
	}
	return trouves
}

function porteursDe(litteral: string): string[] {
	return fichiersDeSource(RACINE_SRC)
		.filter((fichier) => fs.readFileSync(fichier, 'utf8').includes(litteral))
		.sort()
}

describe('LIBELLE_DES_CHAMPS — le registre lui-meme', () => {
	it('quatre entrees, pas une de plus', () => {
		// PARTIEL PAR CONSTRUCTION : ce n'est PAS `destinations.ts`, il n'y a aucune
		// garde d'exhaustivité. N'entre ici qu'un champ nommé par un écran qui n'est
		// pas sa fiche d'origine ET réellement atteignable par une branche de code.
		expect(CHEMINS).toHaveLength(4)
		expect(CHEMINS.sort()).toEqual(
			[
				'canon.ton',
				'monde.personnages[].apparence',
				'monde.personnages[].description_joueur',
				'monde.personnages[].fonction',
			].sort(),
		)
	})

	it('les quatre paires sont les chaines EXACTES des fiches d origine', () => {
		// ÉPINGLAGE VALEUR PAR VALEUR. L'extraction est PURE : aucune chaîne n'a été
		// reformulée, ni suffixée, ni mise en phrase. Si l'une d'elles doit changer un
		// jour, c'est ici qu'elle change — et les deux fiches suivent, puisqu'elles la
		// lisent.
		expect(LIBELLE_DES_CHAMPS['monde.personnages[].fonction']).toEqual({
			libelle: 'FONCTION',
			hint: 'interne — jamais lu par le joueur',
		})
		expect(LIBELLE_DES_CHAMPS['monde.personnages[].apparence']).toEqual({
			libelle: 'APPARENCE',
			hint: 'interne — jamais lu par le joueur — décrit, ne chiffre pas : la force se règle aux caractéristiques',
		})
		expect(LIBELLE_DES_CHAMPS['monde.personnages[].description_joueur']).toEqual({
			libelle: 'DESCRIPTION JOUEUR',
			hint: 'lue par le joueur',
		})
		expect(LIBELLE_DES_CHAMPS['canon.ton']).toEqual({
			libelle: 'TON',
			hint: 'interne — consigne injectée au modèle',
		})
	})

	it('chaque entree nomme un champ REEL du schema, d audience ia', () => {
		// Une ligne dont le chemin n'existe pas dans la table des destinations ne
		// nomme rien : elle survivrait à la raison qui l'a créée (KR-235).
		const sansDestination = CHEMINS.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== 'ia').map(
			(chemin) => `${chemin} → ${DESTINATION_DES_CHAMPS[chemin] ?? 'AUCUNE DESTINATION'}`,
		)
		expect(sansDestination).toEqual([])
	})

	it('les trois champs proposables ont tous leur libelle', () => {
		// C'est ce qui rend « tout champ proposé a un nom d'écran » vrai sans branche
		// de repli — le panneau Copilote n'a jamais à rendre une clé technique.
		const proposables = Object.keys(CHAMPS_PROPOSABLES) as ChampProseChemin[]
		expect(proposables.filter((chemin) => LIBELLE_DES_CHAMPS[chemin] === undefined)).toEqual([])
	})
})

describe('LIBELLE_DES_CHAMPS — le veto d encapsulation', () => {
	it('chaque fiche d origine ne retape plus les chaines des champs qu elle a cedes', () => {
		/**
		 * LE VETO SE DÉCLENCHE À LA PREMIÈRE RECOPIE, et il porte sur le couple
		 * (fichier, champ cédé) — jamais sur « les huit chaînes dans les deux
		 * fichiers ». Le raccourci serait FAUX, mesuré : `PanneauCanon.tsx` porte
		 * encore `lue par le joueur`, mais pour ACCROCHE JOUEUR, un AUTRE champ, qui
		 * reste inline et intouché. Une garde qui confond « la même chaîne » et « le
		 * même champ » fait rougir un code sain.
		 */
		const cedes: ReadonlyArray<readonly [string, readonly CheminLibelle[]]> = [
			[
				BLOC_IDENTITE,
				['monde.personnages[].fonction', 'monde.personnages[].apparence', 'monde.personnages[].description_joueur'],
			],
			[PANNEAU_CANON, ['canon.ton']],
		]

		for (const [fichier, chemins] of cedes) {
			const source = fs.readFileSync(fichier, 'utf8')
			const chaines = chemins.flatMap((chemin) => [LIBELLE_DES_CHAMPS[chemin].libelle, LIBELLE_DES_CHAMPS[chemin].hint])
			const recopiees = chaines.filter((chaine) => source.includes(`'${chaine}'`) || source.includes(`"${chaine}"`))
			expect(`${path.basename(fichier)} → ${JSON.stringify(recopiees)}`).toBe(`${path.basename(fichier)} → []`)
		}
	})

	it('et les deux fiches LISENT bien le registre, au lieu de ne rien rendre', () => {
		// Discriminant du test précédent : sans cette ligne, supprimer les trois
		// `Field` de la fiche le rendrait vert. Un vide passe toute interdiction.
		for (const fichier of [BLOC_IDENTITE, PANNEAU_CANON]) {
			const source = fs.readFileSync(fichier, 'utf8')
			expect(`${path.basename(fichier)} → ${source.includes('LIBELLE_DES_CHAMPS')}`).toBe(
				`${path.basename(fichier)} → true`,
			)
		}
	})

	it('aucun fichier de src ne retape un des quatre libelles en prop label', () => {
		// La forme surveillée est la PROP, pas le mot : « FONCTION » apparaît en prose
		// dans des commentaires du dépôt, et une garde qui rougit sur de la prose est
		// désactivée dans le mois. `label="TON"` ailleurs qu'ici serait, lui, une
		// seconde source du nom d'écran.
		for (const chemin of CHEMINS) {
			const prop = `label="${LIBELLE_DES_CHAMPS[chemin].libelle}"`
			expect(`${prop} → ${JSON.stringify(porteursDe(prop).map((f) => path.basename(f)))}`).toBe(`${prop} → []`)
		}
	})

	it('les deux qualificatifs UNIQUES ne vivent que dans le registre', () => {
		// Ces deux-là n'avaient qu'un porteur AVANT la promotion, et n'en ont qu'un
		// APRÈS : l'unicité est donc assertable, et elle l'est.
		for (const chemin of ['monde.personnages[].apparence', 'canon.ton'] as CheminLibelle[]) {
			const hint = LIBELLE_DES_CHAMPS[chemin].hint
			expect(`${chemin} → ${JSON.stringify(porteursDe(hint).map((f) => path.basename(f)))}`).toBe(
				`${chemin} → ${JSON.stringify([path.basename(REGISTRE)])}`,
			)
		}
	})

	it('les deux qualificatifs de FAMILLE ne sont PAS uniques, et c est mesure', () => {
		/**
		 * LA LIMITE DU VETO, écrite plutôt que passée sous silence.
		 *
		 * « chaque chaîne vit ici et nulle part ailleurs » est FAUX de deux des huit
		 * chaînes, et c'est mesuré, pas supposé : `interne — jamais lu par le joueur`
		 * et `lue par le joueur` sont des qualificatifs de FAMILLE, portés par
		 * plusieurs fiches qui n'ont aucun rapport avec le copilote (les trois proses
		 * d'un lieu, les lignes rouges d'un caractère, la description d'un objet,
		 * la formulation d'un indice, l'accroche du canon…).
		 *
		 * Asserter leur unicité ferait rougir un code SAIN au premier champ interne
		 * ajouté, et le correctif évident serait de modifier le témoin : une garde qui
		 * apprend à modifier son témoin est PIRE que pas de garde (KR-235). Ce qui est
		 * gardé est donc l'invariant vrai — les deux fiches PROMUES ne les redisent
		 * plus (test ci-dessus) — et ce test-ci EXISTE pour que personne ne croie
		 * l'unicité acquise.
		 */
		for (const chemin of [
			'monde.personnages[].fonction',
			'monde.personnages[].description_joueur',
		] as CheminLibelle[]) {
			const porteurs = porteursDe(LIBELLE_DES_CHAMPS[chemin].hint)
			expect(porteurs).toContain(REGISTRE)
			expect(porteurs.length).toBeGreaterThan(1)
		}
	})
})
