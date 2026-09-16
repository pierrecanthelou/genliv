# Tour 1 — ux-designer — dossier-controles it6

RISQUE — Une ligne bloquante peut, après saturation, affirmer « aucun enchaînement » alors qu'un enchaînement existe bel et bien (juste inefficace), et recommander à l'auteur de faire exactement ce qu'il a déjà fait. Le rapport perd sa valeur de diagnostic au moment précis où il devient plus sévère — le pire moment pour mentir à l'auteur.

OBJECTION — `PROSES_INDICE_SANS_SOURCE` ne porte qu'UNE prose par seuil. La saturation introduit, au seuil bloquant, DEUX causes distinctes (aucune source du tout / chaîne qui boucle sans jamais atteindre une source réelle) qui exigent un texte différent, sans quoi la docstring même de la table se contredit : « l'énumération des remèdes est isomorphe à l'ensemble des producteurs comptés » cesse d'être vraie dès qu'un remède déjà exécuté reste listé comme solution.

PROPOSITION — Écrire une SECONDE paire message/remédiation pour le cas « boucle sans source réelle » (texte exact en annexe), distincte de celle du cas « aucune source ». Le mécanisme de sélection (champ discriminant sur le constat, ou second ControleId sous KR-164) revient à brain/tech-lead ; contrainte non négociable de mon poste : le message ne doit jamais nier un enchaînement existant, et la remédiation ne doit jamais reproposer un geste que la saturation vient de neutraliser. Aucun nouveau NiveauControle ni token requis — les deux textes partagent BLOQUANT / --bad.

VERDICT — recevable sous réserve : la bascule alerte→bloquant est saine et n'a besoin d'aucune nouvelle surface, mais ne s'expédie pas avec le texte actuel inchangé sur le cas cycle/auto-boucle.

---

ANNEXE — Contrat de design (tranche it6-1, déplacement + saturation)

**0. Surface** : zéro fichier de feature, zéro nouveau composant, zéro nouveau token. L'infrastructure niveau/pastille livrée en it1/it2 (`pastilles.ts`, `ListeControles.tsx`, `badgeSection()`) est déjà exhaustive sur `NiveauControle` (`bloquant|alerte|info`) et n'a rien à apprendre : `PASTILLES.bloquant = { texte: 'BLOQUANT', tone: 'bad' }` → `--bad`. La bascule ne fait qu'exposer ce mot sur des lignes qui portaient ALERTE avant. Confirmation du challenge du cadrage : oui la conséquence est visible (pastille de section, ligne du rapport, `jouable`), non elle ne requiert aucun fichier neuf côté rendu — seul le TEXTE en `brain/dossier/controles.ts` (ou `atteignabilite.ts`) doit changer, et ce texte est author-facing donc de mon ressort.

**1. Texte INCHANGÉ** — cas « aucune source du tout » (0 producteur brut), seuil bloquant :
- message : « Aucun personnage, aucun effet et aucun enchaînement ne donne cet indice : le joueur ne pourra jamais l'obtenir. »
- remediation : « Confiez-le à un personnage (Personnages → Savoirs), révélez-le par un effet « révèle l'indice », ou faites-y mener un autre indice (Indices → Mène à). »

**2. Texte NOUVEAU requis** — cas « boucle sans source réelle » (≥1 producteur brut, mais aucun ne survit à la saturation — cycle A↔B, auto-boucle A→A), seuil bloquant :
- message : « Cet indice n'est relié qu'à des enchaînements qui bouclent sans jamais atteindre un personnage ou un effet : le joueur ne pourra jamais l'obtenir. »
- remediation : « Ouvrez cette boucle sur une vraie source : confiez l'indice de départ à un personnage (Personnages → Savoirs) ou révélez-le par un effet « révèle l'indice », plutôt que par un nouvel enchaînement (Indices → Mène à). »
- registre vérifié : indicatif présent impersonnel (sujet = l'indice/le document) sur le message, impératif 2e pers. pluriel sur la remédiation, chemin d'écran entre parenthèses, zéro glyphe, zéro terme interne (« mene_a », « cycle », « Map », « saturation », « point fixe » absents des deux textes) — conforme à la décision it5 UX sur le registre des remédiations.

**3. Seuil ALERTE** : aucun changement de texte. Un seul producteur post-saturation ne peut provenir que d'une chaîne qui atteint réellement une source (sinon elle compterait 0) : « n'est accessible que par un seul chemin… » reste vrai.

**4. État vide** : aucun changement. `TEXTE_ETAT_CALME` de `PanneauControles` reste « Aucun contrôle à signaler — le dossier passe tous les contrôles connus. » (règle « absent ≠ vide »).

**5. Clavier** : aucune interaction nouvelle ; chaque ligne reste un `<button type="button">` natif, Tab/Entrée/Espace natifs, `onSelectSection(section)` inchangé.

**6. REJETÉ (à porter au registre des désaccords)** :
- a. REJETÉ — garder le message bloquant unique actuel pour le cas boucle : il affirme « aucun enchaînement » en présence d'un enchaînement réel, et sa remédiation redemande à l'auteur le geste qu'il vient de faire — diagnostic auto-contradictoire.
- b. REJETÉ — patcher la remédiation existante par une clause conditionnelle (« …ou si un autre indice y mène déjà, vérifiez qu'il a lui-même une source ») plutôt qu'un second texte séparé : le message reste faux au premier étage, et fait porter à l'auteur la charge de deviner dans quel cas il se trouve — contraire à la discipline « un message, une cause » déjà appliquée par KR-164 au niveau des codes.
- c. REJETÉ — nommer l'autre membre du cycle dans le message (« …tourne en boucle avec l'indice X ») : calculable seulement pour un cycle à 2, faux pour l'auto-boucle et pour un cycle à 3+ — une formulation à exceptions plutôt qu'une règle unique.

**7. Hors mon tranchant, transmis tel quel** : le mécanisme de sélection entre les deux textes (discriminant sur `ConstatControle` vs second `ControleId`) est une décision brain/tech-lead ; ma seule contrainte est le texte lui-même et l'absence de tout nouveau `NiveauControle`/token.

Fichiers lus : `src/features/dossier-controles/specification.json`, `src/features/dossier-controles/components/ListeControles.tsx`, `src/features/dossier-controles/components/PanneauControles.tsx`, `src/brain/dossier/controles.ts` (l. 220-430, 630-690), `src/brain/dossier/pastilles.ts`, `design_handoff_gamebook_editor/tokens/colors.css`.
