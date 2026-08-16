## Note Tech Lead — dossier-fiches it8, tour 1

**RISQUE** — `src/brain/dossier/couverture.test.ts:486` : la sonde discriminante de la 4e assertion vise `monde.personnages[].caractere`, qu'it8 instancie. Elle rougit — et c'est la **dernière** tranche de schéma de la feature : aucune cible interne où la déplacer. La supprimer rendrait la 4e assertion verte-constante : KR-199 sur l'instrument même qui garde le schéma. Elle doit se re-viser vers un chemin possédé par la n°5/n°6 ; la ligne 492 (`plan`) ne la remplace pas — autre propriété.

**OBJECTION 1** — `affinite` ne peut pas être typé `Characteristic` : `CA`/`IN`/`IG` sont des clés de `CHARACTERISTICS`, et l'import casserait la seule clause vérifiable de KR-193 (« zéro import »), celle qui tient `curseurs.ts` hors mutation et hors table dorée. KR-117 et KR-193 s'échangent ici en silence.

**OBJECTION 2** — `PARLER_REPLIQUES` est écrit comme une borne *validée*. `validate.ts` n'a aucun mécanisme de cardinalité, et le seul autre tableau de chaînes du schéma (`canon.interdits_ton[]`) n'a aucune règle d'élément : en construire un pour un appelant unique est une dette, pas un contrat.

**PROPOSITION**
(a) `curseurs.ts` **séparé** — le précédent `CARACTERISTIQUE_MIN` ne vaut pas : le cliquet se déclenche en *touchant* `characteristics.ts`, pas en créant un fichier. `affinite` = union locale ; `curseurs.test.ts` épingle les 3 littéraux contre `CHARACTERISTICS`.
(b) Borne `parler` d'**interface** : zéro ligne de table ; l'affordance d'ajout disparaît à `length >= PARLER_REPLIQUES` ; le bloc rend **toujours** ce que le document porte (3 répliques → 3 rendues — précédent M1 it5 / BUG-074). Tests à 1 / 2 / 3.
(c) `FichePersonnage.tsx` : **aucune extraction**. Prop groupée `caractere: UseEcritureCaractereResult` (précédent `relationsPresence`, `savoirs`) + suppression du placeholder devenu mort. Cible mesurée au plan : **≤ 412 lignes**. Dernière itération — une dette « datée pour la suivante » n'a plus de suivante.
(d) **2 lots séquentiels**, aucun essaim.

**VERDICT** — recevable sous réserve (objections 1-2 tranchées au plan ; sonde de couverture nommée dans le lot A).

---

### Annexe — découpage en lots (hors quota)

| Lot | Titre | Contrat | Fichiers (N = créé, R = remplacé) |
|---|---|---|---|
| **A** | `contrat-caractere` | **OUI — seul, en premier** | **N** `src/brain/dossier/curseurs.ts` · **N** `src/brain/dossier/curseurs.test.ts` · **R** `src/brain/dossier/types.ts` · **R** `src/brain/dossier/tables.ts` · **R** `src/brain/dossier/destinations.ts` · **R** `src/brain/dossier/__fixtures__/dossier-minimal.json` · **R** `src/brain/dossier/__fixtures__/dossier-reference.json` · **R** `src/brain/dossier/couverture.test.ts` · **R** `src/brain/dossier/validate.test.ts` · **R** `src/brain/index.ts` |
| **B** | `bloc-caractere` | non — démarre contrat figé | **N** `src/features/dossier-fiches/components/BlocCaractere.tsx` · **N** `src/features/dossier-fiches/hooks/useEcritureCaractere.ts` · **N** `src/features/dossier-fiches/tests/caractere.test.tsx` · **R** `src/features/dossier-fiches/components/FichePersonnage.tsx` · **R** `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts` · **R** `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` · **R** `src/features/dossier-fiches/components/PanneauPersonnages.tsx` *(nommé d'avance : précédent it5, « +3 lignes hors liste » — un gap réel, pas un dépassement)* |

Aucun fichier commun aux deux lots. Exécution **séquentielle** (B importe le contrat de A) : pas de worktree, pas de fusion.

**Interface exposée par A / consommée par B — le seul point de rendez-vous :**

```ts
// src/brain/dossier/curseurs.ts — N'IMPORTE RIEN (KR-193, clause vérifiable)
export type CurseurId = 'mefiance' | 'franchise' | 'courage' | 'cupidite' | 'loyaute' | 'verve'
export type AffiniteCurseur = 'CA' | 'IN' | 'IG'   // littéraux, JAMAIS `Characteristic`
export const CURSEURS: Record<CurseurId, { label: string; describe: string; affinite: AffiniteCurseur }>
export const CURSEUR_VALUES: CurseurId[]           // Object.keys(CURSEURS) — KR-117
export const CURSEUR_MIN = 0
export const CURSEUR_MAX = 10
export const PARLER_REPLIQUES = 2
export const CURSEURS_INITIAUX: Record<CurseurId, number>  // dérivé, précédent STATS_INITIALES :
                                                           // VALEUR D'ÉCRITURE, `?? CURSEURS_INITIAUX` interdit en lecture

// src/brain/dossier/types.ts (importe curseurs.ts — sens unique, aucun cycle)
export interface Caractere {
  curseurs?: Record<CurseurId, number>   // optionnel EN BLOC, TOTAL quand présent (jurisprudence it3)
  parler?: string[]                       // ia — au plus PARLER_REPLIQUES, borne d'interface
  jamais?: string                         // ia
  cede_si?: string                        // ia — didascalie, JAMAIS une porte D1
}
// Personnage.caractere?: Caractere
```

```ts
// src/features/dossier-fiches/hooks/useEcritureCaractere.ts — exposé par B, consommé par B seul
export function useEcritureCaractere(socle: SocleEcriture | null): UseEcritureCaractereResult
export interface UseEcritureCaractereResult {
  caractere: BrouillonCaractere                                   // brouillon PAR CHAMP (BUG-058)
  handleReglerCurseurs: () => void                                // geste EXPLICITE : 6 clés à CURSEUR_MIN en UN commit
  handleChangeCurseur: (curseur: CurseurId, valeur: number) => void
  handleAjouterReplique: () => void                               // affordance masquée à length >= PARLER_REPLIQUES
  handleChangeReplique: (index: number, valeur: string) => void
  handleBlurReplique: (index: number, valeur: string) => void
  handleRetirerReplique: (index: number) => void
  handleChangeJamais / handleBlurJamais / handleChangeCedeSi / handleBlurCedeSi: (valeur: string) => void
}
// FichePersonnage reçoit UNE prop groupée `caractere: UseEcritureCaractereResult`, jamais 12 props à plat.
```

**Notes de lot A** (à écrire au plan, pas à redécouvrir) :
- `tables.ts` : 6 lignes `ENUMERES_FERMES` **dérivées** de `CURSEUR_VALUES` (`requis: true`), + un registre `VALEURS_DE_CURSEUR` dérivé des deux bornes (précédent `VALEURS_DE_CARACTERISTIQUE`). **Zéro ligne** dans `LISTES_OPTIONNELLES_STRUCTUREES` : cette table exige des **objets**, `parler[]` porte des chaînes (précédent `canon.interdits_ton[]`, sans règle d'élément).
- `destinations.ts` : `DESTINATION_DES_CURSEURS` **dérivé au site**, jamais un mécanisme partagé — le fichier l'annonce déjà (l. 45). Aucune ligne porteuse `…caractere` ni `…caractere.curseurs` (objet non vide ≠ feuille, l. 56-59, sinon « ligne morte »). +3 lignes `ia` : `caractere.parler[]`, `caractere.jamais`, `caractere.cede_si`.
- Les **deux** fixtures portent le bloc complet, `dossier-minimal.json` incluse : sans instance, les 3 lignes `ia` sont des **lignes mortes** et le garde rougit.
- `validate.ts` : **zéro ligne attendue** (boucles génériques, précédents it1/it3/it5). Si dev-contrat doit y écrire une branche, il s'arrête et remonte au comité — c'est le signal d'un contrat mal posé.
