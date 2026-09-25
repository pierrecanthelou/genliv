# Brief de cadrage — `moteur-interprete` (n° 10, roadmap § 3)

Tu participes au **tour 1** du cadrage de la feature `moteur-interprete`. Lis `CLAUDE.md`, `docs/ROADMAP-BASCULE-IA.md` (déjà largement résumé ci-dessous, mais relis toi-même la ligne n° 10 et les alentours), et `src/features/moteur-dossier/specification.json` (la feature n° 9, dont celle-ci dépend directement — TERMINÉE 4/4, `0.7.5`) avant de te prononcer. Ce brief condense la recherche déjà faite par l'orchestrateur pour t'éviter de la refaire ; vérifie toi-même les affirmations qui touchent ton domaine avant de t'appuyer dessus.

## Intention de la feature (roadmap § 3, ligne 10)

« …écrire ce qu'il veut faire en langage libre » — 4 itérations prévues, comité 5 rôles, dépend de n° 9.

Paragraphe du roadmap : « rôles R1 (interprète) et R3 (narrateur), cadrage de contexte, mémoire à trois niveaux (5 derniers tours intégraux / résumé glissant réécrit tous les 10 tours / faits établis jamais résumés). Pose les garde-fous du § 2.8 : sortie structurée obligatoire, aucune création d'entité, anti-complaisance, budget par tour. C'est ici que la « scène écrite » devient réelle : sa propriété définissante est un chemin de code — une prose verbatim est émise par le moteur, jamais demandée au modèle. Porte aussi le balayage du budget de contexte des onze chemins de prose `ia` — un seul balayage, jamais trois chemins bornés sur onze, sous peine que le silence cesse de signifier « sous budget » ; avertissement non bloquant, aucune migration. »

## Ce que `moteur-dossier` (n° 9) a déjà livré, sur quoi n° 10 construit

- **État de session** (`brain/dossier/session.ts`) : `EtatSession { schema, dossier_id, graine_alea, horloge:{tour}, monde: EtatMonde (7 champs, un par prédicat de PREDICATES), journal: EntreeJournal[], memoire: null }`. `EntreeJournal = { tour, role: 'joueur'|'moteur' (registre CLOS), texte, deltas?, origine?: CommandeId }`.
- **`memoire` est une clé racine typée `null`** — réservée, forme interne (`resume_long`/`resume_recent`/`faits_etablis`) explicitement refusée en n° 9, propriétaire n° 10 nommé dans `open_questions` : « memoire.{resume_long, resume_recent, faits_etablis} — forme interne refusée en n°9, propriétaire n°10, qui possède la politique de mémoire à trois niveaux. Seule la clé racine est réservée, typée null. »
- **Le premier évaluateur d'état** : `evaluerExpr(condition, faits): boolean`, BIVALENT, **lève** sur une entrée non reconnue (KR-238) — ne rend jamais `false` par complaisance. `appliquerDelta`, `resoudreJalons` (point fixe borné).
- **La console** (`brain/dossier/commandes.ts`) : registre CLOS `COMMANDES: Record<CommandeId, Transition>`, **UN SEUL VERBE aujourd'hui : `aller`**. `analyserSaisie` (reconnaissance, arité dérivée de `refKinds.length`, « jamais un parseur »), `executerCommande` PURE. La console **ne valide rien** et soumet la chaîne brute au moteur seul décideur. Elle vit dans `src/features/play-mode/` et **ne descend jamais dans `src/player/`** (copié en entier à l'extraction, `docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
- **Avertissement écrit explicitement dans le design_contract de n° 9** : « c'est la surface par laquelle, en n°10-13, un canal d'entrée en texte libre interprété par du code s'installerait sans qu'aucune revue le voie » — donc n° 9 a anticipé que la console typée deviendrait, ou serait doublée par, le canal de texte libre de n° 10. **Ce n'est PAS tranché : c'est à ce cadrage de décider si le champ libre remplace la console, la complète, ou si un nouvel écran l'héberge** (voir § 2.9 du plan de cible ci-dessous).
- **Table d'audience de session** (`brain/dossier/sessionDestinations.ts`) : née avec **ZÉRO ligne `ia`**, gardée par une assertion écrite exprès pour être supprimée par n° 10 : `Object.values(table).every(d => d !== 'ia')`. **C'est un contrat que n° 10 doit rouvrir et amender**, pas un fichier intouchable.
- **`RapportControles.jouable`** conditionne l'ouverture de partie comme précondition de correction de l'évaluateur bivalent, pas comme ergonomie — vérifié au montage du shell, pas seulement au CTA.
- **KR-242 (replay déterministe)** reste NON TESTABLE : aucun consommateur d'aléa (`graine_alea` écrite, jamais lue par un `rng`). n° 9 note : « REPORTÉ — le critère de REPLAY DÉTERMINISTE part à la n° 11, premier consommateur de graine_alea » — donc **pas la responsabilité de n° 10** sauf si cette feature devient elle-même le premier vrai consommateur d'aléa (à vérifier : R1/R3 n'ont pas de jet de dé, ça c'est n° 11 `moteur-arbitre`).
- **`docs/REGLES-PLAY.md` § A porte un bandeau (posé par n° 9 it4)** nommant A4/E3 (+5 PE par changement de lieu) et B3 (équipement de départ) comme sans implémentation dans `src/`, **propriétaire n° 11** (`moteur-arbitre`), successeur `commande.aller` — PAS n° 10. Ne pas les réimplémenter ici.

## L'instrument qui va devoir changer : `moteurSansIA.test.ts` (KR-250)

`src/features/play-mode/tests/moteurSansIA.test.ts` balaie TROIS racines (`src/player/`, `src/features/play-mode/`, `src/brain/dossier/`) et **échoue si un seul fichier de production y contient `fetch(`, `CopiloteService`, ou une URL `/ia/`**. C'est l'instrument qui a gardé « le moteur de la n° 9 ne génère aucun texte » — et **n° 9 lui-même a écrit, dans sa propre spec** : « it4 est la dernière itération où « aucune génération de texte » vaut pour **toute** la surface de jeu ». **C'est très exactement le contrat que n° 10 vient rouvrir : le premier appel modèle depuis `src/brain/dossier/` et/ou `src/features/play-mode/`.** Ce fichier ne peut pas rester tel quel — il doit être RÉ-ÉCRIT pour border précisément où l'IA a le droit d'entrer (probablement un nouveau fichier `brain/dossier/interprete.ts` ou `narrateur.ts`, plus le point d'appel dans `play-mode`) et où elle n'a **toujours pas** le droit d'entrer (l'évaluateur, les deltas, l'horloge, le moteur de session lui-même — KR-250 doit **survivre**, resserré, pas disparaître : « L'IA ne lance jamais les dés et ne modifie aucune statistique »).

## Ce que `dossier-copilote` (précédent — première feature du dépôt à appeler un modèle, côté AUTEUR) a déjà posé et que n° 10 doit réutiliser SANS le refaire

- **`CopiloteService` (`brain/CopiloteService.ts`)** : assemble le contexte sous garde d'audience stricte, appelle `POST /ia/:role` du worker, valide la FORME de la sortie, **REJOUE UNE SEULE FOIS**, puis s'arrête (dégrade). Résultat en union discriminée à 4 branches : `propose` / `refuse{champ}` (avant tout appel) / `indisponible{raison}` / `illisible{motif}`.
- **Route worker `POST /ia/:role`** (`worker/index.ts`) : **déjà générique** — `INVITES: Record<string, {systeme, max_tokens}>` est un registre ouvert, actuellement 3 rôles pour `dossier-copilote` (`personnage-prose`, `indice-detenteurs`, et un 3e pour les répliques). Le contrat de route (sept branches : méthode, rôle inconnu 404, config absente 503, garde d'octets 413, corps illisible, appel amont, réponse) **ne bouge pas** quand un rôle s'ajoute — une entrée `INVITES` de plus suffit. **L'invite système vit CÔTÉ WORKER, jamais côté client** (KR-236 : le client décide quelles données sortent, le worker décide ce qu'on demande).
- **`GABARIT_SORTIE`** (`brain/copilote/schemaSortie.ts`) : un schéma de sortie JSON par rôle, validé côté client après réception — jamais fait confiance à la forme brute.
- **`destinations.ts`** (garde stricte d'audience, KR-232) régit le DOSSIER ; **`sessionDestinations.ts`** régit la SESSION — deux tables, deux gardes, jamais fusionnées (n° 9 l'a tranché explicitement : « REJETÉ — fusionner la table d'audience de session dans destinations.ts »).
- **Piège de nommage à vérifier** : `validerIntention`/`CLES_SORTIE_PLAN` existent déjà dans `schemaSortie.ts`, mais pour l'assistant `plan-actions` de `dossier-copilote` (le champ `intention` d'un PNJ auteur, complètement différent du `{ intention }` que R1 « interprète » doit produire selon le plan de cible § 2.6). **Vérifier qu'aucun nom de type/export n'entre en collision** si R1 produit lui aussi un objet `{ intention }`.

## Le plan de cible (`docs/PLAN-BASCULE-IA.dc.html`) pour cette tranche précise

**§ 2.5 Contexte & mémoire** : « Le problème central du moteur n'est pas la qualité de l'IA, c'est ce qu'on lui montre. » Cadrage PAR LA SCÈNE (canon toujours + lieu courant + PNJ présents + indices déjà connus + événements armés ici + climat actif, rien d'autre) et PAR LE POINT DE VUE (un dialogue ne reçoit que la fiche du PNJ concerné, jamais le synopsis MJ — mais R4 « acteur », dialogue PNJ, est n° 12, PAS n° 10). **Mémoire à trois niveaux** : 5 derniers tours intégraux · résumé glissant réécrit tous les 10 tours · faits établis (phrases courtes, jamais résumées), que l'IA doit produire à chaque tour où le monde change — garde-fou anti-contradiction.

**§ 2.10 rôles** (extrait exact du HTML) :
- **R1 · interprète** — « Traduit le texte libre en intention structurée, ou demande la précision manquante. Rôle bavard, contexte minimal, modèle rapide. » Entrée : texte joueur, scène, cibles possibles. Sortie : `{ intention } | { clarification }`.
- **R2 · arbitre** — hors périmètre n° 10 (c'est n° 11 `moteur-arbitre`, dépend de n° 10 **et** B2). Sortie : `{ type, carac, tc, enjeux, deltas_proposes }`.
- **R3 · narrateur** — « Écrit 2 à 6 phrases, à la deuxième personne, au présent — le registre déjà défini pour les textes joueur. Reçoit les résultats, jamais le pouvoir de les changer. » Entrée : issue, faits nouveaux, ambiance du lieu, ton. Sortie : `{ recit, faits_etablis, suggestions[3] }`.
- **R4 · acteur** — hors périmètre n° 10 (n° 12 `moteur-acteurs`).

**§ 2.8 garde-fous anti-dérive** (les quatre, texte exact) :
1. « Sortie structurée obligatoire » — chaque rôle rend un objet typé, validé par schéma ; une sortie non conforme est **rejouée une fois**, puis dégradée en action gratuite avec un texte neutre — jamais un état corrompu.
2. « Aucune création d'entité » — l'IA ne peut référencer que des identifiants existants du dossier ; un PNJ/lieu/objet inventé est refusé à la validation et retiré du récit.
3. « Anti-complaisance » — un échec doit avoir une conséquence, un succès de justesse (marge < 3, **hors périmètre ici, c'est n° 11**) doit avoir un coût, un PNJ méfiant ne cède pas sans jet (n° 12).
4. « Budget par tour » — un plafond d'appels et de jetons par tour, affiché en mode auteur ; au-delà, on **dégrade** (pas de suggestions, narration courte), jamais on n'allonge indéfiniment le temps de réponse.

**Jalon J1→J2** (le plan de cible, précédent bascule, ordonne le Temps 2 en 6 jalons J1-J6 ; n° 9 = J1 livré, n° 10 = J2) : « J2 — Interprète + narrateur. Les deux premiers rôles branchés, avec cadrage de contexte et mémoire à trois niveaux. Le joueur écrit, le monde répond. Pas encore de jets ni de PNJ. » Sortie : « première partie jouable ».

**§ 2.9 L'écran de jeu** (design de référence, PAS forcément la forme exacte à livrer — c'est un `.dc.html`, périmé par endroits) : « Ce qui change, c'est le bas de l'écran — la liste de boutons de choix cède la place à un champ libre, et la fiche gagne un onglet « ce que je sais ». » « Saisie libre + suggestions — un champ « que faites-vous ? » avec 3 suggestions générées, cliquables. La page blanche est le vrai risque d'adoption ; les suggestions restent des raccourcis, jamais des rails. » Carnet d'indices, bandeau d'horloge : **alimentés uniquement par les deltas validés** — donc jamais un indice halluciné.

**§ 2.11 Configuration & routeur de modèle** : un seul modèle aujourd'hui, mais `router(role, tache, enjeu) → { modele, effort, max_jetons, temperature }` en indirection — déjà en place dans l'esprit de `INVITES` (registre par rôle) côté worker.

## Contrainte transverse rappelée (CLAUDE.md, non négociable)

- « L'IA ne lance jamais les dés et ne modifie aucune statistique : elle demande un jet, le moteur le résout, elle raconte. » — R1/R3 ne touchent ni dés ni stats ; seul `commande.aller` existe comme action exécutable aujourd'hui, donc **le champ d'action que R1 peut produire est probablement borné aux commandes déjà existantes du registre `COMMANDES` (`aller` seul) PLUS une clarification**, pas un pouvoir d'invention.
- « Deux proses seulement sont émises verbatim » (`texte_ouverture_joueur`, `fins[].texte`) — R3 « narrateur » ne récite JAMAIS le dossier mot pour mot : il REÇOIT du contexte et ÉCRIT une prose neuve, contrainte par les garde-fous, jamais un extrait injecté tel quel.
- Audience stricte : un champ `auteur` n'entre dans aucun contexte de modèle. `description_joueur`, `ambiance`, etc. (déjà `ia`) sont les seuls candidats d'injection.
- `schema: 1` — tout champ ajouté à `EtatSession`/`EtatMonde` est optionnel à vie (KR-160/191/251).
- Toute référence est un identifiant stable, jamais un nom libre (contrainte directe sur ce que R1 peut désigner en sortie).

## Ta tâche

Produis ta note de tour 1 au format imposé par la skill `raffinage-iteration` (RISQUE / OBJECTION / PROPOSITION / VERDICT, 250 mots max), en te concentrant sur ton domaine. Vérifie toi-même dans le code ce qui compte pour ton verdict plutôt que de faire confiance à ce brief sur les points sensibles. Écris ta note dans le fichier qu'on te demande de produire.
