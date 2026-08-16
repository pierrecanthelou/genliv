## Note Tech Lead — dossier-fiches it8, tour 2

**Réponse nommée à Narratif & IA (objection 2, `affinite` = « forme sans producteur ») — INFIRMÉE.** La distinction est architecturale, pas de commodité. La décision A interdit une forme dans le **document persisté** : `tier` aurait été une clé de `Personnage.stats`, écrite par l'auteur, validée, couverte, portée par `schema: 1` sans chemin de migration — coût permanent. `affinite` n'est pas un champ du dossier : c'est une propriété d'un **registre de code** (`CURSEURS`), absente de `types.ts`, `destinations.ts`, `validate.ts` et des fixtures. La corriger coûte une ligne de constante, zéro dossier invalidé.

Ta clause « si c'est de la présentation, qu'elle se présente », je la contresigne et la durcis en **condition** : `affinite` n'entre dans `curseurs.ts` **qu'avec son site de rendu** (label Stepper `COURAGE (CA)`, annexe UX) et un test qui assert l'abréviation, dérivé d'`Object.entries(CURSEURS)`. Sans ce site, littéral mort : je le retire et laisse le mapping en JSDoc.

**Patron `Relation.secret` pour `cede_si`** — confirmé, **découpage inchangé** : les deux sites (JSDoc `types.ts`, commentaire de ligne `destinations.ts`) sont déjà tous deux `R` du lot A — un agent, un commit ; zéro ligne `validate.ts` dans les deux lectures. Ne pas extraire le prédicat en constante partagée (JSDoc n'interpole pas ; abstraction à un appelant).

**Mes objections.** 1 (`affinite` ≠ `Characteristic`) : **MAINTENUE, DURCIE EN VETO** sur un point précis — tout import de `characteristics.ts`/`challenge`/`combat`/`xp` dans `curseurs.ts` est un veto : c'est la seule clause vérifiable de KR-193, et il bascule le fichier sous mutation + table dorée. 2 (`PARLER_REPLIQUES`) : **RETIRÉE** — QA (2) et UX (§ 2) convergent sur UI-only ; plus de contradiction à porter, elle devient une ligne de plan.

**VERDICT** — recevable sous réserve : (i) `affinite` livrée avec son rendu ; (ii) zéro import dans `curseurs.ts` ; (iii) sonde de couverture re-visée dans le lot A.

---

### Annexe (hors quota) — le découpage ne bouge pas

**Lots A / B inchangés** (table du tour 1 : `.claude/raffinage/dossier-fiches-it8/tour1-tech-lead.md`). Aucun fichier neuf, aucune propriété déplacée. Placement des demandes du tour 1 :

- **Clôture « plus aucun placeholder » (QA 3)** → lot **B**, dans `src/features/dossier-fiches/tests/caractere.test.tsx` (déjà `N`).
- **Non-régression 6 personnages (QA 4, critère #8)** → lot **A**, `src/brain/dossier/couverture.test.ts` + `validate.test.ts` (déjà `R`).
- **Borne `parler` — deux tests, pas un**, lot **B** : (i) 2 répliques persistées → CTA d'ajout **absente du DOM** ; (ii) document porteur de **3** répliques → **3 rendues**, CTA absente, **et `validateDossier` vert (zéro anomalie)**. C'est cette dernière assertion qui rend « UI-only » falsifiable : le jour où quelqu'un écrit une règle de cardinalité dans `validate.ts`, elle rougit.
- **Sonde discriminante** (`src/brain/dossier/couverture.test.ts:486`) → lot **A**. Point structurel à écrire au plan : le critère de clôture de QA implique qu'après it8 **aucun chemin de table ne reste non instancié** — la sonde ne peut donc plus se re-viser vers « la tranche suivante ». Elle se rebase sur un négatif **de forme de chemin**, comme le fait déjà la ligne 492 (`…personnages[].plan` vs `plan_actions`), et le commentaire acte que la sonde cesse de se déplacer. La supprimer reste exclu (KR-199 sur l'instrument).
- **Prédicat `cede_si`** : texte de l'annexe Narratif & IA collé **mot pour mot** aux deux sites du lot A, nulle part ailleurs.
