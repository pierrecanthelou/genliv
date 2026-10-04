/**
 * LE MONSTRE D'UNE RÉFÉRENCE — `bestiaire.<templateId>` résolue contre le
 * `BESTIARY` du jeu (n° 13 `moteur-combat`, it1, lot `contrat`).
 *
 * UNE SEULE PORTE DE RÉSOLUTION, ET ELLE NE RECOPIE RIEN : le préfixe est
 * `PREFIXE_BESTIAIRE` (`validate.ts`, dérivé de l'espace de noms `bestiaire`),
 * jamais un littéral `'bestiaire.'` retapé ici — le validateur qui REFUSE une
 * référence pendante à l'import et ce module qui la RÉSOUT au rejeu doivent
 * décomposer la même chaîne de la même façon, sans quoi un dossier accepté
 * ouvrirait un combat sans monstre (KR-165/117).
 *
 * L'APPARTENANCE EST PROPRE, JAMAIS UN TEST D'INDEX (BUG-053, KR-175) :
 * `BESTIARY_BY_TEMPLATE` est construit par `Object.fromEntries`, donc
 * `BESTIARY_BY_TEMPLATE['toString']` rend une FONCTION héritée d'`Object.prototype`
 * — et `bestiaire.toString` passerait pour un monstre existant. `estCleDe` est la
 * seule garde.
 *
 * ELLE REND UNE COPIE, JAMAIS L'ENTRÉE DU REGISTRE (`bestiary.ts` : « COPY-ON-USE »,
 * KR-101). Le registre est la donnée de RÈGLE, épinglée valeur par valeur par
 * `rules.golden.test.ts` ; un consommateur qui muterait la configuration qu'il
 * reçoit — le rejeu, une capacité de monstre — corromprait en silence TOUS les
 * combats suivants de la partie. La copie est faite ICI, une fois, plutôt que
 * promise à chaque appelant.
 *
 * MODULE PUR, sans dépendance de service. Import `PREFIXE_BESTIAIRE` de
 * `validate.ts` — seule la constante voyage, le tree-shaking exclut le reste.
 */
import { BESTIARY_BY_TEMPLATE } from '../bestiary'
import type { MonsterConfig } from '../types'
import { estCleDe } from './identifiers'
import { PREFIXE_BESTIAIRE } from './validate'

/**
 * La configuration du monstre que `reference` désigne, ou `undefined` quand elle
 * ne désigne personne — sans lever, jamais : une référence pendante est un cas
 * NOMMÉ du rejeu (`monstre_inconnu`), pas une exception.
 *
 * `undefined` dans DEUX cas, tous deux rendus sans exception : la chaîne ne
 * commence pas par `PREFIXE_BESTIAIRE` (la comparaison est exacte, casse
 * comprise) ; le `templateId` qui suit n'est pas une clé PROPRE du bestiaire — le
 * `templateId` VIDE (`bestiaire.` seul) en est un cas, aucune clé du registre
 * n'étant la chaîne vide.
 */
export function monstreDeLaReference(reference: string): MonsterConfig | undefined {
	if (!reference.startsWith(PREFIXE_BESTIAIRE)) return undefined
	const templateId = reference.slice(PREFIXE_BESTIAIRE.length)
	if (!estCleDe(BESTIARY_BY_TEMPLATE, templateId)) return undefined
	return JSON.parse(JSON.stringify(BESTIARY_BY_TEMPLATE[templateId])) as MonsterConfig
}
