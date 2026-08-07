# Tour 1 — UX Designer · `dossier-format` it3

**RISQUE** — Deux trous de définition menacent KR-164 (« l'entité est résolue par son nom ») dès que `dev-contrat` commence à taper du TypeScript : `contre_mesures[]` n'a ni racine ni forme, et le nommage du champ machine varie déjà entre deux décisions actées.

**OBJECTION** — (1) `contre_mesures[]` n'existe nulle part dans le dépôt ni dans `types.ts` : sans forme `Entite` ni entrée dans `ESPACES_DE_NOMS`, aucun rapport d'anomalie ne peut **nommer** une contre-mesure fautive — repli sur le `path` JSON seul, interdit par KR-164. (2) Le nom du champ machine est **incohérent entre deux décisions déjà écrites** dans `resolved_decisions` : D1 écrit « `jalons[].declencheur` », la décision « Pick abandonné » écrit « `plan_actions[].declencheur_expr` » — deux graphies pour la même idée, non tranchées.

**PROPOSITION** — `contre_mesures[] extends Entite`, référencée dans `ESPACES_DE_NOMS` (« contre-mesure » → « Contre-mesure ») et `COLLECTIONS_IDENTIFIEES`, pour hériter le repli « Contre-mesure n°N (sans nom) ». Convention de nommage : `_si` réservé aux portes booléennes (`reussi_si`/`echoue_si`, précédent `revele_si`) ; `_expr` uniquement quand un `_texte` jumeau existe déjà (`condition_expr`/`condition_texte`, `declencheur_expr`/`declencheur_texte` de `Jalon`) ; `declencheur` nu pour `evenements`/`plan_actions`/`contre_mesures`, qui n'ont aucun jumeau prose. Le champ d'un nœud `pred` qui porte l'identifiant référencé s'appelle **`cible`** (jamais `ref`/`args[0]`), pour que `feuilleDe(path)` rende un mot français lisible dans le rapport. 2 codes d'anomalie neufs + 6 labels `PREDICATES` en annexe.

**VERDICT** — recevable sous réserve : les trois points ci-dessus tranchés en tour 2, faute de quoi KR-164 est impossible à honorer pour `contre_mesures` et le rapport affichera deux orthographes du même concept selon la famille.

---

## ANNEXE — contrat de design

### A. Codes d'anomalie neufs

**1. `condition-invalide`** — canal `errors` (bloquant)

QUOI (trois variantes, interpolées au site d'appel dans `validate.ts`, jamais dans `DOSSIER_ISSUE_LABELS`) :
- Opérateur inconnu : « Le champ « {champ} » utilise l'opérateur « {valeur} », qui n'existe pas (attendu : et, ou, non, pred). »
- Prédicat inconnu : « Le champ « {champ} » utilise le prédicat « {valeur} », qui n'existe pas dans le registre des conditions. »
- Arité incorrecte : « Le champ « {champ} » fournit {n} cible(s) au prédicat « {label} », qui en attend {arity}. »

QUOI FAIRE (une seule ligne pour les trois variantes) : « ↪ Corrigez la condition dans le fichier (opérateur, prédicat ou nombre de cibles), puis réimportez-le. »

OÙ : l'entité qui **PORTE** le champ fautif — Objectif, Fin, Jalon, Personnage (pour `plan_actions[]`), Événement, Contre-mesure — jamais le nœud `pred` lui-même, qui n'a pas de nom.

**2. `condition-sans-formalisation`** — canal `warnings` (non bloquant)

QUOI : « Le champ « {champ} » décrit une condition en prose, mais aucune condition structurée correspondante n'est posée : elle ne sera jamais vérifiée automatiquement. »
QUOI FAIRE : « ↪ Ajoutez la condition structurée correspondante si le moteur doit la vérifier, ou laissez tel quel si elle reste une intention d'auteur. »
OÙ : l'entité portant le `_texte` sans son jumeau structuré.

*(Réutilisation, pas un code neuf : une référence pendante à l'intérieur d'un `pred` reste `reference-pendante`, déjà généralisé en it2. QUOI proposé pour ce nouveau site d'appel : « Le prédicat « {label} » de « {champ} » pointe « {valeur} », qui n'existe pas dans ce dossier. »)*

### B. `PREDICATES[].label` exigés

| id (`snake_case`) | label français | arity | refKinds |
|---|---|---|---|
| `possede_objet` | « Possède l'objet » | 1 | `['objet']` |
| `jalon_atteint` | « A atteint le jalon » | 1 | `['jalon']` |
| `connait_indice` | « Connaît l'indice » | 1 | `['indice']` |
| `a_visite_lieu` | « A visité le lieu » | 1 | `['lieu']` |
| `confiance_pnj_min` | « A la confiance minimale du personnage » | 1 | `['pnj']` |
| `jet_reussi` | « A réussi un jet de compétence » | 0 | `[]` |

Style phrase courte, majuscule initiale seule, jamais de MAJUSCULES ESPACÉES — ce registre alimente une valeur de `Select`/`TargetPicker`, pas une légende de champ. Placeholder réservé à la future UI de composition (n° 3/6/7) : `Select` vide = « Choisir une condition… ».

### C. JSDoc à exemple écrit — champs neufs

```ts
/**
 * Un objectif de l'aventure. `reussi_si`/`echoue_si` sont MOTEUR — jamais
 * injectés, évalués en fin de session. La formulation en prose destinée à
 * l'auteur (reussi_si_texte) arrive avec dossier-canon (n° 3) ; sa présence
 * sans reussi_si produira l'avertissement condition-sans-formalisation.
 * Exemple : reussi_si: { op: 'pred', predicateId: 'jalon_atteint', cible: 'jalon.gouffre-scelle' }
 */
export interface Objectif extends Entite {
	reussi_si?: ExprNode
	echoue_si?: ExprNode
}
```
```ts
/** MOTEUR — jumeau structuré de condition_texte (déjà livré). Jamais injecté :
 *  un narrateur qui connaît la condition de fin y conduit.
 *  Exemple : condition_expr: { op: 'et', enfants: [
 *    { op: 'pred', predicateId: 'possede_objet', cible: 'objet.cle-du-gouffre' },
 *    { op: 'pred', predicateId: 'jalon_atteint', cible: 'jalon.gardien-vaincu' } ] } */
condition_expr?: ExprNode // sur Fin
```
```ts
/** MOTEUR — aucun jumeau prose : l'événement n'a pas de _texte associé.
 *  Exemple : declencheur: { op: 'pred', predicateId: 'a_visite_lieu', cible: 'lieu.val-cendre' } */
declencheur?: ExprNode // sur Evenement
```
```ts
/**
 * Une CONTRE-MESURE : un risque que le meneur peut activer une fois sa
 * condition vérifiée (embuscade renforcée, prix qui monte). MOTEUR — jamais
 * lue par le joueur, jamais lue par l'auteur comme de la fiction.
 * Exemple : { id: 'contre-mesure.garde-alertee', nom: 'La garde est alertée',
 *   declencheur: { op: 'pred', predicateId: 'jalon_atteint', cible: 'jalon.alarme-donnee' } }
 */
export interface ContreMesure extends Entite {
	declencheur: ExprNode
}
```

Tous ces champs neufs : `destination: 'moteur'` dans `DESTINATION_DES_CHAMPS` (jamais `ia`, jamais `auteur`) — sinon `couverture.test.ts` rougit par construction.
