# Tour 2 — UX Designer — `moteur-interprete` (n°10)

**1. Champ pendant l'appel — je durcis mon tour 1, je désactive.** Budget borné (5 appels max/pas, 2 en nominal) mais l'état joueur n'est prouvé valide qu'après validation R1 puis écriture moteur (R3 arrive après persistance) : un second envoi pendant l'attente créerait une course avec une clarification pendante, or « deux clarifications d'affilée ne sont pas représentables ». `PlayerInputBar` : champ + bouton **désactivés** (pas vidés — texte conservé, cf. comportement R1 indisponible) pendant l'appel, libellé du bouton passe à `…` (jamais un état vide). Ergonomie dégradée assumée en connaissance de cause : objection forte, pas veto — la latence reste bornée par le budget de narratif-ia.

**2. Clarification — dans le bloc de récit, pas dans le champ.** Je confirme mon tour 1 : eyebrow mono `PRÉCISEZ` (registre interface) au-dessus de la prose R1 (registre joueur, 2e personne, présent). Le champ `PlayerInputBar` garde son libellé `QUE FAITES-VOUS ?` et son placeholder habituel `Décrivez ce que vous tentez…` — c'est la question du bloc de récit qui porte l'invite, pas le champ. Pas de nouveau composant : variante d'`OutcomeBlock` déjà proposée.

**3. Deuxième clarification (bug) — même traitement qu'un R1 illisible.** Le prédicat de `narratif-ia` rend ce cas indiscernable d'un R1 illisible après rejeu : même message système fixe, **« Reformulez votre action. »**, registre interface, affiché dans le bloc de récit — jamais une fiction, jamais un second état d'écran. `attente.clarification` reste inchangée (toujours la première question).

**4. Je retire ma formule de tour 1.** « Le narrateur répond brièvement pour l'instant. » emprunte une voix de personnage — incompatible avec l'interdit de `narratif-ia` sur un « texte neutre rédigé comme narration » en cas d'échec R3. Nouveau texte, fixe, registre interface, réservé au cas indisponible/illisible : **« Le récit n'a pas pu être généré ce tour-ci. »** La dégradation silencieuse du §D (suggestions puis fenêtre puis faits retirés, sans refus) ne montre, elle, aucun message — le récit est produit, juste plus court.

**Objection reprise nommément — QA, KR-262 (`Entite.nom`).** Je referme la question pour le périmètre n°10 : ni R1 (`CANDIDATS` = `description` de la cible) ni R3 (`SCÈNE` = `description`/`ambiance`/`dangers`) ne reçoivent jamais `nom` — le registre tient par construction, aucun test de fuite n'est nécessaire côté surface pour cette itération. Le risque global à huit collections que QA soulève reste ouvert mais hors scope de n°10 ; je signale qu'il redevient bloquant dès que la n°12 fait parler un PNJ — un narrateur qui ne connaît que « l'homme » ne tient pas une scène de dialogue.

---

Fichiers relus pour ce tour 2 : `tour1-narratif-ia.md`, `tour1-tech-lead.md`, `tour1-pm-produit.md`, `tour1-qa.md`, et ma propre `tour1-ux-designer.md` pour cohérence des positions.

## Résumé pour l'orchestrateur
- Tension 1 tranchée : champ+bouton désactivés pendant l'appel (texte conservé), inversion assumée de ma position tour 1.
- Tension 2 tranchée : clarification dans le bloc de récit (eyebrow `PRÉCISEZ` + prose R1), pas dans le champ.
- Tension 3 tranchée : deuxième clarification = même message fixe que R1 illisible (« Reformulez votre action. »), aucun état d'écran nouveau.
- Tension 4 tranchée : ma formule de dégradation retirée (registre fautif) ; nouveau texte fixe « Le récit n'a pas pu être généré ce tour-ci. », réservé au seul échec dur R3, jamais à la dégradation silencieuse du §D.
- Objection QA KR-262 répondue nommément : fermée pour n°10 (aucun `nom` injecté ni R1 ni R3), rouverte comme risque futur pour n°12.
- Pas de veto en tour 2. Aucun nouveau composant introduit au-delà de ceux déjà actés en tour 1 (`PlayerInputBar`, `Chip` à construire dans `brain/components/`, variante `OutcomeBlock`).
