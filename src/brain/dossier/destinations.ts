/**
 * QUI LIT QUOI — l'AUDIENCE de chaque champ terminal du dossier.
 *
 * Pourquoi cette table existe : `Pick<Dossier, 'canon' | 'monde'>` était la seule
 * signature de confinement dont on disposait, et elle ne confine RIEN DANS
 * `monde`. Or l'itération 2 y fait entrer des données strictement moteur —
 * `resolutions[].consequence`, `climat[].effets_regles`, les portes de
 * révélation, et `monstre_ref` qui résout vers `pv` / `armour` / `capacity`. Le
 * jour où la n° 10 écrit ce `Pick`, elle envoie tout cela au modèle. La table est
 * ce qui transforme une découverte de la n° 10 en une DÉCLARATION OBLIGATOIRE de
 * la n° 3 : chaque feature qui ajoute un champ au schéma ajoute sa ligne ici.
 *
 * ⚠ CE QU'AUCUN COMPILATEUR NE VÉRIFIE : les clés sont des CHAÎNES. Rien ne les
 * relie à `types.ts`, ni à `validate.ts`. L'exhaustivité de cette table est
 * portée par `couverture.test.ts` — un balayage pleine profondeur de la fixture
 * réelle qui échoue par NOM de champ sans destination — et par RIEN D'AUTRE. La
 * table n'est donc pas entrée seule : elle est entrée avec son garde. Les
 * dispenses (`SANS_DESTINATION`) vivent dans ce test, sous une assertion de
 * disjonction qui fait rougir toute dispense devenue inutile (BUG-044).
 *
 * CE QU'ELLE NE PROUVE PAS : qu'un champ `moteur` ou `auteur` n'atteint pas un
 * contexte de modèle. Aucun assembleur n'existe avant la n° 10 ; la table déclare
 * l'intention et force la déclaration, elle ne démontre pas le confinement.
 *
 * Elle n'est PAS ré-exportée par `brain/index.ts` : aucun consommateur hors de
 * `brain/dossier/` avant la n° 10.
 */

/**
 * · `ia` — le contenu du champ entre dans le contexte d'un appel au modèle (pour
 *   au moins un rôle ; la granularité par rôle appartient à l'assembleur n° 10).
 * · `moteur` — lu par le CODE seul : identifiants, portes, deltas, scènes émises
 *   verbatim, enveloppe de persistance. Jamais injecté.
 * · `auteur` — écrit et relu par l'auteur (et par le linter de la n° 7). Jamais
 *   injecté non plus, mais pour une autre raison : ce n'est pas une donnée de
 *   jeu, c'est une note de rédaction.
 */
export type Destination = 'ia' | 'moteur' | 'auteur'

/**
 * Les clés sont des chemins à INDICES EFFACÉS (`charpente.jalons[].enonce_texte`),
 * la même normalisation que celle du balayage — sinon ajouter un second
 * personnage doublerait les lignes.
 */
export const DESTINATION_DES_CHAMPS: Record<string, Destination> = {
	// ── L'enveloppe du document ───────────────────────────────────────────────
	// Lue par le code seul : `schema` est la garde de version, `id` est la clé de
	// stockage (`dossierKey`), `updatedAt` est le champ de comparaison de la
	// réconciliation cloud. `titre` est le seul des cinq qu'un humain lise — dans
	// la bibliothèque.
	schema: 'moteur',
	id: 'moteur',
	titre: 'auteur',
	createdAt: 'moteur',
	updatedAt: 'moteur',

	// ── canon — la couche toujours chargée ────────────────────────────────────
	// Tout le canon est injecté : c'est sa raison d'être. La séparation mj /
	// partage ne change pas l'audience mais le RÔLE qui la reçoit (le narrateur
	// voit `mj`, un PNJ non) — cette granularité appartient à l'assembleur n° 10.
	'canon.mj.synopsis_mj': 'ia',
	'canon.partage.accroche_joueur': 'ia',
	'canon.ton': 'ia',
	'canon.interdits_ton[]': 'ia',
	// Un identifiant est un HANDLE technique : le code le résout, le modèle reçoit
	// le CONTENU de l'entité, jamais sa clé. Même règle pour tous les `.id`.
	'canon.objectifs[].id': 'moteur',
	// `nom` est déclaré INTERNE par CLAUDE.md (« name (internal) + player-facing
	// description ») et il est déjà le OÙ du rapport d'anomalie. L'injecter
	// poserait le précédent que le nom de toute entité est injectable.
	'canon.objectifs[].nom': 'auteur',
	// À QUI appartient la victoire : une classification de moteur, même famille que
	// `personnages[].portee`. Injectée, elle apprendrait au narrateur quel camp doit
	// l'emporter — exactement ce que les conditions de réussite lui cachent déjà.
	'canon.objectifs[].camp': 'moteur',
	// D1 — les DIX lignes des cinq familles de conditions, et ZÉRO ajoutée à
	// l'ensemble injecté. Un `…_expr` est la seule autorité sur ce qui se déclenche
	// (moteur) ; son jumeau `…_texte` est la MÊME règle en français — injecté, il
	// apprendrait au modèle à FAIRE RÉUSSIR l'objectif, ou pire, à conduire à son
	// échec. Le champ est auteur (et linter n° 7), jamais `ia`.
	'canon.objectifs[].reussi_si_expr': 'moteur',
	'canon.objectifs[].reussi_si_texte': 'auteur',
	'canon.objectifs[].echoue_si_expr': 'moteur',
	'canon.objectifs[].echoue_si_texte': 'auteur',

	// ── monde.personnages ─────────────────────────────────────────────────────
	'monde.personnages[].id': 'moteur',
	'monde.personnages[].nom': 'auteur',
	// Premier ou second plan : une classification de profondeur de simulation.
	'monde.personnages[].portee': 'moteur',
	'monde.personnages[].plan_actions[].etape': 'moteur',
	// L'intention du personnage à cette étape — c'est ce que le rôle acteur joue,
	// et la seule raison d'être d'un plan d'actions. SEULE clé `ia` de la famille :
	// l'avancement d'étape, lui, est du code (n° 14).
	'monde.personnages[].plan_actions[].action': 'ia',
	'monde.personnages[].plan_actions[].declencheur_expr': 'moteur',
	// À ne pas confondre avec `action` ci-dessus : celle-ci est jouée, celui-là
	// décrit la condition de passage — une note de rédaction, jamais du contexte.
	'monde.personnages[].plan_actions[].declencheur_texte': 'auteur',
	// Le protocole de révélation (reporté n° 9-12, décision déjà écrite) injecte le
	// savoir sous la forme `{ indice_id, certitude, vérité }` et la sortie du modèle
	// renvoie `indices_reveles: string[]` : cet identifiant-là traverse le contexte.
	'monde.personnages[].savoirs[].indice_id': 'ia',
	// Un « croit » est une information fausse : c'est précisément ce que le modèle
	// doit savoir pour ne pas l'énoncer comme un fait.
	'monde.personnages[].savoirs[].certitude': 'ia',
	// Didascalie — injectée UNIQUEMENT quand la porte est ouverte.
	'monde.personnages[].savoirs[].revele_comment': 'ia',
	// Les quatre PORTES sont des données de moteur pur : elles se ferment à
	// l'assemblage du contexte, jamais par filtrage de la sortie du modèle. Le
	// modèle ne voit ni `carac`, ni `tc`, ni le seuil — au mieux un libellé dérivé.
	'monde.personnages[].savoirs[].revele_si.confiance_min': 'moteur',
	'monde.personnages[].savoirs[].revele_si.jet.carac': 'moteur',
	'monde.personnages[].savoirs[].revele_si.jet.tc': 'moteur',
	// Le prix DIT au joueur se dérive du `nom` de l'objet à l'assemblage : c'est le
	// nom qui est injecté, jamais l'identifiant ni le drapeau.
	'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id': 'moteur',
	'monde.personnages[].savoirs[].revele_si.contrepartie.consomme': 'moteur',
	'monde.personnages[].savoirs[].revele_si.apres_indice_id': 'moteur',

	// ── monde — les collections nommées ───────────────────────────────────────
	'monde.lieux[].id': 'moteur',
	'monde.lieux[].nom': 'auteur',
	'monde.objets[].id': 'moteur',
	'monde.objets[].nom': 'auteur',
	'monde.indices[].id': 'moteur',
	'monde.indices[].nom': 'auteur',
	'monde.quetes[].id': 'moteur',
	'monde.quetes[].nom': 'auteur',
	// Un delta est APPLIQUÉ par le moteur. Injecté, il apprendrait au modèle à
	// distribuer lui-même des récompenses.
	'monde.quetes[].recompense[]': 'moteur',

	// ── monde.evenements ──────────────────────────────────────────────────────
	'monde.evenements[].id': 'moteur',
	'monde.evenements[].nom': 'auteur',
	// Résolu, `monstre_ref` rend `pv`, `armour`, `weaponMultiplier`, `capacity` et
	// les stats. Le narrateur reçoit le NOM du monstre et le log d'assaut, point.
	'monde.evenements[].monstre_ref': 'moteur',
	'monde.evenements[].declencheur_expr': 'moteur',
	// Injecté, le narrateur ne laisserait pas l'embuscade SURVENIR : il la
	// provoquerait, ce qui est exactement la frontière que D1 trace.
	'monde.evenements[].declencheur_texte': 'auteur',
	// L'issue en français — ce que le narrateur joue quand la résolution survient.
	'monde.evenements[].resolutions[].resultat': 'ia',
	'monde.evenements[].resolutions[].consequence[]': 'moteur',

	// ── monde.conditions ──────────────────────────────────────────────────────
	'monde.conditions.climat[].id': 'moteur',
	'monde.conditions.climat[].nom': 'auteur',
	// SANS `[]` final, et ce n'est pas une coquille : la fixture porte ici une liste
	// VIDE, et une liste vide est une feuille — le balayage n'entre pas dedans, donc
	// il n'existe aucune feuille `…effets_regles[]` dont cette ligne déclarerait
	// l'audience. Un climat « modifie les règles » : sa nature est un opérande
	// ENTIER, que la règle d'admission de `DELTAS` n'accepte pas, et aucun des
	// quatre effets admis n'a de sens ambiant. Les trois autres emplacements, eux,
	// portent de vrais effets et gardent leur suffixe.
	'monde.conditions.climat[].effets_regles': 'moteur',

	// ── charpente — jamais vue ENTIÈRE ────────────────────────────────────────
	'charpente.depart.lieu_id': 'moteur',
	// Une scène d'ouverture est ÉMISE VERBATIM par le moteur : ce n'est pas du
	// contexte, c'est du texte joueur. La faire écrire au modèle la ferait varier.
	'charpente.depart.texte_ouverture_joueur': 'moteur',
	'charpente.jalons[].id': 'moteur',
	'charpente.jalons[].nom': 'auteur',
	// LE SEUL champ IA-facing de la charpente — et seulement pour un jalon ATTEINT.
	// L'énoncé d'un jalon non atteint est l'intrigue à venir : c'est du spoil, et le
	// modèle y conduirait.
	'charpente.jalons[].enonce_texte': 'ia',
	// Veto retenu : l'injecter mettrait la même règle dans le code ET dans le
	// prompt, et apprendrait au modèle à PROVOQUER le jalon. La n° 7 la lit pour
	// son linter, personne d'autre.
	'charpente.jalons[].declencheur_texte': 'auteur',
	// Jumeau structuré du précédent : même audience de moteur que les effets.
	'charpente.jalons[].declencheur_expr': 'moteur',
	'charpente.jalons[].effet[]': 'moteur',
	'charpente.fins[].id': 'moteur',
	'charpente.fins[].nom': 'auteur',
	// Un narrateur qui connaît les conditions de fin y conduit.
	'charpente.fins[].condition_texte': 'auteur',
	'charpente.fins[].condition_expr': 'moteur',
}

// ── RÉSERVÉ n° 4 `dossier-fiches` — DÉJÀ ARBITRÉ, à ne PAS re-dériver ─────────
// La sixième famille de conditions, `personnages[].contre_mesures[]`, n'a au
// schéma 1 ni type, ni racine, ni feature éditrice : la créer ici serait la
// « forme sans producteur ni consommateur » que la décision A interdit — et une
// ligne de table sans instance dans la fixture ferait rougir le balayage de
// couverture, par construction. Ses destinations sont pourtant tranchées ; elles
// vivent donc en COMMENTAIRE, jamais en lignes :
//   `…contre_mesures[].action`           → 'ia'      (seule de la famille, même
//                                                     raison que plan_actions[].action)
//   `…contre_mesures[].declencheur_expr` → 'moteur'
//   `…contre_mesures[].declencheur_texte`→ 'auteur'
//   `…contre_mesures[].delai`            → 'moteur'
//   `…contre_mesures[].portee`           → 'moteur'
// Aucun espace de noms à créer : le OÙ du rapport est le PERSONNAGE porteur,
// exactement comme `savoirs[]` et `plan_actions[]` aujourd'hui.
