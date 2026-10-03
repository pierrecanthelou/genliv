/**
 * L'ÉVALUATEUR DE RÉVÉLATION — ce qu'un PNJ peut confier MAINTENANT, contre un
 * état de session RÉEL (n° 12 `moteur-acteurs`, it2, lot `contrat`).
 *
 * PATRON « CATALOGUE BORNÉ » (KR-287) : ce module calcule et FERME l'ensemble des
 * savoirs déjà éligibles AVANT l'appel à R4 — R4 (`acteur`) CHOISIT, dans cet
 * ensemble et seulement dedans, lequel confier à la réplique en cours ; le moteur
 * RE-VÉRIFIE avec la MÊME fonction avant d'appliquer (`recit.ts`,
 * `consignerReponseActeur`). Il n'ouvre JAMAIS une porte que l'IA aurait décidée —
 * conforme à KR-280 : « le moteur évalue, jamais l'IA ».
 *
 * FAIL-CLOSED, SANS EXCEPTION (KR-280) : les quatre portes de `Revelation` se
 * testent EN CONJONCTION — JAMAIS en disjonction. `confiance_min` EST ÉVALUÉE
 * DEPUIS L'IT3 (n° 12 `moteur-acteurs`, lot `contrat` — `docs/REGLES-DU-JEU.md`
 * § 6) contre `faits.pnj[personnageId]?.confiance ?? CONFIANCE_DEPART` ; `jet`
 * reste une porte que cette itération ne sait pas encore évaluer (it4) et reste
 * FERMÉE, jamais ouverte par défaut. Un savoir SANS AUCUNE porte (`revele_si`
 * absent ou `{}`) ne se révèle JAMAIS de lui-même : contrairement à `porteOuverte`
 * (`atteignabilite.ts`), qui a la POLARITÉ INVERSE (analyse statique OPTIMISTE —
 * « peut un jour être atteint » — un savoir sans porte y rend `true`), cet
 * évaluateur est une FERMETURE PAR DÉFAUT — « est acquis MAINTENANT » — un savoir
 * sans porte y rend `'absent'`. `porteOuverte` n'est NI réutilisée NI appelée
 * d'ici (KR-288) : témoin greppable, `revelation.test.ts`.
 *
 * `contrepartie.consomme:true` RESTE STRUCTURELLEMENT FERMÉ en it2 : aucun retrait
 * d'objet n'est codé (futur verbe `donner <objet> <pnj>`, consentement structuré
 * du joueur). Une telle porte ferme le savoir, SANS ÉGARD à l'état de l'inventaire.
 *
 * LA MÉMOIRE (`a_dit`) SE TESTE EN PREMIER, avant toute porte : un savoir déjà
 * confié reste `'deja_confie'` MÊME SI une porte qui l'ouvrait s'est refermée
 * depuis (KR-013/175 — l'historique ne se réécrit pas).
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 *
 * NON EXPORTÉ PAR `brain/index.ts` — même doctrine que `PREDICATES`/`DELTAS` :
 * aucune feature n'évalue une révélation elle-même, c'est l'affaire du moteur de
 * session (le service qui dialogue avec le modèle, et `recit.ts`).
 */
import { MARQUEUR_A_ECRIRE } from './amorce'
import type { FaitsDeSession } from './faits'
import { estCleDe } from './identifiers'
import { PREDICATES } from './predicates'
import { CONFIANCE_DEPART, type Dossier, type Revelation, type Savoir } from './types'

/**
 * `'absent'` — fermé, jamais injecté à R4, jamais offert comme rang ;
 * `'revelable'` — toutes les portes POSÉES tiennent, et ni `confiance_min` ni
 *   `jet` n'en font partie : candidat à un rang `S<n>` ;
 * `'deja_confie'` — `a_dit` porte déjà cet indice pour ce personnage ; plus
 *   jamais offert, mais reste dans la mémoire « CE QUE TU LUI AS DÉJÀ CONFIÉ ».
 */
export type EtatSavoir = 'absent' | 'revelable' | 'deja_confie'

/** `faits.pnj[personnageId].a_dit` — appartenance PROPRE (KR-175), jamais `in`. */
function dejaConfie(faits: FaitsDeSession, personnageId: string, indiceId: string): boolean {
	return estCleDe(faits.pnj, personnageId) && faits.pnj[personnageId].a_dit.includes(indiceId)
}

/**
 * `formulation_joueur` vit sur l'INDICE (`Indice.formulation_joueur`), jamais sur
 * le `Savoir` qui le référence : un savoir dont l'indice visé n'a aucune
 * formulation rédigée (absente, vide, ou encore marquée `MARQUEUR_A_ECRIRE`) ne
 * peut être injecté à R4 — halluciner un savoir sans contenu serait pire que de
 * le taire.
 */
function formulationJoueurRedigee(dossier: Dossier, indiceId: string): string | undefined {
	const indice = dossier.monde.indices.find((candidat) => candidat.id === indiceId)
	const formulation = indice?.formulation_joueur
	if (formulation === undefined || formulation.trim() === '' || formulation.includes(MARQUEUR_A_ECRIRE)) {
		return undefined
	}
	return formulation
}

/**
 * LA CONJONCTION FAIL-CLOSED — une suite de gardes à sortie `false`, JAMAIS un
 * `some` : le `ET` des quatre portes se lit « aucune ne ferme », pas « au moins
 * une ouvre » (précédent `porteOuverte`, polarité inversée).
 *
 *  · AUCUNE porte posée (`revele_si` absent, ou `{}`) ⇒ FERMÉ — un savoir sans
 *    condition ne se révèle jamais de lui-même (distinct de `porteOuverte`, qui
 *    y lirait « rien ne ferme » et ouvrirait) ;
 *  · `confiance_min` POSÉE (n° 12, it3, `docs/REGLES-DU-JEU.md` § 6) ⇒ ouverte
 *    seulement si `faits.pnj[personnageId]?.confiance ?? CONFIANCE_DEPART ≥
 *    confiance_min` — LA MÊME CONSTANTE DE REPLI que `crediterConfiance`
 *    (`session.ts`), jamais un `0` recopié ici (KR-165) ;
 *  · `jet` POSÉ, quelle que soit sa valeur ⇒ FERMÉ — ce mécanisme n'existe pas
 *    encore (it4) ;
 *  · `contrepartie` POSÉE avec `consomme:true` ⇒ FERMÉ, structurellement, sans
 *    égard à l'inventaire — aucun retrait d'objet n'est codé en it2 ;
 *  · `contrepartie` POSÉE avec `consomme:false` ⇒ ouverte seulement si
 *    `PREDICATES.possede_objet` le confirme ;
 *  · `apres_indice_id` POSÉ ⇒ ouverte seulement si `PREDICATES.indice_connu` le
 *    confirme.
 *
 * `personnageId` EST LE SEUL AJOUT DE SIGNATURE DE L'IT3 : la lecture de
 * `confiance` est PAR-PNJ, jamais globale à la session — même isolation que
 * `a_dit` (KR-282 étendu). ÉVALUÉE EN LIGNE, JAMAIS VIA LE REGISTRE `PREDICATES`
 * (désaccord #10 du raffinage, tranché par l'orchestrateur) : c'est une
 * comparaison NUMÉRIQUE contre un état PAR-PNJ, pas une appartenance à un
 * registre fermé façon `possede_objet`/`indice_connu`.
 */
function portesOuvertes(faits: FaitsDeSession, personnageId: string, revele_si: Revelation | undefined): boolean {
	if (revele_si === undefined) return false
	if (Object.keys(revele_si).length === 0) return false

	if (revele_si.confiance_min !== undefined) {
		const confiance = estCleDe(faits.pnj, personnageId)
			? (faits.pnj[personnageId].confiance ?? CONFIANCE_DEPART)
			: CONFIANCE_DEPART
		if (confiance < revele_si.confiance_min) return false
	}
	if (revele_si.jet !== undefined) return false

	if (revele_si.contrepartie !== undefined) {
		if (revele_si.contrepartie.consomme) return false
		if (!PREDICATES.possede_objet.lit(faits, [revele_si.contrepartie.objet_id])) return false
	}

	if (revele_si.apres_indice_id !== undefined) {
		if (!PREDICATES.indice_connu.lit(faits, [revele_si.apres_indice_id])) return false
	}

	return true
}

/**
 * L'ÉTAT D'UN SAVOIR, contre les faits de session RÉELS d'UN personnage — PURE,
 * TOTALE sur un `savoir` issu d'un dossier accepté par `validateDossier`.
 *
 * ORDRE DES TROIS TESTS, FIGÉ :
 *  1. la MÉMOIRE (`a_dit`), AVANT toute porte — un savoir déjà confié ne redevient
 *     jamais `'absent'` ni `'revelable'`, même si une porte se referme ensuite ;
 *  2. le CONTENU — sans `formulation_joueur` rédigée sur l'indice visé, rien n'est
 *     injectable, et la porte ne se teste même pas ;
 *  3. les PORTES, en conjonction fail-closed (`portesOuvertes`).
 */
export function evaluerSavoir(
	dossier: Dossier,
	faits: FaitsDeSession,
	personnageId: string,
	savoir: Savoir,
): EtatSavoir {
	if (dejaConfie(faits, personnageId, savoir.indice_id)) return 'deja_confie'
	if (formulationJoueurRedigee(dossier, savoir.indice_id) === undefined) return 'absent'
	return portesOuvertes(faits, personnageId, savoir.revele_si) ? 'revelable' : 'absent'
}

/** Les `indice_id` des savoirs d'UN personnage dans l'état `etat`, DANS L'ORDRE
 *  de la fiche (`personnage.savoirs[]`) — jamais trié, jamais dédupliqué : un
 *  doublon d'`indice_id` sur la fiche reste visible tel quel. */
function savoirsDansEtat(
	dossier: Dossier,
	faits: FaitsDeSession,
	personnageId: string,
	etat: EtatSavoir,
): readonly string[] {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.id === personnageId)
	if (personnage === undefined) return []
	return personnage.savoirs
		.filter((savoir) => evaluerSavoir(dossier, faits, personnageId, savoir) === etat)
		.map((savoir) => savoir.indice_id)
}

/** LE CATALOGUE BORNÉ (KR-287) — les savoirs qu'un personnage PEUT confier
 *  MAINTENANT. R4 choisit DEDANS et seulement dedans ; le moteur RE-VÉRIFIE avec
 *  cette MÊME fonction avant d'appliquer (`recit.ts`). */
export function savoirsRevelables(dossier: Dossier, faits: FaitsDeSession, personnageId: string): readonly string[] {
	return savoirsDansEtat(dossier, faits, personnageId, 'revelable')
}

/** Les savoirs qu'un personnage a DÉJÀ confiés — jamais offerts de nouveau,
 *  injectés sans rang dans « CE QUE TU LUI AS DÉJÀ CONFIÉ » (`contexte/acteur.ts`). */
export function savoirsDejaConfies(dossier: Dossier, faits: FaitsDeSession, personnageId: string): readonly string[] {
	return savoirsDansEtat(dossier, faits, personnageId, 'deja_confie')
}
