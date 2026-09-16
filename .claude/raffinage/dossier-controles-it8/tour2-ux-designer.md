# Tour 2 — `ux-designer` · `dossier-controles` it8

**RISQUE** — Les deux piliers de mon exception nommée sont tombés : le motif (`narratif-ia`, vérifié) et la remédiation qu'il inspirait (`tech-lead`, objectif creux). Sous ALERTE, « deux bloquants à la naissance » retombe à « un bloquant + une alerte » — mais AC2 reste fausse dans LES DEUX niveaux (QA), et un QUOI FAIRE qui s'éteint sur `{nom:'',…}` sans camp ni condition est une faute de précision de langage, pas seulement un défaut technique.

**OBJECTION** — J'accepte les deux nommément. **(`narratif-ia`)** Mon motif — « `objectifs` unique porteur de victoire/défaite, rien n'est jouable sans lui » — est **FAUX** : `charpente.fins[].condition_expr` termine seul, `objectif_atteint` est écarté des `PREDICATES`. Ingagnable ≠ injouable ; **je retire la phrase, verbatim**. **(`tech-lead`)** Mon QUOI FAIRE — « posez un objectif » — est satisfait par `handleAjouter` sans rien réparer ; **je ne le signe plus tel quel**.

**PROPOSITION** — Motif de remplacement, vérifié vrai, non recyclé : `objectifs` est l'unique porteur d'**ATTRIBUTION** d'une issue à un camp (`Objectif.camp`), et sa vacuité rend muette la règle sœur bloquante `objectif-sans-chemin`. Il justifie une ALERTE, jamais un bloquant. Je signe UNIQUEMENT ALERTE + variante CAPACITÉ.

**VERDICT** — Recevable sous réserve : ALERTE + capacité au plan, Set B repris mot pour mot, Set A (comptage) écarté.

---

## ANNEXE

### A — Réponse nommée au `narratif-ia` (le motif faux)

**Accepté sans réserve.** Ma phrase du tour 1 affirmait une injouabilité que le moteur dément. **Je retire** « sans lui aucune section ne peut jamais rendre l'aventure jouable » — elle ne reparaîtra dans aucun texte que je signe, à aucun niveau.

### B — Réponse nommée au `tech-lead` (l'objectif creux)

**Accepté sans réserve.** Sous la variante comptage, mon QUOI FAIRE est vrai au sens strict (un clic l'éteint) et **trompeur au sens réel** (rien n'est devenu vérifiable). Un texte que je signe ne peut pas dire « c'est réparé » quand ça ne l'est pas — **c'est mon terrain**, pas seulement celui du moteur.

### C — Statut de chaque position du tour 1

| Position | Statut | Motif |
|---|---|---|
| RISQUE — double bloquant + AC2 fausse | **MAINTENUE, révisée** | Le « double bloquant » ne tient que sous BLOQUANT. AC2 fausse sous les DEUX niveaux. |
| OBJECTION — définition incomplète | **MAINTENUE**, satisfaite ici | |
| PROP. 1 — textes exacts | **MAINTENUE, texte RÉVISÉ** | Path corrigé, navigation corrigée. |
| PROP. 2 — exception nommée, motif « jouabilité » | **RETIRÉE** | Motif démontré faux. |
| PROP. 3 — corriger AC2 en « … ET au moins un objectif posé » | **RETIRÉE dans sa formulation** | Impliquait une obligation façon bloquant. |
| « Deux réponses à deux questions » | **MAINTENUE, nuancée** | Répond à une question en AVAL de la légitimité de la règle. |
| Contestation du `path` | **RÉSOLUE** | J'adopte la clé du `tech-lead`. |
| REJETÉ 1-5 | **TOUS MAINTENUS** | |

### D — Répare, ou déplace ? Je tranche : **les deux, sur des cibles différentes**

- **Ce que ça répare** : un dossier à quatre proses réécrites et zéro objectif est étiqueté « calme » alors que rien ne peut jamais attribuer une issue à un camp, et que `objectif-sans-chemin` est structurellement aveugle (rien à parcourir).
- **Ce que ça NE répare PAS** : un dossier « calme » peut aussi n'avoir ni personnage, ni indice, ni **fin** — objectivement plus grave, et sans contrôle dédié. Poser une alerte sur `objectifs` ne corrige rien de ce manque-là ; **ça ne fait que ne PAS l'aggraver**.
- **Conséquence pour le plan** : vendre la règle pour ce qu'elle est — une alerte étroite — **jamais** comme « le dossier devient enfin honnête sur son état calme ».

### E — Textes exacts

**OÙ (commun)** : `"CANON · OBJECTIFS — attribution de l'issue à un camp"` *(remplace « victoire ou défaite d'un camp » : évite d'affirmer implicitement que « victoire ou défaite » dépend des objectifs — c'est faux.)*

**Set A — ALERTE + COMPTAGE — fourni, NON SIGNÉ.** `path: 'canon.objectifs[].camp'`. *Non signé : un objectif créé puis laissé creux éteint le voyant sans que rien ne soit devenu vérifiable.*

**Set B — ALERTE + CAPACITÉ — SIGNÉ.** `path: 'canon.objectifs[].reussi_si_expr'`
- **QUOI** : `"Aucun objectif ne porte de condition de réussite structurée : la partie se jouera et pourra se terminer, mais aucune victoire ni défaite ne sera jamais attribuée à un camp."`
- **QUOI FAIRE** : `"Ajoutez un objectif, son camp et sa condition de réussite structurée (Objectifs → Condition de réussite)."`

### H — REJETÉ (en plus des cinq du tour 1, tous MAINTENUS)

- **REJETÉ** — motif « objectifs unique porteur de victoire/défaite ». Mesuré faux.
- **REJETÉ** — signer Set A comme texte de livraison.
- **REJETÉ** — garder la navigation `(Canon → Objectifs des camps)` de mon texte du tour 1.
- **REJETÉ** — **tout niveau `bloquant` pour cette règle, sous quelque motif que ce soit.** Aucun motif restant ne le soutient.

---

## Notes de l'orchestrateur

**Retrait complet et explicite** : l'UX abandonne son motif ET sa position `bloquant`, et fournit le jeu de textes qu'elle refuse de signer plutôt que de le taire. C'est le comportement que la skill attend.

**MAIS sa correction de navigation est fautive, et elle contredit son propre REJETÉ 3 maintenu.** L'UX adopte `(Objectifs → Condition de réussite)` en citant « la convention mesurée dans la règle sœur `condition-sans-expr` » (`controles.ts` l. 504). Mesuré par moi :

- `ObjectifsCanon.tsx` n'écrit que `nom`, `camp`, `reussi_si_texte`, `echoue_si_texte`. Le champ étiqueté `"CONDITION DE RÉUSSITE"` (l. 311) est lié à **`reussi_si_texte`** (l. 316-321) — la prose.
- `reussi_si_expr` n'apparaît dans **aucun fichier de production** de `src/features/` (0 occurrence hors `specification.json`).
- `controles.ts` l. 403-405 (livré à it7) épingle le contraire de ce que l'UX cite : « ELLE NE RENVOIE PAS À "Objectifs → Condition de réussite", et **c'est mesuré** : cet écran n'écrit pas la condition structurée — la phrase nommerait une surface qui n'existe pas. »

**Conséquence : le Set B signé par l'UX est indélivrable**, et la « convention » qu'elle cite comme motif est un **défaut préexistant** livré à it5, pas une convention. Le `narratif-ia` arrive au même constat par son propre chemin. Arbitré au § 3 du plan.
