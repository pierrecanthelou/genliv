NOTE DE TOUR 2 — TECH LEAD — `moteur-interprete` it3 (mémoire)

RÉPONSE AUX OBJECTIONS

**À narratif-ia, point 1 (KR-230 : le récit lié au résumé).** Oui, ma garde s'appliquait aussi au résumé, et ma note de tour 1 ne le disait pas : c'est une faute de ma part. Mon annexe B passait `porteUnRang` sur le condensé et, en cas d'échec, refusait toute la réponse.

J'ai cherché une garde plus fine qui tienne dans un seul appel. Aucune n'est légale :
- Valider `condense` à part et ne jeter que lui revient à garder la moitié d'une réponse dont l'autre moitié a déraillé. KR-230 l'interdit en toutes lettres : « jamais de réparation partielle ».
- C'est exactement l'argument qui m'a fait refuser, au tour 1, de jeter un fait fautif tout en gardant le récit. Appliquer deux règles à deux clés d'une même réponse donnerait au prochain relecteur un précédent pour jeter aussi les faits.

Dans un seul appel, il n'y a donc que deux options : le couplage (le récit meurt pour un défaut de mémoire) ou la réparation (interdite). Le seul découplage conforme passe par deux réponses, donc deux appels.

**Point 2 (KR-268 : champ mort) — pas clos.** Je l'ai constaté en relisant le worker. Ma clé conditionnelle ne tient que côté client. Côté worker :
- `INVITES[role]` ne porte que `{systeme, max_tokens}`, et les deux sont statiques ;
- le gabarit est incrusté dans l'invite avec la consigne « aucune autre clé » (`worker/index.ts` l. 621) ;
- le rôle est lu dans le chemin de l'URL (l. 808-809).

« Ne demander la clé que quand c'est dû » ne peut alors prendre que deux formes :
- (a) `condense` figure au gabarit à chaque pas, avec la consigne de l'omettre. Le champ est au schéma dix pas sur dix. Et comme mon schéma est fermé dans les deux sens, une clé émise alors qu'elle n'était pas due fait refuser tout le récit. C'est la seconde moitié de KR-268, mot pour mot.
- (b) une seconde entrée `INVITES`. C'est un 9ᵉ rôle côté worker : on paie le coût du chroniqueur sans obtenir le découplage.

**Point 3 (fenêtre à 15) — je ne peux pas confirmer qu'il visait une version antérieure.** La dérivation de la fenêtre depuis l'horloge a bien convergé. Mais le « 15 » porte sur ce que R3 lit.
- Pour condenser, R3 doit recevoir la tranche en prose brute. Au pas 15, il lit donc les pas 1 à 14, et jusqu'à 23 pas passés si la condensation a pris du retard. Mon annexe B l'admettait déjà (« pire cas `FENETRE_MAX + CADENCE` »).
- Le problème est propre au même appel. Un témoin le sépare : « au pas 15, le récit du pas 1 est absent du contexte de R3 ».
- Coût : `CADENCE × NARRATION_CARACTERES_MAX` = 8 000 caractères de plus au budget R3, soit environ 24 Kio de plafond HTTP (~82 Kio contre ~60).

**Je bascule vers le chroniqueur.**

**Au PM.** Tu demandais de couper l'itération si l'appel unique se révélait infaisable. Il n'est pas infaisable : il est faisable, et faux. Le coût que tu redoutais est plus bas que prévu :
- `moteurSansIA` : rien à changer. `FICHIERS_EXCLUS_PLAY_MODE` ne nomme que `useTourDeJeu.ts`, qui reste le seul appelant.
- Rejeu : rien à écrire, `jusquAuRejeuUnique<S>` est générique.
- Dégradation : une branche silencieuse dans le hook, sans rien à l'écran.
- Fichiers : un créé, un remplacé. Le nombre de lots ne change pas.

Rien, côté dimensionnement, ne justifie de couper l'itération. Reporter le résumé contredirait en plus le goal (« gelée SEULEMENT maintenant ») et la dernière clause d'AC#8. La décision produit reste la tienne.

**À QA.** Ton séparateur 2 (« 15 pas → fenêtre de 14, pas 2 à 15 ») contredit la formule : au pas 15, la fenêtre couvre 11-15. Sinon, les pas 2 à 10 seraient à la fois résumés et dans la fenêtre.
- `fenetre.length` et `resumes.length` supposent une fenêtre stockée et une liste de résumés. Ni l'une ni l'autre n'existe : I4 exclut la première, et il n'y a qu'un résumé, recondensé à chaque cadence. On teste avec `debutDeFenetre` et le contexte assemblé.
- Je reprends ton cas « 4 pas → fenêtre de 4 » et ton mutant « indice de journal au lieu du pas ».
- Je refuse `validerMemoire` : les faits viennent de la réponse de R3, et un second validateur sur la même réponse serait une validation partielle (KR-230).

**À UX.** Chip sort d'it3, le lot 2 disparaît.

STATUT DE MES OBJECTIONS (tour 1)
- Résumé dans le même appel R3 → RETIRÉE (voir plus haut).
- (1) Faits sans borne → RETIRÉE. L'injection est bornée (8 × 160 caractères) et le budget se calcule sur l'injection, pas sur le stockage. Le stockage croît moins vite que le journal.
- (2) `sur` sans lecteur → RETIRÉE. `faitsPertinents` lit les ancres. J'adopte la restriction de narratif-ia aux lieux et objets, et je retire mes rangs sur indices et jalons (KR-268 appliqué au type d'ancre).
- (3) Chip et refus console hors it3 → MAINTENUE, et le PM comme l'UX l'ont actée.
- Risque « `fenetre` n'est jamais un champ » → MAINTENU, convergé (I4).
- Budget → CORRIGÉ. Mon « ≥ 37 000 / ~110 Kio » multipliait par 3 des termes que les validateurs bornent déjà exactement : j'inventais une marge sur une borne. J'adopte la `BORNE_MEMOIRE` exacte de narratif-ia. La mesure reste à faire par le lot.
- Doublons exacts (décision de narratif-ia) → ce n'est pas une réparation. La réponse du modèle est acceptée entière, le code refuse seulement d'ajouter à l'état ce qui y est déjà, comme pour « le premier récit gagne ». Accepté.

VERDICT — **recevable sous réserve**. Trois réserves :
- (a) le témoin de chaînage de S2 (annexe C, T3) ;
- (b) le témoin « le pas 1 est absent de R3 au pas 15 » (T5) ;
- (c) des plafonds re-mesurés par le lot, jamais recopiés des estimations du comité.

Aucun veto.

---

ANNEXE A — Signatures finales : celles de narratif-ia, à un écart près

Nommage : je reprends partout celui de narratif-ia.
- `constat`/`ancres` pour les champs stockés, `phrase`/`sur` pour le réseau. La raison est technique : `fait` et `sur` figurent déjà dans l'invite du narrateur (« fait foi », l. 624 ; « sur lui », l. 619). Le balayage `systeme.includes(mot)` de `worker/index.test.ts` ne pourra donc jamais les surveiller comme noms de champ stockés, alors qu'il peut surveiller `constat` et `ancres`. Une clé réseau, elle, est faite pour apparaître dans l'invite.
- `absorbe_jusqua` plutôt que `jusqu_au_tour` : on dit « pas », jamais « tour » (REGLES-PLAY § J1, mot réservé dans l'invite du narrateur).
- `etablis` pour la clé résolue, nom déjà retenu en it2 (spec l. 186).
- `retenus` n'existe dans le dépôt que comme variable locale (un `Set` de chemins) dans six assembleurs côté auteur, jamais comme clé de forme. KR-231 n'est pas concerné.

`src/brain/dossier/session.ts`
```ts
readonly memoire: MemoireDeSession | null   // on élargit le type, on n'ajoute pas de champ (KR-251)
export interface MemoireDeSession { readonly faits_etablis: readonly FaitEtabli[]; readonly resume?: ResumeDeSession }
export interface FaitEtabli { readonly constat: string; readonly ancres: readonly string[] }   // 'ia' / 'moteur' ; 1..2 ancres, lieu.* | objet.*
export interface ResumeDeSession { readonly texte: string; readonly absorbe_jusqua: number }  // 'ia' / 'moteur'
```

`src/brain/dossier/memoire.ts` : fichier pur, et il ne contient aucune des chaînes balayées par KR-260, même en commentaire.
```ts
export const FENETRE_MIN = 5
export const CADENCE = 10
export const FENETRE_MAX = FENETRE_MIN + CADENCE - 1
export const FAITS_INJECTES_MAX = 8
export function debutDeFenetre(pas: number): number
export function absorptionDue(session: EtatSession): { readonly apres: number; readonly jusqua: number } | null
export function faitsPertinents(session: EtatSession): readonly FaitEtabli[]
export function absorber(session: EtatSession, resume: string): EtatSession        // ÉCART : 2 paramètres
export function consignerNarration(session: EtatSession, pas: number, recit: string, etablis: readonly FaitEtabli[]): EtatSession
```

L'écart porte sur `absorber`. Narratif-ia passait `jusqua` en paramètre, avec une garde d'identité « si `jusqua ≠ absorptionDue(session)?.jusqua` ». Un paramètre dont la seule valeur légale se déduit d'un autre paramètre, c'est KR-013 au niveau de la signature.
- `absorber` calcule donc `absorptionDue(session)` lui-même, et rend la même référence si le résultat est `null`.
- Sur `memoire: null`, il produit `{faits_etablis: [], resume}`, ce qui respecte I1.
- `consignerNarration` appelé avec `etablis = []` sur `memoire: null` laisse `null`.

`consignerNarration` remplace `consignerRecit` dans `src/brain/index.ts`. J'ai grepé les appelants : `useTourDeJeu.ts`, `recit.ts`, `recit.test.ts`, `contexte.test.ts`, `CopiloteService.ts`, `CopiloteService.test.ts`, `types.ts`, `session.ts` et `index.ts`, plus la spec, qui n'est pas du code. Tous ces fichiers de code sont au lot 1.

`src/brain/copilote/types.ts`
```ts
export interface CibleChroniqueur { readonly role: 'chroniqueur'; readonly session: EtatSession }
// Pas de saisie : la saisie du pas courant ne fait pas partie de la tranche à condenser.
// réseau                                           // résolu
ChroniqueRendue { chronique: string }               SortieChroniqueur { resume: string }
NarrationRendue { narration; tentatives; retenus: { phrase; sur: RangInjecte[] }[] }
SortieNarrateur { recit; suggestions; etablis: readonly FaitEtabli[] }
export type ReponseChroniqueur   // même union que ReponseNarrateur, avec proposition: SortieChroniqueur
```
KR-231 : `{chronique} ∩ {resume} = ∅`, `{narration, tentatives, retenus} ∩ {recit, suggestions, etablis} = ∅` et `{phrase, sur} ∩ {constat, ancres} = ∅`. Le test d'intersection de `schemaSortie.test.ts` tranche.

`src/brain/CopiloteService.ts` :
- une surcharge `demander(dossier, cible: CibleChroniqueur, signal?): Promise<ReponseChroniqueur>`, dans l'interface et dans l'implémentation ;
- `CorpsDemande | { role: 'chroniqueur'; contexte: string }`, écrit en littéral, jamais par `...cible` ;
- `case 'chroniqueur'` ;
- la garde `never` ne change pas ;
- le rôle reste hors de `RoleCopilote`, comme `interprete` et `narrateur`, donc aucune entrée dans un `Record<RoleCopilote, …>`.

`src/brain/copilote/contexte/chroniqueur.ts` (N) : `assemblerChroniqueur(dossier, session): { ok: true; texte } | ({ ok: false } & MotifRefusContexte)`.
- Par défense, refus `aucun-candidat` avant tout `fetch` si `absorptionDue(session) === null`. Ce motif existe déjà (« rien à demander »), on n'en crée pas de nouveau.
- `trop-long` au-delà de `BUDGET_CARACTERES_CHRONIQUEUR`.
- `CHAMPS_INJECTES_CHRONIQUEUR` alimente la garde KR-232.

`schemaSortie.ts` :
- `validerChroniqueur(brut)` applique les prédicats du § E de narratif-ia.
- `validerNarrateur(brut, dossier, ancres)` applique ses prédicats 14 à 22 (§ C), avec le motif `rang-inconnu`.
- Le paramètre `attendu` de mon tour 1 disparaît avec la condensation. La branche `ok` d'`assemblerNarrateur` ne rend plus `condensation`, seulement `ancres: ReadonlyMap<RangInjecte, string>`.

`worker/index.ts` :
- `GABARIT_SORTIE.chroniqueur = '{"chronique": "…"}'` ;
- `INVITES.chroniqueur`, avec `max_tokens` dérivé de `RESUME_CARACTERES_MAX` au pire ratio ;
- `GABARIT_SORTIE.narrateur` gagne `retenus`, avec un exemple `"A2"` ;
- `TAILLE_MAX_CORPS_IA` est re-dérivé sur les rôles qui ont un budget. Le narrateur devrait en devenir le porteur, autour de 60 Kio. C'est une mesure, pas un relâchement.

ANNEXE B — Ordre des effets dans `useTourDeJeu.executeAction`, sous le même verrou KR-265

1. `onSessionChange(S1)`, puis `setAvis`. Inchangé.
2. Si le pas est accepté et que `absorptionDue(S1) ≠ null`, on appelle `demander(chroniqueur, S1)`.
   - En cas de succès : `S2 = absorber(S1, resume)`, puis `onSessionChange(S2)`.
   - En cas d'échec : `S2 = S1`, sans aucun `setState` et sans bannière.
3. On appelle `demander(narrateur, S2)`.
   - En cas de succès : `S3 = consignerNarration(S2, S2.horloge.tour, recit, etablis)`, puis `onSessionChange(S3)`, puis `setIssueNarrateur(raconte)`.
   - En cas d'échec : `setIssueNarrateur(degrade)`. S2 reste persisté.

Le résumé est persisté dès que le chroniqueur réussit, pour qu'un R3 dégradé ne le fasse pas perdre.

ANNEXE C — Témoins séparateurs (tous au lot 1)

- **T1** `debutDeFenetre` : 3→0, 4→0 (fenêtre de 4, cas repris de QA), 14→0, 15→10, 24→10, 25→20. Mutants qui doivent être rouges :
  - `FENETRE_MAX` écrit en dur ;
  - `Math.max` retiré ;
  - `<` à la place de `<=` ;
  - `Math.max(length, 5)`.
- **T2** (AC#8) : le chroniqueur échoue au pas 15, ou le pas 15 est joué en console. Au pas 16, la fenêtre vaut 11..16 et `absorptionDue` rend `{0, 10}`. Mutants qui doivent être rouges :
  - fenêtre calculée à partir de la couverture du résumé ;
  - déclenchement sur `t % 10 === 5` ;
  - indice de journal au lieu du pas (repris de QA : un pas qui porte deux entrées).
- **T3** (chaînage) : chroniqueur et R3 réussissent, donc la session finale porte `resume` ET `recit`. Mutant rouge : `consignerNarration(S1, …)`, qui écraserait le résumé sans bruit.
- **T4** : le chroniqueur rend une réponse illisible et R3 une réponse valide. Le récit s'affiche, `absorbe_jusqua` ne bouge pas, aucune bannière. Au pas suivant, le chroniqueur est rappelé.
- **T5** : au pas 15, le contexte de R3 ne contient pas le récit du pas 1, que le chroniqueur ait réussi ou échoué. Le contexte du chroniqueur contient les pas 1 à 10, et pas le 11.
- **T6** : quand aucune absorption n'est due, `demander` est appelé exactement deux fois (R1, R3). Mutant rouge : chroniqueur appelé à chaque pas (KR-268 au niveau de l'appel).
- **T7** : les mutants d'AC#7 du tableau de narratif-ia (`sur: []`, rang absent de la table, « A1 » dans la narration).

ANNEXE D — Lots révisés

| Lot | Type | Fichiers (N = créé, R = remplacé) | Expose / consomme |
|---|---|---|---|
| 1 | contrat, seul ; exécution séquentielle, sans worktree ni fusion | N `src/brain/dossier/memoire.ts`, `src/brain/dossier/memoire.test.ts`, `src/brain/copilote/contexte/chroniqueur.ts` · R `src/brain/dossier/session.ts`, `session.test.ts`, `recit.ts`, `recit.test.ts`, `sessionDestinations.ts`, `sessionCouverture.test.ts`, `__fixtures__/session-saturee.ts` · R `src/brain/copilote/types.ts`, `schemaSortie.ts`, `schemaSortie.test.ts`, `contexte/narrateur.ts`, `contexte/index.ts`, `contexte.test.ts` · R `src/brain/CopiloteService.ts`, `CopiloteService.test.ts`, `src/brain/index.ts` · R `worker/index.ts`, `worker/index.test.ts`, `worker/frontiere.test.ts` · R `src/features/play-mode/hooks/useTourDeJeu.ts`, `useTourDeJeu.test.ts`, `src/features/play-mode/tests/verrouDeTour.test.tsx` | Expose : annexe A. `UseTourDeJeuResult` reste INCHANGÉ. `moteurSansIA.test.ts` n'est PAS touché. |

Par rapport au tour 1 :
- un fichier créé en plus (`chroniqueur.ts`) et un remplacé en plus (`contexte/index.ts`) ;
- le lot 2 (Chip) est supprimé ;
- la couture de repli 1a/1b est retirée. Le chroniqueur ne la rend pas plus nécessaire, et deux lots contrat dans la même itération rouvriraient une décision déjà actée.

KR-266 est respecté : le rôle entre dans le lot contrat de la première itération qui l'appelle. Il reste un seul lot contrat.

ANNEXE E — Alternatives rejetées, à recopier au § 8

- **Résumé dans R3 (`condense?`).** REJETÉ pour trois raisons :
  - le récit est lié au résumé (KR-230), et aucune garde plus fine n'est légale dans un seul appel ;
  - une clé conditionnelle ne peut pas s'exprimer dans une entrée `INVITES` statique : KR-268 est déplacé, pas résolu ;
  - R3 lirait 15 à 24 pas bruts, soit 8 000 caractères de plus.
- **Valider `condense` à part et ne jeter que lui.** REJETÉ : c'est une réparation partielle (KR-230), et un précédent pour jeter aussi les faits.
- **`absorber(session, resume, jusqua)`.** REJETÉ : `jusqua` se déduit de la session (KR-013).
- **`validerMemoire` séparé.** REJETÉ : ce serait un second validateur pour la même réponse.
- **Chroniqueur dans `RoleCopilote`.** REJETÉ : il faudrait des entrées dans des registres auteur pour un rôle qui n'a aucun champ auteur.

KR candidats :
- les deux de narratif-ia : toute sortie réinjectée est repliée sur une ligne sous un en-tête ; une ancre n'est admise que pour un type d'entité qui a un chemin de réinjection ;
- un troisième : « un artefact que le joueur ne voit pas ne partage jamais la réponse d'un artefact qu'il voit, parce que sous KR-230 on ne peut pas refuser l'un sans l'autre ».

Frontière avec it4 : un pas de bascule enchaîne désormais trois appels, six avec les rejeux. L'ordre de dégradation d'it4 et la constante unique de KR-261 devront nommer le chroniqueur et `BUDGET_CARACTERES_CHRONIQUEUR`.

DÉCISIONS PRISES EN AUTONOMIE FAUTE DE SPÉCIFICATION

- Garde plus fine dans le même appel → aucune n'est légale, je bascule vers le chroniqueur → dans l'autre sens : réparation partielle, et un précédent pour jeter les faits.
- `jusqua` passé en paramètre à `absorber` → calculé par la fonction elle-même → dans l'autre sens : une valeur venue d'une autre session donne un no-op silencieux.
- Moment où le résumé est persisté → dès que le chroniqueur réussit → si on attend R3 : il faut aussi l'écrire dans la branche dégradée, sinon il se perd.
- Chroniqueur appelé alors que rien n'est à absorber → refus `aucun-candidat` avant `fetch` → avec un motif neuf : une variante d'union de plus pour un cas que le hook ne produit jamais.
- Place du rôle dans l'union → hors de `RoleCopilote` → dedans : des entrées de registres auteur sans objet.
- Cible du chroniqueur → sans la saisie → avec : la saisie du pas courant entrerait dans une tranche qui ne la contient pas.
- Noms des champs stockés → `constat`/`ancres` → avec `fait`/`sur` : des noms de champ que le balayage des invites ne peut pas surveiller.
- Couture 1a/1b → retirée → si on la garde : deux lots contrat dans une itération, et une décision actée rouverte.

Fichiers lus (lecture seule, aucun fichier modifié) :
- C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-tech-lead.md
- C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-narratif-ia.md
- C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-pm-produit.md
- C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-ux-designer.md
- C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-qa.md
- C:\Users\pierr\Desktop\genliv\code-knowledge.json (KR-230, 231, 236, 249, 260, 261, 265, 266, 268, 270)
- C:\Users\pierr\Desktop\genliv\src\features\moteur-interprete\specification.json (AC#8 l. 24, décisions l. 169 et 186)
- C:\Users\pierr\Desktop\genliv\worker\index.ts (l. 127-136, 600-849)
- C:\Users\pierr\Desktop\genliv\src\brain\CopiloteService.ts (l. 285-414, surcharges et garde `never`)
- C:\Users\pierr\Desktop\genliv\src\brain\copilote\contexte\index.ts
- C:\Users\pierr\Desktop\genliv\src\brain\copilote\contexte\noyau.ts (l. 27-49)
- C:\Users\pierr\Desktop\genliv\src\features\play-mode\hooks\useTourDeJeu.ts (l. 84-183)
- C:\Users\pierr\Desktop\genliv\src\features\play-mode\tests\moteurSansIA.test.ts (l. 101-134)
- C:\Users\pierr\Desktop\genliv\worker\index.test.ts (balayages `systeme.includes`)
