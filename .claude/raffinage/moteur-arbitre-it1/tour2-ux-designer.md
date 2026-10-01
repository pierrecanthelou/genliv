## Raffinage `moteur-arbitre` it1 — Tour 2 — UX

### RISQUE
Le texte `design_contract.bandeau_heros` encore inscrit dans `specification.json` ligne 9 (« PV x/y (--good si >50%, --bad sinon — seules deux couleurs sémantiques) ») n'a pas été corrigé après mon objection tour 1. Un agent de l'essaim qui code depuis la spec, pas depuis les notes de raffinage, livrera exactement la violation que j'ai signalée.

### OBJECTION
Je réponds nommément à narratif-ia, tour 1 § G : « si pvMax/peMax sont stockés, `heros.caracs` n'a aucun lecteur en it1 ». C'est inexact côté visuel — `EcranCreationHeros` EST le lecteur des caracs en it1 : l'écran de répartition du bonus 1D4 les affiche et le joueur agit sur elles en cliquant. Ce n'est pas au bandeau permanent de les lire. Mon contrat ne change pas : `BandeauHeros` reste nom/PV/PE/XP, jamais les caracs — que `pvMax`/`peMax` soient stockés (tranché par le tech-lead) ou dérivés n'a aucun effet visuel, puisque `BandeauHeros` ne recalcule jamais rien, il lit la feuille telle quelle.

Sur ma propre objection tour 1 (`--good`/`--bad` retirées du bandeau PV/PE) : ni PM ni tech-lead n'ont pris position pour une valeur produit réelle d'un signal visuel de PV bas avant it2 — PM ne mentionne pas le sujet, tech-lead non plus. Faute d'argument contraire déposé, je **maintiens** ma proposition par défaut (non durcie en veto, faute d'opposition à trancher) : `BandeauHeros` neutre, `--text-strong`/`--text-body` uniquement, aucune couleur sémantique en it1. Je demande que la spec soit corrigée dans le même lot que le code (ligne 9), sinon le texte qui reste écrit contredit le contrat que le comité a validé sans débat.

Sur la divergence de condition d'A4 (tech-lead : inconditionnel sur `lieuCible.id === depuis` vendu comme « gardé », donc appliqué même en auto-référence ; narratif-ia : `cible !== depuis`, ne se déclenche que si le lieu change réellement) : ça ne touche AUCUNE propriété de mon contrat visuel — mon § 3 (« aucune animation, le nombre change silencieusement au rendu suivant ») tient dans les deux cas, PV/PE restent des chiffres neutres sans delta affiché. Ça change en revanche la fréquence à laquelle le chiffre PE bouge réellement à l'écran : si inconditionnel, un auteur qui câble un accès auto-référent (ex. un lieu qui se « revisite » lui-même comme mécanique) verra son PE plafonner plus vite et le bandeau devenir visuellement statique plus tôt dans la partie — pas un défaut de design, juste un signal de rythme perçu à transmettre à PM/narratif-ia, qui tranchent la condition, pas moi. Pas d'objection de mon côté sur la valeur retenue.

Je confirme enfin que la GARDE 7 (gate inline dans `PartieEnCours`, avant le `return <CadrePartie>`) et le composant `BandeauHeros` (bande pleine largeur entre `<header>` et `corps`, prop `bandeau?: ReactNode` sur `CadrePartieProps`) tiennent sans aucun changement face à la signature finale `alea`/`creerRng` retenue au cadrage tour 2 et confirmée par le tech-lead ce tour — mon contrat ne lit jamais l'aléa, il lit `session.heros` déjà construit.

### PROPOSITION
1. Corriger `design_contract.bandeau_heros` dans `specification.json` (lot docs, même commit que le code it1) : remplacer « PV x/y (--good si >50%, --bad sinon — seules deux couleurs sémantiques) » par « PV x/y, PE x/y, XP n : NEUTRES (--text-strong / --text-body), AUCUNE couleur sémantique — réservée à it2 (Badge RÉUSSITE/ÉCHEC de CarteJet) ».
2. `EcranCreationHeros` reste l'unique lecteur visuel des caracs en it1 ; `BandeauHeros` n'affiche que nom/PV/PE/XP — aucun ajout de caracs au bandeau, quelle que soit l'issue de KR-013.
3. Condition finale d'A4 laissée à PM/tech-lead/narratif-ia — mon contrat (pas d'animation, pas de delta, lecture silencieuse au rendu suivant) est valide dans les deux cas, donc hors de mon veto.
4. Mon patron GARDE 7 + `BandeauHeros` est confirmé stable, aucune révision nécessaire.

### VERDICT
Pas de veto. Objection ferme maintenue (non durcie) sur `--good`/`--bad` : à retirer du texte de spec dans le même lot que le code. Correction de contrat demandée (point 1), reste du contrat tour 1 inchangé.

---

## Décisions prises en autonomie faute de spécification
- Qui lit visuellement `heros.caracs` en it1 → `EcranCreationHeros`, pas `BandeauHeros` → si c'était l'inverse (caracs affichées aussi dans le bandeau permanent), ça ajouterait 8 lignes à un composant que la spec borne explicitement à nom/PV/PE/XP, et contredirait mon propre patron « bandeau minimal, lecture seule, zéro surcharge avant it2 ».
- Statut de la divergence de condition A4 (inconditionnel vs `cible !== depuis`) → signalée comme neutre pour mon contrat, tranchée par d'autres rôles → si j'avais pris position sur la condition elle-même, j'aurais empiété sur un terrain narratif/mécanique hors de mon domaine (règle A4, pas tokens/composants).
- Correction du texte de spec (ligne 9) proposée comme un lot docs attaché au code, pas un lot séparé → sinon la spec continue d'afficher un contrat obsolète après que le comité l'a corrigé en discussion, piège classique pour un futur agent qui ne relirait que `specification.json`.

## Fichiers lus ce tour
`.claude/raffinage/moteur-arbitre-it1/tour1-ux-designer.md`, `.claude/raffinage/moteur-arbitre-it1/tour1-pm-produit.md`, `.claude/raffinage/moteur-arbitre-it1/tour1-tech-lead.md`, `.claude/raffinage/moteur-arbitre-it1/tour1-qa.md`, `.claude/raffinage/moteur-arbitre-it1/tour1-narratif-ia.md`, `src/features/moteur-arbitre/specification.json` (en entier, notamment `design_contract` ligne 9, `acceptance_criteria`, `resolved_decisions`, `open_questions`).
