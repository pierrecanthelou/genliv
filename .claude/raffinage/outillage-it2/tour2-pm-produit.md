# Tour 2 — `pm-produit`

**Au tech-lead, nommément** : nos positions sont compatibles, mon refus n° 1 se **corrige** plutôt qu'il ne cède. M3/M4 confirment que dès K ≥ 23/48, `floor(S/5)×5` plafonne à 90 — pas une cible choisie, l'effet **mécanique** du travail déjà spécifié (it1 § 2). Mon opposition visait une chasse inexistante : personne n'ajoute de scope pour atteindre 90, il tombe en finissant ce qui est dû. Je retire le chiffre comme problème ; je garde le principe — **rien au-delà des 48 mutants déjà nommés** — repris intact par son refus n° 8 et sa demande n° 1 (« zéro survivant non annoté », pas un score visé).

**Sur M7, périmètre** : la compaction n'étend pas B2, c'est la clause déjà écrite dans `WORKFLOW.md` (le lot qui franchit compacte dans son propre lot). **Conditionnelle seulement** : si les écritures réelles du lot C — un KR probable sur le ±1, une ligne de table remplacée dans `WORKFLOW.md` — franchissent 72 o ou 159 o, le lot C compacte lui-même ; sinon rien. Je refuse toute compaction **préventive** de fichiers non réellement touchés.

**Sur M5, périmètre** : le test instable de `panneauPersonnages.test.tsx` est hors `brain/`, hors les quatre fichiers mutés, découvert par accident. **Dette à déclencheur** : un bug loggé, pas corrigé ici — le réparer dans B2 gonflerait une tranche outillage au-delà de son mandat unique, exactement le biais que mon poste doit surveiller.

---

## ANNEXE

### Statut des trois objections du tour 1

1. **« Ne pas viser `break = 90` comme cible »** → **RETIRÉE** (le chiffre). Motif : M3/M4 montrent que `floor(S/5)×5` plafonne mécaniquement à 90 dès 23 mutants tués sur 48, **sans qu'aucun scope ne soit ajouté** pour l'atteindre — ce n'est plus une cible à choisir mais un plancher qui tombe en finissant le travail déjà spécifié. Le principe protégé (aucun scope au-delà des 48 mutants nommés) survit intact, porté par le refus n° 8 et la demande n° 1 du tech-lead.
2. **« Pas d'extension de `docs/REGLES-DU-JEU.md` § 3 au-delà des deux clauses »** → **MAINTENUE**. M1 change le motif (l'égalité des AT est une **transcription** depuis `REGLES-PLAY.md`, pas une règle neuve) mais **renforce** la conclusion : transcrire une règle déjà tranchée est encore moins un « design de règles » que je ne le pensais. Le plafond à deux clauses tient.
3. **« Périmètre limité aux 4 fichiers déjà mutés »** → **MAINTENUE**, inchangée par les mesures. `kinds.ts`, `equipment.ts` restent dette à déclencheur.

Aucune des trois n'est durcie en veto : ce sont des garde-fous de périmètre, pas des blocages — le découpage `A ∥ B → C` les respecte déjà.

### Phrase de démo (une proposition, sans « et »)

> « À la fin de cette tranche, l'équipe peut committer une itération sur `combat.ts`, `challenge.ts`, `xp.ts` ou `characteristics.ts` sans qu'aucun survivant non annoté ne se cache dans le score affiché. »

J'abandonne la seconde clause de ma phrase du tour 1 sur le ±1 : elle est absorbée comme **moyen** — le test à borne totale du tech-lead — pas comme critère de démo distinct.

### Hors périmètre définitif

- Toute modification de **logique** dans les 4 fichiers mutés — seuls tests et annotations Stryker prouvées ; à ce jour (M3) **zéro annotation d'équivalence due** sur `combat.ts:107-108`, donc zéro ligne ajoutée dans les 4 fichiers eux-mêmes.
- Seed ou refonte du `rng` de `combat.ts:107` (`PostureDescriptor.computeAT`) — le ±1 se règle par un test à borne totale, jamais par une modification de signature `brain/`.
- `docs/REGLES-DU-JEU.md` § 3 : uniquement les deux clauses — aucune autre réécriture.
- BUG-035, scission de fichier, toute autre ligne de la dette à déclencheur non nommée au cadrage.
- Le test instable `panneauPersonnages.test.tsx:800` — loggé en bug, jamais corrigé dans B2.
- `break` poursuivi pour lui-même — 90 accepté seulement comme conséquence mécanique.
- `kinds.ts`, `equipment.ts`, `bestiary.ts`, `monsterCapacities.ts`, `brain/dossier/**`, `src/features/**`.
- Compaction **préventive** de `code-knowledge.json` / couple `CLAUDE.md`+`WORKFLOW.md` tant qu'aucune écriture réelle du lot C ne franchit le plafond mesuré.

### Refus motivés

1. Viser `break = 90` comme objectif du plan — **retiré comme cible, maintenu comme principe** : conséquence acceptée, jamais un but qui justifie d'ajouter du scope.
2. Étendre `docs/REGLES-DU-JEU.md` § 3 au-delà des deux clauses nommées, **même sachant (M1) qu'il s'agit d'une transcription** — maintenu.
3. Étendre la phrase de démo ou le périmètre à `kinds.ts`, `equipment.ts` ou « toutes les features » — maintenu.
4. Compacter **préventivement** les trois fichiers proches du plafond (M7) avant qu'une écriture réelle de B2 ne les franchisse — refusé ; la compaction est conditionnelle, interne au lot C.
5. Corriger le test instable `panneauPersonnages.test.tsx` dans B2 — refusé ; hors `brain/`, hors mandat, découvert incidemment ; classé dette à déclencheur, loggé comme bug, repris par la feature qui rouvrira ce fichier.
