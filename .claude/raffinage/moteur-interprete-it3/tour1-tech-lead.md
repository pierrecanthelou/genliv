NOTE DE TOUR 1 — TECH LEAD — `moteur-interprete` it3

RISQUE — Ranger la fenêtre dans la session sous la forme `memoire.fenetre: EntreeJournal[]` : c'est la seconde source de vérité la plus tentante du dépôt (une copie du journal, KR-013), et c'est la lecture qui vient naturellement de l'AC#8. Second risque, qui se calcule : `BUDGET_CARACTERES_NARRATEUR = 6000` a été mesuré sans état (M = 1918). Treize récits passés de 800 caractères le dépassent à eux seuls. On aurait alors un refus `trop-long` qui ne se lève plus (le narrateur meurt vers le pas 7), et `TAILLE_MAX_CORPS_IA` du worker bouge avec lui.

OBJECTION — (1) La « liste courte » de faits (plan de cible § 2.5) n'a aucune borne écrite. Sans pire cas, le budget ne peut pas se mesurer, et la doctrine du dépôt tombe. (2) Stocker `sur` sans que personne ne le relise, c'est KR-249/268 au niveau du stockage. Il faut un lecteur (une sélection par la scène), sinon on ne stocke que `fait`. (3) Chip et refus console : `memoire` ne touche ni `PlayerInputBar.tsx` ni `EcranPartie.tsx` (vérifié : l'assembleur la lit, le hook l'écrit, `UseTourDeJeuResult` ne change pas). Le motif « it3 rouvre ces fichiers de toute façon » est donc faux.

PROPOSITION — La fenêtre est calculée à partir de l'horloge (`borneDeFenetre(tour)`, de l'arithmétique pure). L'AC#8 tient donc par construction, même quand le résumé échoue. Forme : `memoire = {faits_etablis, resume?: {texte, jusqu_au_tour}}`. `jusqu_au_tour` dit jusqu'où le texte couvre réellement, ce que l'horloge ne sait pas. Le résumé sort du même appel R3. Sa clé n'est demandée que si le résumé est en retard sur la borne, jamais produite pour être ignorée (KR-268), et le schéma est fermé dans les deux sens. Un lot, deux si le PM garde Chip.

VERDICT — recevable sous réserve : une borne de faits chiffrée, un budget remesuré au pire cas, et `fenetre` qui n'est jamais un champ.

---

ANNEXE A — Forme proposée pour `memoire` (dans `src/brain/dossier/session.ts`)

```ts
export interface FaitEtabli {
  readonly fait: string             // audience 'ia' — phrase courte, validée
  readonly sur: readonly string[]   // 'moteur' — identifiants stables (≥ 1, distincts), résolus depuis les rangs, jamais un nom
}
export interface ResumeMemoire {
  readonly texte: string            // 'ia'
  readonly jusqu_au_tour: number    // 'moteur' — dernier pas que le texte couvre RÉELLEMENT (posé par le code, jamais par le modèle)
}
export interface MemoireSession {
  readonly faits_etablis: readonly FaitEtabli[]   // ≤ FAITS_RETENUS_MAX (valeur : narratif-ia)
  readonly resume?: ResumeMemoire                 // absent avant la 1re condensation réussie
}
// EtatSession : `memoire: null` → `memoire: MemoireSession | null`
// On élargit le type, on n'ajoute pas de champ : toute session déjà écrite (`memoire: null`) reste légale (KR-251).
```

Invariants (chacun testable seul) :
- I1 : `memoire === null || memoire.faits_etablis.length > 0 || memoire.resume !== undefined`. « Rien retenu » n'a qu'une seule représentation, `null`, jamais un objet vide.
- I2 : `resume.jusqu_au_tour % CADENCE === 0 && resume.jusqu_au_tour <= borneDeFenetre(horloge.tour)`.
- I3 : chaque fait a `sur.length >= 1`, sans doublon d'identifiant.
- I4 : aucune clé `fenetre`, `debut_fenetre` ni copie d'entrée de journal dans `memoire`.

Nouveau fichier `src/brain/dossier/memoire.ts`, pur. Il ne doit jamais écrire `CopiloteService`, `/ia/`, `fetch(` ni `.demander(`, même en commentaire, à cause du balayage KR-260.
```ts
export const FENETRE_MIN = 5
export const CADENCE = 10
export const FENETRE_MAX = FENETRE_MIN + CADENCE - 1          // 14, dérivé, jamais stocké
export function borneDeFenetre(tour: number): number          // CADENCE * max(0, floor((tour - FENETRE_MIN) / CADENCE))
export function pasACondenser(session: EtatSession): { readonly de: number; readonly a: number } | null
  // couvert = resume?.jusqu_au_tour ?? 0 ; couvert < borneDeFenetre(tour) ? { de: couvert + 1, a: couvert + CADENCE } : null
```
La fenêtre est `(borneDeFenetre(t), t]`. Vérifié à la main : t = 14 donne 14 pas, t = 15 donne 5 (les pas 1 à 10 sont absorbés), t = 24 donne 14, t = 25 donne 5. Le test sera exhaustif sur t de 0 à 60.

Un pas joué en console entre dans la fenêtre avec son libellé de geste et ses effets appliqués, sans récit. Sinon la fenêtre aurait un trou, ce que l'AC#8 interdit.

Scénario qui sépare les implémentations pour l'AC#8 (exigé, skill § « assertion de résultat ») : la condensation du pas 15 échoue, ou le pas 15 est joué en console. Au pas 16, la fenêtre doit valoir 11..16 et `pasACondenser` doit rendre `{1, 10}`.
- Une fenêtre calculée à partir de la couverture du résumé donnerait 1..16 : rouge.
- Une condensation déclenchée par la parité de l'horloge (`t % 10 === 5`) rendrait `null` au pas 16 : rouge.

Écriture : `consignerNarration(session, tour, apport: { recit; faits_etablis; resume? }): EtatSession` dans `recit.ts`. Elle applique la garde « un seul récit par pas, le premier gagne » de `consignerRecit` au récit ET à la rétention. Une seule écriture, une seule `onSessionChange`, puis `setIssueNarrateur` : l'ordre des effets ne change pas.

ANNEXE B — Contrat de sortie R3 (KR-231 vérifié)

- Réseau : `NarrationRendue { narration; tentatives; constats: {phrase; ancres: RangInjecte[]}[]; condense?: string }`.
- Résolu : `SortieNarrateur { recit; suggestions; faits_etablis: FaitEtabli[]; resume?: ResumeMemoire }`.
- Au niveau de la liste, `{narration, tentatives, constats, condense} ∩ {recit, suggestions, faits_etablis, resume} = ∅`. Au niveau de l'élément, `{phrase, ancres} ∩ {fait, sur} = ∅`.
- Aucune collision avec `EntreeJournal` `{tour, role, texte, origine, deltas, recit}`, avec `AttenteClarification`, ni avec les sept autres rôles.
- Les clés résolues `faits_etablis` et `resume` portent exprès le nom de leur destination dans `memoire`, comme `recit` le fait pour `EntreeJournal.recit`.
- Interdits comme clé réseau : `faits`, `etablis` (sous-chaîne de la clé résolue, même cas que `textes`/`liens`), `resume`, `memoire`, `recit`. Le nom final revient à narratif-ia, et c'est le test d'intersection de `schemaSortie.test.ts` qui tranche.

Ce qui change dans l'assembleur, le validateur et le service :
- La branche `ok` de `assemblerNarrateur` rend en plus `tables: ReadonlyMap<RangInjecte, string>` et `condensation: {de, a} | null`. Même passage de l'assembleur au validateur que `TablesInterprete`.
- Seules les entités dont la prose est injectée reçoivent un rang : lieu courant, objets (ce pas et possédés), indices (ce pas), jalons atteints. Les PNJ sont exclus (n° 12, KR-262 non élargi).
- `validerNarrateur(brut, dossier, attendu)` gagne le motif `'rang-inconnu'`, et `porteUnRang` sur la narration, les tentatives, chaque phrase et le condensé. Le commentaire « aucun porteUnRang » devient faux et se corrige dans le code, pas seulement dans le texte (KR-195/196).
- `ancres: []` donne `'schema'`. Un rang hors table refuse tout le lot (KR-230).
- Mutants d'AC#7, à vérifier ROUGES : accepter `ancres: []` ; accepter un rang absent de la table.
- `jusqu_au_tour` est posé par le service à partir de `condensation.a`, jamais par le modèle (précédent `CERTITUDE_INITIALE`).

Le témoin « sans état » de `contexte.test.ts` (l. 3210) est remplacé par son inverse, sur le même scénario de 40 pas :
- le fait du pas 3, ancré sur un lieu, est présent au pas 40 quand le héros y est revenu, et absent ailleurs ;
- le récit du pas 30 est présent ;
- le récit du pas 3 est absent ;
- « 40 » reste absent (aucun numéro d'horloge dans le contexte).

Budget : `BUDGET_CARACTERES_NARRATEUR` est remesuré au pire cas `FENETRE_MAX + CADENCE` pas, plus le résumé au maximum, plus `FAITS_RETENUS_MAX`. Le plancher se calcule avec les constantes livrées : M ≥ 1918 + 13 × 800, donc le budget est au moins 37 000, donc `TAILLE_MAX_CORPS_IA` monte au moins vers ~110 Kio contre 53 Kio aujourd'hui. C'est une mesure, pas un desserrage, mais le comité doit la voir. `max_tokens` du narrateur est aussi redérivé.

ANNEXE C — Alternatives rejetées (à recopier au § 8, sinon la condensation les perd)

- R1 — `memoire.fenetre: EntreeJournal[]` stockée. REJETÉ : c'est une copie du journal (KR-013), à resynchroniser à chaque pas, console comprise.
- R2 — Calculer la borne de fenêtre à partir de la couverture du résumé. REJETÉ : l'AC#8 dépendrait du succès d'un modèle. Un résumé raté, ou un pas d'absorption joué en console, pousse la fenêtre au-delà de 14.
- R3 — Stocker la borne (`debut_fenetre`). REJETÉ : elle se calcule à partir de l'horloge (KR-013).
- R4 — Produire le résumé à chaque pas et l'ignorer sauf au débordement. REJETÉ : KR-268 (des jetons pour rien, et un récit sain refusé en bloc à cause d'une donnée que personne ne lit).
- R5 — Un 9e rôle « condenseur », appelé à part sous condition. REJETÉ en première intention : c'est un rôle complet (assembleur, validateur, invite, gabarit, deux surcharges, parité worker), plus un 3e appel sous le verrou KR-265, plus un appel de plus dans le plafond d'it4, pour un appel qui part un pas sur dix. RECEVABLE en repli si narratif-ia met son veto aux deux voix dans une même sortie. Le découpage ne change pas : tout reste au lot 1.
- R6 — `sur` stocké sans lecteur. REJETÉ (KR-249/268) : soit l'assembleur le lit pour sélectionner par la scène, soit on ne stocke que `fait`.
- R7 — Faits sans borne. REJETÉ : sans pire cas, pas de budget, et le refus `trop-long` ne se lève plus.
- R8 — Deux fonctions exportées (`consignerRecit` + `retenir`) que le hook composerait. REJETÉ : leur ordre d'appel deviendrait un contrat implicite, et `retenir` seul ne saurait pas voir qu'il retient deux fois le même pas.
- R9 — `memoire?: MemoireSession` optionnelle. REJETÉ : la clé racine existe déjà à `null` dans toutes les sessions écrites. Seul l'élargissement `| null` reste rétrocompatible.

ANNEXE D — Découpage en lots (proposition de tour 1)

| Lot | Type | Fichiers (N = créé, R = remplacé) | Expose / consomme |
|---|---|---|---|
| 1 | contrat, seul, exécuté en premier | N `src/brain/dossier/memoire.ts`, `memoire.test.ts` · R `src/brain/dossier/session.ts`, `recit.ts`, `recit.test.ts`, `sessionDestinations.ts` (lignes feuilles de `memoire.*` ; `journal[].recit` passe à `'ia'`), `__fixtures__/session-saturee.ts`, `sessionCouverture.test.ts`, `session.test.ts` · R `src/brain/copilote/types.ts`, `schemaSortie.ts`, `schemaSortie.test.ts`, `contexte/narrateur.ts`, `contexte.test.ts` · R `src/brain/CopiloteService.ts`, `CopiloteService.test.ts`, `src/brain/index.ts` (exporte `consignerNarration` à la place de `consignerRecit`) · R `worker/index.ts`, `worker/index.test.ts` (« mémoire » y est un mot interdit, à amender consciemment), `worker/frontiere.test.ts` · R `src/features/play-mode/hooks/useTourDeJeu.ts` (une seule ligne : `consignerRecit(S1, tour, recit)` devient `consignerNarration(S1, tour, proposition)`), `useTourDeJeu.test.ts`, `src/features/play-mode/tests/verrouDeTour.test.tsx` (le mock `{recit, suggestions}` n'a pas `faits_etablis` et planterait à l'exécution) | Expose : les signatures des annexes A et B, et `UseTourDeJeuResult` INCHANGÉ. |
| 2 | feature, en option (seulement si le PM garde Chip/refus) | N `src/features/play-mode/components/Chip.tsx`, `Chip.test.tsx`, `src/features/play-mode/tests/refusConsole.test.tsx` · R `PlayerInputBar.tsx`, `PlayerInputBar.test.tsx`, `EcranPartie.tsx`. N'y touche jamais : `verrouDeTour.test.tsx` (lot 1). | Consomme `UseTourDeJeuResult` (figé) et `soumettre(texte)`, qui est interne à `PlayerInputBar`. Aucune dépendance à `brain/`. |

La couture de repli, si le lot 1 est jugé trop gros pour un seul agent : 1a = `brain/dossier/` seul (AC#8, zéro IA), puis 1b = `copilote/` + worker + le hook (AC#7). Ce seraient deux lots contrat qui passent l'un après l'autre, jamais en parallèle. Je ne la recommande pas en première intention (« un lot contrat par itération », décision déjà tranchée).

DÉCISIONS PRISES EN AUTONOMIE, FAUTE DE SPÉCIFICATION
- Fenêtre stockée ou calculée → calculée à partir de `horloge.tour` → si on la stocke : seconde source du journal, à resynchroniser à chaque pas, console comprise.
- Borne calculée à partir de l'horloge ou de la couverture du résumé → l'horloge → si c'est la couverture : l'AC#8 dépend du modèle, et la fenêtre dépasse 14 après un échec.
- Résumé dans le même appel ou dans un second rôle → même appel, avec une clé demandée seulement quand il faut condenser → si second rôle : un rôle complet de plus au lot 1 et un appel de plus sous le verrou. Le découpage reste le même.
- Un fait fautif refuse le fait seul ou toute la sortie → toute la sortie (KR-230) → sinon réparation silencieuse : un récit qui raconte une entité inventée survit, et seul son fait tombe.
- Mémoire vide : `null` ou objet vide → `null` seulement (I1) → sinon deux formes pour « rien retenu », et chaque lecteur doit les ramener à une seule.
- `journal[].recit` passe à `'ia'` → oui, parce que la fenêtre le lit désormais → si on le garde en `'moteur'`, la fenêtre n'injecte que des pas sans prose, et l'objectif « retrouver un fait » reste vide.
- Pas joués en console → dans la fenêtre, sans récit → sinon trou dans la fenêtre, contraire à l'AC#8.
- Le hook dans le lot contrat → oui, un seul appel à changer → si lot feature séparé : export de baril `consignerRecit` mort, ou deux fonctions dont l'ordre d'appel devient un contrat implicite.
- Entités qu'un fait peut ancrer → seulement celles dont la prose est injectée → si les PNJ en font partie : des données de personnage entrent dans R3, ce qui élargit KR-262 (interdit en n° 10).
- R1 sans mémoire → inchangé → sinon il faut rouvrir le contexte, le budget et l'invite de R1, ce qui sort de l'objectif.

Fichiers lus :
- `C:\Users\pierr\Desktop\genliv\src\features\moteur-interprete\specification.json`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\session.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\sessionDestinations.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\recit.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\types.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\schemaSortie.ts` (l. 964-1103)
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\contexte\narrateur.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\contexte.test.ts` (l. 3210)
- `C:\Users\pierr\Desktop\genliv\src\brain\CopiloteService.ts`
- `C:\Users\pierr\Desktop\genliv\worker\index.ts` (`GABARIT_SORTIE` l. 127, `INVITES.narrateur` l. 616, `TAILLE_MAX_CORPS_IA` l. 748)
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\hooks\useTourDeJeu.ts`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\tests\moteurSansIA.test.ts`
- `C:\Users\pierr\Desktop\genliv\docs\PLAN-BASCULE-IA.dc.html` (§ 2.5 et garde-fou « Faits établis »)
