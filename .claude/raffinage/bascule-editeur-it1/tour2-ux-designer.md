# Tour 2 — UX Designer

RISQUE — si je ne corrige pas maintenant, le premier ouvrier qui code `DossierCard` accède à `dossier.titre` avant d'avoir vérifié `lisible`, et TypeScript le refuse sur la branche `{id, lisible:false}` — ou pire, un `as` le fait taire et un titre fantôme s'affiche.

OBJECTION — j'accepte nommément les deux objections du Tech Lead. (1) `retryButtonStyle` est privé à `ImportDossierDialog.tsx` : je retire toute mention d'import, c'est un objet de style **local et dupliqué** dans `DossierCard.tsx`. (2) ma clause « titre vide/imprononçable » présumait un `titre` toujours présent : fausse sur l'union stricte. Je la réécris : le placeholder ne se déclenche QUE sur `dossier.lisible === false`, en lisant le discriminant en premier, jamais `dossier.titre` sur cette branche.

PROPOSITION — § 4 corrigé (delta ci-dessous). Et le texte du 5ᵉ critère PM : registre auteur, cohérent avec le vide « pur ».

VERDICT — recevable, les deux réserves tech-lead levées ci-dessous.

---

## Annexe — corrections

**§ 4, style téléchargement** — const **locale** `DossierCard.tsx` (aucun import) :
```ts
const downloadButtonStyle: CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-2)',
	border: 'none',
	background: 'none',
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
}
```

**§ 4, branche `lisible: false`** — remplace la clause précédente en entier : le discriminant `lisible` se lit **en premier** ; `dossier.titre` n'est jamais tenté sur cette branche (le type ne le porte pas, pas un champ vide). Le corps de carte devient :
- `<Badge tone="bad">⚠ Dossier illisible</Badge>`
- ligne explicative (mono, `fs-meta`, `text-muted`) : « Ce fichier ne respecte plus le format attendu. »
- identité de repli, seule donnée commune aux deux branches (mono, `fs-meta`, `text-faint`) : **« id : {dossier.id} »**
- pas de bouton téléchargement (déjà tranché tour 1) ; ✕ seul dans le coin.

**§ 3, empty state — 5ᵉ critère PM (variante « Book restants, zéro Dossier »)** :
> « Aucun dossier d'aventure ici pour l'instant : vos anciens livres restent stockés, mais ne s'affichent plus pendant la bascule. Importez un dossier pour commencer. »

Le vide « pur » (aucun Book, aucun Dossier) garde : « Votre bibliothèque est vide. Importez un dossier d'aventure pour commencer. » Même `emptyState`/glyphe ❏ pour les deux variantes.

*(Note tech-lead tour 2 : le nom de la const locale devient `telechargerButtonStyle`, avec `alignSelf: 'flex-start'` en plus des 8 déclarations ci-dessus — voir tour2-tech-lead.md § A.3, qui fait foi sur le nom exact.)*
