# TOUR 2 — UX Designer · `dossier-fiches` it2

## RÉPONSES AUX OBJECTIONS

**À `narratif-ia` (discriminant APPARENCE)** — Le texte proposé (« l'apparence décrit, elle ne chiffre pas — la force se règle aux caractéristiques ») est nommé « placeholder » mais c'est une **consigne registre-interface**, pas une amorce de fiction. Le glisser tel quel dans le `placeholder` mélangerait les deux registres au sein du même champ — faute que je surveille explicitement. Il va dans le **`hint`**, pas le `placeholder`, qui reste l'exemple fictif inchangé.

**À `tech-lead` (extraction `BlocIdentite.tsx` conditionnelle)** — D'accord. Le contrat de design est identique inline ou extrait (mêmes `Field`, mêmes tokens) ; c'est une question d'organisation de fichier, pas de rendu. Pas d'objection à l'extraction conditionnelle — ni à son retrait.

## STATUT DE MES OBJECTIONS

**RETIRÉE.** Mon objection (« bandeau seul sans le fix `void` ») est satisfaite : le lot 2 du tech-lead couple systématiquement `EcritureDossier` + `RefusEnCours`, et PM/QA convergent indépendamment sur `'refuse'` réduit à hors-portée — exactement la réserve que je posais.

## POSITION SUR LE BUDGET DE MOTS ET SON RENDU

Le dépôt porte **deux** précédents, pas un : `ObjectifsCanon.tsx` (bandeau `role="status"` empilé sous le refus) et `PanneauCanon.tsx` (compteur inline sous le champ, `{mots}/{budget} mots`). Pour trois champs à valeur unique — la forme des trois proses d'Identité, pas une liste — c'est le **second** précédent qui s'applique, pas le premier. Si le budget entre : trois `<p>` sous `FONCTION` / `APPARENCE` / `DESCRIPTION JOUEUR`, calcul local (`compterMots`), zéro `useMemo` sur `validateDossier`, zéro second `role="status"`. Structurellement moins cher que la lecture dérivée proposée par `narratif-ia`, et ça désamorce l'objection de `tech-lead` : ce n'est pas une seconde surface d'écran, c'est trois lignes muettes qui changent de couleur.

**Écueil réel, pas rédhibitoire** : `compteurStyle` / `etatDe` sont déclarés **locaux** à `PanneauCanon.tsx`, décision motivée par « un seul appelant ». Un second appelant dans `dossier-fiches` rouvre cette décision — dupliquer localement ou promouvoir dans `brain/components`. Ce n'est pas à moi de trancher, je le signale pour que ça ne soit pas improvisé par l'agent.

**Si le budget n'entre pas** : l'auteur ne voit aucun signal de dérive de longueur au moment d'écrire. **Acceptable cette itération** — deux des trois champs sont « interne, jamais lu », `description_joueur` n'est jamais émis verbatim ; le risque de contexte est réel mais différé, pas visible à l'écran.

**`--bad` pour un avertissement non bloquant** : confirmé, **pas une faute**. Les deux précédents l'utilisent déjà pour la sévérité « avertissement » — distinction par **forme** (bandeau `role="status"` vs `<p>` inline) et par **texte**, jamais par une troisième couleur. Inventer un token ambre serait la vraie faute (valeur hors `tokens/colors.css`). Pas de veto.

## DELTA DE CONTRAT DE DESIGN

**1. `hint` d'`APPARENCE` — corrigé** (remplace la ligne du tour 1) :

> `interne — jamais lu par le joueur — décrit, ne chiffre pas : la force se règle aux caractéristiques`

Placeholder inchangé (reste fiction pure, aucune consigne meta injectée dedans).

**2. Si le budget entre** — compteur inline, aucun composant neuf :

```ts
type EtatCompteur = 'normal' | 'avertissement'
function compteurStyle(etat: EtatCompteur): CSSProperties {
	return { margin: 0, textAlign: 'right', fontFamily: 'var(--font-mono)',
		fontSize: 'var(--fs-meta)', marginTop: 'var(--space-2)',
		color: etat === 'avertissement' ? 'var(--bad)' : 'var(--text-faint)' }
}
```

Sous chacun des trois `Field` : `<p style={compteurStyle(etat)}>{mots}/{BUDGET} mots</p>`. Pas de `role="status"`, pas d'`IssueList`, pas d'eyebrow — texte muet, qui ne concurrence pas visuellement le bandeau de refus (seul `role="status"` de la fiche). Cumul sans conflit : compteur sous chaque champ, refus dernier enfant de la `Card`.

**3. Si le budget n'entre pas** : aucune modification du contrat du tour 1 — les trois `Field` restent tels que décrits, aucun `<p>` de comptage n'apparaît (absence de composant, pas état « off »).

**4. Registre** : la distinction `FONCTION` (fait, présent, sans style) / `APPARENCE` (mise en scène narrateur) / `DESCRIPTION JOUEUR` (rumeur publique, injectée) proposée par `narratif-ia` est cohérente avec mes trois `hint` du tour 1 — aucun autre changement de placeholder.

## VERDICT

Pas de veto. Objection du tour 1 retirée. Position tranchée sur le rendu du budget (compteur inline, pas bandeau) — au comité de décider si ce lot entre dans it2, ce n'est pas mon arbitrage.
