# Mesures de l'orchestrateur — à lire au tour 2

Ces sept relevés ont été **exécutés**, pas déduits. Trois d'entre eux corrigent une affirmation signée au tour 1. Un rôle qui maintient une position contredite ici doit le faire **contre la mesure**, en disant pourquoi.

---

## M1 — L'égalité des AT **est** documentée. Trois rôles ont écrit le contraire.

`docs/REGLES-PLAY.md:61` :

> **D2. Égalité d'AT.** AT égales → assaut nul (aucun dégât), on rejoue un round. ✍️ *Défaut : OK.*

`CLAUDE.md` nomme `docs/REGLES-PLAY.md` « complément d'orchestration » de la source de vérité. La règle est donc **déjà tranchée**, et avec la mention « Défaut : OK ».

- L'UX a écrit que le § 3 « ne décrit pas l'égalité des AT » — vrai du seul `REGLES-DU-JEU.md`.
- La QA a écrit « **Aucune** mention d'égalité des AT » et fondé dessus son `REJETÉ` n° 1 — son `grep` n'a porté que sur `REGLES-DU-JEU.md`.
- Le tech-lead a écrit « l'égalité n'est décrite nulle part ».

**Conséquence à trancher au tour 2** : l'ajout 2 **transcrit une règle déjà décidée** d'un document vers l'autre, il n'en crée pas. La conclusion (écrire l'égalité dans le § 3) peut tenir ; le **motif** doit changer. Et ce que la doc décidée ne dit pas — que la bande vaut `Manqué` — reste à qualifier.

## M2 — `ecartBand(ecart <= 0)` est **inatteignable en production**. Mesuré sur les quatre sites d'appel.

| Site | Garde qui précède |
|---|---|
| `combat.ts:117` | `if (atA === atD) return {…}` l.110 — l'égalité sort avant, donc `ecart = Math.abs(atA − atD) ≥ 1` |
| `combatEngine.ts:94` | `if (atMonster <= atHero) return { damage: 0 }` l.92 |
| `combatEngine.ts:249` | `if (atHero > atMonster) {` l.248 |
| `combatEngine.ts:354` | branche « Monster wins », `atMonster > atHero` |
| `capacityEffects.ts:106` | `if (atMonster <= atHero) return { damage: 0, log: 'manqué' }` l.104 |

La branche `ecart <= 0` est un **plancher défensif**, pas une règle jouable. Question ouverte au tour 2 : une ligne de table dans un manuel **destiné au joueur** est-elle le bon endroit pour une borne que le jeu ne produit jamais ? (Note : `capacityEffects.ts:104` écrit déjà `'manqué'` en dur dans son journal — le mot existe donc déjà côté joueur.)

## M3 — Les quatre booléens de `combat.ts:107-108` : **le tech-lead a raison, la QA a tort.** Vérifié.

Extrait du `mutation.json` du jour **et** de la source, colonnes comptées :

```
id 190  L107  cols 74 → 91  repl = "!attacker.shield"  Survived
id 191  L107  cols 75 → 91  repl = "attacker.shield"   Survived
id 193  L108  cols 74 → 91  repl = "!defender.shield"  Survived
id 194  L108  cols 75 → 91  repl = "defender.shield"   Survived

source l.107, indices 73..90 : "!!attacker.shield,"
source l.107, indices 74..90 : "!attacker.shield,"
```

Le nœud `[74,91)` est `!!attacker.shield` ; le nœud `[75,91)` est `!attacker.shield`. Le mutant 191 remplace le nœud **interne** et laisse le `!` de la colonne 74 en place. **Les deux mutants appliquent la même source : `shield: !attacker.shield`.** Ce sont **quatre négations**, zéro équivalent.

L'hypothèse du cadrage (trou n° 2) était fausse, et le raisonnement de la QA — juste sur le type, juste sur le consommateur — portait sur un mutant qui n'existe pas. **Aucune annotation d'équivalence n'est due sur ces quatre-là.**

## M4 — Dénominateurs par fichier, recomptés depuis le rapport

| Fichier | mutants notés | ignorés |
|---|---:|---:|
| `challenge.ts` | 38 | 22 |
| `combat.ts` | **72** | 7 |
| `characteristics.ts` | 34 | 40 |
| `xp.ts` | **114** | 0 |
| **total** | **258** | 69 |

Les deux prédictions du tech-lead pour la vérification isolée des lots — **72** pour `combat.ts`, **186** pour les trois autres — sont exactes.

## M5 — Socle de non-régression, et le test instable

- `npx jest` : **102 suites / 1750 tests / ~21 s**. Les chiffres `55 suites / 644 tests` d'`outillage-it1.revue.md` datent de l'état du dépôt au 2026-08-02 : **ne pas s'y comparer**. La QA a raison.
- **Un run rouge sur cinq** aujourd'hui, arbre propre. La QA l'identifie : `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx:800`, « Force se clampe aux deux bornes 1 et 12 », repassé **vert seul**. Le test existe bien à cette ligne (vérifié).
- **Mon hypothèse était fausse et je l'écris** : j'avais désigné `src/player/engine/capacityEffects.test.ts` (20+ sites passant le vrai `Math.random`). Sonde de **12 runs ciblés : 12 verts**. L'hypothèse n'est pas confirmée.
- Aucun précédent d'instabilité dans les huit `bug_history*.json`.

## M6 — `npm run lint` : **0 erreur / 1 avertissement**

L'avertissement est `CharacterCreationScreen.tsx:35` (`react-hooks/exhaustive-deps`), préexistant. Les 13 erreurs mentionnées dans `outillage-it1.revue.md` ont été soldées par son lot B.

## M7 — Budget de contexte, mesuré **aujourd'hui en LF** (`git show :fichier | wc -c`)

Le tech-lead a cité la table du 2026-08-13 de `docs/WORKFLOW.md`. Les marges réelles sont **plus serrées** :

| Fichier | mesuré | plafond | marge réelle | marge citée au tour 1 |
|---|---:|---:|---:|---:|
| `CLAUDE.md` + `docs/WORKFLOW.md` | 45 921 | 46 080 | **159 o** | 86 o |
| `code-knowledge.json` | 76 728 | 76 800 | **72 o** | ~236 o |
| `bug_history.json` | 9 641 | 10 240 | 599 o | — |
| `docs/ROADMAP-BASCULE-IA.md` | 27 398 | 30 720 | 3 322 o | — |
| `features_history.json` | 6 795 | 10 240 | 3 445 o | — |

**Trois fichiers que le lot documentaire doit écrire sont à moins de 600 octets de leur plafond.** Une entrée `bug_history` pèse couramment 600–900 o ; un KR en pèse 400–1 200. La compaction se fait **dans le lot qui franchit**, jamais au suivant (`docs/WORKFLOW.md`, Build Steps étape 4). À chiffrer au tour 2 : est-ce du périmètre de B2, ou faut-il l'écrire comme une contrainte que le lot C absorbe ?

*Note : `docs/REGLES-DU-JEU.md` n'a **pas** de plafond de contexte — il n'est dans aucune des six lignes de la table.*
