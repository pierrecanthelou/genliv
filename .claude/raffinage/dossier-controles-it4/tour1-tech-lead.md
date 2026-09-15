# Tour 1 — `tech-lead`

> ⚠ **AVERTISSEMENT D'INSTRUMENT** — jeu d'outils réel : `Read`/`Grep`/`Glob` seulement. **Aucun Bash, pour la TROISIÈME invocation consécutive** (it3 tour 1, it3 tour 2, it4 tour 1). Zéro affirmation ci-dessous n'est mesurée : toutes sont `[LU]` (source + ligne) ou `[TYPE]` (conséquence de typage). Les runs demandés à l'orchestrateur ont été faits — voir `mesure-orchestrateur.md` : **4 suites / 35 tests verts**, et les trois affirmations factuelles **confirmées par lecture directe**.

RISQUE — `panneauControles.test.tsx` **épingle l'inverse exact d'it4** : `expect(within(liste).queryAllByRole('button')).toHaveLength(0)` + `not.toHaveAttribute('tabindex')` sur chaque `<li>`, sous le titre « aucune ligne n est un arret de tabulation ». Trois autres assertions (`querySelectorAll('p')` → 3) meurent avec le passage `<p>` → `<span>`, qu'impose le modèle de contenu de `<button>` (*phrasing* contre *flow*). **it4 ne complète pas cette suite : il renverse un invariant posé exprès.** Si l'ouvrier **supprime** le test au lieu de l'**inverser**, on perd la seule garde de forme de la ligne, sans trace.

OBJECTION — Contre le cadrage § 5 et la spec (« transforme un lot unique en **deux lots séquentiels** ») : **aucun découpage n'est possible.** Avec `onAllerALaSection` REQUISE, la chaîne `PanneauControles` → `App.tsx` → `DossierEditorScreen` est **atomique** — tout lot isolé échoue `tsc --noEmit`, donc échoue seul la porte qualité. La rendre optionnelle achèterait le découpage au prix d'un chemin sans navigation que personne n'exerce (précédent `niveauxParSection` REQUISE, it2). **UN lot, six fichiers, zéro worktree, zéro fusion.**

PROPOSITION — Render-prop **pur** (pas d'union) : `panneauControles?: (api: PanneauControlesApi) => ReactNode`, `api` portant UNE capacité nommée par son intention, `allerALaSection(section: SectionId)`. **Paramètre `SectionId`, jamais `DestinationNav`** : le panneau **ne peut pas exprimer** `'controles'`, donc ne peut pas fabriquer l'état illégal de BUG-082 — l'invariant est tenu par le **TYPE**, pas par une consigne. Et le verbe de la ligne est « **montrer le constat** », jamais « corriger » : c'est le verbe, pas la destination, qui désamorce la tension n° 2.

VERDICT — **recevable sous réserve** : (1) un lot, pas deux ; (2) les quatre assertions renversées le sont **nommément, dans le même fichier**, jamais supprimées ; (3) aucun libellé neuf ne nomme une section de destination.

## A-1. Découpage — UN SEUL LOT, pas de lot `contrat`

| Lot | Fichiers (propriété exclusive) |
|---|---|
| **L1** `clic-ligne-vers-section` | `bascule-editeur/components/DossierEditorScreen.tsx` (R) · `dossier-controles/components/PanneauControles.tsx` (R) · `dossier-controles/components/ListeControles.tsx` (R) · `src/App.tsx` (R) · `dossier-controles/tests/panneauControles.test.tsx` (R) · `bascule-editeur/tests/dossierEditorScreen.test.tsx` (R) |

**HORS lot, nommément** : `SectionNav.tsx` (§ A-4) · tout `src/brain/**` · les deux barils `index.ts` (`PanneauControlesApi` **n'entre dans aucun**).

**`brain/` : le cadrage a raison, je CONFIRME.** Tout ce dont les deux côtés ont besoin est déjà public — `SectionId`, `Controle`, `controleRemediation`, `pastilleNiveau`, `SECTIONS`. **Aucun lot n'est marqué `contrat`**, et il n'y a rien à figer avant de démarrer.

**Comment j'ordonne la forme de prop sans lot `contrat`**, du plus fort au plus faible : (1) **le plan la porte** — le § signature est recopié VERBATIM, c'est lui le contrat, pas un fichier ; (2) **l'ordre d'écriture DANS le lot est imposé** — le bloc de signature de `DossierEditorScreen.tsx` d'abord, puis le panneau et la liste, puis `App.tsx` (le rendez-vous structurel), puis les tests ; (3) **`tsc --noEmit` est le juge** — `App.tsx` ne compile que si les deux côtés s'accordent, donc il n'existe aucune fenêtre où un agent consommerait une signature non figée.

**Pourquoi un lot et pas deux** : avec une prop REQUISE, un L1 = `dossier-controles` seul laisse `App.tsx` en erreur `tsc` (prop manquante), et un L1 = `bascule-editeur` seul laisse `App.tsx` en erreur `tsc` (prop inconnue). **Les deux découpages produisent un lot incapable de passer la porte isolément.**

**Le signal de coupe « plus d'une feature » FEU, et je le déclare non bloquant** : la traversée de la frontière **EST** l'itération, le total est de ~12 lignes de production, et la spec a déjà acté cette déviation deux fois **avec son déclencheur d'escalade** (« si elle devait s'étendre à un TROISIÈME fichier de `bascule-editeur` ou gagner de la logique »). Nous en touchons **DEUX** — `DossierEditorScreen.tsx` et son test — et n'ajoutons **aucune logique métier**. **Le déclencheur n'est pas atteint.**

## A-2. La signature — figée, à recopier verbatim

```ts
// src/features/bascule-editeur/components/DossierEditorScreen.tsx
export interface PanneauControlesApi {
	/** Sélectionne la section nommée : elle devient la destination courante, sa
	 *  ligne de nav devient la ligne courante, et « Contrôles » cesse de l'être. */
	allerALaSection: (section: SectionId) => void
}

export interface DossierEditorScreenProps {
	dossierId: string
	panneaux?: Partial<Record<SectionId, ReactNode>>
	/** RENDER-PROP, et non plus un `ReactNode` déjà rendu : seul moyen pour
	 *  `App.tsx` de passer au panneau une capacité qui vit DANS l'écran.
	 *  Reste OPTIONNELLE — son absence éteint le second landmark (critère #8 d'it1). */
	panneauControles?: (api: PanneauControlesApi) => ReactNode
}
```

Site d'appel, même fichier :

```tsx
{destination === DESTINATION_CONTROLES
	? panneauControles?.({ allerALaSection: (section) => setDestination(section) })
	: (panneaux?.[destination] ?? <PanneauSection sectionId={destination} />)}
```

> `(section) => setDestination(section)` et **non** `setDestination` nu : passer le *dispatch* exposerait la surcharge « fonction de mise à jour » de `SetStateAction` à un appelant d'une autre feature. Une ligne, et l'API rendue est exactement celle qui est écrite.

La garde du landmark ne change pas : `panneauControles !== undefined &&`.

```ts
// PanneauControles.tsx — REQUISE (le seul appelant la passe toujours ; un chemin
// « panneau sans navigation » serait NON TESTÉ — précédent niveauxParSection, it2).
// Type DÉCLARÉ ICI, jamais importé de bascule-editeur : ce serait un import
// inter-features, et lintIsolation.test.ts le verrait.
onAllerALaSection: (section: SectionId) => void

// ListeControles.tsx — la liste rend un ÉVÉNEMENT, elle ne choisit pas la destination.
// C'est PanneauControles qui fait `controle → section`, en UN SEUL endroit : le jour
// où la destination change, un seul fichier bouge et cette présentation pure l'ignore.
onControleActive: (controle: Controle) => void
```

```tsx
// src/App.tsx
panneauControles={(api) => (
	<PanneauControles dossierId={route.dossierId} onAllerALaSection={api.allerALaSection} />
)}
```

⚠ **Ne rien insérer entre `panneaux={{` et `canon:`** : un test-grep épingle `/panneaux=\{\{\s*canon:\s*<PanneauCanon/`. Garder `panneauControles` AVANT `panneaux`, comme aujourd'hui.

**Contre les trois autres formes** : un **contexte `brain/`** serait une primitive à un seul appelant (KR-109, mon propre biais appliqué contre moi) · **lever `destination` dans `App.tsx`** serait une **source de vérité concurrente** sur « ce qui est affiché », soit BUG-082 déplacé d'un cran, et ferait remonter l'union délibérément LOCALE jusqu'à la racine — **veto** · **l'union `ReactNode | ((api) => ReactNode)`** serait deux chemins pour une prop dont un sans appelant de production.

## A-3. Tension n° 2 — ma position

**Non, router sur `Controle.section` ne reproduit PAS le défaut D-8, et je maintiens D-8.** Mon refus d'it3 visait « un rouge sur une section **sans aucun geste** qui l'éteigne » : le défaut y est **un signal non sollicité, sans texte**. Ici, trois choses diffèrent, et la troisième est décisive :

1. la transition est **sollicitée** — l'auteur clique ;
2. ce qu'il clique porte déjà, **sur la ligne même**, le OÙ et le QUOI FAIRE — it3 a mis cette troisième ligne là **exprès**, et le critère d'acceptation livré en fait la stratégie officielle du remède (« rien sur la section qui porterait le remède, celle-ci étant **nommée dans la phrase française** ») ;
3. **le retour est toujours à un clic** : le landmark « Contrôles » est rendu **indépendamment de `destination`**. On ne peut pas s'enfermer.

**La forme technique qui l'évite est le VERBE, pas la destination.** L'action est « **montrer ce constat dans le dossier** », jamais « corriger ». Sans un octet dans `brain/` ni un champ de plus : le nom accessible du bouton est **le texte des trois étages déjà rendus** (il nomme donc l'entité fautive **et** le remède) ; **aucune chaîne française neuve n'est introduite par ce lot** (propriété à vérifier en revue, c'est elle qui rend R10 opérant) ; et le critère se formule sur ce verbe, jamais « alors l'auteur atteint le remède », qui serait **un critère faux**.

**Corollaire pour le PM** : la phrase de démo doit dire « la section **où le constat a été produit** », pas « la section **fautive** », qui laisse croire au remède.

## A-4. `SectionNav.tsx` entre-t-il au lot ? **NON** — et la spec est à moitié fausse

`SectionNav` reçoit `selectedId` **dérivé en ligne** de `destination` et `onSelect={setDestination}`. `allerALaSection('personnages')` fait exactement `setDestination('personnages')` : surlignage, `aria-current` et panneau suivent **par le chemin déjà livré**, sans une ligne dans `SectionNav.tsx`. Sa JSDoc avait anticipé le cas (« le jour où une deuxième destination étrangère arrive, cette signature ne bouge pas ») — elle tient.

→ Le motif du troisième report (« il rouvre **DEUX** fichiers de `bascule-editeur` ») est **surestimé de moitié** : un seul fichier de production est touché.

## A-5. Encapsulation — les deux sens vérifiés

Ce qui traverse de `dossier-controles` vers `bascule-editeur` est **une fonction** `(section: SectionId) => void` : le panneau ne connaît ni `destination`, ni `DestinationNav`, ni `DESTINATION_CONTROLES`, ni le DOM de l'écran, et **ne peut pas représenter `'controles'`** — l'invariant BUG-082 est tenu par le compilateur. En sens inverse, l'écran **appelle** et rend le retour ; il ignore qu'il existe des lignes ou un `Controle`. Le vocabulaire commun (`SectionId`) est un type **publiquement exporté** de `brain/` — « lire un type publiquement exporté est l'abstraction elle-même, pas un détail ». **Aucun import de type entre features** : le rendez-vous est **structurel**, à `App.tsx`, et c'est pour ça que la signature doit vivre au plan — personne ne peut l'importer.

Trois pièges nommés pour l'autocontrôle : aucun `querySelector`/`getElementBy*` visant la nav · aucun texte de `SectionNav`/`ListRow` recopié dans `dossier-controles` · aucune dérivation de la destination depuis un texte d'affichage.

## A-6. Conséquences sur les tests

| Assertion | Pourquoi elle tombe |
|---|---|
| `queryAllByRole('button')).toHaveLength(0)` | la ligne DEVIENT un bouton |
| `not.toHaveAttribute('role','button')` / `not.toHaveAttribute('tabindex')` | idem |
| `querySelectorAll('p')` → 3, **deux sites** | `<p>` (flow) invalide dans `<button>` (phrasing) → `<span style={{display:'block'}}>`, comme `ListRow` le fait déjà |
| `panneauControles={<SondePanneauControles />}` | `[TYPE]` **erreur `tsc`**, pas un test rouge |

**Reste vert** *(à confirmer par un run)* : la garde BUG-082 (la sonde reste un nœud non interactif) et le test-grep d'`App.tsx` (il ne porte que sur `panneaux={{…}}`).

**Les deux tests neufs** : (1) « activer une ligne appelle `onAllerALaSection` avec la section DÉCLARÉE » — `jest.fn()`, **deux lignes de sections DIFFÉRENTES dans le MÊME test** (KR-197/202 : sinon on ne distingue pas un argument d'une constante), au clic **et** au clavier (Entrée/Espace, natif par le `<button>`, sans `tabIndex` ni `onKeyDown` maison) ; (2) la sonde de `dossierEditorScreen.test.tsx` devient un **render-prop**, et on constate que « Personnages » porte `aria-current`, que « Contrôles » ne le porte plus, et que **la liste des courantes est un singleton** (re-garde BUG-082).

Et la garde de forme **renversée dans le même `describe`**, pour que le diff montre le renversement : « chaque ligne EST un arrêt de tabulation » + un contrôle structurel des trois étages qui rougit encore si un étage disparaît — **le comptage de `<p>` doit être remplacé, pas perdu**.

## A-7. REJETS nommés (→ registre des désaccords)

| # | Rejeté | Motif |
|---|---|---|
| R1 | Un contexte/service `brain/` de navigation d'éditeur | Primitive à un seul appelant = dette (KR-109) ; le déclencheur écrit à la spec n'est pas atteint |
| R2 | `panneauControles?: ReactNode \| ((api) => ReactNode)` | Deux chemins pour une prop dont un seul a un appelant de production |
| R3 | `onAllerALaSection` optionnelle | N'achèterait qu'un découpage en 2 lots, au prix d'un chemin que personne n'exerce |
| R4 | Dériver la destination de `controleRemediation()` ou de `SectionDescripteur.cle` | Lire un texte d'AFFICHAGE comme un chemin : veto encapsulation + KR-219, déjà tranché en D-7 |
| R5 | Ajouter `sectionRemede` à `Controle` | Contredit un critère d'acceptation **livré** ; c'est une itération de contrat, pas un ajout en passant |
| R6 | Une table `ControleId → SectionId` dans `App.tsx` ou le panneau | Seconde vérité à tenir en phase avec les règles — KR-219 |
| R7 | Garder le rapport affiché à côté de la section atteinte | Change la mise en page (deux colonnes de contenu) et rouvre l'état unique ; le retour est déjà à un clic |
| R8 | Défilement / focus sur la ligne de nav atteinte | Ouvre `SectionNav.tsx` et demande un `ref` sur `ListRow` — veto maintenu depuis it1 |
| R9 | Extraire une primitive « ligne de constat cliquable » vers `brain/components/` | Aucun second appelant nommé (KR-109) |
| R10 | Un libellé qui nomme la section de destination (« Aller à Indices ») | Contredirait la ligne QUOI FAIRE dans **10 cas sur 10** ; le lot n'introduit aucune chaîne française neuve |
| R11 | Marquer le lot `contrat` « par précaution » | `contrat` signifie `brain/` ; un faux `contrat` apprendrait à l'essaim que la marque ne veut rien dire |

## A-8. Demandes au tour 2

**QA** — la mesure des deux `npx jest`, et sa position sur le remplacement du comptage de `<p>` : quel instrument garde « trois étages non vides » quand les étages sont des `<span>` ? **UX** — le restyle du `<button>` de ligne (reset sans couleur en dur, la règle ESLint rougit sur `rgb()`/`#hex`) et **la confirmation qu'aucun libellé neuf n'est requis** (R10). **PM** — la phrase de démo corrigée.
