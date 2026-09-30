# Narratif & IA — Tour 2 — `moteur-interprete` it4

**RISQUE** — Deux façons de perdre la cohérence.
- Un plafond permanent `slice(-K)` fait oublier au narrateur, à chaque pas, des objets que le moteur tient pour possédés, même quand le budget tient.
- Un bloc `EN SA POSSESSION` absent dit au modèle « il n'a rien ». C'est faux, et le modèle le racontera.

**OBJECTION — au Tech Lead, nommément.**
- (a) **Concédé.** L'ordre d'acquisition existe déjà : `avecAjout` ajoute en fin de liste, et un objet repris après un retrait revient en fin. KR-013 tient. Mon argument du tour 1, « il faudrait inventer un ordre », tombe.
- (b) **Refusé.** `faitsPertinents` est un précédent de *mécanisme*, pas de *catégorie*. Il trie de la mémoire selon la pertinence ; `slice(-K)` coupe l'état selon la récence. Et K serait un chiffre non mesuré.
- (c) **Sur le fond, tu as raison.** Un refus permanent est pire qu'un inventaire partiel. Le moteur garde la vérité (`possede_objet` lit la liste entière), seule la vue de R3 rétrécit. Mon veto absolu ne tient pas.

**PROPOSITION — un palier P4 dégénéré, qui ne joue qu'après P3.**
- `EN SA POSSESSION` garde le plus long suffixe de `objets_possedes` qui tient dans le budget. Il n'y a pas de K : le suffixe se calcule en ligne, dans `narrateur.ts`.
- Ce suffixe n'est jamais vide et contient tout objet ancré dans `CE PAS`. Sinon, `trop-long`.
- Rien d'autre n'est coupé, et l'invite ne gagne aucun mot.
- L'AC « jamais un refus complet » est fausse, parce que la prose n'est pas bornée (KR-203). À la place : refus seulement si l'état minimal ne tient pas. Cette condition se calcule statiquement → `open_questions`, `dossier-controles`.

**Mes objections du tour 1**
- 1 (suggestions) : maintenue.
- 2 (`ETABLI`) : maintenue contre la proposition « 0 fait » du QA.
- 3 : maintenue.
- 4 : durcie.
- 5 : retirée, la formule partagée du Tech Lead y répond.

**VERDICT** — Recevable sous réserve. Veto maintenu contre tout plafond sur l'état entre P0 et P3.

---

## ANNEXE — contrat R3 amendé (hors quota)

### Entrée injectée : seul P4 s'ajoute à la table du tour 1

| Bloc | P0 à P3 | P4 (seulement si le texte de P3 dépasse `BUDGET_CARACTERES_NARRATEUR`) |
|---|---|---|
| `EN SA POSSESSION` | liste entière | le plus long suffixe qui tient |
| les autres blocs | comme au tour 1 | comme en P3 |

**Taille du suffixe**
- n = la plus grande longueur telle que le texte de P3, avec un suffixe de n objets, reste sous le budget.
- n_min = max(1, nombre d'objets obtenus au pas courant). Ils sont forcément en fin de liste, puisque `avecAjout` ajoute en fin (`deltas.ts:94-97`).
- Si n < n_min : `trop-long`.
- Le calcul se refait à chaque appel et rien n'est stocké (I7 tient).

**Ancres**
- Seuls les objets injectés reçoivent un rang.
- Un constat qui cite un rang absent est déjà refusé comme `rang-inconnu` (`schemaSortie.ts:1305`). Le modèle ne peut donc rien retenir sur un objet qu'il ne voit pas : les identifiants restent stables sans aucun code neuf.

**`ETABLI`**
- `faitsPertinents` ne change pas et continue de lire la liste entière (`memoire.ts:97`). Un fait sur un objet ancien reste injecté, et il reste vrai.
- **Placement dans `memoire.ts` refusé.** Le suffixe dépend du budget en caractères d'un rôle, c'est une question de transport, pas une politique de rétention. Le placer là invite à nourrir `faitsPertinents` de la liste tronquée, ce qui changerait `ETABLI` en silence.

**Proposition n° 3 du Tech Lead (suggestions)**
- D'accord si elle veut dire « zéro changement ».
- Masquer les suggestions en mode dégradé exigerait d'exposer le palier à la feature : un champ sans lecteur légitime (KR-268), et la fin d'une dégradation silencieuse.

### Invariants : chacun devient un AC, avec un mutant vérifié rouge
- **I5 amendé** : de `ICI A1` jusqu'à la fin, le texte est identique octet pour octet de P0 à P3. Mutant : plafond appliqué dès P0. Il sort rouge sur un scénario où P3 tient avec l'inventaire entier.
- **I8** : P4 garde les objets les plus récents. Mutant : `slice(0, n)`. Il sort rouge parce que l'objet obtenu au pas courant est en dernière position.
- **I9** : jamais de bloc absent quand `objets_possedes` n'est pas vide. On obtient `trop-long`. Mutant : accepter n = 0.
- **I10** : à P4, l'objet obtenu au pas courant garde le même rang dans `CE PAS` et dans `EN SA POSSESSION`. C'est une extension du test `contexte.test.ts:3301`.
- **I11** : canari à ±1 caractère aux deux frontières, P3/P4 et P4/`trop-long`, avec la saisie comme levier.
- **I12** : la session est identique avant et après l'assemblage. La vue du narrateur n'alimente jamais le moteur.

### Échec de validation : rien ne change
- Un rejeu sur le même contexte dégradé, puis `illisible`.
- Si P4 est impossible : `trop-long`, avec le même message fixe. Cela rejoint le KR-274 proposé par le QA.

### Risque résiduel nommé (à vérifier en playtest, pas avec jest)
- L'invite (`worker/index.ts:642`) présente le bloc comme « ce qu'il a sur lui », donc à P4 le modèle le lit comme exhaustif.
- La règle « tu n'ajoutes rien que la demande ne décrit pas » empêche le modèle d'inventer l'objet manquant, mais pas d'écrire une phrase d'absence.
- Aujourd'hui, aucune commande ne prend d'objet en cible : il n'y a que `aller` et `agir` (`commandes.ts:82-91`). Aucune résolution du moteur ne peut donc contredire la narration.
- **Déclencheur nommé** : la première commande qui prend un objet en cible devra faire entrer cet objet dans n_min.

## Décisions prises en autonomie faute de spécification
- K fixe ou suffixe ajusté au budget → suffixe ajusté, sans constante → avec un K fixe, on a un chiffre non mesuré qui coupe quand le budget tient et ne suffit pas quand il ne tient plus.
- Où vit P4 → dans `narrateur.ts` → dans `memoire.ts`, la rétention apprend le budget d'un rôle, et `ETABLI` risque de dériver en silence.
- Suffixe vide à P4 → `trop-long`, pas de bloc absent → si c'est l'inverse, le modèle raconte un héros les mains vides alors que le moteur dit le contraire.
- `DEJA ACCOMPLI` coupé lui aussi → non. Les jalons sont bornés par la charpente, et l'ordre de `projeterJalonsAtteints` n'a pas été vérifié comme un ordre d'acquisition → si c'est l'inverse, il faut justifier un second ordre. Le résidu est couvert par la vérification statique.
- Signaler la troncature au modèle → non, jamais (KR-273) → si c'est l'inverse, un mot de mécanique entre dans l'invite, ou le modèle devine les objets manquants.

## Fichiers lus pour ce tour
`.claude/raffinage/moteur-interprete-it4/tour1-*.md`, `src/brain/copilote/contexte/narrateur.ts`, `src/brain/dossier/deltas.ts`, `src/brain/dossier/commandes.ts`, `src/brain/copilote/schemaSortie.ts`, `worker/index.ts`.
