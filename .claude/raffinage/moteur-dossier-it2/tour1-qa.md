# Tour 1 — qa — moteur-dossier it2

RISQUE — Le goal empile trois inconnues d'architecture non résolues dans une seule tranche : (1) la mutation d'état que « aller » doit produire (`lieu_courant`, `lieux_visites`) n'a aucun chemin de code nommé — `deltas.ts` liste `deplacer_vers` explicitement dans ses ÉCARTÉS et `appliquerDelta` n'existe qu'en it3 ; (2) le port de stockage à deux appelants nommés (condition posée par D-5 pour ne pas être une abstraction à appelant unique) n'a qu'UN appelant concret prévisible en it2 (`écrire`) ; (3) le replay déterministe intra-process, hérité tel quel de D-8, n'a toujours aucune source d'entropie à faire diverger.

OBJECTION — Le goal ordonne de livrer le replay déterministe comme si D-8 n'était qu'une question de calendrier. KR-242 exige un scénario qui SÉPARE ; or `graine_alea` n'est lue par aucun code avant n° 11 (D-16, it1), et « aller » ne tire aucun aléa. Sans divergence possible, un témoin « rejeu = même résultat » sera vert sur toute implémentation fautive-mais-déterministe — exactement la coïncidence que D-8 signalait pour it1 (BUG-113).

PROPOSITION — Chiffrable : (a) plafonner à **6** critères d'acceptation, pas 8 ; (b) exiger du tech-lead, AVANT tout découpage en lots, le nom du fichier et le statut (`contrat` ou feature) qui porte la mutation de « aller », faute de quoi aucun critère ne peut nommer un instrument stable ; (c) soit reporter le critère replay vers n° 11 (dés), soit le remplacer par un critère d'IMMUTABILITÉ — l'état d'entrée `S0` n'est jamais muté en place, vérifié par comparaison à une copie prise AVANT l'appel.

VERDICT — recevable sous réserve.

---

## ANNEXE

### Fichiers lus
`CLAUDE.md`, `docs/WORKFLOW.md`, `specification.json`, `moteur-dossier-cadrage.plan.md`, `moteur-dossier-it1.plan.md`, `moteur-dossier-it1.revue.md`, skill `raffinage-iteration`, `session.ts`, `deltas.ts`, `predicates.ts`, `types.ts` (extrait `acces`), `EcranPartie.tsx`, `useSessionPersistee.ts`, `moteurSansIA.test.ts`, `src/player/utils/persist.ts`, `PersistenceService.ts`. **Vérifié au disque** : `src/features/play-mode/` et `src/brain/dossier/` ne contiennent aujourd'hui **aucun** fichier `commande*`/`journal*`/`console*` — les trois livrables sont neufs, sans précédent à recopier.

### Constat architecture décisif (fonde RISQUE 1)
`deltas.ts` documente sa liste ÉCARTÉS : `gagner_xp, modifier_pv, modifier_pe, modifier_bonus_attaque, modifier_bonus_defense, modifier_carac, equiper_objet, deplacer_vers, consommer_evenement, modifier_confiance, ouvrir_combat`, « motif à lever avant réouverture ». **`deplacer_vers` — le seul delta qui écrirait `monde.lieu_courant` — est donc explicitement HORS du registre `DELTAS`**, et `applyDelta`/`evaluate.ts` n'existent qu'en it3. Le goal d'it2 ne mentionne aucune réouverture de `deltas.ts` ni de second lot `contrat`. Conclusion : la mutation de `aller` doit être une fonction **bespoke**, hors du pipeline `DELTAS`/`appliquerDelta`, probablement un registre `COMMANDES` séparé. Tant que le tech-lead n'a pas écrit le nom du fichier et sa nature, aucun instrument stable ne peut être nommé : les critères ci-dessous utilisent le PLACEHOLDER `deplacerVersLieu`.

### Critères d'acceptation candidats (6, sous réserve du cadrage lots)

**C1 — Déplacement réussi le long d'un accès orienté, cible non-première**
ÉD un dossier où `lieu.A.acces = ['lieu.B', 'lieu.C']` (2 sorties), session avec `lieu_courant = lieu.A` · Q commande `ALLER lieu.C` soumise (C = 2e élément, jamais le 1er) · A `monde.lieu_courant === 'lieu.C'` (pas `lieu.B`) et `lieux_visites` contient `lieu.C`. Niveau : unité.
Séparateur BUG-113 : avec un seul accès, ou une cible en position 0, une implémentation fautive « va toujours vers `acces[0]` » rendrait le MÊME résultat — la fixture DOIT porter ≥2 accès et cibler explicitement le second.

**C2 — Refus sur une arête absente/asymétrique (orientation réelle)**
ÉD `lieu.A.acces = ['lieu.B']` mais `lieu.B.acces` NE contient PAS `lieu.A`, session sur `lieu.B` · Q `ALLER lieu.A` depuis `lieu.B` · A refus nommé, `lieu_courant` reste `lieu.B`, `lieux_visites` inchangé. Niveau : unité.
Séparateur : sans l'asymétrie, une implémentation testant « A et B sont mutuellement listés » (non orientée) passerait le même test.

**C3 — Auto-référence légale, sans doublon de `lieux_visites`**
ÉD `lieu.A.acces` inclut `lieu.A`, session `lieu_courant = lieux_visites = ['lieu.A']` · Q `ALLER lieu.A` · A succès (pas un refus), `lieu_courant` reste `lieu.A`, **`lieux_visites` reste `['lieu.A']`**, `horloge.tour` avance. Niveau : unité.
Séparateur : un push naïf sans test d'appartenance produit un doublon qu'une assertion sur `lieu_courant` seul ne verrait jamais.

**C4 — `JournalRow` rend joueur/moteur et remplace l'état vide**
ÉD une session dont `journal` porte ≥1 entrée `role:'joueur'` et ≥1 `role:'moteur'` · Q la zone Journal est rendue · A `TEXTE_JOURNAL_VIDE` disparaît, chaque entrée se rend via `JournalRow` avec son texte exact et un marqueur visuel distinct par rôle. Niveau : composant RTL. (Critère de forme — 0 vs ≥1 entrée est déjà discriminant.)

**C5 — Refus de commande inconnue, liste DÉRIVÉE du registre**
ÉD saisie hors registre (`SAUTER lieu.B`, `ALLER` sans argument, chaîne vide) · Q traitement · A message de refus nommé listant les commandes disponibles, jamais silencieusement ignorée. Niveau : composant RTL + test-grep.
**Mutant obligatoire** (le seul qui sépare avec un seul verbe existant) : ajouter un DEUXIÈME verbe fictif au registre **dans le test seul**, vérifier que le message affiché le liste sans toucher au code du composant — précédent direct de l'INNOVATION d'it1. Un test qui compare au texte actuel (un seul verbe) ne sépare RIEN : la liste en dur `"Commandes disponibles : aller"` passerait.

**C6 — Port de stockage : `écrire` a un appelant, `lire`/`effacer` sont nommés mais non consommés — écrit noir sur blanc**
ÉD `useSessionPersistee` refactoré derrière `{ lire, écrire, effacer }` · Q une commande `aller` réussie modifie la session · A `écrire()` est appelé avec l'état à jour (comportement observable inchangé) ; ET un test-grep dérivé du disque constate qu'aucun appelant de `.lire(`/`.effacer(` n'existe dans le périmètre en it2. Niveau : hook RTL + test-grep.
**Réserve** : si `lire`/`effacer` restent sans second appelant à la fin d'it2, D-5 (« deux appelants nommés ») n'est PAS satisfaite — soit le comité écrit explicitement le second appelant, soit il réduit le critère à `écrire` seul et réserve `lire`/`effacer` à la manière KR-249.

### Mutants obligatoires — code exact

```ts
// C1 — ignore la cible, prend toujours le premier accès
const cible = lieu?.acces?.[0]
```
Doit ROUGIR sur C1 (fixture cible = `acces[1]`).

```ts
// C2 — accessibilité non orientée
const estAccessible = lieuActuel.acces?.includes(cible) || lieuCible?.acces?.includes(lieuActuel.id)
```
Doit ROUGIR sur C2 (fixture asymétrique A→B sans B→A).

```ts
// C3 — push sans vérifier l'appartenance
const lieux_visites = [...session.monde.lieux_visites, cible]
```
Doit ROUGIR sur C3 (revisite d'un lieu déjà visité, doublon détecté).

### Replay déterministe intra-process — réponse à la question posée
**Non, il n'existe aucune source de non-déterminisme à attraper en it2.** `ouvrirSession` est pure et sans tirage ; `graine_alea` est injectée en it1 mais lue par AUCUN code avant n° 11 (D-16) ; le déplacement par `lieux[].acces` est une résolution déterministe pure. Toute implémentation fautive de « aller » (les trois mutants ci-dessus) reste parfaitement REJOUABLE — identiquement fausse aux deux passages. Un critère « rejeu = même résultat » serait vert aussi bien sur le code juste que sur ces trois mutants : il épinglerait une coïncidence, exactement le mode d'échec que D-8 a nommé pour it1 (BUG-113).
**Recommandation** : reporter le critère littéral vers n° 11, OU le remplacer par un critère d'IMMUTABILITÉ qui, lui, sépare :
ÉD une session `S0` et 2 commandes `ALLER` valides · Q on exécute la séquence sur `S0`, en comparant `S0` à une COPIE PROFONDE prise AVANT le premier appel · A `S0` n'a subi AUCUNE mutation observable.
Séparateur : une implémentation qui fait `session.monde.lieux_visites.push(cible)` en place échoue ici, alors qu'un test « état final correct » ne la distinguerait pas d'une implémentation immuable.

### Borne de persistance du journal — protocole de MESURE (jamais pass/fail, cadrage n°38)
1. Session synthétique avec `N` entrées (texte moyen ~80 caractères, `role` alterné), `N ∈ {10, 50, 100, 500}`.
2. `JSON.stringify(session)`, longueur en **octets UTF-8** (`Buffer.byteLength(json, 'utf8')`) — jamais `.length` d'une chaîne JS, qui compte des unités UTF-16.
3. Coût marginal (octets/entrée) par régression sur les 4 points.
4. Extrapolation pour une session longue plausible (~200 tours), confrontée EN COMMENTAIRE aux quotas usuels de `localStorage` (5–10 Mio, non garantis) — jamais un `expect(...).toBeLessThan(...)`.
5. Script JETABLE (scratchpad), jamais une assertion committée.
6. Les 4 mesures + coût marginal + extrapolation consignés dans la revue d'itération, en texte.

### KR à écrire noir sur blanc dans la revue (pas de test possible)
- **KR-243** — le moteur de commandes est hors du score de mutation ; `npm run test:mutation` ne doit PAS être lancé pour ce diff ; jest en couverture de lignes reste l'unique instrument.
- **KR-242** — si le critère replay est reporté, la revue l'écrit « vérifié par personne », jamais compté vert.

### REJETÉ (repris de la note — un rejet en annexe seule n'existe pas pour l'essaim, BUG-082)
- **REJETÉ** — garder le critère replay déterministe littéral comme critère pass/fail en it2 : aucun scénario séparateur avant n° 11.
- **REJETÉ** — livrer le port à 3 méthodes comme si les 3 avaient un appelant en it2 : `lire`/`effacer` n'ont aucun consommateur nommé.
- **REJETÉ** — tout critère de mouvement dont la fixture n'a qu'un seul accès ou cible la première entrée : ne sépare aucune implémentation fautive plausible.
- **REJETÉ** — un critère « la liste de commandes n'est pas en dur » testé avec un seul verbe sans mutant à deuxième verbe fictif : ne sépare rien.

### Ce que je n'ai pas pu vérifier moi-même (mode A)
Aucun code n'existe encore pour it2 — toutes les affirmations « rougit »/« vert » ci-dessus sont des PRÉDICTIONS sur du code à écrire, pas des mesures. En mode B, la QA devra rejouer les 3 mutants contre le code livré avant de les croire.
