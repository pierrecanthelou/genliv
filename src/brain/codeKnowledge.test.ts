import fs from 'node:fs'
import path from 'node:path'

/**
 * LE REGISTRE DES RISQUES CONNUS SE TIENT PAR UN TEST, PAS PAR LA DISCIPLINE.
 *
 * `code-knowledge.json` est le SEUL fichier lu EN ENTIER avant d'ecrire du code
 * (CLAUDE.md). Rien ne verifiait jusqu'ici qu'il soit a jour : les 19 KR qui lui
 * manquaient — dont DEUX que personne n avait comptes — y ont manque pendant
 * trois iterations sans qu'une seule porte rougisse. Chacune des six assertions ci-dessous ferme un defaut que le
 * depot a REELLEMENT paye — jamais une precaution theorique :
 *
 *  1. un id cite dans une spec mais jamais mirrore (19, dont KR-184/185) ;
 *  2. une renumerotation d id, que l archivage et la scission rendent possible ;
 *  3. une scission qui casse un JSON en silence (BUG-086) ;
 *  4. BUG-074 archive par erreur alors que son correctif reste a faire ;
 *  5. un id BUG reemploye parce qu il a ete pris dans UN fichier et non dans les
 *     neuf (BUG-062, BUG-123). NEUF depuis la scission du 2026-09-24
 *     (`bug_history.moteur-dossier.json`) — le glob la prend seul, seul le
 *     PLANCHER se releve a la main, et il ne redescend jamais.
 *
 * PERIMETRE DERIVE DU DISQUE (precedents maison : `lintIsolation.test.ts`,
 * `moteurSansIA.test.ts`). Une liste ecrite a la main exempterait en silence
 * tout fichier neuf — et la scission du 2026-09-24 a justement ajoute
 * `code-knowledge.arbre-condamne.json` : le glob le prend sans qu on y touche.
 * D ou aussi les PLANCHERS DE NON-VACUITE : sans eux, un glob qui cesse de
 * matcher laisse l instrument vert sur une liste vide (BUG-084).
 *
 * `path.join` partout, jamais un litteral a barres obliques : le depot tourne
 * aussi sous Windows (KR-215).
 */

const RACINE = path.join(__dirname, '..', '..')
const FEATURES = path.join(RACINE, 'src', 'features')

/** Mesures du 2026-09-24. Les planchers gardent la mesure, pas le chiffre exact. */
const PLANCHER_FICHIERS_REGISTRE = 2
const PLANCHER_FICHIERS_BUGS = 9
const PLANCHER_SPECS = 13
const PLANCHER_IDS_KR = 150
const PLANCHER_IDS_BUG = 100
const PLANCHER_RENVOIS = 40

/**
 * `code-knowledge.json` porte un BOM UTF-8 et `JSON.parse` leve dessus (seul
 * `require()` le retire). Le retirer ICI, au seul point de lecture, evite de
 * redecouvrir la panne a chaque nouvel appelant.
 */
function lireJson(chemin: string): unknown {
	const texte = fs.readFileSync(chemin, 'utf-8')
	return JSON.parse(texte.charCodeAt(0) === 0xfeff ? texte.slice(1) : texte)
}

function fichiersDeLaRacine(motif: RegExp): string[] {
	return fs
		.readdirSync(RACINE)
		.filter((nom) => motif.test(nom))
		.sort()
		.map((nom) => path.join(RACINE, nom))
}

const FICHIERS_REGISTRE = fichiersDeLaRacine(/^code-knowledge.*\.json$/)
const FICHIERS_BUGS = fichiersDeLaRacine(/^bug_history.*\.json$/)
const FICHIERS_FEATURES = fichiersDeLaRacine(/^features_history.*\.json$/)

function specifications(): { feature: string; chemin: string }[] {
	return fs
		.readdirSync(FEATURES, { withFileTypes: true })
		.filter((entree) => entree.isDirectory())
		.map((entree) => ({
			feature: entree.name,
			chemin: path.join(FEATURES, entree.name, 'specification.json'),
		}))
		.filter(({ chemin }) => fs.existsSync(chemin))
		.sort((a, b) => a.feature.localeCompare(b.feature))
}

/** Tous les ids KR, toutes bandes, sur TOUS les `code-knowledge*.json`. */
function idsDuRegistre(): string[] {
	return FICHIERS_REGISTRE.flatMap((chemin) => {
		const doc = lireJson(chemin) as { known_risks?: { id?: string }[] }
		return (doc.known_risks ?? []).map((entree) => String(entree.id))
	})
}

/** Tous les ids BUG, sur TOUS les `bug_history*.json`. */
function idsDesBugs(): { id: string; fichier: string }[] {
	return FICHIERS_BUGS.flatMap((chemin) => {
		const doc = lireJson(chemin) as { bugs?: { id?: string }[] }
		return (doc.bugs ?? []).map((entree) => ({
			id: String(entree.id),
			fichier: path.basename(chemin),
		}))
	})
}

/**
 * Un id cite par une spec est ANCRE EN DEBUT D ENTREE : c est la forme que les
 * specs emploient (« KR-093 — … »). Un id nomme au MILIEU d une phrase est une
 * reference de prose, pas une declaration — l exiger mirrore ferait rougir sur
 * des renvois croises parfaitement sains.
 */
function idsCitesParLesSpecs(): { id: string; feature: string }[] {
	return specifications().flatMap(({ feature, chemin }) => {
		const doc = lireJson(chemin) as { plan?: { known_risks?: unknown[] } }
		return (doc.plan?.known_risks ?? [])
			.filter((entree): entree is string => typeof entree === 'string')
			.map((entree) => /^KR-(\d{3})\b/.exec(entree))
			.filter((trouve): trouve is RegExpExecArray => trouve !== null)
			.map((trouve) => ({ id: `KR-${trouve[1]}`, feature }))
	})
}

function doublons(valeurs: string[]): string[] {
	const vus = new Set<string>()
	const doubles = new Set<string>()
	for (const valeur of valeurs) {
		if (vus.has(valeur)) doubles.add(valeur)
		vus.add(valeur)
	}
	return [...doubles].sort()
}

describe('code-knowledge — le registre des risques connus', () => {
	it('balaie un perimetre non vide, derive du disque', () => {
		expect(FICHIERS_REGISTRE.length).toBeGreaterThanOrEqual(PLANCHER_FICHIERS_REGISTRE)
		expect(FICHIERS_BUGS.length).toBeGreaterThanOrEqual(PLANCHER_FICHIERS_BUGS)
		expect(FICHIERS_FEATURES.length).toBeGreaterThanOrEqual(1)
		expect(specifications().length).toBeGreaterThanOrEqual(PLANCHER_SPECS)
		expect(idsDuRegistre().length).toBeGreaterThanOrEqual(PLANCHER_IDS_KR)
		expect(idsDesBugs().length).toBeGreaterThanOrEqual(PLANCHER_IDS_BUG)
	})

	// 1 — les 17 KR de la n° 9 ont manque trois iterations sans rien faire rougir.
	it('mirrore tout id KR cite dans un plan.known_risks de feature', () => {
		const connus = new Set(idsDuRegistre())
		const manquants = idsCitesParLesSpecs()
			.filter(({ id }) => !connus.has(id))
			.map(({ id, feature }) => `${id} (cite par ${feature})`)
			.sort()
		expect(manquants).toEqual([])
	})

	// 2 — un id est une reference stable : l archivage et la scission le deplacent,
	// ils ne le renumerotent jamais, et deux fichiers ne peuvent pas le porter.
	it('nemploie jamais deux fois le meme id KR sur lunion des registres', () => {
		expect(doublons(idsDuRegistre())).toEqual([])
	})

	// 3 — une scission casse un JSON en silence (BUG-086) ; ces fichiers n ont que
	// des ecrivains, aucun ne les compile.
	it('garde chaque journal et chaque registre analysable en JSON', () => {
		for (const chemin of [...FICHIERS_REGISTRE, ...FICHIERS_BUGS, ...FICHIERS_FEATURES]) {
			expect(() => lireJson(chemin)).not.toThrow()
		}
	})

	// 4 — mandat explicite du _about de bug_history.json : BUG-074 reste dans le
	// fichier VIVANT tant que son correctif n est pas fait, l archiver serait l oublier.
	it('garde BUG-074 dans le journal vivant, son correctif restant a faire', () => {
		const vivant = idsDesBugs().filter(({ fichier }) => fichier === 'bug_history.json')
		expect(vivant.map(({ id }) => id)).toContain('BUG-074')
	})

	// 5 — la regle que BUG-062 a enfreinte : le prochain id se prend au max des HUIT
	// fichiers, jamais du seul fichier en cours d edition.
	//
	// LA LISTE N EST PAS VIDE, ET C EST UNE MESURE, PAS UNE TOLERANCE. Cet
	// instrument, pose le 2026-09-24, a trouve QUATRE collisions deja dans le
	// depot : quatre defauts de `dossier-format` (2026-08-08,
	// `bug_history.features-terminees.json`) et quatre defauts DIFFERENTS de
	// `dossier-canon` (2026-08-10, `bug_history.dossier-canon.json`) portent les
	// memes ids — recidive exacte de BUG-062, deux jours plus tard, dans les deux
	// sens. Les corriger exige de RENUMEROTER un id, ce que la tranche qui livre
	// ce test s interdit explicitement ; la liste fige donc l existant SANS
	// l absoudre, et l egalite EXACTE la garde honnete : une cinquieme collision
	// fait rougir, et une collision reparee AUSSI — auquel cas on retire la ligne.
	const COLLISIONS_CONNUES = ['BUG-055', 'BUG-056', 'BUG-057', 'BUG-058']

	it('nintroduit aucune collision dide BUG neuve sur TOUS les journaux du disque', () => {
		expect(doublons(idsDesBugs().map(({ id }) => id))).toEqual(COLLISIONS_CONNUES)
	})

	/**
	 * LES RENVOIS « Corps : spec <feature> » RESOLVENT TOUS, ET C EST CE QUI TIENT
	 * LA COMPACTION DE LA TRANCHE B3.
	 *
	 * Elle a remplace 42 corps par un renvoi vers un REPERTOIRE de `src/features/`,
	 * nomme en clair : c est la SEULE reference par NOM du depot, et AUCUN autre
	 * instrument ne voit un repertoire renomme ou retire. Sans cette assertion, il
	 * laisse derriere lui des entrees qui pointent vers rien, dans le fichier que
	 * toute session lit EN ENTIER avant d ecrire du code — et rien ne rougit.
	 *
	 * NE PAS Y LIRE QUE `play-mode` ou `tree-canvas` VONT DISPARAITRE : la n° 9
	 * eteint les CONSOMMATEURS du modele d arbre, JAMAIS le modele, et `tree-canvas`
	 * est CONSERVE (decision n° 5, KR-181 amende par KR-240). Le declencheur reel de
	 * cette garde est le REPOINTAGE de `tree-canvas` — cinq tranches, apres le
	 * Temps 2 — et tout renommage de repertoire, d ou qu il vienne.
	 *
	 * Le plancher de non-vacuite est ce qui distingue cette garde d une intention :
	 * sans lui, une regex qui cesse de matcher rend une liste VIDE, et une liste
	 * vide satisfait `toEqual([])` (BUG-084).
	 */
	it('chaque renvoi « Corps : spec <feature> » vise une spec qui existe', () => {
		const RENVOI = /Corps\s*:\s*spec\s+([a-z0-9-]+)/g
		const connues = new Set(specifications().map(({ feature }) => feature))

		const renvois = FICHIERS_REGISTRE.flatMap((chemin) => {
			const doc = lireJson(chemin) as { known_risks?: { id?: string; risk?: string }[] }
			return (doc.known_risks ?? []).flatMap((entree) =>
				[...String(entree.risk ?? '').matchAll(RENVOI)].map((m) => ({ id: String(entree.id), cible: m[1] })),
			)
		})

		expect(renvois.length).toBeGreaterThanOrEqual(PLANCHER_RENVOIS)
		// L echec NOMME l entree et la cible morte, jamais un simple compte.
		expect(renvois.filter(({ cible }) => !connues.has(cible)).map(({ id, cible }) => `${id} -> ${cible}`)).toEqual([])
	})
})
