# Cadrage — feature n°10 `moteur-interprete`

Statut : **validé par l'humain** (2026-09-25). Écrit dans `src/features/moteur-interprete/specification.json` et répercuté dans `docs/ROADMAP-BASCULE-IA.md`. Prochaine étape : `/raffiner moteur-interprete 1`.

Comité : **5 rôles** (PM, Tech Lead, UX, QA, **Narratif & IA**) — première feature à appeler un modèle **en mode jeu** (précédent : `dossier-copilote`, mode auteur). Dépend de n° 9 `moteur-dossier`, **terminée 4/4** (`0.7.5`).

Notes brutes : `.claude/raffinage/moteur-interprete-cadrage/{brief-partage,tour1-*,tour2-*}.md`.

## Intention

> Le joueur écrit ce qu'il veut faire en langage libre ; le moteur le comprend, agit dans les limites de ce qu'il sait faire, et raconte — sans jamais laisser un modèle inventer une entité, lancer un dé ou changer une statistique.

## Ce que le comité a mesuré dans le code avant de trancher (pas déduit)

| Affirmation | Vérifiée comment | Conséquence |
|---|---|---|
| `moteurSansIA.test.ts` interdit tout appel modèle sur `player/`+`play-mode/`+`brain/dossier/` | Lu en entier : balayage par 3 racines fixes, 3 motifs interdits (`fetch`, `CopiloteService`, `/ia/`), zéro exception | Doit être **réécrit**, jamais amendé après coup — c'est le contrat que n° 10 rouvre |
| `docs/REGLES-PLAY.md` § J1 nommerait un verbe | Relu texte en main : « un (1) pas d'horloge = une (1) commande de joueur ACCEPTÉE » — déjà verbe-agnostique | **Aucun amendement de doc nécessaire** pour que `agir` consomme un pas (KR-130 n'est pas engagé) |
| `validerIntention`/`CLES_SORTIE_PLAN` existeraient déjà pour un autre rôle | Trouvés dans `brain/copilote/schemaSortie.ts:501`, consommés par `CopiloteService.ts:31` pour `personnage-plan` (intention d'un PNJ, côté auteur) | Collision de nom réelle — la sortie de R1 porte des noms disjoints (`SortieInterprete`/`Commande`, jamais `Intention*`) |
| `CopiloteService.demander()` serait extensible sans risque | `demander()` est une union à 6 surcharges avec garde `never` explicite (l. 651-657) | Tout rôle neuf touche l'interface ET l'implémentation ensemble — **un rôle entre dans le lot de l'itération qui l'appelle pour la première fois**, jamais avant |
| `sessionDestinations.ts` n'aurait pas prévu de ligne `ia` | Commentaire l. 30-35 : deux portes `ia` déjà nommées sous condition pour n° 10 (`indices_connus[]`→`indices[].verite`, `jalons_atteints[]`→`jalons[].enonce_texte`) | n° 9 a laissé la table prête à rouvrir, pas à recréer |
| `Chip` existerait dans le design system implémenté | `brain/components/index.ts` : 13 primitives, **`Chip` absent** — seule une référence `.jsx` dort dans `design_handoff_gamebook_editor/` | À construire ; domicile tranché ci-dessous (tour 3, # 6) |
| `OutcomeBlock.tsx` documenterait une règle de déménagement | Docstring confirmée : reste feature-local tant qu'un seul consommateur (KR-109) | Précédent direct pour `Chip` |

## Arbitrage (tour 3, orchestrateur)

Deux vetos de `narratif-ia` tiennent encore après le tour 2 (sur son propre domaine : frontière code/IA, contrat de sortie) ; les deux sont **RETENUS**, pas d'`ESCALADE` — aucun autre rôle ne les a contestés au tour 2, et l'un est une auto-correction de sa propre position de tour 1.

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| 1 | Découpage en itérations (PM tour1, 4 itérations) | **RETENU, amendé** — N=4 conservé, `agir` déplacé de it1 vers it2 | Voir # 2. La structure PM tient sinon telle quelle : squelette (R1 seul) → narration (R3) → mémoire → budget |
| 2 | `agir` entre-t-il en it1 (PM tour2) ou it2 (narratif-ia veto tour2) ? | **RETENU : it2**, veto narratif-ia gagne | « Un verbe entre avec son consommateur » (KR-249 généralisé, KR-263 neuf) : sans R3, `agir` consomme un pas d'horloge en silence — un no-op narratif n'est un no-op MÉCANIQUE légitime que si quelque chose le raconte. R3 arrive précisément en it2 : `agir` y trouve son consommateur immédiat, sans itération supplémentaire |
| 3 | R1 refuse une action non reconnue : clarification systématique (PM tour1) ou forme fermée dédiée ? | **RETENU : `sans_commande`**, veto narratif-ia | Une clarification utilisée comme refus dupliquerait la politique du registre `COMMANDES` DANS L'INVITE (« seul `aller` existe ») — règle de jeu qui fuit dans un prompt, interdit transverse. `sans_commande` est un message système dérivé des `label` de `COMMANDES`, jamais une fiction. Deux clarifications d'affilée restent non représentables (garde anti-boucle). KR-264 neuf |
| 4 | Un seul lot contrat pour toute la feature, 9 fichiers d'un coup (tech-lead tour2) ou un lot contrat par itération (narratif-ia tour2) ? | **RETENU : par itération** | Conforme à la doctrine déjà appliquée par n° 9 elle-même (« deux lots contrat, it1 et it3, chacun seul et premier DANS SON ITÉRATION — la règle de la skill est par itération, pas par feature »). Contrepartie directe de # 2 et de la garde `never` de `CopiloteService` : R3 n'a pas de raison d'exister dans le lot d'it1 si rien ne l'appelle encore. KR-266 neuf |
| 5 | `docs/REGLES-PLAY.md` § J1 amendé pour `agir` (narratif-ia tour1) ? | **REJETÉ, mesuré** | Tech-lead a relu le texte : la règle est déjà verbe-agnostique. Aucune réouverture de doc — KR-130 n'exige pas de retoucher une règle déjà générique |
| 6 | Domicile de `Chip` : `brain/components/` (UX) ou feature-local (tech-lead, objection) ? | **RETENU : feature-local**, `src/features/play-mode/components/Chip.tsx` | Précédent exact et vérifié : `OutcomeBlock.tsx` (KR-109) reste feature-local tant qu'un seul consommateur réel existe. Un usage futur spéculatif (tags d'indices) n'est pas un second appelant nommé de cette feature |
| 7 | `moteurSansIA.test.ts` réécrit dans le lot contrat ou le lot feature ? | **RETENU : lot feature**, tech-lead et QA convergent | La liste d'exclusion nommée doit pointer un fichier réel dès son écriture (probable `play-mode/hooks/useTourDeJeu.ts`, nommé à titre indicatif pour `/raffiner` — pas gravé). Écrite dans le lot contrat, elle serait vide et vacueuse |
| 8 | Champ de saisie désactivé pendant l'appel (UX) ou verrou logique sans `disabled` (narratif-ia) ? | **RETENU, les deux, réconciliés** | Ce ne sont pas deux réponses concurrentes : le verrou (« un seul pas en cours, deux soumissions dans le même tick → un seul `fetch` ») est le contrat testable (KR-265, dans l'orchestrateur/hook) ; l'attribut `disabled` + libellé `…` est SA réalisation à la couche présentation, choisie par l'UX. Aucun conflit à trancher, juste deux niveaux du même invariant |
| 9 | Portée de KR-262 (`Entite.nom`, destination) : 8 collections (QA tour1) ou n° 10 seule (PM/UX/narratif) ? | **RETENU : rétréci à n° 10** — R1 (label = `description` du lieu, jamais `nom`) ; **REPORTÉ** pour R3 (nommer PNJ/lieux en prose) → `open_questions`, déclencheur n° 12 | QA elle-même lève son objection au tour 2 sur ce périmètre réduit. Élargir à 8 collections dans n° 10 recréerait le lot `contrat` DOSSIER transverse que personne ne demande ici |
| 10 | KR-261 (budget, onze chemins `ia`) et le §D budget par pas de narratif-ia sont-ils le même instrument ? | **RETENU : deux instruments, une constante partagée** | L'un est statique côté auteur (chemins du dossier, pire cas), l'autre dynamique côté runtime (appel par pas) ; les deux lisent le même plafond de contexte, posé une seule fois dans `brain/`, jamais dupliqué |
| 11 | Critère « anti-complaisance » observable par jest (QA tour1 objection) ? | **REJETÉ tel quel, remplacé** | Non observable au sens strict (c'est une propriété de la PROSE). Remplacé par un prédicat structurel testable : un fait sans rang d'ancrage (`sur: []`) n'est pas représentable dans `faits_etablis[]` — donc aucune entité inventée n'atteint jamais la mémoire durable. C'est la seule moitié de « aucune création d'entité » qu'un test peut tenir ; la voix elle-même (2e personne, présent, aucune mécanique annoncée) reste une consigne d'invite, non testée par jest |
| 12 | `memoire` : forme figée dès le lot contrat d'it1 (tech-lead tour2, table à 9 fichiers) ou seulement à l'itération qui pose sa politique de rétention (narratif-ia veto) ? | **RETENU : it3**, conséquence directe de # 4 | KR-249 (déjà posé par n° 9) : un champ n'entre que si un chemin l'écrit ET un autre le lit avec sa politique connue. Fixer la forme en it1 sans la fenêtre glissante/résumé qui la justifie violerait ce principe que n° 9 avait elle-même écrit pour `memoire: null` |

## Le découpage

| # | Phrase de démonstration (sans « et ») |
|---|---|
| **1** | *Le joueur écrit une action libre ; le moteur la traduit en déplacement s'il en reconnaît un, répond qu'il ne peut pas encore le faire, ou demande une précision — jamais de prose.* |
| **2** | *Le joueur lit en quelques phrases ce que son action a produit, qu'elle ait déplacé son héros ou non.* |
| **3** | *Le joueur retrouve, plusieurs tours plus tard, un fait que le monde avait établi, sans contradiction.* |
| **4** | *L'auteur voit la narration se raccourcir plutôt que la partie attendre indéfiniment, au-delà du budget par tour.* |

**Itération 1** — Lot contrat (attente.clarification + sa ligne `ia`, R1 : service/`schemaSortie`/`INVITES`, `brain/dossier/interprete.ts`, `brain/copilote/contexte/interprete.ts`) puis lot feature (champ de saisie `PlayerInputBar`, `moteurSansIA.test.ts` réécrit avec sa première exclusion nommée). `COMMANDES` reste `{ aller }` — R1 rend `{commande:'aller',cibles}` | `{clarification}` | `{sans_commande:true}`, jamais de prose.

**Itération 2** — Lot contrat (`commandes.ts` + `agir` arité 0, `recit?` sur `EntreeJournal`, R3 : service/`schemaSortie`/`INVITES`, `brain/copilote/contexte/narrateur.ts`) puis lot feature (bloc de récit joueur, `Chip` de suggestions, exclusion `moteurSansIA.test.ts` étendue).

**Itération 3** — `memoire: null | { resume, faits_etablis[] }`, fenêtre glissante 5-14 pas, résumé tous les 10, faits ancrés par rang (KR-262/264 s'y vérifient en pratique — un fait sans ancre est refusé). Lot contrat sur `session.ts`.

**Itération 4** — Budget par pas (KR-261, constante partagée), dégradation en cascade (suggestions → fenêtre → faits), balayage des chemins de prose `ia` ouverts par n° 10 (3, pas les onze du roadmap complet — les huit autres arrivent avec n° 11-15).

## KR nouveaux (à mirorer dans `code-knowledge.json` une fois validé)

- **KR-260** — `moteurSansIA.test.ts` passe d'un balayage « racine interdite en bloc » à « racine interdite sauf liste d'exclusion nommée par fichier », avec mutant obligatoire (ajouter l'import hors liste, vérifier rouge, retirer), réécrit dans le lot **feature** qui introduit le premier appelant réel.
- **KR-261** — Le budget de contexte de n° 10 est UNE constante, posée une fois dans `brain/`, lue par (a) le balayage statique des chemins de prose `ia` côté auteur et (b) le budget dynamique par pas côté runtime (§2.8, garde-fou 4). Jamais deux plafonds qui dérivent séparément.
- **KR-262** — `Entite.nom` reste d'audience `auteur` ; l'injection à un modèle passe par `description`/`ambiance`/`dangers`, jamais par `nom`. Portée n° 10 : R1 seul (labels de lieux). R3 (nommer en prose) et la portée aux 8 collections restent ouverts, propriétaire n° 12.
- **KR-263** — Un verbe de `COMMANDES` n'entre qu'avec son consommateur narratif déjà présent (généralisation de KR-249 au registre de commandes) : `agir` attend R3, jamais posé en amont comme no-op sans lecteur.
- **KR-264** — Le refus d'une action non reconnue par R1 est une forme FERMÉE dédiée (`sans_commande`), jamais une clarification utilisée comme refus déguisé — la politique du registre ne doit jamais fuir dans l'invite. Deux clarifications d'affilée ne sont pas représentables (garde anti-boucle déterministe).
- **KR-265** — Un seul pas de jeu en cours à la fois : le verrou est un invariant logique (deux soumissions dans le même tick produisent exactement un appel modèle), tenu dans l'orchestrateur/hook, indépendant de la réalisation UI choisie (`disabled`, file, etc.).
- **KR-266** — Un rôle ajouté à l'union exhaustive de `CopiloteService.demander()` entre dans le lot **contrat de l'itération qui l'appelle pour la première fois**, jamais préposé par une itération antérieure qui n'a pas encore de consommateur pour lui.

## Corrections à répercuter dans `docs/ROADMAP-BASCULE-IA.md` (si validé)

1. **§ 3, ligne 10** — colonne `Statut` : `0/4` (feature ouverte, 0 itération livrée).
2. **§ 3, paragraphe « 10 · moteur-interprete »** — à écrire, sur le modèle du paragraphe « 9 · moteur-dossier », citant les 4 phrases de démo et les KR-260 à 266.
