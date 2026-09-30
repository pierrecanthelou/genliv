NOTE DE TOUR 2 — PM PRODUIT — `moteur-interprete` it3 (mémoire)

RÉPONSE AUX OBJECTIONS — nommément

1. Couplage KR-230 (narratif-ia, objection #1 — non traitée par le tech-lead dans sa note de tour 1) : je tranche pour le second rôle `chroniqueur` (narratif-ia, Annexe E).

Motif produit, pas architecture : la promesse la plus précieuse livrée à ce jour est celle d'it2 — « le joueur lit ce que son action a produit », zéro exception. Un `resume?` dans le même appel R3, sous la garde KR-230 (« refuse tout le lot »), transforme le défaut d'un artefact que le joueur ne voit JAMAIS (le résumé de mémoire) en un défaut visible et *périodique* : récit refusé, exactement un pas sur dix, corrélé à la cadence. C'est le pire endroit pour une panne aléatoire — elle devient un motif reconnaissable (« le moteur casse tous les dix tours »), donc un risque de fiabilité perçue, pas une hypothèse théorique. Le tech-lead nomme le risque dans sa propre annexe C (« un rang hors table refuse tout le lot ») sans jamais dire ce qui arrive si c'est le champ `resume` lui-même qui est fautif — narratif-ia le pointe, le tech-lead ne répond pas. Je ne peux pas fermer un lot qui laisse ce trou ouvert.

Le chroniqueur le résout PAR CONSTRUCTION, sans rouvrir KR-230 : sa validation est atomique sur SON seul payload (`{chronique}`) — KR-230 s'applique, intact, mais à un périmètre disjoint de celui de `recit`/`suggestions`/`faits_etablis`. C'est l'application correcte de la décision actée à deux surfaces séparées, pas une exception à celle-ci.

Contre-proposition que je laisse ouverte pour le tour 3 : si le tech-lead démontre, avant code, une variante à un seul appel où l'échec de validation de `resume` seul n'entraîne JAMAIS le refus de `recit`/`faits_etablis` (validation scindée par sous-arbre, pas par appel), j'accepte cette variante à égalité — mon exigence produit est le découplage des sorts, pas le compte des appels réseau. Faute de cette démonstration, le chroniqueur prévaut.

2. Chip cliquable et refus-console (moi-même tour 1 ; UX ; narratif-ia § G) : confirmés hors périmètre d'it3, définitivement. La vérification factuelle du tech-lead (memoire ne touche ni `PlayerInputBar.tsx` ni `EcranPartie.tsx`, `UseTourDeJeuResult` inchangé) referme le seul motif qui aurait pu les faire entrer — motif de coût de fichier, jamais de valeur, exactement le type d'argument que mon poste refuse par principe. Les deux partent en `open_questions`, sans échéance fixée ici : it4, ou une dette à déclencheur nommée le jour où un lot rouvre réellement ces fichiers.

STATUT DE MES PROPRES OBJECTIONS (tour 1)

- Chip/refus-console hors périmètre → MAINTENUE, et renforcée : elle repose maintenant sur une vérification factuelle du tech-lead, pas seulement sur mon jugement de tour 1.
- Préférence pour « un seul appel R3 par défaut » → RETIRÉE. Elle laissait ouvert exactement le risque que narratif-ia nomme en objection #1 et que personne n'a refermé côté tech-lead. Je ne peux pas imposer un appel unique au prix de la fiabilité du récit visible. Je retiens seulement la partie de mon exigence de tour 1 qui survit et qui reste satisfaite : rester dans UN SEUL LOT, sans fichier d'interface rouvert — le design de narratif-ia (Annexe E) le respecte, ce n'est donc pas une inflation de tranche, seulement un partage différent du même lot.
- Le reste de ma note de tour 1 (fenêtre calculée depuis l'horloge, mémoire jamais un champ dérivé stocké séparément, `resolved_decisions` non rejouées) → MAINTENUE, personne ne l'a contestée.

CE QUE JE RETIRE POUR COMPENSER (biais à surveiller)

En acceptant la charge du 9e rôle, je tiens la ligne ailleurs sans exception : R1 reste sans lecteur de mémoire (dette nommée, narratif-ia § F, reportée) ; aucune ancre PNJ (réservé n°12) ; aucun réglage supplémentaire des bornes déjà fixées (`FAITS_INJECTES_MAX=8`, `CADENCE=10`, `FENETRE_MIN=5`, etc.) au-delà de ce tour ; aucune fusion ni scoring des faits. Un rôle de plus, zéro autre extension du lot.

DÉCISIONS PRISES EN AUTONOMIE FAUTE DE SPÉCIFICATION

- Le goal d'it3 ne tranchait pas si la fiabilité du récit visible prime sur la simplicité d'un lot à un seul appel → j'ai choisi que oui, sans exception → si c'est l'inverse, le comité accepte qu'un pas sur dix puisse perdre son récit pour une cause que le joueur ne voit jamais, compromis qui n'était écrit nulle part comme acceptable.
- L'arbitrage entre « un lot, coût minimal » et « deux rôles IA découplés, fiabilité maximale » n'était pas dans le goal → j'ai choisi la fiabilité, à la condition vérifiée que le second rôle reste dans le même lot et ne touche aucun fichier d'interface → si c'est l'inverse, on économise un appel réseau un pas sur dix, contre un mode de panne périodique et visible sur la promesse d'it2.

VERDICT — recevable sous réserve : `chroniqueur` (narratif-ia, Annexe E) adopté comme mécanisme par défaut pour it3, sauf contre-démonstration du tech-lead au tour 3 d'une variante à appel unique qui découple explicitement l'échec de `resume` du refus de `recit`/`faits_etablis` sans rouvrir KR-230 ; Chip cliquable et refus-console définitivement hors périmètre d'it3, à verser en `open_questions` (it4 ou dette à déclencheur nommée).
