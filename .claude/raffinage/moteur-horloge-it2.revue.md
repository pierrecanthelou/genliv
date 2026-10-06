# Revue — `moteur-horloge` · itération 2

**L'auteur lit, dans le récit du narrateur, ce qu'un PNJ présent a fait pendant son dernier pas.**

## Critères

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | Avancement écrit `depuis = tour` | VÉRIFIÉ | `horloge.test.ts:226` |
| 2 | Pas d'avancement → pas de `depuis` | VÉRIFIÉ | `horloge.test.ts:248` |
| 3 | Session 0.7.21 `{rang}` sans `depuis` | VÉRIFIÉ | `horloge.test.ts:293` |
| 4 | PNJ avancé + présent + action → prose dans PENDANT CE TEMPS | VÉRIFIÉ | `contexte.test.ts:3542` |
| 5 | PNJ absent du lieu → silence | VÉRIFIÉ | `contexte.test.ts:3584` |
| 6 | Action non rédigée → silence | VÉRIFIÉ | `contexte.test.ts:3618` |
| 7 | Budget et max re-dérivés | VÉRIFIÉ | `BUDGET=7000`, `MAX=87040`, `frontiere.test.ts:1320` |

## Diff par lot

**L1 `L1-moteur-depuis`** (8 fichiers, plan : 8) :
`docs/REGLES-PLAY.md` · `faits.ts` · `sessionDestinations.ts` · `horloge.ts` · `horloge.test.ts` · `commandes.test.ts` · `sessionCouverture.test.ts` · `session-saturee.ts`

**L2 `L2-narrateur-pendant-ce-temps`** (6 fichiers, plan : 6) :
`contexte/horloge.ts` (N) · `contexte/narrateur.ts` · `contexte.test.ts` · `worker/index.ts` · `worker/index.test.ts` · `worker/frontiere.test.ts`

**Partagés** (orchestrateur) : `docs/ROADMAP-BASCULE-IA.md` · `specification.json`

Aucun fichier hors liste.

## Ce qui a été refusé

| # | Rôle | Proposition refusée | Motif |
|---|---|---|---|
| 2 | PM | 5 itérations (2a/2b/2c/3/4) | 4 itérations : regrouper bandeau+climat et bloqué+durée |
| 3 | PM | Perceptibilité hors périmètre | `personnagesPresents` existe déjà |
| 4 | PM | `depuis` absent ≡ 0 | Distinction : `etape_plan` absent ≡ rang 0, `depuis` absent ≡ jamais en échéance |
| 6 | TL | `changementsDuPas` exporté | Un seul appelant, sélection inline |
| 7 | TL | Tri-état `declencheurDEtape` | Minuterie abolie, booléen suffit |
| 22 | NIA | Bloc PENDANT CE TEMPS levier cascade | Hors cascade (TL, NIA concède) |

## Ce qui a été reporté

| # | Destination |
|---|---|
| 10 | it3 — `bloqué` sans lecteur en it2, lecteur = `si_bloque` dans PENDANT CE TEMPS |
| 13 | it4 — Prop `pas` au bandeau |
| 14 | it3 — Label ÉTAPE BLOQUÉE, décision de registre |
| 15 | it4 — Dette `1px`/`bold` en dur dans `BandeauHeros.tsx` |
| 21 | it3 — Label ÉTAPE BLOQUÉE (NIA) |

## Écarts assumés

- **E du worker** : 2745 mesuré, pas 2743 annoncé au plan. Deux octets d'écart dans la docstring de l'invite narrateur, sans effet sur aucun plafond.
- **Pire cas budget** : L2 a composé TOUS les PNJ à plan (5) au lieu de la seule plus longue `action`. Même palier 7000 ; seules les pins intermédiaires (286/2283) seraient plus basses avec un seul PNJ.
- **`replier` dupliqué** : copie privée dans `contexte/horloge.ts` car l'importer depuis `narrateur.ts` nouerait un cycle. Un one-liner, à remonter dans `noyau.ts` par un lot qui le possède.
- **Invite du narrateur non amendée** : le plan ne spécifiait pas le texte à écrire. Le bloc PENDANT CE TEMPS est injecté sans instruction dédiée au modèle. Marge : 127 octets avant de déplacer le max. Point ouvert signalé par L2.

## Blocages non résolus

Aucun.

## Porte qualité

- `tsc --noEmit` : 0 erreur
- `jest` : 146 suites, 2762 tests, tous verts
- `lint` : 0 erreur (1 warning existant hors lot)
- Score de mutation : non déclenché (aucun des 4 fichiers mutés touché)

## RETOUR-COMITÉ

- La séquence L1→L2 sur deux lots `contrat` fonctionne bien : L1 livre la signature (`depuis`), L2 la consomme (`lignesPendantCeTemps`). La réécriture proactive du test R3 par L1 (Corvin au lieu de Harek) a évité tout conflit de fichiers.
- Le budget franchit un palier (6000→7000) pour la première fois depuis la mise en place de la re-mesure. Le mécanisme de re-dérivation en cascade (M→BUDGET→BUDGET_NARRATEUR→MAX) est robuste, chaque pin intermédiaire est testée.
- L'invite du narrateur n'a pas été amendée. Si le modèle ignore le bloc PENDANT CE TEMPS en pratique, une phrase d'instruction (≤127 octets) suffira — mais c'est du texte de prompt qui atteint le joueur sans relecture, donc un choix de contenu, pas d'architecture.
- `replier` dupliqué entre `narrateur.ts` et `contexte/horloge.ts` : dette mineure, à absorber quand un lot possédera `noyau.ts`.
