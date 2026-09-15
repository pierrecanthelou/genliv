# Tour 2 — `tech-lead`

**VERDICT** : recevable sous réserve (trois vetos ; D1 composé, D3 retiré, D4 tranché hors des deux options proposées).

**RETRAIT — objection 2 (D3), et c'était mon erreur.** « Inlivrable » était faux : le onzième emplacement n'existe pas encore, j'en écris le type **dans cette itération**. J'ai appliqué la forme des dix (`ReactNode` figé) à une prop neuve. Chiffrage : `panneauControles?: (api) => ReactNode` coûte **zéro fichier de plus**, ~7 lignes, +2 tests. Livrable. **Mais je scinde la demande de l'UX** : la navigation oui ; « le focus suit sur la ligne de nav » non — elle exige un `ref` sur `ListRow`, primitive `brain/` à un seul appelant, refus déjà écrit dans son propre JSDoc (l. 26-32, précédent `onReorder`, KR-109). **Second retrait** : `avecControles` disparaît comme prop, la garde est la présence du render-prop.

**MAINTIEN** — objection 1 recomposée ; objection 3 (deux lots, `App.tsx` importe `PanneauControles`, `tsc` interdit une troisième vague) intacte.

**VETOS** — (V1) `parSection` en `Partial` ; (V2) tout lot touchant `IssueList.tsx` ; (V3, neuf) tout `ref` ou prop ajouté à `ListRow`.

## Réponses nommées

**D1 — au narratif : je prends tes deux entrées, tu me laisses les deux champs.** Les formes ne portent pas sur le même objet. Ce qui tranche n'est ni it1 ni it3 mais **it4** : « référence orpheline » est UNE cause qui atteint quêtes, événements, lieux, objets — une `section` typée sur le descripteur la transformerait en cinq entrées pour une cause, KR-164 violé en sens inverse. Les cinq règles d'it3 sont mono-section **par fait, jamais par type** : elles ne départagent rien. KR-219 reste tenu — la règle déclare sa section dans son `controler()`, le lecteur ne la dérive jamais de `path`.

**D2 — à la QA : il n'y a pas de convention à tenir.** `amorce.test.ts` teste le **semeur**, qui maîtrise la tête de sa chaîne ; `controles.ts` lit le texte **édité par l'auteur**, qui ne la maîtrise pas. Même mot, deux sujets : un producteur, un consommateur. `startsWith` éteint le voyant sur « Le marquis entre. ⟨marqueur⟩ ». **`includes`**, écrit au JSDoc.

**D4 — ni l'un ni l'autre : un second `<nav aria-label="Contrôles">`**, frère, après le premier dans l'ordre du DOM. L'UX obtient sa 11ᵉ position par Tab (l'ordre de tabulation suit le DOM, pas le landmark) ; la QA garde la l. 186 verte sans modification. Et l'argument n'est pas le test : le landmark s'appelle *Sections du dossier*, « Contrôles » n'est pas une section — l'y loger ferait mentir le nom accessible. Empilement par un `<div>` colonne dans `DossierEditorScreen` ; `SectionNav.tsx` cède au wrapper `width`/`borderRight`/`overflowY`/`padding` et rien d'autre.

**D5 — confirmé et élargi.** La garde n° 1 balaie **tout `src/`** et attend exactement `['brain/dossier/amorce.ts']`. Donc aucun fichier de la feature **ni son test** ne peut écrire le glyphe. Conséquence de conception : `ListeControles` reçoit `controles: readonly Controle[]` et son test **fabrique** des contrôles à messages neutres ; seul `PanneauControles` lit le dossier réel. Le glyphe **rendu à l'exécution** est licite, le glyphe **écrit en source** ne l'est pas.

## Signature figée, révisée

```
NiveauControle = 'bloquant' | 'alerte' | 'info'
ConstatControle { niveau; section: SectionId; message; location; path; entityId? }
Controle extends ConstatControle { id: ControleId }
ControleDescripteur { libelle; controler(dossier): ConstatControle[]; remediation(constat): string }
CONTROLES = defineRegistre<ControleDescripteur>()({ … })
ControleId = keyof typeof CONTROLES
RapportControles { controles: readonly Controle[]; jouable: boolean; parSection: Record<SectionId, NiveauControle | null> }
controlerDossier(dossier): RapportControles
controleRemediation(controle): string
```

Sortent au baril : `NiveauControle`, `Controle`, `ControleId`, `RapportControles`, `controlerDossier`, `controleRemediation`. Restent privés : `CONTROLES`, `ControleDescripteur`, `ConstatControle`, la table de gravité, la table `Record<keyof typeof AMORCE, …>`. **Aucune des trois chaînes gardées n'apparaît dans `brain/index.ts`, pas même en commentaire.**

## Découpage — 2 lots séquentiels

| LOT | TYPE | FICHIERS |
|---|---|---|
| **L1** | **contrat**, seul et en premier | (N) `src/brain/dossier/controles.ts` · (N) `controles.test.ts` · (R) `src/brain/index.ts` |
| **L2** | feature + adoption | (N) `src/features/dossier-controles/index.ts` · (N) `components/PanneauControles.tsx` · (N) `components/ListeControles.tsx` · (N) `tests/panneauControles.test.tsx` · (R) `src/features/bascule-editeur/components/DossierEditorScreen.tsx` · (R) `SectionNav.tsx` · (R) `tests/dossierEditorScreen.test.tsx` · (R) `src/App.tsx` |

`IssueList.tsx`, `PanneauSection.tsx`, `ListRow.tsx`, `sections.ts`, `destinations.ts`, `types.ts`, `validate.ts` : nommés par aucun lot.
