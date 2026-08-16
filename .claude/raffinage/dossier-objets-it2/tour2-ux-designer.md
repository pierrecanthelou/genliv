# Raffinage `dossier-objets` it2 — Tour 2 (UX)

**Modal — veto conditionnel levé.** Tech Lead confirme indépendamment le patron `RetirerObjetDialog.tsx` (précédent it7) sans réserve de son côté ; plus de désaccord, donc plus d'objet à mon veto. Statut : `recevable`.

**Extraction `styles.ts` (tech-lead, KR-112)** — aucun impact sur mon contrat. C'est un déplacement de fichier, pas une réécriture : les mêmes objets `CSSProperties` avec les mêmes tokens (`var(--space-*)`, `var(--r-md)`, etc.) doivent réapparaître à l'identique dans `styles.ts`, rien n'est recréé ni retouché en valeur. Ma seule condition, non négociable : zéro valeur qui change de nom ou de source au passage — si `styles.ts` réintroduit une seule valeur en dur au lieu du token qu'il transporte, ça redevient mon terrain. Confirmé : `recevable`.

**Texte de la modale — la question est juste, je corrige.** Ma formulation d'origine (« avec son nom et sa description déjà renseignés ») affirme à tort que les deux champs sont remplis, faux pour un « Objet n°3 (sans nom) » retiré sans jamais avoir été édité. Le précédent `RetirerPersonnageDialog` évite exactement ce piège avec une formule générique qui reste vraie à zéro comme à cent pour cent : « tout contenu déjà renseigné parmi… ». Je reprends ce patron plutôt qu'une variante conditionnelle (pas de branchement dans le corps — la modale reste un seul nœud de texte, contrainte déjà posée par le précédent) :

> `L'objet ${désignation} sera retiré du registre, avec tout contenu déjà renseigné parmi le nom et la description. Cette action est irréversible.`

Remplace le texte donné en annexe au tour 1. Aucun autre texte de mon annexe n'est affecté (libellés de bouton, bandeau de refus, focus clavier inchangés).
