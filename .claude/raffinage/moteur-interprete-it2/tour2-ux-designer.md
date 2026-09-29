RÉPONSE AUX OBJECTIONS — nommément

**PM (retrait de Chip cliquable en it2).** J'accepte, sous une réserve visuelle précise. L'argument produit tient : le goal d'it2 est « lire le récit », pas « interagir avec des suggestions » ; livrer `Chip` avant que la forme de `suggestions[]` soit éprouvée par l'usage gonfle la tranche pour une primitive qui n'a, en it2, aucun second appelant (même logique que le rejet D10 du tech-lead sur un lot dédié). Ma réserve : un texte simple ne doit **pas** ressembler à un chip désactivé — un rectangle à bordure, `border-radius: var(--r-pill)`, posé sans `onClick`, LIT comme un bouton cassé pour un joueur qui vient de découvrir `AGIR`. Le variant réduit doit être visuellement disjoint du variant `Chip` d'it3 : aucune bordure, aucune forme pilule, aucun `cursor`, aucun survol. C'est une liste de texte, pas un chip mort.

**Tech-lead (Lot E, table des fichiers).** Nommément : la table du Lot 2 liste `Chip.tsx` N et `Chip.test.tsx` N comme livrables d'it2. Si le comité suit le PM, ces deux lignes sortent du Lot 2 — le lot passe de 9 à 7 fichiers, aucun autre lot n'est affecté (aucune signature du Lot 1 ne nomme `Chip`). Je le signale pour que le tech-lead corrige sa table en tour 2, pas pour rouvrir son découpage.

**Tech-lead (fermeture périmée de `handleSubmit`).** Oui, cela touche mon contrat, et ça le confirme plutôt que ça ne le complique. Mon tour 1 (§2, ligne 42) demandait déjà que `onSelect` porte le texte directement plutôt que de relire un état tout juste posé — exactement la même famille de défense que le fix demandé par le tech-lead sur `handleSubmit`. Je précise la conséquence pour it3 : `Chip.onSelect` (toujours signature zéro-argument côté prop — chaque instance ferme sur SA chaîne de suggestion immuable, jamais sur `saisie`) doit appeler la **même** fonction de soumission que la touche Entrée, refactorée pour accepter le texte soumis en paramètre explicite et pour dériver l'état « champ vidé ou non » du résultat **de cet appel précis**, jamais d'un `avis` fermé à un rendu antérieur. Deux chemins de soumission qui divergent (clavier vs clic) dupliqueraient le bug au lieu de le fermer — un seul point d'entrée `soumettre(texte: string)` dans `PlayerInputBar`, appelé par les deux déclencheurs. Ce n'est pas un nouveau composant, c'est une contrainte sur la fonction déjà en cours de refonte dans ce lot.

**Narratif-ia.** Sa ligne « suggestions → Chip, JAMAIS persistées » reste vraie à l'identique dans le variant texte simple : c'est une règle de données (KR-013/249), indépendante du widget qui les affiche. Rien à amender de son côté.

**QA.** N'aborde pas Chip nommément ; rien à répondre ici — son critère #6 (ordre R1→écriture→R3) et son critère #7 (validateur) sont indépendants du choix de rendu des suggestions.

STATUT DE TES PROPRES OBJECTIONS (tour 1)

- Risque « le `Chip.jsx` de référence est un jeton retirable non focalisable comme un tout » → **maintenue, reportée à it3** (le risque ne disparaît pas, il change juste de date d'exposition — reste à trancher avant l'essaim d'it3, pas d'it2).
- Objection « dégradation R3 en bannière, jamais dans `OutcomeBlock` » → **maintenue**, aucune des quatre notes ne la conteste ; le tech-lead confirme même que le texte fixe reste affiché dans les trois cas d'échec (§C de sa note narratif-ia).
- Décision « aucun rendu quand `suggestions.length === 0` » → **maintenue**, cohérente avec le variant réduit ci-dessous.
- Point neuf, non présent au tour 1 : la forme visuelle du variant réduit doit être **positivement non-cliquable à l'œil**, pas seulement dépourvue de `onClick` → **durcie** en condition de recevabilité du retrait PM (voir annexe).

VERDICT — recevable sous réserve (retrait de Chip accepté à condition que : 1. le variant texte simple soit visuellement disjoint d'un chip — zéro bordure, zéro forme pilule, zéro `cursor: pointer` ; 2. la table de fichiers du tech-lead soit corrigée en conséquence ; 3. `Chip.onSelect`, quand il sera construit en it3, partage la fonction de soumission unique que corrige la fermeture périmée, plutôt que de forker un second chemin).

ANNEXE — contrat de design mis à jour

## A. Variant retenu si le comité suit le PM (Chip HORS périmètre it2)

Aucun nouveau fichier composant. Rendu inline, au même emplacement que prévu pour `Chip` (sous `OutcomeBlock` du récit, jamais dans son `children`), dans le fichier qui porte déjà l'écran de récit.

```
{avis?.type === 'recit' && avis.suggestions.length > 0 && (
  <ul style={suggestionsListStyle}>
    {avis.suggestions.map((s, i) => (
      <li key={i} style={suggestionItemStyle}>{s}</li>
    ))}
  </ul>
)}
```

- `suggestionsListStyle` : `margin: var(--space-3) 0 0`, `padding: 0`, `list-style: none`, `display: flex`, `flex-direction: column`, `gap: var(--space-1)`.
- `suggestionItemStyle` : `font-family: var(--font-ui)`, `font-size: var(--fs-sm)`, `color: var(--text-strong)` — **aucune bordure, aucun `border-radius`, aucun `background`, aucun `cursor`, aucun `:hover`**. C'est la condition de recevabilité : rien dans ces styles ne doit évoquer un contrôle interactif.
- Pas de puce ni de glyphe préfixe (`→`, `•`) : un glyphe d'amorce laisserait deviner une affordance de clic qui n'existe pas encore — à réserver au moment où `Chip` la rendra vraie.
- Pas d'en-tête (« PISTES » ou autre) : je choisis de ne pas inventer un mot d'interface non vu par le comité pour un état transitoire d'une itération ; le récit au-dessus suffit à contextualiser la liste (décision en autonomie, voir plus bas).
- Registre : verbatim joueur, 2e personne, contenu de `avis.suggestions[]` inchangé, identique au contrat Chip.
- État vide : `suggestions.length === 0` → rien n'est rendu (inchangé du tour 1).
- Clavier : aucune exigence — élément non interactif, hors du flux `Tab`, aucune régression possible.
- Coût de bascule vers it3 : remplacer `<li>` par `<Chip onSelect={...}>{s}</Chip>`, ajouter la fonction `soumettre(texte)` partagée avec Entrée. Le token de police/couleur du texte ne change pas ; seuls la forme du conteneur et le comportement de clic s'ajoutent.

## B. Contrat complet si le comité maintient Chip en it2 (au cas où)

Contrat inchangé par rapport au tour 1 (§2 de l'annexe tour 1 : `Chip.tsx` feature-local, `<button type="button">` racine entier, tokens `--surface-chip` / `--accent-bg` / `--accent-line` / `--r-pill` / `--focus-ring`, disposition `flex-wrap` sous `OutcomeBlock`, aucun état vide affiché), avec un seul amendement issu du tour 2 :

- `onSelect: () => void` reste la signature de prop (chaque `<Chip>` ferme sur SA chaîne de suggestion, jamais sur un état mutable).
- Le call-site dans `PlayerInputBar` n'invoque PAS un second chemin de soumission : `onSelect={() => soumettre(s)}`, où `soumettre(texte: string)` est la MÊME fonction que celle appelée par la touche Entrée après le fix de la fermeture périmée du tech-lead. Interdiction explicite : dupliquer la logique de soumission entre le clic-chip et Entrée-clavier — ce serait recréer le bug pour un seul des deux chemins pendant que l'autre serait corrigé.

DÉCISIONS PRISES EN AUTONOMIE FAUTE DE SPÉCIFICATION

- Absence d'en-tête au-dessus de la liste de suggestions texte-simple → j'ai choisi de n'ajouter aucun mot d'interface neuf (« PISTES », « SUGGESTIONS ») → si l'inverse est fait, c'est un vocabulaire d'interface non vu par le comité narratif/PM à faire valider, et une chaîne de plus à traduire/maintenir pour un état qui vit une seule itération.
- Absence de glyphe préfixe sur chaque suggestion texte-simple → j'ai choisi de ne rien mettre plutôt qu'un `→` qui suggérerait une affordance de clic inexistante en it2 → si l'inverse est fait (glyphe ajouté maintenant), il faudra vérifier qu'il ne crée pas une attente de clic déçue, ce qui est justement ce que le retrait de Chip cherche à éviter.
- Fonction de soumission unique `soumettre(texte: string)` partagée entre Entrée et (futur) clic-chip → j'ai choisi de la nommer maintenant dans le contrat de comportement pour qu'elle soit conçue ainsi dès le fix it2, même si Chip n'existe pas encore → si l'inverse est fait (le fix it2 ne prévoit qu'Entrée), it3 devra soit refactorer `handleSubmit` une deuxième fois, soit forker un second chemin de soumission qui rouvrirait la même classe de bug côté clic.
