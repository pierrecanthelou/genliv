# Tour 2 — Tech Lead — `dossier-objets` it1

```
À QA (veto #3) — résolu, et je vais plus loin que la convergence. Le mécanisme est
tranché à 4 rôles ; l'observabilité vient de ta réécriture. J'y ajoute UNE garde de
discriminance sans laquelle le test reste creux : déplacer un objet PARMI DEUX, puis
vérifier que la fiche affichée est toujours LE MÊME objet (sélection par id) et que son
brouillon n'a pas suivi l'index. Un reorder indexé par position au lieu de l'identifiant
est précisément le défaut que ce test-là attrape — famille KR-197.

À UX (onMonter?/onDescendre?) — OUI, KR-109 s'applique aussi à ta version, et je maintiens
« zéro code dans ListRow ». C'est du code brain/ à UN appelant, exactement ce que j'ai
reproché à `onReorder` ; l'accorder à l'une et le refuser à l'autre serait un deux poids
deux mesures. Deux faits mesurés : (a) la racine de `ListRow` EST le `<button>` — rendre
les flèches « hors du bouton » exige un conteneur neuf, donc une BRANCHE CONDITIONNELLE
dans une primitive que trois appelants n'exerceront jamais ; c'est mot pour mot ce que son
propre docstring (l.16-18) a refusé à sa création. (b) Le conteneur flex existe dans NOS
DEUX propositions : la seule différence est OÙ il vit. Chez moi, dans le fichier qui s'en
sert. Je te concède tout le reste — glyphes, libellés, cible, tokens, ordonnance du `<li>`
sont TON terrain, et la composition ne t'interdit aucun rendu. Ce n'est pas un veto : une
dette n'est pas une violation.

À PM — ta crainte du « chantier neuf » tombe avec ce choix : ~45 lignes de panneau,
~35 de test, ZÉRO fichier brain/ de code.

STATUT — #1 observabilité : RETIRÉE (convergence). #2 KR-109 : MAINTENUE et ÉTENDUE à la
proposition d'UX. #3 KR-187 : MAINTENUE, durcie en règle de découpage.
```

---

# Annexe — le point ListRow, tranché fichier par fichier

## 1. Les deux propositions produisent le MÊME DOM. Elles diffèrent d'un fichier.

| | UX — props additives | Tech Lead — composition |
|---|---|---|
| Conteneur flex `[ligne][▲][▼]` | **existe**, dans `ListRow.tsx` | **existe**, dans `PanneauObjets.tsx` |
| DOM rendu pour l'auteur | identique | identique |
| Clavier | identique (vrais `<button>`) | identique |
| Tokens / glyphes / libellés | décidés par UX | décidés par UX |
| Fichiers `brain/` de **code** modifiés | 2 (`ListRow.tsx`, `ListRow.test.tsx`) | **0** (docstring seul) |
| Branches dans une primitive `brain/` | **+1**, exercée par 1 appelant sur 4 | 0 |
| Appelants qui n'utiliseront jamais le code neuf | 3 (`SectionNav`, `PanneauLieux`, `PanneauPersonnages`) | 0 |
| Coût de la marche arrière | rouvrir une primitive `brain/` + ses 3 consommateurs | supprimer un `<li>` dans une feature |
| Coût de la promotion future | nul (déjà là) | **~20 lignes d'extraction**, au 2e appelant |

La colonne « coût de la promotion future » est la seule où UX gagne — et elle est chiffrée à vingt lignes. La colonne « appelants qui n'utiliseront jamais le code neuf » est celle où sa version perd, et elle se paie à chaque relecture future de `ListRow`.

## 2. L'argument qui n'est pas de moi mais du composant lui-même

`src/brain/components/ListRow.tsx`, l.15-18 :

> *« SANS POIGNÉE DE GLISSER : […] Le réordonnancement appartient à la feature n° 5 `dossier-objets`, qui ajoutera la poignée AVEC son câblage réel (`onReorder`) — une prop `draggable` posée par avance serait une branche jamais exercée dans un composant `brain/`. »*

Ce docstring pose deux choses, et il faut les séparer :
- une **attribution** (« c'est la n° 5 qui décide ») — elle tient, c'est nous, aujourd'hui ;
- une **hypothèse d'implémentation** (« elle ajoutera la poignée ») — écrite par une itération de `bascule-editeur` qui n'avait aucun appelant sous les yeux, et qui présuppose un glisser que les 4 rôles viennent d'écarter.

Le **motif** qu'il donne pour n'avoir rien posé — *une branche jamais exercée dans un composant `brain/`* — est exactement l'objection que j'oppose à `onMonter?`/`onDescendre?`. La différence entre « jamais exercée » et « exercée par un seul appelant sur quatre » ne justifie pas d'inverser la conclusion du fichier contre lui-même.

## 3. Ce que la version UX coûte techniquement, au-delà du principe

`ListRow` retourne aujourd'hui un `<button>` **racine**. Les flèches ne peuvent pas y entrer (bouton imbriqué). Deux issues, et aucune n'est gratuite :

- **Conteneur inconditionnel** — `ListRow` retourne toujours `<div><button/>…</div>`. Les trois consommateurs voient leur enfant flex changer de nature : `listeStyle` (`PanneauLieux.tsx` l.317-321) et son équivalent dans `SectionNav` posent `display:flex; flexDirection:column; gap:var(--space-3)` sur des enfants qui étaient les boutons eux-mêmes (`width:100%`). Le rendu peut survivre — il n'est pas *prouvé* survivre : aucun test de ce dépôt n'assied la couleur ni la boîte en jsdom (`ListRow.test.tsx` l.76-84 le dit explicitement). Un changement structurel non observable dans trois features closes est exactement le genre de régression que personne ne voit venir.
- **Conteneur conditionnel** — deux formes de rendu dans une primitive `brain/`, dont une exercée par un appelant. C'est la branche que le docstring a refusée.

Ma proposition n'a ni l'une ni l'autre : `ListRow` rend, octet pour octet, ce qu'il rend aujourd'hui.

## 4. Le seul argument qui me ferait céder — et il n'existe pas encore

Ma propre règle (et KR-109) : on promeut au **deuxième appelant réel**, ou au premier si le plan en **nomme** un second. Précédents du dépôt, cités par `identifiers.ts` l.97-100 : `frapperIdentifiant`, `localiserEntite`, `compterMots` — *« promus au deuxième appelant identifié, jamais avant »*.

J'ai cherché le second appelant : `docs/ROADMAP-BASCULE-IA.md` § 2 l.150 (n° 6 `dossier-registres` : quêtes, indices, événements, climat) **ne mentionne aucun réordonnancement**. Il n'y a donc pas de second appelant nommé, seulement un second appelant *plausible*. Plausible ne suffit pas — c'est la définition même de l'anticipation spéculative.

**Déclencheur de promotion, à inscrire au tour 3** (pour que ce ne soit pas une promesse orale) : au **premier autre écran qui demande un réordonnancement**, la paire monte dans `brain/components/ReorderControls.tsx` avec la signature suivante, et `PanneauObjets` devient son deuxième appelant :

```ts
export interface ReorderControlsProps {
	/** Libellé complet, entité comprise : « Monter « La lanterne de Corvin » ». */
	labelMonter: string
	labelDescendre: string
	/** `undefined` = borne de liste : le bouton est rendu désactivé, jamais absent. */
	onMonter?: () => void
	onDescendre?: () => void
}
```

## 5. Le DOM que je propose — UX en possède chaque valeur

Rendu par `PanneauObjets.tsx`, dans `src/features/dossier-objets/components/`. Je ne fixe que la **structure** ; tokens, glyphes, libellés et tailles sont ceux qu'UX écrira au plan.

```tsx
<ul style={listeStyle}>
	{objets.map((objet, index) => (
		<li key={objet.id} style={ligneStyle}>
			<ListRow
				title={localiserEntite('objet', objet, index)}
				subtitle={objet.id}
				selected={objet.id === objetAffiche.id}
				onSelect={() => setSelection(objet.id)}
			/>
			<IconButton
				label={`Monter « … »`}
				size={HIT_TARGET_MIN}
				disabled={index === 0}
				onClick={() => deplacer(objet.id, -1)}
			>▲</IconButton>
			<IconButton … disabled={index === objets.length - 1} onClick={() => deplacer(objet.id, 1)}>▼</IconButton>
		</li>
	))}
</ul>
// ligneStyle : { display:'flex', alignItems:'center', gap:'var(--space-2)' }
// la ListRow prend flex:1 via un conteneur, les flèches restent hors de son <button>
```

Note : `IconButton` doit accepter `disabled` — à vérifier par le lot 2 ; s'il ne l'accepte pas, la borne se rend en n'attachant pas de `onClick` **et** en posant `aria-disabled`, jamais en supprimant le bouton (une liste dont le nombre de contrôles varie déplace le focus sous les doigts de l'auteur).

## 6. Les lots, inchangés depuis le tour 1

Le tour 2 n'a bougé ni périmètre ni propriété de fichiers. Les deux lots tiennent **tels quels** :

- **Lot 1 `contrat`** (seul, en premier) — `src/brain/dossier/types.ts`, `src/brain/dossier/destinations.ts`, `src/brain/dossier/__fixtures__/dossier-minimal.json`, `src/brain/dossier/__fixtures__/dossier-reference.json`, `src/brain/dossier/couverture.test.ts`, `src/brain/index.ts`, `src/brain/components/ListRow.tsx` *(docstring seul)*.
- **Lot 2 `feature`** — `src/features/dossier-objets/index.ts`, `…/components/PanneauObjets.tsx`, `…/components/FicheObjet.tsx`, `…/tests/panneauObjets.test.tsx`, `src/App.tsx`.

Listes disjointes. Aucun fichier de `bascule-editeur` ni de `dossier-canon` nommé — et ce n'est pas une contorsion : `dossierEditorScreen.test.tsx` (l.300-333) rend l'écran avec ses **sondes locales**, sa table de sondes ne contient pas `objets`, l'index 4 retombe donc sur la branche « état vide » et **reste vert sans modification**. Le critère #7 (KR-187) est tenu par un fichier que personne ne touche.

Si UX obtenait gain de cause au tour 3, `ListRow.tsx` + `ListRow.test.tsx` restent **dans le lot 1** (contrat) et rien ne change au découpage — le désaccord porte sur le contenu du lot 1, pas sur sa frontière.

## 7. Réécriture des deux critères, pour le tour 3

**#3** (portée par QA, je la contresigne et j'y ajoute la discriminance) :
> Étant donné **deux** objets dans le registre, quand l'auteur active « Monter » (ou « Descendre ») sur le second — au clic **ou au clavier** —, alors l'ordre de `monde.objets` est persisté par `DossierService.update()` et reflété au rendu suivant ; **la fiche affichée reste celle du même objet** (sélection par identifiant, jamais par index) et son brouillon n'a pas suivi la position ; les boutons sont désactivés aux bornes de la liste.

**#2** (durcissement QA, KR-199) — je confirme et je précise le **niveau** : test de composant `jest` + `user-event` sur `PanneauObjets` monté dans un `BrainProvider`, deux objets distincts, assertions sur la **recette passée à `dossiers.update`** *et* sur le rendu — pas seulement sur le rendu, qui passerait aussi si rien n'était persisté.

## 8. Ce qui n'est toujours pas de mon ressort

Le mécanisme retenu (boutons) est un arbitrage UX/PM, pas un arbitrage tech-lead : je ne le revendique pas. Je ne tranche que **où vit le code** — et là-dessus, ma position est inchangée : dans la feature qui l'utilise, jusqu'au deuxième appelant réel.
