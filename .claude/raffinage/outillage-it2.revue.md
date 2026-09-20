# Revue d'exécution — tranche B2 `outillage-2` *(hors cycle de feature)*

> Plan de référence : `.claude/raffinage/outillage-it2.plan.md` (validé le 2026-09-20)
> Exécution : 3 lots, 2 vagues — `A ∥ B` → intégration → `C` seul
> État : **porte verte, rien de commité, aucun bump de version**
> Vérification indépendante : `qa` en **mode B**, contexte neuf, mandat adversarial

---

## 1 — En une ligne

Le score de mutation ne ment plus : **`combat.ts` passe de 62,50 % à 100 %**, le global de 81,40 % à **100 %**, et `break` monte de 80 à **90** — l'équipe peut désormais committer une itération sur les quatre fichiers de règles sans qu'aucun survivant non annoté ne se cache dans le chiffre affiché.

## 2 — Les chiffres, mesurés trois fois

| | mutants notés | tués | timeout | survécu | sans couv. | **`# errors`** | **score** |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Base 2026-09-20** | 258 | 209 | 1 | 39 | 9 | 0 | **81,40 %** |
| **Run 1** (lot C) | 258 | 257 | 1 | **0** | **0** | **0** | **100,00 %** |
| **Run 2** (lot C) | 258 | 257 | 1 | **0** | **0** | **0** | **100,00 %** |
| **Run 3** (qa mode B, indépendant) | 258 | 257 | 1 | **0** | **0** | **0** | **100,00 %** |

**Garde-fou « aucun fichier ne recule »** — les 4 scores recopiés du reporter `clear-text` :

| Fichier | Base | Livré | Δ |
|---|---:|---:|---:|
| `challenge.ts` | 86,84 | **100,00** | +13,16 |
| `characteristics.ts` | 94,12 | **100,00** | +5,88 |
| `combat.ts` | **62,50** | **100,00** | **+37,50** |
| `xp.ts` | 87,72 | **100,00** | +12,28 |

**Le ±1 est soldé** — et c'est une mesure, pas une déduction : **trois runs complets rendent les mêmes compteurs `killed`/`timeout` fichier par fichier**, au mutant près. La cause était `combat.ts:107:64`/`108:64` (`ObjectLiteral {} `), tués par coïncidence **1 fois sur 7** par l'assertion `ecart === 9` de `gameSystem.test.ts` ; ils sont désormais tués par une **borne** (voir § 5).

**Seuil écrit** : `S = 100,00 → break = min(floor(100/5)×5, 90) = 90`. `thresholds: { high: 95, low: 90, break: 90 }`. Aucun chiffre non mesuré.

**Le dénominateur n'a pas rétréci** — c'était le mode de panne nommé au désaccord 7 : `Ignored = 69`, **pas un de plus**, recompté indépendamment par la qa. `git diff` sur les quatre fichiers mutés : **vide**. Aucune annotation d'équivalence n'a été posée, parce qu'aucune n'était due.

## 3 — Critères d'acceptation

| # | Statut | Preuve |
|---|---|---|
| 1 — doc écrite avant les tests | **NON VÉRIFIÉ**, et compté comme tel | Le **résultat** est conforme : les deux blocs sont verbatim au § 3 du plan, aux emplacements prescrits, et la table d'Écart est **inchangée octet pour octet**. Mais un diff non commité ne porte pas d'ordre d'écriture : **personne ne peut trancher si la doc a précédé les `it`.** La qa le dit ainsi et je ne le requalifie pas. |
| 2 — borne défensive+bouclier, 6 mutants | **VÉRIFIÉ** | `107:64`, `107:74`, `107:75`, `108:64`, `108:74`, `108:75` tous `Killed`, **par le test nommé** (confronté au champ `killedBy`, test id 944). Plus un mutant posé à la main (§ 5). |
| 3 — `ecartBand` hors borne + égalité d'AT, 8 mutants | **VÉRIFIÉ** | `61:6`(×2), `61:25`, `61:36`, `61:51` tués par le test 947 ; `110:6`, `110:26`, `110:36`, `110:93` par les tests 946/949 nommément. |
| 4 — les 4 bandes, 7 mutants, champ par champ | **VÉRIFIÉ** | Tous `Killed`. **Aucun `toEqual` sur objet entier** dans les 4 fichiers neufs (vérifié) : chaque `quality` et chaque `label` porte son propre `expect`. |
| 5 — frontières `challenge` + `characteristics`, 3 mutants | **VÉRIFIÉ** | `challenge.ts:88:26`, `characteristics.ts:80:6`, `81:6` `Killed` par les tests nommés. |
| 6 — `challengeXp` bande facile, 2 mutants | **VÉRIFIÉ** | Résultat **1** confirmé sur le code réel ; `xp.ts:27:6` et `45:3` `Killed` ; **pouvoir séparateur prouvé par mutant posé** (§ 5). |
| 7 — `characteristicUpgradeCost`, 3 frontières | **VÉRIFIÉ** | 3 / 7 / 15 confirmés sur le code réel ; `86:6`, `87:6`, `88:6` `Killed` ; **pouvoir séparateur prouvé par mutant posé** (§ 5). |
| 8 — arbre fusionné, définition de fini | **VÉRIFIÉ**, avec une correction du critère lui-même | 48 mutants nommés `Killed`, 0 survivant, `# errors` = 0, trois runs identiques, `break` transcrit, `tsc` et `lint` propres. **Le critère écrivait « `npx jest` = 102 suites / 1750 tests » : c'est faux, et c'est un défaut de rédaction du plan** — 102/1750 est le socle **d'avant** la tranche. L'arbre fusionné fait **106 suites / 1770 tests**, soit exactement +4 fichiers et +20 `it`. Relevé par la qa, clos ici. |

## 4 — Diff par lot, comparé à la liste du plan

| Lot | Fichiers annoncés | Fichiers touchés | Écart |
|---|---|---|---|
| **A** | `src/brain/combat.test.ts` (N) · `docs/REGLES-DU-JEU.md` (R) | identiques | aucun |
| **B** | `challenge.test.ts` · `characteristics.test.ts` · `xp.test.ts` (N) | identiques | aucun |
| **C** | `stryker.config.mjs` · `docs/WORKFLOW.md` · `CLAUDE.md` · `docs/ROADMAP-BASCULE-IA.md` · `CHANGELOG.md` · `bug_history.json` (`_about`) | identiques | voir § 6 |

**Aucun lot n'a débordé.** Non touchés, vérifiés nommément : les 4 fichiers mutés, `gameSystem.test.ts`, `rules.golden.test.ts`, `src/player/**`, `src/features/**`, `jest.config.cjs`, `jest.mutation.cjs`, `.eslintrc.cjs`, `code-knowledge.json`, `package.json` (reste à `0.6.52`), `README.md`.

**Un fichier touché hors de toute liste de lot, et son motif** : `.claude/skills/raffinage-iteration/SKILL.md:188`, correctif **M5** de la revue de PR. Il portait un **troisième exemplaire vivant** du seuil (« Cliquet `break: 80`, plafond 90 »), devenu faux, dans un fichier que **chaque raffinage charge** — donc que le comité de la n° 11 lira. Le repli « dette à déclencheur » a été refusé pour le motif structurel déjà accepté au désaccord 23 : son déclencheur aurait été « le prochain comité de raffinage », c'est-à-dire exactement le lecteur qui se serait trompé. Le nombre a été **supprimé** au lieu d'être mis à jour, pour ne pas en créer un quatrième.

**`docs/REGLES-DU-JEU.md`** — **+10 lignes** (dont l'amendement M1, § 6.7), 0 suppression, § 3 seulement :

```diff
+> **AT égales** — si les deux AT sont identiques, l'assaut est **nul** : l'Écart vaut 0, la
+> qualité est **Manqué** (multiplicateur ×0) et aucun dégât n'est infligé de part ni d'autre.
+> La suite — rejouer un round — est de l'orchestration : `docs/REGLES-PLAY.md` § D2.
...
+> L'Écart se mesure entre un vainqueur et un perdant **désignés** : il est toujours ≥ 1. La
+> fonction qui classe les bandes est néanmoins **totale** — en deçà de 1, elle rend la qualité
+> **Manqué** (×0, aucun dégât), le cas de l'égalité d'AT ci-dessus. La résolution d'un assaut
+> n'appelle jamais la fonction en deçà de 1 : l'égalité est traitée avant, et pose elle-même la
+> qualité **Manqué**.
```

## 5 — Ce que la qa en mode B a fait, et que personne d'autre n'a fait

**Ni les deux tours de comité, ni la porte mécanique, ni les lots n'exécutent une phrase.** La qa a posé **trois implémentations fautives à la main** et vérifié qu'elles rougissent — restauration par copie de sauvegarde vérifiée par empreinte, **jamais `git checkout`** (KR-172) :

| Implémentation fautive | Fichier de test lancé | Résultat | Empreinte avant / après |
|---|---|---|---|
| `!!attacker.shield` → `!attacker.shield` | `combat.test.ts` | **ROUGE** — attendu 18, reçu 14 | `fb9c97cf…` / identique |
| corps du `case 'facile'` vidé (fall-through vers `equilibre`) | `xp.test.ts` | **ROUGE** — attendu 1, reçu 4 | `31175ca5…` / identique |
| `targetLevel <= 6` → `targetLevel < 6` | `xp.test.ts` | **ROUGE** — attendu 3, reçu 7 | idem / identique |

Elle a en outre confronté le champ `killedBy` de `mutation.json` **mutant par mutant** aux noms de tests, pour vérifier que chaque mutant meurt bien sous le témoin qui le vise et non sous un test hérité. Et elle a produit un **troisième run complet**, identique aux deux du lot C.

**C'est la différence entre « le score est à 100 % » et « les témoins gardent la source ».** Seule cette étape le dit.

## 5 bis — Revue de PR `tech-lead` : `CHANGES REQUESTED`, puis six correctifs

Verdict initial : **0 critique, 0 majeur, 6 mineurs must-fix**. Le fond n'a pas été contesté — zéro ligne de production, isolation intacte, assertions réellement séparatrices, seuil transcrit d'une mesure. Les six portaient sur des **valeurs de seuil vivantes en plusieurs exemplaires** et sur une **contradiction interne de la doc**, tous corrigés et re-passés à la porte.

| # | Constat | Correctif appliqué |
|---|---|---|
| **M1** | **Mes deux ajouts au § 3 se contredisaient.** L'ajout 2 écrit qu'à AT égales « l'Écart vaut 0, la qualité est **Manqué** » ; l'ajout 1 concluait « la résolution d'un assaut **ne produit jamais cette borne** ». Or `combat.ts:110` rend bien `ecart: 0, band: 'rate'` sur une égalité, et `combat.test.ts` l'assert. Ce qui est vrai, c'est que **`ecartBand` n'est jamais *appelée*** en deçà de 1. Dans un document dont le second public est l'implémenteur du moteur, c'était la seule ligne lisible comme « la qualité Manqué est inatteignable ». | Phrase réécrite pour viser **l'appel**, pas le résultat. **Aucune valeur de test ne change** — donc le verbatim du critère 1 est amendé, et c'est un écart consigné (§ 6.7). |
| **M2** | `docs/ROADMAP-BASCULE-IA.md:121` disait encore « les **sept** `bug_history*.json` » — alors que la tranche venait de corriger ce compte à **huit** dans `WORKFLOW.md:304` et dans le `_about`. La correction avait été appliquée à deux endroits sur trois, et **le troisième était la ligne dont le sujet est ce comptage**. Récidive exacte du désaccord 23. | `sept` → `huit`. |
| **M3** | La ligne de dette « Égalité d'AT × Garde aiguisée » portait `open_questions, propriétaire n° 11` dans la colonne **Déclencheur armé** — une destination, pas un déclencheur. Et c'est le motif même de l'écart 6.1 : `open_questions` n'a aucun support. **La ligne était désarmée : rien ne l'aurait fait partir.** | Déclencheur réel : « la n° 11, quand elle écrira la boucle de round de `combatEngine.ts` ». |
| **M4** | Le paragraphe descriptif de B2 au § 2 bis restait au présent avec **trois nombres devenus faux** : « relève `break` de 80 à **85** », « le score global **est** à 81,40 % », « `combat.ts` traîne à 62,50 % ». Un comité n° 11 y aurait lu un cliquet 80→85 que `stryker.config.mjs` dément — **le mode de dérive exact que cette tranche existe pour fermer.** | Paragraphe **compacté** en un état livré. Paie une partie des 1 242 o que la tranche avait ajoutés au roadmap. |
| **M5** | `.claude/skills/raffinage-iteration/SKILL.md:188` portait un **troisième exemplaire** du seuil, au présent : « Cliquet `break: 80`, plafond 90 ». Faux depuis cette tranche, et ce fichier est chargé par **chaque raffinage** — donc par le comité de la n° 11. | Le **nombre est supprimé**, pas mis à jour — pour ne pas recréer un quatrième exemplaire : « Cliquet et plafond : `docs/WORKFLOW.md` § Score de mutation ». Fichier **hors liste de lot**, consigné au § 4. |
| **M6** | Les trois fichiers du lot B ouvraient sur `describe('challenge.test.ts')` — **le nom du fichier**, lecture littérale de la notation `fichier › test` du § 7. Le lot A avait lu correctement. Quatre fichiers-modules incohérents **au moment précis où on arme leur fusion**. | Alignés sur le lot A : `challenge (paragraphe 2)`, `characteristics (paragraphe 1)`, `xp (paragraphe 5)`. |

**Un constat du tech-lead a été promu en dette armée** plutôt que corrigé ici : `gameSystem.test.ts:86` est aujourd'hui **le seul tueur** du mutant `margin >= 3 → > 3` de `xp.ts:48` (marge exactement 3, bande équilibré). La ligne de fusion au roadmap le porte désormais nommément — sans elle, la n° 11 aurait pu démanteler le fichier et faire retomber le score sous 90, **que le cliquet ne laisse pas redescendre**.

**Deux observations non bloquantes, laissées telles quelles** : `combat.test.ts:22` (`expect(typeof at).toBe('number')`) est subsumée par la ligne suivante — redondante, pas fausse, elle documente l'intention du mutant `ArrowFunction` ; et `combat.test.ts:38` (`damage === 0`) tire son pouvoir séparateur d'une multiplication par zéro (`damageFactor` de la posture défensive) — à regarder si la n° 11 touche `damageFactor`.

## 6 — Écarts assumés

1. **Quatre lignes de dette au roadmap au lieu de deux — et l'incohérence est de l'orchestrateur, pas du lot.** Le § 5 du plan (étape 7) autorisait « deux lignes (reports 1 et 3) » ; ma consigne de dispatch en demandait **quatre**. Le lot a suivi la consigne. **Je maintiens les quatre**, motif mesuré : **aucune feature `moteur-*` n'existe sur le disque**, donc l'`open_questions` de la n° 11 — destination écrite du report 2 — n'a **aucun support**. Idem pour le report 4. Les retirer perdrait de la dette armée pour la loger nulle part.
2. **Le critère 8 et le § 10 du plan citaient 102/1750 comme cible post-fusion** alors que c'est le socle pré-tranche. Défaut de rédaction du plan, relevé par la qa, corrigé au § 3 ci-dessus. La bonne lecture : **jamais moins de 102/1750, et 106/1770 après les 20 `it` neufs**.
3. **`.claude/raffinage/outillage-it2.revue.md` retiré du périmètre du lot C par l'orchestrateur.** Le plan le lui attribuait ; je l'en ai sorti au dispatch, parce qu'un lot ne peut pas écrire le dossier d'une vérification qui n'a pas encore eu lieu. La qa l'a légitimement signalé comme absent — **c'est ce fichier-ci**, et la séquence est : lot C → qa mode B → revue.
4. **Le `SEPT` → `HUIT` attribué à `CLAUDE.md` par ma consigne** vit en réalité dans `docs/WORKFLOW.md:304`. Le lot a appliqué la correction **là où le texte existe** au lieu d'inventer une occurrence. Bon réflexe, écart nul.
5. **Lot A n'a pas importé `maitriseDesCoups`, `WEAPONS`, `WeaponId`** bien que listés « consommés » au § 5 : aucun de ses 9 `it` ne les requiert, et un import inutilisé casse `tsc` (`noUnusedLocals`). `maitriseDesCoups` reste couvert par `gameSystem.test.ts`, gelé.
6. **Lot B n'a déclaré `const fixed` que dans `challenge.test.ts`** — seul fichier consommant une fonction à `rng`. Le déclarer inutilisé ailleurs casserait `tsc`.
7. **Le verbatim de l'ajout 1 au § 3 a été amendé après coup** (correctif M1), donc le critère 1 (« textes verbatim ») n'est pas tenu à la lettre. Motif : le texte que le plan faisait recopier **se contredisait avec l'ajout 2** — il niait une borne que `resolveAssault` produit réellement et que le test assert. **Aucune valeur de test ne change** (qualité, libellé, facteur, écart identiques) : l'amendement vise la phrase, pas la règle. Corriger valait mieux que livrer un verbatim faux dans la source de vérité.

## 7 — Ce qui a été refusé, et pourquoi *(un diff ne le dit pas)*

| Refusé | Motif |
|---|---|
| **Annoter `107:74/75`, `108:74/75` comme mutants équivalents** — recommandé par la note qa du tour 1 | **Réfuté par mesure.** Le nœud `[74,91)` est `!!attacker.shield`, le nœud `[75,91)` est `!attacker.shield` ; le mutant interne laisse le `!` extérieur en place, donc **les deux appliquent `shield: !attacker.shield`** — quatre **négations**, zéro équivalent. Les annoter aurait blanchi quatre mutants vivants **au moment exact où le seuil monte à son plafond**. La livraison le confirme : les quatre sont morts. |
| **Seeder le `rng` de `combat.ts:107`, ou rendre `rng` obligatoire** | Changerait `PostureDescriptor.computeAT`, signature `brain/` consommée par `combatEngine.ts` et `capacityEffects.ts`, et modifierait un fichier muté — dénominateur déplacé en cours de tranche. La borne règle le même problème à **zéro ligne de production**, et c'est ce qui a été livré. |
| **Tuer `107:64`/`108:64` par `jest.spyOn(Math, 'random')`** | Tue 2 mutants contre 7 pour la borne ; vrai pour **un** tirage contre **tout** tirage ; **mode de panne vert** (`restoreMocks` absent des trois configs jest — vérifié) ; et il épingle le **mécanisme de repli**, que la n° 11 pourrait supprimer, pas le comportement. |
| **La ligne `\| ≤ 0 \| Manqué \| ×0 \|` en tête de la table d'Écart** — proposée par le tech-lead lui-même au tour 1 | L'en-tête de la table **définit** l'Écart comme `AT_vainqueur − AT_perdant` : y écrire « ≤ 0 » affirme du faux dans un document dont le second public exige des formules sans ambiguïté. Remplacée par une **note de borne**. |
| **Sortir les 5 mutants de `combat.ts:61` du dénominateur par annotation** | Ils sont **tuables** — `ecartBand` est exportée, un appel direct suffit. Annoter aurait blanchi 5 mutants vivants et fait tomber le dénominateur de 258 à **253** : l'instrument rétrécit **en silence** au moment où on le lit. |
| **Écrire `break: 85` « par prudence »** | « Aucun chiffre non mesuré » vaut **dans les deux sens**. Et c'était sans enjeu : la n° 11 hérite de 90 dans les deux branches (85 + cliquet, ou 90 direct). |
| **Étendre `rules.golden.test.ts` aux bandes d'écart** | `ecartBand` est un **calcul**, pas un registre ; vérifié : les bornes `disable`/`restore` de `combat.ts` encadrent `POSTURES` **seul**. C'est le piège « plus » de la skill `table-doree`, dont `ecartBand` est le précédent nommément cité. |
| **Écrire les 21 tests dans `gameSystem.test.ts`** | Deux lots nommeraient le même fichier ; ~400 lignes (KR-112) ; et ce fichier portait le **seul tueur du mutant 192**, donc la base de comparaison. Gelé. |
| **Un helper `fixed()` partagé dans `brain/utils/`** | Un cinquième fichier **nommé par deux lots**. Une ligne dupliquée coûte moins qu'une collision de propriété. |
| **Qu'un lot de vague 1 consigne son score** | Dénominateur partiel (72 ou 186, pas 258) : `floor(S_partiel/5)×5` est plausible et **faux**, et le cliquet le rend définitif. |
| **Un KR neuf dans `code-knowledge.json`** | Marge **72 octets**. La leçon est une procédure d'instrument : son foyer est `docs/WORKFLOW.md`, en lecture obligatoire chaque session. **Conséquence assumée : B2 ne crée aucun `known_risks`.** |
| **Une entrée de bogue pour le ±1 dans `bug_history.json`** | Ce n'est pas un défaut découvert : c'est une **dette déjà documentée et assignée** par le roadmap. Et l'`_about` du fichier l'exclut mot pour mot : une leçon promue dans un instrument en lecture obligatoire « part à l'archive — la garder ici la ferait relire deux fois ». Ici elle est promue **deux fois** : un test permanent de la porte, une ligne de `WORKFLOW.md`. |
| **Corriger le test instable `panneauPersonnages.test.tsx:800`** | Hors `brain/`, hors les 4 fichiers mutés, découvert par accident. → dette à déclencheur. |

## 8 — Ce qui a été reporté, et où

| Report | Destination |
|---|---|
| Fusion de `gameSystem.test.ts` avec les 4 fichiers-modules | roadmap, dette à déclencheur — **la n° 11, quand elle rouvrira `challenge.ts`/`xp.ts`** |
| Égalité d'AT × compteur de Garde aiguisée (D2-bis) | roadmap, dette à déclencheur — propriétaire **n° 11** *(la destination écrite était `open_questions` ; aucune feature `moteur-*` n'existe encore)* |
| Test instable `panneauPersonnages.test.tsx:800` | roadmap — **le prochain lot qui rouvre `dossier-fiches`** |
| Le mot « manqué » en double emploi (`capacityEffects.ts:104`) | roadmap — **le lot qui rouvrira l'affichage de `combatEngine.ts` / `capacityEffects.ts`** (n° 9+) |
| `bug_history.json` à 562 o de son plafond | signalé au **prochain lot qui y écrit une entrée** : la scission part alors dans le même lot |

## 9 — Non vérifiable en l'état

- **Le critère 1** (doc écrite avant les tests) : le résultat est conforme, l'**ordre** ne l'est pas observable sur un diff non commité. Écrit comme non vérifié, pas requalifié.
- **Le risque de fuite d'un `jest.spyOn(Math,'random')`** — argumenté (`restoreMocks` absent des trois configs, vérifié), **jamais mesuré par une répétition dédiée**. Le refus tient sur d'**autres** appuis mesurés (2 mutants contre 7, mode de panne vert).
- **La cause du test instable `panneauPersonnages.test.tsx:800`** — **mesuré sur 9 runs complets aujourd'hui : 2 rouges**, dont un après les correctifs de PR (la suite entière rouge, ~16,9 s, sur ce seul fichier). **L'hypothèse `capacityEffects.test.ts` de l'orchestrateur a été infirmée** par sonde (12 runs ciblés, 12 verts). Cause **non établie** ; hors `brain/`, donc hors du périmètre de `jest.mutation.cjs` — il ne peut pas toucher la mesure de mutation. Armé en dette à déclencheur.

## 10 — Porte qualité

| | Résultat |
|---|---|
| `npx prettier --check` | propre |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur / 1 avertissement** — `CharacterCreationScreen.tsx:35`, préexistant, hors périmètre |
| `npx jest` | **106 suites / 1770 tests / ~18 s**, tout vert *(socle pré-tranche : 102 / 1750)*. Re-passé **4 fois** après les correctifs de PR : **3 runs à 1770/1770, 1 run rouge sur le seul `panneauPersonnages.test.tsx`** — instable connu, hors `brain/`, armé en dette (§ 9) |
| `npm run test:mutation` | **100,00 %**, 258 notés, 0 survivant, 0 `RuntimeError`, **3 runs identiques**. *Non rejoué après les correctifs de PR : aucun ne touche un fichier muté ni une assertion — seuls trois libellés de `describe` ont changé.* |
| Budget — couple `CLAUDE.md` + `docs/WORKFLOW.md` | 45 921 → **45 882 o** (plafond 46 080). Net **−39 o**, marge remontée de 159 à **198 o** |
| Budget — `docs/ROADMAP-BASCULE-IA.md` | 27 398 → 28 640 → **28 435 o** après la compaction M4 (plafond 30 720). Marge **2 285 o** |
| Budget — `bug_history.json` | 9 641 → **9 678 o** (plafond 10 240), `_about` seulement |
| `code-knowledge.json` | **non touché** — marge 72 o, aucun KR créé |
| `package.json` | **`0.6.52`, non bumpé** — étape 8, après approbation |

## 11 — `RETOUR-COMITÉ`

1. **Le découpage a tenu sans une seule collision.** Trois lots, listes disjointes, zéro fichier partagé, zéro message relayé entre ouvriers, zéro `BLOCAGE`. Les trois prédictions chiffrées du tech-lead (72, 186, puis `100,00 % / 258 / break 90 / deux runs identiques`) sont sorties **exactes**. Le seul vrai travail de découpage — réserver l'écriture du seuil à un lot unique de seconde vague — est ce qui a évité qu'un `floor(S_partiel/5)×5` plausible et faux devienne définitif par le cliquet.
2. **L'erreur la plus dangereuse du raffinage a été attrapée par une mesure de trois lignes.** Un rôle avait signé « équivalent réel démontré » sur quatre mutants qui étaient des **négations**. Le raisonnement sur le type était juste ; il portait sur un mutant que Stryker n'a jamais produit, parce que le champ `replacement` porte le texte du **nœud**, pas de la ligne résultante. La règle est désormais dans `docs/WORKFLOW.md` : *un mutant n'est équivalent qu'après un essai de meurtre écrit et échoué ; l'équivalence se lit sur la ligne mutée reconstruite*.
3. **Trois affirmations du tour 1 ont été retournées par la mesure, et une quatrième par la qa mode B.** Aucune n'aurait été vue par une relecture. Le coût unitaire était d'une commande.
4. **Deux défauts de ce plan viennent de l'orchestrateur, pas des ouvriers** : le socle 102/1750 écrit comme cible post-fusion, et la consigne de dispatch qui autorisait quatre lignes de roadmap là où le plan en écrivait deux. **Un plan et sa consigne de dispatch doivent être relus l'un contre l'autre** — l'ouvrier obéit à la consigne, et l'écart ne se voit qu'à la revue.
5. **L'isolation par worktree est inutilisable sur ce dépôt, et c'est mesuré** : jest ne découvre **aucun** test sous `.claude/worktrees/**` (0 match sur 402 fichiers — `jest-util` laisse un backslash littéral devant le segment `.claude`, même mécanisme que celui déjà documenté pour `.stryker-tmp`). Les deux ouvriers de vague 1 ont dû fabriquer un contournement pour se vérifier. **À ne pas réutiliser tant que ce n'est pas réglé.** S'y ajoute que la plateforme a créé les worktrees depuis `fc6dc28` (`0.6.50`), **deux releases derrière `main`** — sans conséquence ici (ancêtre, et les cinq fichiers touchés étaient identiques entre les deux bases), mais c'est exactement pourquoi le droit de mesurer appartenait au seul lot de seconde vague.
