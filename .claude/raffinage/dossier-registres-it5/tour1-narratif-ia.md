# Tour 1 — `narratif-ia` · `dossier-registres` it5

```
RISQUE — L'itération referme la dernière racine du dossier sur un registre que le Temps 2 ne
peut pas lire. Le plan de cible engage l'inverse : « climat actif » entre dans le contexte de
scène assemblé (PLAN-BASCULE l.411) et dans le bandeau d'horloge (l.470). Après it5 telle
qu'écrite, un climat vaut id (moteur) + nom (auteur) + effets_regles vide (moteur) + une durée :
AUCUN champ `ia`. Deux issues à la n° 10, toutes deux mauvaises — soit le narrateur ignore à
jamais qu'il pleut des cendres, soit on lui injecte le libellé nu et il improvise le reste, à
chaque tour, sur le seul élément toujours chargé après le canon. Du lore que l'auteur n'a pas
écrit, produit en boucle.

OBJECTION 1 — Le critère 7 n'est pas seulement inutile, il est FAUX : « effets_regles reste un
Delta[] éditable via les opérations existantes ». Les quatre deltas admis sont PONCTUELS, un
climat est AMBIANT. `donner_objet` réappliqué à chaque pas d'horloge par la n° 14 est un
générateur d'objets infini. destinations.ts:513-518 et suffisance.test.ts (CIBLE_CLIMAT_EXCLUE)
épinglent déjà l'exclusion : le critère ouvre une porte que deux fichiers ferment.

OBJECTION 2 — Une `duree` en prose ne laisse PERSONNE éteindre le climat. `climat_actif` est un
état de session qui doit s'éteindre ; en français, seul le narrateur peut le décider. Terrain de
veto.

PROPOSITION — (1) `duree?: number` ≥ DUREE_MIN, audience `moteur`, une ligne dans CHAMPS_ENTIERS :
2 lignes de table, 0 machinerie neuve ; (2) un champ `ia` neuf, `manifestation?: string`, borné à
20 mots dans BUDGETS_DE_MOTS ; (3) critère 7 réécrit — effets_regles conservé au round-trip, SANS
éditeur.

VERDICT — recevable sous réserve (les trois propositions, ou leur repli écrit).
```

---

## ANNEXE

### A. Ligne d'audience proposée, champ par champ

| Chemin | Audience | Justification | Précédent |
|---|---|---|---|
| `climat[].id` | `moteur` **inchangé** | Un identifiant est un handle : le code résout, le modèle reçoit le contenu. | toutes les lignes `…[].id` |
| `climat[].nom` | `auteur` **inchangé** | Un libellé de registre n'est pas de la donnée de jeu ; le basculer pour une seule collection casserait la symétrie des onze `…[].nom` sans décision transverse. | KR-195 |
| `climat[].effets_regles` | `moteur` **inchangé**, sans `[]` | Un delta est appliqué par le moteur ; injecté, il apprendrait au modèle à modifier les règles lui-même. | `quetes[].recompense[]` |
| `climat[].duree` **(ENTIER recommandé)** | `moteur` | Un pas d'horloge est ce qui permet au CODE d'éteindre `climat_actif` ; en prose, seul le narrateur peut le faire. | `plan_actions[].duree` (« un moteur ne compte pas sur du texte libre »), `contre_mesures[].delai` |
| *repli si prose* : `climat[].duree_texte` (jamais `duree`) | `auteur` | Une durée en français reste une donnée d'horloge qu'aucune horloge ne fait tourner — et la clé DOIT changer (KR-198). | `quetes[].echeance`, `but.echeance` |
| `climat[].manifestation` **(neuf, proposé)** | `ia` | Seul champ qui rend « climat actif » injectable, et il est ÉCRIT PAR L'AUTEUR — la seule alternative à l'improvisation du modèle. | `indices[].formulation_joueur`, `quetes[].consigne` |
| + `BUDGETS_DE_MOTS` : `manifestation` → **20 mots** | — | Le motif de `BUDGET_MOTS_JALON` s'applique **en plus fort** : un énoncé de jalon n'est injecté qu'accumulé, une manifestation de climat l'est à CHAQUE tour. | `BUDGET_MOTS_JALON = 20` |

**Repli si `manifestation` est refusé** (coût nul, précédenté) : `destinations.ts` reçoit sur `climat[].nom` la clause déjà écrite deux fois dans ce fichier — *« AUCUNE PARAPHRASE tant que la n° 10 n'a pas livré un libellé dérivé PAR LE CODE et sa propre ligne d'audience »* — et la revue écrit noir sur blanc qu'**aucun champ de `climat` n'est injectable au Temps 2**. Ce qui n'est pas acceptable, c'est de livrer le registre en laissant la question muette.

### B. Position sur les trois tensions

**Tension 1 — `EditeurEffets` sur Climat : NON, et le critère 7 doit être réécrit.**
Un delta a une **date d'application** ; un climat n'en a pas. Les quatre entrées de `DELTAS` supposent toutes un instant. Posées sur un climat, la n° 14 n'a que deux lectures : une fois à l'activation — et alors ce n'est pas un climat, c'est un événement déguisé — ou à chaque pas d'horloge, et `donner_objet` devient une fontaine à objets pendant que `reveler_indice` déverse le carnet d'indices. Les deux corrompent l'inventaire et la connaissance du joueur sans qu'un dé soit lancé. C'est mon terrain, et `suffisance.test.ts` porte déjà la conclusion.

Réécriture du critère que je signe :
> *Étant donné un climat de la fixture porteur d'un `effets_regles: []`, quand le dossier est exporté puis réimporté, alors la liste vide survit comme une liste vide et non comme un absent, et **aucun écran de cette feature ne propose d'ajouter un effet à un climat** — l'absence d'`EditeurEffets` dans le lot Climat est prouvée par la liste de fichiers du lot.*

État vide de la carte : *« Aucun effet de règle. Les modificateurs chiffrés (PE, malus de jet) attendent une opération que le registre des effets ne porte pas encore. »* — sans promesse de date (propriété n° 11/n° 13, KR-208).

**À écrire dans la revue** : it5 referme la *racine* `conditions`, elle ne referme pas le **§ 09 du plan de cible** (« des effets chiffrés sur les règles »). Fin du Temps 1, cette phrase reste non tenue.

**Tension 2 — audience de la durée : `moteur`, et entière.**
Le précédent `Quete.echeance` ne s'applique pas : rien, dans le moteur, ne doit faire tomber une quête au temps. Un climat, si — `horloge.climat_actif` est un état de session qui s'allume **et s'éteint**, et la n° 14 est nommément chargée de son application. Une durée en prose laisse l'extinction sans propriétaire de code ; le seul acteur restant est le narrateur.

Sur KR-198 : la collision **disparaît** dans cette option au lieu d'être contournée. `plan_actions[].duree` et `climat[].duree` deviennent le même mot pour la même chose. L'homonymie n'est un piège que lorsque les deux sens divergent. À l'inverse, un `duree: string` rejouerait la collision, et je m'y oppose sous la clé `duree` quel qu'en soit le type.

Sur KR-174 : le critère doit épingler la **valeur** aux deux chemins, dérivée des mêmes tables, dans le même test — une assertion d'existence n'est jamais une assertion de valeur (BUG-051).

Coût comparé : option entière = 1 ligne `CHAMPS_ENTIERS` + 1 destination + un `Stepper` déjà écrit, aucune dispense. Option prose = 1 destination + 1 dispense `PROSE_D_ENTITE_LIBRE` + un champ que personne ne lit.

**Tension 3 — ce cas rouvre-t-il KR-195 ? Non.**
Basculer `nom` ne résoudrait pas le problème qu'on croit lui faire résoudre. « Cendres tenaces » est une étiquette de registre, pas une description. Un narrateur qui la reçoit invente la cendre, le vent, l'odeur, la visibilité — tout ce que l'auteur n'a pas écrit, différemment à chaque tour. La bonne question n'est pas « quelle audience pour `nom` ? » mais « **quel champ le narrateur lit-il quand ce climat est actif ?** ». Réponse : `manifestation`. KR-195 reste intacte, propriété de la n° 10.

### C. Contrat d'injection (opposable à la n° 10)

- **Entrée injectée** — au plus **UN** climat par tour, celui que `horloge.climat_actif` désigne, jamais la collection entière. Champ injecté : `manifestation`, **seul**. Borne : **20 mots**, constante nommée.
- **Schéma de sortie** — sans objet : le climat n'est pas un rôle. Aucun jet, aucun PV, aucune ligne d'inventaire, aucun XP n'est touché.
- **Échec** — `manifestation` absente ou vide : le bloc climat est **omis** du contexte. Jamais remplacé par le `nom`, ni par une paraphrase. Le repli est le silence. Dépassement du budget : avertissement non bloquant au lint de la n° 7 (précédent `BUDGET_MOTS_CANON`).
- **Mémoire de session** — hors périmètre et **non spécifiée par cette itération** : `climat_actif` est un état de session (KR-207), propriété de la n° 9.
