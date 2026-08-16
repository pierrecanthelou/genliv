# Tour 2 — UX — `dossier-objets` it1

**Nommément, à Tech Lead**, sur l'objection « `onMonter?`/`onDescendre?` sur `ListRowProps` n'aurait qu'un seul appelant réel — dette, pas contrat (KR-109) » :

Je retire ma proposition d'extension de `ListRowProps` et j'adopte la version « frères, zéro code `ListRow` ». Ton raisonnement KR-109 est le bon niveau de rigueur, et il y a mieux : mon propre précédent cité en tour 1 (`Stepper.tsx`) compose déjà `IconButton` **en dehors** du composant qu'il pilote — il n'ajoute pas de prop `onIncrement` à un composant partagé. « Composer en frères dans le fichier qui possède le besoin » est donc plus fidèle à ce précédent que ma version à props.

Aucune perte de mon côté — textes, focus, clavier tiennent identiquement dans les deux versions : ce sont des `<button>` natifs, Tab les traverse dans l'ordre du DOM du `<li>` que `PanneauObjets` possède, que le contrôle soit injecté dans `ListRow` ou posé à côté. La seule différence est que les deux `IconButton` sortent du cadre bordé de la carte plutôt que d'y être injectés — différence de composition CSS, pas de contrat de design, donc hors de mon terrain de veto.

Pour QA (Critère #3) : mes libellés exacts (« Monter l'objet « {nom} » » / repli numéroté) rendent sa reformulation directement testable par `getByRole('button', { name: ... })` + clic, sans jsdom de glisser à simuler.

**VERDICT — réserve levée. Recevable**, sous la version Tech Lead.

## Annexe — ajustement du contrat de design

Remplace la section « Extension de `ListRow` » de mon annexe tour 1 par :

**`ListRow.tsx`** : **inchangé** (hormis le docstring, qui referme la réserve qu'il avait ouverte à « poignée future », en notant que le mécanisme retenu est composé par la feature, pas porté par le composant).

**`PanneauObjets.tsx`** rend, pour chaque objet, un `<li style={itemRowStyle}>` (`display:flex; align-items:center; gap: var(--space-3)`) contenant :
1. `<ListRow ... />` en `flex:1, minWidth:0` (posé sur le `<li>`, pas sur `ListRow`) ;
2. un groupe `<div style={reorderStyle}>` (`display:flex; flex-direction:column; gap: var(--space-1)`) avec deux `IconButton` :
   - `▲` — `label={Monter l'objet « {nom} » | Monter l'objet n°{index+1} (sans nom)}`, omis si `index === 0` ;
   - `▼` — `label={Descendre l'objet « {nom} » | ...}`, omis si `index === objets.length - 1`.

`onClick` de chacun appelle `commit(objets réordonnés, id)` via le même `DossierService.update()` que les autres champs — aucun état miroir, aucun `useEffect` de resynchronisation. Textes, glyphes (▲/▼, famille de `▾` déjà canonique), placeholders et état vide de mon annexe tour 1 restent inchangés par ailleurs.
