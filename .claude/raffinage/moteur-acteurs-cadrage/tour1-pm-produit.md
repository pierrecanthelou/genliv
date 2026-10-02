# Cadrage n°12 `moteur-acteurs` — Tour 1 — PM Produit

## RISQUE
Le danger n'est pas l'IA mais le gating silencieux : `Revelation` porte QUATRE portes indépendantes (`confiance_min`, `jet`, `contrepartie`, `apres_indice_id`). Si une itération ne câble que certaines portes, une porte posée par l'auteur mais pas encore honorée par le moteur doit se comporter comme **fermée**, jamais comme absente — sinon un indice se révèle alors que l'auteur avait explicitement posé une condition que personne ne vérifie encore. C'est une fuite d'information non testée, pas une dette cosmétique.

## OBJECTION
Le roadmap charge n°12 d'« arrêter les valeurs de `PorteeContreMesure` ». Mais le seul lecteur nommé de ce type dans tout le document est n°14 (« armement des contre-mesures »). Figer un type sans son propre consommateur dans la même itération viole le précédent KR-249/263 que cette feature applique elle-même à R4 (« un champ/rôle n'entre qu'avec son lecteur réel »). Je retire ce point du périmètre de n°12 ; il reste une dette à déclencheur armée pour n°14, à coût nul (`schema: 1`, champ optionnel).

## PROPOSITION
4 itérations verticales (détail en annexe) :
1. Parler à un PNJ présent, qui répond dans son personnage et ne révèle un indice que si la confiance qu'il porte au joueur est suffisante.
2. Convaincre un PNJ réticent par un jet, résolu par la sous-boucle déjà livrée en n°11.
3. Un PNJ peut exiger un prix ou un indice déjà obtenu avant de parler.
4. Le joueur consulte le carnet des indices qu'il a appris.

Hors périmètre de la feature entière : `PorteeContreMesure` (→ n°14), transfert d'indice hors caméra entre PNJ co-localisés (n°14), hostilité/combat déclenché par un refus de PNJ (n°13), boutique XP, fins/mort.

## VERDICT
Recevable sous réserve : retrait de `PorteeContreMesure` du périmètre, et confirmation en raffinage que toute porte de révélation non câblée dans une itération donnée est traitée comme fermée par défaut (jamais ignorée).

---

## ANNEXE — détail du découpage proposé

### Lecture préalable (ce qui cadre ma proposition)

- `docs/ROADMAP-BASCULE-IA.md` § 3 ligne 160/172 : phrase de démo sans « et » — bon signe, c'est une feature, pas deux. Dépendance = n°11 (terminée, 3/3).
- Le précédent de forme ET de process est `moteur-arbitre` (n°11) : 3 itérations, un rôle IA (R2) n'entre qu'avec SES DEUX consommateurs réels (mécanique + narratif) dans la même itération (KR-263/266), jamais scindé. Je transpose cette règle à R4.
- `src/brain/dossier/types.ts` : `Caractere` (curseurs/parler/jamais/cede_si), `Savoir`/`Revelation` (4 portes, chacune optionnelle, absente ≠ fermée mais « ne se révèle jamais de lui-même »), `Relation` (secret, audience stricte au porteur), `ContreMesure`/`PorteeContreMesure` (valeurs déjà posées comme placeholder par le lot contrat de n°4 it4, SANS lecteur).
- `src/brain/dossier/faits.ts` : `EtatPnj` n'a aujourd'hui QUE `a_dit` ; le commentaire dit explicitement `confiance : propriétaire n°12, NON DÉCLARÉE`. `FaitsDeSession.indices_connus: readonly string[]` **existe déjà** (lu par le prédicat `indice_connu`) — simple liste d'ids, PAS la forme `{indice_id, source_id, tour}` du schéma de session cible dans `PLAN-BASCULE-IA.dc.html` § 2.4. C'est une extension à payer, pas une création.
- `src/brain/dossier/commandes.ts` : `COMMANDES` n'a que `aller`/`agir`. KR-263 (cité dans le fichier) : un verbe n'entre qu'avec son consommateur narratif, dans le même lot.
- `docs/REGLES-PLAY.md` : **vide sur le dialogue/PNJ** — aucune section ne cadre la confiance, le jet social ou le carnet d'indices. Confirmé : rien à en tirer, tout est à trancher ici et en raffinage.
- `docs/PLAN-BASCULE-IA.dc.html` lignes 596-634 : R4 reçoit « fiche, curseurs, savoirs filtrés, confiance, dialogue » et rend `{replique, indices_reveles, delta_confiance}` ; si une révélation exige un jet on repasse par la sous-boucle A (déjà livrée n°11). Jalon J4 du plan de cible nomme exactement : dialogue en voix de PNJ, savoirs filtrés, conditions de révélation, confiance, carnet d'indices — c'est la liste que je découpe ci-dessous.

### Les 4 itérations

**it1 — squelette, lot contrat en premier.**
Démo : « L'auteur parle à un PNJ présent, qui répond dans son personnage, et ne révèle un indice que si la confiance qu'il lui porte est suffisante. »
Contenu : verbe `parler` entre dans `COMMANDES` (refKinds: `['personnage']`) **ET** dans le vocabulaire reconnu par R1 (interprète) **dans le même lot** — précédent exact : `agir` n'est entré qu'avec R3 en n°10 it2, jamais avant. `EtatPnj.confiance` déclaré (optionnel, bornes + valeur initiale posées ici — c'est la feature qui les doit). R4 appelé avec un contexte STRICTEMENT scopé à CE personnage (fiche, curseurs, `parler`/`jamais`/`cede_si`, ses savoirs, sa confiance courante) — jamais le canon complet, jamais une autre fiche. Contrat de sortie R4 fixé : `{replique, indices_reveles, delta_confiance}`. UNE SEULE porte de révélation câblée : `confiance_min`. Les trois autres portes existent dans le type mais ne sont PAS encore honorées — donc traitées comme fermées par construction (aucun indice ne se révèle par leur biais tant qu'elles ne sont pas câblées). Garde structurelle : `parler` exige un PNJ présent au lieu courant (`Presence.lieu_id`), jamais une lecture de prose.
Pourquoi ce choix d'ordre (et pas le jet en premier) : `confiance_min` est interne à la feature (pas de dépendance externe), ce qui garde le squelette le plus fin possible — le jet forcerait à intégrer `resolveChallenge` dès it1.

**it2 — la porte « jet ».**
Démo : « Le joueur convainc un PNJ réticent par un jet, que le moteur résout avant que le PNJ ne cède ou non. »
Réutilise la sous-boucle A déjà livrée (n°11, `issueDuJet`, seul appelant de `resolveChallenge`) — PAS un second point de résolution. `jet` dans `Revelation` devient la deuxième porte honorée.

**it3 — les deux portes restantes.**
Démo : « Un PNJ peut exiger un prix ou un indice déjà obtenu avant de parler. »
`contrepartie` (objet consommé) et `apres_indice_id` (séquencement) étendent le MÊME évaluateur de portes posé en it1/it2 — aucun nouveau contrat `brain/`, aucune nouvelle UI. Je les groupe car elles ne sont, l'une et l'autre, qu'une branche de plus dans une fonction déjà construite — contrairement au jet qui intègre un sous-système entier.

**it4 — le carnet d'indices.**
Démo : « Le joueur consulte la liste des indices qu'il a appris. »
Seule itération qui touche un format de session existant : `FaitsDeSession.indices_connus` passe de `string[]` à `{indice_id, source_id, tour}[]` (le prédicat `indice_connu` s'adapte en conséquence). Écran de lecture seule, aucun tri/recherche en it1 de cette sous-tranche (polish reporté).

### Hors périmètre de la feature entière (à écrire dans `specification.json`)

- `PorteeContreMesure` (confirmation/usage) — propriété n°14, dette à déclencheur.
- Transfert d'indice hors caméra entre PNJ co-localisés, avancement des plans PNJ — n°14 (« moteur-horloge »).
- Hostilité, rupture de dialogue vers un combat — n°13 (« moteur-combat »).
- Mensonge/manipulation comme mécanique chiffrée distincte (au-delà des curseurs IN/IG déjà écrits dans la fiche) — aucune nouvelle donnée, le prompt R4 s'appuie sur ce qui existe déjà.
- Boutique XP, fins, mort — n°15/16.
- Recherche/tri/filtrage dans le carnet d'indices — polish, pas squelette.

---

## Décisions prises en autonomie (faute de spécification écrite)

- **Ordre des 4 itérations (quelle porte en premier) n'était pas fixé par le roadmap** → j'ai choisi `confiance_min` (it1, interne) → `jet` (it2, réutilise n°11) → `contrepartie`+`apres_indice_id` groupées (it3, même évaluateur) → carnet d'indices (it4, UI) → si l'inverse (ex. le jet en it1), le squelette embarquerait `resolveChallenge` dès la première tranche, ce qui n'est plus « la plus fine tranche qui traverse tout ».
- **Statut de `PorteeContreMesure` dans le périmètre de n°12** (le roadmap le lui assigne explicitement) → je l'ai retiré et réassigné à n°14, son seul lecteur nommé → si l'inverse (n°12 le fige quand même), on viole soi-même KR-249/263 et on fige une valeur jamais exercée — précédent déjà condamné pour `tier`/`Quete.lie_au_canon` (§4 du roadmap).
- **`parler` doit-il entrer dans R1 (interprète, saisie libre) dès it1, ou rester console-only** → j'ai choisi : oui, dans le même lot qu'it1, précédent exact `agir`/R3 (n°10 it2) → si l'inverse, le joueur ne peut pas réellement « parler » en jouant normalement (le canal de jeu courant est le texte libre depuis n°10), la démo de la feature serait un artefact de test, pas un usage réel.
- **Extension du schéma `indices_connus` (`string[]` → objets avec provenance)** n'était demandée par aucun acceptance criterion existant → je l'ai repoussée à it4 plutôt que de la faire dès it1 → si l'inverse, it1 grossirait pour porter une UI de carnet dont la démo « parler à un PNJ » n'a pas besoin.
- **Comportement par défaut d'une porte non câblée** (silence du roadmap là-dessus) → j'ai posé la règle « porte non câblée = porte fermée, jamais ignorée » comme contrainte transverse aux 4 itérations → si l'inverse (porte non câblée = ignorée = toujours ouverte), une condition de révélation écrite par l'auteur serait silencieusement contournée dès it1, avant même que l'évaluateur existe pour elle.

## Fichiers lus
`docs/ROADMAP-BASCULE-IA.md` ; `docs/PLAN-BASCULE-IA.dc.html` (369-443, 596-634) ; `src/features/moteur-arbitre/specification.json` ; `src/brain/dossier/types.ts` (460-830) ; `src/brain/dossier/faits.ts` (entier) ; `src/brain/dossier/commandes.ts` (entier) ; `docs/REGLES-PLAY.md` (entier, confirmé vide sur dialogue/PNJ/confiance).
