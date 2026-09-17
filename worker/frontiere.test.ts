/**
 * @jest-environment node
 */
/**
 * LA FRONTIÈRE CODE / MODÈLE — les trois liaisons qu'aucune porte ne voit seule.
 *
 * La panne qu'il attrape, écrite pour qu'on la reconnaisse : quelqu'un modifie
 * l'invite du worker pour demander une autre forme que celle que le client
 * valide. Tout appel échoue la validation, est rejoué une fois, échoue encore ;
 * l'auteur lit « Le copilote n'a pas produit de proposition exploitable » — LE BON
 * TEXTE, POUR LA MAUVAISE RAISON, à chaque essai, pour toujours. `tsc` vert,
 * `jest` vert, et la revue de PR ne lit pas deux fichiers à la fois (KR-236).
 *
 * TROIS CONTRAINTES tenues par ce fichier :
 *  (a) il ne contient AUCUN des deux littéraux — il les EXTRAIT des deux fichiers
 *      par la MÊME expression ancrée et les compare entre eux. Les écrire ici en
 *      ferait un troisième porteur, c'est-à-dire le défaut qu'il surveille ;
 *  (b) il asserte EXACTEMENT UNE occurrence par fichier — protection contre la
 *      vacuité : un littéral disparu rendrait l'extraction vide et la comparaison
 *      trivialement vraie ;
 *  (c) tous ses chemins passent par `path.join`, pour tenir sous Windows (KR-215).
 *
 * Il importe DES DEUX CÔTÉS de la frontière — c'est sa raison d'être, et c'est
 * pourquoi worker et brain ne pouvaient pas être deux lots. Ce n'est PAS un import
 * de production : `testMatch` gouverne la découverte, pas ce qu'un test lit, et
 * rien de ceci n'entre dans le paquet wrangler.
 */
import fs from 'node:fs'
import path from 'node:path'
import worker, { INVITES, TAILLE_MAX_CORPS_IA } from './index'
import { BUDGET_CARACTERES_CONTEXTE } from '../src/brain/copilote/contexte'
import { validerSortie } from '../src/brain/copilote/schemaSortie'
import { createCopiloteService } from '../src/brain/CopiloteService'
import type { CloudSettingsService } from '../src/brain/CloudSettingsService'
import type { Dossier, Personnage } from '../src/brain/dossier/types'

const ROLE = 'personnage-prose'
const RACINE = path.join(__dirname, '..')
const PORTEUR_WORKER = path.join(__dirname, 'index.ts')
const PORTEUR_BRAIN = path.join(RACINE, 'src', 'brain', 'copilote', 'schemaSortie.ts')

/**
 * L'EXPRESSION ANCRÉE, unique et partagée : elle doit reconnaître les deux
 * déclarations — `export const …` côté brain, `const …` côté worker — et rien
 * d'autre. Ancrée début-et-fin de ligne : une mention du NOM dans une docstring ne
 * la satisfait pas, seule une DÉCLARATION la satisfait.
 *
 * Le drapeau `g` est INDISPENSABLE à `matchAll` — et sans danger ici bien que la
 * regex soit de portée module : `matchAll` CLONE l'expression et ne réécrit
 * jamais son `lastIndex`. Ce serait faux le jour où quelqu'un remplacerait
 * `matchAll` par `test`/`exec`, qui, eux, avancent `lastIndex` d'un appel à
 * l'autre et feraient alterner vrai/faux sur la MÊME entrée. Si ce besoin
 * apparaît : construire l'expression dans la fonction, ou remettre `lastIndex` à
 * zéro avant chaque appel.
 */
const DECLARATION = /^(?:export )?const GABARIT_SORTIE = '(.+)'$/gm

function extraire(fichier: string): string[] {
	const source = fs.readFileSync(fichier, 'utf8')
	return [...source.matchAll(DECLARATION)].map((trouve) => trouve[1])
}

/**
 * LE PRÉDICAT DE LIAISON LUI-MÊME — isolé pour que son cas négatif porte sur la
 * COMPARAISON RÉELLE et non sur la construction de son propre témoin. Un
 * `expect(altere).not.toBe(reference)` où `altere` est fabriqué depuis
 * `reference` est vrai PAR CONSTRUCTION : il n'exécute rien du garde, et c'est
 * exactement le faux positif que KR-235 nomme. Le cas nominal et le cas négatif
 * ci-dessous appellent tous deux CETTE fonction, dans les deux sens.
 *
 * Il porte AUSSI la protection contre la vacuité (contrainte (b)) : deux porteurs
 * vides sont trivialement égaux, donc la cardinalité fait partie du prédicat, pas
 * d'une assertion voisine qu'on pourrait retirer sans que la liaison rougisse.
 */
function memeGabarit(a: string[], b: string[]): boolean {
	return a.length === 1 && b.length === 1 && a[0] === b[0]
}

/** Tous les fichiers TypeScript de `src/` et de `worker/`, chemins joints. */
function fichiersTypeScript(racine: string): string[] {
	const trouves: string[] = []
	for (const entree of fs.readdirSync(racine, { withFileTypes: true })) {
		const complet = path.join(racine, entree.name)
		if (entree.isDirectory()) trouves.push(...fichiersTypeScript(complet))
		else if (entree.name.endsWith('.ts') || entree.name.endsWith('.tsx')) trouves.push(complet)
	}
	return trouves
}

describe('un seul gabarit, deux porteurs', () => {
	it('les deux exemplaires sont identiques, et il y en a exactement un par fichier', () => {
		const cotWorker = extraire(PORTEUR_WORKER)
		const cotBrain = extraire(PORTEUR_BRAIN)

		// (b) — protection contre la vacuité, AVANT la comparaison.
		expect(cotWorker).toHaveLength(1)
		expect(cotBrain).toHaveLength(1)
		expect(memeGabarit(cotWorker, cotBrain)).toBe(true)
	})

	it('un litteral altere d un seul caractere fait rougir le predicat de liaison', () => {
		// CAS NÉGATIF OBLIGATOIRE : un instrument qui ne sait pas échouer ne mesure
		// rien. On altère l'exemplaire du brain EN MÉMOIRE — aucun fichier n'est
		// touché — puis on rejoue LE PRÉDICAT DU CAS NOMINAL contre le VRAI
		// exemplaire du worker, lu sur disque. C'est la comparaison qui rougit, pas
		// la construction du témoin : `expect(altere).not.toBe(reference)` aurait été
		// vrai par construction et n'aurait exercé aucune ligne du garde (KR-235).
		const cotBrain = extraire(PORTEUR_BRAIN)
		const altere = [`${cotBrain[0].slice(0, -1)}!`]

		expect(memeGabarit(extraire(PORTEUR_WORKER), altere)).toBe(false)
		// Altération D'UN SEUL CARACTÈRE : ce n'est pas la longueur qui discrimine.
		expect(altere[0]).toHaveLength(cotBrain[0].length)
		// Et le prédicat rougit DANS LES DEUX SENS — un garde qui ne comparerait que
		// dans un sens passerait sur une moitié muette.
		expect(memeGabarit(altere, extraire(PORTEUR_WORKER))).toBe(false)
	})

	it('un porteur vide fait rougir le predicat de liaison — la contrainte (b) est DANS le garde', () => {
		// Le mode de panne que (b) vise : un littéral disparu rend l'extraction vide,
		// et deux vides sont trivialement égaux. Le prédicat doit refuser AVANT de
		// comparer — sinon la liaison serait verte parce qu'elle ne mesure plus rien.
		expect(memeGabarit(extraire(PORTEUR_WORKER), [])).toBe(false)
		expect(memeGabarit([], [])).toBe(false)
	})

	it('aucun troisieme porteur du gabarit dans src ni dans worker', () => {
		const gabarit = extraire(PORTEUR_BRAIN)[0]
		const attendus = [PORTEUR_BRAIN, PORTEUR_WORKER]

		const porteurs = [...fichiersTypeScript(path.join(RACINE, 'src')), ...fichiersTypeScript(__dirname)].filter(
			(fichier) => fs.readFileSync(fichier, 'utf8').includes(gabarit),
		)

		// ALLOW-LIST NOMMÉE, jamais une projection dérivée (KR-215) : l'échec nomme le
		// fichier fautif. Ce test-ci ne peut pas s'y trouver — il n'écrit pas le
		// littéral, il l'extrait.
		expect(porteurs.sort()).toEqual(attendus.sort())
	})
})

describe('l invite nomme le gabarit', () => {
	/**
	 * LE PRÉDICAT DU GARDE, isolé pour que son CAS NÉGATIF soit écrivable. Il porte
	 * sur le GABARIT, jamais sur la clé nue : `valeur` est un mot français courant,
	 * et une invite disant « la valeur du personnage » satisferait un
	 * `includes` de la clé sans rien demander au modèle.
	 */
	function inviteNommeLeGabarit(systeme: string): boolean {
		return systeme.includes(extraire(PORTEUR_BRAIN)[0])
	}

	it('l invite reellement composee contient le gabarit', () => {
		expect(inviteNommeLeGabarit(INVITES[ROLE].systeme)).toBe(true)
	})

	it('une invite demandant une autre forme fait rougir le garde', () => {
		// CAS NÉGATIF OBLIGATOIRE — c'est EXACTEMENT la panne décrite en tête de
		// fichier : une invite qui demande une autre clé que celle que le client
		// valide.
		const fabriquee = 'Tu réponds par un objet JSON de la forme {"texte": "…"} et rien d\'autre.'

		expect(inviteNommeLeGabarit(fabriquee)).toBe(false)
	})

	it('la cle nue ne suffirait pas a satisfaire le garde', () => {
		// Le discriminant du CHOIX du garde : une invite qui emploie le mot « valeur »
		// sans demander la forme passerait un garde posé sur la clé nue.
		const cleNue = Object.keys(JSON.parse(extraire(PORTEUR_BRAIN)[0]) as Record<string, unknown>)[0]
		const bavarde = `Tu décris la ${cleNue} de ce personnage pour l'auteur.`

		expect(bavarde.includes(cleNue)).toBe(true)
		expect(inviteNommeLeGabarit(bavarde)).toBe(false)
	})
})

describe('le temoin executable — du worker au validateur, dans le meme processus', () => {
	const URL_WORKER = 'https://worker.invalid'
	const URL_AMONT = 'https://amont.invalid/messages'

	const reglages: CloudSettingsService = {
		getWorkerUrl: () => URL_WORKER,
		setWorkerUrl: () => undefined,
		getSyncKey: () => 'une-cle-de-synchronisation',
		setSyncKey: () => undefined,
		isConfigured: () => true,
	}

	function dossierDeReference(): Dossier {
		const chemin = path.join(RACINE, 'src', 'brain', 'dossier', '__fixtures__', 'dossier-reference.json')
		return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
	}

	it('une sortie conforme traverse le worker puis le validateur et rend propose', async () => {
		const gabarit = extraire(PORTEUR_BRAIN)[0]
		// La sortie conforme est CONSTRUITE depuis le gabarit extrait — aucun littéral
		// de clé n'est retapé ici.
		const cle = Object.keys(JSON.parse(gabarit) as Record<string, unknown>)[0]
		const PROSE = 'Une note de fiche, tenue par ce canari, sans identifiant ni chiffre.'
		const conforme = JSON.stringify({ [cle]: PROSE })

		let inviteSurLeFil: string | null = null
		const avant = globalThis.fetch
		globalThis.fetch = (async (cible: RequestInfo | URL, init?: RequestInit) => {
			const adresse = String(cible)
			// Niveau 1 — le client appelle le worker : on lui donne le VRAI handler.
			if (adresse.startsWith(URL_WORKER)) {
				return worker.fetch(new Request(adresse, init), {
					GENLIV_KV: { get: async () => null, put: async () => undefined, delete: async () => undefined },
					IA_API_KEY: 'secret-de-test',
					IA_BASE_URL: URL_AMONT,
					IA_MODEL: 'un-modele',
				} as unknown as Parameters<typeof worker.fetch>[1])
			}
			// Niveau 2 — le worker appelle l'amont : on capture l'invite RÉELLEMENT
			// composée, celle qui part sur le fil, jamais celle qu'on croit avoir écrite.
			inviteSurLeFil = (JSON.parse(String(init?.body)) as { system: string }).system
			return {
				ok: true,
				status: 200,
				json: async () => ({ content: [{ type: 'text', text: conforme }] }),
			} as unknown as Response
		}) as unknown as typeof fetch

		try {
			const dossier = dossierDeReference()
			const personnage = dossier.monde.personnages.find((p: Personnage) => p.fonction !== undefined)
			if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à cibler')

			const reponse = await createCopiloteService(reglages).demander(ROLE, dossier, {
				entiteId: personnage.id,
				champ: 'monde.personnages[].fonction',
			})

			expect(inviteSurLeFil).not.toBeNull()
			expect(String(inviteSurLeFil)).toContain(gabarit)
			expect(reponse).toEqual({
				statut: 'propose',
				proposition: { entiteId: personnage.id, champ: 'monde.personnages[].fonction', texte: PROSE },
			})
			// Et la même sortie passe le validateur seul : les deux moitiés du témoin
			// sont prouvées séparément, jamais l'une par l'autre (KR-197/199).
			expect(validerSortie(JSON.parse(conforme), dossier)).toEqual({ ok: true, valeur: PROSE })
		} finally {
			globalThis.fetch = avant
		}
	})
})

describe('les deux plafonds sont compatibles', () => {
	const octets = (texte: string): number => new TextEncoder().encode(texte).length

	/** L'enveloppe est CONSTRUITE depuis les constantes réellement exportées —
	 *  jamais retapée : une enveloppe retapée casserait silencieusement le lien que
	 *  ce test garantit. */
	function enveloppe(): string {
		const squelette = JSON.stringify({ role: ROLE, champ: 'monde.personnages[].description_joueur', contexte: '' })
		return squelette + INVITES[ROLE].systeme
	}

	it('le budget client converti au pire cas d octets tient sous le plafond worker', () => {
		// `'€'` (BMP) coûte TROIS octets pour UNE unité de code : c'est la BORNE HAUTE
		// réelle, mesurée. Un émoji coûte 4 octets pour DEUX unités, soit 2 par
		// unité — écrire 4 serait une marge inventée présentée comme une borne.
		expect(octets('€')).toBe(3)
		expect(octets('\u{1F600}')).toBe(4)
		expect('\u{1F600}'.length).toBe(2)

		const pireCas = octets('€'.repeat(BUDGET_CARACTERES_CONTEXTE)) + octets(enveloppe())

		expect(pireCas).toBeLessThanOrEqual(TAILLE_MAX_CORPS_IA)
	})

	it('le lien est separateur : un plafond ampute d un kilo-octet ne couvre plus', () => {
		const pireCas = octets('€'.repeat(BUDGET_CARACTERES_CONTEXTE)) + octets(enveloppe())

		expect(pireCas).toBeGreaterThan(TAILLE_MAX_CORPS_IA - 1024)
	})

	it('le lien est separateur : un budget releve de 400 caracteres ne tient plus', () => {
		const pireCasElargi = octets('€'.repeat(BUDGET_CARACTERES_CONTEXTE + 400)) + octets(enveloppe())

		expect(pireCasElargi).toBeGreaterThan(TAILLE_MAX_CORPS_IA)
	})
})
