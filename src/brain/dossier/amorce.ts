import { DOSSIER_SCHEMA, type Dossier } from './types'

/**
 * L'AMORCE d'un dossier — le document que `DossierService.create()` sème, et les
 * quatre textes de prose qu'il y dépose.
 *
 * Pourquoi des textes plutôt que des chaînes vides : les CHAMPS_REQUIS
 * (`tables.ts`) refusent le vide, donc un dossier semé sans prose serait un
 * document que le validateur lui-même rejetterait à la relecture (KR-178). Il
 * fallait donc écrire QUELQUE CHOSE dans quatre champs dont deux sont lus par le
 * modèle (`canon.mj.synopsis_mj`, `canon.partage.accroche_joueur`, `canon.ton` —
 * destination `ia`) et dont un est lu VERBATIM au joueur
 * (`charpente.depart.texte_ouverture_joueur` — destination `moteur`,
 * `destinations.ts`).
 *
 * D'où le MARQUEUR. Chacun des quatre textes commence par `MARQUEUR_A_ECRIRE`, de
 * sorte qu'aucun d'eux ne puisse jamais être pris pour de la prose rédigée — ni
 * par l'auteur qui relit, ni par un modèle qui recevrait le canon, ni par le
 * moteur qui lirait la scène d'ouverture au joueur. Les quatre sont rédigés à
 * l'adresse de l'AUTEUR (« Ce que le joueur sait en ouvrant le livre »), jamais à
 * celle du joueur : même discipline que le couple nom interne / description
 * joueur du reste du projet.
 *
 * CE QUE CE DISPOSITIF NE FAIT PAS : détecter qu'une amorce est restée non
 * rédigée. Un dossier valide (`errors: []`) n'est pas un dossier jouable — aucun
 * code d'anomalie ne connaît la notion de texte-modèle. L'alerte appartient au
 * linter (n° 7) et le refus d'ouvrir une partie sur une ouverture encore marquée
 * appartient au moteur (n° 9). Cette itération pose la constante et la
 * discipline, rien de plus.
 *
 * Ce module n'est PAS ré-exporté par `brain/index.ts`, et il ne l'est TOUJOURS
 * PAS depuis qu'une feature le lit — nuance à ne pas perdre. Depuis la n° 9 it1,
 * `features/play-mode/components/EcranPartie.tsx` importe `MARQUEUR_A_ECRIRE` EN
 * PROFONDEUR : le texte de refus d'ouverture se COMPOSE depuis la constante au
 * lieu de retaper le glyphe, qui serait une seconde source de vérité (KR-223).
 * UN lecteur nommé, hors baril : l'ouvrir en ferait une offre aux treize features.
 * Même traitement que `DELTAS` et `DESTINATION_DES_CHAMPS`.
 */

/**
 * La marque d'un texte que le logiciel a posé et que l'auteur doit remplacer.
 * Les chevrons mathématiques (⟨ ⟩) plutôt que des guillemets ou des crochets :
 * ils ne se tapent pas au clavier, donc ils ne peuvent pas apparaître par accident
 * dans de la prose rédigée, et un balayage (n° 7) ne produit pas de faux positif.
 *
 * Écrite ICI et NULLE PART AILLEURS dans `src/` — un test de `amorce.test.ts`
 * tient cette propriété par un balayage de source : la valeur recopiée à un
 * second endroit dériverait en silence de celle qui fait foi.
 */
export const MARQUEUR_A_ECRIRE = '⟨à écrire⟩'

/**
 * Les QUATRE textes de l'amorce, composés à partir du marqueur plutôt que de le
 * recopier. Chacun dit à l'auteur ce que le champ attend — pas ce que le champ
 * pourrait contenir : un exemple de prose serait relu par le modèle comme du
 * canon le jour où l'auteur ne l'aurait pas remplacé.
 */
export const AMORCE = {
	synopsis_mj: `${MARQUEUR_A_ECRIRE} La vérité de cette aventure, y compris ce que le joueur ignore.`,
	accroche_joueur: `${MARQUEUR_A_ECRIRE} Ce que le joueur sait en ouvrant le livre.`,
	ton: `${MARQUEUR_A_ECRIRE} Le registre de langue de cette aventure — par exemple : sombre et feutré.`,
	texte_ouverture_joueur: `${MARQUEUR_A_ECRIRE} La première scène, telle que le moteur la lira au joueur, mot pour mot.`,
} as const

/**
 * Le lieu semé avec le dossier — il existe parce que `charpente.depart.lieu_id`
 * est une RÉFÉRENCE SIMPLE obligatoire (`tables.ts`) : sans une entrée dans
 * `monde.lieux` qui la résolve, le document serait refusé pour référence pendante.
 *
 * RÈGLE TRANSVERSE, valable pour toute entité semée par du code (n° 3 à n° 6) :
 * un identifiant ne décrit jamais un RANG, un RÔLE, ni un NOM — seulement une
 * ORIGINE, la seule chose qui ne bouge plus. `lieu.premier-lieu` devient faux au
 * premier réordonnancement ; `lieu.point-de-depart` devient faux dès que l'auteur
 * déplace son départ ; `lieu.amorce` reste vrai pour toujours.
 *
 * Il ne porte PAS de `nom` : ce champ est de destination `auteur`
 * (`destinations.ts`), c'est le seul du seed qui ne peut pas porter le marqueur
 * sans polluer les listes d'entités des n° 3 à n° 6, et son absence est un état
 * calme (`Entite.nom` optionnel) que le repli d'affichage de `localiserEntite()`
 * rend déjà lisible — ce repli est une sortie de RAPPORT, jamais une valeur à
 * écrire.
 */
const LIEU_INITIAL = 'lieu.amorce'

/**
 * Le document semé : la forme MINIMALE qu'un dossier doit avoir pour que
 * `validateDossier` le rende `ok` sans une seule anomalie NI un seul
 * avertissement.
 *
 * Elle est dérivée de `RACINES` + `CHAMPS_REQUIS` + `LISTES_REQUISES` +
 * `REFERENCES_SIMPLES` (`tables.ts`), et surtout PAS de
 * `__fixtures__/dossier-minimal.json`, qui peuple toutes les collections et n'est
 * pas un minimum : c'est une fixture d'épreuve du validateur.
 *
 * Toutes les collections sont donc des tableaux VIDES — ce que le validateur
 * exige (`racine-manquante` sur une liste absente) et ce que l'auteur attend :
 * un dossier neuf n'a ni personnage, ni objet, ni jalon inventés pour lui.
 */
export function construireAmorce(id: string, titre: string, now: string): Dossier {
	return {
		schema: DOSSIER_SCHEMA,
		id,
		titre,
		createdAt: now,
		updatedAt: now,
		canon: {
			mj: { synopsis_mj: AMORCE.synopsis_mj },
			partage: { accroche_joueur: AMORCE.accroche_joueur },
			ton: AMORCE.ton,
			interdits_ton: [],
			objectifs: [],
		},
		monde: {
			personnages: [],
			lieux: [{ id: LIEU_INITIAL }],
			objets: [],
			indices: [],
			quetes: [],
			evenements: [],
			conditions: { climat: [] },
		},
		charpente: {
			depart: { lieu_id: LIEU_INITIAL, texte_ouverture_joueur: AMORCE.texte_ouverture_joueur },
			jalons: [],
			fins: [],
		},
	}
}
