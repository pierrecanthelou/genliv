# Tour 2 — `ux-designer` (contre-lecture)

## 1. Contre-lecture — réponse nommée à R10 du tech-lead

R10 rejetait le trailing au motif qu'il « contredirait QUOI FAIRE dans 10 cas sur 10 ». La prémisse est corrigée : 9/10 **confirment**. Le trailing vaut-il encore ?

**Oui — mais plus pour l'HONNÊTETÉ (il n'y a plus de mensonge à corriger). Pour la COUVERTURE.**

Vérifié règle par règle dans `controles.ts` : **QUOI FAIRE ne nomme littéralement la section de destination que pour une minorité des formes de règle.** Pour les autres, non :

- **les deux amorces** (`depart`, `canon`) : « Rédigez le texte que le joueur doit lire en arrivant. » — **aucune mention de « Départ »** ; idem pour Canon. Ce sont exactement les règles du **dossier neuf** — le tout premier rapport qu'un auteur verra ;
- **`personnage-sans-voix`** — **la règle la plus fréquente sur la référence (5 constats sur 10)** — dit « (Caractère exploitable → Manière de parler) », **qui est un bloc de fiche, jamais le mot « Personnages »**.

> **QUOI FAIRE est de la prose RÉDIGÉE RÈGLE PAR RÈGLE, pas dérivée de `controle.section`** : rien ne garantit qu'elle nomme la destination, et sur la majorité des cas réels mesurés, elle ne le fait pas. **Le trailing est le seul élément de la ligne mécaniquement garanti juste ET complet** — dérivé de `SECTIONS`, jamais de la prose, exactement comme la pastille est dérivée et jamais recopiée.

Ce motif **reconduit les deux conditions posées par le tech-lead lui-même** : « aucune chaîne française neuve » (le trailing dérive, il n'invente rien) et « le verbe, pas la destination, désamorce la tension n° 2 » (aucun verbe dans le trailing). **R10 tombe donc — mais pas seulement parce que « 10/10 » était faux. La question n'était jamais « le trailing ment-il ? », c'est « QUOI FAIRE couvre-t-il ce que dit le trailing ? ». Mesuré : non, y compris dans le cas le plus fréquent.**

> **⚠ Correction de l'orchestrateur sur le CHIFFRE, pas sur la conclusion.** L'UX écrit « 2 des 6 formes » ; le relevé exact est **3 des 8** — elle oublie `depart-desert`, dont la remédiation dit bien « ou changez le lieu de départ **(Départ)** ». **Pondéré par le volume réel, son argument est plus fort que ce qu'elle chiffre** : **5 constats sur 10** du dossier de référence n'ont aucune mention de leur section (les 5 `personnage-sans-voix`), et **0 sur 4** sur un dossier neuf.

## 2. Statut de chaque objection et réserve

| # | Point | Statut | Motif |
|---|---|---|---|
| 1 | Trailing requis, mot pour mot | **RETENU** | Motif reformulé : **couverture**, pas honnêteté |
| 2 | Tension n° 3 fausse alerte | **RETENU**, inchangé | Rien de neuf ne l'ébranle |
| 3 | Aucun composant neuf, `Chip` écarté | **RETENU** | 0 fichier, 0 appelant (mesuré) ; rejoint R9 |
| 4 | Aucun `--accent` | **RETENU** | Ligne jamais courante |
| 5 | Aucun verbe dans l'affordance | **RETENU** | Convergent avec le tech-lead |
| 6 | Focus retombant sur `<body>` | **signalé, non mandaté** | Exige un `ref` sur `ListRow` — non rouvert |
| **B-2** | Survol | **TRANCHÉ : aucun survol, aucun fichier CSS** | `ListRow.tsx` l. 93-94 porte **mot pour mot** la même doctrine. Et `grep` confirme **zéro `.css` de composant dans tout `src/`** — en introduire un ici serait **le premier du dépôt**, disproportionné pour un détail de polish |
| **B-3** | Casse + couleur | **TRANCHÉ : sentence case (aucun `textTransform`) + `--text-faint`** | `SECTIONS[].titre` est documenté « en casse phrase », et **`SectionNav` rend ce MÊME `titre` en casse phrase à quelques pixels du trailing, sur le même écran** — le forcer en capitales produirait **deux casses pour le même référent sur un seul écran**. Couleur : `--text-faint` est la famille établie pour une annotation secondaire de fin de ligne ; `--text-label` reste réservé à OÙ |
| **B-5** | Ce que la liste émet | **CÉDÉ au tech-lead** | « Zéro effet sur le rendu ou le texte — la forme du callback est une décision de câblage pure, pas de design » |

> **⚠ LES DEUX RÔLES SE SONT CROISÉS SUR B-5** — comme à it2 sur `niveauxParSection`. Le tech-lead a **cédé à l'UX** (`onSelectSection(section)`), l'UX a **cédé au tech-lead** (`onControleActive(controle)`). **À l'orchestrateur de trancher** : seul le tech-lead argumente sur le fond (le trailing force la liste à lire `controle.section` de toute façon, donc séparer l'affichage de l'aiguillage exprimerait la politique deux fois) ; l'UX cède en déclarant le point hors de son terrain.

## 3. Contrat de design final

**`ListeControles.tsx` seul.** Aucune primitive neuve. `SectionNav.tsx`, `ListRow.tsx` : zéro changement.

**Anatomie** — un `<button type="button">` enveloppant tout (pastille + colonne + trailing) ; le `<li>` ne garde que le filet conditionnel. Les trois étages passent de `<p>` à `<span>` + `display: 'block'` (contenu *flow* invalide dans un `<button>`) — **même correctif que `ListRow.titleLine`/`subtitleLine`**. La colonne passe de `<div>` à `<span>` pour la même raison, et gagne `flex: 1; minWidth: 0` (mécanique de `texts` dans `ListRow`).

```ts
const liDivider: CSSProperties = { borderBottom: '1px solid var(--border-divider)' }

const rowButtonStyle: CSSProperties = {
	display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
	gap: 'var(--space-3)', width: '100%', boxSizing: 'border-box',
	border: 'none', background: 'transparent', textAlign: 'left',
	cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 'var(--space-4)',
}
// Pas de règle :hover — doctrine ListRow.tsx l. 93-94 reconduite. Zéro fichier CSS.

const colonneStyle: CSSProperties = { display:'flex', flexDirection:'column', gap:'var(--space-1)', flex: 1, minWidth: 0 }

const trailingStyle: CSSProperties = {
	marginLeft: 'auto',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow)',
	color: 'var(--text-faint)',
	// AUCUN textTransform : `section.titre` est déjà en casse phrase et rendu tel
	// quel par SectionNav sur le même écran.
}
```

**Texte, mot pour mot** : `→ {section.titre}` — rendus réels : `→ Personnages`, `→ Indices`, `→ Départ`, `→ Canon`, `→ Jalons & fins`. **Jamais un verbe.** Glyphe `→` (U+2192). Titre **dérivé** de `SECTIONS`, jamais recopié.

| État | Traitement | Jetons |
|---|---|---|
| Défaut | fond transparent, filet porté par le `<li>` | `--border-divider` |
| Survol | **aucun changement** | — |
| Focus clavier | **hérité de `src/style.css`, zéro ligne à écrire** | `--focus-ring` |
| Actif | natif | — |
| Sélectionné | **sans objet** — cliquer démonte la ligne | — |
| Liste vide | déjà géré par `PanneauControles`, **hors périmètre, déjà conforme** | — |

**Clavier** : Tab natif, Entrée/Espace natifs, **aucun `onKeyDown` maison**. Échap sans objet.
