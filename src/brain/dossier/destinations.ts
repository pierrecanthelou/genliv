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
import { CHARACTERISTIC_VALUES } from '../characteristics'
import { CURSEUR_VALUES } from './curseurs'

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
 * Les HUIT lignes des caractéristiques d'un personnage, DÉRIVÉES du registre
 * (KR-117) : huit chemins littéraux divergeraient de `CHARACTERISTICS` en silence.
 * La dérivation est ÉTALÉE ICI, au site, et ne devient pas un mécanisme partagé —
 * le jour où `caractere.curseurs` arrivera, il écrira SA propre dérivation.
 *
 * `moteur`, et l'arbitrage mérite d'être écrit ici plutôt que découvert à la
 * n° 10 : le chiffre est un SEUIL (`docs/REGLES-DU-JEU.md` § 2 — réussite = dés ≤
 * caractéristique). Un modèle qui lit `FO: 9` connaît la marge AVANT que
 * `challenge.ts` n'ait résolu ; il narrerait « tu forces la porte sans effort »
 * pendant que le moteur tire un échec. Ce qui remplace le chiffre côté prose est
 * déjà écrit par l'auteur : `apparence` et `fonction`, `ia` toutes les deux. Aucune
 * PARAPHRASE non plus (« FO élevée ») tant que la n° 10 n'aura pas livré un libellé
 * dérivé PAR LE CODE et sa propre ligne d'audience.
 *
 * AUCUNE LIGNE PORTEUSE `monde.personnages[].stats` — et ce n'est pas un oubli :
 * `feuillesDeLaFixture` ne rend jamais un objet NON VIDE comme feuille, donc une
 * telle ligne serait morte le jour même où elle est écrite, et l'assertion
 * « aucune ligne morte » de `couverture.test.ts` la ferait rougir aussitôt.
 */
const DESTINATION_DES_CARACTERISTIQUES: Record<string, Destination> = Object.fromEntries(
	CHARACTERISTIC_VALUES.map((carac) => [`monde.personnages[].stats.${carac}`, 'moteur' as Destination]),
)

/**
 * Les SIX lignes des curseurs de caractère, DÉRIVÉES du registre `CURSEURS`
 * (KR-117) exactement comme les huit caractéristiques ci-dessus. La promesse
 * écrite là-haut est tenue à la lettre : « le jour où `caractere.curseurs`
 * arrivera, il écrira SA propre dérivation » — deux étalements de trois lignes
 * plutôt qu'un mécanisme générique de « Record à clés fixes », dont le rayon
 * d'explosion serait le garde d'audience du schéma entier.
 *
 * `moteur`, MÊME ARBITRAGE que les huit caractéristiques et que
 * `relations[].intensite` : un modèle qui lit `mefiance: 8` connaît l'exacte
 * profondeur d'une méfiance que la scène n'a pas montrée, et il la joue au premier
 * tour, avant que le joueur ait rien observé. Ce qui remplace le chiffre côté prose
 * est déjà écrit par l'auteur, dans le MÊME bloc : `parler`, `jamais` et `cede_si`,
 * toutes trois `ia`. AUCUNE PARAPHRASE non plus (« très méfiant ») tant que la
 * n° 10 n'a pas livré un libellé dérivé PAR LE CODE et sa propre ligne d'audience —
 * `open_question` « libellés dérivés », propriétaire n° 10, non réélargie ici.
 *
 * CE QUE L'AFFINITÉ NE CHANGE PAS : le champ `affinite` (`CA`/`IN`/`IG`) du
 * registre ne franchit JAMAIS le document — c'est une donnée de code, sans clé de
 * schéma, donc sans ligne dans cette table. Il n'y a rien à classer là.
 *
 * AUCUNE LIGNE PORTEUSE `…caractere` NI `…caractere.curseurs` — même raison que
 * pour `…stats` : `feuillesDeLaFixture` ne rend jamais un objet NON VIDE comme
 * feuille, donc une telle ligne serait morte le jour même où elle est écrite, et
 * l'assertion « aucune ligne morte » de `couverture.test.ts` la ferait rougir.
 */
const DESTINATION_DES_CURSEURS: Record<string, Destination> = Object.fromEntries(
	CURSEUR_VALUES.map((curseur) => [`monde.personnages[].caractere.curseurs.${curseur}`, 'moteur' as Destination]),
)

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
	// D1 — les DIX lignes posées par l'itération 3 de la n° 1 (cinq familles à
	// l'époque ; la sixième, `contre_mesures[]`, est arrivée avec la fiche de
	// personnage en n° 4 et vit dans la section du personnage plus bas), et ZÉRO
	// ajoutée à l'ensemble injecté. Un `…_expr` est la seule autorité sur ce qui se déclenche
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
	// De quel côté ce personnage joue. `moteur`, et la question s'est posée contre
	// `ia` : le camp d'un PNJ est un SPOILER, pas du décor. Un narrateur qui sait
	// qu'un personnage est antagoniste le joue hostile avant que la scène ne l'ait
	// révélé — exactement ce que `canon.objectifs[].camp` cache déjà pour la même
	// raison. Ce que le modèle doit savoir d'un antagoniste, ce sont ses moyens
	// (`plan_actions[].action`), jamais son étiquette.
	'monde.personnages[].camp': 'moteur',
	// Un identifiant est un HANDLE technique : il est résolu par le code, jamais
	// injecté tel quel — même règle que tous les `.id` et que
	// `charpente.depart.lieu_id`. Ce que l'assembleur n° 10 en tirera est le CONTENU
	// de l'objectif rattaché, sous l'audience de l'objectif, pas cette clé.
	'monde.personnages[].objectif_id': 'moteur',
	// LES TROIS PROSES D'IDENTITÉ sont `ia`, par le MÊME arbitrage que les trois
	// proses de `monde.lieux[]` ci-dessous : `auteur` est réservé à ce qui n'est PAS
	// de la donnée de jeu (le `nom`, un jumeau `…_texte`). Le métier d'un PNJ, sa
	// voix, ce que le bourg raconte de lui : le narrateur du Temps 2 doit les LIRE
	// pour l'INCARNER, exactement comme il lit l'odeur d'une grotte pour la décrire.
	// Ce ne sont pas des notes de rédaction.
	//
	// LE SUFFIXE `_joueur` DÉSIGNE L'AUDIENCE, JAMAIS LE RÉGIME — et les deux régimes
	// coexistent DÉJÀ sous ce suffixe, ce qui interdit d'en déduire quoi que ce soit :
	// `canon.partage.accroche_joueur` est `ia`, `charpente.depart.texte_ouverture_joueur`
	// est `moteur`. `description_joueur` est INJECTÉE au modèle, jamais émise verbatim :
	// les proses que le joueur lit mot pour mot sont `texte_ouverture_joueur` et
	// `charpente.fins[].texte` (itération 2 de la n° 6), et c'est précisément ce qui
	// les rend `moteur` toutes les deux.
	'monde.personnages[].fonction': 'ia',
	'monde.personnages[].apparence': 'ia',
	'monde.personnages[].description_joueur': 'ia',
	// Les HUIT caractéristiques — `moteur`, dérivées, motif complet à la déclaration
	// de la constante en tête de fichier. Étalées ici, à leur place dans la section
	// du personnage, plutôt que réunies en bas : l'ordre de la table est celui du
	// document, et c'est ce qui la rend relisible à côté de `types.ts`.
	...DESTINATION_DES_CARACTERISTIQUES,
	// LE BUT PROPRE DU PERSONNAGE (clé `but`, jamais `objectif` — KR-198). Deux
	// audiences dans un même bloc de trois champs, et la coupure est délibérée.
	//
	// `libelle` et `pourquoi` sont `ia` : ce sont des didascalies de jeu d'acteur —
	// ce que le personnage veut, et ce qui le pousse. C'est exactement ce qu'un rôle
	// acteur doit LIRE pour l'incarner, même famille que `plan_actions[].action`.
	'monde.personnages[].but.libelle': 'ia',
	'monde.personnages[].but.pourquoi': 'ia',
	// `echeance` est `auteur`, CONTRE la cohérence de voisinage avec ses deux sœurs,
	// et l'arbitrage mérite d'être écrit ici plutôt que redécouvert à la n° 10 : une
	// échéance en prose reste une DONNÉE D'HORLOGE. Le précédent le plus proche n'est
	// pas le bloc qui la porte, ce sont les `…_texte` (`evenements[]`, `jalons[]`),
	// tous `auteur` sous le motif « le narrateur ne doit pas provoquer ni improviser
	// ce que le moteur n'a pas constaté » — un narrateur qui lit « avant la pleine
	// lune » fait tomber l'échéance quand la scène s'y prête, pendant qu'aucune
	// horloge n'a tourné. Se desserre vers `ia` sans coût le jour où la n° 10 livre un
	// libellé d'écoulement DÉRIVÉ PAR LE CODE et sa propre ligne d'audience.
	'monde.personnages[].but.echeance': 'auteur',
	'monde.personnages[].plan_actions[].etape': 'moteur',
	// L'intention du personnage à cette étape — c'est ce que le rôle acteur joue,
	// et la seule raison d'être d'un plan d'actions. SEULE clé `ia` de la famille :
	// l'avancement d'étape, lui, est du code (n° 14).
	'monde.personnages[].plan_actions[].action': 'ia',
	'monde.personnages[].plan_actions[].declencheur_expr': 'moteur',
	// À ne pas confondre avec `action` ci-dessus : celle-ci est jouée, celui-là
	// décrit la condition de passage — une note de rédaction, jamais du contexte.
	'monde.personnages[].plan_actions[].declencheur_texte': 'auteur',
	// Un COMPTE DE PAS D'HORLOGE : c'est le moteur qui compte, et lui seul. Injecté,
	// il apprendrait au narrateur combien de temps il reste — il jouerait l'urgence
	// que le moteur n'a pas encore constatée, ou la dirait au joueur. Le libellé
	// d'écoulement qui remplacera un jour ce chiffre côté prose n'existe pas : il
	// appartient à la n° 10, avec sa propre ligne d'audience (même doctrine que les
	// caractéristiques ci-dessus — aucune paraphrase en attendant).
	'monde.personnages[].plan_actions[].duree': 'moteur',
	// La DIDASCALIE DE SORTIE — `ia`, mais SOUS CONDITION D'ÉTAT, et c'est le seul
	// champ du schéma dont l'injection dépend d'un fait de session : elle n'entre
	// dans le contexte QUE si le moteur a déclaré l'étape bloquée. Livrée avec le
	// reste de l'étape, elle apprendrait au narrateur la porte de sortie avant que le
	// joueur n'ait rien bloqué — il la jouerait d'avance. La table dit l'AUDIENCE ;
	// le MOMENT est la charge de l'assembleur n° 10, qui trouvera la promesse écrite
	// ici et au JSDoc du champ.
	'monde.personnages[].plan_actions[].si_bloque': 'ia',
	// ── LES CINQ LIGNES DE `contre_mesures[]` — DÉJÀ ARBITRÉES, jamais redébattues
	// (KR-196). Elles vivaient en COMMENTAIRE en fin de ce fichier depuis
	// l'itération 3 de la n° 1, faute de type et de fixture pour les porter ; elles
	// sont ici mot pour mot, à leur place dans la section du personnage.
	//
	// `action` est la SEULE clé `ia` de la famille, même raison que
	// `plan_actions[].action` : c'est ce que le rôle acteur joue.
	'monde.personnages[].contre_mesures[].action': 'ia',
	'monde.personnages[].contre_mesures[].declencheur_expr': 'moteur',
	// Même veto que partout ailleurs : un narrateur qui connaît la condition
	// d'armement PROVOQUE la riposte au lieu de la laisser survenir.
	'monde.personnages[].contre_mesures[].declencheur_texte': 'auteur',
	// Même famille que `plan_actions[].duree` : un compte de pas d'horloge.
	'monde.personnages[].contre_mesures[].delai': 'moteur',
	// Une classification de portée d'effet, même famille que `portee` ci-dessus.
	'monde.personnages[].contre_mesures[].portee': 'moteur',
	// LE PROTOCOLE DE RÉVÉLATION (reporté n° 9-12, décision déjà écrite) fait
	// traverser le contexte à cet identifiant : c'est ce qui rend la ligne `ia`, et
	// la valeur ne change pas.
	//
	// ⚠ CORRECTION (itération 6 de la n° 4, MISE À JOUR à l'itération 1 de la n° 6) —
	// une version de ce commentaire décrivait la charge utile comme
	// `{ indice_id, certitude, vérité }` alors que `vérité` N'EXISTAIT PAS : les
	// `monde.indices[]` étaient des `Entite` nues (`id` + `nom` optionnel), et le champ
	// qui porte le CONTENU d'un indice appartenait à la n° 6, qui ne l'avait pas encore
	// écrit. ELLE L'A ÉCRIT : `monde.indices[].verite` est une ligne de cette table,
	// plus bas, `ia` SOUS CONDITION D'ÉTAT. La promesse cesse donc d'être fausse — mais
	// la clé s'écrit `verite`, sans accent, comme toute clé du document.
	//
	// CE QUI EST RÉELLEMENT PRÉVU, et reste à écrire en n° 12 : le savoir est
	// RECOMPOSÉ PAR LE CODE avant injection — un RANG dans la liste des savoirs
	// injectés, sa `certitude`, et le contenu de l'indice (`verite` quand le moteur l'a
	// constaté acquis, `formulation_joueur` sinon). Jamais le `nom` de l'indice, qui
	// est `auteur` (KR-195). La sortie du modèle renvoie ces RANGS, que le code
	// re-résout en identifiants : c'est ce va-et-vient — pas la clé écrite telle
	// quelle — qui fait traverser cet identifiant.
	'monde.personnages[].savoirs[].indice_id': 'ia',
	// Un « croit » est une information fausse : c'est précisément ce que le modèle
	// doit savoir pour ne pas l'énoncer comme un fait.
	'monde.personnages[].savoirs[].certitude': 'ia',
	// LA DIDASCALIE DE RÉVÉLATION — `ia`, mais SOUS CONDITION D'ÉTAT, comme
	// `plan_actions[].si_bloque`. LE PRÉDICAT est écrit ICI et au JSDoc de
	// `Savoir.revele_comment`, nulle part ailleurs :
	//
	// `revele_comment` n'entre dans le contexte d'un appel au modèle **que** lorsque
	// le **moteur** a constaté ouvertes les portes que ce savoir porte (`revele_si`).
	// Il n'entre **jamais** avant cette constatation, ni **seul**, sans le savoir
	// qu'il accompagne. Un savoir SANS aucune porte n'ouvre jamais ce chemin de
	// lui-même : `validateDossier` en avertit (`revelation-sans-porte`), sans bloquer.
	//
	// ⚠ CORRECTION (itération 6 de la n° 4) : la version précédente disait « quand LA
	// porte est ouverte », AU SINGULIER, et ne nommait pas QUI la constate. Il y en a
	// QUATRE (les cinq lignes ci-dessous), et c'est le moteur qui les constate, jamais
	// le modèle. La table dit l'AUDIENCE, le MOMENT est la charge de la n° 10.
	'monde.personnages[].savoirs[].revele_comment': 'ia',
	// Les quatre PORTES sont des données de moteur pur : elles se ferment à
	// l'assemblage du contexte, jamais par filtrage de la sortie du modèle. Le
	// modèle ne voit ni `carac`, ni `tc`, ni le seuil — au mieux un libellé dérivé.
	'monde.personnages[].savoirs[].revele_si.confiance_min': 'moteur',
	'monde.personnages[].savoirs[].revele_si.jet.carac': 'moteur',
	'monde.personnages[].savoirs[].revele_si.jet.tc': 'moteur',
	// LA CONTREPARTIE est un prix STRUCTURÉ : `objet_id` est un HANDLE que le code
	// résout, `consomme` un drapeau que le moteur applique. Ni l'un ni l'autre n'est
	// injecté.
	//
	// ⚠ CORRECTION (itération 6 de la n° 4) — la version précédente promettait que
	// « le prix DIT au joueur se dérive du `nom` de l'objet à l'assemblage : c'est le
	// nom qui est injecté ». Or `monde.objets[].nom` est `auteur` (ligne plus bas dans
	// cette même table, KR-195) : RIEN n'est injectable de cette porte aujourd'hui, et
	// une ligne d'audience ne peut pas promettre ce qu'une autre ligne de la même
	// table interdit. C'est le MÊME trou que celui écrit au JSDoc de
	// `Relation.cible_id`, et il a la MÊME réponse : l'appellation que le joueur
	// entendra sera une PROJECTION de l'assembleur n° 10 — jamais une bascule de `nom`
	// vers `ia`, jamais une clé de plus au schéma. La question est TRANSVERSE à toutes
	// les entités nommées du dossier et n'est PAS rouverte ici (KR-195).
	'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id': 'moteur',
	'monde.personnages[].savoirs[].revele_si.contrepartie.consomme': 'moteur',
	'monde.personnages[].savoirs[].revele_si.apres_indice_id': 'moteur',

	// ── LES QUATRE LIGNES DE `relations[]` (itération 5 de la n° 4) ───────────
	// Un identifiant est un HANDLE technique : le code le résout, le modèle reçoit
	// le CONTENU. ⚠ ce qu'il résout n'est PAS injectable aujourd'hui (`nom` est
	// `auteur`, KR-195) — le raisonnement complet est au JSDoc de `Relation.cible_id`.
	'monde.personnages[].relations[].cible_id': 'moteur',
	// La NATURE du lien en français (« son frère », « son créancier ») — `ia`, même
	// famille que `plan_actions[].action` : c'est ce que le rôle acteur JOUE. C'est aussi
	// ce qui remplace le chiffre côté prose, et la raison pour laquelle `intensite` peut
	// rester `moteur` sans appauvrir la scène.
	'monde.personnages[].relations[].lien': 'ia',
	// L'INTENSITÉ — `moteur`, exactement pour la raison des huit caractéristiques et des
	// six curseurs à venir (KR-193, open_question « libellés dérivés ») : un NOMBRE SIGNÉ
	// qui code un fait de jeu, et dont le seul consommateur écrit en fait un SEUIL (plan
	// de cible § 2.6 : deux PNJ dans un même lieu et `intensite >= 1` → le moteur
	// transfère l'indice hors caméra). Un modèle qui lit `-2` connaît l'exacte profondeur
	// d'une inimitié que la scène n'a pas montrée : il la joue au premier tour, avant que
	// le joueur ait rien observé. AUCUNE PARAPHRASE non plus (« très hostile ») tant que
	// la n° 10 n'a pas livré un libellé dérivé PAR LE CODE et sa propre ligne d'audience.
	'monde.personnages[].relations[].intensite': 'moteur',
	// LE DRAPEAU DE SECRET — `moteur`, et il ne se contente pas de rester hors contexte :
	// il COMMANDE l'injection de SA PROPRE LIGNE. La table dit l'AUDIENCE, le MOMENT est
	// la charge de la n° 10 — même dispositif que `plan_actions[].si_bloque`. LE PRÉDICAT
	// est écrit ICI et au JSDoc de `Relation.secret`, nulle part ailleurs :
	//
	// Une ligne de `relations[]` n'entre **que** dans le contexte de l'appel **acteur du
	// personnage QUI LA PORTE**. Si `secret !== true`, elle entre **en plus** dans le
	// contexte du **narrateur**, pour une scène où le porteur est présent. Elle n'entre
	// **jamais** dans le contexte d'un **autre** personnage, ni dans celui de la
	// **cible**, ni dans celui de l'arbitre.
	'monde.personnages[].relations[].secret': 'moteur',
	// ── LES DEUX LIGNES DE `presence[]` ───────────────────────────────────────
	// Encore un HANDLE, même règle que `charpente.depart.lieu_id` : le code résout, le
	// modèle reçoit le lieu sous l'audience DU LIEU, jamais cette clé.
	'monde.personnages[].presence[].lieu_id': 'moteur',
	// `auteur`, MÊME ARBITRAGE que `but.echeance` (it4) et A FORTIORI : une échéance
	// anticipée fait tomber une horloge en avance ; une DISPONIBILITÉ lue par le
	// narrateur le fait CONTREDIRE la scène que le moteur vient d'assembler — « il n'est
	// là que la nuit » narré alors que le moteur a placé le PNJ ici à midi, c'est le
	// modèle qui décide d'une présence, donc d'un état. Le moment courant vient de la
	// SESSION, jamais de la fiche ; la couleur du lieu est déjà `ia` (`lieux[].ambiance`).
	// Se desserre vers `ia` sans coût le jour où la n° 14 livre un jumeau `quand_expr`
	// évaluable, ou la n° 10 un libellé de disponibilité DÉRIVÉ PAR LE CODE avec sa
	// propre ligne d'audience. Aucune PARAPHRASE en attendant.
	'monde.personnages[].presence[].quand': 'auteur',

	// ── LES NEUF LIGNES DE `caractere` (itération 8 de la n° 4) ───────────────
	// SIX curseurs `moteur`, TROIS proses `ia`, et la coupure est l'arbitrage : le
	// chiffre reste au moteur, la voix va au modèle. Motif complet des six premières
	// à la déclaration de `DESTINATION_DES_CURSEURS`, en tête de fichier.
	...DESTINATION_DES_CURSEURS,
	// L'ÉCHANTILLON DE VOIX — `ia`, et c'est la raison d'être du champ : ces phrases
	// disent au modèle COMMENT parler, elles ne lui donnent pas de quoi réciter. Même
	// famille que `plan_actions[].action` et `relations[].lien` — de la prose de jeu
	// d'acteur, jamais lue telle quelle par le joueur. Sa cardinalité est une borne
	// d'INTERFACE (`PARLER_REPLIQUES`) : un document qui en porte davantage est
	// accepté, et c'est l'assembleur n° 10 qui tronque à l'injection.
	'monde.personnages[].caractere.parler[]': 'ia',
	// LA LIMITE ABSOLUE — `ia` sans condition : c'est le garde-fou que le rôle acteur
	// doit lire AVANT de décider quoi que ce soit. Un narrateur qui l'ignore fait
	// franchir à un personnage la seule ligne que l'auteur ait déclarée infranchissable.
	'monde.personnages[].caractere.jamais': 'ia',
	// CE QUI LE FAIT CÉDER — `ia`, mais SOUS CONDITION DE RÔLE, et c'est le SECOND
	// champ du schéma dont l'injection dépend de QUI DEMANDE (après `Relation.secret`)
	// — le premier qu'aucun fait de session ne conditionne. LE PRÉDICAT est écrit ICI
	// et au JSDoc de `Caractere.cede_si`, nulle part ailleurs :
	//
	// `cede_si` n'entre **que** dans le contexte de l'appel **acteur du personnage
	// QUI LE PORTE**. Il n'entre **jamais** dans le contexte du **narrateur**, ni
	// dans celui d'un **autre** personnage, ni dans celui de l'**arbitre**. Aucun
	// fait de session ne le conditionne : dans cet appel-là il est injecté **dès le
	// premier tour**, sans que le moteur ait rien à constater — il n'a ni jumeau
	// `…_expr`, ni ligne dans `FAMILLES_DE_CONDITIONS`, et rien à quoi
	// `validateDossier` puisse l'adosser.
	//
	// Ce que cela règle : livré au NARRATEUR, ce champ lui apprendrait où appuyer
	// pour faire plier n'importe quel PNJ — il l'utiliserait au premier tour, avant
	// que le joueur ait rien deviné. Livré à un AUTRE personnage, il ferait connaître
	// à celui-ci une faiblesse que le porteur n'a dite à personne.
	'monde.personnages[].caractere.cede_si': 'ia',

	// ── monde — les collections nommées ───────────────────────────────────────
	'monde.lieux[].id': 'moteur',
	'monde.lieux[].nom': 'auteur',
	// LES TROIS PROSES D'UN LIEU sont `ia`, et la question s'est réellement posée
	// contre `auteur` : `auteur` est réservé à ce qui n'est PAS de la donnée de jeu
	// — une note de rédaction (`nom`, un jumeau `…_texte`). Un piège tendu près d'un
	// autel, une odeur de cendre froide, un prédateur qui rôde : le narrateur du
	// Temps 2 doit les LIRE pour raconter le lieu, au même titre qu'un
	// `plan_actions[].action`. Injectées, jamais émises verbatim — les proses que le
	// joueur lit mot pour mot sont `charpente.depart.texte_ouverture_joueur` et
	// `charpente.fins[].texte`, et elles sont `moteur` pour cette raison exacte.
	'monde.lieux[].description': 'ia',
	'monde.lieux[].ambiance': 'ia',
	'monde.lieux[].dangers': 'ia',
	'monde.objets[].id': 'moteur',
	'monde.objets[].nom': 'auteur',
	// LA PROSE D'UN OBJET est `ia`, et la question s'est posée contre `auteur`
	// exactement comme pour les trois proses d'un `Lieu` juste au-dessus : `auteur`
	// est réservé à ce qui n'est PAS de la donnée de jeu. Ce que le joueur voit et
	// comprend d'un objet qu'il tient, le narrateur du Temps 2 doit le LIRE pour le
	// raconter. Injectée, jamais émise verbatim — les proses lues mot pour mot sont
	// `charpente.depart.texte_ouverture_joueur` et `charpente.fins[].texte`, et c'est
	// ce qui les rend `moteur`. Le `nom` juste au-dessus reste `auteur` (KR-195,
	// question transverse non rouverte ici) : c'est la ligne que ce champ vient
	// soulager, et non remplacer.
	'monde.objets[].description_joueur': 'ia',
	'monde.indices[].id': 'moteur',
	'monde.indices[].nom': 'auteur',
	// ── LES TROIS LIGNES D'UN INDICE (itération 1 de la n° 6) ─────────────────
	// LA VÉRITÉ — `ia`, mais SOUS CONDITION D'ÉTAT, comme `plan_actions[].si_bloque`
	// et `savoirs[].revele_comment` : elle n'entre dans le contexte d'un appel au
	// modèle QUE lorsque le moteur a constaté cet indice ACQUIS (le carnet d'indices,
	// n° 12 `moteur-acteurs`). Livrée d'avance, elle apprendrait au narrateur la
	// solution de l'énigme avant que le joueur ait rien cherché — et il y conduirait,
	// exactement comme un `declencheur_texte` injecté ferait provoquer l'embuscade.
	// La table dit l'AUDIENCE ; le MOMENT est la charge de l'assembleur n° 10, qui
	// trouvera la promesse écrite ici et au JSDoc du champ.
	//
	// `ia` ET NON `auteur`, et la question s'est posée : ce n'est pas une note de
	// rédaction mais de la DONNÉE DE JEU — sans elle, un PNJ qui révèle un savoir n'a
	// rien à révéler, et c'est tout l'objet du protocole de la n° 12.
	'monde.indices[].verite': 'ia',
	// CE QUE LE JOUEUR PERÇOIT — `ia` sans condition, même famille que
	// `monde.objets[].description_joueur` et les trois proses d'un `Lieu` : le
	// narrateur du Temps 2 doit la LIRE pour raconter ce que le héros remarque.
	// Injectée, jamais émise verbatim — les proses lues mot pour mot sont
	// `charpente.depart.texte_ouverture_joueur` et `charpente.fins[].texte`, et c'est
	// ce qui les rend `moteur`. Le suffixe `_joueur` désigne l'AUDIENCE, jamais le
	// RÉGIME.
	'monde.indices[].formulation_joueur': 'ia',
	// LES ENCHAÎNEMENTS — `moteur`. Un identifiant est un HANDLE : le code résout, le
	// modèle reçoit le CONTENU de l'indice débloqué sous l'audience de CET indice-là,
	// jamais cette clé. Injectée, la liste apprendrait au narrateur la suite de
	// l'enquête — il y mènerait le joueur au lieu de le laisser chercher.
	'monde.indices[].mene_a[]': 'moteur',
	'monde.quetes[].id': 'moteur',
	'monde.quetes[].nom': 'auteur',
	// ── LES QUATRE LIGNES D'UNE QUÊTE (itération 3 de la n° 6) ────────────────
	// TROIS AUDIENCES DANS QUATRE CHAMPS, et la coupure EST l'arbitrage.
	//
	// LE DONNEUR est un HANDLE technique : le code le résout, le modèle reçoit le
	// CONTENU du personnage sous l'audience DU PERSONNAGE, jamais cette clé — même
	// règle que tous les `…_id` du schéma (`relations[].cible_id`,
	// `personnages[].objectif_id`, `charpente.depart.lieu_id`).
	'monde.quetes[].donneur_id': 'moteur',
	// CE QUE LE DONNEUR DEMANDE — `ia`, et la question s'est posée contre `auteur` :
	// c'est le CONTENU JOUABLE de la quête, celui sans lequel un narrateur n'a rien à
	// faire de cette entrée du registre. `auteur` est réservé à ce qui n'est PAS de la
	// donnée de jeu (le `nom`, un jumeau `…_texte`, une note de pacing comme
	// l'`echeance` juste en dessous). Injectée, jamais émise verbatim : les proses que
	// le joueur lit mot pour mot sont `charpente.depart.texte_ouverture_joueur` et
	// `charpente.fins[].texte`, et c'est ce qui les rend `moteur` toutes les deux.
	'monde.quetes[].consigne': 'ia',
	// LE DÉROULÉ — `ia`, PAR COHÉRENCE AVEC `consigne` et par analogie au précédent
	// structurel direct `plan_actions[].action`, déjà `ia` : une étape de quête est le
	// même type de contenu jouable que la consigne (ce que le joueur doit accomplir),
	// et la livrer au modèle est toute la raison d'être du champ.
	//
	// AUCUNE LIGNE PORTEUSE `monde.quetes[].etapes` — même raison que pour `…stats` et
	// `…caractere` : `feuillesDeLaFixture` ne rend jamais un objet NON VIDE comme
	// feuille, donc une telle ligne serait morte le jour même où elle est écrite, et
	// l'assertion « aucune ligne morte » de `couverture.test.ts` la ferait rougir.
	'monde.quetes[].etapes[].libelle': 'ia',
	// POUR QUAND — `auteur`, CONTRE le voisinage immédiat de `consigne` et
	// d'`etapes[].libelle`, et l'arbitrage mérite d'être écrit ici plutôt que
	// redécouvert à la n° 10. PRÉCÉDENT EXACT `but.echeance` (itération 4 de la n° 4),
	// mot pour mot : une échéance en prose reste une DONNÉE D'HORLOGE, et le précédent
	// le plus proche n'est pas le bloc qui la porte, ce sont les `…_texte`
	// (`evenements[]`, `jalons[]`), tous `auteur` sous le motif « le narrateur ne doit
	// pas provoquer ni improviser ce que le moteur n'a pas constaté » — un narrateur
	// qui lit « avant que la caravane ne reparte » fait tomber l'échéance quand la
	// scène s'y prête, pendant qu'aucune horloge n'a tourné. Se desserre vers `ia`
	// sans coût le jour où la n° 10 livre un libellé d'écoulement DÉRIVÉ PAR LE CODE
	// et sa propre ligne d'audience. Aucune PARAPHRASE en attendant.
	'monde.quetes[].echeance': 'auteur',
	// Un delta est APPLIQUÉ par le moteur. Injecté, il apprendrait au modèle à
	// distribuer lui-même des récompenses.
	'monde.quetes[].recompense[]': 'moteur',

	// ── monde.evenements ──────────────────────────────────────────────────────
	'monde.evenements[].id': 'moteur',
	'monde.evenements[].nom': 'auteur',
	// LE RATTACHEMENT À LA TRAME (itération 4 de la n° 6) — `moteur`, et la question
	// s'est posée contre `ia` : c'est une CLASSIFICATION, même famille que
	// `personnages[].portee` (profondeur de simulation) et `objectifs[].camp` (à qui
	// la victoire appartient), tous deux `moteur` pour la même raison. Injecté, ce
	// drapeau apprendrait au narrateur QUELLES rencontres sont décoratives : il jouerait
	// les libres comme du remplissage et conduirait le joueur vers les autres — le
	// symétrique exact du veto D1 sur `declencheur_texte`, deux lignes plus bas.
	//
	// `moteur` ET NON `auteur` non plus : ce n'est pas une note de rédaction mais un
	// FILTRE que le code lit — l'écran des événements partage la collection en deux
	// onglets sur cette seule valeur.
	'monde.evenements[].lie_a_histoire': 'moteur',
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
	// LA PROSE DE FIN (itération 2 de la n° 6) — `moteur`, SECOND champ du schéma
	// émis VERBATIM au joueur après `charpente.depart.texte_ouverture_joueur`, et
	// pour la même raison exacte : ce n'est pas du contexte, c'est du texte joueur
	// — la faire écrire au modèle la ferait varier d'une partie à l'autre.
	// `moteur` ET NON `ia`, contre le voisinage des proses en `…_joueur` du monde
	// (`objets[].description_joueur`, `indices[].formulation_joueur`), qui sont
	// injectées et jamais émises telles quelles : le suffixe désigne l'AUDIENCE,
	// jamais le RÉGIME, et ce champ-ci n'en porte pas. `moteur` ET NON `auteur`
	// non plus — ce n'est pas une note de rédaction, c'est la seule chose que le
	// joueur lira de cette fin. Consommateur : n° 15 `moteur-fins`.
	'charpente.fins[].texte': 'moteur',
}

// ── LA RÉSERVE DE LA n° 4 EST LEVÉE ──────────────────────────────────────────
// Les cinq destinations de `personnages[].contre_mesures[]`, tenues en commentaire
// ici depuis l'itération 3 de la n° 1 faute de type, de racine et de fixture pour
// les porter, sont LIGNES DE TABLE depuis l'itération 4 de la n° 4 — dans la
// section du personnage, à leur place dans l'ordre du document. Les valeurs sont
// celles qui étaient écrites, sans une modification (KR-196).
//
// Aucun espace de noms n'a été créé pour elles : le OÙ du rapport est le
// PERSONNAGE porteur, exactement comme `savoirs[]` et `plan_actions[]`.
