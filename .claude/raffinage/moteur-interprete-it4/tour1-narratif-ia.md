# Narratif & IA — Tour 1 — `moteur-interprete` it4 (budget par pas)

**RISQUE** — Si la cascade est mal ordonnée, elle efface la mémoire *de la session*, pas seulement le contexte d'un pas. Deux cas :
- Une tranche `A CONDENSER` envoyée sans `AUPARAVANT` : le résumé est remplacé par un condensé amputé de tout ce qui précède.
- Un bloc retiré alors que `condensation` reste non nul : `jusqu_au_pas` avance sur dix pas jamais lus.

La perte est définitive et silencieuse, et on la découvre au tour 40.

**OBJECTION**
1. « Suggestions retirées d'abord » n'a pas d'objet côté entrée. `tentatives` est une SORTIE du bloc atomique (KR-230), et aucun contexte n'en porte. Les interdire selon un mode changerait la validation : une seule piste proposée ferait refuser le récit entier. La dégradation produirait alors le silence qu'elle doit éviter.
2. « Les faits au-delà de K » est déjà livré : K vaut `FAITS_INJECTES_MAX`. `ETABLI` est le rempart du § 2.8 et n'est jamais un levier.
3. « Attendre indéfiniment » est une prémisse fausse. `max_tokens` et le rejeu unique limitent déjà un pas à quatre appels. La panne réelle est le silence (`trop-long`).
4. Point 3 (du cadrage) : l'inventaire est borné par le dossier (`avecAjout`, un ensemble inclus dans `monde.objets`). La borne est statique, donc elle se contrôle côté auteur.
5. `worker/index.ts:779` promet à l'it4 une borne client pour R1. Il faut soit la tenir (refus mesuré, sans cascade), soit réattribuer la promesse.

**PROPOSITION** — Des paliers discrets. On prend le premier qui tient, recalculé à chaque appel, sans rien stocker :
- **P1** : `RECEMMENT` ramené à ses `FENETRE_MIN − 1` lignes les plus récentes.
- **P2** : P1, plus `A CONDENSER` retiré en entier et `condensation: null`.
- **P3** : P2, plus `AUPARAVANT` retiré.
- Au-delà : `trop-long`.

L'état et `ETABLI` ne se dégradent jamais. Deux seuils dérivés : un état au-delà de 13 209 caractères gèle le résumé ; au-delà de 22 445, c'est le silence. Les deux vont en `open_questions`, propriétaire `dossier-controles`.

**VERDICT** — recevable sous réserve. Veto si l'état ou la validation se dégradent.

---

## ANNEXE — contrat R3 `narrateur` sous budget (hors quota)

### Entrée injectée
L'ordre des blocs est inchangé ; seuls les blocs mémoire varient selon le palier.

| Bloc | P0 | P1 | P2 | P3 |
|---|---|---|---|---|
| canon (3 chemins, quand écrits) | = | = | = | = |
| `AUPARAVANT` | si résumé | si résumé | si résumé | — |
| `A CONDENSER` | si dû | si dû | — | — |
| `RECEMMENT` | `(borne, t−1]` (≤ 13 lignes) | les `FENETRE_MIN − 1` = 4 plus récentes | idem | idem |
| `ETABLI` | `faitsPertinents` (≤ 8) | = | = | = |
| `ICI A1` · `CE PAS` · `EN SA POSSESSION` · `DEJA ACCOMPLI` · `saisie` | = | = | = | = |

- **Palier retenu** : le plus petit k tel que `texte(k).length ≤ BUDGET_CARACTERES_NARRATEUR`. Si aucun ne tient, `trop-long`. Aucune nouvelle constante : le budget reste celui de KR-261, et les planchers se dérivent de `coutDUnBlocPlein`.
- **Place libérée par palier** : P1 jusqu'à 7 209 caractères, P2 jusqu'à 8 023, P3 jusqu'à 1 213. Le plancher mémoire vaut 4 511 (`RECEMMENT` à 4 lignes, soit 3 215, plus `ETABLI` à 1 296).
- **P1 respecte le contrat gelé en it3** : la fenêtre injectée reste contiguë et d'au moins 5 pas (pas courant compris, puisqu'il est dans `CE PAS`). Le trou se trouve *avant* la fenêtre, de même nature que le « trou borné et nommé » de `pasACondenser`, et il est transitoire : les pas écartés restent au journal et seront condensés normalement.

### Invariants — chacun devient un AC avec un mutant vérifié rouge
- **I1 — `condensation` rendu = la tranche réellement envoyée** : non nul si et seulement si le bloc est présent.
  - Mutant : rendre `pasACondenser(session)` en P2.
  - Conséquence du mutant : un `condense` rédigé à partir du seul résumé serait accepté, et `jusqu_au_pas` avancerait sur dix pas jamais lus.
- **I2 — `A CONDENSER` présent et un résumé existant ⇒ `AUPARAVANT` présent.**
  - Scénario séparateur : pas 25, résumé couvrant jusqu'au pas 10, tranche 11–20 due, `RECEMMENT` déjà à 4 lignes (P1 ne libère rien), débordement compris entre 1 et 1 213.
  - Mutant « P3 avant P2 » : il garde la tranche et retire le résumé.
- **I3 — P1 passe avant P2.**
  - Scénario séparateur : pas 34, résumé couvrant jusqu'au pas 10, `RECEMMENT` à 13 lignes, débordement ≤ 7 209.
  - Mutant « P2 d'abord » : il rend `condensation: null`.
- **I4 — `RECEMMENT` garde au moins min(taille naturelle, 4) lignes, et ce sont les plus récentes.** Mutant : garder les plus anciennes.
- **I5 — Le suffixe d'état (de `ICI A1` jusqu'à la fin) et la table `ancres` sont identiques octet pour octet à tous les paliers.** Mutant : couper `EN SA POSSESSION`.
- **I6 — Canari ±1 caractère par palier**, avec la saisie comme levier (précédent it2).
- **I7 — Rien n'est écrit.** La session est identique avant et après l'assemblage, et aucun champ `palier` n'est ajouté au retour (KR-268 : il n'aurait aucun lecteur ; les tests lisent les blocs).

### Schéma de sortie : inchangé
- `{narration, tentatives, constats}` reste atomique (KR-230).
- `condense` n'est toléré que si `condenseDemande = (condensation !== null)`. Cette règle existe déjà ; seule change la source de `condensation`, qui suit désormais ce qui est envoyé.
- Invite, `GABARIT_SORTIE`, `max_tokens` et worker sont inchangés. `max_tokens` vaut 4000 (`worker/index.ts:682`) — pas 1200 comme l'écrit le cadrage au point 2 : 1200 appartient à un autre rôle, ligne 506.
- KR-273 s'applique : le modèle choisit la seconde forme d'après le contenu de la demande. Aucun mot de dégradation n'entre dans l'invite, et la voix ne change pas.

### Comportement en cas d'échec
| Situation | Comportement |
|---|---|
| Bloc atomique invalide | Inchangé : un rejeu sur le même contexte dégradé (calculé une seule fois avant la boucle), puis `illisible` → « Le récit n'a pas pu être généré. ». Le pas reste acquis. |
| `condense` présent en P2 ou P3 | Refus du lot (prédicat 2, KR-236), rejeu, puis dégradé. C'est le bon échec : le modèle aurait réécrit le passé sans avoir la tranche. |
| `condense` absent ou invalide en P0 ou P1 | Inchangé (KR-271) : la tranche reste due au pas suivant. |
| Aucun palier ne tient | `trop-long`, aucun `fetch`, même message. La seule cause possible est l'état, donc le dossier. |

**Risque résiduel nommé** : si l'état dépasse 13 209 caractères en permanence, P2 s'applique à chaque pas. Le résumé se gèle et un trou grandit entre le résumé et la fenêtre (les faits, eux, restent injectés). Même famille que l'`open_question` sur un `condense` qui échoue systématiquement, mais ici le déclencheur est déterministe et vient du dossier, donc calculable statiquement : le protocole `pireCasNarrateur` appliqué au dossier de l'auteur, comparé à `BUDGET − plancher`. C'est le second instrument de KR-261, et il lit la même constante.

---

## Décisions prises en autonomie faute de spécification
- **Sens de « suggestions retirées »** (entrée ou sortie) → ni l'un ni l'autre, ce n'est pas un levier. Le seul allègement de sortie légal est une conséquence de P2 : aucun condensé demandé, soit jusqu'à 1 200 caractères générés en moins → si c'est l'inverse (un mode de validation `tentatives: []`), une piste proposée fait refuser le récit entier, et il faut maintenir un second gabarit et une seconde invite.
- **Granularité de la cascade** → trois paliers discrets puis refus → si c'est ligne à ligne, une vingtaine d'états, un canari par ligne, et un arbitrage que personne n'a spécifié.
- **Place de la cascade** → dans l'assembleur (`contexte/narrateur.ts`) ; `memoire.ts` reste intact (contrat gelé, il ne fait que projeter) → si c'est l'inverse, le module pur de rétention apprend un budget de transport en caractères et l'emporte avec `src/player/` au moment de l'extraction.
- **Dégrader l'état (possessions, jalons)** → jamais → si c'est l'inverse, il faut inventer un ordre des possessions (une règle que l'auteur n'a pas écrite), et le narrateur raconte l'absence d'un objet que le moteur dit possédé.
- **`ETABLI` comme levier** → jamais, puisque K est déjà livré → si c'est l'inverse, on retire le rempart du § 2.8 contre « la porte qui redevient fermée », pour au plus 1 296 caractères gagnés.
- **Signaler le palier au modèle** → non → si c'est l'inverse, le modèle apprend la mécanique de mémoire et risque de la raconter.
- **Borne client de R1** → posée en objection, pas en veto (le 413 du worker borne déjà la requête) → si elle reste ouverte sans réattribution, la ligne 779 du worker promet une fermeture que personne ne livre.
- **Refus résiduel** → même message fixe, sans nouveau texte.

## Fichiers lus
`src/brain/copilote/contexte/narrateur.ts`, `src/brain/dossier/memoire.ts`, `src/brain/dossier/deltas.ts`, `src/brain/copilote/schemaSortie.ts`, `src/brain/CopiloteService.ts`, `src/brain/copilote/contexte/interprete.ts`, `worker/index.ts`, `src/brain/copilote/contexte.test.ts`, `src/features/play-mode/hooks/useTourDeJeu.ts`, `src/features/moteur-interprete/specification.json`, `.claude/raffinage/moteur-interprete-it3.plan.md`, `docs/PLAN-BASCULE-IA.dc.html`.
