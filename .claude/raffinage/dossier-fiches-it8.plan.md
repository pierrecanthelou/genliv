# Plan d'itération — `dossier-fiches` · itération 8

> Statut : `validé` (2026-08-16)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-16
> Composition : 5 rôles — motif : l'itération pose `caractere.curseurs`/`parler`/`jamais`/`cede_si`, tous destination `ia`/`moteur`, avec un champ (`cede_si`) dont l'injection dépend du RÔLE qui demande (précédent `Relation.secret`) — frontière code/IA à garder.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut régler le caractère de son personnage — 6 curseurs de comportement, jusqu'à 2 répliques types, une limite absolue, une condition de reddition — persisté, relu, non encore interprété par un moteur (n° 10). » |
| **Tranche** | `BlocCaractere.tsx` (nouveau, 8e et dernier bloc de l'accordéon) → `useEcritureCaractere.ts` → `DossierService.update()` → `Personnage.caractere` (`brain/dossier/types.ts` + nouveau `brain/dossier/curseurs.ts`) |
| **Lots** | 2 lots · dont `contrat` : oui (lot A, seul, en premier) |
| **Hors périmètre** | libellé dérivé d'un curseur (« très méfiant »/n° 10) ; tout câblage vers un assembleur ou un prompt (n° 10/12) ; réouverture de `tier` (n° 13), `quete_id` (n° 6), `indices[].verite` (n° 6) ; extraction de `FichePersonnage.tsx` au-delà de ce lot |
| **Reporté** | rien de nouveau — l'`open_question` « libellés dérivés » (curseurs/caractéristiques/intensité) reste ouverte, propriété n° 10, non réélargie une 3e fois (discipline de budget de contexte, cf. § 8) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut régler le caractère de son personnage — 6 curseurs (méfiance, franchise, courage, cupidité, loyauté, verve), jusqu'à deux répliques types, une limite qu'il ne franchira jamais, une condition qui le fait céder — persisté, relu par l'écran, sans qu'aucun moteur ne l'interprète encore (n° 10). C'est la 8e et dernière itération de `dossier-fiches` : après elle, l'accordéon de la fiche personnage ne porte plus aucun placeholder « Pas encore renseigné ».

## 2 — Hors périmètre

- Le libellé dérivé d'une valeur numérique (curseur, caractéristique, intensité de relation) pour un narrateur (« très méfiant » à 7-8) — propriété de la n° 10 `moteur-interprete`, `open_question` déjà élargie deux fois (it3, it5), non réélargie ici.
- Tout contrat de sortie IA, tout assembleur de contexte, tout prompt — aucun n'existe avant la n° 10/12.
- La réouverture de `Personnage.stats.tier` (n° 13), du rattachement `quete_id` (n° 6) ou de `indices[].verite` (n° 6).
- L'extraction de `FichePersonnage.tsx` au-delà de ce qu'exige le câblage du 8e bloc (dette KR-112 notée, non résorbée — voir § 8).
- Toute règle de cardinalité sur `caractere.parler` dans `validate.ts` — la borne `PARLER_REPLIQUES` est une contrainte d'INTERFACE, jamais un chemin de refus SSOT.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Structure** — le 8e emplacement de l'accordéon (« Caractère exploitable », remplace le placeholder `BLOC_CARACTERE_EXPLOITABLE`), 3 sous-sections fixes séparées par `separateurStyle` :

**1. CURSEURS DE CARACTÈRE** (gating optionnel-en-bloc/TOTAL-quand-présent — précédent exact `BlocCaracteristiques.tsx`)
- Eyebrow (`eyebrowStyle`) : `CURSEURS DE CARACTÈRE`
- `caractere.curseurs === undefined` → un seul bouton `boutonPointilleStyle`, texte **`+ Régler le caractère…`**, qui sème les 6 clés à `CURSEUR_MIN` en un commit. Ce geste n'écrit QUE `curseurs` — jamais `parler`/`jamais`/`cede_si`.
- Focus après clic : déplacement impératif vers le premier `<button>` sous la grille (« Diminuer {premier label} »), précédent exact `BlocCaracteristiques` (`useRef` booléen + `useEffect`, section déjà remontée par `key={personnage.id}`).
- `caractere.curseurs` présent → légende (`legendeStyle`), texte exact :
  **`Curseurs de caractère — jamais lus par le narrateur ; l'affinité entre parenthèses colore la voix, elle ne modifie aucun jet.`**
  puis grille 2 colonnes (`grilleStyle`) de 6 `Stepper` (bornes `CURSEUR_MIN=0`/`CURSEUR_MAX=10`, **jamais** de `prefix` signé — contrairement à `intensite`). Ordre : celui de `CURSEUR_VALUES` (= `Object.keys(CURSEURS)`), **jamais** regroupé par affinité (proposition retirée en tour 2). Label de chaque Stepper : `${CURSEURS[id].label.toUpperCase()} (${CURSEURS[id].affinite})` — ex. `COURAGE (CA)`, `MÉFIANCE (IN)`, `VERVE (IG)`.

**2. MANIÈRE DE PARLER** (toujours visible, aucun gating — précédent lignes répétées `BlocPlanActions`/`BlocRelations`)
- Eyebrow : `MANIÈRE DE PARLER`
- Légende : `Jusqu'à deux répliques type — donnent le ton, jamais citées mot pour mot par le modèle.`
- Lignes répétées (`listeLignesStyle`/`ligneStyle`/`enTeteLigneStyle`) : eyebrow `RÉPLIQUE {n}` + `IconButton` `tone="danger"` label `Retirer la réplique n°{n}` glyphe `✕` + un `Field` simple (non multiline) — label `RÉPLIQUE`, hint `interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur`, placeholder `« Ne traînez pas dehors après la cloche — la garde ne pose pas de questions. »`.
- Sous la liste : `parler.length < PARLER_REPLIQUES` → bouton `boutonPointilleStyle` texte **`+ Ajouter une réplique…`**, focus après clic sur le nouveau `Field`. `parler.length === PARLER_REPLIQUES` → **le bouton disparaît** (jamais `disabled`), remplacé par `legendeStyle` : `Deux répliques, pas plus — de quoi calibrer une voix sans la scripter davantage.` Un document portant davantage (import) se rend intégralement — la borne n'écarte jamais une donnée déjà écrite.

**3. LIGNES ROUGES** (toujours visible, 2 champs — précédent `BlocIdentite`)
- Eyebrow : `LIGNES ROUGES`
- `Field` 1 — label `CE QU'IL NE FERA JAMAIS`, hint identique, multiline rows=2, placeholder `Il ne trahira jamais un secret confié sous serment, même sous la torture.`
- `Field` 2 — label `CE QUI LE FAIT CÉDER`, même hint, multiline rows=2, placeholder `Face à une preuve que son fils est vivant, il cède immédiatement — le reste, jamais.`
- Brouillon local, commit au blur, champ vidé retire sa clé (précédent `useEcritureIdentite`).

**Clavier** — Tab traverse : grille curseurs (ordre DOM = ordre d'affichage) → répliques (champ puis son retrait) → jamais/cède si. Aucune modale. Retrait d'une réplique sans confirmation (édition réversible, pas une action dangereuse au sens CLAUDE.md).

**Composants** — zéro composant maison : `Stepper` (sans `prefix`), `Field`, `IconButton`, styles partagés `styles.ts` (déjà 3 consommateurs).

*(Écrit par l'UX.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Personnage.caractere` | type | émet | `caractere?: Caractere` sur `Personnage` ; `interface Caractere { curseurs?: Record<CurseurId, number>; parler?: string[]; jamais?: string; cede_si?: string }` — tous champs additifs, optionnels |
| `brain/dossier/curseurs.ts` (nouveau) | registre | émet | `CURSEURS: Record<CurseurId, { label: string; describe: string; affinite: AffiniteCurseur }>` (6 entrées fermées) ; `CURSEUR_VALUES`, `CURSEUR_MIN=0`, `CURSEUR_MAX=10`, `PARLER_REPLIQUES=2`, `CURSEURS_INITIAUX: Record<CurseurId, number>` (valeur d'écriture, jamais un repli de lecture — précédent `STATS_INITIALES`). `AffiniteCurseur = 'CA' \| 'IN' \| 'IG'` en UNION LOCALE — **zéro import** vers `characteristics.ts`/`challenge.ts`/`combat.ts`/`xp.ts` (KR-193, clause vérifiable par test-grep) |
| `DossierService.update(id, recette): EcritureDossier` | service | consomme | réutilisé sans changement de signature |
| `dossier:updated` | événement | émet | `{ dossierId: string }` |

Pas de § 4 bis — aucun contrat de sortie IA n'entre en it8 (aucun assembleur avant la n° 10/12, confirmé narratif-ia tour 2).

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot A — `contrat-caractere` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser `Caractere`/`Personnage.caractere`, le registre `curseurs.ts`, les lignes de table et d'audience, les deux fixtures, et re-viser la sonde de couverture qui devient obsolète.
- **Fichiers** :
  - (N) `src/brain/dossier/curseurs.ts`
  - (N) `src/brain/dossier/curseurs.test.ts`
  - (R) `src/brain/dossier/types.ts`
  - (R) `src/brain/dossier/tables.ts`
  - (R) `src/brain/dossier/destinations.ts`
  - (R) `src/brain/dossier/__fixtures__/dossier-minimal.json`
  - (R) `src/brain/dossier/__fixtures__/dossier-reference.json`
  - (R) `src/brain/dossier/couverture.test.ts`
  - (R) `src/brain/dossier/validate.test.ts`
  - (R) `src/brain/index.ts`
- **Expose** : voir § 4 — `Caractere`, `CurseurId`, `AffiniteCurseur`, `CURSEURS`, `CURSEUR_VALUES`, `CURSEUR_MIN`, `CURSEUR_MAX`, `PARLER_REPLIQUES`, `CURSEURS_INITIAUX`, tous re-exportés par `brain/index.ts`.
- **Consomme** : rien de neuf.
- **Points de contrat impératifs** (non négociables, tranchés au raffinage) :
  - `affinite` : union locale `'CA' | 'IN' | 'IG'`, **jamais** `Characteristic` importé — veto tech-lead, confirmé narratif-ia. `affinite` n'entre dans `curseurs.ts` **qu'avec** son site de rendu côté lot B (label Stepper) ; sans lot B livré dans la même itération, le champ tombe.
  - 6 lignes `ENUMERES_FERMES` (`requis: true`) **dérivées** de `CURSEUR_VALUES`, sur le modèle exact de `stats` (jurisprudence it3) — bloc `curseurs` optionnel EN BLOC, TOTAL quand présent.
  - **Zéro ligne** dans `LISTES_OPTIONNELLES_STRUCTUREES` pour `parler[]` : ses éléments sont des chaînes, pas des objets (précédent `canon.interdits_ton[]`, sans règle d'élément). `PARLER_REPLIQUES` reste une borne d'INTERFACE, **aucune ligne dans `validate.ts`**.
  - `destinations.ts` : 6 lignes `moteur` pour `caractere.curseurs.*` (dérivées au site, comme `DESTINATION_DES_CARACTERISTIQUES` — aucun mécanisme partagé, KR-193 le documente), + 3 lignes `ia` pour `caractere.parler[]`/`caractere.jamais`/`caractere.cede_si`. **Aucune ligne porteuse** `…caractere`/`…caractere.curseurs` (objet non vide ≠ feuille).
  - Prédicat de `cede_si`, écrit **mot pour mot** aux DEUX sites (JSDoc `Caractere.cede_si` dans `types.ts` + commentaire de sa ligne dans `destinations.ts`), nulle part ailleurs :
    > `cede_si` n'entre **que** dans le contexte de l'appel **acteur du personnage QUI LE PORTE**. Il n'entre **jamais** dans le contexte du **narrateur**, ni dans celui d'un **autre** personnage, ni dans celui de l'**arbitre**. Aucun fait de session ne le conditionne : dans cet appel-là il est injecté **dès le premier tour**, sans que le moteur ait rien à constater — il n'a ni jumeau `…_expr`, ni ligne dans `FAMILLES_DE_CONDITIONS`, et rien à quoi `validateDossier` puisse l'adosser.
  - JSDoc de `Caractere.parler`, en plus du rappel « échantillon de VOIX, jamais une réplique à réciter » :
    > Au plus `PARLER_REPLIQUES` répliques — borne d'interface, non validée. Un document qui en porte davantage se rend en entier ; c'est l'assembleur n° 10 qui tronque à l'injection, il n'échoue pas.
  - `couverture.test.ts` (~l. 486) : la sonde discriminante ciblait `monde.personnages[].caractere`, qu'it8 instancie — **dernière** tranche de schéma de la feature, aucune cible interne où la déplacer. Elle se **rebase en négatif de forme de chemin**, sur le modèle de la sonde déjà en place l. 492 (`…personnages[].plan` vs `plan_actions`), avec un commentaire actant qu'elle cesse de se déplacer. La supprimer est exclu (KR-199 sur l'instrument lui-même).
  - Les deux fixtures portent le bloc `caractere` complet (curseurs + parler + jamais + cede_si) — sans instance, les 3 lignes `ia` seraient des lignes mortes et `couverture.test.ts` rougirait.
- **Critères couverts** : #2, #6, #8.

### Lot B — `bloc-caractere`
- **Ouvrier** : `dev-lot`
- **But** : câbler le 8e et dernier bloc de l'accordéon — `BlocCaractere.tsx`, son hook d'écriture, et la disparition du placeholder.
- **Fichiers** :
  - (N) `src/features/dossier-fiches/components/BlocCaractere.tsx`
  - (N) `src/features/dossier-fiches/hooks/useEcritureCaractere.ts`
  - (N) `src/features/dossier-fiches/tests/caractere.test.tsx`
  - (R) `src/features/dossier-fiches/components/FichePersonnage.tsx`
  - (R) `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts`
  - (R) `src/features/dossier-fiches/components/PanneauPersonnages.tsx` *(gap nommé d'avance : précédent it5, câblage du site d'appel unique de `FichePersonnage.tsx` — pas un dépassement de lot)*
  - (R) `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx`
- **Consomme** : § 4, le lot A figé.
- **Points impératifs** :
  - `FichePersonnage.tsx` reçoit **une** prop groupée `caractere: UseEcritureCaractereResult` (précédent `relationsPresence`/`savoirs`), jamais les champs à plat — cible mesurée : rester ≤ 412 lignes (aucune extraction dans ce lot, dette KR-112 notée sans être résorbée, cette itération étant la dernière de la feature).
  - Le placeholder `BLOC_CARACTERE_EXPLOITABLE`/`sectionPlaceholder(...)` disparaît de `sections` ; le 8e emplacement rend `<BlocCaractere ... />`.
  - `handleAjouterReplique` masqué (bouton absent du DOM, jamais `disabled`) dès `parler.length >= PARLER_REPLIQUES`.
- **Critères couverts** : #1, #3, #4, #5, #7, #8.

*(2 lots, exécution séquentielle — pas d'essaim : B dépend entièrement des exports figés par A.)*

## 6 — Critères d'acceptation

1. **Étant donné** un personnage sans bloc `caractere`, **quand** l'auteur clique « + Régler le caractère… », **alors** les 6 curseurs sont écrits à `CURSEUR_MIN` en un seul commit (`DossierService.update`), et SEULS eux — `parler`/`jamais`/`cede_si` restent absents. — *composant* — *lot B*
2. **Étant donné** le bloc curseurs présent, **quand** l'auteur règle un des 6 curseurs (`Stepper` 0-10), **alors** la valeur est persistée telle quelle, sans `prefix` signé, balayée depuis `CURSEUR_VALUES` (jamais 6 littéraux). — *contrat + composant* — *lots A, B*
3. **Étant donné** `caractere.parler` à moins de `PARLER_REPLIQUES`, **quand** l'auteur clique « + Ajouter une réplique… », **alors** une réplique est ajoutée et le focus se déplace sur son champ ; **étant donné** exactement `PARLER_REPLIQUES` répliques, **alors** le bouton d'ajout est absent du DOM (jamais `disabled`) ; **étant donné** un document importé portant `PARLER_REPLIQUES + 1` répliques, **alors** les trois sont rendues et `validateDossier` reste vert (KR-165, limite et limite+1). — *composant + contrat* — *lots B, A*
4. **Étant donné** les champs `jamais`/`cede_si` vides, **quand** l'auteur les édite puis perd le focus, **alors** la valeur est committée, ou la clé retirée si le champ est vidé. — *composant* — *lot B*
5. **Étant donné** un dossier importé portant déjà `curseurs`/`parler`/`jamais`/`cede_si`, **quand** la fiche se monte SANS interaction, sur deux personnages distincts (le second atteint par un clic de ligne), **alors** chaque champ rendu affiche la valeur du document — valeurs que le composant ne peut pas fabriquer sans le lire (BUG-064/KR-199). — *composant* — *lot B*
6. **Étant donné** le dossier de référence (6 personnages), **quand** chaque lot de cette itération est livré, **alors** les 6 personnages restent acceptés par `validateDossier` sans régression de leurs champs hors de ce lot. — *contrat* — *lot A*
7. **Étant donné** l'accordéon après it8, **quand** il se rend pour chacun des 6 personnages du dossier de référence, **alors** aucun bloc n'affiche plus le placeholder de bloc-non-livré « Pas encore renseigné » — les champs optionnels légitimement vides (camp, `stats`, `but`…) restent exclus de ce critère, ils affichent leur propre CTA. — *composant, test-grep* — *lot B*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur : zéro import de `curseurs.ts` vers `characteristics`/`challenge`/`combat`/`xp` (KR-193), aucun import croisé `dossier-fiches` ↔ `bascule-editeur` (KR-184), aucune couleur en dur. — *lint* — *lots A, B*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `curseurs.test.ts` — « les 6 clés de `CURSEURS`/`CURSEUR_VALUES` exhaustivement définies » | dérivé de `Object.keys`, jamais 6 littéraux | jest | KR-117, KR-193 | A |
| `curseurs.test.ts` — « les 3 littéraux `affinite` sont des clés valides de `CHARACTERISTICS` » | `Object.entries(CURSEURS)` épinglé | jest | KR-117 | A |
| `curseurs.test.ts` — « `curseurs.ts` n'importe rien de `characteristics`/`challenge`/`combat`/`xp` » | test-grep sur les imports du fichier | jest (grep) | KR-193 | A |
| `couverture.test.ts` — sonde ex-l. 486 retargetée | rouge avant le retarget, verte après, commentaire actant l'arrêt | jest | KR-199 | A |
| `couverture.test.ts` / `validate.test.ts` — non-régression dossier de référence (6 personnages) | `ok: true`, zéro anomalie neuve | jest | KR-190 (crit. #8 racine) | A |
| `caractere.test.tsx` — « bloc absent : seule la CTA, aucune écriture au montage » | spy posé AVANT le montage (discipline KR-199/BUG-068a) | jest | KR-199 | B |
| `caractere.test.tsx` — « + Régler le caractère… sème les 6 clés, seules » | `stats`/`but`/`parler` non touchés | jest | — | B |
| `caractere.test.tsx` — « length 1 : CTA d'ajout de réplique visible, focus sur le nouveau champ » | focus DOM | jest | — | B |
| `caractere.test.tsx` — « length `PARLER_REPLIQUES` : CTA absente, légende de remplacement affichée » | absence DOM, jamais `disabled` | jest | KR-165 | B |
| `caractere.test.tsx` — « document important porteur de `PARLER_REPLIQUES + 1` répliques : toutes rendues, aucun refus » | fixture forcée, `validateDossier` vert | jest + contrat | KR-165, BUG-074 | A, B |
| `caractere.test.tsx` — « lecture au montage sur deux personnages distincts, aucune valeur ne fuit de l'un à l'autre » | valeurs non fabricables par le widget | jest | KR-199, BUG-064 | B |
| `panneauPersonnages.test.tsx` ou `caractere.test.tsx` — « après it8, aucun des 6 personnages du dossier de référence n'affiche "Pas encore renseigné" » | test-grep sur le rendu de l'accordéon | jest | KR-187 | B |
| `lintIsolation.test.ts` | vert sans modification | jest (lint) | KR-184 | A, B |

Cas limites couverts : bloc absent (état vide) · bloc TOTAL (6/6) · liste `parler` à 0/1/`PARLER_REPLIQUES`/`PARLER_REPLIQUES+1` (import) · deux personnages distincts (lecture) · référence croisée avec les blocs déjà livrés (non-régression du dossier de référence).

**Non vérifiable en l'état** *(à recopier dans la revue)* :
- L'identité mot pour mot du JSDoc `Caractere.cede_si` et du commentaire de sa ligne dans `destinations.ts` — les commentaires ne sont pas accessibles à l'exécution ; vérifiée en **revue de PR** (checklist), pas par jest. Par cohérence, la même vérification vaut pour les 2 autres champs à gating par rôle déjà écrits à deux sites (`secret`, `revele_comment`).
- Le gating par RÔLE de `cede_si` (injecté à l'acteur du porteur seul, exclu du narrateur/autres PNJ/arbitre) — aucun instrument avant l'assembleur n° 10 ; seule la moitié DONNÉE (champ persisté/relu, ligne `ia` de `destinations.ts`) est vérifiée aujourd'hui.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Le goal brut (« le bloc qui décide de tout ») surpromet un effet moteur immédiat | `RETENU` | Phrase de démo reformulée (§ Fiche de validation, § 1) — aucun assembleur n'existe avant la n° 10 |
| 2 | Tech Lead | `affinite` typé `Characteristic` casserait la clause « zéro import » de KR-193 | `RETENU` (veto satisfait) | Union locale `AffiniteCurseur = 'CA'\|'IN'\|'IG'` — aucun import vers `characteristics`/`challenge`/`combat`/`xp` (lot A) |
| 3 | Tech Lead | `PARLER_REPLIQUES` écrit comme une borne validée par `validate.ts`, alors qu'aucun mécanisme de cardinalité n'existe | `RETENU` | Borne d'INTERFACE (UI-only) — convergence indépendante tech-lead/UX/QA au tour 2, zéro ligne de table |
| 4 | Narratif & IA | `cede_si` n'est ni un `ia` nu ni conditionné à un fait de session (comme `si_bloque`) | `RETENU` | Conditionné au RÔLE (précédent `Relation.secret`) — prédicat écrit à 2 sites, aucune ligne `FAMILLES_DE_CONDITIONS` |
| 5 | Narratif & IA | `affinite` sans consommateur en it8 — risque de « forme sans producteur » (décision A, précédent `tier`) | `RETENU` (levé) | `affinite` ne franchit jamais le document (registre de code, zéro clé de schéma) ET reçoit son site de rendu dans le lot B du même geste — condition : sans ce rendu, le champ tombe |
| 6 | UX | Regrouper visuellement les 6 curseurs par affinité (CA/CA/IN/IN/IG/IG) plutôt que l'ordre du registre | `REJETÉ` (retiré par son autrice) | L'ordre `CURSEUR_VALUES` évite un piège de tabulation (ordre DOM ≠ ordre visuel) — aucune règle du design system n'exige un regroupement |
| 7 | QA | Le mécanisme de refus de la 3e réplique n'était pas tranché au cadrage — critère « limite/limite+1 » impossible à écrire | `RETENU` | UI-only (voir #3) — triplet de tests 1/`PARLER_REPLIQUES`/`PARLER_REPLIQUES+1` (§ 7) |
| 8 | Tech Lead / QA | La sonde discriminante de `couverture.test.ts` (~l. 486) va rougir : it8 est la dernière tranche de schéma, aucune cible interne où la déplacer | `RETENU` | Rebasée en négatif de forme de chemin (précédent l. 492), critère de lot nommé (§ 5 lot A, § 7) |
| 9 | QA | Le gating par rôle de `cede_si` est-il testable aujourd'hui ? | `RETENU` (scindé) | Moitié donnée testable (jest, lot B) ; moitié rôle hors-instrument avant n° 10 (revue de PR, § 7 « non vérifiable ») |
| 10 | PM | Faut-il un critère de clôture (accordéon sans placeholder après it8) ? | `RETENU` | Critère #7, borné aux blocs structurels (pas aux champs optionnels vides) |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(Aucune proposition `INNOVATION` — toute la conception reste dans le cadre des jurisprudences it1-it7 : forme de `stats` pour `curseurs`, forme de `Relation.secret` pour `cede_si`, forme de `BlocIdentite` pour les proses.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — SANS OBJET : `curseurs.ts` est hors du périmètre muté (KR-193, KR-161) ; aucun des 4 fichiers de logique n'est touché par cette itération
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-fiches-it8.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — phrase de démo + hors-périmètre inscrits (§ 1, § 2) |
| Tech Lead | recevable sous réserve | oui — zéro import `curseurs.ts` (§ 4), `affinite` livré avec son rendu (lot A+B), sonde de couverture nommée (lot A) |
| UX | recevable | — |
| QA | recevable sous réserve | oui — mécanisme `PARLER_REPLIQUES` nommé (§ 3, § 6), sonde de couverture en critère propre (§ 5 lot A), gating de rôle scindé testable/non-testable (§ 7) |
| Narratif & IA | recevable sous réserve | oui — prédicat `cede_si` écrit à 2 sites (lot A), légende `affinite` unique (§ 3), JSDoc de troncature sur `parler` (lot A) |
