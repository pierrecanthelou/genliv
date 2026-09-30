RISQUE — memoire (it3) est brain-only : rien dans le goal n'exige d'interface neuve. Si le comité y rattache Chip et le refus-console « puisque les fichiers rouvrent de toute façon », la surface de design grossit sans revue dédiée — une valeur en dur ou un composant maison peut s'y glisser sous couvert d'« itération sans écran ».

OBJECTION — le contrat déjà écrit en it2 (design_contract.suggestions) dit CE QUE fait le clic (« remplit le champ et soumet »), pas ses ÉTATS. Il ne suffit pas tel quel : pas de tokens Chip nommés, pas de comportement clavier, pas d'état verrouillé. Le rendu actuel (`PlayerInputBar.tsx` lignes 137-143, `<ul><li>` en `CSSProperties`) est un pis-aller assumé « non cliquable » — le muer en Chip sans amender le contrat reproduirait le même maison sous un autre nom. Le refus-console qui réapparaît n'est PAS un sujet de design — aucun texte, aucun token nouveau, seul le moment du `set` en cause (classe KR-013).

PROPOSITION — memoire seule : zéro contrat de design requis, verdict propre. Si Chip entre dans ce lot pour raison d'ouverture de fichier, amender le contrat it2 avec l'annexe ci-dessous avant code. Le refus-console peut être fermé gratuitement, sans passage devant moi.

VERDICT — recevable sous réserve (réserve : amendement Chip ci-dessous si et seulement si Chip est inclus dans ce lot ; sans Chip, recevable sans réserve).

---

## Annexe — contrat de design (amendement, applicable SEULEMENT si Chip entre dans it3)

**Composant** : `Chip` (feature-local `src/features/play-mode/components/Chip.tsx`, confirmé absent de `brain/components/` par la spec — précédent OutcomeBlock/KR-109). Anatomie et noms de tokens à **lire dans `design_handoff_gamebook_editor/components/`** (anatomie Chip du wireframe), jamais inventés — même discipline que `suggestionItemStyle` actuel (`--font-ui`, pas mono : le texte de suggestion est un fragment de fiction lue par le joueur, registre joueur, pas registre interface).

**Remplace** : le `<ul><li>` actuel de `PlayerInputBar.tsx` (lignes 136-144) par un conteneur flex-wrap de `<Chip>` (un par élément de `issueNarrateur.suggestions`), même condition d'affichage (`statut === 'raconte'`, `tour === session.horloge.tour`, `length > 0`).

**États requis** (absents du contrat it2, à écrire) :
- Défaut : `<button type="button">`, fond neutre, filet `--border` (jamais d'ombre — filet, pas ombre).
- Survol/focus-visible : légère teinte de fond issue des tokens neutres (`--surface-hover` ou équivalent réel — nom à vérifier dans `tokens/`), jamais l'accent (l'accent est réservé sélection/action primaire — un clic sur une suggestion n'est ni l'un ni l'autre, c'est un raccourci de saisie).
- **Verrouillé** (`isLocked === true`) : `disabled`, même traitement visuel que le bouton `TENTER` verrouillé (`opacity: 0.5`, `cursor: not-allowed`) — sinon un clic pendant le pas en cours viole KR-265 (deux appels concurrents).
- Vide : rien ne change — liste vide = aucun Chip rendu (comportement déjà correct, pas un champ auteur, pas de placeholder requis).

**Clavier** : `<button>` natif → Tab l'atteint dans l'ordre visuel après le champ/bouton TENTER, Entrée/Espace l'active nativement (aucun `onKeyDown` maison, même discipline que le formulaire). `onClick` appelle `soumettre(texte)` (la fonction déjà unifiée dans `PlayerInputBar.tsx:72`, précisément prévue pour cet usage par son commentaire ligne 69).

**Texte** : contenu = `suggestion` telle que rendue par R3 (registre joueur, déjà governé par le contrat R3) — aucun libellé interface nouveau à écrire ici.

**ESLint proposé** : étendre la règle `no-restricted-syntax` (déjà câblée pour les couleurs en dur) à une seconde vérification structurelle — tout fichier sous `src/features/**/components/` qui définit un objet `CSSProperties` contenant `borderRadius`/`background`/`cursor` en dehors de `var(--...)` échoue, pour empêcher qu'un futur Chip (ou tout autre composant) réintroduise le patron « `<li>` stylé à la main » plutôt que la primitive nommée. Complément qualitatif non automatisable : une règle ne peut pas vérifier qu'un `<button>` custom porte le bon nom de composant (`Chip` vs un `<li onClick>` maison) — ça reste une revue humaine, à faire au moment du lot feature.

## Décisions prises en autonomie faute de spécification

- Le périmètre exact de « Chip » pour it3 (juste le rendu + le clic, ou aussi ses états clavier/verrou) n'était pas tranché dans le goal brut → j'ai choisi de traiter le contrat it2 comme incomplet et d'exiger l'amendement ci-dessus plutôt que de le valider tel quel → si c'est l'inverse (contrat it2 suffisant tel quel), le risque est un Chip cliquable pendant le verrou de tour (double appel modèle, contredit KR-265) et un focus/clavier non spécifié laissé à l'improvisation du lot feature.
- Le registre typographique des suggestions (mono/interface vs `--font-ui`/joueur) n'était pas explicitement tranché pour Chip, seulement pour l'actuel `<li>` → j'ai choisi de conserver `--font-ui` (registre joueur, cohérent avec le fait que les suggestions sont un fragment de fiction, pas un libellé d'interface) → si c'est l'inverse (mono), on mélangerait les deux registres dans un même composant, ce qui serait un veto de ma part au tour suivant.
