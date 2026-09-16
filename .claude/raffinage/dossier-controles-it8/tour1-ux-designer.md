# Tour 1 — `ux-designer` · `dossier-controles` it8 (`canon-sans-objectif`)

**RISQUE** — AC10 fait entrer une PREMIÈRE exception à la doctrine « collection vide = silence », déjà écrite noir sur blanc dans `design_contract.etat_vide` et redite dans `known_risks`. Si `canon-sans-objectif` s'allume à t=0 : (a) le panneau porte DEUX bloquants simultanés à la naissance (amorce + canon-sans-objectif), un cran au-delà du précédent accepté à it1 ; (b) AC2 (« quatre proses réécrites → texte d'état calme ») devient FAUSSE dès que la règle existe — réécrire les proses ne suffit plus, il faut AUSSI poser un objectif. Un test qui continue d'affirmer AC2 littéralement mentirait.

**OBJECTION** — la définition écrite (AC10) ne fournit ni message, ni OÙ, ni remédiation, ni le format « champ » requis quand la collection est vide (aucune entité à `localiserEntite`) : sans ça un ouvrier invente un texte — veto en puissance sur le registre de langue et sur KR-219.

**PROPOSITION** — (1) textes exacts en annexe, calqués sur le patron `DÉPART · TEXTE D'OUVERTURE` déjà en production ; (2) écrire `canon-sans-objectif` comme EXCEPTION NOMMÉE et justifiée à la doctrine du silence — jamais une réouverture générale — sur le motif : `objectifs` est l'UNIQUE porteur de victoire/défaite, sans lui aucune section ne peut jamais rendre l'aventure jouable, contrairement à personnages/indices vides qui restent des richesses optionnelles ; (3) corriger AC2 : « proses réécrites ET au moins un objectif posé ».

**VERDICT** — recevable sous réserve : (2) et (3) tranchés dans le plan, textes de l'annexe repris mot pour mot.

---

## ANNEXE — contrat de design

### Réponse à la question doctrinale

Le linter ne peut PAS se taire ici comme sur `personnages`/`indices` vides — mais ce n'est pas une réouverture de la doctrine, c'est une **exception nommée**. Motif à écrire dans la docstring (même geste que `depart-desert`, qui porte déjà trois gardes et sa prémisse écrite) : `canon.objectifs` n'est pas une collection de richesse narrative — c'est le SEUL endroit du schéma où une victoire ou une défaite est définie. Une collection vide n'y est pas un manque de contenu optionnel, c'est l'absence de la condition qui rend n'importe quelle autre section jouable. Cette règle est la **seule** exception admise à `etat_vide` ; elle ne généralise à aucune autre collection sans un raffinage dédié.

### Deux réponses à DEUX questions, jamais la même

- Le bouton pointillé `+ Ajouter un objectif…` de `ObjectifsCanon.tsx` (livré, INCHANGÉ) répond à « comment je répare », quand je suis déjà sur l'écran. Il porte le GESTE.
- Le voyant BLOQUANT du panneau répond à « est-ce que je le sais SANS ouvrir la fiche » — l'objectif même de la n° 7. Il ne porte JAMAIS le geste : sa remédiation RENVOIE vers l'écran qui le porte.

### Textes exacts (mot pour mot)

Entrée `CONTROLES['canon-sans-objectif']` (nom distinct, KR-164) :

- `niveau`: `'bloquant'` · `section`: `'canon'` · `entityId`: absent
- `path`: `'canon.objectifs'` — **CONTESTÉ PAR LA MESURE, voir notes de l'orchestrateur**
- **OÙ** : `"CANON · OBJECTIFS — victoire ou défaite d'un camp"`
- **QUOI** : `"Aucun objectif n'est posé : aucune victoire ni défaite ne peut jamais être établie, quel que soit le déroulé de la partie."`
- **QUOI FAIRE** : `"Posez au moins un objectif de camp (Canon → Objectifs des camps)."`

### Badge de la ligne `canon` (KR-218) — aucun travail neuf

`badgeSection()` gère déjà `compte === SANS_COMPTE` : le MOT seul à la place du tiret, jamais un second badge. Branche déjà exercée par `objectif-sans-chemin` depuis it7. Aucune ligne de `pastilles.ts` / `SectionNav.tsx` à toucher.

### REJETÉ (à recopier au § 8 du plan)

- **REJETÉ** — fondre `canon-sans-objectif` comme branche d'`objectif-sans-chemin`. Motif : KR-164, un code par CAUSE ; deux défauts distincts, deux remédiations distinctes.
- **REJETÉ** — un second badge/nœud « 0 objectif » sur la ligne `canon`. Motif : KR-218, déjà tenu par `badgeSection`.
- **REJETÉ** — remédiation pointant vers un écran qui ne pose pas le champ. Motif : précédent explicite d'it7 (`controles.ts` l. 403-405).
- **REJETÉ** — généraliser l'exception à `personnages`, `indices`, `lieux`. Motif : la doctrine de silence reste la règle par défaut.
- **REJETÉ** — laisser AC2 dire « quatre proses réécrites → état calme » sans amendement. Motif : devient factuellement faux dès que la règle existe.

---

## Notes de l'orchestrateur — trois affirmations passées à la mesure

| Affirmation | Mesure |
|---|---|
| `badgeSection()` gère déjà `SANS_COMPTE` sans second badge | **VRAIE** (`pastilles.ts` l. 78-90). Sa docstring dit même que `depart` et `canon` sont *exactement* les deux sections que les règles vivantes allument. |
| `ObjectifsCanon.tsx` porte l'eyebrow cité et `handleAjouter` écrit la collection | **VRAIE** (`ObjectifsCanon.tsx` l. 63 et l. 221). |
| `path: 'canon.objectifs'` | **FAUSSE AU CONTRAT.** `grep -c "'canon.objectifs':" destinations.ts` → **0**. Seules les feuilles `canon.objectifs[].{id,nom,camp,reussi_si_expr,reussi_si_texte,echoue_si_expr,echoue_si_texte}` existent. L'arbitrage d'it1 (**veto narratif RETENU**) impose que le `path` soit une clé LITTÉRALE de `DESTINATION_DES_CHAMPS`, épinglée par un test. Un contrôle dont le matériau est une ABSENCE n'a aucune feuille à désigner. **À trancher au tour 2 — c'est la question que le tech-lead avait reçue.** |
