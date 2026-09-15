import fs from 'node:fs'
import path from 'node:path'
import type { BadgeTone } from '../components/Badge'
import { CONTROLES, type NiveauControle } from './controles'
import { badgeSection, pastilleNiveau } from './pastilles'
import { SANS_COMPTE, SECTIONS } from './sections'

/**
 * LE RENDU D'UN NIVEAU, ÉPROUVÉ AU CONTRAT ET NULLE PART AILLEURS.
 *
 * ⚠ POURQUOI AUCUN TEST DE TEINTE AU RENDU N'EXISTE DANS CE DÉPÔT, ici ni dans
 * les suites de composants : `toHaveStyle({ color: 'var(--bad)' })` PASSE sur un
 * `Badge tone="muted"` — mesuré et reproduit. `cssstyle`, le CSSOM de jsdom,
 * valide `color` contre une grammaire typée et rejette silencieusement un jeton
 * `var(--x)` ; `element.style.color` retombe à `''`, et `toHaveStyle` repassant
 * les deux côtés par le même moteur, ils s'effondrent tous deux sur la chaîne
 * vide. L'instrument est CASSÉ, pas absent : il rend un vert qui ne dépend pas
 * de ce qu'on lui demande. Conséquence tenue ici — le `tone` est épinglé sur une
 * CHAÎNE rendue par une fonction pure, jamais sur un style calculé, et les vues
 * sont gardées par des sondes de source.
 *
 * Et c'est la raison d'être du retour `{ texte, tone }` en un seul appel : un
 * retour unique permet de pincer les deux moitiés ENSEMBLE, donc de supprimer
 * toute divergence possible au site d'appel.
 */

const MODULE_DOSSIER = __dirname
const RACINE_SRC = path.join(MODULE_DOSSIER, '..', '..')

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

/**
 * La source PRIVÉE DE SES COMMENTAIRES — même fonction que `deltas.test.ts`.
 * Sans elle, le balayage du porteur unique serait rouge sur de la PROSE : cinq
 * docstrings de `dossier/types.ts` écrivent « BLOQUANTE à l'import » pour dire
 * ce qu'une référence pendante déclenche, et celle de `pastilles.ts` elle-même
 * écrit « — · BLOQUANT » pour dire ce que la règle d'élision INTERDIT. Une règle
 * qui empêcherait d'écrire un mot empêcherait aussi d'expliquer pourquoi.
 */
function enPositionDeCode(texte: string): string {
	return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

/**
 * LES TROIS MOTS ET LES TROIS TONS, écrits ici DEPUIS LE CONTRAT DE DESIGN (§ 3
 * du plan d'itération 2) — jamais recopiés depuis ce que le code rend.
 *
 * `Record` TOTAL sur `NiveauControle`, et c'est le SEUL balayage possible : la
 * table réelle est PRIVÉE à `pastilles.ts` par contrat, donc aucun registre
 * runtime n'énumère les trois niveaux. L'exhaustivité est portée PAR LA
 * COMPILATION — un quatrième niveau ne compile pas ici tant qu'il n'a pas sa
 * ligne, ce qui interdit l'énumération échantillonnée (KR-117 / KR-199).
 */
const ATTENDU_PAR_NIVEAU: Record<NiveauControle, { texte: string; tone: BadgeTone }> = {
	bloquant: { texte: 'BLOQUANT', tone: 'bad' },
	alerte: { texte: 'ALERTE', tone: 'neutral' },
	info: { texte: 'INFO', tone: 'muted' },
}

/** Les trois niveaux, balayés depuis la table — jamais trois appels nommés. */
const NIVEAUX = Object.keys(ATTENDU_PAR_NIVEAU) as NiveauControle[]

interface EtatBadge {
	/** Le rang de l'état dans la table du § 3 — il NOMME l'échec. */
	numero: number
	compte: string
	niveau: NiveauControle | null
	attendu: { texte: string; tone: BadgeTone }
}

/**
 * LES SEPT ÉTATS QUE `badgeSection` PRODUIT, mot pour mot depuis la table du § 3
 * du plan. Les états 8 et 9 ne sont pas des appels de cette fonction : ils sont
 * éprouvés séparément, plus bas, dans le même test.
 *
 * LES ÉTATS 4, 6 ET 7 N'ONT AUCUNE RÈGLE VIVANTE QUI LES PRODUISE — aucune règle
 * d'it1 ni d'it2 n'atteint une section à compte réel. C'est ICI, et seulement
 * ici, qu'ils sont prouvés ; it3 les livrera bout-en-bout.
 */
const ETATS_APPELABLES: readonly EtatBadge[] = [
	// 1 — Section saine, compte réel : le badge d'aujourd'hui, INCHANGÉ.
	{ numero: 1, compte: '6 fiches', niveau: null, attendu: { texte: '6 fiches', tone: 'muted' } },
	// 2 — Section saine, sans compte : le tiret reste, INCHANGÉ. Jamais une coche
	// verte ni « 0 anomalie » — un voyant tautologiquement vert est sans information.
	{ numero: 2, compte: SANS_COMPTE, niveau: null, attendu: { texte: '—', tone: 'muted' } },
	// 3 — Bloquant sans compte : Départ, aujourd'hui. Le PREMIER rendu de production.
	{ numero: 3, compte: SANS_COMPTE, niveau: 'bloquant', attendu: { texte: 'BLOQUANT', tone: 'bad' } },
	// 4 — Bloquant avec compte : aucune règle vivante ne le produit (it3).
	{ numero: 4, compte: '3 fiches', niveau: 'bloquant', attendu: { texte: '3 fiches · BLOQUANT', tone: 'bad' } },
	// 5 — Alerte seule sans compte : Canon, aujourd'hui.
	{ numero: 5, compte: SANS_COMPTE, niveau: 'alerte', attendu: { texte: 'ALERTE', tone: 'neutral' } },
	// 6 — Alerte avec compte : aucune règle vivante ne le produit (it3).
	{ numero: 6, compte: '12 fiches', niveau: 'alerte', attendu: { texte: '12 fiches · ALERTE', tone: 'neutral' } },
	// 7 — Info seule : IDENTIQUE EN TON à une section saine, distinct PAR LE MOT
	// SEUL. C'est l'état qui interdit de ne prouver le niveau que par la teinte.
	{ numero: 7, compte: '4 fiches', niveau: 'info', attendu: { texte: '4 fiches · INFO', tone: 'muted' } },
]

describe('pastilleNiveau, le mot seul', () => {
	it('les trois niveaux rendent leur mot et leur ton', () => {
		// Le balayage porte sur les CLÉS de la table, jamais sur trois appels
		// littéraux : la longueur est épinglée pour que l'échantillonnage soit
		// visible s'il survenait (KR-199, énumération échantillonnée).
		expect(NIVEAUX).toHaveLength(3)

		for (const niveau of NIVEAUX) {
			// Le niveau entre dans les DEUX côtés de l'égalité : un échec dit quel
			// niveau a dérivé, plutôt que « 'bad' attendu 'muted' » sur le troisième.
			expect({ niveau, ...pastilleNiveau(niveau) }).toEqual({ niveau, ...ATTENDU_PAR_NIVEAU[niveau] })
		}

		// DISCRIMINANCE (KR-199) — la table ci-dessus est exhaustive par compilation,
		// mais rien ne la relierait au LINTER si on s'arrêtait là : tout niveau qu'une
		// règle du registre peut réellement émettre doit avoir son mot. Le jour où une
		// règle déclare un quatrième niveau, ce test rougit avant l'écran.
		const emis = new Set(Object.values(CONTROLES).flatMap((descripteur) => [...descripteur.niveaux]))

		expect(emis.size).toBeGreaterThan(0)
		for (const niveau of emis) expect(NIVEAUX).toContain(niveau)
	})
})

describe('badgeSection, le badge de la navigation', () => {
	it('les neuf etats du badge de section', () => {
		// Sept états de la table, `{ texte, tone }` comparé EN BLOC : un ton juste
		// sur un texte faux — ou l'inverse — ne peut pas passer.
		expect(ETATS_APPELABLES).toHaveLength(7)
		for (const etat of ETATS_APPELABLES) {
			expect({ etat: etat.numero, ...badgeSection(etat.compte, etat.niveau) }).toEqual({
				etat: etat.numero,
				...etat.attendu,
			})
		}

		// 8 — PLUSIEURS NIVEAUX MÊLÉS : le pire SEUL, jamais une liste de mots. La
		// fonction ne reçoit qu'UN niveau parce que `RapportControles.parSection` ne
		// porte que lui — la comparaison de gravité vit dans `controles.ts` et nulle
		// part ailleurs (KR-013). Ce qui s'éprouve ici, c'est qu'aucun autre mot ne
		// s'invite dans le badge du pire.
		const pire = badgeSection('2 fiches', 'bloquant')

		expect(pire.texte).toBe('2 fiches · BLOQUANT')
		expect(pire.texte).not.toContain(ATTENDU_PAR_NIVEAU.alerte.texte)
		expect(pire.texte).not.toContain(ATTENDU_PAR_NIVEAU.info.texte)

		// 9 — L'ENTRÉE « CONTRÔLES » NE PORTE AUCUN BADGE, et c'est vrai par
		// CONSTRUCTION plutôt que par discipline de vue : le second landmark de la
		// navigation n'est pas une section du registre, donc aucun `badgeSection` ne
		// peut être calculé pour lui — il n'a ni `compte()` ni entrée dans `SECTIONS`.
		expect(SECTIONS).toHaveLength(10)
		expect(SECTIONS.map((section) => String(section.id))).not.toContain('controles')
	})

	it('le mot remplace le tiret, il ne s y ajoute jamais', () => {
		// LE DISCRIMINANT DE LA RÈGLE D'ÉLISION. Sans lui, une concaténation
		// mécanique rendrait « — · BLOQUANT » — un badge dont la moitié gauche ne dit
		// rien — et ce serait le PREMIER rendu de production : les deux sections que
		// les règles vivantes allument sont exactement les deux sans compte.
		const badge = badgeSection(SANS_COMPTE, 'bloquant')

		expect(badge.texte).toBe('BLOQUANT')
		expect(badge.texte).not.toContain(SANS_COMPTE)

		// Les trois niveaux élident, pas seulement le bloquant — balayés, jamais
		// trois appels nommés.
		for (const niveau of NIVEAUX) {
			expect({ niveau, texte: badgeSection(SANS_COMPTE, niveau).texte }).toEqual({
				niveau,
				texte: ATTENDU_PAR_NIVEAU[niveau].texte,
			})
		}

		// DEUX SONDES DE DISCRIMINANCE, sans lesquelles l'assertion ci-dessus serait
		// verte pour la mauvaise raison. (a) Le tiret n'est pas mangé PARTOUT : sans
		// niveau, il reste — c'est l'état d'une section saine, inchangé. (b) L'élision
		// ne mange QUE le tiret : un compte réel, lui, survit au mot, séparateur
		// compris. Une implémentation qui supprimerait toujours le compte passerait la
		// première assertion et échouerait ici.
		expect(badgeSection(SANS_COMPTE, null).texte).toBe(SANS_COMPTE)
		expect(badgeSection('3 fiches', 'bloquant').texte).toBe('3 fiches · BLOQUANT')
	})
})

describe('le porteur unique du couple mot + teinte', () => {
	it('porteur unique des trois mots de niveau dans src', () => {
		// LE MOT N'EST PAS RECOPIÉ ICI : il est lu AU CONTRAT, comme `amorce.test.ts`
		// importe sa marque au lieu de l'écrire. C'est ce qui permet d'attendre UN
		// SEUL porteur plutôt que deux — le test qui prouve l'unicité ne peut pas être
		// lui-même une seconde copie.
		// LES TROIS MOTS, jamais un seul : le nom de ce `describe` parle du COUPLE
		// mot + teinte, et le veto du plan vise « toute table Record<NiveauControle,
		// …> subsistant dans un fichier de feature ». Une copie partielle — `alerte`
		// et `info` seuls — passerait un balayage limité à `BLOQUANT` (KR-199, une
		// énumération échantillonnée à 1 sur 3).
		const MOTS = NIVEAUX.map((niveau) => pastilleNiveau(niveau).texte)

		// Les fichiers de test sont EXCLUS, et c'est la contrepartie assumée : ils
		// épinglent des valeurs, ils ne les décident pas. `panneauControles.test.tsx`
		// cherche le mot rendu à l'écran, celui-ci le lit au contrat.
		const porteurs = fichiersTypeScript(RACINE_SRC)
			.filter((fichier) => !/\.test\.tsx?$/.test(fichier))
			.filter((fichier) => {
				const code = enPositionDeCode(fs.readFileSync(fichier, 'utf8'))
				return MOTS.some((mot) => code.includes(mot))
			})
			.map((fichier) => path.relative(RACINE_SRC, fichier))

		// ÉGALITÉ, jamais une inclusion ni une allow-list sur-ensemble : c'est CE LOT
		// qui rend l'égalité tenable, en migrant `ListeControles.tsx` sur la primitive
		// le jour même où elle naît. Sans cette migration, l'extraction n'aurait rien
		// extrait — deux tables vivraient, invisibles au lint (c'est une copie, pas un
		// import), et elles divergeraient au premier renommage.
		//
		// ⚠ Chemin construit par `path.join`, jamais écrit à la barre oblique :
		// `path.relative` rend des séparateurs NATIFS et ce dépôt tourne aussi sous
		// Windows (KR-215).
		expect(porteurs).toEqual([path.join('brain', 'dossier', 'pastilles.ts')])
	})

	it('SANS_COMPTE ne sort pas du baril', () => {
		const baril = fs.readFileSync(path.join(RACINE_SRC, 'brain', 'index.ts'), 'utf8')

		// Même règle que `MARQUEUR_A_ECRIRE` : la constante est exportée de son module
		// pour UN consommateur nommé — `pastilles.ts`, qui l'utilise pour élider —, pas
		// pour les vues. Aucune vue ne COMPARE un compte, elles les rendent : le jour
		// où l'une voudrait le faire, elle devra supprimer ce test, c'est-à-dire
		// prendre la décision au lieu de la subir. L'assertion porte sur le TEXTE BRUT
		// du baril, commentaires compris — une prose qui la nommerait la ferait sortir
		// dans la tête du prochain lecteur, ce qui est exactement ce qu'on refuse.
		expect(baril).not.toContain('SANS_COMPTE')

		// DISCRIMINANCE (KR-199) : sans ces trois lignes, l'assertion serait verte si
		// le fichier lu était vide ou si le chemin était faux. Le baril est bien celui
		// qui sort les deux fonctions de rendu, et il n'en sort que celles-là.
		expect(baril).toContain('pastilleNiveau')
		expect(baril).toContain('badgeSection')
		expect(baril).toContain('dossier/pastilles')
	})
})
