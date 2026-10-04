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
 * § 6) contre `faits.pnj[personnageId]?.confiance ?? CONFIANCE_DEPART` ; `jet` EST
 * ÉVALUÉE DEPUIS L'IT4 (`docs/REGLES-DU-JEU.md` § 6, « La porte `jet` ») — EN
 * DERNIER, et par un TROISIÈME ÉTAT plutôt que par une ouverture : quand le `jet`
 * est la SEULE porte fermée, le savoir n'est ni `'absent'` ni `'revelable'` mais
 * `'sous_epreuve'` — mis en jeu, à tirer —, et une réussite acquise
 * (`epreuves`, voir `JetReussi`) le fait passer `'revelable'`. SANS `epreuves`, un
 * `jet` posé reste FERMÉ : jamais ouvert par défaut. Un savoir SANS AUCUNE porte
 * (`revele_si` absent ou `{}`) ne se révèle JAMAIS de lui-même : contrairement à
 * `porteOuverte` (`atteignabilite.ts`), qui a la POLARITÉ INVERSE (analyse
 * statique OPTIMISTE — « peut un jour être atteint » — un savoir sans porte y
 * rend `true`), cet évaluateur est une FERMETURE PAR DÉFAUT — « est acquis
 * MAINTENANT » — un savoir sans porte y rend `'absent'`. `porteOuverte` n'est NI
 * réutilisée NI appelée d'ici (KR-288) : témoin greppable, `revelation.test.ts`.
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
 * UNE RÉUSSITE ACQUISE — `{ carac, tc }`, le COUPLE qui identifie une épreuve pour UN
 * PNJ (`docs/REGLES-DU-JEU.md` § 6, « La porte `jet` ») : jamais un savoir, jamais
 * un identifiant. Même forme que `Revelation['jet']`, dont elle dérive — un jet
 * posé sur une fiche et une réussite acquise se comparent champ à champ, sans
 * traduction. Jamais stockée (KR-013) : `arbitre.ts` (`epreuvesReussies`) la
 * DÉRIVE du journal à chaque appel.
 */
export type JetReussi = NonNullable<Revelation['jet']>

/**
 * `'absent'` — fermé, jamais injecté à R4, jamais offert comme rang ;
 * `'revelable'` — toutes les portes POSÉES tiennent (le `jet`, s'il est posé, par
 *   une réussite acquise) : candidat à un rang `S<n>` ;
 * `'deja_confie'` — `a_dit` porte déjà cet indice pour ce personnage ; plus
 *   jamais offert, mais reste dans la mémoire « CE QUE TU LUI AS DÉJÀ CONFIÉ » ;
 * `'sous_epreuve'` (it4) — le `jet` est la SEULE porte fermée : `confiance_min`,
 *   `contrepartie` et `apres_indice_id`, quand elles sont posées, sont ouvertes, et
 *   aucune réussite acquise ne couvre ce `(carac, tc)`. Mis EN JEU, jamais offert
 *   comme rang tant qu'il le reste. ÉTAT DE SORTIE d'`evaluerSavoir`, jamais un
 *   paramètre d'entrée : c'est l'évaluateur qui le constate, jamais l'appelant.
 */
export type EtatSavoir = 'absent' | 'revelable' | 'deja_confie' | 'sous_epreuve'

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
 * LA CONJONCTION FAIL-CLOSED — une suite de gardes à sortie `'absent'`, JAMAIS un
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
 *  · `contrepartie` POSÉE avec `consomme:true` ⇒ FERMÉ, structurellement, sans
 *    égard à l'inventaire — aucun retrait d'objet n'est codé en it2 ;
 *  · `contrepartie` POSÉE avec `consomme:false` ⇒ ouverte seulement si
 *    `PREDICATES.possede_objet` le confirme ;
 *  · `apres_indice_id` POSÉ ⇒ ouverte seulement si `PREDICATES.indice_connu` le
 *    confirme ;
 *  · `jet` POSÉ (n° 12, it4, `docs/REGLES-DU-JEU.md` § 6, « La porte `jet` ») ⇒
 *    ÉVALUÉ EN DERNIER, APRÈS les gardes ci-dessus : ouvert par une réussite
 *    acquise du MÊME `(carac, tc)` (`epreuves`), sinon `'sous_epreuve'`. L'ORDRE
 *    EST LA RÈGLE : un `jet` évalué avant les autres ferait de la chance une clé
 *    pour une porte qu'une autre condition ferme encore (fuite par la chance,
 *    KR-280 à l'envers) — tant qu'une autre porte ferme, la réponse est
 *    `'absent'`, et AUCUN jet n'est demandé.
 *
 * `personnageId` EST LA SEULE LECTURE PAR-PNJ : `confiance` est PAR-PNJ, jamais
 * globale à la session — même isolation que `a_dit` (KR-282 étendu). ÉVALUÉE EN
 * LIGNE, JAMAIS VIA LE REGISTRE `PREDICATES` (désaccord #10 du raffinage it3,
 * tranché par l'orchestrateur) : c'est une comparaison NUMÉRIQUE contre un état
 * PAR-PNJ, pas une appartenance à un registre fermé façon `possede_objet`/
 * `indice_connu`. LE `jet` NON PLUS : un jet n'ÉVALUE pas, il ÉMET une demande
 * (`types.ts`, `Revelation`) — d'où l'état `'sous_epreuve'`, que cette fonction
 * rend à la place d'un booléen.
 */
function etatDesPortes(
	faits: FaitsDeSession,
	personnageId: string,
	revele_si: Revelation | undefined,
	epreuves: readonly JetReussi[],
): 'absent' | 'revelable' | 'sous_epreuve' {
	if (revele_si === undefined) return 'absent'
	if (Object.keys(revele_si).length === 0) return 'absent'

	if (revele_si.confiance_min !== undefined) {
		const confiance = estCleDe(faits.pnj, personnageId)
			? (faits.pnj[personnageId].confiance ?? CONFIANCE_DEPART)
			: CONFIANCE_DEPART
		if (confiance < revele_si.confiance_min) return 'absent'
	}

	if (revele_si.contrepartie !== undefined) {
		if (revele_si.contrepartie.consomme) return 'absent'
		if (!PREDICATES.possede_objet.lit(faits, [revele_si.contrepartie.objet_id])) return 'absent'
	}

	if (revele_si.apres_indice_id !== undefined) {
		if (!PREDICATES.indice_connu.lit(faits, [revele_si.apres_indice_id])) return 'absent'
	}

	// LE JET, EN DERNIER — toutes les autres portes POSÉES sont ouvertes ici.
	const jet = revele_si.jet
	if (jet !== undefined) {
		const acquis = epreuves.some((epreuve) => epreuve.carac === jet.carac && epreuve.tc === jet.tc)
		if (!acquis) return 'sous_epreuve'
	}

	return 'revelable'
}

/**
 * L'ÉTAT D'UN SAVOIR, contre les faits de session RÉELS d'UN personnage — PURE,
 * TOTALE sur un `savoir` issu d'un dossier accepté par `validateDossier`.
 *
 * ORDRE DES TROIS TESTS, FIGÉ :
 *  1. la MÉMOIRE (`a_dit`), AVANT toute porte — un savoir déjà confié ne redevient
 *     jamais `'absent'` ni `'revelable'`, même si une porte se referme ensuite ;
 *  2. le CONTENU — sans `formulation_joueur` rédigée sur l'indice visé, rien n'est
 *     injectable, et la porte ne se teste même pas : un savoir sans contenu n'est
 *     donc JAMAIS `'sous_epreuve'` (on ne demande pas un jet pour ne rien confier) ;
 *  3. les PORTES, en conjonction fail-closed (`etatDesPortes`), le `jet` EN DERNIER.
 *
 * `epreuves` — les réussites acquises par CE personnage, DÉRIVÉES du journal par
 * l'appelant (`epreuvesReussies`, `arbitre.ts`) : ABSENT, c'est `[]`, et un `jet`
 * posé reste fermé (KR-280, fail-closed — jamais ouvert par défaut).
 */
export function evaluerSavoir(
	dossier: Dossier,
	faits: FaitsDeSession,
	personnageId: string,
	savoir: Savoir,
	epreuves: readonly JetReussi[] = [],
): EtatSavoir {
	if (dejaConfie(faits, personnageId, savoir.indice_id)) return 'deja_confie'
	if (formulationJoueurRedigee(dossier, savoir.indice_id) === undefined) return 'absent'
	return etatDesPortes(faits, personnageId, savoir.revele_si, epreuves)
}

/** Les savoirs d'UN personnage dans l'état `etat`, DANS L'ORDRE de la fiche
 *  (`personnage.savoirs[]`) — jamais triés, jamais dédupliqués : un doublon
 *  d'`indice_id` sur la fiche reste visible tel quel. */
function savoirsDeLaFicheDansEtat(
	dossier: Dossier,
	faits: FaitsDeSession,
	personnageId: string,
	etat: EtatSavoir,
	epreuves: readonly JetReussi[],
): readonly Savoir[] {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.id === personnageId)
	if (personnage === undefined) return []
	return personnage.savoirs.filter((savoir) => evaluerSavoir(dossier, faits, personnageId, savoir, epreuves) === etat)
}

/** LE CATALOGUE BORNÉ (KR-287) — les savoirs qu'un personnage PEUT confier
 *  MAINTENANT. R4 choisit DEDANS et seulement dedans ; le moteur RE-VÉRIFIE avec
 *  cette MÊME fonction avant d'appliquer (`recit.ts`). `epreuves` (it4) : les
 *  réussites acquises de ce personnage — une réussite OUVRE le savoir qu'elle
 *  gardait, qui entre alors dans le catalogue comme n'importe quel autre. */
export function savoirsRevelables(
	dossier: Dossier,
	faits: FaitsDeSession,
	personnageId: string,
	epreuves: readonly JetReussi[] = [],
): readonly string[] {
	return savoirsDeLaFicheDansEtat(dossier, faits, personnageId, 'revelable', epreuves).map((savoir) => savoir.indice_id)
}

/** Les savoirs qu'un personnage a DÉJÀ confiés — jamais offerts de nouveau,
 *  injectés sans rang dans « CE QUE TU LUI AS DÉJÀ CONFIÉ » (`contexte/acteur.ts`).
 *  Sans `epreuves` : `a_dit` se teste AVANT toute porte, la réponse n'en dépend pas. */
export function savoirsDejaConfies(dossier: Dossier, faits: FaitsDeSession, personnageId: string): readonly string[] {
	return savoirsDeLaFicheDansEtat(dossier, faits, personnageId, 'deja_confie', []).map((savoir) => savoir.indice_id)
}

/**
 * LE SAVOIR MIS EN JEU — LE SEUL DÉCIDEUR (n° 12 `moteur-acteurs`, it4). Le PREMIER
 * savoir de la fiche, DANS L'ORDRE de `personnage.savoirs[]`, dont l'état est
 * `'sous_epreuve'` (`docs/REGLES-DU-JEU.md` § 6 : « un seul savoir à la fois »),
 * `undefined` sinon — personnage inconnu, ou aucun savoir dont le `jet` soit la
 * seule porte fermée.
 *
 * C'EST LE MOTEUR QUI CHOISIT, jamais R4 : la demande de jet de R4 ne désigne ni
 * savoir, ni `carac`, ni `tc` — ils se lisent dans `revele_si.jet` du savoir rendu
 * ici. Deux dérivations de « quel savoir est en jeu » seraient deux décideurs.
 *
 * ⚠ LE HÉROS N'EST PAS VISIBLE D'ICI : cette fonction ne lit que `faits`
 * (`session.monde`), qui ne porte pas `session.heros`. « Sans héros, aucun jet
 * n'est possible » (§ 6) est donc tenu PAR L'APPELANT qui voit la session —
 * l'assembleur de R4 (`contexte/acteur.ts`) —, jamais ici. Écrit ici parce que le
 * plan d'itération prêtait cette garde à cette fonction, ce que sa signature
 * (`faits`, pas `session`) ne permet pas.
 *
 * `epreuves` : les réussites acquises, comme pour `evaluerSavoir`. Passer les
 * réussites d'AVANT un pas (`epreuvesReussies(session, id, pas)`) rend le savoir
 * qui était en jeu AVANT le jet de ce pas — c'est ce qui désigne le savoir DÛ.
 */
export function savoirSousEpreuve(
	dossier: Dossier,
	faits: FaitsDeSession,
	personnageId: string,
	epreuves: readonly JetReussi[] = [],
): Savoir | undefined {
	return savoirsDeLaFicheDansEtat(dossier, faits, personnageId, 'sous_epreuve', epreuves)[0]
}
