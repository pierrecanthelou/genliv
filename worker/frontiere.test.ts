/**
 * @jest-environment node
 */
/**
 * LA FRONTIÈRE CODE / MODÈLE — les liaisons qu'aucune porte ne voit seule.
 *
 * La panne qu'il attrape, écrite pour qu'on la reconnaisse : quelqu'un modifie
 * l'invite du worker pour demander une autre forme que celle que le client
 * valide. Tout appel échoue la validation, est rejoué une fois, échoue encore ;
 * l'auteur lit « Le copilote n'a pas produit de proposition exploitable » — LE BON
 * TEXTE, POUR LA MAUVAISE RAISON, à chaque essai, pour toujours. `tsc` vert,
 * `jest` vert, et la revue de PR ne lit pas deux fichiers à la fois (KR-236).
 *
 * DEPUIS L'ITÉRATION 2, LA PANNE A UNE SECONDE FORME, et c'est la seule NEUVE
 * qu'une table à deux entrées rende possible : les deux gabarits sont là, tous les
 * deux corrects, MAIS APPARIÉS AU MAUVAIS RÔLE. Un canari qui RETIRE un gabarit ne
 * la distingue pas d'un gabarit absent ; il faut un canari CROISÉ, qui INTERVERTIT.
 *
 * QUATRE CONTRAINTES tenues par ce fichier :
 *  (a) il ne contient AUCUN des littéraux — il les EXTRAIT des deux fichiers par la
 *      MÊME expression ancrée et les compare entre eux. Les écrire ici en ferait un
 *      troisième porteur, c'est-à-dire le défaut qu'il surveille ;
 *  (b) la CARDINALITÉ fait partie du prédicat — deux tables vides sont trivialement
 *      égales, et un littéral disparu rendrait la comparaison vraie pour rien ;
 *  (c) l'ensemble des rôles est DÉRIVÉ d'`INVITES`, jamais écrit : un rôle sans
 *      gabarit, ou un gabarit sans invite, doit rougir ;
 *  (d) tous ses chemins passent par `path.join`, pour tenir sous Windows (KR-215).
 *
 * Il importe DES DEUX CÔTÉS de la frontière — c'est sa raison d'être, et c'est
 * pourquoi worker et brain ne pouvaient pas être deux lots. Ce n'est PAS un import
 * de production : `testMatch` gouverne la découverte, pas ce qu'un test lit, et
 * rien de ceci n'entre dans le paquet wrangler.
 */
import fs from 'node:fs'
import path from 'node:path'
import worker, { INVITES, TAILLE_MAX_CORPS_IA } from './index'
import { assemblerDetenteurs, BUDGET_CARACTERES_CONTEXTE } from '../src/brain/copilote/contexte'
import { validerSortie } from '../src/brain/copilote/schemaSortie'
import { createCopiloteService } from '../src/brain/CopiloteService'
import type { CloudSettingsService } from '../src/brain/CloudSettingsService'
import type { Dossier, Personnage } from '../src/brain/dossier/types'

const ROLE_PROSE = 'personnage-prose'
const ROLE_DETENTEURS = 'indice-detenteurs'
const RACINE = path.join(__dirname, '..')
const PORTEUR_WORKER = path.join(__dirname, 'index.ts')
const PORTEUR_BRAIN = path.join(RACINE, 'src', 'brain', 'copilote', 'schemaSortie.ts')

/** L'ensemble des rôles, DÉRIVÉ du registre qui fait foi côté worker — jamais deux
 *  littéraux (KR-117). C'est lui qui pilote la totalité ET les `describe.each`. */
const ROLES = Object.keys(INVITES)

/** Le budget vu comme une table à clés libres : le `Record<RoleCopilote, number>`
 *  du contrat s'y assigne, et le test peut l'indexer par un rôle venu d'`INVITES`
 *  sans un seul `as` — l'appariement des deux ensembles de clés est précisément ce
 *  que le premier `describe` prouve. */
const BUDGETS: Record<string, number> = BUDGET_CARACTERES_CONTEXTE

/**
 * L'EXPRESSION ANCRÉE, unique et partagée, ANCRÉE SUR L'ENTRÉE et non sur la
 * déclaration : c'est ce qui permet aux deux porteurs d'être des tables plutôt que
 * des scalaires, et c'est ce qui rend le canari croisé écrivable. Elle reconnaît
 * une entrée écrite dans la FORME IMPOSÉE des deux côtés — une tabulation, une clé
 * en minuscules entre apostrophes, un littéral entre apostrophes, virgule finale —
 * et rien d'autre : une mention du nom dans une docstring ne la satisfait pas.
 *
 * Le drapeau `g` est INDISPENSABLE à `matchAll` — et sans danger ici bien que la
 * regex soit de portée module : `matchAll` CLONE l'expression et ne réécrit jamais
 * son `lastIndex`. Ce serait faux le jour où quelqu'un remplacerait `matchAll` par
 * `test`/`exec`, qui, eux, avancent `lastIndex` d'un appel à l'autre et feraient
 * alterner vrai/faux sur la MÊME entrée.
 */
const ENTREE_GABARIT = /^\t'([a-z-]+)': '(.+)',$/gm

function extraire(fichier: string): Map<string, string> {
	const source = fs.readFileSync(fichier, 'utf8')
	return new Map([...source.matchAll(ENTREE_GABARIT)].map((trouve) => [trouve[1], trouve[2]]))
}

/**
 * LE PRÉDICAT DE LIAISON LUI-MÊME — isolé pour que ses cas négatifs portent sur la
 * COMPARAISON RÉELLE et non sur la construction de leur propre témoin. Un
 * `expect(altere).not.toEqual(reference)` où `altere` est fabriqué depuis
 * `reference` est vrai PAR CONSTRUCTION : il n'exécute rien du garde, et c'est
 * exactement le faux positif que KR-235 nomme.
 *
 * Il porte AUSSI la protection contre la vacuité (contrainte (b)) et la TOTALITÉ
 * (contrainte (c)) : les deux tables doivent couvrir EXACTEMENT les rôles attendus,
 * donc la cardinalité fait partie du prédicat, pas d'une assertion voisine qu'on
 * pourrait retirer sans que la liaison rougisse.
 */
function memesGabarits(a: Map<string, string>, b: Map<string, string>, roles: readonly string[]): boolean {
	if (a.size !== roles.length || b.size !== roles.length) return false
	return roles.every((role) => a.get(role) !== undefined && a.get(role) === b.get(role))
}

/** LE PRÉDICAT D'APPARIEMENT — l'invite d'un rôle contient LE GABARIT DE CE
 *  RÔLE-LÀ. Il porte sur le GABARIT, jamais sur la clé nue : `valeur` est un mot
 *  français courant, et une invite disant « la valeur du personnage » satisferait
 *  un `includes` de la clé sans rien demander au modèle. */
function inviteNommeSonGabarit(role: string, gabarits: Map<string, string>): boolean {
	const gabarit = gabarits.get(role)
	return gabarit !== undefined && INVITES[role].systeme.includes(gabarit)
}

/** Les deux gabarits INTERVERTIS — en mémoire, aucun fichier n'est touché. */
function croiser(gabarits: Map<string, string>, roles: readonly string[]): Map<string, string> {
	const valeurs = roles.map((role) => gabarits.get(role) ?? '')
	return new Map(roles.map((role, rang) => [role, valeurs[(rang + 1) % roles.length]]))
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

describe('un gabarit par role, deux porteurs', () => {
	it('totalite des gabarits par role', () => {
		const cotWorker = extraire(PORTEUR_WORKER)
		const cotBrain = extraire(PORTEUR_BRAIN)

		// LES TROIS ENSEMBLES DE CLÉS SONT LE MÊME : un rôle sans gabarit, ou un gabarit
		// sans invite, rougit ici et nulle part ailleurs.
		expect([...cotBrain.keys()].sort()).toEqual([...ROLES].sort())
		expect([...cotWorker.keys()].sort()).toEqual([...ROLES].sort())
		// Et la cardinalité est DANS le prédicat, pas seulement au-dessus de lui.
		expect(memesGabarits(cotWorker, cotBrain, ROLES)).toBe(true)
		// Deux rôles, pas un : sans cette ligne, tout ce fichier resterait vert sur la
		// table à une entrée de l'itération 1, où le mal-apparié n'existe pas.
		expect(ROLES.length).toBeGreaterThan(1)
	})

	it('canari croise', () => {
		// LE CANARI CROISÉ, ET C'EST LE SEUL QUI VOIT LA PANNE NEUVE. Les deux gabarits
		// sont présents, corrects, de la bonne cardinalité — mais APPARIÉS AU MAUVAIS
		// RÔLE. Un canari qui en retire un ne distingue pas « absent » de « mal
		// apparié ».
		const cotBrain = extraire(PORTEUR_BRAIN)
		const croise = croiser(cotBrain, ROLES)

		// Le croisement n'a rien perdu : même taille, mêmes valeurs, autre appariement.
		expect(croise.size).toBe(cotBrain.size)
		expect([...croise.values()].sort()).toEqual([...cotBrain.values()].sort())
		expect([...croise.entries()]).not.toEqual([...cotBrain.entries()])

		// (a) LE PRÉDICAT DE LIAISON rougit sur le croisement — dans les DEUX sens, un
		//     garde qui ne comparerait que dans un sens passerait sur une moitié muette.
		expect(memesGabarits(extraire(PORTEUR_WORKER), croise, ROLES)).toBe(false)
		expect(memesGabarits(croise, extraire(PORTEUR_WORKER), ROLES)).toBe(false)

		// (b) LE PRÉDICAT D'APPARIEMENT rougit lui aussi, pour CHAQUE rôle : c'est la
		//     forme sous laquelle la panne se manifesterait vraiment, une invite qui
		//     demande la forme de l'autre rôle.
		expect(ROLES.filter((role) => inviteNommeSonGabarit(role, croise))).toEqual([])
		// Et il est VERT sur l'appariement réel : sans cette moitié, il pourrait être
		// rouge parce qu'il est inerte.
		expect(ROLES.filter((role) => !inviteNommeSonGabarit(role, cotBrain))).toEqual([])
	})

	it('un litteral altere d un seul caractere fait rougir le predicat de liaison', () => {
		// CAS NÉGATIF OBLIGATOIRE : un instrument qui ne sait pas échouer ne mesure
		// rien. On altère l'exemplaire du brain EN MÉMOIRE — aucun fichier n'est
		// touché — puis on rejoue LE PRÉDICAT DU CAS NOMINAL contre le VRAI exemplaire
		// du worker, lu sur disque.
		const cotBrain = extraire(PORTEUR_BRAIN)
		const cible = ROLES[0]
		const original = String(cotBrain.get(cible))
		const altere = new Map(cotBrain).set(cible, `${original.slice(0, -1)}!`)

		expect(memesGabarits(extraire(PORTEUR_WORKER), altere, ROLES)).toBe(false)
		// Altération D'UN SEUL CARACTÈRE : ce n'est ni la cardinalité, ni la longueur
		// qui discrimine.
		expect(altere.size).toBe(cotBrain.size)
		expect(String(altere.get(cible))).toHaveLength(original.length)
	})

	it('un porteur vide fait rougir le predicat de liaison — la contrainte (b) est DANS le garde', () => {
		// Le mode de panne que (b) vise : un littéral disparu rend l'extraction vide,
		// et deux vides sont trivialement égaux. Le prédicat doit refuser AVANT de
		// comparer — sinon la liaison serait verte parce qu'elle ne mesure plus rien.
		expect(memesGabarits(extraire(PORTEUR_WORKER), new Map(), ROLES)).toBe(false)
		expect(memesGabarits(new Map(), new Map(), ROLES)).toBe(false)
	})

	it('aucun troisieme porteur d un gabarit dans src ni dans worker', () => {
		const attendus = [PORTEUR_BRAIN, PORTEUR_WORKER].sort()
		const fichiers = [...fichiersTypeScript(path.join(RACINE, 'src')), ...fichiersTypeScript(__dirname)]
		const sources = new Map(fichiers.map((fichier) => [fichier, fs.readFileSync(fichier, 'utf8')]))

		for (const [role, gabarit] of extraire(PORTEUR_BRAIN)) {
			const porteurs = fichiers.filter((fichier) => String(sources.get(fichier)).includes(gabarit))
			// ALLOW-LIST NOMMÉE, jamais une projection dérivée (KR-215) : l'échec nomme le
			// fichier fautif ET le rôle. Ce test-ci ne peut pas s'y trouver — il n'écrit
			// aucun littéral, il les extrait.
			expect(`${role} → ${porteurs.sort().join(', ')}`).toBe(`${role} → ${attendus.join(', ')}`)
		}
	})
})

describe('l invite nomme SON gabarit', () => {
	it.each(ROLES)('l invite reellement composee du role %s contient son gabarit', (role) => {
		expect(inviteNommeSonGabarit(role, extraire(PORTEUR_BRAIN))).toBe(true)
	})

	it('une invite demandant une autre forme fait rougir le garde', () => {
		// CAS NÉGATIF OBLIGATOIRE — c'est EXACTEMENT la panne décrite en tête de
		// fichier : une invite qui demande une autre clé que celle que le client valide.
		const fabriquee = new Map(ROLES.map((role) => [role, '{"texte": "…"}']))

		expect(ROLES.filter((role) => inviteNommeSonGabarit(role, fabriquee))).toEqual([])
	})

	it('la cle nue ne suffirait pas a satisfaire le garde', () => {
		// Le discriminant du CHOIX du garde : une invite qui emploie le mot « valeur »
		// sans demander la forme passerait un garde posé sur la clé nue.
		const gabarits = extraire(PORTEUR_BRAIN)
		const cleNue = Object.keys(JSON.parse(String(gabarits.get(ROLE_PROSE))) as Record<string, unknown>)[0]
		const bavarde = new Map(gabarits).set(ROLE_PROSE, cleNue)

		expect(INVITES[ROLE_PROSE].systeme.includes(cleNue)).toBe(true)
		expect(inviteNommeSonGabarit(ROLE_PROSE, bavarde)).toBe(true)
		// … et pourtant une invite qui NE FAIT QUE nommer la clé ne satisfait pas le
		// garde réel, qui porte sur le gabarit entier.
		const inviteBavarde = `Tu décris la ${cleNue} de ce personnage pour l'auteur.`
		expect(inviteBavarde.includes(cleNue)).toBe(true)
		expect(inviteBavarde.includes(String(gabarits.get(ROLE_PROSE)))).toBe(false)
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

	/** Le worker RÉEL au niveau 1, l'amont bouchonné au niveau 2 — et l'invite
	 *  RÉELLEMENT composée capturée au passage, jamais celle qu'on croit avoir
	 *  écrite. */
	async function traverser<T>(conforme: string, appel: () => Promise<T>): Promise<{ resultat: T; invite: string }> {
		let inviteSurLeFil: string | null = null
		const avant = globalThis.fetch
		globalThis.fetch = (async (cible: RequestInfo | URL, init?: RequestInit) => {
			const adresse = String(cible)
			if (adresse.startsWith(URL_WORKER)) {
				return worker.fetch(new Request(adresse, init), {
					GENLIV_KV: { get: async () => null, put: async () => undefined, delete: async () => undefined },
					IA_API_KEY: 'secret-de-test',
					IA_BASE_URL: URL_AMONT,
					IA_MODEL: 'un-modele',
				} as unknown as Parameters<typeof worker.fetch>[1])
			}
			inviteSurLeFil = (JSON.parse(String(init?.body)) as { system: string }).system
			return {
				ok: true,
				status: 200,
				json: async () => ({ content: [{ type: 'text', text: conforme }] }),
			} as unknown as Response
		}) as unknown as typeof fetch

		try {
			const resultat = await appel()
			expect(inviteSurLeFil).not.toBeNull()
			return { resultat, invite: String(inviteSurLeFil) }
		} finally {
			globalThis.fetch = avant
		}
	}

	it('role prose : une sortie conforme traverse le worker puis le validateur et rend propose', async () => {
		const gabarit = String(extraire(PORTEUR_BRAIN).get(ROLE_PROSE))
		// La sortie conforme est CONSTRUITE depuis le gabarit extrait — aucun littéral
		// de clé n'est retapé ici.
		const cle = Object.keys(JSON.parse(gabarit) as Record<string, unknown>)[0]
		const PROSE = 'Une note de fiche, tenue par ce canari, sans identifiant ni chiffre.'
		const conforme = JSON.stringify({ [cle]: PROSE })

		const dossier = dossierDeReference()
		const personnage = dossier.monde.personnages.find((p: Personnage) => p.fonction !== undefined)
		if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à cibler')

		const { resultat, invite } = await traverser(conforme, () =>
			createCopiloteService(reglages).demander(ROLE_PROSE, dossier, {
				entiteId: personnage.id,
				champ: 'monde.personnages[].fonction',
			}),
		)

		expect(invite).toContain(gabarit)
		expect(resultat).toEqual({
			statut: 'propose',
			proposition: { entiteId: personnage.id, champ: 'monde.personnages[].fonction', texte: PROSE },
		})
		// Et la même sortie passe le validateur seul : les deux moitiés du témoin sont
		// prouvées séparément, jamais l'une par l'autre (KR-197/199).
		expect(validerSortie(JSON.parse(conforme), dossier)).toEqual({ ok: true, valeur: PROSE })
	})

	it('temoin executable du second role', async () => {
		const gabarit = String(extraire(PORTEUR_BRAIN).get(ROLE_DETENTEURS))
		const cle = Object.keys(JSON.parse(gabarit) as Record<string, unknown>)[0]

		// LA CIBLE EST LUE DE LA FIXTURE INTACTE : l'un de ses indices porte une vérité
		// écrite, donc le chemin passant y est instanciable sans toucher au fichier.
		const dossier = dossierDeReference()
		const indice = dossier.monde.indices.find((candidat) => (candidat.verite ?? '').trim() !== '')
		if (indice === undefined) throw new Error('la fixture ne porte aucun indice à vérité écrite')

		// La table des rangs vient de l'ASSEMBLEUR, jamais re-dérivée (KR-231) : c'est
		// elle qui dit qui `P1` désigne, et c'est ce que le service doit re-résoudre.
		const contexte = assemblerDetenteurs(dossier, { indiceId: indice.id })
		if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) : le témoin ne peut pas partir`)
		const premier = String(contexte.rangs.get('P1'))
		// Discriminants : `P1` désigne un personnage RÉEL du dossier, qui ne détient pas
		// déjà l'indice — sans eux, l'égalité finale serait vraie par construction.
		expect(dossier.monde.personnages.map((personnage) => personnage.id)).toContain(premier)
		expect(
			dossier.monde.personnages
				.find((personnage) => personnage.id === premier)
				?.savoirs.map((savoir) => savoir.indice_id),
		).not.toContain(indice.id)

		// La sortie conforme est CONSTRUITE depuis le gabarit extrait, et son unique
		// jeton est repris de la table des rangs — aucun littéral retapé.
		const conforme = JSON.stringify({ [cle]: ['P1'] })

		const { resultat, invite } = await traverser(conforme, () =>
			createCopiloteService(reglages).demander(ROLE_DETENTEURS, dossier, { indiceId: indice.id }),
		)

		expect(invite).toContain(gabarit)
		expect(resultat).toEqual({
			statut: 'propose',
			proposition: { indiceId: indice.id, personnageIds: [premier] },
		})
		// L'identifiant de l'indice ne franchit pas le réseau : ce qui part est le
		// contexte, ce qui revient est un jeton.
		expect(invite).not.toContain(indice.id)
	})
})

describe('les deux plafonds', () => {
	const octets = (texte: string): number => new TextEncoder().encode(texte).length

	/**
	 * L'enveloppe est CONSTRUITE depuis les constantes réellement exportées — jamais
	 * retapée : une enveloppe retapée casserait silencieusement le lien que ce test
	 * garantit. Le squelette porte `champ`, que SEUL le rôle prose envoie : pour le
	 * rôle détenteurs c'est donc un MAJORANT, et un majorant est le bon sens d'erreur
	 * pour une garde de plafond.
	 */
	function enveloppe(role: string): string {
		const squelette = JSON.stringify({ role, champ: 'monde.personnages[].description_joueur', contexte: '' })
		return squelette + INVITES[role].systeme
	}

	const pireCasDe = (role: string, budget: number): number => octets('€'.repeat(budget)) + octets(enveloppe(role))

	/** LE RÔLE LE PLUS LARGE — DÉRIVÉ, jamais écrit. Sur le rôle étroit, les deux
	 *  canaris ci-dessous resteraient verts en ne discriminant rien : ils ne valent
	 *  que pour celui qui sature le plafond. */
	const ROLE_LE_PLUS_LARGE = ROLES.reduce((large, role) => (BUDGETS[role] > BUDGETS[large] ? role : large))

	it('le role le plus large est bien DERIVE par Math.max sur les budgets', () => {
		expect(BUDGETS[ROLE_LE_PLUS_LARGE]).toBe(Math.max(...ROLES.map((role) => BUDGETS[role])))
		// Discriminant : les deux budgets DIFFÈRENT, donc « le plus large » désigne
		// quelque chose. Si un jour ils s'égalisaient, cette ligne le dirait.
		expect(new Set(ROLES.map((role) => BUDGETS[role])).size).toBe(ROLES.length)
	})

	describe.each(ROLES)('role %s', (role) => {
		it('le budget client converti au pire cas d octets tient sous le plafond worker', () => {
			// `'€'` (BMP) coûte TROIS octets pour UNE unité de code : c'est la BORNE HAUTE
			// réelle, mesurée. Un émoji coûte 4 octets pour DEUX unités, soit 2 par
			// unité — écrire 4 serait une marge inventée présentée comme une borne.
			expect(octets('€')).toBe(3)
			expect(octets('\u{1F600}')).toBe(4)
			expect('\u{1F600}'.length).toBe(2)
			// Et le budget de CE rôle existe : un rôle sans budget ne doit pas passer
			// pour un rôle à budget nul.
			expect(BUDGETS[role]).toBeGreaterThan(0)

			expect(pireCasDe(role, BUDGETS[role])).toBeLessThanOrEqual(TAILLE_MAX_CORPS_IA)
		})
	})

	it('le lien est separateur : un plafond ampute d un kilo-octet ne couvre plus', () => {
		expect(pireCasDe(ROLE_LE_PLUS_LARGE, BUDGETS[ROLE_LE_PLUS_LARGE])).toBeGreaterThan(TAILLE_MAX_CORPS_IA - 1024)
	})

	it('le lien est separateur : un budget releve de 400 caracteres ne tient plus', () => {
		expect(pireCasDe(ROLE_LE_PLUS_LARGE, BUDGETS[ROLE_LE_PLUS_LARGE] + 400)).toBeGreaterThan(TAILLE_MAX_CORPS_IA)
	})
})
