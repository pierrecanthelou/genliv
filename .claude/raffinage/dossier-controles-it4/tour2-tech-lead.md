# Tour 2 — `tech-lead` (contre-lecture)

> ⚠ **INSTRUMENT** — `Read`/`Grep`/`Glob` seulement, **quatrième invocation consécutive sans Bash**. Tout est `[LU]` ou `[TYPE]`, rien n'est exécuté. Aucun fichier touché. *Les trois affirmations de source ont été vérifiées par l'orchestrateur : `ListRow.tsx:93` porte bien la doctrine du non-survol · `Badge.tsx:37` rend bien un `<span>` · le précédent `data-etat` existe bien (`PanneauCanon.tsx:213/229`, arbitré au comité de `dossier-canon` it1).*

## 1. À l'UX — ta réserve est ACCEPTÉE, et R10 tombe

R10 disait : « contredirait QUOI FAIRE dans **10 cas sur 10** ». Le chiffre est faux (9/10 mènent à leur remède). **Je ne le répare pas par un autre motif** : je constate que **les deux branches s'effondrent**, et la seconde plus vite que la première — « le lot n'introduit aucune chaîne française neuve » **ne vise pas la proposition de l'UX** : `→ {section.titre}` n'en introduit aucune non plus, le `→` est un glyphe et `titre` se **dérive** de `SECTIONS`. **Mon rejet visait « Aller à Indices »** — un verbe plus un nom de section en dur. **L'UX n'a jamais proposé ça ; elle l'interdit dans sa propre note.**

Mieux : le trailing est **l'invariant du projet appliqué**, pas enfreint. « Références par identifiant stable, jamais par nom » — la ligne porte un `SectionId`, affiche un libellé **dérivé du registre au rendu**, ne détient aucune table locale. Motif exact de `PanneauSection.tsx`, déjà en production. **J'aurais opposé un veto à une table de libellés locale ; il n'y en a pas.**

**R10 → RETIRÉ**, remplacé par **R10-bis**, neuf et plus étroit, co-signé par l'UX.

## 2. Au PM — ton objection est fondée, et MON chiffrage était faux aussi

« ~7 lignes » ne couvre pas une exigence non négociable — exact. **Et mon « ~12 lignes » était faux pour la même raison** : j'ai chiffré la tuyauterie du render-prop (~8 lignes réelles) et **ignoré ce que le `<button>` traîne derrière lui**. L'écart entre 7 et 36 n'est pas un dérapage de périmètre, c'est **un poste mécanique jamais compté**.

## 3. À la QA — je RETIRE mon propre instrument, il était faux

J'avais proposé l'ancre `button > span:last-child > span` pour remplacer le comptage de `<p>`. **Je la retire : elle est fausse dès que le trailing est accepté** — `span:last-child` désigne alors **le trailing**, pas la colonne. *C'est exactement la classe de défaut que la skill nomme (une affirmation d'instrument non mesurée) ; je la corrige avant qu'elle n'entre au plan.*

**Instrument retenu : `data-etage="ou" | "quoi" | "quoi-faire"`** sur les trois `<span>`. Ancre `ligne.querySelectorAll('[data-etage]')` → 3, chacun non vide. **Convention déjà arbitrée dans ce dépôt** (`data-etat`, `dossier-canon` it1 : « un sélecteur stable par état […] décision de testabilité »). Coût : 3 attributs, 0 ligne neuve, et **l'ancre survit à un ré-agencement de la ligne** — ce que la mienne ne faisait pas.

## 4. Un piège de test que personne n'a nommé

Si l'UX retient `textTransform: 'uppercase'`, **le DOM contient toujours `→ Personnages` en casse phrase** : `textTransform` est une propriété de **rendu**, jsdom ne l'applique pas au `textContent`. **Tout `getByText` du trailing s'écrit en casse source, jamais en majuscules.** À écrire au plan — c'est une ligne, et son oubli coûte un rouge incompréhensible.

## 5. Le découpage — un argument NEUF et TEXTUEL qui ferme le débat

`specification.json` : la permission même de toucher `DossierEditorScreen.tsx` est **conditionnée** — « modifier un fichier possédé par une AUTRE feature est admis quand le diff n'ajoute AUCUNE logique métier **et qu'il tient dans un lot unique possédant ce fichier en exclusivité pour l'itération** ».

> **Découper en deux lots ANNULERAIT la décision qui autorise l'itération.** Ce n'est plus « `tsc` échouerait isolément » : c'est un arbitrage écrit.

Et le déclencheur d'escalade : it1/it2 touchaient **deux** fichiers de production de `bascule-editeur` ; **it4 en touche UN SEUL**, et n'ajoute aucune logique. **Déclencheur non atteint, et le diff RECULE au lieu d'avancer.**

## PARTIE 2 — Statut des onze rejets

| # | Objet | Statut |
|---|---|---|
| R1 | Contexte `brain/` de navigation | **MAINTENU** |
| R2 | Union `ReactNode \| ((…) => ReactNode)` | **MAINTENU** |
| R3 | Rappel optionnel | **MAINTENU** — *précision : c'est `onSelectSection` qui est REQUIS ; `panneauControles` reste optionnelle* |
| R4 | Dériver la destination d'un texte d'affichage | **DURCI EN VETO**, motif NEUF : le trailing crée la **tentation inverse**. Sens unique : `SectionId → titre`, **jamais** `titre → SectionId`, et aucun parsing de `controleRemediation()` |
| R5 | `sectionRemede` sur `Controle` | **MAINTENU** |
| R6 | Table `ControleId → SectionId` | **MAINTENU, portée ÉTENDUE** — couvre aussi toute table locale `SectionId → libellé` |
| R7 | Rapport affiché à côté de la section | **MAINTENU** |
| R8 | Défilement / focus sur la ligne de nav | **MAINTENU** — signalé, non mandaté |
| R9 | Primitive partagée vers `brain/components/` | **MAINTENU** |
| **R10** | Libellé nommant la section de destination | **RETIRÉ** — motif faux **et** seconde branche hors sujet |
| **R10-bis** | *(NEUF)* Un **verbe** dans l'affordance, ou un nom de section **en dur** / en table locale | **REJETÉ** — co-signé UX |
| R11 | Marquer le lot `contrat` par précaution | **MAINTENU** — **zéro fichier de `src/brain/**`** au lot, vérifié fichier par fichier |

## Les désaccords, tranchés

**B-1 — trailing RETENU.** R10 retiré, R10-bis posé.

**B-2 — je REFUSE le module CSS.** (a) Le choix réel est « module CSS ou rien » — les pseudo-classes n'existent pas en `CSSProperties`, et un `isHovered` est déjà interdit par le WORKFLOW. (b) La doctrine est **écrite**, pas déduite : `ListRow.tsx` l. 93-94. (c) Un `:hover` n'est vérifiable par **aucun instrument existant** — la skill interdit un critère sans instrument. → **inv. 2 de l'UX l'emporte, `cursor: pointer` seul. Aucun fichier CSS n'entre : le lot reste à SIX fichiers.** *Objection motivée, pas un veto — le survol n'est pas mon domaine de blocage.*

**B-3 — à l'UX.** Deux conséquences techniques seulement : `--text-faint` + mono est exactement la paire de `ListRow.subtitleLine` ; et `textTransform` impose la règle de test du § 4.

**B-4 — signature DÉFINITIVE, je tranche CONTRE ma propre invocation 1 sur les deux points.**

*Le nom* : **`onSelectSection`** des deux côtés — convention du dépôt (`ListRow.onSelect`, `SectionNav.onSelect`), trois voix sur quatre, et **le verbe que la spec emploie elle-même** (« les itérations de n° 7 s'arrêtent à **SÉLECTIONNER** la section »). `onAllerALaSection` était un verbe français unique dans le dépôt : abandonné.

*La forme* : **fonction nue, pas d'objet `api`, pas d'interface `PanneauControlesApi`.** *J'applique contre moi mon propre biais : un objet à UN membre pour UN appelant est l'abstraction prématurée que je police ailleurs.* L'argument « deux agents ont besoin d'un contrat recopiable » **est mort avec le découpage** : un lot, un agent.

```ts
// DossierEditorScreen.tsx — le paramètre prend SectionId, JAMAIS DestinationNav :
// le panneau ne peut pas exprimer 'controles', donc ne peut pas fabriquer l'état
// illégal de BUG-082 — invariant tenu par le TYPE, pas par une consigne.
panneauControles?: (onSelectSection: (section: SectionId) => void) => ReactNode

// site d'appel
{destination === DESTINATION_CONTROLES
	? panneauControles?.((section) => setDestination(section))
	: (panneaux?.[destination] ?? <PanneauSection sectionId={destination} />)}

// PanneauControles.tsx — REQUIS, type DÉCLARÉ ICI, jamais importé de bascule-editeur
onSelectSection: (section: SectionId) => void

// ListeControles.tsx — REQUIS
onSelectSection: (section: SectionId) => void

// App.tsx — AVANT `panneaux`, ne rien insérer entre `panneaux={{` et `canon:`
panneauControles={(onSelectSection) => (
	<PanneauControles dossierId={route.dossierId} onSelectSection={onSelectSection} />
)}
```

**B-5 — je CÈDE à l'UX, et le motif est à moi.** J'exigeais que la liste émette le `Controle` entier. **Cet argument meurt à l'instant où le trailing est accepté** : la liste doit lire `controle.section` pour afficher la destination. Avec `onControleActive(controle)`, la politique serait exprimée **deux fois dans deux fichiers** — le libellé ici, l'aiguillage là — c'est-à-dire **exactement la seconde vérité que je rejette en R6**, et rien n'empêcherait un libellé de mentir sur sa propre destination. Avec `onSelectSection(section)`, **la même expression alimente l'affichage et l'action** : la réserve de l'UX devient vraie **par construction, pas par un test**.

> **Exigence structurelle au plan** : `const section = controle.section` **une seule fois par ligne**, consommée par le `onClick` **et** par la recherche du titre. Deux lectures séparées rouvriraient la dérive.

**B-6 — chiffrage définitif : ~36 lignes** (dont ~23 de simples constantes de style dans `ListeControles.tsx`), 4 fichiers de production, **5 tests neufs, 4 réécrits**, ligne de base **35 → 40**.

**B-7 — « la section où le constat a été produit », et la clause négative DOIT sauter** : « jamais à la section du remède » est fausse dans 9 cas sur 10 — ce serait **une phrase de doctrine fausse déposée dans `iterations[4].goal`**.

**B-8 — soutenu sans réserve.**

## Le découpage définitif

**UN SEUL LOT, aucun `contrat`, six fichiers, tous (R) — l'itération ne crée aucun fichier.**
`DossierEditorScreen.tsx` · `PanneauControles.tsx` · `ListeControles.tsx` · `App.tsx` · `panneauControles.test.tsx` · `dossierEditorScreen.test.tsx`.

**HORS lot, nommément** : `src/brain/**` (aucun octet) · `SectionNav.tsx` · `ListRow.tsx` · `Badge.tsx` · les deux barils · `sectionNav.test.tsx` · `createDossierFlow.test.tsx` · **tout module CSS**.

**Ordre d'écriture imposé** (il remplace le lot `contrat`) : signature de `DossierEditorScreen.tsx` → `PanneauControles.tsx` puis `ListeControles.tsx` → `App.tsx` (rendez-vous structurel) → les deux tests. **`tsc --noEmit` est le juge.**

**Porte : `tsc` D'ABORD et sans exception** — la mesure le prouve, `jest` reste vert à 35/35 sur un type mésapparié pendant que `tsc` rougit sur 3 fichiers.

**VERDICT — recevable, sans veto.** Quatre exigences de plan : un lot / six fichiers / zéro `contrat` · les quatre assertions renversées **nommément** · le libellé **dérivé** de `SECTIONS`, sans verbe ni table locale · `const section = controle.section` **une seule fois par ligne**.
