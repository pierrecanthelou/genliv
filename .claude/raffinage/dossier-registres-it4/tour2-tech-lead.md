RÉPONSE
**UX, objection 2** — accordée, et elle corrige mon annexe de tour 1 : `avecOrpheline` **sort** de la liste consommée par le lot écran. `BESTIARY` est un registre constant, `monstre_ref` n'a aucune collection du dossier derrière lui ; y injecter une option « orpheline » fabriquerait un état que le validateur déclare impossible. `avecOrpheline` reste employé **à l'intérieur** d'`EditeurEffets` pour les cibles de deltas — sans une ligne modifiée.
**UX, §5** (bouton « Retirer cette résolution ») contredit mon point 4, et elle a raison sur le fond : une résolution non retirable est un piège de donnée. Je cède le périmètre et je fournis le dispositif — jeton de remontage, **zéro `id` ajouté au schéma** (mettre un identifiant de résolution pour satisfaire une clé React, ce serait le `nature` que je viens de refuser).
**QA, proposition 3** — `nature` retiré, il n'y a plus de cohérence à tester ; le test change de cible, pas de statut : le document écrit ne porte jamais de clé `nature`, et le libellé « monstre » naît et meurt avec `monstre_ref` seul.

MES OBJECTIONS DU TOUR 1
1. `nature` retiré — **maintenue**, tranchée : quatre rôles convergent, le veto devient inutile ; borne du lot 1 (zéro ligne, zéro registre, zéro export).
2. Deux gestes imbriqués (création immédiate / résolution différée) — **durcie** : QA la double, deux critères nommés, un test chacun.
3. `PREFIXE_BESTIAIRE` exporté — **maintenue** : deux appelants nommés, `validate.ts` qui lit et la fiche qui écrit puis relit.
4. Retrait d'une résolution hors périmètre — **retirée** (motif : UX §5 ; remplacée par le jeton de remontage et son test).
5. `lie_a_histoire` booléen, absent = libre — **maintenue**, satisfaite par `ENUMERES_FERMES {valeurs:[true,false], requis:false}` plus écriture explicite à la création.

VERDICT — **recevable sous réserve** : `nature` à zéro ligne dans le lot contrat ; jeton de remontage et son test dans le lot écran.

---

## ANNEXE — découpage FIGÉ, itération 4

**2 lots, séquentiels, propriété exclusive vérifiée : aucun fichier n'apparaît deux fois.** Pas de parallélisme réel — le lot 2 lit un contrat figé (patron it1/it2/it3, KR-210 : un seul lot `contrat`). Ne pas ouvrir de worktree.

### Lot 1 — `evenements-contrat` — marqué `contrat` (seul, en premier)

| | Fichier | N/R |
|---|---|---|
| 1 | `src/brain/dossier/types.ts` | R |
| 2 | `src/brain/dossier/tables.ts` | R |
| 3 | `src/brain/dossier/destinations.ts` | R |
| 4 | `src/brain/dossier/validate.ts` | R *(le mot-clé `export` devant la ligne 106, aucune branche neuve)* |
| 5 | `src/brain/index.ts` | R |
| 6 | `src/brain/dossier/couverture.test.ts` | R |
| 7 | `src/brain/dossier/validate.test.ts` | R |
| 8 | `src/brain/dossier/__fixtures__/dossier-minimal.json` | R |
| 9 | `src/brain/dossier/__fixtures__/dossier-reference.json` | R |

**Signature exposée, exacte :**
```ts
// types.ts — Evenement (les 4 champs existants inchangés)
/** ABSENT = libre. Jamais `null`. L'écran écrit toujours la valeur explicitement. */
lie_a_histoire?: boolean

// tables.ts — ENUMERES_FERMES (précédent 'monde.personnages[].relations[].secret', ligne 274)
{ path: 'monde.evenements[].lie_a_histoire', location: 'Événements', valeurs: [true, false], requis: false }

// destinations.ts — DESTINATION_DES_CHAMPS, bloc « monde.evenements »
'monde.evenements[].lie_a_histoire': 'moteur',

// validate.ts:106, rendu public + ré-exporté par brain/index.ts
export const PREFIXE_BESTIAIRE = `${ESPACE_BESTIAIRE}.`   // 'bestiaire.'
```

**Bornes du lot 1.** Aucun `NatureEvenement`, aucun `NATURES_EVENEMENT`, aucune ligne de `nature` nulle part — c'est la borne, pas un détail de style. `lie_a_histoire` doit être instancié dans les deux fixtures, avec les deux valeurs représentées dans la référence, et la minimale reste sans avertissement. Ne touche ni `identifiers.ts`, ni `sections.ts`, ni `deltas.ts`, ni `amorce.ts`. `FAMILLES_DE_CONDITIONS` n'est pas modifiée : `alerteSansExpr: false` sur `monde.evenements[].declencheur_expr/texte` est vérifié, c'est le régime voulu.
**Ricochets à exécuter, pas à supposer** : `roundtrip.test.ts` fait un deep-equal fixture↔export, et `dossier-format/tests/importDossier.test.tsx` a rougi trois fois sur des lots de ce type. Les faire tourner fait partie du lot 1.

### Lot 2 — `evenements-ecran` (démarre contrat figé, le lit comme une donnée immuable)

| | Fichier | N/R |
|---|---|---|
| 1 | `src/features/dossier-registres/components/PanneauEvenements.tsx` | N |
| 2 | `src/features/dossier-registres/components/FicheEvenement.tsx` | N |
| 3 | `src/features/dossier-registres/hooks/useEcritureResolutions.ts` | N |
| 4 | `src/features/dossier-registres/tests/panneauEvenements.test.tsx` | N |
| 5 | `src/features/dossier-registres/components/styles.ts` | R |
| 6 | `src/features/dossier-registres/index.ts` | R |
| 7 | `src/App.tsx` | R *(une entrée `evenements:` dans la carte des sections)* |

**Consomme (lecture immuable)** : `type Evenement`, `type Resolution`, `type Delta`, `type DeltaId`, `type EspaceDeNoms`, `type EcritureDossier`, `BESTIARY`, `PREFIXE_BESTIAIRE`, `localiserEntite`, `frapperIdentifiant('evenement')`, `useOpenDossier`, `dossiers.update`, `{Field, Card, ListRow, IconButton, Select, SegmentedControl, IssueList, HIT_TARGET_MIN}`. `avecOrpheline` ne figure plus dans cette liste.

**`EditeurEffets.tsx` n'apparaît dans AUCUN lot** — réutilisé sans une ligne modifiée. Une instance par résolution, les trois callbacks se fermant sur `rang` côté `FicheEvenement` ; aucune prop d'index ne lui est ajoutée (Déméter).

**Le jeton de remontage** — réponse figée au risque n° 2 du tour 1 et au retrait remis au périmètre. `useEcritureEtapes.ts` purge déjà les brouillons du hook après un retrait ; il ne peut pas purger ceux qui vivent en `useState` DANS les N `EditeurEffets`. Le jeton est un compteur monotone incrémenté au seul retrait de résolution ; il entre dans la clé React de la ligne, donc le retrait remonte les instances et aucun brouillon d'effet ne migre vers la voisine. Ce n'est pas de l'état dérivé (KR-013/113) : c'est un jeton de remontage, il ne miroite rien. Pas de clé dérivée du contenu, pas d'`id` de résolution au schéma.

**Signature exposée par le hook** (calquée sur `useEcritureEtapes`, brouillon différé KR-214) :
```ts
export interface BrouillonResolution { resultat: string }
export interface UseEcritureResolutionsResult {
	resolutions: BrouillonResolution[]        // persistées + le brouillon en queue
	jetonDeRemontage: number
	handleAjouterResolution: () => void
	handleChangeResolution: (index: number, valeur: string) => void
	handleBlurResolution: (index: number, valeur: string) => void
	handleRetirerResolution: (index: number) => void
	handleAjouterEffet: (rang: number, effet: Delta) => void
	handleChangerCible: (rang: number, index: number, position: number, valeur: string) => void
	handleRetirerEffet: (rang: number, index: number) => void
}
```

**Trois contraintes dures du lot 2** :
1. **Sélection par identifiant, jamais par index.** Le repli au changement de filtre est calculé au rendu, sans `useEffect` de resynchronisation.
2. **Création : commit immédiat, valeur explicite.** `{ id: frapperIdentifiant('evenement'), resolutions: [], lie_a_histoire: filtre === 'lies' }` — jamais `undefined`.
3. **Monter/Descendre opèrent entre voisins du sous-ensemble affiché**, en échangeant les index réels dans `monde.evenements[]`.

**Trois tests nommés, tous dans `panneauEvenements.test.tsx`** : `discriminance` (deux événements, true/false, chacun visible dans son seul onglet) ; `brouillon différé de résolution` (resultat vide au blur = rien ; non vide = commit, dans le même test la création de l'événement est immédiate — contraste demandé par QA) ; `jeton de remontage` (brouillon d'effet ouvert sur la résolution n°2, retrait de la n°1, aucun brouillon migré, événement écrit sans clé `nature`). Plus `couverture.test.ts` remesuré (KR-159).

**Bornes du lot 2** : aucun fichier de `bascule-editeur`, `dossier-canon`, `dossier-fiches`, `dossier-objets`, `tree-canvas`, `player` (KR-184/204/205). Aucun import depuis une feature sœur — le brouillon différé est réimplémenté ici. Extraction vers `useEcritureResolutions.ts` pré-autorisée (KR-112, `FicheQuete.tsx` pèse déjà 277 lignes).
