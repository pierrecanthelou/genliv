# Tour 2 — `qa` · `dossier-format` it2

**1. Instrument de descente dans les tableaux.** `cheminsDuDocument` s'arrête à 2 niveaux et exclut `Array.isArray` (vérifié, l. 419-421). Spec de l'instrument qui marche : récursion **pleine profondeur** sur la **fixture**, jamais sur les types (un type n'existe pas à l'exécution, aucun test ne peut l'interroger). Pour un tableau, descendre dans `[0]` avec suffixe `[]` dans le chemin (`personnages[].savoirs[].revele_si.jet.carac`), sans plafond de profondeur — **le plafond à 2 est la cause du trou, pas un détail**. **Un seul walker corrigé, exporté une fois**, réutilisé tel quel par `couverture.test.ts` et par le test d'exhaustivité de `DESTINATION_DES_CHAMPS` : deux walkers réécrits séparément divergeraient silencieusement (l'un recurse les tableaux, l'autre pas) et on perdrait la garantie sans rougir.

**2. `@ts-expect-error` : recevable.** Il vit sous `tsconfig.include=["src"]`, donc sous la porte. Si le type s'élargit et que l'erreur cesse, TS lève « Unused '@ts-expect-error' directive » → `tsc` rouge. Preuve valide mais **ponctuelle** : elle prouve qu'**une** forme fautive nommée est rejetée, pas l'absence de toute autre voie d'élargissement. **Un par risque nommé, pas un général.**

**3. Golden `templateId` : déjà livré, pas un critère d'it2.** `rules.golden.test.ts:346-368` épingle **22** `templateId` par valeur et par ordre (`narratif-ia` dit 23 — **mesure fausse**, `toHaveLength(22)`). Le renommage d'un monstre rougit déjà cette suite. Non-régression **existante**, à citer, pas à créer.

**4. Fini par instrument, pas par préférence.** `monstre_ref` seul : observable directement. Le périmètre élargi l'est aussi **sauf** la construction de `ProjectionCharpente` — `narratif-ia` le dit elle-même : ça dépend de `session`, ça se construit en n° 9/10. **Tout critère qui la nomme aujourd'hui doit sortir du plan d'it2.**

**5. Le balayage `/^↪ /` n'attrape pas un `{champ}` résiduel** — il vérifie le préfixe, pas l'absence de marqueur. À étendre : `expect(rendu).not.toMatch(/\{[a-z_]+\}/)` généralisé à **tous** les codes, pas seulement `{racine}`.

## Statut de mes objections

| # | Statut |
|---|---|
| Constat de l'angle mort des tableaux | **MAINTENUE**, avec la spec ci-dessus |
| Point 6 / `meta` fantôme | **RETIRÉE** — `tech-lead` retire `meta` comme racine |
| Cas nommés par champ + roundtrip | **MAINTENUE** pour les 5 champs de forme |
| Volet `ProjectionCharpente` | **DURCIE EN VETO** — aucun critère d'it2 ne peut nommer sa forme finale |

## Critères observables (périmètre recommandé)

`monstre_ref` pendant → `validate.test.ts` + `BESTIARY_BY_TEMPLATE` · `portee` hors énumération → `valeur-hors-enumeration` · les 4 chemins de delta non-prose → cas nommés + roundtrip · bornes `CONFIANCE_MIN/MAX` et `BUDGET_MOTS_JALON` → tests limite / limite+1 · `DESTINATION_DES_CHAMPS` exhaustive → walker corrigé unique · élargissement de type bloqué → `@ts-expect-error` ciblé · marqueur `{champ}` résiduel → regex étendue.

**Non vérifiable maintenant, à écrire hors périmètre** : forme finale et dérivation-libellé de `ProjectionCharpente`, et tout ce qui dépend de `session`.
