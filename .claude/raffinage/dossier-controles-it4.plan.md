# Plan d'itération — `dossier-controles` · itération `4`

> Statut : **`validé`** — porte 2 franchie le 2026-09-15, **case rouge acceptée en connaissance de cause par l'humain** (même geste qu'à it1).
> ⚠ **La case « une seule feature touchée, hors lot `contrat` » est ROUGE et le restera.** L'itération touche `dossier-controles` + `bascule-editeur` + la racine de composition, et **aucun lot `contrat` ne l'excepte** (zéro fichier de `brain/`). Elle **ne peut pas être rendue verte en réécrivant le plan** : le tech-lead a montré que découper **annulerait la `resolved_decision` qui autorise l'itération** (« …et qu'il tient dans un lot unique possédant ce fichier en exclusivité »), et que les deux découpages concevables échouent tous deux sur `App.tsx`. **Précédent exact : it1, « déviation actée par l'humain à la porte 2 ».** Ce qui a changé depuis, et qui joue en faveur de l'acceptation : it1/it2 touchaient **deux** fichiers de production de `bascule-editeur`, **it4 n'en touche qu'un**, et n'ajoute **aucune logique métier** — le déclencheur d'escalade écrit à la spec n'est pas atteint, et le diff **recule**.
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-09-15
> Composition : `4 rôles` — motif : l'itération ne touche ni le dossier d'aventure, ni le moteur, ni un prompt, ni une audience, ni la mémoire de session. C'est un **geste de navigation** sur une valeur déjà calculée et déjà arbitrée ; convoquer `narratif-ia` coûterait deux tours pour rien.
> Exécution : `séquentielle` — **1 lot unique**, **sans marque `contrat`** (zéro fichier de `src/brain/**`). Pas d'essaim, pas de worktree, pas de fusion.
> Circonstance : la session s'est interrompue pendant le tour 1 ; `tech-lead`, `ux-designer` et `qa` ont **chacun été invoqués deux fois**. Les doublons sont fusionnés dans les notes, et leurs divergences internes ont été tranchées au tour 2 par leurs auteurs.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour l'ouvrier)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur atteint, depuis une ligne du rapport, la section où le constat a été produit. » |
| **Tranche** | `ListeControles` rend chaque ligne comme un `<button>` qui émet sa section → `PanneauControles` la transmet → `App.tsx` la relie → `DossierEditorScreen` appelle `setDestination` → `SectionNav` surligne la ligne atteinte. **Aucune persistance** : la destination est un état local d'écran. |
| **Lots** | **1 lot** · `contrat` : **non** |
| **Hors périmètre** | Le focus dans le champ fautif · le focus sur la ligne de nav atteinte · un champ `remedeSection` sur `Controle` · un contexte de navigation dans `brain/` · tout tri, groupement ou plafonnement · tout fichier CSS · toute assertion de teinte au rendu |
| **Reporté** | Le routage vers la **section du remède** → **`open_questions`**, avec sa clause anti-faux-signal (§ 8, D-8) · le focus sur la ligne de nav → inchangé depuis it1 |

**Ce que ce raffinage a changé par rapport au cadrage — quatre points, tous mesurés, et trois sont des corrections de l'orchestrateur :**
1. **La tension n° 2 du cadrage était FAUSSE** (« aucune règle ne mène à son propre remède ») : c'est **9 sur 10**. Relevée indépendamment par le tech-lead et la QA.
2. **Le vrai risque n'était aucune des quatre tensions** : un test existant épingle **l'inverse exact** de l'itération.
3. **« Combien de tests rougissent » était la mauvaise question** : `jest` reste vert à 35/35 sur un type mésapparié pendant que **`tsc` rougit sur 3 fichiers**, dont un que le cadrage ne nommait pas.
4. **La conversion `<p>` → `<span>` n'est PAS forcée** — mesuré : React ne reparente pas, aucun avertissement, **une seule assertion bascule**. Elle est retenue **par choix**, pas par nécessité (§ 3).

---

## 1 — But raffiné

À la fin de cette itération, l'auteur atteint, depuis une ligne du rapport, la section où le constat a été produit.

## 2 — Hors périmètre

- **Poser le focus dans le champ fautif d'une fiche** — traverse les `Panneau*` de n° 3/4/5/6 ; décision close depuis le cadrage.
- **Déplacer le focus sur la ligne de nav atteinte** — après le clic, le bouton focalisé se démonte et le focus retombe sur `<body>`. **Signalé par l'UX et le tech-lead, non mandaté** : exige un `ref` sur `ListRow`, primitive `brain/` à un seul appelant, veto maintenu depuis it1.
- **Un champ `remedeSection` (ou tout champ de destination) sur `Controle`** — cible **plurielle** (`indice-sans-source` a trois remèdes) : c'est une itération de logique, pas un ajout de nav.
- **Un contexte ou service de navigation d'éditeur dans `brain/`** — primitive à un seul appelant.
- **Lever `destination` dans `App.tsx`** — seconde source de vérité sur « ce qui est affiché », classe de BUG-082.
- **Tout tri, groupement ou plafonnement de la liste** · **toute assertion de teinte au rendu** (`toHaveStyle` est cassé sur les jetons `var()`).
- **Tout fichier CSS** — voir § 3 : il n'en existe **aucun** de composant dans `src/`, en introduire un ici serait le premier du dépôt.
- **`SectionNav.tsx`, `ListRow.tsx`, `Badge.tsx`, les deux barils, `sectionNav.test.tsx`, `createDossierFlow.test.tsx`, et tout `src/brain/**`.**

## 3 — Contrat de design

**Un seul composant touché pour le rendu : `ListeControles.tsx`.** Aucune primitive neuve (`Chip` n'a jamais été implémenté : 0 fichier, 0 appelant).

**Anatomie** — un `<button type="button">` enveloppe **tout** le contenu (pastille + colonne + trailing) ; le `<li>` ne garde que son filet conditionnel. Tab, Entrée et Espace sont **natifs** : aucun `tabIndex`, aucun `onKeyDown`, aucun `role="button"` maison.

```tsx
<li key={`${controle.path}-${index}`} style={index < controles.length - 1 ? liDivider : undefined}>
  <button type="button" onClick={() => onSelectSection(section)} style={rowButtonStyle}>
    <Badge tone={pastille.tone}>{pastille.texte}</Badge>
    <span style={colonneStyle}>
      <span data-etage="ou"         style={whereStyle}>{controle.location}</span>
      <span data-etage="quoi"       style={whatStyle}>{controle.message}</span>
      <span data-etage="quoi-faire" style={whatToDoStyle}>{controleRemediation(controle)}</span>
    </span>
    <span style={trailingStyle}>→ {titreSection}</span>
  </button>
</li>
```

**Une seule expression par ligne alimente l'affichage ET l'action** — c'est la garde anti-dérive, et elle rend la cohérence vraie *par construction* :

```ts
const section = controle.section
const descripteur = SECTIONS.find((s) => s.id === section)
const titreSection = descripteur !== undefined ? descripteur.titre : section
```

> Le **repli** est celui de `PanneauSection.tsx` l. 38-39, déjà en production : on affiche l'identifiant plutôt que rien. **Jamais** un `?? ''`.

**Le texte, mot pour mot** : `→ {titreSection}` — rendus réels `→ Personnages`, `→ Indices`, `→ Départ`, `→ Canon`, `→ Jalons & fins`. **Aucun verbe.** Glyphe `→` (U+2192), déjà au catalogue. Titre **dérivé** de `SECTIONS`, jamais recopié, jamais tenu dans une table locale.

**Jetons — tous existants, aucune valeur en dur :**

```ts
const liDivider: CSSProperties = { borderBottom: '1px solid var(--border-divider)' }

const rowButtonStyle: CSSProperties = {
	display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
	gap: 'var(--space-3)', width: '100%', boxSizing: 'border-box',
	border: 'none', background: 'transparent', textAlign: 'left',
	cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 'var(--space-4)',
}
// AUCUNE règle :hover — doctrine écrite de `ListRow.tsx` l. 93-94 reconduite.

const colonneStyle: CSSProperties = {
	display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
	flex: 1, minWidth: 0,   // pousse le trailing à droite, mécanique de `texts` dans ListRow
}

const trailingStyle: CSSProperties = {
	marginLeft: 'auto',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',      // cohérence LOCALE avec `whereStyle`, même composant
	letterSpacing: 'var(--track-eyebrow)',
	color: 'var(--text-faint)',
	// AUCUN textTransform : `titre` est déjà en casse phrase et `SectionNav` rend
	// le MÊME titre en casse phrase sur le même écran.
}
```

`whereStyle` / `whatStyle` / `whatToDoStyle` : **jetons inchangés**, plus `display: 'block'`.

| État | Traitement | Jeton |
|---|---|---|
| Défaut | fond transparent, filet porté par le `<li>` | `--border-divider` |
| Survol | **aucun changement visuel** | — |
| Focus clavier | **hérité de `src/style.css`, zéro ligne à écrire** | `--focus-ring` |
| Actif | natif | — |
| Sélectionné | **sans objet** — cliquer démonte la ligne | — |
| Liste vide | déjà géré par `PanneauControles`, **inchangé** | — |

> **La conversion `<p>` → `<span>` est un CHOIX, pas une nécessité — et le plan le dit parce que le tour 1 l'avait présentée comme forcée.** Mesuré (§ 7) : React ne reparente pas, n'émet aucun avertissement, et les comptages de `<p>` **passeraient tels quels**. Elle est retenue pour **deux** motifs : `<p>` dans `<button>` est invalide au sens de la spec HTML (modèle de contenu *phrasing*), et **`ListRow.tsx` — le précédent du dépôt pour une ligne enveloppée d'un bouton — a déjà tranché ainsi**. Son coût est le ré-ancrage de deux assertions, et l'ancre `[data-etage]` qui les remplace est **meilleure** que le comptage par balise : elle compte par intention, pas par tag, et survit à l'ajout d'un `<p>` ailleurs dans la ligne.

## 4 — Contrats touchés

**Aucun contrat `brain/`.** Tout ce qui traverse existe déjà et est public : `SectionId`, `Controle`, `SECTIONS`, `controleRemediation`, `pastilleNiveau`. **Aucun export neuf dans aucun baril.**

| Frontière | Signature figée |
|---|---|
| `DossierEditorScreen` (prop) | `panneauControles?: (onSelectSection: (section: SectionId) => void) => ReactNode` |
| site d'appel | `panneauControles?.((section) => setDestination(section))` |
| `PanneauControles` (prop) | `onSelectSection: (section: SectionId) => void` — **REQUISE** |
| `ListeControles` (prop) | `onSelectSection: (section: SectionId) => void` — **REQUISE** |
| `App.tsx` | `panneauControles={(onSelectSection) => (<PanneauControles dossierId={route.dossierId} onSelectSection={onSelectSection} />)}` |

**Trois points non devinables :**
- **`SectionId`, jamais `DestinationNav`** — le panneau **ne peut pas exprimer** `'controles'`, donc **ne peut pas fabriquer l'état illégal de BUG-082**. *L'invariant est tenu par le type, pas par une consigne.*
- **`(section) => setDestination(section)`, jamais `setDestination` nu** — passer le *dispatch* exposerait la surcharge « fonction de mise à jour » de `SetStateAction` à une autre feature.
- **`panneauControles` reste OPTIONNELLE** (son absence éteint le second landmark, critère d'it1) ; c'est `onSelectSection` qui est requis.
- **Aucun type n'est importé entre features** : le rendez-vous est **structurel**, à `App.tsx` seul. C'est pourquoi la signature vit **au plan** — personne ne peut l'importer.

**Garde de placement** : dans `App.tsx`, `panneauControles` reste **AVANT** `panneaux`, et **rien ne s'insère entre `panneaux={{` et `canon:`** — un test-grep épingle `/panneaux=\{\{\s*canon:\s*<PanneauCanon/`.

## 5 — Lot

### Lot unique — `clic-ligne-vers-section` *(aucune marque : zéro fichier de `src/brain/**`)*

- **Ouvrier** : `dev-lot`, seul, séquentiel.
- **Fichiers (6, tous R — l'itération ne crée aucun fichier)** :
  `src/features/bascule-editeur/components/DossierEditorScreen.tsx` · `src/features/dossier-controles/components/PanneauControles.tsx` · `src/features/dossier-controles/components/ListeControles.tsx` · `src/App.tsx` · `src/features/dossier-controles/tests/panneauControles.test.tsx` · `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx`

**Ordre d'écriture IMPOSÉ** — il remplace le lot `contrat` : (1) la signature de `DossierEditorScreen.tsx` ; (2) `PanneauControles.tsx` puis `ListeControles.tsx` ; (3) `App.tsx`, le rendez-vous structurel ; (4) les deux fichiers de test. **`tsc --noEmit` est le juge** : `App.tsx` ne compile que si les deux côtés s'accordent.

**Pourquoi un lot et pas deux — argument TEXTUEL, pas seulement technique.** La `resolved_decision` qui **autorise** de toucher `DossierEditorScreen.tsx` est conditionnée : « …**et qu'il tient dans un lot unique possédant ce fichier en exclusivité pour l'itération** ». **Découper annulerait la décision qui autorise l'itération.** S'y ajoute que les deux découpages concevables échouent **tous deux sur `App.tsx`**, que deux lots ne peuvent pas nommer, et produisent un lot incapable de passer `tsc` isolément.

**Le signal de coupe « plus d'une feature » FEU, et il est déclaré non bloquant** : la traversée de la frontière **EST** l'itération. Le déclencheur d'escalade écrit à la spec (« un **troisième** fichier de `bascule-editeur`, ou de la **logique métier** ajoutée ») **n'est pas atteint** — it1/it2 touchaient **deux** fichiers de production de `bascule-editeur`, it4 en touche **un seul**, et n'ajoute aucune logique. *Le diff recule au lieu d'avancer.*

## 6 — Critères d'acceptation

1. **Câblage — l'écran réagit.** *Étant donné* `DossierEditorScreen` rendu avec une **sonde locale** en render-prop qui appelle `onSelectSection('indices')`, destination initiale `SECTIONS[0]` (Canon, **jamais** Indices), *quand* la sonde est activée, *alors* la ligne « Indices » porte **seule** `aria-current="true"` (égalité stricte du tableau filtré, **jamais** une inclusion) et le panneau Contrôles cède la place. — *composant* — `dossierEditorScreen.test.tsx`
2. **Contrat — le panneau appelle, au clic ET au clavier.** *Étant donné* `PanneauControles` rendu isolément avec `onSelectSection: jest.fn()` et **deux contrôles de sections DIFFÉRENTES** dans le même rendu (KR-197/202), *quand* l'auteur clique la première puis active la seconde au clavier (Tab, Entrée), *alors* le mock est appelé une fois par activation avec exactement chaque `SectionId`, **sans aucun `querySelector` hors de l'arbre du composant**. — *composant + user-event* — `panneauControles.test.tsx`
3. **Le rendu ne ment jamais sur sa destination.** *Étant donné* une ligne quelconque, *quand* on compare le titre affiché après `→` — dérivé dans le test **par le même mécanisme qu'en production**, jamais un littéral recopié — au `SectionId` que reçoit le mock au clic de **cette même ligne**, *alors* les deux désignent la même section. — *composant* — `panneauControles.test.tsx`
4. **Doublon de section.** *Étant donné* deux contrôles distincts de **même** `section`, *quand* l'auteur clique l'un ou l'autre, *alors* les deux émettent la même valeur. — *composant* — `panneauControles.test.tsx`
5. **Dossier calme — non-régression.** *Étant donné* un dossier sans aucun contrôle, *quand* le panneau est rendu, *alors* aucune ligne cliquable n'existe et le texte d'état calme est seul à l'écran. — *composant* — test existant **inchangé**
6. **Câblage réel de la racine.** *Étant donné* `src/App.tsx`, *alors* il passe `onSelectSection` à `PanneauControles` dans un render-prop, `panneauControles` restant **avant** `panneaux`. — *test de source* — `dossierEditorScreen.test.tsx`, `it` **séparé** (l'étendre dans le test existant ferait un nom couvrant plus que ses assertions, KR-199)
7. **Forme de la ligne.** *Étant donné* le lot livré, *alors* chaque ligne porte **exactement trois** étages non vides, ancrés par `querySelectorAll('[data-etage]')`, le `<li>` ne porte **ni** `role="button"` **ni** `tabindex`, et **la seule assertion renversée** est `queryAllByRole('button')` — **nommément, dans le même `describe`, jamais supprimée**. — *composant* — `panneauControles.test.tsx`
8. **Porte : `jest` ET `tsc`.** *Étant donné* le lot livré, *alors* les 4 suites sont vertes **et** `tsc --noEmit` ne rapporte aucune erreur — **`jest` seul ne suffit pas** : mesuré, il reste vert à 35/35 sur un type mésapparié pendant que `tsc` rougit sur 3 fichiers. — *porte qualité*

## 7 — Tests nommés

| Test | Assertion | Niveau | Lot |
|---|---|---|---|
| `la sonde du panneau selectionne la section demandee` *(réécrit)* | `aria-current` singleton sur « Indices » | composant | L1 |
| `activer une ligne emet sa section, au clic et au clavier` *(neuf)* | deux sections différentes, même test | composant | L1 |
| `le titre affiche est la section emise` *(neuf)* | cohérence rendu ↔ destination, dérivée des deux côtés | composant | L1 |
| `deux controles de meme section menent au meme endroit` *(neuf)* | — | composant | L1 |
| `App.tsx cable onSelectSection sur PanneauControles` *(neuf)* | test-grep de source, `it` séparé | source | L1 |
| `chaque ligne est un arret de tabulation` *(**RENVERSÉ**, même `describe`)* | `queryAllByRole('button')` → `n`, **une seule assertion touchée** ; `role`/`tabindex` du `<li>` **inchangés** | composant | L1 |
| `les trois etages sont la, et aucun n est vide` *(**ré-ancré** ×2)* | `[data-etage]` → 3, chacun non vide | composant | L1 |
| `dossier calme` · `sans panneau injecte, pas de second landmark` · KR-218 | **inchangés, aucune modification** | composant | — |

**Ligne de base mesurée avant le lot** : 4 suites, **35 tests verts** (`dossierEditorScreen` 26 · `panneauControles` 4 · `sectionNav` 1 · `createDossierFlow` 4).

**Piège à écrire pour l'ouvrier** : aucun `textTransform` n'est posé — mais s'il en posait un, **le DOM garderait la casse source** (`textTransform` est du rendu, jsdom ne l'applique pas au `textContent`). Tout `getByText` du trailing s'écrit **en casse source**.

**Non vérifiable en l'état — à recopier dans la revue, jamais compté comme vérifié :**

- **le survol, la casse et la couleur du trailing** — aucun instrument ne les couvre (`toHaveStyle` est cassé sur les jetons `var()`). Tranchés sur le **design**, jamais sur le test.
- **KR-219 et le veto D-3** (ne jamais dériver une destination depuis un texte d'affichage) — **aucun test ne peut le garder** : c'est une propriété de ce que le code *ne fait pas*. Elle reste un **autocontrôle de l'ouvrier** et un point de revue, nommé ici pour que personne ne la croie couverte parce que `jest` est vert. Le seul garde-fou mécanique est indirect : `const section = controle.section` **une seule fois par ligne** (§ 3), qui ne laisse aucun texte à parser.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif |
|---|---|---|---|---|
| D-0 | orchestrateur | La tension n° 2 du cadrage : « aucune règle ne mène à son propre remède » | `REJETÉ` | **Mesurément FAUSSE** — 9/10 mènent à leur remède, 4/4 sur un dossier neuf. Généralisation d'un critère d'it3 qui ne visait qu'`indice-sans-source`, **précisément la règle qui ne se déclenche jamais** sur la fixture citée |
| D-1 | UX ↔ TL (**R10**) | Un trailing nommant la section de destination | `RETENU` | **R10 RETIRÉ par son auteur** : motif faux (9/10), **et** seconde branche hors sujet (le trailing n'introduit aucune chaîne neuve). Motif final, **reformulé par l'UX au tour 2** : ce n'est pas l'honnêteté mais la **COUVERTURE** — `QUOI FAIRE` est de la prose écrite règle par règle, et **5 constats sur 10** du dossier de référence ne nomment jamais leur section, **0 sur 4** sur un dossier neuf. Le trailing est le seul élément **mécaniquement garanti juste et complet** |
| D-2 | TL (**R10-bis**), UX | Un **verbe** dans l'affordance, ou un nom de section **en dur** / en table locale | `REJETÉ` | Le libellé se **dérive** de `SECTIONS` au rendu ; le registre reste unique |
| D-3 | TL (**R4**) | Dériver une destination depuis un texte d'affichage | `VETO — RETENU` | Dans son domaine, **motif NEUF** : le trailing crée la **tentation inverse**. Sens unique `SectionId → titre`, **jamais** l'inverse, et aucun parsing de `controleRemediation()` |
| D-4 | UX inv. 1 ↔ inv. 2, TL | Le **survol** | `REJETÉ` | **Aucun survol, aucun fichier CSS.** Trois motifs : la doctrine est **écrite** (`ListRow.tsx` l. 93-94) · **zéro `.css` de composant dans tout `src/`**, ce serait le premier du dépôt · **aucun instrument ne vérifie un `:hover`**, et la skill interdit un critère sans instrument |
| D-5 | UX inv. 1 ↔ inv. 2 | Casse et couleur du trailing | `RETENU` : sentence case + `--text-faint` | **Mesuré** : `SectionNav` rend le **MÊME** `titre` en casse phrase **sur le même écran** — deux casses du même référent seraient une incohérence. Taille `--fs-eyebrow` (cohérence **locale** avec `whereStyle`) plutôt que `--fs-meta` de `ListRow` |
| D-6 | TL inv. 1 ↔ inv. 2 | Nom et forme du rappel | `RETENU` : `onSelectSection`, **fonction nue** | Le tech-lead tranche **contre sa propre invocation 1** : convention du dépôt (`ListRow.onSelect`, `SectionNav.onSelect`), trois voix sur quatre, et **le verbe que la spec emploie** (« s'arrêtent à SÉLECTIONNER la section »). Fonction nue : *« un objet à UN membre pour UN appelant est l'abstraction prématurée que je police ailleurs »* |
| D-7 | **TL ↔ UX, les deux ont CÉDÉ** | Ce que `ListeControles` émet | `RETENU` : `onSelectSection(section)` | **Les deux rôles se sont croisés** (comme à it2 sur `niveauxParSection`) : le TL a cédé à l'UX, l'UX a cédé au TL. **Je tranche pour la position que le TL a défendue en cédant, seule argumentée sur le fond** : le trailing oblige la liste à lire `controle.section`, donc `onControleActive(controle)` exprimerait la politique **deux fois, dans deux fichiers** — la seconde vérité que R6 rejette — et rien n'empêcherait un libellé de mentir sur sa destination. **Une seule expression `const section = controle.section` rend la cohérence vraie par construction, pas par un test** |
| D-8 | QA | Le critère de navigation face à un futur routage vers le remède | `REPORTÉ` → `open_questions` | Phrase retenue **mot pour mot** : « …sera **SUPERSEDED** par le nouveau contrat, **jamais RÉGRESSÉ** : le test qui change alors documente un contrat plus précis, pas une perte de comportement — un futur QA en mode B ne doit pas lire cette réécriture comme une régression. » |
| D-9 | QA, orchestrateur | « Deux comptages `<p>` meurent avec la conversion en `<span>` » | `REJETÉ` | **Mesuré deux fois** (QA, puis orchestrateur par sonde jetable) : React ne reparente pas, **zéro avertissement**, les comptages **passeraient tels quels**. **Une seule** assertion bascule. *Affirmation propagée par l'orchestrateur au dossier de tour 2 — troisième non-mesurée de ce raffinage* |
| D-10 | orchestrateur | La conversion `<p>` → `<span>` | `RETENU` **comme CHOIX, jamais comme nécessité** | Deux motifs : `<p>` dans `<button>` est **invalide au sens de la spec HTML**, et `ListRow.tsx` — le précédent du dépôt pour une ligne enveloppée d'un bouton — a **déjà tranché ainsi**. L'ancre `[data-etage]` qui remplace le comptage est **meilleure** : elle compte par **intention**, pas par balise. *Le plan écrit que ce n'est pas forcé, pour qu'aucun relecteur ne re-dérive une fausse nécessité* |
| D-11 | TL | L'ancre `button > span:last-child > span` | `REJETÉ` | **Retirée par son auteur** : fausse dès que le trailing existe (`span:last-child` désignerait **le trailing**). Remplacée par `[data-etage]`, convention **déjà arbitrée** au comité de `dossier-canon` it1 |
| D-12 | TL (R1, R2, R3, R5, R6, R7, R8, R9, R11) | Contexte `brain/` · union de prop · rappel optionnel · `sectionRemede` · table `ControleId → SectionId` · rapport affiché à côté · focus sur la ligne de nav · primitive partagée · marque `contrat` par précaution | `REJETÉS` | **Tous maintenus au tour 2.** R5 co-signé par le PM (cible **plurielle**). R11 vérifié fichier par fichier : **zéro fichier de `src/brain/**`** |
| D-13 | PM | La phrase de démo du cadrage (« section fautive ») | `RETENU` : reformulée | Ambiguë entre « où est l'erreur à corriger » et « où l'absence est constatée ». **La proposition du PM au tour 2 portait encore la clause « jamais à la section du remède », fausse dans 9 cas sur 10** — elle est écartée de la phrase de démo et vit au § 2 |
| D-14 | PM | « Le chiffrage sous-estime l'opérabilité clavier » | `RETENU`, **cause corrigée** | Le PM a **raison sur le fond, tort sur le poste** : le clavier est **gratuit** (`<button>` natif) ; ce qui manquait, c'est ce que le bouton **entraîne**. *Le chiffrage est ensuite retombé avec D-9.* |
| D-15 | QA | Le journal d'it3 écrit « dossierEditorScreen 28 → 28 » | `RETENU` : **erreur de journal** | **Mesuré aux trois commits** : le compte est **26**, inchangé avant et après it3 (une boucle `TITRES.forEach` génère 10 tests dynamiques). À corriger à l'étape 4, **pas un critère d'it4** |
| D-16 | orchestrateur | L'attribution, dans la revue d'it3, des dégâts de `docs/REGLES-DU-JEU.md` à un agent | `REJETÉ` | **Confirmé par l'humain le 2026-09-15** : c'est une **scission éditoriale** qu'il a lui-même engagée (`docs/REGLES-DU-JEU-PAPIER.md`). L'accusation de la revue d'it3 est **sans objet** et se corrige à l'étape 4 |

## 10 — Définition de fini

- [ ] Porte : `npm run format` → **`npm run typecheck`** → `npm run lint` → `npm test`. **`tsc` n'est pas optionnel** (D-9, § 6-8)
- [ ] *(score de mutation : **sans objet** — aucun des 4 fichiers mutés)*
- [ ] Les 8 critères du § 6 cochés un par un
- [ ] **La seule assertion renversée l'est nommément, dans le même `describe`**, jamais supprimée
- [ ] Aucun fichier touché hors des **6** du lot — en particulier **aucun fichier CSS**, **aucun `src/brain/**`**
- [ ] `docs/ROADMAP-BASCULE-IA.md` : statut n° 7 → **4/6**
- [ ] **Corriger « 28 → 28 » en « 26 → 26 »** dans `iterations_log` d'it3 (D-15)
- [ ] **Corriger l'attribution de l'incident `REGLES-DU-JEU.md`** dans `dossier-controles-it3.revue.md` (D-16)
- [ ] Budget de contexte relevé
- [ ] Revue écrite : `.claude/raffinage/dossier-controles-it4.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **levée** | chiffrage corrigé · phrase de démo reformulée (sans sa clause fausse) |
| Tech Lead | recevable sous réserve → **levée** | un lot · six fichiers · zéro `contrat` · assertion renversée nommément · libellé dérivé |
| UX | recevable sous réserve → **levée** | trailing au plan mot pour mot · survol tranché · casse et couleur tranchées |
| QA | recevable sous réserve → **levée** | motif de la tension n° 2 réécrit · assertion renversée **précisée** (une, pas quatre) · D-8 écrit mot pour mot |

**Aucun `ESCALADE`.** Le seul veto (D-3) est dans le domaine de son émetteur, sur un motif neuf, et ne bloque aucune décision de cette itération.
