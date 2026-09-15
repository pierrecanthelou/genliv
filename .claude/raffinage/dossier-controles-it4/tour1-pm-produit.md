# Tour 1 — `pm-produit`

> ⚠ **Première note rendue SANS objection** (« Aucune ne franchit mon seuil de veto » — confusion entre *objection* et *veto*). **Relancée une fois** par l'orchestrateur, conformément à la skill ; les deux objections ci-dessous viennent de cette relance, et elles étaient déjà latentes dans la première note, mal rangées. Le reste du fond est d'origine.

RISQUE — Réutiliser `Controle.section` (conçu à it3 pour **allumer un badge**, jamais pour naviguer) comme cible de clic crée une attente de « **téléportation vers le remède** » que le contrat ne tient sur **AUCUN** des 10 contrôles mesurés. Sans garde de formulation, l'auteur clique, atterrit sur la section qui subit, et cherche encore où agir — un signal de **confusion**, pas un défaut de valeur.

OBJECTION *(produites à la relance)* —

1. **Le chiffrage à ~7 lignes ne couvre pas une exigence que le cadrage lui-même qualifie de non négociable.** Il porte sur la forme du render-prop et ne dit rien de la tension n° 4 (« un `<li>` muni d'un `onClick` n'est pas opérable au clavier »), posée comme **ergonomie de rédaction**, pas comme accessibilité optionnelle. Une itération dont le chiffrage écrit ne couvre pas une exigence non négociable est **mal définie sur ce point** — pas sur le fond de la valeur, sur le **périmètre chiffré**. Je demande que le lot inclue explicitement le rendu focusable de la ligne, **ou** que le cadrage le nomme hors périmètre en toutes lettres.
2. **La phrase de démo est ambiguë sur le terrain même où je dois trancher.** « Section fautive » se lit aussi bien « la section où est l'erreur à corriger » (le remède — tension n° 2) que « la section qui subit l'absence » (le contrat réel de `Controle.section`, KR-219). **C'est la même ambiguïté qui, à it3, a laissé passer une définition que le comité avait rejetée**, jusqu'à ce que le narratif la rattrape. Cette phrase **ne peut pas entrer telle quelle** dans `iterations[4].goal`.

## Phrase de démo proposée — remplace celle du cadrage, mot pour mot

> « À la fin, un clic sur une ligne du rapport de contrôles mène l'auteur à **la section qui porte l'absence signalée** — jamais à la section du remède. »

Elle nomme la cible réelle du contrat (« porte l'absence signalée » = ce que `Controle.section` encode depuis KR-219), **exclut explicitement** la lecture « remède » que la tension n° 2 identifie comme fausse piste, reste une seule phrase sans « et », et se démontre en un geste. C'est celle-ci, pas celle du cadrage, qui doit entrer dans `iterations[4].goal` et la fiche de validation.

PROPOSITION — Garder it4 telle que cadrée. Ajouter au plan une phrase explicite : « **le clic mène à la section qui subit le défaut, jamais à celle du remède** » — pour que personne ne dérive `section` vers le remède en cours de route, et pour que la **tension n° 4** (clavier : `<li onClick>` → élément focusable, ergonomie de rédaction non négociable) ne soit pas oubliée dans le chiffrage à 7 lignes, **qui semble la sous-estimer**.

VERDICT — **Pas de veto.** Un point à trancher au tour 2 : figer la phrase de démo pour lever l'ambiguïté « section fautive » (qui **subit**) contre « section du remède » (où **agir**), et confirmer que le chiffrage inclut l'opérabilité clavier.

## Positions sur les trois tensions

**Tension n° 2 — la valeur n'est pas nulle.** C'est strictement mieux que l'absence de clic, et le contrat de design le couvre déjà : le critère d'acceptation n° 5 d'it3, **livré**, impose que « le remède […] soit nommé dans la phrase française ». **Le clic est un signalement vers l'entité fautive, pas une téléportation vers le remède** — ça se dit dans le plan, ça ne se recode pas. Rouvrir KR-219 pour faire pointer `section` vers le remède serait une réouverture de décision actée : je ne la demande pas.

**Tension n° 3 — fausse alerte.** `DossierEditorScreen.tsx` garde `SectionNav` **et** l'entrée « Contrôles » visibles en colonne quel que soit `destination` (l. 108-124) : le retour au rapport est déjà **un clic**, symétrique à tout retour vers une section. **Aucun mécanisme neuf n'est dû.**

**Périmètre — je ne coupe pas.** Deux features + `App.tsx`, mais c'est le **MÊME diff** qu'it1 et it2 (`resolved_decisions` : « modifier un fichier d'une autre feature est admis sans logique métier neuve »), ~7 lignes chiffrées, **zéro troisième fichier de production**.

## ANNEXE

**1. Le refus du second champ, et c'est le point qui compte.** Le cadrage résumait deux issues — « la valeur tient » ou « l'itération change de forme ». Je choisis la première, **mais je refuse l'inférence implicite** qu'il faudrait un champ `remedeSection` sur `Controle` pour que ça vaille le coup. L'ajouter obligerait à recalculer, pour les 10 règles du registre, une **DEUXIÈME cible** — potentiellement **plurielle** : `indice-sans-source` a **trois** remèdes possibles selon la source manquante. Cela gonflerait le lot bien au-delà de « ~7 lignes + un render-prop » et rouvrirait `controles.ts` sur ses entrées : **pas un ajout de nav, une deuxième itération de logique**. Si le besoin se confirme après usage réel, ce sera une itération nommée à part — comme le focus dans le champ, déjà en `open_questions`.

**2. Sur le retour au rapport**, note pour le tour 2 : que la colonne de nav reste toujours montée est une **propriété du composant actuel**, pas un engagement écrit dans `resolved_decisions`. Je ne demande pas qu'on l'y écrive ici (ce serait gonfler une note pour documenter un comportement déjà correct), mais si un rôle proposait un jour de faire disparaître la colonne pendant l'édition d'une fiche, **ce sera le moment de vérifier que le chemin de retour tient encore**.

**3. Rien n'est rouvert** dans `resolved_decisions` ni `open_questions`. Le seul point neuf porté au plan est une **phrase de désambiguïsation**, pas une décision.
