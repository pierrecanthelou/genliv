# Tour 1 — QA · `dossier-format` it4

**RISQUE** — `DELTAS` est un registre **indexé par un nom d'opération venu du fichier de l'auteur** — exactement la classe qui a produit BUG-053 / KR-175 (`critical`) sur `PREDICATES` en it3. Le but n'écrit aucune règle d'admission ni aucune obligation de passer par `estCleDe` : le patron qui a coûté un `critical` la dernière fois se rouvre **sans garde nommée au raffinage**.

**OBJECTION** — le but cite « relations, presences, acces, mene_a » : zéro occurrence dans `types.ts`, décision A les a donnés aux features n° 4-6. Un critère écrit sur ce texte n'est observable par **aucun instrument**, faute de champ pour porter le test — c'est une définition de fini floue. Les trois champs réellement non résolus ne sont nommés que dans le cadrage, **pas dans le but que l'essaim exécutera**. BUG-050, condition fermée de la QA d'it3, n'apparaît dans aucun critère écrit.

**PROPOSITION** — matrice de rejet à 8 lignes (annexe), 12 tests nommés, et trancher **maintenant** un code neuf pour « opération delta inconnue » : `identifiant-invalide` / `reference-pendante` ne couvrent pas « nom d'opération absent du registre », qui n'est ni un identifiant ni une référence — motif identique à la création de `predicat-inconnu` en it3.

**VERDICT** — recevable sous réserve : (1) but réécrit avec les trois champs réels au lieu des quatre fantômes, (2) BUG-050 en critère explicite, (3) matrice de rejet écrite avant code (KR-158), (4) code d'anomalie neuf tranché, (5) garde `estCleDe` obligatoire sur tout accès à `DELTAS`, testée par test-grep.

---

## ANNEXE

### Matrice de rejet (KR-158 — écrite avant le code)

| # | Entrée fautive | Code attendu | Canal | `location` doit nommer |
|---|---|---|---|---|
| 1 | Nom d'opération absent de `DELTAS` (ex. `jalons[].effet[]` = `{operation:'inconnu'}`) | **à trancher** (proposition : `delta-inconnu`) | bloquant | l'entité porteuse (jalon/événement/quête/climat) par NOM + le nom d'opération fautif |
| 2 | Cible d'un delta (id objet/lieu/personnage/indice) sans entité correspondante | `reference-pendante` (réutilisé) | bloquant | l'entité porteuse + l'id fautif |
| 3 | Cible bien formée mais mauvais espace de noms (préfixe) | `identifiant-invalide` (réutilisé) | bloquant | idem #2 |
| 4 | Clé héritée du prototype (`toString`, `constructor`, `__proto__`, `hasOwnProperty`) en position de nom d'opération OU de cible | même code que #1/#2 selon position — **jamais** `ok:true` | bloquant | idem — régression nommée de BUG-053 / KR-175 |
| 5 | `savoirs[].indice_id` pointant un indice absent | `reference-pendante` | bloquant | le personnage porteur par nom |
| 6 | `revele_si.contrepartie.objet_id` pointant un objet absent | `reference-pendante` | bloquant | le personnage porteur (le savoir n'a pas de nom propre) |
| 7 | `revele_si.apres_indice_id` pointant un indice absent | `reference-pendante` | bloquant | le personnage porteur |
| 8 | Élément de liste non-objet dans une liste de deltas/savoirs (BUG-050 : `savoirs: ["texte"]`, `effet: ["texte"]`) | **à trancher** (proposition : `element-liste-invalide`) | bloquant | le champ porteur + l'index fautif |

### Tests nommés exigés

1. `DELTAS compte N entrees` — unitaire, discriminant, KR-117/165 (jumeau de « PREDICATES compte sept entrées » d'it3).
2. `un delta dont le nom n'est pas dans DELTAS est refuse par [code #1], nommant le champ porteur` — unitaire, KR-158/164.
3. `un delta dont la cible ne resout aucune entite est reference-pendante, nommant l'entite porteuse` — unitaire, KR-158.
4. `DELTAS['toString'] et DELTAS['constructor'] ne resolvent jamais une operation via la chaine de prototype` — unitaire, KR-175, **régression nommée directe de BUG-053**.
5. `savoirs: ['du texte'] est refuse, jamais ok:true` — unitaire, non-régression BUG-050 / KR-173.
6. `jalons[].effet: ['du texte'] est refuse, jamais ok:true` — unitaire, second site de la même famille.
7. `savoirs[].indice_id pointant un indice inexistant est bloquant, nommant le personnage porteur` — unitaire.
8. `revele_si.contrepartie.objet_id pointant un objet inexistant est bloquant, nommant le personnage porteur` — unitaire.
9. `revele_si.apres_indice_id pointant un indice inexistant est bloquant, nommant le personnage porteur` — unitaire.
10. `couverture.test.ts` — une assertion de **VALEUR** par nouvelle destination touchant `DELTAS` : inverser la destination d'un champ delta doit faire rougir un test. Jumelle de la correction BUG-051 / KR-174 — sans elle, « existence ≠ valeur » se rejoue à l'identique.
11. Test-grep : `aucun acces a DELTAS ne passe par 'in' ou un index direct hors estCleDe` — KR-175, même patron que les quatre sites fermés en it3.
12. `couverture.test.ts` en-tête : mise à jour de la section « CE QUE LE BALAYAGE NE COUVRE PAS » retirant la mention de BUG-050 une fois la table dédiée livrée — sinon la doc de l'instrument **ment sur son propre périmètre**.

### Non vérifiable par aucun instrument existant

- Toute assertion sur `relations`, `presences`, `acces`, `mene_a` tant qu'ils n'existent dans aucun type — non observable par construction (précédent : l'orientation de `lieux[].acces`, it3).
- **La fidélité de l'inventaire `DELTAS`** par rapport à `actionEngine.ts` / `sessionEngine.ts` / `xp.ts` : aucun instrument ne compare le registre à ses fichiers-source. C'est une lecture humaine, pas un test.
- « BUG-050 traité avant la première ligne de code » : aucun horodatage exploitable sur un arbre non commité (même limite qu'en it3).
- « Un delta est appliqué par le moteur, jamais injecté » au runtime : l'évaluateur part en n° 9 ; invariant non testable avant son existence.
- Table dorée : hors périmètre attendu pour `DELTAS`, même précédent que `PREDICATES` — à reconsidérer **seulement** si une entrée venait à porter un littéral numérique de règle.
