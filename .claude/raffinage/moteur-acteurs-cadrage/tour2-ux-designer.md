# Cadrage n°12 `moteur-acteurs` — Tour 2 — UX Designer

## RÉPONSE AUX OBJECTIONS — nommées

**Narratif-IA § objection 3 (carnet) — acceptée, avec une correction de fond.** Vérification de `types.ts:1120-1155` : `Indice` n'a pas de `description_joueur` (champ qui existe sur `Objet`/`Personnage`), il a `verite` (audience `ia`, jamais montré) et `formulation_joueur` (audience `ia` aussi — alimente le contexte modèle, n'est **pas** une des deux proses verbatim du projet : seules `texte_ouverture_joueur` et `fins[].texte` le sont). Mon tour1 proposait donc de lire un champ qui n'existe pas, et même avec le bon nom, l'afficher tel quel au joueur aurait été un troisième canal verbatim non autorisé. Narratif-IA a raison : c'est le `recit` déjà validé dans `session.journal[]` — texte déjà montré une fois dans le flux RÉCIT au moment de la révélation — qui doit être re-affiché, jamais la prose de registre lue depuis le dossier.

Sur le stockage `{indice_id, source_id, tour}` : rejeté explicitement, aligné sur KR-013 (aucune extension de `indices_connus`, reste `string[]`). La jointure indice→entrée-de-journal se fait **au rendu**, par un simple filtre `useMemo` sur `session.journal` (une fois que R4 porte `indices_reveles` en it2).

**Point PNJ nom — confirmé sans impact de surface.** Dans brique1, le nom d'un PNJ n'apparaît que (a) dans la commande que le joueur a lui-même tapée, (b) dans la prose générée (`replique`). Le message système « {Nom} n'est pas ici » ne fait qu'échoer un nom que le joueur vient de taper — ce n'est pas une révélation d'UI. Aucun badge/label flottant portant un nom de PNJ n'est proposé. Zéro changement de contrat.

## MA PROPOSITION MISE À JOUR — `CarnetIndices.tsx` (play-mode, feature-local)

**Source de données (révisée)** : jointure dérivée, calculée au rendu, jamais stockée :
1. `session.monde.indices_connus: string[]` (existant, inchangé) → pour chaque id,
2. chercher dans `session.journal[]` (existant) la **première** entrée dont `indices_reveles` (champ à naître en it2, côté R4/brain) contient cet id,
3. afficher le `recit` de cette entrée comme corps de la ligne (fiction déjà validée, déjà montrée une fois au joueur — pas un nouveau canal verbatim, une re-présentation),
4. afficher `monde.indices[].nom` (registre, audience `auteur`) comme libellé mono-MAJUSCULES de la ligne — lecture directe du dossier pour un chrome d'interface, jamais injectée au modèle ; catégorie distincte du cas PNJ (qui concerne l'apparition d'un nom dans le flux de *fiction*, pas un libellé d'outil méta comme un carnet).

`formulation_joueur`/`verite` ne sont lus nulle part dans ce composant — à river par ESLint (voir ci-dessous).

**Anatomie inchangée** : `ListRow` par indice (libellé + corps = recit, lecture seule), `IconButton` 🗝 déclencheur, tiroir/`Modal` (clavier : Échap ferme, focus revient au `IconButton`), état vide inchangé (« Aucun indice découvert pour l'instant — explorez, parlez, fouillez. »), badge « NOUVEAU » tone neutre (optionnel, à confirmer au raffinage).

**Séquence des briques** : le carnet reste en brique2 (= it2 révélation) — déjà aligné avec Narratif-IA dès tour1. Réalignement de brique3/brique4 sur l'ordre de Narratif-IA (confiance avant jet, pas l'inverse comme initialement écrit) : coût nul côté contrat visuel — confiance n'a toujours aucun affichage chiffré, `CarteJet` réutilisé tel quel quelle que soit sa position.

**ESLint ajustée (annexe à celle de tour1)** : interdire tout accès à `formulation_joueur`/`verite` depuis `src/features/moteur-acteurs/components/**` (UI) — ces deux champs ne doivent être lus que côté `brain/copilote/contexte/*` (construction du prompt). Un accès en composant est le signal qu'on recrée un canal verbatim non autorisé.

## VERDICT
Recevable sous réserve, réserve resserrée. Je lève la réserve initiale sur l'anatomie du carnet (ListRow/Modal/IconButton confirmés valables). Je **durcis** en revanche : tout accès direct à `formulation_joueur`/`verite` depuis un composant play-mode est désormais un **veto explicite** (pas une préférence) — alignement total avec le refus KR-013 de Narratif-IA. Aucun autre point de mon tour1 ne change de statut : (a)+(b)+(c) (canal RÉCIT unique, CarteJet réutilisé, indices_reveles ajouté à indices_connus sans second tableau) restent bloquants, le reste recevable.

## Décisions prises en autonomie (Tour 2)
- Indice révélé plusieurs fois (plusieurs entrées de journal) → affichage de la **première** occurrence chronologique, dérivable sans état supplémentaire → si l'inverse (dernière mention ou concaténation), le composant se complexifie légèrement (tri) mais reste dérivé — pas un veto, un paramètre de rendu à trancher au raffinage.
- Ordre brique3/brique4 (confiance avant jet) → adopté l'ordre de Narratif-IA, coût nul sur le contrat visuel → si l'ordre inverse est retenu, aucun changement de contrat non plus — pas structurant côté UX.
- Lecture de `monde.indices[].nom` (audience `auteur`) comme libellé brut du carnet → jugé légitime, chrome d'interface jamais injecté au modèle, catégorie distincte du cas PNJ → si le comité juge qu'aucun champ `auteur` ne doit apparaître tel quel à l'écran joueur, le carnet devrait afficher un libellé généré par l'IA à la place, ce qui rouvrirait un contrat de sortie R4 supplémentaire — hors périmètre actuel, à trancher explicitement si le cas se présente.

## Fichiers consultés
`tour1-ux-designer.md`, `tour1-narratif-ia.md`, `src/brain/dossier/types.ts` (1109-1160), `src/brain/dossier/destinations.ts` (420-461), `src/brain/dossier/session.ts` (60-150, 476-550).
