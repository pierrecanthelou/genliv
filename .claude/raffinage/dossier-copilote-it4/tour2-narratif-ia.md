# Tour 2 — `narratif-ia` · `dossier-copilote` it4

**RÉPONSE NOMMÉE — `tech-lead`, mesure 5 / § 7.** Le fait est **exact et vérifié** (`registres.ts:26-40`) : `personnage-prose` reçoit `synopsis_mj` **et** écrit `description_joueur`. **Mais « dominance » est une pente, et une pente ne tranche pas.** Voici le booléen :

> **TEST DE RATIFICATION** — à l'instant d'accepter, l'auteur a-t-il **une fiche écrite par lui** contre laquelle lire la prose publique ? **Oui** (it1, entité existante) ⇒ la fuite est **différentielle, elle détonne**. **Non** (it4, l'entité n'existe pas) ⇒ **la fuite est INDISCERNABLE DE L'INVENTION RÉUSSIE.**

⚠ **Ton REJETÉ n° 2 trace déjà cette ligne** — « rendre représentable une demande de prose sur une entité qui n'existe pas » — **et ton § 2 en livre la substance par une autre porte. Les deux ne tiennent pas ensemble.**

**R1 — JE LA REQUALIFIE MOI-MÊME EN OBJECTION FORTE, PAS EN VETO.** Mon veto couvre dés/stats/inventaire/XP, schéma absent, règle dupliquée, référence par nom libre, contexte sans borne, mémoire non spécifiée : **l'audience d'un champ de document n'y est pas**, et l'y forcer **userait le veto avant la n° 12, qui en aura besoin**. **Elle gagne sur le fond** : `plan.ts:94-96` refuse `'cible-a-ecrire'` à toute fiche **sans `but.libelle`** — champ qu'**aucun rôle livré n'écrit**. `fonction`+`but` ⇒ **quatre** rôles ouverts sur la fiche acceptée ; `fonction`+`description_joueur` ⇒ **trois**, et ce champ-là était **déjà à un clic**. **Meilleur, pas seulement plus sûr.**

**R2 maintenue** · **R3 maintenue et confirmée par son propriétaire** · **R4 maintenue, veto conditionnel**.

**Deux concessions sur argument** : **`'monde-distribution'`** — *une clé de route se nomme par sa destination, qui ne bouge pas ; le contexte, lui, a bougé à chaque itération, et `monde-` est le seul préfixe qui dise « aucune entité cible »*. **Et `canon.mj.synopsis_mj` en PREMIER requis** : *un refus nomme le sujet manquant, pas le style.*

**VERDICT — recevable sous réserve (R2, R3, R4) ; R1 rétrogradée en objection forte, arbitrable sur le fond.**

---

## § 1 · `but.libelle` contre `description_joueur` — décidable, et sur le fond

La question était : *meilleur, ou seulement plus sûr ?* **Meilleur**, par quatre mesures dont **trois sont vérifiables dans le dépôt aujourd'hui**.

1. ⚠ **CHAÎNAGE, VÉRIFIÉ À LA LIGNE.** `contexte/plan.ts:36` nomme `CHEMIN_BUT_CIBLE = 'monde.personnages[].but.libelle'`, et `:94-96` **refuse `'cible-a-ecrire'` dès que ce chemin ne résout pas**. **Une fiche acceptée sans `but` est refusée par un rôle DÉJÀ LIVRÉ.** Avec `fonction`+`but.libelle`, la fiche ouvre immédiatement `personnage-prose`, `personnage-repliques` et `personnage-relations` (disjonction d'identité, `repliques.ts:82` / `relations.ts:149` — `fonction` suffit) **et `personnage-plan`**. Avec `fonction`+`description_joueur` : les trois premiers, **et `personnage-plan` REFUSE**. ⚠ **L'itération 4 est la dernière : elle doit livrer une fiche que les cinq rôles précédents savent lire.**
2. **LE SEUL TROU DU DISPOSITIF.** `CHAMPS_PROPOSABLES` = `fonction` · `apparence` · `description_joueur`. **`but.libelle` n'est écrit par AUCUN rôle** — ni proposable, ni cible. `description_joueur` l'est, **en un clic après acceptation**. Mettre `description_joueur` ici **double une capacité livrée et laisse le trou ouvert** ; `but.libelle` **le ferme et laisse l'autre à un clic**. **Le choix n'est pas symétrique.**
3. **CE QUE L'AUTEUR TRANCHE RÉELLEMENT.** Une *distribution* est un ensemble de **forces en tension**. Deux gardes de même `place` aux `poursuite` **opposées** sont **deux personnages** ; deux gardes de même `place` aux `reputation` différentes sont **un personnage décrit deux fois** — et **le tech-lead lui-même écrit (§ 7) que rien ne peut constater ce doublon**. `but.libelle` porte donc **la DISCRIMINATION** ; `reputation` et `place` répondent tous deux à « qui est-ce », **jamais à « qu'est-ce que cette personne fait à mon histoire »**. Cela répond aussi au **PM** : sa demande est **satisfaite et dépassée** — les deux champs sont **requis**, et `apparence`/`description_joueur` ne sont pas « optionnels sans garantie » comme il l'accepte en échange : **ils sont ABSENTS** (KR-221).
4. **AUDIENCE, EN DERNIER ET NON EN PREMIER.** C'est l'argument de sûreté — **il vient confirmer les trois précédents, il ne les porte pas.**

⚠ **CONSÉQUENCE SI LE COMITÉ TRANCHE QUAND MÊME POUR `description_joueur`** : le **REJETÉ n° 2 du tech-lead perd son motif** et `CHAMPS_PROPOSABLES` doit être **rouvert dans le même lot** — on ne peut pas interdire la représentation d'une demande **et en livrer la substance par un autre type**. **Les deux décisions sont COUPLÉES ; qu'elles soient prises ensemble.**

## § 2 · `qa` — la liste vide pour la CRÉATION : **il n'y a pas de troisième cas**

**La dichotomie n'est pas le critère — elle en est la conséquence.** Le critère, unique :
> **La liste vide porte-t-elle une information que le code n'a pas ?**

- **Désignation** — le code a fourni l'ensemble des candidats ; « aucun ne convient » est **une réponse**, un fait que le code ne pouvait pas établir ⇒ **vide = succès**.
- **Rédaction** — le modèle produit de la matière ; « je n'ai rien écrit » n'est pas une réponse, c'est **une non-exécution** : le code savait déjà qu'il n'y avait rien, **c'est pour ça qu'il a demandé** ⇒ **vide = refus**.

**Création** : il n'existe **aucun ensemble de candidats à épuiser** — c'est exactement le motif pour lequel ton point 3 et le REJETÉ n° 3 du tech-lead écartent tous deux `'aucun-candidat'`. **Sans ensemble, la vacuité ne peut rien signifier.** La réponse est donc la même : **REFUS, motif `'vide'`**. ⚠ **Le troisième cas ne se referme pas par convention : IL N'A PAS D'INSTANCE.**

**Deux corollaires** : `'rang-inconnu'` reste **sans objet**, écrit comme tel, **jamais rejoué par symétrie** — *trois rôles le disent maintenant* · **l'invite et le validateur ne doivent se contredire nulle part** : si le comité renversait vers « vide = succès », **la ligne « et au moins une » doit tomber dans le même lot**.

**Sur ton RISQUE, que je soutiens sans réserve** : l'espion sur le **site d'appel** est la seule preuve que « brouillon sans identité » n'est pas une formule. **Témoin narratif à ajouter** : *refuser une fiche ne consomme aucun identifiant*, donc **deux acceptations après trois refus donnent deux identifiants, pas les 4ᵉ et 5ᵉ d'une série précalculée**.

## § 3 · Contrat révisé — `'monde-distribution'`

**Contexte — CINQ chemins**, tous `'ia'`, `DEROGATIONS_AUDIENCE` vide : `canon.mj.synopsis_mj` (**requis n° 1, LA SOURCE**) · `canon.ton` (**requis n° 2**) · `canon.interdits_ton[]` · `canon.partage.accroche_joueur` · `monde.personnages[].fonction` (**liste négative**, sans rang, bloc `DEJA ECRIT`, `DEJA_ECRITS_MAX = 12`, **bloc absent si zéro**).

**Retirés** : `description_joueur` (*montrer huit réputations publiques invite à en écrire une*) · `but.libelle` (⚠ *c'est **la moitié de ce que le modèle écrit** ; l'injecter fait écrire « autour » des buts acceptés*) · `stats`, `camp`, `portee`, `nom`, `objectif_id`.

```ts
interface ElementDistribution { place: string; poursuite: string }              // RÉSEAU
export interface FicheBrouillon { fonction: string; but: { libelle: string } }  // RE-RÉSOLU
export interface PropositionDistribution { ajouts: readonly FicheBrouillon[] }
// {place,poursuite} ∩ {fonction,but} = ∅ — KR-231, aux DEUX niveaux
```
**`FicheBrouillon` n'est pas assignable à `Personnage`** ⇒ « brouillon sans identité » devient un **invariant de compilation**. ⚠ **Première proposition sans identifiant de cible — ne pas ajouter de `dossierId` « par symétrie ».**

**11 prédicats** : (1) objet simple · (2) clés exactement `['distribution']` · (3) `Array.isArray` · (4) élément objet simple, clés exactement `['place','poursuite']` · (5) les deux sont des chaînes · (6) ≤ `FICHES_PROPOSEES_MAX = 3`, **refus jamais troncature** · (7) longueur ≥ 1 ⇒ `vide` · (8) les deux non vides après `trim()` ⇒ `vide` · (9) **éléments distincts sur le COUPLE** · (10) aucun `MARQUEUR_A_ECRIRE` · (11) aucun identifiant, **par élément, jamais un `join`**.
⚠ **(9) ne se symétrise pas** : deux gardes partagent légitimement une `place`, deux prétendants une `poursuite` — **un prédicat sur une seule clé refuserait une réponse juste**.

**Refus, avant tout `fetch`** : `a-ecrire('canon.mj.synopsis_mj')` → `a-ecrire('canon.ton')` → `trop-long`. **Ni `cible-a-ecrire`** (la cible est `monde.personnages[]`, **vide par définition**) **ni `aucun-candidat`** (**un monde vide est l'usage principal**).

**Invite — inchangée au mot près, sauf trois points** : gabarit `GABARIT_SORTIE['monde-distribution']` · ⚠ **la ligne du visage RESTE et devient STRUCTURELLE** — elle referme le canal synopsis → public maintenant que le champ public n'est plus dans la sortie, **une ceinture sur une bretelle, et elle ne coûte rien** · ⚠ **la ligne de nommage est RÉÉCRITE, jamais recopiée** de `personnage-relations`, dont l'exemple **« celle qui tient la forge » autorise la périphrase par la charge** (R4).

## § 4 · Statut de mes quatre réserves

| # | Tour 1 | **Tour 2** | Motif |
|---|---|---|---|
| **R1** | réserve, « sinon VETO » | ⚠ **REQUALIFIÉE en objection forte — LE VETO EST RETIRÉ PAR MOI** | **L'audience d'un champ de document n'est pas dans mon domaine de veto** : le schéma existe, l'échec est défini, aucune règle n'est dupliquée. **Le ranger de force aurait usé l'instrument avant la n° 12.** Le fond est inchangé et **gagne autrement** (§ 1, arguments 1–3, vérifiés au dépôt). |
| **R2** | réserve | **MAINTENUE** | Deux rôles y sont arrivés **indépendamment**. Sans elle : jumeaux à identifiants distincts **que rien ne constate**. Sa coupe reste **saine**, à condition d'écrire que le doublon devient **un coût visible assumé**. |
| **R3** | réserve | **MAINTENUE — confirmée par son propriétaire** | ⚠ La réserve `ux-designer` (un littéral plutôt qu'une 5ᵉ entrée) **invoque un veto dont l'auteur vient de retirer le motif** : *la branche que ce veto disait impossible, cette itération la produit*. Extraction verbatim **dans le lot contrat** (KR-117). |
| **R4** | réserve | **MAINTENUE, veto CONDITIONNEL et ARMÉ** | Aujourd'hui **la forme la contient** : l'élément ne porte **aucune fente de désignation**, donc une référence croisée **ne peut pas produire de pointeur cassé**. ⚠ **Qu'on ajoute un rang, un `envers` ou un handle inter-éléments, et R4 bascule en VETO** sous « référence narrative par nom libre » — **cette fois dans mon domaine, sans discussion**. |

**Deux mouvements sur argument, à porter au registre** : `'synopsis-distribution'` → **`'monde-distribution'`** · ordre des requis → **`synopsis_mj` d'abord**.

**`open_questions` inchangées** : `but.pourquoi` n'est écrit par aucun rôle (n° 12 / Temps 2) · aucune appellation re-projetée (n° 10) · **l'unicité de la distribution n'est constatée par personne**.
