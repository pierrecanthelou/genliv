# Tour 2 — `narratif-ia` · `dossier-registres` it5

```
1. RÉPONSE À L'UX (D1) — je concède l'argument, je maintiens la conclusion.

ux-designer : tu as raison sur KR-208 — il n'interdit qu'une opération NEUVE, pas
l'usage des quatre existantes — et ma « fontaine à objets » supposait bien une
application répétée. Je retire l'argument. Le NON tient sur deux trous que
l'application unique ne bouche pas.
(a) AUCUN INSTANT. Climat ne porte ni `declencheur_expr` ni `declencheur_texte` —
c'est ton propre point 5. Rien dans le dossier ne dit QUAND un climat s'allume :
`horloge.climat_actif` est un état de SESSION (KR-207) posé par n° 9 / n° 14 sur
des motifs que l'auteur n'a pas écrits. Un delta dont l'instant d'application
n'est ni dans le code ni dans le document est une règle sans domicile.
(b) AUCUNE IDEMPOTENCE. Rien n'enregistre « déjà appliqué » : un climat qui revient,
une session rechargée, ré-appliquent. Garantir « une seule fois » exige un registre
d'application par session — mémoire de session non spécifiée, mon terrain, propriété
n° 9.
Et ton besoin est DÉJÀ SERVI : « la tempête révèle un indice enfoui » est un
ÉVÉNEMENT (`declencheur_expr` + `resolutions[].consequence`, livré en it4), avec un
instant daté. Sur le climat, ce serait un second chemin d'écriture au même effet,
moins bien défini.

pm-produit — ta proposition 3 (« ne rien ajouter au périmètre ») vise `manifestation`.
J'assume : hors-cadre, étiquetée INNOVATION, chiffrée en annexe C.
tech-lead — ton « 0 dispense » reste exact pour `duree`. `manifestation` en coûte
EXACTEMENT UNE, sous un motif existant. Lu, pas supposé.

2. STATUTS DE MES DEUX OBJECTIONS

Objection 1 (critère 7 faux ; aucun `EditeurEffets` sur Climat) — MAINTENUE.
Quatre voix sur cinq convergent : pas besoin d'un veto, la majorité tranche.

Objection 2 (durée en prose) — DESSERRÉE, retirée du terrain de veto. Une
`duree_texte` d'audience `auteur` n'est pas une règle appliquée par le modèle,
seulement un champ que personne ne lit : défaut de contrat, terrain tech-lead/PM,
où l'accord est déjà fait. Aucune ESCALADE. Ce qui la redurcirait : le jour où
n° 14 est chargée d'éteindre un climat À PARTIR DE CE TEXTE.

D2 TRANCHÉ — `duree?: number`, `min: DUREE_MIN`, audience `moteur`. L'homonymie
que le PM redoute DISPARAÎT au lieu d'être contournée : même mot, même sens.

D3 — INNOVATION assumée, chiffrée, avec son repli écrit noir sur blanc.
```

---

## ANNEXE A — Tableau d'audiences FIGÉ, `monde.conditions.climat[].*`

### Scénario 1 — SANS `manifestation`

| Chemin | Audience | Fondement |
|---|---|---|
| `climat[].id` | `moteur` | existant, `destinations.ts:510` |
| `climat[].nom` | `auteur` | existant, `destinations.ts:511` — KR-195 intacte |
| `climat[].effets_regles` *(sans `[]`)* | `moteur` | existant, `destinations.ts:519` |
| `climat[].duree` **(neuf)** | `moteur` | entier, `CHAMPS_ENTIERS`, consommateur n° 14 |
| **Champs d'audience `ia`** | **ZÉRO** | seule collection de registre du schéma dans ce cas |

### Scénario 2 — AVEC `manifestation` (retenu)

Les quatre lignes ci-dessus, **inchangées**, plus :

| Chemin | Audience | Fondement |
|---|---|---|
| `climat[].manifestation` **(neuf)** | `ia` | jumeau exact de `monde.quetes[].consigne` : prose optionnelle, libre, `ia` |
| + `BUDGETS_DE_MOTS` | — | `budget: BUDGET_MOTS_MANIFESTATION = 20`, `sujet: "La manifestation de ce climat"`, `location: 'Climat'` |
| + `LIBRES` | — | `PROSE_D_ENTITE_LIBRE`, 18ᵉ occurrence, **motif existant** |

---

## ANNEXE B — Contrat d'injection opposable à la n° 10

1. **Entrée** — au plus **UN** climat par tour, celui que `horloge.climat_actif` désigne, jamais la collection ; champ injecté : `manifestation` **seul**, borne **20 mots**, constante nommée.
2. **Interdits d'injection** — `id` (handle), `nom` (étiquette de registre, `auteur`), `duree` et `effets_regles` (`moteur`) : les injecter apprendrait au modèle à compter l'horloge et à modifier les règles.
3. **Schéma de sortie** — sans objet : le climat n'est pas un rôle. Aucun jet, aucun PV, aucune ligne d'inventaire, aucun XP n'est touché.
4. **Échec** — `manifestation` absente, vide ou non textuelle : le bloc climat est **omis**. Jamais remplacé par `nom`, jamais paraphrasé. Le repli est le silence. Dépassement du budget : avertissement non bloquant, rendu à l'écran (KR-183), jamais un refus.
5. **Mémoire de session** — hors périmètre et **explicitement non spécifiée par it5** : l'allumage et l'extinction de `climat_actif` sont propriété de la n° 9 / n° 14, et `duree` entier est le seul champ qui rende l'extinction calculable par du code.

---

## ANNEXE C — D3 chiffré par lecture directe, et le repli si refusé

### (a) `BUDGETS_DE_MOTS` — forme exacte, dépassement **avertissant**

`tables.ts:628-647` — `interface BudgetDeMots extends ChampRequis { budget: number; sujet: string }`, `sujet` = « le SUJET de la phrase d'avertissement, article compris ». **Trois lignes aujourd'hui** : `canon.mj`, `canon.partage`, `charpente.jalons[].enonce_texte`.
`validate.ts:798-816` — la boucle §9 est explicite : « des AVERTISSEMENTS. Ils ne dégradent rien, ne bloquent rien, et `ok` reste vrai ». **Non bloquant, vérifié.**

### (b) Un champ de prose libre d'audience `ia` sur une entité de registre existe-t-il déjà ? — **OUI, cinq**

`monde.indices[].verite` (l.425), `monde.indices[].formulation_joueur` (l.433), `monde.quetes[].consigne` (l.456), `monde.evenements[].resolutions[].resultat` (l.506), `charpente.jalons[].enonce_texte` (l.531). **`manifestation` n'ouvre aucune catégorie** : jumeau de `monde.quetes[].consigne`.

### (c) `couverture.test.ts` exigerait-il une dispense ? — **OUI, exactement une**

`'monde.conditions.climat[].manifestation': PROSE_D_ENTITE_LIBRE` — **18ᵉ prose**, motif existant. Deux précisions lues :
- une ligne de `BUDGETS_DE_MOTS` **ne remplace pas** la dispense : le budget n'AVERTIT que, donc la corruption chaîne → `42` traverse toujours `ok: true` ;
- le bloc de commentaire l.250 (« DIX-SEPT aujourd'hui, remesuré et jamais recopié — KR-159 ») doit être **recompté à dix-huit**, et `couverture.test.ts:462` impose une valeur de fixture **≤ 20 mots**.

### Étiquette INNOVATION — assumée

- **(a) Règle infléchie** — « ne rien ajouter au périmètre » (pm-produit, tour 1) et le goal d'it5 tel qu'écrit (« un libellé, une durée »). Le champ est un **troisième** champ, absent aussi du § 09 du plan de cible.
- **(b) Coût** — 9 fichiers, +1 constante, +1 dispense sous motif existant, +1 ligne de budget, +1 région d'écran, +3 tests. Aucune machinerie neuve.
- **(c) Ce qu'on perd sans elle** — ci-dessous.

### La phrase pour les `open_questions` si `manifestation` est refusée

> **La feature LIVRE** la dernière racine du dossier refermée — un climat = `id` + `nom` + `duree` (entier, `moteur`) + `effets_regles: []`, round-trip prouvé, dixième panneau à l'écran — **et elle NE LIVRE PAS** le moindre contenu de climat injectable au Temps 2 : `monde.conditions.climat[]` reste la **seule collection de registre du schéma à zéro champ `ia`**, et la n° 10 hérite de la question « que lit le narrateur quand un climat est actif ? » avec trois portes déjà fermées (`nom` = `auteur`/KR-195, `duree` = `moteur`, `effets_regles` = `moteur`) — elle devra soit retirer le climat du contexte de scène, contre `PLAN-BASCULE-IA.dc.html` l.411, soit rouvrir une ligne d'audience que cette itération vient de figer.
