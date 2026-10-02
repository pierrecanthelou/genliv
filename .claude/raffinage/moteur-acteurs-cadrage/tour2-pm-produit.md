# Cadrage n°12 `moteur-acteurs` — Tour 2 — PM Produit

## RÉPONSE AUX OBJECTIONS

### CONFLIT A — périmètre d'it1

Je me range à la lecture de Narratif-IA, et je retire ma propre proposition de tour 1. Trois raisons, dans l'ordre où elles m'ont fait changer d'avis :

1. **Ma propre démo contient un « et ».** Relue à froid : « qui répond dans son personnage, **et** ne révèle un indice que si la confiance qu'il lui porte est suffisante. » C'est exactement le signal que je suis censé traquer chez les autres et je l'ai laissé passer dans ma propre copie. Deux capacités distinctes — voix/personnalité, et révélation conditionnée — collées par un « et ». Veto que je m'applique à moi-même.
2. **Le précédent que je cite moi-même me contredit.** J'invoque « `agir` n'entre qu'avec R3, jamais de jet en même temps » (n°10 it2) pour justifier mon ordre de portes — mais c'est exactement l'argument de Narratif-IA pour dire que R4 doit entrer en it1 avec UN SEUL consommateur (la voix), pas deux (voix + mécanique de révélation). Je l'ai mal appliqué à moi-même.
3. **KR-268 (schéma qui grandit d'un champ par itération) est le bon invariant ici**, et mon it1 le violait en livrant d'un bloc un contexte scopé complet (fiche, curseurs, savoirs, confiance) pour un schéma de sortie à trois champs quand n°11 n'a jamais fait ça pour un rôle neuf.

Je retire donc : la porte `confiance_min` dès it1, le contexte R4 « complet » dès it1, et mon ordre de portes (confiance en premier parce qu'« interne à la feature »). Ce dernier point tombe aussi sur le fond : QA montre que la confiance exige d'abord une section `REGLES-DU-JEU.md` (bornes, formule, saturation — KR-130), ce qui la rend *plus* lourde à câbler que `contrepartie`/`apres_indice_id`, pas moins. Mon critère de choix (« pas de dépendance externe ») était le mauvais critère.

Sur QA : je rejette nommément le point précis « it1 = savoirs sans évaluation de porte (tous acceptés par défaut) ». Ce n'est pas une version plus légère de l'it1 de Narratif-IA, c'est son inverse — fail-open au lieu de fail-closed. Ça contredit mon propre risque de tour 1 (« porte non câblée = fermée, jamais ignorée ») de façon frontale : un savoir ouvert par défaut, c'est une fuite programmée dès le premier lot, pas une fuite accidentelle qu'on découvre plus tard. Je durcis ce point en condition bloquante : **it1 n'injecte aucun savoir, point** — ni ouvert ni fermé, le mécanisme de savoir n'existe pas encore dans le contexte R4. C'est la lecture de Narratif-IA (« zéro savoir injecté »), pas celle de QA.

Je retire aussi mon it4 original (carnet d'indices avec extension de schéma `indices_connus: string[] → {indice_id, source_id, tour}[]`). Narratif-IA a raison : `source_id` et `tour` sont dérivables du journal au moment où `reveler_indice` s'est produit — les stocker crée une deuxième source de vérité que rien ne resynchronise, exactement le patron déjà condamné (`tier`, `Quete.lie_au_canon`). Le carnet devient une **vue dérivée du journal**, portée par l'itération qui introduit `indices_reveles`, pas une itération à part. Ça supprime une itération entière de mon découpage initial — une coupe, pas un ajout.

### CONFLIT C — fixture `dossier-reference.json`

Ça ne change pas ma phrase de démo d'it1, et c'est justement ce qui confirme que la coupe de Narratif-IA est la bonne. Sur l'it1 révisé (parler → voix seule, `{replique}`, zéro savoir), Corvin — seul PNJ décrit, zéro savoir — suffit tel quel : « le joueur parle à Corvin, qui répond dans sa voix » ne demande aucune donnée de savoir. Mon it1 de tour 1 aurait exigé d'enrichir la fixture juste pour être démontrable — un coût caché que je n'avais pas vu, et qui aurait fait grossir le lot « squelette » avec une tâche de données. Je classe l'enrichissement de fixture (un PNJ avec au moins un savoir gardé) comme **prérequis non-code de l'itération qui introduit `indices_reveles`** (l'it2 révisé ci-dessous), pas un changement de périmètre d'it1.

### CONFLIT B — `destinations.ts` / lot contrat

Côté valeur pour l'auteur, je tranche : oui, c'est assez grave pour rouvrir `destinations.ts` dès it1, et je ne suis pas d'accord avec l'affirmation du Tech Lead comme quoi « rien ne touche `types.ts`/`destinations.ts`/`validate.ts` ». Raisonnement : un PNJ qui change de nom d'un appel à l'autre n'est pas un défaut cosmétique, c'est la négation du travail de l'auteur — il a nommé son personnage, l'outil doit pouvoir s'en souvenir de façon stable.

Je n'arbitre pas le mécanisme exact (quels rôles reçoivent `nom`) — question d'architecture, pas la mienne. Mais je pose une **exigence produit non négociable** pour la revue d'it1, indépendante du mécanisme choisi : *le joueur doit pouvoir nommer un PNJ par le nom que l'auteur lui a donné, et ce nom reste stable à travers les tours*. Je signale au Tech Lead, nommément : sa ligne « rien ne touche `destinations.ts`/`types.ts`/`validate.ts` » doit être corrigée si Narratif-IA a raison sur le besoin d'audience conditionnelle — ce qui active Décision A (lot contrat, seul et en premier). Je l'intègre comme **premier lot d'it1**, pas comme itération séparée : c'est un changement de ligne de classification, pas une extension de schéma avec chemin de migration, donc proportionné à rester dans it1.

## MA POSITION MISE À JOUR

4 itérations, schéma de sortie R4 qui grandit d'un champ par itération (KR-268), fail-closed du début à la fin. Je remplace entièrement mon découpage de tour 1.

**it1 — voix seule, zéro savoir.**
Démo : « Le joueur adresse la parole à un PNJ présent, qui lui répond dans sa propre voix. »
Lots (4, plafond) : (1) lot contrat — `destinations.ts` : audience de `Personnage.nom` revue sous condition de rôle, JSDoc `types.ts` assortie ; (2) verbe `parler` dans `COMMANDES` (`refKinds:['personnage']`, arité 1) **et** reconnu par R1 dans le même lot (précédent `agir`/R3, n°10 it2) ; (3) bloc présence + bloc identité/fonction/apparence pour R3 — sans ce bloc, R3 ne peut nommer personne ni dire qui est là, et le joueur ne peut pas formuler « parler à X » ; (4) R4, 10e branche worker + `CopiloteService`, sortie strictement `{replique}`, aucun savoir dans le contexte. Garde structurelle : PNJ absent/mort → message système, zéro appel R4.
Hors périmètre d'it1 : tout savoir, toute porte de révélation (même fermée — le mécanisme n'existe pas encore), confiance, jet, carnet.

**it2 — révélation par portes structurelles, carnet dérivé.**
Démo : « Un PNJ ne lâche un savoir que si la condition que l'auteur a posée dessus est remplie. »
`contrepartie` (objet consommé) et `apres_indice_id` (séquencement) — même évaluateur, deux branches, groupées (raisonnement inchangé depuis tour 1 : aucune n'ouvre de sous-système, contrairement au jet). `confiance_min` et `jet` restent fermés (le mécanisme confiance n'existe pas encore). `indices_reveles: string[]` ajouté au schéma (2e champ). Carnet = vue dérivée de `session.monde.indices_connus` projetée sur `monde.indices[]` + le journal — aucun état neuf stocké. Prérequis non-code : enrichir `dossier-reference.json` d'au moins un savoir gardé sur un PNJ.

**it3 — la confiance comme mécanique.**
Démo : « La confiance qu'un PNJ accorde au joueur, gagnée réplique après réplique, finit par lui ouvrir un savoir qu'il gardait. »
Ordre d'écriture KR-130 : section « Confiance » dans `REGLES-DU-JEU.md` (bornes `CONFIANCE_MIN/MAX` réutilisées, départ 0, Δ∈{−1,0,+1}, règle de saturation) → test qui l'épingle → code. `EtatPnj.confiance` optionnel avec son premier lecteur (porte `confiance_min`, 3e porte honorée) dans le même lot. `delta_confiance` ajouté au schéma (3e champ). Jamais de chiffre affiché au joueur (confirmé par l'UX).

**it4 — la porte jet.**
Démo : « Un PNJ méfiant ne cède un savoir gardé qu'au jet que le moteur résout. »
Réutilise `issueDuJet` (n°11), seul appelant de `resolveChallenge`. Forme disjointe `resiste` sur R4 (second appel, sur le modèle R2), `CarteJet` réutilisé tel quel.

Hors périmètre de toute la feature (inchangé depuis tour 1, consensus) : `PorteeContreMesure` (→ n°14), transfert d'indice hors caméra (→ n°14), hostilité/combat (→ n°13), boutique XP/fins/mort (→ n°15/16).

## VERDICT

Recevable sous réserve, trois conditions bloquantes qui remplacent celles de mon tour 1 :
1. it1 n'injecte **aucun** savoir dans R4 — ni ouvert ni fermé ; condition durcie suite au rejet de la variante QA (« tous acceptés par défaut »).
2. Le lot contrat `destinations.ts` (nom de PNJ) est tranché — mécanisme libre, mais le critère « nom stable à travers les tours » est un critère d'acceptation nommé d'it1, pas une note en marge.
3. Le carnet d'indices est une vue dérivée dans l'itération qui porte `indices_reveles` (it2) — aucune extension de schéma de session pour lui porter une provenance stockée.

## Décisions prises en autonomie (mises à jour depuis tour 1)
- Mon ordre de portes de tour 1 (confiance en premier) → retiré, remplacé par contrepartie/apres_indice_id → confiance → jet → si l'inverse (confiance en premier), on câble une mécanique qui n'a pas encore sa section `REGLES-DU-JEU.md` avant des portes purement structurelles qui n'en ont pas besoin.
- Forme du carnet d'indices (état stocké avec provenance vs vue dérivée) → vue dérivée, proposition de tour 1 retirée → si l'inverse, deuxième source de vérité que rien ne resynchronise (KR-013).
- Granularité du lot `destinations.ts` (itération séparée vs premier lot d'it1) → premier lot d'it1 → si itération séparée, une itération sans phrase de démo propre (un changement d'audience seul ne se montre pas à l'auteur, valeur nulle si isolé).
- Enrichissement de la fixture de référence → prérequis non-code de l'it2 → si rattaché à it1, pousse it1 à démontrer une révélation qu'elle n'a plus vocation à porter, rouvrant le Conflit A.

## Fichiers relus
`.claude/raffinage/moteur-acteurs-cadrage/tour1-{pm-produit,tech-lead,ux-designer,qa,narratif-ia}.md` (les cinq, entiers).
