# Revue d'itération — `moteur-horloge` · itération 1

## Ce que l'auteur peut faire maintenant

L'auteur voit au journal qu'un PNJ avance à l'étape suivante de son plan dès que le déclencheur de cette étape est vrai.

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---|---|---|
| AC1 | PNJ avance quand déclencheur vrai | VÉRIFIÉ | `horloge.test.ts:140` — scénario séparateur 3 étapes |
| AC2 | Déclencheur faux → pas d'avancement (même si duree échue) | VÉRIFIÉ | `horloge.test.ts:213` — aucune lecture de duree |
| AC3 | Plan vide / dernier rang / hors bornes → même référence | VÉRIFIÉ | `horloge.test.ts:246` — cas limites |
| AC4 | Plan prose seule → PNJ immobile | VÉRIFIÉ | `horloge.test.ts:319` |
| AC5 | Refus ou combat → tickHorloge non appelé | VÉRIFIÉ | `commandes.test.ts:1097` |
| AC6 | a_dit, confiance, etape_plan survivent en croisé | VÉRIFIÉ | `horloge.test.ts:412` — trois écrivains, deux ordres |
| AC7 | Ligne sans origine/deltas/recit/jet/interlocuteur | VÉRIFIÉ | `horloge.test.ts:470` — ligne non porteuse |
| AC8 | Seuls pnj[*].etape_plan et journal diffèrent | VÉRIFIÉ | `horloge.test.ts:515` — périmètre du tick |

## Diff par lot

### Lot A `horloge-contrat` (11 fichiers — plan : 11)

| Fichier | Plan | Livré |
|---|---|---|
| `docs/REGLES-PLAY.md` | R | R — § J2 complet (8 cas, portions it2 marquées) |
| `src/brain/dossier/faits.ts` | R | R — `etape_plan?: { readonly rang: number }` |
| `src/brain/dossier/sessionDestinations.ts` | R | R — 1 feuille `rang: 'moteur'` |
| `src/brain/dossier/__fixtures__/session-saturee.ts` | R | R — `aldur-le-sage: { rang: 1 }` |
| `src/brain/dossier/sessionCouverture.test.ts` | R | R — comptes 3→4, 2→3, pnj: 3 |
| `src/brain/dossier/evaluate.ts` | R | R — `etapeDeclenchee(faits, etape): boolean` |
| `src/brain/dossier/evaluate.test.ts` | R | R — 5 tests + garde 706 intacte |
| `src/brain/dossier/horloge.ts` | N | N — 108 lignes, `tickHorloge` pur |
| `src/brain/dossier/horloge.test.ts` | N | N — 25 tests |
| `src/brain/dossier/commandes.ts` | R | R — couture `tickHorloge(dossier, avecJalonsResolus(...))` |
| `src/brain/dossier/commandes.test.ts` | R | R — 4 tests couture |

Fichiers hors liste : aucun. Fichiers manquants : aucun.

## Ce qui a été refusé (REJETÉ du plan § 8)

| # | Refus | Motif | Vérifié |
|---|---|---|---|
| R-1 | Avancer à l'échéance | Contredit types.ts:433-446, rend si_bloque inatteignable | Oui — test duree:1 faux × 5 pas |
| R-2 | Stocker bloque:boolean | Dérivable (KR-013), sans consommateur avant it2 | Oui — champ absent |
| R-3 | Origine sur ligne du tick | Casse invariant recit⇒origine | Oui — ligne = 3 clés seulement |
| R-4 | Action dans texte journal | Prose ia verbatim interdite | Oui — texte = identifiants + rang |
| R-5 | declencheur_expr dans horloge.ts | Garde evaluate.test.ts:706 | Oui — import etapeDeclenchee |
| R-6 | Plusieurs crans par pas | duree imprévisible | Oui — un seul avancement par PNJ |
| R-7 | Injection R3/R4 en it1 | PENDANT CE TEMPS = it2 | Oui — contexte octet-identique |
| R-8 | depuis sans consommateur | KR-249 | Oui — champ absent du type |

## Ce qui a été reporté

| Sujet | Destination |
|---|---|
| Durée + depuis + bloqué + minuterie + si_bloque | it2, bloc indissociable (NIA : depuis entre avec la formule, même lot) |
| Bandeau « PAS #n » | it2 |
| Bloc R3 « PENDANT CE TEMPS » | it2 |
| Enrichissement R4 | Indéfini |
| Climat | it3/it4 |
| changementsDe en retour du tick | it2 |
| Nombre d'itérations 3→4 | Cadrage futur |

## Écarts assumés

1. **Table J2 lignes 1-2 du prompt** : le prompt d'orchestrateur disait « entre au rang 0, etape_plan: {rang: 0} écrit » — le dev-contrat a correctement implémenté absent ≡ 0 (veto TL KR-013). Le prompt contenait une contradiction avec le plan ; le plan fait foi.
2. **Rang −1** : garde explicite `Number.isInteger(rang) && rang >= 0` ajoutée. Le plan disait « une seule garde === undefined » — insuffisant pour rang −1 (n vaudrait 0 et l'étape existe). Correctif défensif.
3. **moteurSansIA.test.ts non modifié** : hors liste du lot. La couverture de horloge.ts est prouvée par mutant `fetch(` (le test existant le scanne via la liste dérivée du disque).
4. **Deux assertions sessionCouverture** épinglent l'absence de `depuis` (R-8). Ajout non demandé mais défensif — à supprimer en it2.
5. **Garde baril dans evaluate.test.ts** (ni etapeDeclenchee ni tickHorloge exportés par brain/index.ts). Ajout non demandé, bon gardien.

## Blocages non résolus

Aucun.

## Porte qualité

| Outil | Résultat |
|---|---|
| Prettier | Vert (réserve : `panneauPersonnages.test.tsx` pré-existant, hors lot) |
| `tsc --noEmit` | Vert |
| ESLint | Vert (0 erreurs, 1 warning non-régression `exhaustive-deps` existant) |
| Jest | **146 suites, 2743 tests, 0 échecs** |
| Mutation `brain/` | Non requis (aucun des 4 fichiers de règles touché) |

Tests ajoutés : 35 (25 horloge + 5 evaluate + 4 commandes + 2 couverture). Régression : 0.

## RETOUR-COMITÉ

- **Lint n° 7** (TL tour 2) : le choix absent ≡ 0 rend muet le déclencheur de l'étape 0 en it1. Les PNJ des fixtures réelles (corvin, mira, aldur) ont un plan d'une seule étape avec `declencheur_expr` : ils ne bougent jamais. À adresser quand le lint n° 7 est cadré.
- **Contradiction du prompt d'essaim** : ma reformulation de J2 contenait « entre au rang 0 stocké » qui contredisait le veto TL absent ≡ 0. Le dev-contrat l'a corrigé de lui-même. À surveiller : les prompts d'orchestrateur doivent être relus contre le plan § 8 avant envoi.
- **Rang −1** : le plan disait qu'une seule garde `=== undefined` suffisait pour les 5 cas limites. C'est faux pour rang négatif. Le dev-contrat a ajouté la garde. Leçon : les cas limites se TESTENT, ils ne se DÉDUISENT pas.
