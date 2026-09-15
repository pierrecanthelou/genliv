# Tour 1 — `qa`

**VERDICT** : recevable sous réserve — (1) point dur n° 1 tranché et écrit avant tout lot ; (2) test de discriminance nommé au plan ; (3) risque sur l. 179-192 explicitement couvert.

**RISQUE** — « seul le test l. 203 est réécrit » **n'est pas garanti**. `ListeControles.tsx` pose la doctrine produit : « les trois niveaux se séparent par le MOT, jamais par une teinte neuve ». Si `SectionNav` la suit, le texte de Canon/Départ change, et le test l. 179-192 (`chaque trailing = compte(dossier)`, assertion sur `COMPTES_DOSSIER_NEUF[0]`/`[1]`) rougit aussi — **deux sondes à réécrire, pas une**.

**OBJECTION** — **aucun test de ce dépôt n'observe aujourd'hui une teinte de `Badge`** (vérifié : zéro `toHaveStyle`/`tone` dans tout `src/**/*.test.tsx`). Si le choix retenu est « teinte seule, texte inchangé » — le seul qui préserve l. 179-192 sans modification — **l'instrument n'existe pas encore** et doit être écrit nommément (`toHaveStyle({ color: 'var(--bad)' })`, jeton jamais couleur résolue), pas supposé couvert parce que « jest + RTL suffit toujours ».

**PROPOSITION** — trancher mot contre teinte AVANT tout lot et l'écrire. Je recommande **« teinte seule, `compte(dossier)` intact »** — seul choix qui tient la promesse « une sonde change ». Et nommer explicitement le test de discriminance au plan : aucune règle d'it1/it2 ne touche une section à compte réel, donc **seul un rendu DIRECT de `SectionNav` avec un `parSection` fabriqué** sépare « lit le rapport » de « colore les sections `SANS_COMPTE` ».

## Critères (8)

1. Dossier neuf → chaque `ListRow` porte **exactement un** `Badge` ; Départ `bad`, Canon `neutral`, les huit autres `muted` — jamais deux nœuds par ligne (KR-218). *composant*
2. Section saine (`parSection[id] === null`) → badge `muted`, et `SectionNav.tsx` ne contient **aucune** occurrence de `tone="good"` ni `tone="accent"`. *sonde de source, amendée*
3. **Discriminance** — `parSection` **fabriqué** plaçant `bloquant` sur `personnages` (compte réel, 2 fiches) et `null` sur `canon`/`depart`, `SectionNav` rendu **directement** → Personnages porte `bad` **et conserve « 2 fiches »**, Canon et Départ restent `muted` malgré leur `—`. *composant, test neuf*
4. Le test existant l. 179-192 reste vert **sans modification** : le texte de chaque badge reste exactement `compte(dossier)`, seule la teinte varie. *non-régression* — **conditionné au choix « teinte seule »**
5. La sonde `KR-013` (l. 194-201) reste verte sans modification : le mapping niveau→teinte est un **lookup constant**, jamais `.length`/`.filter(`/`.reduce(`. *sonde de source*
6. Dossier neuf → **avant tout clic**, Départ est coloré `bad` et Canon `neutral`, sans qu'aucune section à compte réel ne le soit. *composant*
7. Après réécriture du texte d'ouverture via `dossiers.update()` puis `dossier:updated`, l'écran se met à jour **sans remontage** et le badge Départ repasse de `bad` à `muted` — même mécanisme que celui déjà prouvé l. 222-256. *composant, bus d'événements*
8. L'entrée « Contrôles » ne porte **aucun** badge nouveau ; les deux tests existants qui la couvrent (l. 396-443, l. 445-455) restent verts sans modification. *non-régression*

## Tests existants impactés

| Libellé | Ligne | Ce qui change |
|---|---|---|
| `aucun badge de completion colore…` | 203-211 | **RÉÉCRIT** — retire l'interdiction de `tone="bad"` et l'obligation de `muted` ; garde `good` et `accent` interdits |
| `rend les 10 ListRow…, chaque trailing = compte(dossier)` | 179-192 | **NE DOIT PAS changer** — conditionné au choix « teinte seule ». Si le mot entre dans le texte, **ce test rougit aussi** et la prémisse « une seule sonde bouge » est fausse |
| `KR-013 : SectionNav ne recalcule aucun compteur localement` | 194-201 | Ne change pas ; borne correctement l'implémentation |
| Tous les autres (rendu de base, dossierId inconnu, `dossier:updated`/Personnages, ajout de lieu, états vides, clavier, entrée Contrôles ×2, racine de composition) | 140-176, 222-493 | Aucun changement attendu |
| `controles.test.ts` | — | Aucun changement attendu |

## Non vérifié par personne *(à recopier dans la revue)*

- La **couleur rendue** : jsdom ne calcule ni layout ni couleur résolue — seul le jeton (`var(--bad)`…) est vérifiable, jamais le rendu visuel.
- La discriminance « lit `parSection` » contre « colore les `SANS_COMPTE` » **sur un dossier réel bout-en-bout** : aucune règle d'it1 ni d'it2 ne touche une section à compte réel — la preuve n'existe qu'en rendu direct avec un `parSection` fabriqué ; une preuve passant par `controlerDossier` n'existera qu'à **it3**.
- Le texte exact rendu sur Canon/Départ tant que le point dur n° 1 n'est pas tranché.
- La propagation live par un **geste utilisateur réel** (formulaire réécrivant le texte d'ouverture) — le critère 7 ne la prouve que par écriture directe de test.
- Tout indicateur agrégé sur l'entrée « Contrôles » — hors périmètre, non dû.
- L'ordre de tabulation réel entre les dix lignes recolorées.
