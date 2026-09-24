# Tour 2 — pm-produit — moteur-dossier it3

RÉPONSE — **X-3** : la forme **UX** (lignes de journal, zéro fichier neuf dans `play-mode`) satisfait mon objection 1. « Voir » n'exigeait pas un composant dédié, seulement **un pixel réel** sur l'écran d'`EcranPartie.tsx` que l'auteur lit en Aperçu du jeu — le journal l'offre déjà, générique depuis it2. **Je retire donc `JalonsAtteints.tsx`** : le lot 2 du tech-lead se réduit à des **tests**, aucun fichier neuf en `play-mode`.

MES OBJECTIONS
- **Obj. 1 (rendu)** : **MAINTENUE, forme précisée** — pas de composant neuf, mais un critère assertant que **deux entrées `role:'moteur'` du même `tour`** s'affichent via `session.journal` (clé React `index`, **cas jamais exercé avant ce lot**).
- **Obj. 2 (post-commande)** : **condition de veto RETIRÉE** — tech-lead et narratif confirment **deux appelants** (`ouvrirSession` + `executerCommande` après commande acceptée). **MAINTENUE comme exigence de critère** : aucun des A–F de la QA ne teste un jalon devenant vrai **EN COURS** de partie, seulement à l'ouverture.

POSITION
**X-6** — j'arbitre **(a)** : la phrase de démo **change de sujet**, de « l'auteur voit » à « **le moteur fait s'atteindre, visible en Aperçu du jeu** ». **(b) est un veto de fait** : elle violerait la contrainte « une seule feature hors lot `contrat` », déjà consommée par `play-mode`.
**X-2** — **j'accepte l'amputation** : reporter la projection ne coûte rien à la phrase de démo, satisfaite par le journal seul (zéro lecteur non-test pour `projeterJalonsAtteints` aujourd'hui). **Je retire le critère C** de la QA.
**X-3** — tranché ci-dessus.

VERDICT — **recevable sous réserve** (mes deux critères entrent au lot).

REJETÉ (BUG-082) : **X-6(b)** la surface d'édition `Jalon.effet`/`declencheur_expr` en périmètre — **reportée à `dossier-registres`** · **`JalonsAtteints.tsx`** (composant dédié) · **le critère C** (projection des jalons en it3).

## Compte des critères, par valeur auteur (plafond 8)

1. **D** — correction jointe des cellules + oracle (KR-252)
2. **[PM] rendu** — deux lignes `moteur` du même tour
3. **[PM] déclenchement post-commande**
4. **B** — idempotence du journal (KR-247/248)
5. **A** — `evaluerExpr` lève (KR-238)
6. **E** — 4ᵉ lecteur d'`ExprNode`
7. **F** — audience de session étendue (KR-241)

**Total 7/8.** Si dépassement : **je sacrifie F puis E** — hygiène de contrat, zéro valeur auteur directe.

## Décisions en autonomie

- **Sujet de la phrase de démo**, non tranché par le cadrage → choisi « **le moteur fait s'atteindre** » plutôt que « l'auteur voit » → **si l'inverse** : la phrase reste **fausse** tant que `FicheJalon.tsx` n'écrit ni `expr` ni `effet` — un mensonge de démo qu'aucun ouvrier ne peut corriger dans ce lot.
- **Retrait du critère C** (projection), non explicitement tranché → retiré **avec le narratif** → **si maintenu** : un contrat sans lecteur de production, gonflage contraire à ma règle « je coupe, je ne gonfle pas ».
