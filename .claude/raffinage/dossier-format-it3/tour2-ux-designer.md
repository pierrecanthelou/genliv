# Tour 2 — UX Designer · `dossier-format` it3

**RÉPONSE NOMMÉE** — **`narratif-ia`** objecte (C2) que sans jumeau `…_texte`, `declencheur_expr` d'`Evenement`/`PlanAction` n'a rien à classer `auteur` dans `DESTINATION_DES_CHAMPS`. J'accepte et je **retire** ma proposition « `declencheur` nu » : c'est en réalité un argument d'ergonomie de rédaction — tant qu'il n'y a pas d'UI (jusqu'aux n° 3/6), l'auteur lit du JSON brut, et une mécanique moteur sans sa phrase française lui est aussi aveugle qu'au modèle. `declencheur_expr?` / `declencheur_texte?` (les DEUX optionnels, pairés) rejoint le patron déjà en place sur `Jalon`/`Fin`.

Correction supplémentaire, dans mon domaine (casse et lisibilité des clés) : le croquis `ExprNode` du **tech-lead** écrit `args`, `arg`, `refs` — de l'anglais, alors que l'en-tête de `types.ts` engage le `snake_case` et le français jusqu'à la clé. La matrice de la **QA** écrit déjà « enfants » de son côté — je tranche pour l'accord : **`enfants` / `enfant` / `predicat` / `cibles`**.

**MES OBJECTIONS DU TOUR 1**
1. Forme de `contre_mesures` absente → **RETIRÉE**. Si la famille est reportée nommément (C1), rien ne la valide en it3 : KR-164 ne s'applique à aucune anomalie réelle, le trou que je craignais suppose un contrôle qui n'existera pas.
2. Graphie incohérente `declencheur` / `declencheur_expr` entre D1 et « Pick abandonné » → **RETIRÉE**. La convergence `_expr`/`_texte` partout l'efface : une seule graphie reste.

**CONFLITS TRANCHÉS**
- **C1** : 5 familles ; `contre_mesures` reportée avec la ligne-commentaire du tech-lead — mais recalée sur **n° 4** (narratif), pas n° 6.
- **C3** : `cibles: string[]` — jamais `cible` ni `refs`. Tableau dès le schéma 1 pour absorber sans rupture de type l'arité 2 que le narratif prouve nécessaire.
- **C4** : veto du narratif sur `jet_reussi` **confirmé, je le retire**. Le compte reste tech-lead (plafond) × narratif (contenu) — mais je signale que le septuor d'exemple du tech-lead réintroduit deux candidats explicitement vétés (`quete_achevee`, `objectif_atteint`).
- **C5** : aucun enjeu de mon domaine — dérivé.
- **C7** : 2 codes maintenus, pas 3 — précédent déjà en production (`reference-pendante` : un code, plusieurs sites d'appel).
- **C8** : pas de code neuf en it3 ; report explicite.

**VERDICT** — **recevable.** Toute réserve du tour 1 est levée par la convergence `_expr`/`_texte`.

---

## ANNEXE — textes définitifs

### A. Codes d'anomalie

**`condition-invalide`** — canal `errors` (bloquant). QUOI, quatre variantes interpolées **au site d'appel** dans `validate.ts`, jamais dans `DOSSIER_ISSUE_LABELS` :
- Opérateur inconnu : « Le champ « {champ} » utilise l'opérateur « {valeur} », qui n'existe pas (attendu : et, ou, non, predicat). »
- Prédicat inconnu : « Le champ « {champ} » utilise le prédicat « {valeur} », qui n'existe pas dans le registre des conditions. »
- Arité incorrecte : « Le champ « {champ} » fournit {n} cible(s) à « {nom} », qui en attend {attendu}. » — `{nom}` = le label du prédicat pour `op:'predicat'`, ou l'opérateur lui-même sinon.
- Cible de type incorrect : « Le champ « {champ} » fournit « {valeur} » au prédicat « {label} », qui attend une référence « {typeAttendu} ». »

QUOI FAIRE : « ↪ Corrigez la condition dans le fichier (opérateur, prédicat, nombre ou type de cibles), puis réimportez-le. »

OÙ : l'entité qui **PORTE** le champ fautif — Objectif, Fin, Jalon, Événement, Personnage (pour `plan_actions[]`, nomme le **personnage**, jamais l'étape, qui n'a pas de nom) — jamais le nœud `predicat` lui-même.

**`condition-sans-expr`** — canal `warnings`. *(Renommé depuis mon `condition-sans-formalisation` : j'adopte le nom du tech-lead, qui suit le patron en production `revelation-sans-porte`.)*
QUOI : « Le champ « {champ} » décrit une condition en prose, mais aucune condition structurée correspondante n'est posée : elle ne sera jamais vérifiée automatiquement. »
QUOI FAIRE : « ↪ Ajoutez la condition structurée correspondante si le moteur doit la vérifier, ou laissez tel quel si elle reste une intention d'auteur. »
OÙ : l'entité portant le `_texte` sans jumeau — Objectif et Fin uniquement, selon `alerteSansExpr`.

**`reference-pendante`** — **réutilisé**, nouveau site d'appel dans `cibles[]` :
QUOI : « Le prédicat « {label} » de « {champ} » pointe « {valeur} », qui n'existe pas dans ce dossier. »
QUOI FAIRE : ligne existante inchangée.
OÙ : l'entité porteuse du `…_expr`.

### B. `PREDICATES[].label` — style

Minuscule initiale, phrase courte non interpolée (aligné sur le code déjà rédigé, je retire mon « Majuscule initiale » du tour 1). Placeholder du futur `Select` (n° 3/6/7) : « Choisir une condition… ». `quete_achevee` et `objectif_atteint` **restent exclus** (veto narratif) malgré leur présence dans l'échantillon du tech-lead.

### C. JSDoc — noms de champs définitifs

```ts
/** ExprNode — quatre opérateurs français, union exhaustivement vérifiée par le
 *  compilateur (KR-117), jamais un registre. `cibles` reste un TABLEAU même à
 *  l'arité 1 partout en schéma 1 : un prédicat à deux cibles ne cassera pas le
 *  type le jour où il entre. */
export type ExprNode =
	| { op: 'et' | 'ou'; enfants: ExprNode[] }                    // ≥ 2 enfants
	| { op: 'non'; enfant: ExprNode }
	| { op: 'predicat'; predicat: PredicatId; cibles: string[] }
```

```ts
/**
 * Un objectif de l'aventure. `reussi_si_expr`/`echoue_si_expr` sont MOTEUR —
 * jamais injectés. `reussi_si_texte`/`echoue_si_texte` sont AUTEUR : la même
 * règle en français, pour que l'auteur qui relit le JSON à la main sache ce
 * qu'il déclenche.
 * Exemple : reussi_si_expr: { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.gouffre-scelle'] }
 * Exemple : reussi_si_texte: 'Le héros a atteint le fond du Gouffre scellé.'
 */
```
```ts
/** MOTEUR — jumeau structuré de condition_texte (déjà livré). Jamais injecté :
 *  un narrateur qui connaît la condition de fin y conduit.
 *  Exemple : condition_expr: { op: 'et', enfants: [
 *    { op: 'predicat', predicat: 'possede_objet', cibles: ['objet.cle-du-gouffre'] },
 *    { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.gardien-vaincu'] } ] } */
condition_expr?: ExprNode // sur Fin
```
```ts
/** DEUX optionnels, pairés — un événement peut rester déclenché par la seule main
 *  du narrateur, sans condition formalisée : c'est calme, jamais une alerte.
 *  Exemple : declencheur_texte: 'Le joueur revient à Val-Cendre après la tempête.'
 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.val-cendre'] } */
```
```ts
/** Idem sur une étape de plan — le rapport d'anomalie nomme le PERSONNAGE entier,
 *  jamais l'étape isolée (pas de nom propre).
 *  Exemple : declencheur_texte: "L'Archiviste agit dès que la garde est alertée." */
```

`contre_mesures` : aucun JSDoc en it3 — famille reportée.
