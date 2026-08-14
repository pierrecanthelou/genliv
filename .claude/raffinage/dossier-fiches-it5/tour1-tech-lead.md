RISQUE — Le point de rupture est le hook, pas le schéma. Mesuré : `useEcriturePersonnages.ts` = 690 l. Coût réel d'une famille CRUD à ligne locale dans ce fichier : contre-mesures 112 l. de corps + 12 l. de types/graines ; plan d'actions 146 + 22. Les trois familles d'it5 sont plus lourdes (savoirs porte 4 portes, dont deux sous-blocs *totaux quand présents* à geste explicite — précédent `stats`/`duree`) : ~185 (relations) + ~120 (présence) + ~300 (savoirs) ≈ **+605 l. → ~1 295 l.**, 1,6× le seuil bloquant KR-112. Aucune variante de cette itération ne laisse ce fichier sous 800 sans scission.

OBJECTION — (1) La définition ANDe trois familles au coût de contrat **asymétrique** : savoirs coûte **zéro ligne** (vérifié : 9 destinations, 3 `REFERENCES_SIMPLES`, 5 `ENUMERES_FERMES`, 2 `CHAMPS_REQUIS` déjà écrits), relations+présence portent tout le lot contrat. La règle de découpage de la feature — « l'unité est la tranche de schéma qu'un lot contrat peut porter » — classe donc savoirs hors tranche : c'est un passager. Le périmètre complet demande 4 lots dont **deux nomment `FichePersonnage.tsx`** et trois le socle `commit()`/KR-197 : signature d'un surdimensionnement. (2) `intensite` ne doit **pas** réutiliser `CONFIANCES` : mêmes nombres, échelles différentes — la fusion que `CAMPS_PERSONNAGE` et `PorteeContreMesure` ont déjà refusée deux fois.

PROPOSITION — Couper : it5 = relations + présence + scission du hook (2 lots séquentiels) ; it6 neuve = savoirs, **zéro lot contrat, un seul lot** ; retrait → it7, caractère → it8. `presence[].quand` tranché **`auteur`**, aligné sur `but.echeance`.

VERDICT — **recevable sous réserve** (de la coupe ; veto sur tout découpage à ≥3 lots partageant `FichePersonnage.tsx` ou le socle).

---

## ANNEXE

### A. Mesure du hook, par famille (comptée sur le fichier réel)

| Zone | Lignes | Détail |
|---|---:|---|
| Imports + doc | 1–30 | 30 |
| Types de brouillon + graines | 31–118 | 88 (dont but 13, étape 22, CM 12) |
| `UseEcriturePersonnagesResult` | 119–149 | 31 (25 clés) |
| État + dérivé + retour neutre | 156–244 | 89 (bloc noop 20 l.) |
| Identité/camp/portée/objectif/stats | 246–340 | 95 (8 handlers) |
| `but` | 342–370 | 29 (2 handlers) |
| `plan_actions[]` | 372–517 | **146** (6 handlers + `etapesAffichees` + `effacerBrouillonEtape`) |
| `contre_mesures[]` | 519–630 | **112** (5 handlers + 2 helpers) |
| `refusAffiche` + repli par champ | 632–657 | 26 |
| `return` | 659–690 | 32 |
| **Total** | | **690** |

Projection it5 telle que définie : relations (4 champs, dont 3 à commit immédiat + branche ligne locale, forme `handleChangeDureeEtape` 20 l.) ≈ 185 ; présence (2 champs) ≈ 120 ; savoirs (2 requis + 1 prose + 4 portes dont 2 sous-blocs totaux) ≈ 300. **690 + 605 ≈ 1 295 l.** L'estimation la plus basse défendable (130/90/200) donne encore **1 110 l.** Les deux dépassent 800.

### B. Découpage retenu — it5 réduite à relations + présence : **2 lots, séquentiels, aucun essaim**

#### Lot 1 — `contrat` (seul, en premier)

| Fichier | N/R |
|---|---|
| `src/brain/dossier/types.ts` | R |
| `src/brain/dossier/tables.ts` | R |
| `src/brain/dossier/destinations.ts` | R |
| `src/brain/dossier/__fixtures__/dossier-minimal.json` | R |
| `src/brain/dossier/__fixtures__/dossier-reference.json` | R |
| `src/brain/dossier/couverture.test.ts` | R |
| `src/brain/dossier/validate.test.ts` | R |
| `src/brain/index.ts` | R |

`validate.ts` : **zéro ligne attendue** (boucles génériques, précédents it1/it3) — à **mesurer**, jamais à remplir pour honorer la liste de KR-190.

Signature exacte exposée (donnée immuable pour le lot 2) :

```ts
export const INTENSITE_MIN = -3
export const INTENSITE_MAX = 3
export interface Relation { cible_id: string; lien: string; intensite: number; secret?: boolean }
export interface Presence { lieu_id: string; quand?: string }
// sur Personnage :  relations?: Relation[]   presence?: Presence[]
```

Lignes de table (10 exactement) — `CHAMPS_REQUIS` : `relations[].cible_id`, `relations[].lien`, `presence[].lieu_id` ; `REFERENCES_SIMPLES` : `relations[].cible_id` (espace `pnj`), `presence[].lieu_id` (espace `lieu`) ; `ENUMERES_FERMES` : `relations[].intensite` (`INTENSITES`, dérivée des deux bornes comme `CONFIANCES` — **registre neuf, jamais `CONFIANCES`**, `requis: true`), `relations[].secret` (`[true, false]`, `requis: false`) ; `LISTES_OPTIONNELLES_STRUCTUREES` : `monde.personnages[].relations`, `monde.personnages[].presence`.

**Chemins terminaux neufs : 6** (`relations[].cible_id|lien|intensite|secret`, `presence[].lieu_id|quand`) — sous le plafond de 10 (KR-190). Destinations : `moteur`, `ia`, `moteur`, `moteur`, `moteur`, **`auteur`**.

Motif de `quand` → `auteur` : `lieu_id` est `moteur` (handle) ; injecter son seul qualificatif temporel donnerait au narrateur « à la nuit tombée » sans le lieu résolu, et le laisserait **placer un acteur que le moteur n'a pas placé** — n° 12 `moteur-acteurs`. Même forme que `but.echeance` et les `…_texte`, même clause de desserrage écrite : passe à `ia` le jour où n° 10/n° 12 livrent une projection de présence dérivée par le code **et** sa ligne d'audience.

#### Lot 2 — `feature` (seul, après contrat figé)

| Fichier | N/R |
|---|---|
| `hooks/useSocleEcriturePersonnages.ts` | **N** |
| `hooks/useEcritureIdentite.ts` | **N** |
| `hooks/useEcriturePlan.ts` | **N** |
| `hooks/useEcritureRelationsPresence.ts` | **N** |
| `components/BlocRelations.tsx` | **N** |
| `components/BlocPresence.tsx` | **N** |
| `tests/relationsPresence.test.tsx` | **N** |
| `hooks/useEcriturePersonnages.ts` | R (devient l'assembleur, ~110 l.) |
| `components/FichePersonnage.tsx` | R (câblage blocs 5/6, `BLOCS_VIDES` 4 → 2) |
| `components/BlocPlanActions.tsx` | R (imports de types de brouillon repointés) |
| `tests/fichePersonnage.test.tsx` | R |
| `tests/panneauPersonnages.test.tsx` | R |

Tailles visées après scission : socle ~150, identité ~140, plan ~340, relations+présence ~330, assembleur ~110 — **tous sous 400**, aucun sous-fichier au-dessus du signal. `PanneauPersonnages.tsx` (184 l.) reste **hors lot** : `UseEcriturePersonnagesResult` ne change pas de forme, seules des clés s'y ajoutent.

Point de rendez-vous interne (à écrire avant les sous-hooks, c'est lui qui porte KR-197) :

```ts
export interface SocleEcriture {
	dossierActuel: Dossier
	personnageAffiche: Personnage | undefined
	commit: (personnages: Personnage[], personnageId: string, opts?: { resout: boolean }) => EcritureDossier
}
```

`commit` et ses **deux** indexations KR-197 restent dans **un seul fichier**, jamais recopiées par famille : c'est la classe qui s'est présentée 4 fois dans cette feature, dont deux fois comme régression de son propre correctif.

### C. Pourquoi pas 3 ou 4 lots (le découpage révèle, il ne fabrique pas)

Tout lot « savoirs » et tout lot « relations » écrivent le tableau `sections` **et** `BLOCS_VIDES` de `FichePersonnage.tsx`, et consomment le socle. Le contrat inter-lots qui les décollerait serait un registre `SECTIONS_DE_FICHE` feature-local à un seul appelant — l'abstraction spéculative qu'it2 et it4 ont déjà refusée. La seule autre issue est 4 lots strictement séquentiels avec collision résiduelle : plus de passes de main, zéro parallélisme gagné. D'où la coupe en deux itérations plutôt qu'un essaim de façade.

### D. Points de vigilance pour le lot 2 (hors découpage)

- **KR-197 × 2 familles neuves** : le test qui prouve l'indexation exige **deux personnages distincts** ; un ajout réussi n'efface jamais un refus non résolu (`resout: false`).
- **BUG-064 / critère #11** : les blocs 5 et 6 doivent avoir leur test de **lecture au montage sans interaction**, sur deux personnages aux valeurs distinctes, le second atteint par un clic de ligne — sur des valeurs que le widget ne peut pas fabriquer (donc `intensite` ≠ 0, `quand` non vide, `secret: true`).
- **Sélecteur de cible** : options construites **depuis `dossierActuel.monde.personnages`** avec `localiserEntite('pnj', p, index)`, jamais une liste copiée. Auto-référence tolérée sans garde ni filtre (KR-194) — l'écrire, pour qu'aucun relecteur ne la « corrige ».
- **KR-021** : une `cible_id` devenue orpheline s'expose par `validateDossier`, elle ne se filtre pas au rendu. C'est ce qui rendra le refus de retrait réel à l'itération suivante (précédent `ObjectifsCanon`, no-op muet, KR-183).
- **`intensite` signée** : `Stepper` avec `min={INTENSITE_MIN}` / `max={INTENSITE_MAX}` et `prefix` — aucun `-3`/`+3` en dur (KR-165). Vérifier que `Stepper` accepte un `min` négatif avant de le supposer.
