# Tour 1 — `ux-designer` · `dossier-copilote` it3c

**RISQUE** — C'est le premier rôle qui doit rendre **À LA FOIS** une désignation (rang → personnage, comme `LigneDetenteur`) **ET** de la prose (`lien`, comme `LigneReplique`). Aucun des deux composants existants ne couvre les deux ; **leur étendre l'un l'autre par une prop optionnelle romprait le précédent « sœur, jamais variante »** (§ 3.4 it2, désaccord n° 24).

**OBJECTION** — `intensite` est **REQUISE**, le code va la poser **en silence** (`0`, neutre — une **VRAIE** valeur, pas un plancher). Sans mention à l'écran, **l'auteur croira n'avoir rien réglé sur un champ que le moteur exploite déjà**. Même famille que le désaccord n° 2 de 3a (KR-221), **mais sur un champ REQUIS, pas un bloc optionnel** — le silence reste malhonnête.

**PROPOSITION**
1. Composant neuf **`LigneRelation`** (sœur, pas variante) : eyebrow « ENVERS » + désignation (`localiserEntite`, **résolue par la CARTE depuis un id déjà résolu — jamais un rang à l'écran**) + bloc de lecture du lien + mêmes actions.
2. 6ᵉ carte **`CarteCompleterRelations`** — nomme le **geste**, pas l'entité.
3. **Bloc DÉJÀ ÉCRIT : le nom de la cible est résolu PAR LA CARTE au rendu** (`dossier.monde.personnages.find`) — **ce n'est PAS le problème d'injection du n° 10**, c'est un **affichage pur, résolvable dès aujourd'hui**. Repli honnête si la cible est introuvable.
4. **Mention permanente** annonçant l'intensité neutre posée par le code — précédent exact `MENTION_SAVOIR_CREE`.

**VERDICT** — **Objection forte sur (1) et (4), pas de veto** : livrables dans le contrat en annexe.

---

## ANNEXE (hors quota)

### A. Nommage — décisions et REJETÉS motivés

- **Composant** : `LigneRelation.tsx`, **sœur** de `LigneDetenteur` et `LigneReplique`.
  **REJETÉ** — étendre `LigneDetenteur` d'une prop `lien?: string` : une ligne avec lien et une ligne sans n'ont **ni la même hauteur ni le même sens de lecture** ; une prop optionnelle réintroduirait la distinction que « sœur, jamais variante » interdit.
  **REJETÉ** — étendre `LigneReplique` d'une prop `designation?: string` : ⚠ **motif inversé et décisif** — `LigneReplique` est **réemployée TELLE QUELLE par deux cartes** (3a, 3b) **précisément parce qu'elle ne porte aucun membre propre à un consommateur** ; lui ajouter un champ propre aux relations **casserait ce réemploi**.
- **Carte** : `CarteCompleterRelations`.
  **REJETÉ** — `CarteTisserRelations` : « tisser » est **déjà le geste de la carte 2** (indices), qui désigne **sans** porter de prose sur la ligne ; le réemployer ferait croire aux deux cartes **le même mécanisme**.
  Insérée après `CarteCompleterPlan`, **avant** le placeholder « Éclater le synopsis », qui **reste en dernier** — c'est un rôle non livré, pas une carte à dépasser.

### B. Textes exacts

```ts
export const CARD6_TITRE = 'Compléter les relations'
export const CARD6_CORPS =
	"Propose un autre personnage de ce dossier que celui-ci connaît, et la nature de ce qui les lie."
export const EYEBROW_ENVERS = 'ENVERS'
export function eyebrowRelationProposee(n: number): string { return `RELATION PROPOSÉE ${n}` }
export const MENTION_AUCUNE_RELATION =
	"Ce personnage n'a encore aucune relation connue — la première proposée s'ajoute."
export const MENTION_AUCUNE_RELATION_AU_LANCER =
	"Ce personnage n'avait aucune relation connue au lancement de cet assistant."
// Précédent EXACT : MENTION_SAVOIR_CREE — même geste, même honnêteté sur un champ
// moteur posé par le code sans que l'auteur l'ait réglé.
export const MENTION_RELATION_CREEE =
	"Une relation acceptée est enregistrée avec une intensité neutre, non réglée par le copilote — à ajuster ensuite dans la fiche (Personnages → Relations)."
export const TEXTE_CIBLE_INTROUVABLE = 'Personnage introuvable — référence rompue.'
```

Le mot exact du motif `cible-a-ecrire` est **à trancher avec `narratif-ia`/`tech-lead`** selon `PARTIES_REQUISES` réel — **je ne le fixe pas pour ne pas préempter le contrat de données**. Idem `MENTION_RELANCE_…` : la décision est hors de mon terrain, **mais le texte doit exister** (aucune carte livrée n'en manque).

### C. Anatomie de `LigneRelation`

```ts
export interface LigneRelationProps {
	/** localiserEntite('pnj', cible, index) — calculée par la CARTE, jamais recomposée ici. */
	designation: string
	/** La prose du lien, rendue TELLE QUELLE — aucun Field, aucun chemin. */
	lien: string
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void
}
export interface LigneRelationHandle { focusAccepter: () => void }
```
Ordre de rendu : eyebrow `ENVERS` → `designationDetenteurStyle` (**même jeton que `LigneDetenteur`**) → `blocLectureRepliqueStyle` (**même bloc que `LigneReplique`**, `pre-wrap`) → actions identiques aux deux sœurs. Le lien « Ouvrir la fiche » ouvre la fiche du **PORTEUR**, jamais celle de la cible.

**Aucun plafond de document sur `relations[]`** (aucune borne au schéma, précédent `plan_actions[]`) ⇒ **pas de prop `accepterDesactive`**. ⚠ **Réserve** : si le contrat de données introduit une borne de candidats (type `CANDIDATS_MAX`), **la leçon BUG-109 s'applique intégralement** — à revérifier une fois la forme de la proposition connue.

### D. Auto-référence (KR-194)
`cible_id === porteur.id` est **légal** mais **ambigu à l'écran**. **Proposition mineure** : suffixer ` (envers lui-même)` **concaténé PAR LA CARTE**, jamais dans `localiserEntite`, qui reste générique aux cinq espaces de noms.

### E. Bloc DÉJÀ ÉCRIT — réponse à la question n° 4 du cadrage

Gelé au clic Lancer **par COPIE DE VALEURS** (`relations[]` n'a pas d'id propre — même geste que `dejaEcritesGelees` dans `CarteCompleterPlan`, **jamais une référence**).

⚠ **LE POINT QUI DISSOUT LE BLOCAGE ANNONCÉ** : la résolution du nom se fait **au rendu de la carte** (`dossier.monde.personnages.find`) — **jamais dans `brain/`, jamais envoyée au réseau**. **C'est un rendu d'écran, pas le problème d'INJECTION que le JSDoc réserve au n° 10** : rien n'empêche l'écran de résoudre un nom d'audience `auteur` **aujourd'hui**, seul le **CONTEXTE MODÈLE** doit attendre l'appellation re-projetée. Repli `TEXTE_CIBLE_INTROUVABLE` si `find` échoue (**KR-021 : exposé, jamais filtré** — la ligne s'affiche quand même).
Le test « ordonnée vs interchangeable » gouverne **l'injection réseau future**, pas ce rendu : l'écran affiche **toujours** chaque relation déjà écrite, dans l'ordre du document.

**REJETÉ** — afficher la valeur brute d'`intensite` (« −2 ») : champ **moteur pur**, aucun libellé dérivé n'existe avant le n° 10, et **un nombre nu n'apprend rien que `lien` ne dise déjà en prose**.
**REJETÉ** — afficher un badge « secret » : le JSDoc est explicite (« ZÉRO mécanisme de code en itération 5 ») ; **l'exposer avant que l'assembleur n° 10 n'existe créerait une promesse que rien ne tient**.

### F. Clavier
`Select` → `Lancer` → (`Annuler` en vol) → chaque `LigneRelation`, `+` puis `×` → « Ouvrir la fiche » sur les acceptées. Focus post-décision : ligne suivante non décidée, sinon `Lancer` — **jamais une cible que ce même rendu désactive** (BUG-109).

### G. Jetons — **zéro neuf**
`--space-3/4` · `--font-mono`/`--font-ui` · `--fs-eyebrow`/`--fs-body` · `--track-eyebrow` · `--text-label`/`--text-body`/`--text-muted` · `--border-field` · `--r-md` · `--surface-inset` · `--hit-target` — tous déjà consommés par `styles.ts` (lu en entier).

### H. `LIBELLE_DES_CHAMPS` reste à QUATRE entrées
Aucun champ de `Relation` n'y entre. Le composant neuf ne porte **aucun `label="…"`** — les eyebrows sont rendus **en texte simple par la CARTE**, invisibles à `libelles.test.ts` (**4ᵉ occurrence du corollaire TL3a-3**).
