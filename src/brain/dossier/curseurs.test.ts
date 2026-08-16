import fs from 'node:fs'
import path from 'node:path'
import {
	CURSEURS,
	CURSEURS_INITIAUX,
	CURSEUR_MAX,
	CURSEUR_MIN,
	CURSEUR_VALUES,
	PARLER_REPLIQUES,
	type AffiniteCurseur,
	type CurseurId,
} from './curseurs'
import { CHARACTERISTICS } from '../characteristics'

/**
 * LE GARDE DU REGISTRE DES CURSEURS — un test KR-117 classique, et c'est
 * exactement ce que KR-193 prescrit : `CURSEURS` est une donnée de PRÉSENTATION,
 * pas une règle de jeu (si le registre disparaissait, aucun jet ne changerait de
 * résultat, seule une prose changerait). Donc :
 *  · AUCUNE valeur n'est à chercher dans `docs/REGLES-DU-JEU.md` — il n'y en a
 *    aucune, et il ne doit pas y en avoir tant qu'aucun code ne calcule depuis
 *    `affinite` ;
 *  · ce fichier n'est PAS une table dorée et ne double pas `rules.golden.test.ts` ;
 *  · le score de mutation ne le concerne pas (KR-161).
 *
 * Ce qu'il épingle, donc : l'exhaustivité dérivée, les deux bornes nommées, le
 * mapping d'affinités tranché AU CADRAGE (`src/features/dossier-fiches/specification.json`,
 * `plan.design_contract.curseurs_registre`), et la CLAUSE de non-import de KR-193,
 * qui ne se porte ni par le typage ni par une docstring (KR-169) — elle se lit
 * dans la source.
 */

const MODULE_DOSSIER = __dirname
const SOURCE_CURSEURS = path.join(MODULE_DOSSIER, 'curseurs.ts')

/** Les spécificateurs de tout `import … from '…'` d'un fichier source. */
function specificateursImportes(chemin: string): string[] {
	const source = fs.readFileSync(chemin, 'utf8')
	return [...source.matchAll(/from\s+'([^']+)'/g)].map((occurrence) => occurrence[1])
}

/**
 * Les NOMS liés par les imports accolades d'un fichier source. Un symbole qu'un
 * fichier n'importe pas, il ne peut pas le lire — c'est ce qui rend ce relevé
 * immunisé aux mentions en COMMENTAIRE, lesquelles sont légitimes (une absence
 * délibérée mérite d'être expliquée là où on la chercherait).
 */
function nomsImportes(chemin: string): string[] {
	const source = fs.readFileSync(chemin, 'utf8')
	return [...source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'[^']+'/g)].flatMap((occurrence) =>
		occurrence[1]
			.split(',')
			.map((nom) => nom.replace(/^\s*type\s+/, '').trim())
			.filter((nom) => nom !== ''),
	)
}

describe('curseurs', () => {
	it('CURSEUR_VALUES est derive de CURSEURS, et chaque descripteur est complet', () => {
		// L'exhaustivité ne se prouve pas en re-listant six littéraux (KR-117/KR-199) :
		// elle se balaie DEPUIS le registre. Le typage `Record<CurseurId, …>` interdit
		// déjà une clé manquante ET une clé de trop à la compilation ; ce qu'il ne dit
		// pas, c'est qu'aucun descripteur n'est à moitié rempli.
		expect(CURSEUR_VALUES).toEqual(Object.keys(CURSEURS))
		expect(CURSEUR_VALUES.length).toBeGreaterThan(0)
		// Aucun doublon : `CURSEUR_VALUES` est l'ordre d'affichage de la grille, et une
		// clé répétée y rendrait deux fois le même Stepper.
		expect(new Set(CURSEUR_VALUES).size).toBe(CURSEUR_VALUES.length)

		const incomplets = CURSEUR_VALUES.filter(
			(id) => CURSEURS[id].label.trim() === '' || CURSEURS[id].describe.trim() === '',
		)

		expect(incomplets).toEqual([])
		// Deux curseurs de même libellé seraient indistinguables à l'écran, la clé
		// n'étant jamais affichée.
		expect(new Set(CURSEUR_VALUES.map((id) => CURSEURS[id].label)).size).toBe(CURSEUR_VALUES.length)
	})

	it('le mapping des affinites est celui du cadrage, et les trois valeurs sont des cles de CHARACTERISTICS', () => {
		// LA VALEUR VIENT DU CADRAGE DE LA FEATURE, jamais du code qu'elle garde :
		// `src/features/dossier-fiches/specification.json`, `plan.design_contract.curseurs_registre`
		// — « Mapping tranché par ce cadrage (KR-193) : CA←{courage,loyaute},
		// IN←{mefiance,franchise}, IG←{verve,cupidite} ». Ce n'est PAS une règle de jeu
		// (aucune section de `docs/REGLES-DU-JEU.md` ne la porte, et il ne doit pas y en
		// avoir une), donc l'arbitrage écrit est ici la seule source.
		//
		// Épinglé par `Object.entries`, mapping COMPLET et non échantillonné (KR-199) :
		// une entrée dont l'affinité basculerait ferait rougir la ligne qui la nomme.
		const AFFINITES_DU_CADRAGE: Record<CurseurId, AffiniteCurseur> = {
			mefiance: 'IN',
			franchise: 'IN',
			courage: 'CA',
			cupidite: 'IG',
			loyaute: 'CA',
			verve: 'IG',
		}

		expect(Object.fromEntries(Object.entries(CURSEURS).map(([id, d]) => [id, d.affinite]))).toEqual(
			AFFINITES_DU_CADRAGE,
		)

		// LES TROIS LITTÉRAUX SONT DES CLÉS VALIDES DE `CHARACTERISTICS` — et c'est CE
		// TEST qui relie les deux registres, jamais un import (KR-193, clause vérifiée
		// par le test suivant). Une affinité mal orthographiée (« CAR ») rendrait une
		// parenthèse muette au libellé du Stepper sans que rien ne le dise.
		const inconnues = CURSEUR_VALUES.map((id) => CURSEURS[id].affinite).filter(
			(affinite) => !Object.prototype.hasOwnProperty.call(CHARACTERISTICS, affinite),
		)

		expect(inconnues).toEqual([])
		// Discriminant (BUG-053) : `hasOwnProperty` et non `in` — sans lui, une affinité
		// valant « toString » passerait pour une caractéristique existante.
		expect(Object.prototype.hasOwnProperty.call(CHARACTERISTICS, 'toString')).toBe(false)
		// Discriminant : les trois affinités sont réellement les trois, et non une seule
		// répétée — sans cette ligne, un registre tout à `CA` satisferait ce qui précède.
		expect(new Set(CURSEUR_VALUES.map((id) => CURSEURS[id].affinite)).size).toBe(3)
	})

	it('curseurs.ts n importe rien de characteristics, challenge, combat ni xp', () => {
		// LA CLAUSE DE KR-193, et elle ne se porte ni par le typage ni par une docstring
		// (KR-169) : `affinite` typé `Characteristic` compilerait parfaitement. Elle se
		// lit donc dans la SOURCE. Ce qu'elle protège : tant qu'aucun code ne calcule un
		// modificateur numérique depuis `affinite`, ce registre reste une donnée de
		// présentation — hors score de mutation, hors table dorée. Un import vers la
		// couche des règles ferait entrer ce fichier dans le rayon de tout travail sur
		// les caractéristiques, et la phrase ci-dessus deviendrait fausse en silence.
		const MODULES_INTERDITS = ['characteristics', 'challenge', 'combat', 'xp']
		const specificateurs = specificateursImportes(SOURCE_CURSEURS)

		const fautifs = specificateurs.filter((specificateur) =>
			MODULES_INTERDITS.some((module) => specificateur === `../${module}` || specificateur.endsWith(`/${module}`)),
		)

		expect(fautifs).toEqual([])
		// Discriminant de l'INSTRUMENT (KR-199) : le relevé sait réellement voir un
		// import. Sans cette ligne, une expression régulière qui ne trouve jamais rien
		// rendrait le test vert sur un fichier qui importerait tout.
		const temoin = specificateursImportes(path.join(MODULE_DOSSIER, 'tables.ts'))

		expect(temoin).toContain('../characteristics')
		expect(
			temoin.filter((specificateur) =>
				MODULES_INTERDITS.some((module) => specificateur === `../${module}` || specificateur.endsWith(`/${module}`)),
			).length,
		).toBeGreaterThan(0)
	})

	it('les bornes sont nommees, non signees, et CURSEURS_INITIAUX les derive', () => {
		// Les bornes sont des constantes NOMMÉES (KR-165) : ni le `min`/`max` du Stepper
		// ni la table de validation ne réécrivent 0 et 10.
		expect(CURSEUR_MIN).toBeLessThan(CURSEUR_MAX)
		// ÉCHELLE NON SIGNÉE, contrairement à `INTENSITE_MIN` : `0` est une EXTRÉMITÉ,
		// pas un point neutre entre deux contraires — c'est ce qui interdit le `prefix`
		// signé sur le Stepper qui la règle.
		expect(CURSEUR_MIN).toBe(0)

		// LA VALEUR SEMÉE À L'ÉCRITURE est DÉRIVÉE du registre × la borne, jamais six
		// littéraux : le jour où un septième curseur existerait, une liste recopiée
		// écrirait un bloc à six clés que le validateur refuserait aussitôt.
		expect(CURSEURS_INITIAUX).toEqual(Object.fromEntries(CURSEUR_VALUES.map((id) => [id, CURSEUR_MIN])))
		expect(Object.keys(CURSEURS_INITIAUX)).toEqual(CURSEUR_VALUES)
	})

	it('PARLER_REPLIQUES est une borne d INTERFACE : le SSOT ne la lit nulle part', () => {
		// LE POINT DE CONTRAT DU RAFFINAGE (désaccords #3 et #7), et il est ÉCRIT EN
		// NÉGATIF : il n'existe aucun mécanisme de cardinalité au schéma 1, et en
		// inventer un ferait d'un document déjà écrit un document refusé. L'écran cesse
		// d'offrir le bouton d'ajout à cette borne ; l'import, lui, accepte tout — c'est
		// `validate.test.ts` qui le prouve à la limite et à limite+1 (KR-165).
		//
		// Une propriété affirmée en docstring est une intention, pas un contrat
		// (KR-169) : celle-ci se lit dans la source des DEUX fichiers qui pourraient la
		// trahir — le validateur et ses tables. Le relevé porte sur ce qu'ils IMPORTENT,
		// jamais sur le texte brut : un symbole non importé ne peut pas être lu, et une
		// mention en commentaire (celle qui explique l'absence de ligne dans
		// `LISTES_OPTIONNELLES_STRUCTUREES`) est légitime là où on la chercherait.
		const NOM = ['PARLER', '_REPLIQUES'].join('')

		expect(nomsImportes(path.join(MODULE_DOSSIER, 'validate.ts'))).not.toContain(NOM)
		expect(nomsImportes(path.join(MODULE_DOSSIER, 'tables.ts'))).not.toContain(NOM)
		// Discriminant de l'INSTRUMENT (KR-199) : le relevé sait réellement lire les noms
		// importés — sans ces lignes, une expression régulière qui ne rend jamais rien
		// laisserait passer l'import qu'on interdit ici.
		expect(nomsImportes(path.join(MODULE_DOSSIER, 'tables.ts'))).toContain('CURSEUR_MAX')
		expect(nomsImportes(path.join(MODULE_DOSSIER, 'validate.ts'))).toContain('ENUMERES_FERMES')
		// La borne reste une constante NOMMÉE malgré tout (KR-165) : une borne non
		// outillée n'existe pas, et c'est le budget de contexte du modèle qui en dépend.
		expect(PARLER_REPLIQUES).toBeGreaterThan(0)
	})
})
