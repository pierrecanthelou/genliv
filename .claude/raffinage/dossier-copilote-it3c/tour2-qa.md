# Tour 2 — `qa` · `dossier-copilote` it3c

**Réponse nommée — tech-lead E-4 / narratif § propos. 5** (exclusion du porteur des rangs) : j'accepte le motif technique, **mais aucun des deux ne nomme un TEST** pour ça (contrairement à F-1/F-2/F-3). **C'est l'inverse de mon point 3 du tour 1** (« non filtré ») — **renversement motivé, mais non testé**.

## Statut de mes objections du tour 1
| Objection | Statut | Motif |
|---|---|---|
| Doublon `cible_id` | **RETIRÉE** | F-3 nommé, `rangs.size === N−1` |
| Sort de la réponse vide | **RETIRÉE** comme question de périmètre (tranchée deux fois, différemment) — **ROUVERTE** comme question de **testabilité** | voir divergence |
| Résolution `P2` → **deuxième** id | **MAINTENUE** | ni F-1/F-2/F-3 ni narratif § 7 ne la nomment ; **elle vaut identiquement dans les deux formes** — c'est un `Map.get` sur le rang, **indépendant du débat** |
| `intensite` `toBe(0)` jamais `toBeFalsy` | **MAINTENUE** | non nommée ; **seules la constante `INTENSITE_INITIALE` et l'écriture `0` sont décidées, pas l'ASSERTION** |
| Auto-référence non filtrée | **DURCIE EN VETO** | **design inversé** (exclusion du porteur) **sans scénario nommé**. Je bloque tant qu'un test n'asserte pas `porteur.id ∉ rangsConnus` |
| Orpheline exposée | **RETIRÉE** | narratif § 9 + ux § E, `validateDossier` existant (KR-021), **deux fois écrit noir sur blanc** |

**Veto conditionnel : PAS LEVÉ** (2 MAINTENUES + 1 DURCIE sur 4).

**Divergence scalaire / liste** — **argument de testabilité** : scalaire = **8 prédicats, aucun de forme tableau**. Liste = **11**, dont « `vers` distincts » (doublon intra-lot, **MAX > 1 seulement**) **sans motif nommé dans `MotifIllisible`** — ⚠ **je ne sais pas l'asserter tant que sa valeur de retour n'est pas fixée**. **Scalaire plus testable**, le coût étant que le modèle ne peut jamais dire « personne » (reporté au contexte).

**Liste vide = succès** : **séparable** comme contrat unitaire (`{liens:[]}` → `ok:true`, distinct d'une troncature qui casse le JSON avant validation). ⚠ **NON séparable** : « vide **parce que juste** » contre « vide **parce que le modèle abandonne** » — **même famille non gardée que le nom inventé**, aucun instrument jest ne tranche.

**Nom propre inventé** : **d'accord avec le narratif, non-testable**, aucun scanner viable (faux positifs non bornés, **aucune vérité terrain**).

**VERDICT — VETO MAINTENU.** Trois scénarios à nommer avant code : **`P2` → 2ᵉ id · `intensite` `toBe(0)` · exclusion du porteur des rangs**.

---

## ANNEXE — instruments EXÉCUTÉS (Grep/Read seuls ; **aucun jest/tsc**, le code de 3c n'existe pas)

- `worker/frontiere.test.ts:68` `ROLES = Object.keys(INVITES)` — **confirmé dérivé**, s'étendra seul au 5ᵉ rôle.
- `worker/index.test.ts:346-361, 476-499, 616-634` — **CONFIRMÉ** : `max_tokens` par route est **écrit à la main pour chaque rôle**, aucune généralisation ⇒ **le 5ᵉ rôle n'héritera de rien sans code neuf de l'ouvrier.**
- ⚠ **`worker/frontiere.test.ts:610-690` — JE CORRIGE UNE INQUIÉTUDE DU TECH-LEAD (son H.6).** Lu en détail : la « mine » `paires(etroits).find(…)` (l. 681) est **DÉJÀ AUTO-GARDÉE** par un **`throw` explicite** (l. 682) si aucune paire ne diffère. **Le piège de 3b NE PEUT PLUS redevenir inerte SILENCIEUSEMENT** ; au pire il fait **exploser jest avec un message nommé**. Le risque existe encore, **mais il n'est plus silencieux** — ce qui change entièrement sa gravité.
- `src/brain/dossier/tables.ts:602` — commentaire explicite « **AUCUNE GARDE D'AUTO-RÉFÉRENCE (KR-194)** » : confirmé, **aucune contrainte d'unicité `cible_id`** à ce niveau — cohérent avec F-3 (**dédup à la SÉLECTION, pas au schéma**).
- `worker/index.ts:368` `TAILLE_MAX_CORPS_IA = 52_224` — **confirmé FIXÉ À LA MAIN**, pas dérivé par formule en code ; **marge mesurée face au rôle le plus large actuel (`indice-detenteurs`, budget 17 000) : ÉTROITE, ~379 caractères** (calcul du commentaire l. 350-363). **Non mesurable pour le rôle 5** : le budget réel n'existe pas encore. La prédiction tech-lead/narratif (« peut bouger pour la première fois ») est **plausible mais NON VÉRIFIÉE** — **à mesurer une fois le budget posé, pas avant**.
- `contexte/registres.ts` — budgets lus : prose **6000** · détenteurs **17000** · répliques **4000** · plan **4000** (coïncidence déjà épinglée).

## Ce que je n'ai PAS vérifié
**Aucun jest/tsc exécuté** (code 3c inexistant) · la **valeur réelle** du budget `personnage-relations` : **non mesurable** · que le `MotifIllisible` de « `vers` distincts » existe ou non dans le contrat final : **non tranché par personne au tour 1, à exiger avant essaim**.
