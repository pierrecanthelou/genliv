# Tour 1 — tech-lead — dossier-controles it7

**RISQUE** — `canon-sans-objectif` allume un BLOQUANT sur **tout dossier issu de `DossierService.create()`** (`amorce.ts:107` sème `canon.objectifs: []`). Mesuré par lecture, **3 fichiers de test hors `controles.test.ts`** deviennent faux — `panneauControles.test.tsx:86` (« Aucun contrôle à signaler » devient **inatteignable** sur un dossier neuf), `dossierEditorScreen.test.tsx:137` (`BADGES_DOSSIER_NEUF[0] = 'ALERTE'` → `BLOQUANT`) et son test l.384. **Deux features touchées : signal de coupe au sens de la skill.**

**OBJECTION** — le goal promet « une table balayée depuis `PREDICATES` (7) ». Sous H2 + KR-224, **quatre** entrées — `jalon_atteint`, `lieu_visite`, `lieu_courant_est`, `evenement_consomme` — se réduisent à « productible ⟺ l'identifiant résout », donc **tautologiquement vraies** sur tout dossier que le produit peut tenir (KR-225). Seules trois mordent. Une table de 7 prouvée par 3 témoins de règle **est** KR-199.

**PROPOSITION** — (1) la productibilité vit dans `atteignabilite.ts`, pas dans un module neuf ; (2) le producteur d'objet est **nommé** `donner_objet`, jamais dérivé de `refKinds.includes('objet')` — `retirer_objet` partage ce `refKind` et est un producteur NÉGATIF ; (3) verdict **bottom-up** (`et`=∀, `ou`=∃, `non`=vrai), jamais un relevé plat ; (4) KR-226 réécrit en table **épinglée** `path → section`, strictement plus forte que le `!==` actuel.

**VERDICT** — **recevable sous réserve**. 2 lots, séquentiels, zéro worktree.

---

# ANNEXE

## A. Découpage — 2 lots, propriété disjointe

| # | Lot | Marque | Ordre | Fichiers |
|---|---|---|---|---|
| **L1** | `productibilite` — ce que le dossier sait établir | **contrat** | **1, seul** | R `src/brain/dossier/atteignabilite.ts` · R `src/brain/dossier/atteignabilite.test.ts` |
| **L2** | `regles-objectif` — les deux règles + réparation des lignes de base | **contrat** | **2, seul, L1 figé** | R `src/brain/dossier/controles.ts` · R `src/brain/dossier/controles.test.ts` · R `src/features/dossier-controles/tests/panneauControles.test.tsx` · R `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` |

**Aucun fichier partagé.** Les deux touchent `brain/` → les deux sont `contrat` → exécution **séquentielle**, pas d'essaim.

**Pourquoi 2 et non 1** : L1 se passe la porte **sans que `controles.ts` sache quoi que ce soit** — c'est la démonstration que la couture d'it6 tient, et elle se lit en diff. Si le comité préfère 1 lot, ce n'est pas un veto — mais on perd la lisibilité de la frontière.

**Pourquoi L2 possède les deux fichiers de test de features** : ils rougissent par conséquence mécanique du contrat. Un lot qui ajoute la règle sans les nommer laisse une porte rouge que personne ne possède. Ce ne sont **pas** des lots de feature (aucun `.tsx` de production touché).

## B. Signatures exactes

**Exposé par L1** (`atteignabilite.ts`, **ne sort PAS du baril**) :

    export function conditionAccomplissable(dossier: Dossier, condition: ExprNode): boolean

Docstring imposée : « VRAI si le dossier porte au moins un chemin capable de rendre cette condition vraie. SENS D'ERREUR : le FAUX NÉGATIF — dans le doute on conclut *accomplissable*, seule direction permise sous une règle bloquante. Totale sur un arbre accepté par `validateExpr` ; AUCUNE borne de récursion propre — c'est `PROFONDEUR_MAX_EXPR` chez le validateur qui la lui garantit. »

**Privé à L1**, jamais exporté (précédent `SITES_AVERTISSEMENT`) :

    interface EtatDuDossier { dossier: Dossier; indicesProduits: ReadonlySet<string>; objetsDonnes: ReadonlySet<string> }
    const ETABLISSEMENT: Record<PredicatId, (etat: EtatDuDossier, cibles: readonly string[]) => boolean>

**Imports neufs autorisés** : `./expr` (`ExprNode`), `./predicates` (`PREDICATES`, `PredicatId`). Ordre acyclique respecté.

> ⚠ **Piège de rédaction, à écrire dans le plan** : la garde de couture porte sur le **texte brut du fichier**, commentaires compris. Une docstring neuve qui écrirait « ce module ne connaît ni `SectionId` ni `NiveauControle` » **ferait rougir la garde en disant la vérité**. Formuler « ni identifiant de section, ni mot de niveau ».

**Consommé par L2** : `conditionAccomplissable` seule. `controles.ts` n'importe ni `PREDICATES`, ni `ExprNode`, ni `producteursParIndice` — il **conclut**, il ne compte pas.

**Constats produits par L2** :

| règle | `niveau` | `section` | `path` | `entityId` |
|---|---|---|---|---|
| `canon-sans-objectif` | `bloquant` | `canon` | `canon.objectifs[].id` | *absent* |
| `objectif-sans-chemin` | `bloquant` | `canon` | `canon.objectifs[].reussi_si_expr` | `objectif.id` |

> ⚠ **Mesuré, pas supposé** : `path: 'canon.objectifs'` **échoue** `estCheminDeChamp` (`controles.test.ts:258`) — la table n'a que des clés `canon.objectifs[].*`. Il faut `canon.objectifs[].id`.

## C. Réponses aux cinq questions

**Q1 — Dans `atteignabilite.ts`.** Trois motifs, le premier décisif : (1) **it6 l'a déjà décidé par écrit** — docstring l.11-14 : « la clause KR-224 **rejoindra cette liste** le jour où l'atteignabilité des LIEUX entrera ici ». It7 est ce jour-là. (2) La question posée est le sujet exact du module ; `controles.ts` « dit ce qu'on en conclut et comment on le raconte ». (3) **Aucun test existant à amender** : la garde de population (`atteignabilite.test.ts:257-272`) épingle `['atteignabilite.ts','controles.ts']` et **la MENTION suffit à faire un porteur** — un module neuf la fait rougir. Coût : 271 → ~430 lignes.

**Q2** — `producteursParIndice` est lu **une fois** par appel, dans `EtatDuDossier`, et sa lecture est le **compte saturé ≥ 1**. `conditionAccomplissable` recalcule l'état à chaque appel : assumé (passe linéaire, `controlerDossier` se rappelle à chaque rendu).

**Q3 — Totalité par compilation, en DEUX endroits** : côté code `Record<PredicatId, …>` ; côté preuve **jamais en exportant la table** — un `Record<PredicatId, Temoin>` **dans le test**, chaque témoin portant un `produire(dossier)` qui bascule le verdict, patron **rouge-avant / vert-après** déjà en place (G1).

> **Contrainte la plus facile à rater** : les 4 prédicats tautologiques n'ont de « rouge avant » que sur une **référence pendante**, donc un dossier que le validateur refuse. C'est **légitime dans `atteignabilite.test.ts`** (précédent motivé l.231-255 : « une fonction totale s'éprouve sur ce que son type admet ») et **interdit dans `controles.test.ts` et côté feature** (KR-225).

**G4, garde du producteur négatif** (jumelle de G2) : `DELTAS` filtré sur `refKinds.includes('objet')` vaut `['donner_objet','retirer_objet']`. La table ne compte **que le premier**. Contrairement à `oublier_indice` que G2 imagine, **le producteur négatif existe déjà**.

**Q4 — Verdict BOTTOM-UP** : `predicat` → table ; `et` → toutes ; `ou` → au moins une ; `non` → `true` **sans descendre**. Un relevé plat à la `collectRefs` produirait des **faux positifs** sur une règle **bloquante**. Le coût se nomme : **une condition entièrement sous `non` est toujours déclarée accomplissable**. Corollaire : `dossier-minimal.json` porte précisément un `non` dans son `reussi_si_expr` — témoin naturel de cette clause.

**Message** : **UN seul constat par objectif**, qui **n'énumère aucun fait**. Motif déjà arbitré pour `MESSAGE_INDICE_SANS_RACINE` : les faits bloquants sont en nombre quelconque, nommer une cible obligerait à une seconde résolution et mettrait un terme interne dans la prose. Le OÙ **est** l'actionnable.

**Q5 — KR-226 : on REMPLACE le prédicat par une table ÉPINGLÉE.** Aujourd'hui `path.split('.')[0] !== constat.section` ne prouve qu'une **inégalité**. Demain, un `Record<Exclude<ControleId,'amorce-non-redigee'>, string>` épinglant `path → section` valeur par valeur, **total par compilation**, plus — **dans le même `it`** — `expect(SOURCE_CONTROLES).not.toContain("split('.')")`, déplacée depuis la l.1204 où elle est isolée. Les deux moitiés ensemble, parce que ni l'une ni l'autre ne suffit.

**Pourquoi ce n'est pas un relâchement** : sur les cinq règles livrées, une valeur épinglée **implique** l'inégalité actuelle et interdit en plus toute autre section — **strictement plus fort**. On durcit une garde et on cesse d'exclure `canon`.

**Le pouvoir séparateur se PROUVE en écrivant le mutant, au lot** (BUG-087) : implémenter `section: constat.path.split('.')[0] as SectionId` dans **une** règle et relancer. À vérifier, pas à croire : sur `depart-desert` la table rougit ; sur les deux règles `canon.*` **elle reste verte** — d'où la moitié balayage de source, qui rougit sur les sept. **Aucun chiffre de couleur au plan sans ce run.**

## D. Ligne de base — les assertions qui rougiront (L2)

| Fichier:ligne | Assertion | Cause |
|---|---|---|
| `controles.test.ts:504` | `rapport.controles` a `CHAMPS_SEMES.length` (4) | +1 sur `seme()` |
| `controles.test.ts:520-522` | tout message de `seme()` contient le marqueur | le message neuf ne le porte pas |
| `controles.test.ts:567` | `parSection.canon === 'alerte'` | devient `bloquant` |
| `controles.test.ts:488` | ids représentés === `Object.keys(CONTROLES).length` | 6 → 8 |
| `controles.test.ts:1222-1228` | rapport complet de `seme()` | +1 ligne |
| `panneauControles.test.tsx:86-90` | « Aucun contrôle à signaler » | **état vide inatteignable sur un dossier neuf** |
| `dossierEditorScreen.test.tsx:137` + `:384` | `BADGES_DOSSIER_NEUF[0]='ALERTE'` | devient `BLOQUANT` |

**À MESURER et non déduire** : `controles.test.ts:1231` (minimal) et `:1235-1243` (référence) — structurellement `objectif-sans-chemin` doit s'y taire, et `canon-sans-objectif` aussi. **Si ce silence n'est pas mesuré, l'itération part sur une supposition.**

**Témoin de `objectif-sans-chemin`, choisi sur le coût ET la légalité** : `pnj_a_revele` avec deux identifiants qui **résolvent** mais dont le personnage n'a aucun savoir pour cet indice. **Un seul champ muté**, dossier **validator-clean**, conforme KR-225.

## E. REJETÉ — à recopier au § 8

1. **REJETÉ — un module neuf `productibilite.ts`.** Il fait rougir la garde de population (la mention suffit à faire un porteur), et it6 a écrit que la clause KR-224 rejoint les hypothèses **d'`atteignabilite.ts`**.
2. **REJETÉ — la productibilité dans `controles.ts`.** Elle y remettrait du CALCUL dans le module qui CONCLUT et RACONTE, contre la couture épinglée dans les deux sens.
3. **REJETÉ — exporter `ETABLISSEMENT` pour la balayer.** Motif textuel du fichier sur `SITES_AVERTISSEMENT` : « l'exporter pour un test en ferait un contrat ».
4. **REJETÉ — un relevé plat des feuilles à la `collectRefs`, filtré ensuite.** Faux positifs sous `ou` et sous `non`.
5. **REJETÉ — descendre sous `non`.**
6. **REJETÉ — dériver le producteur d'objet de `refKinds.includes('objet')`.** `retirer_objet` partage ce `refKind` et est un producteur NÉGATIF — trou déjà réel, pas hypothétique.
7. **REJETÉ — un champ neuf sur `ConstatControle`** pour nommer le fait bloquant. Arbitrage d'it6 reconduit : état illégal représentable.
8. **REJETÉ — une troisième entrée de registre.** Deux CAUSES distinctes = deux `ControleId`, mais pas trois : ne pas scinder `objectif-sans-chemin` par configuration (KR-164).
9. **REJETÉ — sortir `conditionAccomplissable` par `brain/index.ts`.** Un seul appelant.
10. **REJETÉ (pour cette itération) — scinder `controles.ts` en registre + proses.** Besoin réel (880 → ~980 l.), mais collision avec les deux lots et toutes les gardes ancrées sur `SOURCE_CONTROLES`. **REPORTÉ** en tête d'it8.
11. **REJETÉ — étendre la règle à `echoue_si_expr`.** Une condition d'échec inaccomplissable ne rend rien injouable.
12. **REJETÉ — un troisième lot « réparation des lignes de base ».** Il nommerait `controles.test.ts`, que L2 possède déjà.

## F. Ce que je laisse au PM, sans veto

`canon-sans-objectif` (3 lignes de code) porte **100 % du rayon d'explosion inter-features** ; `objectif-sans-chemin` (l'essentiel du travail) n'en porte aucun et suffit **seul** à la phrase de démo **et** au témoin `canon.*` que KR-226 réclame. Si le comité veut resserrer, la coupe la moins coûteuse est de **reporter `canon-sans-objectif` à it8** : on y gagne 3 fichiers de test intacts et une itération à une seule phrase de démo. Décision de périmètre, pas d'architecture — je ne bloque pas.
