# Tour 2 — tech-lead — `dossier-canon` it5 (tranche B1)

> **NOTE DE L'ORCHESTRATEUR — artefact de tour parallèle.** Cette note a été rendue **en même temps** que celle de `narratif-ia`, qui a **retiré son veto ET sa demande de `acces[].description`** (motif mesuré : `Lieu` porte déjà trois proses `ia`, une prose par arête serait une seconde source de vérité sur le même fait). Le `tech-lead` a donc concédé à une exigence qui n'existait plus, et son annexe ci-dessous décrit la **forme OBJET avec `description`** — que ni `narratif-ia` (retirée), ni `pm-produit` (veto sur le regroupement) ne demandent. **L'annexe de son tour 1 (`acces?: string[]`) reste la référence de découpage.** Ce qui SURVIT de cette note est signalé ligne à ligne ci-dessous.

## 1. Réponse au veto : l'objet PASSE, l'interdiction est levée

Interdit de tour 1 (« forme structurée = 7e famille D1 ») **RETIRÉ** : la mesure de l'orchestrateur est juste, D1 ne régit que les couples `…_texte`/`…_expr`. Faux positif épinglé.

**Mesuré : l'objet ne crée aucune machinerie.** Jumeau exact = `personnages[].presence[]` (tableau d'objets portant une référence `lieu_id` + une prose `quand`, chemin à deux `[]` suivis d'une feuille, traversé par `sitesDe` depuis la n° 4).

| Machinerie | `string[]` | objet | Jumeau `presence[]` |
|---|---|---|---|
| `validate.ts` | **0 ligne** | **0 ligne** | — |
| `REFERENCES_SIMPLES` | `acces[]` | `acces[].vers_lieu_id` | `tables.ts:589` |
| liste gardée | `LISTES_OPTIONNELLES_TEXTUELLES` | `LISTES_OPTIONNELLES_STRUCTUREES` | `tables.ts:456` |
| `CHAMPS_REQUIS` | impossible | `acces[].vers_lieu_id` (+1) | `tables.ts:123` |
| `destinations.ts` | 1 ligne | 2 lignes | `:337` + `:347` |

Point qui renverse son objection de tour 1 : la borne « chaîne vide » de `validate.ts:422` était son argument d'économie pour le `string[]` ; l'objet ne la perd pas, il l'améliore (`CHAMPS_REQUIS` refuse l'absence **et** le vide avec un code qui **nomme le champ**). Sans elle, `{ description: 'une porte' }` sans cible serait accepté — une arête vers nulle part.

Delta objet : ~30 lignes. Aucun appelant cassé, aucune migration.

## 2. ⚠ SURVIT — deux corrections à sa propre annexe de tour 1

Ce sont **ses** corrections, indépendantes du veto, **mais toutes deux conditionnées par la forme retenue** :

- **`couverture.test.ts` — R, et il retire son « ne s'édite que s'il rougit ».** Motif donné : `description` est une prose libre → dispense dans `LIBRES`, et `couverture.test.ts:1264` épingle `toHaveLength(18)` avec la docstring l.191 « DIX-HUIT » → 19 + le mot. **Si la forme est `string[]`, il n'y a pas de prose, donc pas de dispense `LIBRES` ni de compteur à bouger** — reste seulement la question du **test d'audience nommé** de l'itération (patron des cinq précédentes), qui vaut pour les deux formes. À mesurer avant l'arbitrage.
- **`brain/index.ts` — R.** Le barrel réexporte les types dossier par **liste nominative** (`Presence` l.394, `Lieu` l.404), pas par étoile. **Ne vaut que pour la forme objet** (`AccesLieu` à publier) ; avec `string[]`, aucun type neuf, donc aucune ligne.

## 3. Réponses nommées

**`qa` — ambiguïté du sens : objection reçue, critère adopté.** *« Étant donné les lieux A et B, quand l'auteur ajoute un accès de A vers B, alors `A.acces` contient B ET `B.acces` reste inchangé (KR-013) »* — contrat, lot 1, discriminance sur deux lieux distincts. **SURVIT quelle que soit la forme.**
Sa proposition 3 (`atteignabilite.ts` non modifié) : **gardée, et mesurée gratuite** — `atteignabilite.ts` ne lit `REFERENCES_SIMPLES` nulle part, le critère ne peut pas rougir par accident, il borne le diff.

**`ux-designer`** — l'objet contredit son § « Registre de langue ». Le reste de son annexe tient mot pour mot (intitulé, légende, états, auto-exclusion à l'ajout, `avecOrpheline`). Gabarit d'anatomie pour une ligne à deux contrôles : `dossier-fiches/components/BlocPresence.tsx` (90 l.) = `Select` + `Field` + `IconButton` ✕. *(Caduc si la forme est `string[]`.)*

**`pm-produit` / rider `validate.ts`** — position **maintenue et renforcée** : y agréger 4 sites d'avertissement étrangers + `designerSavoir`, c'est mélanger un changement de schéma et une réparation de rapport. **Ré-armé sur le fichier `validate.ts`**, écrit en `known_risk` nommé, jamais en silence. **SURVIT.**

## 4. Statut de ses objections de tour 1

| # | Objection | Statut |
|---|---|---|
| 1 | Rider hors périmètre, ré-armé sur le fichier | **maintenue** |
| 2 | Culs-de-sac invisibles → « ACCESSIBLE DEPUIS » lecture seule | **maintenue, non bloquante — et il conseille de la COUPER** : jamais injectée (les arêtes entrantes sont du spoiler), aide d'auteur pure. Arbitrage PM/UX |
| 3 | « forme structurée = 7e famille D1 » | **RETIRÉE** — mesure fausse |
| 4 | Aucune garde d'auto-référence au SSOT (KR-194) | **maintenue** |
| 5 | BUG-078 → `FicheLieuHandle` (`IconButton` déjà `forwardRef`, `brain/components/IconButton.tsx:30`) | **maintenue** |
| 6 | KR-112 → extraire `styles.ts` | **durcie** (mais le motif — `FicheLieu` à ~270 l. — supposait le champ de prose) |

**Aucun veto maintenu. Pas d'escalade.**

## 5. Contraintes dures du lot 2 qui SURVIVENT à l'abandon de `description`

- **Aucun nouveau `querySelector` par `aria-label`** : l'ajout d'accès rouvre l'effet `intentionFocus`, le réflexe est interdit. BUG-078 se corrige ici par `useImperativeHandle({ focusRetirer })`.
- `styles.ts` n'est pas une abstraction : scission KR-112, tokens déplacés à l'identique depuis `PanneauLieux.tsx:285-364`.
- Aucun inverse stocké ni recalculé ; « ACCESSIBLE DEPUIS », si retenue, est calculée en ligne depuis la prop `lieux`, jamais un `useEffect`, jamais un helper `brain/`.
- Hors de toute propriété, un lot qui croit en avoir besoin **s'arrête et remonte** : `validate.ts`, `atteignabilite.ts`, `controles.ts`, `App.tsx`, `dossier-minimal.json`, `FicheIndice.tsx`, `dossier-canon/index.ts`. L'étape 4 des Build Steps est portée par le **lot 2**.

## 6. Points à trancher, non bloquants

1. Rider `validate.ts` : **ré-armé sur le fichier**, en `known_risk` nommé (convergence `pm` + `qa`).
2. « ACCESSIBLE DEPUIS » : **il conseille de couper**.
3. Doublons (deux fois la même cible) : **aucune garde**, comme `mene_a`. Limite assumée et datée.
4. Libellé/`hint`/`placeholder` du `Field` de description : domaine `ux-designer`. *(Caduc si `string[]`.)*
