RISQUE — it4 fait entrer les deux premières données d'**horloge** du dossier (`duree`, `echeance`) alors que l'horloge appartient à n° 9 et son exploitation à n° 14. Livrées sans définition, elles arrivent au Temps 2 avec une sémantique à inventer — et l'endroit le moins cher pour inventer une sémantique est un prompt. « Cette étape est-elle bloquée ? » deviendra une question posée au modèle : la frontière code/IA cède par un autre chemin que les dés.

OBJECTION — le goal dit « étapes avec durée et porte de sortie » sans jamais dire **qui constate le blocage**. Tel qu'écrit, `si_bloque` est une prose de repli sans événement déclencheur : ni le schéma ni aucun document ne définit « bloqué ». Un champ dont la condition d'usage n'existe nulle part est soit mort, soit rempli par le modèle. Second point : `duree` n'a **aucune unité écrite** — un nombre sans unité est un nombre que chacun relira à sa façon, à commencer par n° 14.

PROPOSITION —
1. Lot contrat, **écrit en premier** (précédent it3) : ~8 lignes dans `docs/REGLES-PLAY.md` — l'unité de `duree` est le **pas d'horloge de session** (n° 9 la nomme, on ne la pré-tranche pas) ; « étape bloquée » = `duree` pas écoulés sans que le `declencheur_expr` de l'étape suivante soit vrai. Le moteur constate, jamais le modèle.
2. `duree?: number` entier, borne `DUREE_MIN = 1` nommée, jamais de prose.
3. Avertissement D1 non bloquant : `si_bloque` sans `duree` (même forme que `declencheur_texte` sans `_expr`, critère #7), testé à deux personnages.
4. it4 n'ajoute **aucune clé** à la sortie du modèle.

VERDICT — recevable sous réserve (les quatre).

---

## ANNEXE (hors quota)

### Destinations tranchées

| Champ | Destination | Motif (une phrase) |
| --- | --- | --- |
| `but.echeance` | **`ia`**, prose libre, **jamais un compte** | C'est une *pression* que l'acteur joue (« avant la fonte des neiges »), discriminée en trois mots de ses sœurs `libelle` (ce qu'il veut) et `pourquoi` (pourquoi) ; le compte, lui, vit dans `duree` (`moteur`) et n'est jamais dupliqué ici — un chiffre écrit dans `echeance` serait une seconde source d'horloge, à refuser en revue. Ferme l'`open_question` dont it4 est propriétaire ; si n° 14 veut un jour une échéance calculable, elle ajoute `echeance_expr` sous la grammaire jumelle D1, additif, sans migration. |
| `plan_actions[].duree` | **`moteur`**, entier ≥ `DUREE_MIN` | C'est le compteur qui **définit** « étape bloquée » ; injecté, il donnerait au modèle la fenêtre exacte d'avancement du plan — précédent exact `contre_mesures[].delai`, déjà tranché `moteur` pour cette raison. **Pas de décision A** : le producteur est l'éditeur d'it4 (Stepper), et cinq familles `moteur` sans consommateur avant le Temps 2 existent déjà (`declencheur_expr`, `effet[]`, `condition_expr`, `consequence[]`, `recompense[]`) — la décision A frappe la forme **sans producteur** (cas `tier`), pas la forme sans consommateur en Temps 1. |
| `plan_actions[].si_bloque` | **`ia`**, prose, **injectée uniquement** quand le moteur a déclaré l'étape bloquée | Didascalie de repli que le rôle acteur doit lire pour la jouer, donc `ia` ; la clause de porte s'écrit **à la ligne de destination**, précédents `savoirs[].revele_comment` (« injectée uniquement quand la porte est ouverte ») et `charpente.jalons[].enonce_texte` (`ia` seulement pour un jalon **atteint**). **Aucun jumeau `_expr`, aucune entrée dans `FAMILLES_DE_CONDITIONS`** : même statut que `cede_si`, explicitement hors D1. |

Les cinq lignes `contre_mesures[]` sont matérialisées **telles qu'arbitrées** en fin de `src/brain/dossier/destinations.ts` — non rouvertes.

### Contrat de sortie IA concerné (rôle acteur, n° 12 — zéro ligne de code en it4, mais c'est ce que le schéma d'it4 promet)

**Entrée injectée**, pour un PNJ en scène : `fonction`, `apparence`, `description_joueur`, `but.libelle`, `but.pourquoi`, `but.echeance`, l'`action` de l'étape **courante seule** (jamais le plan entier — les étapes à venir sont du spoil, même classe qu'un jalon non atteint), `si_bloque` **seulement si** le moteur a posé l'étape bloquée, `contre_mesures[].action` **seulement si** le moteur a armé la contre-mesure.
**Jamais injectés** : `camp`, `etape`, `duree`, `delai`, `portee`, `declencheur_expr`, `declencheur_texte`, `objectif_id`, les 8 `stats`.

**Schéma de sortie** : **inchangé par it4** — `{ recit: string, indices_reveles: string[] }`. Aucune clé nouvelle, et nommément : pas de `etape_suivante`, pas de `contre_mesure_declenchee`, pas de `duree_restante`. L'avancement d'étape et l'armement d'une contre-mesure sont des écritures de **session**, moteur seul (n° 14).

**Échec de validation** : sortie non conforme → un rejeu, même graine, même contexte ; second échec → repli sur une réplique neutre du registre moteur, tour marqué *dégradé* au journal ; jamais d'interprétation partielle d'un texte libre. Un `indices_reveles` portant un identifiant inconnu ou dont la porte est fermée est **filtré** par le moteur, jamais accepté, et le filtrage est journalisé.

**Invariant qu'it4 doit laisser vrai** : aucune donnée d'horloge (`duree`, `delai`, échéance chiffrée) n'entre dans un contexte de modèle ; ce que le modèle peut recevoir de l'écoulement du temps est un **libellé dérivé par le code** (n° 10), jamais un nombre — même doctrine que les caractéristiques (it3) et les curseurs (it6).
