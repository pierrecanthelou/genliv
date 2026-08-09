# Tour 1 — Narratif & IA — bascule-editeur it2

RISQUE — Le seed est l'origine de **tout** dossier écrit après aujourd'hui, et ses quatre textes obligatoires ne sont pas neutres : `destinations.ts` classe `synopsis_mj`, `accroche_joueur` et `ton` en **`ia`** — le canon, seul bloc toujours chargé, injecté à chaque tour de chaque session — et `charpente.depart.texte_ouverture_joueur` en **`moteur`**, *émis verbatim au joueur* (l. 157-160). Un texte-modèle laissé tel quel n'est donc pas un champ vide : c'est du canon que le modèle tiendra pour vrai, et la première phrase lue au joueur. Le tout avec `ok:true` par construction — le seed fabrique en série la seule classe de document que toutes les portes automatiques acceptent et que personne ne peut jouer.

OBJECTION — Deux.
(a) « seed **valide** » n'est pas « seed **jouable** » : `CHAMPS_REQUIS` ne contrôle que le non-vide, et un seed qui le satisfait par construction rend le validateur aveugle sur la population de documents qu'il produira le plus souvent.
(b) KR-178 tel qu'il est écrit induit en erreur : « Lieu n°1 (sans nom) » est produit par `localiserEntite()` **au moment du rapport** (`identifiers.ts:209-214`), ce n'est pas une valeur à écrire. Posé dans `monde.lieux[0].nom`, il donne « Lieu « Lieu n°1 (sans nom) » » et change une absence calme (`types.ts:88`, « absent n'est pas vide ») en faux nom d'auteur. Le seed **omet** `nom`.

PROPOSITION —
1. Textes-modèles **constants et marqués** : `MARQUEUR_A_ECRIRE = '⟨à écrire⟩'` + `estTexteDeSeed()`, exportés de `brain/dossier/`. Textes exacts en annexe. Coût : une constante, un prédicat, un test.
2. Ni second champ de dialogue, ni titre recopié — `titre` est `auteur`, et sa copie dans un champ `ia` se périme au premier renommage.
3. `lieu.point-de-depart`, statique, `nom` omis. L'identifiant ne se dérive **jamais** du nom, ni ici ni au renommage de la n° 5 : `depart.lieu_id` deviendrait pendant.
4. Propriétaire d'extinction nommé : la n° 3 rédige, la n° 7 alerte, la n° 9 refuse d'ouvrir.

VERDICT — **recevable sous réserve** (réserves 1, 3, 4). Aucun dé, aucune statistique, aucune sortie modèle : rien ici n'appelle mon veto.

---

### Annexe (hors quota) — contrat de sortie IA concerné

**Il n'y en a aucun, et je ne l'invente pas.** Confirmation demandée par la question (3) : l'itération 2 ne construit aucun appel modèle — pas de prompt, pas de schéma de sortie, pas de rejeu, pas de repli à écrire. **§ 4 bis du template est SANS OBJET.** Écrire un contrat de sortie ici serait une table sans lecteur (précédent : `BUDGET_CONTEXTE` retiré en `dossier-format` it2). Ce que cette itération fixe, en revanche, c'est l'**entrée injectée** de tous les appels de la n° 10 — parce qu'elle en écrit le premier exemplaire, et qu'elle l'écrira des centaines de fois.

**Entrée injectée engagée par le seed** (relevé sur `DESTINATION_DES_CHAMPS`) :

| chemin | destination | ce qu'un texte-modèle y devient au Temps 2 |
|---|---|---|
| `canon.mj.synopsis_mj` | `ia` | vérité de l'histoire, chargée à **chaque** tour |
| `canon.partage.accroche_joueur` | `ia` | idem, côté joueur |
| `canon.ton` | `ia` | consigne de registre — un ton-modèle **pilote la voix** |
| `charpente.depart.texte_ouverture_joueur` | `moteur` | **lu au joueur mot pour mot**, sans passer par le modèle |
| `monde.lieux[0].id` | `moteur` | cible de `depart.lieu_id` ; jamais montré au modèle |
| `monde.lieux[0].nom` | `auteur` | **omis** — voir objection (b) |

**Textes exacts proposés** (chacun ≤ 20 mots, très en deçà de `BUDGET_MOTS_CANON` ; chacun nomme sa propre audience — c'est *cela*, l'invitation à écrire, et c'est la même phrase que l'aide de champ de la n° 3) :

- `synopsis_mj` : `⟨à écrire⟩ La vérité de cette aventure, y compris ce que le joueur ignore.`
- `accroche_joueur` : `⟨à écrire⟩ Ce que le joueur sait en ouvrant le livre.`
- `ton` : `⟨à écrire⟩ Le registre de langue de cette aventure — par exemple : sombre et feutré.`
- `texte_ouverture_joueur` : `⟨à écrire⟩ La première scène, telle que le moteur la lira au joueur, mot pour mot.`

Pourquoi **marqués** plutôt que simplement invitants : un texte d'exemple *plausible* (« Val-Cendre vous accueille… ») est indiscernable d'une rédaction d'auteur, par le linter comme par l'assembleur — et il se retrouve publié tel quel. Un texte marqué est détectable par **une seule chaîne**, en un seul endroit. Sans la constante partagée, la n° 7 et la n° 9 re-taperont le littéral chacune de son côté et les trois copies divergeront au premier changement de formulation — c'est la règle dupliquée entre code et prompt, sous une autre forme.

**Comportement d'échec disponible aujourd'hui** : `validateDossier` refuse la forme (`champ-requis-vide` si le seed régresse vers le vide) ; `roundtrip.test.ts` / `couverture.test.ts` gardent la forme et les destinations. **Ce qui n'existe pas et doit rester écrit** : *aucun instrument, aujourd'hui, ne distingue un texte-modèle d'un texte d'auteur.* La n° 7 le fera (alerte, jamais un blocage — un dossier en cours de rédaction n'est pas fautif) ; la n° 9 doit **refuser d'ouvrir une partie** sur un `texte_ouverture_joueur` encore marqué, seul cas où le silence coûte une partie entière.

**Dette narrative signalée** (question 3) : un seed dégénéré n'est pas un risque théorique. Il produit au Temps 2 une aventure à **un** lieu, **zéro** personnage, **zéro** indice, **zéro** jalon et **zéro** fin — un monde où le moteur n'a rien à résoudre et où le modèle, faute de canon, comblera le vide en inventant : exactement le mode de panne que le dossier existe pour empêcher. Le marqueur est ce qui rend cette dette **visible et adressable** au lieu de silencieuse. La borne de contexte, elle, n'est pas menacée par cette itération : quatre textes de moins de vingt mots, un lieu, aucune collection peuplée.

**Ce que je ne demande pas à cette itération** : ni détecteur, ni alerte, ni garde d'ouverture — ils ont chacun leur feature. Seulement la **constante + le prédicat**, pour que ces trois lecteurs interrogent une source unique.

---

Fichiers lus : `.claude/skills/raffinage-iteration/SKILL.md`, `src/features/bascule-editeur/specification.json`, `src/brain/dossier/types.ts`, `src/brain/dossier/tables.ts`, `src/brain/dossier/identifiers.ts`, `src/brain/dossier/destinations.ts`, `src/brain/dossier/__fixtures__/dossier-minimal.json`, `src/brain/DossierService.ts`, `docs/ROADMAP-BASCULE-IA.md`.

Deux points load-bearing pour l'orchestrateur, à ne pas perdre dans le résumé : (1) `destinations.ts:157-160` fixe `charpente.depart.texte_ouverture_joueur` en `'moteur'` avec le commentaire « une scène d'ouverture est ÉMISE VERBATIM par le moteur » — donc le placeholder de ce champ est du texte joueur, pas du contexte ; (2) KR-178 doit être **corrigé dans la spec** : le repli « Lieu n°1 (sans nom) » est une sortie de `localiserEntite()`, jamais une valeur à écrire dans `monde.lieux[0].nom`.
